// The parked-vehicle ledger (online/parkSync.ts) between two fake clients: records go from one adapter's collect() to
// the other's receive(), as the hub would carry them.
import { describe, expect, it } from 'vitest';
import type { Vehicle, VehicleKind } from '../types';
import type { MirrorEnt, OwnedEnt, SyncFrame, SyncLink } from './hub';
import {
  createParkSync, decodePark, DYNAMIC_BASE, dynamicVid, encodePark, PARK_STATE, shareVehicle, stableVid, type ParkSync,
} from './parkSync';

function car(kind: VehicleKind, x: number, z: number): Vehicle {
  return {
    kind, x, y: 0, z, yaw: 0, hp: 1, tint: 0xff0000, driver: 'none', home: { x, z, yaw: 0 }, spec: { boat: false },
    speed: 0,
  } as unknown as Vehicle;
}

interface Client {
  id: number;
  sync: ParkSync;
  vehicles: Vehicle[];
  drive: { v: Vehicle | null };
  created: Vehicle[];
  frame(peers: { id: number; x: number; z: number }[], me?: { x: number; z: number }): SyncFrame;
}

function client(id: number, stable: Vehicle[]): Client {
  const vehicles = [...stable];
  const drive = { v: null as Vehicle | null };
  const created: Vehicle[] = [];
  const link: SyncLink = { command() {}, pay() {}, online: () => true, myId: () => id };
  const sync = createParkSync(link, {
    vehicles, stable, driving: () => drive.v,
    create(kind, x, z, yaw, tint) { const v = car(kind, x, z); v.yaw = yaw; v.tint = tint; created.push(v); return v; },
    place(v, x, y, z, yaw) { v.x = x; v.y = y; v.z = z; v.yaw = yaw; },
    setHp(v, hp) { v.hp = hp; },
    wreck(v) { v.exploded = true; v.hp = 0; },
    show() {},
    describe: () => '|',
    restyle() {},
  });
  return {
    id, sync, vehicles, drive, created,
    frame: (peers, me = { x: 0, z: 0 }) => ({
      now: 0, myId: id, hostId: 1, isHost: id === 1, lead: true, me: { id, ...me }, peers, ownerOf: () => null,
    }),
  };
}

/** Everything `from` publishes, as mirror entities for `to` (all "added" the first time; the adapter does not care). */
function carry(from: Client, f: SyncFrame): MirrorEnt[] {
  const out: OwnedEnt[] = [];
  from.sync.collect(out, f);
  return out.map((o) => ({ owner: from.id, id: o.id, rec: o.rec, str: o.str, seenAt: 0, sentAt: 0 }));
}

function tick(c: Client, f: SyncFrame): void {
  c.sync.update(1, f);
}

describe('park codec', () => {
  it('round-trips and rejects garbage', () => {
    const w = { vid: 12, gen: 3, state: PARK_STATE.wreck, kind: 'golf-cart' as VehicleKind, x: 10.5, y: 1.2, z: -880, yaw: 1, hp: 0.4, tint: 0xabcdef };
    const back = decodePark(encodePark(w))!;
    expect(back.kind).toBe('golf-cart');
    expect(back.state).toBe(PARK_STATE.wreck);
    expect(back.x).toBeCloseTo(10.5);
    expect(back.z).toBeCloseTo(-880);
    expect(back.hp).toBeCloseTo(0.4);
    expect(back.tint).toBe(0xabcdef);
    const rec = encodePark(w);
    expect(decodePark([...rec.slice(0, 3), 999, ...rec.slice(4)])).toBeNull(); // unknown kind (a newer client's)
    expect(decodePark([...rec.slice(0, 4), 99999, ...rec.slice(5)])).toBeNull(); // off the map
    expect(decodePark(rec.slice(0, 9))).toBeNull();
  });
  it('stable ids are the same everywhere and below the dynamic range', () => {
    expect(stableVid('ride-on', 12.34, -56.7)).toBe(stableVid('ride-on', 12.34, -56.7));
    expect(stableVid('ride-on', 12.34, -56.7)).not.toBe(stableVid('golf-cart', 12.34, -56.7));
    expect(stableVid('ride-on', 900, 900)).toBeLessThan(DYNAMIC_BASE);
    expect(dynamicVid(16383, 65535)).toBeLessThanOrEqual(0x7fffffff);
    expect(dynamicVid(5, 1)).toBeGreaterThanOrEqual(DYNAMIC_BASE);
  });
});

describe('park sync between two clients', () => {
  it('a vehicle driven off is hidden for the other, then put where it was left', () => {
    const A = client(1, [car('ride-on', 10, 10)]);
    const B = client(2, [car('ride-on', 10, 10)]);
    const fa = A.frame([{ id: 2, x: 0, z: 0 }]);
    const fb = B.frame([{ id: 1, x: 10, z: 10 }]);
    // Untouched: nothing on the wire.
    tick(A, fa);
    expect(carry(A, fa)).toEqual([]);
    // A gets in.
    const va = A.vehicles[0];
    va.driver = 'player';
    A.drive.v = va;
    tick(A, fa);
    let ents = carry(A, fa);
    expect(ents).toHaveLength(1);
    B.sync.receive({ added: ents, changed: [], removed: [] }, fb);
    const vb = B.sync.entryOf(ents[0].id)!.v!;
    expect(B.vehicles.includes(vb)).toBe(false);
    expect(B.sync.entryOf(ents[0].id)!.state).toBe(PARK_STATE.driven);
    // A drives 30 m and gets out.
    va.x += 30;
    va.driver = 'none';
    A.drive.v = null;
    tick(A, fa);
    ents = carry(A, fa);
    B.sync.receive({ added: [], changed: ents, removed: [] }, B.frame([{ id: 1, x: 42, z: 10 }]));
    expect(B.vehicles.includes(vb)).toBe(true);
    expect(vb.x).toBeCloseTo(40, 0);
    expect(B.sync.entryOf(vb)!.owner).toBe(1);
    // B's copy now matches: B's own scan claims nothing.
    tick(B, fb);
    expect(carry(B, fb)).toEqual([]);
  });

  it('a pushed or damaged parked vehicle is claimed by whoever touched it; an older generation loses', () => {
    const A = client(1, [car('zero-turn', 0, 0)]);
    const B = client(2, [car('zero-turn', 0, 0)]);
    const fa = A.frame([{ id: 2, x: 0, z: 0 }]);
    const fb = B.frame([{ id: 1, x: 0, z: 0 }]);
    A.vehicles[0].hp = 0.5;
    tick(A, fa);
    const first = carry(A, fa);
    B.sync.receive({ added: first, changed: [], removed: [] }, fb);
    expect(B.vehicles[0].hp).toBeCloseTo(0.5);
    // B pushes it 5 m: B owns it now (generation 2).
    B.vehicles[0].x = 5;
    tick(B, fb);
    const second = carry(B, fb);
    expect(decodePark(second[0].rec)!.gen).toBe(2);
    A.sync.receive({ added: second, changed: [], removed: [] }, fa);
    expect(A.vehicles[0].x).toBeCloseTo(5);
    // A's stale generation-1 record arriving late changes nothing on B.
    B.sync.receive({ added: [], changed: first, removed: [] }, fb);
    expect(B.vehicles[0].x).toBeCloseTo(5);
    expect(B.sync.entryOf(B.vehicles[0])!.owner).toBe(2);
  });

  it('a record that drops a vehicle far from its owner is ignored', () => {
    const A = client(1, [car('ride-on', 0, 0)]);
    const B = client(2, [car('ride-on', 0, 0)]);
    const rec = encodePark({ vid: stableVid('ride-on', 0, 0), gen: 5, state: PARK_STATE.parked, kind: 'ride-on', x: 400, y: 0, z: 0, yaw: 0, hp: 1, tint: 0 });
    B.sync.receive({ added: [{ owner: 1, id: rec[0], rec, str: '|', seenAt: 0, sentAt: 0 }], changed: [], removed: [] }, B.frame([{ id: 1, x: 0, z: 0 }]));
    expect(B.vehicles[0].x).toBe(0);
    void A;
  });

  it('a vehicle brought in by one player (Sling-Lift, trainer) appears for the other', () => {
    const A = client(1, []);
    const B = client(2, []);
    const fa = A.frame([{ id: 2, x: 0, z: 0 }]);
    const v = car('golf-cart', 3, 4);
    A.vehicles.push(v);
    shareVehicle(v);
    tick(A, fa);
    const ents = carry(A, fa);
    expect(ents).toHaveLength(1);
    expect(ents[0].id).toBeGreaterThanOrEqual(DYNAMIC_BASE);
    B.sync.receive({ added: ents, changed: [], removed: [] }, B.frame([{ id: 1, x: 0, z: 0 }]));
    expect(B.created).toHaveLength(1);
    expect(B.vehicles[0].kind).toBe('golf-cart');
    expect(B.vehicles[0].x).toBeCloseTo(3);
  });

  it('when the owner leaves, the adopter publishes with a newer generation, and a driverless drive is parked', () => {
    const A = client(1, [car('ride-on', 0, 0)]);
    const B = client(2, [car('ride-on', 0, 0)]);
    const fa = A.frame([{ id: 2, x: 0, z: 0 }]);
    A.vehicles[0].driver = 'player';
    A.drive.v = A.vehicles[0];
    tick(A, fa);
    const ents = carry(A, fa);
    B.sync.receive({ added: ents, changed: [], removed: [] }, B.frame([{ id: 1, x: 0, z: 0 }]));
    expect(B.vehicles).toHaveLength(0);
    B.sync.ownerGone(1, ents, () => true);
    const e = B.sync.entryOf(ents[0].id)!;
    expect(e.owner).toBe(2);
    expect(e.state).toBe(PARK_STATE.parked);
    expect(B.vehicles).toHaveLength(1);
    const fb = B.frame([]);
    const out = carry(B, fb);
    expect(decodePark(out[0].rec)!.gen).toBe(2);
  });

  it('a vehicle stored next to me is gone for everyone; one culled far away is not', () => {
    const A = client(1, [car('ride-on', 0, 0), car('ride-on', 500, 0)]);
    const fa = A.frame([{ id: 2, x: 0, z: 0 }], { x: 1, z: 1 });
    A.vehicles.length = 0; // both leave my list: one beside me (stored), one far (traffic tidied it)
    tick(A, fa);
    const out = carry(A, fa).map((o) => decodePark(o.rec)!);
    expect(out).toHaveLength(1);
    expect(out[0].state).toBe(PARK_STATE.gone);
    expect(out[0].x).toBeCloseTo(0);
  });

  it('going offline leaves vehicles others were driving parked where last seen', () => {
    const A = client(1, [car('ride-on', 0, 0)]);
    const B = client(2, [car('ride-on', 0, 0)]);
    A.vehicles[0].driver = 'player';
    A.drive.v = A.vehicles[0];
    const fa = A.frame([{ id: 2, x: 0, z: 0 }]);
    tick(A, fa);
    B.sync.receive({ added: carry(A, fa), changed: [], removed: [] }, B.frame([{ id: 1, x: 0, z: 0 }]));
    expect(B.vehicles).toHaveLength(0);
    B.sync.reset();
    expect(B.vehicles).toHaveLength(1);
  });
});

describe('park sync: a copy built late', () => {
  it('a vehicle I first had no copy of is built when I come near, and my damage to it goes out', () => {
    const A = client(1, []);
    const B = client(2, [car('ride-on', 0, 0)]);
    const fb = B.frame([{ id: 1, x: 200, z: 0 }]);
    B.vehicles[0].x = 30; // B pushed it
    tick(B, fb);
    const ents = carry(B, fb);
    // A is 200 m off: no copy yet.
    A.sync.receive({ added: ents, changed: [], removed: [] }, A.frame([{ id: 2, x: 30, z: 0 }], { x: 200, z: 0 }));
    expect(A.created).toHaveLength(0);
    // A walks up: the scan builds it.
    const near = A.frame([{ id: 2, x: 30, z: 0 }], { x: 34, z: 0 });
    tick(A, near);
    expect(A.created).toHaveLength(1);
    A.created[0].hp = 0.4;
    tick(A, near);
    const out = carry(A, near);
    expect(out).toHaveLength(1);
    B.sync.receive({ added: [], changed: out, removed: [] }, B.frame([{ id: 1, x: 34, z: 0 }]));
    expect(B.vehicles[0].hp).toBeCloseTo(0.4);
  });
});

// Stationary vehicles online (SYS.park, docs/roadmaps/gta-multiplayer-audit.md). Before this, every client had its own
// parked vehicles: a mower one player drove off stayed parked on everyone else's screen (a duplicate next to the
// remote driver), and a vehicle left behind, delivered by the Sling-Lift or spawned by the trainer existed only for
// the player who had it.
//
// The model is a small ledger of vehicles, one entry per vehicle id (vid):
//  - Stable vehicles are the ones every client builds the same way at start-up (parked spots, the airfield planes, the
//    Whirligig, the craft at the airfield, moored boats). Their vid is a hash of kind and home spot, so it is the same
//    on every client without any message. Untouched, they cost nothing on the wire.
//  - Dynamic vehicles are the ones one player brought into the world: a car they drove and left (a stolen NPC car, a
//    quest ride), a Sling-Lift delivery, a Lock-Up take-out, a trainer spawn. Their vid is minted by that player.
//  - Whoever last touched a vehicle (drove it, pushed it, shot it, wrecked it, stored it) OWNS its entry and publishes
//    one record: state (parked / driven / wreck / gone), kind, place, hp, paint, plus variant and Glaze look. Touches
//    carry a generation number: the higher one wins (a tie goes to the lower player id), so two clients settle on the
//    same owner without a round trip.
//  - Mirrors: a vehicle someone else drives is taken out of my world (their pose already draws it); a parked one is put
//    where its owner says; a wreck is burnt out; a gone one (stored in the Lock-Up, recycled) leaves.
//  - Interest: records go only to peers within 300 m of the vehicle, an unchanged record every 10 s. A record that
//    lapses (out of range) leaves the vehicle where it was last seen.
//  - When the owner leaves, the hub's adopt() hands each entry to exactly one player, who bumps the generation and
//    publishes it from then on. A vehicle whose driver left mid-drive stays where it was last reported, parked.
//  - Safety: unknown kinds, positions off the map, and a parked record that moves a vehicle far from where its owner
//    stands are ignored; one owner holds at most MAX_OWNED entries.
import { VEHICLE_CODES, POS_BOUND } from '../net';
import type { Vehicle, VehicleKind } from '../types';
import type { MirrorChanges, MirrorEnt, OwnedEnt, SyncAdapter, SyncFrame, SyncLink } from './hub';
import { qAngle, qPos, qUnit, SYS, uqAngle, uqPos, uqUnit } from './protocol';
import { takeShared } from './shared';

export const PARK = {
  /** Interest radius, m. */
  radius: 300,
  hz: 4,
  keyframeMs: 10000,
  staleMs: 40000,
  /** Detection runs this often, s. */
  scanS: 0.25,
  /** A parked vehicle moved farther than this (m) from where the ledger has it counts as touched (boats: boatMove). */
  move: 2,
  boatMove: 6,
  /** hp change (0..1) that counts as a touch. */
  hp: 0.04,
  /** While driven, the record's position follows the vehicle only in steps this big (m): it is a fallback, the pose draws it. */
  drivenStep: 25,
  /**
   * A vehicle that vanished from my list within this distance of me was stored / scrapped (gone); farther, it was culled
   * (traffic.ts drops abandoned vehicles past 60 m when the list is full: that is local tidying, not news).
   */
  goneNear: 20,
  /**
   * Mirrored vehicles I have no copy of are built when I come this close (m). Under traffic.ts's CLEANUP_DISTANCE (60 m,
   * where it drops abandoned vehicles once the list is full), or the two would build and drop the same vehicle forever.
   */
  buildNear: 50,
  /** A parked record may move a vehicle only to within this distance (m) of its owner's own position. */
  ownerReach: 120,
} as const;

/** Most entries one player publishes (the newest touches win). */
export const MAX_OWNED = 96;

export const PARK_STATE = { parked: 0, driven: 1, wreck: 2, gone: 3 } as const;
export type ParkState = (typeof PARK_STATE)[keyof typeof PARK_STATE];

/** Kinds that never go through the ledger: the tubing system relays tubes, Tessie is a creature of the loch. */
const UNTRACKED: readonly VehicleKind[] = ['tow-tube', 'tessie', 'tow-ski', 'spoke-gondola', 'tea-tray-sled', 'snow-skis', 'skateboard'];

/** Stable vids live below this; dynamic ones at and above it. */
export const DYNAMIC_BASE = 0x40000000;

/** The wire record: [vid, gen, state, kind code, x dm, y dm, z dm, yaw byte, hp 0..100, tint]. */
export interface ParkWire {
  vid: number; gen: number; state: ParkState; kind: VehicleKind;
  x: number; y: number; z: number; yaw: number; hp: number; tint: number;
}

export function encodePark(w: ParkWire): number[] {
  return [
    w.vid, w.gen, w.state, VEHICLE_CODES.indexOf(w.kind), qPos(w.x), qPos(w.y), qPos(w.z), qAngle(w.yaw), qUnit(w.hp),
    (w.tint >>> 0) & 0xffffff,
  ];
}

/** Null when malformed, an unknown kind (a newer client's), or off the map. */
export function decodePark(rec: readonly number[]): ParkWire | null {
  if (rec.length !== 10) return null;
  const [vid, gen, state, kc, x, y, z, yaw, hp, tint] = rec;
  if (vid < 0 || gen < 0 || state < 0 || state > 3 || kc < 0 || kc >= VEHICLE_CODES.length) return null;
  if (Math.abs(x) > POS_BOUND * 10 || Math.abs(z) > POS_BOUND * 10 || y < -100 || y > 4000) return null;
  if (yaw < 0 || yaw > 255 || hp < 0 || hp > 100 || tint < 0) return null;
  return {
    vid, gen, state: state as ParkState, kind: VEHICLE_CODES[kc], x: uqPos(x), y: uqPos(y), z: uqPos(z), yaw: uqAngle(yaw),
    hp: uqUnit(hp), tint,
  };
}

/** The stable vid of a vehicle built at start-up: FNV-1a of kind and home spot (decimetres), below DYNAMIC_BASE. */
export function stableVid(kind: string, x: number, z: number): number {
  const s = `${kind}|${Math.round(x * 10)}|${Math.round(z * 10)}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % DYNAMIC_BASE;
}

/** A dynamic vid minted by player `me` (its n-th). */
export const dynamicVid = (me: number, n: number): number => DYNAMIC_BASE + ((me & 0x3fff) << 16) + (n & 0xffff);

export { shareVehicle } from './shared';

/** What parkSync needs from the game. app.ts / install.ts fills it with createVehicle and friends. */
export interface ParkSyncDeps {
  /** The game's live vehicle list (mirrors are pushed in and spliced out). */
  vehicles: Vehicle[];
  /** Vehicles built at start-up (the stable set), read once when the adapter is made. */
  stable: readonly Vehicle[];
  /** The vehicle I drive (driver 'player'), or null. */
  driving(): Vehicle | null;
  /** Build a vehicle for a mirrored record and add it to the scene (not to the list). str = `${variant}|${lookCode}`. */
  create(kind: VehicleKind, x: number, z: number, yaw: number, tint: number, str: string): Vehicle;
  /** Put a vehicle at a pose, standing still (and sync its mesh). */
  place(v: Vehicle, x: number, y: number, z: number, yaw: number): void;
  /** Bring its hit points to hp (0..1) with the matching damage stage. */
  setHp(v: Vehicle, hp: number): void;
  /** Burn it out (no heat, no achievements: it happened on someone else's world). */
  wreck(v: Vehicle): void;
  /** Show or hide its mesh (in the scene or out). */
  show(v: Vehicle, on: boolean): void;
  /** The variant and look string a record carries for v (`${variant}|${lookCode}`). */
  describe(v: Vehicle): string;
  /** Apply a changed variant/look string to an existing vehicle. */
  restyle(v: Vehicle, str: string): void;
}

interface Entry {
  vid: number;
  v: Vehicle | null;
  stable: boolean;
  kind: VehicleKind;
  tint: number;
  str: string;
  gen: number;
  /** Who last touched it; null = untouched since start-up (stable, at home). */
  owner: number | null;
  state: ParkState;
  x: number; y: number; z: number; yaw: number; hp: number;
  /** Out of my vehicle list because someone else drives it, or it is gone. */
  hidden: boolean;
  /** Order of my claims, for the MAX_OWNED cap. */
  seq: number;
}

export interface ParkSync extends SyncAdapter {
  /** Debug / tests: the ledger entry of a vehicle, or of a vid. */
  entryOf(v: Vehicle | number): Readonly<Omit<Entry, 'v'>> & { v: Vehicle | null } | null;
  /** Debug: entries by state, and how many I own. */
  summary(): { entries: number; owned: number; hidden: number; byState: number[] };
}

export function createParkSync(link: SyncLink, d: ParkSyncDeps): ParkSync {
  const byVid = new Map<number, Entry>();
  const byVehicle = new WeakMap<Vehicle, Entry>();
  let dynSeq = 0;
  let claimSeq = 0;
  let scanT = 0;
  let lastFrame: SyncFrame | null = null;
  const inList = new Set<Vehicle>();

  const myId = (): number | null => link.myId();

  function track(e: Entry): void {
    byVid.set(e.vid, e);
    if (e.v) byVehicle.set(e.v, e);
  }

  function snapshot(e: Entry, v: Vehicle): void {
    e.x = v.x; e.y = v.y; e.z = v.z; e.yaw = v.yaw; e.hp = v.hp; e.tint = v.tint;
  }

  // The stable set: built identically on every client (docs/roadmaps/gta-multiplayer-audit.md, determinism).
  for (const v of d.stable) {
    if (v.driver !== 'none' || UNTRACKED.includes(v.kind)) continue;
    const home = v.home ?? { x: v.x, z: v.z, yaw: v.yaw };
    const vid = stableVid(v.kind, home.x, home.z);
    if (byVid.has(vid)) continue; // two at one spot: the second is left out (it is tracked as dynamic once driven)
    const e: Entry = {
      vid, v, stable: true, kind: v.kind, tint: v.tint, str: '', gen: 0, owner: null, state: PARK_STATE.parked,
      x: v.x, y: v.y, z: v.z, yaw: v.yaw, hp: v.hp, hidden: false, seq: 0,
    };
    track(e);
  }

  function claim(e: Entry, state: ParkState): void {
    const me = myId();
    if (me === null) return;
    e.gen += 1;
    e.owner = me;
    e.state = state;
    e.seq = ++claimSeq;
    if (e.v) {
      snapshot(e, e.v);
      e.str = d.describe(e.v);
    }
  }

  function newDynamic(v: Vehicle, state: ParkState): Entry | null {
    const me = myId();
    if (me === null) return null;
    let vid = dynamicVid(me, ++dynSeq);
    while (byVid.has(vid)) vid = dynamicVid(me, ++dynSeq);
    const e: Entry = {
      vid, v, stable: false, kind: v.kind, tint: v.tint, str: d.describe(v), gen: 0, owner: null, state,
      x: v.x, y: v.y, z: v.z, yaw: v.yaw, hp: v.hp, hidden: false, seq: 0,
    };
    track(e);
    claim(e, state);
    return e;
  }

  function hide(e: Entry): void {
    if (!e.v || e.hidden) return;
    e.hidden = true;
    const i = d.vehicles.indexOf(e.v);
    if (i >= 0) d.vehicles.splice(i, 1);
    d.show(e.v, false);
  }

  function unhide(e: Entry): void {
    if (!e.v || !e.hidden) return;
    e.hidden = false;
    if (!d.vehicles.includes(e.v)) d.vehicles.push(e.v);
    d.show(e.v, true);
  }

  /** Make the local vehicle match the entry (a mirror applied, or an owner adopted). */
  function realize(e: Entry, me: { x: number; z: number } | null): void {
    if (e.state === PARK_STATE.driven || e.state === PARK_STATE.gone) { hide(e); return; }
    if (!e.v) {
      if (me && Math.hypot(e.x - me.x, e.z - me.z) > PARK.buildNear) return; // built when I come near (scan)
      const v = d.create(e.kind, e.x, e.z, e.yaw, e.tint, e.str);
      e.v = v;
      byVehicle.set(v, e);
      d.vehicles.push(v);
      e.hidden = false;
    } else unhide(e);
    const v = e.v;
    d.place(v, e.x, e.y, e.z, e.yaw);
    if (e.state === PARK_STATE.wreck) { if (!v.exploded) d.wreck(v); }
    else if (Math.abs(v.hp - e.hp) > 0.01) d.setHp(v, e.hp);
  }

  const moveLimit = (v: Vehicle): number => (v.spec.boat ? PARK.boatMove : PARK.move);

  /** Find what I did to vehicles since the last scan and claim it. */
  function scan(f: SyncFrame): void {
    const me = f.myId;
    const drive = d.driving();
    inList.clear();
    for (const v of d.vehicles) inList.add(v);
    // The vehicle I drive: claim it (a vehicle the ledger does not know yet becomes a dynamic entry).
    if (drive && !UNTRACKED.includes(drive.kind)) {
      const e = byVehicle.get(drive);
      if (!e) newDynamic(drive, PARK_STATE.driven);
      else if (e.owner !== me || e.state !== PARK_STATE.driven) claim(e, PARK_STATE.driven);
      else if (Math.hypot(drive.x - e.x, drive.z - e.z) > PARK.drivenStep && Math.abs(drive.x) < POS_BOUND && Math.abs(drive.z) < POS_BOUND) {
        snapshot(e, drive);
      }
    }
    // Vehicles brought in for everyone (Sling-Lift, Lock-Up, trainer).
    for (const v of d.vehicles) {
      if (!takeShared(v)) continue;
      if (!byVehicle.has(v) && !UNTRACKED.includes(v.kind)) newDynamic(v, v.exploded ? PARK_STATE.wreck : PARK_STATE.parked);
    }
    for (const e of byVid.values()) {
      if (e.hidden) continue;
      const v = e.v;
      if (!v) {
        // A mirrored vehicle I have no copy of yet: build it once I am near.
        if (e.owner !== null && e.owner !== me && (e.state === PARK_STATE.parked || e.state === PARK_STATE.wreck)
          && Math.hypot(e.x - f.me.x, e.z - f.me.z) < PARK.buildNear) realize(e, f.me);
        continue;
      }
      if (v === drive) continue;
      if (!inList.has(v)) {
        // Gone from my world: stored or scrapped next to me (tell everyone), or culled far away (keep it to myself).
        const near = Math.hypot(v.x - f.me.x, v.z - f.me.z) < PARK.goneNear;
        if (near && (e.owner === me || e.owner === null)) claim(e, PARK_STATE.gone);
        else { byVehicle.delete(v); e.v = null; }
        continue;
      }
      if (e.owner === me && e.state === PARK_STATE.driven) {
        // I got out (or it was taken off me by a quest): parked where I left it, a wreck, or gone with its quest.
        // (Moored boats are questOwned from start-up so traffic leaves them be: a stable vehicle is never "gone with its quest".)
        claim(e, v.exploded ? PARK_STATE.wreck : v.questOwned && !e.stable ? PARK_STATE.gone : PARK_STATE.parked);
        continue;
      }
      if (v.driver !== 'none' || (v.questOwned && !e.stable)) continue; // a quest, event or NPC is using it right now
      if (v.exploded) { if (e.state !== PARK_STATE.wreck) claim(e, PARK_STATE.wreck); continue; }
      if (Math.hypot(v.x - e.x, v.z - e.z) > moveLimit(v) || Math.abs(v.hp - e.hp) > PARK.hp) claim(e, PARK_STATE.parked);
    }
  }

  /** True when an incoming (gen, owner) beats what the entry has. */
  const beats = (gen: number, owner: number, e: Entry): boolean =>
    gen > e.gen || (gen === e.gen && e.owner !== null && owner !== e.owner && owner < e.owner);

  function apply(m: MirrorEnt, f: SyncFrame | null): void {
    const w = decodePark(m.rec);
    if (!w || m.id !== w.vid) return;
    let e = byVid.get(w.vid);
    if (e && !beats(w.gen, m.owner, e) && !(e.owner === m.owner && w.gen === e.gen)) return;
    // A parked or wrecked vehicle may only be put down near its owner (or left where it already was).
    if (f && (w.state === PARK_STATE.parked || w.state === PARK_STATE.wreck)) {
      const moved = !e || Math.hypot(w.x - e.x, w.z - e.z) > 2;
      const o = f.peers.find((p) => p.id === m.owner);
      if (moved && o && Math.hypot(w.x - o.x, w.z - o.z) > PARK.ownerReach) return;
    }
    if (e && e.v && e.v === d.driving()) {
      // I just got in and my claim has not gone out yet (next scan): never move the vehicle under me.
      if (e.owner !== (f?.myId ?? myId())) return;
      // They touched the vehicle I am driving before my claim reached them (we both took it, or they bumped it) and
      // won: mine becomes a vehicle of its own (a fork), so I am never yanked about; theirs is rebuilt from their record.
      const mine = e.v;
      byVehicle.delete(mine);
      e.v = null;
      newDynamic(mine, PARK_STATE.driven);
    }
    if (!e) {
      e = {
        vid: w.vid, v: null, stable: w.vid < DYNAMIC_BASE, kind: w.kind, tint: w.tint, str: m.str ?? '', gen: w.gen,
        owner: m.owner, state: w.state, x: w.x, y: w.y, z: w.z, yaw: w.yaw, hp: w.hp, hidden: false, seq: 0,
      };
      track(e);
    } else {
      e.gen = w.gen; e.owner = m.owner; e.state = w.state; e.kind = w.kind;
      e.x = w.x; e.y = w.y; e.z = w.z; e.yaw = w.yaw; e.hp = w.hp; e.tint = w.tint;
      if (m.str !== undefined && m.str !== e.str) {
        e.str = m.str;
        if (e.v) d.restyle(e.v, e.str);
      }
    }
    realize(e, f?.me ?? null);
  }

  return {
    sys: SYS.park,
    radius: PARK.radius,
    hz: PARK.hz,
    keyframeMs: PARK.keyframeMs,
    staleMs: PARK.staleMs,
    collect(out: OwnedEnt[], f: SyncFrame) {
      const mine: Entry[] = [];
      for (const e of byVid.values()) if (e.owner === f.myId) mine.push(e);
      if (mine.length > MAX_OWNED) mine.sort((a, b) => b.seq - a.seq).length = MAX_OWNED;
      for (const e of mine) {
        out.push({
          id: e.vid, x: e.x, z: e.z,
          rec: encodePark({ vid: e.vid, gen: e.gen, state: e.state, kind: e.kind, x: e.x, y: e.y, z: e.z, yaw: e.yaw, hp: e.hp, tint: e.tint }),
          str: e.str,
        });
      }
    },
    receive(ch: MirrorChanges, f: SyncFrame | null) {
      for (const m of ch.added) apply(m, f);
      for (const m of ch.changed) apply(m, f);
      // Removed (out of range or lapsed): the vehicle stays where it was last seen.
    },
    ownerGone(owner, ents, adopt) {
      for (const m of ents) {
        const e = byVid.get(m.id);
        if (!e || e.owner !== owner) continue;
        if (!adopt(e.x, e.z)) continue;
        // Mine now. A vehicle whose driver left mid-drive stays where it was last reported, parked.
        const state = e.state === PARK_STATE.driven ? PARK_STATE.parked : e.state;
        e.state = state;
        realize(e, lastFrame?.me ?? null);
        const keep = { x: e.x, y: e.y, z: e.z, yaw: e.yaw, hp: e.hp };
        claim(e, state);
        Object.assign(e, keep); // claim() snapshots the vehicle; keep the reported place if it was not built here
      }
    },
    update(dt: number, f: SyncFrame) {
      lastFrame = f;
      scanT -= dt;
      if (scanT > 0) return;
      scanT = PARK.scanS;
      scan(f);
    },
    reset() {
      // Alone again: vehicles other players were driving stay where they were last reported, parked.
      for (const e of byVid.values()) {
        if (e.state === PARK_STATE.driven && e.owner !== myId()) {
          e.state = PARK_STATE.parked;
          realize(e, null);
        }
      }
      lastFrame = null;
    },
    entryOf(x) {
      const e = typeof x === 'number' ? byVid.get(x) : byVehicle.get(x);
      return e ?? null;
    },
    summary() {
      const byState = [0, 0, 0, 0];
      let owned = 0;
      let hidden = 0;
      const me = myId();
      for (const e of byVid.values()) {
        if (e.owner === null) continue;
        byState[e.state]++;
        if (e.owner === me) owned++;
        if (e.hidden) hidden++;
      }
      return { entries: byVid.size, owned, hidden, byState };
    },
  };
}

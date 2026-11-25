// The race adapter: encode/decode, and two or three simulated clients exchanging records.
import { describe, expect, it, vi } from 'vitest';
import type { RaceLobby } from '../streetRace/types';
import type { SyncFrame, SyncLink } from './hub';
import type { MirrorEnt, OwnedEnt } from './replicate';
import { createRaceSync, decodeRaceRec, encodeRaceRec, RACE_VEHICLES, type RaceRec, type RaceSync } from './raceSync';

const REC: RaceRec = { state: 1, trackIdx: 3, laps: 2, vehicleIdx: 5, hostId: 7, seq: 4, distDm: 1234, finishCs: -1, dnf: 0 };

interface Client { id: number; sync: RaceSync }

function client(id: number, name: string): Client {
  const link: SyncLink = { command() {}, pay() {}, online: () => true, myId: () => id };
  return { id, sync: createRaceSync(link, { name: () => name }) };
}

function frame(id: number): SyncFrame {
  const p = { id, x: 0, z: 0 };
  return { now: 0, myId: id, hostId: 1, isHost: id === 1, lead: true, me: p, peers: [], ownerOf: () => id } as unknown as SyncFrame;
}

/** One publish round: every client collects and every other client receives it as a changed mirror. */
function tick(...cs: Client[]): void {
  for (const from of cs) {
    const out: OwnedEnt[] = [];
    from.sync.collect(out, frame(from.id));
    for (const to of cs) {
      if (to === from) continue;
      const e: MirrorEnt = { owner: from.id, id: 0, rec: out[0].rec, str: out[0].str, seenAt: 0, sentAt: 0 };
      to.sync.receive({ added: [e], changed: [], removed: [] }, null);
    }
  }
}

function remove(from: Client, ...others: Client[]): void {
  for (const o of others) {
    const e: MirrorEnt = { owner: from.id, id: 0, rec: [], str: undefined, seenAt: 0, sentAt: 0 };
    o.sync.receive({ added: [], changed: [], removed: [e] }, null);
  }
}

describe('race record', () => {
  it('round trips', () => {
    expect(decodeRaceRec(encodeRaceRec(REC))).toEqual(REC);
  });
  it('rejects bad records', () => {
    const good = encodeRaceRec(REC);
    expect(decodeRaceRec(good.slice(0, 9))).toBeNull();
    for (const [i, v] of [[1, 5], [1, -1], [2, 99], [3, 0], [4, RACE_VEHICLES.length], [5, -2], [8, -2], [9, 2], [7, 1.5]] as const) {
      const r = good.slice();
      r[i] = v;
      expect(decodeRaceRec(r), `${i}=${v}`).toBeNull();
    }
  });
});

describe('createRaceSync', () => {
  it('lobby, join, go, progress, finish', () => {
    const a = client(1, 'Ann');
    const b = client(2, 'Bob');
    const invite = vi.fn<(l: RaceLobby) => void>();
    b.sync.onInvite = invite;
    a.sync.host('kerb-row-circuit', 3, 'lowrider');
    tick(a, b);
    tick(a, b);
    expect(invite).toHaveBeenCalledTimes(1);
    expect(b.sync.lobbies()).toHaveLength(1);
    expect(b.sync.lobbies()[0]).toMatchObject({ hostId: 1, hostName: 'Ann', trackId: 'kerb-row-circuit', laps: 3, vehicle: 'lowrider', phase: 'lobby' });
    expect(a.sync.lobbies()).toHaveLength(0);
    b.sync.join(1);
    tick(a, b);
    expect(a.sync.mine()?.members.map((m) => m.id)).toEqual([1, 2]);
    expect(b.sync.mine()?.members.map((m) => m.name)).toEqual(['Ann', 'Bob']);
    expect(b.sync.started()).toBe(false);
    a.sync.go();
    expect(a.sync.started()).toBe(true);
    tick(a, b);
    expect(b.sync.started()).toBe(true);
    expect(b.sync.mine()?.phase).toBe('racing');
    a.sync.progress({ dist: 12.34, finishedAt: null, dnf: false });
    b.sync.progress({ dist: 50, finishedAt: null, dnf: false });
    tick(a, b);
    expect(b.sync.racers()).toEqual([{ id: 1, name: 'Ann', dist: 12.3, finishedAt: null, dnf: false }]);
    expect(a.sync.racers()[0].dist).toBe(50);
    a.sync.progress({ dist: 300, finishedAt: 61.25, dnf: false });
    tick(a, b);
    expect(b.sync.racers()[0].finishedAt).toBe(61.25);
  });

  it('a host leaving before go drops joiners to idle', () => {
    const a = client(1, 'Ann');
    const b = client(2, 'Bob');
    a.sync.host('skyway-sprint', 1, 'ride-on');
    tick(a, b);
    b.sync.join(1);
    tick(a, b);
    expect(b.sync.mine()).not.toBeNull();
    a.sync.leave();
    tick(a, b);
    expect(b.sync.mine()).toBeNull();
    expect(b.sync.started()).toBe(false);
  });

  it('a missing host after go does not stop joiners', () => {
    const a = client(1, 'Ann');
    const b = client(2, 'Bob');
    a.sync.host('skyway-sprint', 1, 'ride-on');
    tick(a, b);
    b.sync.join(1);
    tick(a, b);
    a.sync.go();
    tick(a, b);
    remove(a, b);
    expect(b.sync.started()).toBe(true);
    expect(b.sync.mine()).not.toBeNull();
  });

  it('three clients: joiners ordered by id', () => {
    const a = client(1, 'Ann');
    const b = client(2, 'Bob');
    const c = client(3, 'Cy');
    a.sync.host('ring-road-run', 1, 'wespa');
    tick(a, b, c);
    c.sync.join(1);
    b.sync.join(1);
    tick(a, b, c);
    tick(a, b, c);
    for (const x of [a, b, c]) expect(x.sync.mine()?.members.map((m) => m.id)).toEqual([1, 2, 3]);
    expect(c.sync.racers().map((r) => r.id)).toEqual([1, 2]);
  });

  it('join ignores a host that is not in a lobby, reset forgets mirrors', () => {
    const a = client(1, 'Ann');
    const b = client(2, 'Bob');
    tick(a, b);
    b.sync.join(1);
    expect(b.sync.mine()).toBeNull();
    a.sync.host('ring-road-run', 1, 'wespa');
    tick(a, b);
    b.sync.reset();
    expect(b.sync.lobbies()).toHaveLength(0);
  });
});

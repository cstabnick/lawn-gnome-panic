import { describe, expect, it, vi } from 'vitest';
import type { BirdNet, Birding } from '../birding/birding';
import { BIRDS } from '../birding/species';
import type { Flock, FlockMode } from '../birding/types';
import type { MirrorEnt, SyncFrame, SyncLink } from './hub';
import { createBirdSync } from './birdSync';
import { SYS, qAngle, qPos } from './protocol';

function fakeFlock(id: number, mode: FlockMode = 'flying'): Flock {
  return {
    id, species: BIRDS[0], members: [], mode, modeT: 0, x: 0, y: 0, z: 0, heading: 0, tx: 0, ty: 0, tz: 0,
    targetKind: 'ground', homeX: 0, homeZ: 0, callT: 0, sinceFlush: 0, acc: 0,
  } as Flock;
}

function fakeBirding(local: Flock[], mirrors: Flock[]) {
  const flocks: Flock[] = [...local, ...mirrors];
  const mirrorSet = new Set<Flock>(mirrors);
  let net: BirdNet | null = null;
  const b = {
    setNet: vi.fn((n: BirdNet | null) => { net = n; }),
    flockList: vi.fn(() => flocks),
    isMirror: vi.fn((fl: Flock) => mirrorSet.has(fl)),
    addMirrorFlock: vi.fn((_id: string, _size: number, _x: number, _y: number, _z: number, _mode: FlockMode): Flock | null => fakeFlock(900 + flocks.length)),
    removeFlock: vi.fn(),
    adoptMirror: vi.fn(),
    flush: vi.fn(),
  };
  return { birding: b as unknown as Birding & typeof b, getNet: () => net, b };
}

function fakeLink(online = true) {
  return {
    command: vi.fn(),
    pay: vi.fn(),
    online: vi.fn(() => online),
    myId: vi.fn(() => 1),
  };
}

const frame = (lead: boolean): SyncFrame => ({
  now: 0, myId: 1, hostId: null, isHost: false, lead, me: { id: 1, x: 0, z: 0 }, peers: [], ownerOf: () => null,
});

function entOf(id: number, rec: number[], owner = 7): MirrorEnt {
  return { owner, id, rec, str: undefined, seenAt: 0, sentAt: 0 };
}

describe('birdSync', () => {
  it('uses the flock system and the agreed radius and rate', () => {
    const { birding } = fakeBirding([], []);
    const a = createBirdSync(fakeLink(), { birding, scene: {} as never });
    expect(a.sys).toBe(SYS.flock);
    expect(a.radius).toBe(160);
    expect(a.hz).toBe(1); // 4 Hz before the multiplayer audit (bandwidth)
  });

  it('collect publishes my flocks and skips mirrors', () => {
    const mine = fakeFlock(3);
    const theirs = fakeFlock(4);
    const { birding } = fakeBirding([mine], [theirs]);
    const a = createBirdSync(fakeLink(), { birding, scene: {} as never });
    const out: { id: number; rec: number[] }[] = [];
    a.collect(out as never, frame(true));
    expect(out).toHaveLength(1);
    // Wire ids are the sync's own (1, 2, ...), not the flock's local id.
    expect(out[0].id).toBe(1);
    expect(out[0].rec[0]).toBe(1);
    expect(out[0].rec[1]).toBe(0);
    expect(out[0].rec[7]).toBe(qAngle(0));
    expect(out[0].rec[4]).toBe(qPos(0));
  });

  it('receive(added) mirrors a flock with the right species id', () => {
    const { birding, b } = fakeBirding([], []);
    const a = createBirdSync(fakeLink(), { birding, scene: {} as never });
    const species = 2;
    const rec = [5, species, 4, 1, qPos(10), qPos(2), qPos(-3), 0, qPos(20), qPos(2), qPos(-3), 3];
    const e = entOf(5, rec);
    a.receive({ added: [e], changed: [], removed: [] }, null);
    expect(b.addMirrorFlock).toHaveBeenCalledTimes(1);
    const args = b.addMirrorFlock.mock.calls[0];
    expect(args[0]).toBe(BIRDS[species].id);
    expect(args[1]).toBe(4);
    expect(args[2]).toBeCloseTo(10);
    expect(args[3]).toBeCloseTo(2);
    expect(args[4]).toBeCloseTo(-3);
    expect(args[5]).toBe('flying');
    expect(e.view).toBeDefined();
  });

  it('receive(removed) drops the mirror', () => {
    const { birding, b } = fakeBirding([], []);
    const a = createBirdSync(fakeLink(), { birding, scene: {} as never });
    const e = entOf(5, [5, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 3]);
    a.receive({ added: [e], changed: [], removed: [] }, null);
    a.receive({ added: [], changed: [], removed: [e] }, null);
    expect(b.removeFlock).toHaveBeenCalledTimes(1);
  });

  it('spawning() is false when online and the frame says another player leads', () => {
    const { birding, getNet } = fakeBirding([], []);
    const link = fakeLink(true);
    const a = createBirdSync(link, { birding, scene: {} as never });
    a.update(0.016, frame(false));
    expect(getNet()?.spawning()).toBe(false);
    a.update(0.016, frame(true));
    expect(getNet()?.spawning()).toBe(true);
  });

  it('spawning() stays true offline', () => {
    const { birding, getNet } = fakeBirding([], []);
    const a = createBirdSync(fakeLink(false), { birding, scene: {} as never });
    a.update(0.016, frame(false));
    expect(getNet()?.spawning()).toBe(true);
  });

  it('command 1 flushes my flock at the given position', () => {
    const mine = fakeFlock(3);
    const { birding, b } = fakeBirding([mine], []);
    const a = createBirdSync(fakeLink(), { birding, scene: {} as never });
    const out: { id: number }[] = [];
    a.collect(out as never, frame(true));
    a.command?.(9, out[0].id, 1, [qPos(12), qPos(-4)]);
    expect(b.flush).toHaveBeenCalledWith(mine, 12, -4);
  });

  it('command ignores unknown ids and mirrors', () => {
    const theirs = fakeFlock(4);
    const { birding, b } = fakeBirding([], [theirs]);
    const a = createBirdSync(fakeLink(), { birding, scene: {} as never });
    a.command?.(9, 4, 1, [0, 0]);
    a.command?.(9, 99, 1, [0, 0]);
    expect(b.flush).not.toHaveBeenCalled();
  });

  it('a shot on a mirrored flock is sent back to its owner', () => {
    const { birding, getNet, b } = fakeBirding([], []);
    const link = fakeLink(true);
    const a = createBirdSync(link, { birding, scene: {} as never });
    const fl = fakeFlock(900);
    b.addMirrorFlock.mockReturnValueOnce(fl);
    a.receive({ added: [entOf(5, [5, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 3], 7)], changed: [], removed: [] }, null);
    getNet()?.flushed(fl, 3, 4);
    expect(link.command).toHaveBeenCalledWith(7, 5, 1, [qPos(3), qPos(4)]);
  });

  it('ownerGone adopts a mirror when adopt says yes, disposes it otherwise', () => {
    const { birding, b } = fakeBirding([], []);
    const a = createBirdSync(fakeLink(), { birding, scene: {} as never });
    const adopted = entOf(5, [5, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 3]);
    const dropped = entOf(6, [6, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 3]);
    a.receive({ added: [adopted, dropped], changed: [], removed: [] }, null);
    const flockA = adopted.view as Flock;
    a.ownerGone(7, [adopted, dropped], () => false);
    expect(b.removeFlock).toHaveBeenCalledTimes(2);
    expect(b.adoptMirror).not.toHaveBeenCalled();
    expect(flockA).toBeDefined();

    b.removeFlock.mockClear();
    const again = entOf(8, [8, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 3]);
    a.receive({ added: [again], changed: [], removed: [] }, null);
    const flockB = again.view as Flock;
    a.ownerGone(7, [again], () => true);
    expect(b.adoptMirror).toHaveBeenCalledWith(flockB);
    expect(b.removeFlock).not.toHaveBeenCalled();
  });

  it('reset removes every mirror and restores lead', () => {
    const mine = fakeFlock(3);
    const theirs = fakeFlock(4);
    const { birding, b, getNet } = fakeBirding([mine], [theirs]);
    const a = createBirdSync(fakeLink(true), { birding, scene: {} as never });
    a.update(0.016, frame(false));
    a.reset();
    expect(b.removeFlock).toHaveBeenCalledWith(theirs);
    expect(b.removeFlock).not.toHaveBeenCalledWith(mine);
    expect(getNet()?.spawning()).toBe(true);
  });
});

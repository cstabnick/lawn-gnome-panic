import { describe, expect, it, vi } from 'vitest';
import type { Hunting, HuntNet } from '../hunting/hunting';
import type { Quarry } from '../hunting/quarry';
import { SPECIES } from '../hunting/species';
import type { SyncFrame, SyncLink } from './hub';
import { createHuntSync, MODES } from './huntSync';
import type { MirrorEnt, OwnedEnt } from './replicate';

function quarry(id: number, x: number, z: number): Quarry {
  return {
    id, species: SPECIES[0], x, y: 0, z, yaw: 0, speed: 0, mode: 'graze', modeT: 1, awareness: 0,
    tip: 0, lift: 0, combedT: 0, homeX: x, homeZ: z, leash: 30, goalX: x, goalZ: z, fromX: x, fromZ: z,
    zig: 0, callT: 5, lastShotDist: 0, moved: 0,
  } as unknown as Quarry;
}

function frame(over: Partial<SyncFrame> = {}): SyncFrame {
  return {
    now: 0, myId: 1, hostId: null, isHost: false, lead: false,
    me: { id: 1, x: 0, z: 0 }, peers: [{ id: 2, x: 5, z: 0 }],
    ownerOf: () => 2, ...over,
  };
}

function setup() {
  let online = false;
  const link = {
    command: vi.fn(),
    pay: vi.fn(),
    online: () => online,
    myId: () => 1,
  };
  const q1 = quarry(1, 10, 0);
  const q2 = quarry(2, 20, 0);
  let captured: HuntNet | null = null;
  const hunting = {
    list: [q1, q2],
    setNet: vi.fn((n: HuntNet | null) => { captured = n; }),
    remoteShot: vi.fn(),
    remoteComb: vi.fn(),
  };
  const adapter = createHuntSync(link as unknown as SyncLink, { hunting: hunting as unknown as Hunting });
  return {
    link, adapter, q1, q2, hunting,
    net: (): HuntNet => captured as HuntNet,
    goOnline: () => { online = true; },
  };
}

describe('huntSync', () => {
  it('owns every quarry while offline', () => {
    const s = setup();
    expect(s.net().owns(s.q1)).toBe(true);
    expect(s.net().owns(s.q2)).toBe(true);
  });

  it('gives a quarry to its owner while online, and a guest shot goes to that owner', () => {
    const s = setup();
    s.goOnline();
    s.adapter.update(0.1, frame());
    expect(s.net().owns(s.q1)).toBe(false);
    s.net().shot(s.q1, 3, 4, 5);
    expect(s.link.command).toHaveBeenCalledWith(2, 1, 1, [30, 40, 50]);
  });

  it('collect pushes only the quarry I own', () => {
    const s = setup();
    s.goOnline();
    const f = frame({ ownerOf: (x) => (x === 10 ? 1 : 2) });
    s.adapter.update(0.1, f);
    const out: OwnedEnt[] = [];
    s.adapter.collect(out, f);
    expect(out.length).toBe(1);
    expect(out[0].id).toBe(1);
    expect(out[0].rec.length).toBe(13);
    expect(out[0].rec[0]).toBe(1);
    expect(out[0].rec.every((v) => Number.isInteger(v))).toBe(true);
  });

  it('receive applies the mode from a record', () => {
    const s = setup();
    s.goOnline();
    s.adapter.update(0.1, frame());
    const rec = [1, 0, 100, 0, 0, 0, MODES.indexOf('flee'), 20, 50, 0, 0, 0, 0];
    const ent: MirrorEnt = { owner: 2, id: 1, rec, str: undefined, seenAt: 0, sentAt: 0 };
    s.adapter.receive({ added: [], changed: [ent], removed: [] }, null);
    expect(s.q1.mode).toBe('flee');
    expect(s.q1.modeT).toBe(2);
  });

  it('command c 1 calls remoteShot', () => {
    const s = setup();
    s.goOnline();
    s.adapter.update(0.1, frame());
    s.adapter.command?.(2, 1, 1, [30, 0, 40]);
    expect(s.hunting.remoteShot).toHaveBeenCalledWith(s.q1, 3, 0, 4);
  });
});

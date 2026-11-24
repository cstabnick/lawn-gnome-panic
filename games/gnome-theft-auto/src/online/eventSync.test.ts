// The owner side of street-event sync (collect, command, reward hook, reset) with fake director, npcs and link.
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { decodeLook, GNORMAN_LOOK } from '@lawn/gnome';
import { STREET_EVENTS } from '../events/catalog';
import type { EventDirector } from '../events/director';
import type { Fx, Hud, Npc, Npcs } from '../types';
import type { SyncFrame, SyncLink } from './hub';
import type { OwnedEnt } from './replicate';
import { createEventSync, type EventSyncDeps } from './eventSync';

type HookFn = (key: number, acorns: number, reason: string) => boolean;

function fakeNpc(): Npc {
  return { id: 1, name: 'Test', x: 10, z: 20, yaw: 0.5, state: 'walk', look: GNORMAN_LOOK } as unknown as Npc;
}

/** A director with one running event (key 1) whose kit holds one plain-object gnome. */
function fakeDirector(npc: Npc) {
  let hook: HookFn | null = null;
  const gate = vi.fn();
  const kit = { pieces: () => ({ actors: [npc], cars: [], props: [] }) };
  const director = {
    netList: () => [{ key: 1, defId: STREET_EVENTS[0].id, x: 10, z: 20, status: 'running' as const, kit }],
    setRewardHook: (fn: HookFn | null) => { hook = fn; },
    setSpawnGate: gate,
  } as unknown as EventDirector;
  return { director, gate, fireHook: (k: number, n: number, reason: string) => (hook ? hook(k, n, reason) : false) };
}

function fakeLink(online: boolean) {
  return { command: vi.fn(), pay: vi.fn(), online: () => online, myId: () => 1 } as SyncLink & {
    command: ReturnType<typeof vi.fn>;
    pay: ReturnType<typeof vi.fn>;
  };
}

function fakeDeps(npc: Npc, director: EventDirector): EventSyncDeps & { crack: ReturnType<typeof vi.fn> } {
  const crack = vi.fn();
  return {
    director,
    scene: new THREE.Scene(),
    npcs: { list: [npc], crack } as unknown as Npcs,
    vehicles: [],
    fx: { crack: vi.fn(), spark: vi.fn(), explode: vi.fn() } as unknown as Fx,
    play: vi.fn(),
    hud: {} as Hud,
    damage: vi.fn(),
    crack,
  };
}

const FRAME = null as unknown as SyncFrame;
/** Peer 2 stands next to the event (commands are believed only from a shot's reach, eventSync.ts CMD_REACH_M). */
const NEAR = { now: 0, myId: 1, hostId: 1, isHost: true, lead: true, me: { id: 1, x: 0, z: 0 }, peers: [{ id: 2, x: 12, z: 20 }], ownerOf: () => null } as unknown as SyncFrame;
function ready(sync: ReturnType<typeof createEventSync>): void {
  sync.collect([], FRAME);
  sync.update(0, NEAR);
}

describe('event sync: owner side', () => {
  it('collect pushes a header (piece 0) and an actor record (piece 1)', () => {
    const npc = fakeNpc();
    const { director } = fakeDirector(npc);
    const sync = createEventSync(fakeLink(true), fakeDeps(npc, director));
    const out: OwnedEnt[] = [];
    sync.collect(out, FRAME);

    expect(out).toHaveLength(2);
    const header = out[0];
    expect(header.id).toBe(1 * 32);
    expect(header.rec[1]).toBe(3);
    expect(header.rec[2]).toBe(100); // qPos(10)
    expect(header.rec[3]).toBe(200); // qPos(20)
    expect(header.rec[4]).toBe(STREET_EVENTS.findIndex((s) => s.id === STREET_EVENTS[0].id));
    expect(header.rec[5]).toBe(0); // 'running'

    const actor = out[1];
    expect(actor.id).toBe(1 * 32 + 1);
    expect(actor.rec[1]).toBe(0);
    expect(actor.rec[2]).toBe(100);
    expect(actor.rec[4]).toBe(200);
    expect(actor.rec[6]).toBe(0); // 'walk'
    expect(actor.str).toBeTypeOf('string');
    expect(decodeLook(actor.str as string)).not.toBeNull();
  });

  it('command 1 cracks the gnome I own', () => {
    const npc = fakeNpc();
    const { director } = fakeDirector(npc);
    const deps = fakeDeps(npc, director);
    const sync = createEventSync(fakeLink(true), deps);
    const out: OwnedEnt[] = [];
    sync.collect(out, FRAME);

    ready(sync);
    sync.command?.(2, 33, 1, []);
    expect(deps.crack).toHaveBeenCalledWith(npc, 10, 20);
  });

  it('the reward hook pays the last shooter within 30 s when online, and declines otherwise', () => {
    const npc = fakeNpc();
    const { director, fireHook } = fakeDirector(npc);
    const link = fakeLink(true);
    const sync = createEventSync(link, fakeDeps(npc, director));
    ready(sync);
    sync.command?.(2, 33, 1, []);

    expect(fireHook(1, 5, 'Bust')).toBe(true);
    expect(link.pay).toHaveBeenCalledWith(2, 5, 'Bust');

    // Offline: nobody pays, the local reward stays.
    const offline = fakeLink(false);
    const { director: d2, fireHook: fire2 } = fakeDirector(npc);
    const sync2 = createEventSync(offline, fakeDeps(npc, d2));
    ready(sync2);
    sync2.command?.(2, 33, 1, []);
    expect(fire2(1, 5, 'Bust')).toBe(false);
    expect(offline.pay).not.toHaveBeenCalled();
  });

  it('the reward hook declines when the last shot is more than 30 s old', () => {
    const npc = fakeNpc();
    const { director, fireHook } = fakeDirector(npc);
    const link = fakeLink(true);
    const sync = createEventSync(link, fakeDeps(npc, director));
    const now = vi.spyOn(performance, 'now');
    try {
      now.mockReturnValue(1000);
      ready(sync);
    sync.command?.(2, 33, 1, []);
      now.mockReturnValue(40000);
      expect(fireHook(1, 5, 'Bust')).toBe(false);
      expect(link.pay).not.toHaveBeenCalled();
    } finally {
      now.mockRestore();
    }
  });

  it('reset sets the spawn gate back on', () => {
    const npc = fakeNpc();
    const { director, gate } = fakeDirector(npc);
    const sync = createEventSync(fakeLink(true), fakeDeps(npc, director));
    sync.reset();
    expect(gate).toHaveBeenLastCalledWith(true);
  });
});

describe('event sync: cheat resistance', () => {
  it('ignores a shot from a player far from the piece, or at a piece that does not exist', () => {
    const npc = fakeNpc();
    const { director, fireHook } = fakeDirector(npc);
    const deps = fakeDeps(npc, director);
    const link = fakeLink(true);
    const sync = createEventSync(link, deps);
    sync.collect([], FRAME);
    sync.update(0, { ...NEAR, peers: [{ id: 2, x: 900, z: 900 }] } as unknown as SyncFrame);
    sync.command?.(2, 33, 1, []);
    sync.command?.(2, 999, 1, []);
    expect(deps.crack).not.toHaveBeenCalled();
    expect(fireHook(1, 5, 'Bust')).toBe(false);
    expect(link.pay).not.toHaveBeenCalled();
  });
});

// The activity adapter: emote, fishing rod and binoculars go out as one SYS.act record; mirrors reach remotes.setActivity.
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { Fishing } from '../fishing/fishing';
import type { Remotes } from '../remotes';
import { createActSync, type ActSyncDeps } from './actSync';
import type { SyncFrame, SyncLink } from './hub';
import { ACT, decodeActivity, encodeActivity, type RemoteActivity } from './protocol';
import type { MirrorChanges, MirrorEnt, OwnedEnt } from './replicate';

function fakeLink(): SyncLink {
  return { command() {}, pay() {}, online: () => true, myId: () => 1 };
}

function frame(): SyncFrame {
  const p = { id: 1, x: 10, z: -4 };
  return {
    now: 0, myId: 1, hostId: 1, isHost: true, lead: true,
    me: p, peers: [p], ownerOf: () => 1,
  } as unknown as SyncFrame;
}

function fakeDeps(over: { wire?: ReturnType<Fishing['wire']>; viewing?: boolean; emote?: boolean } = {}) {
  const setActivity = vi.fn();
  const deps = {
    emote: { active: over.emote ?? false },
    fishing: { wire: () => over.wire ?? null } as unknown as Fishing,
    birding: { viewing: () => over.viewing ?? false },
    remotes: { setActivity, activityOf: () => null } as unknown as Remotes,
    camera: { getWorldDirection: (v: THREE.Vector3) => v.set(0, 0, 1) } as unknown as THREE.PerspectiveCamera,
    player: {} as ActSyncDeps['player'],
  } as unknown as ActSyncDeps;
  return { deps, setActivity };
}

function collectOne(sync: ReturnType<typeof createActSync>): OwnedEnt {
  const out: OwnedEnt[] = [];
  sync.collect(out, frame());
  expect(out).toHaveLength(1);
  return out[0];
}

function mirror(owner: number, a: RemoteActivity): MirrorEnt {
  const { rec, str } = encodeActivity(a);
  return { owner, id: 0, rec, str, seenAt: 0, sentAt: 0 };
}

describe('createActSync', () => {
  it('publishes the emote with its sequence number', () => {
    const { deps } = fakeDeps({ emote: true });
    const sync = createActSync(fakeLink(), deps);
    sync.noteEmote('wave');
    const ent = collectOne(sync);
    const a = decodeActivity(ent.rec, ent.str);
    expect(a?.emote).toBe('wave');
    expect(a?.emoteSeq).toBe(1);
    expect(a?.mode).toBe(ACT.none);
    expect(ent.rec[0]).toBe(0);
  });

  it('publishes the rod and bobber while fishing', () => {
    const wire = { rod: 'bamboo', phase: 'wait' as const, charge: 0.5, bobber: { x: 3.21, y: 0.4, z: -7.05 } };
    const { deps } = fakeDeps({ wire });
    const sync = createActSync(fakeLink(), deps);
    const ent = collectOne(sync);
    const a = decodeActivity(ent.rec, ent.str);
    expect(a?.mode).toBe(ACT.rod);
    expect(a?.rod).toBe('bamboo');
    expect(a?.phase).toBe('wait');
    expect(a?.bobber).not.toBeNull();
    expect(Math.abs((a?.bobber?.x ?? 0) - 3.21)).toBeLessThan(0.1);
    expect(Math.abs((a?.bobber?.y ?? 0) - 0.4)).toBeLessThan(0.1);
    expect(Math.abs((a?.bobber?.z ?? 0) + 7.05)).toBeLessThan(0.1);
  });

  it('publishes the look direction only while using binoculars', () => {
    const { deps } = fakeDeps({ viewing: true });
    const sync = createActSync(fakeLink(), deps);
    const a = decodeActivity(collectOne(sync).rec, undefined);
    expect(a?.mode).toBe(ACT.scope);
    expect(Math.abs(a?.lookYaw ?? 1)).toBeLessThan(0.02);
    expect(Math.abs(a?.lookPitch ?? 1)).toBeLessThan(0.02);
  });

  it('hands mirrors to remotes.setActivity and clears removed ones', () => {
    const { deps, setActivity } = fakeDeps();
    const sync = createActSync(fakeLink(), deps);
    const act: RemoteActivity = {
      emote: 'dance', emoteSeq: 2, mode: ACT.none, rod: '', phase: 'idle', phaseT: 0, charge: 0, bobber: null,
      lookYaw: 0, lookPitch: 0,
    };
    const ch: MirrorChanges = { added: [mirror(7, act)], changed: [], removed: [] };
    sync.receive(ch, frame());
    expect(setActivity).toHaveBeenCalledTimes(1);
    expect(setActivity.mock.calls[0][0]).toBe(7);
    expect(setActivity.mock.calls[0][1]).toMatchObject({ emote: 'dance', emoteSeq: 2 });

    sync.receive({ added: [], changed: [], removed: [mirror(7, act)] }, frame());
    expect(setActivity).toHaveBeenLastCalledWith(7, null);
  });

  it('reset clears every activity it set', () => {
    const { deps, setActivity } = fakeDeps();
    const sync = createActSync(fakeLink(), deps);
    const act: RemoteActivity = {
      emote: null, emoteSeq: 0, mode: ACT.none, rod: '', phase: 'idle', phaseT: 0, charge: 0, bobber: null,
      lookYaw: 0, lookPitch: 0,
    };
    sync.receive({ added: [mirror(3, act), mirror(4, act)], changed: [], removed: [] } as MirrorChanges, frame());
    setActivity.mockClear();
    sync.reset();
    expect(setActivity).toHaveBeenCalledWith(3, null);
    expect(setActivity).toHaveBeenCalledWith(4, null);
    expect(setActivity).toHaveBeenCalledTimes(2);
    setActivity.mockClear();
    sync.reset();
    expect(setActivity).not.toHaveBeenCalled();
  });
});

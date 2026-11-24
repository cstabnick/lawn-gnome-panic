import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createRemotes } from './remotes';
import { ACT, type RemoteActivity } from './online/protocol';

const act: RemoteActivity = {
  emote: 'wave', emoteSeq: 1, mode: ACT.rod, rod: '', phase: 'idle', phaseT: 0, charge: 0, bobber: null,
  lookYaw: 0, lookPitch: 0,
} as RemoteActivity;

describe('remotes activity store', () => {
  it('stores, reads back and clears a remote activity', () => {
    const r = createRemotes(new THREE.Scene(), { myVehicle: () => null, myId: () => null });
    expect(r.activityOf(7)).toBeNull();
    r.setActivity(7, act);
    expect(r.activityOf(7)).toEqual(act);
    r.setActivity(7, null);
    expect(r.activityOf(7)).toBeNull();
  });
});

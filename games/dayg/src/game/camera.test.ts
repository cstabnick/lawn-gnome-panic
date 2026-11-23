import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createCollider } from '../world/collide';
import type { BlockoutMap } from '../world/types';
import { CAMERA, INTERIOR } from '../config';
import { thirdPersonPose, createCameraRig } from './camera';
import type { InputState } from './types';

// Inside Ivy Rows (x 0..160, z 240..400). A 10 x 10 room at x 100..110, z 300..310 with walls h 4 and a roof at y 3.8.
// A headstone at x 60..61, z 329..331 stands outside, open ground runs from x 0 to 60.
const makeMap = (): BlockoutMap => ({
  bounds: { x0: 0, x1: 560, z0: 0, z1: 520 },
  blocks: [
    { id: 'bld-t-wall-n', kind: 'wall', x0: 99.5, x1: 110.5, z0: 299.5, z1: 300, y: 0, h: 4 },
    { id: 'bld-t-wall-s', kind: 'wall', x0: 99.5, x1: 110.5, z0: 310, z1: 310.5, y: 0, h: 4 },
    { id: 'bld-t-wall-w', kind: 'wall', x0: 99.5, x1: 100, z0: 300, z1: 310, y: 0, h: 4 },
    { id: 'bld-t-wall-e', kind: 'wall', x0: 110, x1: 110.5, z0: 300, z1: 310, y: 0, h: 4 },
    { id: 'bld-t-roof', kind: 'roof', x0: 99.5, x1: 110.5, z0: 299.5, z1: 310.5, y: 3.8, h: 0.5 },
    { id: 'headstone', kind: 'plinth', x0: 60, x1: 61, z0: 329, z1: 331, y: 0, h: 1.6 },
  ],
  routes: [], pits: [], spots: [], havens: [], water: [], paths: [], props: [], containers: [],
  playerSpawn: { x: 10, y: 0, z: 250 },
});

const collider = createCollider(makeMap());
const noInput = { moveX: 0, moveZ: 0, lookX: 0, lookY: 0, view: false } as unknown as InputState;
const at = (x: number, y: number, z: number) => ({ x, y, z });

describe('thirdPersonPose', () => {
  it('keeps the full distance on open ground', () => {
    const pose = thirdPersonPose(collider, {
      target: at(30, 0, 330), yaw: 0, pitch: CAMERA.pitchDefault, crouched: false,
      maxDist: CAMERA.distance, skip: new Set(), ceilY: null,
    });
    expect(pose.dist).toBe(CAMERA.distance);
  });

  it('under the roof, ignoring it when it is skipped', () => {
    const base = { target: at(105, 0, 305), yaw: 0, pitch: 0.45, crouched: false, maxDist: INTERIOR.distance, ceilY: null };
    const skipped = thirdPersonPose(collider, { ...base, skip: new Set(['bld-t-roof']) });
    expect(skipped.dist).toBeGreaterThan(1);
    expect(collider.solidAt(skipped.x, skipped.y, skipped.z, 0, new Set(['bld-t-roof']))).toBe(false);

    // Without the skip the roof is hit. Its pull-in lies beyond INTERIOR.distance at this pitch, so this check uses maxDist 6.
    const blocked = thirdPersonPose(collider, { ...base, maxDist: 6, skip: new Set() });
    expect(blocked.dist).toBeLessThan(6);
    expect(blocked.y).toBeLessThan(3.8);   // pulled in under the roof's underside
    expect(collider.solidAt(blocked.x, blocked.y, blocked.z, 0, new Set())).toBe(false);
  });

  it('stays under the ceiling of a lower storey', () => {
    const pose = thirdPersonPose(collider, {
      target: at(105, 0, 305), yaw: 0, pitch: 0.45, crouched: false,
      maxDist: INTERIOR.distance, skip: new Set(['bld-t-roof']), ceilY: 3.0,
    });
    expect(pose.y).toBeLessThanOrEqual(2.7 + 1e-6);
  });

  it('pulls in close behind a headstone that is 0.6 gm away', () => {
    const pose = thirdPersonPose(collider, {
      target: at(59.4, 0, 330), yaw: -Math.PI / 2, pitch: CAMERA.pitchDefault, crouched: false,
      maxDist: CAMERA.distance, skip: new Set(), ceilY: null,
    });
    expect(pose.dist).toBeLessThan(INTERIOR.closeAt);
  });
});

describe('createCameraRig', () => {
  it('goes close-follow under a headstone and returns after 0.5 s on open ground', () => {
    const rig = createCameraRig(new THREE.PerspectiveCamera(), collider);
    rig.yaw = -Math.PI / 2;
    rig.update(new THREE.Vector3(59.4, 0, 330), noInput, 0.1, false);
    expect(rig.close).toBe(true);
    for (let i = 0; i < 5; i++) rig.update(new THREE.Vector3(30, 0, 330), noInput, 0.1, false);
    expect(rig.close).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import { skiPose } from './skiPose';

function fakeModel(): GnomeModel {
  return {
    object: new THREE.Group(),
    arms: { left: new THREE.Group(), right: new THREE.Group() },
    legs: { left: new THREE.Group(), right: new THREE.Group() },
    rig: new THREE.Group(),
  } as unknown as GnomeModel;
}

describe('skiPose', () => {
  it('reaches both arms forward to the handle', () => {
    const m = fakeModel();
    skiPose(m, 0.5);
    expect(m.arms.left.rotation.x).toBeLessThan(-1);
    expect(m.arms.right.rotation.x).toBeLessThan(-1);
  });

  it('bends both knees forward', () => {
    const m = fakeModel();
    skiPose(m, 0.5);
    expect(m.legs!.left.rotation.x).toBeGreaterThan(0);
    expect(m.legs!.right.rotation.x).toBeGreaterThan(0);
  });

  it('sways the hips with the lean', () => {
    const m = fakeModel();
    skiPose(m, 0.5);
    expect(m.legs!.left.rotation.z).toBeCloseTo(-0.125);
    expect(m.legs!.right.rotation.z).toBeCloseTo(-0.125);
  });

  it('works on a model without legs', () => {
    const m = fakeModel();
    delete m.legs;
    expect(() => skiPose(m, 0.5)).not.toThrow();
    expect(m.arms.left.rotation.x).toBeLessThan(-1);
  });
});

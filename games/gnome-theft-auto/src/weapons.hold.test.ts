import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createGnomeModel, type PlayerState } from '@lawn/gnome';
import { DEFAULT_LOOK } from './config';
import { createWeapons } from './weapons';
import type { Fx } from './types';

// A Fx whose every method is a no-op: the hold pose does not draw effects.
const fx = new Proxy({}, { get: () => () => undefined }) as Fx;

const IDLE: PlayerState = {
  position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0, sitting: false,
};

function setup() {
  const model = createGnomeModel(DEFAULT_LOOK);
  model.update(IDLE, 1 / 60);
  const weapons = createWeapons(new THREE.Scene(), fx);
  weapons.attachTo(model.arms.right);
  return { model, weapons };
}

describe('held gun pose', () => {
  it('puts the muzzle in front of the gnome at chest height when aiming', () => {
    const { model, weapons } = setup();
    weapons.poseArms(model, true, 0);
    const muzzle = new THREE.Vector3();
    expect(weapons.muzzleWorld(muzzle)).toBe(true);
    model.object.updateMatrixWorld(true);
    const local = model.object.worldToLocal(muzzle.clone());
    expect(local.z).toBeGreaterThan(0.3);
    expect(local.y).toBeGreaterThan(0.3);
    expect(local.y).toBeLessThan(0.9);
  });

  it('reaches the two-handed support point with the left arm, and relaxArms resets it', () => {
    const { model, weapons } = setup();
    weapons.selectGun('rifle');
    weapons.poseArms(model, true, 0);
    expect(model.arms.left.scale.y).not.toBe(1);
    weapons.relaxArms(model);
    expect(model.arms.left.scale.y).toBe(1);
  });

  it('relaxArms before any pose leaves the arm alone', () => {
    const { model, weapons } = setup();
    weapons.relaxArms(model);
    expect(model.arms.left.scale.y).toBe(1);
  });
});

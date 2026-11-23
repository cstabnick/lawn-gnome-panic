import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createGnomeModel, type PlayerState } from '@lawn/gnome';
import { buildHeld, registerPrefab } from '@lawn/prefabs';
import { ARM_LENGTH } from '@lawn/glaze';
import { DEFAULT_LOOK, GUNS, GUN_ORDER } from './config';
import { clearGunArms, GUN_POSE, isGunPrefab, isTwoHanded, muzzleWorld, placeInHand, poseGunArms } from './gunHold';

const TWO_HANDED = 'test-gun-2h';
const ONE_HANDED = 'test-gun-1h';

registerPrefab({
  id: TWO_HANDED, name: 'Test Rifle', category: 'weapon', uses: ['hold', 'shoot'],
  tags: ['test'], emoji: [], about: 'Test two-handed gun.', examine: ['A test rifle.', 'Test.', 'Test.', 'Test.'],
  grip: [0, 0.1, 0.05], pivots: { support: [0, 0.22, 0.0] }, wear: { rot: [180, 0, 0] },
  parts: [{ s: 'box', d: [0.05, 0.5, 0.06], at: [0, 0.25, -0.03], c: 'steel' }],
});
registerPrefab({
  id: ONE_HANDED, name: 'Test Pistol', category: 'weapon', uses: ['hold', 'shoot'],
  tags: ['test'], emoji: [], about: 'Test one-handed gun.', examine: ['A test pistol.', 'Test.', 'Test.', 'Test.'],
  grip: [0, 0.04, 0.05], wear: { rot: [180, 0, 0] },
  parts: [{ s: 'box', d: [0.05, 0.2, 0.06], at: [0, 0.1, -0.04], c: 'steel' }],
});

const IDLE: PlayerState = {
  position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0, sitting: false,
};

function freshModel() {
  const model = createGnomeModel(DEFAULT_LOOK);
  model.update(IDLE, 1 / 60);
  model.object.updateMatrixWorld(true);
  return model;
}

/** World-space unit direction of the holder's +y axis (its barrel). */
function barrelDir(held: THREE.Object3D): THREE.Vector3 {
  held.updateMatrixWorld(true);
  const a = held.localToWorld(new THREE.Vector3(0, 0, 0));
  const b = held.localToWorld(new THREE.Vector3(0, 1, 0));
  return b.sub(a).normalize();
}

describe('gun prefab checks', () => {
  it('recognises guns and two-handed guns', () => {
    expect(isGunPrefab(TWO_HANDED)).toBe(true);
    expect(isGunPrefab(ONE_HANDED)).toBe(true);
    expect(isGunPrefab(null)).toBe(false);
    expect(isGunPrefab('not-a-prefab')).toBe(false);
    expect(isTwoHanded(TWO_HANDED)).toBe(true);
    expect(isTwoHanded(ONE_HANDED)).toBe(false);
    expect(isTwoHanded(null)).toBe(false);
  });
});

describe('placeInHand', () => {
  it('puts the holder on the right arm with its base orientation saved', () => {
    const model = freshModel();
    const held = buildHeld(TWO_HANDED);
    const out = placeInHand(held, TWO_HANDED, model.arms.right);
    expect(out).toBe(held);
    expect(held.parent).toBe(model.arms.right);
    expect(held.userData.prefabId).toBe(TWO_HANDED);
    expect(held.userData.baseQuat).toBeInstanceOf(THREE.Quaternion);
  });
});

describe('poseGunArms', () => {
  it('aims a two-handed gun level when the pitch is zero', () => {
    const model = freshModel();
    const held = placeInHand(buildHeld(TWO_HANDED), TWO_HANDED, model.arms.right);
    poseGunArms(model, TWO_HANDED, { aiming: true, pitch: 0 }, held);
    const dir = barrelDir(held);
    expect(dir.z).toBeGreaterThan(0.95);
  });

  it('tilts the barrel up with the aim pitch', () => {
    const model = freshModel();
    const held = placeInHand(buildHeld(TWO_HANDED), TWO_HANDED, model.arms.right);
    poseGunArms(model, TWO_HANDED, { aiming: true, pitch: 0.5 }, held);
    expect(Math.abs(barrelDir(held).y - Math.sin(0.5))).toBeLessThan(0.05);
  });

  it('puts the left hand on the support point of a two-handed gun, or as near as the arm reaches', () => {
    for (const aim of [{ aiming: true, pitch: 0 }, { aiming: false, pitch: 0 }]) {
      const model = freshModel();
      const held = placeInHand(buildHeld(TWO_HANDED), TWO_HANDED, model.arms.right);
      poseGunArms(model, TWO_HANDED, aim, held);
      model.object.updateMatrixWorld(true);
      const shoulder = model.arms.left.getWorldPosition(new THREE.Vector3());
      const hand = model.arms.left.localToWorld(new THREE.Vector3(0, -0.32, 0));
      const support = held.localToWorld(new THREE.Vector3(0, 0.22 - 0.1, 0 - 0.05));
      // Hand on the shoulder-to-support line, at the support or short of it.
      const toSupport = support.clone().sub(shoulder);
      const toHand = hand.clone().sub(shoulder);
      expect(toHand.clone().normalize().dot(toSupport.clone().normalize())).toBeGreaterThan(0.999);
      expect(toHand.length()).toBeLessThanOrEqual(toSupport.length() + 1e-3);
    }
  });

  it('never stretches the left arm past its length, for every gun in every pose', () => {
    const poses = [{ aiming: false, pitch: 0 }];
    for (let p = -1.2; p <= 1.2001; p += 0.2) poses.push({ aiming: true, pitch: p });
    for (const kind of GUN_ORDER) {
      const id = GUNS[kind].prefab;
      for (const aim of poses) {
        const model = freshModel();
        const held = placeInHand(buildHeld(id), id, model.arms.right);
        poseGunArms(model, id, aim, held);
        model.object.updateMatrixWorld(true);
        // Shoulder-to-hand distance over the arm's rest length, measured in the rig's space.
        const parent = model.arms.left.parent!;
        const shoulder = parent.localToWorld(model.arms.left.position.clone());
        const hand = model.arms.left.localToWorld(new THREE.Vector3(0, -ARM_LENGTH, 0));
        const restLen = parent.localToWorld(model.arms.left.position.clone().add(new THREE.Vector3(0, ARM_LENGTH, 0))).distanceTo(shoulder);
        const ratio = hand.distanceTo(shoulder) / restLen;
        expect(ratio, `${kind} ${aim.aiming ? `aim ${aim.pitch.toFixed(1)}` : 'low-ready'}`).toBeLessThanOrEqual(1.0 + 1e-6);
        expect(model.arms.left.scale.y).toBeLessThanOrEqual(1.0 + 1e-6);
      }
    }
  });

  it('points a lowered gun forward and down when not aiming', () => {
    const model = freshModel();
    const held = placeInHand(buildHeld(TWO_HANDED), TWO_HANDED, model.arms.right);
    poseGunArms(model, TWO_HANDED, { aiming: false, pitch: 0 }, held);
    const dir = barrelDir(held);
    expect(dir.z).toBeGreaterThan(0.5);
    expect(dir.y).toBeLessThan(-0.2);
  });

  it('leaves the left arm unstretched for a one-handed gun', () => {
    const model = freshModel();
    const held = placeInHand(buildHeld(ONE_HANDED), ONE_HANDED, model.arms.right);
    poseGunArms(model, ONE_HANDED, { aiming: true, pitch: 0 }, held);
    expect(model.arms.left.scale.x).toBe(1);
    expect(model.arms.left.scale.y).toBe(1);
    expect(model.arms.left.scale.z).toBe(1);
  });

  it('does nothing for a null or non-gun prefab', () => {
    const model = freshModel();
    const before = model.arms.right.quaternion.clone();
    poseGunArms(model, null, { aiming: true, pitch: 0 }, null);
    expect(model.arms.right.quaternion.equals(before)).toBe(true);
  });

  it('exposes the tunable pose', () => {
    expect(GUN_POSE.leftStretch).toBeLessThanOrEqual(1);
  });
});

describe('clearGunArms', () => {
  it('restores the held item orientation and arm scales', () => {
    const model = freshModel();
    const held = placeInHand(buildHeld(TWO_HANDED), TWO_HANDED, model.arms.right);
    const base = (held.userData.baseQuat as THREE.Quaternion).clone();
    poseGunArms(model, TWO_HANDED, { aiming: true, pitch: 0.3 }, held);
    clearGunArms(model, held);
    expect(held.quaternion.equals(base)).toBe(true);
    expect(model.arms.left.scale.x).toBe(1);
    expect(model.arms.right.scale.x).toBe(1);
  });
});

describe('muzzleWorld', () => {
  it('uses userData.muzzle when set', () => {
    const model = freshModel();
    const held = placeInHand(buildHeld(TWO_HANDED), TWO_HANDED, model.arms.right);
    held.userData.muzzle = [0, 0.4, 0];
    const out = muzzleWorld(held, new THREE.Vector3());
    const expected = held.localToWorld(new THREE.Vector3(0, 0.4, 0));
    expect(out.distanceTo(expected)).toBeLessThan(1e-6);
  });
});

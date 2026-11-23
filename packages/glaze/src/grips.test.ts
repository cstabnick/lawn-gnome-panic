import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { ARM_LENGTH, reachArm, releaseArm, poseHandsOnGrips } from './grips';

// Seeded LCG so the "random" targets are the same on every run.
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/**
 * Where the hand ball centre sits in world space after reachArm posed the arm.
 * The arm's own scale.y (= stretch) already lengthens the hanging point, so the unscaled
 * hand point is (0, -ARM_LENGTH, 0) in the arm's local space.
 */
function handWorld(arm: THREE.Object3D, stretch: number): THREE.Vector3 {
  void stretch;
  arm.updateMatrixWorld(true);
  return arm.localToWorld(new THREE.Vector3(0, -ARM_LENGTH, 0));
}

function makeArmOn(parent: THREE.Object3D, x: number): THREE.Group {
  const arm = new THREE.Group();
  arm.position.set(x, 0.62, 0);
  parent.add(arm);
  return arm;
}

describe('reachArm', () => {
  it('straight below the shoulder: reached, stretch about 1, quaternion about identity', () => {
    const parent = new THREE.Group();
    const arm = makeArmOn(parent, 0.27);
    parent.updateMatrixWorld(true);
    const res = reachArm(arm, new THREE.Vector3(0.27, 0.62 - 0.32, 0));
    expect(res.reached).toBe(true);
    expect(res.stretch).toBeCloseTo(1, 6);
    expect(arm.quaternion.angleTo(new THREE.Quaternion())).toBeLessThan(1e-5);
  });

  it('target in front: the hand lands on it', () => {
    const parent = new THREE.Group();
    const arm = makeArmOn(parent, 0.27);
    parent.updateMatrixWorld(true);
    const target = new THREE.Vector3(0.27, 0.62, 0.32);
    const res = reachArm(arm, target);
    expect(res.reached).toBe(true);
    expect(handWorld(arm, res.stretch).distanceTo(target)).toBeLessThan(1e-4);
  });

  it('20 seeded random targets inside reach: the hand lands on each', () => {
    const rand = seeded(42);
    const parent = new THREE.Group();
    const arm = makeArmOn(parent, -0.27);
    parent.updateMatrixWorld(true);
    const pivot = new THREE.Vector3(-0.27, 0.62, 0);
    for (let i = 0; i < 20; i++) {
      // Lengths in [0.75, 1.45] x ARM_LENGTH, so the minimum-stretch clamp never applies.
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const len = ARM_LENGTH * (0.75 + 0.7 * rand());
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
      );
      const target = pivot.clone().addScaledVector(dir, len);
      const res = reachArm(arm, target);
      expect(res.reached).toBe(true);
      expect(handWorld(arm, res.stretch).distanceTo(target)).toBeLessThan(1e-4);
    }
  });

  it('target out of reach: reached false and the arm is untouched', () => {
    const parent = new THREE.Group();
    const arm = makeArmOn(parent, 0.27);
    arm.rotation.x = 0.4;
    parent.updateMatrixWorld(true);
    const quatBefore = arm.quaternion.clone();
    const scaleBefore = arm.scale.clone();
    const res = reachArm(arm, new THREE.Vector3(0.27, 0.62, 3));
    expect(res.reached).toBe(false);
    expect(res.stretch).toBe(1);
    expect(arm.quaternion.angleTo(quatBefore)).toBeLessThan(1e-9);
    expect(arm.scale.distanceTo(scaleBefore)).toBeLessThan(1e-9);
  });

  it('target 1.3 x ARM_LENGTH away: stretch 1.3 and the hand lands on it', () => {
    const parent = new THREE.Group();
    const arm = makeArmOn(parent, 0.27);
    parent.updateMatrixWorld(true);
    const target = new THREE.Vector3(0.27, 0.62 - ARM_LENGTH * 1.3, 0);
    const res = reachArm(arm, target);
    expect(res.reached).toBe(true);
    expect(res.stretch).toBeCloseTo(1.3, 6);
    expect(handWorld(arm, res.stretch).distanceTo(target)).toBeLessThan(1e-4);
  });

  it('rotated and scaled parent: the hand still lands on the world target', () => {
    const parent = new THREE.Group();
    parent.rotation.y = Math.PI / 2;
    parent.scale.set(1.1, 0.9, 1.1);
    parent.position.set(0.5, 1, -0.3);
    const arm = makeArmOn(parent, 0.27);
    parent.updateMatrixWorld(true);
    // Local offset of 0.26 from the pivot, mapped through the parent so the target is a real world point.
    const localTarget = new THREE.Vector3(0.27 + 0.1, 0.62 - 0.2, 0.15);
    const target = parent.localToWorld(localTarget.clone());
    const res = reachArm(arm, target);
    expect(res.reached).toBe(true);
    expect(handWorld(arm, res.stretch).distanceTo(target)).toBeLessThan(1e-3);
  });

  it('releaseArm puts the scale back to (1, 1, 1)', () => {
    const arm = new THREE.Group();
    arm.scale.set(0.9, 1.2, 0.9);
    releaseArm(arm);
    expect(arm.scale.equals(new THREE.Vector3(1, 1, 1))).toBe(true);
  });
});

describe('poseHandsOnGrips', () => {
  it('poses both arms; an unreachable left grip releases the left arm and reports it', () => {
    const rig = new THREE.Group();
    const left = makeArmOn(rig, 0.27);
    const right = makeArmOn(rig, -0.27);
    const world = new THREE.Group();
    const leftGrip = new THREE.Object3D();
    const rightGrip = new THREE.Object3D();
    leftGrip.position.set(0.27, 0.62, 3); // far out of reach
    rightGrip.position.set(-0.27, 0.62 - 0.2, 0.2); // in reach
    world.add(leftGrip, rightGrip);
    world.updateMatrixWorld(true);
    rig.updateMatrixWorld(true);

    left.scale.set(0.9, 1.2, 0.9); // stale stretch that must be cleared
    const out = poseHandsOnGrips(
      { left, right },
      { left: leftGrip, right: rightGrip },
    );

    expect(out.left.reached).toBe(false);
    expect(left.scale.equals(new THREE.Vector3(1, 1, 1))).toBe(true);
    expect(out.right.reached).toBe(true);
    const rightHand = handWorld(right, out.right.stretch);
    expect(rightHand.distanceTo(new THREE.Vector3(-0.27, 0.42, 0.2))).toBeLessThan(1e-4);
  });
});

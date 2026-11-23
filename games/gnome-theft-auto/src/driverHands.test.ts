import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createGnomeModel, DEFAULT_LOOK, toModelLook, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { attachLoadout, buildGlazeBody, defaultLoadout, defineMounts, type GlazeRig } from '@lawn/glaze';
import { clearHands, poseHands } from './driverHands';
import type { Vehicle } from './types';

const PREFAB = 'ride-on-mower';
const GRIP_L: [number, number, number] = [0.25, 0.7, -0.1];
const GRIP_R: [number, number, number] = [-0.25, 0.7, -0.1];

interface Fixture {
  model: GnomeModel;
  vehicle: THREE.Group;
  body: THREE.Group;
  rig: GlazeRig;
  v: Vehicle;
}

/** A fresh mower with a seated gnome whose shoulders sit ~0.3 from the grips (inside the reach band). */
function build(): Fixture {
  defineMounts(PREFAB, { steer: { pivot: 'steer', grips: [GRIP_L, GRIP_R] } });
  const body = buildGlazeBody(PREFAB, { scale: 1.5 });
  const rig = attachLoadout(body, PREFAB, defaultLoadout(0xd8342c));
  const vehicle = new THREE.Group();
  vehicle.add(body);

  const model = createGnomeModel(toModelLook(DEFAULT_LOOK));
  vehicle.add(model.object);

  // update() copies state.position into the model's object, so the seat offset goes in there.
  const state: PlayerState = {
    position: new THREE.Vector3(0, 0.15, -0.15), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0, sitting: true,
  };
  model.update(state, 1);

  const v = { rig, object: vehicle, driver: 'player', exploded: false } as unknown as Vehicle;
  return { model, vehicle, body, rig, v };
}

/** Where the hand ball of `arm` is in world space: 0.32 down the arm's own (possibly stretched) axis. */
function handWorld(arm: THREE.Object3D): THREE.Vector3 {
  arm.updateWorldMatrix(true, false);
  return arm.localToWorld(new THREE.Vector3(0, -0.32, 0));
}

function gripWorld(rig: GlazeRig, side: 'left' | 'right'): THREE.Vector3 {
  const g = rig.grips;
  if (!g) throw new Error('rig has no grips');
  return g[side].getWorldPosition(new THREE.Vector3());
}

describe('poseHands', () => {
  it('puts both hands on the grips once the blend has settled', () => {
    const { model, vehicle, rig, v } = build();
    vehicle.updateMatrixWorld(true);
    for (let i = 0; i < 3; i++) poseHands(model, v, 0, 1);
    expect(handWorld(model.arms.left).distanceTo(gripWorld(rig, 'left'))).toBeLessThan(0.02);
    expect(handWorld(model.arms.right).distanceTo(gripWorld(rig, 'right'))).toBeLessThan(0.02);
  });

  it('the hands follow the grips when the wheel turns', () => {
    const { model, vehicle, body, rig, v } = build();
    vehicle.updateMatrixWorld(true);
    for (let i = 0; i < 3; i++) poseHands(model, v, 0, 1);

    const steer = body.getObjectByName('steer');
    if (!steer) throw new Error('no steer pivot');
    steer.rotation.y = 0.6;
    vehicle.updateMatrixWorld(true);
    for (let i = 0; i < 3; i++) poseHands(model, v, 0, 1);
    expect(handWorld(model.arms.left).distanceTo(gripWorld(rig, 'left'))).toBeLessThan(0.02);
    expect(handWorld(model.arms.right).distanceTo(gripWorld(rig, 'right'))).toBeLessThan(0.02);
  });

  it('a passenger (seat 1) leaves the arms alone', () => {
    const { model, vehicle, v } = build();
    vehicle.updateMatrixWorld(true);
    const before = model.arms.left.quaternion.clone();
    poseHands(model, v, 1, 1);
    expect(model.arms.left.quaternion.equals(before)).toBe(true);
    expect(model.arms.left.scale.y).toBe(1);
  });

  it('a vehicle without a rig leaves the arms alone', () => {
    const { model, vehicle, v } = build();
    vehicle.updateMatrixWorld(true);
    const before = model.arms.right.quaternion.clone();
    v.rig = undefined;
    poseHands(model, v, 0, 1);
    expect(model.arms.right.quaternion.equals(before)).toBe(true);
    expect(model.arms.right.scale.y).toBe(1);
  });

  it('clearHands puts both arm scales back to 1', () => {
    const { model, vehicle, v } = build();
    vehicle.updateMatrixWorld(true);
    for (let i = 0; i < 3; i++) poseHands(model, v, 0, 1);
    clearHands(model);
    expect(model.arms.left.scale.toArray()).toEqual([1, 1, 1]);
    expect(model.arms.right.scale.toArray()).toEqual([1, 1, 1]);
  });

  it('a gnome too far from the grips is not moved and does not throw', () => {
    const { model, vehicle, v } = build();
    model.object.position.set(0, 0.15, 3); // set after update(), so nothing overwrites it before the test reads it
    vehicle.updateMatrixWorld(true);
    const before = model.arms.left.quaternion.clone();
    expect(() => {
      for (let i = 0; i < 3; i++) poseHands(model, v, 0, 1);
    }).not.toThrow();
    expect(model.arms.left.quaternion.equals(before)).toBe(true);
    expect(model.arms.left.scale.toArray()).toEqual([1, 1, 1]);
  });
});

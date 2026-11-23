// Wheels: swap, lift, idempotence and camber sign. Uses fake geometry, not the real prefabs. Run: npx vitest run packages/glaze/src/wheels.test.ts
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { defaultLoadout } from './loadout';
import { applyWheels, setWheelPose } from './wheels';
import type { VehicleMounts } from './types';

function fakeWheel(name: string, pos: [number, number, number], radius: number, width: number): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(pos[0], pos[1], pos[2]);
  const geometry = new THREE.CylinderGeometry(radius, radius, width);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  mesh.rotation.z = Math.PI / 2;
  group.add(mesh);
  return group;
}

function fakeRoot(): { root: THREE.Group; w0: THREE.Group; w2: THREE.Group } {
  const root = new THREE.Group();
  const w0 = fakeWheel('wheel-0', [-0.6, 0.275, -0.55], 0.275, 0.2);
  const w2 = fakeWheel('wheel-2', [0.55, 0.175, 0.6], 0.175, 0.2);
  root.add(w0, w2);
  return { root, w0, w2 };
}

const mounts: VehicleMounts = {
  width: 1.2,
  length: 2,
  height: 1,
  points: {},
  lamps: null,
  steer: null,
  panels: [],
  wheels: [
    { index: 0, pivot: 'wheel-0', front: false, side: -1, at: [-0.6, 0.275, -0.55] },
    { index: 2, pivot: 'wheel-2', front: true, side: 1, at: [0.55, 0.175, 0.6] },
  ],
};

const glazeChildren = (g: THREE.Object3D): THREE.Object3D[] => g.children.filter((c) => c.userData.glaze);

describe('applyWheels', () => {
  it('stock loadout changes nothing and returns lift 0', () => {
    const { root, w0, w2 } = fakeRoot();
    const y0 = w0.position.y;
    const before = w0.children.length;
    const r = applyWheels(root, mounts, defaultLoadout(0xd8342c));
    expect(r.lift).toBe(0);
    expect(w0.children.length).toBe(before);
    expect(w0.children.every((c) => c.visible)).toBe(true);
    expect(w0.position.y).toBe(y0);
    expect(w2.position.y).toBe(0.175);
    expect(glazeChildren(w0)).toHaveLength(0);
    expect(r.wheels[0]).toBe(w0);
    expect(r.wheels[2]).toBe(w2);
    expect(r.spinners).toEqual([]);
  });

  it('a bigger wheel lifts the pivot by the extra radius and hides the original tyre', () => {
    const { root, w0, w2 } = fakeRoot();
    const y0 = w0.position.y;
    const r = applyWheels(root, mounts, { ...defaultLoadout(0xd8342c), wheelSize: 1.4 });
    expect(w0.position.y).toBeCloseTo(y0 + 0.4 * 0.275, 6);
    expect(w2.position.y).toBeCloseTo(0.175 + 0.4 * 0.175, 6);
    expect(w0.children[0].visible).toBe(false);
    expect(glazeChildren(w0)).toHaveLength(1);
    expect(r.lift).toBeCloseTo(0.4 * 0.225, 6);
  });

  it('applying twice leaves exactly one glaze child per wheel', () => {
    const { root, w0 } = fakeRoot();
    const loadout = { ...defaultLoadout(0xd8342c), wheelSize: 1.4 };
    applyWheels(root, mounts, loadout);
    const yOnce = w0.position.y;
    const r = applyWheels(root, mounts, loadout);
    expect(glazeChildren(w0)).toHaveLength(1);
    expect(w0.position.y).toBe(yOnce);
    expect(r.lift).toBeCloseTo(0.4 * 0.225, 6);
  });

  it('going back to stock restores the originals and removes the holder', () => {
    const { root, w0 } = fakeRoot();
    const y0 = w0.position.y;
    applyWheels(root, mounts, { ...defaultLoadout(0xd8342c), wheelSize: 1.4 });
    const r = applyWheels(root, mounts, defaultLoadout(0xd8342c));
    expect(r.lift).toBe(0);
    expect(w0.children[0].visible).toBe(true);
    expect(glazeChildren(w0)).toHaveLength(0);
    expect(w0.position.y).toBe(y0);
  });

  it('a wheel group with no children is untouched and never gets a holder', () => {
    const { root } = fakeRoot();
    const empty = new THREE.Group();
    empty.name = 'wheel-1';
    empty.position.set(-0.55, 0.3, 0.6);
    root.add(empty);
    const m: VehicleMounts = {
      ...mounts,
      wheels: [...mounts.wheels, { index: 1, pivot: 'wheel-1', front: false, side: -1, at: [-0.55, 0.3, 0.6] }],
    };
    const r = applyWheels(root, m, { ...defaultLoadout(0xd8342c), wheelSize: 1.4 });
    expect(empty.children).toHaveLength(0);
    expect(empty.position.y).toBe(0.3);
    expect(r.wheels[1]).toBe(empty); // found, so returned, but never dressed
  });
});

describe('setWheelPose', () => {
  function world(wheel: THREE.Object3D, local: THREE.Vector3): THREE.Vector3 {
    wheel.updateMatrixWorld(true);
    return local.clone().applyMatrix4(wheel.matrixWorld);
  }

  it('a negative camber leans the top of both wheels toward the centre line', () => {
    const left = new THREE.Group();
    left.position.set(0.5, 0, 0);
    const right = new THREE.Group();
    right.position.set(-0.5, 0, 0);
    const parent = new THREE.Group();
    parent.add(left, right);
    setWheelPose(left, 0, 0, -0.1);
    setWheelPose(right, 0, 0, -0.1);
    const top = new THREE.Vector3(0, 1, 0);
    const lx = world(left, top).x;
    const rx = world(right, top).x;
    expect(lx).toBeLessThan(0.5); // left wheel's top moved toward x = 0
    expect(rx).toBeGreaterThan(-0.5); // right wheel's top moved toward x = 0
  });

  it('spin does not change the axle direction', () => {
    const wheel = new THREE.Group();
    const parent = new THREE.Group();
    parent.add(wheel);
    wheel.position.set(0.5, 0, 0);
    setWheelPose(wheel, 0, 0, -0.1);
    wheel.updateMatrixWorld(true);
    const axleCamberOnly = new THREE.Vector3(1, 0, 0).transformDirection(wheel.matrixWorld).clone();
    const spun = new THREE.Group();
    spun.position.set(0.5, 0, 0);
    parent.add(spun);
    setWheelPose(spun, 1.2, 0, -0.1);
    spun.updateMatrixWorld(true);
    const axleSpun = new THREE.Vector3(1, 0, 0).transformDirection(spun.matrixWorld);
    expect(axleSpun.x).toBeCloseTo(axleCamberOnly.x, 9);
    expect(axleSpun.y).toBeCloseTo(axleCamberOnly.y, 9);
    expect(axleSpun.z).toBeCloseTo(axleCamberOnly.z, 9);
  });
});

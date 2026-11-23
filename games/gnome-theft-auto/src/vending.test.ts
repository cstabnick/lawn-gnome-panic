import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import type { Fx, Vehicle, VendingSpot } from './types';
import { VENDING, canCount, canPrefabFor, createVending, kickTilt, stepTilt, type Tilt } from './vending';

function car(x: number, z: number, speed: number): Vehicle {
  return { id: 1, driver: 'player', spec: { radius: 1.4 }, x, y: 0, z, yaw: 0, speed } as unknown as Vehicle;
}

describe('vending tilt', () => {
  it('a 15 m/s hit rocks the machine up, never past maxTilt or below 0, and back upright after 3 s', () => {
    const t: Tilt = { angle: 0, rate: 0 };
    kickTilt(t, 15);
    let peak = 0;
    for (let i = 0; i < 180; i++) {
      stepTilt(t, 1 / 60);
      expect(t.angle).toBeLessThanOrEqual(VENDING.maxTilt + 1e-9);
      expect(t.angle).toBeGreaterThanOrEqual(0);
      peak = Math.max(peak, t.angle);
    }
    expect(peak).toBeGreaterThan(0.15);
    expect(t.angle).toBeLessThan(0.002);
    expect(Math.abs(t.rate)).toBeLessThan(0.01);
  });

  it('a big hit still stops at maxTilt', () => {
    const t: Tilt = { angle: 0, rate: 0 };
    kickTilt(t, 60);
    for (let i = 0; i < 30; i++) stepTilt(t, 1 / 60);
    expect(t.angle).toBeLessThanOrEqual(VENDING.maxTilt + 1e-9);
  });
});

describe('vending helpers', () => {
  it('canCount spills 3 at the threshold and 6 at the top', () => {
    expect(canCount(6)).toBe(3);
    expect(canCount(30)).toBe(6);
  });

  it('canPrefabFor picks the brand can', () => {
    expect(canPrefabFor('fizz')).toBe('gta-can-fizz');
    expect(canPrefabFor('cola')).toBe('gta-can-cola');
  });
});

describe('createVending', () => {
  function setup() {
    const scene = new THREE.Scene();
    const object = new THREE.Group();
    const spot: VendingSpot = {
      x: 0, z: 0, yaw: 0, brand: 'cola', object,
      box: { minX: -0.4, maxX: 0.4, minZ: -0.3, maxZ: 0.3, h: 1.4 },
    };
    const fx = { spark: vi.fn() } as unknown as Fx;
    const play = vi.fn();
    const onSpill = vi.fn();
    const vend = createVending(scene, [spot], fx, play, onSpill, () => 0.5);
    return { scene, object, vend, onSpill, play };
  }

  it('a car at speed hitting the machine spills cans, the machine tips and settles back exactly', () => {
    const { scene, object, vend, onSpill } = setup();
    const v = car(0, -3, 15);
    vend.update(1 / 60, [v]);
    expect(onSpill).not.toHaveBeenCalled();

    v.z = -1.5;
    const before = scene.children.length;
    vend.update(1 / 60, [v]);
    expect(onSpill).toHaveBeenCalledTimes(1);
    expect(onSpill.mock.calls[0][0]).toBe('cola');
    const cans = scene.children.length - before;
    expect(cans).toBeGreaterThanOrEqual(3);
    expect(cans).toBeLessThanOrEqual(6);

    v.speed = 0;
    v.z = -3;
    for (let i = 0; i < 3; i++) vend.update(1 / 60, [v]);
    expect(object.quaternion.angleTo(new THREE.Quaternion())).toBeGreaterThan(0.01);

    for (let i = 0; i < 300; i++) vend.update(1 / 60, [v]);
    expect(object.quaternion.angleTo(new THREE.Quaternion())).toBeLessThan(1e-3);
    expect(object.position.distanceTo(new THREE.Vector3(0, 0, 0))).toBeLessThan(1e-3);
    expect(onSpill).toHaveBeenCalledTimes(1);
  });

  it('a 3 m/s touch spills nothing', () => {
    const { vend, onSpill, play } = setup();
    const v = car(0, -3, 3);
    vend.update(1 / 60, [v]);
    v.z = -1.5;
    vend.update(1 / 60, [v]);
    expect(onSpill).not.toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
  });
});

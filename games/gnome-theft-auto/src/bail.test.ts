// Bailing out of a moving ground vehicle: the bail decision, the throw velocity, and the driverless coast to a stop.
import { describe, expect, it, vi } from 'vitest';
import { VEHICLES } from './config';
import type { Vehicle, VehicleKind, World } from './types';

vi.mock('./audio', () => ({ play: () => undefined }));
// simdrive.ts reads location.search when it loads; the test runs in node.
(globalThis as { location?: { search: string } }).location ??= { search: '' };
const { BAIL, bailVelocity, isCoasting, resetCoasting, shouldBail, startCoast, stepCoasting } = await import('./bail');
const { createSimDrive } = await import('./simdrive');

const world = { boxes: [], half: 600 } as unknown as World;
const make = (id: number, kind: VehicleKind, x: number, z: number, yaw: number, speed: number): Vehicle => ({
  id, kind, spec: VEHICLES[kind], x, y: 0, z, yaw, speed, vy: 0, driver: 'player', tint: 0, object: null, rider: null, riderLook: null,
  wheelSpin: 0, steerVis: 0, hp: 1, damage: 0, lastHit: 0,
}) as unknown as Vehicle;

describe('shouldBail', () => {
  it('needs BAIL.minSpeed or more, either direction, on a ground vehicle', () => {
    const v = make(1, 'ride-on', 0, 0, 0, 6);
    expect(shouldBail(v)).toBe(false);
    v.speed = 7;
    expect(shouldBail(v)).toBe(true);
    v.speed = -8;
    expect(shouldBail(v)).toBe(true);
    expect(BAIL.minSpeed).toBe(7);
  });

  it('is false for a flyer, a boat and an exploded vehicle', () => {
    const flyer = make(1, 'whirligig', 0, 0, 0, 20);
    flyer.spec = { ...flyer.spec, flies: true };
    expect(shouldBail(flyer)).toBe(false);
    const boat = make(2, 'ride-on', 0, 0, 0, 20);
    boat.spec = { ...boat.spec, boat: true };
    expect(shouldBail(boat)).toBe(false);
    const wreck = make(3, 'ride-on', 0, 0, 0, 20);
    wreck.exploded = true;
    expect(shouldBail(wreck)).toBe(false);
  });
});

describe('bailVelocity', () => {
  it('throws an arcade vehicle forward with the car speed, to its driver\'s left, and up', () => {
    const v = make(1, 'ride-on', 0, 0, 0, 20);
    const b = bailVelocity(v);
    expect(b.vz).toBeCloseTo(18, 1);
    expect(b.vx).toBeCloseTo(2.5, 1);
    expect(b.vy).toBeCloseTo(3.5, 5);
  });
});

describe('coasting', () => {
  it('an arcade ride-on rolls on driverless, stops, and is no longer coasting', () => {
    resetCoasting();
    const v = make(1, 'ride-on', 0, 0, 0, 20);
    startCoast(v);
    expect(v.driver).toBe('none');
    expect(isCoasting(v)).toBe(true);
    const dt = 1 / 60;
    let coasted = 0;
    let t = 0;
    while (isCoasting(v) && t < 20) {
      const z0 = v.z;
      stepCoasting([v], dt, world);
      coasted += Math.abs(v.z - z0);
      t += dt;
    }
    expect(coasted).toBeGreaterThan(3);
    expect(v.z).toBeGreaterThan(3);
    expect(isCoasting(v)).toBe(false);
    expect(v.speed).toBe(0);
    expect(t).toBeLessThan(20);
  });

  it('a vehicle on the physics model rolls on driverless, stops, and drops its sim', () => {
    resetCoasting();
    const v = make(2, 'ride-on', 0, 0, 0, 20);
    v.look = undefined;
    v.sim = createSimDrive(v);
    startCoast(v);
    const z0 = v.z;
    const dt = 1 / 60;
    let t = 0;
    while (isCoasting(v) && t < 30) {
      stepCoasting([v], dt, world);
      t += dt;
    }
    const coasted = v.z - z0;
    expect(coasted).toBeGreaterThan(3);
    expect(isCoasting(v)).toBe(false);
    expect(v.sim).toBeUndefined();
    expect(t).toBeLessThan(30);
  });

  it('startCoast then someone taking the wheel (driver set to player) removes it without touching its sim', () => {
    resetCoasting();
    const v = make(3, 'ride-on', 0, 0, 0, 12);
    v.sim = createSimDrive(v);
    const sim = v.sim;
    startCoast(v);
    v.driver = 'player';
    stepCoasting([v], 1 / 60, world);
    expect(isCoasting(v)).toBe(false);
    expect(v.sim).toBe(sim);
  });
});

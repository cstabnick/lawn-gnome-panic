import { describe, expect, it, vi } from 'vitest';
import { VEHICLES } from './config';
import { initAir, PLANE_REVERSE_FRAC, stepAir } from './craft/flight';
import type { AirBody } from './craft/model';
import type { Vehicle, World } from './types';

vi.mock('./audio', () => ({ play: () => undefined }));
(globalThis as { location?: { search: string } }).location ??= { search: '' };
const { stepVehicle } = await import('./vehicles');

const DT = 1 / 60;
const spec = VEHICLES['hedge-hopper'].air!;
const limit = PLANE_REVERSE_FRAC * spec.maxSpeed;
const ctl = (over: object = {}) => ({ throttle: 0, steer: 0, lift: 0, powered: true, ...over });

describe('fixed-wing ground reverse (flight.ts)', () => {
  it('backs up slowly on the floor and turns', () => {
    const b: AirBody = { x: 0, y: 0, z: 0, yaw: 0, speed: 0, vy: 0 };
    const st = initAir();
    for (let i = 0; i < 180; i++) stepAir(b, st, spec, ctl({ throttle: -1, steer: 1 }), { floorY: 0, water: false }, DT);
    expect(b.speed).toBeLessThan(-1);
    expect(b.speed).toBeGreaterThanOrEqual(-limit - 0.01);
    expect(b.z).toBeLessThan(0);
    expect(Math.abs(b.yaw)).toBeGreaterThan(0.05);
  });

  it('never goes below 0 in the air', () => {
    const b: AirBody = { x: 0, y: 80, z: 0, yaw: 0, speed: 0, vy: 0 };
    const st = { ...initAir(), airborne: true };
    for (let i = 0; i < 180; i++) {
      stepAir(b, st, spec, ctl({ throttle: -1 }), { floorY: 0, water: false }, DT);
      expect(b.speed).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('legacy Crop Duster (stepVehicle)', () => {
  const world = { boxes: [], half: 2000 } as unknown as World;
  const plane = (y: number) => ({ spec: VEHICLES.plane, kind: 'plane', x: 0, y, z: 0, yaw: 0, speed: 0, vy: 0, driver: 'player', steerVis: 0 }) as unknown as Vehicle;

  it('backs up slowly on the ground and turns', () => {
    const v = plane(0);
    for (let i = 0; i < 180; i++) stepVehicle(v, { steer: 1, throttle: -1, lift: 0 } as never, DT, world);
    expect(v.speed).toBeLessThan(-1);
    expect(v.speed).toBeGreaterThanOrEqual(-PLANE_REVERSE_FRAC * VEHICLES.plane.maxSpeed - 0.01);
    expect(Math.abs(v.yaw)).toBeGreaterThan(0.05);
  });

  it('never reverses in the air', () => {
    const v = plane(60);
    for (let i = 0; i < 60; i++) {
      stepVehicle(v, { steer: 0, throttle: -1, lift: 0 } as never, DT, world);
      expect(v.speed).toBeGreaterThanOrEqual(0);
    }
  });
});

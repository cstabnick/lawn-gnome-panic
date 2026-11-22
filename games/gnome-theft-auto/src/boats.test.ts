// Boat handling: buoyancy settles, thrust and steering respond, the shore stops a boat, a bridge does not.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { VEHICLES, WATER } from './config';
import { initBoat, floatHeight, stepBoat } from './boats';
import { waterAt } from './terrain';
import type { DriveControls, Vehicle, VehicleKind, World } from './types';

const boat = (kind: VehicleKind, x: number, z: number, yaw = 0): Vehicle => {
  const v = {
    id: 1, kind, spec: VEHICLES[kind], x, y: 0, z, yaw, speed: 0, vy: 0, driver: 'player', tint: 0,
    object: new THREE.Group(), rider: null, riderLook: null, wheelSpin: 0, steerVis: 0, hp: 1, damage: 0, lastHit: 0,
  } as Vehicle;
  v.boat = initBoat(v);
  v.y = floatHeight(v) ?? 0;
  return v;
};
const world = { boxes: [], half: 900 } as unknown as World;
const STILL: DriveControls = { throttle: 0, steer: 0, lift: 0 };
const FULL: DriveControls = { throttle: 1, steer: 0, lift: 0 };
const surfaceUnder = (v: Vehicle): number => waterAt(v.x, v.z)?.surface ?? NaN;
const run = (v: Vehicle, c: DriveControls, seconds: number) => {
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) stepBoat(v, c, 1 / 60, world);
};

describe('boat handling', () => {
  it('an idle gravy boat settles at surface - draft and stays level', () => {
    const v = boat('gravy-boat', -700, -680);
    run(v, STILL, 3);
    const draft = VEHICLES['gravy-boat'].draft ?? 0.25;
    expect(Math.abs(v.y - (surfaceUnder(v) - draft))).toBeLessThan(0.02);
    expect(Math.abs(v.boat!.pitch)).toBeLessThan(0.05);
    expect(Math.abs(v.boat!.roll)).toBeLessThan(0.05);
  });

  it('full throttle for 5 s moves a gravy boat more than 40 m and reaches near top speed', () => {
    const v = boat('gravy-boat', -700, -680);
    const x0 = v.x, z0 = v.z;
    run(v, FULL, 5);
    expect(Math.hypot(v.x - x0, v.z - z0)).toBeGreaterThan(40);
    expect(v.speed).toBeGreaterThanOrEqual(0.8 * VEHICLES['gravy-boat'].maxSpeed);
  });

  it('full throttle with steer right for 3 s turns it right (yaw decreases) and banks right-side down', () => {
    const v = boat('gravy-boat', -700, -680);
    const yaw0 = v.yaw;
    run(v, { throttle: 1, steer: 1, lift: 0 }, 3);
    expect(v.yaw).toBeLessThan(yaw0);
    expect(v.boat!.roll).toBeGreaterThan(0);
  });

  it('a walnut dinghy heading south stops before the south shore', () => {
    const v = boat('walnut-dinghy', -700, -600, 0);
    const draft = VEHICLES['walnut-dinghy'].draft ?? 0.25;
    let maxZ = -Infinity;
    let minDepth = Infinity;
    const steps = 30 * 60;
    for (let i = 0; i < steps; i++) {
      stepBoat(v, FULL, 1 / 60, world);
      maxZ = Math.max(maxZ, v.z);
      minDepth = Math.min(minDepth, waterAt(v.x, v.z)?.depth ?? 0);
    }
    expect(maxZ).toBeLessThanOrEqual(-556);
    expect(minDepth).toBeGreaterThanOrEqual(draft + WATER.boat.beachDepth - 0.05);
  });

  it('a gravy boat under the canal bridge keeps floating', () => {
    const v = boat('gravy-boat', 0, 230);
    expect(waterAt(v.x, v.z)).not.toBeNull();
    run(v, STILL, 3);
    expect(v.y).toBeLessThan(0);
  });
});

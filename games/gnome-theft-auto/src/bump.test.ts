// Vehicle-vehicle bumps: weight decides who gets thrown (combine vs push-bike), and a bump slides and spins the lighter one.
import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { VehicleController, qRotate, qYaw, v3 } from '@lawn/vehicle';
import { DEFAULT_MODE_ID, tuneById, vehicleConfig } from './handling';
import { VEHICLES } from './config';
import type { Vehicle, VehicleKind, World } from './types';

vi.mock('./audio', () => ({ play: () => undefined }));
const { collideVehicles, stepKnock, stepVehicle } = await import('./vehicles');

const world = { boxes: [], half: 600 } as unknown as World;
const make = (id: number, kind: VehicleKind, x: number, z: number, yaw: number, speed: number): Vehicle => ({
  id, kind, spec: VEHICLES[kind], x, y: 0, z, yaw, speed, vy: 0, driver: 'npc', tint: 0, object: null, rider: null, riderLook: null,
  wheelSpin: 0, steerVis: 0, hp: 1, damage: 0, lastHit: 0,
}) as unknown as Vehicle;

/** Run `secs` of bumping with no driver input (speed carries on as it is, like a coasting vehicle). */
function run(list: Vehicle[], secs: number): void {
  const dt = 1 / 60;
  for (let i = 0; i < secs * 60; i++) {
    for (const v of list) {
      v.x += Math.sin(v.yaw) * v.speed * dt;
      v.z += Math.cos(v.yaw) * v.speed * dt;
    }
    collideVehicles(list);
    stepKnock(list, dt, world);
  }
}

describe('bumps', () => {
  const gap = (a: VehicleKind, b: VehicleKind): number => VEHICLES[a].radius + VEHICLES[b].radius;

  it('a push-bike hitting a parked combine bounces back and the combine stays put', () => {
    const combine = make(1, 'combine', 0, 0, 0, 0);
    const bike = make(2, 'push-bike', 0, -gap('combine', 'push-bike') - 1, 0, 15);
    run([combine, bike], 0.5);
    expect(bike.speed).toBeLessThan(0);
    // 1 part bike to 6 parts combine: the combine is nudged along at a sixth of the bike's speed, no more.
    expect(combine.speed).toBeGreaterThan(0);
    expect(combine.speed).toBeLessThan(4);
  });

  it('a combine driving into a parked push-bike barely slows and throws the bike ahead of it', () => {
    const bike = make(1, 'push-bike', 0, 0, 0, 0);
    const combine = make(2, 'combine', 0, -gap('combine', 'push-bike') - 1, 0, 12);
    run([bike, combine], 0.4);
    expect(combine.speed).toBeGreaterThan(9);
    expect(bike.speed).toBeGreaterThan(combine.speed);
    expect(bike.z).toBeGreaterThan(2);
  });

  it('equal vehicles trade speed roughly evenly', () => {
    const a = make(1, 'ride-on', 0, 0, 0, 0);
    const b = make(2, 'ride-on', 0, -gap('ride-on', 'ride-on') - 0.5, 0, 12);
    run([a, b], 0.3);
    expect(Math.abs(a.speed - b.speed)).toBeLessThan(6);
    expect(b.speed).toBeLessThan(8);
    expect(a.speed).toBeGreaterThan(3);
  });

  it('a glancing hit slides and turns the lighter vehicle more than the heavier one, then it settles', () => {
    const combine = make(1, 'combine', 0, 0, 0, 0);
    const bike = make(2, 'push-bike', 3.0, -3.2, 0, 14);
    run([combine, bike], 0.6);
    expect(Math.abs(bike.yaw)).toBeGreaterThan(Math.abs(combine.yaw) * 3);
    expect(Math.abs(bike.x - 3.0)).toBeGreaterThan(0.3);
    run([combine, bike], 3);
    expect(bike.knock).toBeUndefined();
  });

  it('is finite and well-behaved when many vehicles pile into each other', () => {
    const list: Vehicle[] = [];
    const kinds: VehicleKind[] = ['push-bike', 'ride-on', 'zero-turn', 'combine'];
    for (let i = 0; i < 12; i++) list.push(make(i, kinds[i % 4], (i % 4) * 2, Math.floor(i / 4) * 2, (i * 1.3) % 6.28, 10));
    run(list, 5);
    for (const v of list) {
      expect([v.x, v.z, v.yaw, v.speed].every(Number.isFinite)).toBe(true);
      expect(Math.abs(v.speed)).toBeLessThan(40);
    }
  });

  it('two ride-ons head-on at 30 m/s each, stepped at dt 0.05, never swap their order along z', () => {
    const a = make(1, 'ride-on', 0, 0, 0, 30);
    const b = make(2, 'ride-on', 0, 6, Math.PI, 30);
    for (const v of [a, b]) v.object = { children: [] } as unknown as Vehicle['object'];
    const dt = 0.05;
    for (let i = 0; i < 60; i++) {
      for (const v of [a, b]) {
        v.x += Math.sin(v.yaw) * v.speed * dt;
        v.z += Math.cos(v.yaw) * v.speed * dt;
      }
      collideVehicles([a, b], dt);
      stepKnock([a, b], dt, world);
      expect(a.z).toBeLessThan(b.z);
    }
  });

  it('an arcade player vehicle at 40 m/s never gets past a thin wall 5 m ahead', () => {
    const wallBox = { minX: -20, maxX: 20, minZ: 5, maxZ: 5.3, h: 3 };
    const w = { boxes: [wallBox], half: 600 } as unknown as World;
    const car = make(3, 'ride-on', 0, 0, 0, 40);
    car.driver = 'player';
    car.object = { children: [] } as unknown as Vehicle['object'];
    const dt = 0.05;
    for (let i = 0; i < 20; i++) {
      stepVehicle(car, { throttle: 1, steer: 0, lift: 0 }, dt, w);
      expect(car.z).toBeLessThan(5.3);
    }
  });

  it('a player on the physics model glancing a combine stays upright, turns the right way, and does not spin wildly', () => {
    const tune = tuneById(DEFAULT_MODE_ID)!;
    const spec = VEHICLES['push-bike'];
    const ctrl = new VehicleController(vehicleConfig(spec, tune));
    // Hits the combine's right-hand front corner (the combine is at the origin, the bike comes from -z at x = +3).
    ctrl.place(v3(3.0, 0, -6), 0, 14);
    const bike = make(2, 'push-bike', 3.0, -6, 0, 14);
    bike.driver = 'player';
    bike.sim = { ctrl } as unknown as Vehicle['sim'];
    const combine = make(1, 'combine', 0, 0, 0, 0);
    const dt = 1 / 60;
    let maxTilt = 0, maxYawRate = 0, finite = true, turned = 0;
    for (let i = 0; i < 4 * 60; i++) {
      ctrl.update(dt, { steer: 0, throttle: 0, brake: 0, handbrake: 0, source: 'stick' });
      const b = ctrl.body;
      bike.x = b.pos.x; bike.z = b.pos.z; bike.yaw = qYaw(b.quat); bike.speed = ctrl.telemetry.forwardSpeed;
      const px = bike.x, pz = bike.z;
      collideVehicles([combine, bike]);
      stepKnock([combine, bike], dt, world);
      // The game carries a position push into the chassis (simdrive.ts); do the same.
      b.pos.x += bike.x - px; b.pos.z += bike.z - pz;
      maxTilt = Math.max(maxTilt, (Math.acos(Math.min(1, qRotate(b.quat, v3(0, 1, 0)).y)) * 180) / Math.PI);
      maxYawRate = Math.max(maxYawRate, Math.abs(b.angVel.y));
      finite = finite && [b.pos.x, b.pos.z, b.vel.x, b.vel.z, b.angVel.y].every(Number.isFinite);
      if (i === 90) turned = qYaw(b.quat);
    }
    expect(finite).toBe(true);
    expect(maxTilt).toBeLessThan(70);
    expect(maxYawRate).toBeLessThan(5.5);
    // Hit on its right side while moving along +z at x = 3 (the combine is to the left, at x = 0): the nose is knocked to the right, +x, so yaw goes positive.
    expect(turned).toBeGreaterThan(0);
  });
});

describe('bump damage', () => {
  // Damage uses the closing speed along the contact normal, so vehicles moving together take no damage.
  const hit = (id: number, x: number, z: number, yaw: number, speed: number, driver: Vehicle['driver'] = 'npc'): Vehicle => {
    const v = make(id, 'ride-on', x, z, yaw, speed);
    v.driver = driver;
    v.object = new THREE.Group() as unknown as Vehicle['object'];
    return v;
  };

  it('two ride-ons grazing side by side, both heading the same way, take no damage', () => {
    const a = hit(1, 0, 0, 0, 14);
    const b = hit(2, 2.5, 0, 0, 14);
    run([a, b], 1);
    expect(a.hp).toBe(1);
    expect(b.hp).toBe(1);
  });

  it('a ride-on nudging the back of one in the same lane at a 2 m/s closing speed takes no damage', () => {
    const rear = hit(1, 0, -0.5, 0, 15);
    const front = hit(2, 0, 0, 0, 13);
    run([rear, front], 1);
    expect(rear.hp).toBe(1);
    expect(front.hp).toBe(1);
  });

  it('a head-on bump at 12 m/s each damages both', () => {
    // Ride-on radius is 1.4 m each, so the bump needs them closer than 2.8 m (3 m apart would not touch).
    const a = hit(1, 0, 0, 0, 12);
    const b = hit(2, 0, 2.4, Math.PI, 12);
    run([a, b], 0.5);
    expect(a.hp).toBeLessThan(1);
    expect(b.hp).toBeLessThan(1);
  });

  it('a ride-on at 20 m/s hitting a parked one from behind damages the parked one', () => {
    const parked = hit(1, 0, 0, 0, 0, 'none');
    const fast = hit(2, 0, -2.4, 0, 20);
    run([parked, fast], 0.5);
    expect(parked.hp).toBeLessThan(1);
  });
});

describe('capsule contacts (D36)', () => {
  it('two Snail-Coaches pass in opposite lanes without contact', () => {
    const a = make(1, 'snail-coach', 0, -15, 0, 10);
    const b = make(2, 'snail-coach', 5, 15, Math.PI, 10);
    run([a, b], 3);
    expect(a.damage).toBe(0);
    expect(b.damage).toBe(0);
    expect(a.speed).toBe(10);
    expect(b.speed).toBe(10);
  });

  it('a side-by-side pair of hoa-vans 2.6 m apart do not touch', () => {
    const a = make(1, 'hoa-van', 0, 0, 0, 8);
    const b = make(2, 'hoa-van', 2.6, 0, 0, 8);
    run([a, b], 1);
    expect(a.damage).toBe(0);
    expect(a.x).toBeCloseTo(0, 5);
    expect(b.x).toBeCloseTo(2.6, 5);
    expect(a.speed).toBe(8);
  });
});

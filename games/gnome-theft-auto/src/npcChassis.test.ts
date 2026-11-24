// NPC cars on the sim chassis: corner following, independence from the player's handling preset, arcade/sim handover.
import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIRFIELD } from './config';
import { angleDiff } from './collide';
import { resetTerrainOptions, setTerrainOptions } from './terrain';
import type { Vehicle, World } from './types';

vi.mock('./audio', () => ({ play: () => undefined }));

(globalThis as { location?: { search: string } }).location ??= { search: '' };
const { createVehicle, stepVehicle } = await import('./vehicles');
const { getTune, setTune } = await import('./simdrive');
const { NPC_CHASSIS, assignNpcChassis, createNpcChassis, dropNpcChassis, npcChassisOf, stepNpcCar } = await import('./npcChassis');

const world = { boxes: [], half: 900, biomeAt: () => 'desert', airfield: AIRFIELD } as unknown as World;
const DT = 1 / 60;
const LEG = 60;

afterEach(() => resetTerrainOptions());

/** Aim point 8 m ahead on the L: 60 m along +z from the origin, then along +x. */
function aim(x: number, z: number): { tx: number; tz: number } {
  if (z < LEG && x < 1) {
    const ahead = z + 8;
    return ahead <= LEG ? { tx: 0, tz: ahead } : { tx: ahead - LEG, tz: LEG };
  }
  return { tx: x + 8, tz: LEG };
}
/** Distance from (x, z) to the L polyline (segment 1: x = 0, z 0..60; segment 2: z = 60, x 0..inf). */
function lateral(x: number, z: number): number {
  const d1 = Math.hypot(x, z < 0 ? z : z > LEG ? z - LEG : 0);
  const d2 = Math.hypot(z - LEG, x < 0 ? x : 0);
  return Math.min(d1, d2);
}

function corner(): { maxLat: number; v: Vehicle } {
  const v = createVehicle(new THREE.Scene(), 'ride-on', 0, 0, 0);
  v.driver = 'npc';
  createNpcChassis(v);
  let maxLat = 0;
  for (let i = 0; i < 60 * 20; i++) {
    const { tx, tz } = aim(v.x, v.z);
    const want = Math.atan2(tx - v.x, tz - v.z);
    const steer = Math.max(-1, Math.min(1, -angleDiff(want, v.yaw) * 2));
    const target = Math.hypot(v.x, v.z - LEG) < 20 ? 5 : 8;
    const throttle = Math.max(-1, Math.min(1, (target - v.speed) * 0.8));
    stepNpcCar(v, { throttle, steer, lift: 0 }, DT, world);
    maxLat = Math.max(maxLat, lateral(v.x, v.z));
  }
  return { maxLat, v };
}

describe('NPC chassis', () => {
  it('follows a 90-degree corner', () => {
    setTerrainOptions({ amplitude: 0, water: false });
    const { maxLat, v } = corner();
    console.log('max lateral error', maxLat.toFixed(3), 'end', v.x.toFixed(1), v.z.toFixed(1));
    expect(maxLat).toBeLessThan(3.5);
    expect(v.x).toBeGreaterThan(8);
    expect(Math.abs(v.z - LEG)).toBeLessThan(3.5);
  });

  it('ignores the player handling preset', () => {
    setTerrainOptions({ amplitude: 0, water: false });
    const saved = getTune().id;
    try {
      setTune('casual');
      const ref = corner().v;
      for (const id of ['arcade', 'drift']) {
        setTune(id);
        const v = corner().v;
        expect(Math.abs(v.x - ref.x)).toBeLessThan(1e-6);
        expect(Math.abs(v.z - ref.z)).toBeLessThan(1e-6);
        expect(Math.abs(v.yaw - ref.yaw)).toBeLessThan(1e-6);
      }
    } finally { setTune(saved); }
  });

  it('hands over between arcade and sim without a pop', () => {
    setTerrainOptions({ amplitude: 0, water: false });
    const v = createVehicle(new THREE.Scene(), 'ride-on', 0, 0, 0.4);
    v.driver = 'npc';
    for (let i = 0; i < 60; i++) {
      stepVehicle(v, { throttle: Math.max(-1, Math.min(1, (8 - v.speed) * 0.8)), steer: 0, lift: 0 }, DT, world);
    }
    expect(v.speed).toBeGreaterThan(5);
    const cmd = { throttle: 0.5, steer: 0, lift: 0 };
    stepNpcCar(v, cmd, DT, world);
    // Handover frame: assign gives the chassis at the car's own pose and speed, and the next step keeps going (the
    // controller's render pose lags one tick, so that first step may hold still: well under one frame of travel).
    let x = v.x, z = v.z, s = v.speed;
    assignNpcChassis([v], v.x, v.z);
    expect(npcChassisOf(v)).toBeDefined();
    expect(v.sim).toBeUndefined();
    expect(Math.hypot(v.x - x, v.z - z)).toBeLessThan(0.05);
    expect(Math.abs(v.speed - s)).toBeLessThan(0.5);
    stepNpcCar(v, cmd, DT, world);
    expect(Math.hypot(v.x - x, v.z - z)).toBeLessThan(s * DT * 1.2 + 0.05);
    expect(Math.abs(v.speed - s)).toBeLessThan(0.5);
    for (let i = 0; i < 30; i++) stepNpcCar(v, cmd, DT, world);
    x = v.x; z = v.z; s = v.speed;
    dropNpcChassis(v);
    expect(npcChassisOf(v)).toBeUndefined();
    stepNpcCar(v, cmd, DT, world);
    expect(Math.abs(Math.hypot(v.x - x, v.z - z) - s * DT)).toBeLessThan(0.05);
    expect(Math.abs(v.speed - s)).toBeLessThan(0.5);
  });

  it('assignNpcChassis honours maxCars and ignores cars never stepped', () => {
    setTerrainOptions({ amplitude: 0, water: false });
    const scene = new THREE.Scene();
    const cars: Vehicle[] = [];
    for (let i = 0; i < NPC_CHASSIS.maxCars + 3; i++) {
      const v = createVehicle(scene, 'ride-on', 100 + i * 3, 0, 0);
      v.driver = 'npc';
      cars.push(v);
    }
    const idle = createVehicle(scene, 'ride-on', 100, 5, 0);
    idle.driver = 'npc';
    for (const v of cars) stepNpcCar(v, { throttle: 0, steer: 0, lift: 0 }, DT, world);
    assignNpcChassis([...cars, idle], 100, 0);
    const have = cars.filter((v) => npcChassisOf(v));
    expect(have.length).toBe(NPC_CHASSIS.maxCars);
    for (let i = 0; i < NPC_CHASSIS.maxCars; i++) expect(npcChassisOf(cars[i])).toBeDefined();
    expect(npcChassisOf(idle)).toBeUndefined();
    for (const v of cars) dropNpcChassis(v);
  });

  it('1000 chassis steps timing', () => {
    setTerrainOptions({ amplitude: 0, water: false });
    const v = createVehicle(new THREE.Scene(), 'ride-on', 0, 0, 0);
    v.driver = 'npc';
    createNpcChassis(v);
    const t0 = performance.now();
    for (let i = 0; i < 1000; i++) stepNpcCar(v, { throttle: 0.5, steer: 0.1, lift: 0 }, DT, world);
    console.log('1000 steps ms', (performance.now() - t0).toFixed(1));
  });
});

// Vehicles on the terrain: a sim mower and an arcade NPC car drive over the test hill on the east highway, and the flat
// world stays byte-for-byte the same for the sim chassis.
import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VehicleController, qRotate, qYaw, v3 } from '@lawn/vehicle';
import { AIRFIELD, VEHICLES } from './config';
import { angleDiff } from './collide';
import { heightAt, resetTerrainOptions, setTerrainOptions, slopeAt, terrainProbe } from './terrain';
import type { VehicleKind, World } from './types';

vi.mock('./audio', () => ({ play: () => undefined }));

// simdrive.ts reads location.search when it loads; the test runs in node.
(globalThis as { location?: { search: string } }).location ??= { search: '' };
const { createVehicle, stepVehicle, syncVehicleMesh } = await import('./vehicles');
const { createSimDrive, mowerConfig, stepSimDrive } = await import('./simdrive');

const world = { boxes: [], half: 900, biomeAt: () => 'desert', airfield: AIRFIELD } as unknown as World;
const KIND: VehicleKind = 'ride-on';
const TARGET = { x: 620, z: 30 };
const START = { x: 470, z: 50 };
const up = (q: { x: number; y: number; z: number; w: number }) => qRotate(q as never, v3(0, 1, 0)).y;

/** Steer towards the target: returns the steer for this frame and the yaw the heading should have. */
function steerFor(x: number, z: number, yaw: number, sign: number): number {
  const want = Math.atan2(TARGET.x - x, TARGET.z - z);
  return Math.max(-1, Math.min(1, sign * 2 * angleDiff(want, yaw)));
}

afterEach(() => resetTerrainOptions());

describe('vehicles on the test hill', () => {
  it('a sim mower drives over the hill without tipping, and reaches the far side', () => {
    setTerrainOptions({ amplitude: 1, testHill: true });
    const spec = VEHICLES[KIND];
    const ctrl = new VehicleController(mowerConfig(spec), { ground: terrainProbe() });
    const yaw0 = Math.atan2(520 - START.x, 30 - START.z);
    ctrl.place(v3(START.x, heightAt(START.x, START.z), START.z), yaw0, 0);
    const dt = 1 / 60;
    let reached = false;
    let climbed = false;
    for (let i = 0; i < 60 * 60 && !reached; i++) {
      const b = ctrl.body;
      const steer = steerFor(b.pos.x, b.pos.z, qYaw(b.quat), -1);
      ctrl.update(dt, { steer, throttle: 1, brake: 0, handbrake: 0, source: 'stick' });
      expect(up(b.quat)).toBeGreaterThan(0.7);
      if (slopeAt(b.pos.x, b.pos.z) > 0.05) climbed = true;
      reached = b.pos.x > 610;
    }
    expect(reached).toBe(true);
    expect(climbed).toBe(true);
  }, 30_000);

  // simdrive.ts keeps the chassis's centre of mass at least SIM_FLOOR above the terrain (a bump stop: @lawn/vehicle has none),
  // so at top speed into the foot of the hill the short mower suspension bottoms out but never sinks into the ground.
  it('sim mower stays on top of the ground on the slope (stepSimDrive bump stop)', () => {
    setTerrainOptions({ amplitude: 1, testHill: true });
    const v = createVehicle(new THREE.Scene(), KIND, START.x, START.z, Math.atan2(520 - START.x, 30 - START.z));
    v.driver = 'player';
    const sd = createSimDrive(v);
    v.sim = sd;
    const inp = {
      moveX: 0, moveY: 1, lift: 0, jump: false, fire: false, enterExit: false, switchGun: false, reload: false,
      radio: false, camYaw: 0, camPitch: 0,
    };
    let reached = false;
    for (let i = 0; i < 60 * 60 && !reached; i++) {
      const b = sd.ctrl.body;
      inp.moveX = steerFor(b.pos.x, b.pos.z, qYaw(b.quat), -1);
      stepSimDrive(v, sd, inp, 1 / 60, world);
      // Centre of mass never below the ground; the mesh origin follows the ground within the suspension's reach.
      expect(b.pos.y - heightAt(b.pos.x, b.pos.z)).toBeGreaterThan(0.07);
      // One-sided: at top speed the mower leaves the steep foot of the hill and flies (up to ~1 m above the ground), which
      // is fine; the mesh origin must never drop more than the suspension reach below the ground.
      expect(sd.py - heightAt(sd.px, sd.pz)).toBeGreaterThan(-1);
      reached = b.pos.x > 610;
    }
    expect(reached).toBe(true);
  }, 30_000);

  it('an arcade NPC car follows the hill, stays on it and pitches nose-up going uphill', () => {
    setTerrainOptions({ amplitude: 1, testHill: true });
    const scene = new THREE.Scene();
    const yaw0 = Math.atan2(520 - START.x, 30 - START.z);
    const v = createVehicle(scene, KIND, START.x, START.z, yaw0);
    v.driver = 'npc';
    const dt = 1 / 60;
    let reached = false;
    let pitchedUp = false;
    for (let i = 0; i < 60 * 60 && !reached; i++) {
      const steer = steerFor(v.x, v.z, v.yaw, -1);
      stepVehicle(v, { throttle: 1, steer, lift: 0 }, dt, world);
      expect(Math.abs(v.y - heightAt(v.x, v.z))).toBeLessThan(0.05);
      syncVehicleMesh(v, dt);
      v.object.updateMatrixWorld(true);
      const nose = new THREE.Vector3(0, 0, 1).applyMatrix4(v.object.matrixWorld);
      const tail = new THREE.Vector3(0, 0, -1).applyMatrix4(v.object.matrixWorld);
      if (slopeAt(v.x, v.z) > 0.05 && v.speed > 1 && nose.y > tail.y) pitchedUp = true;
      reached = v.x > 610;
    }
    expect(reached).toBe(true);
    expect(pitchedUp).toBe(true);
    // Parked on the flank heading uphill (+x): the mesh tilts nose up, not level.
    v.x = 530; v.z = 30; v.yaw = Math.PI / 2; v.y = heightAt(530, 30);
    expect(heightAt(540, 30)).toBeGreaterThan(heightAt(520, 30));
    syncVehicleMesh(v, 0);
    expect(v.object.rotation.x).not.toBe(0);
    v.object.updateMatrixWorld(true);
    const nose = new THREE.Vector3(0, 0, 1).applyMatrix4(v.object.matrixWorld);
    const tail = new THREE.Vector3(0, 0, -1).applyMatrix4(v.object.matrixWorld);
    expect(nose.y).toBeGreaterThan(tail.y);
  });
});

describe('flat parity', () => {
  it('a sim mower on flat ground matches one built with the default (flat) ground probe, to 1e-9', () => {
    // The dry world: with the water carved (Epic 4) the probe takes its general path, a few 1e-5 m off flatGround.
    setTerrainOptions({ amplitude: 0, water: false });
    const run = (withProbe: boolean) => {
      const ctrl = withProbe
        ? new VehicleController(mowerConfig(VEHICLES[KIND]), { ground: terrainProbe() })
        : new VehicleController(mowerConfig(VEHICLES[KIND]));
      ctrl.place(v3(START.x, 0, START.z), 0.3, 0);
      for (let i = 0; i < 120; i++) {
        ctrl.update(1 / 60, { steer: i < 60 ? 0.3 : -0.2, throttle: 1, brake: 0, handbrake: 0, source: 'stick' });
      }
      return ctrl.body.pos;
    };
    const a = run(true);
    const b = run(false);
    expect(Math.abs(a.x - b.x)).toBeLessThan(1e-9);
    expect(Math.abs(a.y - b.y)).toBeLessThan(1e-9);
    expect(Math.abs(a.z - b.z)).toBeLessThan(1e-9);
  });
});

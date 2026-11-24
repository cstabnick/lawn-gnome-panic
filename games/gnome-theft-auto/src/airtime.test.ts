import { describe, expect, it, vi } from 'vitest';
import { VEHICLES } from './config';
import { heightAt } from './terrain';
import { STUNT_RAMPS } from './stunts';
import { attachRampGround } from './ramps';
import type { Vehicle, World } from './types';

vi.mock('./audio', () => ({ play: () => undefined }));
// simdrive.ts reads location.search when it loads; the test runs in node.
(globalThis as { location?: { search: string } }).location ??= { search: '' };
const { ARCADE_AIR, stepVehicle } = await import('./vehicles');
const { createSimDrive, stepChassis, SIM_AIR } = await import('./simdrive');

const world = { boxes: [], half: 2000 } as unknown as World;
const DT = 1 / 60;
const idle = { steer: 0, throttle: 0, brake: 0, handbrake: 0, source: 'keyboard' as const };

function fakeVehicle(): Vehicle {
  return { spec: VEHICLES['zero-turn'], x: 0, y: 0, z: 0, yaw: 0, speed: 14, vy: 0, driver: 'player', steerVis: 0 } as unknown as Vehicle;
}

/** Throw a sim car at 14 m/s forward and 6 m/s up; return the landing time and the highest rise after first touchdown. */
function launch(): { land: number; rise: number } {
  const v = fakeVehicle();
  const sd = createSimDrive(v);
  sd.ctrl.body.vel.y = 6;
  let t = 0, land = -1, base = 0, rise = 0;
  for (let i = 0; i < 4 * 60; i++) {
    stepChassis(v, sd, idle, DT, world);
    t += DT;
    const y = sd.ctrl.body.pos.y;
    if (land < 0 && t > 0.1 && sd.ctrl.telemetry.groundedWheels > 0) { land = t; base = y; }
    else if (land >= 0) rise = Math.max(rise, y - base);
  }
  return { land, rise };
}

describe('SIM_AIR', () => {
  it('lands sooner than with neutral values, and does not bounce back up', () => {
    const tuned = launch();
    const saved = { ...SIM_AIR };
    Object.assign(SIM_AIR, { airGravity: 0, landingRebound: 1, landingSettle: 0 });
    const neutral = launch();
    Object.assign(SIM_AIR, saved);
    console.log('airtime tuned', tuned, 'neutral', neutral);
    expect(tuned.land).toBeGreaterThan(0);
    expect(tuned.land).toBeLessThan(neutral.land);
    expect(tuned.rise).toBeLessThan(0.15);
  });
});

describe('ARCADE_AIR', () => {
  it('an arcade ground vehicle launched with vy 6 lands in under 0.45 s', () => {
    expect(ARCADE_AIR.gravity).toBeGreaterThan(22);
    const v = fakeVehicle();
    v.y = heightAt(0, 0);
    v.vy = 6;
    v.speed = 0;
    let t = 0;
    for (; t < 3; t += DT) {
      stepVehicle(v, { steer: 0, throttle: 0, lift: 0 } as never, DT, world);
      if (t > 0.05 && v.vy === 0 && v.y <= heightAt(v.x, v.z) + 1e-6) break;
    }
    expect(t).toBeLessThan(0.45);
  });
});

describe('ramp jump (sim)', () => {
  it('a car driven off a ramp still flies long enough to be a stunt jump', () => {
    const ramp = STUNT_RAMPS.find((r) => r.id === 'greenhouse-neon')!;
    const v = fakeVehicle();
    v.x = ramp.x; v.z = ramp.z - ramp.length / 2 - 8; v.y = heightAt(v.x, v.z); v.yaw = ramp.yaw; v.speed = 18;
    const sd = createSimDrive(v);
    attachRampGround(sd.ctrl);
    let air = 0, wasGround = true, lx = 0, lz = 0, dist = 0, maxAir = 0;
    for (let i = 0; i < 6 * 60; i++) {
      stepChassis(v, sd, { ...idle, throttle: 0.6 }, DT, world);
      const g = sd.ctrl.telemetry.groundedWheels > 0;
      if (wasGround && !g) { lx = v.x; lz = v.z; air = 0; }
      if (!g) { air += DT; dist = Math.hypot(v.x - lx, v.z - lz); maxAir = Math.max(maxAir, air); }
      wasGround = g;
    }
    console.log('SIM ramp jump air', maxAir.toFixed(2), 'dist', dist.toFixed(1));
    expect(maxAir).toBeGreaterThanOrEqual(0.65);
  });
});

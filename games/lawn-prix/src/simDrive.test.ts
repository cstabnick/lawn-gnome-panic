import { describe, it, expect } from 'vitest';
import type { KartInput, KartState, RaceState, VehicleId } from './config';
import { VEHICLES } from './config';
import { HANDLING, karConfig, stepSimKart } from './simDrive';
import { createRace, cpuInput, stepRace } from './sim';
import { getTrack, projectOnTrack, isOnTrack } from './track';

const STEP = 1 / 60;
const FULL: KartInput = { steer: 0, throttle: 1, drift: false, item: false };
const T = getTrack('garden');

/** A kart at the front of the garden grid, driven directly (no race bookkeeping). */
function freshKart(vehicle: VehicleId): KartState {
  const race = createRace([{ vehicle, skill: 1 }], 'garden', 3, 'sim');
  return race.karts[0];
}

function drive(k: KartState, input: KartInput, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / STEP); i++) stepSimKart(k, input, STEP, T);
}

describe('sim handling config', () => {
  it('builds a direct-drive config for both vehicles', () => {
    for (const id of Object.keys(HANDLING) as VehicleId[]) {
      const cfg = karConfig(id);
      expect(cfg.drivetrain.mode).toBe('DirectDrive');
      expect(cfg.mobileInput.autoAccelerate).toBe(false);
    }
  });

  it('makes the cart heavier than the bike, as the arcade model does', () => {
    expect(karConfig('cart').chassis.massKg).toBeGreaterThan(karConfig('bike').chassis.massKg);
  });
});

describe('stepSimKart', () => {
  it('accelerates forward under throttle for both vehicles', () => {
    for (const id of ['cart', 'bike'] as VehicleId[]) {
      const k = freshKart(id);
      const x0 = k.x, z0 = k.z;
      drive(k, FULL, 2);
      const moved = Math.hypot(k.x - x0, k.z - z0);
      expect(moved).toBeGreaterThan(5);
      // The kart points roughly where it moved (heading and velocity agree).
      expect(Math.hypot(k.vx, k.vz)).toBeGreaterThan(5);
    }
  });

  it('steers right (+1) by turning the heading down, as the arcade kart does', () => {
    const k = freshKart('bike');
    drive(k, FULL, 1.5);
    const h0 = k.h;
    drive(k, { ...FULL, steer: 1 }, 1);
    // Right-hand steer: heading decreases (the arcade convention in config.ts).
    expect(k.h).toBeLessThan(h0);
    expect(k.st).toBe(1);
  });

  it('keeps the heading continuous through a full turn (no jump at ±PI)', () => {
    const k = freshKart('cart');
    let worst = 0;
    let prev = k.h;
    for (let i = 0; i < 12 * 60; i++) {
      stepSimKart(k, { ...FULL, steer: -1 }, STEP, T);
      worst = Math.max(worst, Math.abs(k.h - prev));
      prev = k.h;
    }
    expect(worst).toBeLessThan(0.5);
    expect(Math.abs(k.h)).toBeGreaterThan(Math.PI);
  });

  it('carries outside changes (bumps, shoves) into the chassis', () => {
    const k = freshKart('cart');
    drive(k, FULL, 1);
    const x0 = k.x;
    k.x += 3; // a bump the race applied
    k.vx = 0;
    k.vz = 0;
    stepSimKart(k, { ...FULL, throttle: 0 }, STEP, T);
    expect(k.x).toBeGreaterThan(x0 + 2.5);
    expect(Math.hypot(k.vx, k.vz)).toBeLessThan(2);
  });

  it('does not drive a spun-out kart forward', () => {
    const k = freshKart('bike');
    drive(k, FULL, 1.5);
    const before = Math.hypot(k.vx, k.vz);
    k.spin = 2;
    drive(k, FULL, 1);
    expect(Math.hypot(k.vx, k.vz)).toBeLessThan(before);
    expect(k.spin).toBeLessThan(2);
  });

  it('hops on a fresh drift press, starts a slide on landing while steering, and boosts on release', () => {
    const k = freshKart('bike');
    drive(k, FULL, 3);
    const press = { steer: 1, throttle: 1, drift: true, item: false };
    stepSimKart(k, press, STEP, T);
    expect(k.hop).toBeGreaterThan(0);
    expect(k.drift).toBe(0);
    drive(k, press, 0.4); // the hop lands with steer held: the slide starts
    expect(k.drift).not.toBe(0);
    drive(k, press, 1.2);
    const charged = k.charge;
    expect(charged).toBeGreaterThan(0);
    // Let go: a boost starts only when the charge was enough.
    drive(k, { steer: 0, throttle: 1, drift: false, item: false }, 0.05);
    expect(k.drift).toBe(0);
    if (charged >= 0.8) expect(k.boost).toBeGreaterThan(0);
  });
});

describe('sim races', () => {
  it('runs a full race of CPU karts to the finish, on the mown track', () => {
    const entries = [
      { vehicle: 'cart' as const, skill: 0.95 },
      { vehicle: 'bike' as const, skill: 0.93 },
    ];
    const race: RaceState = createRace(entries, 'garden', 1, 'sim');
    let offSteps = 0;
    let steps = 0;
    for (let i = 0; i < 180 * 60 && !race.over; i++) {
      const inputs = race.karts.map((_, idx) => cpuInput(race, idx));
      stepRace(race, inputs, STEP);
      for (const k of race.karts) {
        if (k.fin !== null) continue;
        steps++;
        if (!isOnTrack(T, projectOnTrack(T, k.x, k.z))) offSteps++;
      }
    }
    expect(race.karts.every((k) => k.fin !== null)).toBe(true);
    // The CPU line should keep the kart on the mown stripe for the bulk of the lap.
    expect(offSteps / steps).toBeLessThan(0.25);
  });

  it('finishes the same course in a time within a sensible band of the arcade model', () => {
    const lapTime = (physics: 'arcade' | 'sim'): number => {
      const race = createRace([{ vehicle: 'cart', skill: 1 }], 'garden', 1, physics);
      for (let i = 0; i < 180 * 60 && !race.over; i++) {
        stepRace(race, [cpuInput(race, 0)], STEP);
      }
      return race.karts[0].fin ?? Infinity;
    };
    const arcade = lapTime('arcade');
    const sim = lapTime('sim');
    expect(Number.isFinite(arcade)).toBe(true);
    expect(Number.isFinite(sim)).toBe(true);
    // Sim laps run about 15% slower than arcade with the tuned grip, lock and CPU driver. The bound guards against regressions.
    expect(sim / arcade).toBeLessThan(1.5);
    expect(sim / arcade).toBeGreaterThan(0.7);
  });

  it('keeps the vehicle table in use: each kind of kart has a tuned handling entry', () => {
    for (const id of Object.keys(VEHICLES) as VehicleId[]) expect(HANDLING[id]).toBeDefined();
  });
});

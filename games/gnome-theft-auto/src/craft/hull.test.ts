// The hull regime (stepHull) on a fake water sampler: settles, thrusts, steers, stops at the shore, guards bad input.
import { describe, expect, it } from 'vitest';
import { VEHICLES } from '../config';
import type { BoatState, DriveControls } from '../types';
import { hullSpecOf, stepHull, type HullBody } from './hull';
import type { WaterSampler } from './model';

/** Water (surface 0, depth 3) inside a square of the given half-size; outside it there is no water and the bed rises. */
const pond = (half: number): WaterSampler => ({
  water: (x, z) => (Math.abs(x) < half && Math.abs(z) < half ? { surface: 0, depth: 3 } : null),
  bed: (x, z) => (Math.abs(x) < half && Math.abs(z) < half ? -3 : 0.5),
});

const spec = hullSpecOf(VEHICLES['gravy-boat']);
const STILL: DriveControls = { throttle: 0, steer: 0, lift: 0 };
const FULL: DriveControls = { throttle: 1, steer: 0, lift: 0 };
const freshState = (): BoatState => ({ pitch: 0, roll: 0, vy: 0, slip: 0, beached: false });
const freshBody = (): HullBody => ({ x: 0, y: 0, z: 0, yaw: 0, speed: 0 });

/** Step `seconds` at 60 Hz; returns how many frames the shore wall refused. */
const run = (
  body: HullBody, st: BoatState, s: typeof spec, c: DriveControls, w: WaterSampler, seconds: number,
): number => {
  let blocked = 0;
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) if (stepHull(body, st, s, c, w, 1 / 60).shoreBlocked) blocked++;
  return blocked;
};

describe('hull regime', () => {
  it('an idle hull settles at -draft after 3 s', () => {
    const body = freshBody();
    const st = freshState();
    run(body, st, spec, STILL, pond(5000), 3);
    expect(Math.abs(body.y - -spec.draft)).toBeLessThan(0.02);
  });

  it('full throttle for 8 s reaches at least 0.8 x maxSpeed and never goes above it', () => {
    const body = freshBody();
    const st = freshState();
    let top = 0;
    for (let i = 0; i < 8 * 60; i++) {
      stepHull(body, st, spec, FULL, pond(5000), 1 / 60);
      top = Math.max(top, body.speed);
    }
    expect(body.speed).toBeGreaterThanOrEqual(0.8 * spec.maxSpeed);
    expect(top).toBeLessThanOrEqual(spec.maxSpeed + 1e-9);
  });

  it('reverse is limited to reverseFrac x maxSpeed', () => {
    const body = freshBody();
    const st = freshState();
    run(body, st, spec, { throttle: -1, steer: 0, lift: 0 }, pond(5000), 8);
    expect(body.speed).toBeCloseTo(-spec.reverseFrac * spec.maxSpeed, 6);
  });

  it('steer +1 at speed decreases yaw', () => {
    const body = freshBody();
    const st = freshState();
    run(body, st, spec, { throttle: 1, steer: 1, lift: 0 }, pond(5000), 3);
    expect(body.yaw).toBeLessThan(0);
  });

  it('heading +x into a shore stops before it and reports shoreBlocked', () => {
    const body = { x: 0, y: 0, z: 0, yaw: Math.PI / 2, speed: 0 };
    const st = freshState();
    const blocked = run(body, st, spec, FULL, pond(50), 8);
    expect(blocked).toBeGreaterThan(0);
    expect(body.x).toBeLessThan(50 + spec.halfLength);
  });

  it('a spec with maxSpeed x 1.1 ends faster than stock after 8 s', () => {
    const stock = freshBody();
    const tuned = freshBody();
    run(stock, freshState(), spec, FULL, pond(5000), 8);
    run(tuned, freshState(), { ...spec, maxSpeed: spec.maxSpeed * 1.1 }, FULL, pond(5000), 8);
    expect(tuned.speed).toBeGreaterThan(stock.speed);
  });

  it('dt 0 and dt NaN leave the body and state unchanged', () => {
    for (const dt of [0, Number.NaN]) {
      const body = { x: 3, y: -0.1, z: 4, yaw: 0.5, speed: 7 };
      const st = { pitch: 0.1, roll: 0.2, vy: 0.3, slip: 0.4, beached: false };
      const result = stepHull(body, st, spec, FULL, pond(5000), dt);
      expect(result).toEqual({ shoreBlocked: false });
      expect(body).toEqual({ x: 3, y: -0.1, z: 4, yaw: 0.5, speed: 7 });
      expect(st).toEqual({ pitch: 0.1, roll: 0.2, vy: 0.3, slip: 0.4, beached: false });
    }
  });
});

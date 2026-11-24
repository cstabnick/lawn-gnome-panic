// The hull on the real wave field (waves.ts): a moored boat rides the sea without wandering, a still sea is jitter-free,
// following seas outrun head seas, a steep sea gets a boat airborne and slams it, and the same run is deterministic.
import { beforeEach, describe, expect, it } from 'vitest';
import { VEHICLES } from '../config';
import { resetWaves, setSeaState, setWaveDetail, waveDrift, waveHeight, WAVES } from '../waves';
import type { BoatState, DriveControls } from '../types';
import { hullSpecOf, stepHull, type HullBody } from './hull';
import type { WaterSampler } from './model';

const spec = hullSpecOf(VEHICLES['gravy-boat']);
const STILL: DriveControls = { throttle: 0, steer: 0, lift: 0 };
const FULL: DriveControls = { throttle: 1, steer: 0, lift: 0 };
const DT = 1 / 60;
const freshState = (): BoatState => ({ pitch: 0, roll: 0, vy: 0, slip: 0, beached: false });

/** Infinite water 5 m deep whose surface is the wave field at the clock's time, scaled by `gain` (1 = the real sea). */
function makeSampler(gain: number, clock: { t: number }): WaterSampler {
  return {
    water: (x, z) => ({ surface: gain * waveHeight(x, z, clock.t), depth: 5 }),
    bed: () => -5,
    drift: (x, z, out) => waveDrift(x, z, clock.t, out),
  };
}

interface Run {
  body: HullBody;
  st: BoatState;
  meanSpeed: number;
  airSeen: boolean;
  slamSeen: boolean;
}

/** Sail a boat from (x, z) heading yaw for `seconds` at 60 Hz on the wave field (clock starts at t0). */
function sail(x: number, z: number, yaw: number, c: DriveControls, gain: number, seconds: number, t0 = 0): Run {
  const clock = { t: t0 };
  const w = makeSampler(gain, clock);
  const body: HullBody = { x, y: -spec.draft, z, yaw, speed: 0 };
  const st = freshState();
  const steps = Math.round(seconds * 60);
  let speedSum = 0;
  let airSeen = false;
  let slamSeen = false;
  for (let i = 0; i < steps; i++) {
    clock.t = t0 + i * DT;
    stepHull(body, st, spec, c, w, DT);
    speedSum += body.speed;
    if ((st.air ?? 0) > 0) airSeen = true;
    if ((st.slam ?? 0) > 0) slamSeen = true;
  }
  return { body, st, meanSpeed: speedSum / steps, airSeen, slamSeen };
}

describe('hull on the waves', () => {
  beforeEach(() => resetWaves());

  it('a moored hull in breezy seas floats level-ish, does not sink or rise, and does not wander', () => {
    setSeaState('breezy', -1e6);
    const clock = { t: 0 };
    const w = makeSampler(1, clock);
    const body: HullBody = { x: -650, y: -spec.draft, z: -650, yaw: 0, speed: 0 };
    const st = freshState();
    const steps = 60 * 60;
    const lastFrom = steps - 30 * 60;
    let sum = 0;
    let n = 0;
    let maxAbsRoll = 0;
    for (let i = 0; i < steps; i++) {
      clock.t = i * DT;
      stepHull(body, st, spec, STILL, w, DT);
      const surface = w.water(body.x, body.z)!.surface;
      expect(Number.isFinite(body.y)).toBe(true);
      expect(body.y).toBeGreaterThanOrEqual(surface - spec.draft - 0.5);
      expect(body.y).toBeLessThanOrEqual(surface - spec.draft + 0.5);
      expect(Number.isFinite(st.pitch) && Number.isFinite(st.roll)).toBe(true);
      maxAbsRoll = Math.max(maxAbsRoll, Math.abs(st.roll));
      if (i >= lastFrom) {
        sum += body.y + spec.draft;
        n++;
      }
    }
    expect(Math.abs(sum / n)).toBeLessThan(0.1);
    expect(maxAbsRoll).toBeGreaterThan(0.002);
    expect(Math.abs(body.x - -650)).toBeLessThan(0.5);
    expect(Math.abs(body.z - -650)).toBeLessThan(0.5);
  });

  it('with waves off a floating hull is jitter-free: no vertical speed, level', () => {
    setWaveDetail('off');
    const clock = { t: 0 };
    const w = makeSampler(1, clock);
    const body: HullBody = { x: -650, y: -spec.draft, z: -650, yaw: 0, speed: 0 };
    const st = freshState();
    for (let i = 0; i < 10 * 60; i++) {
      clock.t = i * DT;
      stepHull(body, st, spec, STILL, w, DT);
    }
    expect(Math.abs(st.vy)).toBeLessThan(1e-6);
    expect(Math.abs(st.pitch)).toBeLessThan(1e-6);
    expect(Math.abs(st.roll)).toBeLessThan(1e-6);
  });

  it('in a blustery sea a following boat outruns one heading into the waves', () => {
    setSeaState('blustery', -1e6);
    const following = sail(-650, -650, WAVES.windYaw, FULL, 1, 20);
    const head = sail(-650, -650, WAVES.windYaw + Math.PI, FULL, 1, 20);
    expect(following.meanSpeed).toBeGreaterThan(head.meanSpeed);
    expect(Number.isFinite(following.meanSpeed) && Number.isFinite(head.meanSpeed)).toBe(true);
  });

  it('in a steep blustery sea a boat gets airtime and a slam on landing, with no NaN', () => {
    setSeaState('blustery', -1e6);
    // The real blustery Puddle Sea: a fast gravy boat is thrown up the wave faces (WAVE_RAMP) and hops off the crests.
    // It starts 150 m upwind of the sea's centre line and runs head-on along the sea's long axis.
    const run = sail(690 + 150, 830, -Math.PI / 2, FULL, 1, 10);
    expect(run.airSeen).toBe(true);
    expect(run.slamSeen).toBe(true);
    expect(Number.isFinite(run.body.y) && Number.isFinite(run.body.speed)).toBe(true);
  });

  it('the same run twice gives identical final pose', () => {
    setSeaState('blustery', -1e6);
    const a = sail(-650, -650, 0.3, FULL, 1, 10).body;
    resetWaves();
    setSeaState('blustery', -1e6);
    const b = sail(-650, -650, 0.3, FULL, 1, 10).body;
    expect(b.x).toBe(a.x);
    expect(b.y).toBe(a.y);
    expect(b.z).toBe(a.z);
    expect(b.yaw).toBe(a.yaw);
  });
});

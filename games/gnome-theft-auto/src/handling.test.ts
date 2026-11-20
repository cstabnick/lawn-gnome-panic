// Handling: the config builder, the per-vehicle profiles and ranges, and headless drives that every ground vehicle must survive in every mode.
import { describe, expect, it } from 'vitest';
import {
  PRESETS, TUNING_PARAMS, VehicleController, neutralTuning, qRotate, retuneDirectDrive, scaleConfig, v3, withOverrides,
  type VehicleConfig,
} from '@lawn/vehicle';
import { VEHICLES } from './config';
import {
  LEAN_CAP, LEAN_MAX, PROFILES, REFERENCE_RADIUS, TUNES, profileFor, rangeFor, riderLean, stockSetup, tuneById, vehicleConfig, clampSetup,
  type Tune,
} from './handling';
import type { VehicleKind } from './types';

const GROUND: VehicleKind[] = ['push-bike', 'ride-on', 'zero-turn', 'combine'];
const SIM_MODES: Tune[] = TUNES.filter((t) => !t.arcade);
const GROUND_AT = (kind: VehicleKind) => VEHICLES[kind];

const tiltDeg = (c: VehicleController): number => (Math.acos(Math.min(1, qRotate(c.body.quat, v3(0, 1, 0)).y)) * 180) / Math.PI;

/** Drive `kind` from `frac` of top speed: steer / handbrake for `hold` seconds after 0.5 s, then release for `after` seconds. */
function drive(kind: VehicleKind, tune: Tune, o: { frac: number; steer: number; handbrake: number; hold: number; after: number }) {
  const spec = GROUND_AT(kind);
  const c = new VehicleController(vehicleConfig(spec, tune));
  c.place(v3(0, 0, 0), 0, spec.maxSpeed * o.frac);
  let maxTilt = 0, maxRear = 0, maxSpeed = 0, finite = true;
  const total = 0.5 + o.hold + o.after;
  for (let i = 0; i < total * 60; i++) {
    const t = i / 60, on = t > 0.5 && t < 0.5 + o.hold;
    c.update(1 / 60, { steer: on ? o.steer : 0, throttle: 1, brake: 0, handbrake: on ? o.handbrake : 0, source: 'stick' });
    maxTilt = Math.max(maxTilt, tiltDeg(c));
    maxRear = Math.max(maxRear, Math.abs(c.telemetry.rearSlipAngle));
    maxSpeed = Math.max(maxSpeed, c.telemetry.speed);
    finite &&= [c.body.pos, c.body.vel, c.body.angVel].every((v) => Number.isFinite(v.x + v.y + v.z));
  }
  return { maxTilt, maxRear, maxSpeed, finite, spec };
}

describe('config builder', () => {
  // The pipeline before profiles existed: mode family -> scaled to size -> retuned to top speed and pickup -> direct drive.
  const legacy = (kind: VehicleKind, tune: Tune): VehicleConfig => {
    const spec = GROUND_AT(kind);
    let cfg = scaleConfig(withOverrides(PRESETS[tune.base], tune.over ?? {}), spec.radius / REFERENCE_RADIUS);
    cfg = retuneDirectDrive(cfg, spec.maxSpeed, spec.accel);
    return withOverrides(cfg, { drivetrain: { mode: 'DirectDrive' }, mobileInput: { autoAccelerate: false } });
  };
  for (const tune of SIM_MODES) for (const kind of GROUND) {
    it(`a neutral setup reproduces the old config: ${tune.id} / ${kind}`, () => {
      // A kind with no profile has no ranges, so the neutral setup is not clamped.
      const spec = { ...GROUND_AT(kind), kind: 'whirligig' as const };
      expect(vehicleConfig(spec, tune, neutralTuning())).toEqual(legacy(kind, tune));
    });
  }

  it('stock setups differ per vehicle and stay inside their own ranges', () => {
    for (const kind of GROUND) {
      const stock = stockSetup(kind);
      for (const p of TUNING_PARAMS) {
        const [lo, hi] = rangeFor(kind, p.id);
        expect(stock[p.id]).toBeGreaterThanOrEqual(lo);
        expect(stock[p.id]).toBeLessThanOrEqual(hi);
      }
    }
    expect(stockSetup('combine').steering).toBeLessThan(stockSetup('zero-turn').steering);
  });

  it('a garage cannot push a vehicle outside its ranges (a combine is not a drift car)', () => {
    const c = clampSetup('combine', { balance: -0.5, handbrake: 2, steering: 5 });
    expect(c.balance).toBeGreaterThanOrEqual(0.1);
    expect(c.handbrake).toBeLessThanOrEqual(1);
    expect(c.steering).toBeLessThanOrEqual(1.1);
    expect(rangeFor('zero-turn', 'balance')[0]).toBeLessThan(rangeFor('combine', 'balance')[0]);
  });

  it('every ground vehicle has a profile', () => {
    for (const kind of GROUND) expect(PROFILES[kind]).toBeDefined();
  });
});

describe('every ground vehicle survives every mode', () => {
  for (const tune of SIM_MODES) for (const kind of GROUND) {
    it(`${tune.id} / ${kind}: full lock plus handbrake at top speed does not flip or blow up`, () => {
      const r = drive(kind, tune, { frac: 1, steer: 1, handbrake: 1, hold: 3, after: 3 });
      expect(r.finite).toBe(true);
      expect(r.maxTilt).toBeLessThan(60);
      expect(r.maxSpeed).toBeLessThan(r.spec.maxSpeed * 1.3);
    });
    it(`${tune.id} / ${kind}: a hard slalom does not flip`, () => {
      const spec = GROUND_AT(kind);
      const c = new VehicleController(vehicleConfig(spec, tune));
      c.place(v3(0, 0, 0), 0, spec.maxSpeed * 0.9);
      let worst = 0;
      for (let i = 0; i < 60 * 8; i++) {
        c.update(1 / 60, { steer: Math.sin(i / 60 * 2.5) > 0 ? 1 : -1, throttle: 1, brake: 0, handbrake: 0, source: 'keyboard' });
        worst = Math.max(worst, tiltDeg(c));
      }
      expect(worst).toBeLessThan(60);
    });
  }
});

describe('vehicles feel different', () => {
  const slide = (kind: VehicleKind) => drive(kind, tuneById('casual')!, { frac: 0.7, steer: 1, handbrake: 1, hold: 1, after: 2 }).maxRear;
  it('the handbrake kicks the zero-turn tail out further than the ride-on, and the combine barely at all', () => {
    expect(slide('zero-turn')).toBeGreaterThan(slide('ride-on'));
    expect(slide('ride-on')).toBeGreaterThan(slide('combine') * 2);
  });
});

describe('rider weight shift', () => {
  const ride = profileFor('ride-on');
  it('leans the rider to the outside of a turn: a left turn (negative sideways accel) leans them right (positive)', () => {
    expect(riderLean(-14, ride)).toBeGreaterThan(0);
    expect(riderLean(14, ride)).toBeLessThan(0);
    expect(riderLean(0, ride)).toBeCloseTo(0);
  });
  it('is a subtle lean, capped', () => {
    expect(Math.abs(riderLean(14, ride))).toBeCloseTo(LEAN_MAX);
    expect(Math.abs(riderLean(1000, profileFor('push-bike')))).toBeLessThanOrEqual(LEAN_CAP);
    expect(Math.abs(riderLean(14, ride))).toBeLessThan(0.2);
  });
  it('is bigger on the bike than the combine', () => {
    expect(Math.abs(riderLean(10, profileFor('push-bike')))).toBeGreaterThan(Math.abs(riderLean(10, profileFor('combine'))));
  });
});

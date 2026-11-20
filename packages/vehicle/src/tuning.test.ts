// The tuning layer: neutral is a no-op, each knob moves the car the way its label says, ranges and limits clamp.
import { describe, expect, it } from 'vitest';
import { CASUAL, retuneDirectDrive, withOverrides } from './config';
import { VehicleController } from './controller';
import { TUNING_PARAMS, clampTuning, neutralTuning, tuneVehicle, type TuningValues } from './tuning';
import { v3 } from './math';

const car = withOverrides(CASUAL, { drivetrain: { mode: 'DirectDrive' }, mobileInput: { autoAccelerate: false } });
const BASE = { topSpeedMs: 20, accelMs2: 10 };
const stock = retuneDirectDrive(car, BASE.topSpeedMs, BASE.accelMs2);
const tune = (over: Partial<TuningValues>) => tuneVehicle(stock, over, BASE);

/** Drive at `speed` m/s, hold full right lock for 3 s, return the steady-state yaw rate (rad/s), lateral accel (m/s²) and rear slip angle (rad). */
function circle(cfg: typeof stock, speed: number): { yaw: number; lat: number; rear: number } {
  const c = new VehicleController(cfg);
  c.place(v3(0, 0, 0), 0, speed);
  for (let i = 0; i < 60; i++) c.step(1 / 60, { steer: 0, throttle: 0.35, brake: 0, handbrake: 0, source: 'stick' });
  for (let i = 0; i < 180; i++) c.step(1 / 60, { steer: 1, throttle: 0.35, brake: 0, handbrake: 0, source: 'stick' });
  return { yaw: Math.abs(c.telemetry.yawRateRight), lat: Math.abs(c.telemetry.latAccelRight), rear: Math.abs(c.telemetry.rearSlipAngle) };
}

describe('tuning knobs', () => {
  it('neutral tuning changes nothing', () => {
    expect(tuneVehicle(stock, neutralTuning(), BASE)).toEqual(stock);
    expect(tuneVehicle(stock, {}, BASE)).toEqual(stock);
  });

  it('does not touch the base config', () => {
    const before = structuredClone(stock);
    tune({ grip: 1.4, mass: 1.5, balance: 0.6 });
    expect(stock).toEqual(before);
  });

  it('clamps to the global limits, then to a vehicle range, and ignores junk', () => {
    expect(clampTuning({ grip: 9, steering: -3 }).grip).toBe(1.5);
    expect(clampTuning({ grip: 9, steering: -3 }).steering).toBe(0.5);
    expect(clampTuning({ grip: 9 }, { grip: [0.8, 1.2] }).grip).toBe(1.2);
    expect(clampTuning({ grip: 0.1 }, { grip: [0.8, 1.2] }).grip).toBe(0.8);
    expect(clampTuning({ grip: Number.NaN, balance: Infinity }).grip).toBe(1);
    expect(clampTuning({ balance: Infinity }).balance).toBe(0);
    expect(clampTuning({ balance: -4 }).balance).toBe(-0.6);
    for (const p of TUNING_PARAMS) expect(p.neutral).toBeGreaterThanOrEqual(p.min), expect(p.neutral).toBeLessThanOrEqual(p.max);
  });

  it('top speed and pickup retarget the direct drive', () => {
    const fast = tune({ topSpeed: 1.3 });
    expect(fast.drivetrain.directDrive.fixedGearRatio).toBeLessThan(stock.drivetrain.directDrive.fixedGearRatio);
    const quick = tune({ acceleration: 1.5 });
    expect(quick.drivetrain.directDrive.maxTorqueNm).toBeGreaterThan(stock.drivetrain.directDrive.maxTorqueNm * 1.4);
  });

  it('weight keeps the pickup honest (torque follows the mass)', () => {
    const heavy = tune({ mass: 1.4 });
    expect(heavy.chassis.massKg).toBeCloseTo(stock.chassis.massKg * 1.4);
    expect(heavy.drivetrain.directDrive.maxTorqueNm).toBeCloseTo(stock.drivetrain.directDrive.maxTorqueNm * 1.4, 3);
  });

  it('more grip corners faster', () => {
    const lo = circle(tune({ grip: 0.7 }), 14);
    const hi = circle(tune({ grip: 1.3 }), 14);
    expect(hi.lat).toBeGreaterThan(lo.lat);
  });

  it('negative balance lets the tail step out, positive plants it', () => {
    const loose = circle(tune({ balance: -0.5 }), 18);
    const planted = circle(tune({ balance: 0.5 }), 18);
    expect(loose.rear).toBeGreaterThan(planted.rear);
  });

  it('more steering lock turns tighter', () => {
    const small = circle(tune({ steering: 0.6, assists: 0.3 }), 9);
    const big = circle(tune({ steering: 1.5, assists: 0.3 }), 9);
    expect(big.yaw).toBeGreaterThan(small.yaw);
  });

  it('stiffer suspension rolls less in the same corner', () => {
    const roll = (cfg: typeof stock): number => {
      const c = new VehicleController(cfg);
      c.place(v3(0, 0, 0), 0, 16);
      let worst = 0;
      for (let i = 0; i < 240; i++) {
        c.step(1 / 60, { steer: i > 60 ? 1 : 0, throttle: 0.3, brake: 0, handbrake: 0, source: 'stick' });
        worst = Math.max(worst, Math.abs(c.telemetry.roll));
      }
      return worst;
    };
    expect(roll(tune({ stiffness: 1.7, comHeight: 1 }))).toBeLessThan(roll(tune({ stiffness: 0.6, comHeight: 1 })));
  });

  it('brakes shorten the stop', () => {
    const stop = (cfg: typeof stock): number => {
      const c = new VehicleController(cfg);
      c.place(v3(0, 0, 0), 0, 18);
      let t = 0;
      while (c.telemetry.speed > 0.5 && t < 20) { c.step(1 / 60, { steer: 0, throttle: 0, brake: 1, handbrake: 0, source: 'stick' }); t += 1 / 60; }
      return c.body.pos.z;
    };
    expect(stop(tune({ brakes: 1.6 }))).toBeLessThan(stop(tune({ brakes: 0.6 })));
  });

  it('driver aids scale the assist strengths and stay within 0..1', () => {
    expect(tune({ assists: 0 }).steeringAndAssists.tractionControlStrength).toBe(0);
    expect(tune({ assists: 2 }).steeringAndAssists.tractionControlStrength).toBeLessThanOrEqual(1);
    expect(tune({ assists: 2 }).steeringAndAssists.escYawDampingGain).toBeCloseTo(stock.steeringAndAssists.escYawDampingGain * 2);
  });
});

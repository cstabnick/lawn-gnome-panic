// Layer 3: one drivetrain contract, two implementations. Both return axle drive torque, reflected inertia and normalised RPM,
// so a casual game skips gears and clutch entirely and a driving game gets a six-speed box, with the chassis none the wiser.
import { clamp, lerp, smoothstep } from './math';
import type { DrivetrainConfig } from './config';

export interface DrivetrainOut {
  /** Total drive torque at the driven wheels, N·m (positive = forward). Includes engine braking / regen. */
  torque: number;
  /** Driveline inertia reflected to the wheels (sum over driven wheels), kg·m². */
  reflectedInertia: number;
  /** 0..1 of redline / max rpm, for audio and HUD. */
  normRpm: number;
  /** 0 = reverse or fixed, 1.. = forward gear (direct drive reports 1). */
  gear: number;
}

export interface Drivetrain {
  /**
   * throttle: -1..1 (negative = reverse drive). avgOmega: mean driven-wheel spin, rad/s (forward positive).
   * grounded: a driven wheel touches the road (no auto-shift in the air).
   */
  step(dt: number, throttle: number, avgOmega: number, grounded: boolean): DrivetrainOut;
  reset(): void;
}

/** Normalised torque curve of a road engine: fraction of redline -> fraction of peak torque. */
const TORQUE_RPM = [0, 0.12, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0];
const TORQUE_FRAC = [0.55, 0.7, 0.85, 0.97, 1.0, 0.97, 0.88, 0.6];
function engineCurve(rpmFrac: number): number {
  if (rpmFrac >= 1) return 0; // rev limiter
  let i = 0;
  while (i < TORQUE_RPM.length - 2 && rpmFrac > TORQUE_RPM[i + 1]) i++;
  const t = (rpmFrac - TORQUE_RPM[i]) / (TORQUE_RPM[i + 1] - TORQUE_RPM[i]);
  return lerp(TORQUE_FRAC[i], TORQUE_FRAC[i + 1], clamp(t, 0, 1));
}

const RPM_PER_RAD = 30 / Math.PI;

export function createDrivetrain(cfg: DrivetrainConfig): Drivetrain {
  return cfg.mode === 'DirectDrive' ? createDirect(cfg) : createCombustion(cfg);
}

function createDirect(cfg: DrivetrainConfig): Drivetrain {
  const d = cfg.directDrive;
  const G = d.fixedGearRatio;
  const motorInertia = 0.08 * (d.maxTorqueNm / 320);
  const efficiency = 0.92;
  return {
    reset() {},
    step(_dt, throttle, avgOmega) {
      const wm = Math.abs(avgOmega) * G;
      const rpm = wm * RPM_PER_RAD;
      const frac = rpm / d.maxRpm;
      // Base-speed torque, then constant power, then a taper to nothing at maxRpm (only while pushing in the spin direction).
      const motor = Math.min(d.maxTorqueNm, d.maxPowerW / Math.max(wm, 1));
      const pushing = throttle * avgOmega >= 0;
      // Reverse runs out at 40% of the forward top speed.
      const taper = pushing ? 1 - smoothstep(0.82, 1.0, throttle < 0 ? frac / 0.4 : frac) : 1;
      let torque = throttle * motor * taper * G * efficiency;
      // Lift-off regen: gentle drag that fades out as the wheels stop (never reverses a stopped wheel).
      const lift = 1 - clamp(Math.abs(throttle) * 4, 0, 1);
      torque -= Math.sign(avgOmega) * d.regenBrakeTorqueNm * G * lift * clamp(Math.abs(avgOmega) / 3, 0, 1);
      return { torque, reflectedInertia: motorInertia * G * G, normRpm: clamp(frac, 0, 1), gear: 1 };
    },
  };
}

function createCombustion(cfg: DrivetrainConfig): Drivetrain {
  const c = cfg.combustion;
  const REVERSE = 3.2;
  const engineInertia = 0.18 * (c.peakTorqueNm / 340);
  let gear = 0; // index into c.gears, -1 = reverse
  let shiftCut = 0;
  let rpm = c.idleRpm;
  return {
    reset() { gear = 0; shiftCut = 0; rpm = c.idleRpm; },
    step(dt, throttle, avgOmega, grounded) {
      // Reverse only when asked for it near standstill; back to first the same way.
      const stopped = Math.abs(avgOmega) < 4;
      if (throttle < -0.05 && (stopped || gear === -1)) gear = -1;
      else if (throttle > 0.05 && gear === -1 && (stopped || avgOmega > 0)) gear = 0;
      const ratio = (gear === -1 ? -REVERSE : c.gears[gear]) * c.finalDrive;
      // Pseudo-clutch: the engine never falls below idle, so launch needs no clutch model and cannot stall.
      rpm = Math.max(c.idleRpm, Math.abs(avgOmega * ratio) * RPM_PER_RAD);
      const frac = rpm / c.redlineRpm;

      shiftCut = Math.max(0, shiftCut - dt);
      if (gear >= 0 && grounded && shiftCut === 0) {
        if (rpm > c.shiftUpRpm && gear < c.gears.length - 1 && throttle > 0.3) { gear++; shiftCut = 0.15; }
        else if (rpm < c.shiftDownRpm && gear > 0) { gear--; shiftCut = 0.1; }
      }

      const demand = Math.abs(throttle);
      let tEng = demand * c.peakTorqueNm * engineCurve(frac);
      // Engine braking, but never push a wheel that is turning the wrong way for this gear.
      const wrongWay = avgOmega * Math.sign(ratio) < 0;
      const drag = wrongWay ? 0 : c.peakTorqueNm * 0.12 * clamp(frac, 0, 1) * (1 - demand);
      tEng -= drag;
      if (shiftCut > 0 && tEng > 0) tEng *= 0.1;
      const torque = tEng * ratio * c.efficiency;
      return { torque, reflectedInertia: engineInertia * ratio * ratio, normRpm: clamp(frac, 0, 1), gear: gear + 1 };
    },
  };
}

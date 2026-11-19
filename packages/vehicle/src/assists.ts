// Layer 2: driver assists. All subtractive or physically bounded: they shape the command, trim torque inside the friction
// circle or add proportional yaw damping, and never overwrite the tyre model, so the tyres stay the single source of truth.
import { clamp, deg2rad, lerp, smoothstep } from './math';
import type { VehicleConfig } from './config';

const G = 9.81;

/**
 * Largest normalised steer (0..1) the grip allows at this speed. Physical curvature limit: a = mu g, kappa = a / v²,
 * front angle = atan(L kappa). `rearSlipRatio` (rear slip angle / its peak) backs the reach off from 0.95 to 0.55 as the tail steps out.
 */
export function steerLimit(cfg: VehicleConfig, speed: number, rearSlipRatio: number): number {
  const a = cfg.steeringAndAssists;
  const c = cfg.chassis;
  const mu = 0.5 * (cfg.tires.latPacejkaFront.D + cfg.tires.latPacejkaRear.D);
  // Tall vehicles: a static rollover clamp that stays on even while sliding.
  const rollover = 0.9 * G * (c.trackWidthM / (2 * c.comHeightM));
  const aMax = Math.min(mu * G, rollover);
  const v2 = Math.max(speed * speed, 1e-3);
  const delta = Math.atan((c.wheelbaseM * aMax) / v2);
  const reach = lerp(0.95, 0.55, smoothstep(0.5, 1.1, rearSlipRatio));
  return clamp((reach * delta) / deg2rad(a.maxSteerAngleDeg), 0, 1);
}

/** Steer to add (right-positive) that points the front wheels into the slide. beta: sideslip, left-positive velocity sense. */
export function counterSteer(cfg: VehicleConfig, betaRad: number, speed: number): number {
  const k = cfg.steeringAndAssists.counterSteerAssist;
  if (k <= 0) return 0;
  const peak = deg2rad(cfg.tires.latPacejkaRear.peakAngleDeg);
  const fade = smoothstep(3, 6, speed);
  return -k * fade * clamp(betaRad / (2 * peak), -1, 1);
}

/** Target yaw rate (rad/s, right-positive) of a bicycle with an understeer term, for the given front steer angle (right-positive). */
export function targetYawRate(cfg: VehicleConfig, steerRad: number, forwardSpeed: number): number {
  const L = cfg.chassis.wheelbaseM;
  const K = cfg.steeringAndAssists.escStabilityFactorKstab;
  return (forwardSpeed * Math.tan(steerRad)) / (L * (1 + K * forwardSpeed * forwardSpeed));
}

/**
 * Yaw torque about world up (counter-clockwise from above positive) that damps the error between measured and target yaw rate.
 * Both rates right-positive. Bounded to a fraction of what the tyres could ever deliver.
 */
export function escTorque(cfg: VehicleConfig, yawRateRight: number, targetRight: number, forwardSpeed: number): number {
  const gain = cfg.steeringAndAssists.escYawDampingGain;
  if (gain <= 0 || forwardSpeed < 2) return 0;
  const cap = cfg.chassis.massKg * G * cfg.chassis.wheelbaseM * 0.25;
  const fade = clamp((forwardSpeed - 2) / 4, 0, 1);
  return clamp(gain * (yawRateRight - targetRight) * fade, -cap, cap);
}

/** Friction-circle TCS: the most drive torque a wheel may take while keeping its lateral force. Blended by the TCS strength. */
export function tcsCap(muPeak: number, fz: number, fyNow: number, radius: number): number {
  const fx = Math.sqrt(Math.max(0, (muPeak * fz) ** 2 - fyNow * fyNow));
  return fx * radius * 1.1;
}

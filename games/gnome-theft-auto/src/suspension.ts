// Body suspension maths: three damped springs (heave, pitch, roll) that move a vehicle's body over its wheels.
// Pure maths: no three.js, no DOM. vehicles.ts feeds it the vehicle's motion each frame and hands the result to GlazeRig.setSuspension.
// Sign conventions (same as SuspensionState in @lawn/glaze): heave + = body up; pitch + = nose up; roll + = right side down; pitch and roll in radians.
import { SUSPENSION } from './config';

export interface SuspensionBody {
  heave: number;
  vHeave: number;
  pitch: number;
  vPitch: number;
  roll: number;
  vRoll: number;
  /** Last frame's inputs. NaN until the first step, which copies the inputs in so the first frame does not spike. */
  lastSpeed: number;
  lastGroundY: number;
  lastYaw: number;
}

export interface SuspensionInput {
  dt: number;
  speed: number;
  yaw: number;
  groundY: number;
  grounded: boolean;
  /** Lowrider hop progress, 0..1 (0 = not hopping). */
  hop: number;
}

export interface SuspensionOutput { heave: number; pitch: number; roll: number }

/** Largest frame step integrated in one call; longer frames are clamped to it. */
const MAX_DT = 1 / 20;
/** Substep length: keeps the explicit integrator stable for every tuning in config.ts. */
const SUBSTEP = 1 / 120;

export function createSuspension(): SuspensionBody {
  return {
    heave: 0, vHeave: 0, pitch: 0, vPitch: 0, roll: 0, vRoll: 0,
    lastSpeed: NaN, lastGroundY: NaN, lastYaw: NaN,
  };
}

const finite = (n: number): number => (Number.isFinite(n) ? n : 0);
const clampTo = (n: number, limit: number): number => Math.max(-limit, Math.min(limit, n));

/** Shortest signed angle from `from` to `to`, in (-PI, PI]. */
function angleDelta(from: number, to: number): number {
  const d = to - from;
  return d - 2 * Math.PI * Math.round(d / (2 * Math.PI));
}

/** One spring-damper axis: x'' = k (target - x) - c x'. Stops dead at its limit. */
function springAxis(x: number, v: number, target: number, k: number, c: number, h: number, limit: number): [number, number] {
  const nv = v + (k * (target - x) - c * v) * h;
  const nx = x + nv * h;
  if (Math.abs(nx) > limit) return [Math.sign(nx) * limit, 0];
  return [nx, nv];
}

/**
 * Advance the suspension by one frame and write the body's heave, pitch and roll into `out`.
 * dt <= 0 leaves the state where it is (no integration, no NaN). Finite differences use the real dt; integration uses dt clamped to 1/20.
 */
export function stepSuspension(b: SuspensionBody, input: SuspensionInput, out: SuspensionOutput): void {
  const speed = finite(input.speed);
  const yaw = finite(input.yaw);
  const groundY = finite(input.groundY);
  const dt = finite(input.dt);

  // The first call only records the inputs.
  if (Number.isNaN(b.lastSpeed)) b.lastSpeed = speed;
  if (Number.isNaN(b.lastGroundY)) b.lastGroundY = groundY;
  if (Number.isNaN(b.lastYaw)) b.lastYaw = yaw;

  if (dt > 0) {
    const grounded = input.grounded;
    const accel = (speed - b.lastSpeed) / dt;
    const yawRate = angleDelta(b.lastYaw, yaw) / dt;
    const dy = groundY - b.lastGroundY;

    // Forcing: braking (accel < 0) pulls the nose down, cornering rolls the body to the outside, a rise squashes it down.
    // Airborne, the speed, turn and ground terms are off and the body springs back to rest.
    const targetPitch = grounded ? clampTo(accel * SUSPENSION.accelToPitch, SUSPENSION.maxPitch) : 0;
    const targetRoll = grounded ? clampTo(yawRate * speed * SUSPENSION.latToRoll, SUSPENSION.maxRoll) : 0;
    if (grounded) b.vHeave += (-dy * SUSPENSION.bumpToHeave / dt) * 0.02;
    const targetHeave = clampTo(SUSPENSION.hopLift * Math.max(0, Math.min(1, finite(input.hop))), SUSPENSION.maxHeave);

    const dtc = Math.min(dt, MAX_DT);
    const steps = Math.max(1, Math.ceil(dtc / SUBSTEP));
    const h = dtc / steps;
    for (let i = 0; i < steps; i++) {
      [b.heave, b.vHeave] = springAxis(b.heave, b.vHeave, targetHeave, SUSPENSION.springHeave, SUSPENSION.dampHeave, h, SUSPENSION.maxHeave);
      [b.pitch, b.vPitch] = springAxis(b.pitch, b.vPitch, targetPitch, SUSPENSION.springPitch, SUSPENSION.dampPitch, h, SUSPENSION.maxPitch);
      [b.roll, b.vRoll] = springAxis(b.roll, b.vRoll, targetRoll, SUSPENSION.springRoll, SUSPENSION.dampRoll, h, SUSPENSION.maxRoll);
    }
    b.lastSpeed = speed;
    b.lastGroundY = groundY;
    b.lastYaw = yaw;
  }

  out.heave = clampTo(b.heave, SUSPENSION.maxHeave);
  out.pitch = clampTo(b.pitch, SUSPENSION.maxPitch);
  out.roll = clampTo(b.roll, SUSPENSION.maxRoll);
}

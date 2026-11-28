// Visual body roll per vehicle kind (FX04, D31): soft cars roll onto their outside springs in a turn, two-wheelers bank into
// it. Visual only: it reads the vehicle's motion and never touches the chassis physics. vehicles.ts syncVehicleMesh applies
// `bank` to the whole vehicle (about its forward axis) and adds `shell` to the glaze rig's suspension roll.
//
// The lean comes from sideways acceleration (the same source as the rider's weight shift in simdrive.ts): the sim's
// telemetry when the vehicle has a chassis, otherwise speed x yaw rate. The angle follows a critically damped spring
// towards its target, so it swings in and settles rather than snapping.
import type { Vehicle } from './types';
import { LEAN_FULL_ACCEL, profileFor } from './handling';
import { angleDiff } from './collide';
import { aboveGround } from './terrain';

export interface BodyRoll {
  /** Whole-vehicle roll about its forward axis, radians, + = leans to the vehicle's right (three.js local rotation.z). */
  bank: number;
  /** Added to the glaze rig's suspension roll, radians, + = right side down (the same sense as SuspensionOutput.roll). */
  shell: number;
}

/** Cars without a sprung shell may only tip this far (radians), so their wheels never visibly lift. */
const RIGID_CAP = 0.06;
/** Natural rate of the roll spring, rad/s (critically damped: settles in about a second without overshoot). */
const SPRING_RATE = 6;
/** Sideways acceleration smoothing, per second. */
const ACCEL_RATE = 8;
/** Airborne above this height over ground (m), the body is level. */
const AIRBORNE_CLEARANCE = 0.15;
/** Largest frame step fed to the spring, so a hitch cannot blow it up. */
const MAX_STEP = 0.1;

interface State {
  prevYaw: number;
  /** Smoothed sideways acceleration, m/s^2, + = towards the vehicle's right. */
  accel: number;
  /** Current roll angle, radians, + = leans to the right. */
  angle: number;
  /** Roll angular velocity, radians/s. */
  vel: number;
  out: BodyRoll;
}

const ZERO: BodyRoll = { bank: 0, shell: 0 };
const states = new WeakMap<Vehicle, State>();

/** Advance this vehicle's body roll by one frame (called once per frame from syncVehicleMesh, dt > 0). */
export function stepBodyRoll(v: Vehicle, dt: number): void {
  let s = states.get(v);
  if (!s) {
    s = { prevYaw: v.yaw, accel: 0, angle: 0, vel: 0, out: { bank: 0, shell: 0 } };
    states.set(v, s);
  }
  const roll = profileFor(v.kind).roll ?? 0;
  const limit = Math.abs(roll);

  const raw = v.sim ? v.sim.ctrl.telemetry.latAccelRight : (-angleDiff(v.yaw, s.prevYaw) / dt) * v.speed;
  s.prevYaw = v.yaw;
  s.accel += (raw - s.accel) * Math.min(1, ACCEL_RATE * dt);

  const grounded = v.sim ? v.sim.ctrl.telemetry.groundedWheels > 0 : aboveGround(v.x, v.y, v.z) <= AIRBORNE_CLEARANCE;
  const parked = v.driver === 'none' && v.speed === 0;
  const k = Math.max(-1, Math.min(1, s.accel / LEAN_FULL_ACCEL));
  const target = roll === 0 || v.spec.flies || v.spec.boat || !grounded || parked ? 0 : -k * roll;

  const h = Math.min(dt, MAX_STEP);
  s.vel += (SPRING_RATE * SPRING_RATE * (target - s.angle) - 2 * SPRING_RATE * s.vel) * h;
  s.angle += s.vel * h;
  if (s.angle > limit) { s.angle = limit; s.vel = 0; }
  else if (s.angle < -limit) { s.angle = -limit; s.vel = 0; }

  if (roll < 0) s.out = { bank: s.angle, shell: 0 }; // two-wheelers: the whole bike banks, the rider goes with it
  else if (v.rig) s.out = { bank: 0, shell: s.angle }; // a soft car with a sprung glaze shell rolls on its springs
  else s.out = { bank: Math.max(-RIGID_CAP, Math.min(RIGID_CAP, s.angle)), shell: 0 };
}

/** The vehicle's current body roll (zeros when it has none). Do not mutate the result. */
export function bodyRollOf(v: Vehicle): Readonly<BodyRoll> {
  return states.get(v)?.out ?? ZERO;
}

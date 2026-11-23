// The water regime of the handling model: a pure boat-hull step (plain data in, mutated body out). boats.ts stepBoat delegates here.
import { WATER } from '../config';
import type { BoatState, DriveControls, VehicleSpec } from '../types';
import type { HullSpec, WaterSampler } from './model';

/** A boat's hull numbers from its spec and WATER.boat (untuned). */
export function hullSpecOf(spec: VehicleSpec): HullSpec {
  return {
    maxSpeed: spec.maxSpeed, accel: spec.accel, turnRate: spec.turnRate, draft: spec.draft ?? 0.25,
    halfLength: spec.radius * 0.8, halfBeam: spec.radius * 0.4, reverseFrac: 0.4,
    drag: WATER.boat.drag, sideGrip: WATER.boat.sideGrip, rudderSpeed: WATER.boat.rudderSpeed,
    buoyancy: WATER.boat.buoyancy, heaveDamp: WATER.boat.heaveDamp, beachDepth: WATER.boat.beachDepth,
    planePitch: 0.06, heelRoll: 0.12, slipGain: 0.15,
  };
}

/** The part of a Vehicle the hull step moves (a Vehicle satisfies it). */
export interface HullBody { x: number; y: number; z: number; yaw: number; speed: number }

/** One step of a hull: heave, attitude, thrust, rudder, slip and the shore wall. Mutates `body` and `st`. No box collisions. */
export function stepHull(
  body: HullBody, st: BoatState, spec: HullSpec, c: DriveControls, w: WaterSampler, dt: number,
): { shoreBlocked: boolean } {
  if (!(dt > 0)) return { shoreBlocked: false };
  dt = Math.min(dt, 0.1);
  const start = {
    x: body.x, y: body.y, z: body.z, yaw: body.yaw, speed: body.speed,
    vy: st.vy, pitch: st.pitch, roll: st.roll, slip: st.slip,
  };

  const draft = spec.draft;
  const hl = spec.halfLength;
  const hb = spec.halfBeam;
  const speedFrac = spec.maxSpeed > 0 ? body.speed / spec.maxSpeed : 0;
  const fx = Math.sin(body.yaw), fz = Math.cos(body.yaw);
  const rx = -Math.cos(body.yaw), rz = Math.sin(body.yaw);

  // Heave: float at the mean of four water surfaces (a missing sample counts as the centre's surface).
  const centre = w.water(body.x, body.z);
  const base = centre?.surface ?? w.bed(body.x, body.z);
  const surfaceAt = (x: number, z: number): number => w.water(x, z)?.surface ?? base;
  const sBow = surfaceAt(body.x + fx * hl, body.z + fz * hl);
  const sStern = surfaceAt(body.x - fx * hl, body.z - fz * hl);
  const sLeft = surfaceAt(body.x - rx * hb, body.z - rz * hb);
  const sRight = surfaceAt(body.x + rx * hb, body.z + rz * hb);
  if (centre) {
    const ty = (sBow + sStern + sLeft + sRight) / 4 - draft;
    st.vy += ((ty - body.y) * spec.buoyancy - st.vy * spec.heaveDamp) * dt;
    body.y += st.vy * dt;
  } else {
    // On land: sit on the ground.
    st.vy = 0;
    body.y += (w.bed(body.x, body.z) - body.y) * (1 - Math.exp(-4 * dt));
  }

  // Attitude: pitch + = bow up, roll + = right side down; ease towards the targets.
  const targetPitch = Math.atan2(sBow - sStern, 2 * hl) + spec.planePitch * speedFrac;
  const targetRoll = Math.atan2(sLeft - sRight, 2 * hb) + spec.heelRoll * c.steer * speedFrac;
  const k = 1 - Math.exp(-4 * dt);
  st.pitch += (targetPitch - st.pitch) * k;
  st.roll += (targetRoll - st.roll) * k;

  // Beached: too little water under the hull.
  const curDepthUnder = (centre?.depth ?? 0) - draft;
  st.beached = curDepthUnder < spec.beachDepth;

  // Thrust and drag.
  if (c.throttle > 0) {
    body.speed = Math.min(spec.maxSpeed, body.speed + spec.accel * c.throttle * dt);
  } else if (c.throttle < 0) {
    body.speed = Math.max(-spec.reverseFrac * spec.maxSpeed, body.speed + spec.accel * c.throttle * dt);
  } else {
    body.speed *= Math.pow(spec.drag, dt);
  }

  // Rudder: yaw_rate is the signed turn rate this frame (steer +1 = right = yaw decreases).
  const yawRate = -c.steer * spec.turnRate * Math.min(1, Math.abs(body.speed) / spec.rudderSpeed) * Math.sign(body.speed || 1);
  body.yaw += yawRate * dt;

  // Sideways slip: turning throws the hull outward; grip bleeds it off.
  st.slip += body.speed * yawRate * spec.slipGain * dt;
  st.slip *= Math.exp(-spec.sideGrip * dt);

  // Move. The shore is a wall: a step into shallower water than the boat is in now is refused.
  const nx = body.x + (fx * body.speed + rx * st.slip) * dt;
  const nz = body.z + (fz * body.speed + rz * st.slip) * dt;
  const nextDepthUnder = (w.water(nx, nz)?.depth ?? 0) - draft;
  let shoreBlocked = false;
  if (nextDepthUnder < spec.beachDepth && nextDepthUnder <= curDepthUnder) {
    body.speed *= 0.3;
    st.slip = 0;
    shoreBlocked = true;
  } else {
    body.x = nx;
    body.z = nz;
  }

  // Non-finite guard: put the start values back and stop the hull.
  if (!(Number.isFinite(body.x) && Number.isFinite(body.y) && Number.isFinite(body.z) && Number.isFinite(body.yaw)
    && Number.isFinite(body.speed) && Number.isFinite(st.vy) && Number.isFinite(st.pitch)
    && Number.isFinite(st.roll) && Number.isFinite(st.slip))) {
    body.x = start.x; body.y = start.y; body.z = start.z; body.yaw = start.yaw;
    body.speed = 0;
    st.vy = 0;
    st.pitch = start.pitch; st.roll = start.roll;
    st.slip = 0;
    return { shoreBlocked: false };
  }
  return { shoreBlocked };
}

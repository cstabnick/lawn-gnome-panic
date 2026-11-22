// Boat physics (Wild World Epic 4): a small buoyancy-and-thrust hull model, not @lawn/vehicle (that one models wheels).
// Floats four points on waterAt, steers with a rudder, slips sideways, and treats the shore as a wall.
import { WATER } from './config';
import { bedAt, waterAt } from './terrain';
import { pushOutOfBoxes, clampToWorld } from './collide';
import type { BoatState, DriveControls, Vehicle, World } from './types';

/** True for a boat (spec.boat). */
export function isBoat(v: Vehicle): boolean {
  return v.spec.boat === true;
}

/** Where the hull's keel (the prefab's y = 0) floats at its position: surface - draft. Null where there is no water. */
export function floatHeight(v: Vehicle): number | null {
  const w = waterAt(v.x, v.z);
  return w ? w.surface - (v.spec.draft ?? 0.25) : null;
}

/** A fresh float state (vehicles.ts createVehicle calls it for every boat). */
export function initBoat(_v: Vehicle): BoatState {
  return { pitch: 0, roll: 0, vy: 0, slip: 0, beached: false };
}

/** One step of a boat: driven (player, npc, police) or idle (controls all 0). Moves v.x/z/y/yaw/speed and v.boat. */
export function stepBoat(v: Vehicle, c: DriveControls, dt: number, world: World): void {
  const b = (v.boat ??= initBoat(v));
  const draft = v.spec.draft ?? 0.25;
  const hl = v.spec.radius * 0.8; // half length
  const hb = v.spec.radius * 0.4; // half beam
  const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
  const rx = -Math.cos(v.yaw), rz = Math.sin(v.yaw);

  // Heave: float at the mean of four water surfaces (a missing sample counts as the centre's surface).
  const centre = waterAt(v.x, v.z);
  const base = centre?.surface ?? bedAt(v.x, v.z);
  const surfaceAt = (x: number, z: number): number => waterAt(x, z)?.surface ?? base;
  const sBow = surfaceAt(v.x + fx * hl, v.z + fz * hl);
  const sStern = surfaceAt(v.x - fx * hl, v.z - fz * hl);
  const sLeft = surfaceAt(v.x - rx * hb, v.z - rz * hb);
  const sRight = surfaceAt(v.x + rx * hb, v.z + rz * hb);
  if (centre) {
    const ty = (sBow + sStern + sLeft + sRight) / 4 - draft;
    b.vy += ((ty - v.y) * WATER.boat.buoyancy - b.vy * WATER.boat.heaveDamp) * dt;
    v.y += b.vy * dt;
  } else {
    // On land: sit on the ground.
    b.vy = 0;
    v.y += (bedAt(v.x, v.z) - v.y) * (1 - Math.exp(-4 * dt));
  }

  // Attitude: pitch + = bow up, roll + = right side down; ease towards the targets.
  const speedFrac = v.speed / v.spec.maxSpeed;
  const targetPitch = Math.atan2(sBow - sStern, 2 * hl) + 0.06 * speedFrac;
  const targetRoll = Math.atan2(sLeft - sRight, 2 * hb) + 0.12 * c.steer * speedFrac;
  const k = 1 - Math.exp(-4 * dt);
  b.pitch += (targetPitch - b.pitch) * k;
  b.roll += (targetRoll - b.roll) * k;

  // Beached: too little water under the hull.
  const curDepthUnder = (centre?.depth ?? 0) - draft;
  b.beached = curDepthUnder < WATER.boat.beachDepth;

  // Thrust and drag.
  if (c.throttle > 0) {
    v.speed = Math.min(v.spec.maxSpeed, v.speed + v.spec.accel * c.throttle * dt);
  } else if (c.throttle < 0) {
    v.speed = Math.max(-0.4 * v.spec.maxSpeed, v.speed + v.spec.accel * c.throttle * dt);
  } else {
    v.speed *= Math.pow(WATER.boat.drag, dt);
  }

  // Rudder: yaw_rate is the signed turn rate this frame (steer +1 = right = yaw decreases).
  const yawRate = -c.steer * v.spec.turnRate * Math.min(1, Math.abs(v.speed) / WATER.boat.rudderSpeed) * Math.sign(v.speed || 1);
  v.yaw += yawRate * dt;

  // Sideways slip: turning throws the hull outward; grip bleeds it off.
  b.slip += v.speed * yawRate * 0.15 * dt;
  b.slip *= Math.exp(-WATER.boat.sideGrip * dt);

  // Move. The shore is a wall: a step into shallower water than the boat is in now is refused.
  const nx = v.x + (fx * v.speed + rx * b.slip) * dt;
  const nz = v.z + (fz * v.speed + rz * b.slip) * dt;
  const nextDepthUnder = (waterAt(nx, nz)?.depth ?? 0) - draft;
  if (nextDepthUnder < WATER.boat.beachDepth && nextDepthUnder <= curDepthUnder) {
    v.speed *= 0.3;
    b.slip = 0;
  } else {
    v.x = nx;
    v.z = nz;
  }

  // Collide with tall boxes (bridge decks are not boxes, so boats pass under) and the world edge.
  const pushed = pushOutOfBoxes(v.x, v.z, v.spec.radius, world.boxes, v.y);
  const clamped = clampToWorld(pushed.x, pushed.z, world.half, v.spec.radius);
  v.x = clamped.x;
  v.z = clamped.z;
  if (pushed.hit || clamped.hit) v.speed *= 0.35;
}

/** Step every boat nobody drives (driver 'none'), so parked boats bob and drift to a stop. app.ts calls it each frame. */
export function stepIdleBoats(vehicles: readonly Vehicle[], dt: number, world: World): void {
  for (const v of vehicles) {
    if (v.spec.boat && v.driver === 'none' && !v.exploded) stepBoat(v, { throttle: 0, steer: 0, lift: 0 }, dt, world);
  }
}

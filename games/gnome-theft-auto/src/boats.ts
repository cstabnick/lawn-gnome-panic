// Boat physics (Wild World Epic 4): a small buoyancy-and-thrust hull model, not @lawn/vehicle (that one models wheels).
// Floats four points on waterAt, steers with a rudder, slips sideways, and treats the shore as a wall.
// The hull maths lives in craft/hull.ts (stepHull, a pure function); this file wires it to the world.
import { bedAt, waterAt } from './terrain';
import { pushOutOfBoxes, clampToWorld } from './collide';
import { hullSpecOf, stepHull } from './craft/hull';
import { applyHullTune } from './craft/tuning';
import { getCraftTune } from './craft/craftTuneStore';
import type { WaterSampler } from './craft/model';
import { waveDrift, waveTime } from './waves';
import type { BoatState, DriveControls, Vehicle, World } from './types';

const SAMPLER: WaterSampler = {
  water: (x, z) => waterAt(x, z),
  bed: bedAt,
  drift: (x, z, out) => waveDrift(x, z, waveTime(), out),
};

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
  const base = hullSpecOf(v.spec);
  const spec = v.driver === 'player' ? applyHullTune(base, getCraftTune(v.kind)) : base;
  stepHull(v, b, spec, c, SAMPLER, dt);

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

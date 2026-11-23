// Bailing out of a moving ground vehicle: the gnome is thrown into a ragdoll (player.ts throwFrom) and the vehicle rolls on
// driverless with its momentum until it coasts to a stop. STUB: lane B epic 2 fills in the bodies; the signatures are final.
import type { Vehicle, World } from './types';

/** Tuning for bailing out. */
export const BAIL = {
  /** A ground vehicle moving at least this fast (m/s, either direction) throws the gnome instead of the normal exit sequence. */
  minSpeed: 7,
} as const;

/** True when getting out of `v` now should be a bail: a ground vehicle (not a flyer, not a boat), not exploded, |speed| >= BAIL.minSpeed. */
export function shouldBail(v: Vehicle): boolean {
  void v;
  return false;
}

/** The world velocity (m/s) the gnome is thrown with when bailing out of `v`. */
export function bailVelocity(v: Vehicle): { vx: number; vy: number; vz: number } {
  void v;
  return { vx: 0, vy: 0, vz: 0 };
}

/** The driver has just left `v` while it moves: from now on it rolls on driverless (v.driver is set to 'none') and stepCoasting steps it. */
export function startCoast(v: Vehicle): void {
  v.driver = 'none';
  v.speed = 0;
  v.sim = undefined;
}

/** True while `v` is coasting after a bail. */
export function isCoasting(v: Vehicle): boolean {
  void v;
  return false;
}

/** Step every coasting vehicle one frame with no controls; a vehicle stops coasting when it has rolled to a stop or someone took it. */
export function stepCoasting(vehicles: readonly Vehicle[], dt: number, world: World): void {
  void vehicles; void dt; void world;
}

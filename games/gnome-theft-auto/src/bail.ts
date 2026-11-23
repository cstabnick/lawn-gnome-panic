// Bailing out of a moving ground vehicle: the gnome is thrown into a ragdoll (player.ts throwFrom) and the vehicle rolls on
// driverless with its momentum until it coasts to a stop.
import type { InputState, Vehicle, World } from './types';
import { stepVehicle } from './vehicles';
import { stepSimDrive } from './simdrive';
import { checkSink } from './swim';

/** Tuning for bailing out. */
export const BAIL = {
  /** A ground vehicle moving at least this fast (m/s, either direction) throws the gnome instead of the normal exit sequence. */
  minSpeed: 7,
  /** Share of the car's ground velocity the gnome keeps when thrown. */
  carry: 0.9,
  /** Upward kick of the throw, m/s. */
  upKick: 3.5,
  /** Sideways kick to the driver's left, m/s. */
  sideKick: 2.5,
  /** A coasting vehicle slower than this (m/s) has stopped. */
  stopSpeed: 0.4,
  /** A coasting vehicle is stopped after this many seconds whatever its speed. */
  maxCoast: 30,
} as const;

/** Vehicles rolling on driverless after a bail: vehicle -> seconds coasted. */
const coasting = new Map<Vehicle, number>();

/** No controls: the coasting car is stepped with nothing held. */
const NEUTRAL: InputState = {
  moveX: 0, moveY: 0, lift: 0, jump: false, fire: false, enterExit: false, switchGun: false,
  reload: false, radio: false, camYaw: 0, camPitch: 0,
};

/** True when getting out of `v` now should be a bail: a ground vehicle (not a flyer, not a boat), not exploded, |speed| >= BAIL.minSpeed. */
export function shouldBail(v: Vehicle): boolean {
  return !v.spec.flies && !v.spec.boat && !v.exploded && !v.sunk && Math.abs(v.speed) >= BAIL.minSpeed;
}

/** The world velocity (m/s) the gnome is thrown with when bailing out of `v`. */
export function bailVelocity(v: Vehicle): { vx: number; vy: number; vz: number } {
  let gx: number, gz: number;
  if (v.sim) {
    gx = v.sim.ctrl.body.vel.x;
    gz = v.sim.ctrl.body.vel.z;
  } else {
    gx = Math.sin(v.yaw) * v.speed + (v.slideX ?? 0);
    gz = Math.cos(v.yaw) * v.speed + (v.slideZ ?? 0);
  }
  // The driver's left is (cos yaw, -sin yaw).
  return {
    vx: gx * BAIL.carry + Math.cos(v.yaw) * BAIL.sideKick,
    vy: BAIL.upKick,
    vz: gz * BAIL.carry - Math.sin(v.yaw) * BAIL.sideKick,
  };
}

/** The driver has just left `v` while it moves: from now on it rolls on driverless (v.driver is set to 'none') and stepCoasting steps it. */
export function startCoast(v: Vehicle): void {
  v.driver = 'none';
  v.boostActive = false;
  coasting.set(v, 0);
}

/** True while `v` is coasting after a bail. */
export function isCoasting(v: Vehicle): boolean {
  return coasting.has(v);
}

/** Step every coasting vehicle one frame with no controls; a vehicle stops coasting when it has rolled to a stop or someone took it. */
export function stepCoasting(vehicles: readonly Vehicle[], dt: number, world: World): void {
  void vehicles; // the coasting set is the source of truth; the list is accepted for symmetry with the other steppers.
  for (const [v, t] of coasting) {
    if (v.driver !== 'none' || v.exploded || v.sunk) {
      coasting.delete(v);
      continue;
    }
    if (v.sim) {
      stepSimDrive(v, v.sim, NEUTRAL, dt, world);
      checkSink(v);
    } else {
      stepVehicle(v, { throttle: 0, steer: 0, lift: 0 }, dt, world);
    }
    const time = t + dt;
    if (Math.abs(v.speed) < BAIL.stopSpeed || time > BAIL.maxCoast) {
      v.speed = 0;
      v.sim = undefined;
      coasting.delete(v);
    } else {
      coasting.set(v, time);
    }
  }
}

/** Forget every coasting vehicle (for tests). */
export function resetCoasting(): void {
  coasting.clear();
}

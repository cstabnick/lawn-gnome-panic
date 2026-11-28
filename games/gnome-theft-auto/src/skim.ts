// Skimming (E27, L114 "allow player to drive over water on jumps"; lore ruling R-179): a ground vehicle that reaches deep
// water fast (off a jump, or just at speed) skips across it like a flat stone: no engine drive, speed bleeding away,
// a hop and a spray every so often, until it is too slow and drops in. Then the old rules take over: deep water sinks it
// (swim.ts checkSink), shallow water soaks it (waterlog.ts). Fords shallower than SKIM.minDepth are never skimmed.
// Pure: no three.js, no DOM. Both drive models call it: vehicles.ts stepOther (arcade) and simdrive.ts stepChassis (sim).
import { waterAt } from './terrain';
import type { Vehicle } from './types';

/** Tuning. Speeds are horizontal m/s. */
export const SKIM = {
  /** Water shallower than this (m) is a ford: driven through as before, never skimmed. */
  minDepth: 0.6,
  /** A vehicle arriving over deep water at least this fast starts skimming. */
  enterSpeed: 13,
  /** A skimming vehicle slower than this drops in (the skim ends). */
  keepSpeed: 7,
  /** Speed multiplier per second while skimming (speed *= dragPerS ** dt). No engine drive while skimming. */
  dragPerS: 0.6,
  /** Seconds between hops while skimming. */
  hopEvery: 0.45,
  /** Hop launch speed upward = hopVy * horizontal speed, at most hopVyMax (m/s). */
  hopVy: 0.12,
  hopVyMax: 3.5,
  /** Horizontal speed kept on each hop (0..1). */
  hopKeep: 0.94,
  /** The underside may be this far below the surface (m) and still start or keep a skim (waves, a nose dip). */
  slack: 0.15,
  /** Steering authority while skimming (0..1 of normal). */
  steer: 0.5,
} as const;

export type SkimEvent = 'start' | 'bounce' | 'end';

/** Per-vehicle skim state, on Vehicle.skim. */
export interface SkimState {
  active: boolean;
  /** Seconds since the skim started. */
  t: number;
  /** Horizontal metres covered since the skim started. */
  dist: number;
  /** Hops so far. */
  bounces: number;
  /** Seconds until the next hop. */
  hopT: number;
  /** What happened on the last step (null: nothing). The 'end' frame keeps t, dist and bounces of the finished skim. */
  event: SkimEvent | null;
}

/** The water surface a vehicle can skim on at (x, z): the surface where the water is at least SKIM.minDepth deep, else null. */
export function skimSurfaceAt(x: number, z: number): number | null {
  const w = waterAt(x, z);
  return w && w.depth >= SKIM.minDepth ? w.surface : null;
}

/**
 * One frame of skim logic for ground vehicle `v` (callers skip boats, flyers, sunk and exploded vehicles):
 * `hSpeed` = its horizontal speed (m/s), `underY` = the height of its underside (arcade: v.y; sim: chassis centre minus
 * ride height), `moved` = horizontal metres moved this frame. Starts, keeps or ends v.skim and sets v.skim.event.
 * Returns true while the vehicle is skimming after this frame (the caller then floors it on the water surface,
 * cuts its throttle, applies the drag and, on a 'bounce' event, the hop).
 */
export function stepSkim(v: Vehicle, hSpeed: number, underY: number, moved: number, dt: number): boolean {
  const sk = v.skim ?? (v.skim = { active: false, t: 0, dist: 0, bounces: 0, hopT: 0, event: null });
  sk.event = null;
  const surface = skimSurfaceAt(v.x, v.z);
  if (!sk.active) {
    if (surface !== null && hSpeed >= SKIM.enterSpeed && underY >= surface - SKIM.slack) {
      sk.active = true; sk.t = 0; sk.dist = 0; sk.bounces = 0; sk.hopT = SKIM.hopEvery; sk.event = 'start';
    }
    return sk.active;
  }
  if (surface === null || hSpeed < SKIM.keepSpeed || underY < surface - SKIM.slack - 0.5) {
    sk.active = false; sk.event = 'end';
    return false;
  }
  sk.t += dt;
  sk.dist += moved;
  if (underY - surface <= 0.1) {
    sk.hopT -= dt;
    if (sk.hopT <= 0) { sk.hopT += SKIM.hopEvery; sk.bounces++; sk.event = 'bounce'; }
  }
  return true;
}

/** Upward launch speed (m/s) for a hop at horizontal speed `hSpeed`. */
export function hopVelocity(hSpeed: number): number {
  return Math.min(SKIM.hopVyMax, SKIM.hopVy * Math.abs(hSpeed));
}

/** End a skim at once (a respawn, a repair, a teleport). */
export function clearSkim(v: Vehicle): void {
  if (v.skim) { v.skim.active = false; v.skim.event = null; }
}

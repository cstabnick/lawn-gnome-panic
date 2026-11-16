// The swipe-to-bowl gesture and the keyboard power meter, as pure maths (no DOM, no state). controls.ts feeds it the
// game's pointer events; Gnome Party's "Bowl Frame" slice feeds it its pad, so a swipe bowls the same everywhere.
import { THROW } from './config';

export const SWIPE = {
  /** The swipe is judged over its last this many ms. */
  windowMs: 120,
  /** Upward travel a throw needs, as a share of the screen height. */
  minTravel: 0.12,
  /** Samples older than this (ms) are dropped while the swipe goes on. */
  keepMs: 2000,
  /** Seconds for the keyboard meter to go 0 -> 1 -> 0. */
  chargePeriod: 1.6,
  /** The bowler's default hook: gentle, toward +x (the bowler's left). */
  defaultSpin: 0.35,
} as const;

export interface SwipeSample {
  x: number;
  /** Screen px; y grows downward. */
  y: number;
  /** performance.now() ms. */
  t: number;
}

export interface SwipeRead {
  /** Upward travel from the swipe's lowest point to its end, as a share of the screen height. */
  travel: number;
  /** The last SWIPE.windowMs moved upward. */
  movingUp: boolean;
  speed: number;
  spin: number;
  aim: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Ball speed for a power of 0..1. */
export const speedFor = (power: number): number => THROW.speedMin + (THROW.speedMax - THROW.speedMin) * clamp(power, 0, 1);
/** Power 0..1 of a ball speed. */
export const powerOf = (speed: number): number => (speed - THROW.speedMin) / (THROW.speedMax - THROW.speedMin);

/** Keyboard meter: 0 -> 1 -> 0 over SWIPE.chargePeriod seconds. */
export function meterAt(t: number): number {
  const ph = (t % SWIPE.chargePeriod) / SWIPE.chargePeriod;
  return ph < 0.5 ? ph * 2 : (1 - ph) * 2;
}

/** Drops samples older than SWIPE.keepMs before `now` (keeping at least two). */
export function trimSwipe(samples: SwipeSample[], now: number): void {
  while (samples.length > 2 && now - samples[0].t > SWIPE.keepMs) samples.shift();
}

/**
 * Reads a swipe (screen px samples on a W x H screen) into speed, hook and wobble. Null if there are not enough samples.
 * spinBias is the bowler's chosen hook and aimYaw their aim; the swipe's curl and angle bend both a little.
 */
export function readSwipe(samples: readonly SwipeSample[], spinBias: number, aimYaw: number, width: number, height: number): SwipeRead | null {
  if (samples.length < 2) return null;
  const W = Math.max(1, width);
  const H = Math.max(1, height);
  const end = samples[samples.length - 1];
  // The backswing (a downward drag first) does not count: travel is measured from the lowest point.
  let low = end.y;
  for (const s of samples) if (s.y > low) low = s.y;
  const travel = (low - end.y) / H;
  // The first sample inside the last windowMs (the end itself if it is the only one).
  let a = samples[0];
  for (const s of samples) {
    if (end.t - s.t <= SWIPE.windowMs) {
      a = s;
      break;
    }
  }
  if (a === end) a = samples[samples.length - 2];
  const dt = Math.max((end.t - a.t) / 1000, 0.02);
  const upPx = a.y - end.y;
  const upSpeed = upPx / dt / H; // screen heights per second
  const curl = (end.x - a.x) / dt / W; // screen widths per second; screen-right is -x (the bowler's right)
  const angle = Math.atan2(end.x - a.x, upPx); // away from vertical; screen-right is positive
  return {
    travel,
    movingUp: upPx > 0,
    speed: speedFor((upSpeed - 0.8) / 4.0),
    spin: clamp(spinBias - curl * 0.6, -1, 1),
    aim: aimYaw - clamp(angle * 0.08, -0.04, 0.04),
  };
}

/** A finished swipe as a throw's speed, spin and aim, or null when it was no throw (too short, or not ending upward). */
export function swipeThrow(samples: readonly SwipeSample[], spinBias: number, aimYaw: number, width: number, height: number): SwipeRead | null {
  const r = readSwipe(samples, spinBias, aimYaw, width, height);
  return r && r.movingUp && r.travel >= SWIPE.minTravel ? r : null;
}

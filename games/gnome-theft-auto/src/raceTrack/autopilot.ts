// A simple racing driver for the Speedway: aims ahead on the centre line and brakes for the corners ahead at a given
// nerve. track.test.ts uses it to prove the minimum lap time; `?autopilot[=grip]` lets it drive the player's vehicle
// round the track (demos, scripted checks, the lap GIF).
import type { InputState, Vehicle } from '../types';
import { angleDiff } from '../collide';
import { locate, sampleAt, trackFrame } from './track';

/** Where to aim (distance along the lap) and the speed to hold, at distance `s` going `speed`, with cornering nerve `grip` (lateral g). */
export function racingLine(s: number, speed: number, grip: number): { aimS: number; target: number } {
  let target = Infinity;
  const reach = 15 + speed * 1.6;
  for (let d = 0; d <= reach; d += 2) {
    const R = 1 / Math.max(Math.abs(sampleAt(s + d).curv), 1e-4);
    target = Math.min(target, Math.sqrt(grip * 9.81 * R + 2 * 7 * d));
  }
  return { aimS: s + 5 + speed * 0.45, target };
}

/** Steer (-1..1, +1 = right) towards the racing line from (x, z) heading `yaw`. */
export function steerTo(x: number, z: number, yaw: number, aimS: number): number {
  const aim = trackFrame(aimS);
  return Math.max(-1, Math.min(1, -2 * angleDiff(Math.atan2(aim.x - x, aim.z - z), yaw)));
}

const query = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
const ON = !!query?.has('autopilot');
const GRIP = Number(query?.get('autopilot')) || 0.9;
let hint = -1;

/** With `?autopilot`, the player's ground vehicle is driven round the track (input replaced); otherwise `inp` unchanged. */
export function autopilotInput<T extends InputState>(inp: T, v: Vehicle | null): T {
  if (!ON || !v || v.spec.flies || v.spec.boat || v.driver !== 'player') return inp;
  const spot = locate(v.x, v.z, 60, hint);
  if (!spot) return inp;
  hint = spot.i;
  const { aimS, target } = racingLine(spot.s, v.speed, GRIP);
  const moveY = v.speed < target ? 1 : v.speed > target + 1.5 ? -1 : 0;
  return { ...inp, moveX: steerTo(v.x, v.z, v.yaw, aimS), moveY, pad: false };
}

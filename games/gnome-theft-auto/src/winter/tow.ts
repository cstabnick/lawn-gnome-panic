// Winter sports (E12): the Bootlace Tow, a rope tow up Snowdrop Slope. Pure.
import type { TowRide } from './types';
import { TOW } from './types';

const dx = TOW.top.x - TOW.base.x;
const dz = TOW.top.z - TOW.base.z;
const LEN = Math.hypot(dx, dz);
const UX = dx / LEN;
const UZ = dz / LEN;
const YAW = Math.atan2(UX, UZ);
/** The return line runs parallel, 0.8 m to the side (perpendicular (-u.z, u.x)). */
const SIDE = 0.8;

/** True when a rider at (x, z) moving at `speed` m/s may grab a handle at the base. */
export function canGrab(x: number, z: number, speed: number): boolean {
  return Math.hypot(x - TOW.base.x, z - TOW.base.z) <= TOW.grabRange && speed < TOW.grabSpeed;
}

/** A new ride from the base. */
export function startTow(): TowRide {
  return { s: 0, len: LEN, done: false };
}

/** Advance the ride by dt; done once it reaches the top. */
export function stepTow(t: TowRide, dt: number): void {
  t.s = Math.min(t.len, t.s + TOW.speed * dt);
  t.done = t.s >= t.len;
}

/** Where the rider is (x, z) and which way the line runs (yaw) at distance s along it. */
export function towPoint(s: number): { x: number; z: number; yaw: number } {
  const d = Math.min(LEN, Math.max(0, s));
  return { x: TOW.base.x + UX * d, z: TOW.base.z + UZ * d, yaw: YAW };
}

/** The handle loop: `n` handle positions at time `t` seconds (up the line, back down beside it), world x, z. */
export function handlePositions(t: number, n: number): { x: number; z: number }[] {
  const loop = 2 * LEN;
  const out: { x: number; z: number }[] = [];
  for (let k = 0; k < n; k++) {
    const raw = t * TOW.speed + (k * loop) / n;
    const d = ((raw % loop) + loop) % loop;
    if (d < LEN) {
      out.push({ x: TOW.base.x + UX * d, z: TOW.base.z + UZ * d });
    } else {
      const back = d - LEN;
      out.push({
        x: TOW.top.x - UX * back - UZ * SIDE,
        z: TOW.top.z - UZ * back + UX * SIDE,
      });
    }
  }
  return out;
}

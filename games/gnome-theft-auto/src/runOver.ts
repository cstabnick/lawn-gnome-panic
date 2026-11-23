import { RUN_OVER } from './config';
import { aboveGround } from './terrain';
import type { Vehicle } from './types';

/**
 * True when a vehicle's path this frame passes within reach of a body at (x, z).
 *
 * The path is the segment the vehicle covered this frame (its position minus speed * dt along its heading, to its
 * current position), so a fast car that crosses a gnome between two frames still counts. The height test uses the
 * height above the ground under the vehicle, so hills do not stop a run-over.
 */
export function runOverHit(v: Vehicle, x: number, z: number, bodyR: number, dt: number): boolean {
  if (Math.abs(v.speed) < RUN_OVER.minSpeed || aboveGround(v.x, v.y, v.z) > 1.5) return false;
  const sx = Math.sin(v.yaw), sz = Math.cos(v.yaw);
  const x0 = v.x - sx * v.speed * dt, z0 = v.z - sz * v.speed * dt;
  const dx = v.x - x0, dz = v.z - z0;
  const len2 = dx * dx + dz * dz;
  let t = len2 > 1e-12 ? ((x - x0) * dx + (z - z0) * dz) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const px = x0 + dx * t - x, pz = z0 + dz * t - z;
  return Math.hypot(px, pz) <= v.spec.radius * RUN_OVER.reach + bodyR;
}

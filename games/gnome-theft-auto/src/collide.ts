// Circle-vs-box collision on the ground plane, shared by the player, vehicles, pedestrians and officers.
import type { Box } from './types';

export interface Pushed { x: number; z: number; hit: boolean }

/**
 * Push a circle (x, z, radius r) out of every box. Boxes whose top `h` is at or below `y` are ignored (flyers above
 * them, or a gnome standing on top). Returns the corrected position and whether anything was hit.
 */
export function pushOutOfBoxes(x: number, z: number, r: number, boxes: readonly Box[], y = 0): Pushed {
  let hit = false;
  for (const b of boxes) {
    if (b.h <= y) continue;
    const cx = Math.max(b.minX, Math.min(x, b.maxX));
    const cz = Math.max(b.minZ, Math.min(z, b.maxZ));
    const dx = x - cx;
    const dz = z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    hit = true;
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2);
      x = cx + (dx / d) * r;
      z = cz + (dz / d) * r;
    } else {
      // Centre inside the box: leave by the nearest side.
      const left = x - b.minX, right = b.maxX - x, back = z - b.minZ, front = b.maxZ - z;
      const m = Math.min(left, right, back, front);
      if (m === left) x = b.minX - r;
      else if (m === right) x = b.maxX + r;
      else if (m === back) z = b.minZ - r;
      else z = b.maxZ + r;
    }
  }
  return { x, z, hit };
}

/** Keep a circle inside [-half, half] on both axes. */
export function clampToWorld(x: number, z: number, half: number, r: number): Pushed {
  const lim = half - r;
  const cx = Math.max(-lim, Math.min(lim, x));
  const cz = Math.max(-lim, Math.min(lim, z));
  return { x: cx, z: cz, hit: cx !== x || cz !== z };
}

/** True when the point is inside a box taller than y. */
export function insideBox(x: number, y: number, z: number, boxes: readonly Box[]): boolean {
  for (const b of boxes) {
    if (y < b.h && x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ) return true;
  }
  return false;
}

/** Shortest signed difference between two angles, in (-PI, PI]. */
export function angleDiff(to: number, from: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

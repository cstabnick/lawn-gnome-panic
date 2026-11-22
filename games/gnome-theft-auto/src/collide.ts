// Circle-vs-box collision on the ground plane, shared by the player, vehicles, pedestrians and officers.
import type { Box } from './types';
import { heightAt } from './terrain';

export interface Pushed { x: number; z: number; hit: boolean }

// ---- Spatial grid ---------------------------------------------------------------------------------------------------
// The world holds thousands of boxes (towers, trees, fences). Every query below looks only at the boxes in the grid
// cells it touches. The grid is built lazily per boxes array and rebuilt when the array's length changes, so callers
// keep passing `world.boxes` and may push to it while building. Boxes are not moved or removed after that.
const CELL = 32;
interface Grid { count: number; cells: Map<number, Box[]> }
const grids = new WeakMap<readonly Box[], Grid>();
const cellKey = (i: number, j: number): number => i * 65536 + j;
const EMPTY: Box[] = [];

function gridOf(boxes: readonly Box[]): Grid {
  let g = grids.get(boxes);
  if (g && g.count === boxes.length) return g;
  g = { count: boxes.length, cells: new Map() };
  for (const b of boxes) {
    const i0 = Math.floor(b.minX / CELL), i1 = Math.floor(b.maxX / CELL);
    const j0 = Math.floor(b.minZ / CELL), j1 = Math.floor(b.maxZ / CELL);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const k = cellKey(i, j);
        const list = g.cells.get(k);
        if (list) list.push(b); else g.cells.set(k, [b]);
      }
    }
  }
  grids.set(boxes, g);
  return g;
}

/**
 * Push a circle (x, z, radius r) out of every box. Boxes whose top `h` is at or below `y` are ignored (flyers above
 * them, or a gnome standing on top). Returns the corrected position and whether anything was hit.
 */
export function pushOutOfBoxes(x: number, z: number, r: number, boxes: readonly Box[], y = 0): Pushed {
  let hit = false;
  const g = gridOf(boxes);
  const i0 = Math.floor((x - r) / CELL), i1 = Math.floor((x + r) / CELL);
  const j0 = Math.floor((z - r) / CELL), j1 = Math.floor((z + r) / CELL);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
   for (const b of g.cells.get(cellKey(i, j)) ?? EMPTY) {
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
  for (const b of gridOf(boxes).cells.get(cellKey(Math.floor(x / CELL), Math.floor(z / CELL))) ?? EMPTY) {
    if (y < b.h && x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ) return true;
  }
  return false;
}

/** Highest walk-on surface (`b.h` or the terrain height `heightAt`) under circle `(x, z, r)` with top at or below `maxY + 0.35`. */
export function groundHeight(x: number, z: number, r: number, boxes: readonly Box[], maxY: number): number {
  let best = heightAt(x, z);
  const g = gridOf(boxes);
  const i0 = Math.floor((x - r) / CELL), i1 = Math.floor((x + r) / CELL);
  const j0 = Math.floor((z - r) / CELL), j1 = Math.floor((z + r) / CELL);
  const r2 = r * r;
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    for (const b of g.cells.get(cellKey(i, j)) ?? EMPTY) {
      if (b.h <= best || b.h > maxY + 0.35) continue;
      const cx = Math.max(b.minX, Math.min(x, b.maxX));
      const cz = Math.max(b.minZ, Math.min(z, b.maxZ));
      const dx = x - cx;
      const dz = z - cz;
      if (dx * dx + dz * dz < r2) best = b.h;
    }
  }
  return best;
}

/** Shortest signed difference between two angles, in (-PI, PI]. */
export function angleDiff(to: number, from: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

// Circle-vs-box collision on the ground plane, shared by the player, vehicles, pedestrians and officers.
import type { Box } from './types';
import { groundAt } from './terrain';

/**
 * A circle's corrected position. (nx, nz) is the unit direction the circle was last pushed (the wall normal, pointing out
 * of the box); (0, 0) when hit is false.
 */
export interface Pushed { x: number; z: number; hit: boolean; nx: number; nz: number }

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
  let nx = 0, nz = 0;
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
      nx = dx / d;
      nz = dz / d;
      x = cx + nx * r;
      z = cz + nz * r;
    } else {
      // Centre inside the box: leave by the nearest side.
      const left = x - b.minX, right = b.maxX - x, back = z - b.minZ, front = b.maxZ - z;
      const m = Math.min(left, right, back, front);
      if (m === left) { x = b.minX - r; nx = -1; nz = 0; }
      else if (m === right) { x = b.maxX + r; nx = 1; nz = 0; }
      else if (m === back) { z = b.minZ - r; nx = 0; nz = -1; }
      else { z = b.maxZ + r; nx = 0; nz = 1; }
    }
   }
  }
  return hit ? { x, z, hit, nx, nz } : { x, z, hit, nx: 0, nz: 0 };
}

/** Keep a circle inside [-half, half] on both axes. The normal points back inside the world. */
export function clampToWorld(x: number, z: number, half: number, r: number): Pushed {
  const lim = half - r;
  const cx = Math.max(-lim, Math.min(lim, x));
  const cz = Math.max(-lim, Math.min(lim, z));
  const hit = cx !== x || cz !== z;
  return { x: cx, z: cz, hit, nx: hit ? Math.sign(cx - x) : 0, nz: hit ? Math.sign(cz - z) : 0 };
}

/**
 * Move a circle from (x0, z0) to (x1, z1) in substeps no longer than 0.4 r, pushing it out of the boxes after each one,
 * so a fast vehicle cannot tunnel through a thin wall. When a substep hits, the into-wall part of the remaining
 * displacement is removed, so the circle slides along the wall. Returns the final position, whether anything was hit,
 * and the last wall normal.
 */
export function sweepCircleBoxes(x0: number, z0: number, x1: number, z1: number, r: number, boxes: readonly Box[], y = 0): Pushed {
  const dist = Math.hypot(x1 - x0, z1 - z0);
  const n = Math.min(32, Math.max(1, Math.ceil(dist / (0.4 * r))));
  let rx = x1 - x0, rz = z1 - z0; // displacement still to travel
  let x = x0, z = z0;
  let hit = false, nx = 0, nz = 0;
  for (let s = 0; s < n; s++) {
    const left = n - s;
    const sx = rx / left, sz = rz / left;
    rx -= sx; rz -= sz;
    x += sx; z += sz;
    const p = pushOutOfBoxes(x, z, r, boxes, y);
    x = p.x; z = p.z;
    if (p.hit) {
      hit = true; nx = p.nx; nz = p.nz;
      const into = Math.min(0, rx * nx + rz * nz);
      rx -= into * nx;
      rz -= into * nz;
    }
  }
  return { x, z, hit, nx: hit ? nx : 0, nz: hit ? nz : 0 };
}

/**
 * Bounce a velocity off a wall with normal (nx, nz): the into-wall part rebounds by `restitution`, and the along-wall part
 * loses `mu` times the impact speed (Coulomb friction: a scrape at a shallow angle keeps nearly all its speed, a car
 * resting against a wall while it drives along it is not slowed every frame). `impact` is the speed into the wall (0 when
 * moving away).
 */
export function wallBounce(vx: number, vz: number, nx: number, nz: number, restitution = 0.15, mu = 0.4): { vx: number; vz: number; impact: number } {
  const vn = vx * nx + vz * nz;
  if (vn >= 0) return { vx, vz, impact: 0 };
  const tx = vx - vn * nx, tz = vz - vn * nz;
  const t = Math.hypot(tx, tz);
  const keep = t > 1e-9 ? Math.max(0, 1 - (mu * -vn) / t) : 0;
  return {
    vx: tx * keep - restitution * vn * nx,
    vz: tz * keep - restitution * vn * nz,
    impact: -vn,
  };
}

/** True when the point is inside a box taller than y. */
export function insideBox(x: number, y: number, z: number, boxes: readonly Box[]): boolean {
  for (const b of gridOf(boxes).cells.get(cellKey(Math.floor(x / CELL), Math.floor(z / CELL))) ?? EMPTY) {
    if (y < b.h && x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ) return true;
  }
  return false;
}

/** Highest walk-on surface (`b.h`, or groundAt: the land or a skyway deck) under circle `(x, z, r)` with top at or below `maxY + 0.35`. */
export function groundHeight(x: number, z: number, r: number, boxes: readonly Box[], maxY: number): number {
  let best = groundAt(x, z, maxY);
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

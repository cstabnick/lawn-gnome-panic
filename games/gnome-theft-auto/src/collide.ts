// Circle-vs-box collision on the ground plane, shared by the player, vehicles, pedestrians and officers.
import type { Box } from './types';
import { groundAt } from './terrain';
import { isInteriorPoint } from './interiors/space';

/**
 * A circle's corrected position. (nx, nz) is the unit direction the circle was last pushed (the wall normal, pointing out
 * of the box); (0, 0) when hit is false.
 */
export interface Pushed { x: number; z: number; hit: boolean; nx: number; nz: number }

/** Radius of a round collider: half its shorter side. */
export function roundRadius(b: Box): number {
  return Math.min(b.maxX - b.minX, b.maxZ - b.minZ) / 2;
}

/** A round collider (vertical cylinder) of radius r centred on (cx, cz), up to height h. See Box.shape. */
export function roundBox(cx: number, cz: number, r: number, h: number): Box {
  return { minX: cx - r, maxX: cx + r, minZ: cz - r, maxZ: cz + r, h, shape: 'round' };
}

/**
 * The round version of a box made from a round prefab's bounds: same centre and height, radius `r` (default half the
 * box's shorter side, i.e. the circle inscribed in it). Use it for trunks, silos, towers, fountains, toadstool stems.
 */
export function roundOf(b: Box, r = roundRadius(b)): Box {
  return roundBox((b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2, r, b.h);
}

/** Push a round collider onto `boxes` (scenery builders: E01/E10/E11/E13/E14 sites use this for round things). Returns it. */
export function placeRoundBox(boxes: Box[], cx: number, cz: number, r: number, h: number): Box {
  const b = roundBox(cx, cz, r, h);
  boxes.push(b);
  return b;
}

/** True when (x, z) grown by r overlaps box b in plan (round boxes as circles). */
function overlaps(b: Box, x: number, z: number, r: number): boolean {
  if (b.shape === 'round') {
    const R = roundRadius(b) + r;
    const ex = x - (b.minX + b.maxX) / 2, ez = z - (b.minZ + b.maxZ) / 2;
    return ex * ex + ez * ez < R * R;
  }
  const cx = Math.max(b.minX, Math.min(x, b.maxX));
  const cz = Math.max(b.minZ, Math.min(z, b.maxZ));
  const dx = x - cx, dz = z - cz;
  return r > 0 ? dx * dx + dz * dz < r * r : x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ;
}

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
    if (b.shape === 'round') {
      // Cylinder: circle vs circle.
      const ox = (b.minX + b.maxX) / 2, oz = (b.minZ + b.maxZ) / 2;
      const R = roundRadius(b) + r;
      const ex = x - ox, ez = z - oz;
      const e2 = ex * ex + ez * ez;
      if (e2 >= R * R) continue;
      hit = true;
      const e = Math.sqrt(e2);
      if (e > 1e-6) { nx = ex / e; nz = ez / e; } else { nx = 0; nz = 1; }
      x = ox + nx * R;
      z = oz + nz * R;
      continue;
    }
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

/**
 * Keep a circle inside [-half, half] on both axes. The normal points back inside the world. Interior space (x >= 5000,
 * interiors/space.ts) is exempt: a body standing in an interior pocket is never pulled back onto the map.
 */
export function clampToWorld(x: number, z: number, half: number, r: number): Pushed {
  if (isInteriorPoint(x, z)) return { x, z, hit: false, nx: 0, nz: 0 };
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
    // Two boxes touching (a seam, an inside corner): a push out of one can leave it in the other, so push once more.
    if (p.hit) {
      const q = pushOutOfBoxes(x, z, r, boxes, y);
      if (q.hit) { x = q.x; z = q.z; }
    }
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
    if (y < b.h && overlaps(b, x, z, 0)) return true;
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
      if (b.shape === 'round') { if (overlaps(b, x, z, r)) best = b.h; continue; }
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

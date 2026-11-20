// Walking gnomes around the table: pure floor geometry and path following (no three.js). Floor coordinates are world
// units with the table centred on the origin: x along the long side, z across it. Gnomes keep outside the rails, and a
// path that would cross the table is routed round its corners.
import { RAIL, TABLE_H, TABLE_W } from './config';

export interface Pt {
  x: number;
  z: number;
}

/** Half sizes of the table with its rails. */
export const RAIL_HX = TABLE_W / 2 + RAIL;
export const RAIL_HZ = TABLE_H / 2 + RAIL;
/** How far a gnome keeps from the rails. */
export const CLEAR = 0.3;
/** The forbidden box a gnome may not enter: the rails plus clearance. */
export const BLOCK_HX = RAIL_HX + CLEAR;
export const BLOCK_HZ = RAIL_HZ + CLEAR;
/** The floor the gnomes walk on. */
export const WALK_X = 2.5;
export const WALK_Z = 1.7;
/** Walking speed, floor units per second. */
export const WALK_SPEED = 0.8;

export interface Walker {
  x: number;
  z: number;
  /** Yaw (0 = facing +z, like the gnome model). */
  yaw: number;
  /** Waypoints still to visit, the last one being the goal. */
  path: Pt[];
  moving: boolean;
  /** Current velocity on the floor (for the walk animation). */
  vx: number;
  vz: number;
}

export function newWalker(x: number, z: number): Walker {
  return { x, z, yaw: Math.atan2(-x, -z), path: [], moving: false, vx: 0, vz: 0 };
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Keeps a point on the walkable floor. */
export function clampFloor(p: Pt): Pt {
  return { x: clamp(p.x, -WALK_X, WALK_X), z: clamp(p.z, -WALK_Z, WALK_Z) };
}

/** True when the point is inside the forbidden box (the rails and their clearance). */
export function inBlock(p: Pt): boolean {
  return Math.abs(p.x) < BLOCK_HX && Math.abs(p.z) < BLOCK_HZ;
}

/** Pushes a point out of the forbidden box, through its nearest side. */
export function pushOut(p: Pt): Pt {
  if (!inBlock(p)) return p;
  const dx = BLOCK_HX - Math.abs(p.x);
  const dz = BLOCK_HZ - Math.abs(p.z);
  if (dx < dz) return { x: (p.x < 0 ? -1 : 1) * BLOCK_HX, z: p.z };
  return { x: p.x, z: (p.z < 0 ? -1 : 1) * BLOCK_HZ };
}

/** Whether the segment a-b crosses the forbidden box (slab test). */
export function segmentHitsBlock(a: Pt, b: Pt): boolean {
  let t0 = 0;
  let t1 = 1;
  const axes: [number, number, number, number][] = [
    [a.x, b.x - a.x, -BLOCK_HX, BLOCK_HX],
    [a.z, b.z - a.z, -BLOCK_HZ, BLOCK_HZ],
  ];
  for (const [p, d, lo, hi] of axes) {
    if (Math.abs(d) < 1e-12) {
      if (p <= lo || p >= hi) return false;
      continue;
    }
    let ta = (lo - p) / d;
    let tb = (hi - p) / d;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 >= t1) return false;
  }
  return true;
}

/** The corners of the forbidden box, just outside it so a path to a corner does not graze the box. */
const CORNERS: Pt[] = [
  { x: BLOCK_HX + 0.02, z: BLOCK_HZ + 0.02 },
  { x: -(BLOCK_HX + 0.02), z: BLOCK_HZ + 0.02 },
  { x: -(BLOCK_HX + 0.02), z: -(BLOCK_HZ + 0.02) },
  { x: BLOCK_HX + 0.02, z: -(BLOCK_HZ + 0.02) },
];

const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.z - b.z);

/**
 * The waypoints from `from` to `to` (the last is `to`). Straight when the way is clear; otherwise round one or two corners
 * of the forbidden box, whichever is shortest. Both ends must be outside the box.
 */
export function route(from: Pt, to: Pt): Pt[] {
  if (!segmentHitsBlock(from, to)) return [to];
  let best: Pt[] | null = null;
  let bestLen = Infinity;
  const consider = (wps: Pt[]): void => {
    let prev = from;
    let len = 0;
    for (const w of wps) {
      len += dist(prev, w);
      prev = w;
    }
    if (len < bestLen) {
      bestLen = len;
      best = wps;
    }
  };
  for (const c of CORNERS) {
    if (!segmentHitsBlock(from, c) && !segmentHitsBlock(c, to)) consider([c, to]);
  }
  for (const c1 of CORNERS) {
    for (const c2 of CORNERS) {
      if (c1 === c2) continue;
      if (!segmentHitsBlock(from, c1) && !segmentHitsBlock(c1, c2) && !segmentHitsBlock(c2, to)) consider([c1, c2, to]);
    }
  }
  return best ?? [to];
}

/** Sets the walker's path to a floor point (clamped to the floor, pushed out of the rails). */
export function walkTo(w: Walker, target: Pt): void {
  const goal = pushOut(clampFloor(target));
  const here = pushOut({ x: w.x, z: w.z });
  w.path = route(here, goal);
}

/** Moves the walker along its path by dt seconds, turning to face the way it goes. */
export function stepWalker(w: Walker, dt: number): void {
  if (w.path.length === 0) {
    w.moving = false;
    w.vx = 0;
    w.vz = 0;
    return;
  }
  const goal = w.path[0];
  const dx = goal.x - w.x;
  const dz = goal.z - w.z;
  const d = Math.hypot(dx, dz);
  const step = WALK_SPEED * dt;
  if (d <= step) {
    w.x = goal.x;
    w.z = goal.z;
    w.path.shift();
  } else {
    w.x += (dx / d) * step;
    w.z += (dz / d) * step;
  }
  const p = pushOut({ x: w.x, z: w.z });
  w.x = p.x;
  w.z = p.z;
  w.moving = w.path.length > 0 || d > step;
  w.vx = d > 0 ? (dx / d) * WALK_SPEED : 0;
  w.vz = d > 0 ? (dz / d) * WALK_SPEED : 0;
  if (w.moving && d > 1e-6) w.yaw = Math.atan2(dx, dz);
}

/** True when the walker has stopped (no path left). */
export function isIdle(w: Walker): boolean {
  return w.path.length === 0 && !w.moving;
}

// Hedgeworth Links as a @lawn/golf course: the GTA ground (terrain.ts heightAt plus the greens' rise) and the holes'
// lies, in the package's golf frame (gnome yards, see golf/types.ts). Pure apart from reading the terrain.
import { featureLie, type CourseEnv, type HoleDef, type Lie, type Vec3 } from '@lawn/golf';
import { heightAt } from '../terrain';
import {
  ARCH_GAP, GOLF_LIFT, HEDGES, HEDGE_ARCHES, HEDGE_H, HOLES, MAZE_H, MAZE_HEDGES, POTTING_SHED, YD, greenRise, toGolf, toWorld,
  type HedgeworthHole,
} from './types';

const yd = (m: number): number => m / YD;
const pt = (p: { x: number; z: number }): { x: number; z: number } => toGolf(p.x, p.z);

/** A Hedgeworth hole in the golf frame (yards) for @lawn/golf. Green tilt is rise per unit, so it is unchanged. */
export function holeYards(h: HedgeworthHole): HoleDef {
  return {
    par: h.par,
    tee: pt(h.tee),
    path: h.path.map(pt),
    fairwayWidth: yd(h.fairwayWidth),
    fairwayStart: yd(h.fairwayStart),
    green: { ...pt(h.green), r: yd(h.green.r), slopeX: h.green.slopeX, slopeZ: h.green.slopeZ },
    pin: pt(h.pin),
    bunkers: h.bunkers.map((c) => ({ ...pt(c), r: yd(c.r) })),
    ponds: h.ponds.map((c) => ({ ...pt(c), r: yd(c.r) })),
  };
}

export const HOLES_YD: readonly HoleDef[] = HOLES.map(holeYards);

/** Height of the potting shed's roof over the ground at (x, z): hole 7's tee mat sits on it, 0 everywhere else. */
export function teeRise(x: number, z: number): number {
  const s = POTTING_SHED;
  return Math.abs(x - s.x) <= s.w / 2 && Math.abs(z - s.z) <= s.d / 2 ? s.roofY : 0;
}

/** World ground height of the course surface at (x, z), metres: the terrain plus a green's rise (and the shed roof). */
export function courseGroundY(x: number, z: number): number {
  return heightAt(x, z) + greenRise(x, z) + teeRise(x, z);
}

let floorY: number | null = null;
/** The yard floor (terrain height at the golf origin), metres: golf height 0 + GOLF_LIFT sits here. */
export function yardFloorY(): number {
  if (floorY === null) { const o = toWorld(0, 0); floorY = heightAt(o.x, o.z); }
  return floorY;
}

/** Golf-frame ground height (yards) at golf (gx, gz). */
export function golfHeight(gx: number, gz: number): number {
  const w = toWorld(gx, gz);
  return GOLF_LIFT + (courseGroundY(w.x, w.z) - yardFloorY()) / YD;
}

/** The lie at golf (gx, gz). Water is a pond (featureLie); never the package's sea. */
export function golfLie(gx: number, gz: number): Lie {
  return featureLie(HOLES_YD, gx, gz);
}

/** The lie at world (x, z). */
export function lieAtWorld(x: number, z: number): Lie {
  const g = toGolf(x, z);
  return golfLie(g.x, g.z);
}

// ---- Walls the ball cannot pass: hedges, the maze, the potting shed (vertical slabs, world metres) --------------------
type Wall = { ax: number; az: number; bx: number; bz: number; len: number; top: number };
const HALF_T = 0.6;
const BOUNCE_KEEP = 0.35;
const SLIDE_KEEP = 0.7;

function hedgeWalls(): Wall[] {
  const out: Wall[] = [];
  const add = (ax: number, az: number, bx: number, bz: number, top: number): void => {
    const len = Math.hypot(bx - ax, bz - az);
    if (len > 0.01) out.push({ ax, az, bx, bz, len, top });
  };
  for (const h of HEDGES) {
    const [ax, az] = h.a, [bx, bz] = h.b;
    const len = Math.hypot(bx - ax, bz - az);
    const ux = (bx - ax) / len, uz = (bz - az) / len;
    // Openings: an arch standing on the segment cuts ARCH_GAP m out of it, centred on the arch.
    const gaps: [number, number][] = [];
    for (const a of HEDGE_ARCHES) {
      const t = (a.x - ax) * ux + (a.z - az) * uz;
      const off = Math.abs((a.x - ax) * uz - (a.z - az) * ux);
      if (off < 3 && t > -ARCH_GAP && t < len + ARCH_GAP) gaps.push([t - ARCH_GAP / 2, t + ARCH_GAP / 2]);
    }
    gaps.sort((p, q) => p[0] - q[0]);
    let s = 0;
    for (const [g0, g1] of gaps) {
      if (g0 > s) add(ax + ux * s, az + uz * s, ax + ux * g0, az + uz * g0, HEDGE_H);
      s = Math.max(s, g1);
    }
    if (s < len) add(ax + ux * s, az + uz * s, bx, bz, HEDGE_H);
  }
  for (const h of MAZE_HEDGES) add(h.a[0], h.a[1], h.b[0], h.b[1], MAZE_H);
  return out;
}
const WALLS: readonly Wall[] = hedgeWalls();
const SHED = POTTING_SHED;
const REACH = HALF_T + 0.5; // thickness plus the ball's radius in metres, with a margin
const BOX = {
  x0: Math.min(...WALLS.map((w) => Math.min(w.ax, w.bx)), SHED.x - SHED.w / 2) - REACH,
  x1: Math.max(...WALLS.map((w) => Math.max(w.ax, w.bx)), SHED.x + SHED.w / 2) + REACH,
  z0: Math.min(...WALLS.map((w) => Math.min(w.az, w.bz)), SHED.z - SHED.d / 2) - REACH,
  z1: Math.max(...WALLS.map((w) => Math.max(w.az, w.bz)), SHED.z + SHED.d / 2) + REACH,
};

/** Bounce the ball off the slab nearest to it, if it is inside one: push it out, reflect, damp. */
function collide(p: Vec3, v: Vec3, r: number): 'trunk' | null {
  const w = toWorld(p.x, p.z);
  if (w.x < BOX.x0 || w.x > BOX.x1 || w.z < BOX.z0 || w.z > BOX.z1) return null;
  const h = (p.y - GOLF_LIFT) * YD; // metres over the yard floor
  if (h < 0) return null;
  const rm = r * YD;
  let nx = 0, nz = 0, depth = 0, hit = false;
  for (const wl of WALLS) {
    if (h >= wl.top) continue;
    const ex = (wl.bx - wl.ax) / wl.len, ez = (wl.bz - wl.az) / wl.len;
    const t = (w.x - wl.ax) * ex + (w.z - wl.az) * ez;
    const tc = Math.min(wl.len, Math.max(0, t));
    const dx = w.x - (wl.ax + ex * tc), dz = w.z - (wl.az + ez * tc);
    const d = Math.hypot(dx, dz);
    const reach = HALF_T + rm;
    if (d >= reach) continue;
    let ux: number, uz: number, sd: number; // outward normal and the ball's signed distance along it
    if (t !== tc && d > 1e-6) { ux = dx / d; uz = dz / d; sd = d; } // past an end: push out radially
    else {
      ux = -ez; uz = ex; // the segment's normal, on the side the ball came from
      const side = -(v.x * ux + v.z * uz) || dx * ux + dz * uz;
      if (side < 0) { ux = -ux; uz = -uz; }
      sd = dx * ux + dz * uz;
    }
    const push = reach - sd;
    if (!hit || push > depth) { depth = push; nx = ux; nz = uz; hit = true; }
  }
  // The shed: a box from the ground to its roof. The ball on the roof (at roofY) is above it and unaffected.
  if (h < SHED.roofY - 0.1) {
    const hx = SHED.w / 2 + rm, hz = SHED.d / 2 + rm;
    const lx = w.x - SHED.x, lz = w.z - SHED.z;
    if (Math.abs(lx) < hx && Math.abs(lz) < hz) {
      // Leave through the nearest face (by the way the ball came in, when it is moving).
      const px = hx - Math.abs(lx), pz = hz - Math.abs(lz);
      const alongX = px < pz;
      const sgn = alongX ? (lx >= 0 ? 1 : -1) : (lz >= 0 ? 1 : -1);
      const ux = alongX ? sgn : 0, uz = alongX ? 0 : sgn;
      const d = alongX ? px : pz;
      if (!hit || d > depth) { depth = d; nx = ux; nz = uz; hit = true; }
    }
  }
  if (!hit) return null;
  // Push out (golf frame: yards), then reflect the normal speed and damp the slide.
  p.x += (nx * depth) / YD;
  p.z += (nz * depth) / YD;
  const vn = v.x * nx + v.z * nz;
  if (vn < 0) {
    v.x -= (1 + BOUNCE_KEEP) * vn * nx;
    v.z -= (1 + BOUNCE_KEEP) * vn * nz;
  }
  const vn2 = v.x * nx + v.z * nz;
  const tx = v.x - vn2 * nx, tz = v.z - vn2 * nz;
  v.x = vn2 * nx + tx * SLIDE_KEEP;
  v.z = vn2 * nz + tz * SLIDE_KEEP;
  return 'trunk';
}

const ENV: CourseEnv = {
  heightAt: golfHeight,
  gradientAt(x, z) {
    const e = 0.25;
    return { gx: (golfHeight(x + e, z) - golfHeight(x - e, z)) / (2 * e), gz: (golfHeight(x, z + e) - golfHeight(x, z - e)) / (2 * e) };
  },
  lieAt: golfLie,
  collide,
};

/** The course for @lawn/golf simulateShot / previewShot. */
export function golfEnv(): CourseEnv {
  return ENV;
}

/** A ball resting on the ground at world (x, z), as a golf-frame start point. */
export function golfStart(x: number, z: number): Vec3 {
  const g = toGolf(x, z);
  return { x: g.x, y: golfHeight(g.x, g.z), z: g.z };
}

/** A golf-frame point (a flight sample) in the world, metres. */
export function golfToWorld(p: Vec3): { x: number; y: number; z: number } {
  const w = toWorld(p.x, p.z);
  return { x: w.x, y: yardFloorY() + (p.y - GOLF_LIFT) * YD, z: w.z };
}

/** Distance between two world points in gnome yards (what the HUD shows). */
export function yardsBetween(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z) / YD;
}

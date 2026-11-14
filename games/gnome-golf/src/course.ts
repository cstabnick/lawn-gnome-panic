// The island course as pure functions of (x, z): ground height and lie. No three.js scene code here.
// physics.ts, round.ts and world.ts all read the same functions, so what you see is what the ball hits.
import { FRINGE, HOLES, ISLAND, TEE_HALF, type HoleDef, type Lie } from './config';

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Per-hole bounding box (x0, x1, z0, z1) that contains every feature that changes height or lie:
 * fairway (half width), green blend (r + 10), tee blend (TEE_HALF + 6), bunkers, ponds (r + 6).
 * heightAt and lieAt skip holes whose box does not contain the point, which makes them ~4x faster. */
const BOXES: readonly [number, number, number, number][] = HOLES.map((h) => {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  const add = (x: number, z: number, r: number): void => {
    x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r);
    z0 = Math.min(z0, z - r); z1 = Math.max(z1, z + r);
  };
  for (const p of h.path) add(p.x, p.z, h.fairwayWidth / 2 + 1);
  add(h.green.x, h.green.z, h.green.r + 11);
  add(h.tee.x, h.tee.z, TEE_HALF + 7);
  for (const b of h.bunkers) add(b.x, b.z, b.r + 1);
  for (const p of h.ponds) add(p.x, p.z, p.r + 7);
  return [x0, x1, z0, z1];
});
const inBox = (i: number, x: number, z: number): boolean => {
  const b = BOXES[i];
  return x >= b[0] && x <= b[1] && z >= b[2] && z <= b[3];
};

/** Distance from the coastline at the point's angle, before wobble: positive inland, negative at sea. */
export function coastRadius(theta: number): number {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const ell = 1 / Math.sqrt((c * c) / (ISLAND.rx * ISLAND.rx) + (s * s) / (ISLAND.rz * ISLAND.rz));
  const wobble = 1 + 0.06 * Math.sin(3 * theta + 0.7) + 0.04 * Math.sin(5 * theta + 2.1) + 0.025 * Math.sin(9 * theta + 4);
  return ell * wobble;
}

/** Yards from the point to the coast (approximate, measured radially): > 0 on land, < 0 at sea. */
export function distToCoast(x: number, z: number): number {
  return coastRadius(Math.atan2(z, x)) - Math.hypot(x, z);
}

function rolling(x: number, z: number): number {
  return (
    0.5 * Math.sin(x / 53 + 1.3) * Math.cos(z / 61) +
    0.3 * Math.sin((x + z) / 37 + 2) +
    0.2 * Math.cos((x - 2 * z) / 29)
  );
}

/** Island height without any golf features (greens, tees, bunkers, ponds). */
function baseHeight(x: number, z: number): number {
  const d = distToCoast(x, z);
  if (d < 0) return Math.max(ISLAND.seaFloor, -0.25 + d * 0.06);
  return (
    -0.25 +
    0.75 * clamp01(d / ISLAND.beach) +
    ISLAND.inland * smoothstep(ISLAND.beach, ISLAND.beach + 90, d) +
    ISLAND.roll * rolling(x, z) * smoothstep(ISLAND.beach, ISLAND.beach + 60, d)
  );
}

/** Ground height (yards) at (x, z). The sea and ponds are wherever this is below 0. */
export function heightAt(x: number, z: number): number {
  let h = baseHeight(x, z);
  for (let hi = 0; hi < HOLES.length; hi++) {
    if (!inBox(hi, x, z)) continue;
    const hole = HOLES[hi];
    for (const p of hole.ponds) {
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < p.r + 6) h = h + (-1.2 - h) * (1 - smoothstep(p.r - 4, p.r + 6, d));
    }
    for (const b of hole.bunkers) {
      const d = Math.hypot(x - b.x, z - b.z);
      if (d < b.r) h -= 0.7 * (1 - smoothstep(b.r * 0.6, b.r, d));
    }
    const g = hole.green;
    const dg = Math.hypot(x - g.x, z - g.z);
    if (dg < g.r + 10) {
      const target = baseHeight(g.x, g.z) + 0.4 + g.slopeX * (x - g.x) + g.slopeZ * (z - g.z);
      h += (target - h) * (1 - smoothstep(g.r, g.r + 10, dg));
    }
    const t = hole.tee;
    const cheb = Math.max(Math.abs(x - t.x), Math.abs(z - t.z));
    if (cheb < TEE_HALF + 6) {
      const target = baseHeight(t.x, t.z) + 0.4;
      h += (target - h) * (1 - smoothstep(TEE_HALF, TEE_HALF + 6, cheb));
    }
  }
  return h;
}

/** Ground slope (rise per yard) at (x, z): the ball rolls toward -gradient. */
export function gradientAt(x: number, z: number): { gx: number; gz: number } {
  const e = 0.25;
  return {
    gx: (heightAt(x + e, z) - heightAt(x - e, z)) / (2 * e),
    gz: (heightAt(x, z + e) - heightAt(x, z - e)) / (2 * e),
  };
}

/** Distance from (x, z) to the hole's fairway centreline, and how far along the path (from the tee) the closest point is. */
export function distToPath(hole: HoleDef, x: number, z: number): { dist: number; along: number } {
  let best = Infinity;
  let bestAlong = 0;
  let walked = 0;
  for (let i = 0; i < hole.path.length - 1; i++) {
    const a = hole.path[i];
    const b = hole.path[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const len = Math.hypot(abx, abz);
    const t = clamp01(((x - a.x) * abx + (z - a.z) * abz) / (len * len));
    const d = Math.hypot(x - (a.x + abx * t), z - (a.z + abz * t));
    if (d < best) {
      best = d;
      bestAlong = walked + t * len;
    }
    walked += len;
  }
  return { dist: best, along: bestAlong };
}

/** Length of the hole along its fairway centreline, in yards (tee to green centre). */
export function holeLength(hole: HoleDef): number {
  let len = 0;
  for (let i = 0; i < hole.path.length - 1; i++) {
    len += Math.hypot(hole.path[i + 1].x - hole.path[i].x, hole.path[i + 1].z - hole.path[i].z);
  }
  return len;
}

/** What the ball would be sitting on at (x, z). */
export function lieAt(x: number, z: number): Lie {
  if (heightAt(x, z) < 0.02) return 'water';
  // Only the holes whose box contains the point can matter; check them in priority order.
  const near: HoleDef[] = [];
  for (let hi = 0; hi < HOLES.length; hi++) if (inBox(hi, x, z)) near.push(HOLES[hi]);
  for (const hole of near) {
    const g = hole.green;
    if (Math.hypot(x - g.x, z - g.z) < g.r) return 'green';
  }
  for (const hole of near) {
    for (const b of hole.bunkers) if (Math.hypot(x - b.x, z - b.z) < b.r * 0.9) return 'sand';
  }
  for (const hole of near) {
    const g = hole.green;
    if (Math.hypot(x - g.x, z - g.z) < g.r + FRINGE) return 'fringe';
  }
  for (const hole of near) {
    if (Math.max(Math.abs(x - hole.tee.x), Math.abs(z - hole.tee.z)) < TEE_HALF) return 'tee';
  }
  for (const hole of near) {
    const p = distToPath(hole, x, z);
    if (p.dist < hole.fairwayWidth / 2 && p.along > hole.fairwayStart) return 'fairway';
  }
  if (distToCoast(x, z) < ISLAND.beach) return 'sand';
  return 'rough';
}

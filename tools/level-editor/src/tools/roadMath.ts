// Pure polyline maths for the Road tool: picking, inserting and removing points. No three.js, no editor state,
// so the rules can be tested without a browser.

export type Pt = [number, number];

export interface PolylineHit {
  /** The segment index->index+1 that is closest. */
  index: number;
  /** Position along that segment, 0 at `index` and 1 at `index + 1`. */
  t: number;
  x: number;
  z: number;
  dist: number;
}

/** The closest point on the polyline to (x, z). A zero-length segment counts as its start point. */
export function nearestOnPolyline(points: Pt[], x: number, z: number): PolylineHit {
  let best: PolylineHit = { index: -1, t: 0, x, z, dist: Infinity };
  for (let i = 0; i + 1 < points.length; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const len2 = dx * dx + dz * dz;
    const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / len2));
    const px = ax + dx * t;
    const pz = az + dz * t;
    const dist = Math.hypot(x - px, z - pz);
    if (dist < best.dist) best = { index: i, t, x: px, z: pz, dist };
  }
  return best;
}

/** A new array with [x, z] inserted after `index`. */
export function insertPoint(points: Pt[], index: number, x: number, z: number): Pt[] {
  const out = points.map((p): Pt => [p[0], p[1]]);
  out.splice(index + 1, 0, [x, z]);
  return out;
}

/** A new array without the point at `index`, or null when that would leave fewer than two points. */
export function removePoint(points: Pt[], index: number): Pt[] | null {
  if (points.length <= 2) return null;
  return points.filter((_, i) => i !== index).map((p): Pt => [p[0], p[1]]);
}

/** The index of the point nearest to (x, z) within `maxDist` metres (the first one on a tie), or -1. */
export function nearestPoint(points: Pt[], x: number, z: number, maxDist: number): number {
  let best = -1;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const dist = Math.hypot(points[i][0] - x, points[i][1] - z);
    if (dist <= maxDist && dist < bestDist) {
      best = i;
      bestDist = dist;
    }
  }
  return best;
}

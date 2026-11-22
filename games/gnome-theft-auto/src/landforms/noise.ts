// Small deterministic noise and shape helpers for the landform generators. Pure and fast; same output on every load.
import { clamp, distToSeg, smoothstep } from '@lawn/level';

export { clamp, distToSeg, smoothstep };

function hash(ix: number, iz: number, seed: number): number {
  let h = Math.imul(ix | 0, 0x27d4eb2d) ^ Math.imul(iz | 0, 0x165667b1) ^ Math.imul(seed | 0, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

/** Smooth value noise in [-1, 1] with one feature per unit: scale the input (valueNoise(x / 80, z / 80, 3)). */
export function valueNoise(x: number, z: number, seed = 0): number {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = fade(x - ix), fz = fade(z - iz);
  const a = hash(ix, iz, seed), b = hash(ix + 1, iz, seed), c = hash(ix, iz + 1, seed), d = hash(ix + 1, iz + 1, seed);
  const top = a + (b - a) * fx, bot = c + (d - c) * fx;
  return (top + (bot - top) * fz) * 2 - 1;
}

/** Fractal value noise, about [-1, 1]: `octaves` layers, each `lacunarity` times finer and `gain` times weaker. */
export function fbm(x: number, z: number, seed = 0, octaves = 4, gain = 0.5, lacunarity = 2): number {
  let sum = 0, amp = 1, norm = 0, f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(x * f, z * f, seed + o * 101);
    norm += amp;
    amp *= gain;
    f *= lacunarity;
  }
  return sum / norm;
}

/** Ridged noise in [0, 1]: sharp crests (1) along winding lines, wide troughs. */
export function ridged(x: number, z: number, seed = 0, octaves = 3): number {
  let sum = 0, amp = 1, norm = 0, f = 1;
  for (let o = 0; o < octaves; o++) {
    const n = 1 - Math.abs(valueNoise(x * f, z * f, seed + o * 131));
    sum += amp * n * n;
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

/** Distance from (x, z) to a polyline (a single point is a point). */
export function distToPolyline(x: number, z: number, points: readonly (readonly [number, number])[]): number {
  if (points.length === 1) return Math.hypot(x - points[0][0], z - points[0][1]);
  let best = Infinity;
  for (let i = 0; i + 1 < points.length; i++) {
    const d = distToSeg(x, z, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    if (d < best) best = d;
  }
  return best;
}

/** The nearest point of a polyline: distance `d`, metres along it `s`, and its total length `len`. */
export function nearestOnPolyline(x: number, z: number, points: readonly (readonly [number, number])[]): { d: number; s: number; len: number } {
  let best = Infinity, bestS = 0, acc = 0;
  for (let i = 0; i + 1 < points.length; i++) {
    const [ax, az] = points[i], [bx, bz] = points[i + 1];
    const vx = bx - ax, vz = bz - az;
    const l2 = vx * vx + vz * vz;
    const l = Math.sqrt(l2);
    const t = l2 > 0 ? clamp(((x - ax) * vx + (z - az) * vz) / l2, 0, 1) : 0;
    const d = Math.hypot(x - (ax + vx * t), z - (az + vz * t));
    if (d < best) { best = d; bestS = acc + t * l; }
    acc += l;
  }
  if (points.length === 1) best = Math.hypot(x - points[0][0], z - points[0][1]);
  return { d: best, s: bestS, len: acc };
}

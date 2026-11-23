// Find dry, flat, clear ground near a point for the Sling-Lift to set a vehicle down on. Pure: no three.js, no DOM.
import type { Box } from '../types';
import type { DropSpot, SpotOpts, SpotProbe } from './types';

const RING_STEP = 2.5;
const RING_ANGLE_STEP = 0.37;
const MIN_SPOKES = 8;
const SPOKE_SPACING = 3;
const MAX_GROUND_SPREAD = 0.6;

/** Nearest dry, flat, clear spot to (cx, cz) that fits opts.radius, or null when no ring has one. */
export function findSafeSpot(cx: number, cz: number, probe: SpotProbe, opts: SpotOpts): DropSpot | null {
  const r = opts.radius;
  let ring = 0;
  for (let d = opts.minDist; d <= opts.maxDist + 1e-9; d += RING_STEP, ring++) {
    const n = Math.max(MIN_SPOKES, Math.round((2 * Math.PI * d) / SPOKE_SPACING));
    const start = ring * RING_ANGLE_STEP;
    for (let k = 0; k < n; k++) {
      const a = start + (k * 2 * Math.PI) / n;
      const x = cx + Math.sin(a) * d;
      const z = cz + Math.cos(a) * d;
      if (isGoodSpot(x, z, probe, opts)) {
        return { x, y: probe.ground(x, z), z, yaw: Math.atan2(cx - x, cz - z) };
      }
    }
  }
  return null;
}

function isGoodSpot(x: number, z: number, probe: SpotProbe, opts: SpotOpts): boolean {
  if (probe.blocked(x, z, opts.radius)) return false;
  const r = opts.radius;
  const pts: Array<[number, number]> = [
    [x, z],
    [x + r, z],
    [x - r, z],
    [x, z + r],
    [x, z - r],
  ];
  let minG = Infinity;
  let maxG = -Infinity;
  for (const [px, pz] of pts) {
    if (probe.water(px, pz) > opts.maxWater) return false;
    if (probe.slope(px, pz) > opts.maxSlope) return false;
    const g = probe.ground(px, pz);
    if (g < minG) minG = g;
    if (g > maxG) maxG = g;
  }
  return maxG - minG <= MAX_GROUND_SPREAD;
}

/** SpotProbe.blocked from the world's colliders: overlaps a box (grown by r) or leaves [-half + r, half - r]. */
export function boxesBlocked(boxes: readonly Box[], half: number): (x: number, z: number, r: number) => boolean {
  return (x, z, r) => {
    if (Math.abs(x) > half - r || Math.abs(z) > half - r) return true;
    for (const b of boxes) {
      if (x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r) return true;
    }
    return false;
  };
}

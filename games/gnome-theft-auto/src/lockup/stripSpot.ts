// Find a clear, dry, flat take-off strip for a fixed-wing aircraft, for the Sling-Lift. Pure: no three.js, no DOM.
import type { DropSpot, SpotProbe, StripOpts } from './types';

const RING_STEP = 5;
const RING_ANGLE_STEP = 0.37;
const MIN_SPOKES = 8;
const SPOKE_SPACING = 6;
const SAMPLE_STEP = 6;
const HEADINGS = 8;
const MAX_GROUND_SPREAD = 1.5;

/** Nearest spot to (cx, cz) with a clear, dry, flat take-off strip of opts.length ahead along the returned yaw. */
export function findStripSpot(cx: number, cz: number, probe: SpotProbe, opts: StripOpts): DropSpot | null {
  let ring = 0;
  for (let d = opts.minDist; d <= opts.maxDist + 1e-9; d += RING_STEP, ring++) {
    // A minDist of 0 makes the first ring the centre point itself: one candidate, not a ring of spokes.
    const n = d <= 0 ? 1 : Math.max(MIN_SPOKES, Math.round((2 * Math.PI * d) / SPOKE_SPACING));
    const start = ring * RING_ANGLE_STEP;
    for (let k = 0; k < n; k++) {
      const a = start + (k * 2 * Math.PI) / n;
      const x = d <= 0 ? cx : cx + Math.sin(a) * d;
      const z = d <= 0 ? cz : cz + Math.cos(a) * d;
      for (let h = 0; h < HEADINGS; h++) {
        const yaw = (h * Math.PI) / 4;
        if (isGoodStrip(x, z, yaw, probe, opts)) {
          return { x, y: probe.ground(x, z), z, yaw };
        }
      }
    }
  }
  return null;
}

function stripSamples(x: number, z: number, yaw: number, length: number): Array<[number, number]> {
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const pts: Array<[number, number]> = [];
  for (let s = 0; s <= length + 1e-9; s += SAMPLE_STEP) {
    pts.push([x + fx * s, z + fz * s]);
  }
  return pts;
}

function isGoodStrip(x: number, z: number, yaw: number, probe: SpotProbe, opts: StripOpts): boolean {
  const pts = stripSamples(x, z, yaw, opts.length);
  for (const [px, pz] of pts) {
    if (probe.water(px, pz) > opts.maxWater) return false;
    if (probe.slope(px, pz) > opts.maxSlope) return false;
  }
  for (const [px, pz] of pts) {
    if (probe.blocked(px, pz, opts.radius)) return false;
  }
  let minG = Infinity;
  let maxG = -Infinity;
  for (const [px, pz] of pts) {
    const g = probe.ground(px, pz);
    if (g < minG) minG = g;
    if (g > maxG) maxG = g;
  }
  return maxG - minG <= MAX_GROUND_SPREAD;
}

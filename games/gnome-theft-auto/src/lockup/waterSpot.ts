// Find open water deep enough to set a boat down on, for the Sling-Lift. Pure: no three.js, no DOM.
import type { DropSpot, SpotProbe, WaterSpotOpts } from './types';

const RING_STEP = 2.5;
const RING_ANGLE_STEP = 0.37;
const MIN_SPOKES = 8;
const SPOKE_SPACING = 3;

/** Nearest open water to (cx, cz) deep enough for a boat; y = the water surface. Null when none within opts.maxDist. */
export function findWaterSpot(cx: number, cz: number, probe: SpotProbe, opts: WaterSpotOpts): DropSpot | null {
  let ring = 0;
  for (let d = opts.minDist; d <= opts.maxDist + 1e-9; d += RING_STEP, ring++) {
    const n = Math.max(MIN_SPOKES, Math.round((2 * Math.PI * d) / SPOKE_SPACING));
    const start = ring * RING_ANGLE_STEP;
    for (let k = 0; k < n; k++) {
      const a = start + (k * 2 * Math.PI) / n;
      const x = cx + Math.sin(a) * d;
      const z = cz + Math.cos(a) * d;
      if (isGoodSpot(x, z, probe, opts)) {
        return {
          x,
          y: probe.ground(x, z) + probe.water(x, z),
          z,
          yaw: Math.atan2(cx - x, cz - z),
        };
      }
    }
  }
  return null;
}

function isGoodSpot(x: number, z: number, probe: SpotProbe, opts: WaterSpotOpts): boolean {
  const r = opts.radius;
  const pts: Array<[number, number]> = [
    [x, z],
    [x + r, z],
    [x - r, z],
    [x, z + r],
    [x, z - r],
  ];
  for (const [px, pz] of pts) {
    if (probe.water(px, pz) < opts.minDepth) return false;
  }
  return !probe.blocked(x, z, r);
}

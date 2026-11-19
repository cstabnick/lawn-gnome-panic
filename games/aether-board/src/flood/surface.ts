// The water surface as ground: where the water is deep enough the board rides on top of it, tilted by the surface's
// slope (so a wave face can be carved, climbed and dropped off), instead of on the ground under it. Pure.
import type { GroundModifier } from '../physics';
import { FLOOD, type Flood, type FlowSample } from './types';

const E = 1.2; // m, spacing of the slope samples

function smooth01(x: number): number {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

export function createWaterGround(flood: Flood): GroundModifier {
  const s: FlowSample = { depth: 0, vx: 0, vz: 0, bedY: 0, surfaceY: 0 };
  const sp: FlowSample = { depth: 0, vx: 0, vz: 0, bedY: 0, surfaceY: 0 };
  return (_w, x, z, g) => {
    if (!flood.sample(x, z, g.island, s) || s.depth < FLOOD.floatDepth * 0.5) return;
    // 0 at half the float depth, 1 at 1.5x: the board eases onto the surface and off it again
    const t = smooth01((s.depth - FLOOD.floatDepth * 0.5) / FLOOD.floatDepth);
    if (t <= 0) return;
    // surface height around the point; a neighbour with no water uses the ground height there
    const h = (dx: number, dz: number): number => (flood.sample(x + dx, z + dz, g.island, sp) ? sp.surfaceY : s.bedY);
    let gx = (h(E, 0) - h(-E, 0)) / (2 * E);
    let gz = (h(0, E) - h(0, -E)) / (2 * E);
    const m = Math.hypot(gx, gz);
    if (m > FLOOD.maxSurfaceSlope) {
      gx *= FLOOD.maxSurfaceSlope / m;
      gz *= FLOOD.maxSurfaceSlope / m;
    }
    const ny = 1 / Math.hypot(gx, 1, gz);
    const nx = -gx * ny;
    const nz = -gz * ny;
    g.y += (s.surfaceY - FLOOD.sink - g.y) * t;
    g.normal.x += (nx - g.normal.x) * t;
    g.normal.y += (ny - g.normal.y) * t;
    g.normal.z += (nz - g.normal.z) * t;
    g.normal.normalize();
  };
}

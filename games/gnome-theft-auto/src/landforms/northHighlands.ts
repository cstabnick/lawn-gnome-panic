// North Highlands landforms (region document north-highlands.level.json, data.terrain): a rolling high moor with crags
// that fade out near roads. Paint: snow on the high ground, gravel on steep faces, meadow elsewhere.
import { distToPolyline, fbm, ridged, smoothstep } from './noise';
import { roadDistAt } from './fields';
import type { Landform, LandformInput, GroundFacts, PaintKind } from './types';

const DEFAULTS = { swell: 4, swellScale: 240, crags: 5, cragScale: 90 };

function param(input: LandformInput, name: keyof typeof DEFAULTS): number {
  return input.params[name] ?? DEFAULTS[name];
}

export const landform: Landform = {
  id: 'gta-highland-relief',
  version: 1,
  relief(x, z, input) {
    const swell = param(input, 'swell') * fbm(x / param(input, 'swellScale'), z / param(input, 'swellScale'), 61, 3);
    const crags =
      param(input, 'crags') *
      Math.max(0, ridged(x / param(input, 'cragScale'), z / param(input, 'cragScale'), 63, 2) - 0.4) *
      smoothstep(10, 50, roadDistAt(x, z));
    return swell + crags;
  },
  paint(x, z, g: GroundFacts, input: LandformInput): PaintKind | null {
    // E12: Pail Pond is ice (a `pond` feature: within r of its point) and Snowdrop Slope is snow to the foot (a
    // `snowfield` feature: within r of its line). The Wasm kernel (assembly/kernel.ts evalRegionPaint) mirrors this.
    for (const f of input.features) {
      if (f.r === undefined || f.points.length === 0) continue;
      if (f.kind === 'pond') {
        const [px, pz] = f.points[0];
        if (Math.hypot(x - px, z - pz) < f.r) return 'ice';
      } else if (f.kind === 'snowfield') {
        if (distToPolyline(x, z, f.points) < f.r) return 'snow';
      }
    }
    if (g.height > 32) return 'snow';
    if (g.slope > 0.3) return 'gravel';
    return 'meadow';
  },
};

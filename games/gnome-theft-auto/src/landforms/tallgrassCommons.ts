// Tallgrass Commons landforms (region document tallgrass-commons.level.json, data.terrain): soft meadow mounds, a broad
// flat-topped hive hill, and meadow paint (the hill's flat top is grass).
import { fbm, smoothstep } from './noise';
import { roadDistAt } from './fields';
import type { Landform, LandformInput, GroundFacts, PaintKind } from './types';

const DEFAULTS = { swell: 2, swellScale: 260, mounds: 3, moundScale: 70 };

function param(input: LandformInput, name: keyof typeof DEFAULTS): number {
  return input.params[name] ?? DEFAULTS[name];
}

export const landform: Landform = {
  id: 'gta-commons-relief',
  version: 1,
  relief(x, z, input) {
    const swell = param(input, 'swell') * fbm(x / param(input, 'swellScale'), z / param(input, 'swellScale'), 51, 2);
    const mounds =
      param(input, 'mounds') *
      Math.max(0, fbm(x / param(input, 'moundScale'), z / param(input, 'moundScale'), 53, 2)) *
      smoothstep(10, 50, roadDistAt(x, z));
    let hill = 0;
    for (const f of input.features) {
      if (f.kind !== 'hill' || f.points.length === 0) continue;
      const r = f.r ?? 90, h = f.h ?? 10;
      const d = Math.hypot(x - f.points[0][0], z - f.points[0][1]);
      hill += h * (1 - smoothstep(r * 0.25, r, d));
    }
    return swell + mounds + hill;
  },
  paint(x, z, _g: GroundFacts, input: LandformInput): PaintKind | null {
    for (const f of input.features) {
      if (f.kind !== 'hill' || f.points.length === 0) continue;
      const r = f.r ?? 90;
      const d = Math.hypot(x - f.points[0][0], z - f.points[0][1]);
      if (d < r * 0.25) return 'grass';
    }
    return 'meadow';
  },
};

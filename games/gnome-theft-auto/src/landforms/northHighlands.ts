// North Highlands landforms (region document north-highlands.level.json, data.terrain): a rolling high moor with crags
// that fade out near roads. Paint: snow on the high ground, gravel on steep faces, meadow elsewhere.
import { fbm, ridged, smoothstep } from './noise';
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
  paint(_x, _z, g: GroundFacts): PaintKind | null {
    if (g.height > 32) return 'snow';
    if (g.slope > 0.3) return 'gravel';
    return 'meadow';
  },
};

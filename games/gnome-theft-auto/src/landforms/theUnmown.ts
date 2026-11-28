// The Unmown landforms (region document the-unmown.level.json, data.terrain): an unmown corner, rolling ground with
// small tussocky hummocks. Paint: bare dirt on the steep bits, moss in the damp hollows of a slow field, meadow elsewhere.
import { fbm } from './noise';
import type { GroundFacts, Landform, LandformInput, PaintKind } from './types';

const DEFAULTS = { swell: 3, swellScale: 200, hummocks: 1.2, hummockScale: 40 };

function param(input: LandformInput, name: keyof typeof DEFAULTS): number {
  return input.params[name] ?? DEFAULTS[name];
}

export const landform: Landform = {
  id: 'gta-preserve-relief',
  version: 1,
  relief(x, z, input) {
    const swell = param(input, 'swell') * fbm(x / param(input, 'swellScale'), z / param(input, 'swellScale'), 111, 3);
    const hummocks = param(input, 'hummocks') * fbm(x / param(input, 'hummockScale'), z / param(input, 'hummockScale'), 113, 2);
    return swell + hummocks;
  },
  paint(x, z, g: GroundFacts): PaintKind | null {
    if (g.slope > 0.35) return 'dirt';
    return fbm(x / 150, z / 150, 115, 2) > 0.45 ? 'moss' : 'meadow';
  },
};

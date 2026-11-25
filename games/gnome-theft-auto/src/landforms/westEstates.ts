// West Estates landforms (region document west-estates.level.json, data.terrain): rolling estate parkland. Paint: meadow
// patches where a slow noise field is high, grass elsewhere.
import { fbm } from './noise';
import type { Landform, LandformInput, PaintKind } from './types';

const DEFAULTS = { swell: 3, swellScale: 220 };

function param(input: LandformInput, name: keyof typeof DEFAULTS): number {
  return input.params[name] ?? DEFAULTS[name];
}

export const landform: Landform = {
  id: 'gta-estate-relief',
  version: 1,
  relief(x, z, input) {
    return param(input, 'swell') * fbm(x / param(input, 'swellScale'), z / param(input, 'swellScale'), 91, 3);
  },
  paint(x, z): PaintKind | null {
    return fbm(x / 120, z / 120, 93, 2) > 0.25 ? 'meadow' : 'grass';
  },
};

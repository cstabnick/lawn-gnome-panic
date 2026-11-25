// East Campus landforms (region document east-campus.level.json, data.terrain): gentle parkland swell, grass everywhere.
import { fbm } from './noise';
import type { Landform, LandformInput, PaintKind } from './types';

const DEFAULTS = { swell: 2.5, swellScale: 260 };

function param(input: LandformInput, name: keyof typeof DEFAULTS): number {
  return input.params[name] ?? DEFAULTS[name];
}

export const landform: Landform = {
  id: 'gta-campus-relief',
  version: 1,
  relief(x, z, input) {
    return param(input, 'swell') * fbm(x / param(input, 'swellScale'), z / param(input, 'swellScale'), 81, 2);
  },
  paint(): PaintKind | null {
    return 'grass';
  },
};

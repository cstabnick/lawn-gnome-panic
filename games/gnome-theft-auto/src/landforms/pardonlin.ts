// Pardonlin landforms (region document pardonlin.level.json, data.terrain): a continental garden laid nearly level, a
// long low swell under the town and the Jardin. Paint: meadow lawns where a slow noise field is high, grass elsewhere.
import { fbm } from './noise';
import type { Landform, LandformInput, PaintKind } from './types';

const DEFAULTS = { swell: 1.5, swellScale: 260 };

function param(input: LandformInput, name: keyof typeof DEFAULTS): number {
  return input.params[name] ?? DEFAULTS[name];
}

export const landform: Landform = {
  id: 'gta-continental-relief',
  version: 1,
  relief(x, z, input) {
    return param(input, 'swell') * fbm(x / param(input, 'swellScale'), z / param(input, 'swellScale'), 101, 2);
  },
  paint(x, z): PaintKind | null {
    return fbm(x / 90, z / 90, 103, 2) > 0.35 ? 'meadow' : 'grass';
  },
};

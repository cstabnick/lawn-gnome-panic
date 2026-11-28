// South Shore landforms (region document south-shore.level.json, data.terrain): low dunes and a long swell above the
// beach. Paint: sand from the beach line (z > 1130) to the edge, and sand round the whole town (|x| <= 460, z > 1000:
// under the boardwalk and the wheel); grass elsewhere inland.
import { fbm } from './noise';
import type { Landform, LandformInput, GroundFacts, PaintKind } from './types';

const DEFAULTS = { dunes: 2.5, duneScale: 70, swell: 2, swellScale: 300 };

function param(input: LandformInput, name: keyof typeof DEFAULTS): number {
  return input.params[name] ?? DEFAULTS[name];
}

export const landform: Landform = {
  id: 'gta-coast-relief',
  version: 1,
  relief(x, z, input) {
    const dunes = param(input, 'dunes') * fbm(x / param(input, 'duneScale'), z / param(input, 'duneScale'), 71, 2);
    const swell = param(input, 'swell') * fbm(x / param(input, 'swellScale'), z / param(input, 'swellScale'), 73, 2);
    return dunes + swell;
  },
  paint(x: number, z: number, _g: GroundFacts): PaintKind | null {
    return z > 1130 || (Math.abs(x) <= 460 && z > 1000) ? 'sand' : 'grass';
  },
};

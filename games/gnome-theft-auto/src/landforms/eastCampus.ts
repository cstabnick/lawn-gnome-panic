// East Campus landforms (region document east-campus.level.json, data.terrain): gentle parkland swell, grass everywhere.
import { fbm } from './noise';
import type { GroundFacts, Landform, LandformInput, PaintKind } from './types';

const DEFAULTS = { swell: 2.5, swellScale: 260 };
/** The observatory forecourt: the summit flat (30 m) plus 2. */
const FORECOURT_R = 32;

function param(input: LandformInput, name: keyof typeof DEFAULTS): number {
  return input.params[name] ?? DEFAULTS[name];
}

export const landform: Landform = {
  id: 'gta-campus-relief',
  version: 1,
  relief(x, z, input) {
    return param(input, 'swell') * fbm(x / param(input, 'swellScale'), z / param(input, 'swellScale'), 81, 2);
  },
  paint(x: number, z: number, _g: GroundFacts, input: LandformInput): PaintKind | null {
    // E13: the Anthill (an `anthill` feature: its point, radius r) is gravel in the observatory forecourt (within
    // FORECOURT_R of the point) and painted earth to its foot; the rest of Rootwell is grass. The Wasm kernel
    // (assembly/kernel.ts evalRegionPaint, reg 9) mirrors this.
    for (const f of input.features) {
      if (f.kind !== 'anthill' || f.r === undefined || f.points.length === 0) continue;
      const d = Math.hypot(x - f.points[0][0], z - f.points[0][1]);
      if (d < FORECOURT_R) return 'gravel';
      if (d < f.r) return 'dirt';
    }
    return 'grass';
  },
};

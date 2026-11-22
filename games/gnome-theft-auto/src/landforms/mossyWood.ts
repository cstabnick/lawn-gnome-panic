// Mossy Wood landforms (region document mossy-wood.level.json, data.terrain): a rolling forest floor, a ravine whose
// banks rise either side of the river, calm spots that keep building sites level, and forest-floor paint with mud along
// the river.
import { fbm, smoothstep } from './noise';
import { riverDistAt, roadDistAt } from './fields';
import type { GroundFacts, Landform, LandformInput, PaintKind } from './types';

const DEFAULTS = { floor: 3.5, floorScale: 180, bank: 7, bankReach: 40, bankFall: 60, muddy: 14 };

function param(input: LandformInput, name: keyof typeof DEFAULTS): number {
  return input.params[name] ?? DEFAULTS[name];
}

export const landform: Landform = {
  id: 'gta-mossy-relief',
  version: 1,
  relief(x, z, input) {
    const floor = param(input, 'floor');
    const floorScale = param(input, 'floorScale');
    const bank = param(input, 'bank');
    const bankReach = param(input, 'bankReach');
    const bankFall = param(input, 'bankFall');

    // Calm spots: floor and banks ease in from zero at the spot's radius out to 40 m past it.
    let calm = 1;
    for (const f of input.features) {
      if (f.kind !== 'calm') continue;
      const [px, pz] = f.points[0];
      const r = f.r ?? 40;
      calm *= smoothstep(r, r + 40, Math.hypot(x - px, z - pz));
    }

    const rolling = floor * fbm(x / floorScale, z / floorScale, 21, 3);
    const banks = bank * (1 - smoothstep(bankReach, bankReach + bankFall, riverDistAt(x, z)))
      * smoothstep(20, 120, roadDistAt(x, z));
    return calm * (rolling + banks);
  },
  paint(x, z, g, input): PaintKind | null {
    if (g.riverDist < param(input, 'muddy')) return 'mud';
    if (fbm(x / 90, z / 90, 5, 2) > 0.35) return 'moss';
    return 'forest';
  },
};

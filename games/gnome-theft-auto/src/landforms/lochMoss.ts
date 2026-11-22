// Loch Moss landforms (region document loch-moss.level.json, data.terrain): a highland glen around the loch. Steep glen
// walls on the loch's north and west sides, open low ground to the south-east, a rolling moor above the walls, a gravel
// shingle shore and a small island in the loch. Features arrive in world coordinates.
import { fbm, smoothstep } from './noise';
import { roadDistAt, waterDistAt } from './fields';
import type { Landform, LandformInput, GroundFacts, PaintKind } from './types';

const DEFAULTS = { cx: -700, cz: -680, wall: 16, wallStart: 30, wallWidth: 18, moor: 5, moorScale: 150, shore: 14 };

function param(input: LandformInput, name: keyof typeof DEFAULTS): number {
  return input.params[name] ?? DEFAULTS[name];
}

/** 1 on the loch's north and west sides, 0 on the south-east. */
function sideAt(x: number, z: number, cx: number, cz: number): number {
  const dx = x - cx, dz = z - cz;
  const open = (dx + dz) / (Math.hypot(dx, dz) * Math.SQRT2 + 1e-6);
  return 1 - smoothstep(-0.1, 0.5, open);
}

export const landform: Landform = {
  id: 'gta-loch-relief',
  version: 1,
  relief(x, z, input) {
    const cx = param(input, 'cx'), cz = param(input, 'cz');
    const side = sideAt(x, z, cx, cz);
    const wall = param(input, 'wall') * smoothstep(param(input, 'wallStart'), param(input, 'wallStart') + param(input, 'wallWidth'), waterDistAt(x, z)) * side;
    const moor = param(input, 'moor') * (fbm(x / param(input, 'moorScale'), z / param(input, 'moorScale'), 61, 3) * 0.5 + 0.5)
      * smoothstep(20, 80, waterDistAt(x, z)) * smoothstep(15, 60, roadDistAt(x, z));
    let island = 0;
    for (const f of input.features) {
      if (f.kind !== 'island' || f.points.length === 0) continue;
      const r = f.r ?? 1, h = f.h ?? 0;
      const d = Math.hypot(x - f.points[0][0], z - f.points[0][1]);
      island = Math.max(island, h * (1 - smoothstep(r * 0.4, r, d)));
    }
    return wall + moor + island;
  },
  paint(x, z, g: GroundFacts, input: LandformInput): PaintKind | null {
    for (const f of input.features) {
      if (f.kind !== 'island' || f.points.length === 0) continue;
      const r = f.r ?? 1;
      if (Math.hypot(x - f.points[0][0], z - f.points[0][1]) < r * 0.4) return 'moss';
    }
    if (g.waterDist < param(input, 'shore') && g.slope < 0.6) return 'gravel';
    return null;
  },
};

// Cloverfield Farms landforms (region document cloverfield-farms.level.json, data.terrain): rolling hills that sink toward
// the Puddle Sea, calm spots for buildings, two terraced fields, mud pens and a sandy beach. All tuning lives in the document.
import { fbm, smoothstep, distToPolyline } from './noise';
import { waterDistAt } from './fields';
import type { Landform, LandformInput, GroundFacts, PaintKind } from './types';

const num = (input: LandformInput, name: string, fallback: number): number => input.params[name] ?? fallback;

function pointFeatures(input: LandformInput, kind: string) {
  return input.features.filter((f) => f.kind === kind && f.points.length > 0);
}

export const landform: Landform = {
  id: 'gta-farms-relief',
  version: 1,
  relief(x, z, input) {
    const hills = num(input, 'hills', 3.5);
    const hillScale = num(input, 'hillScale', 200);
    const seaDip = num(input, 'seaDip', 2);
    const step = num(input, 'step', 1.5);

    // Rolling hills, calmed around buildings and flattened toward the Puddle Sea.
    let rolling = hills * fbm(x / hillScale, z / hillScale, 41, 3);
    for (const f of pointFeatures(input, 'calm')) {
      const r = f.r ?? 50;
      const d = distToPolyline(x, z, f.points);
      rolling *= smoothstep(r, r + 40, d);
    }
    let h = rolling * (1 - 0.8 * smoothstep(560, 760, z));
    // The shore falls to the sea.
    h -= seaDip * (1 - smoothstep(0, 160, waterDistAt(x, z))) * smoothstep(600, 740, z);

    // Terraces: stepped hills for raised fields.
    for (const f of pointFeatures(input, 'terrace')) {
      const r = f.r ?? 60;
      const top = f.h ?? 6;
      const d = distToPolyline(x, z, f.points);
      const f1 = 1 - smoothstep(0, r, d);
      const level = top * f1;
      const q = level / step;
      const whole = Math.floor(q);
      h += step * (whole + smoothstep(0.7, 1, q - whole));
    }
    return h;
  },
  paint(x, z, g: GroundFacts, input: LandformInput): PaintKind | null {
    for (const f of pointFeatures(input, 'pen')) {
      if (distToPolyline(x, z, f.points) < (f.r ?? 10)) return 'mud';
    }
    for (const f of pointFeatures(input, 'terrace')) {
      if (distToPolyline(x, z, f.points) < (f.r ?? 60)) return 'farm';
    }
    if (g.waterDist < 14 && z > 740) return 'sand';
    return null;
  },
};

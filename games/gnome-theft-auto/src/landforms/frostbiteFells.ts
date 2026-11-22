// Frostbite Fells landforms (region document frostbite-fells.level.json, data.terrain): snowy ridges growing north,
// three rocky crags, a glacier tongue and three frozen ponds painted ice. Numbers and shapes come from the document.
import { fbm, ridged, distToPolyline, nearestOnPolyline, smoothstep } from './noise';
import { roadDistAt } from './fields';
import type { Landform, LandformInput, GroundFacts, PaintKind } from './types';

function num(input: LandformInput, name: string, fallback: number): number {
  const v = input.params[name];
  return typeof v === 'number' ? v : fallback;
}

function pointOf(points: readonly (readonly [number, number])[]): readonly [number, number] {
  return points[0];
}

export const landform: Landform = {
  id: 'gta-fells-relief',
  version: 1,
  relief(x, z, input) {
    const base = num(input, 'base', 3);
    const baseScale = num(input, 'baseScale', 220);
    const ridgeHeight = num(input, 'ridgeHeight', 9);
    const ridgeScale = num(input, 'ridgeScale', 260);

    // Calm spots: base and ridges fade back to zero inside them (so buildings sit on level ground).
    let calm = 1;
    for (const f of input.features) {
      if (f.kind !== 'calm' || f.r === undefined) continue;
      const [cx, cz] = pointOf(f.points);
      const d = Math.hypot(x - cx, z - cz);
      calm *= smoothstep(f.r, f.r + 40, d);
    }

    // Highways are calmed too: near the river the base rolls into the mask fade, which is steep otherwise.
    const roadCalm = smoothstep(30, 120, roadDistAt(x, z));
    const baseH = base * roadCalm * fbm(x / baseScale, z / baseScale, 31, 2);
    const northRamp = smoothstep(-450, -750, z);
    const ridgeH = ridgeHeight * ridged(x / ridgeScale, z / ridgeScale, 37, 2) * northRamp * roadCalm;
    let h = (baseH + ridgeH) * calm;

    for (const f of input.features) {
      if (f.r === undefined) continue;
      if (f.kind === 'crag' && f.h !== undefined) {
        const [cx, cz] = pointOf(f.points);
        const d = Math.hypot(x - cx, z - cz);
        h += f.h * (1 - smoothstep(f.r * 0.3, f.r, d));
      } else if (f.kind === 'glacier' && f.h !== undefined) {
        const { d, s, len } = nearestOnPolyline(x, z, f.points);
        h += f.h * (1 - smoothstep(0, f.r, d)) * (1 - 0.6 * (len > 0 ? s / len : 0));
      } else if (f.kind === 'pond') {
        const [px, pz] = pointOf(f.points);
        const d = Math.hypot(x - px, z - pz);
        h += -1.2 * (1 - smoothstep(f.r * 0.6, f.r, d));
      }
    }
    return h;
  },
  paint(x, z, _g: GroundFacts, input: LandformInput): PaintKind | null {
    for (const f of input.features) {
      if (f.r === undefined) continue;
      if (f.kind === 'pond') {
        const [px, pz] = pointOf(f.points);
        if (Math.hypot(x - px, z - pz) < f.r) return 'ice';
      } else if (f.kind === 'glacier') {
        if (distToPolyline(x, z, f.points) < 0.6 * f.r) return 'ice';
      }
    }
    return null;
  },
};

// Dust Flats landforms (region document dust-flats.level.json, data.terrain): a sandy swell with dune fields, three
// mesas, a dry canyon. Every tuning number and shape comes from the document (input.params / input.features).
import { distToPolyline, fbm, ridged, smoothstep, valueNoise } from './noise';
import { roadDistAt } from './fields';
import type { Landform, LandformInput, GroundFacts, PaintKind } from './types';

const DEFAULTS = {
  swell: 3,
  swellScale: 240,
  duneHeight: 1.4,
  duneSpacing: 60,
  duneLength: 240,
  windAngle: 0.6,
};

/** Calm spots that cover the dune and swell relief (building check); 1 far from every calm feature. */
function calmAt(x: number, z: number, input: LandformInput): number {
  let k = 1;
  for (const f of input.features) {
    if (f.kind !== 'calm' || !f.r) continue;
    const d = Math.hypot(x - f.points[0][0], z - f.points[0][1]);
    k *= smoothstep(f.r, f.r + 40, d);
  }
  return k;
}

export const landform: Landform = {
  id: 'gta-dust-relief',
  version: 1,
  relief(x, z, input) {
    const P = input.params;
    const swellAmp = P.swell ?? DEFAULTS.swell;
    const swellScale = P.swellScale ?? DEFAULTS.swellScale;
    const duneHeight = P.duneHeight ?? DEFAULTS.duneHeight;
    const duneSpacing = P.duneSpacing ?? DEFAULTS.duneSpacing;
    const duneLength = P.duneLength ?? DEFAULTS.duneLength;
    const a = P.windAngle ?? DEFAULTS.windAngle;
    const calm = calmAt(x, z, input);

    // Swell: the gentle sandy rise and fall of the whole flat.
    const swell = swellAmp * fbm(x / swellScale, z / swellScale, 11, 2);

    // Dunes: ridged crests running across the wind, in thin patches and calm near the highways.
    const u = x * Math.cos(a) + z * Math.sin(a);
    const v = -x * Math.sin(a) + z * Math.cos(a);
    const field = smoothstep(-0.1, 0.3, valueNoise(x / 420, z / 420, 5));
    const roadCalm = 0.3 + 0.7 * smoothstep(15, 70, roadDistAt(x, z));
    const dunes = duneHeight * ridged(u / duneLength, v / duneSpacing, 7, 2) * field * roadCalm;

    let h = (swell + dunes) * calm;

    for (const f of input.features) {
      if (f.kind === 'mesa' && f.r && f.h) {
        const d = Math.hypot(x - f.points[0][0], z - f.points[0][1]);
        h += f.h * (1 - smoothstep(f.r, f.r + f.h * 1.2, d));
      } else if (f.kind === 'canyon' && f.r && f.h) {
        const d = distToPolyline(x, z, f.points);
        h -= f.h * (1 - smoothstep(f.r * 0.35, f.r, d));
      }
    }
    return h;
  },
  paint(x, z, _g: GroundFacts, input: LandformInput): PaintKind | null {
    for (const f of input.features) {
      if (f.kind === 'canyon' && f.r) {
        if (distToPolyline(x, z, f.points) < f.r * 0.35) return 'gravel';
      }
    }
    return null;
  },
};

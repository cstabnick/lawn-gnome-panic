// North Highlands landforms (region document north-highlands.level.json, data.terrain): a rolling high moor with crags
// that fade out near roads. Paint (D12, FX12): Snowcap Rise is snow all over, with gravel on steep faces, ice on Pail
// Pond, snow aprons round the pond and Snowdrop Slope, and green only where the snow will not lie: inside a `thaw`
// feature (Capwood's spore-warmed hollow, Mittenholt's green) and in a patchy frost band along the region's inner
// border, where the Rise meets the greener yards round it.
import { distToPolyline, fbm, ridged, smoothstep } from './noise';
import { borderDistAt, roadDistAt } from './fields';
import type { Landform, LandformInput, GroundFacts, PaintKind } from './types';

const DEFAULTS = { swell: 4, swellScale: 240, crags: 5, cragScale: 90 };

/** The paint rule's numbers (the Wasm kernel, assembly/kernel.ts evalRegionPaint, repeats them: keep both in step). */
export const SNOW_PAINT = {
  /** Snow apron round a pond and a snowfield: metres past r, plus up to `apronWobble` of edge noise. */
  apron: 30, apronWobble: 10,
  /** Frost ring outside a thaw feature's r, metres. */
  thawFrost: 28,
  /** Frost band along the region's inner border, metres. */
  borderFrost: 45,
  /** Edge noise on the thaw and border bands, metres. */
  edgeWobble: 12,
  /** Steeper than this (rise over run) is gravel, outside the aprons. */
  gravelSlope: 0.45,
} as const;

function param(input: LandformInput, name: keyof typeof DEFAULTS): number {
  return input.params[name] ?? DEFAULTS[name];
}

/** True when a frost cell is snow: `s` 0..1 is how snowy the band is here (0 = green, 1 = white), patch noise decides. */
function frostIsSnow(x: number, z: number, s: number): boolean {
  return 0.5 + 0.5 * fbm(x / 11, z / 11, 1207, 2) < s;
}

export const landform: Landform = {
  id: 'gta-highland-relief',
  version: 1,
  relief(x, z, input) {
    const swell = param(input, 'swell') * fbm(x / param(input, 'swellScale'), z / param(input, 'swellScale'), 61, 3);
    const crags =
      param(input, 'crags') *
      Math.max(0, ridged(x / param(input, 'cragScale'), z / param(input, 'cragScale'), 63, 2) - 0.4) *
      smoothstep(10, 50, roadDistAt(x, z));
    return swell + crags;
  },
  paint(x, z, g: GroundFacts, input: LandformInput): PaintKind | null {
    const P = SNOW_PAINT;
    // 1. Pail Pond is ice (a `pond` feature, within r of its point).
    for (const f of input.features) {
      if (f.r === undefined || f.points.length === 0 || f.kind !== 'pond') continue;
      const [px, pz] = f.points[0];
      if (Math.hypot(x - px, z - pz) < f.r) return 'ice';
    }
    // 2. Snow aprons: within r + apron of a pond, or of a `snowfield` line (Snowdrop Slope), steep or not.
    const wobble = fbm(x / 40, z / 40, 1201, 2);
    for (const f of input.features) {
      if (f.r === undefined || f.points.length === 0) continue;
      const reach = f.r + P.apron + P.apronWobble * wobble;
      if (f.kind === 'pond') {
        const [px, pz] = f.points[0];
        if (Math.hypot(x - px, z - pz) < reach) return 'snow';
      } else if (f.kind === 'snowfield') {
        if (distToPolyline(x, z, f.points) < reach) return 'snow';
      }
    }
    // 3. Steep faces are gravel.
    if (g.slope > P.gravelSlope) return 'gravel';
    // 4. Thaws: green inside r, frost out to r + thawFrost (noisy edge).
    const edge = P.edgeWobble * fbm(x / 60, z / 60, 1203, 2);
    let s = 1;
    for (const f of input.features) {
      if (f.r === undefined || f.points.length === 0 || f.kind !== 'thaw') continue;
      const d = distToPolyline(x, z, f.points) - f.r + edge;
      if (d < 0) return 'meadow';
      if (d < P.thawFrost) s = Math.min(s, d / P.thawFrost);
    }
    // 5. The border frost band: 0.35 snowy at the border, all white borderFrost metres in.
    const bd = borderDistAt(x, z) + edge;
    if (bd < P.borderFrost) s = Math.min(s, 0.35 + (0.65 * Math.max(0, bd)) / P.borderFrost);
    if (s < 1) return frostIsSnow(x, z, s) ? 'snow' : 'meadow';
    return 'snow';
  },
};

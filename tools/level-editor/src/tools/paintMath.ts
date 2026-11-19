// One dab of surface paint: every metre cell whose centre is within `radius` of (x, z) becomes surface `id` (0 erases).
import type { PaintGrid, PaintPatch } from '@lawn/level';

/** Applies the dab to `grid` and returns what changed (empty arrays when nothing did). */
export function paintDab(grid: PaintGrid, x: number, z: number, radius: number, id: number): PaintPatch {
  const out: PaintPatch = { ix: [], iz: [], before: [], after: [] };
  if (!(radius > 0) || !Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(radius)) return out;
  const v = Math.max(0, Math.min(255, Math.round(id)));
  for (let ix = Math.floor(x - radius); ix <= Math.ceil(x + radius); ix++) {
    for (let iz = Math.floor(z - radius); iz <= Math.ceil(z + radius); iz++) {
      if (Math.hypot(ix + 0.5 - x, iz + 0.5 - z) > radius) continue;
      const before = grid.get(ix, iz);
      if (before === v) continue;
      grid.set(ix, iz, v);
      out.ix.push(ix);
      out.iz.push(iz);
      out.before.push(before);
      out.after.push(v);
    }
  }
  return out;
}

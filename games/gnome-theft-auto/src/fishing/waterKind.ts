// Fishing: which water a point is on (loch, river, canal, sea) and whether water is near. Pure reads of water.ts and
// terrain.ts; no allocation per call.
import { BODIES, COURSES, bodyRadius } from '../water';
import { waterAt } from '../terrain';
import type { FishWater } from './types';

/** The water surface height at (x, z), or null on land. */
export function waterSurface(x: number, z: number): number | null {
  const w = waterAt(x, z);
  return w ? w.surface : null;
}

function segDist(x: number, z: number, ax: number, az: number, bx: number, bz: number): number {
  const vx = bx - ax, vz = bz - az;
  const len2 = vx * vx + vz * vz || 1e-9;
  const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / len2));
  return Math.hypot(x - ax - vx * t, z - az - vz * t);
}

/** The kind of water at (x, z), or null where there is none. Lochs and seas first, then the nearest course. */
export function fishWaterAt(x: number, z: number): FishWater | null {
  if (!waterAt(x, z)) return null;
  for (const b of BODIES) {
    if (bodyRadius(b, x, z) <= 1.05) return b.id.includes('loch') ? 'loch' : 'sea';
  }
  let best: FishWater = 'river';
  let bd = Infinity;
  for (const c of COURSES) {
    for (let i = 0; i + 1 < c.points.length; i++) {
      const [ax, az] = c.points[i];
      const [bx, bz] = c.points[i + 1];
      const d = segDist(x, z, ax, az, bx, bz) - c.width / 2;
      if (d < bd) { bd = d; best = c.kind === 'canal' ? 'canal' : 'river'; }
    }
  }
  return best;
}

/** True when any water lies within r of (x, z): samples 8 directions at r/2 and r (16 waterAt calls). */
export function nearWater(x: number, z: number, r: number): boolean {
  if (waterAt(x, z)) return true;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const s = Math.sin(a), c = Math.cos(a);
    if (waterAt(x + s * r * 0.5, z + c * r * 0.5) || waterAt(x + s * r, z + c * r)) return true;
  }
  return false;
}

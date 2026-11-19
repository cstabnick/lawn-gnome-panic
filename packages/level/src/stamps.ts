import { smoothstep } from './math';
import type { Rect, Stamp } from './types';

/** The height after applying every stamp in order at (x, z). `h` is the height before any stamp. */
export function applyStamps(h: number, stamps: readonly Stamp[], x: number, z: number): number {
  for (const s of stamps) {
    const dx = x - s.x;
    const dz = z - s.z;
    if (s.op === 'flatten') {
      if (dx * dx + dz * dz >= s.outer * s.outer) continue;
      const t = smoothstep(s.inner, s.outer, Math.hypot(dx, dz));
      h = s.to + (h - s.to) * t;
    } else {
      const reach = 4 * s.sigma;
      const d2 = dx * dx + dz * dz;
      if (d2 > reach * reach) continue;
      h += s.amount * Math.exp(-d2 / (s.sigma * s.sigma));
    }
  }
  return h;
}

/** The box a stamp can change (for invalidating caches after it moves). */
export function stampBounds(s: Stamp): Rect {
  const r = s.op === 'flatten' ? s.outer : 4 * s.sigma;
  return { minX: s.x - r, maxX: s.x + r, minZ: s.z - r, maxZ: s.z + r };
}

import { describe, expect, it } from 'vitest';
import { massesFor } from './silhouettes';
import { LOBBY_H } from './kit';
import { minorStyle } from './procedural';
import type { Silhouette, TowerSpec } from './types';

const SILHOUETTES: Silhouette[] = ['box', 'setback', 'taper', 'twin', 'lean', 'ziggurat', 'drum', 'hblock', 'slab'];
const SIZES = [[19, 26.6, 63], [28.9, 28.9, 72.4], [11.7, 18.3, 68.5], [22.3, 22.3, 29.8], [31, 19, 36]];

describe('tower silhouettes', () => {
  for (const sil of SILHOUETTES) {
    for (const [w, d, h] of SIZES) {
      it(`${sil} ${w}x${d}x${h} stays inside its collider`, () => {
        const spec: TowerSpec = { x: 90, z: -30, w, d, h, blockX: 90, blockZ: -30, slot: 0, count: 1, pal: 0, stepped: false, roofRoll: 0.5, capped: false };
        const style = { ...minorStyle(spec, []), silhouette: sil };
        const ms = massesFor(spec, style);
        expect(ms[0]).toMatchObject({ shape: 'box', x: 90, z: -30, w, d, y0: 0, y1: LOBBY_H });
        let top = 0;
        for (const m of ms) {
          const mw = m.w, md = m.shape === 'cyl' ? m.w : m.d;
          expect(Math.abs(m.x - spec.x) + mw / 2).toBeLessThanOrEqual(w / 2 + 1e-6);
          expect(Math.abs(m.z - spec.z) + md / 2).toBeLessThanOrEqual(d / 2 + 1e-6);
          expect(m.y1).toBeLessThanOrEqual(h + 1e-6);
          expect(m.y1).toBeGreaterThan(m.y0);
          top = Math.max(top, m.y1);
        }
        for (const m of ms.slice(1)) expect(m.y0).toBeGreaterThanOrEqual(LOBBY_H - 0.1 - 1e-6);
        expect(top).toBeCloseTo(h, 5);
      });
    }
  }
});

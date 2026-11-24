import { describe, expect, it } from 'vitest';
import { minorStyle } from './procedural';
import { FACADE } from './facadeAtlas';
import { seeded } from './kit';
import type { TowerSpec } from './types';

const spec = (x: number, z: number, w: number, d: number, h: number, capped = false): TowerSpec =>
  ({ x, z, w, d, h, blockX: 0, blockZ: 0, slot: 0, count: 1, pal: 0, stepped: false, roofRoll: 0.5, capped });

describe('minor tower styles', () => {
  it('are the same for the same tower', () => {
    const s = spec(40.5, -90, 19, 29.5, 39.8);
    expect(minorStyle(s, [])).toEqual(minorStyle(s, []));
  });
  it('never copy a neighbour', () => {
    const s = spec(40.5, -90, 19, 29.5, 39.8);
    const near = { ...minorStyle(s, []), silhouette: 'box' as const, facade: FACADE.BRICK, crown: 'flat' as const };
    const st = minorStyle(s, [near]);
    expect(st.silhouette).not.toBe('box');
    expect(st.facade).not.toBe(FACADE.BRICK);
    expect(st.crown).not.toBe('flat');
  });
  it('keep capped towers low', () => {
    for (let i = 0; i < 40; i++) {
      expect(['flat', 'helipad', 'billboard']).toContain(minorStyle(spec(-100 + i * 5, 60, 20, 20, 40, true), []).crown);
    }
  });
  it('leave the roof bare under a rooftop billboard', () => {
    expect(minorStyle(spec(79.5, 90, 19, 29.5, 42.1), []).crown).toBe('billboard');
  });
  it('are always valid', () => {
    const r = seeded(9);
    for (let i = 0; i < 200; i++) {
      const st = minorStyle(spec(-120 + r() * 240, -120 + r() * 240, 11 + r() * 25, 11 + r() * 25, 24 + r() * 54), []);
      expect(st.facade).toBeGreaterThanOrEqual(0);
      expect(st.facade).toBeLessThanOrEqual(13);
      expect(st.ribs && st.balconies).toBe(false);
      expect(st.sign).toBe(-1);
    }
  });
});

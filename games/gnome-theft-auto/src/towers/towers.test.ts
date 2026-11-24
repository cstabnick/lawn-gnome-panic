// The whole downtown: every tower styled, its geometry merges per material, it stays inside its collider (crowns aside)
// and within the triangle budget. Uses the real tower specs (the 16 world.ts placed when this was written).
import { describe, expect, it } from 'vitest';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LANDMARKS, styleTowers, towerGeometry } from './index';
import type { TowerSpec } from './types';

const ROWS: [number, number, number, number, number, number, number, number, boolean][] = [
  // blockX, blockZ, slot, x, z, w, d, h, capped
  [-90, -30, 0, -100.5, -30, 19, 26.6, 63.1, false], [-90, -30, 1, -79.5, -30, 11.7, 18.3, 68.5, false],
  [-90, 30, 0, -100.5, 30, 19, 26.4, 36.8, false], [-90, 30, 1, -79.5, 30, 19, 33.7, 58.1, false],
  [-30, -90, 0, -40.5, -90, 19, 24.7, 54, false], [-30, -90, 1, -19.5, -90, 19, 25.5, 47.7, false],
  [-30, 90, 0, -30, 90, 22.3, 22.3, 29.8, false], [30, -90, 0, 19.5, -90, 19, 27.7, 76.6, false],
  [30, -90, 1, 40.5, -90, 19, 29.5, 39.8, false], [30, 90, 0, 19.5, 90, 19, 31.7, 45.3, true],
  [30, 90, 1, 40.5, 90, 19, 35, 35.6, false], [90, -90, 0, 90, -90, 28.9, 28.9, 72.4, false],
  [90, 30, 0, 79.5, 30, 19, 29.3, 48, false], [90, 30, 1, 100.5, 30, 19, 28.7, 69.7, false],
  [90, 90, 0, 79.5, 90, 19, 29.5, 42.1, false], [90, 90, 1, 100.5, 90, 19, 31.1, 67.5, false],
];
const SPECS: TowerSpec[] = ROWS.map(([blockX, blockZ, slot, x, z, w, d, h, capped]) => ({
  x, z, w, d, h, blockX, blockZ, slot, count: blockX === -30 && blockZ === 90 || blockX === 90 && blockZ === -90 ? 1 : 2,
  pal: 0, stepped: false, roofRoll: 0.5, capped,
}));

describe('downtown towers', () => {
  const styles = styleTowers(SPECS);
  const { geoms, gear } = towerGeometry(SPECS, styles);

  it('give every landmark its tower', () => {
    for (const l of LANDMARKS) {
      expect(SPECS.some((s) => s.blockX === l.blockX && s.blockZ === l.blockZ && s.slot === l.slot), l.id).toBe(true);
    }
  });
  it('never repeat a facade or a silhouette+crown between neighbours', () => {
    SPECS.forEach((a, i) => SPECS.forEach((b, j) => {
      if (j <= i || Math.hypot(a.x - b.x, a.z - b.z) > 40) return;
      const sa = styles[i], sb = styles[j];
      expect(sa.facade === sb.facade && sa.silhouette === sb.silhouette && sa.crown === sb.crown, `${i}/${j}`).toBe(false);
    }));
  });
  it('merge into one geometry per material', () => {
    for (const [k, list] of Object.entries(geoms)) {
      if (!list.length) continue;
      expect(mergeGeometries(list, false), k).not.toBeNull();
    }
  });
  it('keep the facade inside every collider', () => {
    // Facade walls are the masses: every vertex lies inside some tower's footprint and under its height.
    const merged = mergeGeometries(geoms.facade, false)!;
    const p = merged.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const inside = SPECS.some((s) => Math.abs(x - s.x) <= s.w / 2 + 1e-3 && Math.abs(z - s.z) <= s.d / 2 + 1e-3 && y <= s.h + 1e-3);
      expect(inside, `${x},${y},${z}`).toBe(true);
    }
  });
  it('stay within the triangle budget', () => {
    let tris = 0;
    for (const list of Object.values(geoms)) for (const g of list) tris += (g.index ? g.index.count : g.getAttribute('position').count) / 3;
    expect(tris).toBeLessThan(40000);
    expect(gear.length).toBeLessThan(400);
  });
});

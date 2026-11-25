// The outer-region settlements plan: deterministic, within budget, every region outside Turfton has houses, the houses
// keep off Turfton, the roads, the reserved sites, the stage spots and the water, and each house is in its region's theme.
import { describe, expect, it } from 'vitest';
import { installFakeDom } from './testing/fakeDom';
import { CITY_HALF, HIGHWAYS } from './config';
import { markersOf, markerNum, REGION_IDS, regionAt } from './levels';
import { onWaterCourse } from './water';
import { distToPolyline } from './landforms/noise';
import { stageKeepOut } from './stageClear';
import { themeAt } from './regionThemes';
import type { Box } from './types';

installFakeDom();
const { planSettlements } = await import('./settlements');

const keepOut = [...stageKeepOut()];
const a = planSettlements(keepOut);
const b = planSettlements(keepOut);

/** The collider of each house: the box that holds the house's centre (yard items and fences sit clear of it). */
function houseBoxes(): { x: number; z: number; box: Box }[] {
  return a.houses.map((h) => {
    const box = a.boxes.find((bx) => h.x >= bx.minX && h.x <= bx.maxX && h.z >= bx.minZ && h.z <= bx.maxZ);
    if (!box) throw new Error(`no collider holds the house at ${h.x}, ${h.z}`);
    return { x: h.x, z: h.z, box };
  });
}

describe('outer-region settlements plan', () => {
  it('is deterministic', () => {
    expect(JSON.stringify(a.placements)).toBe(JSON.stringify(b.placements));
    expect(JSON.stringify(a.boxes)).toBe(JSON.stringify(b.boxes));
    expect(JSON.stringify(a.houses)).toBe(JSON.stringify(b.houses));
  });

  it('has 40 to 140 houses and stays within the placement budget', () => {
    expect(a.houses.length).toBeGreaterThanOrEqual(40);
    expect(a.houses.length).toBeLessThanOrEqual(140);
    expect(a.placements.length).toBeLessThanOrEqual(2400);
  });

  it('has at least 3 houses in every region of the old 1800 square except Turfton', () => {
    // The batch-3 bands (E01) are filled by their own epics; settlements there are not promised.
    const BANDS = ['north-highlands', 'south-shore', 'east-campus', 'west-estates', 'pardonlin', 'the-unmown'];
    for (const id of REGION_IDS) {
      if (id === 'turfton' || BANDS.includes(id)) continue;
      expect(a.houses.filter((h) => h.region === id).length, id).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps every house outside Turfton grown by 140 m', () => {
    for (const h of a.houses) expect(Math.max(Math.abs(h.x), Math.abs(h.z)) > CITY_HALF + 140).toBe(true);
  });

  it('keeps every house collider off the stage spots, reserved sites and water', () => {
    const reserves = markersOf('reserve').map((m) => {
      const hw = markerNum(m, 'hw'), hd = markerNum(m, 'hd');
      return { minX: m.x - hw, maxX: m.x + hw, minZ: m.z - hd, maxZ: m.z + hd, id: m.id };
    });
    for (const { box } of houseBoxes()) {
      for (const k of keepOut) {
        const overlap = box.minX < k.maxX && box.maxX > k.minX && box.minZ < k.maxZ && box.maxZ > k.minZ;
        expect(overlap).toBe(false);
      }
      for (const r of reserves) {
        const overlap = box.minX < r.maxX && box.maxX > r.minX && box.minZ < r.maxZ && box.maxZ > r.minZ;
        expect(overlap, `house overlaps reserve ${r.id}`).toBe(false);
      }
      for (const [x, z] of [[box.minX, box.minZ], [box.maxX, box.minZ], [box.minX, box.maxZ], [box.maxX, box.maxZ]]) {
        expect(onWaterCourse(x, z)).toBe(false);
      }
    }
  });

  it('keeps every house at least 12 m from a highway centre line', () => {
    for (const h of a.houses) {
      let best = Infinity;
      for (const hw of HIGHWAYS) best = Math.min(best, distToPolyline(h.x, h.z, hw.points));
      expect(best).toBeGreaterThanOrEqual(12);
    }
  });

  it('puts every house id in its region theme (a blended neighbour theme is allowed)', () => {
    for (const p of a.placements) {
      const house = a.houses.find((h) => h.x === p.x && h.z === p.z);
      if (!house) continue;
      const own = themeAt(p.x, p.z, 1).houses;
      const blended = themeAt(p.x, p.z, 0).houses;
      expect(own.includes(p.id) || blended.includes(p.id), `${p.id} at ${p.x}, ${p.z}`).toBe(true);
      expect(house.region).toBe(regionAt(p.x, p.z));
    }
  });
});

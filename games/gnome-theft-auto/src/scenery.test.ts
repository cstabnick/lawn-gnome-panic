// The countryside scenery plan: deterministic, within budget, kept off the city, the water and the roads (except its own
// roadsides), standing on the ground, and each region's roadsides and props are its own.
import { describe, expect, it } from 'vitest';
import { installFakeDom } from './testing/fakeDom';
import { CITY_HALF, HIGHWAYS } from './config';
import { onWaterCourse } from './water';
import { heightAt } from './terrain';
import { distToPolyline } from './landforms/noise';
import { borderDistAt } from './landforms';
import { regionAt } from './levels';
import { REGION_THEMES } from './regionThemes';
import { GROUND_TRACKS } from './raceTrack/tracks';

installFakeDom();
const { planScenery } = await import('./scenery');

/** Every roadside piece any region lines its highways with. */
const ROADSIDE_IDS = new Set(
  Object.values(REGION_THEMES)
    .filter((t) => t.roadside !== 'none')
    .map((t) => (t.roadside === 'hedge' ? t.hedge : t.roadside === 'wall' ? t.wall : t.fence) as string),
);
const LINEAR = new Set([...ROADSIDE_IDS]);

describe('countryside scenery plan', () => {
  const a = planScenery([]);
  const b = planScenery([]);

  it('is deterministic', () => {
    expect(JSON.stringify(a.placements)).toBe(JSON.stringify(b.placements));
    expect(JSON.stringify(a.boxes)).toBe(JSON.stringify(b.boxes));
  });

  it('has a sensible number of placements within budget', () => {
    expect(a.placements.length).toBeGreaterThanOrEqual(300);
    expect(a.placements.length).toBeLessThanOrEqual(3200);
  });

  it('has each region\'s roadside pieces and signature props', () => {
    const ids = new Set(a.placements.map((p) => p.id));
    for (const id of ['hedgerow', 'adobe-wall', 'split-rail-fence', 'snowcap-stone-wall', 'wattle-fence']) {
      expect(ids.has(id), id).toBe(true);
    }
    expect(['stone-cairn', 'tall-cactus', 'bee-skep', 'hay-bale'].some((id) => ids.has(id))).toBe(true);
  });

  it('puts each region\'s own roadside piece in the middle of that region', () => {
    let checked = 0;
    for (const p of a.placements) {
      if (!ROADSIDE_IDS.has(p.id) || borderDistAt(p.x, p.z) <= 60) continue;
      const theme = REGION_THEMES[regionAt(p.x, p.z)];
      const own = theme.roadside === 'hedge' ? theme.hedge : theme.roadside === 'wall' ? theme.wall : theme.fence;
      expect(own, `${p.id} at ${p.x.toFixed(0)},${p.z.toFixed(0)}`).toBe(p.id);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('keeps off the city square', () => {
    for (const p of a.placements) {
      expect(Math.max(Math.abs(p.x), Math.abs(p.z)) > CITY_HALF).toBe(true);
    }
  });

  it('keeps off the water', () => {
    for (const p of a.placements) expect(onWaterCourse(p.x, p.z)).toBe(false);
  });

  it('keeps off the roads except its own hedges and walls', () => {
    for (const p of a.placements) {
      if (LINEAR.has(p.id)) continue;
      let best = Infinity;
      for (const h of HIGHWAYS) best = Math.min(best, distToPolyline(p.x, p.z, h.points));
      expect(best).toBeGreaterThanOrEqual(7);
    }
  });

  it('stands no tree, rock or planting on a race road or mountain route, nor inside its barriers (G4#16)', () => {
    let checked = 0;
    for (const p of a.placements) {
      if (LINEAR.has(p.id)) continue;
      for (const t of GROUND_TRACKS) {
        const reach = t.def.barrierOffset;
        const b = t.bounds();
        if (p.x < b.minX || p.x > b.maxX || p.z < b.minZ || p.z > b.maxZ) continue;
        checked++;
        const spot = t.locate(p.x, p.z, reach);
        expect(spot !== null && Math.abs(spot.lat) <= reach, `${p.id} at ${p.x.toFixed(0)},${p.z.toFixed(0)} on ${t.def.id}`).toBe(false);
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('stands on the ground (linear pieces may sit up to 1.5 m lower)', () => {
    for (const p of a.placements) {
      const g = heightAt(p.x, p.z);
      if (LINEAR.has(p.id)) {
        expect(p.y - g).toBeLessThanOrEqual(0.2);
        expect(p.y - g).toBeGreaterThanOrEqual(-1.5);
      } else {
        expect(Math.abs(p.y - g)).toBeLessThanOrEqual(0.2);
      }
    }
  });
});

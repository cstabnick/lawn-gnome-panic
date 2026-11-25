import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import { euroBuilding } from '../eurokit/catalog';
import { cornersOf, DISTRICTS, districtById, footprintProblem, footprintsOverlap, inRect, insideEuroYard, pl, type Footprint } from './layout';
import { buildingFootprint, propFootprint, type DistrictPlan } from './plan';
import { pardonlinPlans } from './plans';

// Set by the end of E30 (the AC): every district has at least this much storytelling.
const MIN = { vignettes: 3, signs: 6, residents: 3 } as const;

const plans = pardonlinPlans();
const inDistrict = (plan: DistrictPlan, x: number, z: number): boolean =>
  districtById(plan.id).rects.some((r) => inRect(r, x, z, 0.01));

describe('Pardonlin layout helpers', () => {
  it('maps document coordinates to the world', () => {
    expect(pl(80, -466)).toEqual([-1520, -366]);
  });
  it('the euro zone covers the town and stops at the Wickets', () => {
    expect(insideEuroYard(-1520, -235)).toBe(true);
    expect(insideEuroYard(-1300, 0)).toBe(false);
  });
  it('districts do not overlap', () => {
    for (const a of DISTRICTS) for (const b of DISTRICTS) {
      if (a === b) continue;
      for (const ra of a.rects) for (const rb of b.rects) {
        const overlap = ra.minX < rb.maxX && rb.minX < ra.maxX && ra.minZ < rb.maxZ && rb.minZ < ra.maxZ;
        expect(overlap, `${a.id} / ${b.id}`).toBe(false);
      }
    }
  });
  it('overlap test sees touching-free neighbours as separate and crossing ones as overlapping', () => {
    const a: Footprint = { x: 0, z: 0, w: 4, d: 6, yaw: 0.3 };
    expect(footprintsOverlap(a, { ...a, x: 1 })).toBe(true);
    expect(footprintsOverlap(a, { ...a, x: 10 })).toBe(false);
  });
  it('a building on a street is refused', () => {
    // pl-rue-haute runs through doc (135, -270) = world (-1465, -170).
    expect(footprintProblem({ x: -1465, z: -170, w: 4, d: 6, yaw: 0 })).toMatch(/road/);
  });
});

describe.each(plans.map((p) => [p.id, p] as const))('district %s', (_id, plan) => {
  it('uses only prefabs that exist', () => {
    for (const b of plan.buildings) expect(euroBuilding(b.id), b.id).toBeTruthy();
    for (const p of plan.props) expect(getPrefab(p.id), p.id).toBeTruthy();
  });

  it('keeps buildings off roads, paths and the river, inside the district, not overlapping', () => {
    const fps: Footprint[] = [];
    for (const b of plan.buildings) {
      const f = buildingFootprint(b)!;
      expect(footprintProblem(f), `${b.id} at (${b.x.toFixed(1)}, ${b.z.toFixed(1)})`).toBeNull();
      for (const [x, z] of cornersOf(f)) {
        expect(inDistrict(plan, x, z), `${b.id} at (${b.x.toFixed(1)}, ${b.z.toFixed(1)}) reaches outside ${plan.id}`).toBe(true);
      }
      for (const o of fps) expect(footprintsOverlap(f, o), `${b.id} at (${b.x.toFixed(1)}, ${b.z.toFixed(1)}) overlaps`).toBe(false);
      fps.push(f);
    }
  });

  it('keeps solid props off roads and the river, inside the district', () => {
    for (const p of plan.props) {
      expect(inDistrict(plan, p.x, p.z), `${p.id} at (${p.x.toFixed(1)}, ${p.z.toFixed(1)}) outside ${plan.id}`).toBe(true);
      const f = propFootprint(p);
      if (f) expect(footprintProblem(f, 0.3), `${p.id} at (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`).toBeNull();
    }
  });

  it('tells its stories: vignettes, signs and residents', () => {
    expect(plan.vignettes.length).toBeGreaterThanOrEqual(MIN.vignettes);
    expect(plan.signs.length).toBeGreaterThanOrEqual(MIN.signs);
    expect(plan.residents.length).toBeGreaterThanOrEqual(MIN.residents);
    for (const v of plan.vignettes) {
      expect(inDistrict(plan, v.x, v.z), v.id).toBe(true);
      // A vignette is made of props: at least three within 8 m of its spot.
      const nearProps = plan.props.filter((p) => Math.hypot(p.x - v.x, p.z - v.z) <= 8).length;
      expect(nearProps, `${v.id} has props`).toBeGreaterThanOrEqual(3);
    }
    for (const s of plan.signs) expect(s.text.length, s.text).toBeLessThanOrEqual(90);
  });

  it('residents stand on clear ground in the district', () => {
    for (const r of plan.residents) {
      expect(inDistrict(plan, r.x, r.z), r.id).toBe(true);
      expect(r.id.startsWith('pl-'), r.id).toBe(true);
      expect(footprintProblem({ x: r.x, z: r.z, w: 0.6, d: 0.6, yaw: 0 }, 0), r.id).toBeNull();
    }
  });
});

it('ids are unique across the town', () => {
  const ids = plans.flatMap((p) => [...p.vignettes.map((v) => v.id), ...p.residents.map((r) => r.id)]);
  expect(new Set(ids).size).toBe(ids.length);
});

import { describe, expect, it } from 'vitest';
import { mulberry32 } from '@lawn/level';
import { installFakeDom } from './testing/fakeDom';

installFakeDom();
const { planGardenBlock, gardenFootprint } = await import('./landscaping');
type BlockRect = import('./landscaping').BlockRect;

const FULL: BlockRect = { minX: 0, maxX: 42, minZ: 0, maxZ: 42 };
const STRIP: BlockRect = { minX: 0, maxX: 17, minZ: 0, maxZ: 42 };
const CENTRE_IDS = ['garden-shed', 'stone-fountain', 'compost-heap', 'birdbath', 'brick-stack'];
const STRIP_IDS = ['hedgerow', 'boxwood-ball', 'topiary-cone'];

const inside = (r: { minX: number; maxX: number; minZ: number; maxZ: number }, b: BlockRect): boolean =>
  r.minX >= b.minX - 1e-6 && r.maxX <= b.maxX + 1e-6 && r.minZ >= b.minZ - 1e-6 && r.maxZ <= b.maxZ + 1e-6;
const overlaps = (
  a: { minX: number; maxX: number; minZ: number; maxZ: number },
  b: { minX: number; maxX: number; minZ: number; maxZ: number },
): boolean => a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;

describe('planGardenBlock', () => {
  it('lays out a 42 x 42 block: 15-60 placements, at most one centrepiece, all inside, none overlapping', () => {
    const plan = planGardenBlock(FULL, mulberry32(7), () => false);
    expect(plan.length).toBeGreaterThanOrEqual(15);
    expect(plan.length).toBeLessThanOrEqual(60);
    expect(plan.filter((p) => CENTRE_IDS.includes(p.id)).length).toBeLessThanOrEqual(1);
    const rects = plan.map((p) => gardenFootprint(p));
    rects.forEach((r) => expect(inside(r, FULL)).toBe(true));
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) expect(overlaps(rects[i], rects[j])).toBe(false);
    }
  });

  it('is the same for the same seed', () => {
    const a = planGardenBlock(FULL, mulberry32(99), () => false);
    const b = planGardenBlock(FULL, mulberry32(99), () => false);
    expect(b).toEqual(a);
  });

  it('places nothing where everything is blocked', () => {
    expect(planGardenBlock(FULL, mulberry32(3), () => true)).toEqual([]);
    expect(planGardenBlock(STRIP, mulberry32(3), () => true)).toEqual([]);
  });

  it('puts Turfton railings on some full blocks, solid and never over a hedge', () => {
    let blocksWithRailings = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const plan = planGardenBlock(FULL, mulberry32(seed), () => false);
      const rails = plan.filter((p) => p.id === 'civic-railing');
      const hedges = plan.filter((p) => p.id === 'hedgerow' || p.id === 'hedge-arch');
      if (rails.length > 0) blocksWithRailings++;
      for (const r of rails) {
        expect(r.solid).toBe(true);
        expect(r.colliderH).toBe(1.0);
        for (const h of hedges) expect(overlaps(gardenFootprint(r), gardenFootprint(h))).toBe(false);
      }
    }
    expect(blocksWithRailings).toBeGreaterThan(0);
  });

  it('gives a strip block only hedges and shrubs', () => {
    const plan = planGardenBlock(STRIP, mulberry32(5), () => false);
    expect(plan.length).toBeGreaterThan(0);
    for (const p of plan) expect(STRIP_IDS).toContain(p.id);
    for (const p of plan) expect(inside(gardenFootprint(p), STRIP)).toBe(true);
  });
});

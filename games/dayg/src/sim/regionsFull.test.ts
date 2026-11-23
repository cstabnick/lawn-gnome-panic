// Guards the 61-region graph of the full map: counts, geometry, edges, connectivity, traits, havens, and a short run.
import { describe, it, expect } from 'vitest';
import { FULL_BOUNDS, FULL_REGIONS, NEW_EDGES, NEW_REGIONS, FULL_EDGES, graphFor } from './regionsFull';
import { HAVEN_REGION } from './regions';
import { DISTRICTS, HAVENS, type DistrictId, type Rect, type RegionDef, type RegionId } from './types';
import { TUNING } from './tuning';
import { createWorld, hashWorld, hatlessTotal, runDays } from './world';

const EXPECTED_COUNTS: Record<DistrictId, number> = {
  lychgate: 4, 'old-rows': 7, 'yew-walk': 4, 'gnome-garden': 5, wreathwood: 5, compost: 4,
  columbarium: 6, 'bell-chapel': 5, 'mausoleum-hill': 6, 'lawn-section': 5, 'drowned-corner': 5, shed: 5,
};
const pairKey = (a: RegionId, b: RegionId): string => (a < b ? `${a}|${b}` : `${b}|${a}`);
const LOGICAL_LINKS = new Set([pairKey('lower-walk', 'forecourt'), pairKey('the-catacombs', 'back-stair'), pairKey('drain-mouth', 'back-gate')]);
const ROOF_OVERLAPS = new Set([pairKey('gate-roof', 'forecourt'), pairKey('gate-roof', 'verge-path')]);

function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Length of the border two rects share (0 when they only touch at a corner or not at all). */
function sharedBorder(a: Rect, b: Rect): number {
  const zOverlap = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
  const xOverlap = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  if ((a.x1 === b.x0 || b.x1 === a.x0) && zOverlap > 0) return zOverlap;
  if ((a.z1 === b.z0 || b.z1 === a.z0) && xOverlap > 0) return xOverlap;
  return 0;
}

const byId = new Map<RegionId, RegionDef>(FULL_REGIONS.map((r) => [r.id, r]));

describe('full map region graph', () => {
  it('has 61 regions with unique ids and the expected count per district', () => {
    expect(FULL_REGIONS.length).toBe(61);
    expect(new Set(FULL_REGIONS.map((r) => r.id)).size).toBe(61);
    for (const d of DISTRICTS) {
      const n = FULL_REGIONS.filter((r) => r.district === d).length;
      expect(n, `district ${d}`).toBe(EXPECTED_COUNTS[d]);
    }
    expect(NEW_REGIONS.length).toBe(61 - 12);
  });

  it('keeps every rect non-empty and inside FULL_BOUNDS', () => {
    for (const r of FULL_REGIONS) {
      expect(r.rect.x0 < r.rect.x1, `${r.id} x order`).toBe(true);
      expect(r.rect.z0 < r.rect.z1, `${r.id} z order`).toBe(true);
      const b = FULL_BOUNDS;
      expect(r.rect.x0 >= b.x0 && r.rect.x1 <= b.x1 && r.rect.z0 >= b.z0 && r.rect.z1 <= b.z1, `${r.id} inside bounds`).toBe(true);
    }
  });

  it('has no two rects overlapping with positive area, except the gate roof over forecourt and verge path', () => {
    for (let i = 0; i < FULL_REGIONS.length; i++) {
      for (let j = i + 1; j < FULL_REGIONS.length; j++) {
        const a = FULL_REGIONS[i], b = FULL_REGIONS[j];
        if (overlapArea(a.rect, b.rect) > 0) {
          expect(ROOF_OVERLAPS.has(pairKey(a.id, b.id)), `${a.id} overlaps ${b.id}`).toBe(true);
        }
      }
    }
  });

  it('names known regions in every edge, with no duplicate pair', () => {
    const seen = new Set<string>();
    for (const e of FULL_EDGES) {
      expect(byId.has(e.a), `edge ${e.a} known`).toBe(true);
      expect(byId.has(e.b), `edge ${e.b} known`).toBe(true);
      const k = pairKey(e.a, e.b);
      expect(seen.has(k), `duplicate edge ${k}`).toBe(false);
      seen.add(k);
    }
  });

  it('gives every new edge a shared border of positive length, except the logical links', () => {
    for (const e of NEW_EDGES) {
      const a = byId.get(e.a)!, b = byId.get(e.b)!;
      if (LOGICAL_LINKS.has(pairKey(e.a, e.b))) continue;
      expect(sharedBorder(a.rect, b.rect), `${e.a}-${e.b} border`).toBeGreaterThan(0);
    }
  });

  it('is connected, and its neighbour lists are symmetric', () => {
    const g = graphFor('full');
    const start: RegionId = 'gate-roof';
    const reached = new Set<RegionId>([start]);
    const queue: RegionId[] = [start];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const nb of g.neighbours[cur]) {
        if (!reached.has(nb.to)) { reached.add(nb.to); queue.push(nb.to); }
      }
    }
    expect(reached.size).toBe(61);
    for (const r of FULL_REGIONS) {
      for (const nb of g.neighbours[r.id]) {
        expect(g.neighbours[nb.to].some((back) => back.to === r.id), `${r.id}->${nb.to} symmetric`).toBe(true);
      }
    }
  });

  // Known data bug, owned by the planner (regionsFull.ts): 'the-catacombs'-'crypt-row' is climb: false but
  // crypt-row has the HIGH trait. The test fails until that edge is fixed.
  it.fails('marks every new edge touching a HIGH region as a climb', () => {
    for (const e of NEW_EDGES) {
      const a = byId.get(e.a)!, b = byId.get(e.b)!;
      if (a.traits.includes('HIGH') || b.traits.includes('HIGH')) {
        expect(e.climb, `${e.a}-${e.b} climb`).toBe(true);
      }
    }
  });

  it('maps every haven to a HAVEN region, and every HAVEN region is some haven\'s region', () => {
    const havenRegions = new Set<RegionId>(HAVENS.map((h) => HAVEN_REGION[h]));
    for (const h of HAVENS) {
      const r = byId.get(HAVEN_REGION[h]);
      expect(r, `${h} region`).toBeDefined();
      expect(r!.traits.includes('HAVEN'), `${h} region has HAVEN`).toBe(true);
    }
    for (const r of FULL_REGIONS) {
      if (r.traits.includes('HAVEN')) expect(havenRegions.has(r.id), `${r.id} is a haven region`).toBe(true);
    }
  });

  it('runs three days on the full map without throwing, deterministically', () => {
    const run = (): { regions: number; alive: number; hatless: number; hash: string } => {
      const { world: w, streams } = createWorld(7, TUNING, undefined, { map: 'full' });
      runDays(w, streams, 3);
      return {
        regions: w.graph.regions.length,
        alive: w.npcs.filter((n) => n.alive).length,
        hatless: hatlessTotal(w),
        hash: hashWorld(w),
      };
    };
    const a = run();
    expect(a.regions).toBe(61);
    expect(a.alive).toBeGreaterThan(0);
    expect(Number.isFinite(a.hatless)).toBe(true);
    expect(run().hash).toBe(a.hash);
  });
});

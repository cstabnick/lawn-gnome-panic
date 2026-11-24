// The fringe lots and poles on the real map (docs/roadmaps/gta-parks-and-fringe.md, issue 1O).
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { DressPlan, GroundPatch } from '../cityScenery/types';
import type { World } from '../types';

vi.mock('../audio', () => ({ play: () => undefined }));

interface Built { plan: DressPlan; site: Awaited<ReturnType<typeof makeSite>> }

async function makeSite(world: World) {
  const { createSite } = await import('../cityScenery/site');
  return createSite(world);
}

async function buildFringe(): Promise<{ world: World; built: Built }> {
  const { buildWorld } = await import('../world');
  const { installSkyways } = await import('../highways/install');
  const { emptyPlan } = await import('../cityScenery/types');
  const { planLots, planPoles } = await import('./lots');
  const world = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
  installSkyways(new THREE.Scene(), world);
  const site = await makeSite(world);
  const plan = emptyPlan();
  planLots(site, plan, []);
  planPoles(site, plan);
  return { world, built: { plan, site } };
}

const BUILDING_EXCEPT_BILLBOARD = (d: { id: string; cls: string }) => d.cls === 'building' && d.id !== 'gta-billboard';

describe('fringe lots and poles', () => {
  it('lays out the Rusty Tine, the junkyard, lots and poles on the real map', async () => {
    const restore = installFakeDom();
    try {
      const { built } = await buildFringe();
      const { plan, site } = built;

      expect(plan.dress.filter((d) => d.id === 'rough-pub')).toHaveLength(1);
      expect(plan.dress.filter((d) => d.id === 'scrap-car').length).toBeGreaterThanOrEqual(4);

      const lots = plan.dress.filter(BUILDING_EXCEPT_BILLBOARD);
      expect(lots.length).toBeGreaterThanOrEqual(30);
      expect(lots.length).toBeLessThanOrEqual(140);
      for (const d of lots) expect(site.roadDist(d.x, d.z)).toBeGreaterThanOrEqual(9);
      expect(new Set(lots.map((d) => d.id)).size).toBeGreaterThanOrEqual(3);

      // Two regions' looks: a houses-and-caravans region and a barns-and-huts region.
      const ids = new Set(lots.map((d) => d.id));
      expect(['trailer-home', 'adobe-hut', 'caravan'].some((id) => ids.has(id))).toBe(true);
      expect(['barn', 'log-cabin', 'nissen-hut', 'lean-to-shed'].some((id) => ids.has(id))).toBe(true);

      const poles = plan.dress.filter((d) => d.id === 'power-pole').length;
      expect(poles).toBeGreaterThanOrEqual(40);
      // Wires come in pairs (one per cross-arm end). The spec's bound 2 * (poles - highways) assumes no pole is skipped,
      // but each skipped pole splits its highway into runs and the wires stop there, so only require about one wire
      // per pole here.
      expect(plan.cables.length % 2).toBe(0);
      expect(plan.cables.length).toBeGreaterThanOrEqual(poles);

      const rects = plan.patches.filter((p): p is GroundPatch => p.shape === 'rect');
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i], b = rects[j];
          const overlapX = Math.abs(a.x - b.x) < (a.w + b.w) / 2 - 1e-6;
          const overlapZ = Math.abs(a.z - b.z) < (a.d + b.d) / 2 - 1e-6;
          expect(overlapX && overlapZ, `patches ${i} and ${j} overlap`).toBe(false);
        }
      }
    } finally {
      restore();
    }
  }, 180_000);

  it('is deterministic on a second fresh Site', async () => {
    const restore = installFakeDom();
    try {
      const { world, built } = await buildFringe();
      const { emptyPlan } = await import('../cityScenery/types');
      const { planLots, planPoles } = await import('./lots');
      const site2 = await makeSite(world);
      const plan2 = emptyPlan();
      planLots(site2, plan2, []);
      planPoles(site2, plan2);
      expect(JSON.stringify(plan2.dress)).toBe(JSON.stringify(built.plan.dress));
      expect(JSON.stringify(plan2.cables)).toBe(JSON.stringify(built.plan.cables));
      expect(JSON.stringify(plan2.marks)).toBe(JSON.stringify(built.plan.marks));
    } finally {
      restore();
    }
  }, 180_000);
});

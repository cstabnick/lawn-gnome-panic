// Fringe ground: dirt tracks off the highways and the green creeping in (docs/roadmaps/gta-parks-and-fringe.md, 1M).
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { World } from '../types';
import { FRINGE } from './belt';

vi.mock('../audio', () => ({ play: () => undefined }));

async function build(): Promise<World> {
  installFakeDom();
  const { buildWorld } = await import('../world');
  const { installSkyways } = await import('../highways/install');
  const world: World = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
  installSkyways(new THREE.Scene(), world);
  return world;
}

describe('fringe ground', () => {
  it('tracks, trees, weeds and hedges come out as the issue asks, and deterministically', async () => {
    const world = await build();
    const { createSite: makeSite, roadDistance } = await import('../cityScenery/site');
    const { emptyPlan } = await import('../cityScenery/types');
    const { planTracks, planEdgeGreen } = await import('./ground');

    const site = makeSite(world);
    const plan = emptyPlan();
    const tracks = planTracks(site, plan);
    planEdgeGreen(site, plan);

    // Tracks: 8..40, each at least 20 m long, starting 6-8 m off a highway centre line, with a real ribbon.
    expect(tracks.length).toBeGreaterThanOrEqual(8);
    expect(tracks.length).toBeLessThanOrEqual(40);
    for (const t of tracks) {
      let len = 0;
      for (let k = 0; k + 1 < t.points.length; k++) {
        len += Math.hypot(t.points[k + 1][0] - t.points[k][0], t.points[k + 1][1] - t.points[k][1]);
      }
      expect(len).toBeGreaterThanOrEqual(20);
      const [ax, az] = t.points[0];
      const d = roadDistance(ax, az);
      expect(d).toBeGreaterThanOrEqual(6);
      expect(d).toBeLessThanOrEqual(8);
    }
    const ribbons = plan.patches.filter((p) => p.shape === 'ribbon');
    expect(ribbons.length).toBe(tracks.length);
    for (const p of ribbons) expect(p.points?.length ?? 0).toBeGreaterThanOrEqual(2);

    // Trees: plenty, of several kinds (the regions differ), none within 8 m of a road.
    const trees = plan.dress.filter((d) => d.cls === 'tree');
    expect(trees.length).toBeGreaterThanOrEqual(150);
    expect(new Set(trees.map((d) => d.id)).size).toBeGreaterThanOrEqual(3);
    for (const t of trees) expect(roadDistance(t.x, t.z)).toBeGreaterThanOrEqual(8);

    // Weeds: plenty, and within the plant budget.
    const weeds = plan.dress.filter((d) => d.cls === 'detail');
    expect(weeds.length).toBeGreaterThanOrEqual(300);
    expect(weeds.length).toBeLessThanOrEqual(FRINGE.maxPlants);
    expect(plan.dress.length).toBeLessThanOrEqual(FRINGE.maxDress);

    // Deterministic: a second fresh Site gives the same answer.
    const site2 = makeSite(world);
    const plan2 = emptyPlan();
    const tracks2 = planTracks(site2, plan2);
    planEdgeGreen(site2, plan2);
    expect(tracks2).toEqual(tracks);
    expect(plan2.dress).toEqual(plan.dress);
  }, 180_000);
});

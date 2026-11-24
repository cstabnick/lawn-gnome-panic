// Park layouts A (docs/roadmaps/gta-parks-and-fringe.md, issue 1H): the layouts run on the real world through a Site.
import * as THREE from 'three';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import { heightAt } from '../terrain';
import type { World } from '../types';
import type { Site } from '../cityScenery/site';
import type { DressPlan } from '../cityScenery/types';
import { PARKS, type ParkDef } from './blocks';
import { parkCtx, type ParkCtx } from './kit';
import { layoutBandstandGreen, layoutGnorwin, layoutKilnsideRec } from './layoutA';

vi.mock('../audio', () => ({ play: () => undefined }));

let createSite: typeof import('../cityScenery/site').createSite;
let emptyPlan: typeof import('../cityScenery/types').emptyPlan;
let world: World;

const park = (id: string): ParkDef => PARKS.find((p) => p.id === id)!;

/** Runs the three layouts A on one site; each park gets its own plan (the parks are disjoint). */
function runA(site: Site): Record<string, DressPlan> {
  const plans: Record<string, DressPlan> = {};
  const run = (id: string, layout: (c: ParkCtx) => void): void => {
    const plan = emptyPlan();
    plans[id] = plan;
    layout(parkCtx(site, plan, park(id)));
  };
  run('gnorwin', layoutGnorwin);
  run('bandstand-green', layoutBandstandGreen);
  run('kilnside-rec', layoutKilnsideRec);
  return plans;
}

describe('park layouts A', () => {
  beforeAll(async () => {
    installFakeDom();
    ({ createSite } = await import('../cityScenery/site'));
    ({ emptyPlan } = await import('../cityScenery/types'));
    const { buildWorld } = await import('../world');
    const { installSkyways } = await import('../highways/install');
    world = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
    installSkyways(new THREE.Scene(), world);
  }, 180_000);

  it('Gnorwin Clayfoot Park: benches, one wish spot, monument and lamps', () => {
    const plans = runA(createSite(world));
    const p = plans.gnorwin;
    expect(p.uses.filter((u) => u.kind === 'bench' && u.park === 'gnorwin').length).toBeGreaterThanOrEqual(3);
    expect(p.uses.filter((u) => u.kind === 'wish' && u.park === 'gnorwin')).toHaveLength(1);
    expect(p.dress.filter((d) => d.id === 'mushroom-lamp').length).toBeGreaterThanOrEqual(1);
  }, 180_000);

  it('Bandstand Green: a bandstand, market stalls and gravel paths', () => {
    const plans = runA(createSite(world));
    const p = plans['bandstand-green'];
    expect(p.dress.some((d) => d.id === 'bandstand')).toBe(true);
    expect(p.dress.filter((d) => d.id === 'market-stall').length).toBeGreaterThanOrEqual(2);
    expect(p.patches.length).toBeGreaterThanOrEqual(3);
  }, 180_000);

  it('Kilnside Rec: two goals, a swing set and at least ten marks', () => {
    const plans = runA(createSite(world));
    const p = plans['kilnside-rec'];
    expect(p.dress.filter((d) => d.id === 'football-goal').length).toBe(2);
    expect(p.dress.some((d) => d.id === 'swing-set')).toBe(true);
    expect(p.marks.length).toBeGreaterThanOrEqual(10);
  }, 180_000);

  it('every dress piece sits on the ground (y within 0.1 of heightAt)', () => {
    const plans = runA(createSite(world));
    for (const p of Object.values(plans)) {
      for (const d of p.dress) {
        expect(Math.abs(d.y - heightAt(d.x, d.z)), `${d.id} at ${d.x},${d.z}`).toBeLessThanOrEqual(0.1);
      }
    }
  }, 180_000);

  it('each park has at most 4 gnomes, with unique ids', () => {
    const plans = runA(createSite(world));
    for (const [id, p] of Object.entries(plans)) {
      expect(p.gnomes.length, id).toBeLessThanOrEqual(4);
      const ids = p.gnomes.map((g) => g.id);
      expect(new Set(ids).size, id).toBe(ids.length);
    }
  }, 180_000);

  it('the same layouts on a second fresh site give the same dress list', () => {
    const a = runA(createSite(world));
    const b = runA(createSite(world));
    const dressOf = (plans: Record<string, DressPlan>): string =>
      JSON.stringify(Object.values(plans).map((p) => p.dress));
    expect(dressOf(b)).toBe(dressOf(a));
  }, 180_000);
});

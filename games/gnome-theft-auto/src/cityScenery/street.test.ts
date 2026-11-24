// Street scenery on the real map (docs/roadmaps/gta-parks-and-fringe.md, issue 1J): the budget holds, downtown has a
// mix of furniture, nothing stands on a sidewalk or in a lane, bunting is there, and the plan is the same on every client.
import * as THREE from 'three';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { World } from '../types';
import type { DressPlan } from './types';
import type { Site } from './site';

vi.mock('../audio', () => ({ play: () => undefined }));

interface Built { world: World; createSite: (w: World) => Site; planStreet: (s: Site) => DressPlan }

async function build(): Promise<Built> {
  const { buildWorld } = await import('../world');
  const { installSkyways } = await import('../highways/install');
  const { createSite } = await import('./site');
  const { planStreet } = await import('./street');
  const world = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
  installSkyways(new THREE.Scene(), world);
  return { world, createSite, planStreet };
}

describe('street scenery on the real map', () => {
  let b: Built;
  let world: World;
  let plan: DressPlan;
  beforeAll(async () => {
    installFakeDom();
    b = await build();
    world = b.world;
    plan = b.planStreet(b.createSite(world));
  }, 180_000);

  it('places a few hundred pieces, within the budget', () => {
    expect(plan.dress.length).toBeGreaterThanOrEqual(300);
    expect(plan.dress.length).toBeLessThanOrEqual(1800);
  });

  it('downtown uses at least six different kinds of piece', async () => {
    const { districtAt } = await import('../districts');
    const ids = new Set(
      plan.dress.filter((d) => districtAt(d.x, d.z) === 'downtown').map((d) => d.id),
    );
    expect(ids.size).toBeGreaterThanOrEqual(6);
  });

  it('keeps every piece off the road, except bunting', async () => {
    const { roadDistance } = await import('./site');
    const bad = plan.dress.filter((d) => d.id !== 'bunting-span' && roadDistance(d.x, d.z) < 7.6);
    expect(bad.map((d) => `${d.id}@${d.x.toFixed(1)},${d.z.toFixed(1)}`)).toEqual([]);
  });

  it('keeps every piece off the sidewalks', async () => {
    const { onSidewalk } = await import('../parking');
    const bad = plan.dress.filter((d) => onSidewalk(d.x, d.z));
    expect(bad.map((d) => `${d.id}@${d.x.toFixed(1)},${d.z.toFixed(1)}`)).toEqual([]);
  });

  it('puts at least four bunting spans across downtown streets', () => {
    expect(plan.dress.filter((d) => d.id === 'bunting-span').length).toBeGreaterThanOrEqual(4);
  });

  it('is the same on a second fresh site', () => {
    const again = b.planStreet(b.createSite(world));
    expect(JSON.stringify(again.dress)).toBe(JSON.stringify(plan.dress));
  }, 180_000);
});

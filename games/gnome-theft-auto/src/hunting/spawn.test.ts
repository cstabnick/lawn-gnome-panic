// Quarry never spawns on a road (or in water, or outside its region): every planned spot keeps HUNT.spawnMargin clear.
import { expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';

it('every quarry spawn is off the roads, out of water and in its region', async () => {
  installFakeDom();
  const { buildWorld } = await import('../world');
  const { roadDistance } = await import('../critters');
  const { regionAt } = await import('../levels');
  const { waterAt } = await import('../terrain');
  const { spawnPlan } = await import('./hunting');
  const { HUNT, SPECIES } = await import('./species');
  const world = buildWorld(new THREE.Scene(), undefined as unknown as THREE.WebGLRenderer);
  let seed = 1;
  const rnd = (): number => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const plan = spawnPlan(world, rnd);
  expect(plan.length).toBeGreaterThan(20);
  for (const p of plan) {
    expect(roadDistance(p.x, p.z)).toBeGreaterThanOrEqual(8 + p.species.radius + HUNT.spawnMargin - 1e-6);
    expect(regionAt(p.x, p.z)).toBe(p.species.region);
    expect(waterAt(p.x, p.z)).toBeFalsy();
  }
  // Every species has somewhere to live.
  for (const s of SPECIES) expect(plan.some((p) => p.species.id === s.id), s.id).toBe(true);
}, 60_000);

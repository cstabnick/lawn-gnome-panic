// The built world: every small plant of a mowable kind is harvested for flora, its collider comes out of world.boxes,
// and no box is left standing on a mowable plant. Fails when a builder gives a mowable plant a blocking collider that
// flora cannot match (fix the builder or the matcher in extract.ts, never loosen THE GUARD).
import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';
import type { Box } from '../types';
import type { PlantSeed } from './types';

let seeds: PlantSeed[] = [];
let boxes: Box[] = [];
let before = 0;
let removed = 0;

beforeAll(async () => {
  installFakeDom();
  const { beginPlantHarvest, drainHarvest } = await import('./harvest');
  const { extractPlantBoxes } = await import('./extract');
  const { buildWorld } = await import('../world');
  beginPlantHarvest();
  const world = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
  seeds = drainHarvest();
  boxes = world.boxes;
  before = boxes.length;
  removed = extractPlantBoxes(boxes, seeds);
}, 120_000);

describe('mowable plants in the built world', () => {
  it('harvests the small plants of every mowable kind', async () => {
    const { PLANT_KINDS, FLORA } = await import('./kinds');
    expect(seeds.length).toBeGreaterThan(1000);
    const by = new Map<string, number>();
    for (const s of seeds) by.set(s.p.id, (by.get(s.p.id) ?? 0) + 1);
    for (const id of ['flower-bed', 'barrel-cactus', 'fern-clump', 'wheat-patch', 'boxwood-ball', 'round-bush', 'ornamental-grass']) {
      expect(by.get(id) ?? 0, id).toBeGreaterThan(0);
    }
    for (const s of seeds) {
      expect(PLANT_KINDS[s.kind].mowable).toBe(true);
      expect(s.h).toBeLessThanOrEqual(FLORA.maxMowHeight);
    }
    const never = ['hedgerow', 'hedge-arch', 'topiary-cone', 'tall-cactus', 'broadleaf-tree', 'cone-pine', 'snow-pine', 'palm-tree', 'giant-oak'];
    expect(seeds.filter((s) => never.includes(s.p.id))).toEqual([]);
  });

  it('takes their colliders out of world.boxes', () => {
    expect(removed).toBeGreaterThanOrEqual(200);
    expect(removed).toBeLessThanOrEqual(260);
    expect(boxes.length).toBe(before - removed);
  });

  it('THE GUARD: no box is left standing on a mowable plant', () => {
    const bad: string[] = [];
    for (const s of seeds) {
      const hit = boxes.find((b) => s.cx >= b.minX && s.cx <= b.maxX && s.cz >= b.minZ && s.cz <= b.maxZ && b.h < s.y + 2.5);
      if (hit) bad.push(`${s.p.id} at (${s.cx.toFixed(1)}, ${s.cz.toFixed(1)}): box ${JSON.stringify(hit)}`);
    }
    expect(bad.slice(0, 5), `${bad.length} mowable plants still under a blocking box`).toEqual([]);
  });
});

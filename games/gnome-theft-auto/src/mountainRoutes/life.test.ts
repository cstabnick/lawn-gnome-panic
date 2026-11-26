import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';

vi.mock('../audio', () => ({ play: () => undefined, getAudioOutput: () => null }));

import { heightAt } from '../terrain';
import type { World } from '../types';
import type { MountainDeps } from './deps';
import { createMountainLife } from './life';
import { ALL_ROUTES } from './routes';
import { HATBAND_SPOTS } from './defs/hatband';

beforeAll(() => { installFakeDom(); heightAt(0, 0); });

function routeDistance(x: number, z: number): number {
  let best = Infinity;
  for (const t of ALL_ROUTES) {
    for (const s of t.samples()) {
      const d = Math.hypot(s.x - x, s.z - z);
      if (d < best) best = d;
    }
  }
  return best;
}

describe('createMountainLife', () => {
  it('builds 7 goats and 2 birds, keeps goats 8 m off the routes and birds on their circles for 60 s', () => {
    const scene = new THREE.Scene();
    const world = { boxes: [] } as unknown as World;
    const deps = { toast: () => undefined, unlock: () => undefined, increment: () => undefined, vehicleKind: () => null } as unknown as MountainDeps;
    const area = createMountainLife(scene, world, deps);

    const goats = scene.children.filter((c) => c.name === 'mountain-goat');
    const birds = scene.children.filter((c) => c.name === 'mountain-bird');
    expect(goats).toHaveLength(7);
    expect(birds).toHaveLength(2);

    for (const g of goats) expect(routeDistance(g.position.x, g.position.z)).toBeGreaterThanOrEqual(8);

    const px = HATBAND_SPOTS.scree.x;
    const pz = HATBAND_SPOTS.scree.z;
    for (let step = 0; step < 600; step++) {
      area.update(0.1, px, pz, 0);
      for (const g of goats) {
        expect(routeDistance(g.position.x, g.position.z)).toBeGreaterThanOrEqual(8);
      }
      for (const b of birds) {
        const home = b.userData.home as { x: number; z: number; r: number };
        expect(Math.hypot(b.position.x - home.x, b.position.z - home.z)).toBeLessThanOrEqual(home.r + 5);
      }
    }
    expect(area.blips()).toEqual([]);
  });
});

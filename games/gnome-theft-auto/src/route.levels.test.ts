import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from './testing/fakeDom';
import { groundAt } from './terrain';
import { roadRoute } from './route';
import type { World } from './types';
import { deckContactsAt } from './highways/deck';
import { addSkywayRoads } from './highways/roads';

let world: World;

beforeAll(async () => {
  installFakeDom();
  const { buildWorld } = await import('./world');
  world = buildWorld(new THREE.Scene(), undefined as unknown as THREE.WebGLRenderer);
  addSkywayRoads(world.roads);
}, 120000);

describe('roadRoute levels', () => {
  it('a route from the Skyway deck to the east highway has a deck stretch', () => {
    const from = { x: 100, z: -60, y: groundAt(100, -60) };
    const route = roadRoute(world.roads, from, { x: 600, z: 32 });
    expect(route.some((p) => p.level === 'deck')).toBe(true);
  });

  it('a route starting on the deck begins on a deck node', () => {
    const from = { x: 0, z: -60, y: groundAt(0, -60) };
    const route = roadRoute(world.roads, from, { x: 600, z: 32 });
    const deckNodes = world.roads.nodes.filter((n) => n.deck !== undefined);
    const near = deckNodes.some((n) => Math.hypot(n.x - route[1].x, n.z - route[1].z) < 10);
    expect(near).toBe(true);
  });

  it('a ground route from (0,-70) to (100,-70) never starts on the deck', () => {
    const route = roadRoute(world.roads, { x: 0, z: -70 }, { x: 100, z: -70 });
    expect(route[0].level).not.toBe('deck');
    const hasDeck = route.some((p) => p.level === 'deck');
    const hasUnder = route.some((p) => p.level === 'under');
    expect(hasUnder || !hasDeck).toBe(true);
  });

  it('no route point lies in the unfinished-span footprint', () => {
    const routes = [
      roadRoute(world.roads, { x: 100, z: -60, y: groundAt(100, -60) }, { x: 600, z: 32 }),
      roadRoute(world.roads, { x: 0, z: -70 }, { x: 100, z: -70 }),
    ];
    for (const route of routes) {
      for (const p of route) {
        const inSpan = deckContactsAt(p.x, p.z).filter((c) => c.skyway.id === 'unfinished-span');
        expect(inSpan).toEqual([]);
      }
    }
  });
});

import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from './testing/fakeDom';
import { groundAt, heightAt } from './terrain';
import { addSkywayRoads, nodeY } from './highways/roads';
import { levelNodes } from './police';
import type { World } from './types';

let world: World;

beforeAll(async () => {
  installFakeDom();
  const { buildWorld } = await import('./world');
  world = buildWorld(new THREE.Scene(), undefined as unknown as THREE.WebGLRenderer);
  addSkywayRoads(world.roads);
}, 120000);

describe('police level selection', () => {
  it('on the deck, only deck nodes are chosen', () => {
    const y = groundAt(0, -60);
    const out = levelNodes(world.roads.nodes, 0, -60, y, 0, 400);
    expect(out.length).toBeGreaterThan(0);
    for (const n of out) expect(n.deck).toBeDefined();
  });

  it('on the land, every chosen node is at land height (ground nodes, and ramp feet that touch the ground)', () => {
    const y = heightAt(0, 0);
    const out = levelNodes(world.roads.nodes, 0, 0, y, 0, 400);
    expect(out.length).toBeGreaterThan(0);
    expect(out.some((n) => n.deck === undefined)).toBe(true);
    for (const n of out) expect(Math.abs(nodeY(n) - y)).toBeLessThan(3);
  });
});

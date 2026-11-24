import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from './testing/fakeDom';
import { heightAt } from './terrain';
import type { RoadNode, World } from './types';
import { deckContactsAt } from './highways/deck';
import { addSkywayRoads, roadY } from './highways/roads';
import { pickSpot, simGraph } from './trafficSim';

let world: World;
let graph: ReturnType<typeof simGraph>;

beforeAll(async () => {
  installFakeDom();
  const { buildWorld } = await import('./world');
  world = buildWorld(new THREE.Scene(), undefined as unknown as THREE.WebGLRenderer);
  addSkywayRoads(world.roads);
  graph = simGraph(world.roads.nodes, world.roads.laneOffset);
}, 120000);

/** A seeded random source, so the spots are the same every run. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe('traffic height follows the road level', () => {
  it('a car on a skyway lane sits at the deck top, a car on the street at the land', () => {
    const nodes = new Map<number, RoadNode>(world.roads.nodes.map((n) => [n.id, n]));
    const rand = lcg(7);
    let deckSpots = 0;
    let groundSpots = 0;
    for (const [cx, cz] of [[255, -60], [0, -60]]) {
      for (let i = 0; i < 200; i++) {
        const spot = pickSpot(
          graph,
          { x: cx, z: cz, minDist: 0, maxDist: 400, viewers: [], avoid: [], clear: 0 },
          rand,
        );
        if (!spot) continue;
        const a = nodes.get(spot.from);
        const b = nodes.get(spot.to);
        if (!a || !b) continue;
        // The materialize rule: a link with a deck node at either end (not a ramp foot joining the street) takes roadY.
        if (a.deck !== undefined && b.deck !== undefined) {
          const y = roadY(a, b, spot.x, spot.z);
          const contacts = deckContactsAt(spot.x, spot.z);
          expect(contacts.some((c) => Math.abs(c.surfaceY - y) <= 0.05)).toBe(true);
          deckSpots++;
        } else if (a.deck === undefined && b.deck === undefined) {
          const y = roadY(a, b, spot.x, spot.z);
          expect(y).toBe(heightAt(spot.x, spot.z));
          groundSpots++;
        }
      }
    }
    expect(deckSpots).toBeGreaterThan(0);
    expect(groundSpots).toBeGreaterThan(0);
  });
});

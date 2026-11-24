import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';
import { groundAt, heightAt } from '../terrain';
import type { RoadNode, World } from '../types';
import { deckContactsAt } from './deck';
import { addSkywayRoads, footConnectors, nearestRoadNode, nodeY, roadY } from './roads';
import { lanePose, simGraph } from '../trafficSim';

let world: World;
let groundCount = 0;

beforeAll(async () => {
  installFakeDom();
  const { buildWorld } = await import('../world');
  world = buildWorld(new THREE.Scene(), undefined as unknown as THREE.WebGLRenderer);
  groundCount = world.roads.nodes.length;
  addSkywayRoads(world.roads);
}, 120000);

const byId = (): Map<number, RoadNode> => new Map(world.roads.nodes.map((n) => [n.id, n]));

function reachable(from: RoadNode): Set<number> {
  const m = byId();
  const seen = new Set<number>([from.id]);
  const q = [from.id];
  while (q.length) {
    const n = m.get(q.shift()!)!;
    for (const l of n.links) if (!seen.has(l)) { seen.add(l); q.push(l); }
  }
  return seen;
}

describe('skyways in the road graph', () => {
  it('adds deck nodes for the road decks only, ids still equal indices, links symmetric', () => {
    const nodes = world.roads.nodes;
    nodes.forEach((n, i) => expect(n.id).toBe(i));
    const decks = new Set(nodes.filter((n) => n.deck).map((n) => n.deck));
    expect([...decks].sort()).toEqual(['beltway-north', 'beltway-south', 'turfton-skyway']);
    const m = byId();
    for (const n of nodes) for (const l of n.links) expect(m.get(l)!.links).toContain(n.id);
    // Existing ground nodes keep their ids and positions.
    for (let i = 0; i < groundCount; i++) expect(nodes[i].deck).toBeUndefined();
  });

  it('every ramp foot joins a ground road, and the decks are part of the one road network', () => {
    const feet = footConnectors();
    expect(feet.map((f) => f.skyway).sort()).toEqual(['beltway-north', 'beltway-south', 'turfton-skyway', 'turfton-skyway']);
    const m = byId();
    for (const f of feet) {
      const foot = world.roads.nodes.find((n) => n.deck && Math.hypot(n.x - f.foot.x, n.z - f.foot.z) < 0.5)!;
      expect(foot).toBeTruthy();
      expect(foot.links.some((l) => m.get(l)!.deck === undefined)).toBe(true);
    }
    // From the city centre crossing, every deck node can be reached.
    const centre = world.roads.nodes.find((n) => n.x === 0 && n.z === 0 && !n.deck)!;
    const seen = reachable(centre);
    for (const n of world.roads.nodes) if (n.deck) expect(seen.has(n.id)).toBe(true);
  });

  it('the beltway branches share the junction node on the Skyway', () => {
    const j = world.roads.nodes.find((n) => n.deck === 'turfton-skyway' && Math.hypot(n.x - 255, n.z + 60) < 0.5)!;
    expect(j).toBeTruthy();
    const m = byId();
    const linked = new Set(j.links.map((l) => m.get(l)!.deck));
    expect(linked.has('beltway-north')).toBe(true);
    expect(linked.has('beltway-south')).toBe(true);
    expect(linked.has('turfton-skyway')).toBe(true);
  });

  it('nothing routes into the Unfinished Span, the site ramps or a crack', () => {
    for (const n of world.roads.nodes) {
      for (const c of deckContactsAt(n.x, n.z)) {
        expect(c.skyway.kind ?? 'road').toBe('road');
      }
    }
    // No link passes over the Span's gap: sample each link.
    const m = byId();
    for (const n of world.roads.nodes) {
      for (const l of n.links) {
        const o = m.get(l)!;
        for (let t = 0; t <= 1; t += 0.1) {
          const x = n.x + (o.x - n.x) * t, z = n.z + (o.z - n.z) * t;
          if (!n.deck && !o.deck) continue;
          for (const c of deckContactsAt(x, z)) expect(c.skyway.id).not.toBe('unfinished-span');
        }
      }
    }
  });

  it('a nearest-node lookup keeps to the level it is asked about', () => {
    const nodes = world.roads.nodes;
    // Under the Skyway, at the city crossing (0, -60): the street node; up on the deck, the deck node.
    const street = nearestRoadNode(nodes, 0, -60, heightAt(0, -60));
    expect(street?.deck).toBeUndefined();
    const deckTop = groundAt(0, -60);
    expect(deckTop).toBeGreaterThan(heightAt(0, -60) + 5);
    expect(nearestRoadNode(nodes, 0, -60, deckTop)?.deck).toBe('turfton-skyway');
    // With no height: ground nodes only.
    for (const [x, z] of [[0, -60], [255, -60], [300, -60]]) expect(nearestRoadNode(nodes, x, z)?.deck).toBeUndefined();
  });

  it('traffic placed on any lane gets the right level: deck links on the deck, ground links on the land under it', () => {
    const g = simGraph(world.roads.nodes, world.roads.laneOffset);
    const m = byId();
    let deckSegs = 0, underSegs = 0;
    for (const seg of g.segs) {
      const a = m.get(seg.a)!, b = m.get(seg.b)!;
      for (const t of [0.25, 0.5, 0.75]) {
        const p = lanePose(g, a.id, b.id, seg.len * t);
        const y = roadY(a, b, p.x, p.z);
        if (!a.deck && !b.deck) {
          expect(y).toBe(heightAt(p.x, p.z));
          if (deckContactsAt(p.x, p.z).length > 0) underSegs++;
        } else if (a.deck && b.deck) {
          deckSegs++;
          // On the deck: the deck's own top at that point (never the street underneath).
          const top = deckContactsAt(p.x, p.z).map((c) => c.surfaceY);
          expect(top.some((s) => Math.abs(s - y) < 0.05)).toBe(true);
        } else {
          // A foot link: between the land and the ramp foot, never far above or below either end.
          expect(y).toBeGreaterThanOrEqual(Math.min(nodeY(a), nodeY(b)) - 1);
          expect(y).toBeLessThanOrEqual(Math.max(nodeY(a), nodeY(b)) + 1);
        }
      }
    }
    expect(deckSegs).toBeGreaterThan(30);
    // The city street under the Skyway and the roads under the beltway are there and stay on the land.
    expect(underSegs).toBeGreaterThan(10);
  });
});

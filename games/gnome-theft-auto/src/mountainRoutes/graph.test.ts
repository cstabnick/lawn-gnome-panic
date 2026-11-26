import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from '../testing/fakeDom';
import type { RoadNode, World } from '../types';
import { addSkywayRoads } from '../highways/roads';
import { roadRoute } from '../route';
import { routesOfKind, ROUTES } from './routes';
import { addMountainRoads } from './graph';

let world: World;
let before = 0;

beforeAll(async () => {
  installFakeDom();
  const { buildWorld } = await import('../world');
  world = buildWorld(new THREE.Scene(), undefined as unknown as THREE.WebGLRenderer);
  addSkywayRoads(world.roads);
  before = world.roads.nodes.length;
  addMountainRoads(world.roads);
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

/** The nodes this call added that sit on a route's centre line, in order along it. */
function routeNodes(id: string): RoadNode[] {
  const track = ROUTES[id as keyof typeof ROUTES];
  const added = world.roads.nodes.slice(before);
  return added
    .map((n) => ({ n, spot: track.locate(n.x, n.z, 2) }))
    .filter((p) => p.spot !== null && p.spot.dist <= 0.5)
    .sort((a, b) => a.spot!.s - b.spot!.s)
    .map((p) => p.n);
}

describe('mountain road routes in the road graph', () => {
  it('node ids equal indices and links are symmetric', () => {
    const nodes = world.roads.nodes;
    nodes.forEach((n, i) => expect(n.id).toBe(i));
    const m = byId();
    for (const n of nodes) for (const l of n.links) expect(m.get(l)!.links).toContain(n.id);
  });

  it('every road route has nodes at both ends, close spacing, and sits on its centre line', () => {
    for (const id of routesOfKind('road')) {
      const track = ROUTES[id];
      const S = track.samples();
      const nodes = routeNodes(id);
      expect(nodes.length).toBeGreaterThan(2);
      const near = (x: number, z: number): boolean => nodes.some((n) => Math.hypot(n.x - x, n.z - z) <= 1);
      expect(near(S[0].x, S[0].z)).toBe(true);
      expect(near(S[S.length - 1].x, S[S.length - 1].z)).toBe(true);
      for (let i = 1; i < nodes.length; i++) {
        expect(Math.hypot(nodes[i].x - nodes[i - 1].x, nodes[i].z - nodes[i - 1].z)).toBeLessThanOrEqual(12.5);
      }
      for (const n of nodes) {
        const spot = track.locate(n.x, n.z, 2);
        expect(spot?.dist ?? Infinity).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it('each road route is reachable from the north band road', () => {
    const north = world.roads.nodes
      .filter((n) => n.deck === undefined && n.links.length > 0)
      .reduce((best, n) => (Math.hypot(n.x - 300, n.z + 1330) < Math.hypot(best.x - 300, best.z + 1330) ? n : best));
    const seen = reachable(north);
    for (const id of routesOfKind('road')) {
      for (const n of routeNodes(id)) expect(seen.has(n.id)).toBe(true);
    }
  });

  it('a route plan between points beside each road follows the road', () => {
    for (const id of routesOfKind('road')) {
      const track = ROUTES[id];
      const S = track.samples();
      // 20 m beside the start, and 20 m beside the end. Brim Gap Road starts and ends on the same band road, so
      // its far point is taken at the middle of the road (else the plan just drives the band between its ends).
      const far = id === 'brim-gap-road' ? S[Math.floor(S.length / 2)] : S[S.length - 1];
      const a = track.frame(S[0].s, 20);
      const b = track.frame(far.s, -20);
      const pts = roadRoute(world.roads, { x: a.x, z: a.z }, { x: b.x, z: b.z });
      expect(pts.length).toBeGreaterThan(1);
      const near = pts.filter((p) => (track.locate(p.x, p.z, 8)?.dist ?? Infinity) <= 6).length;
      expect(near / pts.length).toBeGreaterThanOrEqual(0.6);
    }
  });

  it('no new node lies on the Hatband or the Brim Walk, except near a road meeting point', () => {
    const roadTracks = routesOfKind('road').map((id) => ROUTES[id]);
    for (const id of ['hatband', 'brim-walk'] as const) {
      const track = ROUTES[id];
      for (const n of world.roads.nodes.slice(before)) {
        const d = track.locate(n.x, n.z, 8)?.dist ?? Infinity;
        if (d > 8) continue;
        const meets = roadTracks.some((r) => (r.locate(n.x, n.z, 15)?.dist ?? Infinity) <= 15);
        expect(meets).toBe(true);
      }
    }
  });
});

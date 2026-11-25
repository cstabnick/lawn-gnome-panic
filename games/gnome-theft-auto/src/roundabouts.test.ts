// Roundabouts (E28): the rings in the documents, one-way marking, and route search going the right way round.
import { describe, expect, it } from 'vitest';
import { HIGHWAYS } from './config';
import { planRoute } from './errands';
import { roadRoute } from './route';
import {
  ROUNDABOUTS, applyRoundabouts, canDrive, createLapWatch, islandOnLeft, islandRadius, onRing, roundaboutAt,
} from './roundabouts';
import type { RoadNode } from './types';

/** The highway part of the road graph, built the way world.ts builds it (a node per vertex, legs split at 40 m). */
function highwayGraph(): RoadNode[] {
  const nodes: RoadNode[] = [];
  const at = new Map<string, number>();
  const id = (x: number, z: number): number => {
    const k = `${Math.round(x * 100)},${Math.round(z * 100)}`;
    let i = at.get(k);
    if (i === undefined) { i = nodes.length; at.set(k, i); nodes.push({ id: i, x, z, links: [] }); }
    return i;
  };
  const link = (a: number, b: number): void => {
    if (a === b) return;
    if (!nodes[a].links.includes(b)) nodes[a].links.push(b);
    if (!nodes[b].links.includes(a)) nodes[b].links.push(a);
  };
  for (const hw of HIGHWAYS) {
    let prev = id(hw.points[0][0], hw.points[0][1]);
    for (let k = 0; k + 1 < hw.points.length; k++) {
      const [ax, az] = hw.points[k];
      const [bx, bz] = hw.points[k + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 40));
      for (let s = 1; s <= n; s++) {
        const next = s === n ? id(bx, bz) : id(ax + ((bx - ax) * s) / n, az + ((bz - az) * s) / n);
        link(prev, next);
        prev = next;
      }
    }
  }
  applyRoundabouts(nodes);
  return nodes;
}

const angleOf = (rb: { x: number; z: number }, n: { x: number; z: number }): number => Math.atan2(n.z - rb.z, n.x - rb.x);
const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

describe('roundabouts', () => {
  const nodes = highwayGraph();

  it('finds the four rings in the documents', () => {
    const byId = Object.fromEntries(ROUNDABOUTS.map((r) => [r.id, r]));
    expect(Object.keys(byId).sort()).toEqual([
      'roundabout/anthill-ring', 'roundabout/hatwheel', 'roundabout/place-du-pot', 'roundabout/trellis-cross',
    ]);
    expect(byId['roundabout/trellis-cross'].x).toBeCloseTo(-950, 0);
    expect(byId['roundabout/trellis-cross'].r).toBeCloseTo(16, 0);
    expect(byId['roundabout/hatwheel'].r).toBeCloseTo(20, 0);
    expect(byId['roundabout/hatwheel'].width).toBe(7);
    for (const rb of ROUNDABOUTS) {
      expect(islandRadius(rb)).toBeGreaterThan(4);
      expect(roundaboutAt(rb.x, rb.z)).toBe(rb);
      expect(onRing(rb, rb.x + rb.r, rb.z)).toBe(true);
      expect(onRing(rb, rb.x, rb.z)).toBe(false);
    }
  });

  it('travel with the island on the left is anticlockwise seen from above with north up', () => {
    // At the east point of a ring centred on the origin, heading north (-z) keeps the centre on the left.
    expect(islandOnLeft(10, 0, 10, -1, 0, 0)).toBe(true);
    expect(islandOnLeft(10, 0, 10, 1, 0, 0)).toBe(false);
  });

  it('every ring is one-way: each ring node has one way on round it, and going on round comes back', () => {
    for (const rb of ROUNDABOUTS) {
      const ring = nodes.filter((n) => n.ring === rb.id);
      expect(ring.length, rb.id).toBeGreaterThanOrEqual(8);
      for (const n of ring) {
        const onward = n.links.filter((l) => nodes[l].ring === rb.id && canDrive(n, l));
        const back = n.links.filter((l) => nodes[l].ring === rb.id && !canDrive(n, l));
        expect(onward.length, `${rb.id} node ${n.id}`).toBe(1);
        expect(back.length, `${rb.id} node ${n.id}`).toBe(1);
        // Onward means the angle round the centre falls (island on the left).
        expect(wrap(angleOf(rb, nodes[onward[0]]) - angleOf(rb, n))).toBeLessThan(0);
      }
      // Walk round: back to the start after exactly ring.length steps.
      let cur = ring[0];
      for (let i = 0; i < ring.length; i++) {
        cur = nodes[cur.links.find((l) => nodes[l].ring === rb.id && canDrive(cur, l))!];
      }
      expect(cur.id).toBe(ring[0].id);
      // Spokes stay two-way: a node off the ring is never restricted.
      for (const n of nodes) if (n.ring === undefined) expect(n.noDrive).toBeUndefined();
    }
  });

  it('errand routes go round the right way (at Trellis Cross a right turn is a quarter round, a left three quarters)', () => {
    const near = (x: number, z: number): RoadNode =>
      nodes.reduce((b, n) => (Math.hypot(n.x - x, n.z - z) < Math.hypot(b.x - x, b.z - z) ? n : b));
    const rb = ROUNDABOUTS.find((r) => r.id === 'roundabout/trellis-cross')!;
    // In from the east (from Turfton, heading west): the north road is a right turn, the south road a left turn.
    const from = near(-870, -30);
    const right = planRoute(nodes, from.id, near(-950, -120).id)!;
    const rightTurn = right.map((i) => nodes[i]).filter((n) => n.ring === rb.id);
    let quarter = 0;
    for (let i = 1; i < rightTurn.length; i++) quarter += wrap(angleOf(rb, rightTurn[i]) - angleOf(rb, rightTurn[i - 1]));
    expect(quarter).toBeCloseTo(-Math.PI / 2, 1);
    const to = near(-950, 60);
    const path = planRoute(nodes, from.id, to.id)!;
    expect(path).not.toBeNull();
    const ringPart = path.map((i) => nodes[i]).filter((n) => n.ring === rb.id);
    let turned = 0;
    for (let i = 1; i < ringPart.length; i++) turned += wrap(angleOf(rb, ringPart[i]) - angleOf(rb, ringPart[i - 1]));
    expect(turned).toBeLessThan(-Math.PI); // more than half way round, the right way
    for (let i = 1; i < path.length; i++) expect(canDrive(nodes[path[i - 1]], path[i])).toBe(true);
  });

  it('the GPS route never runs a ring the wrong way', () => {
    const graph = { nodes, laneOffset: 2.5 };
    const route = roadRoute(graph, { x: -900, z: -30 }, { x: -950, z: -300 });
    const rb = ROUNDABOUTS.find((r) => r.id === 'roundabout/trellis-cross')!;
    const onIt = route.filter((p) => Math.abs(Math.hypot(p.x - rb.x, p.z - rb.z) - rb.r) < 0.5);
    let turned = 0;
    for (let i = 1; i < onIt.length; i++) turned += wrap(angleOf(rb, onIt[i]) - angleOf(rb, onIt[i - 1]));
    expect(turned).toBeLessThanOrEqual(0);
  });

  it('every spoke can get on and off every ring', () => {
    for (const rb of ROUNDABOUTS) {
      const ring = nodes.filter((n) => n.ring === rb.id);
      const spokes = ring.flatMap((n) => n.links.filter((l) => nodes[l].ring !== rb.id));
      expect(spokes.length, rb.id).toBeGreaterThanOrEqual(3);
      for (const a of spokes) for (const b of spokes) {
        if (a === b) continue;
        expect(planRoute(nodes, a, b), `${rb.id}: ${a} -> ${b}`).not.toBeNull();
      }
    }
  });

  it('a lap watch counts one full turn the right way round, and nothing for a pass through', () => {
    const rb = ROUNDABOUTS[0];
    const w = createLapWatch();
    let done = false;
    for (let k = 0; k <= 80; k++) {
      const a = -k * (2 * Math.PI) / 72; // falling angle: the right way round
      done = w.step(rb.x + rb.r * Math.cos(a), rb.z + rb.r * Math.sin(a), 0.1) || done;
    }
    expect(done).toBe(true);
    const w2 = createLapWatch();
    let wrong = false;
    for (let k = 0; k <= 80; k++) {
      const a = k * (2 * Math.PI) / 72;
      wrong = w2.step(rb.x + rb.r * Math.cos(a), rb.z + rb.r * Math.sin(a), 0.1) || wrong;
    }
    expect(wrong).toBe(false);
  });
});

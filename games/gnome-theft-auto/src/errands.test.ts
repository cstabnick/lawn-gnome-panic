// Errand routing: the Snail-Coach loops its stops, and drivers prefer places ahead of them over doubling back.
import { describe, expect, it } from 'vitest';
import { PLACES } from './config';
import { BUS_ROUTE_PLACES, freshErrand, nextLeg, pickBusErrand, pickErrand, placeNodes } from './errands';
import type { RoadNode } from './types';

/** The 7x7 city grid (60 apart) plus a long spur out east, like the real road graph. */
function gridNodes(): RoadNode[] {
  const lines = [-180, -120, -60, 0, 60, 120, 180];
  const nodes: RoadNode[] = [];
  const at = (x: number, z: number): number => nodes.findIndex((n) => n.x === x && n.z === z);
  for (const x of lines) for (const z of lines) nodes.push({ id: nodes.length, x, z, links: [] });
  const link = (a: number, b: number): void => { nodes[a].links.push(b); nodes[b].links.push(a); };
  for (const x of lines) for (const z of lines) {
    if (x < 180) link(at(x, z), at(x + 60, z));
    if (z < 180) link(at(x, z), at(x, z + 60));
  }
  let prev = at(180, 0);
  for (const x of [240, 300, 374]) {
    nodes.push({ id: nodes.length, x, z: 0, links: [] });
    link(prev, nodes.length - 1);
    prev = nodes.length - 1;
  }
  return nodes;
}

/** A seeded random in [0, 1): the same sequence every time it is made. */
function seeded(): () => number {
  let s = 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

describe('errands: routing bias and the bus loop', () => {
  const nodes = gridNodes();
  const placeNode = placeNodes(nodes);
  const w = { nodes, placeNode };
  const at = (x: number, z: number): number => nodes.findIndex((n) => n.x === x && n.z === z);

  it('the Snail-Coach visits its stops in loop order, twice round', () => {
    // The 60-unit test grid snaps the real stops onto shared junctions (hospital and downtown are both at 0,0), so give the
    // four stops four distinct junctions for this test.
    const stopAt: Record<string, [number, number]> = {
      downtown: [0, 0], gnomecino: [120, 0], hospital: [0, 120], 'clay-mart': [-120, -120],
    };
    const stops = PLACES.filter((p) => p.id in stopAt).map((p) => ({ ...p, x: stopAt[p.id][0], z: stopAt[p.id][1] }));
    const loopNodes = placeNodes(nodes, stops);
    const loopW = { nodes, placeNode: loopNodes };
    let from = loopNodes.get(BUS_ROUTE_PLACES[0])!;
    const visited: string[] = [];
    let came: number | undefined;
    for (let i = 0; i < 8; i++) {
      const e = pickBusErrand(loopW, from, came);
      expect(e).not.toBeNull();
      visited.push(e!.place.id);
      const path = e!.path;
      came = path[path.length - 2];
      from = path[path.length - 1];
    }
    // Starting at the first stop, the next errand is the second stop, then the rest in order, twice round.
    const loop = [...BUS_ROUTE_PLACES.slice(1), BUS_ROUTE_PLACES[0]];
    expect(visited).toEqual([...loop, ...loop]);
  });

  it('drivers prefer places ahead of them: heading +z picks more z >= 0 places than with no heading', () => {
    const mid = at(0, 0);
    const south = at(0, -60);
    const ahead = (rand: () => number): number => {
      let n = 0;
      for (let i = 0; i < 400; i++) {
        const e = pickErrand(w, 'ride-on', mid, south, rand)!;
        const p = PLACES.find((q) => q.id === e.place.id)!;
        if (p.z >= 0) n++;
      }
      return n / 400;
    };
    const biased = ahead(seeded());
    const plain = (() => {
      const rand = seeded();
      let n = 0;
      for (let i = 0; i < 400; i++) {
        const e = pickErrand(w, 'ride-on', mid, undefined, rand)!;
        const p = PLACES.find((q) => q.id === e.place.id)!;
        if (p.z >= 0) n++;
      }
      return n / 400;
    })();
    expect(biased - plain).toBeGreaterThanOrEqual(0.1);
  });

  it('with no errand, a driver does not turn back unless it is at a dead end', () => {
    const mid = at(0, 0);
    const west = at(-60, 0);
    const rand = seeded();
    for (let i = 0; i < 200; i++) {
      const leg = nextLeg(w, 'ride-on', null, mid, west, rand);
      expect(leg.to).not.toBe(west);
    }
    const tip = at(374, 0);
    const spurWest = at(300, 0);
    const leg = nextLeg(w, 'ride-on', null, tip, spurWest, rand);
    expect(leg.to).toBe(spurWest);
  });

  it('a fresh Snail-Coach errand is one of the bus stops', () => {
    const e = freshErrand(w, 'snail-coach', at(0, 0), at(0, -60));
    expect(e).not.toBeNull();
    expect(BUS_ROUTE_PLACES).toContain(e!.place.id);
  });
});

import { describe, expect, it } from 'vitest';
import type { RoadGraph, RoadNode } from '../../types';
import { makeRound } from './round';
import type { RoundOpts } from './round';
import { GARBAGE } from './types';

/** An n x n grid of nodes 60 m apart around the origin (id = row * n + col), plus one deck node that must be skipped. */
function gridGraph(n: number): RoadGraph {
  const nodes: RoadNode[] = [];
  const xs = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * 60);
  for (let iz = 0; iz < n; iz++) {
    for (let ix = 0; ix < n; ix++) {
      nodes.push({ id: iz * n + ix, x: xs[ix], z: xs[iz], links: [] });
    }
  }
  const link = (a: number, b: number) => { nodes[a].links.push(b); nodes[b].links.push(a); };
  for (let iz = 0; iz < n; iz++) {
    for (let ix = 0; ix < n; ix++) {
      const id = iz * n + ix;
      if (ix < n - 1) link(id, id + 1);
      if (iz < n - 1) link(id, id + n);
    }
  }
  // Deck node west of the grid, linked to the middle-left node.
  const mid = Math.floor(n / 2) * n;
  const deckId = n * n;
  nodes.push({ id: deckId, x: xs[0] - 60, z: 0, links: [mid], deck: 'skyway-test' });
  nodes[mid].links.push(deckId);
  return { nodes, laneOffset: 3 };
}

const anywhere = (): boolean => true;

function opts(level: number, seed: number, extra: Partial<RoundOpts> = {}): RoundOpts {
  return { level, seed, from: { x: -60, z: -60 }, clear: anywhere, ...extra };
}

describe('makeRound', () => {
  const roads = gridGraph(3);
  const big = gridGraph(5);

  it('keeps the bin count within the level limits', () => {
    // The 5x5 grid has enough streets for the walk to reach the full count.
    for (let seed = 1; seed <= 20; seed++) {
      const one = makeRound(big, opts(1, seed)).stops.length;
      expect(one).toBeGreaterThanOrEqual(7);
      expect(one).toBeLessThanOrEqual(9);
      const six = makeRound(big, opts(6, seed)).stops.length;
      expect(six).toBeGreaterThanOrEqual(12);
      expect(six).toBeLessThanOrEqual(GARBAGE.binsMax);
    }
    // The 3x3 grid runs out of streets early: never over the limit, and at least one bin.
    for (let seed = 1; seed <= 20; seed++) {
      const six = makeRound(roads, opts(6, seed)).stops.length;
      expect(six).toBeGreaterThanOrEqual(1);
      expect(six).toBeLessThanOrEqual(GARBAGE.binsMax);
    }
  });

  it('never uses the deck node', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const s of makeRound(roads, opts(6, seed)).stops) {
        expect(s.x).toBeGreaterThan(-100);
      }
    }
  });

  it('keeps bins at least 10 m apart and numbers them in order', () => {
    const round = makeRound(roads, opts(6, 7));
    round.stops.forEach((s, i) => expect(s.id).toBe(i));
    for (let i = 0; i < round.stops.length; i++) {
      for (let j = i + 1; j < round.stops.length; j++) {
        const a = round.stops[i];
        const b = round.stops[j];
        expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThanOrEqual(10);
      }
    }
  });

  it('puts bins on the right-hand kerb of the direction of travel', () => {
    // North-bound single segment: driving north d = (0, -1), right-hand side is east (+x).
    const road: RoadGraph = {
      nodes: [
        { id: 0, x: 0, z: 60, links: [1] },
        { id: 1, x: 0, z: -60, links: [0] },
      ],
      laneOffset: 3,
    };
    const round = makeRound(road, opts(1, 3, { from: { x: 0, z: 60 } }));
    expect(round.stops.length).toBeGreaterThan(0);
    for (const s of round.stops) {
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeCloseTo(GARBAGE.kerbOffset, 6);
      expect(s.z).toBeLessThanOrEqual(60);
      expect(s.z).toBeGreaterThanOrEqual(-60);
    }
  });

  it('keeps bins out of regions clear() rejects', () => {
    const blocked = (x: number) => x > 30 && x < 90;
    const round = makeRound(roads, opts(6, 11, { clear: (x) => !blocked(x) }));
    expect(round.stops.length).toBeGreaterThan(0);
    for (const s of round.stops) expect(blocked(s.x)).toBe(false);
  });

  it('is deterministic for a seed', () => {
    expect(makeRound(roads, opts(4, 42))).toEqual(makeRound(roads, opts(4, 42)));
  });

  it('gives a title naming the streets', () => {
    const round = makeRound(roads, opts(3, 5));
    expect(round.title.startsWith('Bin round: ')).toBe(true);
  });
});

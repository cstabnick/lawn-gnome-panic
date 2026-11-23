import { describe, it, expect } from 'vitest';
import { roadRoute } from './route';
import type { RoadGraph, RoadNode } from './types';

/** An n x n grid of road nodes, `spacing` apart, linked to their four neighbours. */
function grid(n: number, spacing: number): RoadGraph {
  const nodes: RoadNode[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const links: number[] = [];
      if (c > 0) links.push(r * n + c - 1);
      if (c < n - 1) links.push(r * n + c + 1);
      if (r > 0) links.push((r - 1) * n + c);
      if (r < n - 1) links.push((r + 1) * n + c);
      nodes.push({ id: r * n + c, x: c * spacing, z: r * spacing, links });
    }
  }
  return { nodes, laneOffset: 0 };
}

const len = (pts: { x: number; z: number }[]): number => {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
  return total;
};

describe('roadRoute', () => {
  it('follows linked neighbours across a grid, close to the Manhattan distance', () => {
    const g = grid(3, 100);
    const from = { x: 5, z: 5 };
    const to = { x: 195, z: 195 };
    const route = roadRoute(g, from, to);

    expect(route.length).toBeGreaterThan(2);
    const interior = route.slice(1, -1);
    for (const p of interior) {
      expect(p.x % 100).toBe(0);
      expect(p.z % 100).toBe(0);
    }
    for (let i = 1; i < interior.length; i++) {
      const d = Math.hypot(interior[i].x - interior[i - 1].x, interior[i].z - interior[i - 1].z);
      expect(d).toBeCloseTo(100, 5);
    }

    const manhattan = Math.abs(to.x - from.x) + Math.abs(to.z - from.z);
    expect(Math.abs(len(route) - manhattan)).toBeLessThanOrEqual(manhattan * 0.05);
  });

  it('gives two points for short trips', () => {
    const route = roadRoute(grid(3, 100), { x: 0, z: 0 }, { x: 30, z: 0 });
    expect(route).toEqual([{ x: 0, z: 0 }, { x: 30, z: 0 }]);
  });

  it('gives the straight line when the two parts of the graph are not connected', () => {
    const g: RoadGraph = {
      nodes: [
        { id: 0, x: 0, z: 0, links: [] },
        { id: 1, x: 500, z: 0, links: [] },
      ],
      laneOffset: 0,
    };
    expect(roadRoute(g, { x: 0, z: 0 }, { x: 500, z: 0 })).toEqual([{ x: 0, z: 0 }, { x: 500, z: 0 }]);
  });

  it('gives the straight line for an empty graph', () => {
    const g: RoadGraph = { nodes: [], laneOffset: 0 };
    expect(roadRoute(g, { x: 0, z: 0 }, { x: 200, z: 0 })).toEqual([{ x: 0, z: 0 }, { x: 200, z: 0 }]);
  });
});

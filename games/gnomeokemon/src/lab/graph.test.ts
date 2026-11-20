import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildGraph, route } from './lab';

const graph = buildGraph(new THREE.Vector3(12.6, 3, 40));
const ROOMS = ['map', 'hall', 'archive', 'dressing', 'office', 'darkroom'] as const;
const isRoom = (id: string): boolean => (ROOMS as readonly string[]).includes(id);

describe('walking graph', () => {
  it('reaches every room from every other room', () => {
    for (const a of ROOMS) for (const b of ROOMS) {
      const path = route(graph, a, b);
      expect(path[0], `${a}->${b}`).toBe(a);
      expect(path[path.length - 1], `${a}->${b}`).toBe(b);
    }
  });

  it('crosses floors without detouring through the middle of an intermediate room', () => {
    // A same-floor walk may pass through a room in between (a straight line through the lobby); a walk that uses the
    // stairs must go from the doorway straight to the stairs, never via a room's viewpoint in the middle.
    for (const a of ROOMS) for (const b of ROOMS) {
      const path = route(graph, a, b);
      if (!path.includes('stair:foot')) continue;
      const inner = path.slice(1, -1).filter(isRoom);
      expect(inner, `${a}->${b} passes through ${inner.join(',')}`).toEqual([]);
    }
  });

  it('goes up the stairs between floors and not otherwise', () => {
    const up = route(graph, 'map', 'dressing');
    expect(up).toContain('stair:foot');
    expect(up).toContain('stair:top');
    expect(route(graph, 'map', 'archive')).not.toContain('stair:foot');
    expect(route(graph, 'office', 'darkroom')).not.toContain('stair:foot');
  });

  it('only uses the front door on the way to and from the title view', () => {
    expect(route(graph, 'hall', 'title')).toContain('door:step');
    expect(route(graph, 'map', 'office')).not.toContain('door:step');
  });

  it('puts upstairs nodes higher than downstairs ones', () => {
    const y = (id: string): number => (graph.nodes.get(id) as THREE.Vector3).y;
    expect(y('office')).toBeGreaterThan(y('hall') + 4);
    expect(y('stair:top')).toBeCloseTo(y('office'), 5);
    expect(y('porch:top')).toBeGreaterThan(y('porch:base'));
  });
});

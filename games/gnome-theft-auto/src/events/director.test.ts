import { describe, expect, it } from 'vitest';
import type { World } from '../types';
import { DIRECTOR, pickEvent } from './director';
import { offRoad, pickAnchor, roadClearance, ROAD_HALF } from './spots';
import type { EventDef, SpawnContext } from './types';

function def(id: string, o: Partial<EventDef> = {}): EventDef {
  return {
    id, title: id, category: 'wild', hint: '', weight: 1, cooldown: 60, duration: 60, anchor: 'road',
    start: () => ({ update: () => 'running' }),
    ...o,
  };
}

const ctx = {
  px: 0, pz: 0, biome: 'turf', district: null, night: 0, heat: 0, inVehicle: false, onQuest: false,
} as unknown as SpawnContext;
const none = new Map<string, number>();

describe('director cadence', () => {
  it('spaces street events further apart (L71)', () => {
    expect(DIRECTOR.gapMin).toBe(45);
    expect(DIRECTOR.gapMax).toBe(90);
    expect(DIRECTOR.firstDelay).toBe(25);
  });
});

describe('pickEvent', () => {
  it('returns null for an empty list', () => {
    expect(pickEvent([], ctx, 0, none, () => 0)).toBeNull();
  });

  it('skips an event whose cooldown has not elapsed', () => {
    const a = def('a');
    const b = def('b');
    const readyAt = new Map([['a', 100]]);
    expect(pickEvent([a, b], ctx, 50, readyAt, () => 0)?.id).toBe('b');
  });

  it('skips an event whose when() is false', () => {
    const a = def('a', { when: () => false });
    const b = def('b');
    expect(pickEvent([a, b], ctx, 0, none, () => 0)?.id).toBe('b');
  });

  it('skips excluded ids', () => {
    const a = def('a');
    const b = def('b');
    expect(pickEvent([a, b], ctx, 0, none, () => 0, new Set(['a']))?.id).toBe('b');
  });

  it('with rand = 0 returns the first eligible event', () => {
    const a = def('a', { when: () => false });
    const b = def('b');
    const c = def('c');
    expect(pickEvent([a, b, c], ctx, 0, none, () => 0)?.id).toBe('b');
  });

  it('never picks an event with weight 0', () => {
    const z = def('z', { weight: 0 });
    const b = def('b');
    for (const r of [0, 0.25, 0.5, 0.99]) {
      expect(pickEvent([z, b], ctx, 0, none, () => r)?.id).toBe('b');
    }
    expect(pickEvent([z], ctx, 0, none, () => 0)).toBeNull();
  });
});

describe('pickAnchor', () => {
  const world = {
    roads: {
      nodes: [{ id: 0, x: 0, z: 0, links: [1] }, { id: 1, x: 80, z: 0, links: [0] }],
      laneOffset: 2,
    },
    walkPoints: [{ x: 70, z: 0 }],
  } as unknown as Pick<World, 'roads' | 'walkPoints'>;

  it("'road' returns the node in range, yawed towards its link", () => {
    const at = pickAnchor(world, 'road', 0, 0, () => 0, 55, 120);
    expect(at).not.toBeNull();
    expect(at?.x).toBe(80);
    expect(at?.z).toBe(0);
    expect(at?.yaw).toBe(Math.atan2(0 - 80, 0 - 0));
  });

  it("'walk' returns the walk point in range", () => {
    const at = pickAnchor(world, 'walk', 0, 0, () => 0, 55, 120);
    expect(at?.x).toBe(70);
    expect(at?.z).toBe(0);
  });

  it('returns null when nothing is in range', () => {
    expect(pickAnchor(world, 'road', 0, 0, () => 0, 500, 600)).toBeNull();
    expect(pickAnchor(world, 'walk', 0, 0, () => 0, 500, 600)).toBeNull();
  });
});

describe('offRoad', () => {
  const roads = { nodes: [{ id: 0, x: 0, z: 0, links: [1] }, { id: 1, x: 100, z: 0, links: [0] }], laneOffset: 2 };

  it('measures the distance to the nearest road centre line', () => {
    expect(roadClearance(roads, 50, 3).dist).toBeCloseTo(3);
  });

  it('moves a point on the road out to the verge, on its own side', () => {
    const p = offRoad(roads, 50, 2, 1.5);
    expect(p.x).toBeCloseTo(50);
    expect(p.z).toBeCloseTo(ROAD_HALF + 1.5);
    const q = offRoad(roads, 50, -1, 1.5);
    expect(q.z).toBeCloseTo(-(ROAD_HALF + 1.5));
  });

  it('leaves a point already off the road alone', () => {
    expect(offRoad(roads, 50, 20)).toEqual({ x: 50, z: 20 });
  });
});

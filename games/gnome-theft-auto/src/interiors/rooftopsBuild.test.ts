import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import type { Box } from '../types';
import { clearRooftops, rooftopSurfaceBelow } from './rooftops';
import { parapetBoxes, buildRooftops, PARAPET_H } from './rooftopsBuild';
import type { Rooftop } from './types';

const roof = (over: Partial<Rooftop> = {}): Rooftop => ({
  id: 't', minX: 0, maxX: 20, minZ: 0, maxZ: 20, y: 40, solid: true, parapet: true, ...over,
});

beforeEach(() => clearRooftops());

describe('parapetBoxes', () => {
  it('walls all four sides of a plain roof, inside the rim, to y + PARAPET_H', () => {
    const boxes = parapetBoxes(roof());
    expect(boxes).toHaveLength(4);
    expect(PARAPET_H).toBeCloseTo(1.1, 9);
    for (const b of boxes) {
      expect(b.h).toBeCloseTo(41.1, 9);
      expect(b.minX).toBeGreaterThan(0);
      expect(b.minZ).toBeGreaterThan(0);
      expect(b.maxX).toBeLessThan(20);
      expect(b.maxZ).toBeLessThan(20);
    }
  });

  it('splits the north wall around a pad, leaving a gap covering pad.x +- r', () => {
    const boxes = parapetBoxes(roof({ pad: { x: 10, z: 3, r: 5 } }));
    // North wall pieces are the ones at the minZ side (z < 1).
    const north = boxes.filter((b) => b.maxZ < 1).sort((a, b) => a.minX - b.minX);
    expect(north).toHaveLength(2);
    expect(north[0].maxX).toBeCloseTo(10 - 5, 9);
    expect(north[1].minX).toBeCloseTo(10 + 5, 9);
  });

  it('walls only the listed sides', () => {
    expect(parapetBoxes(roof({ parapet: ['n', 's'] }))).toHaveLength(2);
  });

  it('no parapet when parapet is false', () => {
    expect(parapetBoxes(roof({ parapet: false }))).toHaveLength(0);
  });
});

describe('buildRooftops', () => {
  it('registers the Double Pot slab with walkable surface and two parapet boxes', () => {
    const world = { boxes: [] as Box[] };
    buildRooftops(new THREE.Scene(), world as never);
    expect(rooftopSurfaceBelow(120, -90, 10, false)).toBe(9);
    expect(rooftopSurfaceBelow(120, -90, 5, false)).toBeNull();
    expect(world.boxes).toHaveLength(2);
  });
});

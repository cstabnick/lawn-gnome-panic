import { beforeEach, describe, expect, it } from 'vitest';
import { clampToWorld } from '../collide';
import { groundAt, heightAt, waterAt } from '../terrain';
import { floorUnder } from '../craft/aircraft';
import {
  defineInterior, interiorAt, interiorToWorld, pocketOrigin, resetInteriorsForTest,
} from './registry';
import { addRooftop, clearRooftops, landingPads, rooftopAt, rooftopSurfaceBelow } from './rooftops';
import type { InteriorDef } from './types';

beforeEach(() => {
  resetInteriorsForTest();
  clearRooftops();
});

function def(id: string, w: number, d: number, h: number): InteriorDef {
  return {
    id,
    name: id,
    size: { w, d, h },
    theme: 'shop',
    door: { x: 0, z: 0 },
    exit: { x: 0, z: 0 },
    build() {},
  } as unknown as InteriorDef;
}

describe('interiors: pocket allocation', () => {
  it('places normal and large interiors in separate, non-overlapping pockets', () => {
    const normal = Array.from({ length: 20 }, (_, i) => defineInterior(def(`n${i}`, 12, 10, 3)));
    const large = Array.from({ length: 2 }, (_, i) => defineInterior(def(`L${i}`, 300, 300, 8)));

    for (const p of [...normal, ...large]) {
      expect(p.origin.x).toBeGreaterThanOrEqual(5000);
    }

    const normalOrigins = normal.map((p) => p.origin);
    const largeOrigins = large.map((p) => p.origin);
    const all = [...normalOrigins, ...largeOrigins];
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        expect(all[i].x !== all[j].x || all[i].z !== all[j].z).toBe(true);
      }
    }

    for (let i = 0; i < normalOrigins.length; i++) {
      for (let j = i + 1; j < normalOrigins.length; j++) {
        const a = normalOrigins[i];
        const b = normalOrigins[j];
        expect(Math.abs(a.x - b.x) >= 200 || Math.abs(a.z - b.z) >= 200).toBe(true);
      }
    }

    for (const o of largeOrigins) {
      expect(o.z).toBeGreaterThanOrEqual(12000);
    }
    expect(
      Math.abs(largeOrigins[0].x - largeOrigins[1].x) >= 700 || Math.abs(largeOrigins[0].z - largeOrigins[1].z) >= 700,
    ).toBe(true);

    const first = normal[0];
    expect(interiorAt(first.origin.x + 3, first.origin.z - 2)?.def.id).toBe('n0');
    const lastLarge = large[1];
    expect(interiorAt(lastLarge.origin.x + 3, lastLarge.origin.z - 2)?.def.id).toBe('L1');

    expect(interiorToWorld('n0', 1, 2)).toEqual([first.origin.x + 1, first.origin.z + 2]);
    expect(pocketOrigin(0).x).toBeGreaterThanOrEqual(5000);
  });

  it('throws on a duplicate id and on a room larger than 600 m', () => {
    defineInterior(def('dup', 12, 10, 3));
    expect(() => defineInterior(def('dup', 12, 10, 3))).toThrow();
    expect(() => defineInterior(def('huge', 700, 10, 3))).toThrow();
  });
});

describe('interiors: world clamp and flat dry floors', () => {
  it('exempts interior space from clampToWorld', () => {
    const inside = clampToWorld(5100, 5100, 1400, 0.5);
    expect(inside.x).toBe(5100);
    expect(inside.z).toBe(5100);
    expect(inside.hit).toBe(false);

    const outside = clampToWorld(1500, 0, 1400, 0.5);
    expect(outside.x).toBe(1399.5);
    expect(outside.hit).toBe(true);
  });

  it('gives a flat, dry floor inside interior space', () => {
    expect(heightAt(5100, 5300)).toBe(0);
    expect(waterAt(5100, 5300)).toBeNull();
  });
});

describe('interiors: rooftops', () => {
  const slab = {
    id: 'slab',
    minX: 111,
    maxX: 129,
    minZ: -111,
    maxZ: -69,
    y: 9,
    solid: false,
    parapet: false,
    pad: { x: 120, z: -92, r: 7 },
  };
  const tower = { id: 'tower', minX: 0, maxX: 20, minZ: 0, maxZ: 20, y: 40, solid: true, parapet: true };

  it('lets a body stand on and an aircraft land on tower corners, and not outside the rim', () => {
    addRooftop(tower as never);
    const corners = [[0.5, 0.5], [19.5, 0.5], [0.5, 19.5], [19.5, 19.5]];
    for (const [x, z] of corners) {
      expect(rooftopAt(x, z, 40)?.id).toBe('tower');
      expect(floorUnder(x, z, 45).y).toBe(40);
    }

    for (const [x, z] of [[-1, 10], [21, 10], [10, -1], [10, 21]]) {
      expect(rooftopAt(x, z, 40)).toBeNull();
      expect(rooftopSurfaceBelow(x, z, 45)).toBeNull();
    }
  });

  it('keeps solid roofs out of groundAt and puts the slab under the road rules', () => {
    addRooftop(tower as never);
    addRooftop(slab as never);

    expect(rooftopSurfaceBelow(10, 10, 45, false)).toBeNull();

    expect(groundAt(120, -90, 9.2)).toBe(9);
    expect(groundAt(120, -90, 1)).toBeLessThan(9);
    expect(groundAt(120, -90)).toBeLessThan(9);

    const pads = landingPads();
    expect(pads).toHaveLength(1);
    expect(pads[0].id).toBe('slab');
    expect(pads[0].y).toBe(9);
  });

  it('throws when adding a rooftop with an existing id', () => {
    addRooftop(slab as never);
    expect(() => addRooftop(slab as never)).toThrow();
  });
});

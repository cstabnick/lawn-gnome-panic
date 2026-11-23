import { describe, expect, it } from 'vitest';
import type { Box } from '../types';
import type { PerchSpot } from './types';
import { classifyBox, createPerchIndex } from './perches';

/** Deterministic random numbers in [0, 1). */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function box(minX: number, maxX: number, minZ: number, maxZ: number, h: number): Box {
  return { minX, maxX, minZ, maxZ, h };
}

const flat0 = () => 0;
const dry = () => null;

function spot(): PerchSpot {
  return { x: 0, y: 0, z: 0, kind: 'ground' };
}

describe('classifyBox', () => {
  it('classifies a post as a tree perch', () => {
    expect(classifyBox(box(0, 0.3, 0, 0.3, 4), 0)).toBe('tree');
  });

  it('classifies a thin long wall as a fence perch', () => {
    expect(classifyBox(box(0, 0.2, 0, 6, 1.2), 0)).toBe('fence');
  });

  it('classifies a building as a roof perch', () => {
    expect(classifyBox(box(0, 8, 0, 6, 5), 0)).toBe('roof');
  });

  it('ignores a thin slab', () => {
    expect(classifyBox(box(0, 3, 0, 3, 0.3), 0)).toBeNull();
  });

  it('respects the ground offset', () => {
    expect(classifyBox(box(0, 8, 0, 6, 15), 10)).toBe('roof');
  });
});

describe('createPerchIndex', () => {
  it('finds a roof point on top of a house', () => {
    const house = box(0, 8, 0, 6, 5);
    const index = createPerchIndex([house], flat0, dry);
    const out = spot();
    expect(index.find(['roof'], 4, 3, 10, seeded(1), out)).toBe(true);
    expect(out.kind).toBe('roof');
    expect(out.y).toBe(5);
    expect(out.x).toBeGreaterThanOrEqual(0.4);
    expect(out.x).toBeLessThanOrEqual(7.6);
    expect(out.z).toBeGreaterThanOrEqual(0.4);
    expect(out.z).toBeLessThanOrEqual(5.6);
    expect(index.size()).toBe(1);
  });

  it('finds water only where water is', () => {
    const wet = (x: number) => (x < 0 ? 0 : null);
    const index = createPerchIndex([], flat0, wet);
    const out = spot();
    expect(index.find(['water'], 0, 0, 20, seeded(7), out)).toBe(true);
    expect(out.x).toBeLessThan(0);
    expect(out.kind).toBe('water');
  });

  it('falls back to ground when there are no fences', () => {
    const index = createPerchIndex([], flat0, dry);
    const out = spot();
    expect(index.find(['fence', 'ground'], 0, 0, 10, seeded(3), out)).toBe(true);
    expect(out.kind).toBe('ground');
  });

  it('returns false when nothing fits', () => {
    const index = createPerchIndex([], flat0, dry);
    expect(index.find(['roof'], 0, 0, 10, seeded(5), spot())).toBe(false);
    const allWet = createPerchIndex([], flat0, () => 0);
    expect(allWet.find(['ground'], 0, 0, 10, seeded(9), spot())).toBe(false);
  });
});

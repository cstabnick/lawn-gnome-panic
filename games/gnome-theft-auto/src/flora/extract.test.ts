import { describe, expect, it } from 'vitest';
import type { Box } from '../types';
import { extractPlantBoxes, plantBoxMatch } from './extract';
import { seedOf } from './harvest';
import type { PlantSeed } from './types';

function seedAt(id: string, x: number, z: number): PlantSeed {
  const s = seedOf({ id, x, y: 0, z, yaw: 0, scale: 1 });
  if (!s) throw new Error(`${id} is not a mowable plant at this size`);
  return s;
}

/** The collider a builder gives a plant: its footprint, topped at y + h. */
function ownBox(s: PlantSeed): Box {
  return { minX: s.cx - s.hw, maxX: s.cx + s.hw, minZ: s.cz - s.hd, maxZ: s.cz + s.hd, h: s.y + s.h };
}

describe('plant collider extraction', () => {
  const seed = seedAt('flower-bed', 40, 25);

  it('removes the seed\'s own collider', () => {
    expect(plantBoxMatch(ownBox(seed), seed)).toBe(true);
  });

  it('keeps a hedgerow-sized box (4 m long) at the same centre', () => {
    const hedge: Box = { minX: seed.cx - 2, maxX: seed.cx + 2, minZ: seed.cz - 0.5, maxZ: seed.cz + 0.5, h: seed.y + seed.h };
    expect(plantBoxMatch(hedge, seed)).toBe(false);
  });

  it('keeps a tree trunk (1 m square, top y + 6) at the same centre', () => {
    const trunk: Box = { minX: seed.cx - 0.5, maxX: seed.cx + 0.5, minZ: seed.cz - 0.5, maxZ: seed.cz + 0.5, h: seed.y + 6 };
    expect(plantBoxMatch(trunk, seed)).toBe(false);
  });

  it('keeps a box 2 m away', () => {
    const far: Box = { minX: seed.cx + 2 - seed.hw, maxX: seed.cx + 2 + seed.hw, minZ: seed.cz - seed.hd, maxZ: seed.cz + seed.hd, h: seed.y + seed.h };
    expect(plantBoxMatch(far, seed)).toBe(false);
  });

  it('removes matching boxes in place, keeps order and array identity, and returns the removed count', () => {
    const a: Box = { minX: 0, maxX: 1, minZ: 0, maxZ: 1, h: 3 };
    const mine = ownBox(seed);
    const hedge: Box = { minX: seed.cx - 2, maxX: seed.cx + 2, minZ: seed.cz - 0.5, maxZ: seed.cz + 0.5, h: seed.y + seed.h };
    const b: Box = { minX: 100, maxX: 101, minZ: 100, maxZ: 101, h: 2 };
    const boxes: Box[] = [a, mine, hedge, b];
    const ref = boxes;

    const removed = extractPlantBoxes(boxes, [seed]);

    expect(removed).toBe(1);
    expect(boxes).toBe(ref);
    expect(boxes).toEqual([a, hedge, b]);
    expect(boxes[0]).toBe(a);
    expect(boxes[1]).toBe(hedge);
    expect(boxes[2]).toBe(b);
  });

  it('returns 0 and leaves the boxes alone when nothing matches', () => {
    const boxes: Box[] = [{ minX: 0, maxX: 1, minZ: 0, maxZ: 1, h: 3 }];
    expect(extractPlantBoxes(boxes, [seed])).toBe(0);
    expect(boxes.length).toBe(1);
  });
});

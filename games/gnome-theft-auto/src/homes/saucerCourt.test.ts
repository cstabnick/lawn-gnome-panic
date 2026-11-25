import { describe, expect, it } from 'vitest';
import { planPieces } from './pieces';
import { saucerCourtPieces } from './saucerCourt';
import { SAUCER_COURT } from './types';

const { rect, exit, stairDoor } = SAUCER_COURT;
const boxes = planPieces(saucerCourtPieces()).boxes;
const inside = (b: { minX: number; maxX: number; minZ: number; maxZ: number }, x: number, z: number, m = 0) =>
  x >= b.minX - m && x <= b.maxX + m && z >= b.minZ - m && z <= b.maxZ + m;
const overlap = (a0: number, a1: number, b0: number, b1: number) => Math.min(a1, b1) - Math.max(a0, b0) > 1e-6;

describe('Saucer Court', () => {
  it('has colliders', () => expect(boxes.length).toBeGreaterThan(8));
  it('keeps every collider inside the site rectangle', () => {
    for (const b of boxes) {
      expect(b.minX).toBeGreaterThanOrEqual(rect.minX - 0.5);
      expect(b.maxX).toBeLessThanOrEqual(rect.maxX + 0.5);
      expect(b.minZ).toBeGreaterThanOrEqual(rect.minZ - 0.5);
      expect(b.maxZ).toBeLessThanOrEqual(rect.maxZ + 0.5);
    }
  });
  it('keeps the exit and the stairwell door clear', () => {
    for (const b of boxes) {
      expect(inside(b, exit.x, exit.z)).toBe(false);
      expect(inside(b, stairDoor.x, stairDoor.z, 1.5)).toBe(false);
    }
  });
  it('has no two colliders sharing an exact face', () => {
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        const zSpan = overlap(a.minZ, a.maxZ, b.minZ, b.maxZ), xSpan = overlap(a.minX, a.maxX, b.minX, b.maxX);
        const same = (p: number, q: number) => Math.abs(p - q) < 1e-6;
        if (zSpan) { expect(same(a.maxX, b.minX) || same(b.maxX, a.minX)).toBe(false); }
        if (xSpan) { expect(same(a.maxZ, b.minZ) || same(b.maxZ, a.minZ)).toBe(false); }
      }
    }
  });
});

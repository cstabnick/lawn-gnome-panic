import { describe, expect, it } from 'vitest';
import { dabPositions } from './strokeMath';

describe('dabPositions', () => {
  it('places exactly one dab at the first point of a stroke', () => {
    const r = dabPositions(null, { x: 3, z: 4 }, 1, 0);
    expect(r.points).toEqual([{ x: 3, z: 4 }]);
    expect(r.carry).toBe(0);
  });

  it('spaces dabs exactly on a long move and carries the remainder', () => {
    const r = dabPositions({ x: 0, z: 0 }, { x: 9, z: 0 }, 2, 0);
    expect(r.points.map((p) => p.x)).toEqual([2, 4, 6, 8]);
    expect(r.points.every((p) => p.z === 0)).toBe(true);
    expect(r.carry).toBeCloseTo(1, 9);
  });

  it('continues the carry across two short moves', () => {
    const a = dabPositions({ x: 0, z: 0 }, { x: 0.6, z: 0 }, 1, 0);
    expect(a.points).toEqual([]);
    expect(a.carry).toBeCloseTo(0.6, 9);
    const b = dabPositions({ x: 0.6, z: 0 }, { x: 1.2, z: 0 }, 1, a.carry);
    expect(b.points).toHaveLength(1);
    expect(b.points[0].x).toBeCloseTo(1.0, 9);
    expect(b.carry).toBeCloseTo(0.2, 9);
  });

  it('returns no points and keeps the carry for a zero-length move', () => {
    const r = dabPositions({ x: 5, z: 5 }, { x: 5, z: 5 }, 1, 0.4);
    expect(r.points).toEqual([]);
    expect(r.carry).toBe(0.4);
  });
});

import { describe, expect, it } from 'vitest';
import { insertPoint, nearestOnPolyline, nearestPoint, removePoint, type Pt } from './roadMath';

const line: Pt[] = [
  [0, 0],
  [10, 0],
  [10, 10],
];

describe('nearestOnPolyline', () => {
  it('projects onto the middle of a segment', () => {
    const hit = nearestOnPolyline(line, 4, 2);
    expect(hit.index).toBe(0);
    expect(hit.t).toBeCloseTo(0.4);
    expect(hit.x).toBeCloseTo(4);
    expect(hit.z).toBeCloseTo(0);
    expect(hit.dist).toBeCloseTo(2);
  });

  it('clamps to the start endpoint', () => {
    const hit = nearestOnPolyline(line, -3, 4);
    expect(hit.index).toBe(0);
    expect(hit.t).toBe(0);
    expect(hit.x).toBeCloseTo(0);
    expect(hit.z).toBeCloseTo(0);
    expect(hit.dist).toBeCloseTo(5);
  });

  it('clamps to the end endpoint of the last segment', () => {
    const hit = nearestOnPolyline(line, 12, 14);
    expect(hit.index).toBe(1);
    expect(hit.t).toBe(1);
    expect(hit.x).toBeCloseTo(10);
    expect(hit.z).toBeCloseTo(10);
    expect(hit.dist).toBeCloseTo(Math.hypot(2, 4));
  });

  it('picks the nearer of two segments', () => {
    const hit = nearestOnPolyline(line, 9, 6);
    expect(hit.index).toBe(1);
    expect(hit.t).toBeCloseTo(0.6);
    expect(hit.dist).toBeCloseTo(1);
  });

  it('treats a zero-length segment as its start point', () => {
    const hit = nearestOnPolyline([[5, 5], [5, 5]], 8, 9);
    expect(hit.index).toBe(0);
    expect(hit.t).toBe(0);
    expect(hit.x).toBe(5);
    expect(hit.z).toBe(5);
    expect(hit.dist).toBeCloseTo(5);
  });

  it('reports no segment for fewer than two points', () => {
    expect(nearestOnPolyline([], 1, 1).index).toBe(-1);
    expect(nearestOnPolyline([[0, 0]], 1, 1).index).toBe(-1);
  });
});

describe('insertPoint', () => {
  it('inserts after the given index and does not mutate the input', () => {
    const out = insertPoint(line, 0, 5, 1);
    expect(out).toEqual([
      [0, 0],
      [5, 1],
      [10, 0],
      [10, 10],
    ]);
    expect(line).toHaveLength(3);
  });

  it('appends after the last index', () => {
    expect(insertPoint(line, 2, 0, 20)).toEqual([...line, [0, 20]]);
  });

  it('inserts at the front for index -1', () => {
    expect(insertPoint(line, -1, -1, -1)[0]).toEqual([-1, -1]);
  });
});

describe('removePoint', () => {
  it('removes an interior point', () => {
    expect(removePoint(line, 1)).toEqual([
      [0, 0],
      [10, 10],
    ]);
  });

  it('removes an endpoint when more than two points remain', () => {
    expect(removePoint(line, 0)).toEqual([
      [10, 0],
      [10, 10],
    ]);
  });

  it('returns null when only two points would be left', () => {
    expect(removePoint([[0, 0], [1, 1]], 0)).toBeNull();
    expect(removePoint([[0, 0]], 0)).toBeNull();
  });

  it('does not mutate the input', () => {
    removePoint(line, 1);
    expect(line).toHaveLength(3);
  });
});

describe('nearestPoint', () => {
  it('returns the closest point within range', () => {
    expect(nearestPoint(line, 9, 1, 2)).toBe(1);
  });

  it('returns -1 when every point is out of range', () => {
    expect(nearestPoint(line, 5, 5, 2)).toBe(-1);
  });

  it('accepts a point exactly at maxDist', () => {
    expect(nearestPoint(line, 3, 4, 5)).toBe(0);
  });

  it('returns -1 for an empty list', () => {
    expect(nearestPoint([], 0, 0, 10)).toBe(-1);
  });
});

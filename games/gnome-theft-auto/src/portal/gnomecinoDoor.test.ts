import { describe, expect, it } from 'vitest';
import { GNOMECINO_DOOR, GNOMECINO_INSIDE, GNOMECINO_RETURN, insideFootprint } from './gnomecinoDoor';

describe('insideFootprint', () => {
  it('is true inside the building', () => {
    expect(insideFootprint(90, -30)).toBe(true);
    expect(insideFootprint(GNOMECINO_INSIDE.x, GNOMECINO_INSIDE.z)).toBe(true);
  });

  it('is false outside the building', () => {
    expect(insideFootprint(60, -30)).toBe(false);
    expect(insideFootprint(110, -30)).toBe(false);
    expect(insideFootprint(90, 0)).toBe(false);
    expect(insideFootprint(90, -50)).toBe(false);
  });

  it('includes the edges of the footprint', () => {
    expect(insideFootprint(77, -30)).toBe(true);
    expect(insideFootprint(103, -30)).toBe(true);
    expect(insideFootprint(90, -43)).toBe(true);
    expect(insideFootprint(90, -17)).toBe(true);
    expect(insideFootprint(76.99, -30)).toBe(false);
    expect(insideFootprint(103.01, -30)).toBe(false);
    expect(insideFootprint(90, -43.01)).toBe(false);
    expect(insideFootprint(90, -16.99)).toBe(false);
  });

  it('keeps the door and the return point outside the building, and the parked point inside', () => {
    expect(insideFootprint(GNOMECINO_DOOR.x, GNOMECINO_DOOR.z)).toBe(false);
    expect(insideFootprint(GNOMECINO_RETURN.x, GNOMECINO_RETURN.z)).toBe(false);
    expect(insideFootprint(GNOMECINO_INSIDE.x, GNOMECINO_INSIDE.z)).toBe(true);
  });
});

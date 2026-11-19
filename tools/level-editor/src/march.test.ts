import { describe, expect, it } from 'vitest';
import { marchToTerrain } from './march';

const flat = () => 0;

describe('marchToTerrain', () => {
  it('hits flat ground at the analytic point', () => {
    // From (0,10,0) along (1,-1,0): y = 10 - x reaches 0 at x = 10.
    const hit = marchToTerrain(0, 10, 0, 1, -1, 0, flat, 100, 1);
    expect(hit).not.toBeNull();
    expect(hit!.x).toBeCloseTo(10, 2);
    expect(hit!.z).toBeCloseTo(0, 6);
    expect(hit!.y).toBeCloseTo(0, 6);
  });

  it('hits a slope within 0.01 m of the analytic answer', () => {
    // ground y = 0.5x, ray y = 10 - x: they meet at x = 20/3.
    const slope = (x: number) => x * 0.5;
    const hit = marchToTerrain(0, 10, 0, 1, -1, 0, slope, 100, 1);
    expect(hit).not.toBeNull();
    expect(Math.abs(hit!.x - 20 / 3)).toBeLessThan(0.01);
    expect(Math.abs(hit!.y - 10 / 3)).toBeLessThan(0.01);
  });

  it('returns null for a ray pointing up', () => {
    expect(marchToTerrain(0, 10, 0, 0, 1, 0, flat, 500, 1)).toBeNull();
  });

  it('returns null when the origin is underground', () => {
    expect(marchToTerrain(0, -1, 0, 1, 0, 0, flat, 100, 1)).toBeNull();
  });

  it('returns null when the ray ends before reaching the ground', () => {
    // Ground is 10 m away; maxDist 5 stops the march first.
    expect(marchToTerrain(0, 10, 0, 1, -1, 0, flat, 5, 1)).toBeNull();
  });

  it('hits a hill between the origin and the far ground first', () => {
    // A ridge peaks at 8 m at x = 5 and falls to 0 at x = 1 and x = 9. The ray y = 10 - x meets the hill's
    // rising flank (height 2x - 2) at x = 4, well before the flat ground at x = 10.
    const hill = (x: number) => Math.max(0, 8 - 2 * Math.abs(x - 5));
    const hit = marchToTerrain(0, 10, 0, 1, -1, 0, hill, 100, 1);
    expect(hit).not.toBeNull();
    expect(hit!.x).toBeLessThan(5);
    expect(Math.abs(hit!.x - 4)).toBeLessThan(0.01);
    expect(Math.abs(hit!.y - 6)).toBeLessThan(0.01);
  });
});

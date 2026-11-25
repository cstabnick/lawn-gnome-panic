import { describe, expect, it } from 'vitest';
import { COURT } from './types';
import { ballAt, isThree, newShoot, nearestHoop, stepShoot } from './shootaround';

const G = 0.2; // court ground height in these tests
const east = COURT.hoops[1];
const west = COURT.hoops[0];

describe('shootaround', () => {
  it('a sweet-spot release next to a hoop goes in', () => {
    const s = newShoot();
    const px = east.x - 1, pz = east.z;
    // Charge to 0.8 (fillS 0.9 s, so 0.72 s of holding).
    for (let i = 0; i < 8; i++) stepShoot(s, 0.09, true, px, pz, G, 0.1);
    expect(s.charge).toBeCloseTo(0.8, 2);
    const rel = stepShoot(s, 0.016, false, px, pz, G, 0.1);
    expect(rel).toMatchObject({ kind: 'release', three: false });
    expect(s.phase).toBe('flight');
    expect(s.shots).toBe(1);
    // Run the flight to its end.
    let ev = null;
    for (let i = 0; i < 200 && ev === null; i++) ev = stepShoot(s, 0.05, false, px, pz, G, 0.1);
    expect(ev).toMatchObject({ kind: 'make', three: false });
    expect(s.makes).toBe(1);
    expect(s.phase).toBe('hold');
  });

  it('an early release next to a hoop misses', () => {
    const s = newShoot();
    const px = west.x + 1, pz = west.z;
    // Charge 0.2 (0.18 s of holding): far off the sweet spot.
    stepShoot(s, 0.09, true, px, pz, G, 0.5);
    stepShoot(s, 0.09, true, px, pz, G, 0.5);
    expect(s.charge).toBeCloseTo(0.2, 2);
    stepShoot(s, 0.016, false, px, pz, G, 0.5);
    let ev = null;
    for (let i = 0; i < 200 && ev === null; i++) ev = stepShoot(s, 0.05, false, px, pz, G, 0.5);
    expect(ev).toEqual({ kind: 'miss', clang: true });
    expect(s.makes).toBe(0);
    expect(s.shots).toBe(1);
  });

  it('a shot from beyond 9 m always misses', () => {
    const s = newShoot();
    // Mid-court, 12 m south of the centre: over 9 m from both rims.
    const px = COURT.x, pz = COURT.z + 12;
    stepShoot(s, 0.5, true, px, pz, G, 0);
    stepShoot(s, 0.5, false, px, pz, G, 0);
    let ev = null;
    for (let i = 0; i < 200 && ev === null; i++) ev = stepShoot(s, 0.05, false, px, pz, G, 0);
    expect(ev?.kind).toBe('miss');
  });

  it('isThree: centre line is a three, under the hoop is not', () => {
    expect(isThree(COURT.x, COURT.z)).toBe(true);
    expect(isThree(east.x, east.z)).toBe(false);
    expect(isThree(west.x, west.z)).toBe(false);
  });

  it('nearestHoop picks the closer rim', () => {
    expect(nearestHoop(east.x - 2, east.z).side).toBe('right');
    expect(nearestHoop(west.x + 2, west.z).side).toBe('left');
  });

  it('ballAt mid-flight is above both ends', () => {
    const s = newShoot();
    const px = east.x - 3, pz = east.z;
    stepShoot(s, 0.1, true, px, pz, G, 0);
    stepShoot(s, 0.5, false, px, pz, G, 0);
    stepShoot(s, 0.05, false, px, pz, G, 0);
    const f = s.flight!;
    f.t = f.dur / 2;
    const mid = ballAt(s, px, pz, G);
    const start = { y: G + 1.1 };
    const rimY = G + COURT.hoopY;
    expect(mid.y).toBeGreaterThan(start.y);
    expect(mid.y).toBeGreaterThan(rimY);
    // In hand when not flying.
    expect(ballAt(newShoot(), px, pz, G)).toEqual({ x: px, y: G + 0.7, z: pz });
  });
});

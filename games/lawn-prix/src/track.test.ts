import { describe, expect, it } from 'vitest';
import { TRACK } from './config';
import { TRACK_LENGTH, TRACK_POINTS, gridSlot, isOnTrack, pointAt, projectOnTrack } from './track';

describe('track', () => {
  it('is a lap of about 300 m', () => {
    expect(TRACK_LENGTH).toBeGreaterThan(250);
    expect(TRACK_LENGTH).toBeLessThan(360);
  });
  it('projects centreline points back onto themselves', () => {
    for (const s of [0, 37, 120, 250]) {
      const p = pointAt(s);
      const hit = projectOnTrack(p.x, p.z);
      expect(Math.abs(hit.s - s)).toBeLessThan(0.01);
      expect(Math.abs(hit.lateral)).toBeLessThan(0.01);
    }
  });
  it('lateral is + to the left of travel', () => {
    const p = pointAt(50);
    // left of (tx, tz) is (tz, -tx)
    const hit = projectOnTrack(p.x + p.tz * 2, p.z - p.tx * 2);
    expect(hit.lateral).toBeCloseTo(2, 3);
  });
  it('grid slots are on the track and behind the line', () => {
    for (let i = 0; i < 4; i++) {
      const g = gridSlot(i);
      expect(isOnTrack(projectOnTrack(g.x, g.z))).toBe(true);
      expect(g.dist).toBeLessThan(0);
    }
  });
  it('stays inside the hedge bounds', () => {
    for (const p of TRACK_POINTS) {
      expect(p.x).toBeGreaterThan(TRACK.bounds.minX + TRACK.width);
      expect(p.x).toBeLessThan(TRACK.bounds.maxX - TRACK.width);
      expect(p.z).toBeGreaterThan(TRACK.bounds.minZ + TRACK.width);
      expect(p.z).toBeLessThan(TRACK.bounds.maxZ - TRACK.width);
    }
  });
});

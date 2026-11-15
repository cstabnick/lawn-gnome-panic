import { describe, expect, it } from 'vitest';
import { TRACK } from './config';
import { COURSE_ORDER, COURSES } from './courses';
import { boxSpots } from './items';
import { getTrack, gridSlot, isOnTrack, pointAt, projectOnTrack } from './track';

for (const id of COURSE_ORDER) {
  describe(`track ${id}`, () => {
    const T = getTrack(id);
    it('is a lap of 250-360 m', () => {
      expect(T.length).toBeGreaterThan(250);
      expect(T.length).toBeLessThan(360);
    });
    it('projects centreline points back onto themselves', () => {
      for (const s of [0, 37, 120, 240]) {
        const p = pointAt(T, s);
        const hit = projectOnTrack(T, p.x, p.z);
        expect(Math.abs(hit.s - s)).toBeLessThan(0.01);
        expect(Math.abs(hit.lateral)).toBeLessThan(0.01);
      }
    });
    it('lateral is + to the left of travel', () => {
      const p = pointAt(T, 50);
      const hit = projectOnTrack(T, p.x + p.tz * 2, p.z - p.tx * 2);
      expect(hit.lateral).toBeCloseTo(2, 3);
    });
    it('grid slots and item boxes are on the track', () => {
      for (let i = 0; i < 4; i++) {
        const g = gridSlot(T, i);
        expect(isOnTrack(T, projectOnTrack(T, g.x, g.z))).toBe(true);
        expect(g.dist).toBeLessThan(0);
      }
      for (const b of boxSpots(T)) expect(isOnTrack(T, projectOnTrack(T, b.x, b.z))).toBe(true);
    });
    it('stays inside the hedge bounds', () => {
      const b = COURSES[id].bounds;
      for (const p of T.points) {
        expect(p.x).toBeGreaterThan(b.minX + TRACK.width);
        expect(p.x).toBeLessThan(b.maxX - TRACK.width);
        expect(p.z).toBeGreaterThan(b.minZ + TRACK.width);
        expect(p.z).toBeLessThan(b.maxZ - TRACK.width);
      }
    });
    it('never runs within 11 m of another part of itself (no shortcuts through the grass)', () => {
      let min = Infinity;
      for (const a of T.points) for (const b of T.points) {
        let ds = Math.abs(a.s - b.s);
        ds = Math.min(ds, T.length - ds);
        if (ds < 25) continue;
        min = Math.min(min, Math.hypot(a.x - b.x, a.z - b.z));
      }
      expect(min).toBeGreaterThan(11);
    });
  });
}

import { describe, expect, it } from 'vitest';
import { layoutFor } from './layout';
import type { CourseId } from './types';

const COURSES: CourseId[] = ['lawn', 'desert', 'depths', 'kiln', 'ocean', 'night', 'frost', 'city'];

const inCircle = (p: { x: number; z: number }, c: { x: number; z: number; radius: number }): boolean =>
  Math.hypot(p.x - c.x, p.z - c.z) <= c.radius + 1e-9;

describe('layoutFor', () => {
  for (const id of COURSES) {
    describe(id, () => {
      const layout = layoutFor(id);

      it('gives every spawn a valid zone index', () => {
        for (const s of layout.spawns) {
          expect(Number.isInteger(s.zone)).toBe(true);
          expect(s.zone).toBeGreaterThanOrEqual(0);
          expect(s.zone).toBeLessThan(layout.zones.length);
        }
      });

      it('keeps every spawn inside its zone circle', () => {
        for (const s of layout.spawns) {
          const zone = layout.zones[s.zone];
          expect(inCircle({ x: s.pos[0], z: s.pos[2] }, zone)).toBe(true);
        }
      });

      it('has at least one zone and at least one cover spot', () => {
        expect(layout.zones.length).toBeGreaterThanOrEqual(1);
        expect(layout.cover.length).toBeGreaterThanOrEqual(1);
      });

      it('keeps every cover spot inside some zone', () => {
        for (const c of layout.cover) {
          expect(layout.zones.some((z) => inCircle(c, z))).toBe(true);
        }
      });

      it('keeps every zone inside the play area', () => {
        for (const z of layout.zones) {
          expect(z.x - z.radius).toBeGreaterThanOrEqual(-12);
          expect(z.x + z.radius).toBeLessThanOrEqual(12);
          expect(z.z - z.radius).toBeGreaterThanOrEqual(-34);
          expect(z.z + z.radius).toBeLessThanOrEqual(20);
        }
      });
    });
  }
});

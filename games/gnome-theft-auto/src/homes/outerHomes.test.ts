import { describe, expect, it } from 'vitest';
import { siteRect } from '../sites';
import { planPieces } from './pieces';
import { outerHomePieces } from './outerHomes';
import { HOME_DOORS } from './types';

const SLACK = 2.5;
const homes = [
  { site: 'home-05', door: HOME_DOORS.sorrel },
  { site: 'home-06', door: HOME_DOORS.diggs },
  { site: 'home-07', door: HOME_DOORS.frank },
] as const;

describe('outer homes', () => {
  const plan = planPieces(outerHomePieces());

  it('uses only prefabs that exist', () => {
    expect(plan.missing).toEqual([]);
  });

  it('keeps every collider in its site rect and off the door spots', () => {
    const rects = homes.map((h) => siteRect(h.site));
    for (const b of plan.boxes) {
      const home = rects.some((r) => b.minX >= r.minX - SLACK && b.maxX <= r.maxX + SLACK
        && b.minZ >= r.minZ - SLACK && b.maxZ <= r.maxZ + SLACK);
      expect(home, `box ${JSON.stringify(b)} outside every home site`).toBe(true);
      for (const h of homes) {
        const [dx, dz] = h.door;
        const inside = dx >= b.minX - 1 && dx <= b.maxX + 1 && dz >= b.minZ - 1 && dz <= b.maxZ + 1;
        expect(inside, `box ${JSON.stringify(b)} within 1 m of ${h.site} door`).toBe(false);
      }
    }
  });
});

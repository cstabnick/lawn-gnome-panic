import { describe, expect, it } from 'vitest';
import { siteRect } from '../sites';
import { HOME_DOORS } from './types';
import { planPieces } from './pieces';
import { townHomePieces } from './townHomes';

const SITES = [
  ['home-01', HOME_DOORS.juniper],
  ['home-02', HOME_DOORS['mayor-mulch']],
  ['home-03', HOME_DOORS.reginald],
  ['home-04', HOME_DOORS.mabel],
] as const;
const SLACK = 2.5;

describe('town homes', () => {
  const plan = planPieces(townHomePieces());

  it('uses only prefabs that exist', () => {
    expect(plan.missing).toEqual([]);
  });

  it('keeps every collider on its site', () => {
    const rects = SITES.map(([id]) => siteRect(id));
    for (const b of plan.boxes) {
      const inside = rects.some((r) => b.minX >= r.minX - SLACK && b.maxX <= r.maxX + SLACK && b.minZ >= r.minZ - SLACK && b.maxZ <= r.maxZ + SLACK);
      expect(inside, `box ${JSON.stringify(b)} is off every site`).toBe(true);
    }
  });

  it('leaves every door spot free by 1 m', () => {
    for (const [id, door] of SITES) {
      for (const b of plan.boxes) {
        const dx = Math.max(b.minX - door[0], 0, door[0] - b.maxX);
        const dz = Math.max(b.minZ - door[1], 0, door[1] - b.maxZ);
        expect(Math.hypot(dx, dz), `${id} door spot vs ${JSON.stringify(b)}`).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

import { describe, expect, it } from 'vitest';
import { PICKUPS } from './config';
import { MAPS } from './maps';
import { isBlocked } from './walk';
import { pickupSpots } from './pickups';

describe('pickupSpots', () => {
  for (const id of ['town', 'park', 'row'] as const) {
    const map = MAPS[id];

    it(`${id}: places perMap unblocked spots (or every candidate)`, () => {
      const spots = pickupSpots(map, 5);
      expect(spots.length).toBeGreaterThan(0);
      expect(spots.length).toBeLessThanOrEqual(PICKUPS.perMap);
      expect(spots.length).toBe(PICKUPS.perMap);
      for (const s of spots) {
        expect(isBlocked(map, s.x, s.z)).toBe(false);
      }
    });

    it(`${id}: is deterministic for one slot and changes with the slot`, () => {
      const a = pickupSpots(map, 5);
      const b = pickupSpots(map, 5);
      expect(b).toEqual(a);
      const c = pickupSpots(map, 6);
      expect(c.map((s) => s.id)).not.toEqual(a.map((s) => s.id));
    });
  }

  it('gives no spots indoors', () => {
    expect(pickupSpots(MAPS.gnomecino, 5)).toEqual([]);
  });
});

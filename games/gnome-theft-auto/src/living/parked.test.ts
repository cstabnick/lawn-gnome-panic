import { describe, expect, it } from 'vitest';
import { PARKED_CANDIDATES, livingParked } from './parked';

describe('E31 parked spots', () => {
  it('keeps every candidate on an empty map, with each new ride at least once', () => {
    const spots = livingParked([]);
    const dropped = PARKED_CANDIDATES.filter((c) => !spots.some((s) => s.x === c.x && s.z === c.z));
    expect(dropped).toEqual([]);
    for (const k of ['ranger-buggy', 'shell-camper', 'cone-van']) expect(spots.some((s) => s.kind === k), k).toBe(true);
  });

  it('keeps spots at least 6 m apart', () => {
    const s = livingParked([]);
    for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
      expect(Math.hypot(s[i].x - s[j].x, s[i].z - s[j].z)).toBeGreaterThanOrEqual(6);
    }
  });

  it('drops a spot inside a collider', () => {
    const s = livingParked([{ minX: -1580, maxX: -1570, minZ: -1140, maxZ: -1130, h: 3 }]);
    expect(s.some((p) => p.x === -1575 && p.z === -1135)).toBe(false);
  });
});

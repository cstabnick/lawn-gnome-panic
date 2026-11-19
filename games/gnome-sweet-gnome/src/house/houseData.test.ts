import { describe, expect, it, vi } from 'vitest';

// The art modules import Phaser, which needs a window; the test only checks that the keys exist.
vi.mock('phaser', () => ({ default: {} }));
import { AREA_H, AREA_W, AREAS, HOMES, homeOf, homeOpen } from './houseData';
import { BACKDROP, DRAW } from './houseArt';

describe('house data', () => {
  it('has three homes, unique ids and art for every slot and backdrop', () => {
    expect(HOMES.length).toBe(3);
    const ids = AREAS.flatMap((a) => a.slots.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(AREAS.map((a) => a.id)).size).toBe(AREAS.length);
    for (const a of AREAS) {
      expect(BACKDROP[a.backdrop], `backdrop ${a.backdrop}`).toBeTypeOf('function');
      for (const s of a.slots) {
        expect(DRAW[s.art], `art ${s.art}`).toBeTypeOf('function');
        expect(s.x - s.w / 2).toBeGreaterThanOrEqual(-1);
        expect(s.x + s.w / 2).toBeLessThanOrEqual(AREA_W + 1);
        expect(s.y + s.h / 2).toBeLessThanOrEqual(AREA_H + 1);
      }
    }
  });

  it('opens a home once the one before it is built', () => {
    expect(homeOpen(0, {})).toBe(true);
    expect(homeOpen(1, {})).toBe(false);
    const built = Object.fromEntries(HOMES[0].areas.flatMap((a) => a.slots.map((s) => [s.id, 0])));
    expect(homeOpen(1, built)).toBe(true);
    expect(homeOpen(2, built)).toBe(false);
    expect(homeOf(AREAS[AREAS.length - 1]).id).toBe('cove');
  });
});

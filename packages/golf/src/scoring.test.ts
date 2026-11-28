import { describe, expect, it } from 'vitest';
import { playableLie, restingSpot, scoreName, seaMowerCatch, seededWindFrom } from './index';

describe('scoring', () => {
  it('names scores relative to par', () => {
    const names = [-3, -2, -1, 0, 1, 2, 3, 4].map((d) => scoreName(5 + d, 5));
    expect(names).toEqual(['Albatross!', 'Eagle!', 'Birdie!', 'Par', 'Bogey', 'Double bogey', 'Triple bogey', '+4']);
    expect(scoreName(1, 3)).toBe('Hole in one!');
    expect(scoreName(1, 3, 'disc')).toBe('ACE! Gnome in the chains!');
  });

  it('seeded wind is deterministic and within the maximum', () => {
    for (let hole = 0; hole < 9; hole++) {
      const a = seededWindFrom(12345, hole, 12);
      expect(seededWindFrom(12345, hole, 12)).toEqual(a);
      expect(a.mph).toBeGreaterThanOrEqual(0);
      expect(a.mph).toBeLessThanOrEqual(12);
      expect(a.yaw).toBeGreaterThanOrEqual(0);
      expect(a.yaw).toBeLessThan(Math.PI * 2);
    }
    expect(seededWindFrom(1, 0, 12)).not.toEqual(seededWindFrom(2, 0, 12));
  });

  it('water drops go back to where the ball was struck, for one stroke', () => {
    expect(restingSpot({ x: 1, z: 2 }, { end: { x: 5, z: 6 }, endLie: 'water' })).toEqual({ x: 1, z: 2, penalty: 1 });
    expect(restingSpot({ x: 1, z: 2 }, { end: { x: 5, z: 6 }, endLie: 'rough' })).toEqual({ x: 5, z: 6, penalty: 0 });
    expect(seaMowerCatch({ end: { x: 5, z: 6 }, endLie: 'fairway' })).toBe(false);
    expect(playableLie(() => 'water', 0, 0)).toBe('rough');
    expect(playableLie(() => 'sand', 0, 0)).toBe('sand');
  });
});

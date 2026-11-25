// Life in the Underspan (E17 B3): the Roost test is pure (no scene, no DOM).
import { describe, expect, it } from 'vitest';
import { UNDERSPAN } from '../config';
import { onRoost } from './life';

describe('onRoost', () => {
  const r = UNDERSPAN.roost;
  const cx = (r.minX + r.maxX) / 2;
  const cz = (r.minZ + r.maxZ) / 2;

  it('is true on the deck at roost height', () => {
    expect(onRoost(cx, UNDERSPAN.roostY, cz)).toBe(true);
    expect(onRoost(cx, UNDERSPAN.roostY + 1, cz)).toBe(true);
  });

  it('is false on the ground under the deck', () => {
    expect(onRoost(cx, 0, cz)).toBe(false);
  });

  it('is false when too low (more than 0.6 m under deck height)', () => {
    expect(onRoost(cx, UNDERSPAN.roostY - 0.7, cz)).toBe(false);
    expect(onRoost(cx, UNDERSPAN.roostY - 0.5, cz)).toBe(true);
  });

  it('is false outside the rectangle', () => {
    expect(onRoost(r.minX - 1, UNDERSPAN.roostY, cz)).toBe(false);
    expect(onRoost(r.maxX + 1, UNDERSPAN.roostY, cz)).toBe(false);
    expect(onRoost(cx, UNDERSPAN.roostY, r.minZ - 1)).toBe(false);
    expect(onRoost(cx, UNDERSPAN.roostY, r.maxZ + 1)).toBe(false);
  });
});

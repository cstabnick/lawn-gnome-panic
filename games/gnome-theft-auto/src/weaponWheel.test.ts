import { describe, expect, it } from 'vitest';
import { sectorAt } from './weaponWheel';

describe('sectorAt', () => {
  it('numbers nine sectors clockwise from straight up, with a 30 px deadzone', () => {
    expect(sectorAt(0, -50, 9, 30)).toBe(0);
    expect(sectorAt(50, 0, 9, 30)).toBe(2);
    expect(sectorAt(0, 50, 9, 30)).toBe(5);
    expect(sectorAt(5, 5, 9, 30)).toBe(-1);
  });

  it('wraps the left side into the last sector of four', () => {
    expect(sectorAt(-50, 0, 4, 30)).toBe(3);
  });
});

import { describe, expect, it } from 'vitest';
import { moteCell } from './atmosphere';

describe('moteCell', () => {
  it('maps seed quarters to the four atlas cells by day', () => {
    expect(moteCell(0, 0)).toBe(0);
    expect(moteCell(0.3, 0)).toBe(1);
    expect(moteCell(0.6, 0)).toBe(2);
    expect(moteCell(0.99, 0)).toBe(3);
    expect(moteCell(1, 0)).toBe(3);
  });
  it('is always the round glow at night', () => {
    for (const s of [0, 0.3, 0.6, 0.99]) expect(moteCell(s, 0.8)).toBe(0);
    expect(moteCell(0.6, 0.5)).toBe(2);
  });
});

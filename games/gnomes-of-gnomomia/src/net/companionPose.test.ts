import { describe, expect, it } from 'vitest';
import { readCompanionList } from './protocol';

const TEN = [3, 'Wobbles', 1, 2, 0.5, 0, 7, 0.1, 0x3b8a57, 0x4b6344];
const FOURTEEN = [3, 'Wobbles', 1, 2, 0.5, 0, 7, 0.1, 0x3b8a57, 0x4b6344, 12.9, 1, 3, 1];

describe('companion pose wire reader', () => {
  it('reads an old 10-field pose with unknown level, class, personality and not sitting', () => {
    const out = readCompanionList([TEN]);
    expect(out).not.toBeNull();
    expect(out![0].length).toBe(14);
    expect(out![0].slice(10)).toEqual([0, -1, -1, 0]);
  });

  it('reads a 14-field pose with level, class, personality and sit', () => {
    const out = readCompanionList([FOURTEEN]);
    expect(out).not.toBeNull();
    expect(out![0].length).toBe(14);
    expect(out![0][10]).toBe(12);
    expect(out![0][11]).toBe(1);
    expect(out![0][12]).toBe(3);
    expect(out![0][13]).toBe(1);
  });

  it('rejects poses with 11 or 13 fields', () => {
    expect(readCompanionList([[...TEN, 5]])).toBeNull();
    expect(readCompanionList([[...FOURTEEN.slice(0, 13)]])).toBeNull();
  });

  it('rejects out-of-range level, class or sit', () => {
    expect(readCompanionList([[...TEN, 150, 1, 3, 1]])).toBeNull();
    expect(readCompanionList([[...TEN, 12, -2, 3, 1]])).toBeNull();
    expect(readCompanionList([[...TEN, 12, 1, 3, 2]])).toBeNull();
  });

  it('rejects more than 8 poses', () => {
    expect(readCompanionList(Array.from({ length: 9 }, () => TEN))).toBeNull();
    expect(readCompanionList(Array.from({ length: 8 }, () => TEN))).not.toBeNull();
  });
});

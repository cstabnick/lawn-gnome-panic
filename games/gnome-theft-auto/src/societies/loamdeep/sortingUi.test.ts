import { describe, expect, it } from 'vitest';
import { HALL_IDS } from '../../societies/config';
import { checkSort, makeLetters, sortingOpen } from './sortingUi';

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('makeLetters', () => {
  it('returns the requested length with only known hall ids', () => {
    const letters = makeLetters(10, seeded(1));
    expect(letters).toHaveLength(10);
    for (const l of letters) expect(HALL_IDS).toContain(l);
  });

  it('never has three of the same hall in a row over 200 letters', () => {
    const letters = makeLetters(200, seeded(42));
    expect(letters).toHaveLength(200);
    for (let i = 2; i < letters.length; i++) {
      expect(letters[i] === letters[i - 1] && letters[i] === letters[i - 2]).toBe(false);
    }
  });

  it('handles zero and a rand that returns the extremes', () => {
    expect(makeLetters(0, seeded(3))).toEqual([]);
    const hi = makeLetters(30, () => 1);
    const lo = makeLetters(30, () => 0);
    for (const l of [...hi, ...lo]) expect(HALL_IDS).toContain(l);
  });
});

describe('checkSort', () => {
  it('is true only for the matching hole', () => {
    expect(checkSort('postern', 'postern')).toBe(true);
    expect(checkSort('postern', 'hearth')).toBe(false);
  });
});

describe('sortingOpen', () => {
  it('is false before any game is opened', () => {
    expect(sortingOpen()).toBe(false);
  });
});

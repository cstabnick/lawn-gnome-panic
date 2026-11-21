import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEMPERAMENT,
  TEMPERAMENT_LABEL,
  TEMPERAMENTS,
  type Temperament,
  baitResult,
  fluteResult,
  pesterResult,
  tagResult,
  temperamentOf,
} from './temperament';

const ALL: Temperament[] = ['docile', 'curious', 'skittish', 'shy', 'territorial', 'thief', 'sentinel', 'aloof'];

describe('TEMPERAMENTS table', () => {
  it('has exactly 42 species, each with a known temperament label', () => {
    const keys = Object.keys(TEMPERAMENTS);
    expect(keys).toHaveLength(42);
    for (const key of keys) {
      expect(Object.keys(TEMPERAMENT_LABEL)).toContain(TEMPERAMENTS[key]);
    }
  });

  it('has the expected count per temperament', () => {
    const counts: Record<Temperament, number> = {
      docile: 0,
      curious: 0,
      skittish: 0,
      shy: 0,
      territorial: 0,
      thief: 0,
      sentinel: 0,
      aloof: 0,
    };
    for (const t of Object.values(TEMPERAMENTS)) counts[t] += 1;
    expect(counts).toEqual({
      docile: 5,
      curious: 8,
      skittish: 3,
      shy: 6,
      territorial: 5,
      thief: 3,
      sentinel: 5,
      aloof: 7,
    });
  });
});

describe('temperamentOf', () => {
  it('looks up a known species', () => {
    expect(temperamentOf('mossback')).toBe('docile');
  });

  it('falls back to the default for an unknown species', () => {
    expect(temperamentOf('no-such-species')).toBe(DEFAULT_TEMPERAMENT);
  });
});

describe('rule functions', () => {
  it('baitResult matches the table', () => {
    const expected: Record<Temperament, string> = {
      docile: 'eat',
      curious: 'eat',
      skittish: 'eatWhenDogStill',
      shy: 'eatAfterStill',
      territorial: 'ignore',
      thief: 'steal',
      sentinel: 'ignore',
      aloof: 'ignore',
    };
    for (const t of ALL) expect(baitResult(t)).toBe(expected[t]);
  });

  it('pesterResult matches the table', () => {
    const expected: Record<Temperament, string> = {
      docile: 'startle',
      curious: 'backOff',
      skittish: 'bolt',
      shy: 'hide',
      territorial: 'display',
      thief: 'drop',
      sentinel: 'stiff',
      aloof: 'spin',
    };
    for (const t of ALL) expect(pesterResult(t)).toBe(expected[t]);
  });

  it('fluteResult matches the table', () => {
    const expected: Record<Temperament, string> = {
      docile: 'dance',
      curious: 'dance',
      skittish: 'freeze',
      shy: 'dance',
      territorial: 'dance',
      thief: 'dance',
      sentinel: 'sway',
      aloof: 'nod',
    };
    for (const t of ALL) expect(fluteResult(t)).toBe(expected[t]);
  });

  it('tagResult matches the table', () => {
    const expected: Record<Temperament, string> = {
      docile: 'ignore',
      curious: 'approach',
      skittish: 'flee',
      shy: 'retreat',
      territorial: 'warn',
      thief: 'hover',
      sentinel: 'ignore',
      aloof: 'ignore',
    };
    for (const t of ALL) expect(tagResult(t)).toBe(expected[t]);
  });
});

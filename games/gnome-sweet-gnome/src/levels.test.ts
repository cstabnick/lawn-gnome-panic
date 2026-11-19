import { describe, expect, it } from 'vitest';
import { LEVELS, targetFor, validateLevels } from './levels';

describe('levels', () => {
  it('has 60 levels and no validation problems', () => {
    expect(LEVELS.length).toBe(60);
    expect(validateLevels()).toEqual([]);
  });

  it('targetFor follows the sawtooth', () => {
    expect(targetFor(1)).toBeCloseTo(0.97);
    expect(targetFor(5)).toBeCloseTo(0.5);
    expect(targetFor(6)).toBeCloseTo(0.95);
    expect(targetFor(10)).toBeCloseTo(0.4);
    expect(targetFor(11)).toBeCloseTo(0.922);
    expect(targetFor(31)).toBeCloseTo(0.88);
    expect(targetFor(59)).toBeCloseTo(0.63);
    expect(targetFor(60)).toBeCloseTo(0.4);
  });
});

import { describe, expect, it } from 'vitest';
import { summarize } from './cloud';

describe('summarize', () => {
  it('describes level, stars and built house items', () => {
    const text = JSON.stringify({ level: 7, stars: 12, coins: 3, house: { porch: 0, shed: 2 }, boosters: {}, best: {} });
    expect(summarize(text)).toBe('Level 7 · 12 ★ · 2 house items');
  });

  it('counts zero house items when the house is empty or missing', () => {
    expect(summarize(JSON.stringify({ level: 1, stars: 0, house: {} }))).toBe('Level 1 · 0 ★ · 0 house items');
    expect(summarize(JSON.stringify({ level: 2, stars: 5 }))).toBe('Level 2 · 5 ★ · 0 house items');
  });

  it('falls back to a generic line when the text is unreadable', () => {
    expect(summarize('not json')).toBe('A saved game');
    expect(summarize('null')).toBe('A saved game');
    expect(summarize('42')).toBe('A saved game');
  });
});

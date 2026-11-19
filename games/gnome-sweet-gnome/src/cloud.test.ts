import { describe, expect, it } from 'vitest';
import { summarize } from './cloud';
import { normalizeSave } from './save';
import { HOMES } from './house/houseData';
import { cloudNoteText } from './ui/cloudNote';

describe('summarize', () => {
  it('describes level, home, stars and built house items', () => {
    const text = JSON.stringify({ level: 7, stars: 12, coins: 3, house: { 'yard-path': 0, 'yard-fence': 2 }, boosters: {}, best: {} });
    expect(summarize(text)).toBe('Level 7 · Mossy Lane · 12 ★ · 2 house items');
  });

  it('names the treehouse once Mossy Lane is finished', () => {
    const house = Object.fromEntries(HOMES[0].areas.flatMap((a) => a.slots.map((s) => [s.id, 1])));
    expect(summarize(JSON.stringify({ level: 31, stars: 4, house }))).toBe('Level 31 · Oakwood Treehouse · 4 ★ · 20 house items');
  });

  it('counts zero house items when the house is empty or missing', () => {
    expect(summarize(JSON.stringify({ level: 1, stars: 0, house: {} }))).toBe('Level 1 · Mossy Lane · 0 ★ · 0 house items');
    expect(summarize(JSON.stringify({ level: 2, stars: 5 }))).toBe('Level 2 · Mossy Lane · 5 ★ · 0 house items');
  });

  it('falls back to a generic line when the text is unreadable', () => {
    expect(summarize('not json')).toBe('A saved game');
    expect(summarize('null')).toBe('A saved game');
    expect(summarize('42')).toBe('A saved game');
  });
});

describe('normalizeSave', () => {
  it('keeps a save from before the new homes as it is', () => {
    const old = { level: 31, stars: 9, coins: 250, house: { 'yard-path': 1, 'kit-stew': 2 }, boosters: { mower: 2, bomb: 0, prism: 1 }, best: { 1: 3, 30: 2 } };
    expect(normalizeSave(old)).toEqual(old);
  });

  it('repairs broken fields instead of crashing', () => {
    const s = normalizeSave({ level: 'x', stars: -4, coins: null, house: { a: 7, b: 1, c: 'red' }, boosters: [], best: { 2: 9, 3: 1 } });
    expect(s.level).toBe(1);
    expect(s.stars).toBe(0);
    expect(s.house).toEqual({ b: 1 });
    expect(s.best).toEqual({ 3: 1 });
    expect(s.boosters.mower).toBe(1);
  });
});

describe('cloudNoteText', () => {
  it('matches the Gnomomia notes', () => {
    expect(cloudNoteText('synced', true)?.link).toBe(false);
    expect(cloudNoteText('off', true)?.link).toBe(true);
    expect(cloudNoteText('off', false)).toBeNull();
    expect(cloudNoteText('syncing', true)).toBeNull();
  });
});

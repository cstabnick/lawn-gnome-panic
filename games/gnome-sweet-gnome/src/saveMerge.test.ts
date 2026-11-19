import { describe, expect, it } from 'vitest';
import { mergeSaves, mergeSaveTexts } from './saveMerge';
import { defaultSave, normalizeSave, type SaveData } from './save';

const save = (p: Partial<SaveData>): SaveData => ({ ...defaultSave(), ...p });

describe('mergeSaves', () => {
  it('keeps the save that is ahead, whole, over a fresh one (the lost-save case)', () => {
    const old = save({ level: 31, stars: 9, coins: 250, house: { 'yard-path': 1, 'kit-stew': 2 }, best: { 1: 3, 30: 2 }, t: 100 });
    const fresh = save({ level: 2, stars: 1, best: { 1: 1 }, t: 500 });
    expect(mergeSaves(old, fresh)).toEqual(mergeSaves(fresh, old));
    const m = mergeSaves(fresh, old);
    expect(m.level).toBe(31);
    expect(m.stars).toBe(9);
    expect(m.coins).toBe(250);
    expect(m.house).toEqual({ 'kit-stew': 2, 'yard-path': 1 });
  });

  it('unions progress made on two devices and recomputes stars from best and built items', () => {
    const a = save({ level: 5, best: { 1: 3, 2: 3, 3: 2, 4: 1 }, house: { 'yard-path': 0 }, t: 10 });
    const b = save({ level: 4, best: { 1: 2, 2: 3, 3: 3 }, house: { 'yard-fence': 1 }, t: 20 });
    const m = mergeSaves(a, b);
    expect(m.level).toBe(5);
    expect(m.best).toEqual({ 1: 3, 2: 3, 3: 3, 4: 1 });
    expect(m.house).toEqual({ 'yard-fence': 1, 'yard-path': 0 });
    expect(m.stars).toBe(10 - 1 - 2); // earned 10, path costs 1, fence 2
  });

  it('takes the newer style when the same item was restyled on both sides', () => {
    const a = save({ level: 3, best: { 1: 3 }, house: { 'yard-path': 0 }, t: 10 });
    const b = save({ level: 3, best: { 2: 3 }, house: { 'yard-path': 2 }, t: 20 });
    expect(mergeSaves(a, b).house['yard-path']).toBe(2);
  });

  it('is idempotent and commutative', () => {
    const a = save({ level: 5, best: { 1: 3, 4: 1 }, house: { 'yard-path': 0 }, coins: 80, t: 10 });
    const b = save({ level: 4, best: { 2: 3 }, house: { 'yard-fence': 1 }, coins: 120, t: 20 });
    const m = mergeSaves(a, b);
    expect(mergeSaves(m, b)).toEqual(m);
    expect(mergeSaves(m, a)).toEqual(m);
    expect(mergeSaves(b, a)).toEqual(m);
  });
});

describe('mergeSaveTexts', () => {
  it('takes the account save when this browser has none, and survives unreadable text', () => {
    const remote = JSON.stringify(save({ level: 12, best: { 1: 3 } }));
    expect(normalizeSave(JSON.parse(mergeSaveTexts(null, remote))).level).toBe(12);
    expect(normalizeSave(JSON.parse(mergeSaveTexts('not json', remote))).level).toBe(12);
  });

  it('gives the same text when merged again', () => {
    const local = JSON.stringify(save({ level: 5, best: { 1: 3 }, house: { 'yard-path': 0 }, t: 1 }));
    const remote = JSON.stringify(save({ level: 3, best: { 2: 2 }, house: { 'yard-fence': 1 }, t: 2 }));
    const once = mergeSaveTexts(local, remote);
    expect(mergeSaveTexts(once, remote)).toBe(once);
  });
});

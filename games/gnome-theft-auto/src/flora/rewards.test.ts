import { describe, expect, it, vi } from 'vitest';
import type { StorageLike } from '../saveIO';
import { FLORA } from './kinds';
import { MOW_SAVE_KEY, createMowRewards, emptyMowSave, mergeMowSave, parseMowSave } from './rewards';

function memoryStorage(): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

function deps(storage: StorageLike | null = memoryStorage()) {
  return {
    increment: vi.fn(),
    earn: vi.fn(),
    toast: vi.fn(),
    storage,
  };
}

describe('Lawn Service', () => {
  it('pays once per 10 long-grass cuts on a mower', () => {
    const d = deps();
    const r = createMowRewards(d);
    for (let i = 0; i < 10; i++) r.record('wheat-patch', true, true);
    expect(d.earn).toHaveBeenCalledTimes(1);
    expect(d.earn).toHaveBeenCalledWith(3, 'Lawn Service');
    expect(r.save().lawn).toBe(10);
  });

  it('never pays for cuts on foot or on short grass', () => {
    const d = deps();
    const r = createMowRewards(d);
    for (let i = 0; i < 25; i++) r.record('wheat-patch', true, false);
    for (let i = 0; i < 25; i++) r.record('fern-clump', false, true);
    expect(d.earn).not.toHaveBeenCalled();
    expect(r.save().lawn).toBe(0);
    expect(r.save().total).toBe(50);
  });
});

describe('first-mow toast', () => {
  it('toasts once, on the first mow ever', () => {
    const d = deps();
    const r = createMowRewards(d);
    r.record('fern-clump', false, false);
    r.record('fern-clump', false, false);
    r.record('fern-clump', false, false);
    expect(d.toast).toHaveBeenCalledTimes(1);
    expect(d.toast).toHaveBeenCalledWith('Mowed! Plants grow back in a minute or two.', 3500);
  });
});

describe('achievements', () => {
  it('feeds both mowing achievements in one batch every 2 s', () => {
    const d = deps();
    const r = createMowRewards(d);
    for (let i = 0; i < 7; i++) r.record('fern-clump', false, false);
    r.update(2.1);
    expect(d.increment).toHaveBeenCalledTimes(2);
    expect(d.increment).toHaveBeenCalledWith('gta-short-back-and-sides', 7);
    expect(d.increment).toHaveBeenCalledWith('gta-head-groundskeeper', 7);
    r.update(2.1);
    expect(d.increment).toHaveBeenCalledTimes(2);
  });
});

describe('save', () => {
  it('writes only after 5 s of updates, then the save has the totals', () => {
    const storage = memoryStorage();
    const d = deps(storage);
    const r = createMowRewards(d);
    for (let i = 0; i < 7; i++) r.record('wheat-patch', true, true);
    r.update(4.9);
    expect(storage.map.has(MOW_SAVE_KEY)).toBe(false);
    r.update(0.2);
    const saved = parseMowSave(storage.map.get(MOW_SAVE_KEY) ?? null);
    expect(saved.total).toBe(7);
    expect(saved.byKind).toEqual({ 'wheat-patch': 7 });
    expect(saved.lawn).toBe(7);
  });

  it('a new rewards object on the same storage loads the total', () => {
    const storage = memoryStorage();
    const r = createMowRewards(deps(storage));
    for (let i = 0; i < 7; i++) r.record('fern-clump', false, false);
    r.update(5.1);
    const again = createMowRewards(deps(storage));
    expect(again.save().total).toBe(7);
    expect(again.save().byKind).toEqual({ 'fern-clump': 7 });
  });

  it('reset zeroes the save and writes it at once', () => {
    const storage = memoryStorage();
    const r = createMowRewards(deps(storage));
    for (let i = 0; i < 3; i++) r.record('fern-clump', false, false);
    r.reset();
    expect(r.save()).toEqual(emptyMowSave());
    expect(parseMowSave(storage.map.get(MOW_SAVE_KEY) ?? null)).toEqual(emptyMowSave());
  });

  it('works with no storage at all', () => {
    const d = deps(null);
    const r = createMowRewards(d);
    r.record('fern-clump', false, false);
    r.update(10);
    r.reset();
    expect(r.save().total).toBe(0);
  });
});

describe('parseMowSave and mergeMowSave', () => {
  it('garbage and null give the empty save', () => {
    expect(parseMowSave('garbage')).toEqual(emptyMowSave());
    expect(parseMowSave(null)).toEqual(emptyMowSave());
  });

  it('drops bad fields and keeps good ones', () => {
    const s = parseMowSave(JSON.stringify({ total: -4, lawn: 2.7, byKind: { a: 3, b: 'x', c: -1 } }));
    expect(s.total).toBe(0);
    expect(s.lawn).toBe(2);
    expect(s.byKind).toEqual({ a: 3 });
  });

  it('merge takes per-field maxima', () => {
    const a = JSON.stringify({ v: 1, total: 10, lawn: 2, byKind: { wheat: 4, fern: 6 } });
    const b = JSON.stringify({ v: 1, total: 7, lawn: 5, byKind: { wheat: 9, boxwood: 1 } });
    expect(parseMowSave(mergeMowSave(a, b))).toEqual({
      v: 1,
      total: 10,
      lawn: 5,
      byKind: { wheat: 9, fern: 6, boxwood: 1 },
    });
  });

  it('the Lawn Service interval is the table value', () => {
    expect(FLORA.lawn.every).toBe(10);
  });
});

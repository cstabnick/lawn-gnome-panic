import { describe, expect, it } from 'vitest';
import { OUTSKIRTS_KEY, createOutskirtsStore, emptyOutskirtsSave, mergeOutskirtsSaves, parseOutskirtsSave } from './save';

function fakeStorage(init: Record<string, string> = {}) {
  const map = new Map(Object.entries(init));
  return { map, getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { map.set(k, v); } };
}

describe('Pebblewick save', () => {
  it('parses tolerantly', () => {
    expect(parseOutskirtsSave(null)).toEqual(emptyOutskirtsSave());
    expect(parseOutskirtsSave('{junk')).toEqual(emptyOutskirtsSave());
    expect(parseOutskirtsSave(JSON.stringify({ v: 2, visited: true }))).toEqual(emptyOutskirtsSave());
    const p = parseOutskirtsSave(JSON.stringify({ v: 1, visited: 'yes', shops: ['diner', 'bank', 'diner'], souvenirs: [3, 'postcard'], wished: -4, knocked: true }));
    expect(p).toEqual({ ...emptyOutskirtsSave(), shops: ['diner'], souvenirs: ['postcard'], knocked: true });
  });

  it('round-trips through storage and reports what is new', () => {
    const st = fakeStorage();
    const a = createOutskirtsStore(st);
    expect(a.markVisited()).toBe(true);
    expect(a.markVisited()).toBe(false);
    expect(a.markShop('diner')).toBe(true);
    expect(a.markShop('diner')).toBe(false);
    expect(a.addSouvenir('postcard')).toBe(true);
    expect(a.addWish()).toBe(1);
    expect(a.addWish()).toBe(2);
    expect(a.markKnocked()).toBe(true);
    const b = createOutskirtsStore(st);
    expect(b.get()).toEqual({ v: 1, visited: true, shops: ['diner'], souvenirs: ['postcard'], wished: 2, wellJackpot: false, knocked: true });
    expect(b.hasSouvenir('postcard')).toBe(true);
    expect(st.map.has(OUTSKIRTS_KEY)).toBe(true);
  });

  it('merges symmetrically and idempotently', () => {
    const a = JSON.stringify({ v: 1, visited: true, shops: ['store'], souvenirs: ['postcard'], wished: 5, wellJackpot: false, knocked: false });
    const b = JSON.stringify({ v: 1, visited: false, shops: ['diner'], souvenirs: ['pop-mug'], wished: 2, wellJackpot: true, knocked: true });
    const ab = mergeOutskirtsSaves(a, b);
    expect(ab).toBe(mergeOutskirtsSaves(b, a));
    expect(mergeOutskirtsSaves(ab, ab)).toBe(ab);
    expect(JSON.parse(ab)).toEqual({ v: 1, visited: true, shops: ['diner', 'store'], souvenirs: ['pop-mug', 'postcard'], wished: 5, wellJackpot: true, knocked: true });
  });
});

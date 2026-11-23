import { beforeEach, describe, expect, it } from 'vitest';
import * as L from './ledger';
import {
  buyChips, buyItem, claimDailyAcorns, earnAcorns, getAcorns, getChips, grantWelcome, loadOakcount, onOakcountChange,
  owns, resetOakcountForTests, spendChips, OAKCOUNT_STORAGE_KEY,
} from './oakcount';

function memStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    m,
  };
}

describe('ledger', () => {
  it('trades acorns for chips one way and refuses overspending', () => {
    let s = L.earnAcorns(L.emptyOak(), 50, 1)!;
    s = L.buyChips(s, 20, 2)!;
    expect([s.acorns, s.chips]).toEqual([30, 20 * L.OAK.chipsPerAcorn]);
    expect(L.buyChips(s, 31, 3)).toBeNull();
    expect(L.spendChips(s, 201, 3)).toBeNull();
    expect(L.buyChips(s, 0, 3)).toBeNull();
    expect(L.buyChips(s, 1.5, 3)).toBeNull();
    s = L.winChips(s, 15, 4)!;
    expect([s.acorns, s.chips]).toEqual([30, 20 * L.OAK.chipsPerAcorn + 15]);
    expect(L.winChips(s, 0, 5)).toBeNull();
  });
  it('gives free chips up to the cap only; acorns go past it', () => {
    let s = L.claimFreeChips(L.emptyOak(), 1)!;
    expect(s.chips).toBe(L.OAK.freeChipsCap);
    expect(L.claimFreeChips(s, 2)).toBeNull();
    s = L.spendChips(s, 30, 3)!;
    expect(L.freeChipsAvailable(s)).toBe(30);
    s = L.claimFreeChips(s, 4)!;
    expect(s.chips).toBe(100);
    s = L.buyChips(L.earnAcorns(s, 10, 5)!, 10, 6)!;
    expect(s.chips).toBe(100 + 10 * L.OAK.chipsPerAcorn);
    expect(L.freeChipsAvailable(s)).toBe(0);
    expect(L.claimFreeChips(s, 7)).toBeNull();
  });
  it('buys an item once', () => {
    let s = L.earnAcorns(L.emptyOak(), 100, 1)!;
    s = L.buyItem(s, 'guitar', 60, 'acorns', 2)!;
    expect(s.owned).toEqual(['guitar']);
    expect(s.acorns).toBe(40);
    expect(L.buyItem(s, 'guitar', 1, 'acorns', 3)).toBeNull();
    expect(L.buyItem(s, 'lamp', 41, 'acorns', 3)).toBeNull();
  });
  it('gives the welcome once and the daily once per day', () => {
    const s = L.welcome(L.emptyOak(), 1)!;
    expect(s.acorns).toBe(L.OAK.welcomeAcorns);
    expect(L.welcome(s, 2)).toBeNull();
    const d = L.claimDaily(s, '2026-11-23', 3)!;
    expect(L.claimDaily(d, '2026-11-23', 4)).toBeNull();
    expect(L.claimDaily(d, '2026-11-24', 5)).not.toBeNull();
  });
  it('parses garbage as empty and clamps bad numbers', () => {
    expect(L.parseOak('nope')).toEqual(L.emptyOak());
    expect(L.parseOak('{"acorns":-5,"chips":"x","owned":[1,"a","a"]}')).toMatchObject({ acorns: 0, chips: 0, owned: ['a'] });
  });
  it('merges deterministically: newest rev wins, purchases are a union', () => {
    const a = L.serializeOak({ ...L.emptyOak(), acorns: 10, owned: ['x'], rev: 5, updatedAt: 9 });
    const b = L.serializeOak({ ...L.emptyOak(), acorns: 99, owned: ['y'], rev: 3, updatedAt: 20 });
    const m = L.parseOak(L.mergeOak(a, b));
    expect(m.acorns).toBe(10);
    expect(m.owned).toEqual(['x', 'y']);
    expect(L.mergeOak(a, b)).toBe(L.mergeOak(b, a));
    expect(L.mergeOak(L.mergeOak(a, b), b)).toBe(L.mergeOak(a, b));
    expect(L.parseOak(L.mergeOak(null, b)).acorns).toBe(99);
  });
});

describe('runtime', () => {
  beforeEach(() => resetOakcountForTests());

  it('loads, saves every change and tells listeners', async () => {
    const st = memStorage();
    await loadOakcount({ storage: st, slotDeps: { signedIn: () => false }, now: () => 1000 });
    const seen: number[] = [];
    onOakcountChange((s) => seen.push(s.acorns));
    expect(grantWelcome()).toBe(L.OAK.welcomeAcorns);
    expect(grantWelcome()).toBe(0);
    expect(claimDailyAcorns()).toBe(L.OAK.dailyAcorns);
    expect(claimDailyAcorns()).toBe(0);
    expect(earnAcorns(5)).toBe(true);
    expect(buyChips(10)).toBe(true);
    expect(getChips()).toBe(100);
    expect(spendChips(60)).toBe(true);
    expect(buyItem('card-fan', 40, 'chips')).toBe(true);
    expect(owns('card-fan')).toBe(true);
    expect(getChips()).toBe(0);
    expect(getAcorns()).toBe(L.OAK.welcomeAcorns + L.OAK.dailyAcorns + 5 - 10);
    expect(seen.length).toBe(6);
    expect(L.parseOak(st.m.get(OAKCOUNT_STORAGE_KEY)!).owned).toEqual(['card-fan']);
  });

  it('reads what was saved before', async () => {
    const st = memStorage();
    st.setItem(OAKCOUNT_STORAGE_KEY, L.serializeOak({ ...L.emptyOak(), acorns: 42, chips: 7 }));
    await loadOakcount({ storage: st, slotDeps: { signedIn: () => false } });
    expect([getAcorns(), getChips()]).toEqual([42, 7]);
  });
});

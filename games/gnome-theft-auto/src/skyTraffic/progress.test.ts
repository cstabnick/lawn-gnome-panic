import { describe, expect, it } from 'vitest';
import { SKY_ACH, SKY_SAVE_KEY, createSkyProgress, type SkyAchievements, type SkyStorage } from './progress';
import type { AdDef } from './types';

function fakeStorage(): SkyStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => { map.set(k, v); } };
}

function fakeTracker(): SkyAchievements & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    unlock: (id) => { calls.push(`unlock:${id}`); },
    increment: (id) => { calls.push(`inc:${id}`); },
  };
}

const AD_A: AdDef = { id: 'acorn-cola-1', brand: 'buck-iron', headline: 'DRINK ACORNS', tagline: 'Crunch time.' };
const AD_B: AdDef = { id: 'mossy-bank-2', brand: 'razor-back', headline: 'SAVE MOSS', tagline: 'Grow it.' };
const EGG: AdDef = { id: 'egg-tiny-print', brand: 'buck-iron', headline: 'TINY', tagline: 'Small print.', egg: true };

describe('sky progress', () => {
  it('spots the banner once', () => {
    const ach = fakeTracker();
    const p = createSkyProgress(ach, fakeStorage());
    expect(p.markSpotted()).toBe(true);
    expect(p.markSpotted()).toBe(false);
    expect(ach.calls.filter((c) => c === `unlock:${SKY_ACH.spotted}`)).toHaveLength(1);
  });

  it('counts each normal ad read once', () => {
    const ach = fakeTracker();
    const p = createSkyProgress(ach, fakeStorage());
    expect(p.markRead(AD_A)).toBe(true);
    expect(p.markRead(AD_B)).toBe(true);
    expect(p.markRead(AD_A)).toBe(false);
    expect(ach.calls.filter((c) => c === `inc:${SKY_ACH.reader}`)).toHaveLength(2);
    expect(p.readCount()).toBe(2);
  });

  it('unlocks the small-print achievement for an egg ad', () => {
    const ach = fakeTracker();
    const p = createSkyProgress(ach, fakeStorage());
    expect(p.markRead(EGG)).toBe(true);
    expect(ach.calls).toContain('unlock:gta-sky-small-print');
    expect(ach.calls.some((c) => c.startsWith(`inc:${SKY_ACH.reader}`))).toBe(false);
    expect(p.readCount()).toBe(0);
  });

  it('remembers reads and spotting across a new progress object on the same storage', () => {
    const storage = fakeStorage();
    const p1 = createSkyProgress(fakeTracker(), storage);
    p1.markRead(AD_A);
    p1.markRead(AD_B);
    p1.markSpotted();
    expect(storage.map.get(SKY_SAVE_KEY)).toBeDefined();

    const p2 = createSkyProgress(fakeTracker(), storage);
    expect(p2.readCount()).toBe(2);
    expect(p2.markSpotted()).toBe(false);
  });

  it('treats bad saved data as empty', () => {
    const storage = fakeStorage();
    storage.map.set(SKY_SAVE_KEY, '{not json');
    expect(createSkyProgress(fakeTracker(), storage).readCount()).toBe(0);
    storage.map.set(SKY_SAVE_KEY, '{"a":1}');
    expect(createSkyProgress(fakeTracker(), storage).readCount()).toBe(0);
  });

  it('tears and downs unlock their achievements once', () => {
    const ach = fakeTracker();
    const p = createSkyProgress(ach, fakeStorage());
    p.markTorn();
    p.markTorn();
    p.markDowned();
    expect(ach.calls).toContain(`unlock:${SKY_ACH.torn}`);
    expect(ach.calls).toContain(`unlock:${SKY_ACH.downed}`);
    expect(p.readCount()).toBe(0);
  });

  it('works in memory when storage is null', () => {
    const ach = fakeTracker();
    const p = createSkyProgress(ach, null);
    expect(p.markRead(AD_A)).toBe(true);
    expect(p.markRead(AD_A)).toBe(false);
    expect(p.readCount()).toBe(1);
    expect(p.markSpotted()).toBe(true);
    expect(p.markSpotted()).toBe(false);
  });

  it('keeps working when storage throws', () => {
    const throwing: SkyStorage = {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); },
    };
    const p = createSkyProgress(fakeTracker(), throwing);
    expect(p.markRead(AD_B)).toBe(true);
    expect(p.readCount()).toBe(1);
  });
});

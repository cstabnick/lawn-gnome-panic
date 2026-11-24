import { describe, expect, it } from 'vitest';
import { createJobsStore, emptySave, JOBS_SAVE_KEY, levelOf, levelProgress, parseSave, recordFail, recordGig, statsOf } from './career';
import { surgeFor } from './surge';
import type { PayResult } from './types';

const pay = (xp: number, total = 30, stars: PayResult['stars'] = 4): PayResult =>
  ({ base: total, time: 0, tip: 5, bonus: 0, total, stars, xp, notes: [] });

describe('career save', () => {
  it('parses junk to an empty save', () => {
    expect(parseSave(null)).toEqual(emptySave());
    expect(parseSave('{nope')).toEqual(emptySave());
    expect(parseSave(JSON.stringify({ v: 2, parcels: 9 }))).toEqual(emptySave());
  });
  it('keeps good fields and drops bad ones', () => {
    const s = parseSave(JSON.stringify({ v: 1, parcels: 4, ferryLoops: -3, buoyBest: 'x', jobs: { taxi: { xp: 50, done: 'a', licensed: true }, boat: 7 } }));
    expect(s.parcels).toBe(4);
    expect(s.ferryLoops).toBe(0);
    expect(s.buoyBest).toBeNull();
    expect(s.jobs.taxi.xp).toBe(50);
    expect(s.jobs.taxi.done).toBe(0);
    expect(s.jobs.taxi.licensed).toBe(true);
    expect(s.jobs.boat).toEqual(emptySave().jobs.boat);
  });
  it('reads the saveIO fixture', () => {
    const s = parseSave(JSON.stringify({ v: 1, jobs: { taxi: { xp: 120, done: 3, failed: 0, earned: 90, bestTip: 9, fiveStars: 1, licensed: true } }, parcels: 0, tubeSeconds: 12 }));
    expect(levelOf(s.jobs.taxi.xp)).toBe(2);
    expect(s.tubeSeconds).toBe(12);
  });
  it('levels', () => {
    expect(levelOf(0)).toBe(1);
    expect(levelOf(99)).toBe(1);
    expect(levelOf(100)).toBe(2);
    expect(levelOf(5000)).toBe(6);
    expect(levelProgress(5000)).toEqual({ level: 6, into: 3500, need: 0 });
    expect(levelProgress(150)).toEqual({ level: 2, into: 50, need: 150 });
  });
  it('records gigs and level ups', () => {
    const s = emptySave();
    expect(recordGig(s, 'taxi', 'fare', pay(60))).toBeNull();
    expect(recordGig(s, 'taxi', 'fare', pay(60, 40, 5), { playerFare: true })).toBe(2);
    expect(s.jobs.taxi.done).toBe(2);
    expect(s.jobs.taxi.fiveStars).toBe(1);
    expect(s.playerFares).toBe(1);
    recordGig(s, 'courier', 'route', pay(10), { parcels: 3, fragileClean: true });
    recordFail(s, 'courier');
    const st = statsOf(s, 'courier');
    expect(st.taxiFares).toBe(2);
    expect(st.parcels).toBe(3);
    expect(st.earned).toBe(100);
    expect(st.levels.taxi).toBe(2);
    expect(st.onDuty).toBe('courier');
    expect(s.jobs.courier.failed).toBe(1);
  });
  it('store round-trips', () => {
    const m = new Map<string, string>();
    const storage = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
    const a = createJobsStore(storage);
    a.get().parcels = 7;
    a.commit();
    expect(m.has(JOBS_SAVE_KEY)).toBe(true);
    expect(createJobsStore(storage).get().parcels).toBe(7);
  });
});

describe('surge', () => {
  it('rush hour for taxis and couriers only', () => {
    expect(surgeFor('taxi', 'Morning', 'calm', 1, 1).rush).toBe(true);
    expect(surgeFor('pilot', 'Dusk', 'calm', 1, 1).rush).toBe(false);
    expect(surgeFor('courier', 'Dusk', 'calm', 1, 1).payMult).toBe(1.25);
  });
  it('storm pay for boats and pilots', () => {
    const s = surgeFor('boat', 'Noon', 'blustery', 1, 1);
    expect(s.storm).toBe(true);
    expect(s.payMult).toBeCloseTo(1.4);
    expect(s.label).toBe('STORM PAY');
    expect(surgeFor('taxi', 'Noon', 'blustery', 1, 1).storm).toBe(false);
  });
  it('celebrities from level 3, not couriers', () => {
    expect(surgeFor('taxi', null, 'calm', 3, 0.05).celebrity).toBe(true);
    expect(surgeFor('taxi', null, 'calm', 2, 0.05).celebrity).toBe(false);
    expect(surgeFor('courier', null, 'calm', 6, 0.0).celebrity).toBe(false);
    expect(surgeFor('pilot', 'Noon', 'calm', 4, 0.01).label).toBe('CELEBRITY');
  });
});

import { describe, expect, it } from 'vitest';
import { createRacingStore, mergeRacingSaves, parseRacingSave, RACING_SAVE_KEY } from './save';

function fakeStorage() {
  const m = new Map<string, string>();
  return {
    m,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
  };
}

describe('parseRacingSave', () => {
  it('turns garbage into an empty save', () => {
    expect(parseRacingSave(null)).toEqual(parseRacingSave(''));
    expect(parseRacingSave('not json')).toEqual(parseRacingSave(''));
    expect(parseRacingSave('[1,2]')).toEqual(parseRacingSave(''));
    expect(parseRacingSave('{"best":5}').best).toEqual({});
  });

  it('drops unknown tracks and non-positive values, keeps the good ones', () => {
    const s = parseRacingSave(
      JSON.stringify({ best: { 'lost-and-found': 50, 'no-such-track': 10, rutbottom: -3 }, runs: { rutbottom: 2 }, pickupWins: 4 }),
    );
    expect(s.best).toEqual({ 'lost-and-found': 50 });
    expect(s.runs).toEqual({ rutbottom: 2 });
    expect(s.pickupWins).toBe(4);
    expect(s.onlineWins).toBe(0);
  });
});

describe('createRacingStore', () => {
  it('records a finish and keeps only faster times as best', () => {
    const store = createRacingStore(null);
    expect(store.recordFinish('rutbottom', 60)).toEqual({ best: true });
    expect(store.recordFinish('rutbottom', 70)).toEqual({ best: false });
    expect(store.recordFinish('rutbottom', 55)).toEqual({ best: true });
    expect(store.data().best.rutbottom).toBe(55);
    expect(store.data().runs.rutbottom).toBe(3);
  });

  it('counts wins and clamps negative winnings', () => {
    const store = createRacingStore(null);
    store.notePickupWin(30);
    store.notePickupWin(-5);
    store.noteOnlineWin();
    expect(store.data()).toMatchObject({ pickupWins: 2, onlineWins: 1, wagerWon: 30 });
  });

  it('persists to storage and reloads', () => {
    const storage = fakeStorage();
    createRacingStore(storage).recordFinish('capwood-run', 42);
    expect(JSON.parse(storage.m.get(RACING_SAVE_KEY) ?? '{}').best).toEqual({ 'capwood-run': 42 });
    const again = createRacingStore(storage);
    expect(again.data().best['capwood-run']).toBe(42);
    expect(again.data().runs['capwood-run']).toBe(1);
  });
});

describe('mergeRacingSaves', () => {
  it('keeps the lower best per track and the higher counts', () => {
    const a = JSON.stringify({ v: 1, best: { rutbottom: 60, 'capwood-run': 40 }, runs: { rutbottom: 2 }, pickupWins: 3, onlineWins: 0, wagerWon: 10 });
    const b = JSON.stringify({ v: 1, best: { rutbottom: 55, 'lost-and-found': 90 }, runs: { rutbottom: 1, 'lost-and-found': 4 }, pickupWins: 1, onlineWins: 2, wagerWon: 25 });
    const m = JSON.parse(mergeRacingSaves(a, b));
    expect(m.v).toBe(1);
    expect(m.best).toEqual({ rutbottom: 55, 'capwood-run': 40, 'lost-and-found': 90 });
    expect(m.runs).toEqual({ rutbottom: 2, 'lost-and-found': 4 });
    expect(m).toMatchObject({ pickupWins: 3, onlineWins: 2, wagerWon: 25 });
  });

  it('is symmetric', () => {
    const a = JSON.stringify({ best: { rutbottom: 60 }, runs: { rutbottom: 5 } });
    expect(mergeRacingSaves(a, '')).toBe(mergeRacingSaves('', a));
    expect(JSON.parse(mergeRacingSaves(a, '')).best).toEqual({ rutbottom: 60 });
  });
});

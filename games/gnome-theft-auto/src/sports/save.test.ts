import { describe, expect, it } from 'vitest';
import { createSportsStore, emptySportsSave, mergeSportsSave, parseSportsSave } from './save';
import { SPORTS_SAVE_KEY } from './types';

function fakeStorage() {
  const m = new Map<string, string>();
  return {
    m,
    getItem: (key: string) => m.get(key) ?? null,
    setItem: (key: string, value: string) => {
      m.set(key, value);
    },
  };
}

describe('sports save', () => {
  it('parses garbage and bad fields to safe values', () => {
    expect(parseSportsSave(null)).toEqual(emptySportsSave());
    expect(parseSportsSave('{')).toEqual(emptySportsSave());
    expect(parseSportsSave('[]')).toEqual(emptySportsSave());
    const bad = parseSportsSave(JSON.stringify({
      jam: { games: -3, wins: 2.7, threes: 'x', dunks: 4, shootMakes: Infinity, swishBeaten: 1, bestMargin: -5 },
      skate: {
        boardOwned: 'yes', ollies: 6, bestCombo: 320.5, fullRails: -1, linesDone: 2,
        lines: { 'first-push': 12.5, 'bowl-line': -1, 'long-gutter-line': 'x', 'nope': 3 },
      },
    }));
    expect(bad.jam.games).toBe(0);
    expect(bad.jam.wins).toBe(2);
    expect(bad.jam.threes).toBe(0);
    expect(bad.jam.dunks).toBe(4);
    expect(bad.jam.shootMakes).toBe(0);
    expect(bad.jam.swishBeaten).toBe(1);
    expect(bad.jam.bestMargin).toBe(0);
    expect(bad.skate.boardOwned).toBe(false);
    expect(bad.skate.ollies).toBe(6);
    expect(bad.skate.bestCombo).toBe(320.5);
    expect(bad.skate.fullRails).toBe(0);
    expect(bad.skate.linesDone).toBe(2);
    expect(bad.skate.lines).toEqual({ 'first-push': 12.5 });
  });

  it('merges: counts max, board OR, bests max or lower, line ids union', () => {
    const a = JSON.stringify({
      ...emptySportsSave(),
      jam: { ...emptySportsSave().jam, games: 4, wins: 2, bestMargin: 6 },
      skate: { ...emptySportsSave().skate, boardOwned: true, ollies: 3, bestCombo: 200, lines: { 'first-push': 20, 'bowl-line': 30 }, linesDone: 2 },
    });
    const b = JSON.stringify({
      ...emptySportsSave(),
      jam: { ...emptySportsSave().jam, games: 2, wins: 3, bestMargin: 4, swishBeaten: 1 },
      skate: { ...emptySportsSave().skate, ollies: 5, bestCombo: 150, lines: { 'first-push': 18, 'asphalt-line': 25 }, linesDone: 1 },
    });
    const m = parseSportsSave(mergeSportsSave(a, b));
    expect(m.jam.games).toBe(4);
    expect(m.jam.wins).toBe(3);
    expect(m.jam.bestMargin).toBe(6);
    expect(m.jam.swishBeaten).toBe(1);
    expect(m.skate.boardOwned).toBe(true);
    expect(m.skate.ollies).toBe(5);
    expect(m.skate.bestCombo).toBe(200);
    expect(m.skate.linesDone).toBe(2);
    expect(m.skate.lines).toEqual({ 'first-push': 18, 'bowl-line': 30, 'asphalt-line': 25 });
    expect(mergeSportsSave(b, a)).toBe(mergeSportsSave(a, b));
  });

  it('recordGame counts games, wins, threes, dunks, swish wins and the best margin', () => {
    const store = createSportsStore(fakeStorage());
    store.recordGame({ won: true, margin: 4, threes: 2, dunks: 1, swish: true });
    store.recordGame({ won: false, margin: 9, threes: 1, dunks: 0, swish: true });
    store.recordGame({ won: true, margin: 2, threes: 0, dunks: 0, swish: false });
    const j = store.data().jam;
    expect(j.games).toBe(3);
    expect(j.wins).toBe(2);
    expect(j.threes).toBe(3);
    expect(j.dunks).toBe(1);
    expect(j.swishBeaten).toBe(1);
    expect(j.bestMargin).toBe(4);
  });

  it('recordShootMake, setBoardOwned, recordOllie and recordFullRail count up', () => {
    const store = createSportsStore(fakeStorage());
    store.recordShootMake();
    store.recordShootMake();
    store.setBoardOwned();
    store.recordOllie();
    store.recordFullRail();
    expect(store.data().jam.shootMakes).toBe(2);
    expect(store.data().skate.boardOwned).toBe(true);
    expect(store.data().skate.ollies).toBe(1);
    expect(store.data().skate.fullRails).toBe(1);
  });

  it('recordCombo returns true only for a new best', () => {
    const store = createSportsStore(fakeStorage());
    expect(store.recordCombo(120)).toBe(true);
    expect(store.recordCombo(120)).toBe(false);
    expect(store.recordCombo(90)).toBe(false);
    expect(store.recordCombo(300)).toBe(true);
    expect(store.data().skate.bestCombo).toBe(300);
  });

  it('recordLine counts every finish and returns true only for a faster time', () => {
    const store = createSportsStore(fakeStorage());
    expect(store.recordLine('first-push', 14)).toBe(true);
    expect(store.recordLine('first-push', 14)).toBe(false);
    expect(store.recordLine('first-push', 15)).toBe(false);
    expect(store.recordLine('first-push', 11.5)).toBe(true);
    expect(store.recordLine('asphalt-line', 22)).toBe(true);
    expect(store.data().skate.linesDone).toBe(5);
    expect(store.data().skate.lines).toEqual({ 'first-push': 11.5, 'asphalt-line': 22 });
  });

  it('round-trips through a new store on the same storage, under gta-sports-v1', () => {
    const s = fakeStorage();
    const a = createSportsStore(s);
    a.recordGame({ won: true, margin: 3, threes: 1, dunks: 0, swish: true });
    a.setBoardOwned();
    a.recordLine('bowl-line', 27);
    expect(s.m.has(SPORTS_SAVE_KEY)).toBe(true);
    const b = createSportsStore(s);
    expect(b.data().jam.wins).toBe(1);
    expect(b.data().jam.swishBeaten).toBe(1);
    expect(b.data().skate.boardOwned).toBe(true);
    expect(b.data().skate.lines).toEqual({ 'bowl-line': 27 });
  });

  it('works in memory without storage and does not throw when setItem throws', () => {
    const mem = createSportsStore();
    expect(mem.recordCombo(50)).toBe(true);
    const broken = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    const store = createSportsStore(broken);
    expect(() => store.setBoardOwned()).not.toThrow();
    expect(() => store.recordOllie()).not.toThrow();
    expect(store.data().skate.ollies).toBe(1);
  });
});

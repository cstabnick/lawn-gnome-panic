import { describe, expect, it } from 'vitest';
import { createGolfStore, emptyGolfSave, mergeGolfSave, parseGolfSave } from './save';
import { GOLF_SAVE_KEY, HOLES } from './types';

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

describe('golf save', () => {
  it('parses garbage and bad fields to safe values', () => {
    expect(parseGolfSave(null)).toEqual(emptyGolfSave());
    expect(parseGolfSave('{')).toEqual(emptyGolfSave());
    expect(parseGolfSave('[]')).toEqual(emptyGolfSave());
    const bad = parseGolfSave(JSON.stringify({
      boardBroken: 'yes', holesPlayed: -2, parHoles: 1.5, rounds: 2, aces: 'x',
      best: [0, 3, null], bestRound: -4,
      ballsFound: ['lb-1', 'lb-1', 'nope'], molehills: ['mh-9', 'mh-2'],
    }));
    expect(bad.boardBroken).toBe(false);
    expect(bad.holesPlayed).toBe(0);
    expect(bad.parHoles).toBe(0);
    expect(bad.rounds).toBe(2);
    expect(bad.aces).toBe(0);
    expect(bad.best).toEqual([null, 3, null, null]);
    expect(bad.bestRound).toBeNull();
    expect(bad.ballsFound).toEqual(['lb-1']);
    expect(bad.molehills).toEqual(['mh-2']);
    expect(parseGolfSave(JSON.stringify({ best: 'x' })).best).toEqual(HOLES.map(() => null));
  });

  it('merges: board OR, counts max, bests lower, ids union', () => {
    const a = JSON.stringify({ ...emptyGolfSave(), boardBroken: true, holesPlayed: 5, rounds: 1, best: [4, null, null, 6], bestRound: 20, aces: 1, ballsFound: ['lb-2'] });
    const b = JSON.stringify({ ...emptyGolfSave(), holesPlayed: 3, parHoles: 2, rounds: 0, best: [5, 3, null, null], bestRound: 18, ballsFound: ['lb-1'], molehills: ['mh-1'] });
    const m = parseGolfSave(mergeGolfSave(a, b));
    expect(m.boardBroken).toBe(true);
    expect(m.holesPlayed).toBe(5);
    expect(m.parHoles).toBe(2);
    expect(m.rounds).toBe(1);
    expect(m.best).toEqual([4, 3, null, 6]);
    expect(m.bestRound).toBe(18);
    expect(m.aces).toBe(1);
    expect(m.ballsFound).toEqual(['lb-1', 'lb-2']);
    expect(m.molehills).toEqual(['mh-1']);
    expect(mergeGolfSave(b, a)).toBe(mergeGolfSave(a, b));
  });

  it('recordHole counts holes, par holes, aces and the best per hole', () => {
    const store = createGolfStore(fakeStorage());
    store.recordHole(0, 4, 4);
    store.recordHole(0, 6, 4);
    store.recordHole(2, 1, 5);
    const d = store.data();
    expect(d.holesPlayed).toBe(3);
    expect(d.parHoles).toBe(2);
    expect(d.aces).toBe(1);
    expect(d.best[0]).toBe(4);
    expect(d.best[2]).toBe(1);
    expect(d.best[1]).toBeNull();
  });

  it('recordRound counts rounds and keeps the best total', () => {
    const store = createGolfStore(fakeStorage());
    store.recordRound(22);
    store.recordRound(25);
    store.recordRound(19);
    expect(store.data().rounds).toBe(3);
    expect(store.data().bestRound).toBe(19);
  });

  it('breakBoard, findBall and flattenMolehill report new ids once', () => {
    const store = createGolfStore(fakeStorage());
    store.breakBoard();
    expect(store.data().boardBroken).toBe(true);
    expect(store.findBall('lb-3')).toBe(true);
    expect(store.findBall('lb-3')).toBe(false);
    expect(store.findBall('unknown')).toBe(false);
    expect(store.flattenMolehill('mh-4')).toBe(true);
    expect(store.flattenMolehill('mh-4')).toBe(false);
    expect(store.data().ballsFound).toEqual(['lb-3']);
    expect(store.data().molehills).toEqual(['mh-4']);
  });

  it('round-trips through a new store on the same storage, under gta-golf-v1', () => {
    const s = fakeStorage();
    const a = createGolfStore(s);
    a.recordHole(1, 2, 3);
    a.recordRound(30);
    a.findBall('lb-8');
    expect(s.m.has(GOLF_SAVE_KEY)).toBe(true);
    const b = createGolfStore(s);
    expect(b.data().holesPlayed).toBe(1);
    expect(b.data().best[1]).toBe(2);
    expect(b.data().bestRound).toBe(30);
    expect(b.data().ballsFound).toEqual(['lb-8']);
  });

  it('works in memory without storage and does not throw when setItem throws', () => {
    const mem = createGolfStore();
    expect(mem.findBall('lb-1')).toBe(true);
    const broken = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    const store = createGolfStore(broken);
    expect(() => store.breakBoard()).not.toThrow();
    expect(() => store.recordRound(20)).not.toThrow();
    expect(store.data().rounds).toBe(1);
  });
});

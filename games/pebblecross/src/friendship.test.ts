import { describe, it, expect } from 'vitest';
import { SAVE_KEY, GIFT_FAVOURITE_POINTS, GIFT_OTHER_POINTS, MAX_POINTS, TALK_POINTS, FRIEND_MIN_POINTS, START_HOUR } from './config';
import {
  emptySave, readSave, writeSave, levelOf, isFriend, friendCount, canTalk, talk,
  bagCount, addToBag, canGive, give,
} from './friendship';

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => { map.set(k, v); },
  };
}

const throwingStorage = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('blocked'); },
};

describe('save', () => {
  it('emptySave starts at START_HOUR on day 0 with nothing in it', () => {
    const s = emptySave();
    expect(s.v).toBe(1);
    expect(s.clock).toBe(START_HOUR * 60);
    expect(s.giftsGiven).toBe(0);
    expect(s.bag).toEqual({});
  });

  it('readSave of nothing is null', () => {
    expect(readSave(fakeStorage())).toBeNull();
  });

  it('write then read round-trips', () => {
    const st = fakeStorage();
    const s = emptySave();
    addToBag(s, 'acorn', 2);
    talk(s, 'nettle', 0);
    expect(writeSave(s, st)).toBe(true);
    expect(readSave(st)).toEqual(s);
  });

  it('malformed JSON gives null', () => {
    const st = fakeStorage();
    st.map.set(SAVE_KEY, '{not json');
    expect(readSave(st)).toBeNull();
  });

  it('wrong version or wrong field types give null', () => {
    const st = fakeStorage();
    st.map.set(SAVE_KEY, JSON.stringify({ ...emptySave(), v: 2 }));
    expect(readSave(st)).toBeNull();
    st.map.set(SAVE_KEY, JSON.stringify({ ...emptySave(), bag: [] }));
    expect(readSave(st)).toBeNull();
    st.map.set(SAVE_KEY, JSON.stringify({ ...emptySave(), giftsGiven: 'many' }));
    expect(readSave(st)).toBeNull();
  });

  it('a throwing storage gives null and writeSave false', () => {
    expect(readSave(throwingStorage)).toBeNull();
    expect(writeSave(emptySave(), throwingStorage)).toBe(false);
  });
});

describe('levels and friends', () => {
  it('levelOf picks the last level reached', () => {
    expect(levelOf(0).name).toBe('Stranger');
    expect(levelOf(20).name).toBe('Acquaintance');
    expect(levelOf(100).name).toBe('Best friend');
    expect(levelOf(999).name).toBe('Best friend');
  });

  it('isFriend is true at FRIEND_MIN_POINTS and false one below', () => {
    const s = emptySave();
    s.points.nettle = FRIEND_MIN_POINTS;
    s.points.tansy = FRIEND_MIN_POINTS - 1;
    expect(isFriend(s, 'nettle')).toBe(true);
    expect(isFriend(s, 'tansy')).toBe(false);
    expect(friendCount(s)).toBe(1);
  });
});

describe('talk', () => {
  it('gives TALK_POINTS once per day, then 0, and allows talk again the next day', () => {
    const s = emptySave();
    expect(canTalk(s, 'hollis', 0)).toBe(true);
    expect(talk(s, 'hollis', 0)).toBe(TALK_POINTS);
    expect(canTalk(s, 'hollis', 0)).toBe(false);
    expect(talk(s, 'hollis', 0)).toBe(0);
    expect(talk(s, 'hollis', 1)).toBe(TALK_POINTS);
    expect(s.points.hollis).toBe(TALK_POINTS * 2);
  });
});

describe('gifts', () => {
  it('favourite gives GIFT_FAVOURITE_POINTS and other gives GIFT_OTHER_POINTS', () => {
    const s = emptySave();
    addToBag(s, 'clover', 1);
    addToBag(s, 'pebble', 1);
    expect(give(s, 'doris', 'clover', 0, true)).toBe(GIFT_FAVOURITE_POINTS);
    expect(give(s, 'clem', 'pebble', 0, false)).toBe(GIFT_OTHER_POINTS);
  });

  it('one gift per resident per day; a second give is 0 and does not use the bag', () => {
    const s = emptySave();
    addToBag(s, 'acorn', 2);
    expect(give(s, 'lou', 'acorn', 0, false)).toBe(GIFT_OTHER_POINTS);
    expect(canGive(s, 'lou', 'acorn', 0)).toBe(false);
    expect(give(s, 'lou', 'acorn', 0, true)).toBe(0);
    expect(bagCount(s, 'acorn')).toBe(1);
    expect(s.giftsGiven).toBe(1);
    expect(give(s, 'lou', 'acorn', 1, false)).toBe(GIFT_OTHER_POINTS);
  });

  it('points cap at MAX_POINTS', () => {
    const s = emptySave();
    s.points.gertrude = MAX_POINTS - 3;
    addToBag(s, 'crumb', 1);
    expect(give(s, 'gertrude', 'crumb', 0, true)).toBe(3);
    expect(s.points.gertrude).toBe(MAX_POINTS);
  });

  it('the bag empties and the key is removed', () => {
    const s = emptySave();
    addToBag(s, 'mushroom', 1);
    expect(give(s, 'nettle', 'mushroom', 0, false)).toBe(GIFT_OTHER_POINTS);
    expect(bagCount(s, 'mushroom')).toBe(0);
    expect('mushroom' in s.bag).toBe(false);
  });
});

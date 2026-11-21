import { describe, it, expect } from 'vitest';
import type { Resident } from './config';
import { FRIEND_MIN_POINTS } from './config';
import { talkLine, giftLine } from './dialogue';

const r: Resident = {
  id: 'nettle', name: 'Nettle', role: 'Baker', blurb: 'Bakes.', home: 'home-nettle', favourite: 'crumb',
  look: {} as Resident['look'],
  weekday: [], weekend: [],
  lines: {
    morning: ['m0', 'm1'],
    day: ['d0', 'd1'],
    evening: ['e0', 'e1'],
    night: ['n0', 'n1'],
    close: ['c0', 'c1'],
    favourite: ['f0', 'f1'],
    gift: ['g0', 'g1'],
  },
};

const at = (day: number, hour: number) => day * 1440 + hour * 60;

describe('talkLine', () => {
  it('picks from the right time-of-day list', () => {
    expect(['m0', 'm1']).toContain(talkLine(r, at(0, 7), 0, 0));
    expect(['d0', 'd1']).toContain(talkLine(r, at(0, 12), 0, 0));
    expect(['e0', 'e1']).toContain(talkLine(r, at(0, 19), 0, 0));
    expect(['n0', 'n1']).toContain(talkLine(r, at(0, 2), 0, 0));
    expect(['n0', 'n1']).toContain(talkLine(r, at(0, 23), 0, 0));
  });

  it('bucket edges: 5:00 is morning, 11:00 is day, 17:00 is evening, 22:00 is night', () => {
    expect(talkLine(r, at(2, 5), 0, 0)).toBe('m0');
    expect(talkLine(r, at(2, 11), 0, 0)).toBe('d0');
    expect(talkLine(r, at(2, 17), 0, 0)).toBe('e0');
    expect(talkLine(r, at(2, 22), 0, 0)).toBe('n0');
  });

  it('uses the close list when a friend and pick % 3 === 0', () => {
    expect(['c0', 'c1']).toContain(talkLine(r, at(0, 7), FRIEND_MIN_POINTS, 0));
    expect(['c0', 'c1']).toContain(talkLine(r, at(0, 7), FRIEND_MIN_POINTS, 3));
    expect(talkLine(r, at(0, 7), FRIEND_MIN_POINTS, 1)).toMatch(/^m/);
    expect(talkLine(r, at(0, 7), FRIEND_MIN_POINTS - 1, 0)).toMatch(/^m/);
  });

  it('a negative pick does not throw and returns an entry of the list', () => {
    expect(['n0', 'n1']).toContain(talkLine(r, at(0, 2), 0, -1));
    expect(['n0', 'n1']).toContain(talkLine(r, at(0, 2), 0, -7));
  });
});

describe('giftLine', () => {
  it('returns from the favourite or gift list', () => {
    expect(['f0', 'f1']).toContain(giftLine(r, true, 0));
    expect(['g0', 'g1']).toContain(giftLine(r, false, 1));
    expect(['g0', 'g1']).toContain(giftLine(r, false, -3));
  });
});

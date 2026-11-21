import { describe, expect, it } from 'vitest';
import type { Resident } from './config';
import { MINUTES_PER_DAY } from './config';
import { activityAt } from './schedule';

// A literal resident (not residents.ts) so this test stands alone.
const r = {
  id: 'tansy',
  name: 'Test',
  role: 'test',
  blurb: 'test',
  home: 'home-tansy',
  favourite: 'dandelion',
  look: {} as Resident['look'],
  weekday: [
    { from: 9, to: 17, at: 'potting-shed', doing: 'potting' },
    { from: 22, to: 8, at: 'home-tansy', doing: 'asleep' },
  ],
  weekend: [{ from: 10, to: 16, at: 'green', doing: 'weekend walk' }],
  lines: { morning: ['a'], day: ['a'], evening: ['a'], night: ['a'], close: ['a'], favourite: ['a'], gift: ['a'] },
} as Resident;

const at = (day: number, hour: number, minute = 0) => day * MINUTES_PER_DAY + hour * 60 + minute;

describe('activityAt', () => {
  it('10:00 Monday is the potting shed', () => {
    expect(activityAt(r, at(0, 10))).toEqual({ at: 'potting-shed', doing: 'potting', asleep: false });
  });

  it('12:00 Saturday is the weekend slot', () => {
    expect(activityAt(r, at(5, 12))).toEqual({ at: 'green', doing: 'weekend walk', asleep: false });
  });

  it('23:30 Wednesday is asleep', () => {
    expect(activityAt(r, at(2, 23, 30)).asleep).toBe(true);
  });

  it('02:00 Thursday is asleep at home', () => {
    expect(activityAt(r, at(3, 2))).toEqual({ at: 'home-tansy', doing: 'asleep', asleep: true });
  });

  it('08:30 Monday has no slot: at home, not asleep', () => {
    expect(activityAt(r, at(0, 8, 30))).toEqual({ at: 'home-tansy', doing: 'at home', asleep: false });
  });

  it('17:00 exactly Monday is outside 9-17 (to is exclusive)', () => {
    expect(activityAt(r, at(0, 17))).toEqual({ at: 'home-tansy', doing: 'at home', asleep: false });
  });
});

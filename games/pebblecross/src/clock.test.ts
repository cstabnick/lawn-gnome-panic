import { describe, expect, it } from 'vitest';
import { DAY_SECONDS, MINUTES_PER_DAY } from './config';
import { clockLabel, dayName, gameMinutesPerRealSecond, hourOf, isWeekend, startClock } from './clock';

describe('clock', () => {
  it('starts at Mon 07:00', () => {
    expect(clockLabel(startClock())).toBe('Mon 07:00');
  });

  it('day 5 is Saturday and a weekend', () => {
    expect(dayName(MINUTES_PER_DAY * 5)).toBe('Sat');
    expect(isWeekend(MINUTES_PER_DAY * 5)).toBe(true);
  });

  it('hourOf gives fractional hours within the day', () => {
    expect(hourOf(MINUTES_PER_DAY + 90)).toBe(1.5);
  });

  it('labels wrap into the next day', () => {
    expect(clockLabel(1440 + 60)).toBe('Tue 01:00');
    // 1440 + 25 * 60 is 25 hours past day 1's midnight, which is Wed 01:00 (the issue's "Tue" was an arithmetic slip).
    expect(clockLabel(1440 + 25 * 60)).toBe('Wed 01:00');
  });

  it('real seconds map to the day length', () => {
    expect(gameMinutesPerRealSecond() * DAY_SECONDS).toBe(MINUTES_PER_DAY);
  });
});

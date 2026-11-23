import { describe, expect, it } from 'vitest';
import { ODD_RIDES, ODD_RIDES_KEY, recordOddRide, type RideStorage } from './oddRides';

function memStorage(initial: Record<string, string> = {}): RideStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = v; },
  };
}

describe('recordOddRide', () => {
  it('is true once per odd ride, false on a repeat', () => {
    const s = memStorage();
    for (const kind of ODD_RIDES) {
      expect(recordOddRide(kind, s)).toBe(true);
      expect(recordOddRide(kind, s)).toBe(false);
    }
  });

  it('is false for a ride-on', () => {
    const s = memStorage();
    expect(recordOddRide('ride-on', s)).toBe(false);
  });

  it('survives a new call with the same storage', () => {
    const s = memStorage();
    expect(recordOddRide('pot-rod', s)).toBe(true);
    expect(JSON.parse(s.data[ODD_RIDES_KEY])).toContain('pot-rod');
    expect(recordOddRide('pot-rod', s)).toBe(false);
  });

  it('treats garbage JSON as empty', () => {
    const s = memStorage({ [ODD_RIDES_KEY]: '{not json' });
    expect(recordOddRide('lawn-roller', s)).toBe(true);
    expect(recordOddRide('lawn-roller', s)).toBe(false);
  });

  it('works in memory when storage is null', () => {
    expect(recordOddRide('barrow-buggy', null)).toBe(true);
    expect(recordOddRide('barrow-buggy', null)).toBe(false);
  });
});

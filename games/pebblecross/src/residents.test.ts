import { describe, expect, it } from 'vitest';
import { GIFT_IDS, RESIDENT_IDS, type PlaceId, type ScheduleSlot } from './config';
import { RESIDENTS, RESIDENT_BY_ID } from './residents';

const PLACE_IDS: PlaceId[] = [
  'bakery', 'post-office', 'potting-shed', 'yard-shed', 'school', 'inn', 'green', 'green-bench', 'pond', 'oak',
  'home-nettle', 'home-fernwick', 'home-tansy', 'home-hollis', 'home-lou', 'home-marjory', 'home-clem', 'home-doris',
  'home-gertrude',
];

function covers(slots: ScheduleSlot[], h: number): boolean {
  return slots.some((s) => (s.from < s.to ? h >= s.from && h < s.to : h >= s.from || h < s.to));
}

describe('residents', () => {
  it('has nine residents in RESIDENT_IDS order with unique names', () => {
    expect(RESIDENTS.map((r) => r.id)).toEqual(RESIDENT_IDS);
    expect(new Set(RESIDENTS.map((r) => r.name)).size).toBe(9);
    expect(Object.keys(RESIDENT_BY_ID)).toHaveLength(9);
    for (const r of RESIDENTS) expect(RESIDENT_BY_ID[r.id]).toBe(r);
  });

  it('uses only known places in every schedule slot', () => {
    for (const r of RESIDENTS) {
      for (const s of [...r.weekday, ...r.weekend]) {
        expect(PLACE_IDS, `${r.id} slot ${s.doing}`).toContain(s.at);
      }
      expect(PLACE_IDS).toContain(r.home);
    }
  });

  it('covers every half hour of the day on weekdays and weekends', () => {
    for (const r of RESIDENTS) {
      for (const list of [r.weekday, r.weekend]) {
        for (let h = 0; h < 24; h += 0.5) {
          expect(covers(list, h), `${r.id} at ${h}`).toBe(true);
        }
      }
    }
  });

  it('gives every lines list at least two lines', () => {
    for (const r of RESIDENTS) {
      for (const [key, list] of Object.entries(r.lines)) {
        expect(list.length, `${r.id}.${key}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('has a favourite gift that exists', () => {
    for (const r of RESIDENTS) expect(GIFT_IDS).toContain(r.favourite);
  });
});

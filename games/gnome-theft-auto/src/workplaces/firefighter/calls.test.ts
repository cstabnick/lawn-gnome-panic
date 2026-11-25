import { describe, expect, it } from 'vitest';
import { FOREST_PLACES, makeCall, scoreCall } from './calls';
import type { CallPlace, FireCall } from './types';

const CITY: CallPlace[] = [
  { id: 'terrace-1', name: "Juniper Vance's terrace", x: 100, z: 40, area: 'city' },
  { id: 'lane-2', name: 'Acorn Row back lane', x: 60, z: -30, area: 'outskirts' },
];

const seeds = Array.from({ length: 200 }, (_, i) => i * 7919 + 13);

describe('makeCall', () => {
  it('is deterministic per seed', () => {
    for (const s of seeds.slice(0, 20)) {
      expect(makeCall(4, s, CITY, 5)).toEqual(makeCall(4, s, CITY, 5));
    }
  });

  it('level 1 city calls are only bins', () => {
    for (const s of seeds) expect(makeCall(1, s, CITY).kind).toBe('bin');
  });

  it('forest places only get toadstool calls', () => {
    for (const s of seeds) {
      const call = makeCall(3, s, FOREST_PLACES);
      expect(call.place.area).toBe('forest');
      expect(call.kind).toBe('toadstool');
    }
  });

  it('every call has at least one fire and only non-empty prefab ids', () => {
    for (const level of [1, 2, 3, 4, 5, 6]) {
      for (const s of seeds) {
        const call = makeCall(level, s, [...CITY, ...FOREST_PLACES]);
        expect(call.fires.length).toBeGreaterThanOrEqual(1);
        for (const p of call.props) expect(p.prefab.length).toBeGreaterThan(0);
      }
    }
  });

  it('rescues only come at level 3 and up, with bands inside 0..1 and lo < hi', () => {
    let rescues = 0;
    for (const level of [1, 2, 3, 4, 5, 6]) {
      for (const s of seeds) {
        const call = makeCall(level, s, CITY);
        if (level < 3) expect(call.rescue).toBeNull();
        if (call.rescue) {
          rescues++;
          const [lo, hi] = call.rescue.band;
          expect(lo).toBeGreaterThanOrEqual(0);
          expect(hi).toBeLessThanOrEqual(1);
          expect(lo).toBeLessThan(hi);
        }
      }
    }
    expect(rescues).toBeGreaterThan(0);
  });

  it('the cat rescue is Asphalt on a lamp post next to a bin', () => {
    const cats = seeds.map((s) => makeCall(3, s, CITY)).filter((c) => c.rescue?.who === 'cat');
    expect(cats.length).toBeGreaterThan(0);
    for (const c of cats) {
      expect(c.kind).toBe('bin');
      expect(c.rescue?.name).toBe('Asphalt');
      expect(c.props.some((p) => p.prefab === 'street-lamp')).toBe(true);
    }
  });

  it('titles name the kind and the place', () => {
    const call = makeCall(2, 42, CITY);
    expect(call.title).toContain(call.place.name);
    expect(call.title).toMatch(/^(Bin|Barbecue|Shed|Toadstool) fire: /);
  });
});

function call(over: Partial<FireCall> = {}): FireCall {
  return { ...makeCall(3, 1, CITY), ...over };
}

describe('scoreCall', () => {
  it('stars rise with less burnt', () => {
    const c = call();
    const base = { seconds: 60, water: 40, rescued: null };
    const low = scoreCall(c, { ...base, burnt: 0 }).stars;
    const mid = scoreCall(c, { ...base, burnt: 0.5 }).stars;
    const high = scoreCall(c, { ...base, burnt: 1 }).stars;
    expect(low).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(high);
  });

  it('a failed rescue lowers the stars', () => {
    const c = call();
    const ok = scoreCall(c, { seconds: 60, burnt: 0.2, water: 40, rescued: true });
    const failed = scoreCall(c, { seconds: 60, burnt: 0.2, water: 40, rescued: false });
    expect(failed.stars).toBeLessThan(ok.stars);
  });

  it('lines report the time, the water and the rescue; the quote follows the stars', () => {
    const c = call();
    const s = scoreCall(c, { seconds: 48.4, burnt: 0, water: 33.2, rescued: null });
    expect(s.lines[0]).toBe('Arrived and out in 48 s');
    expect(s.lines).toContain('Water used: 33 l');
    expect(s.quote).toContain('Chief Hydra Pumpwell');
    expect(s.stars).toBe(5);
    expect(s.quote).toContain('Wet is best. You were wettest.');
  });
});

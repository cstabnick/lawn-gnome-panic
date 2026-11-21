// Temper, crash-outs, obeying suggestions and friendship: the rules of the gnome's own mind (sim.ts and config.ts).
import { describe, expect, it } from 'vitest';
import { CRASH_MINUTES, FRIEND_STEP, TEMPER_AFTER_CRASH, TEMPER_CRASH_BELOW, TEMPER_START, obeyChance } from './config';
import { befriend, friendLevel, friendshipOf, newHousehold, sanitize, tickTemper } from './sim';
import type { Household } from './types';

function household(): Household {
  return newHousehold({ householdName: 'x', gnomeName: 'Pip', trait: 'neat', lot: 'empty' });
}

describe('temper', () => {
  it('starts calm', () => {
    expect(household().gnome.temper).toBe(TEMPER_START);
  });

  it('drops when the needs are neglected and a crash-out can start at the bottom', () => {
    const h = household();
    h.gnome.temper = TEMPER_CRASH_BELOW - 1;
    h.gnome.needs = { hunger: 5, energy: 5, bladder: 5, hygiene: 5, fun: 5 };
    const events = tickTemper(h.gnome, h.clock, 60, () => 0); // rng 0: the crash roll always succeeds
    expect(events).toEqual([{ type: 'crashStart' }]);
    expect(h.gnome.crash).toEqual({ until: h.clock + CRASH_MINUTES });
    expect(h.gnome.crashes).toBe(1);
    expect(h.gnome.temper).toBe(0);
  });

  it('never crashes when the crash roll fails', () => {
    const h = household();
    h.gnome.temper = 5;
    const events = tickTemper(h.gnome, h.clock, 600, () => 0.999999);
    expect(events).toEqual([]);
    expect(h.gnome.crash).toBeNull();
  });

  it('ends a crash-out on its own, when its time is up', () => {
    const h = household();
    h.gnome.crash = { until: h.clock + 30 };
    expect(tickTemper(h.gnome, h.clock + 10, 10)).toEqual([]);
    expect(tickTemper(h.gnome, h.clock + 30, 20)).toEqual([{ type: 'crashEnd' }]);
    expect(h.gnome.crash).toBeNull();
    expect(h.gnome.temper).toBe(TEMPER_AFTER_CRASH);
  });

  it('does nothing when no sim time passes (paused)', () => {
    const h = household();
    h.gnome.temper = 50;
    expect(tickTemper(h.gnome, h.clock, 0, () => 0)).toEqual([]);
    expect(h.gnome.temper).toBe(50);
  });
});

describe('obeying suggestions', () => {
  it('is near certain when calm and never when stewing past the limit', () => {
    expect(obeyChance(90)).toBe(0.95);
    expect(obeyChance(60)).toBe(0.95);
    expect(obeyChance(19)).toBe(0);
    expect(obeyChance(0)).toBe(0);
  });

  it('gets less likely as temper falls, between the two limits', () => {
    let last = 1;
    for (let t = 60; t >= 20; t -= 2) {
      const c = obeyChance(t);
      expect(c).toBeLessThanOrEqual(last + 1e-9);
      last = c;
    }
    expect(obeyChance(40)).toBeGreaterThan(0.2);
    expect(obeyChance(40)).toBeLessThan(0.95);
  });
});

describe('friendship', () => {
  it('grows by a step and stops at 100', () => {
    const h = household();
    expect(befriend(h.gnome, 'wren')).toEqual({ before: 0, after: FRIEND_STEP });
    h.gnome.friends.wren = 98;
    expect(befriend(h.gnome, 'wren').after).toBe(100);
    expect(friendshipOf(h.gnome, 'wren')).toBe(100);
  });

  it('names the level by threshold', () => {
    expect(friendLevel(0)).toBe('Stranger');
    expect(friendLevel(19)).toBe('Stranger');
    expect(friendLevel(20)).toBe('Acquaintance');
    expect(friendLevel(50)).toBe('Friend');
    expect(friendLevel(80)).toBe('Best friend');
    expect(friendLevel(100)).toBe('Best friend');
  });
});

describe('saves', () => {
  it('keep the new gnome fields through a round trip', () => {
    const h = household();
    h.gnome.where = 'town';
    h.gnome.trip = { to: 'home', arriveAt: 999 };
    h.gnome.lastTownDay = 3;
    h.gnome.temper = 22;
    h.gnome.crash = { until: 1234 };
    h.gnome.crashes = 2;
    h.gnome.friends = { wren: 60, nettle: 10 };
    const back = sanitize(JSON.parse(JSON.stringify(h)));
    expect(back?.gnome).toMatchObject({ where: 'town', trip: { to: 'home', arriveAt: 999 }, lastTownDay: 3, temper: 22, crash: { until: 1234 }, crashes: 2, friends: { wren: 60, nettle: 10 } });
  });

  it('fill in the new fields for an old save', () => {
    const h = household();
    const old = JSON.parse(JSON.stringify(h));
    for (const k of ['where', 'trip', 'lastTownDay', 'temper', 'crash', 'crashes', 'friends']) delete old.gnome[k];
    const back = sanitize(old);
    expect(back?.gnome.where).toBe('home');
    expect(back?.gnome.trip).toBeNull();
    expect(back?.gnome.temper).toBe(TEMPER_START);
    expect(back?.gnome.crash).toBeNull();
    expect(back?.gnome.friends).toEqual({});
  });
});

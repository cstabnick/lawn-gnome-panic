import { describe, expect, it } from 'vitest';
import { BILLS_PER_DAY, JOBS, START_FUNDS } from './config';
import {
  advance, decayNeeds, dayOf, endShiftDue, finishShift, isWorkDay, moodOf, newHousehold, pickNeed, sanitize, shiftDue, startShift, applyUse,
} from './sim';
import type { GnomeState, Household, Needs, UseDef } from './types';

function fresh(trait: GnomeState['trait'] = 'neat'): Household {
  return newHousehold({ householdName: 'The Testbottoms', gnomeName: 'Gnorman', trait, lot: 'empty' });
}

const ALL = (v: number): Needs => ({ hunger: v, energy: v, bladder: v, hygiene: v, fun: v });

describe('newHousehold', () => {
  it('starts with the lot funds, needs at 80 and the clock at 07:00 on day 1', () => {
    const h = fresh();
    expect(h.funds).toBe(START_FUNDS.empty);
    expect(h.clock).toBe(7 * 60);
    expect(dayOf(h.clock)).toBe(1);
    expect(h.gnome.needs).toEqual(ALL(80));
    expect(h.gnome.job).toBeNull();
    expect(h.lot.items).toEqual([]);
  });

  it('starter lot gets the starter funds', () => {
    const h = newHousehold({ householdName: 'x', gnomeName: 'y', trait: 'glutton', lot: 'starter' });
    expect(h.funds).toBe(START_FUNDS.starter);
  });
});

describe('decay and use', () => {
  it('decays by DECAY per sim hour with the trait multiplier (neat halves hygiene)', () => {
    const g = fresh('neat').gnome;
    decayNeeds(g, 60);
    expect(g.needs.hunger).toBeCloseTo(80 - 4.2);
    expect(g.needs.hygiene).toBeCloseTo(80 - 2.6 * 0.5);
  });

  it('decays at WORK_NEED_RATE while at work', () => {
    const g = fresh('neat').gnome;
    decayNeeds(g, 60, true);
    expect(g.needs.hunger).toBeCloseTo(80 - 4.2 * 0.6);
  });

  it('clamps needs to 0..100', () => {
    const g = fresh().gnome;
    g.needs = ALL(1);
    decayNeeds(g, 600);
    expect(Math.min(...Object.values(g.needs))).toBe(0);
    g.needs = ALL(99);
    applyUse(g, { action: 'sleep', verb: '', pose: 'lie', at: 'on', rates: { energy: 14 }, maxMinutes: 600 }, 600);
    expect(g.needs.energy).toBe(100);
  });

  it('applyUse fills by rate per sim hour; negative rates lower', () => {
    const g = fresh().gnome;
    g.needs = ALL(50);
    const bed: UseDef = { action: 'sleep', verb: '', pose: 'lie', at: 'on', rates: { energy: 14, hygiene: -0.5 }, maxMinutes: 600 };
    applyUse(g, bed, 30);
    expect(g.needs.energy).toBeCloseTo(57);
    expect(g.needs.hygiene).toBeCloseTo(49.75);
    expect(g.needs.hunger).toBe(50);
  });

  it('pickNeed returns the lowest need under ACT_BELOW, ties in NEEDS order, else null', () => {
    const g = fresh().gnome;
    g.needs = ALL(80);
    expect(pickNeed(g)).toBeNull();
    g.needs = { hunger: 30, energy: 10, bladder: 10, hygiene: 40, fun: 44 };
    expect(pickNeed(g)).toBe('energy');
    g.needs = { hunger: 30, energy: 60, bladder: 60, hygiene: 60, fun: 20 };
    expect(pickNeed(g)).toBe('fun');
  });
});

describe('moodOf', () => {
  it('is the weighted mean when nothing is critical', () => {
    expect(moodOf(ALL(80))).toBe(80);
  });

  it('takes 8 off for each need under CRITICAL', () => {
    // weights 1, 1, 1.2, 0.8, 1 (total 5); hunger at 10 gives (80*5 - 70) / 5 = 66, minus 8 = 58
    expect(moodOf({ ...ALL(80), hunger: 10 })).toBe(58);
  });

  it('clamps to 0..100', () => {
    expect(moodOf(ALL(0))).toBe(0);
  });
});

describe('advance', () => {
  it('decays and uses over the interval, then moves the clock', () => {
    const h = fresh();
    const bed: UseDef = { action: 'sleep', verb: '', pose: 'lie', at: 'on', rates: { energy: 14 }, maxMinutes: 600 };
    h.gnome.needs = ALL(50);
    const events = advance(h, 60, bed);
    expect(events).toEqual([]);
    expect(h.clock).toBe(7 * 60 + 60);
    expect(h.gnome.needs.energy).toBeCloseTo(50 - 3.4 + 14);
  });

  it('charges bills and emits newDay when crossing midnight', () => {
    const h = fresh();
    h.clock = 23 * 60;
    const events = advance(h, 120, null);
    expect(events).toEqual([
      { type: 'bills', amount: BILLS_PER_DAY, paid: true },
      { type: 'newDay', day: 2 },
    ]);
    expect(h.funds).toBe(START_FUNDS.empty - BILLS_PER_DAY);
    expect(dayOf(h.clock)).toBe(2);
  });

  it('marks bills unpaid when funds run short and lets funds go negative', () => {
    const h = fresh();
    h.funds = 10;
    h.clock = 1439;
    const events = advance(h, 2, null);
    expect(events[0]).toEqual({ type: 'bills', amount: BILLS_PER_DAY, paid: false });
    expect(h.funds).toBe(10 - BILLS_PER_DAY);
  });

  it('handles several midnights in one call', () => {
    const h = fresh();
    h.funds = 1000;
    h.clock = 0;
    const events = advance(h, 2 * 1440 + 10, null);
    const days = events.filter((e) => e.type === 'newDay').map((e) => (e.type === 'newDay' ? e.day : 0));
    expect(days).toEqual([2, 3]);
    expect(events.filter((e) => e.type === 'bills')).toHaveLength(2);
    expect(h.funds).toBe(1000 - 2 * BILLS_PER_DAY);
    expect(h.clock).toBe(2 * 1440 + 10);
  });

  it('samples mood while at work and not otherwise', () => {
    const h = fresh();
    h.gnome.job = 'gardener';
    startShift(h);
    advance(h, 30, null);
    expect(h.gnome.shiftMood.n).toBe(30);
    expect(h.gnome.shiftMood.sum).toBeGreaterThan(0);
    h.clock = h.gnome.workUntil!;
    advance(h, 30, null);
    expect(h.gnome.shiftMood.n).toBe(30);
  });
});

describe('shifts', () => {
  function gardenerAt(clock: number): Household {
    const h = fresh();
    h.gnome.job = 'gardener';
    h.clock = clock; // day 1 is a Monday (0): a gardener work day
    return h;
  }

  it('is a work day for the gardener on day 1 and not on a Saturday', () => {
    const h = gardenerAt(8 * 60);
    expect(isWorkDay(h)).toBe(true);
    h.clock = 5 * 1440 + 8 * 60; // day 6, Saturday
    expect(isWorkDay(h)).toBe(false);
    expect(isWorkDay(fresh())).toBe(false);
  });

  it('is due inside the hour from startHour, once a day, only when home', () => {
    expect(shiftDue(gardenerAt(8 * 60 + 30))).toBe(true);
    expect(shiftDue(gardenerAt(8 * 60 - 1))).toBe(false);
    expect(shiftDue(gardenerAt(9 * 60))).toBe(false);

    const started = gardenerAt(8 * 60 + 5);
    startShift(started);
    expect(shiftDue(started)).toBe(false);

    const done = gardenerAt(8 * 60 + 5);
    done.gnome.lastShiftDay = dayOf(done.clock);
    expect(shiftDue(done)).toBe(false);
  });

  it('startShift sets workUntil to the job length from now, and endShiftDue follows it', () => {
    const h = gardenerAt(8 * 60);
    startShift(h);
    expect(h.gnome.workUntil).toBe(8 * 60 + JOBS.gardener.hours * 60);
    expect(h.gnome.lastShiftDay).toBe(1);
    expect(endShiftDue(h)).toBe(false);
    h.clock = h.gnome.workUntil!;
    expect(endShiftDue(h)).toBe(true);
  });

  it('a good shift pays, counts and clears workUntil', () => {
    const h = gardenerAt(8 * 60);
    startShift(h);
    h.gnome.shiftMood = { sum: 60 * 100, n: 100 }; // mean 60
    const funds = h.funds;
    const ev = finishShift(h);
    // 70 * (0.5 + 0.5 * 0.6) = 56
    expect(ev).toEqual({ type: 'shiftEnd', pay: 56, promoted: false, good: true, title: 'Weed Puller' });
    expect(h.funds).toBe(funds + 56);
    expect(h.gnome.shifts).toBe(1);
    expect(h.gnome.workUntil).toBeNull();
    expect(h.gnome.shiftMood).toEqual({ sum: 0, n: 0 });
  });

  it('promotes on a good shift that reaches shiftsToPromote, with the new title', () => {
    const h = gardenerAt(8 * 60);
    h.gnome.shifts = JOBS.gardener.levels[0].shiftsToPromote - 1;
    startShift(h);
    h.gnome.shiftMood = { sum: 100 * 100, n: 100 };
    const ev = finishShift(h);
    expect(ev.promoted).toBe(true);
    expect(ev.title).toBe('Hedge Trimmer');
    expect(h.gnome.jobLevel).toBe(1);
    expect(h.gnome.shifts).toBe(0);
    // pay uses the level worked: 70 at full mood
    expect(ev.pay).toBe(70);
  });

  it('a bad shift pays but does not count or promote', () => {
    const h = gardenerAt(8 * 60);
    h.gnome.shifts = JOBS.gardener.levels[0].shiftsToPromote - 1;
    startShift(h);
    h.gnome.shiftMood = { sum: 20 * 100, n: 100 };
    const ev = finishShift(h);
    // 70 * (0.5 + 0.5 * 0.2) = 42
    expect(ev).toEqual({ type: 'shiftEnd', pay: 42, promoted: false, good: false, title: 'Weed Puller' });
    expect(h.gnome.shifts).toBe(JOBS.gardener.levels[0].shiftsToPromote - 1);
    expect(h.gnome.jobLevel).toBe(0);
  });

  it('the hustler trait multiplies pay by 1.2', () => {
    const h = gardenerAt(8 * 60);
    h.gnome.trait = 'hustler';
    startShift(h);
    h.gnome.shiftMood = { sum: 100 * 100, n: 100 };
    expect(finishShift(h).pay).toBe(84);
  });
});

describe('sanitize', () => {
  it('round-trips a saved household through JSON', () => {
    const h = fresh();
    h.lot.edges['h:2,2'] = 'wall';
    const back = sanitize(JSON.parse(JSON.stringify(h)));
    expect(back).not.toBeNull();
    expect(back!.name).toBe(h.name);
    expect(back!.funds).toBe(h.funds);
    expect(back!.lot.edges).toEqual({ 'h:2,2': 'wall' });
  });

  it('rejects anything that is not a household', () => {
    expect(sanitize(null)).toBeNull();
    expect(sanitize('save')).toBeNull();
    expect(sanitize({})).toBeNull();
    expect(sanitize({ ...fresh(), version: 2 })).toBeNull();
    expect(sanitize({ ...fresh(), funds: 'lots' })).toBeNull();
    expect(sanitize({ ...fresh(), clock: Number.NaN })).toBeNull();
    expect(sanitize({ ...fresh(), gnome: undefined })).toBeNull();
    expect(sanitize({ ...fresh(), lot: null })).toBeNull();
  });

  it('clamps needs and fills missing gnome fields', () => {
    const raw = JSON.parse(JSON.stringify(fresh()));
    raw.gnome.needs = { hunger: 500, energy: -5, bladder: 'x' };
    delete raw.gnome.shiftMood;
    const h = sanitize(raw)!;
    expect(h.gnome.needs.hunger).toBe(100);
    expect(h.gnome.needs.energy).toBe(0);
    expect(h.gnome.needs.bladder).toBe(80);
    expect(h.gnome.needs.fun).toBe(80);
    expect(h.gnome.shiftMood).toEqual({ sum: 0, n: 0 });
  });

  it('drops edges with an unknown kind or bad key, and items with an unknown kind', () => {
    const raw = JSON.parse(JSON.stringify(fresh()));
    raw.lot.edges = { 'h:1,1': 'wall', 'v:1,1': 'portal', 'nope': 'wall', 'v:3,3': 'window' };
    raw.lot.items = [
      { id: 4, kind: 'bed', tx: 1, ty: 1, rot: 0 },
      { id: 9, kind: 'dragon', tx: 2, ty: 2, rot: 0 },
      { id: 7, kind: 'lamp', tx: 3, ty: 3, rot: 9 },
    ];
    raw.lot.nextId = 2;
    const h = sanitize(raw)!;
    expect(h.lot.edges).toEqual({ 'h:1,1': 'wall', 'v:3,3': 'window' });
    expect(h.lot.items.map((i) => i.kind)).toEqual(['bed']);
    expect(h.lot.nextId).toBe(5);
  });

  it('falls back to neat for an unknown trait and clamps the job level', () => {
    const raw = JSON.parse(JSON.stringify(fresh()));
    raw.gnome.trait = 'wizard';
    raw.gnome.job = 'gardener';
    raw.gnome.jobLevel = 99;
    const h = sanitize(raw)!;
    expect(h.gnome.trait).toBe('neat');
    expect(h.gnome.job).toBe('gardener');
    expect(h.gnome.jobLevel).toBe(JOBS.gardener.levels.length - 1);
  });
});

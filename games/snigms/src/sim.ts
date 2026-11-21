// Needs, mood, clock, bills and jobs as pure functions of the Household. No THREE, no DOM.
import {
  ACT_BELOW, BILLS_PER_DAY, CRITICAL, DECAY, FLOORS, FURNITURE, GOOD_SHIFT_MOOD, JOB_IDS, JOBS, LOT_H, LOT_W,
  MOOD_WEIGHT, NEEDS, START_FUNDS, TRAITS, WAKE_HOUR, WORK_NEED_RATE,
} from './config';
import type {
  EdgeKey, EdgeKind, FloorKind, GnomeState, Household, JobId, Lot, NeedId, Needs, NewHouseholdOptions, PlacedItem, Rot,
  TraitId, UseDef,
} from './types';
import { newLot, starterLot } from './world';

const FULL: Needs = { hunger: 80, energy: 80, bladder: 80, hygiene: 80, fun: 80 };

export type SimEvent =
  | { type: 'newDay'; day: number }
  | { type: 'bills'; amount: number; paid: boolean }
  | { type: 'shiftStart'; job: JobId }
  | { type: 'shiftEnd'; pay: number; promoted: boolean; good: boolean; title: string };

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number): number => (isNum(v) ? v : fallback);
const hasKey = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

export function newHousehold(o: NewHouseholdOptions): Household {
  const gnome: GnomeState = {
    name: o.gnomeName, trait: o.trait, needs: { ...FULL }, job: null, jobLevel: 0, shifts: 0,
    workUntil: null, lastShiftDay: 0, shiftMood: { sum: 0, n: 0 },
  };
  return {
    version: 1, name: o.householdName, funds: START_FUNDS[o.lot], clock: WAKE_HOUR * 60, gnome,
    lot: o.lot === 'starter' ? starterLot() : newLot(),
  };
}

/** Weighted mean of the needs 0..100 (MOOD_WEIGHT), with a penalty for each need under CRITICAL. */
export function moodOf(needs: Needs): number {
  let sum = 0;
  let weights = 0;
  let low = 0;
  for (const n of NEEDS) {
    sum += needs[n] * MOOD_WEIGHT[n];
    weights += MOOD_WEIGHT[n];
    if (needs[n] < CRITICAL) low += 1;
  }
  const mood = clamp(sum / weights - 8 * low, 0, 100);
  return Math.round(mood * 10) / 10;
}
export function dayOf(clock: number): number {
  return Math.floor(clock / 1440) + 1;
}
export function minuteOfDay(clock: number): number {
  return ((clock % 1440) + 1440) % 1440;
}
/** 0..6; day 1 is 0. */
export function dayOfWeek(clock: number): number {
  return (dayOf(clock) - 1) % 7;
}
/** 'Day 3 · 14:05' */
export function formatClock(clock: number): string {
  const m = Math.floor(minuteOfDay(clock));
  return `Day ${dayOf(clock)} · ${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Lower every need by DECAY[need] * traitMultiplier * simMinutes / 60 (times WORK_NEED_RATE when atWork), clamped 0..100. */
export function decayNeeds(g: GnomeState, simMinutes: number, atWork = false): void {
  const traitDecay = TRAITS[g.trait].decay;
  for (const n of NEEDS) {
    const perHour = DECAY[n] * (traitDecay[n] ?? 1) * (atWork ? WORK_NEED_RATE : 1);
    g.needs[n] = clamp(g.needs[n] - (perHour * simMinutes) / 60, 0, 100);
  }
}
/** Raise needs by use.rates * simMinutes / 60 (a negative rate lowers), clamped 0..100. */
export function applyUse(g: GnomeState, use: UseDef, simMinutes: number): void {
  for (const n of NEEDS) {
    const rate = use.rates[n];
    if (rate === undefined) continue;
    g.needs[n] = clamp(g.needs[n] + (rate * simMinutes) / 60, 0, 100);
  }
}
/** The lowest need that is under ACT_BELOW (ties: NEEDS order), else null. */
export function pickNeed(g: GnomeState): NeedId | null {
  let best: NeedId | null = null;
  for (const n of NEEDS) {
    if (g.needs[n] < ACT_BELOW && (best === null || g.needs[n] < g.needs[best])) best = n;
  }
  return best;
}

export function isWorkDay(h: Household): boolean {
  const job = h.gnome.job;
  return job !== null && JOBS[job].workdays.includes(dayOfWeek(h.clock));
}
/** True when there is a job, the gnome is home, today is a work day, no shift has started today, and the time is from startHour to startHour + 1h. */
export function shiftDue(h: Household): boolean {
  const g = h.gnome;
  if (g.job === null || g.workUntil !== null) return false;
  if (!isWorkDay(h)) return false;
  if (g.lastShiftDay === dayOf(h.clock)) return false;
  const start = JOBS[g.job].startHour * 60;
  const m = minuteOfDay(h.clock);
  return m >= start && m < start + 60;
}
/** Sets workUntil = clock + hours * 60, lastShiftDay = today, clears shiftMood. */
export function startShift(h: Household): void {
  const g = h.gnome;
  if (g.job === null) return;
  g.workUntil = h.clock + JOBS[g.job].hours * 60;
  g.lastShiftDay = dayOf(h.clock);
  g.shiftMood = { sum: 0, n: 0 };
}
export function endShiftDue(h: Household): boolean {
  return h.gnome.workUntil !== null && h.clock >= h.gnome.workUntil;
}
/** Pays (level pay * (0.5 + 0.5 * meanShiftMood / 100) * trait pay), counts the shift and promotes when shifts reach shiftsToPromote (only on a good shift: mean mood >= GOOD_SHIFT_MOOD). Clears workUntil. */
export function finishShift(h: Household): Extract<SimEvent, { type: 'shiftEnd' }> {
  const g = h.gnome;
  if (g.job === null) {
    g.workUntil = null;
    return { type: 'shiftEnd', pay: 0, promoted: false, good: false, title: '' };
  }
  const job = JOBS[g.job];
  const level = job.levels[g.jobLevel] ?? job.levels[0];
  const meanMood = g.shiftMood.sum / Math.max(1, g.shiftMood.n);
  const pay = Math.round(level.pay * (0.5 + (0.5 * meanMood) / 100) * (TRAITS[g.trait].pay ?? 1));
  const good = meanMood >= GOOD_SHIFT_MOOD;
  let promoted = false;
  if (good) {
    g.shifts += 1;
    if (g.shifts >= level.shiftsToPromote && g.jobLevel + 1 < job.levels.length) {
      g.jobLevel += 1;
      g.shifts = 0;
      promoted = true;
    }
  }
  h.funds += pay;
  g.workUntil = null;
  g.shiftMood = { sum: 0, n: 0 };
  return { type: 'shiftEnd', pay, promoted, good, title: (job.levels[g.jobLevel] ?? level).title };
}
export function setJob(h: Household, id: JobId | null): void {
  h.gnome.job = id;
  h.gnome.jobLevel = 0;
  h.gnome.shifts = 0;
}

/**
 * The master tick: advance the clock by simMinutes; apply `using` (or decay when null; at work uses the work rate and samples shiftMood);
 * at each midnight crossed charge BILLS_PER_DAY (funds may go negative: unpaid -> paid false) and emit newDay. Does NOT start or end shifts:
 * the brain does that (shiftDue / startShift / endShiftDue / finishShift).
 */
export function advance(h: Household, simMinutes: number, using: UseDef | null): SimEvent[] {
  const events: SimEvent[] = [];
  if (simMinutes <= 0) return events;
  const g = h.gnome;
  const atWork = g.workUntil !== null && h.clock < g.workUntil;
  decayNeeds(g, simMinutes, atWork);
  if (using) applyUse(g, using, simMinutes);
  if (atWork) {
    g.shiftMood.sum += moodOf(g.needs) * simMinutes;
    g.shiftMood.n += simMinutes;
  }

  const before = h.clock;
  const after = before + simMinutes;
  for (let day = dayOf(before) + 1; day <= dayOf(after); day++) {
    const fundsBefore = h.funds;
    h.funds -= BILLS_PER_DAY;
    events.push({ type: 'bills', amount: BILLS_PER_DAY, paid: fundsBefore >= BILLS_PER_DAY });
    events.push({ type: 'newDay', day });
  }
  h.clock = after;
  return events;
}

// ---- save sanitising ----

function sanitizeNeeds(raw: unknown): Needs {
  const src = isObj(raw) ? raw : {};
  const needs = { ...FULL };
  for (const n of NEEDS) needs[n] = clamp(num(src[n], 80), 0, 100);
  return needs;
}

function sanitizeGnome(g: Record<string, unknown>): GnomeState {
  const trait: TraitId = typeof g.trait === 'string' && hasKey(TRAITS, g.trait) ? (g.trait as TraitId) : 'neat';
  const job: JobId | null = typeof g.job === 'string' && (JOB_IDS as string[]).includes(g.job) ? (g.job as JobId) : null;
  const jobLevel = job === null ? 0 : clamp(Math.floor(num(g.jobLevel, 0)), 0, JOBS[job].levels.length - 1);
  const sm = isObj(g.shiftMood) ? g.shiftMood : {};
  return {
    name: typeof g.name === 'string' ? g.name : 'Gnorman',
    trait,
    needs: sanitizeNeeds(g.needs),
    job,
    jobLevel,
    shifts: Math.max(0, Math.floor(num(g.shifts, 0))),
    workUntil: isNum(g.workUntil) ? g.workUntil : null,
    lastShiftDay: Math.max(0, Math.floor(num(g.lastShiftDay, 0))),
    shiftMood: { sum: Math.max(0, num(sm.sum, 0)), n: Math.max(0, num(sm.n, 0)) },
  };
}

const EDGE_KEY = /^[hv]:-?\d+,-?\d+$/;
const TILE_KEY = /^\d+,\d+$/;

function sanitizeLot(l: Record<string, unknown>): Lot {
  const w = Number.isInteger(l.w) && (l.w as number) > 0 ? (l.w as number) : LOT_W;
  const h = Number.isInteger(l.h) && (l.h as number) > 0 ? (l.h as number) : LOT_H;

  const edges: Record<EdgeKey, EdgeKind> = {};
  if (isObj(l.edges)) {
    for (const [k, v] of Object.entries(l.edges)) {
      if (EDGE_KEY.test(k) && (v === 'wall' || v === 'door' || v === 'window')) edges[k] = v;
    }
  }

  const floors: Record<string, FloorKind> = {};
  if (isObj(l.floors)) {
    for (const [k, v] of Object.entries(l.floors)) {
      if (TILE_KEY.test(k) && typeof v === 'string' && (FLOORS as string[]).includes(v)) floors[k] = v as FloorKind;
    }
  }

  const items: PlacedItem[] = [];
  const seen = new Set<number>();
  if (Array.isArray(l.items)) {
    for (const raw of l.items) {
      if (!isObj(raw)) continue;
      const { id, kind, tx, ty, rot } = raw;
      if (!isNum(id) || typeof kind !== 'string' || !hasKey(FURNITURE, kind)) continue;
      if (!isNum(tx) || !isNum(ty) || seen.has(id)) continue;
      if (rot !== 0 && rot !== 1 && rot !== 2 && rot !== 3) continue;
      seen.add(id);
      items.push({ id, kind, tx, ty, rot: rot as Rot });
    }
  }
  const nextId = items.reduce((max, it) => Math.max(max, it.id), 0) + 1;

  return { w, h, edges, items, nextId, floors };
}

/** Rebuild a Household from untrusted JSON (saved game); null if it is not one. Fill missing fields, clamp numbers. */
export function sanitize(raw: unknown): Household | null {
  if (!isObj(raw) || raw.version !== 1) return null;
  const { name, funds, clock, gnome, lot } = raw;
  if (typeof name !== 'string' || !isNum(funds) || !isNum(clock)) return null;
  if (!isObj(gnome) || !isObj(lot)) return null;
  return { version: 1, name, funds, clock, gnome: sanitizeGnome(gnome), lot: sanitizeLot(lot) };
}

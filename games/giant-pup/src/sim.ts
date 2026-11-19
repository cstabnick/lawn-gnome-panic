// Pure pet simulation: plain data in, plain data out. No THREE, no DOM.
import {
  AWAY_FLOOR,
  AWAY_RATE,
  DECAY_PER_MIN,
  DEFAULT_DOG_NAME,
  FEED_AMOUNT,
  FETCH_ENERGY_COST,
  FETCH_FUN,
  NAP_ENERGY_PER_SEC,
  PET_AFFECTION_PER_PIXEL,
  PET_PER_PIXEL,
  PRAISE_GAIN,
  SCRUB_PER_PIXEL,
  TRICKS,
  TRICK_BASE,
  TRICK_GAIN_FAIL,
  TRICK_GAIN_SUCCESS,
  WATER_AMOUNT,
  type TrickId,
} from './config';

export type Need = 'hunger' | 'thirst' | 'fun' | 'clean' | 'energy';
export const NEEDS: readonly Need[] = ['hunger', 'thirst', 'fun', 'clean', 'energy'];

export interface PetState {
  name: string;
  /** 0..100, 100 = fully satisfied (hunger 100 = full). */
  hunger: number;
  thirst: number;
  fun: number;
  clean: number;
  energy: number;
  /** 0..100, grows slowly with care and never decays. */
  affection: number;
  /** 0..1 skill per trick; 1 = always does it. */
  tricks: Record<TrickId, number>;
  fetches: number;
  /** Date.now() of the last save, for offline decay. */
  lastSeen: number;
}

export type Mood = 'ecstatic' | 'happy' | 'okay' | 'sad' | 'sleepy' | 'hungry' | 'thirsty' | 'stinky';

const clamp = (v: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, v));

export function newPet(now: number, name = DEFAULT_DOG_NAME): PetState {
  return {
    name,
    hunger: 70,
    thirst: 70,
    fun: 60,
    clean: 80,
    energy: 90,
    affection: 0,
    tricks: Object.fromEntries(TRICKS.map((t) => [t, 0])) as Record<TrickId, number>,
    fetches: 0,
    lastSeen: now,
  };
}

/** Needs fall while the game is open. dt in seconds. */
export function decay(s: PetState, dt: number): void {
  const m = dt / 60;
  for (const n of NEEDS) s[n] = clamp(s[n] - DECAY_PER_MIN[n] * m);
}

/** Apply time away since s.lastSeen (slower, floored), then stamp lastSeen = now. */
export function catchUp(s: PetState, now: number): void {
  const awaySec = Math.max(0, (now - s.lastSeen) / 1000);
  const m = (awaySec / 60) * AWAY_RATE;
  for (const n of NEEDS) {
    if (s[n] <= AWAY_FLOOR) continue;
    s[n] = Math.max(AWAY_FLOOR, s[n] - DECAY_PER_MIN[n] * m);
  }
  s.lastSeen = now;
}

export function feed(s: PetState): void {
  s.hunger = clamp(s.hunger + FEED_AMOUNT);
  s.affection = clamp(s.affection + 1);
}

export function water(s: PetState): void {
  s.thirst = clamp(s.thirst + WATER_AMOUNT);
}

/** Stroking the dog: px = pointer distance moved over the dog this frame. */
export function pet(s: PetState, px: number): void {
  s.fun = clamp(s.fun + px * PET_PER_PIXEL);
  s.affection = clamp(s.affection + px * PET_AFFECTION_PER_PIXEL);
}

/** Scrubbing in the bath: px = pointer distance moved over the dog this frame. */
export function scrub(s: PetState, px: number): void {
  s.clean = clamp(s.clean + px * SCRUB_PER_PIXEL);
}

/** The dog brought the ball back. */
export function fetchDone(s: PetState): void {
  s.fun = clamp(s.fun + FETCH_FUN);
  s.energy = clamp(s.energy - FETCH_ENERGY_COST);
  s.clean = clamp(s.clean - 3);
  s.affection = clamp(s.affection + 1.5);
  s.fetches += 1;
}

export function nap(s: PetState, dt: number): void {
  s.energy = clamp(s.energy + NAP_ENERGY_PER_SEC * dt);
}

/** 0..1: how willing the dog is right now. */
export function willingness(s: PetState): number {
  const avg = (s.hunger + s.thirst + s.fun + s.energy) / 400;
  return Math.max(0.3, Math.min(1, 0.4 + avg * 0.6 + s.affection / 500));
}

/** Chance (0..1) that the dog does trick t when asked. */
export function trickChance(s: PetState, t: TrickId): number {
  return (TRICK_BASE + (1 - TRICK_BASE) * s.tricks[t]) * willingness(s);
}

/** Resolve a trick attempt with a random roll in [0,1). Returns true on success and updates skill. */
export function attemptTrick(s: PetState, t: TrickId, roll: number): boolean {
  const ok = s.tricks[t] >= 1 || roll < trickChance(s, t);
  s.tricks[t] = Math.min(1, s.tricks[t] + (ok ? TRICK_GAIN_SUCCESS : TRICK_GAIN_FAIL));
  if (ok) s.fun = clamp(s.fun + 3);
  return ok;
}

/** Petting right after a trick. */
export function praise(s: PetState, t: TrickId): void {
  s.tricks[t] = Math.min(1, s.tricks[t] + PRAISE_GAIN);
  s.affection = clamp(s.affection + 2);
}

export function mood(s: PetState): Mood {
  if (s.energy < 20) return 'sleepy';
  if (s.hunger < 25) return 'hungry';
  if (s.thirst < 25) return 'thirsty';
  if (s.clean < 25) return 'stinky';
  const avg = (s.hunger + s.thirst + s.fun + s.clean + s.energy) / 5;
  if (avg > 85 && s.fun > 80) return 'ecstatic';
  if (avg > 65) return 'happy';
  if (avg > 40) return 'okay';
  return 'sad';
}

/** 0..1 overall happiness, drives tail wag and bounce. */
export function happiness(s: PetState): number {
  return (s.hunger + s.thirst + s.fun + s.clean + s.energy) / 500;
}

/** Repair a loaded save: fill missing fields, clamp numbers. Returns null if it is not a pet at all. */
export function sanitize(raw: unknown, now: number): PetState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<PetState>;
  const s = newPet(now, typeof r.name === 'string' && r.name.trim() ? r.name.slice(0, 16) : DEFAULT_DOG_NAME);
  for (const n of NEEDS) if (typeof r[n] === 'number' && Number.isFinite(r[n])) s[n] = clamp(r[n] as number);
  if (typeof r.affection === 'number' && Number.isFinite(r.affection)) s.affection = clamp(r.affection);
  if (typeof r.fetches === 'number' && Number.isFinite(r.fetches)) s.fetches = Math.max(0, Math.floor(r.fetches));
  if (typeof r.lastSeen === 'number' && Number.isFinite(r.lastSeen)) s.lastSeen = Math.min(now, r.lastSeen);
  if (r.tricks && typeof r.tricks === 'object') {
    for (const t of TRICKS) {
      const v = (r.tricks as Record<string, unknown>)[t];
      if (typeof v === 'number' && Number.isFinite(v)) s.tricks[t] = Math.max(0, Math.min(1, v));
    }
  }
  return s;
}

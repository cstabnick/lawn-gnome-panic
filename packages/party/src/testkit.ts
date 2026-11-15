// The slice contract test. A game that surfaces slices runs it from src/minigames/minigames.test.ts:
//   import { testMinigame } from '@lawn/party/testkit'; import { minigames } from '.';
//   for (const m of minigames) testMinigame(m);
// It plays the slice headless with 4 CPUs (no view, no WebGL) and checks the rules in packages/party/README.md.
import { describe, expect, it } from 'vitest';
import { GNORMAN_LOOK } from '@lawn/gnome';
import { mulberry32 } from './rng';
import { DEFAULT_CPU_NAMES, DEFAULT_SEAT_COLORS } from './seats';
import { STEP_S, type AnyMinigame, type SeatIndex, type SeatInfo } from './types';

export const MAX_STATE_BYTES = 2048;

export interface HeadlessRun {
  places: number[];
  /** Seconds of play until result() returned places. */
  seconds: number;
  timeUp: boolean;
  /** Largest JSON size of the state seen (sampled 15 times a second). */
  maxStateBytes: number;
}

function cpuSeats(): SeatInfo[] {
  return ([0, 1, 2, 3] as SeatIndex[]).map((seat) => ({
    seat,
    name: DEFAULT_CPU_NAMES[seat],
    look: { ...GNORMAN_LOOK, hat: DEFAULT_SEAT_COLORS[seat] },
    color: DEFAULT_SEAT_COLORS[seat],
    cpu: true,
  }));
}

/** True for values that survive a JSON round trip: no undefined, NaN, Infinity, functions, holes or class instances. */
function isPlainJson(v: unknown): boolean {
  if (v === null) return true;
  switch (typeof v) {
    case 'string':
    case 'boolean':
      return true;
    case 'number':
      return Number.isFinite(v);
    case 'object': {
      if (Array.isArray(v)) {
        for (let i = 0; i < v.length; i++) if (!(i in v) || !isPlainJson(v[i])) return false;
        return true;
      }
      const proto = Object.getPrototypeOf(v);
      if (proto !== Object.prototype && proto !== null) return false;
      return Object.keys(v).every((k) => isPlainJson((v as Record<string, unknown>)[k]));
    }
    default:
      return false;
  }
}

/** Structural equality for JSON-shaped values. */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every(
    (k) =>
      Object.prototype.hasOwnProperty.call(b, k) &&
      deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  );
}

/** Checks that the state is plain JSON at this step (its JSON re-parses to the same value); returns its JSON size. */
function sampleState(def: AnyMinigame, s: unknown, step: number): number {
  if (!isPlainJson(s)) throw new Error(`${def.meta.id}: state is not plain JSON at step ${step}`);
  const json = JSON.stringify(s);
  if (!deepEqual(JSON.parse(json), s)) throw new Error(`${def.meta.id}: state does not survive JSON at step ${step}`);
  return json.length;
}

/** Plays def with 4 CPU seats from seed to the end, exactly like the runner's host does (minus the countdown). */
export function runHeadless(def: AnyMinigame, seed: number, seats: SeatInfo[] = cpuSeats()): HeadlessRun {
  const rng = mulberry32(seed);
  const s = def.init(seats, rng);
  const maxSteps = Math.ceil(def.meta.maxSeconds / STEP_S);
  let maxStateBytes = sampleState(def, s, 0);
  const sampleEvery = Math.round(1 / STEP_S / 15);
  for (let i = 1; i <= maxSteps; i++) {
    const inputs = seats.map((seat) => (seat.cpu ? def.cpu(s, seat.seat, rng) : null));
    def.step(s, inputs, STEP_S, rng);
    if (i % sampleEvery === 0) maxStateBytes = Math.max(maxStateBytes, sampleState(def, s, i));
    const places = def.result(s, false);
    if (places) {
      sampleState(def, s, i);
      return { places, seconds: i * STEP_S, timeUp: false, maxStateBytes };
    }
  }
  const places = def.result(s, true);
  if (!places) throw new Error(`${def.meta.id}: result(s, true) returned null at the time cap`);
  maxStateBytes = Math.max(maxStateBytes, sampleState(def, s, maxSteps));
  return { places, seconds: def.meta.maxSeconds, timeUp: true, maxStateBytes };
}

/** Checks that a list of places is well formed: 4 integers in 0..3, the best is 0, ties share. */
export function checkPlaces(places: readonly number[]): string | null {
  if (places.length !== 4) return `expected 4 places, got ${places.length}`;
  if (!places.every((p) => Number.isInteger(p) && p >= 0 && p <= 3)) return `places must be integers 0..3: ${places}`;
  if (Math.min(...places) !== 0) return `someone must be 1st (place 0): ${places}`;
  // A place p means exactly p seats did better.
  for (const p of places) {
    const better = places.filter((q) => q < p).length;
    if (better !== p) return `place ${p} but ${better} seats did better: ${places}`;
  }
  return null;
}

/** The contract test for one slice: registers vitest tests. */
export function testMinigame(def: AnyMinigame, seeds: readonly number[] = [1, 2, 3, 4, 5]): void {
  describe(`party slice ${def.meta.id}`, () => {
    it('has valid meta', () => {
      const m = def.meta;
      expect(m.id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(m.title.length).toBeGreaterThan(0);
      expect(m.game.length).toBeGreaterThan(0);
      expect(m.goal.length).toBeGreaterThan(0);
      expect(m.controls.length).toBeGreaterThan(0);
      expect(m.maxSeconds).toBeGreaterThanOrEqual(15);
      expect(m.maxSeconds).toBeLessThanOrEqual(90);
    });

    it('state is plain JSON', () => {
      const s = def.init(cpuSeats(), mulberry32(1));
      expect(JSON.parse(JSON.stringify(s))).toEqual(s);
    });

    for (const seed of seeds) {
      it(`4 CPUs finish with valid places (seed ${seed})`, () => {
        const run = runHeadless(def, seed);
        expect(checkPlaces(run.places)).toBeNull();
        expect(run.maxStateBytes).toBeLessThan(MAX_STATE_BYTES);
      });
    }

    it('is deterministic for a seed', () => {
      expect(runHeadless(def, seeds[0]).places).toEqual(runHeadless(def, seeds[0]).places);
    });
  });
}

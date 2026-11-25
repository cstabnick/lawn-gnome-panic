// Weather runtime (E06). One module-level state the whole game reads: what the player is standing in (faded), whether
// the player wants to see it, and a forced override for the trainer, demos and ?weather=. The schedule itself is pure
// (schedule.ts); the particles and clouds are in render.ts; the Options row and ?weather= are in options.ts.
//
// Online: weather is a pure function of wall-clock blocks and region (schedule.ts), so peers agree with nothing on the
// wire. Weather on/off and the particle budget are local view choices (like Water waves). A forced kind is local too.
import { regionAt } from '../levels';
import { stepWeather, weatherForTime } from './schedule';
import type { RegionId, WeatherKind, WeatherState } from './types';

export type { RegionId, WeatherKind, WeatherState } from './types';
export { weatherForTime, stepWeather } from './schedule';

let current: WeatherState = { kind: 'clear', intensity: 0 };
let enabled = true;
let forced: WeatherState | null = null;
let lastRegion: RegionId = 'turfton';
const listeners = new Set<(w: WeatherState) => void>();

/** Wall-clock seconds (overridable in tests). */
let clock: () => number = () => Date.now() / 1000;

/** The weather where the player is, faded (what the sky shows). Gameplay reads this whether or not it is drawn. */
export function getWeather(): WeatherState {
  return current;
}

/** The scheduled weather in `region` right now (no fade; a forced kind wins). Fishing, E12 and quests read this. */
export function weatherAt(region: RegionId): WeatherState {
  return forced ?? weatherForTime(clock(), region);
}

/** The scheduled weather at a world point. */
export function weatherAtPoint(x: number, z: number): WeatherState {
  return weatherAt(regionAt(x, z));
}

/** Show or hide weather (Options). Off: the particles and clouds leave the scene and the sky is not dimmed. */
export function setWeatherEnabled(on: boolean): void {
  enabled = on;
}

export function isWeatherEnabled(): boolean {
  return enabled;
}

/**
 * Force a kind everywhere (trainer, demos, ?weather=rain). `intensity` defaults to 1. null goes back to the schedule.
 * The fade still runs, so a forced change rolls in over a few seconds; pass `snap` to jump straight to it.
 */
export function forceWeather(kind: WeatherKind | null, intensity = 1, snap = false): void {
  forced = kind === null ? null : { kind, intensity: kind === 'clear' ? 0 : Math.max(0, Math.min(1, intensity)) };
  if (snap && forced) setCurrent({ ...forced });
}

export function forcedWeather(): WeatherState | null {
  return forced;
}

/** Called with the new state whenever the faded weather's kind changes. Returns an unsubscribe. */
export function onWeather(cb: (w: WeatherState) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function setCurrent(next: WeatherState): void {
  const changed = next.kind !== current.kind;
  current = next;
  if (changed) for (const cb of listeners) cb(current);
}

/** One frame (app.ts): fade toward the scheduled (or forced) weather of the region at (x, z). */
export function updateWeather(dt: number, x: number, z: number): WeatherState {
  lastRegion = regionAt(x, z);
  setCurrent(stepWeather(current, weatherAt(lastRegion), dt));
  return current;
}

/** The region the last update was in. */
export function weatherRegion(): RegionId {
  return lastRegion;
}

/** Tests only: reset the module state and pin the clock. */
export function _resetWeatherForTests(now?: () => number): void {
  current = { kind: 'clear', intensity: 0 };
  enabled = true;
  forced = null;
  lastRegion = 'turfton';
  listeners.clear();
  clock = now ?? (() => Date.now() / 1000);
}

// Weather schedule (E06): a pure function of wall-clock time and region, so every browser (online peers included) agrees
// with nothing on the wire, and tests can pin it. The runtime (index.ts) fades between the targets this returns.
import { CLIMATE, WEATHER } from './config';
import { WEATHER_KINDS, type RegionId, type WeatherKind, type WeatherState } from './types';

/** A 32-bit integer hash of `n` and a salt, as a float in [0, 1). */
export function hash01(n: number, salt: number): number {
  let h = (Math.floor(n) ^ Math.imul(salt, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

/** The weather block a wall-clock second falls in. */
export function weatherBlock(utcSeconds: number): number {
  return Math.floor(utcSeconds / WEATHER.blockSeconds);
}

/**
 * The scheduled weather in `region` at `utcSeconds` (seconds since 1970, e.g. Date.now() / 1000). Same inputs, same
 * answer, on every machine. Every region rolls the same number per block (a front passes over the whole map); its
 * climate decides what that roll means there.
 */
export function weatherForTime(utcSeconds: number, region: RegionId): WeatherState {
  const block = weatherBlock(utcSeconds);
  const roll = hash01(block, 1);
  const strength = hash01(block, 2);
  const climate = CLIMATE[region] ?? CLIMATE.turfton;
  let total = 0;
  for (const k of WEATHER_KINDS) total += climate.weights[k] ?? 0;
  let kind: WeatherKind = 'clear';
  if (total > 0) {
    let acc = 0;
    for (const k of WEATHER_KINDS) {
      const w = climate.weights[k] ?? 0;
      if (w <= 0) continue;
      acc += w / total;
      kind = k;
      if (roll < acc) break;
    }
  }
  if (kind === 'clear') return { kind, intensity: 0 };
  let intensity = WEATHER.minIntensity + (WEATHER.maxIntensity - WEATHER.minIntensity) * strength;
  if (kind === 'rain') intensity = Math.min(intensity, climate.rainMax ?? 1);
  return { kind, intensity };
}

/**
 * One fade step from `cur` toward `target` (returns a new object). Same kind: the intensity moves toward the target at
 * 1 / WEATHER.fadeSeconds per second. Another kind: the current one fades to 0 first, then the kind switches and
 * fades in. 'clear' at 0 is the resting state.
 */
export function stepWeather(cur: WeatherState, target: WeatherState, dt: number): WeatherState {
  const rate = dt / WEATHER.fadeSeconds;
  if (cur.kind === target.kind || cur.intensity <= 0) {
    const kind = target.kind;
    const goal = kind === 'clear' ? 0 : target.intensity;
    const from = cur.kind === kind ? cur.intensity : 0;
    const d = goal - from;
    const intensity = Math.abs(d) <= rate ? goal : from + Math.sign(d) * rate;
    return { kind, intensity };
  }
  const intensity = Math.max(0, cur.intensity - rate);
  // At 0 it becomes the new kind directly (no one-frame 'clear' between rain and snow).
  return { kind: intensity > 0 ? cur.kind : target.kind, intensity };
}

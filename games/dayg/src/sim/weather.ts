// Seeded weather and seasons. Pure: no DOM, no Math.random, no clock reads. All randomness from the weather stream.
import type { Rng } from './rng';
import { SEASONS, WEATHER_KINDS, type Season, type Tuning, type WeatherKind, type WorldState } from './types';
import { dayOf, hourOf } from './world';

const TAU = Math.PI * 2;

export function seasonOf(day: number, t: Tuning): Season {
  const start = SEASONS.indexOf(t.clock.startSeason);
  const n = Math.floor((Math.max(1, day) - 1) / t.clock.daysPerSeason);
  return SEASONS[(start + n) % 4];
}

export function isNight(hour: number, t: Tuning): boolean {
  return hour >= t.clock.nightStartHour || hour < t.clock.nightEndHour;
}

function tempFor(kind: WeatherKind, season: Season, hour: number, t: Tuning, rng: Rng): number {
  const wt = t.weather;
  return wt.tempBase[season] + wt.tempWeather[kind] - (isNight(hour, t) ? wt.nightDrop : 0) + rng.range(-1, 1);
}

function windFor(kind: WeatherKind, rng: Rng): number {
  return kind === 'storm' ? rng.range(0.8, 1) : rng.range(0, 0.5);
}

function pickKind(season: Season, t: Tuning, rng: Rng): WeatherKind {
  const weights = t.weather.weights[season];
  return rng.weighted(WEATHER_KINDS, (k) => weights[k]);
}

export function initWeather(w: WorldState, rng: Rng): void {
  const t = w.tuning;
  const season = seasonOf(dayOf(w.tick, t), t);
  const kind = pickKind(season, t, rng);
  w.weather = {
    kind,
    tempC: tempFor(kind, season, hourOf(w.tick, t), t, rng),
    wind: windFor(kind, rng),
    windDir: rng.range(0, TAU),
    since: w.tick,
  };
}

export function stepWeather(w: WorldState, rng: Rng): void {
  const t = w.tuning;
  const day = dayOf(w.tick, t);
  const season = seasonOf(day, t);
  const ticksPerSeason = t.clock.ticksPerDay * t.clock.daysPerSeason;
  if (w.tick > 0 && w.tick % ticksPerSeason === 0) w.events.push({ kind: 'season', season });

  const ws = w.weather;
  if (!rng.chance(t.weather.stayChance)) {
    const kind = pickKind(season, t, rng);
    if (kind !== ws.kind) {
      ws.kind = kind;
      ws.since = w.tick;
      ws.wind = windFor(kind, rng);
      if (kind === 'storm' || kind === 'frost') w.events.push({ kind: 'weather', weather: kind });
    }
  }
  // Wind wanders a little inside its band; direction drifts slowly.
  const lo = ws.kind === 'storm' ? 0.8 : 0;
  const hi = ws.kind === 'storm' ? 1 : 0.5;
  ws.wind = Math.min(hi, Math.max(lo, ws.wind + rng.range(-0.05, 0.05)));
  ws.windDir = (((ws.windDir + rng.range(-0.08, 0.08)) % TAU) + TAU) % TAU;
  ws.tempC = tempFor(ws.kind, season, hourOf(w.tick, t), t, rng);
}

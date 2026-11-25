import { describe, expect, it } from 'vitest';
import { CLIMATE, WEATHER } from './config';
import { stepWeather, weatherForTime } from './schedule';
import { _resetWeatherForTests, forceWeather, getWeather, onWeather, updateWeather } from './index';
import type { RegionId, WeatherState } from './types';

const BLOCKS = 2000;

function blockTime(b: number): number {
  return b * WEATHER.blockSeconds;
}

describe('weatherForTime', () => {
  it('is deterministic for the same inputs', () => {
    for (const b of [0, 7, 123, 99999]) {
      expect(weatherForTime(blockTime(b), 'turfton')).toEqual(weatherForTime(blockTime(b), 'turfton'));
    }
  });

  it('is constant inside a block', () => {
    for (let b = 0; b < 200; b++) {
      const t = blockTime(b);
      expect(weatherForTime(t + 599, 'pardonlin')).toEqual(weatherForTime(t, 'pardonlin'));
      expect(weatherForTime(t + 300, 'turfton')).toEqual(weatherForTime(t, 'turfton'));
    }
  });

  it("turfton only rolls kinds it has a weight for (never snow)", () => {
    const seen = new Set<string>();
    for (let b = 0; b < BLOCKS; b++) {
      const w = weatherForTime(blockTime(b), 'turfton');
      seen.add(w.kind);
      expect(CLIMATE.turfton.weights[w.kind] ?? 0).toBeGreaterThan(0);
    }
    expect(seen.has('snow')).toBe(false);
    expect(seen.size).toBeGreaterThan(1);
  });

  it("'frostbite-fells' and 'north-highlands' never roll rain", () => {
    for (const region of ['frostbite-fells', 'north-highlands'] as RegionId[]) {
      for (let b = 0; b < BLOCKS; b++) {
        expect(weatherForTime(blockTime(b), region).kind).not.toBe('rain');
      }
    }
  });

  it("'dust-flats' is clear more than half the time", () => {
    let clear = 0;
    for (let b = 0; b < BLOCKS; b++) {
      if (weatherForTime(blockTime(b), 'dust-flats').kind === 'clear') clear++;
    }
    expect(clear / BLOCKS).toBeGreaterThan(0.5);
  });

  it("'pardonlin' rain never exceeds 0.45", () => {
    for (let b = 0; b < BLOCKS; b++) {
      const w = weatherForTime(blockTime(b), 'pardonlin');
      if (w.kind === 'rain') expect(w.intensity).toBeLessThanOrEqual(0.45);
    }
  });

  it('clear has intensity 0, every other kind sits within 0.35..1', () => {
    for (const region of Object.keys(CLIMATE) as RegionId[]) {
      for (let b = 0; b < 500; b++) {
        const w = weatherForTime(blockTime(b), region);
        if (w.kind === 'clear') {
          expect(w.intensity).toBe(0);
        } else {
          expect(w.intensity).toBeGreaterThanOrEqual(WEATHER.minIntensity);
          expect(w.intensity).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("fronts are shared: turfton never rains in a block where 'pardonlin' is not raining", () => {
    // Both regions roll the same number; rain is the top of the stacked roll in each, so turfton's rain band
    // (above 0.82) sits wholly inside pardonlin's rain band (above 0.6).
    let pardonlinDry = 0;
    for (let b = 0; b < BLOCKS; b++) {
      const t = blockTime(b);
      if (weatherForTime(t, 'pardonlin').kind !== 'rain') {
        pardonlinDry++;
        expect(weatherForTime(t, 'turfton').kind).not.toBe('rain');
      }
    }
    expect(pardonlinDry).toBeGreaterThan(0);
  });
});

describe('stepWeather', () => {
  it('clear to rain 1 reaches intensity 1 after 18 s and not before 17 s', () => {
    const target: WeatherState = { kind: 'rain', intensity: 1 };
    let cur: WeatherState = { kind: 'clear', intensity: 0 };
    for (let i = 0; i < 17; i++) cur = stepWeather(cur, target, 1);
    expect(cur.kind).toBe('rain');
    expect(cur.intensity).toBeLessThan(1);
    cur = stepWeather(cur, target, 1);
    expect(cur.intensity).toBeCloseTo(1, 9);
  });

  it('rain 1 to snow 0.5 fades rain out (kind stays rain while intensity > 0), then rises as snow to 0.5', () => {
    const target: WeatherState = { kind: 'snow', intensity: 0.5 };
    let cur: WeatherState = { kind: 'rain', intensity: 1 };
    let guard = 0;
    while (cur.intensity > 0 && guard++ < 60) {
      expect(cur.kind).toBe('rain');
      cur = stepWeather(cur, target, 1);
    }
    expect(cur.intensity).toBe(0);
    expect(cur.kind).toBe('snow'); // at 0 it takes the new kind directly (no transient 'clear')

    cur = stepWeather(cur, target, 1);
    expect(cur.kind).toBe('snow');
    for (let i = 0; i < 12; i++) cur = stepWeather(cur, target, 1);
    expect(cur.kind).toBe('snow');
    expect(cur.intensity).toBeCloseTo(0.5, 9);
  });
});

describe('weather index', () => {
  it('forceWeather with snap makes getWeather() rain 1 at once', () => {
    _resetWeatherForTests(() => 1000);
    forceWeather('rain', 1, true);
    expect(getWeather()).toEqual({ kind: 'rain', intensity: 1 });
    _resetWeatherForTests();
  });

  it('onWeather fires on a kind change, not on intensity-only changes', () => {
    _resetWeatherForTests(() => 1000);
    forceWeather('rain', 1, true);
    const calls: WeatherState[] = [];
    const off = onWeather((w) => calls.push(w));

    forceWeather('rain', 0.5);
    for (let i = 0; i < 5; i++) updateWeather(1, 0, 0);
    expect(calls).toHaveLength(0);

    forceWeather('cloud', 1, true);
    expect(calls).toHaveLength(1);
    expect(calls[0].kind).toBe('cloud');

    forceWeather('cloud', 0.5);
    for (let i = 0; i < 5; i++) updateWeather(1, 0, 0);
    expect(calls).toHaveLength(1);

    off();
    _resetWeatherForTests();
  });
});

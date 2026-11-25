import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetWeatherForTests, getWeather, isWeatherEnabled } from './index';
import { getSavedWeatherEnabled, initWeatherOptions, parseWeatherParam } from './options';

function stubStorage(): Map<string, string> {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
  });
  return store;
}

describe('weather options', () => {
  beforeEach(() => {
    stubStorage();
    _resetWeatherForTests(() => 0);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('parses ?weather=', () => {
    expect(parseWeatherParam('?weather=off')).toEqual({ enabled: false });
    expect(parseWeatherParam('?weather=0')).toEqual({ enabled: false });
    expect(parseWeatherParam('?weather=ON')).toEqual({ enabled: true });
    expect(parseWeatherParam('?weather=rain')).toEqual({ enabled: true, force: { kind: 'rain', intensity: 1 } });
    expect(parseWeatherParam('?weather=rain:0.4')).toEqual({ enabled: true, force: { kind: 'rain', intensity: 0.4 } });
    expect(parseWeatherParam('?weather=snow:5')).toEqual({ enabled: true, force: { kind: 'snow', intensity: 1 } });
    expect(parseWeatherParam('?weather=hail')).toBeNull();
    expect(parseWeatherParam('?weather=rain:abc')).toBeNull();
    expect(parseWeatherParam('?other=1')).toBeNull();
    expect(parseWeatherParam('')).toBeNull();
  });

  it('?weather=off disables weather', () => {
    initWeatherOptions('?weather=off');
    expect(isWeatherEnabled()).toBe(false);
  });

  it('?weather=rain:0.4 forces rain at 0.4', () => {
    initWeatherOptions('?weather=rain:0.4');
    expect(getWeather()).toEqual({ kind: 'rain', intensity: 0.4 });
  });

  it('a saved off with no param leaves weather disabled', () => {
    localStorage.setItem('gta-weather', 'off');
    expect(getSavedWeatherEnabled()).toBe(false);
    initWeatherOptions('');
    expect(isWeatherEnabled()).toBe(false);
  });

  it('defaults to on when nothing is saved', () => {
    initWeatherOptions('');
    expect(isWeatherEnabled()).toBe(true);
  });

  it('falls back to on when storage throws', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } });
    expect(getSavedWeatherEnabled()).toBe(true);
  });
});

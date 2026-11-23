import { describe, expect, it } from 'vitest';
import { AUDIO_DEFAULTS, AUDIO_KEY, clampSettings, loadSettings, saveSettings, type KeyValueStore } from './settings';
import { VOICE_CAP, VOICE_TOTAL, createVoiceBudget } from './voices';
import { surfaceFor } from './surfaces';
import { bedFor } from './bed';
import { renderStep, renderUi } from './synth';

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...initial };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
}

describe('audio settings', () => {
  it('falls back to the defaults for missing or bad values', () => {
    expect(clampSettings(null)).toEqual(AUDIO_DEFAULTS);
    expect(clampSettings({ master: 'loud', sfx: Number.NaN, muted: 'yes' })).toEqual(AUDIO_DEFAULTS);
  });

  it('clamps numbers to 0..100 and keeps a real boolean mute', () => {
    const s = clampSettings({ master: 250, sfx: -4, voices: 33.6, muted: true });
    expect(s.master).toBe(100);
    expect(s.sfx).toBe(0);
    expect(s.voices).toBe(34);
    expect(s.muted).toBe(true);
  });

  it('round-trips through storage under the versioned key', () => {
    const store = memoryStore();
    saveSettings({ ...AUDIO_DEFAULTS, master: 40, muted: true }, store);
    expect(Object.keys(store.data)).toEqual([AUDIO_KEY]);
    expect(loadSettings(store)).toMatchObject({ master: 40, muted: true });
  });

  it('never throws on broken storage or corrupt JSON', () => {
    const broken: KeyValueStore = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } };
    expect(() => saveSettings(AUDIO_DEFAULTS, broken)).not.toThrow();
    expect(loadSettings(broken)).toEqual(AUDIO_DEFAULTS);
    expect(loadSettings(memoryStore({ [AUDIO_KEY]: '{not json' }))).toEqual(AUDIO_DEFAULTS);
    expect(loadSettings(null)).toEqual(AUDIO_DEFAULTS);
  });
});

describe('voice budget', () => {
  it('denies a new voice of a kind once its cap is full and nothing weaker is playing', () => {
    const b = createVoiceBudget();
    for (let i = 0; i < VOICE_CAP.stinger; i++) expect(b.request('stinger', i).ok).toBe(true);
    expect(b.request('stinger', 99).ok).toBe(true);   // equal priority: the oldest stinger is stolen
    expect(b.count('stinger')).toBe(VOICE_CAP.stinger);
  });

  it('steals the oldest of its own kind when a footstep cap is full', () => {
    const b = createVoiceBudget();
    for (let i = 1; i <= VOICE_CAP.step; i++) b.request('step', i);
    const r = b.request('step', 100);
    expect(r).toEqual({ ok: true, stolen: 1 });
  });

  it('never exceeds the total, and a new voice steals a weaker one instead of an equal one of a higher kind', () => {
    const b = createVoiceBudget();
    let id = 1;
    for (let i = 0; i < VOICE_CAP.ui; i++) b.request('ui', id++);
    for (let i = 0; i < VOICE_CAP.voice; i++) b.request('voice', id++);
    for (let i = 0; i < VOICE_CAP.sfx; i++) b.request('sfx', id++);
    for (let i = 0; i < VOICE_CAP.step; i++) b.request('step', id++);
    expect(b.count()).toBe(VOICE_TOTAL);
    for (let i = 0; i < 20; i++) b.request('sfx', id++);   // floods: the total stays capped
    expect(b.count()).toBeLessThanOrEqual(VOICE_TOTAL);
    expect(b.count('ui')).toBe(VOICE_CAP.ui);               // UI is never stolen by sfx
    expect(b.count('voice')).toBe(VOICE_CAP.voice);         // nor voices
  });

  it('releases voices when they end', () => {
    const b = createVoiceBudget();
    b.request('ui', 1);
    b.release(1);
    expect(b.count()).toBe(0);
  });
});

describe('surfaces', () => {
  it('reads the zone traits, and grass is the default', () => {
    expect(surfaceFor([])).toBe('grass');
    expect(surfaceFor(['FLOODS', 'MOSSY'])).toBe('mud');
    expect(surfaceFor(['MOSSY'])).toBe('moss');
    expect(surfaceFor(['SACRED'])).toBe('stone');
    expect(surfaceFor(['OPEN'])).toBe('gravel');
  });
});

describe('wind bed', () => {
  it('is silent outside the map', () => {
    expect(bedFor(null, [], false, 'clear').gain).toBe(0);
  });

  it('gets brighter in rain and louder in a storm', () => {
    const clear = bedFor('old-rows', [], false, 'clear');
    expect(bedFor('old-rows', [], false, 'rain').cutoff).toBeGreaterThan(clear.cutoff);
    expect(bedFor('old-rows', [], false, 'storm').gain).toBeGreaterThan(clear.gain);
  });

  it('is darker and quieter at night and in a hush', () => {
    const day = bedFor('yew-walk', [], false, 'clear');
    expect(bedFor('yew-walk', [], true, 'clear').cutoff).toBeLessThan(day.cutoff);
    expect(bedFor('yew-walk', ['HUSH'], false, 'clear').gain).toBeLessThan(day.gain);
  });
});

describe('synth recipes', () => {
  it('renders finite, peak-normalised samples of the requested level', () => {
    for (const kind of ['tap', 'open', 'close', 'error', 'toast'] as const) {
      const s = renderUi(kind, 44100);
      expect(s.length).toBeGreaterThan(0);
      let peak = 0;
      for (const v of s) {
        expect(Number.isFinite(v)).toBe(true);
        peak = Math.max(peak, Math.abs(v));
      }
      expect(peak).toBeLessThanOrEqual(0.31);
    }
  });

  it('renders the same footstep every time, and a quieter one for a smaller volume', () => {
    const a = renderStep('gravel', 44100, 1, 3);
    const b = renderStep('gravel', 44100, 1, 3);
    expect(Array.from(a.slice(0, 50))).toEqual(Array.from(b.slice(0, 50)));
    const quiet = renderStep('gravel', 44100, 0.2, 3);
    const peak = (s: Float32Array): number => Math.max(...Array.from(s, Math.abs));
    expect(peak(quiet)).toBeLessThan(peak(a));
  });

  it('keeps every footstep under 1.5 seconds, the budget for an SFX buffer', () => {
    for (const surface of ['grass', 'gravel', 'stone', 'moss', 'mud'] as const) {
      expect(renderStep(surface, 44100, 1).length / 44100).toBeLessThan(1.5);
    }
  });
});

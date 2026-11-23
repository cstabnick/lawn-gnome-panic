import { describe, expect, it } from 'vitest';
import type { VoiceSpec } from '@lawn/mutter';
import { CAST } from '../cutscene/cast';
import { AMBIENT_GNOMES } from '../ambientGnomes';
import { VOICES, playerVoice, voiceFor } from './voices';

describe('VOICES', () => {
  it('has a voice for every CAST key, at the same pitch as the cast entry', () => {
    for (const key of Object.keys(CAST)) {
      expect(VOICES[key], key).toBeDefined();
      expect(VOICES[key].hz, key).toBe(CAST[key].hz);
    }
  });

  it('gives no two entries the same (wave, style, rounded formant) combination', () => {
    const seen = new Map<string, string>();
    for (const [key, v] of Object.entries(VOICES)) {
      const combo = `${v.wave ?? 'saw'}|${v.style ?? 'letters'}|${Math.round((v.formant ?? 1) * 100)}`;
      expect(seen.has(combo), `${key} vs ${seen.get(combo)}`).toBe(false);
      seen.set(combo, key);
    }
  });
});

describe('voiceFor', () => {
  it('matches an exact key', () => {
    expect(voiceFor('pip')).toEqual(VOICES.pip);
  });

  it('finds a key inside a longer label, on whole words', () => {
    expect(voiceFor('Pip Potsworth')).toEqual(VOICES.pip);
    expect(voiceFor('John Bodega')).toEqual(VOICES.bodega);
    expect(voiceFor('Shelldon "No-Trail" Mucilage')).toEqual(VOICES.shelldon);
    expect(voiceFor('Councilwoman Juniper Vance')).toEqual(VOICES.juniper);
    expect(voiceFor('Burdock "Big Flag" Bellweather')).toEqual(VOICES.burdock);
  });

  it('overrides hz without touching the table', () => {
    const before = VOICES.pip.hz;
    expect(voiceFor('Pip Potsworth', 150).hz).toBe(150);
    expect(VOICES.pip.hz).toBe(before);
  });

  it('returns a fresh copy, so callers cannot change the table', () => {
    const v = voiceFor('pip');
    v.hz = 1;
    expect(VOICES.pip.hz).not.toBe(1);
  });

  it('derives a stable voice for an unknown label', () => {
    const a = voiceFor('Some Random Gnome');
    expect(voiceFor('Some Random Gnome')).toEqual(a);
    const b = voiceFor('Another Random Gnome');
    const fields: (keyof VoiceSpec)[] = ['hz', 'speed', 'wave', 'sub', 'formant', 'q', 'breath', 'wobble', 'range', 'glide', 'style'];
    const differing = fields.filter((f) => a[f] !== b[f]);
    expect(differing.length).toBeGreaterThanOrEqual(2);
  });

  it('applies the clerk family traits to a derived voice', () => {
    const v = voiceFor('HOA Enforcer');
    expect(v.range).toBe(0.3);
    expect(v.wave).toBe('square');
    expect(v.q).toBe(8);
  });

  it('gives the ambient street gnomes distinct pitches', () => {
    const hz = new Set(AMBIENT_GNOMES.map((g) => voiceFor(g.name).hz));
    expect(AMBIENT_GNOMES.length).toBeGreaterThanOrEqual(26);
    expect(hz.size).toBeGreaterThanOrEqual(20);
  });
});

describe('playerVoice', () => {
  it('is plain and neutral, and differs between looks', () => {
    const a = playerVoice({ hat: 0xff0000 } as never);
    const b = playerVoice({ hat: 0x00ff00 } as never);
    expect(a.style).toBe('letters');
    expect(a.breath).toBe(0);
    expect(a.wobble).toBe(0);
    expect(a.range).toBeGreaterThanOrEqual(0.8);
    expect(a.range).toBeLessThanOrEqual(1.1);
    expect(a.hz).toBeGreaterThanOrEqual(96);
    expect(a.hz).toBeLessThanOrEqual(124);
    expect(a).not.toEqual(b);
    expect(playerVoice(null)).toEqual(playerVoice());
  });
});

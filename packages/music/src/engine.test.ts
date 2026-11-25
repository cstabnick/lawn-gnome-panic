import { describe, expect, it } from 'vitest';
import { musicLevelDb, selectContextOptions } from './engine';

describe('music output level', () => {
  it('is the shared level (-12 dB) at full volume with no boost or duck', () => {
    expect(musicLevelDb(1, 0, 0)).toBeCloseTo(-12, 5);
  });

  it('halves the gain as -6 dB', () => {
    expect(musicLevelDb(0.5, 0, 0)).toBeCloseTo(-18, 1);
  });

  it('adds the game boost and the duck separately', () => {
    expect(musicLevelDb(1, 3, 0)).toBeCloseTo(-9, 5);
    expect(musicLevelDb(1, 0, -6)).toBeCloseTo(-18, 5);
    expect(musicLevelDb(1, 3, -6)).toBeCloseTo(-15, 5);
  });

  it('never returns -Infinity for silence', () => {
    expect(Number.isFinite(musicLevelDb(0, 0, 0))).toBe(true);
  });
});

describe('AudioContext option selection', () => {
  it('uses playback latency without sampleRate override at <= 48 kHz', () => {
    expect(selectContextOptions(44100, false)).toEqual({ latencyHint: 'playback' });
    expect(selectContextOptions(48000, false)).toEqual({ latencyHint: 'playback' });
  });

  it('caps sampleRate to 48 kHz on high-rate devices', () => {
    expect(selectContextOptions(96000, false)).toEqual({ sampleRate: 48000, latencyHint: 'playback' });
    expect(selectContextOptions(192000, false)).toEqual({ sampleRate: 48000, latencyHint: 'playback' });
  });

  it('uses device defaults in fallback mode', () => {
    expect(selectContextOptions(48000, true)).toEqual({});
    expect(selectContextOptions(192000, true)).toEqual({});
  });
});

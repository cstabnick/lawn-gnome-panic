import { describe, expect, it } from 'vitest';
import { getArrangementSection, TRACKS } from './music';
import { analyzeStereoMonoMix, stereoToMonoSamples } from './musicTestUtil';

describe('musicTestUtil stereo->mono', () => {
  it('folds stereo samples down to mono with 0.5 * (L + R)', () => {
    const left = new Float32Array([0.8, -0.4, 0.2, 0.0]);
    const right = new Float32Array([0.4, 0.4, -0.6, 1.0]);
    const mono = stereoToMonoSamples(left, right);

    expect(mono.length).toBe(4);
    expect(mono[0]).toBeCloseTo(0.6, 5);
    expect(mono[1]).toBeCloseTo(0.0, 5);
    expect(mono[2]).toBeCloseTo(-0.2, 5);
    expect(mono[3]).toBeCloseTo(0.5, 5);
  });

  it('reports high correlation and zero clipping for balanced equal-power panned mix', () => {
    const n = 512;
    const left = new Float32Array(n);
    const right = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 8;
      const center = Math.sin(t) * 0.45; // bass/kick
      const pannedR = Math.sin(t * 2) * 0.2; // vibes
      const pannedL = Math.sin(t * 3) * 0.2; // guitar
      left[i] = center + pannedL * 0.85 + pannedR * 0.52;
      right[i] = center + pannedR * 0.85 + pannedL * 0.52;
    }

    const analysis = analyzeStereoMonoMix(left, right);
    expect(analysis.clipped).toBe(false);
    expect(analysis.correlation).toBeGreaterThan(0.8);
    expect(analysis.monoLossDb).toBeGreaterThan(-3);
  });

  it('detects out-of-phase cancellation and clipping', () => {
    const left = new Float32Array([0.5, -0.5, 1.0]);
    const right = new Float32Array([-0.5, 0.5, -1.0]);
    const analysis = analyzeStereoMonoMix(left, right);

    expect(analysis.correlation).toBeCloseTo(-1, 5);
    expect(analysis.peakMono).toBeCloseTo(0, 5);
    expect(analysis.clipped).toBe(true);
  });
});

describe('HipHopBeatEngine tracks and arrangement', () => {
  it('defines 16-step A/B/C beat structures and new voice patterns for every track', () => {
    for (const track of TRACKS) {
      expect(track.kickA).toHaveLength(16);
      expect(track.kickB).toHaveLength(16);
      expect(track.kickC).toHaveLength(16);
      expect(track.snareA).toHaveLength(16);
      expect(track.snareB).toHaveLength(16);
      expect(track.snareC).toHaveLength(16);
      expect(track.hatA).toHaveLength(16);
      expect(track.hatB).toHaveLength(16);
      expect(track.hatC).toHaveLength(16);
      expect(track.guitarPattern).toHaveLength(16);
      expect(track.vibesPattern).toHaveLength(16);
      expect(track.chops.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('progresses through all 5 arrangement sections across 32 bars', () => {
    expect(getArrangementSection(0)).toBe('intro');
    expect(getArrangementSection(4)).toBe('grooveA');
    expect(getArrangementSection(12)).toBe('grooveB');
    expect(getArrangementSection(20)).toBe('verseStrip');
    expect(getArrangementSection(28)).toBe('breakdown');
  });

  it('keeps bass passing tones, vibes, lead, and echo voicings harmonically consonant with each chord', () => {
    const semitoneDist = (a: number, b: number) => {
      const d = Math.abs((a % 12) - (b % 12));
      return Math.min(d, 12 - d);
    };

    for (const track of TRACKS) {
      for (const chop of track.chops) {
        const chordPitchClasses = [...chop.notes, chop.bass].map((n) => n % 12);

        const isChordSafe = (midi: number) => {
          const pc = midi % 12;
          return chordPitchClasses.includes(pc) || chordPitchClasses.every((c) => semitoneDist(midi, c) !== 1);
        };

        // Echo voicing shares its core tones with the main chord
        expect(chop.echoNotes.length).toBeGreaterThanOrEqual(4);
        for (const n of chop.echoNotes) {
          expect(isChordSafe(n)).toBe(true);
        }

        // Bass passing tone, vibes, and synth lead response notes must be chord-safe
        expect(isChordSafe(chop.bassPass)).toBe(true);
        for (const v of chop.vibe) {
          expect(isChordSafe(v)).toBe(true);
        }
        for (const l of chop.lead) {
          expect(isChordSafe(l)).toBe(true);
        }
      }
    }
  });
});

import { describe, expect, it } from 'vitest';
import { buildMenuTheme } from '../menuTheme';
import { createFx, createStereoBus } from '../mix';
import { buildRunTrack } from '../runTrack';
import { buildDesertSands } from '../themes/desertSands';
import { analyzeBuffer, encodeWav } from './dsp';
import { lintSongGraph } from './graph';
import { analyzeTheory } from './theory';

function synthStereo(
  durationS: number,
  sampleRate: number,
  fn: (t: number) => [number, number],
): { left: Float32Array; right: Float32Array } {
  const n = Math.floor(durationS * sampleRate);
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const [l, r] = fn(i / sampleRate);
    left[i] = l;
    right[i] = r;
  }
  return { left, right };
}

describe('analyzeBuffer (DSP mix analyzer)', () => {
  const sr = 48000;

  it('passes a balanced, non-clipping stereo mix', () => {
    const { left, right } = synthStereo(1.0, sr, (t) => {
      const env = 0.5 + 0.5 * Math.sin(2 * Math.PI * 2 * t);
      const mid = (0.18 * Math.sin(2 * Math.PI * 65 * t)
        + 0.22 * Math.sin(2 * Math.PI * 660 * t)
        + 0.1 * Math.sin(2 * Math.PI * 5200 * t)) * env;
      const side = 0.05 * Math.sin(2 * Math.PI * 880 * t) * env;
      return [mid + side, mid - side];
    });

    const report = analyzeBuffer(left, right, sr);
    expect(report.ok).toBe(true);
    expect(report.clippingSamples).toBe(0);
    expect(report.correlation).toBeGreaterThan(0.7);
    expect(report.sideToMidDb).toBeLessThan(-6);
    expect(report.issues).toEqual([]);
  });

  it('flags clipping when samples hit >= 0.999', () => {
    const { left, right } = synthStereo(0.25, sr, (t) => {
      const v = 1.05 * Math.sin(2 * Math.PI * 440 * t);
      return [v, v];
    });
    const report = analyzeBuffer(left, right, sr);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.code === 'clipping')).toBe(true);
  });

  it('flags excessive stereo width and phase cancellation', () => {
    const { left, right } = synthStereo(0.5, sr, (t) => {
      const mid = 0.05 * Math.sin(2 * Math.PI * 440 * t);
      const side = 0.35 * Math.sin(2 * Math.PI * 440 * t + 0.3);
      return [mid + side, mid - side];
    });
    const report = analyzeBuffer(left, right, sr);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.code === 'phase-correlation')).toBe(true);
    expect(report.issues.some((i) => i.code === 'excessive-side')).toBe(true);
    expect(report.issues.some((i) => i.code === 'mono-collapse')).toBe(true);
  });

  it('warns on muddy low-mids and lopsided L/R panning', () => {
    const { left, right } = synthStereo(0.5, sr, (t) => {
      const mud = 0.45 * Math.sin(2 * Math.PI * 160 * t);
      const hi = 0.02 * Math.sin(2 * Math.PI * 1500 * t);
      return [mud + hi, 0.25 * (mud + hi)];
    });
    const report = analyzeBuffer(left, right, sr);
    expect(report.issues.some((i) => i.code === 'muddy-low-mids')).toBe(true);
    expect(report.issues.some((i) => i.code === 'lr-imbalance')).toBe(true);
  });

  it('encodes valid 16-bit stereo PCM WAV headers', () => {
    const left = new Float32Array([0, 0.5, -0.5, 0]);
    const right = new Float32Array([0, -0.5, 0.5, 0]);
    const wav = encodeWav(left, right, 48000);
    expect(wav.byteLength).toBe(44 + 4 * 4);
    expect(String.fromCharCode(...wav.slice(0, 4))).toBe('RIFF');
    expect(String.fromCharCode(...wav.slice(8, 12))).toBe('WAVE');
  });
});

describe('lintSongGraph (audio-graph topology linter)', () => {
  it('passes buildRunTrack without stereo-into-reverb or excessive width', () => {
    const report = lintSongGraph((T, keep, out) => buildRunTrack(T, keep, out, 42));
    expect(report.ok).toBe(true);
    expect(report.stereoIntoReverbPaths).toEqual([]);
    expect(report.issues).toEqual([]);
  });

  it('passes buildMenuTheme without stereo-into-reverb or excessive width', () => {
    const report = lintSongGraph(buildMenuTheme);
    expect(report.ok).toBe(true);
    expect(report.stereoIntoReverbPaths).toEqual([]);
    expect(report.issues).toEqual([]);
  });

  it('passes buildDesertSands without stereo-into-reverb or excessive width', () => {
    const report = lintSongGraph((T, keep, out) => buildDesertSands(T, keep, out, 42));
    expect(report.ok).toBe(true);
    expect(report.stereoIntoReverbPaths).toEqual([]);
    expect(report.issues).toEqual([]);
  });

  it('catches stereo-into-reverb and excessive StereoWidener width on a bad mix', () => {
    const report = lintSongGraph((T, keep, out) => {
      const fx = createFx(T, keep, out);
      const padHp = keep(new T.Filter(200, 'highpass')).fan(out, fx.rev);
      const padStereo = createStereoBus(T, keep, padHp, { width: 0.82 });
      const pad = keep(new T.PolySynth(T.Synth)).connect(padStereo);
      pad.volume.value = -20;
    });
    expect(report.ok).toBe(false);
    expect(report.stereoIntoReverbPaths.length).toBeGreaterThan(0);
    expect(report.issues.some((i) => i.code === 'stereo-into-reverb')).toBe(true);
    expect(report.issues.some((i) => i.code === 'excessive-stereo-width')).toBe(true);
  });
});

describe('analyzeTheory (music theory analyzer)', () => {
  it('scores buildRunTrack and buildMenuTheme highly for key fit and harmony', () => {
    const runReport = analyzeTheory((T, keep, out) => buildRunTrack(T, keep, out, 42), 24);
    expect(runReport.ok).toBe(true);
    expect(runReport.detectedKey.inScaleRatio).toBeGreaterThan(0.9);
    expect(runReport.score).toBeGreaterThanOrEqual(80);

    const menuReport = analyzeTheory(buildMenuTheme, 24);
    expect(menuReport.ok).toBe(true);
    expect(menuReport.detectedKey.inScaleRatio).toBeGreaterThan(0.9);
    expect(menuReport.score).toBeGreaterThanOrEqual(80);

    const desertReport = analyzeTheory((T, keep, out) => buildDesertSands(T, keep, out, 42), 24);
    expect(desertReport.ok).toBe(true);
    expect(desertReport.detectedKey.inScaleRatio).toBeGreaterThan(0.9);
    expect(desertReport.score).toBeGreaterThanOrEqual(80);
  });

  it('catches chromatic out-of-scale notes and bass/harmony semitone clashes', () => {
    const badReport = analyzeTheory((T, keep, out) => {
      const bass = keep(new T.MonoSynth()).connect(out);
      const pad = keep(new T.PolySynth(T.Synth)).connect(out);
      const lead = keep(new T.Synth()).connect(out);
      const chromatic = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4'];
      let step = 0;
      keep(new T.Loop((time) => {
        bass.triggerAttackRelease('C2', '4n', time, 0.8);
        pad.triggerAttackRelease(['C#3', 'D3', 'G3'], '4n', time, 0.7);
        lead.triggerAttackRelease(chromatic[(step * 5) % chromatic.length], '8n', time, 0.8);
        step++;
      }, '8n')).start(0);
    }, 8);

    expect(badReport.ok).toBe(false);
    expect(badReport.issues.some((i) => i.code === 'out-of-scale-notes')).toBe(true);
    expect(badReport.issues.some((i) => i.code === 'harmonic-clashes')).toBe(true);
    expect(badReport.score).toBeLessThan(65);
  });

  it('warns on low pitch variety (monotonous 1-2 note loop)', () => {
    const monoReport = analyzeTheory((T, keep, out) => {
      const s = keep(new T.Synth()).connect(out);
      keep(new T.Loop((time) => {
        s.triggerAttackRelease('C4', '8n', time, 0.8);
      }, '4n')).start(0);
    }, 8);
    expect(monoReport.issues.some((i) => i.code === 'low-pitch-variety')).toBe(true);
  });
});

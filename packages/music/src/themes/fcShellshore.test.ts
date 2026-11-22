import type * as ToneNS from 'tone';
import { describe, expect, it } from 'vitest';
import type { Keep, Tone } from '../engine';
import { lintSongGraph } from '../analyze/graph';
import { analyzeTheory, captureNoteEvents } from '../analyze/theory';
import { buildFcShellshore } from './fcShellshore';

type Build = (T: Tone, keep: Keep, out: ToneNS.Volume) => void;

const at = (x: number): Build => (T, keep, out) => { buildFcShellshore(T, keep, out, 42, { intensity: () => x }); };

describe('Shellshore music', () => {
  for (const x of [0, 0.5, 1]) {
    it(`intensity ${x}: no graph problems`, () => {
      expect(lintSongGraph(at(x)).issues).toEqual([]);
    });
    it(`intensity ${x}: no one-note voice is triggered twice at once`, () => {
      const conflicts: string[] = [];
      captureNoteEvents(at(x), 120, conflicts);
      expect([...new Set(conflicts)].slice(0, 5)).toEqual([]);
    });
  }
  it('intensity 1: stays in its key', () => {
    expect(analyzeTheory(at(1), 40).detectedKey.inScaleRatio).toBeGreaterThan(0.85);
  });
  it('layers come in with intensity', () => {
    const count = (x: number) => new Set(captureNoteEvents(at(x), 40).map((e) => e.id)).size;
    expect(count(0)).toBeLessThan(count(0.5));
    expect(count(0.5)).toBeLessThan(count(1));
  });
  it('pickup() plays without throwing', () => {
    let hooks: { pickup(): void } | null = null;
    captureNoteEvents((T, keep, out) => { hooks = buildFcShellshore(T, keep, out, 42); }, 4);
    expect(() => { for (let i = 0; i < 8; i++) hooks!.pickup(); }).not.toThrow();
  });
});

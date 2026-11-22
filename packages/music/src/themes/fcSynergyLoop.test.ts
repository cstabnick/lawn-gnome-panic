import type * as ToneNS from 'tone';
import { describe, expect, it } from 'vitest';
import type { Keep, Tone } from '../engine';
import { lintSongGraph } from '../analyze/graph';
import { analyzeTheory, captureNoteEvents } from '../analyze/theory';
import { buildFcSynergyLoop } from './fcSynergyLoop';

const at = (x: number) => (T: Tone, keep: Keep, out: ToneNS.Volume) => { buildFcSynergyLoop(T, keep, out, 42, { intensity: () => x }); };

const LEVELS: [string, number][] = [['calm', 0], ['busy', 0.5], ['absurd', 1]];

describe('Synergy Loop (Nothing Left to Collect)', () => {
  for (const [name, x] of LEVELS) {
    it(`${name}: no graph problems`, () => {
      expect(lintSongGraph(at(x)).issues).toEqual([]);
    });
    it(`${name}: no one-note voice is triggered twice at once`, () => {
      const conflicts: string[] = [];
      captureNoteEvents(at(x), 120, conflicts);
      expect([...new Set(conflicts)].slice(0, 5)).toEqual([]);
    });
  }
  it('calm: stays in F major', () => {
    const theory = analyzeTheory(at(0), 40);
    expect(theory.detectedKey.inScaleRatio).toBeGreaterThan(0.85);
  });
  it('absurd: plays notes at every layer', () => {
    expect(captureNoteEvents(at(1), 40).length).toBeGreaterThan(captureNoteEvents(at(0), 40).length);
  });
});

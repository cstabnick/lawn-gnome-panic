import type * as ToneNS from 'tone';
import { describe, expect, it } from 'vitest';
import type { Keep, Tone } from '../engine';
import { lintSongGraph } from '../analyze/graph';
import { analyzeTheory, captureNoteEvents } from '../analyze/theory';
import { buildDaygScore, type DaygHooks, type DaygStinger } from './dayg';

type Build = (T: Tone, keep: Keep, out: ToneNS.Volume) => void;

const SEEDS = [1, 42, 977];

describe('Mossgrave score (DayG)', () => {
  for (const seed of SEEDS) {
    const build: Build = (T, keep, out) => buildDaygScore(T, keep, out, seed, {});

    it(`seed ${seed}: no graph problems`, () => {
      expect(lintSongGraph(build).issues).toEqual([]);
    });

    it(`seed ${seed}: no one-note voice is triggered twice at once`, () => {
      const conflicts: string[] = [];
      captureNoteEvents(build, 120, conflicts);
      expect([...new Set(conflicts)].slice(0, 5)).toEqual([]);
    });

    it(`seed ${seed}: stays in its key`, () => {
      const theory = analyzeTheory(build, 40);
      expect(theory.detectedKey.inScaleRatio).toBeGreaterThan(0.85);
    });
  }

  it('its stingers schedule without graph or voice problems', () => {
    const stingers: string[] = ['dusk', 'dawn', 'hit', 'shatter', 'respawn', 'horde', 'quest-up', 'quest-done', 'quest-fail', 'infection', 'bell'];
    const build: Build = (T, keep, out) => {
      const hooks: Partial<DaygHooks> = {};
      buildDaygScore(T, keep, out, 42, hooks);
      for (const kind of stingers) hooks.stinger?.(kind as DaygStinger, 1);
    };
    expect(lintSongGraph(build).issues).toEqual([]);
  });
});

import type * as ToneNS from 'tone';
import { describe, expect, it } from 'vitest';
import type { Keep, Tone } from '../engine';
import { lintSongGraph } from '../analyze/graph';
import { analyzeTheory, captureNoteEvents } from '../analyze/theory';
import { buildFcHoldMusic } from './fcHoldMusic';

const build = (T: Tone, keep: Keep, out: ToneNS.Volume) => { buildFcHoldMusic(T, keep, out, 42); };
describe('Final Collectathon: Hold Music', () => {
  it('has no graph problems', () => { expect(lintSongGraph(build).issues).toEqual([]); });
  it('never triggers a one-note voice twice at once', () => {
    const conflicts: string[] = [];
    captureNoteEvents(build, 120, conflicts);
    expect([...new Set(conflicts)].slice(0, 5)).toEqual([]);
  });
  it('stays in its key', () => { expect(analyzeTheory(build, 40).detectedKey.inScaleRatio).toBeGreaterThan(0.85); });
});

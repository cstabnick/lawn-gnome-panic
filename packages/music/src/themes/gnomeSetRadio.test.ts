import type * as ToneNS from 'tone';
import { describe, expect, it } from 'vitest';
import type { Keep, Tone } from '../engine';
import { lintSongGraph } from '../analyze/graph';
import { analyzeTheory, captureNoteEvents } from '../analyze/theory';
import { GSR_TRACKS, buildGnomeSetRadioTrack } from './gnomeSetRadio';

type Build = (T: Tone, keep: Keep, out: ToneNS.Volume) => void;

describe('Gnom Set Radio music', () => {
  for (const track of GSR_TRACKS) {
    const build: Build = (T, keep, out) => buildGnomeSetRadioTrack(T, keep, out, track.id, 1);

    it(`${track.id}: no graph problems`, () => {
      expect(lintSongGraph(build).issues).toEqual([]);
    });

    it(`${track.id}: no mono voice timing conflicts`, () => {
      const conflicts: string[] = [];
      captureNoteEvents(build, 60, conflicts);
      expect([...new Set(conflicts)].slice(0, 5)).toEqual([]);
    });

    it(`${track.id}: stays in its key/mode`, () => {
      const theory = analyzeTheory(build, 32);
      expect(theory.detectedKey.inScaleRatio).toBeGreaterThan(0.85);
    });
  }

  it('ivory-jungle-jazz & bongo-rip-mix with active reactive hooks have zero conflicts', () => {
    for (const id of ['ivory-jungle-jazz', 'bongo-rip-mix'] as const) {
      const conflicts: string[] = [];
      captureNoteEvents(
        (T, keep, out) =>
          buildGnomeSetRadioTrack(T, keep, out, id, 7, {
            grinding: () => true,
            air: () => false,
            boss: () => true,
            hype: () => 1,
          }),
        45,
        conflicts,
      );
      expect(conflicts).toEqual([]);
    }
  });
});

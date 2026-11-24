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

  it('Area 3 (chrome-kiln-funk) is pure aeolian minor acid', () => {
    const area3 = GSR_TRACKS.find((t) => t.id === 'chrome-kiln-funk');
    expect(area3?.mode).toBe('aeolian');
    expect(area3?.key).toBe('E');
  });

  it('Areas 5-9 have updated distinct BPMs, keys, and styles', () => {
    expect(GSR_TRACKS.find((t) => t.id === 'mulch-alley-chiptune-funk')?.bpm).toBe(128);
    expect(GSR_TRACKS.find((t) => t.id === 'sky-mall-future-funk')?.bpm).toBe(122);
    expect(GSR_TRACKS.find((t) => t.id === 'hoa-bylaw-brass-step')?.bpm).toBe(136);
    expect(GSR_TRACKS.find((t) => t.id === 'subsoil-relay-jungle')?.bpm).toBe(166);
    expect(GSR_TRACKS.find((t) => t.id === 'zero-hz-zenith')?.bpm).toBe(158);
  });

  it('reactive grinding, boss & skillPeak hooks have zero conflicts and add events on all tracks', () => {
    for (const id of ['ivory-jungle-jazz', 'bongo-rip-mix', 'pirate-radio-hub', 'chrome-kiln-funk'] as const) {
      const baseEvents = captureNoteEvents((T, keep, out) => buildGnomeSetRadioTrack(T, keep, out, id, 7), 30);
      const conflicts: string[] = [];
      const reactiveEvents = captureNoteEvents(
        (T, keep, out) =>
          buildGnomeSetRadioTrack(T, keep, out, id, 7, {
            grinding: () => true,
            air: () => false,
            boss: () => true,
            skillPeak: () => true,
            hype: () => 1,
          }),
        30,
        conflicts,
      );
      expect(conflicts).toEqual([]);
      expect(reactiveEvents.length).toBeGreaterThan(baseEvents.length);

      const skillOnlyEvents = captureNoteEvents(
        (T, keep, out) =>
          buildGnomeSetRadioTrack(T, keep, out, id, 7, {
            skillPeak: () => true,
            hype: () => 0.45,
          }),
        30,
        conflicts,
      );
      expect(conflicts).toEqual([]);
      expect(skillOnlyEvents.length).toBeGreaterThan(baseEvents.length);
    }
  });

  it('new reactive hooks (wallRiding, comboTier, speedNorm, trickPulse) stay conflict-free and in key', () => {
    for (const track of GSR_TRACKS) {
      const baseEvents = captureNoteEvents((T, keep, out) => buildGnomeSetRadioTrack(T, keep, out, track.id, 3), 24);
      const conflicts: string[] = [];

      const wallEvents = captureNoteEvents(
        (T, keep, out) =>
          buildGnomeSetRadioTrack(T, keep, out, track.id, 3, {
            wallRiding: () => true,
            speedNorm: () => 0.85,
          }),
        24,
        conflicts,
      );
      expect(conflicts).toEqual([]);
      expect(wallEvents.length).toBeGreaterThan(baseEvents.length);

      let pulseStep = 0;
      const comboAndTrickEvents = captureNoteEvents(
        (T, keep, out) =>
          buildGnomeSetRadioTrack(T, keep, out, track.id, 3, {
            comboTier: () => 3,
            speedNorm: () => 1,
            trickPulse: () => pulseStep++ % 8 === 0,
          }),
        24,
        conflicts,
      );
      expect(conflicts).toEqual([]);
      expect(comboAndTrickEvents.length).toBeGreaterThan(baseEvents.length);

      const theory = analyzeTheory(
        (T, keep, out) =>
          buildGnomeSetRadioTrack(T, keep, out, track.id, 3, {
            wallRiding: () => true,
            comboTier: () => 3,
            speedNorm: () => 1,
            trickPulse: () => true,
          }),
        24,
      );
      expect(theory.detectedKey.inScaleRatio).toBeGreaterThan(0.85);
    }
  });

  it('extended grooveC showcase runs conflict-free and stays in key', () => {
    for (const id of ['ivory-jungle-jazz', 'mulch-alley-chiptune-funk', 'sky-mall-future-funk', 'hoa-bylaw-brass-step', 'subsoil-relay-jungle', 'zero-hz-zenith'] as const) {
      const conflicts: string[] = [];
      const build: Build = (T, keep, out) => buildGnomeSetRadioTrack(T, keep, out, id, 1);
      captureNoteEvents(build, 90, conflicts);
      expect(conflicts).toEqual([]);
      const theory = analyzeTheory(build, 90);
      expect(theory.detectedKey.inScaleRatio).toBeGreaterThan(0.85);
    }
  });
});

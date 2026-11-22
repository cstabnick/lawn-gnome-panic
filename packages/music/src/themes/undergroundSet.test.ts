import { describe, expect, it } from 'vitest';
import type { Keep, Tone } from '../engine';
import type * as ToneNS from 'tone';
import { lintSongGraph } from '../analyze/graph';
import { analyzeTheory, captureNoteEvents } from '../analyze/theory';
import {
  PHRASE_BARS, SET_BARS, UNDERGROUND_JOURNEY, XFADE_BARS, acidCutoff, buildUndergroundSet, bpmForSeed, cutStartBar,
  dubCutoff, energyAt, euclid, levelsOf, planAt, weightsOf, type UndergroundOptions,
} from './undergroundSet';

type Build = (T: Tone, keep: Keep, out: ToneNS.Volume) => void;
const build = (seed: number, o: UndergroundOptions = {}): Build => (T, keep, out) => buildUndergroundSet(T, keep, out, seed, o);
/** Seconds in the whole journey at a seed's tempo. */
const lapSeconds = (seed: number): number => (SET_BARS * 4 * 60) / bpmForSeed(seed);

describe('the journey', () => {
  it('only ever moves between neighbours: acid and dub never touch (the drum cuts are the hub)', () => {
    const n = UNDERGROUND_JOURNEY.length;
    for (let i = 0; i < n; i++) {
      const a = UNDERGROUND_JOURNEY[i].mode;
      const b = UNDERGROUND_JOURNEY[(i + 1) % n].mode;
      expect([a, b].sort()).not.toEqual(['acid', 'dub']);
    }
  });

  it('visits all three modes, and every cut is a multiple of 16 bars so the chord loop lines up', () => {
    expect(new Set(UNDERGROUND_JOURNEY.map((c) => c.mode))).toEqual(new Set(['acid', 'dub', 'drum']));
    for (let i = 0; i < UNDERGROUND_JOURNEY.length; i++) {
      expect(UNDERGROUND_JOURNEY[i].bars % 16).toBe(0);
      expect(cutStartBar(i) % 16).toBe(0);
      expect(UNDERGROUND_JOURNEY[i].bars).toBeGreaterThan(XFADE_BARS * 2);
    }
    expect(SET_BARS % 16).toBe(0);
  });

  it('breakdowns sit in the middle of a cut, clear of the crossfade out and well after the one in', () => {
    for (const c of UNDERGROUND_JOURNEY) {
      if (!c.brk) continue;
      expect(c.brk[0]).toBeGreaterThanOrEqual(XFADE_BARS + 4);
      expect(c.brk[0] + c.brk[1]).toBeLessThanOrEqual(c.bars - XFADE_BARS - 4);
    }
  });
});

describe('energy: one continuous curve', () => {
  it('never jumps more than a few percent from one bar to the next, across every cut and the wrap into the next lap', () => {
    let worst = 0;
    for (let b = 0; b < SET_BARS * 2; b++) worst = Math.max(worst, Math.abs(energyAt(b + 1) - energyAt(b)));
    expect(worst).toBeLessThan(0.05);
  });

  it('builds into the peak: each acid cut ends hotter than the drum cut before it, and the set winds down to dub', () => {
    const acid = UNDERGROUND_JOURNEY.map((c, i) => [c, i] as const).filter(([c]) => c.mode === 'acid');
    for (const [, i] of acid) {
      const before = UNDERGROUND_JOURNEY[i - 1];
      expect(UNDERGROUND_JOURNEY[i].energy).toBeGreaterThan(before.energy);
    }
    const peak = Math.max(...UNDERGROUND_JOURNEY.map((c) => c.energy));
    expect(UNDERGROUND_JOURNEY.find((c) => c.energy === peak)!.mode).toBe('acid');
    expect(UNDERGROUND_JOURNEY[UNDERGROUND_JOURNEY.length - 1].mode).toBe('dub');
    expect(UNDERGROUND_JOURNEY[UNDERGROUND_JOURNEY.length - 1].energy).toBeLessThan(0.3);
  });
});

describe('the blend', () => {
  it('crosses over the last XFADE_BARS of every cut, and not before', () => {
    for (let i = 0; i < UNDERGROUND_JOURNEY.length; i++) {
      const end = cutStartBar(i) + UNDERGROUND_JOURNEY[i].bars;
      expect(planAt(end - XFADE_BARS - 1).x).toBe(0);
      expect(planAt(end - XFADE_BARS).x).toBe(0);
      expect(planAt(end - 1).x).toBeGreaterThan(0.8);
      expect(planAt(end).x).toBe(0);
      expect(planAt(end).cut).toBe((i + 1) % UNDERGROUND_JOURNEY.length);
    }
  });

  it('is gradual: no mode weight moves by more than 40% between bars, and the sound on the floor never dips', () => {
    for (let b = 0; b < SET_BARS * 2; b++) {
      const a = weightsOf(planAt(b));
      const c = weightsOf(planAt(b + 1));
      for (const m of ['acid', 'dub', 'drum'] as const) {
        expect(Math.abs(a.rhythm[m] - c.rhythm[m])).toBeLessThan(0.4);
        expect(Math.abs(a.tonal[m] - c.tonal[m])).toBeLessThan(0.4);
      }
      // Something rhythmic and something tonal is always up.
      expect(a.rhythm.acid + a.rhythm.dub + a.rhythm.drum).toBeGreaterThan(0.95);
      expect(a.tonal.acid + a.tonal.dub + a.tonal.drum).toBeGreaterThan(0.5);
    }
  });

  it('percussion of the next mode arrives before its harmony, and the bass swaps once, in the middle', () => {
    for (let i = 0; i < UNDERGROUND_JOURNEY.length; i++) {
      const cur = UNDERGROUND_JOURNEY[i].mode;
      const nxt = UNDERGROUND_JOURNEY[(i + 1) % UNDERGROUND_JOURNEY.length].mode;
      if (cur === nxt) continue;
      const end = cutStartBar(i) + UNDERGROUND_JOURNEY[i].bars;
      const early = weightsOf(planAt(end - XFADE_BARS + 2));
      expect(early.rhythm[nxt]).toBeGreaterThan(early.tonal[nxt]);
      const basses = Array.from({ length: XFADE_BARS }, (_, k) => weightsOf(planAt(end - XFADE_BARS + k)).bass);
      expect(basses.filter((m, k) => k > 0 && m !== basses[k - 1])).toHaveLength(1);
      expect(basses[0]).toBe(cur);
      expect(basses[XFADE_BARS - 1]).toBe(nxt);
    }
  });

  it('the title follows the ear: it changes in the middle of the crossfade', () => {
    const end = cutStartBar(0) + UNDERGROUND_JOURNEY[0].bars;
    expect(planAt(end - XFADE_BARS).dominant).toBe(0);
    expect(planAt(end - XFADE_BARS / 2 - 1).dominant).toBe(0);
    expect(planAt(end - XFADE_BARS / 2).dominant).toBe(1);
  });

  it('each mode shows its character at its own peak', () => {
    const at = (i: number): ReturnType<typeof levelsOf> => levelsOf(weightsOf(planAt(cutStartBar(i) + 20)), planAt(cutStartBar(i) + 20).energy);
    const acid = at(2);
    const dub = at(6);
    const drum = at(1);
    expect(acid.acid).toBeGreaterThan(0.9);
    expect(acid.chord).toBe(0);
    expect(dub.chord).toBeGreaterThan(0.9);
    expect(dub.acid).toBe(0);
    expect(dub.clap).toBe(0);
    expect(drum.tom).toBeGreaterThan(0.5);
    expect(drum.clap).toBeGreaterThan(0.5);
    expect(drum.acid).toBe(0);
  });
});

describe('filter changes on three time scales', () => {
  const state = (bar: number, o: Partial<{ weight: number }> = {}) => {
    const p = planAt(bar);
    return { energy: p.energy, weight: o.weight ?? 1, brk: p.brk, sinceDrop: p.sinceDrop };
  };
  const acidCut = UNDERGROUND_JOURNEY.findIndex((c) => c.mode === 'acid');
  const start = cutStartBar(acidCut);

  it('long: the base cutoff opens as the cut builds', () => {
    // The same point in the phrase, early and late in the cut (before the breakdown).
    const early = acidCutoff(start - 8, 0, state(start - 8));
    const late = acidCutoff(start + 16, 0, state(start + 16));
    expect(late).toBeGreaterThan(early * 1.3);
    // And over the second, hotter acid cut the climb is much bigger.
    const s2 = cutStartBar(4);
    expect(acidCutoff(s2 + 16, 0, state(s2 + 16))).toBeGreaterThan(acidCutoff(s2, 0, state(s2)) * 1.8);
  });

  it('medium: each phrase opens through its second half, then snaps shut on the downbeat', () => {
    const b = start + 8; // a phrase boundary, outside the breakdown
    const c = (bar: number, pos = 0): number => acidCutoff(bar, pos, state(bar));
    expect(c(b + 7)).toBeGreaterThan(c(b + 2) * 1.5);
    expect(c(b + 8)).toBeLessThan(c(b + 7, 8) * 0.7);
  });

  it('medium: a breakdown closes the filter, sweeps it open, and the drop lands wide open then settles', () => {
    const c = UNDERGROUND_JOURNEY[acidCut];
    const [s, len] = c.brk!;
    const at = (rel: number, pos = 0): number => acidCutoff(start + rel, pos, state(start + rel));
    expect(at(s)).toBeLessThan(at(s - 2) * 0.6);
    expect(at(s + len - 1, 12)).toBeGreaterThan(at(s) * 3);
    expect(at(s + len)).toBeGreaterThan(at(s + len + 6));
  });

  it('the line enters and leaves through the filter', () => {
    const b = start + 4;
    expect(acidCutoff(b, 0, state(b, { weight: 0.2 }))).toBeLessThan(acidCutoff(b, 0, state(b)) * 0.3);
  });

  it('never leaps more than an octave and a half between steps, except on a phrase downbeat or a drop', () => {
    for (const lap of [0, 1]) {
      for (let g = 0; g < SET_BARS * 16; g++) {
        const bar = lap * SET_BARS + Math.floor(g / 16);
        const pos = g % 16;
        const next = bar + Math.floor((g + 1) / 16) - Math.floor(g / 16);
        const here = planAt(bar);
        const there = planAt(next);
        if (here.mode !== 'acid' || there.mode !== 'acid') continue;
        if ((g + 1) % (PHRASE_BARS * 16) === 0) continue; // phrase downbeat
        if (here.brk.on !== there.brk.on || (there.sinceDrop === 0 && here.sinceDrop === -1)) continue;
        const a = acidCutoff(bar, pos, { energy: here.energy, weight: weightsOf(here).tonal.acid, brk: here.brk, sinceDrop: here.sinceDrop });
        const b = acidCutoff(next, (pos + 1) % 16, { energy: there.energy, weight: weightsOf(there).tonal.acid, brk: there.brk, sinceDrop: there.sinceDrop });
        expect(Math.abs(Math.log2(b / a))).toBeLessThan(1.5);
      }
    }
  });

  it('dub chords open with the energy and enter dark', () => {
    expect(dubCutoff(0, 0, 0.8, 1)).toBeGreaterThan(dubCutoff(0, 0, 0.2, 1));
    expect(dubCutoff(4, 0, 0.5, 0.2)).toBeLessThan(dubCutoff(4, 0, 0.5, 1) * 0.4);
  });
});

describe('polyrhythm', () => {
  it('euclid spreads hits evenly', () => {
    expect(euclid(3, 8).filter(Boolean)).toHaveLength(3);
    expect(euclid(5, 12).filter(Boolean)).toHaveLength(5);
    expect(euclid(4, 16).map((h, i) => (h ? i : -1)).filter((i) => i >= 0)).toEqual([0, 4, 8, 12]);
  });
});

describe('Underground set audio', () => {
  for (const seed of [1, 42, 999]) {
    it(`seed ${seed}: no graph problems`, () => {
      expect(lintSongGraph(build(seed)).issues).toEqual([]);
    });
    it(`seed ${seed}: no one-note voice is triggered twice at once, over a whole lap and into the next`, () => {
      const conflicts: string[] = [];
      captureNoteEvents(build(seed), lapSeconds(seed) * 1.1, conflicts);
      expect([...new Set(conflicts)].slice(0, 5)).toEqual([]);
    });
  }

  it('resuming on any cut has no voice conflicts either', () => {
    for (let i = 0; i < UNDERGROUND_JOURNEY.length; i++) {
      const conflicts: string[] = [];
      captureNoteEvents(build(7, { startAt: i }), 120, conflicts);
      expect([...new Set(conflicts)].slice(0, 5)).toEqual([]);
    }
  });

  it('stays in one key for the whole lap', () => {
    const t = analyzeTheory(build(42), lapSeconds(42));
    expect(t.detectedKey.inScaleRatio).toBeGreaterThan(0.95);
  });

  it('is deterministic per seed and different between seeds', () => {
    const a = captureNoteEvents(build(5), 90).map((e) => `${e.midi}@${e.time.toFixed(2)}`).join();
    const b = captureNoteEvents(build(5), 90).map((e) => `${e.midi}@${e.time.toFixed(2)}`).join();
    const c = captureNoteEvents(build(6), 90).map((e) => `${e.midi}@${e.time.toFixed(2)}`).join();
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('announces each cut once, in order, around the whole journey', () => {
    const seen: number[] = [];
    captureNoteEvents(build(3, { onCut: (i) => seen.push(i) }), lapSeconds(3) * 1.02);
    expect(seen.slice(0, UNDERGROUND_JOURNEY.length + 1)).toEqual([0, 1, 2, 3, 4, 5, 6, 0]);
  });

  it('announces the cut it resumes on first', () => {
    const seen: number[] = [];
    captureNoteEvents(build(3, { startAt: 4, onCut: (i) => seen.push(i) }), 30);
    expect(seen[0]).toBe(4);
  });
});

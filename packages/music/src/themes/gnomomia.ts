/**
 * Gnomes of Gnomomia soundtrack: a cohesive acoustic score built around a shared
 * Gnomomia Leitmotif, with distinct modes, meters, motifs, and arrangements for
 * the Title Overture, all 8 chapters/zones, and cozy Hearthside Interiors.
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '../engine';
import { createFeltPiano, createFrenchHorn, createHarp, createSoftKit, createUprightBass } from '../instruments';
import { createFx } from '../mix';
import {
  MODES,
  NOTE_NAMES,
  chordTones,
  degreeToMidi,
  humanize,
  invertMotif,
  mulberry32,
  ornamentMotif,
  transposeMotif,
  voiceLead,
  type ModeName,
  type MotifNote,
} from '../theory';

export type GnomomiaThemeId =
  | 'title'
  | 'mossbottom'
  | 'thatchford'
  | 'keep'
  | 'deeps'
  | 'cloverfield'
  | 'hedgewood'
  | 'rockery'
  | 'verge'
  | 'interior';

type GrooveStyle = 'overture' | 'waltz' | 'folk' | 'march' | 'cavern' | 'breeze' | 'woodland' | 'stone' | 'finale' | 'hearth';

interface ChapterConfig {
  label: string;
  bpm: number;
  stepsPerBar: 12 | 16;
  mode: ModeName;
  root: number;
  progA: readonly number[];
  progB: readonly number[];
  motif: readonly MotifNote[];
  groove: GrooveStyle;
  reverbDecay: number;
  hornBrightness: number;
  harmonyHorn: boolean;
  quoteLeitmotif: boolean;
}

/** Shared Gnomomia Leitmotif (8 bars in 4/4, or compressed into 3/4): rising fifth, warm step, octave soar. */
const GNOMOMIA_LEITMOTIF: readonly MotifNote[] = [
  { bar: 0, step: 0, deg: 0, len: 6, vel: 0.85 },
  { bar: 0, step: 6, deg: 4, len: 10, vel: 0.92 },
  { bar: 1, step: 0, deg: 5, len: 6, vel: 0.84 },
  { bar: 1, step: 6, deg: 4, len: 10, vel: 0.82 },
  { bar: 2, step: 0, deg: 2, len: 6, vel: 0.78 },
  { bar: 2, step: 6, deg: 3, len: 6, vel: 0.76 },
  { bar: 3, step: 0, deg: 1, len: 12, vel: 0.74 },
  { bar: 4, step: 0, deg: 4, len: 6, vel: 0.86 },
  { bar: 4, step: 6, deg: 6, len: 6, vel: 0.88 },
  { bar: 5, step: 0, deg: 7, len: 12, vel: 0.95 },
  { bar: 6, step: 0, deg: 4, len: 8, vel: 0.82 },
  { bar: 6, step: 8, deg: 2, len: 8, vel: 0.78 },
  { bar: 7, step: 0, deg: 0, len: 14, vel: 0.8 },
];

const CHAPTERS: Record<GnomomiaThemeId, ChapterConfig> = {
  title: {
    label: 'Gnomomia Overture',
    bpm: 104,
    stepsPerBar: 16,
    mode: 'lydian',
    root: 53, // F3
    progA: [0, 1, 4, 0],
    progB: [3, 4, 5, 0],
    motif: GNOMOMIA_LEITMOTIF,
    groove: 'overture',
    reverbDecay: 6.0,
    hornBrightness: 1900,
    harmonyHorn: true,
    quoteLeitmotif: false,
  },
  mossbottom: {
    label: 'Ch. 1: Mossbottom',
    bpm: 100,
    stepsPerBar: 12,
    mode: 'lydian',
    root: 55, // G3
    progA: [0, 1, 4, 0],
    progB: [3, 4, 2, 0],
    motif: [
      { bar: 0, step: 0, deg: 4, len: 8, vel: 0.84 },
      { bar: 0, step: 8, deg: 5, len: 4, vel: 0.76 },
      { bar: 1, step: 0, deg: 4, len: 10, vel: 0.86 },
      { bar: 2, step: 0, deg: 2, len: 6, vel: 0.8 },
      { bar: 2, step: 6, deg: 3, len: 6, vel: 0.76 },
      { bar: 3, step: 0, deg: 1, len: 10, vel: 0.74 },
      { bar: 5, step: 0, deg: 4, len: 6, vel: 0.82 },
      { bar: 5, step: 6, deg: 6, len: 6, vel: 0.86 },
      { bar: 6, step: 0, deg: 7, len: 10, vel: 0.9 },
      { bar: 7, step: 0, deg: 4, len: 10, vel: 0.78 },
    ],
    groove: 'waltz',
    reverbDecay: 5.8,
    hornBrightness: 1750,
    harmonyHorn: true,
    quoteLeitmotif: true,
  },
  thatchford: {
    label: 'Ch. 2: Thatchford',
    bpm: 116,
    stepsPerBar: 16,
    mode: 'mixolydian',
    root: 50, // D3
    progA: [0, 6, 3, 0],
    progB: [4, 3, 6, 0],
    motif: [
      { bar: 0, step: 0, deg: 0, len: 4, vel: 0.84 },
      { bar: 0, step: 4, deg: 2, len: 4, vel: 0.8 },
      { bar: 0, step: 8, deg: 4, len: 8, vel: 0.88 },
      { bar: 1, step: 0, deg: 5, len: 4, vel: 0.84 },
      { bar: 1, step: 4, deg: 4, len: 4, vel: 0.8 },
      { bar: 1, step: 8, deg: 2, len: 8, vel: 0.78 },
      { bar: 2, step: 0, deg: 2, len: 6, vel: 0.82 },
      { bar: 2, step: 6, deg: 3, len: 4, vel: 0.78 },
      { bar: 2, step: 10, deg: 4, len: 6, vel: 0.86 },
      { bar: 3, step: 0, deg: 6, len: 8, vel: 0.88 },
      { bar: 3, step: 8, deg: 4, len: 8, vel: 0.8 },
      { bar: 5, step: 0, deg: 4, len: 6, vel: 0.85 },
      { bar: 5, step: 6, deg: 2, len: 4, vel: 0.78 },
      { bar: 5, step: 10, deg: 1, len: 6, vel: 0.76 },
      { bar: 6, step: 0, deg: 0, len: 12, vel: 0.84 },
    ],
    groove: 'folk',
    reverbDecay: 4.5,
    hornBrightness: 2000,
    harmonyHorn: false,
    quoteLeitmotif: true,
  },
  keep: {
    label: 'Ch. 3: The Keep',
    bpm: 108,
    stepsPerBar: 16,
    mode: 'dorian',
    root: 50, // D3
    progA: [0, 6, 3, 4],
    progB: [5, 6, 4, 0],
    motif: [
      { bar: 0, step: 0, deg: 0, len: 6, vel: 0.9 },
      { bar: 0, step: 6, deg: 4, len: 10, vel: 0.94 },
      { bar: 1, step: 0, deg: 4, len: 6, vel: 0.86 },
      { bar: 1, step: 6, deg: 3, len: 4, vel: 0.8 },
      { bar: 1, step: 10, deg: 2, len: 6, vel: 0.84 },
      { bar: 2, step: 0, deg: 4, len: 6, vel: 0.88 },
      { bar: 2, step: 6, deg: 5, len: 6, vel: 0.9 },
      { bar: 3, step: 0, deg: 4, len: 12, vel: 0.82 },
      { bar: 4, step: 0, deg: 0, len: 6, vel: 0.88 },
      { bar: 4, step: 6, deg: 4, len: 6, vel: 0.9 },
      { bar: 5, step: 0, deg: 7, len: 10, vel: 0.96 },
      { bar: 5, step: 10, deg: 6, len: 6, vel: 0.88 },
      { bar: 6, step: 0, deg: 5, len: 8, vel: 0.86 },
      { bar: 6, step: 8, deg: 4, len: 8, vel: 0.84 },
      { bar: 7, step: 0, deg: 0, len: 12, vel: 0.84 },
    ],
    groove: 'march',
    reverbDecay: 5.5,
    hornBrightness: 2200,
    harmonyHorn: true,
    quoteLeitmotif: true,
  },
  deeps: {
    label: 'Ch. 4: The Deeps',
    bpm: 82,
    stepsPerBar: 16,
    mode: 'phrygian',
    root: 52, // E3
    progA: [0, 1, 0, 6],
    progB: [3, 1, 5, 0],
    motif: [
      { bar: 0, step: 0, deg: 0, len: 10, vel: 0.8 },
      { bar: 0, step: 10, deg: 1, len: 6, vel: 0.74 },
      { bar: 1, step: 0, deg: 0, len: 12, vel: 0.76 },
      { bar: 2, step: 4, deg: 4, len: 8, vel: 0.84 },
      { bar: 2, step: 12, deg: 3, len: 4, vel: 0.76 },
      { bar: 3, step: 0, deg: 1, len: 12, vel: 0.72 },
      { bar: 5, step: 0, deg: 0, len: 8, vel: 0.82 },
      { bar: 5, step: 8, deg: 4, len: 8, vel: 0.86 },
      { bar: 6, step: 0, deg: 5, len: 10, vel: 0.84 },
      { bar: 6, step: 10, deg: 4, len: 6, vel: 0.78 },
      { bar: 7, step: 0, deg: 1, len: 14, vel: 0.74 },
    ],
    groove: 'cavern',
    reverbDecay: 8.0,
    hornBrightness: 1350,
    harmonyHorn: false,
    quoteLeitmotif: true,
  },
  cloverfield: {
    label: 'Ch. 5: Cloverfield',
    bpm: 112,
    stepsPerBar: 16,
    mode: 'lydian',
    root: 55, // G3
    progA: [0, 4, 5, 3],
    progB: [1, 4, 2, 0],
    motif: [
      { bar: 0, step: 0, deg: 2, len: 6, vel: 0.84 },
      { bar: 0, step: 6, deg: 4, len: 6, vel: 0.88 },
      { bar: 0, step: 12, deg: 7, len: 8, vel: 0.92 },
      { bar: 1, step: 4, deg: 6, len: 8, vel: 0.86 },
      { bar: 2, step: 0, deg: 4, len: 6, vel: 0.82 },
      { bar: 2, step: 6, deg: 5, len: 6, vel: 0.84 },
      { bar: 3, step: 0, deg: 4, len: 10, vel: 0.8 },
      { bar: 3, step: 10, deg: 2, len: 6, vel: 0.76 },
      { bar: 4, step: 0, deg: 0, len: 6, vel: 0.8 },
      { bar: 4, step: 6, deg: 2, len: 6, vel: 0.82 },
      { bar: 5, step: 0, deg: 4, len: 8, vel: 0.88 },
      { bar: 5, step: 8, deg: 6, len: 8, vel: 0.9 },
      { bar: 6, step: 0, deg: 7, len: 10, vel: 0.94 },
      { bar: 7, step: 0, deg: 4, len: 12, vel: 0.82 },
    ],
    groove: 'breeze',
    reverbDecay: 5.5,
    hornBrightness: 1950,
    harmonyHorn: true,
    quoteLeitmotif: true,
  },
  hedgewood: {
    label: 'Ch. 6: Hedgewood',
    bpm: 92,
    stepsPerBar: 12,
    mode: 'dorian',
    root: 57, // A3
    progA: [0, 3, 2, 0],
    progB: [5, 4, 3, 0],
    motif: [
      { bar: 0, step: 0, deg: 0, len: 6, vel: 0.82 },
      { bar: 0, step: 6, deg: 2, len: 6, vel: 0.84 },
      { bar: 1, step: 0, deg: 4, len: 10, vel: 0.88 },
      { bar: 2, step: 0, deg: 3, len: 6, vel: 0.8 },
      { bar: 2, step: 6, deg: 2, len: 6, vel: 0.76 },
      { bar: 3, step: 0, deg: 0, len: 10, vel: 0.74 },
      { bar: 4, step: 0, deg: 4, len: 6, vel: 0.84 },
      { bar: 4, step: 6, deg: 6, len: 6, vel: 0.88 },
      { bar: 5, step: 0, deg: 5, len: 10, vel: 0.86 },
      { bar: 6, step: 0, deg: 4, len: 6, vel: 0.82 },
      { bar: 6, step: 6, deg: 2, len: 6, vel: 0.78 },
      { bar: 7, step: 0, deg: 0, len: 10, vel: 0.76 },
    ],
    groove: 'woodland',
    reverbDecay: 7.0,
    hornBrightness: 1600,
    harmonyHorn: true,
    quoteLeitmotif: true,
  },
  rockery: {
    label: 'Ch. 7: The Rockery',
    bpm: 118,
    stepsPerBar: 16,
    mode: 'aeolian',
    root: 48, // C3
    progA: [0, 5, 3, 4],
    progB: [6, 5, 1, 0],
    motif: [
      { bar: 0, step: 0, deg: 0, len: 6, vel: 0.88 },
      { bar: 0, step: 6, deg: 0, len: 4, vel: 0.82 },
      { bar: 0, step: 10, deg: 3, len: 6, vel: 0.88 },
      { bar: 1, step: 0, deg: 2, len: 12, vel: 0.84 },
      { bar: 2, step: 0, deg: 0, len: 6, vel: 0.86 },
      { bar: 2, step: 6, deg: 4, len: 6, vel: 0.9 },
      { bar: 2, step: 12, deg: 3, len: 4, vel: 0.82 },
      { bar: 3, step: 0, deg: 1, len: 12, vel: 0.78 },
      { bar: 4, step: 0, deg: 0, len: 6, vel: 0.86 },
      { bar: 4, step: 6, deg: 2, len: 6, vel: 0.88 },
      { bar: 5, step: 0, deg: 4, len: 8, vel: 0.92 },
      { bar: 5, step: 8, deg: 5, len: 8, vel: 0.9 },
      { bar: 6, step: 0, deg: 4, len: 6, vel: 0.86 },
      { bar: 6, step: 6, deg: 3, len: 6, vel: 0.82 },
      { bar: 7, step: 0, deg: 0, len: 12, vel: 0.84 },
    ],
    groove: 'stone',
    reverbDecay: 5.2,
    hornBrightness: 1700,
    harmonyHorn: true,
    quoteLeitmotif: true,
  },
  verge: {
    label: 'Ch. 8: The Verge',
    bpm: 124,
    stepsPerBar: 16,
    mode: 'harmonic',
    root: 50, // D3
    progA: [0, 5, 3, 4],
    progB: [5, 6, 4, 0],
    motif: [
      { bar: 0, step: 0, deg: 0, len: 6, vel: 0.92 },
      { bar: 0, step: 6, deg: 4, len: 10, vel: 0.96 },
      { bar: 1, step: 0, deg: 5, len: 6, vel: 0.9 },
      { bar: 1, step: 6, deg: 4, len: 10, vel: 0.88 },
      { bar: 2, step: 0, deg: 7, len: 8, vel: 0.96 },
      { bar: 2, step: 8, deg: 6, len: 8, vel: 0.9 },
      { bar: 3, step: 0, deg: 4, len: 12, vel: 0.88 },
      { bar: 4, step: 0, deg: 2, len: 6, vel: 0.86 },
      { bar: 4, step: 6, deg: 4, len: 6, vel: 0.9 },
      { bar: 5, step: 0, deg: 6, len: 8, vel: 0.94 },
      { bar: 5, step: 8, deg: 7, len: 8, vel: 0.98 },
      { bar: 6, step: 0, deg: 5, len: 6, vel: 0.9 },
      { bar: 6, step: 6, deg: 4, len: 6, vel: 0.88 },
      { bar: 7, step: 0, deg: 0, len: 14, vel: 0.92 },
    ],
    groove: 'finale',
    reverbDecay: 6.2,
    hornBrightness: 2300,
    harmonyHorn: true,
    quoteLeitmotif: true,
  },
  interior: {
    label: 'Hearthside Chamber',
    bpm: 88,
    stepsPerBar: 16,
    mode: 'ionian',
    root: 53, // F3
    progA: [0, 3, 5, 4],
    progB: [3, 4, 2, 0],
    motif: [
      { bar: 0, step: 0, deg: 4, len: 8, vel: 0.78 },
      { bar: 0, step: 8, deg: 2, len: 8, vel: 0.74 },
      { bar: 1, step: 0, deg: 0, len: 12, vel: 0.76 },
      { bar: 2, step: 4, deg: 2, len: 6, vel: 0.74 },
      { bar: 2, step: 10, deg: 3, len: 6, vel: 0.76 },
      { bar: 3, step: 0, deg: 4, len: 12, vel: 0.8 },
      { bar: 5, step: 0, deg: 5, len: 8, vel: 0.8 },
      { bar: 5, step: 8, deg: 4, len: 8, vel: 0.76 },
      { bar: 6, step: 0, deg: 2, len: 10, vel: 0.74 },
      { bar: 7, step: 0, deg: 0, len: 12, vel: 0.72 },
    ],
    groove: 'hearth',
    reverbDecay: 4.2,
    hornBrightness: 1400,
    harmonyHorn: false,
    quoteLeitmotif: false,
  },
};

type Section = 'A' | 'B' | 'C' | 'A2';
const SONG: Section[] = ['A', 'B', 'C', 'A2'];
const SECTION_BARS = 16;

function fitMotifToMeter(motif: readonly MotifNote[], stepsPerBar: number): MotifNote[] {
  if (stepsPerBar === 16) return motif.map((n) => ({ ...n }));
  return motif.map((n) => {
    const step = Math.min(stepsPerBar - 1, Math.round((n.step * stepsPerBar) / 16));
    const len = Math.max(2, Math.round((n.len * stepsPerBar) / 16));
    return { ...n, step, len };
  });
}

function indexMotif(notes: readonly MotifNote[], stepsPerBar: number): Map<number, MotifNote[]> {
  const m = new Map<number, MotifNote[]>();
  for (const n of notes) {
    const key = n.bar * stepsPerBar + n.step;
    const list = m.get(key) ?? [];
    list.push(n);
    m.set(key, list);
  }
  return m;
}

export function buildGnomomiaTheme(T: Tone, keep: Keep, out: ToneNS.Volume, themeId: GnomomiaThemeId, seed = 777): void {
  const cfg = CHAPTERS[themeId];
  const rnd = mulberry32(seed);
  const stepsPerBar = cfg.stepsPerBar;

  T.getTransport().bpm.value = cfg.bpm;
  const step16 = T.Time('16n').toSeconds();
  const hold = (steps: number) => steps * step16 * 0.94;

  const fx = createFx(T, keep, out, {
    reverbDecay: cfg.reverbDecay,
    reverbHp: 220,
    echoTime: cfg.stepsPerBar === 12 ? '4n.' : '8n.',
    echoFeedback: cfg.groove === 'cavern' ? 0.44 : 0.3,
    echoLp: 2500,
  });

  // Mixed cleanly so default game volume settings stay clearly audible alongside SFX.
  const horn = createFrenchHorn(T, keep, out, fx, { volumeDb: -6, revSend: 0.65, brightness: cfg.hornBrightness });
  const harmonyHorn = cfg.harmonyHorn
    ? createFrenchHorn(T, keep, out, fx, { volumeDb: -10, revSend: 0.72, brightness: cfg.hornBrightness - 250, attack: 0.14 })
    : null;
  const harp = createHarp(T, keep, out, fx, { volumeDb: -4, revSend: 0.68, echoSend: 0.24 });
  const piano = createFeltPiano(T, keep, out, fx, { volumeDb: -5, revSend: 0.55, echoSend: 0.16 });
  const bass = createUprightBass(T, keep, out, { volumeDb: -4 });
  const kit = cfg.groove === 'hearth' ? null : createSoftKit(T, keep, out, fx, { volumeDb: -2, revSend: 0.36 });

  const mode = MODES[cfg.mode];
  const voiceProg = (prog: readonly number[]): number[][] => {
    let prev: number[] | null = null;
    return prog.map((deg) => (prev = voiceLead(chordTones(mode, deg, 4), 12, prev)));
  };
  const chordsA = voiceProg(cfg.progA);
  const chordsB = voiceProg(cfg.progB);

  const primaryMotif = fitMotifToMeter(cfg.motif, stepsPerBar);
  const bMotif = cfg.quoteLeitmotif
    ? fitMotifToMeter(GNOMOMIA_LEITMOTIF, stepsPerBar)
    : ornamentMotif(transposeMotif(primaryMotif, 2, 0.92), rnd, stepsPerBar);
  const cMotif = invertMotif(primaryMotif, 3);
  const harmonyMotif = transposeMotif(primaryMotif, 2, 0.78);

  const primaryMap = indexMotif(primaryMotif, stepsPerBar);
  const bMap = indexMotif(bMotif, stepsPerBar);
  const cMap = indexMotif(cMotif, stepsPerBar);
  const harmonyMap = indexMotif(harmonyMotif, stepsPerBar);

  console.info(`[music] ${cfg.label} in ${NOTE_NAMES[cfg.root % 12]} ${cfg.mode}, ${cfg.bpm} bpm`);

  let step = 0;
  const loop = keep(new T.Loop((time) => {
    const bar = Math.floor(step / stepsPerBar);
    const pos = step % stepsPerBar;
    const vel = humanize(step, 0.1);
    step++;

    const section = SONG[Math.floor(bar / SECTION_BARS) % SONG.length];
    const sb = bar % SECTION_BARS;
    const isB = section === 'B';
    const isC = section === 'C';
    const isA2 = section === 'A2';

    const prog = isB ? chordsB : chordsA;
    const degs = isB ? cfg.progB : cfg.progA;
    const ci = Math.floor(sb / 2) % prog.length;
    const chord = prog[ci].map((n) => cfg.root + n);
    const bassMidi = cfg.root - 12 + mode[degs[ci] % 7];

    // Upright bass
    if (!isC) {
      if (cfg.groove === 'folk' || cfg.groove === 'breeze') {
        if (pos === 0) bass.play(bassMidi, hold(5), time, 0.85 * vel);
        else if (pos === 8) bass.play(bassMidi + 7, hold(5), time, 0.72 * vel);
      } else if (cfg.groove === 'stone' || cfg.groove === 'finale') {
        if (pos === 0 || pos === 6) bass.play(bassMidi, hold(4), time, 0.88 * vel);
        else if (pos === 12) bass.play(bassMidi + 7, hold(3), time, 0.74 * vel);
      } else if (cfg.groove === 'cavern') {
        if (pos === 0 && sb % 2 === 0) bass.play(bassMidi, hold(14), time, 0.82 * vel);
      } else {
        if (pos === 0) bass.play(bassMidi, hold(7), time, 0.84 * vel);
        else if (pos === (stepsPerBar === 12 ? 8 : 10) && sb % 2 === 1) {
          bass.play(bassMidi + 7, hold(3), time, 0.6 * vel);
        }
      }
    }

    // Harp accompaniment
    if (pos === 0 && sb % 2 === 0) {
      harp.arp(chord, time, 0.045, (isC ? 0.88 : 0.74) * vel);
    } else if (cfg.groove === 'breeze' || cfg.groove === 'folk') {
      if (pos % 4 === 0 && pos > 0) {
        harp.pluck(chord[(pos / 4) % chord.length] + (isC ? 12 : 0), time, 0.56 * vel);
      }
    } else if (stepsPerBar === 12 && (pos === 4 || pos === 8) && (isC || sb % 2 === 1)) {
      harp.pluck(chord[(pos === 4 ? 1 : 2) % chord.length] + (isC ? 12 : 0), time, 0.56 * vel);
    } else if (stepsPerBar === 16 && pos === 8 && (isC || sb % 2 === 1)) {
      harp.pluck(chord[2 % chord.length] + 12, time, 0.54 * vel);
    }

    // Felt Piano: warm voicings or rhythmic stone/finale ostinato
    if ((cfg.groove === 'stone' || cfg.groove === 'finale') && !isC) {
      if (pos % 4 === 0) {
        piano.play(pos === 0 ? chord : chord.slice(0, 2), hold(3), time, (pos === 0 ? 0.72 : 0.48) * vel);
      }
    } else if (pos === 0 && sb % 2 === 0) {
      piano.play(chord, hold(stepsPerBar * 1.7), time, (isC ? 0.66 : 0.54) * vel);
    }

    // Melody: Horn in A/B/A2 (quoting the Gnomomia Leitmotif in B), Piano/Harp in C breakdown
    const p8 = sb % 8;
    const key = p8 * stepsPerBar + pos;
    const notes = isB ? bMap.get(key) : isC ? cMap.get(key) : primaryMap.get(key);
    if (notes) {
      for (const n of notes) {
        const midi = degreeToMidi(cfg.root + 12, mode, n.deg);
        const dur = hold(n.len);
        const v = (n.vel ?? 0.82) * vel;
        if (isC) {
          piano.play(midi, dur, time, v * 0.86);
        } else if (cfg.groove === 'hearth') {
          piano.play(midi, dur, time, v * 0.84);
          if (n.len >= 8) harp.pluck(midi + 12, time, v * 0.55);
        } else {
          horn.play(midi - 12, dur, time, v);
        }
      }
    }

    // Harmony Horn in A2 (and finale B)
    if (harmonyHorn && (isA2 || (cfg.groove === 'finale' && isB)) && sb >= 8) {
      const hNotes = harmonyMap.get(key);
      if (hNotes) {
        for (const n of hNotes) {
          harmonyHorn.play(degreeToMidi(cfg.root + 12, mode, n.deg) - 12, hold(n.len), time, (n.vel ?? 0.75) * vel * 0.84);
        }
      }
    }

    // Percussion groove
    if (kit && !isC) {
      if (cfg.groove === 'waltz' || cfg.groove === 'woodland') {
        if (pos === 0) kit.kick(time, 0.72 * vel);
        if (pos === 4 || pos === 8) kit.brush(time, 0.46 * vel);
        if (isA2 && pos % 4 === 2) kit.shaker(time, 0.34 * vel);
      } else if (cfg.groove === 'march') {
        if (pos === 0 || pos === 8) kit.kick(time, 0.8 * vel);
        if (pos === 4 || pos === 12) kit.rim(time, 0.68 * vel);
        if (pos === 14 && sb % 2 === 1) kit.rim(time, 0.48 * vel);
      } else if (cfg.groove === 'stone' || cfg.groove === 'finale') {
        if (pos === 0 || pos === 6 || pos === 10) kit.kick(time, 0.82 * vel);
        if (pos === 4 || pos === 12) kit.rim(time, 0.72 * vel);
        if (pos % 2 === 0) kit.shaker(time, 0.36 * vel);
      } else if (cfg.groove === 'cavern') {
        if (pos === 0 && sb % 2 === 0) kit.kick(time, 0.65 * vel);
        if (pos === 12 && sb % 4 === 3) kit.rim(time, 0.42 * vel);
      } else {
        // overture, folk, breeze
        if (pos === 0 || (cfg.groove === 'folk' && pos === 10)) kit.kick(time, 0.74 * vel);
        if (pos === 8) kit.brush(time, 0.54 * vel);
        if ((isB || isA2) && pos % 4 === 2) kit.shaker(time, 0.36 * vel);
      }
    }
  }, '16n'));
  loop.start(0);
}

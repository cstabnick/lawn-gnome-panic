/**
 * Theme: Shifting Sand Sitar / Desert (4/4 time, 118-126 bpm).
 *
 * Inspired by Mario 64's Shifting Sand Land:
 * - Phrygian Dominant (Hijaz) and Double Harmonic Major scales with the signature b2 -> 3
 *   augmented-second desert color.
 * - Cascading 16th-note sitar arpeggios and ornamented upper-register sitar melodies.
 * - Syncopated hand-drum / bongo grooves (low open "dum", crisp high "tak", palm slaps,
 *   ghost finger taps, and dry sand shaker) with 8-bar fills and an oasis breakdown.
 * - Warm plucked bass ostinato and a soft mirage drone pad.
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '../engine';
import { createAmbientPad, createBongoKit, createSitar, createUprightBass } from '../instruments';
import { createFx } from '../mix';
import {
  MODES,
  NOTE_NAMES,
  degreeToMidi,
  humanize,
  mulberry32,
  ornamentMotif,
  transposeMotif,
  type ModeName,
  type MotifNote,
} from '../theory';

interface DesertPreset {
  name: string;
  mode: Extract<ModeName, 'phrygianDominant' | 'doubleHarmonic'>;
  /** Chord root scale degrees per 2-bar (or 1-bar) harmonic cell: 0 = I, 1 = bII, 6 = bvii, 3 = iv. */
  a: number[];
  b: number[];
}

const PRESETS: DesertPreset[] = [
  { name: 'Shifting Hijaz',     mode: 'phrygianDominant', a: [0, 1, 0, 1], b: [3, 1, 6, 0] },
  { name: 'Pyramid Phrygian',   mode: 'phrygianDominant', a: [0, 0, 1, 0], b: [1, 6, 1, 0] },
  { name: 'Sunburst Caravan',   mode: 'phrygianDominant', a: [0, 6, 1, 0], b: [3, 6, 1, 0] },
  { name: 'Double Harmonic',    mode: 'doubleHarmonic',   a: [0, 1, 0, 1], b: [3, 1, 0, 0] },
];

/** 16-step sitar arpeggio patterns in diatonic scale-degree offsets from the chord root. */
const ARP_PATTERNS: readonly (readonly number[])[] = [
  [0, 2, 4, 7, 4, 2, 1, 2,  0, 2, 4, 7, 8, 7, 4, 2], // sweeping I -> b2 -> 3 -> 5 -> oct
  [0, 4, 2, 4, 7, 4, 2, 1,  0, 4, 2, 7, 5, 4, 2, 1], // bouncy Shifting Sand Land shimmer
  [0, 1, 2, 4, 5, 4, 2, 1,  0, 2, 4, 7, 5, 4, 2, 0], // scalar Hijaz climb & cascade
  [7, 4, 2, 0, 1, 2, 4, 7,  8, 7, 4, 2, 1, 2, 4, 2], // descending-ascending sitar roll
];

/** Hand-drum groove step codes: L=low, H=high, S=slap, T=ghost tap, .=rest. */
const BONGO_GROOVES_A = [
  'L.T.S.T.L.L.S.T.', // Maqsoum-inspired driving bongo
  'L.TH.TS.L.T.S.HT', // syncopated Shifting Sand Land bounce
  'L.T.H.S.L.L.H.ST', // rolling hand-drum groove
];

const BONGO_GROOVES_B = [
  'LTH.S.THL.LHS.TH', // dense interlocking bongo & slap
  'L.THS.L.LTH.S.HT', // double-time caravan groove
];

/** Bongo fill for the last bar of an 8-bar phrase. */
const BONGO_FILL = 'L.H.S.H.LTH.SHST';

/** Catchy upper-register sitar melody for Section B and the Oasis Breakdown. */
const LEAD_MOTIF: MotifNote[] = [
  { bar: 0, step: 0,  deg: 4, len: 6, vel: 0.9 },
  { bar: 0, step: 6,  deg: 5, len: 4, vel: 0.82 },
  { bar: 0, step: 10, deg: 4, len: 6, vel: 0.85 },
  { bar: 1, step: 0,  deg: 2, len: 4, vel: 0.86 },
  { bar: 1, step: 4,  deg: 1, len: 4, vel: 0.88 },
  { bar: 1, step: 8,  deg: 0, len: 8, vel: 0.82 },
  { bar: 2, step: 0,  deg: 1, len: 6, vel: 0.85 },
  { bar: 2, step: 6,  deg: 2, len: 4, vel: 0.84 },
  { bar: 2, step: 10, deg: 4, len: 6, vel: 0.88 },
  { bar: 3, step: 0,  deg: 7, len: 8, vel: 0.92 },
  { bar: 3, step: 10, deg: 5, len: 6, vel: 0.8 },
];

type Section = 'A' | 'B' | 'C';
const SONG: Section[] = ['A', 'B', 'A', 'C'];
const SECTION_BARS = 16;

function indexMotif(notes: readonly MotifNote[]): Map<number, MotifNote[]> {
  const m = new Map<number, MotifNote[]>();
  for (const n of notes) {
    const key = n.bar * 16 + n.step;
    const list = m.get(key) ?? [];
    list.push(n);
    m.set(key, list);
  }
  return m;
}

export function buildDesertSands(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void {
  const rnd = mulberry32(seed);
  const pick = <V>(xs: readonly V[]): V => xs[Math.floor(rnd() * xs.length)];

  const bpm = 118 + Math.floor(rnd() * 9);
  T.getTransport().bpm.value = bpm;
  const step16 = T.Time('16n').toSeconds();
  const hold = (steps: number) => steps * step16 * 0.92;

  const fx = createFx(T, keep, out, {
    reverbDecay: 3.4,
    reverbHp: 320,
    snareSend: 0.16,
    echoTime: '8n.',
    echoFeedback: 0.30,
    echoLp: 3000,
  });

  const duck = keep(new T.Gain(1)).connect(out);
  const bongos = createBongoKit(T, keep, out, fx, { volumeDb: -2.5, revSend: 0.24 });
  const sitar = createSitar(T, keep, duck, fx, { volumeDb: -8, revSend: 0.38, echoSend: 0.26 });
  const leadSitar = createSitar(T, keep, duck, fx, { volumeDb: -6.5, revSend: 0.48, echoSend: 0.34, dampening: 4800 });
  const bass = createUprightBass(T, keep, duck, { volumeDb: -7 });
  const pad = createAmbientPad(T, keep, duck, fx, { volumeDb: -24, revSend: 0.65, brightness: 950 });

  const preset = pick(PRESETS);
  const mode = MODES[preset.mode];
  const root = pick([50, 52, 53, 55]); // D3, E3, F3, G3

  const arpA = pick(ARP_PATTERNS);
  const arpB = pick(ARP_PATTERNS);
  const grooveA = pick(BONGO_GROOVES_A);
  const grooveB = pick(BONGO_GROOVES_B);

  const leadMapA = indexMotif(ornamentMotif(LEAD_MOTIF, rnd, 16));
  const leadMapB = indexMotif(ornamentMotif(transposeMotif(LEAD_MOTIF, 1, 0.95), rnd, 16));

  console.info(`[music] Desert Sands (${preset.name}) in ${NOTE_NAMES[root % 12]} ${preset.mode}, ${bpm} bpm`);

  let step = 0;
  const loop = keep(new T.Loop((time) => {
    const bar = Math.floor(step / 16);
    const pos = step % 16;
    const vel = humanize(step, 0.1);
    step++;

    const sectionIdx = Math.floor(bar / SECTION_BARS);
    const section = SONG[sectionIdx % SONG.length];
    const sb = bar % SECTION_BARS;
    const intro = sectionIdx === 0 && sb < 4;
    const breakdown = section === 'C' && sb < 8;
    const isB = section === 'B';

    const prog = isB ? preset.b : preset.a;
    const chordDeg = prog[Math.floor(sb / 2) % prog.length];

    // 1. Hand drums (bongos + shaker)
    if (breakdown) {
      // Oasis breakdown: airy sand shaker and sparse low bongo pulse; roll back in on bar 7
      if (sb === 7) {
        const ch = BONGO_FILL[pos];
        if (ch === 'L') bongos.low(time, 0.72 * vel);
        else if (ch === 'H') bongos.high(time, 0.68 * vel);
        else if (ch === 'S') bongos.slap(time, 0.75 * vel);
        else if (ch === 'T') bongos.tap(time, 0.45 * vel);
      } else {
        if (pos === 0 && sb % 2 === 0) bongos.low(time, 0.62 * vel);
        if (pos % 4 === 2) bongos.shaker(time, 0.42 * vel);
      }
    } else {
      const lastOfEight = sb % 8 === 7;
      const groove = lastOfEight ? BONGO_FILL : (isB ? grooveB : grooveA);
      const ch = groove[pos];
      if (ch === 'L') {
        bongos.low(time, (pos === 0 ? 0.9 : 0.78) * vel);
        if (pos === 0) {
          duck.gain.setValueAtTime(0.72, time);
          duck.gain.linearRampToValueAtTime(1, time + 0.12);
        }
      } else if (ch === 'H') {
        bongos.high(time, 0.76 * vel);
      } else if (ch === 'S') {
        bongos.slap(time, 0.84 * vel);
      } else if (ch === 'T') {
        bongos.tap(time, 0.5 * vel);
      }
      // Sand shaker on 8th-note offbeats (and subtle 16ths in B)
      if (pos % 4 === 2 || (isB && pos % 2 === 1)) {
        bongos.shaker(time, (pos % 4 === 2 ? 0.54 : 0.32) * vel);
      }
    }

    // 2. Bass ostinato (root + 5th/octave desert bounce, enters after 4-bar intro or immediately on root)
    if (!breakdown) {
      const bassRoot = degreeToMidi(root - 12, mode, chordDeg);
      if (pos === 0) {
        bass.play(bassRoot, hold(4), time, 0.88 * vel);
      } else if (!intro && pos === 6) {
        bass.play(bassRoot + 7, hold(2), time, 0.72 * vel);
      } else if (!intro && pos === 8) {
        bass.play(bassRoot, hold(4), time, 0.82 * vel);
      } else if (isB && pos === 14) {
        bass.play(bassRoot + 12, hold(2), time, 0.68 * vel);
      }
    }

    // 3. Mirage pad drone (open 5th, 1 chord per 2 bars)
    if (pos === 0 && sb % 2 === 0) {
      const padRoot = degreeToMidi(root, mode, chordDeg);
      pad.play([padRoot, padRoot + 7], hold(30), time, breakdown ? 0.58 : 0.36);
    }

    // 4. Cascading sitar arpeggios (16th notes in A/B/C-drop, spacious 8th-note arps in breakdown)
    const arpPattern = isB ? arpB : arpA;
    if (breakdown) {
      if (pos % 2 === 0) {
        const deg = chordDeg + arpPattern[pos];
        sitar.pluck(degreeToMidi(root + 12, mode, deg), time, 0.65 * vel);
      }
    } else {
      const deg = chordDeg + arpPattern[pos];
      const accent = pos % 4 === 0 ? 0.84 : pos % 2 === 0 ? 0.68 : 0.54;
      sitar.pluck(degreeToMidi(root + 12, mode, deg), time, accent * vel);
    }

    // 5. Upper-register sitar lead melody (in Section B, second half of Section A, and Oasis Breakdown)
    if (isB || breakdown || (section === 'A' && sb >= 8)) {
      const motifStep = (sb % 4) * 16 + pos;
      const notes = (isB ? leadMapB : leadMapA).get(motifStep);
      if (notes) {
        for (const n of notes) {
          const midi = degreeToMidi(root + 12, mode, n.deg + (isB ? 0 : 0));
          leadSitar.pluck(midi, time, (n.vel ?? 0.85) * vel);
        }
      }
    }
  }, '16n'));
  loop.start(0);
}

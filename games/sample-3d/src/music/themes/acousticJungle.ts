/**
 * Theme: Liquid Garden / Acoustic Jungle (4/4 time, 160-168 bpm).
 *
 * Keeps the kinetic Gnomoria breakbeat pulse, but replaces harsh synths with
 * natural, reverby instruments and plenty of air:
 * - Soft, low-grit breakbeat (Amen/Think/Apache) with wide 8-bar breakdowns.
 * - Felt Piano rolls warm liquid 7th/9th chords.
 * - Harp cascades across chord changes and fills the breakdown space.
 * - French Horn soars over section B and the breakdown, riffing on a seeded motif.
 * - Upright Bass + clean sine sub keep the low end warm and natural.
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '../engine';
import { BREAKS, chopBar, createKit, transitionFill, withFill, type Slice, type TransitionFill } from '../drums';
import { createFeltPiano, createFrenchHorn, createHarp, createUprightBass } from '../instruments';
import { createFx } from '../mix';
import {
  MODES,
  NOTE_NAMES,
  chordTones,
  degreeToMidi,
  humanize,
  mulberry32,
  ornamentMotif,
  transposeMotif,
  voiceLead,
  type ModeName,
  type MotifNote,
} from '../theory';

interface JunglePreset {
  name: string;
  mode: ModeName;
  a: number[];
  b: number[];
}

const PRESETS: JunglePreset[] = [
  { name: 'Liquid Lydian',  mode: 'lydian',  a: [0, 1, 4, 0], b: [3, 4, 2, 0] },
  { name: 'Sunlit Dorian',  mode: 'dorian',  a: [0, 3, 2, 1], b: [3, 2, 1, 0] },
  { name: 'Garden Aeolian', mode: 'aeolian', a: [5, 6, 4, 0], b: [3, 5, 6, 0] },
];

const HORN_MOTIF: MotifNote[] = [
  { bar: 0, step: 0, deg: 4, len: 10, vel: 0.85 },
  { bar: 1, step: 0, deg: 5, len: 6, vel: 0.8 },
  { bar: 1, step: 8, deg: 4, len: 8, vel: 0.78 },
  { bar: 2, step: 0, deg: 2, len: 12, vel: 0.82 },
  // Bar 3 breathes
  { bar: 4, step: 0, deg: 4, len: 8, vel: 0.84 },
  { bar: 4, step: 10, deg: 6, len: 6, vel: 0.86 },
  { bar: 5, step: 0, deg: 7, len: 12, vel: 0.9 },
  { bar: 6, step: 0, deg: 4, len: 14, vel: 0.78 },
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

export function buildAcousticJungle(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void {
  const rnd = mulberry32(seed);
  const pick = <V>(xs: V[]): V => xs[Math.floor(rnd() * xs.length)];

  const bpm = 160 + Math.floor(rnd() * 9);
  T.getTransport().bpm.value = bpm;
  const step16 = T.Time('16n').toSeconds();
  const hold = (steps: number) => steps * step16 * 0.95;

  const fx = createFx(T, keep, out, { reverbDecay: 5.5, reverbHp: 260, snareSend: 0.22, echoTime: '8n.', echoFeedback: 0.36, echoLp: 2500 });
  const swing = 0.08 + 0.08 * mulberry32((seed ^ 0x5bd1e995) >>> 0)();
  const kit = createKit(T, keep, out, fx, { grit: 0.04, snarePitch: 'E3', swing });

  const duck = keep(new T.Gain(1)).connect(out);
  const piano = createFeltPiano(T, keep, duck, fx, { volumeDb: -8, revSend: 0.58, echoSend: 0.18 });
  const harp = createHarp(T, keep, duck, fx, { volumeDb: -9, revSend: 0.72, echoSend: 0.24 });
  const horn = createFrenchHorn(T, keep, duck, fx, { volumeDb: -13, revSend: 0.72, brightness: 1650 });
  const bass = createUprightBass(T, keep, duck, { volumeDb: -8 });

  const preset = pick(PRESETS);
  const mode = MODES[preset.mode];
  const root = 45 + Math.floor(rnd() * 8); // A2..E3

  const voiceProg = (prog: number[]): number[][] => {
    let prev: number[] | null = null;
    return prog.map((deg) => (prev = voiceLead(chordTones(mode, deg, 4), 12, prev)));
  };
  const chordsA = voiceProg(preset.a);
  const chordsB = voiceProg(preset.b);

  const hornMap = indexMotif(HORN_MOTIF);
  const hornRiffMap = indexMotif(ornamentMotif(transposeMotif(HORN_MOTIF, 2, 0.92), rnd, 16));

  const mainIdx = Math.floor(rnd() * BREAKS.length);
  const mainBreak = BREAKS[mainIdx].steps;
  const altBreak = BREAKS[(mainIdx + 1 + Math.floor(rnd() * (BREAKS.length - 1))) % BREAKS.length];
  const straight = [chopBar(rnd, mainBreak, 0, 0), chopBar(rnd, mainBreak, 1, 0)];
  const drumsA = [chopBar(rnd, mainBreak, 0, 0.1), chopBar(rnd, mainBreak, 1, 0.15), chopBar(rnd, mainBreak, 0, 0.1), chopBar(rnd, mainBreak, 1, 0.22)];
  const drumsB = [chopBar(rnd, altBreak.steps, 0, 0.22), chopBar(rnd, altBreak.steps, 1, 0.28), chopBar(rnd, altBreak.steps, 0, 0.22), chopBar(rnd, altBreak.steps, 1, 0.35)];
  const fillA = withFill(drumsA[3], 12);
  const fillB = withFill(drumsB[3], 12);

  const fillRnd = mulberry32((seed ^ 0x27d4eb2d) >>> 0);
  let lastFill: TransitionFill | null = null;
  const fills: TransitionFill[] = ['roll', 'cut', 'stutter', 'syncopated'];
  const nextFill = (): TransitionFill => {
    const options = fills.filter((f) => f !== lastFill);
    return (lastFill = options[Math.floor(fillRnd() * options.length)]);
  };

  console.info(`[music] Liquid Garden (${preset.name}) in ${NOTE_NAMES[root % 12]} ${preset.mode}, ${bpm} bpm`);

  let step = 0;
  let pattern: Slice[] | null = null;
  const loop = keep(new T.Loop((time) => {
    const bar = Math.floor(step / 16);
    const pos = step % 16;
    const vel = humanize(step, 0.1);
    step++;

    const sectionIdx = Math.floor(bar / SECTION_BARS);
    const section = SONG[sectionIdx % SONG.length];
    const sb = bar % SECTION_BARS;
    const intro = sectionIdx === 0;
    const breakdown = section === 'C' && sb < 8;

    if (pos === 0) {
      const lastOfEight = sb % 8 === 7;
      const lastOfSection = sb === SECTION_BARS - 1;
      if (lastOfSection) pattern = transitionFill(section === 'B' ? drumsB[3] : drumsA[3], nextFill());
      else if (breakdown) pattern = sb >= 6 ? straight[sb % 2].map((s) => (s.h ? { h: 1 as const } : {})) : null;
      else if (intro && sb < 8) pattern = lastOfEight ? fillA : straight[sb % 2];
      else if (section === 'B') pattern = lastOfEight ? fillB : drumsB[sb % 4];
      else pattern = lastOfEight ? fillA : drumsA[sb % 4];
    }

    if (pos === 12) fx.throwSend.gain.setValueAtTime(sb % 4 === 3 ? 0.45 : 0, time);
    if (pos === 0) fx.throwSend.gain.setValueAtTime(0, time);

    const sl = pattern?.[pos];
    if (sl && kit.hit(sl, time, pos, vel)) {
      duck.gain.setValueAtTime(0.68, time);
      duck.gain.linearRampToValueAtTime(1, time + 0.12);
    }

    const isB = section === 'B';
    const prog = isB ? chordsB : chordsA;
    const degs = isB ? preset.b : preset.a;
    const ci = Math.floor(sb / 2) % prog.length;
    const chord = prog[ci].map((n) => root + n);
    const bassMidi = root - 12 + mode[degs[ci] % 7];

    // Upright bass: enters halfway through intro
    if (!(intro && sb < 8)) {
      if (breakdown) {
        if (pos === 0 && sb % 2 === 0) bass.play(bassMidi, hold(26), time, 0.72 * vel);
      } else if (pos === 0 || pos === 10) {
        bass.play(bassMidi, hold(pos === 0 ? 8 : 5), time, (pos === 0 ? 0.88 : 0.72) * vel);
      }
    }

    // Felt Piano: liquid chord comping
    if (breakdown) {
      if (pos === 0 && sb % 2 === 0) piano.play(chord, hold(28), time, 0.68 * vel);
    } else if (pos === 0 && sb % 2 === 0) {
      piano.play(chord, hold(12), time, 0.62 * vel);
    } else if (pos === 10 && sb % 2 === 1) {
      piano.play(chord, hold(6), time, 0.48 * vel);
    }

    // Harp: cascading sweeps on every 2-bar chord change + airy plucks in breakdown
    if (pos === 0 && sb % 2 === 0) {
      harp.arp(chord, time, 0.042, (breakdown ? 0.8 : 0.62) * vel);
    } else if (breakdown && (pos === 6 || pos === 12)) {
      harp.pluck(chord[(pos === 6 ? 1 : 3) % chord.length] + 12, time, 0.58 * vel);
    }

    // French Horn: sings in B and breakdown, riffs higher on repeats
    const p8Pos = (sb % 8) * 16 + pos;
    if (isB || breakdown) {
      const activeHorn = sectionIdx >= 4 ? hornRiffMap : hornMap;
      const hNotes = activeHorn.get(p8Pos);
      if (hNotes) {
        for (const n of hNotes) {
          horn.play(degreeToMidi(root, mode, n.deg), hold(n.len), time, (n.vel ?? 0.82) * vel);
        }
      }
    }
  }, '16n'));
  loop.start(0);
}

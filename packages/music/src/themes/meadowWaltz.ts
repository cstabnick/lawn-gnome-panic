/**
 * Theme: Meadow Waltz (3/4 time, 12 16th-steps per bar, 94-108 bpm).
 *
 * Pastoral, spacious, and reverby:
 * - Harp rolls gentle 3/4 arpeggios; Upright Bass anchors beat 1.
 * - French Horn sings an 8-bar lyrical motif with wide breathing room.
 * - Section B riffs on the motif (Felt Piano takes an ornamented/transposed variation,
 *   Horn answers with warm sustained tones).
 * - Section C opens into a cavernous Harp & Piano breakdown.
 * - Section A2 brings the ensemble back with a second harmony horn a third/fifth above.
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
  mulberry32,
  ornamentMotif,
  transposeMotif,
  voiceLead,
  type ModeName,
  type MotifNote,
} from '../theory';

const STEPS_PER_BAR = 12; // 3/4 in 16th-notes

interface WaltzPreset {
  name: string;
  mode: ModeName;
  a: number[];
  b: number[];
}

const PRESETS: WaltzPreset[] = [
  { name: 'Sunlit Lydian',  mode: 'lydian',     a: [0, 1, 4, 0], b: [3, 4, 2, 0] },
  { name: 'Clover Major',   mode: 'ionian',     a: [0, 5, 3, 4], b: [3, 0, 1, 4] },
  { name: 'Mossy Dorian',   mode: 'dorian',     a: [0, 3, 2, 0], b: [4, 3, 1, 0] },
  { name: 'Evening Breeze', mode: 'mixolydian', a: [0, 6, 3, 0], b: [4, 3, 6, 0] },
];

const MOTIFS: MotifNote[][] = [
  [
    { bar: 0, step: 0, deg: 4, len: 8, vel: 0.82 },
    { bar: 0, step: 8, deg: 5, len: 4, vel: 0.72 },
    { bar: 1, step: 0, deg: 4, len: 10, vel: 0.85 },
    { bar: 2, step: 0, deg: 2, len: 6, vel: 0.78 },
    { bar: 2, step: 6, deg: 3, len: 6, vel: 0.75 },
    { bar: 3, step: 0, deg: 1, len: 10, vel: 0.72 },
    // Bar 4 rests for space
    { bar: 5, step: 0, deg: 4, len: 6, vel: 0.8 },
    { bar: 5, step: 6, deg: 6, len: 6, vel: 0.84 },
    { bar: 6, step: 0, deg: 7, len: 10, vel: 0.88 },
    { bar: 7, step: 0, deg: 4, len: 10, vel: 0.76 },
  ],
  [
    { bar: 0, step: 0, deg: 0, len: 6, vel: 0.78 },
    { bar: 0, step: 6, deg: 2, len: 6, vel: 0.8 },
    { bar: 1, step: 0, deg: 4, len: 10, vel: 0.86 },
    { bar: 2, step: 4, deg: 5, len: 8, vel: 0.82 },
    { bar: 3, step: 0, deg: 4, len: 10, vel: 0.75 },
    { bar: 4, step: 0, deg: 2, len: 8, vel: 0.76 },
    { bar: 4, step: 8, deg: 1, len: 4, vel: 0.7 },
    { bar: 5, step: 0, deg: 0, len: 10, vel: 0.74 },
    // Bar 6 breathes
    { bar: 7, step: 0, deg: 2, len: 10, vel: 0.78 },
  ],
];

type Section = 'A' | 'B' | 'C' | 'A2';
const SONG: Section[] = ['A', 'B', 'C', 'A2'];
const SECTION_BARS = 16;

function indexMotif(notes: readonly MotifNote[]): Map<number, MotifNote[]> {
  const m = new Map<number, MotifNote[]>();
  for (const n of notes) {
    const key = n.bar * STEPS_PER_BAR + n.step;
    const list = m.get(key) ?? [];
    list.push(n);
    m.set(key, list);
  }
  return m;
}

export function buildMeadowWaltz(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void {
  const rnd = mulberry32(seed);
  const pick = <V>(xs: V[]): V => xs[Math.floor(rnd() * xs.length)];

  const bpm = 94 + Math.floor(rnd() * 14);
  T.getTransport().bpm.value = bpm;
  const step16 = T.Time('16n').toSeconds();
  const hold = (steps: number) => steps * step16 * 0.94;

  const fx = createFx(T, keep, out, { reverbDecay: 6.5, reverbHp: 220, echoTime: '4n.', echoFeedback: 0.34, echoLp: 2400 });
  const horn = createFrenchHorn(T, keep, out, fx, { volumeDb: -13, revSend: 0.72 });
  const harmonyHorn = createFrenchHorn(T, keep, out, fx, { volumeDb: -17, revSend: 0.8, brightness: 1350, attack: 0.14 });
  const harp = createHarp(T, keep, out, fx, { volumeDb: -9, revSend: 0.75, echoSend: 0.25 });
  const piano = createFeltPiano(T, keep, out, fx, { volumeDb: -10, revSend: 0.62, echoSend: 0.18 });
  const bass = createUprightBass(T, keep, out, { volumeDb: -9 });
  const kit = createSoftKit(T, keep, out, fx, { volumeDb: -6, revSend: 0.42 });

  const preset = pick(PRESETS);
  const mode = MODES[preset.mode];
  const root = 48 + Math.floor(rnd() * 9); // C3..G#3

  const voiceProg = (prog: number[]): number[][] => {
    let prev: number[] | null = null;
    return prog.map((deg) => (prev = voiceLead(chordTones(mode, deg, 4), 12, prev)));
  };
  const chordsA = voiceProg(preset.a);
  const chordsB = voiceProg(preset.b);

  const baseMotif = pick(MOTIFS);
  const pianoRiff = ornamentMotif(transposeMotif(baseMotif, 2, 0.9), rnd, STEPS_PER_BAR);
  const hornHarmony = transposeMotif(baseMotif, 2, 0.78);
  const hornMap = indexMotif(baseMotif);
  const pianoRiffMap = indexMotif(pianoRiff);
  const harmonyMap = indexMotif(hornHarmony);

  console.info(`[music] Meadow Waltz (${preset.name}) in ${NOTE_NAMES[root % 12]} ${preset.mode}, ${bpm} bpm`);

  let step = 0;
  const loop = keep(new T.Loop((time) => {
    const bar = Math.floor(step / STEPS_PER_BAR);
    const pos = step % STEPS_PER_BAR;
    const vel = humanize(step, 0.12);
    step++;

    const section = SONG[Math.floor(bar / SECTION_BARS) % SONG.length];
    const sb = bar % SECTION_BARS;
    const isB = section === 'B';
    const isC = section === 'C';
    const isA2 = section === 'A2';

    const prog = isB ? chordsB : chordsA;
    const degs = isB ? preset.b : preset.a;
    const ci = Math.floor(sb / 2) % prog.length;
    const chord = prog[ci].map((n) => root + n);
    const bassMidi = root - 12 + mode[degs[ci] % 7];

    // Upright bass: warm beat 1 on chord changes, gentle 5th on beat 3
    if (!isC) {
      if (pos === 0) bass.play(bassMidi, hold(7), time, 0.82 * vel);
      else if (pos === 8 && sb % 2 === 1) bass.play(bassMidi + 7, hold(3), time, 0.55 * vel);
    }

    // Harp: rolling 3/4 arpeggio (plenty of space)
    if (pos === 0 && sb % 2 === 0) {
      harp.arp(chord, time, 0.055, (isC ? 0.85 : 0.7) * vel);
    } else if ((pos === 4 || pos === 8) && (isC || sb % 2 === 1)) {
      const idx = pos === 4 ? 1 : 2;
      harp.pluck(chord[idx % chord.length] + (isC ? 12 : 0), time, 0.52 * vel);
    }

    // Felt Piano: sparse warm chords in A/C, riffing melody in B
    if (!isB && pos === 0 && sb % 4 === 0) {
      piano.play(chord, hold(18), time, (isC ? 0.72 : 0.58) * vel);
    }
    if (isB) {
      if (pos === 0 && sb % 2 === 0) piano.play(chord.slice(0, 3), hold(10), time, 0.45 * vel);
      const notes = pianoRiffMap.get((sb % 8) * STEPS_PER_BAR + pos);
      if (notes) {
        for (const n of notes) {
          piano.play(degreeToMidi(root + 12, mode, n.deg), hold(n.len), time, (n.vel ?? 0.8) * vel);
        }
      }
    }

    // French Horn: sings main motif in A & A2, sparse answering pedal in B
    const p8Pos = (sb % 8) * STEPS_PER_BAR + pos;
    if (section === 'A' || isA2) {
      const notes = hornMap.get(p8Pos);
      if (notes) {
        for (const n of notes) {
          horn.play(degreeToMidi(root, mode, n.deg), hold(n.len), time, (n.vel ?? 0.82) * vel);
        }
      }
      if (isA2 && sb >= 8) {
        const hNotes = harmonyMap.get(p8Pos);
        if (hNotes) {
          for (const n of hNotes) {
            harmonyHorn.play(degreeToMidi(root, mode, n.deg), hold(n.len), time, (n.vel ?? 0.7) * vel);
          }
        }
      }
    } else if (isB && pos === 0 && sb % 4 === 0) {
      horn.play(degreeToMidi(root, mode, degs[ci] + 4), hold(14), time, 0.62 * vel);
    }

    // Soft organic percussion: light brush & kick, silent in C and first 4 bars of A
    const drumsActive = !isC && !(section === 'A' && sb < 4);
    if (drumsActive) {
      if (pos === 0) kit.kick(time, 0.68 * vel);
      if (pos === 4 || pos === 8) kit.brush(time, (pos === 8 ? 0.5 : 0.35) * vel);
      if (isA2 && pos % 4 === 2) kit.shaker(time, 0.35 * vel);
    }
  }, '16n'));
  loop.start(0);
}

/**
 * Theme: Twilight Nocturne (4/4 time, 82-94 bpm).
 *
 * Deep, misty, and unhurried with huge reverb space:
 * - Felt Piano lays down warm, resonant voicings and a sparse 8-bar melody.
 * - Harp shimmers with slow, cascading arpeggios in the spaces between phrases.
 * - Distant French Horn enters with sustained swells and inverted/transposed riffs
 *   in a call-and-response dialogue with the piano.
 * - Soft brush and rim percussion creep in gently for B and A2.
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

interface NocturnePreset {
  name: string;
  mode: ModeName;
  a: number[];
  b: number[];
}

const PRESETS: NocturnePreset[] = [
  { name: 'Firefly Lydian', mode: 'lydian',  a: [0, 4, 1, 0], b: [3, 4, 5, 0] },
  { name: 'Dusk Dorian',    mode: 'dorian',  a: [0, 3, 6, 0], b: [5, 3, 1, 0] },
  { name: 'Misty Aeolian',  mode: 'aeolian', a: [0, 5, 3, 4], b: [5, 6, 3, 0] },
];

// Sparse, spacious 8-bar piano phrases with full-bar rests
const PIANO_MOTIFS: MotifNote[][] = [
  [
    { bar: 0, step: 0, deg: 4, len: 10, vel: 0.76 },
    { bar: 0, step: 12, deg: 5, len: 4, vel: 0.65 },
    { bar: 1, step: 0, deg: 4, len: 14, vel: 0.78 },
    // Bar 2 breathes
    { bar: 3, step: 4, deg: 2, len: 8, vel: 0.7 },
    { bar: 4, step: 0, deg: 3, len: 10, vel: 0.75 },
    { bar: 4, step: 12, deg: 2, len: 4, vel: 0.68 },
    { bar: 5, step: 0, deg: 0, len: 14, vel: 0.72 },
    // Bar 6-7: harp & horn answer
  ],
  [
    { bar: 0, step: 2, deg: 2, len: 8, vel: 0.74 },
    { bar: 0, step: 10, deg: 4, len: 6, vel: 0.78 },
    { bar: 1, step: 0, deg: 6, len: 14, vel: 0.8 },
    { bar: 2, step: 8, deg: 5, len: 8, vel: 0.72 },
    { bar: 3, step: 0, deg: 4, len: 12, vel: 0.7 },
    // Bar 4-5 open space for horn
    { bar: 6, step: 0, deg: 2, len: 8, vel: 0.74 },
    { bar: 6, step: 10, deg: 1, len: 6, vel: 0.68 },
    { bar: 7, step: 0, deg: 0, len: 14, vel: 0.7 },
  ],
];

type Section = 'A' | 'B' | 'C' | 'A2';
const SONG: Section[] = ['A', 'B', 'C', 'A2'];
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

export function buildTwilightNocturne(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void {
  const rnd = mulberry32(seed);
  const pick = <V>(xs: V[]): V => xs[Math.floor(rnd() * xs.length)];

  const bpm = 82 + Math.floor(rnd() * 12);
  T.getTransport().bpm.value = bpm;
  const step16 = T.Time('16n').toSeconds();
  const hold = (steps: number) => steps * step16 * 0.96;

  const fx = createFx(T, keep, out, { reverbDecay: 7.5, reverbHp: 200, echoTime: '4n.', echoFeedback: 0.36, echoLp: 2100 });
  const piano = createFeltPiano(T, keep, out, fx, { volumeDb: -9, revSend: 0.68, echoSend: 0.2, brightness: 2600 });
  const horn = createFrenchHorn(T, keep, out, fx, { volumeDb: -14, revSend: 0.78, brightness: 1450, attack: 0.15 });
  const harp = createHarp(T, keep, out, fx, { volumeDb: -10, revSend: 0.8, echoSend: 0.28, dampening: 2700 });
  const bass = createUprightBass(T, keep, out, { volumeDb: -11 });
  const kit = createSoftKit(T, keep, out, fx, { volumeDb: -8, revSend: 0.48 });

  const preset = pick(PRESETS);
  const mode = MODES[preset.mode];
  const root = 46 + Math.floor(rnd() * 9); // Bb2..F#3

  const voiceProg = (prog: number[]): number[][] => {
    let prev: number[] | null = null;
    return prog.map((deg) => (prev = voiceLead(chordTones(mode, deg, 5), 11, prev)));
  };
  const chordsA = voiceProg(preset.a);
  const chordsB = voiceProg(preset.b);

  const pianoBase = pick(PIANO_MOTIFS);
  const hornAnswer = transposeMotif(invertMotif(pianoBase, 3), 1, 0.85);
  const pianoOrnament = ornamentMotif(pianoBase, rnd, 16);

  const pianoMap = indexMotif(pianoBase);
  const pianoOrnMap = indexMotif(pianoOrnament);
  const hornMap = indexMotif(hornAnswer);

  console.info(`[music] Twilight Nocturne (${preset.name}) in ${NOTE_NAMES[root % 12]} ${preset.mode}, ${bpm} bpm`);

  let step = 0;
  const loop = keep(new T.Loop((time) => {
    const bar = Math.floor(step / 16);
    const pos = step % 16;
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

    // Upright bass: very sparse, long resonant root notes
    if (!isC && pos === 0 && sb % 2 === 0) {
      bass.play(bassMidi, hold(22), time, 0.78 * vel);
    }

    // Felt piano: sustained chord every 2 bars + motif
    if (pos === 0 && sb % 2 === 0) {
      piano.play(chord.slice(0, 4), hold(28), time, (isC ? 0.56 : 0.48) * vel);
    }
    const p8Pos = (sb % 8) * 16 + pos;
    const activePiano = isA2 ? pianoOrnMap : pianoMap;
    if (section !== 'B' || sb < 8) {
      const notes = activePiano.get(p8Pos);
      if (notes) {
        for (const n of notes) {
          piano.play(degreeToMidi(root + 12, mode, n.deg), hold(n.len), time, (n.vel ?? 0.74) * vel);
        }
      }
    }

    // Harp: gentle upward sweep on every 4th bar, plus airy single plucks in C
    if (pos === 0 && sb % 4 === 0) {
      harp.arp(chord, time, 0.065, 0.65 * vel);
    } else if (isC && (pos === 6 || pos === 12)) {
      harp.pluck(chord[(pos === 6 ? 2 : 4) % chord.length] + 12, time, 0.5 * vel);
    }

    // Distant French Horn: answers in second half of A, leads in B & A2
    const hornActive = (section === 'A' && sb >= 8) || isB || isA2;
    if (hornActive) {
      const hNotes = hornMap.get(p8Pos);
      if (hNotes) {
        for (const n of hNotes) {
          horn.play(degreeToMidi(root, mode, n.deg), hold(n.len), time, (n.vel ?? 0.75) * vel);
        }
      }
    }

    // Minimal organic percussion: enters only in B and A2
    if (isB || isA2) {
      if (pos === 0) kit.kick(time, 0.62 * vel);
      if (pos === 8) kit.brush(time, 0.45 * vel);
      if (pos === 12 && sb % 2 === 1) kit.rim(time, 0.4 * vel);
    }
  }, '16n'));
  loop.start(0);
}

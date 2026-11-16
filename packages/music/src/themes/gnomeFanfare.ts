/**
 * Theme: Gnome Fanfare (4/4 time, 112-124 bpm).
 *
 * Playful, warm, acoustic garden-expedition energy with plenty of room reverb:
 * - Two-voice French Horn section states a bouncy call-and-response fanfare.
 * - Harp plays rhythmic plucked ostinatos and chord rolls.
 * - Felt Piano comps with light woody chords and takes over the riff in section B.
 * - Section C drops to a quiet campfire Harp & Horn duet in a deep hall.
 * - Section A2 brings back the full ensemble with an ornamented horn harmony.
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

interface FanfarePreset {
  name: string;
  mode: ModeName;
  a: number[];
  b: number[];
}

const PRESETS: FanfarePreset[] = [
  { name: 'Patio Mixolydian', mode: 'mixolydian', a: [0, 6, 3, 0], b: [3, 4, 6, 0] },
  { name: 'Garden Ionian',    mode: 'ionian',     a: [0, 3, 4, 0], b: [5, 3, 1, 4] },
  { name: 'Hedgerow Dorian',  mode: 'dorian',     a: [0, 3, 0, 6], b: [2, 3, 4, 0] },
];

const FANFARES: MotifNote[][] = [
  [
    { bar: 0, step: 0, deg: 0, len: 6, vel: 0.82 },
    { bar: 0, step: 6, deg: 2, len: 4, vel: 0.78 },
    { bar: 0, step: 10, deg: 4, len: 6, vel: 0.88 },
    { bar: 1, step: 0, deg: 5, len: 4, vel: 0.84 },
    { bar: 1, step: 4, deg: 4, len: 8, vel: 0.8 },
    // Bar 2-3: space for harp/piano answer
    { bar: 4, step: 0, deg: 4, len: 6, vel: 0.85 },
    { bar: 4, step: 6, deg: 6, len: 4, vel: 0.82 },
    { bar: 4, step: 10, deg: 7, len: 6, vel: 0.9 },
    { bar: 5, step: 0, deg: 6, len: 4, vel: 0.82 },
    { bar: 5, step: 4, deg: 4, len: 10, vel: 0.8 },
    // Bar 6-7: breathe
  ],
  [
    { bar: 0, step: 0, deg: 4, len: 4, vel: 0.82 },
    { bar: 0, step: 4, deg: 4, len: 4, vel: 0.76 },
    { bar: 0, step: 8, deg: 7, len: 8, vel: 0.88 },
    { bar: 1, step: 0, deg: 6, len: 6, vel: 0.82 },
    { bar: 1, step: 6, deg: 4, len: 8, vel: 0.78 },
    // Bar 2-3: space
    { bar: 4, step: 0, deg: 2, len: 6, vel: 0.8 },
    { bar: 4, step: 6, deg: 3, len: 4, vel: 0.78 },
    { bar: 4, step: 10, deg: 4, len: 6, vel: 0.85 },
    { bar: 5, step: 0, deg: 5, len: 6, vel: 0.84 },
    { bar: 5, step: 6, deg: 4, len: 8, vel: 0.8 },
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

export function buildGnomeFanfare(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void {
  const rnd = mulberry32(seed);
  const pick = <V>(xs: V[]): V => xs[Math.floor(rnd() * xs.length)];

  const bpm = 112 + Math.floor(rnd() * 12);
  T.getTransport().bpm.value = bpm;
  const step16 = T.Time('16n').toSeconds();
  const hold = (steps: number) => steps * step16 * 0.94;

  const fx = createFx(T, keep, out, { reverbDecay: 5.5, reverbHp: 240, echoTime: '8n.', echoFeedback: 0.3, echoLp: 2600 });
  const hornLead = createFrenchHorn(T, keep, out, fx, { volumeDb: -13, revSend: 0.65, brightness: 1750, attack: 0.08 });
  const hornHarm = createFrenchHorn(T, keep, out, fx, { volumeDb: -16, revSend: 0.75, brightness: 1450, attack: 0.1 });
  const harp = createHarp(T, keep, out, fx, { volumeDb: -9, revSend: 0.68, echoSend: 0.22 });
  const piano = createFeltPiano(T, keep, out, fx, { volumeDb: -10, revSend: 0.55, echoSend: 0.16 });
  const bass = createUprightBass(T, keep, out, { volumeDb: -9 });
  const kit = createSoftKit(T, keep, out, fx, { volumeDb: -5, revSend: 0.38 });

  const preset = pick(PRESETS);
  const mode = MODES[preset.mode];
  const root = 48 + Math.floor(rnd() * 8); // C3..G3

  const voiceProg = (prog: number[]): number[][] => {
    let prev: number[] | null = null;
    return prog.map((deg) => (prev = voiceLead(chordTones(mode, deg, 4), 12, prev)));
  };
  const chordsA = voiceProg(preset.a);
  const chordsB = voiceProg(preset.b);

  const mainFanfare = pick(FANFARES);
  const harmonyFanfare = transposeMotif(mainFanfare, 2, 0.78);
  const pianoRiff = ornamentMotif(transposeMotif(mainFanfare, 4, 0.88), rnd, 16);

  const leadMap = indexMotif(mainFanfare);
  const harmMap = indexMotif(harmonyFanfare);
  const pianoRiffMap = indexMotif(pianoRiff);

  console.info(`[music] Gnome Fanfare (${preset.name}) in ${NOTE_NAMES[root % 12]} ${preset.mode}, ${bpm} bpm`);

  let step = 0;
  const loop = keep(new T.Loop((time) => {
    const bar = Math.floor(step / 16);
    const pos = step % 16;
    const vel = humanize(step, 0.1);
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

    // Upright bass: bouncy root-fifth in A/B/A2, silent in C
    if (!isC) {
      if (pos === 0) bass.play(bassMidi, hold(6), time, 0.85 * vel);
      else if (pos === 10) bass.play(bassMidi + 7, hold(4), time, 0.68 * vel);
    }

    // Harp: chord roll on bar 0 of each 2-bar chord, gentle plucked offbeats
    if (pos === 0 && sb % 2 === 0) {
      harp.arp(chord, time, 0.04, (isC ? 0.8 : 0.68) * vel);
    } else if (pos === 6 || pos === 12) {
      const idx = pos === 6 ? 1 : 2;
      harp.pluck(chord[idx % chord.length] + 12, time, (isC ? 0.6 : 0.48) * vel);
    }

    // Felt Piano: light comping in A/A2, takes the riff in B
    if (!isC) {
      if (pos === 0 && sb % 2 === 0) piano.play(chord.slice(0, 3), hold(8), time, 0.48 * vel);
      else if (pos === 10 && sb % 2 === 1) piano.play(chord.slice(1, 4), hold(4), time, 0.42 * vel);
    }
    const p8Pos = (sb % 8) * 16 + pos;
    if (isB) {
      const pNotes = pianoRiffMap.get(p8Pos);
      if (pNotes) {
        for (const n of pNotes) {
          piano.play(degreeToMidi(root + 12, mode, n.deg), hold(n.len), time, (n.vel ?? 0.8) * vel);
        }
      }
    }

    // French Horns: statement in A, duet in C, full two-voice harmony in A2
    if (section === 'A' || isC || isA2) {
      const lNotes = leadMap.get(p8Pos);
      if (lNotes) {
        for (const n of lNotes) {
          hornLead.play(degreeToMidi(root, mode, n.deg), hold(n.len), time, (n.vel ?? 0.84) * (isC ? 0.82 : 1) * vel);
        }
      }
      if (isA2 || (section === 'A' && sb >= 8)) {
        const hNotes = harmMap.get(p8Pos);
        if (hNotes) {
          for (const n of hNotes) {
            hornHarm.play(degreeToMidi(root, mode, n.deg), hold(n.len), time, (n.vel ?? 0.72) * vel);
          }
        }
      }
    }

    // Light organic percussion: silent in C
    if (!isC) {
      if (pos === 0 || pos === 10) kit.kick(time, (pos === 0 ? 0.72 : 0.5) * vel);
      if (pos === 4 || pos === 12) kit.rim(time, 0.58 * vel);
      if (pos === 8) kit.brush(time, 0.45 * vel);
      if (isA2 && pos % 2 === 1) kit.shaker(time, 0.3 * vel);
    }
  }, '16n'));
  loop.start(0);
}

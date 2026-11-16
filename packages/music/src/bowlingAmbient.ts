/**
 * Ambient elevator / lounge music for Gnome Bowling. Generated in code with Tone.js.
 *
 * - Tempo 66-71 BPM, warm major/lydian/dorian lounge harmony with 9th voicings.
 * - Big 12-second damped hall reverb, stereo chorus, and dotted-quarter ping-pong echo.
 * - Voices: lush ambient pad, vintage Rhodes electric piano, vibraphone melody phrases,
 *   soft sine lounge bass, ultra-light brushes/rim, and rare background foleys routed
 *   through varying spatial effects (reverb, echo, sweeping filter, chorus).
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from './engine';
import { createFoleyRack, scheduleFoleyBed } from './foley';
import { createAmbientPad, createRhodes, createSoftKit, createVibraphone } from './instruments';
import { createAmbientFx } from './mix';
import {
  chordTones,
  degreeToMidi,
  humanize,
  midiToNote,
  MODES,
  mulberry32,
  ornamentMotif,
  voiceLead,
  type MotifNote,
} from './theory';

const MODE_CHOICES: readonly (readonly number[])[] = [MODES.ionian, MODES.lydian, MODES.dorian];

const PROGRESSIONS: readonly (readonly number[])[] = [
  [0, 5, 1, 4], // Imaj9 - vi9 - ii9 - V9
  [0, 2, 3, 4], // Imaj9 - iii7 - IVmaj9 - V9
  [3, 2, 1, 4], // IVmaj9 - iii7 - ii9 - V9
  [5, 1, 3, 4], // vi9 - ii9 - IVmaj9 - V9
];

const BARS_PER_SECTION = 8;
const CHORD_BARS = 2;
const FORM = ['A', 'A', 'B', 'A'] as const;
const TOTAL_BARS = FORM.length * BARS_PER_SECTION;
const CHORD_CENTER = 60; // C4 lounge voicing center
const SWING = 0.14;

interface Chord {
  root: number;
  notes: number[];
}

type Ev<V> = [number, V];

const VIBE_MOTIFS: readonly (readonly MotifNote[])[] = [
  [
    { bar: 0, step: 0, deg: 4, len: 6, vel: 0.68 },
    { bar: 0, step: 8, deg: 2, len: 6, vel: 0.6 },
    { bar: 1, step: 2, deg: 1, len: 8, vel: 0.56 },
    { bar: 1, step: 12, deg: 0, len: 10, vel: 0.52 },
  ],
  [
    { bar: 0, step: 2, deg: 2, len: 6, vel: 0.64 },
    { bar: 0, step: 10, deg: 4, len: 6, vel: 0.62 },
    { bar: 1, step: 0, deg: 6, len: 8, vel: 0.58 },
    { bar: 1, step: 10, deg: 4, len: 10, vel: 0.5 },
  ],
  [
    { bar: 0, step: 0, deg: 0, len: 6, vel: 0.65 },
    { bar: 0, step: 8, deg: 1, len: 4, vel: 0.58 },
    { bar: 0, step: 12, deg: 2, len: 8, vel: 0.62 },
    { bar: 1, step: 6, deg: 4, len: 10, vel: 0.54 },
  ],
];

export function buildBowlingAmbient(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void {
  const rng = mulberry32(seed);
  const bpm = 66 + Math.floor(rng() * 6);
  const mode = MODE_CHOICES[Math.floor(rng() * MODE_CHOICES.length)];
  const tonic = 53 + Math.floor(rng() * 6); // F3..Bb3
  const pickA = Math.floor(rng() * PROGRESSIONS.length);
  const pickB = (pickA + 1 + Math.floor(rng() * (PROGRESSIONS.length - 1))) % PROGRESSIONS.length;

  T.getTransport().bpm.value = bpm;
  const BAR = 240 / bpm;
  const BEAT = BAR / 4;
  const EIGHTH = BAR / 8;
  const SIXTEENTH = BAR / 16;
  const LOOP = TOTAL_BARS * BAR;

  // ----- Harmony: smooth voice-led 7th & 9th lounge chords -----
  const voice = (prog: readonly number[]): Chord[] => {
    let prev: number[] | null = null;
    return prog.map((deg, i) => {
      const size = i % 2 === 0 ? 5 : 4;
      const abs = chordTones(mode, deg, size).map((t) => tonic + t);
      const notes = voiceLead(abs, CHORD_CENTER, prev);
      prev = notes;
      let root = tonic + mode[deg % 7];
      while (root > 46) root -= 12;
      while (root < 35) root += 12;
      return { root, notes };
    });
  };

  const chordsA = voice(PROGRESSIONS[pickA]);
  const chordsB = voice(PROGRESSIONS[pickB]);
  const chordAt = (bar: number): Chord => {
    const section = FORM[Math.floor(bar / BARS_PER_SECTION)];
    const sb = bar % BARS_PER_SECTION;
    return (section === 'A' ? chordsA : chordsB)[Math.floor(sb / CHORD_BARS)];
  };

  // ----- Generate looping musical events -----
  const padEv: Ev<{ notes: number[]; dur: number; vel: number }>[] = [];
  const bassEv: Ev<{ note: string; dur: number; vel: number }>[] = [];
  const epEv: Ev<{ midis: number | number[]; dur: number; vel: number }>[] = [];
  const vibeEv: Ev<{ midi: number; dur: number; vel: number }>[] = [];
  const brushEv: Ev<{ vel: number }>[] = [];
  const rimEv: Ev<{ vel: number }>[] = [];

  for (let bar = 0; bar < TOTAL_BARS; bar++) {
    const chord = chordAt(bar);
    const t0 = bar * BAR;
    const sb = bar % BARS_PER_SECTION;

    // Pad & bass every 2 bars on chord change.
    if (sb % CHORD_BARS === 0) {
      padEv.push([t0, {
        notes: chord.notes.slice(0, 4).map((n) => n - 12),
        dur: CHORD_BARS * BAR * 0.96,
        vel: 0.42,
      }]);

      bassEv.push([t0, { note: midiToNote(chord.root), dur: 2.2 * BEAT, vel: 0.58 }]);
      if (rng() < 0.65) {
        const stepUp = rng() < 0.45 ? 7 : 0;
        bassEv.push([t0 + 2 * BEAT, {
          note: midiToNote(chord.root + stepUp),
          dur: CHORD_BARS * BAR - 2 * BEAT - 0.1,
          vel: 0.48,
        }]);
      }
    }

    // Rhodes: gentle elevator comping (soft rolled chord on beat 1 or 2, plus sparse 8th-note echoes).
    if (sb % CHORD_BARS === 0) {
      const voicing = chord.notes.slice(1, 4);
      epEv.push([t0 + 0.02, { midis: voicing, dur: 2.5 * BEAT, vel: 0.46 }]);
    }
    if (rng() < 0.72) {
      const slots = [3, 5, 6].filter(() => rng() < 0.55);
      for (const slot of slots) {
        const note = chord.notes[Math.floor(rng() * chord.notes.length)];
        const swing = slot % 2 === 1 ? SWING * EIGHTH : 0;
        epEv.push([t0 + slot * EIGHTH + swing, {
          midis: note,
          dur: 2.6 * EIGHTH,
          vel: 0.28 + 0.16 * rng(),
        }]);
      }
    }

    // Vibraphone: dreamy phrase once every 4 bars.
    if (sb % 4 === 0 && rng() < 0.7) {
      const base = VIBE_MOTIFS[Math.floor(rng() * VIBE_MOTIFS.length)];
      const phrase = ornamentMotif(base, rng);
      for (const n of phrase) {
        const time = t0 + n.bar * BAR + n.step * SIXTEENTH;
        const midi = degreeToMidi(tonic + 12, mode, n.deg);
        vibeEv.push([time, {
          midi,
          dur: Math.max(0.35, n.len * SIXTEENTH * 1.35),
          vel: (n.vel ?? 0.6) * humanize(n.step, 0.12),
        }]);
      }
    }

    // Ultra-soft lounge brush & rim from the second A section onward.
    if (bar >= BARS_PER_SECTION) {
      for (const beat of [1, 3]) {
        if (rng() < 0.8) brushEv.push([t0 + beat * BEAT, { vel: 0.28 + rng() * 0.12 }]);
      }
      if (rng() < 0.35) {
        const off = rng() < 0.5 ? 2.5 : 3.5;
        rimEv.push([t0 + off * BEAT, { vel: 0.22 }]);
      }
    }
  }

  // ----- Instruments & big spatial FX -----
  const fx = createAmbientFx(T, keep, out, { reverbDecay: 12, echoFeedback: 0.52 });

  const pad = createAmbientPad(T, keep, out, fx, { volumeDb: -21, revSend: 0.9, chorusSend: 0.5 });
  const rhodes = createRhodes(T, keep, out, fx, { volumeDb: -12, revSend: 0.72, echoSend: 0.3, chorusSend: 0.4 });
  const vibes = createVibraphone(T, keep, out, fx, { volumeDb: -14, revSend: 0.82, echoSend: 0.36 });
  const kit = createSoftKit(T, keep, out, { ...fx, snareSend: keep(new T.Gain(0)), throwSend: keep(new T.Gain(0)) }, {
    volumeDb: -12,
    revSend: 0.55,
  });

  const bassLp = keep(new T.Filter(360, 'lowpass')).connect(out);
  const bass = keep(new T.MonoSynth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.09, decay: 0.5, sustain: 0.65, release: 1.6 },
    filter: { Q: 0.5, type: 'lowpass' },
    filterEnvelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1, baseFrequency: 180, octaves: 0.4 },
  })).connect(bassLp);
  bass.volume.value = -12;

  // ----- Schedule Parts -----
  const schedule = <V>(events: Ev<V>[], fn: (time: number, v: V) => void) => {
    const part = keep(new T.Part((time, v) => fn(time, v as V), events as [number, unknown][]));
    part.loop = true;
    part.loopEnd = LOOP;
    part.start(0);
  };

  schedule(padEv, (t, v) => pad.play(v.notes, v.dur, t, v.vel));
  schedule(bassEv, (t, v) => bass.triggerAttackRelease(v.note, v.dur, t, v.vel));
  schedule(epEv, (t, v) => rhodes.play(v.midis, v.dur, t, v.vel));
  schedule(vibeEv, (t, v) => vibes.play(v.midi, v.dur, t, v.vel));
  schedule(brushEv, (t, v) => kit.brush(t, v.vel));
  schedule(rimEv, (t, v) => kit.rim(t, v.vel));

  // ----- Rare / occasional background foleys with varied effects -----
  const scaleMidis = [0, 2, 4, 6, 7, 9, 11].map((d) => degreeToMidi(tonic + 24, mode, d));
  const foleyRack = createFoleyRack(T, keep, out, fx, { volumeDb: -24 });
  scheduleFoleyBed(T, keep, foleyRack, {
    seed: seed ^ 0x9e3779b9,
    interval: '2m',
    chance: 0.28,
    minGapSec: 10,
    scaleMidis,
  });
}

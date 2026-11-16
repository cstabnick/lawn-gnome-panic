// Slow, relaxing ambient golf music (Gnome Golf). Generated in code with Tone.js.
//
// - Tempo 68-76 bpm, mode (lydian, mixolydian or major) and tonic (D3..A3) picked by seed.
// - Form A A B A over 32 bars. Each section is 8 bars = a 4-chord progression, 2 bars per chord.
//   Sections A and B use two different progressions picked by seed from a small bank.
// - Parts: soft fat-triangle pad (low-passed, big reverb), sparse FM electric-piano arpeggios
//   (tremolo, delay), a sine bass on the chord roots, a flute-like triangle melody every 4 bars,
//   and very light brushed swish and rim click (left out of the first A section).
// - Everything (chords, arpeggios, phrases) is generated once from mulberry32(seed) at build time;
//   the Parts replay the same events every loop, so the loop never changes and never gets busy.
import type * as ToneNS from 'tone';
import type { Keep, Tone } from './engine';
import { createFx } from './mix';
import { chordTones, midiToNote, mulberry32, MODES, voiceLead } from './theory';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MODE_CHOICES: readonly (readonly number[])[] = [MODES.lydian, MODES.mixolydian, MAJOR];
/** Scale-degree progressions (0-based degrees), one chord per 2 bars. */
const PROGRESSIONS: readonly (readonly number[])[] = [
  [0, 5, 3, 4], // I vi IV V
  [0, 3, 1, 4], // I IV ii V
  [5, 3, 0, 4], // vi IV I V
  [0, 4, 5, 3], // I V vi IV
];
const BARS_PER_SECTION = 8;
const CHORD_BARS = 2;
const FORM = ['A', 'A', 'B', 'A'] as const;
const TOTAL_BARS = FORM.length * BARS_PER_SECTION;
const CHORD_CENTER = 62;   // keys and harmony voice-leading centre (MIDI)
const SWING = 0.12;        // off-8th delay, as a fraction of an 8th
const PAD_DROP = 12;       // the pad sits an octave under the keys

interface Chord { root: number; notes: number[] }
type Ev<V> = [number, V];
interface NoteEv { note: string; dur: number; vel: number }

export function buildGolfAmbient(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void {
  const rng = mulberry32(seed);
  const bpm = 68 + Math.floor(rng() * 9);
  const mode = MODE_CHOICES[Math.floor(rng() * MODE_CHOICES.length)];
  const tonic = 50 + Math.floor(rng() * 8); // D3..A3
  const pickA = Math.floor(rng() * PROGRESSIONS.length);
  const pickB = (pickA + 1 + Math.floor(rng() * (PROGRESSIONS.length - 1))) % PROGRESSIONS.length;

  T.getTransport().bpm.value = bpm;
  const BAR = 240 / bpm;
  const BEAT = BAR / 4;
  const EIGHTH = BAR / 8;
  const LOOP = TOTAL_BARS * BAR;

  // ----- harmony: voice-led chords per progression -----
  const voice = (prog: readonly number[]): Chord[] => {
    let prev: number[] | null = null;
    return prog.map((deg, i) => {
      const size = i % 2 === 1 ? 5 : 4; // 9th chords on the second chord of each progression
      const abs = chordTones(mode, deg, size).map((t) => tonic + t);
      const notes = voiceLead(abs, CHORD_CENTER, prev);
      prev = notes;
      let root = tonic + mode[deg % 7];
      while (root > 47) root -= 12;
      while (root < 36) root += 12;
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

  // Picks n distinct 8th-note slots (0-7) in one bar, ascending.
  const pickSlots = (n: number): number[] => {
    const pool = [0, 1, 2, 3, 4, 5, 6, 7];
    const picked: number[] = [];
    for (let i = 0; i < n; i++) {
      const j = i + Math.floor(rng() * (8 - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
      picked.push(pool[i]);
    }
    return picked.sort((a, b) => a - b);
  };

  // ----- generate every event once -----
  const padEv: Ev<{ notes: string[]; dur: number; vel: number }>[] = [];
  const bassEv: Ev<NoteEv>[] = [];
  const keyEv: Ev<NoteEv>[] = [];
  const fluteEv: Ev<NoteEv>[] = [];
  const swishEv: Ev<{ dur: number; vel: number }>[] = [];
  const clickEv: Ev<NoteEv>[] = [];

  for (let bar = 0; bar < TOTAL_BARS; bar++) {
    const chord = chordAt(bar);
    const t0 = bar * BAR;
    const sb = bar % BARS_PER_SECTION;

    if (sb % CHORD_BARS === 0) {
      padEv.push([t0, { notes: chord.notes.map((n) => midiToNote(n - PAD_DROP)), dur: CHORD_BARS * BAR, vel: 0.45 }]);
      // Bass: root on beat 1, sometimes a second hit on beat 3 (root or fifth).
      if (rng() < 0.5) {
        bassEv.push([t0, { note: midiToNote(chord.root), dur: 2 * BEAT, vel: 0.65 }]);
        const fifth = rng() < 0.3 ? 7 : 0;
        bassEv.push([t0 + 2 * BEAT, { note: midiToNote(chord.root + fifth), dur: CHORD_BARS * BAR - 2 * BEAT - 0.05, vel: 0.55 }]);
      } else {
        bassEv.push([t0, { note: midiToNote(chord.root), dur: CHORD_BARS * BAR - 0.05, vel: 0.65 }]);
      }
    }

    // Electric piano: a sparse broken-chord arpeggio in most bars, rests otherwise.
    if (rng() < 0.6) {
      const n = 3 + Math.floor(rng() * 3);
      const slots = pickSlots(n);
      const offset = Math.floor(rng() * chord.notes.length);
      slots.forEach((slot, i) => {
        const note = chord.notes[(i + offset) % chord.notes.length];
        const swing = slot % 2 === 1 ? SWING * EIGHTH : 0;
        keyEv.push([t0 + slot * EIGHTH + swing, { note: midiToNote(note), dur: 3 * EIGHTH, vel: 0.3 + 0.2 * rng() }]);
      });
    }

    // Flute-like phrase, at most one per 4-bar block, from the chord tones (one octave up).
    if (sb % 4 === 0 && rng() < 0.55) {
      const count = 3 + Math.floor(rng() * 3);
      let pos = 0;
      for (let i = 0; i < count && pos < 14; i++) {
        const note = chord.notes[Math.floor(rng() * chord.notes.length)] + 12;
        const len = 1 + Math.floor(rng() * 2);
        fluteEv.push([t0 + pos * EIGHTH, { note: midiToNote(note), dur: len * EIGHTH * 1.6, vel: 0.4 + 0.15 * rng() }]);
        pos += len + 1 + Math.floor(rng() * 2);
      }
    }

    // Light percussion, from the second A section on.
    if (bar >= BARS_PER_SECTION) {
      for (const beat of [1, 3]) {
        if (rng() < 0.85) swishEv.push([t0 + beat * BEAT, { dur: BEAT * 0.9, vel: 0.5 }]);
      }
      if (rng() < 0.3) clickEv.push([t0 + 2 * BEAT, { note: 'G5', dur: 0.03, vel: 0.5 }]);
    }
  }

  // ----- instruments -----
  const fx = createFx(T, keep, out, { reverbDecay: 8 });
  const send = (amount: number, to: ToneNS.InputNode) => keep(new T.Gain(amount)).connect(to);

  // Pad: soft fat triangles, low-passed, big reverb.
  const padLp = keep(new T.Filter(1500, 'lowpass')).fan(out, send(0.6, fx.rev));
  const pad = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'fattriangle', count: 2, spread: 15 },
    envelope: { attack: 2, decay: 0.5, sustain: 0.85, release: 4 },
  })).connect(padLp);
  pad.maxPolyphony = 8;
  pad.volume.value = -20;

  // Electric piano: soft FM with light tremolo and a delay send.
  const keysLp = keep(new T.Filter(3500, 'lowpass')).fan(out, send(0.35, fx.delay));
  const trem = keep(new T.Tremolo(3.5, 0.3)).connect(keysLp);
  trem.start();
  const keys = keep(new T.PolySynth(T.FMSynth, {
    harmonicity: 2, modulationIndex: 1.8,
    oscillator: { type: 'sine' }, modulation: { type: 'sine' },
    envelope: { attack: 0.003, decay: 1.6, sustain: 0.2, release: 1.4 },
    modulationEnvelope: { attack: 0.002, decay: 0.6, sustain: 0.1, release: 0.8 },
  })).connect(trem);
  keys.maxPolyphony = 4;
  keys.volume.value = -8;

  // Bass: sine, low-passed.
  const bassLp = keep(new T.Filter(420, 'lowpass')).connect(out);
  const bass = keep(new T.MonoSynth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.08, decay: 0.4, sustain: 0.7, release: 1.5 },
    filter: { Q: 0.5, type: 'lowpass' },
    filterEnvelope: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 1, baseFrequency: 200, octaves: 0.5 },
  })).connect(bassLp);
  bass.volume.value = -10;

  // Melody: a flute-like triangle with a slow attack, into echo and reverb.
  const fluteLp = keep(new T.Filter(4000, 'lowpass')).fan(out, send(0.5, fx.delay), send(0.4, fx.rev));
  const flute = keep(new T.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.25, decay: 0.4, sustain: 0.6, release: 1.8 },
  })).connect(fluteLp);
  flute.volume.value = -14;

  // Percussion: pink-noise swish through a high-pass, and a soft square rim click.
  const percHp = keep(new T.Filter(2500, 'highpass')).connect(out);
  const swish = keep(new T.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.08, decay: 0.25, sustain: 0, release: 0.15 },
  })).connect(percHp);
  swish.volume.value = -30;
  const rim = keep(new T.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 },
  })).connect(percHp);
  rim.volume.value = -34;

  // ----- schedule: one looping Part per voice, all in seconds -----
  const schedule = <V>(events: Ev<V>[], fn: (time: number, v: V) => void): void => {
    // A note Tone rejects (late callbacks when the main thread stalls) is dropped, never thrown.
    const part = keep(new T.Part<Ev<V>>((time, v) => {
      try { fn(time, v); } catch { /* skip this note */ }
    }, events));
    part.loop = true;
    part.loopEnd = LOOP;
    part.start(0);
  };
  schedule(padEv, (time, e) => pad.triggerAttackRelease(e.notes, e.dur, time, e.vel));
  schedule(keyEv, (time, e) => keys.triggerAttackRelease(e.note, e.dur, time, e.vel));
  // Monophonic voices throw if a note starts at or before the previous one (loop seam, equal event times):
  // nudge such a note 1 ms after the last.
  const mono = (): ((t: number) => number) => {
    let last = -1;
    return (t) => (last = t > last ? t : last + 0.001);
  };
  const bassT = mono();
  const fluteT = mono();
  const swishT = mono();
  const rimT = mono();
  schedule(bassEv, (time, e) => bass.triggerAttackRelease(e.note, e.dur, bassT(time), e.vel));
  schedule(fluteEv, (time, e) => flute.triggerAttackRelease(e.note, e.dur, fluteT(time), e.vel));
  schedule(swishEv, (time, e) => swish.triggerAttackRelease(e.dur, swishT(time), e.vel));
  schedule(clickEv, (time, e) => rim.triggerAttackRelease(e.note, e.dur, rimT(time), e.vel));
}

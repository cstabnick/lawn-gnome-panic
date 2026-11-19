// Garden Lullaby (Gnome Sweet Gnome): very light, peaceful music, a touch more than ambient.
// Generated in code with Tone.js.
//
// - 76-84 bpm, a warm major key (F3..A3 tonic), 16 bars: A (I V vi IV) then B (vi IV I V), twice.
// - A steady, soft music-box arpeggio gives it a gentle pulse (that is the "more than ambient" part),
//   over a quiet pad and a round sine bass. A small pentatonic bell melody answers every two bars.
// - A barely-there shaker on the off-beats. No drums, no builds, nothing sudden.
// - Everything is generated once from mulberry32(seed) and replayed every loop.
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '../engine';
import { createFx } from '../mix';
import { chordTones, midiToNote, mulberry32, MODES, voiceLead } from '../theory';

const MAJOR = MODES.ionian;
const PENTATONIC = [0, 2, 4, 7, 9]; // major pentatonic, from the tonic
const PROG_A = [0, 4, 5, 3]; // I V vi IV
const PROG_B = [5, 3, 0, 4]; // vi IV I V
const FORM = [PROG_A, PROG_B, PROG_A, PROG_B];
const CHORD_BARS = 1;
const TOTAL_BARS = FORM.length * 4 * CHORD_BARS;

type Ev<V> = [number, V];
interface NoteEv { note: string; dur: number; vel: number }

export function buildGardenLullaby(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void {
  const rng = mulberry32(seed);
  const bpm = 76 + Math.floor(rng() * 9);
  const tonic = 53 + Math.floor(rng() * 3); // F3..A3
  T.getTransport().bpm.value = bpm;
  const BAR = 240 / bpm;
  const EIGHTH = BAR / 8;
  const LOOP = TOTAL_BARS * BAR;

  // ----- events -----
  const padEv: Ev<{ notes: string[]; dur: number; vel: number }>[] = [];
  const bassEv: Ev<NoteEv>[] = [];
  const boxEv: Ev<NoteEv>[] = [];
  const bellEv: Ev<NoteEv>[] = [];
  const shakeEv: Ev<{ vel: number }>[] = [];

  let prev: number[] | null = null;
  // Arpeggio shapes over a chord's four tones (indices), one bar of 8 eighths each.
  const SHAPES = [
    [0, 1, 2, 3, 2, 1, 2, 1],
    [0, 2, 1, 3, 1, 2, 1, 0],
    [0, 1, 2, 1, 3, 2, 1, 2],
  ];
  let lastBell = 9; // pentatonic index, kept stepwise so the tune is singable
  for (let bar = 0; bar < TOTAL_BARS; bar++) {
    const prog = FORM[Math.floor(bar / 4)];
    const deg = prog[bar % 4];
    const abs = chordTones(MAJOR, deg, 4).map((t) => tonic + t);
    const notes = voiceLead(abs, 64, prev);
    prev = notes;
    const sorted = [...notes].sort((a, b) => a - b);
    let root = tonic + MAJOR[deg];
    while (root > 48) root -= 12;
    while (root < 36) root += 12;
    const t0 = bar * BAR;

    padEv.push([t0, { notes: sorted.map((n) => midiToNote(n - 12)), dur: BAR * 0.97, vel: 0.4 }]);
    bassEv.push([t0, { note: midiToNote(root), dur: BAR * 0.9, vel: 0.6 }]);

    // Music box: a gentle arpeggio, with a couple of 8ths left out so it breathes.
    const shape = SHAPES[bar % SHAPES.length];
    shape.forEach((idx, i) => {
      if (i % 4 === 3 && rng() < 0.5) return;
      const note = sorted[idx % sorted.length] + (idx === 3 ? 12 : 0);
      boxEv.push([t0 + i * EIGHTH, { note: midiToNote(note), dur: Math.min(EIGHTH * 3, BAR - i * EIGHTH - 0.02), vel: i % 2 === 0 ? 0.42 : 0.28 }]);
    });

    // Bell melody: a short pentatonic phrase on every second bar (the answer comes at the end of it).
    if (bar % 2 === 1 || bar % 4 === 0) {
      const count = bar % 4 === 0 ? 2 + Math.floor(rng() * 2) : 2;
      let pos = bar % 4 === 0 ? 0 : 4;
      for (let i = 0; i < count; i++) {
        const step = rng() < 0.7 ? (rng() < 0.5 ? -1 : 1) : (rng() < 0.5 ? -2 : 2);
        lastBell = Math.min(11, Math.max(5, lastBell + step));
        const pi = lastBell % PENTATONIC.length;
        const oct = Math.floor(lastBell / PENTATONIC.length);
        const note = tonic + 12 + PENTATONIC[pi] + 12 * (oct - 1);
        const len = 2 + Math.floor(rng() * 2);
        bellEv.push([t0 + pos * EIGHTH, { note: midiToNote(note), dur: Math.min(len * EIGHTH * 1.4, BAR - pos * EIGHTH - 0.02), vel: 0.4 + 0.1 * rng() }]);
        pos += len;
        if (pos > 7) break;
      }
    }

    // Shaker on the off-beats, very quiet.
    for (const slot of [2, 6]) shakeEv.push([t0 + slot * EIGHTH, { vel: 0.35 + 0.1 * rng() }]);
  }

  // ----- instruments -----
  const fx = createFx(T, keep, out, { reverbDecay: 6, echoTime: '8n.', echoFeedback: 0.3 });
  const send = (amount: number, to: ToneNS.InputNode) => keep(new T.Gain(amount)).connect(to);

  // Pad: very soft, slow, mostly reverb.
  const padLp = keep(new T.Filter(1400, 'lowpass')).fan(out, send(0.5, fx.rev));
  const pad = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'fattriangle', count: 2, spread: 12 },
    envelope: { attack: 1.2, decay: 0.5, sustain: 0.8, release: 3 },
  })).connect(padLp);
  pad.maxPolyphony = 8;
  pad.volume.value = -19;

  // Music box: bright, short FM pluck into echo and reverb.
  const boxLp = keep(new T.Filter(5000, 'lowpass')).fan(out, send(0.35, fx.delay), send(0.3, fx.rev));
  const box = keep(new T.PolySynth(T.FMSynth, {
    harmonicity: 3, modulationIndex: 1.2,
    oscillator: { type: 'sine' }, modulation: { type: 'sine' },
    envelope: { attack: 0.002, decay: 0.7, sustain: 0, release: 0.8 },
    modulationEnvelope: { attack: 0.002, decay: 0.3, sustain: 0, release: 0.3 },
  })).connect(boxLp);
  box.maxPolyphony = 6;
  box.volume.value = -13;

  // Bass: round sine.
  const bassLp = keep(new T.Filter(380, 'lowpass')).connect(out);
  const bass = keep(new T.MonoSynth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.06, decay: 0.4, sustain: 0.6, release: 1.2 },
    filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.8, baseFrequency: 180, octaves: 0.5 },
  })).connect(bassLp);
  bass.volume.value = -11;

  // Bell: soft sine/triangle melody, longer tail.
  const bellLp = keep(new T.Filter(4500, 'lowpass')).fan(out, send(0.45, fx.delay), send(0.45, fx.rev));
  const bell = keep(new T.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 1.2, sustain: 0.1, release: 1.8 },
  })).connect(bellLp);
  bell.volume.value = -11;

  // Shaker: soft pink noise.
  const shHp = keep(new T.Filter(5000, 'highpass')).connect(out);
  const shaker = keep(new T.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.03, decay: 0.12, sustain: 0, release: 0.05 },
  })).connect(shHp);
  shaker.volume.value = -34;

  // ----- schedule: one looping Part per voice, in seconds -----
  const schedule = <V>(events: Ev<V>[], fn: (time: number, v: V) => void): void => {
    const part = keep(new T.Part<Ev<V>>((time, v) => {
      try { fn(time, v); } catch { /* skip this note */ }
    }, events));
    part.loop = true;
    part.loopEnd = LOOP;
    part.start(0);
  };
  const mono = (): ((t: number) => number) => {
    let last = -1;
    return (t) => (last = t > last ? t : last + 0.001);
  };
  const bassT = mono();
  const bellT = mono();
  const shakeT = mono();
  schedule(padEv, (time, e) => pad.triggerAttackRelease(e.notes, e.dur, time, e.vel));
  schedule(boxEv, (time, e) => box.triggerAttackRelease(e.note, e.dur, time, e.vel));
  schedule(bassEv, (time, e) => bass.triggerAttackRelease(e.note, e.dur, bassT(time), e.vel));
  schedule(bellEv, (time, e) => bell.triggerAttackRelease(e.note, e.dur, bellT(time), e.vel));
  schedule(shakeEv, (time, e) => shaker.triggerAttackRelease(0.1, shakeT(time), e.vel));
}

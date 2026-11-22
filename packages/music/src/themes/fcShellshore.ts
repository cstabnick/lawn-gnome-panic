// Shellshore (The Final Collectathon): a dreamy, slow island lullaby for the beach planet. Generated in code with Tone.js.
//
// - 72 bpm, A-flat major (tonic A-flat 2/3 = MIDI 56), 16 bars, one chord per bar:
//   Imaj7 IVmaj7 vi7 V | Imaj7 II (lydian: a B-flat major triad over A-flat) IVmaj7 Isus2, twice.
// - Always on: a warm fattriangle pad with lots of reverb, and an ocean (pink noise through a lowpass whose gain
//   washes in and out on a slow LFO).
// - Intensity (opts.intensity, read once a bar): >= 0.5 adds a steel-drum melody (major pentatonic, two-bar phrases
//   with space between); >= 0.9 adds a ukulele strum, a round bass and a soft shaker. Layers fade in/out over a bar
//   on their own Volume nodes.
// - pickup(): a soft bell climbing the A-flat major pentatonic up from A-flat 5.
// - Everything is generated once from mulberry32(seed) and replayed every loop.
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '../engine';
import { createFx } from '../mix';
import { midiToNote, mulberry32, voiceLead } from '../theory';
import type { FcMusicHooks, FcMusicOptions } from './fcShared';

const BPM = 72;
const TONIC = 56; // A-flat 3
const PENTATONIC = [0, 2, 4, 7, 9]; // major pentatonic, from the tonic: no 4th, no 7th, never the lydian #4
// Chords relative to the tonic, one per bar (8 bars, played twice).
const IMAJ7 = [0, 4, 7, 11];
const IVMAJ7 = [5, 9, 12, 16];
const VI7 = [9, 12, 16, 19];
const V = [7, 11, 14];
const II = [2, 6, 9]; // lydian major II: B-flat major over A-flat
const ISUS2 = [0, 2, 7];
const PROG = [IMAJ7, IVMAJ7, VI7, V, IMAJ7, II, IVMAJ7, ISUS2];
// Bass: [root, fifth] relative to the tonic.
const BASS = [[0, 7], [5, 12], [9, 16], [7, 14], [0, 7], [2, 9], [5, 12], [0, 7]];
const TOTAL_BARS = 16;
// Ukulele strum: down-down-up-up-down-up on eighths (D . D U . U D U).
const STRUM: [number, 'down' | 'up'][] = [[0, 'down'], [2, 'down'], [3, 'up'], [5, 'up'], [6, 'down'], [7, 'up']];
const STRUM_GAP = 0.025;
const SILENT_DB = -60;

type Ev<V> = [number, V];
interface NoteEv { note: string; dur: number; vel: number }

export function buildFcShellshore(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number, opts: FcMusicOptions = {}): FcMusicHooks {
  const rng = mulberry32(seed);
  T.getTransport().bpm.value = BPM;
  const BAR = 240 / BPM;
  const EIGHTH = BAR / 8;
  const LOOP = TOTAL_BARS * BAR;

  // ----- events -----
  const padEv: Ev<{ notes: string[]; dur: number; vel: number }>[] = [];
  const steelEv: Ev<NoteEv>[] = [];
  const strumEv: Ev<{ string: number; note: string; dur: number; vel: number }>[] = [];
  const bassEv: Ev<NoteEv>[] = [];
  const shakeEv: Ev<{ vel: number }>[] = [];

  let prevPad: number[] | null = null;
  let prevUke: number[] | null = null;
  for (let bar = 0; bar < TOTAL_BARS; bar++) {
    const chord = PROG[bar % PROG.length];
    const t0 = bar * BAR;

    const padNotes = voiceLead(chord.map((c) => TONIC + c), 64, prevPad).sort((a, b) => a - b);
    prevPad = padNotes;
    padEv.push([t0, { notes: padNotes.map(midiToNote), dur: BAR * 0.97, vel: 0.38 }]);

    // Four strings: a triad doubles its root an octave up.
    const four = chord.length >= 4 ? chord.slice(0, 4) : [...chord, chord[0] + 12];
    const uke = voiceLead(four.map((c) => TONIC + c), 66, prevUke).sort((a, b) => a - b);
    prevUke = uke;
    for (const [slot, dir] of STRUM) {
      const accent = slot === 0 || slot === 6;
      for (let k = 0; k < 4; k++) {
        const s = dir === 'down' ? k : 3 - k;
        strumEv.push([t0 + slot * EIGHTH + k * STRUM_GAP, {
          string: s,
          note: midiToNote(uke[s]),
          dur: EIGHTH * 0.9,
          vel: (accent ? 0.5 : 0.36) * (dir === 'up' ? 0.8 : 1) * (0.92 + 0.08 * rng()),
        }]);
      }
    }

    const [root, fifth] = BASS[bar % BASS.length].map((b) => {
      let n = TONIC + b;
      while (n > 50) n -= 12;
      while (n < 38) n += 12;
      return n;
    });
    bassEv.push([t0, { note: midiToNote(root), dur: BAR * 0.45, vel: 0.62 }]);
    bassEv.push([t0 + BAR / 2, { note: midiToNote(fifth), dur: BAR * 0.42, vel: 0.5 }]);

    for (const slot of [1, 3, 5, 7]) shakeEv.push([t0 + slot * EIGHTH, { vel: 0.25 + 0.1 * rng() }]);
  }

  // Steel drum: two-bar phrases (bars 0-1 of every four), then two bars of space. A A' A B form, singable steps.
  const pentNote = (i: number): number => TONIC + PENTATONIC[((i % 5) + 5) % 5] + 12 * Math.floor(i / 5);
  const makePhrase = (endOnTonic: boolean): { pos: number; len: number; idx: number }[] => {
    const notes: { pos: number; len: number; idx: number }[] = [];
    let idx = 6 + Math.floor(rng() * 3); // B-flat 4 .. E-flat 5
    let pos = 0;
    while (pos < 11) {
      const len = [1, 2, 2, 2, 3][Math.floor(rng() * 5)];
      notes.push({ pos, len, idx });
      pos += len;
      const step = rng() < 0.75 ? (rng() < 0.5 ? -1 : 1) : (rng() < 0.5 ? -2 : 2);
      idx = Math.min(11, Math.max(5, idx + step));
    }
    // A long resting note at the end of the phrase, on a chord tone.
    notes.push({ pos, len: 4, idx: endOnTonic ? 5 : (rng() < 0.5 ? 7 : 8) });
    return notes;
  };
  const phraseA = makePhrase(false);
  const phraseB = makePhrase(true);
  const phrases = [phraseA, makePhrase(false), phraseA, phraseB];
  phrases.forEach((phrase, p) => {
    const t0 = p * 4 * BAR;
    for (const n of phrase) {
      steelEv.push([t0 + n.pos * EIGHTH, { note: midiToNote(pentNote(n.idx)), dur: Math.min(n.len * EIGHTH, 1.2), vel: 0.5 + 0.12 * rng() }]);
    }
  });

  // ----- instruments -----
  const fx = createFx(T, keep, out, { reverbDecay: 7, echoTime: '8n.', echoFeedback: 0.32 });
  const send = (amount: number, to: ToneNS.InputNode) => keep(new T.Gain(amount)).connect(to);
  const layerVol = (): ToneNS.Volume => keep(new T.Volume(SILENT_DB));

  // Warm pad: always on, slow, mostly reverb.
  const padLp = keep(new T.Filter(1600, 'lowpass')).fan(out, send(0.6, fx.rev));
  const padHp = keep(new T.Filter(200, 'highpass')).connect(padLp);
  const pad = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'fattriangle', count: 2, spread: 14 },
    envelope: { attack: 1.5, decay: 0.6, sustain: 0.8, release: 3.5 },
  })).connect(padHp);
  pad.maxPolyphony = 10;
  pad.volume.value = -18;

  // Ocean: pink noise, lowpassed, its gain washing in and out.
  const oceanGain = keep(new T.Gain(0.06)).fan(out, send(0.25, fx.rev));
  const oceanLp = keep(new T.Filter(800, 'lowpass')).connect(oceanGain);
  keep(new T.LFO({ frequency: 0.08, min: 0.02, max: 0.12 })).connect(oceanGain.gain).start();
  const ocean = keep(new T.Noise('pink')).connect(oceanLp);
  ocean.volume.value = -10;
  ocean.start();

  // Steel drum melody (intensity >= 0.5).
  const steelVol = layerVol().fan(out, send(0.35, fx.delay), send(0.4, fx.rev));
  const steelHp = keep(new T.Filter(220, 'highpass')).connect(steelVol);
  const steel = keep(new T.PolySynth(T.FMSynth, {
    harmonicity: 3.5, modulationIndex: 5,
    oscillator: { type: 'sine' }, modulation: { type: 'sine' },
    envelope: { attack: 0.003, decay: 0.8, sustain: 0, release: 0.8 },
    modulationEnvelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.2 },
  })).connect(steelHp);
  steel.maxPolyphony = 6;
  steel.volume.value = -14;

  // Ukulele strum (intensity >= 0.9): one PluckSynth per string.
  const ukeVol = layerVol().fan(out, send(0.15, fx.rev));
  const ukeHp = keep(new T.Filter(250, 'highpass')).connect(ukeVol);
  const strings = [0, 1, 2, 3].map(() => {
    const s = keep(new T.PluckSynth({ attackNoise: 0.6, dampening: 3200, resonance: 0.92, release: 0.6 })).connect(ukeHp);
    s.volume.value = -14;
    return s;
  });

  // Round bass (intensity >= 0.9): dry.
  const bassVol = layerVol().connect(out);
  const bassLp = keep(new T.Filter(400, 'lowpass')).connect(bassVol);
  const bass = keep(new T.MonoSynth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.05, decay: 0.4, sustain: 0.6, release: 0.9 },
    filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.6, baseFrequency: 180, octaves: 0.5 },
  })).connect(bassLp);
  bass.volume.value = -11;

  // Shaker (intensity >= 0.9): very soft pink noise.
  const shakeVol = layerVol().connect(out);
  const shHp = keep(new T.Filter(5000, 'highpass')).connect(shakeVol);
  const shaker = keep(new T.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0, release: 0.05 },
  })).connect(shHp);
  shaker.volume.value = -36;

  // Pickup bell: soft sine with a 1.2 s decay into reverb.
  const bellHp = keep(new T.Filter(300, 'highpass')).fan(out, send(0.5, fx.rev));
  const bell = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 1.2, sustain: 0, release: 1.2 },
  })).connect(bellHp);
  bell.maxPolyphony = 8;
  bell.volume.value = -12;

  // ----- intensity: read once a bar, layers fade over a bar -----
  interface Layer { threshold: number; vols: ToneNS.Volume[]; on: boolean; playing: boolean }
  const melody: Layer = { threshold: 0.5, vols: [steelVol], on: false, playing: false };
  const groove: Layer = { threshold: 0.9, vols: [ukeVol, bassVol, shakeVol], on: false, playing: false };
  const updateLayer = (layer: Layer, x: number, time: number): void => {
    const want = x >= layer.threshold;
    if (want) {
      layer.playing = true;
      if (!layer.on) for (const v of layer.vols) v.volume.rampTo(0, BAR * 0.9, time);
    } else if (layer.on) {
      // Keep playing through this bar while it fades out.
      for (const v of layer.vols) v.volume.rampTo(SILENT_DB, BAR * 0.9, time);
    } else {
      layer.playing = false;
    }
    layer.on = want;
  };
  const loop = keep(new T.Loop((time) => {
    let x = 0;
    try { x = opts.intensity?.() ?? 0; } catch { /* treat as calm */ }
    updateLayer(melody, x, time);
    updateLayer(groove, x, time);
  }, BAR));
  loop.start(0);

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
  const shakeT = mono();
  const stringT = strings.map(() => mono());
  schedule(padEv, (time, e) => pad.triggerAttackRelease(e.notes, e.dur, time, e.vel));
  schedule(steelEv, (time, e) => {
    if (melody.playing) steel.triggerAttackRelease(e.note, e.dur, time, e.vel);
  });
  schedule(strumEv, (time, e) => {
    if (groove.playing) strings[e.string].triggerAttackRelease(e.note, e.dur, stringT[e.string](time), e.vel);
  });
  schedule(bassEv, (time, e) => {
    if (groove.playing) bass.triggerAttackRelease(e.note, e.dur, bassT(time), e.vel);
  });
  schedule(shakeEv, (time, e) => {
    if (groove.playing) shaker.triggerAttackRelease(0.08, shakeT(time), e.vel);
  });

  // ----- pickup hook -----
  const PICKUP = [0, 2, 4, 7, 9, 12].map((i) => TONIC + 24 + i); // A-flat 5 upward
  let pickupStep = 0;
  let lastPickup = -Infinity;
  return {
    pickup() {
      try {
        const now = T.now();
        if (now - lastPickup < 0.08) return;
        if (now - lastPickup > 1.2) pickupStep = 0;
        lastPickup = now;
        const note = PICKUP[pickupStep % PICKUP.length];
        pickupStep = (pickupStep + 1) % PICKUP.length;
        bell.triggerAttackRelease(midiToNote(note), 0.4, now, 0.45);
      } catch { /* a missed pickup note is fine */ }
    },
  };
}

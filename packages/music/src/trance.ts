/**
 * Classic uplifting trance generator for @lawn/music.
 *
 * - Tempo 136-140 BPM in bright major modes (Ionian / Lydian) with euphoric progressions.
 * - Seed-driven varied song structures (Classic Anthem, Double Drop, Extended Journey, Instant Lift)
 *   so every remix has a distinct arrangement, pacing, chord rhythm, and motif evolution.
 * - Warm, controlled drums: pink/low-passed noise snares/claps/hats so the high end never pierces,
 *   plus punchy 4x4 kick, crash, and smooth bandpass noise risers.
 * - Rich FX rack: stereo Chorus, Phaser, AutoFilter, StereoWidener, dotted-8th PingPongDelay,
 *   quarter-note dub/stab ThrowDelay, and high-passed hall Reverb, all sidechain-ducked by the kick.
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from './engine';
import { createAutoPanner, createPanner, createStereoWidener } from './mix';
import {
  MODES,
  NOTE_NAMES,
  chordTones,
  degreeToMidi,
  humanize,
  midiToNote,
  mulberry32,
  ornamentMotif,
  transposeMotif,
  voiceLead,
  type MotifNote,
} from './theory';

const STEPS_PER_BAR = 16;

type SectionKind = 'INTRO' | 'BUILD' | 'BREAKDOWN' | 'CLIMAX' | 'OUTRO';

interface SectionBlock {
  kind: SectionKind;
  bars: number;
  startBar: number;
}

const FORM_TEMPLATES: readonly { name: string; blocks: readonly [SectionKind, number][] }[] = [
  {
    name: 'Classic Anthem',
    blocks: [['INTRO', 8], ['BUILD', 8], ['BREAKDOWN', 8], ['CLIMAX', 16], ['OUTRO', 8]],
  },
  {
    name: 'Double Drop',
    blocks: [['INTRO', 4], ['BUILD', 8], ['CLIMAX', 8], ['BREAKDOWN', 8], ['BUILD', 4], ['CLIMAX', 12], ['OUTRO', 4]],
  },
  {
    name: 'Extended Journey',
    blocks: [['INTRO', 8], ['BREAKDOWN', 8], ['BUILD', 8], ['CLIMAX', 16], ['BREAKDOWN', 8], ['CLIMAX', 12], ['OUTRO', 4]],
  },
  {
    name: 'Instant Lift',
    blocks: [['BUILD', 8], ['CLIMAX', 12], ['BREAKDOWN', 8], ['BUILD', 4], ['CLIMAX', 16], ['OUTRO', 8]],
  },
];

interface TrancePreset {
  name: string;
  mode: 'ionian' | 'lydian';
  a: readonly number[];
  b: readonly number[];
}

const PRESETS: readonly TrancePreset[] = [
  { name: 'Euphoric Anthem', mode: 'ionian', a: [0, 4, 5, 3], b: [5, 3, 0, 4] },
  { name: 'Lydian Sunrise',  mode: 'lydian', a: [0, 4, 3, 4], b: [3, 4, 2, 5] },
  { name: 'Festival Lift',   mode: 'ionian', a: [5, 3, 0, 4], b: [0, 2, 3, 4] },
  { name: 'Skyline Rush',    mode: 'lydian', a: [0, 1, 3, 4], b: [5, 4, 3, 4] },
  { name: 'Solar Flare',     mode: 'ionian', a: [3, 4, 0, 5], b: [0, 3, 4, 4] },
];

/** Classic syncopated trance stab rhythms (16 steps per bar). */
const STAB_PATTERNS: readonly (readonly number[])[] = [
  [0, 3, 6, 10, 12, 14],
  [0, 3, 6, 8, 11, 14],
  [2, 6, 10, 12, 14],
  [0, 4, 6, 10, 13],
  [0, 3, 8, 10, 14],
];

/** Trance-gate volume pattern (16 steps) for optional gated pad energy. */
const GATE_PATTERN: readonly number[] = [1, 0.35, 0.9, 0.25, 1, 0.35, 0.85, 0.25, 1, 0.35, 0.9, 0.3, 1, 0.5, 0.85, 0.4];

/** Rolling 16th-note trance bassline accents (0 = rest, 1 = root, 2 = octave up). */
const BASS_PATTERNS: readonly (readonly number[])[] = [
  [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1],
  [0, 1, 1, 2, 0, 1, 1, 2, 0, 1, 1, 2, 0, 1, 2, 1],
  [0, 0, 2, 1, 0, 0, 2, 1, 0, 0, 2, 1, 0, 1, 2, 1],
  [1, 0, 2, 1, 0, 1, 2, 0, 1, 0, 2, 1, 0, 1, 2, 1],
];

/**
 * 16-step 303 acid patterns:
 *   0 = rest, 1 = root, 2 = accented root, 3 = octave + accent, 4 = 5th, 5 = accented 3rd/7th
 */
const ACID_PATTERNS: readonly (readonly number[])[] = [
  [2, 0, 1, 3, 0, 2, 4, 0, 1, 3, 0, 2, 4, 1, 3, 5],
  [1, 3, 0, 2, 1, 0, 4, 3, 0, 2, 1, 4, 3, 0, 5, 2],
  [2, 1, 3, 0, 4, 2, 0, 3, 1, 5, 0, 2, 3, 4, 1, 0],
  [0, 2, 3, 1, 0, 4, 2, 5, 0, 1, 3, 2, 4, 0, 3, 5],
];

/**
 * Classical master arpeggio figures (indices into an 8-note chord-memory stack:
 * [root, 3rd, 5th, 7th, 8ve, 9th, 10th, 12th]), mutated Cthulhu-style per seed.
 */
const CLASSICAL_ARPS: readonly { name: string; steps: readonly number[] }[] = [
  // Bach (WTC Prelude in C style): rising 5-note broken chord in 2-beat waves
  { name: 'Bach Prelude', steps: [0, 1, 2, 4, 6, 2, 4, 6, 0, 1, 2, 4, 6, 2, 4, 6] },
  // Bach (Baroque Toccata pedal-point cascade)
  { name: 'Bach Toccata', steps: [4, 2, 4, 1, 4, 0, 4, 2, 5, 4, 6, 4, 7, 6, 4, 2] },
  // Mozart (Alberti bass rocketing into a Sonata chord cascade)
  { name: 'Mozart Alberti', steps: [0, 2, 1, 2, 0, 4, 1, 4, 2, 5, 4, 6, 7, 6, 4, 2] },
  // Beethoven (Moonlight-style 3-note rising sweep across 16ths)
  { name: 'Beethoven Sweep', steps: [0, 1, 2, 0, 1, 2, 1, 2, 4, 2, 4, 5, 4, 6, 7, 6] },
  // Vivaldi (Baroque driving chord engine with upper extensions)
  { name: 'Vivaldi Engine', steps: [0, 4, 2, 4, 1, 5, 2, 5, 0, 4, 2, 4, 7, 6, 4, 2] },
];

/**
 * Cthulhu-style arpeggiator mutator: warps a classical figure with chord-memory octave leaps,
 * syncopated gate rests (-1), phrase rotations, and mirrored second halves.
 */
function cthulhuMutate(steps: readonly number[], rnd: () => number, intensity: number): number[] {
  const rot = Math.floor(rnd() * 4) * 2; // rotate by 0, 2, 4, or 6 steps
  const mirrorHalf = rnd() < 0.45;
  const out: number[] = [];

  for (let i = 0; i < 16; i++) {
    const srcIdx = mirrorHalf && i >= 8 ? 15 - (i - 8) : (i + rot) % 16;
    let val = steps[srcIdx];

    // Syncopated gate rest on off-16ths
    if (i % 4 !== 0 && rnd() < intensity * 0.24) {
      out.push(-1);
      continue;
    }

    // Cthulhu octave/extension warp
    if (rnd() < intensity * 0.35) {
      val = (val + (rnd() < 0.65 ? 3 : -2) + 8) % 8;
    }
    out.push(val);
  }
  return out;
}

/** Anthemic 4-bar uplifting lead motifs in scale degrees (0 = tonic). */
const LEAD_MOTIFS: readonly (readonly MotifNote[])[] = [
  [
    { bar: 0, step: 0, deg: 4, len: 6, vel: 0.95 },
    { bar: 0, step: 6, deg: 7, len: 6, vel: 1.0 },
    { bar: 0, step: 12, deg: 6, len: 4, vel: 0.9 },
    { bar: 1, step: 0, deg: 4, len: 8, vel: 0.95 },
    { bar: 1, step: 10, deg: 2, len: 6, vel: 0.88 },
    { bar: 2, step: 0, deg: 3, len: 6, vel: 0.95 },
    { bar: 2, step: 6, deg: 5, len: 6, vel: 0.98 },
    { bar: 2, step: 12, deg: 4, len: 4, vel: 0.9 },
    { bar: 3, step: 0, deg: 2, len: 6, vel: 0.92 },
    { bar: 3, step: 6, deg: 4, len: 6, vel: 0.95 },
    { bar: 3, step: 12, deg: 7, len: 4, vel: 1.0 },
  ],
  [
    { bar: 0, step: 0, deg: 7, len: 6, vel: 1.0 },
    { bar: 0, step: 6, deg: 6, len: 4, vel: 0.9 },
    { bar: 0, step: 10, deg: 4, len: 6, vel: 0.92 },
    { bar: 1, step: 0, deg: 5, len: 8, vel: 0.95 },
    { bar: 1, step: 8, deg: 4, len: 4, vel: 0.88 },
    { bar: 1, step: 12, deg: 2, len: 4, vel: 0.86 },
    { bar: 2, step: 0, deg: 3, len: 6, vel: 0.94 },
    { bar: 2, step: 6, deg: 4, len: 4, vel: 0.9 },
    { bar: 2, step: 10, deg: 7, len: 6, vel: 1.0 },
    { bar: 3, step: 0, deg: 9, len: 8, vel: 1.0 },
    { bar: 3, step: 10, deg: 7, len: 6, vel: 0.95 },
  ],
  [
    { bar: 0, step: 0, deg: 2, len: 6, vel: 0.9 },
    { bar: 0, step: 6, deg: 4, len: 6, vel: 0.95 },
    { bar: 0, step: 12, deg: 7, len: 4, vel: 1.0 },
    { bar: 1, step: 0, deg: 6, len: 6, vel: 0.94 },
    { bar: 1, step: 6, deg: 4, len: 6, vel: 0.9 },
    { bar: 1, step: 12, deg: 2, len: 4, vel: 0.86 },
    { bar: 2, step: 0, deg: 0, len: 6, vel: 0.92 },
    { bar: 2, step: 6, deg: 2, len: 6, vel: 0.94 },
    { bar: 2, step: 12, deg: 4, len: 4, vel: 0.96 },
    { bar: 3, step: 0, deg: 5, len: 8, vel: 0.98 },
    { bar: 3, step: 8, deg: 7, len: 8, vel: 1.0 },
  ],
  [
    { bar: 0, step: 0, deg: 4, len: 4, vel: 0.92 },
    { bar: 0, step: 4, deg: 5, len: 4, vel: 0.95 },
    { bar: 0, step: 8, deg: 7, len: 8, vel: 1.0 },
    { bar: 1, step: 0, deg: 9, len: 6, vel: 1.0 },
    { bar: 1, step: 6, deg: 7, len: 6, vel: 0.94 },
    { bar: 1, step: 12, deg: 5, len: 4, vel: 0.9 },
    { bar: 2, step: 0, deg: 4, len: 6, vel: 0.95 },
    { bar: 2, step: 6, deg: 2, len: 6, vel: 0.9 },
    { bar: 2, step: 12, deg: 4, len: 4, vel: 0.92 },
    { bar: 3, step: 0, deg: 7, len: 12, vel: 1.0 },
  ],
];

export function buildTranceTrack(T: Tone, keep: Keep, out: ToneNS.Volume, seed: number): void {
  const rnd = mulberry32(seed);
  const pick = <V>(xs: readonly V[]): V => xs[Math.floor(rnd() * xs.length)];

  const bpm = 136 + Math.floor(rnd() * 5);
  const transport = T.getTransport();
  transport.bpm.value = bpm;

  const BAR = 240 / bpm;
  const BEAT = BAR / 4;
  const SIXTEENTH = BAR / 16;

  // Build seed-driven song form
  const formTemplate = pick(FORM_TEMPLATES);
  const sections: SectionBlock[] = [];
  let cursorBar = 0;
  for (const [kind, bars] of formTemplate.blocks) {
    sections.push({ kind, bars, startBar: cursorBar });
    cursorBar += bars;
  }
  const TOTAL_BARS = cursorBar;

  const sectionForBar = (bar: number): { block: SectionBlock; localBar: number } => {
    for (const block of sections) {
      if (bar >= block.startBar && bar < block.startBar + block.bars) {
        return { block, localBar: bar - block.startBar };
      }
    }
    const last = sections[sections.length - 1];
    return { block: last, localBar: bar - last.startBar };
  };

  const preset = pick(PRESETS);
  const mode = MODES[preset.mode];
  const root = 53 + Math.floor(rnd() * 7); // F3..B3
  const useGatedPad = rnd() < 0.55;
  const acidWave = pick(['sawtooth', 'square'] as const);
  const breakdownDoubleBarChords = rnd() < 0.6;
  const dropCutMode = pick(['fullBar', 'halfBar', 'stutter'] as const);

  console.info(
    `[music] Trance (${formTemplate.name}): ${preset.name} in ${NOTE_NAMES[root % 12]} ${preset.mode}, ${bpm} bpm`,
  );

  // ----- Mixing & Effects Rack -----
  // Master trance bus compressor + tonal bus compressor to keep procedural levels balanced across sections.
  const mixBus = keep(new T.Compressor({ threshold: -16, ratio: 3.2, attack: 0.01, release: 0.14 })).connect(out);
  const tonalComp = keep(new T.Compressor({ threshold: -18, ratio: 3.5, attack: 0.008, release: 0.16 })).connect(mixBus);
  const duck = keep(new T.Gain(1)).connect(tonalComp);

  // High-passed hall reverb so tails stay airy and never muddy the kick/sub.
  const revHp = keep(new T.Filter(260, 'highpass')).connect(mixBus);
  const revLp = keep(new T.Filter(6800, 'lowpass')).connect(revHp);
  const rev = keep(new T.Reverb({ decay: 5.2, preDelay: 0.022, wet: 1 })).connect(revLp);

  // Dotted-8th stereo ping-pong delay feeding both stereo return and reverb.
  const delayHp = keep(new T.Filter(280, 'highpass')).connect(mixBus);
  const delayLp = keep(new T.Filter(4400, 'lowpass')).connect(delayHp);
  delayLp.connect(keep(new T.Gain(0.45)).connect(rev));
  const delay = keep(new T.PingPongDelay({ delayTime: '8n.', feedback: 0.46, wet: 1 })).connect(delayLp);

  // Quarter-note dub/stab throw delay for big phrase-ending echoes.
  const throwLp = keep(new T.Filter(3200, 'lowpass')).connect(rev);
  const throwDelay = keep(new T.FeedbackDelay({ delayTime: '4n', feedback: 0.52, wet: 1 })).connect(throwLp);
  const throwSend = keep(new T.Gain(0)).connect(throwDelay);

  // Lush stereo chorus + widener bus for supersaws.
  const widener = createStereoWidener(T, keep, 0.68, duck);
  const chorusToRev = keep(new T.Gain(0.3)).connect(rev);
  const chorus = keep(new T.Chorus({ frequency: 1.15, delayTime: 3.6, depth: 0.75, spread: 180, wet: 1 }))
    .fan(widener, chorusToRev);
  chorus.start();

  // Sweeping phaser bus for pad & arp shimmer.
  const phaser = keep(new T.Phaser({ frequency: 0.28, octaves: 2.5, baseFrequency: 420, wet: 0.72 }))
    .fan(widener, keep(new T.Gain(0.25)).connect(rev));

  // ----- Drums (warmly filtered so high end sits smoothly in the mix) -----
  const kickLp = keep(new T.Filter(2800, 'lowpass')).connect(mixBus);
  const kick = keep(new T.MembraneSynth({
    pitchDecay: 0.045,
    octaves: 5.2,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.002, decay: 0.27, sustain: 0, release: 0.05 },
  })).connect(kickLp);
  kick.volume.value = -2;

  // Warm, controlled clap/snare: pink noise -> bandpass + lowpass ceiling at 3.2 kHz
  const clapRev = keep(new T.Gain(0.24)).connect(rev);
  const clapLp = keep(new T.Filter(3200, 'lowpass')).fan(mixBus, clapRev);
  const clapBp = keep(new T.Filter({ frequency: 1150, type: 'bandpass', Q: 0.9 })).connect(clapLp);
  const clapNoise = keep(new T.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.003, decay: 0.14, sustain: 0, release: 0.04 },
  })).connect(clapBp);
  clapNoise.volume.value = -11;

  const snareBodyLp = keep(new T.Filter(1800, 'lowpass')).fan(mixBus, clapRev);
  const snareBody = keep(new T.MembraneSynth({
    pitchDecay: 0.028,
    octaves: 1.9,
    envelope: { attack: 0.002, decay: 0.095, sustain: 0, release: 0.03 },
  })).connect(snareBodyLp);
  snareBody.volume.value = -12;

  // Hats: band-shaped & panned (closed slightly left, open slightly right) for stereo width
  const hatClosedPan = createPanner(T, keep, -0.24, mixBus);
  const hatClosedLp = keep(new T.Filter(9800, 'lowpass')).connect(hatClosedPan);
  const hatClosedHp = keep(new T.Filter(6200, 'highpass')).connect(hatClosedLp);
  const hatClosed = keep(new T.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.002, decay: 0.032, sustain: 0, release: 0.015 },
  })).connect(hatClosedHp);
  hatClosed.volume.value = -18;

  const hatOpenPan = createPanner(T, keep, 0.28, mixBus);
  hatOpenPan.connect(keep(new T.Gain(0.18)).connect(rev));
  const hatOpenLp = keep(new T.Filter(8800, 'lowpass')).connect(hatOpenPan);
  const hatOpenHp = keep(new T.Filter(5200, 'highpass')).connect(hatOpenLp);
  const hatOpen = keep(new T.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.004, decay: 0.16, sustain: 0, release: 0.05 },
  })).connect(hatOpenHp);
  hatOpen.volume.value = -16;

  // Filtered crash & smooth noise riser
  const crashLp = keep(new T.Filter(7200, 'lowpass')).fan(mixBus, keep(new T.Gain(0.55)).connect(rev));
  const crashHp = keep(new T.Filter(3400, 'highpass')).connect(crashLp);
  const crash = keep(new T.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.01, decay: 1.5, sustain: 0, release: 0.35 },
  })).connect(crashHp);
  crash.volume.value = -13;

  const riserLp = keep(new T.Filter(4800, 'lowpass')).fan(mixBus, keep(new T.Gain(0.45)).connect(rev));
  const riserFilter = keep(new T.Filter({ frequency: 280, type: 'bandpass', Q: 2.0 })).connect(riserLp);
  const riser = keep(new T.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.85, decay: 0.2, sustain: 0.88, release: 0.35 },
  })).connect(riserFilter);
  riser.volume.value = -13;

  // ----- Tonal Instruments (sidechain-ducked, high-passed above sub) -----
  const sub = keep(new T.MonoSynth({
    oscillator: { type: 'sine' },
    filter: { type: 'lowpass', frequency: 175 },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.85, release: 0.06 },
    filterEnvelope: { attack: 0.005, decay: 0.1, sustain: 1, release: 0.06, baseFrequency: 175, octaves: 0 },
  })).connect(duck);
  sub.volume.value = -6;

  const bassHp = keep(new T.Filter(105, 'highpass')).connect(duck);
  const bass = keep(new T.MonoSynth({
    oscillator: { type: 'fatsawtooth', count: 2, spread: 14 },
    filter: { type: 'lowpass', Q: 2.3, rolloff: -24 },
    envelope: { attack: 0.004, decay: 0.14, sustain: 0.25, release: 0.08 },
    filterEnvelope: {
      attack: 0.004,
      decay: 0.15,
      sustain: 0.18,
      release: 0.08,
      baseFrequency: 190,
      octaves: 2.8,
    },
  })).connect(bassHp);
  bass.volume.value = -10;

  // Dynamic 303-style Acid Line: resonant sweeping filter + envelope shaping + auto-panning stereo width
  const acidPan = createAutoPanner(T, keep, duck, { frequency: 0.22, depth: 0.65 });
  acidPan.fan(keep(new T.Gain(0.55)).connect(delay), keep(new T.Gain(0.32)).connect(rev));
  const acidSweepLp = keep(new T.Filter({ frequency: 1400, type: 'lowpass', Q: 6.5, rolloff: -24 })).connect(acidPan);
  const acidHp = keep(new T.Filter(230, 'highpass')).connect(acidSweepLp);
  const acid = keep(new T.MonoSynth({
    oscillator: { type: acidWave },
    filter: { type: 'lowpass', Q: 8.5, rolloff: -24 },
    envelope: { attack: 0.002, decay: 0.16, sustain: 0.06, release: 0.07 },
    filterEnvelope: {
      attack: 0.002,
      decay: 0.15,
      sustain: 0.06,
      release: 0.07,
      baseFrequency: 260,
      octaves: 3.8,
    },
  })).connect(acidHp);
  acid.volume.value = -15;

  // Supersaw Pad (extra-wide stereo field + rhythmic gate + phaser + chorus + reverb)
  const padWide = createStereoWidener(T, keep, 0.85, duck);
  const padGate = keep(new T.Gain(1));
  const padLp = keep(new T.Filter({ frequency: 1400, type: 'lowpass', rolloff: -12 })).connect(padGate);
  const padHp = keep(new T.Filter(190, 'highpass')).connect(padLp);
  padGate.fan(
    padWide,
    keep(new T.Gain(0.6)).connect(chorus),
    keep(new T.Gain(0.5)).connect(phaser),
    keep(new T.Gain(0.65)).connect(rev),
  );
  const pad = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'fatsawtooth', count: 4, spread: 34 },
    envelope: { attack: 0.3, decay: 0.35, sustain: 0.85, release: 0.45 },
  })).connect(padHp);
  pad.maxPolyphony = 24;
  pad.volume.value = -19;

  // Supersaw Stabs (panned right + wide chorus + ping-pong delay + reverb + throwSend)
  const stabPan = createPanner(T, keep, 0.34, duck);
  const stabLp = keep(new T.Filter({ frequency: 3200, type: 'lowpass', rolloff: -12 }));
  const stabHp = keep(new T.Filter(240, 'highpass')).fan(
    stabPan,
    keep(new T.Gain(0.6)).connect(chorus),
    keep(new T.Gain(0.54)).connect(delay),
    keep(new T.Gain(0.35)).connect(rev),
    throwSend,
  );
  stabLp.connect(stabHp);
  const stab = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'fatsawtooth', count: 5, spread: 34 },
    envelope: { attack: 0.004, decay: 0.14, sustain: 0.04, release: 0.12 },
  })).connect(stabLp);
  stab.maxPolyphony = 32;
  stab.volume.value = -16;

  // Major Arpeggio Synth (panned left + phaser + chorus + dotted-8th ping-pong delay + reverb)
  const arpPan = createPanner(T, keep, -0.32, duck);
  const arpLp = keep(new T.Filter({ frequency: 1800, type: 'lowpass', rolloff: -12 }));
  const arpHp = keep(new T.Filter(260, 'highpass')).fan(
    arpPan,
    keep(new T.Gain(0.5)).connect(chorus),
    keep(new T.Gain(0.36)).connect(phaser),
    keep(new T.Gain(0.64)).connect(delay),
    keep(new T.Gain(0.42)).connect(rev),
  );
  arpLp.connect(arpHp);
  const arp = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'fatsawtooth', count: 3, spread: 24 },
    envelope: { attack: 0.003, decay: 0.13, sustain: 0.06, release: 0.1 },
  })).connect(arpLp);
  arp.maxPolyphony = 24;
  arp.volume.value = -17;

  // Anthemic Supersaw Lead
  const leadLp = keep(new T.Filter({ frequency: 4800, type: 'lowpass', rolloff: -12 }));
  const leadHp = keep(new T.Filter(240, 'highpass')).fan(
    duck,
    keep(new T.Gain(0.72)).connect(chorus),
    keep(new T.Gain(0.55)).connect(delay),
    keep(new T.Gain(0.45)).connect(rev),
  );
  leadLp.connect(leadHp);
  const lead = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'fatsawtooth', count: 6, spread: 42 },
    envelope: { attack: 0.014, decay: 0.22, sustain: 0.78, release: 0.24 },
  })).connect(leadLp);
  lead.maxPolyphony = 24;
  lead.volume.value = -14;

  // ----- Precomputed Harmony, Arps & Evolving Lead Motifs -----
  const voiceProg = (prog: readonly number[], size: number, center: number): number[][] => {
    let prev: number[] | null = null;
    return prog.map((deg) => {
      const abs = chordTones(mode, deg, size).map((t) => root + t);
      const v = voiceLead(abs, center, prev);
      prev = v;
      return v;
    });
  };

  const chordsA = voiceProg(preset.a, 4, 62);
  const chordsB = voiceProg(preset.b, 4, 64);

  const bassRootFor = (deg: number): number => {
    let r = root + mode[deg % 7];
    while (r > 43) r -= 12;
    while (r < 31) r += 12;
    return r;
  };
  const rootsA = preset.a.map(bassRootFor);
  const rootsB = preset.b.map(bassRootFor);

  const arpStackFor = (deg: number): number[] => {
    const base = root + 12;
    const r = base + mode[deg % 7];
    const third = base + mode[(deg + 2) % 7] + (deg + 2 >= 7 ? 12 : 0);
    const fifth = base + mode[(deg + 4) % 7] + (deg + 4 >= 7 ? 12 : 0);
    const seventh = base + mode[(deg + 6) % 7] + (deg + 6 >= 7 ? 12 : 0);
    const ninth = base + mode[(deg + 1) % 7] + 12;
    return [r, third, fifth, seventh, r + 12, ninth, third + 12, fifth + 12];
  };
  const arpStacksA = preset.a.map(arpStackFor);
  const arpStacksB = preset.b.map(arpStackFor);

  const stabPattern = pick(STAB_PATTERNS);
  const bassPattern = pick(BASS_PATTERNS);
  const acidPatternA = pick(ACID_PATTERNS);
  const acidPatternB = pick(ACID_PATTERNS);
  const classicalBase = pick(CLASSICAL_ARPS);
  const classicalAlt = pick(CLASSICAL_ARPS);
  const arpPatternA = cthulhuMutate(classicalBase.steps, rnd, 0.45);
  const arpPatternB = cthulhuMutate(classicalAlt.steps, rnd, 0.78);
  const arpPatternC = classicalBase.steps.slice(); // pure classical master figure in breakdown!
  const baseLead = pick(LEAD_MOTIFS);
  const evolvedLead = ornamentMotif(
    rnd() < 0.4 ? transposeMotif(baseLead, 2, 0.96) : baseLead,
    rnd,
    STEPS_PER_BAR,
  );

  // ----- Playback Loop -----
  let stepIndex = 0;
  let lastTime = -1;

  interface Automatable {
    cancelScheduledValues(t: number): unknown;
    setValueAtTime(v: number, t: number): unknown;
    linearRampToValueAtTime(v: number, t: number): unknown;
    exponentialRampToValueAtTime(v: number, t: number): unknown;
  }
  const setParam = (param: Automatable, val: number, time: number): void => {
    param.cancelScheduledValues(time);
    param.setValueAtTime(val, time);
  };
  const rampParam = (param: Automatable, from: number, to: number, dur: number, time: number, exp = false): void => {
    param.cancelScheduledValues(time);
    param.setValueAtTime(from, time);
    if (exp) param.exponentialRampToValueAtTime(to, time + dur);
    else param.linearRampToValueAtTime(to, time + dur);
  };

  const loop = keep(new T.Loop((time) => {
    if (time <= lastTime + 0.001) return;
    lastTime = time;
    const totalSteps = TOTAL_BARS * STEPS_PER_BAR;
    const pos = stepIndex % totalSteps;
    stepIndex++;
    try {
      const bar = Math.floor(pos / STEPS_PER_BAR);
      const step = pos % STEPS_PER_BAR;

    const { block, localBar } = sectionForBar(bar);
    const sec = block.kind;
    const isLastBarOfBuild = sec === 'BUILD' && localBar === block.bars - 1;
    const inBuildRoll = (sec === 'BUILD' || sec === 'BREAKDOWN') && localBar >= block.bars - 2;

    const useB = sec === 'BREAKDOWN' || (sec === 'CLIMAX' && localBar >= 8);
    const slowChords = sec === 'BREAKDOWN' && breakdownDoubleBarChords;
    const chordIdx = slowChords ? Math.floor(localBar / 2) % 4 : localBar % 4;
    const chord = (useB ? chordsB : chordsA)[chordIdx];
    const bassRoot = (useB ? rootsB : rootsA)[chordIdx];
    const arpStack = (useB ? arpStacksB : arpStacksA)[chordIdx];
    const arpPat = sec === 'BREAKDOWN' ? arpPatternC : useB ? arpPatternB : arpPatternA;

    // 1. Section-start filter sweeps, crashes, and risers
    if (step === 0) {
      if (localBar === 0) {
        if (sec === 'INTRO') {
          rampParam(arpLp.frequency, 520, 2100, BAR * block.bars, time);
          rampParam(acidSweepLp.frequency, 650, 1800, BAR * block.bars, time);
          setParam(padLp.frequency, 750, time);
        } else if (sec === 'BUILD') {
          rampParam(arpLp.frequency, 1600, 4200, BAR * block.bars, time);
          rampParam(acidSweepLp.frequency, 1200, 4400, BAR * block.bars, time, true);
          rampParam(stabLp.frequency, 1500, 3600, BAR * block.bars, time);
          setParam(padLp.frequency, 1100, time);
        } else if (sec === 'BREAKDOWN') {
          crash.triggerAttackRelease(1.5, time, 0.72);
          rampParam(padLp.frequency, 1100, 3200, BAR * block.bars, time);
          rampParam(arpLp.frequency, 2400, 4600, BAR * block.bars, time);
          rampParam(acidSweepLp.frequency, 900, 3600, BAR * block.bars, time, true);
          rampParam(leadLp.frequency, 1700, 4200, BAR * block.bars, time);
        } else if (sec === 'CLIMAX') {
          crash.triggerAttackRelease(1.7, time, 0.85);
          setParam(padLp.frequency, 2600, time);
          setParam(stabLp.frequency, 3600, time);
          setParam(arpLp.frequency, 4600, time);
          rampParam(acidSweepLp.frequency, 2600, 4600, BAR * block.bars, time);
          setParam(leadLp.frequency, 4800, time);
        } else if (sec === 'OUTRO') {
          setParam(padLp.frequency, 1700, time);
          rampParam(arpLp.frequency, 2400, 1200, BAR * block.bars, time);
          rampParam(acidSweepLp.frequency, 2800, 900, BAR * block.bars, time);
        }
      } else if (sec === 'CLIMAX' && localBar === 8) {
        crash.triggerAttackRelease(1.6, time, 0.75);
      }

      // Trigger upward noise riser over the last 2 bars of BUILD or BREAKDOWN
      if ((sec === 'BUILD' || sec === 'BREAKDOWN') && localBar === block.bars - 2) {
        rampParam(riserFilter.frequency, 320, 4200, BAR * 2, time, true);
        riser.triggerAttackRelease(BAR * 1.92, time, 0.55);
      }
    }

    // 2. Kick + Sidechain Ducking (tight 2-beat or 1-beat cut/stutter before climax)
    let kickActive = sec === 'INTRO' || sec === 'BUILD' || sec === 'CLIMAX' || sec === 'OUTRO';
    if (isLastBarOfBuild) {
      if (dropCutMode === 'fullBar' && step >= 8) kickActive = false;
      else if (dropCutMode === 'halfBar' && step >= 12) kickActive = false;
    }

    const kickHit = kickActive && (
      step % 4 === 0 ||
      (isLastBarOfBuild && dropCutMode === 'stutter' && step >= 12 && step % 2 === 0)
    );
    if (kickHit) {
      kick.triggerAttackRelease('C1', 0.18, time, 0.95);
      duck.gain.cancelScheduledValues(time);
      duck.gain.setValueAtTime(0.22, time);
      duck.gain.exponentialRampToValueAtTime(1.0, time + BEAT * 0.6);
    }

    // 3. Clap / Snare & Tight 2-Bar Build-up Rolls
    if (sec !== 'BREAKDOWN' && sec !== 'INTRO' && (step === 4 || step === 12) && !isLastBarOfBuild) {
      clapNoise.triggerAttackRelease(0.13, time, 0.76);
      snareBody.triggerAttackRelease('D3', 0.08, time, 0.62);
    }

    if (inBuildRoll) {
      const rollBar = localBar - (block.bars - 2); // 0..1
      const vel = 0.42 + 0.22 * rollBar + (step / 16) * 0.22;
      const hitRoll = rollBar === 0 ? step % 2 === 0 : true;
      if (hitRoll) {
        clapNoise.triggerAttackRelease(0.08, time, vel);
        snareBody.triggerAttackRelease('E3', 0.055, time, vel * 0.7);
      }
      if (rollBar === 1 && step >= 12) {
        clapNoise.triggerAttackRelease(0.06, time + SIXTEENTH * 0.5, Math.min(0.95, vel * 0.85));
      }
    }

    // 4. Hi-Hats (warmly band-shaped)
    if (sec !== 'BREAKDOWN') {
      const closedVel = (step % 2 === 0 ? 0.5 : 0.28) * humanize(pos, 0.12);
      hatClosed.triggerAttackRelease(0.028, time, closedVel);
      if (step % 4 === 2 && (localBar >= 2 || sec !== 'INTRO')) {
        hatOpen.triggerAttackRelease(0.14, time, sec === 'CLIMAX' ? 0.7 : 0.52);
      }
    }

    // 5. Rolling Trance Bass + Sub
    if (sec !== 'BREAKDOWN' && !isLastBarOfBuild) {
      const bVal = bassPattern[step];
      if (bVal > 0) {
        const midi = bVal === 2 ? bassRoot + 12 : bassRoot;
        bass.triggerAttackRelease(midiToNote(midi), SIXTEENTH * 0.75, time, 0.85 * humanize(pos, 0.08));
        if (bVal === 1 && (sec !== 'INTRO' || localBar >= 4)) {
          sub.triggerAttackRelease(midiToNote(bassRoot), SIXTEENTH * 0.85, time, 0.9);
        }
      }
    }

    // 6. Supersaw Pad (held per chord, with optional trance gate in BUILD/CLIMAX)
    if (step === 0 && (!slowChords || localBar % 2 === 0)) {
      const padDur = (slowChords ? BAR * 2 : BAR) * 0.96;
      const padVel = sec === 'BREAKDOWN' ? 0.78 : sec === 'CLIMAX' ? 0.64 : 0.45;
      pad.triggerAttackRelease(chord.map(midiToNote), padDur, time, padVel);
    }
    if (useGatedPad && (sec === 'BUILD' || sec === 'CLIMAX')) {
      padGate.gain.setValueAtTime(GATE_PATTERN[step], time);
    } else if (step === 0) {
      padGate.gain.setValueAtTime(1, time);
    }

    // 7. Supersaw Stabs + Dub Throw on every 4th bar's last stab
    if ((sec === 'BUILD' || sec === 'CLIMAX' || sec === 'OUTRO') && stabPattern.includes(step)) {
      const isThrow = localBar % 4 === 3 && step === stabPattern[stabPattern.length - 1];
      throwSend.gain.setValueAtTime(isThrow ? 0.55 : 0, time);
      const stabVel = (sec === 'CLIMAX' ? 0.86 : 0.7) * humanize(pos, 0.1);
      const stabNotes = [chord[1], chord[2], chord[3], chord[1] + 12].map(midiToNote);
      stab.triggerAttackRelease(stabNotes, SIXTEENTH * 0.88, time, stabVel);
    }

    // 8. Classical / Cthulhu-Mutated Major Arpeggios (half-time 8ths in early INTRO, 16ths everywhere else)
    const arpHalfTime = sec === 'INTRO' && localBar < 4;
    const arpSlot = arpPat[step];
    if (arpSlot >= 0 && (!arpHalfTime || step % 2 === 0)) {
      const arpMidi = arpStack[arpSlot % arpStack.length];
      const arpVel = (sec === 'CLIMAX' ? 0.76 : sec === 'BREAKDOWN' ? 0.68 : 0.54) * humanize(pos, 0.1);
      arp.triggerAttackRelease(midiToNote(arpMidi), SIXTEENTH * (arpHalfTime ? 1.4 : 0.78), time, arpVel);
    }

    // 9. Dynamic 303 Acid Line (filter-envelope shaped with accents & octave jumps)
    const playAcid =
      (sec === 'INTRO' && localBar >= 4) ||
      sec === 'BUILD' ||
      sec === 'CLIMAX' ||
      (sec === 'BREAKDOWN' && localBar >= block.bars - 4) ||
      (sec === 'OUTRO' && localBar < 4);

    if (playAcid) {
      const acidPat = useB ? acidPatternB : acidPatternA;
      const code = acidPat[step];
      if (code > 0) {
        const isAccent = code === 2 || code === 3 || code === 5;
        let acidMidi = bassRoot + 12;
        if (code === 3) acidMidi += 12;
        else if (code === 4) acidMidi = arpStack[2] - 12; // 5th
        else if (code === 5) acidMidi = arpStack[1]; // upper 3rd/tension

        // Shape the filter envelope per step: accents open wider & squelch longer
        acid.filterEnvelope.octaves = isAccent ? 4.4 : 2.9;
        acid.filterEnvelope.decay = isAccent ? 0.2 : 0.11;
        acid.filterEnvelope.baseFrequency = isAccent ? 340 : 230;
        const acidVel = (isAccent ? 0.95 : 0.62) * humanize(pos, 0.1);
        acid.triggerAttackRelease(midiToNote(acidMidi), SIXTEENTH * (isAccent ? 0.9 : 0.65), time, acidVel);
      }
    }

    // 10. Anthemic Supersaw Lead (with motif evolution on second half of CLIMAX)
    const playLead =
      sec === 'CLIMAX' ||
      (sec === 'BREAKDOWN' && localBar >= 2) ||
      (sec === 'OUTRO' && localBar < 4);

    if (playLead) {
      const phraseBar = localBar % 4;
      const activeMotif = sec === 'CLIMAX' && localBar >= 8 ? evolvedLead : baseLead;
      for (const n of activeMotif) {
        if (n.bar === phraseBar && n.step === step) {
          const midi = degreeToMidi(root + 12, mode, n.deg);
          const velScale = sec === 'CLIMAX' ? 1.0 : sec === 'BREAKDOWN' ? 0.65 : 0.72;
          const vel = (n.vel ?? 0.9) * velScale;
          const dur = n.len * SIXTEENTH * 0.92;
          const notes = sec === 'CLIMAX' ? [midiToNote(midi), midiToNote(midi - 12)] : [midiToNote(midi)];
          lead.triggerAttackRelease(notes, dur, time, vel);
        }
      }
    }

    } catch {
      // Ignore transient WebAudio scheduling glitches on tab resume.
    }
  }, '16n'));

  loop.start(0);
}

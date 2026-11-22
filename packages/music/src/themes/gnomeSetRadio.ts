/**
 * Gnom Set Radio: 10 reactive synthesized tracks for the Broadcast Archipelago.
 *
 * All tracks share a single Transport loop (16th-note resolution) with:
 * - Diatonic mode-pure harmony via `MODES` + `chordTones` + `voiceLead`
 * - Clean low end (< 220 Hz kept mono and out of reverb/delay via `createFx`)
 * - Reactive mix hooks: `air()` sweeps master LP filter, `grinding()` lifts crisp hats/shakers,
 *   `boss()` / `hype()` brings in horn/lead intensity layers
 * - Zero mono-voice timing conflicts (all chords on PolySynth; each mono voice fires at most once per 16th)
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '../engine';
import {
  BREAKS,
  barOf,
  breakByName,
  chopBar,
  createKit,
  transitionFill,
  type Slice,
} from '../drums';
import {
  createBongoKit,
  createFeltPiano,
  createFrenchHorn,
  createHarp,
  createRhodes,
  createUprightBass,
  createVibraphone,
} from '../instruments';
import { createFx } from '../mix';
import {
  MODES,
  chordTones,
  degreeToMidi,
  humanize,
  midiToNote,
  mulberry32,
  voiceLead,
  type ModeName,
} from '../theory';

export type GsrTrackId =
  | 'pirate-radio-hub'
  | 'ivory-jungle-jazz'
  | 'bongo-rip-mix'
  | 'chrome-kiln-funk'
  | 'neon-birdbath-liquid'
  | 'mulch-alley-chiptune-funk'
  | 'sky-mall-future-funk'
  | 'hoa-bylaw-brass-step'
  | 'subsoil-relay-jungle'
  | 'zero-hz-zenith';

export interface GsrTrackMeta {
  id: GsrTrackId;
  areaNumber: number;
  secret?: boolean;
  title: string;
  areaName: string;
  gangName: string;
  style: string;
  bpm: number;
  key: string;
  mode: ModeName;
  progression: string;
  motifNote: string;
  beatNote: string;
  color: string;
}

export interface GsrMusicOptions {
  grinding?: () => boolean;
  air?: () => boolean;
  boss?: () => boolean;
  hype?: () => number;
  onBeat?: (step: number, bar: number) => void;
}

interface TrackSpec extends GsrTrackMeta {
  rootMidi: number; // bass root in octave 2 (e.g. 38 = D2)
  degrees: readonly number[]; // 4-bar chord root scale degrees
  chordSize: 4 | 5;
  breakName: string;
  chopAmount: number;
  swing: number;
  hasUprightBass: boolean;
  hasPiano: boolean;
  hasRhodes: boolean;
  hasVibes: boolean;
  hasHorn: boolean;
  hasHarp: boolean;
  hasBongoRip: boolean;
  bongoIntensity: number; // 0..1
  fourOnFloor?: boolean;
  leadPattern: readonly number[]; // 16-step scale-degree offsets (-1 = rest)
  bassStyle: 'walking' | 'slap' | 'acid' | 'sub' | 'disco';
}

const SPECS: Record<GsrTrackId, TrackSpec> = {
  'pirate-radio-hub': {
    id: 'pirate-radio-hub',
    areaNumber: 0,
    title: 'Turfton Signal Bounce',
    areaName: 'Broadcast Hub',
    gangName: 'Ley-Line Runners',
    style: 'Laid-back Pirate Radio Funk-Hop',
    bpm: 104,
    key: 'F',
    mode: 'mixolydian',
    progression: 'F7 - Eb9 - Bbmaj7 - C9sus4',
    motifNote: 'Warm Rhodes seventh chords answered by vibraphone hooks.',
    beatNote: 'Funky Drummer pocket with light bongo ghost taps.',
    color: '#00e5ff',
    rootMidi: 41, // F2
    degrees: [0, 6, 3, 4],
    chordSize: 4,
    breakName: 'Funky Drummer',
    chopAmount: 0.15,
    swing: 0.16,
    hasUprightBass: true,
    hasPiano: false,
    hasRhodes: true,
    hasVibes: true,
    hasHorn: false,
    hasHarp: false,
    hasBongoRip: true,
    bongoIntensity: 0.35,
    leadPattern: [0, -1, 2, 4, -1, 5, 4, -1, 2, -1, 1, 0, -1, 4, -1, 2],
    bassStyle: 'walking',
  },
  'ivory-jungle-jazz': {
    id: 'ivory-jungle-jazz',
    areaNumber: 1,
    title: 'Velvet Keys Break',
    areaName: 'Velvet Keys Plaza',
    gangName: 'The Ivory Syndicate',
    style: 'Funky Jungle-Jazz Fusion',
    bpm: 162,
    key: 'D',
    mode: 'dorian',
    progression: 'Dm9 - G13 - Cmaj9 - Am7',
    motifNote: 'Felt piano & Rhodes jazz comping with walking upright bass & horn calls.',
    beatNote: 'Chopped Amen & Funky Drummer jungle breaks with crisp 16th-note ghost snares.',
    color: '#ff4ecd',
    rootMidi: 38, // D2
    degrees: [0, 3, 6, 4],
    chordSize: 5,
    breakName: 'Amen',
    chopAmount: 0.42,
    swing: 0.08,
    hasUprightBass: true,
    hasPiano: true,
    hasRhodes: true,
    hasVibes: true,
    hasHorn: true,
    hasHarp: false,
    hasBongoRip: true,
    bongoIntensity: 0.28,
    leadPattern: [0, -1, 4, -1, 6, 5, -1, 4, 2, -1, 3, 4, -1, 2, 1, -1],
    bassStyle: 'walking',
  },
  'bongo-rip-mix': {
    id: 'bongo-rip-mix',
    areaNumber: 2,
    title: 'Rip-Skin Overpass',
    areaName: 'Bongo Basin Overpass',
    gangName: 'The Rip-Skin Collective',
    style: 'Full Percussion Bongo Rip Mix',
    bpm: 132,
    key: 'A',
    mode: 'mixolydian',
    progression: 'A7 - Gmaj7 - D9 - E7',
    motifNote: 'Punchy Mixolydian horn stabs & percussive Rhodes chops over slap-funk bass.',
    beatNote: 'Relentless polyrhythmic bongo rip (low/high/slap/tap/shaker) + Apache break.',
    color: '#ff9100',
    rootMidi: 45, // A2
    degrees: [0, 6, 3, 4],
    chordSize: 4,
    breakName: 'Apache',
    chopAmount: 0.3,
    swing: 0.14,
    hasUprightBass: false,
    hasPiano: false,
    hasRhodes: true,
    hasVibes: false,
    hasHorn: true,
    hasHarp: false,
    hasBongoRip: true,
    bongoIntensity: 1.0,
    leadPattern: [0, 0, -1, 4, -1, 3, 2, -1, 4, -1, 5, 4, -1, 2, 0, -1],
    bassStyle: 'slap',
  },
  'chrome-kiln-funk': {
    id: 'chrome-kiln-funk',
    areaNumber: 3,
    title: 'Kiln-Fired Acid',
    areaName: 'Chrome Kiln Foundry',
    gangName: 'The Glaze Grinders',
    style: 'Acid-Funk Breakbeat',
    bpm: 138,
    key: 'E',
    mode: 'phrygianDominant',
    progression: 'E - Fmaj7 - Dm7 - E',
    motifNote: 'Tense Phrygian Dominant horn calls & metallic vibraphone hits.',
    beatNote: 'Driving Think break with resonant acid-funk bassline.',
    color: '#ff5252',
    rootMidi: 40, // E2
    degrees: [0, 1, 6, 0],
    chordSize: 4,
    breakName: 'Think',
    chopAmount: 0.35,
    swing: 0.06,
    hasUprightBass: false,
    hasPiano: false,
    hasRhodes: true,
    hasVibes: true,
    hasHorn: true,
    hasHarp: false,
    hasBongoRip: false,
    bongoIntensity: 0,
    leadPattern: [0, 1, -1, 4, 3, -1, 1, 0, -1, 4, 5, -1, 3, 1, 0, -1],
    bassStyle: 'acid',
  },
  'neon-birdbath-liquid': {
    id: 'neon-birdbath-liquid',
    areaNumber: 4,
    title: 'Spray & Shimmer',
    areaName: 'Neon Birdbath Spire',
    gangName: 'The Splash-Back Skaters',
    style: 'Liquid Jazz-DnB',
    bpm: 170,
    key: 'G',
    mode: 'lydian',
    progression: 'Gmaj9 - A/G - F#m7 - Bm7',
    motifNote: 'Shimmering harp arpeggios & soaring Lydian (#4) vibraphone melody.',
    beatNote: 'Fast rolling Amen + airy shaker liquid break.',
    color: '#40c4ff',
    rootMidi: 43, // G2
    degrees: [0, 1, 6, 2],
    chordSize: 5,
    breakName: 'Amen',
    chopAmount: 0.38,
    swing: 0,
    hasUprightBass: true,
    hasPiano: false,
    hasRhodes: true,
    hasVibes: true,
    hasHorn: false,
    hasHarp: true,
    hasBongoRip: false,
    bongoIntensity: 0,
    leadPattern: [0, -1, 2, 4, -1, 6, 4, -1, 3, -1, 4, 2, -1, 1, 0, -1],
    bassStyle: 'sub',
  },
  'mulch-alley-chiptune-funk': {
    id: 'mulch-alley-chiptune-funk',
    areaNumber: 5,
    title: 'Quarter-Slot Groove',
    areaName: 'Mulch Alley Arcade',
    gangName: 'The Token Sharks',
    style: 'Chiptune Funk-Hop',
    bpm: 118,
    key: 'C',
    mode: 'aeolian',
    progression: 'Cm7 - Abmaj7 - Fm7 - G7',
    motifNote: 'Bouncy arcade vibraphone & Rhodes coin-flip hooks.',
    beatNote: 'Crisp Funky Drummer break with syncopated slap bass.',
    color: '#b388ff',
    rootMidi: 36, // C2
    degrees: [0, 5, 3, 4],
    chordSize: 4,
    breakName: 'Funky Drummer',
    chopAmount: 0.22,
    swing: 0.12,
    hasUprightBass: false,
    hasPiano: true,
    hasRhodes: true,
    hasVibes: true,
    hasHorn: false,
    hasHarp: false,
    hasBongoRip: false,
    bongoIntensity: 0,
    leadPattern: [0, 2, 4, -1, 5, 4, 2, -1, 3, 4, 2, 0, -1, 4, 2, -1],
    bassStyle: 'slap',
  },
  'sky-mall-future-funk': {
    id: 'sky-mall-future-funk',
    areaNumber: 6,
    title: 'Clearance Aisle Strut',
    areaName: 'Tupperware Sky-Mall',
    gangName: 'The Clearance Crew',
    style: 'Future-Funk Disco-House',
    bpm: 126,
    key: 'Bb',
    mode: 'ionian',
    progression: 'Bbmaj7 - Gm7 - Cm7 - F9',
    motifNote: 'Lush Rhodes & felt piano disco stabs with upbeat horn fanfares.',
    beatNote: 'Four-on-the-floor kick with crisp open-hat lifts & bongo accents.',
    color: '#ff80ab',
    rootMidi: 46, // Bb2
    degrees: [0, 5, 1, 4],
    chordSize: 4,
    breakName: 'Think',
    chopAmount: 0.12,
    swing: 0.08,
    hasUprightBass: false,
    hasPiano: true,
    hasRhodes: true,
    hasVibes: false,
    hasHorn: true,
    hasHarp: false,
    hasBongoRip: true,
    bongoIntensity: 0.4,
    fourOnFloor: true,
    leadPattern: [0, -1, 4, 2, -1, 4, 5, 4, -1, 2, 1, 0, -1, 2, 4, -1],
    bassStyle: 'disco',
  },
  'hoa-bylaw-brass-step': {
    id: 'hoa-bylaw-brass-step',
    areaNumber: 7,
    title: 'Code 404B March',
    areaName: 'HOA Citadel Terrace',
    gangName: 'The Bylaw Brass',
    style: 'Big-Beat Brass Dub-Funk',
    bpm: 112,
    key: 'F#',
    mode: 'harmonic',
    progression: 'F#m - Dmaj7 - Bm7 - C#7',
    motifNote: 'Stately French horn fanfares & dub-echoed felt piano chops.',
    beatNote: 'Heavy stomping Apache break with upright bass ostinato.',
    color: '#ffd740',
    rootMidi: 42, // F#2
    degrees: [0, 5, 3, 4],
    chordSize: 4,
    breakName: 'Apache',
    chopAmount: 0.18,
    swing: 0.1,
    hasUprightBass: true,
    hasPiano: true,
    hasRhodes: false,
    hasVibes: false,
    hasHorn: true,
    hasHarp: false,
    hasBongoRip: false,
    bongoIntensity: 0,
    leadPattern: [0, -1, -1, 2, 4, -1, 5, 4, -1, 2, 0, -1, 4, -1, 6, -1],
    bassStyle: 'walking',
  },
  'subsoil-relay-jungle': {
    id: 'subsoil-relay-jungle',
    areaNumber: 8,
    title: '108.0 Sky-Leak',
    areaName: 'Subsoil Relay Tower',
    gangName: 'The Deep-Cut Syndicate',
    style: 'Dark Dub-Jungle Jazz-Horn',
    bpm: 166,
    key: 'C',
    mode: 'phrygian',
    progression: 'Cm7 - Dbmaj7 - Bbm7 - Cm7',
    motifNote: 'Nocturnal dub Rhodes echoes & moody Phrygian horn swells.',
    beatNote: 'Rolling Amen + Think dual-chop jungle break with deep sub-bass.',
    color: '#69f0ae',
    rootMidi: 36, // C2
    degrees: [0, 1, 6, 0],
    chordSize: 4,
    breakName: 'Amen',
    chopAmount: 0.5,
    swing: 0,
    hasUprightBass: false,
    hasPiano: false,
    hasRhodes: true,
    hasVibes: true,
    hasHorn: true,
    hasHarp: false,
    hasBongoRip: true,
    bongoIntensity: 0.45,
    leadPattern: [0, -1, 1, -1, 4, -1, 3, 1, 0, -1, 4, 5, -1, 3, 1, -1],
    bassStyle: 'sub',
  },
  'zero-hz-zenith': {
    id: 'zero-hz-zenith',
    areaNumber: 9,
    secret: true,
    title: 'Zero-Hz Encore',
    areaName: 'The Silent Frequency',
    gangName: 'The Unfired Choir',
    style: 'Grand Symphonic Jungle-Jazz-Bongo Finale',
    bpm: 158,
    key: 'E',
    mode: 'dorian',
    progression: 'Em9 - A13 - Dmaj9 - Bm7',
    motifNote: 'Unites felt piano, walking upright bass, harp cascades, and French horn fanfare.',
    beatNote: 'Full bongo rip percussion interlocked with chopped Amen breaks.',
    color: '#ffffff',
    rootMidi: 40, // E2
    degrees: [0, 3, 6, 4],
    chordSize: 5,
    breakName: 'Amen',
    chopAmount: 0.4,
    swing: 0.08,
    hasUprightBass: true,
    hasPiano: true,
    hasRhodes: true,
    hasVibes: true,
    hasHorn: true,
    hasHarp: true,
    hasBongoRip: true,
    bongoIntensity: 0.9,
    leadPattern: [0, -1, 2, 4, -1, 6, 4, 2, 4, -1, 5, 4, 2, -1, 1, 0],
    bassStyle: 'walking',
  },
};

export const GSR_TRACKS: readonly GsrTrackMeta[] = Object.values(SPECS).map(
  ({
    id,
    areaNumber,
    secret,
    title,
    areaName,
    gangName,
    style,
    bpm,
    key,
    mode,
    progression,
    motifNote,
    beatNote,
    color,
  }) => ({
    id,
    areaNumber,
    secret,
    title,
    areaName,
    gangName,
    style,
    bpm,
    key,
    mode,
    progression,
    motifNote,
    beatNote,
    color,
  }),
);

// 16-step bongo rip pattern: L=low, H=high, S=slap, T=tap
const BONGO_A: readonly ('L' | 'H' | 'S' | 'T' | '.')[] = [
  'L', 'T', 'H', 'S', 'L', '.', 'H', 'T', 'L', 'T', 'S', 'H', 'L', 'S', 'H', 'T',
];
const BONGO_FILL: readonly ('L' | 'H' | 'S' | 'T' | '.')[] = [
  'L', 'H', 'S', 'H', 'S', 'T', 'H', 'S', 'L', 'S', 'H', 'S', 'L', 'H', 'S', 'S',
];

function buildBassLine(
  spec: TrackSpec,
  barChordDeg: number,
  nextChordDeg: number,
): (number | null)[] {
  const mode = MODES[spec.mode];
  const line: (number | null)[] = new Array(16).fill(null);
  const r = spec.rootMidi;
  const deg = (d: number) => degreeToMidi(r, mode, d);

  if (spec.bassStyle === 'walking') {
    line[0] = deg(barChordDeg);
    line[4] = deg(barChordDeg + 2);
    line[8] = deg(barChordDeg + 4);
    line[12] = deg(nextChordDeg + (barChordDeg < nextChordDeg ? -1 : 1));
    line[14] = deg(barChordDeg + 4);
  } else if (spec.bassStyle === 'slap') {
    line[0] = deg(barChordDeg);
    line[2] = deg(barChordDeg) + 12;
    line[6] = deg(barChordDeg + 4);
    line[8] = deg(barChordDeg);
    line[10] = deg(barChordDeg + 6);
    line[12] = deg(barChordDeg + 4);
    line[14] = deg(barChordDeg + 2);
  } else if (spec.bassStyle === 'acid') {
    line[0] = deg(barChordDeg);
    line[3] = deg(barChordDeg);
    line[4] = deg(barChordDeg) + 12;
    line[6] = deg(barChordDeg + 4);
    line[8] = deg(barChordDeg);
    line[11] = deg(barChordDeg + 1);
    line[12] = deg(barChordDeg + 4);
    line[14] = deg(barChordDeg) + 12;
  } else if (spec.bassStyle === 'disco') {
    for (let s = 0; s < 16; s += 2) {
      line[s] = s % 4 === 0 ? deg(barChordDeg) : deg(barChordDeg) + 12;
    }
  } else {
    // sub
    line[0] = deg(barChordDeg);
    line[6] = deg(barChordDeg + 4);
    line[10] = deg(barChordDeg);
    line[14] = deg(barChordDeg + 2);
  }
  return line;
}

export function buildGnomeSetRadioTrack(
  T: Tone,
  keep: Keep,
  out: ToneNS.Volume,
  trackId: GsrTrackId,
  seed = 1,
  opts: GsrMusicOptions = {},
): void {
  const spec = SPECS[trackId] ?? SPECS['ivory-jungle-jazz'];
  const rnd = mulberry32(seed + spec.areaNumber * 97);
  const mode = MODES[spec.mode];

  T.getTransport().bpm.value = spec.bpm;

  // Master filter for airborne muffle / boost sweeps
  const masterLp = keep(new T.Filter({ frequency: 18000, type: 'lowpass', rolloff: -12 })).connect(out);
  const fx = createFx(T, keep, masterLp, {
    reverbDecay: 2.8,
    echoTime: '8n.',
    echoFeedback: 0.36,
  });

  // High-passed bus for harmonic layers (>210 Hz so bass stays clean)
  const harmHp = keep(new T.Filter({ frequency: 210, type: 'highpass' })).connect(masterLp);

  // Percussion
  const kit = createKit(T, keep, masterLp, fx, {
    grit: 0.16,
    swing: spec.swing,
    hatVolume: -13,
  });
  const bongos = spec.hasBongoRip
    ? createBongoKit(T, keep, masterLp, fx, { volumeDb: -3, revSend: 0.2 })
    : null;

  // Bass voices (mono-clean, directly into masterLp)
  const uprightBass = spec.hasUprightBass
    ? createUprightBass(T, keep, masterLp, { volumeDb: -9 })
    : null;
  const subBass = !spec.hasUprightBass
    ? keep(
        new T.MonoSynth({
          oscillator: { type: spec.bassStyle === 'acid' ? 'sawtooth' : 'triangle' },
          filter: { frequency: spec.bassStyle === 'acid' ? 950 : 420, type: 'lowpass', Q: spec.bassStyle === 'acid' ? 4.5 : 1.2 },
          envelope: { attack: 0.008, decay: 0.25, sustain: 0.45, release: 0.14 },
          filterEnvelope: {
            attack: 0.006,
            decay: 0.22,
            sustain: 0.2,
            release: 0.15,
            baseFrequency: 120,
            octaves: spec.bassStyle === 'acid' ? 2.6 : 1.4,
          },
        }),
      ).connect(masterLp)
    : null;
  if (subBass) subBass.volume.value = -10;

  // Harmonic & melodic voices
  const piano = spec.hasPiano ? createFeltPiano(T, keep, harmHp, fx, { volumeDb: -11, revSend: 0.35 }) : null;
  const rhodes = spec.hasRhodes ? createRhodes(T, keep, harmHp, fx, { volumeDb: -12, revSend: 0.38 }) : null;
  const vibes = spec.hasVibes ? createVibraphone(T, keep, harmHp, fx, { volumeDb: -14, revSend: 0.45 }) : null;
  const horn = spec.hasHorn ? createFrenchHorn(T, keep, harmHp, fx, { volumeDb: -15, revSend: 0.4, attack: 0.04 }) : null;
  const harp = spec.hasHarp ? createHarp(T, keep, harmHp, fx, { volumeDb: -13, revSend: 0.5 }) : null;

  // Pre-compose 8-bar voice-led chord progression
  const barChords: number[][] = [];
  let prevVoicing: number[] | null = null;
  for (let b = 0; b < 8; b++) {
    const deg = spec.degrees[b % spec.degrees.length];
    const tones = chordTones(mode, deg, spec.chordSize).map((t) => t + spec.rootMidi + 12);
    const voiced = voiceLead(tones, 62, prevVoicing);
    barChords.push(voiced);
    prevVoicing = voiced;
  }

  // Pre-compose 8-bar drum break bars
  const srcBreak = breakByName(spec.breakName);
  const altBreak = BREAKS[(BREAKS.indexOf(srcBreak) + 1) % BREAKS.length];
  const drumBars: Slice[][] = [];
  for (let b = 0; b < 8; b++) {
    const useAlt = b >= 4 && b % 2 === 1;
    const base = chopBar(rnd, (useAlt ? altBreak : srcBreak).steps, (b % 2) as 0 | 1, spec.chopAmount);
    const bar = b === 3 || b === 7 ? transitionFill(base, b === 7 ? 'syncopated' : 'roll') : base;
    if (spec.fourOnFloor) {
      for (const s of [0, 4, 8, 12]) bar[s] = { ...bar[s], k: 1 };
    }
    drumBars.push(bar);
  }

  let stepIdx = 0;
  let lastFilterHz = 18000;
  const loop = keep(
    new T.Loop((time) => {
      const bar = Math.floor(stepIdx / 16) % 8;
      const step = stepIdx % 16;
      const grinding = opts.grinding?.() ?? false;
      const air = opts.air?.() ?? false;
      const boss = opts.boss?.() ?? false;
      const hype = Math.max(0, Math.min(1, opts.hype?.() ?? 0.35));

      // Reactive filter sweep when airborne
      const targetHz = air ? 1600 : grinding ? 18500 : 14000;
      if (Math.abs(targetHz - lastFilterHz) > 200) {
        masterLp.frequency.rampTo(targetHz, 0.14, time);
        lastFilterHz = targetHz;
      }

      const h = humanize(stepIdx, 0.08);
      const chord = barChords[bar];
      const barDeg = spec.degrees[bar % spec.degrees.length];
      const nextDeg = spec.degrees[(bar + 1) % spec.degrees.length];

      // 1. Drum Kit
      const slice = drumBars[bar][step];
      const modSlice: Slice = grinding && step % 2 === 1 && !slice.o ? { ...slice, h: 1 } : slice;
      kit.hit(modSlice, time, step, 0.9 * h);

      // 2. Bongo Rip Percussion
      if (bongos) {
        const bongoPat = bar === 3 || bar === 7 ? BONGO_FILL : BONGO_A;
        const hit = bongoPat[step];
        const intensity = Math.min(1, spec.bongoIntensity + (grinding || boss ? 0.35 : 0));
        if (hit !== '.' && (intensity >= 0.7 || step % 2 === 0)) {
          const vel = (0.55 + 0.35 * intensity) * h;
          if (hit === 'L') bongos.low(time, vel);
          else if (hit === 'H') bongos.high(time, vel);
          else if (hit === 'S') bongos.slap(time, vel);
          else bongos.tap(time, vel * 0.85);
        }
        if (step % 4 === 2 && intensity > 0.3) {
          bongos.shaker(time, 0.4 * intensity * h);
        }
      }

      // 3. Bassline
      const bassLine = buildBassLine(spec, barDeg, nextDeg);
      const bassNote = bassLine[step];
      if (bassNote !== null) {
        const dur = spec.bassStyle === 'walking' ? 0.24 : 0.14;
        if (uprightBass) uprightBass.play(bassNote, dur, time, 0.85 * h);
        else if (subBass) subBass.triggerAttackRelease(midiToNote(bassNote), dur, time, 0.82 * h);
      }

      // 4. Syncopated Piano / Rhodes Comping
      const isCompStep = step === 0 || step === 6 || step === 10 || (step === 14 && bar % 2 === 1);
      if (isCompStep) {
        const dur = step === 0 ? 0.36 : 0.16;
        if (piano) piano.play(chord, dur, time, 0.62 * h);
        if (rhodes && (step === 0 || step === 10)) rhodes.play(chord, dur * 1.1, time, 0.56 * h);
      }

      // 5. Harp Arpeggios (Liquid / Finale)
      if (harp && step === 0 && (bar % 2 === 0 || hype > 0.5)) {
        harp.arp(chord.slice(0, 4), time, 0.05, 0.58 * h);
      }

      // 6. Vibraphone & French Horn Motifs
      const leadOffset = spec.leadPattern[step];
      if (leadOffset >= 0) {
        const melodyMidi = degreeToMidi(spec.rootMidi + 24, mode, barDeg + leadOffset);
        if (vibes && (bar % 2 === 0 || hype > 0.45)) {
          vibes.play(melodyMidi, 0.2, time, 0.58 * h);
        }
        if (horn && (boss || hype > 0.55 || bar % 4 === 2) && step % 4 === 0) {
          horn.play(melodyMidi - 12, 0.26, time, 0.66 * h);
        }
      }

      opts.onBeat?.(step, bar);
      stepIdx++;
    }, '16n'),
  );

  loop.start(0);
}

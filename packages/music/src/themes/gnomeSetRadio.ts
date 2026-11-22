/**
 * Gnom Set Radio: 10 reactive synthesized tracks for the Broadcast Archipelago.
 *
 * All tracks share a single Transport loop (16th-note resolution) with:
 * - Diatonic mode-pure harmony via `MODES` + `chordTones` + `voiceLead`
 * - Clean low end (< 220 Hz kept mono and out of reverb/delay via `createFx`)
 * - Extended multi-section arrangements: Intro (filter mix-in), multiple Beat Modes
 *   (grooveA / grooveB / grooveC), Dub Breaks, Low-Energy Intermissions, and DJ-mixable Outros
 * - Distinct per-track structures and sonic flavors (pure E-minor 303 Acid with polyrhythms
 *   in Area 3, deep dub echo throws, French-house filter sweeps, jungle-jazz, bongo-rip, liquid)
 * - Reactive mix hooks: `air()` sweeps master LP filter, `grinding()` fires crisp 16th-note
 *   grind hats & sizzle on every track, `boss()` / `hype()` brings in Boss Brass fanfares & lead layers
 * - Zero mono-voice timing conflicts (all chords & boss brass on PolySynth; each mono voice fires at most once per 16th)
 */
import type * as ToneNS from 'tone';
import type { Keep, Tone } from '../engine';
import {
  BREAKS,
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
import { createFx, createPanner } from '../mix';
import {
  createDubThrowHandler,
  createEffectRack,
  createFilterSweepHandler,
  createPolyrhythmFilterHandler,
} from '../effectHandlers';
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

export type GsrSectionKind =
  | 'intro'
  | 'grooveA'
  | 'grooveB'
  | 'grooveC'
  | 'dubBreak'
  | 'intermission'
  | 'outro';

export type GsrTrackFlavor =
  | 'acid'
  | 'dub'
  | 'house'
  | 'jazz'
  | 'bongo'
  | 'liquid'
  | 'finale';

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
  skillPeak?: () => boolean;
  hype?: () => number;
  onBeat?: (step: number, bar: number, section?: string) => void;
}

interface SectionBlock {
  kind: GsrSectionKind;
  bars: number;
}

interface TrackSpec extends GsrTrackMeta {
  flavor: GsrTrackFlavor;
  rootMidi: number; // bass root in octave 2 (e.g. 38 = D2)
  degrees: readonly number[]; // A-section chord root scale degrees
  bDegrees?: readonly number[]; // optional B-section chord degrees
  chordSize: 4 | 5;
  breakName: string;
  altBreakName?: string;
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
  altLeadPattern?: readonly number[];
  bassStyle: 'walking' | 'slap' | 'acid' | 'sub' | 'disco';
  introBars: number;
  loopSections: readonly SectionBlock[];
}

const SPECS: Record<GsrTrackId, TrackSpec> = {
  'pirate-radio-hub': {
    id: 'pirate-radio-hub',
    areaNumber: 0,
    flavor: 'dub',
    title: 'Turfton Signal Bounce',
    areaName: 'Broadcast Hub',
    gangName: 'Ley-Line Runners',
    style: 'Dub Pirate Radio Funk-Hop',
    bpm: 104,
    key: 'F',
    mode: 'mixolydian',
    progression: 'F7 - Eb9 (Dub Vamp) / Bbmaj7 - C9sus4',
    motifNote: 'Warm Rhodes dub skanks & vibraphone hooks with tape echo throws.',
    beatNote: 'Funky Drummer pocket with bongo ghost taps, dub drops & chill intermissions.',
    color: '#00e5ff',
    rootMidi: 41, // F2
    degrees: [0, 6, 0, 6],
    bDegrees: [0, 6, 3, 4],
    chordSize: 4,
    breakName: 'Funky Drummer',
    altBreakName: 'Apache',
    chopAmount: 0.16,
    swing: 0.16,
    hasUprightBass: true,
    hasPiano: false,
    hasRhodes: true,
    hasVibes: true,
    hasHorn: false,
    hasHarp: false,
    hasBongoRip: true,
    bongoIntensity: 0.38,
    leadPattern: [0, -1, 2, 4, -1, 5, 4, -1, 2, -1, 1, 0, -1, 4, -1, 2],
    altLeadPattern: [4, -1, 2, 0, -1, 2, 4, 5, -1, 4, 2, -1, 0, -1, 4, -1],
    bassStyle: 'walking',
    introBars: 4,
    loopSections: [
      { kind: 'grooveA', bars: 8 },
      { kind: 'dubBreak', bars: 4 },
      { kind: 'grooveB', bars: 8 },
      { kind: 'intermission', bars: 4 },
      { kind: 'grooveC', bars: 16 },
      { kind: 'outro', bars: 4 },
    ],
  },
  'ivory-jungle-jazz': {
    id: 'ivory-jungle-jazz',
    areaNumber: 1,
    flavor: 'jazz',
    title: 'Velvet Keys Break',
    areaName: 'Velvet Keys Plaza',
    gangName: 'The Ivory Syndicate',
    style: 'Funky Jungle-Jazz Fusion',
    bpm: 162,
    key: 'D',
    mode: 'dorian',
    progression: 'Dm9 - G13 - Cmaj9 - Am7',
    motifNote: 'Felt piano & Rhodes jazz comping with walking upright bass & horn calls.',
    beatNote: 'Chopped Amen & Funky Drummer jungle breaks, halftime intermission & DJ outro.',
    color: '#ff4ecd',
    rootMidi: 38, // D2
    degrees: [0, 3, 6, 4],
    bDegrees: [0, 4, 1, 3],
    chordSize: 5,
    breakName: 'Amen',
    altBreakName: 'Funky Drummer',
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
    altLeadPattern: [4, -1, 6, -1, 7, 5, 4, -1, 3, 2, -1, 4, 2, -1, 0, -1],
    bassStyle: 'walking',
    introBars: 4,
    loopSections: [
      { kind: 'grooveA', bars: 8 },
      { kind: 'grooveB', bars: 8 },
      { kind: 'intermission', bars: 4 },
      { kind: 'grooveC', bars: 16 },
      { kind: 'dubBreak', bars: 4 },
      { kind: 'outro', bars: 4 },
    ],
  },
  'bongo-rip-mix': {
    id: 'bongo-rip-mix',
    areaNumber: 2,
    flavor: 'bongo',
    title: 'Rip-Skin Overpass',
    areaName: 'Bongo Basin Overpass',
    gangName: 'The Rip-Skin Collective',
    style: 'Full Percussion Bongo Rip Mix',
    bpm: 132,
    key: 'A',
    mode: 'mixolydian',
    progression: 'A7 - Gmaj7 - D9 - E7',
    motifNote: 'Punchy Mixolydian horn stabs & percussive Rhodes chops over slap-funk bass.',
    beatNote: 'Polyrhythmic bongo rip + Apache break, house-lift B-section & percussion breakdown.',
    color: '#ff9100',
    rootMidi: 45, // A2
    degrees: [0, 6, 3, 4],
    bDegrees: [0, 3, 6, 4],
    chordSize: 4,
    breakName: 'Apache',
    altBreakName: 'Think',
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
    altLeadPattern: [4, -1, 5, 4, -1, 2, 0, -1, 2, 4, -1, 6, 5, -1, 4, -1],
    bassStyle: 'slap',
    introBars: 4,
    loopSections: [
      { kind: 'grooveA', bars: 8 },
      { kind: 'intermission', bars: 4 },
      { kind: 'grooveB', bars: 8 },
      { kind: 'dubBreak', bars: 4 },
      { kind: 'grooveC', bars: 16 },
      { kind: 'outro', bars: 4 },
    ],
  },
  'chrome-kiln-funk': {
    id: 'chrome-kiln-funk',
    areaNumber: 3,
    flavor: 'acid',
    title: 'Kiln-Fired Acid',
    areaName: 'Chrome Kiln Foundry',
    gangName: 'The Glaze Grinders',
    style: 'Minor Polyrhythmic 303 Acid',
    bpm: 138,
    key: 'E',
    mode: 'aeolian',
    progression: 'Em (1-Chord Acid Pedal & Filter Squelch)',
    motifNote: 'Resonant 303 sawtooth acid with hypnotic 12-step polymeter, warm drive & dub echo throws.',
    beatNote: 'Driving Think & Amen breaks with heavy filter sweeps and stripped acid intermissions.',
    color: '#ff5252',
    rootMidi: 40, // E2
    degrees: [0, 0, 0, 0],
    chordSize: 4,
    breakName: 'Think',
    altBreakName: 'Amen',
    chopAmount: 0.38,
    swing: 0.04,
    hasUprightBass: false,
    hasPiano: false,
    hasRhodes: false,
    hasVibes: false,
    hasHorn: true,
    hasHarp: false,
    hasBongoRip: false,
    bongoIntensity: 0,
    leadPattern: [0, -1, -1, 4, -1, -1, 2, -1, 0, -1, 4, -1, -1, 6, -1, -1],
    bassStyle: 'acid',
    introBars: 4,
    loopSections: [
      { kind: 'grooveA', bars: 8 },
      { kind: 'dubBreak', bars: 4 },
      { kind: 'grooveB', bars: 8 },
      { kind: 'intermission', bars: 4 },
      { kind: 'grooveC', bars: 16 },
      { kind: 'outro', bars: 4 },
    ],
  },
  'neon-birdbath-liquid': {
    id: 'neon-birdbath-liquid',
    areaNumber: 4,
    flavor: 'liquid',
    title: 'Spray & Shimmer',
    areaName: 'Neon Birdbath Spire',
    gangName: 'The Splash-Back Skaters',
    style: 'Liquid Jazz-DnB',
    bpm: 170,
    key: 'G',
    mode: 'lydian',
    progression: 'Gmaj9 - A/G - F#m7 - Bm7',
    motifNote: 'Shimmering harp arpeggios & soaring Lydian (#4) vibraphone melody.',
    beatNote: 'Fast rolling Amen + Think liquid break with floating ambient intermissions.',
    color: '#40c4ff',
    rootMidi: 43, // G2
    degrees: [0, 1, 6, 2],
    bDegrees: [0, 4, 3, 2],
    chordSize: 5,
    breakName: 'Amen',
    altBreakName: 'Think',
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
    altLeadPattern: [4, -1, 6, 7, -1, 4, 3, -1, 2, -1, 4, 3, -1, 2, 0, -1],
    bassStyle: 'sub',
    introBars: 4,
    loopSections: [
      { kind: 'grooveA', bars: 8 },
      { kind: 'intermission', bars: 8 },
      { kind: 'grooveB', bars: 8 },
      { kind: 'grooveC', bars: 16 },
      { kind: 'outro', bars: 4 },
    ],
  },
  'mulch-alley-chiptune-funk': {
    id: 'mulch-alley-chiptune-funk',
    areaNumber: 5,
    flavor: 'house',
    title: 'Quarter-Slot Groove',
    areaName: 'Mulch Alley Arcade',
    gangName: 'The Token Sharks',
    style: 'Filter-House Chiptune Funk',
    bpm: 120,
    key: 'C',
    mode: 'aeolian',
    progression: 'Cm7 - Abmaj7 - Fm7 - G7',
    motifNote: 'Bouncy arcade vibraphone & Rhodes hooks pumped through a French-house filter.',
    beatNote: 'Four-on-the-floor house groove alternating with Funky Drummer breaks.',
    color: '#b388ff',
    rootMidi: 36, // C2
    degrees: [0, 5, 3, 4],
    bDegrees: [0, 2, 5, 4],
    chordSize: 4,
    breakName: 'Funky Drummer',
    altBreakName: 'Think',
    chopAmount: 0.22,
    swing: 0.1,
    hasUprightBass: false,
    hasPiano: true,
    hasRhodes: true,
    hasVibes: true,
    hasHorn: false,
    hasHarp: false,
    hasBongoRip: false,
    bongoIntensity: 0,
    fourOnFloor: true,
    leadPattern: [0, 2, 4, -1, 5, 4, 2, -1, 3, 4, 2, 0, -1, 4, 2, -1],
    altLeadPattern: [4, 5, 7, -1, 5, 4, 2, -1, 4, 2, 0, -1, 2, 4, 2, -1],
    bassStyle: 'slap',
    introBars: 4,
    loopSections: [
      { kind: 'grooveA', bars: 8 },
      { kind: 'grooveB', bars: 8 },
      { kind: 'intermission', bars: 4 },
      { kind: 'grooveC', bars: 16 },
      { kind: 'dubBreak', bars: 4 },
      { kind: 'outro', bars: 4 },
    ],
  },
  'sky-mall-future-funk': {
    id: 'sky-mall-future-funk',
    areaNumber: 6,
    flavor: 'house',
    title: 'Clearance Aisle Strut',
    areaName: 'Tupperware Sky-Mall',
    gangName: 'The Clearance Crew',
    style: 'Future-Funk Filter-House',
    bpm: 126,
    key: 'Bb',
    mode: 'ionian',
    progression: 'Bbmaj7 - Gm7 - Cm7 - F9',
    motifNote: 'Lush Rhodes & felt piano disco stabs through a sweeping house low-pass filter.',
    beatNote: 'Four-on-the-floor kick with crisp open-hat lifts, bongo accents & filter breakdowns.',
    color: '#ff80ab',
    rootMidi: 46, // Bb2
    degrees: [0, 5, 1, 4],
    bDegrees: [3, 4, 0, 5],
    chordSize: 4,
    breakName: 'Think',
    altBreakName: 'Funky Drummer',
    chopAmount: 0.14,
    swing: 0.08,
    hasUprightBass: false,
    hasPiano: true,
    hasRhodes: true,
    hasVibes: false,
    hasHorn: true,
    hasHarp: false,
    hasBongoRip: true,
    bongoIntensity: 0.42,
    fourOnFloor: true,
    leadPattern: [0, -1, 4, 2, -1, 4, 5, 4, -1, 2, 1, 0, -1, 2, 4, -1],
    altLeadPattern: [4, -1, 5, 4, -1, 2, 4, 5, -1, 4, 2, 0, -1, 4, 5, -1],
    bassStyle: 'disco',
    introBars: 4,
    loopSections: [
      { kind: 'grooveA', bars: 8 },
      { kind: 'dubBreak', bars: 4 },
      { kind: 'grooveB', bars: 8 },
      { kind: 'intermission', bars: 4 },
      { kind: 'grooveC', bars: 16 },
      { kind: 'outro', bars: 4 },
    ],
  },
  'hoa-bylaw-brass-step': {
    id: 'hoa-bylaw-brass-step',
    areaNumber: 7,
    flavor: 'dub',
    title: 'Code 404B March',
    areaName: 'HOA Citadel Terrace',
    gangName: 'The Bylaw Brass',
    style: 'Heavy Dub-Brass Big-Beat',
    bpm: 112,
    key: 'F#',
    mode: 'harmonic',
    progression: 'F#m - Dmaj7 (Dub Vamp) / Bm7 - C#7',
    motifNote: 'Stately French horn fanfares & dub-echoed felt piano skanks with echo throws.',
    beatNote: 'Heavy stomping Apache break with upright bass ostinato & spacious dub drops.',
    color: '#ffd740',
    rootMidi: 42, // F#2
    degrees: [0, 5, 0, 5],
    bDegrees: [0, 5, 3, 4],
    chordSize: 4,
    breakName: 'Apache',
    altBreakName: 'Think',
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
    altLeadPattern: [4, -1, 5, -1, 6, 4, 2, -1, 0, -1, 4, 5, -1, 6, 4, -1],
    bassStyle: 'walking',
    introBars: 4,
    loopSections: [
      { kind: 'grooveA', bars: 8 },
      { kind: 'dubBreak', bars: 4 },
      { kind: 'grooveB', bars: 8 },
      { kind: 'intermission', bars: 8 },
      { kind: 'grooveC', bars: 16 },
      { kind: 'outro', bars: 4 },
    ],
  },
  'subsoil-relay-jungle': {
    id: 'subsoil-relay-jungle',
    areaNumber: 8,
    flavor: 'dub',
    title: '108.0 Sky-Leak',
    areaName: 'Subsoil Relay Tower',
    gangName: 'The Deep-Cut Syndicate',
    style: 'Dark Dub-Jungle & Acid Sub',
    bpm: 166,
    key: 'C',
    mode: 'phrygian',
    progression: 'Cm7 - Dbmaj7 (Phrygian Dub Vamp)',
    motifNote: 'Nocturnal dub Rhodes echoes, Phrygian horn swells & late-set polyrhythmic acid.',
    beatNote: 'Rolling Amen + Think dual-chop jungle break with deep sub-bass & dub breakdowns.',
    color: '#69f0ae',
    rootMidi: 36, // C2
    degrees: [0, 1, 0, 1],
    bDegrees: [0, 1, 6, 0],
    chordSize: 4,
    breakName: 'Amen',
    altBreakName: 'Think',
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
    altLeadPattern: [4, -1, 3, 1, -1, 0, 1, 4, -1, 5, 4, -1, 1, 0, -1, -1],
    bassStyle: 'sub',
    introBars: 4,
    loopSections: [
      { kind: 'grooveA', bars: 8 },
      { kind: 'dubBreak', bars: 4 },
      { kind: 'grooveB', bars: 8 },
      { kind: 'intermission', bars: 4 },
      { kind: 'grooveC', bars: 16 },
      { kind: 'outro', bars: 4 },
    ],
  },
  'zero-hz-zenith': {
    id: 'zero-hz-zenith',
    areaNumber: 9,
    secret: true,
    flavor: 'finale',
    title: 'Zero-Hz Encore',
    areaName: 'The Silent Frequency',
    gangName: 'The Unfired Choir',
    style: 'Grand Symphonic Jungle-Jazz-Bongo Finale',
    bpm: 158,
    key: 'E',
    mode: 'dorian',
    progression: 'Em9 - A13 - Dmaj9 - Bm7',
    motifNote: 'Unites felt piano, walking upright bass, harp cascades, and French horn fanfare.',
    beatNote: 'Full bongo rip percussion interlocked with chopped Amen breaks & grand intermission.',
    color: '#ffffff',
    rootMidi: 40, // E2
    degrees: [0, 3, 6, 4],
    bDegrees: [0, 4, 3, 6],
    chordSize: 5,
    breakName: 'Amen',
    altBreakName: 'Apache',
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
    altLeadPattern: [4, -1, 6, 7, -1, 5, 4, 2, 0, -1, 2, 4, 6, -1, 4, 2],
    bassStyle: 'walking',
    introBars: 4,
    loopSections: [
      { kind: 'grooveA', bars: 8 },
      { kind: 'grooveB', bars: 8 },
      { kind: 'intermission', bars: 8 },
      { kind: 'dubBreak', bars: 4 },
      { kind: 'grooveC', bars: 16 },
      { kind: 'outro', bars: 4 },
    ],
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

// Hypnotic 12-step 303 Acid polymeter (resolves cleanly every 3 bars) + 8-step accent cycle
const ACID_12_STEPS: readonly { deg: number; oct: 0 | 1; gate: boolean }[] = [
  { deg: 0, oct: 0, gate: true },
  { deg: 0, oct: 1, gate: true },
  { deg: 0, oct: 0, gate: false },
  { deg: 2, oct: 0, gate: true },
  { deg: 4, oct: 0, gate: true },
  { deg: 0, oct: 1, gate: true },
  { deg: 0, oct: 0, gate: false },
  { deg: 6, oct: 0, gate: true },
  { deg: 4, oct: 0, gate: true },
  { deg: 0, oct: 0, gate: true },
  { deg: 2, oct: 1, gate: true },
  { deg: 4, oct: 0, gate: false },
];
const ACID_8_ACCENTS: readonly boolean[] = [
  true, false, false, true, false, false, true, false,
];

interface HornHit {
  deg: number;
  interval: number;
  dur: number;
}

// Per-flavor 2-bar (32-step) call-and-response horn phrases for loop add-ins & Boss Brass
const HORN_RIFFS: Record<GsrTrackFlavor, readonly (HornHit | null)[]> = {
  dub: [
    null, null, { deg: 0, interval: 4, dur: 0.22 }, null, null, null, null, null,
    null, null, { deg: 4, interval: 6, dur: 0.18 }, null, null, null, null, null,
    null, null, { deg: 0, interval: 4, dur: 0.22 }, null, null, null, { deg: 2, interval: 4, dur: 0.16 }, null,
    null, null, null, null, { deg: 4, interval: 2, dur: 0.2 }, null, null, null,
  ],
  jazz: [
    { deg: 0, interval: 2, dur: 0.16 }, null, null, { deg: 4, interval: 6, dur: 0.14 }, null, null, { deg: 2, interval: 4, dur: 0.18 }, null,
    null, null, { deg: 4, interval: 6, dur: 0.16 }, null, null, null, null, null,
    null, null, { deg: 2, interval: 4, dur: 0.16 }, null, null, { deg: 5, interval: 2, dur: 0.14 }, null, null,
    { deg: 4, interval: 6, dur: 0.2 }, null, null, null, null, null, { deg: 2, interval: 4, dur: 0.14 }, null,
  ],
  bongo: [
    { deg: 0, interval: 4, dur: 0.16 }, null, null, { deg: 0, interval: 4, dur: 0.14 }, null, null, { deg: 4, interval: 6, dur: 0.18 }, null,
    null, null, { deg: 2, interval: 4, dur: 0.14 }, null, { deg: 4, interval: 6, dur: 0.16 }, null, null, null,
    { deg: 0, interval: 4, dur: 0.16 }, null, null, { deg: 3, interval: 5, dur: 0.14 }, null, null, { deg: 4, interval: 6, dur: 0.18 }, null,
    null, null, { deg: 6, interval: 4, dur: 0.14 }, null, null, null, { deg: 4, interval: 2, dur: 0.14 }, null,
  ],
  acid: [
    { deg: 0, interval: 2, dur: 0.26 }, null, null, null, null, null, { deg: 4, interval: 2, dur: 0.22 }, null,
    null, null, null, null, { deg: 2, interval: 4, dur: 0.2 }, null, null, null,
    { deg: 0, interval: 4, dur: 0.26 }, null, null, null, null, null, { deg: 5, interval: 2, dur: 0.2 }, null,
    null, null, { deg: 4, interval: 2, dur: 0.22 }, null, null, null, null, null,
  ],
  house: [
    null, null, { deg: 0, interval: 4, dur: 0.16 }, null, null, null, { deg: 4, interval: 7, dur: 0.16 }, null,
    null, null, { deg: 2, interval: 4, dur: 0.16 }, null, null, null, null, null,
    null, null, { deg: 0, interval: 4, dur: 0.16 }, null, null, null, { deg: 5, interval: 4, dur: 0.16 }, null,
    null, null, { deg: 4, interval: 6, dur: 0.18 }, null, null, null, { deg: 2, interval: 4, dur: 0.14 }, null,
  ],
  liquid: [
    { deg: 0, interval: 4, dur: 0.28 }, null, null, null, null, null, null, null,
    null, null, { deg: 4, interval: 6, dur: 0.24 }, null, null, null, null, null,
    null, null, null, null, { deg: 3, interval: 4, dur: 0.26 }, null, null, null,
    null, null, { deg: 2, interval: 4, dur: 0.22 }, null, null, null, null, null,
  ],
  finale: [
    { deg: 0, interval: 4, dur: 0.24 }, null, null, { deg: 2, interval: 4, dur: 0.16 }, null, null, { deg: 4, interval: 7, dur: 0.22 }, null,
    null, null, { deg: 6, interval: 4, dur: 0.18 }, null, null, null, null, null,
    { deg: 4, interval: 6, dur: 0.22 }, null, null, { deg: 2, interval: 4, dur: 0.16 }, null, null, { deg: 0, interval: 4, dur: 0.24 }, null,
    null, null, null, null, { deg: 4, interval: 7, dur: 0.2 }, null, null, null,
  ],
};

// Syncopated 2-bar (32-step) showcase / skill-expression flair melodies (-1 = rest)
const FLAIR_PATTERNS: Record<GsrTrackFlavor, readonly number[]> = {
  dub: [4, -1, 6, 4, -1, 2, -1, 0, -1, 2, 4, -1, -1, -1, 2, -1, 4, -1, 6, 7, -1, 4, 2, -1, 0, -1, 2, 4, -1, -1, -1, -1],
  jazz: [0, 2, 4, -1, 6, 5, 4, -1, 2, 3, 4, -1, 6, -1, 4, -1, 7, -1, 6, 4, -1, 2, 4, 5, -1, 4, 2, 0, -1, -1, 4, -1],
  bongo: [0, -1, 4, 4, -1, 2, 4, -1, 5, 4, 2, -1, 0, -1, 4, -1, 4, -1, 6, 4, -1, 2, 0, -1, 2, 4, 5, -1, 4, -1, 2, -1],
  acid: [0, -1, 2, -1, 4, -1, 6, 4, -1, 2, 0, -1, 4, -1, -1, -1, 0, -1, 4, -1, 5, 4, 2, -1, 4, -1, 6, 4, 2, -1, 0, -1],
  house: [4, -1, 2, 4, -1, 5, 4, -1, 2, 0, 2, -1, 4, -1, 7, -1, 5, -1, 4, 2, -1, 4, 5, -1, 7, -1, 5, 4, 2, -1, 0, -1],
  liquid: [4, -1, 6, 7, -1, 4, 3, -1, 2, -1, 4, 3, -1, 2, 0, -1, 2, -1, 4, 6, -1, 7, 6, -1, 4, -1, 3, 2, -1, 0, -1, -1],
  finale: [0, 2, 4, -1, 6, -1, 7, 6, 4, -1, 2, 4, -1, 6, 4, -1, 7, -1, 6, 4, 5, -1, 4, 2, 0, -1, 2, 4, 6, -1, 4, -1],
};

function buildBassLine(
  spec: TrackSpec,
  barChordDeg: number,
  nextChordDeg: number,
  section: GsrSectionKind,
): (number | null)[] {
  const mode = MODES[spec.mode];
  const line: (number | null)[] = new Array(16).fill(null);
  const r = spec.rootMidi;
  const deg = (d: number) => degreeToMidi(r, mode, d);

  if (section === 'intermission') {
    line[0] = deg(barChordDeg);
    line[8] = deg(barChordDeg + 4);
    return line;
  }

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
    line[4] = deg(barChordDeg);
    line[8] = deg(barChordDeg);
    line[12] = deg(barChordDeg + 4);
    line[14] = deg(barChordDeg + 6);
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

function buildDrumBank(
  rnd: () => number,
  srcBreak: ReturnType<typeof breakByName>,
  altBreak: ReturnType<typeof breakByName>,
  chopAmount: number,
  fourOnFloor: boolean,
  variant: 'A' | 'B' | 'C',
): Slice[][] {
  const bars: Slice[][] = [];
  for (let b = 0; b < 8; b++) {
    const useAlt = variant === 'B' ? b % 2 === 1 : variant === 'C' ? b >= 2 : b >= 4 && b % 2 === 1;
    const chop = variant === 'C' ? Math.min(0.65, chopAmount + 0.16) : chopAmount;
    const base = chopBar(rnd, (useAlt ? altBreak : srcBreak).steps, (b % 2) as 0 | 1, chop);
    const fillKind = b === 7 ? (variant === 'C' ? 'cut' : 'syncopated') : 'roll';
    const bar = b === 3 || b === 7 ? transitionFill(base, fillKind) : base;
    if (fourOnFloor || variant === 'B') {
      if (fourOnFloor) {
        for (const s of [0, 4, 8, 12]) bar[s] = { ...bar[s], k: 1 };
      }
      if (variant === 'B') {
        for (const s of [2, 6, 10, 14]) bar[s] = { ...bar[s], o: 1 };
      }
    }
    bars.push(bar);
  }
  return bars;
}

function buildIntermissionBar(barInSec: number, isLastBar: boolean): Slice[] {
  const bar: Slice[] = Array.from({ length: 16 }, (_, s) => {
    const sl: Slice = {};
    if (s % 4 === 0) sl.h = 1;
    if (s === 6 || s === 14) sl.g = 1;
    if (barInSec % 2 === 1 && s === 10) sl.o = 1;
    return sl;
  });
  return isLastBar ? transitionFill(bar, 'roll') : bar;
}

function buildOutroBar(base: Slice[], barInSec: number): Slice[] {
  return base.map((sl, s) => {
    if (barInSec >= 2 && s >= 8) return s % 4 === 0 ? { h: 1 } : {};
    if (barInSec === 3) return s === 0 ? { k: 1, h: 1 } : s % 4 === 2 ? { h: 1 } : {};
    return { k: sl.k, h: sl.h, o: sl.o };
  });
}

function precomposeChords(
  mode: readonly number[],
  rootMidi: number,
  degrees: readonly number[],
  chordSize: 4 | 5,
): number[][] {
  const out: number[][] = [];
  let prev: number[] | null = null;
  for (let b = 0; b < 8; b++) {
    const deg = degrees[b % degrees.length];
    const tones = chordTones(mode, deg, chordSize).map((t) => t + rootMidi + 12);
    const voiced = voiceLead(tones, 62, prev);
    out.push(voiced);
    prev = voiced;
  }
  return out;
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

  // Master clarity EQ + lowpass for airborne muffle / intro mix-in sweeps
  const airShelf = keep(new T.Filter({ frequency: 5200, type: 'highshelf', gain: 3.2 })).connect(out);
  const mudTrim = keep(new T.Filter({ frequency: 310, type: 'peaking', Q: 1.1, gain: -2.2 })).connect(airShelf);
  const masterLp = keep(new T.Filter({ frequency: 18500, type: 'lowpass', rolloff: -12 })).connect(mudTrim);
  const fx = createFx(T, keep, masterLp, {
    reverbDecay: spec.flavor === 'dub' || spec.flavor === 'acid' ? 3.0 : 2.6,
    reverbHp: 340,
    echoTime: '8n.',
    echoFeedback: spec.flavor === 'dub' || spec.flavor === 'acid' ? 0.44 : 0.34,
    echoLp: 5800,
    delayDry: 0.18,
    delayRevSend: 0.72,
  });

  // High-passed bus for harmonic layers (>210 Hz so bass stays clean), with groove sidechain duck & house filter
  const houseFilter = keep(new T.Filter({ frequency: 18000, type: 'lowpass', Q: spec.flavor === 'house' ? 2.2 : 0.7 })).connect(masterLp);
  const harmDuck = keep(new T.Gain(1)).connect(houseFilter);
  const harmHp = keep(new T.Filter({ frequency: 210, type: 'highpass' })).connect(harmDuck);

  // Percussion (clean punchy kicks, bright snare/hats, balanced stereo placement)
  const kit = createKit(T, keep, masterLp, fx, {
    grit: spec.flavor === 'acid' ? 0.18 : 0.12,
    swing: spec.swing,
    snareLp: 6200,
    hatVolume: -11,
    kickVolume: spec.flavor === 'jazz' ? -3.5 : -2.5,
    kickPitch: spec.flavor === 'house' || spec.flavor === 'acid' ? 'D1' : 'C1',
  });
  const bongoPan = createPanner(T, keep, -0.24, masterLp);
  const bongos = spec.hasBongoRip
    ? createBongoKit(T, keep, bongoPan, fx, { volumeDb: -3.5, revSend: 0.18 })
    : null;

  // Dedicated Grinding Hats layer (audible on ALL 10 tracks when grinding() is active)
  const grindClosedPan = createPanner(T, keep, -0.26, masterLp);
  const grindHatHp = keep(new T.Filter({ frequency: 6500, type: 'highpass' })).connect(grindClosedPan);
  const grindClosedHat = keep(
    new T.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.032, sustain: 0, release: 0.01 },
    }),
  ).connect(grindHatHp);
  grindClosedHat.volume.value = -6;

  const grindOpenPan = createPanner(T, keep, 0.30, masterLp);
  const grindSizzleBp = keep(new T.Filter({ frequency: 10500, type: 'bandpass', Q: 1.6 })).connect(grindOpenPan);
  const grindOpenHat = keep(
    new T.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.002, decay: 0.14, sustain: 0, release: 0.05 },
    }),
  ).connect(grindSizzleBp);
  grindOpenHat.volume.value = -7;

  // Warm, sculpted Boss Brass & Horn Add-In layer (PolySynth, mono sends before dry panner)
  const bossDryPan = createPanner(T, keep, -0.18, harmHp);
  const bossBrassLp = keep(new T.Filter({ frequency: 1850, type: 'lowpass', rolloff: -24 }))
    .fan(bossDryPan, keep(new T.Gain(0.30)).connect(fx.rev), keep(new T.Gain(0.16)).connect(fx.delay));
  const bossBrassTame = keep(new T.Filter({ frequency: 2650, type: 'peaking', Q: 1.4, gain: -3.5 })).connect(bossBrassLp);
  const bossBrassVib = keep(new T.Vibrato({ frequency: 4.5, depth: 0.045 })).connect(bossBrassTame);
  const bossBrass = keep(
    new T.PolySynth(T.FMSynth, {
      harmonicity: 1,
      modulationIndex: 1.55,
      oscillator: { type: 'sawtooth' },
      modulation: { type: 'triangle' },
      envelope: { attack: 0.022, decay: 0.24, sustain: 0.56, release: 0.26 },
      modulationEnvelope: { attack: 0.03, decay: 0.28, sustain: 0.24, release: 0.22 },
    }),
  ).connect(bossBrassVib);
  bossBrass.maxPolyphony = 6;
  bossBrass.volume.value = -12;

  // Novel Encore / Flair voice: funky wah-clav / formant lead for Groove C showcase & skill-expression combos
  const flairPan = createPanner(T, keep, 0.24, harmHp);
  const flairPostLp = keep(new T.Filter({ frequency: 4200, type: 'lowpass', rolloff: -12 }))
    .fan(flairPan, keep(new T.Gain(0.26)).connect(fx.rev), keep(new T.Gain(0.28)).connect(fx.delay));
  const flairSynth = keep(
    new T.MonoSynth({
      oscillator: { type: spec.flavor === 'liquid' || spec.flavor === 'finale' ? 'triangle' : 'sawtooth' },
      portamento: 0.025,
      filter: { frequency: 2400, type: 'lowpass', Q: 3.2 },
      envelope: { attack: 0.005, decay: 0.14, sustain: 0.25, release: 0.12 },
      filterEnvelope: {
        attack: 0.006,
        decay: 0.16,
        sustain: 0.2,
        release: 0.12,
        baseFrequency: 520,
        octaves: 2.4,
      },
    }),
  ).connect(flairPostLp);
  flairSynth.volume.value = -11;

  // Bass voices (mono-clean, centered directly into masterLp)
  const uprightBass = spec.hasUprightBass
    ? createUprightBass(T, keep, masterLp, { volumeDb: -9 })
    : null;
  const subBass = !spec.hasUprightBass
    ? keep(
        new T.MonoSynth({
          oscillator: { type: spec.bassStyle === 'acid' ? 'sawtooth' : 'triangle' },
          filter: { frequency: 420, type: 'lowpass', Q: 1.2 },
          envelope: { attack: 0.008, decay: 0.25, sustain: 0.45, release: 0.14 },
          filterEnvelope: {
            attack: 0.006,
            decay: 0.22,
            sustain: 0.2,
            release: 0.15,
            baseFrequency: 110,
            octaves: 1.4,
          },
        }),
      ).connect(masterLp)
    : null;
  if (subBass) subBass.volume.value = -10;

  // Dedicated Acid 303 Voice (sonically bounded resonance & drive)
  const hasAcidVoice = spec.bassStyle === 'acid' || spec.id === 'subsoil-relay-jungle';
  const acidFilter = hasAcidVoice
    ? keep(new T.Filter({ frequency: 620, type: 'lowpass', rolloff: -24, Q: 4.6 }))
    : null;
  const acidDist = hasAcidVoice ? keep(new T.Distortion(0.24)) : null;
  const acidPostLp = hasAcidVoice ? keep(new T.Filter({ frequency: 3400, type: 'lowpass', rolloff: -12 })) : null;
  const acidDelaySend = hasAcidVoice ? keep(new T.Gain(0.28)).connect(fx.delay) : null;
  const acidThrowGain = hasAcidVoice ? keep(new T.Gain(0)).connect(fx.throwSend) : null;
  const acidHp = hasAcidVoice ? keep(new T.Filter({ frequency: 240, type: 'highpass' })) : null;
  if (acidFilter && acidDist && acidPostLp && acidHp && acidDelaySend && acidThrowGain) {
    acidFilter.connect(acidDist);
    acidDist.connect(acidPostLp);
    acidPostLp.connect(masterLp);
    acidPostLp.connect(acidHp);
    acidHp.fan(acidDelaySend, acidThrowGain);
  }
  const acidSynth =
    hasAcidVoice && acidFilter
      ? keep(
          new T.MonoSynth({
            oscillator: { type: 'sawtooth' },
            portamento: 0.035,
            filter: { frequency: 1600, type: 'lowpass', Q: 2.0 },
            envelope: { attack: 0.004, decay: 0.14, sustain: 0.22, release: 0.08 },
            filterEnvelope: {
              attack: 0.004,
              decay: 0.16,
              sustain: 0.15,
              release: 0.08,
              baseFrequency: 240,
              octaves: 2.2,
            },
          }),
        ).connect(acidFilter)
      : null;
  if (acidSynth) acidSynth.volume.value = spec.bassStyle === 'acid' ? -9 : -12;

  // Harmonic & melodic voices (dry outputs panned in stereo around center bass/kick/snare)
  const piano = spec.hasPiano
    ? createFeltPiano(T, keep, createPanner(T, keep, -0.28, harmHp), fx, { volumeDb: -11, revSend: 0.32 })
    : null;
  const rhodes = spec.hasRhodes
    ? createRhodes(T, keep, createPanner(T, keep, 0.28, harmHp), fx, { volumeDb: -12, revSend: 0.34 })
    : null;
  const vibes = spec.hasVibes
    ? createVibraphone(T, keep, createPanner(T, keep, 0.36, harmHp), fx, { volumeDb: -13.5, revSend: 0.42 })
    : null;
  const horn = spec.hasHorn
    ? createFrenchHorn(T, keep, createPanner(T, keep, 0.20, harmHp), fx, { volumeDb: -14, revSend: 0.38, attack: 0.04 })
    : null;
  const harp = spec.hasHarp
    ? createHarp(T, keep, createPanner(T, keep, -0.36, harmHp), fx, { volumeDb: -12.5, revSend: 0.46 })
    : null;

  // Pre-compose chord voicings for A and B sections
  const chordsA = precomposeChords(mode, spec.rootMidi, spec.degrees, spec.chordSize);
  const chordsB = precomposeChords(mode, spec.rootMidi, spec.bDegrees ?? spec.degrees, spec.chordSize);

  // Pre-compose 3 drum-bar banks
  const srcBreak = breakByName(spec.breakName);
  const altBreak = breakByName(spec.altBreakName ?? BREAKS[(BREAKS.indexOf(srcBreak) + 1) % BREAKS.length].name);
  const drumBankA = buildDrumBank(rnd, srcBreak, altBreak, spec.chopAmount, !!spec.fourOnFloor, 'A');
  const drumBankB = buildDrumBank(rnd, altBreak, srcBreak, spec.chopAmount, !!spec.fourOnFloor, 'B');
  const drumBankC = buildDrumBank(rnd, srcBreak, altBreak, spec.chopAmount, !!spec.fourOnFloor, 'C');

  // Flatten loop sections into bar descriptors
  const loopTimeline: { kind: GsrSectionKind; barInSec: number; secLen: number }[] = [];
  for (const sec of spec.loopSections) {
    for (let b = 0; b < sec.bars; b++) {
      loopTimeline.push({ kind: sec.kind, barInSec: b, secLen: sec.bars });
    }
  }
  const introTotalSteps = spec.introBars * 16;
  const loopTotalBars = loopTimeline.length;

  // Composable EffectRack for timed, structured, and event-driven audio effects
  const effectRack = createEffectRack([
    createFilterSweepHandler({
      id: 'master-filter',
      format: 'hybrid',
      filter: masterLp,
      initialHz: 18500,
      rampS: 0.12,
      thresholdHz: 180,
      evaluate(ctx) {
        const air = Boolean(ctx.events.air);
        const grinding = Boolean(ctx.events.grinding);
        if (air) return 1600;
        if (ctx.section === 'intro') {
          return 650 + ((ctx.stepIdx + 1) / introTotalSteps) * 15500;
        }
        if (ctx.section === 'outro') {
          const outroProg = (ctx.barInSection * 16 + ctx.step) / (ctx.sectionLen * 16);
          return Math.max(950, 16000 - outroProg * 12500);
        }
        return grinding ? 19500 : 18500;
      },
    }),
    createFilterSweepHandler({
      id: 'house-filter',
      format: 'hybrid',
      filter: houseFilter,
      initialHz: 18000,
      rampS: 0.08,
      thresholdHz: 180,
      evaluate(ctx) {
        if (spec.flavor === 'house') {
          const phase = ((ctx.barInSection % 4) * 16 + ctx.step) / 64;
          return ctx.section === 'intermission'
            ? 1100 + Math.sin(phase * Math.PI) * 1800
            : 1800 + Math.sin(phase * Math.PI) * 11500;
        }
        return ctx.section === 'intermission' ? 12000 : 18000;
      },
    }),
    createDubThrowHandler({
      id: 'dub-throw',
      format: 'hybrid',
      sendGain: fx.throwSend,
      throwGain: 0.72,
      shouldThrow: (ctx) =>
        (spec.flavor === 'dub' || ctx.section === 'dubBreak') &&
        (ctx.step === 4 || ctx.step === 12) &&
        ctx.barInSection % 2 === 1,
      shouldReset: (ctx) => ctx.section !== 'intermission',
    }),
  ]);

  if (hasAcidVoice && acidFilter && acidThrowGain) {
    effectRack.add(
      createPolyrhythmFilterHandler({
        id: 'acid-filter',
        format: 'hybrid',
        filter: acidFilter,
        throwGain: acidThrowGain,
        accents: ACID_8_ACCENTS,
        initialHz: 620,
        rampS: 0.04,
        thresholdHz: 70,
        maxHz: 2500,
        accentBoostHz: 560,
        throwLevel: 0.58,
        isActive(ctx) {
          const boss = Boolean(ctx.events.boss);
          const hype = Number(ctx.events.hype ?? 0);
          return spec.bassStyle === 'acid'
            ? ctx.section !== 'outro'
            : ctx.section === 'grooveC' || boss || hype > 0.7;
        },
        evaluateBaseHz(ctx) {
          const bar8 = ctx.barInSection % 8;
          const barSweep = ((bar8 * 16 + ctx.step) % 64) / 64;
          const baseHz = ctx.section === 'intermission' ? 220 : 260 + Math.sin(barSweep * Math.PI) * 1090;
          return baseHz + (ctx.events.grinding ? 280 : 0);
        },
        shouldThrow: (ctx, isAccent) => isAccent && (ctx.step % 4 === 2 || ctx.section === 'dubBreak'),
      }),
    );
  }

  let stepIdx = 0;

  const loop = keep(
    new T.Loop((time) => {
      const step = stepIdx % 16;
      const totalBar = Math.floor(stepIdx / 16);

      let sectionKind: GsrSectionKind;
      let barInSec: number;
      let secLen: number;
      if (stepIdx < introTotalSteps) {
        sectionKind = 'intro';
        barInSec = totalBar;
        secLen = spec.introBars;
      } else {
        const loopBar = (totalBar - spec.introBars) % loopTotalBars;
        const entry = loopTimeline[loopBar]!;
        sectionKind = entry.kind;
        barInSec = entry.barInSec;
        secLen = entry.secLen;
      }
      const bar8 = barInSec % 8;

      const grinding = opts.grinding?.() ?? false;
      const air = opts.air?.() ?? false;
      const boss = opts.boss?.() ?? false;
      const skillPeak = opts.skillPeak?.() ?? false;
      const hype = Math.max(0, Math.min(1, opts.hype?.() ?? 0.35));

      effectRack.step({
        time,
        stepIdx,
        step,
        bar: totalBar,
        barInSection: barInSec,
        sectionLen: secLen,
        section: sectionKind,
        events: { grinding, air, boss, skillPeak, hype },
      });

      const h = humanize(stepIdx, 0.08);
      const useB = sectionKind === 'grooveB' || sectionKind === 'grooveC';
      const activeDegrees = useB && spec.bDegrees ? spec.bDegrees : spec.degrees;
      const barDeg = activeDegrees[bar8 % activeDegrees.length];
      const nextDeg = activeDegrees[(bar8 + 1) % activeDegrees.length];
      const chord = (useB ? chordsB : chordsA)[bar8];

      // 1. Drum Kit (selected by section / beat mode)
      let slice: Slice;
      if (sectionKind === 'intermission') {
        slice = buildIntermissionBar(barInSec, barInSec === secLen - 1)[step];
      } else if (sectionKind === 'intro') {
        const base = drumBankA[bar8][step];
        slice = barInSec < 2 ? { h: base.h, o: base.o, g: base.g } : base;
      } else if (sectionKind === 'outro') {
        slice = buildOutroBar(drumBankA[bar8], barInSec)[step];
      } else if (sectionKind === 'dubBreak') {
        const base = drumBankA[bar8][step];
        slice = barInSec === 3 && step >= 8 ? { s: base.s, g: base.g, h: base.h } : base;
      } else if (sectionKind === 'grooveB') {
        slice = drumBankB[bar8][step];
      } else if (sectionKind === 'grooveC') {
        slice = drumBankC[bar8][step];
      } else {
        slice = drumBankA[bar8][step];
      }
      const didKick = kit.hit(slice, time, step, (sectionKind === 'intermission' ? 0.65 : 0.9) * h);
      if (didKick && sectionKind !== 'intermission' && sectionKind !== 'outro') {
        harmDuck.gain.setValueAtTime(0.8, time);
        harmDuck.gain.linearRampToValueAtTime(1, time + 0.13);
      }

      // 1b. Dedicated Grinding Hats (audible on ALL 10 tracks when grinding)
      if (grinding) {
        const accent = step % 2 === 0 ? 0.88 : 0.52;
        grindClosedHat.triggerAttackRelease('32n', time, accent * h);
        if (step % 4 === 2) {
          grindOpenHat.triggerAttackRelease('16n', time, 0.72 * h);
        }
      }

      // 2. Bongo Rip Percussion
      if (bongos && sectionKind !== 'outro') {
        const bongoPat = bar8 === 3 || bar8 === 7 ? BONGO_FILL : BONGO_A;
        const hit = bongoPat[step];
        const secScale = sectionKind === 'intermission' ? 0.55 : 1;
        const intensity = Math.min(1, (spec.bongoIntensity + (grinding || boss ? 0.35 : 0)) * secScale);
        if (hit !== '.' && (intensity >= 0.7 || step % 2 === 0)) {
          const vel = (0.55 + 0.35 * intensity) * h;
          if (hit === 'L') bongos.low(time, vel);
          else if (hit === 'H') bongos.high(time, vel);
          else if (hit === 'S') bongos.slap(time, vel);
          else bongos.tap(time, vel * 0.85);
        }
        if (step % 4 === 2 && intensity > 0.3) {
          bongos.shaker(time, 0.45 * intensity * h);
        }
      }

      // 3. Bassline (drops out briefly in dubBreak bar 3 / outro last bar)
      const dropBass = (sectionKind === 'dubBreak' && barInSec === 2) || (sectionKind === 'outro' && barInSec === secLen - 1);
      if (!dropBass) {
        const bassLine = buildBassLine(spec, barDeg, nextDeg, sectionKind);
        const bassNote = bassLine[step];
        if (bassNote !== null) {
          const dur = spec.bassStyle === 'walking' ? 0.24 : 0.14;
          if (uprightBass) uprightBass.play(bassNote, dur, time, 0.85 * h);
          else if (subBass) subBass.triggerAttackRelease(midiToNote(bassNote), dur, time, 0.82 * h);
        }
      }

      // 3b. Hypnotic 12-step 303 Acid Voice (Area 3 primary, Subsoil peak texture)
      const acidActive =
        acidSynth &&
        (spec.bassStyle === 'acid'
          ? sectionKind !== 'outro'
          : (sectionKind === 'grooveC' || boss || hype > 0.7));
      if (acidActive && acidSynth) {
        const secStep = barInSec * 16 + step;
        const aStep = ACID_12_STEPS[secStep % ACID_12_STEPS.length]!;
        const isAccent = ACID_8_ACCENTS[secStep % ACID_8_ACCENTS.length]!;
        if (aStep.gate && (sectionKind !== 'intermission' || step % 2 === 0)) {
          const midi = Math.min(67, degreeToMidi(spec.rootMidi + 12, mode, barDeg + aStep.deg) + aStep.oct * 12);
          acidSynth.triggerAttackRelease(midiToNote(midi), isAccent ? 0.13 : 0.085, time, (isAccent ? 0.84 : 0.62) * h);
        }
      }

      // 4. Syncopated Piano / Rhodes Comping (dub skank on dub tracks)
      if (sectionKind !== 'outro') {
        const isDub = spec.flavor === 'dub' || sectionKind === 'dubBreak';
        const isCompStep = isDub
          ? step === 2 || step === 6 || step === 10 || step === 14
          : step === 0 || step === 6 || step === 10 || (step === 14 && bar8 % 2 === 1);
        if (isCompStep) {
          const dur = isDub ? 0.12 : step === 0 ? 0.36 : 0.16;
          const vel = sectionKind === 'intermission' ? 0.45 : 0.62;
          if (piano) piano.play(chord, dur, time, vel * h);
          if (rhodes && (isDub || step === 0 || step === 10)) rhodes.play(chord, dur * 1.1, time, (vel - 0.04) * h);
        }
      }

      // 5. Harp Arpeggios (Liquid / Finale, shines in intermissions too)
      if (harp && sectionKind !== 'outro' && step === 0 && (bar8 % 2 === 0 || sectionKind === 'intermission' || hype > 0.5)) {
        harp.arp(chord.slice(0, 4), time, 0.05, 0.58 * h);
      }

      // 6. Vibraphone & French Horn Motifs
      if (sectionKind !== 'intro' && sectionKind !== 'outro') {
        const pat = useB && spec.altLeadPattern ? spec.altLeadPattern : spec.leadPattern;
        const leadOffset = pat[step];
        if (leadOffset >= 0) {
          const melodyMidi = degreeToMidi(spec.rootMidi + 24, mode, barDeg + leadOffset);
          if (vibes && (bar8 % 2 === 0 || sectionKind === 'intermission' || hype > 0.45)) {
            vibes.play(melodyMidi, 0.2, time, (sectionKind === 'intermission' ? 0.48 : 0.58) * h);
          }
          if (horn && sectionKind !== 'intermission' && (hype > 0.55 || bar8 % 4 === 2) && step % 4 === 0) {
            horn.play(melodyMidi - 12, 0.26, time, 0.66 * h);
          }
        }
      }

      // 7. Per-Flavor Horn Add-Ins & Boss Brass Fanfares (audible on ALL 10 tracks)
      const hornRiff = HORN_RIFFS[spec.flavor];
      const hornHit = hornRiff[(barInSec % 2) * 16 + step];
      const loopHornAddIn =
        !boss &&
        ((sectionKind === 'grooveB' && barInSec >= 4) ||
          (sectionKind === 'grooveC' && barInSec >= 12));
      if (hornHit && (boss || loopHornAddIn)) {
        const rootNote = degreeToMidi(spec.rootMidi + 12, mode, barDeg + hornHit.deg);
        const harmNote = degreeToMidi(spec.rootMidi + 12, mode, barDeg + hornHit.deg + hornHit.interval);
        const notes = boss
          ? [midiToNote(rootNote), midiToNote(harmNote)]
          : [midiToNote(rootNote)];
        const vel = (boss ? 0.68 : 0.5) * h;
        bossBrass.triggerAttackRelease(notes, hornHit.dur, time, vel);
      }

      // 8. Novel Encore / Flair Voice: Groove C showcase (bars 8..15) + Skill-Expression combo pop-ins
      const isGrooveCShowcase = sectionKind === 'grooveC' && barInSec >= 8;
      const isSkillPop =
        (skillPeak || hype >= 0.78) &&
        sectionKind !== 'intro' &&
        sectionKind !== 'outro' &&
        sectionKind !== 'intermission' &&
        barInSec % 2 === 1;
      if (isGrooveCShowcase || isSkillPop) {
        const flairPat = FLAIR_PATTERNS[spec.flavor];
        const flairDeg = flairPat[(barInSec % 2) * 16 + step] ?? -1;
        if (flairDeg >= 0) {
          const flairMidi = Math.min(84, degreeToMidi(spec.rootMidi + 24, mode, barDeg + flairDeg));
          const flairVel = (isGrooveCShowcase ? 0.68 : 0.62) * h;
          flairSynth.triggerAttackRelease(midiToNote(flairMidi), 0.14, time, flairVel);
        }
      }

      opts.onBeat?.(step, totalBar, sectionKind);
      stepIdx++;
    }, '16n'),
  );

  loop.start(0);
}

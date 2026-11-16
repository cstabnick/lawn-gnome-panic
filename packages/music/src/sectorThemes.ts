/**
 * Sector themes: the pattern banks the sector arranger (sectorTrack.ts) builds songs from.
 *
 * Every pattern is written relative to the current chord, so any arp, bassline or motif in a theme's
 * bank fits any of its progressions. That is what lets the arranger mix patterns freely without ever
 * picking a random note.
 *
 * Notation:
 * - Chords are scale degrees of the theme's mode (0 = i/I), stacked in thirds to 7th chords.
 *   A chord lasts 2 bars; a progression is 4 chords (an 8-bar phrase).
 * - Arps and basslines are strings, one char per 16th note, looped over the chord:
 *   '0'-'7' = chord tone (0 root, 1 third, 2 fifth, 3 seventh, 4 root an octave up, ...),
 *   'v' = fifth below the root, 'u' = seventh below, '-' = hold the previous note, '.' = rest.
 * - Motifs are 2-bar melody cells: [16th step 0-31, scale steps above the chord root, length in 16ths].
 *   They follow the chord diatonically, so a motif over a different chord becomes a sequence of itself.
 * - Drum kits: [kick, snare, hat], 16 chars each, 'x' = hit, 'X' = accent.
 */
import type { ModeName } from './theory';

export type Motif = [step: number, rel: number, len: number][];
export type DrumKit = [kick: string, snare: string, hat: string];
export type PulseWidth = 0.125 | 0.25 | 0.5;

export interface SectorTheme {
  name: string;
  mode: ModeName;
  /** Tonic MIDI note in the bass register (38-47). */
  tonic: number;
  bpm: number;
  /** The theme's own progression: every A section plays it. It is the theme's identity. */
  home: number[];
  /** B-section progressions; the arranger takes a new one each pass through the song. */
  progressions: number[][];
  /** Arp patterns; arps[0] is the one heard first. */
  arps: string[];
  /** Explore basslines (soft triangle, mostly long notes). */
  bassExplore: string[];
  /** Battle basslines (square, driving). */
  bassBattle: string[];
  /** Melody motifs; motifs[0] is the signature that opens every A section. */
  motifs: Motif[];
  drums: DrumKit[];
  /** Soft explore percussion (one bar), or null for none. */
  ticks: string | null;
  arpWidth: PulseWidth;
  leadWidth: PulseWidth;
}

// ----- shared drum kits -----
const BACKBEAT: DrumKit = ['x.......x.......', '....X.......X...', 'x.x.x.x.x.x.x.x.'];
const FOUR: DrumKit = ['x...x...x...x...', '....X.......X...', '..x...x...x...x.'];
const BROKEN: DrumKit = ['x..x..x...x.....', '....X.......X..x', 'xxxxxxxxxxxxxxxx'];
const STEPPER: DrumKit = ['x.....x...x.....', '....X.......X...', 'x.xxx.xxx.xxx.xx'];
const GALLOP: DrumKit = ['x..x..x.x..x..x.', '....X.......X...', 'x.x.x.x.x.x.x.x.'];
const FUNK: DrumKit = ['x..x......x..x..', '....X..x.x..X...', 'x.xxx.xxx.xxx.xx'];
/** The last bar of a section in battle. */
export const DRUM_FILL: DrumKit = ['x...x...x...x.x.', '....X...x.xxXXXX', 'x.x.x.x.........'];
/** Breakdowns in battle: half time. */
export const DRUM_HALF: DrumKit = ['x.........x.....', '........X.......', 'x.x.x.x.x.x.x.x.'];

export const SECTOR_THEMES: SectorTheme[] = [
  {
    // Hopeful but lonely: the first sector, wide-open sky. Slow pulse arps and long held bass.
    name: 'Garden Sector',
    mode: 'aeolian', tonic: 45, bpm: 100,
    home: [0, 5, 2, 6],
    progressions: [[3, 0, 5, 6], [5, 6, 0, 0], [3, 5, 6, 4], [5, 3, 0, 6]],
    arps: ['0.1.2.1.0.1.2.4.', '0123012301230123', '0..2..4..2..1...', '0213021302130213'],
    bassExplore: ['0-------------..', '0-----0-----2---', '0-------2---4---'],
    bassBattle: ['0-0-4-0-0-0-4-0-', '0-0-0-0-0-0-2-4-', '0.00.00.0.00.04.'],
    motifs: [
      [[0, 4, 6], [6, 2, 2], [8, 4, 4], [12, 7, 4], [16, 6, 8], [24, 4, 8]],
      [[0, 7, 4], [4, 6, 4], [8, 4, 8], [16, 2, 4], [20, 4, 4], [24, 1, 8]],
      [[0, 2, 12], [12, 4, 4], [16, 3, 4], [20, 2, 4], [24, 0, 8]],
      [[4, 4, 2], [6, 5, 2], [8, 7, 6], [14, 9, 2], [16, 7, 8], [24, 4, 8]],
    ],
    drums: [BACKBEAT, FOUR, BROKEN],
    ticks: null,
    arpWidth: 0.25, leadWidth: 0.5,
  },
  {
    // Eerie and sparse: deep space, nothing out here. Phrygian b2, slow tempo, lots of rests.
    name: 'Deep Soil',
    mode: 'phrygian', tonic: 40, bpm: 88,
    home: [0, 1, 0, 6],
    progressions: [[5, 1, 0, 0], [3, 1, 6, 0], [0, 5, 1, 1]],
    arps: ['0..2..4..2..1...', '0.4.2.4.0.4.2.5.', '0..4..2..5..3..1', '7531642075316420'],
    bassExplore: ['0---------------', '0-------v-------', '0-----------0-v-'],
    bassBattle: ['0-40-40-0-40-4v-', '0.00.00.0.00.04.', '0-0-0-0-v-v-0-0-'],
    motifs: [
      [[0, 0, 8], [8, 1, 8], [16, 0, 12], [28, -1, 4]],
      [[0, 4, 4], [4, 5, 4], [8, 4, 16], [24, 7, 8]],
      [[8, 2, 6], [14, 1, 2], [16, 0, 16]],
      [[0, 7, 6], [6, 6, 2], [8, 4, 8], [16, 5, 4], [20, 4, 12]],
    ],
    drums: [STEPPER, GALLOP, BACKBEAT],
    ticks: '..x.......x..x..',
    arpWidth: 0.125, leadWidth: 0.25,
  },
  {
    // Bright and funky: a busy engineering station. Lydian #4, syncopated slap-style bass.
    name: 'Sprinkler Works',
    mode: 'lydian', tonic: 41, bpm: 112,
    home: [0, 1, 0, 1],
    progressions: [[5, 4, 1, 0], [2, 5, 1, 1], [4, 5, 2, 1], [5, 2, 4, 0]],
    arps: ['0123432101234321', '0.2.4.2.0.2.4.2.', '012.012.012.0124', '0427042704270427'],
    bassExplore: ['0..4.0..2.0.3.2.', '0--0--0---v--0..', '0-----0-----2---'],
    bassBattle: ['0.04.0.20.04.32.', '0-40-40-0-40-4v-', '0-0-4-0-0-0-4-0-'],
    motifs: [
      [[0, 4, 2], [3, 4, 1], [4, 6, 2], [6, 7, 4], [12, 6, 2], [14, 4, 2], [16, 3, 4], [22, 4, 2], [24, 2, 8]],
      [[0, 7, 3], [3, 6, 3], [6, 4, 2], [10, 2, 2], [12, 4, 4], [16, 9, 6], [22, 7, 2], [24, 4, 8]],
      [[2, 2, 2], [4, 4, 2], [6, 2, 2], [8, 0, 4], [14, 4, 2], [16, 3, 2], [18, 4, 6], [28, 6, 4]],
      [[0, 11, 2], [2, 9, 2], [4, 7, 2], [6, 4, 2], [8, 7, 8], [20, 6, 4], [24, 4, 8]],
    ],
    drums: [FUNK, BACKBEAT, BROKEN],
    ticks: 'x.x.x.x.x.x.x.x.',
    arpWidth: 0.25, leadWidth: 0.125,
  },
  {
    // Tense and driving: hostile territory. Harmonic minor, the raised 7th pulls hard to the tonic.
    name: 'Rotary Front',
    mode: 'harmonic', tonic: 47, bpm: 124,
    home: [0, 5, 3, 4],
    progressions: [[0, 3, 4, 4], [5, 1, 4, 0], [3, 4, 0, 5], [5, 6, 0, 4]],
    arps: ['0123012301230123', '0213021302130213', '012.012.012.0124', '7531642075316420'],
    bassExplore: ['0-----0-----2---', '0-------2---4---', '0--0--0---v--0..'],
    bassBattle: ['0.00.00.0.00.04.', '0-0-4-0-0-0-4-0-', '0-40-40-0-40-4v-'],
    motifs: [
      [[0, 0, 2], [2, 2, 2], [4, 4, 4], [8, 7, 4], [12, 6, 4], [16, 4, 6], [22, 3, 2], [24, 2, 8]],
      [[0, 4, 6], [6, 4, 2], [8, 5, 4], [12, 4, 4], [16, 2, 4], [20, 1, 4], [24, 2, 8]],
      [[0, 7, 2], [2, 7, 2], [4, 6, 4], [8, 4, 4], [12, 2, 4], [16, 4, 12], [28, 7, 4]],
      [[0, 9, 8], [8, 7, 8], [16, 6, 8], [24, 4, 8]],
    ],
    drums: [GALLOP, BROKEN, FOUR],
    ticks: 'x...x...x...x...',
    arpWidth: 0.125, leadWidth: 0.25,
  },
  {
    // Proud and a bit wistful: the home fleet. Mixolydian bVII, anthem-like leaps.
    name: 'Gnome Fleet',
    mode: 'mixolydian', tonic: 38, bpm: 108,
    home: [0, 6, 3, 0],
    progressions: [[3, 6, 0, 4], [5, 3, 6, 0], [3, 4, 6, 6]],
    arps: ['0.1.2.1.0.1.2.4.', '0123432101234321', '0..4..2..5..3..1', '0427042704270427'],
    bassExplore: ['0-------2---4---', '0-----0-----2---', '0-------------..'],
    bassBattle: ['0-0-0-0-0-0-2-4-', '0-0-4-0-0-0-4-0-', '0.00.00.0.00.04.'],
    motifs: [
      [[0, 0, 4], [4, 4, 4], [8, 7, 6], [14, 6, 2], [16, 4, 8], [24, 2, 4], [28, 4, 4]],
      [[0, 7, 4], [4, 9, 4], [8, 7, 4], [12, 4, 4], [16, 6, 12], [28, 4, 4]],
      [[0, 4, 2], [2, 5, 2], [4, 4, 4], [8, 2, 4], [12, 0, 4], [16, 1, 6], [22, 2, 2], [24, 4, 8]],
      [[0, 2, 6], [6, 4, 6], [12, 7, 4], [16, 8, 16]],
    ],
    drums: [BACKBEAT, STEPPER, FOUR],
    ticks: null,
    arpWidth: 0.25, leadWidth: 0.5,
  },
];

/** Melody phrase forms over the 4 chords of a phrase: letters bind to motifs, '.' rests, uppercase = varied repeat. */
export const FORMS_A = ['aaba', 'a.aB', 'aAba', 'abaA', 'a.ab'];
export const FORMS_B = ['bcb.', 'b.cB', 'bbcc', 'bcbC'];

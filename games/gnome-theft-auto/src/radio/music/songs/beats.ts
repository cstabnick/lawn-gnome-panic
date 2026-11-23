// 104.1 HOA Compliance Beats: smooth jazz to trim your edges to. Rhodes, piano, organ or nylon guitar comping seventh
// chords, a walking upright, brushes and a ride, a sax, vibes or clarinet on the tune, vinyl crackle. ii-V-I harmony
// in ionian, dorian and mixolydian (and a minor tune or two), swung, 64-124 bpm. One SongSpec per song; the order is
// the order on the dial's playlist.
import type { SongSpec } from '../spec';

const VERGE_WALK: SongSpec = {
  title: 'Verge Walk', artist: 'The Thorne Lawn Trio',
  bpm: 92, tonic: 46, mode: 'ionian', meter: 4, swing: 0.3,
  progressions: { A: [0, 5, [1, 4], 0], B: [3, [2, 5], [1, 4], 0] },
  form: [
    { s: 'A', e: 0.3 }, { s: 'A', e: 0.5 }, { s: 'B', e: 0.6 }, { s: 'A', e: 0.7 },
    { s: 'B', e: 0.75, up: true }, { s: 'A', e: 0.65 }, { s: 'B', e: 0.55 }, { s: 'A', e: 0.35 },
  ],
  chordSize: 4, chord: 'rhodes', comp: { steps: [0, 6, 10], len: 4 },
  bass: 'upright', bassPat: [[0, 'r', 4], [4, 't', 4], [8, 'f', 4], [12, 'a', 4]],
  lead: 'sax', melody: { lens: [2, 2, 4, 4, 6, 8], rest: 0.2, lo: 0, hi: 9 },
  kit: 'brush', drums: { k: 'o.......o.......', s: '....o.......o...', o: 'x...x.x.x...x.x.' },
  texture: 'vinyl', pump: 0.1, reverb: 2.6, echo: '8n.',
};

const COMPLIANCE_WALTZ: SongSpec = {
  title: 'Compliance Waltz', artist: 'Cress Caliper & Friends',
  bpm: 104, tonic: 53, mode: 'ionian', meter: 3, swing: 0.25,
  progressions: { A: [1, 4, 0, 0], B: [5, 1, 4, 0] },
  form: [
    { s: 'A', e: 0.3 }, { s: 'A', e: 0.5 }, { s: 'B', e: 0.6 }, { s: 'A', e: 0.7, up: true },
    { s: 'B', e: 0.7 }, { s: 'A', e: 0.55 }, { s: 'B', e: 0.5 }, { s: 'A', e: 0.35 },
  ],
  chordSize: 4, chord: 'piano', comp: { steps: [0, 6], len: 4 },
  bass: 'upright', bassPat: [[0, 'r', 4], [4, 'f', 4], [8, 'f', 4]],
  lead: 'clarinet', melody: { lens: [2, 3, 4, 6], rest: 0.25, lo: 0, hi: 9 },
  kit: 'brush', drums: { k: 'o...o...o...', s: '..o...o...o.', o: 'x.x.x.x.x.x.' },
  texture: 'vinyl', pump: 0.08, reverb: 2.8, echo: '8n',
};

const FOUR_HUNDRED_PAGES: SongSpec = {
  title: 'Four Hundred Pages on Dandelions', artist: 'Juniper Vance (vocals, reluctantly)',
  bpm: 116, tonic: 55, mode: 'ionian', meter: 4, swing: 0,
  progressions: { A: [0, 1, 4, 0], B: [5, 1, 4, 0] },
  form: [
    { s: 'A', e: 0.35 }, { s: 'A', e: 0.5 }, { s: 'B', e: 0.6 }, { s: 'A', e: 0.65, up: true },
    { s: 'A', e: 0.6 }, { s: 'B', e: 0.55 }, { s: 'A', e: 0.45 }, { s: 'A', e: 0.3 },
  ],
  chordSize: 4, chord: 'nylon', comp: { steps: [2, 6, 10, 14], len: 2 },
  bass: 'upright', bassPat: [[0, 'r', 4], [6, 'f', 2], [8, 't', 4], [12, 'f', 4]],
  lead: 'flute', melody: { lens: [2, 4, 4, 6], rest: 0.3, lo: 2, hi: 9 },
  kit: 'soft', drums: { k: 'o...o...o...o...', s: '....o.......o...', h: 'x.x.x.x.x.x.x.x.' },
  texture: 'vinyl', pump: 0.05, reverb: 2.4, echo: '8n.',
};

const ROUND_PEBBLES: SongSpec = {
  title: 'Round Pebbles', artist: 'The Gravel Quintet',
  bpm: 78, tonic: 50, mode: 'dorian', meter: 4, swing: 0.22,
  progressions: { A: [0, 3, 0, 3], B: [6, 4, 3, 0] },
  form: [
    { s: 'A', e: 0.3 }, { s: 'A', e: 0.45 }, { s: 'B', e: 0.6 }, { s: 'A', e: 0.6 },
    { s: 'B', e: 0.55 }, { s: 'A', e: 0.4 }, { s: 'B', e: 0.3 },
  ],
  chordSize: 4, chord: 'organ', comp: { steps: [0, 8], len: 8 },
  bass: 'sub', bassPat: [[0, 'r', 8], [8, 'f', 8]],
  lead: 'vibes', melody: { lens: [4, 4, 8, 8], rest: 0.3, lo: 1, hi: 9 },
  kit: 'brush', drums: { k: 'o...o...o...o...', s: '....o.......o...', o: 'x...x.x.x...x.x.' },
  texture: 'vinyl', pump: 0.12, reverb: 3.0, echo: '4n.',
};

const SMOOTH_TRIM: SongSpec = {
  title: 'Smooth Trim', artist: 'Obsidian Brass',
  bpm: 110, tonic: 56, mode: 'mixolydian', meter: 4, swing: 0.28,
  progressions: { A: [1, 4, 0, 0], B: [5, 4, 3, 0] },
  form: [
    { s: 'A', e: 0.3 }, { s: 'B', e: 0.5 }, { s: 'A', e: 0.6 }, { s: 'B', e: 0.75, up: true },
    { s: 'A', e: 0.7 }, { s: 'B', e: 0.6 }, { s: 'A', e: 0.5 }, { s: 'B', e: 0.35 },
  ],
  chordSize: 4, chord: 'rhodes', comp: { steps: [0, 6, 10], len: 4 },
  bass: 'upright', bassPat: [[0, 'r', 4], [4, 't', 4], [8, 'f', 4], [12, 'a', 4]],
  lead: 'vibes', melody: { lens: [2, 4, 4, 6, 8], rest: 0.2, lo: 0, hi: 9 },
  kit: 'brush', drums: { k: 'o.......o.......', s: '....o.......o...', o: 'x...x.x.x...x.x.' },
  texture: 'vinyl', pump: 0.1, reverb: 2.8, echo: '8n.',
};

const CLIPBOARD_BLUES: SongSpec = {
  title: 'Clipboard Blues', artist: 'Reginald "Quarter-Inch" Vance',
  bpm: 96, tonic: 45, mode: 'mixolydian', meter: 4, swing: 0.25,
  progressions: { A: [0, 3, 0, 4], B: [3, 6, 0, 0] },
  form: [
    { s: 'A', e: 0.3 }, { s: 'A', e: 0.5 }, { s: 'B', e: 0.6, up: true }, { s: 'A', e: 0.7 },
    { s: 'B', e: 0.65 }, { s: 'A', e: 0.5 }, { s: 'B', e: 0.35 },
  ],
  chordSize: 4, chord: 'piano', comp: { steps: [0, 6, 8, 14], len: 4 },
  bass: 'upright', bassPat: [[0, 'r', 4], [4, 'f', 4], [8, 'o', 4], [12, 'a', 4]],
  lead: 'sax', melody: { lens: [2, 2, 4, 6, 8], rest: 0.25, lo: 0, hi: 9 },
  kit: 'brush', drums: { k: 'o...o...o...o...', s: '....o.......o...', o: 'x...x.x.x...x.x.' },
  texture: 'vinyl', pump: 0.08, reverb: 2.2, echo: '4n.',
};

const PERMIT_TO_HUM: SongSpec = {
  title: 'Permit to Hum', artist: 'The Municipal Strings',
  bpm: 72, tonic: 48, mode: 'aeolian', meter: 4, swing: 0.05,
  progressions: { A: [0, 5, 3, 4], B: [5, 6, 4, 0] },
  form: [
    { s: 'A', e: 0.25 }, { s: 'A', e: 0.4 }, { s: 'B', e: 0.55, up: true },
    { s: 'A', e: 0.45 }, { s: 'B', e: 0.4 }, { s: 'B', e: 0.3 },
  ],
  chordSize: 4, chord: 'piano', comp: { steps: [0, 8], len: 8 }, pad: true,
  bass: 'upright', bassPat: [[0, 'r', 8], [8, 'f', 8]],
  lead: 'clarinet', melody: { lens: [4, 4, 8, 8], rest: 0.3, lo: 2, hi: 9 },
  kit: 'soft', drums: { k: 'o...o...o...o...', s: '....o.......o...', h: 'o.o.o.o.o.o.o.o.' },
  texture: 'vinyl', pump: 0.05, reverb: 3.2, echo: '4n.',
};

const LAST_THURSDAY_IN_BEIGE: SongSpec = {
  title: 'Last Thursday in Beige', artist: 'Cress Caliper',
  bpm: 100, tonic: 51, mode: 'dorian', meter: 4, swing: 0.25,
  progressions: { A: [0, 3, 1, 4], B: [2, 3, 4, 0] },
  form: [
    { s: 'A', e: 0.3 }, { s: 'B', e: 0.5 }, { s: 'A', e: 0.6 }, { s: 'A', e: 0.65, up: true },
    { s: 'B', e: 0.7 }, { s: 'A', e: 0.55 }, { s: 'B', e: 0.45 }, { s: 'B', e: 0.3 },
  ],
  chordSize: 4, chord: 'organ', comp: { steps: [0, 8], len: 8 },
  bass: 'sub', bassPat: [[0, 'r', 4], [4, 'r', 4], [8, 'f', 4], [12, 'r', 4]],
  lead: 'flute', melody: { lens: [2, 4, 4, 6], rest: 0.25, lo: 1, hi: 9 },
  kit: 'brush', drums: { k: 'o...o...o...o...', s: '....o.......o...', o: 'x...x.x.x...x.x.' },
  texture: 'vinyl', pump: 0.08, reverb: 2.4, echo: '8n',
};

const SETBACK_LOUNGE: SongSpec = {
  title: 'Setback Lounge', artist: 'Juniper Vance',
  bpm: 124, tonic: 49, mode: 'ionian', meter: 4, swing: 0.2,
  progressions: { A: [0, 3, [1, 4], 0], B: [5, 2, [1, 4], 0] },
  form: [
    { s: 'A', e: 0.35 }, { s: 'A', e: 0.55 }, { s: 'B', e: 0.6 }, { s: 'A', e: 0.75, up: true },
    { s: 'B', e: 0.6 }, { s: 'A', e: 0.6 }, { s: 'B', e: 0.5 }, { s: 'A', e: 0.35 },
  ],
  chordSize: 4, chord: 'rhodes', comp: { steps: [0, 6, 10], len: 4 },
  bass: 'upright', bassPat: [[0, 'r', 4], [4, 't', 4], [8, 'f', 4], [12, 'a', 4]],
  lead: 'clarinet', melody: { lens: [2, 2, 4, 6, 8], rest: 0.15, lo: 0, hi: 9 },
  kit: 'brush', drums: { k: 'o.......o.......', s: '....o.......o...', o: 'x...x.x.x...x.x.' },
  texture: 'vinyl', pump: 0.12, reverb: 2.8, echo: '4n',
};

const VARIANCE_REQUEST: SongSpec = {
  title: 'Variance Request', artist: 'The Thorne Lawn Trio',
  bpm: 86, tonic: 54, mode: 'harmonic', meter: 4, swing: 0.2,
  progressions: { A: [0, 3, 4, 0], B: [0, 5, 3, 4] },
  form: [
    { s: 'A', e: 0.35 }, { s: 'B', e: 0.5 }, { s: 'A', e: 0.6 }, { s: 'B', e: 0.7, up: true },
    { s: 'A', e: 0.55 }, { s: 'A', e: 0.35 },
  ],
  chordSize: 4, chord: 'nylon', comp: { steps: [0, 6, 8], len: 4, arp: true },
  bass: 'sub', bassPat: [[0, 'r', 4], [4, 'f', 4], [8, 'r', 4], [12, 'o', 4]],
  lead: 'vibes', melody: { lens: [2, 4, 4, 8], rest: 0.25, lo: 1, hi: 9 },
  kit: 'brush', drums: { k: 'o...o...o...o...', s: '....o.......o...', o: 'x...x.x.x...x.x.' },
  texture: 'none', pump: 0.1, reverb: 3.0, echo: '8n.',
};

const CUL_DE_SAC_SUNDAY: SongSpec = {
  title: 'Cul-de-Sac Sunday', artist: 'Cress Caliper & Friends',
  bpm: 84, tonic: 43, mode: 'ionian', meter: 4, swing: 0.22,
  progressions: { A: [3, 2, [1, 4], 0], B: [0, 3, [5, 4], 0] },
  form: [
    { s: 'A', e: 0.3 }, { s: 'B', e: 0.45 }, { s: 'A', e: 0.55 }, { s: 'B', e: 0.6, up: true },
    { s: 'A', e: 0.5 }, { s: 'B', e: 0.4 }, { s: 'A', e: 0.3 },
  ],
  chordSize: 4, chord: 'piano', comp: { steps: [0, 6, 12], len: 4 }, pad: true,
  bass: 'upright', bassPat: [[0, 'r', 4], [4, 't', 4], [8, 'f', 4], [12, 'a', 4]],
  lead: 'vibes', melody: { lens: [2, 4, 6, 8], rest: 0.3, lo: 2, hi: 10 },
  kit: 'soft', drums: { k: 'o...o...o...o...', s: '....o.......o...', h: 'o.o.o.o.o.o.o.o.' },
  texture: 'vinyl', pump: 0.05, reverb: 3.2, echo: '4n.',
};

const BYLAW_SWAY: SongSpec = {
  title: 'Bylaw Sway', artist: 'Obsidian Brass',
  bpm: 88, tonic: 47, mode: 'dorian', meter: 4, swing: 0.2,
  progressions: { A: [0, 1, 3, 0], B: [0, 6, 3, 4] },
  form: [
    { s: 'A', e: 0.35 }, { s: 'B', e: 0.5 }, { s: 'A', e: 0.6 }, { s: 'B', e: 0.75, up: true },
    { s: 'A', e: 0.6 }, { s: 'A', e: 0.35 },
  ],
  chordSize: 4, chord: 'rhodes', comp: { steps: [0, 6, 10], len: 4 },
  bass: 'sub', bassPat: [[0, 'r', 8], [8, 'f', 4], [12, 'o', 4]],
  lead: 'flute', melody: { lens: [4, 4, 8, 8], rest: 0.3, lo: 2, hi: 9 },
  kit: 'soft', drums: { k: 'o...o...o...o...', s: '....o.......o...', h: 'x.x.x.x.x.x.x.x.' },
  texture: 'vinyl', pump: 0.05, reverb: 2.0, echo: '8n',
};

export const BEATS_SONGS: readonly SongSpec[] = [
  VERGE_WALK,
  COMPLIANCE_WALTZ,
  FOUR_HUNDRED_PAGES,
  ROUND_PEBBLES,
  SMOOTH_TRIM,
  CLIPBOARD_BLUES,
  PERMIT_TO_HUM,
  LAST_THURSDAY_IN_BEIGE,
  SETBACK_LOUNGE,
  VARIANCE_REQUEST,
  CUL_DE_SAC_SUNDAY,
  BYLAW_SWAY,
];

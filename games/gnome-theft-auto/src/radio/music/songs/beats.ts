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

/** A placeholder until the song gets its own spec: the first song's music under another title. */
const stub = (title: string, artist: string): SongSpec => ({ ...VERGE_WALK, title, artist });

export const BEATS_SONGS: readonly SongSpec[] = [
  VERGE_WALK,
  stub('Compliance Waltz', 'Cress Caliper & Friends'),
  stub('Four Hundred Pages on Dandelions', 'Juniper Vance (vocals, reluctantly)'),
  stub('Round Pebbles', 'The Gravel Quintet'),
  stub('Smooth Trim', 'Obsidian Brass'),
  stub('Clipboard Blues', 'Reginald "Quarter-Inch" Vance'),
  stub('Permit to Hum', 'The Municipal Strings'),
  stub('Last Thursday in Beige', 'Cress Caliper'),
];

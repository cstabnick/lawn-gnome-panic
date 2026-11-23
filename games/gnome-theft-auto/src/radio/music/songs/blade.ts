// 99.3 The Blade: mower rock through a big-beat mixer. Driven power chords or brass stabs, a picked or acid bass, a
// hard break, a lead guitar or a whistle on top. Major-ish and bluesy modes (mixolydian, dorian, aeolian, ionian),
// 96-160 bpm. One SongSpec per song; the order is the order on the dial's playlist.
import type { SongSpec } from '../spec';

const BORN_TO_BE_MOWED: SongSpec = {
  title: 'Born to Be Mowed', artist: 'Lou & the Gravel Boys',
  bpm: 124, tonic: 52, mode: 'mixolydian', meter: 4, swing: 0.04,
  progressions: { A: [0, 6, 3, 0], B: [5, 3, 6, 0] },
  form: [
    { s: 'A', e: 0.25 }, { s: 'A', e: 0.5 }, { s: 'B', e: 0.7 }, { s: 'A', e: 0.85 },
    { s: 'A', e: 0.4, brk: true }, { s: 'B', e: 1, up: true }, { s: 'A', e: 0.9 }, { s: 'A', e: 0.6 },
  ],
  chordSize: 3, chord: 'crunch', comp: { steps: [0, 3, 6, 10, 12], len: 2 },
  bass: 'picked', bassPat: [[0, 'r', 3], [3, 'r', 1], [6, 'o', 2], [8, 'r', 3], [11, 'f', 1], [14, 'a', 2]],
  lead: 'guitar', melody: { lens: [2, 2, 4, 4, 6], rest: 0.15, lo: 0, hi: 9 },
  kit: 'break', drums: { k: 'x.....x...x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '..............x.' },
  texture: 'none', pump: 0.35, reverb: 1.6, echo: '8n.',
};

/** A placeholder until the song gets its own spec: the first song's music under another title. */
const stub = (title: string, artist: string): SongSpec => ({ ...BORN_TO_BE_MOWED, title, artist });

export const BLADE_SONGS: readonly SongSpec[] = [
  BORN_TO_BE_MOWED,
  stub('Don\'t Mow My Baby Down', 'The Velvet Toadstools'),
  stub('Two-Stroke Heart', 'Dock Hoewright & the Pull Cords'),
  stub('Zero-Turn Me Round', 'The Greenhouse Strip Five'),
  stub('Kiln-Born Blues', 'Hob & the Glaze'),
  stub('Leaf-Blower Lullaby', 'The Velvet Toadstools'),
  stub('Sprinkler Scare', 'Burnet Gravelwright'),
  stub('Hat On, Engine Off', 'Ivy Snailwood'),
];

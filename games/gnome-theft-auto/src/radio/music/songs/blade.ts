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

const DONT_MOW_MY_BABY_DOWN: SongSpec = {
  title: 'Don\'t Mow My Baby Down', artist: 'The Velvet Toadstools',
  bpm: 98, tonic: 45, mode: 'aeolian', meter: 4, swing: 0,
  progressions: { A: [0, 6, 5, 6], B: [0, 2, 3, 0] },
  form: [
    { s: 'A', e: 0.25 }, { s: 'A', e: 0.5 }, { s: 'B', e: 0.7 }, { s: 'A', e: 0.9 },
    { s: 'A', e: 0.4, brk: true }, { s: 'B', e: 1, up: true }, { s: 'A', e: 0.8 }, { s: 'B', e: 0.6 },
  ],
  chordSize: 3, chord: 'organ', comp: { steps: [0, 8], len: 8 },
  bass: 'picked', bassPat: [[0, 'r', 3], [4, 'r', 2], [8, 'f', 2], [12, 'o', 2], [14, 'r', 2]],
  lead: 'none', melody: { lens: [2, 4, 4, 6], rest: 0.3, lo: 0, hi: 7 },
  kit: 'rock', drums: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  texture: 'vinyl', pump: 0.3, reverb: 2, echo: '4n.',
};

const TWO_STROKE_HEART: SongSpec = {
  title: 'Two-Stroke Heart', artist: 'Dock Hoewright & the Pull Cords',
  bpm: 150, tonic: 50, mode: 'dorian', meter: 4, swing: 0.06,
  progressions: { A: [0, 3, 0, 3], B: [0, 6, 3, 0] },
  form: [
    { s: 'A', e: 0.3 }, { s: 'A', e: 0.55 }, { s: 'B', e: 0.75 }, { s: 'A', e: 0.9 },
    { s: 'A', e: 0.4, brk: true }, { s: 'B', e: 1, up: true }, { s: 'A', e: 0.8 }, { s: 'B', e: 0.6 },
  ],
  chordSize: 3, chord: 'brass', comp: { steps: [0, 3, 6, 8, 11, 14], len: 1 },
  bass: 'acid', bassPat: [[0, 'r', 2], [2, 'o', 1], [4, 'r', 2], [6, 'f', 1], [8, 'r', 2], [10, 'o', 1], [12, 'a', 3]],
  lead: 'whistle', melody: { lens: [1, 2, 2, 4], rest: 0.2, lo: 0, hi: 9 },
  kit: 'break', drums: { k: 'x..x..x...x.....', s: '..o.x...o.x.o...', h: 'x.x.x.x.x.x.x.x.' },
  texture: 'none', pump: 0.4, reverb: 1.4, echo: '8n',
};

const ZERO_TURN_ME_ROUND: SongSpec = {
  title: 'Zero-Turn Me Round', artist: 'The Greenhouse Strip Five',
  bpm: 136, tonic: 55, mode: 'ionian', meter: 4, swing: 0.02,
  progressions: { A: [0, 4, 5, 3], B: [0, 3, 4, 0] },
  form: [
    { s: 'A', e: 0.3 }, { s: 'A', e: 0.55 }, { s: 'B', e: 0.7 }, { s: 'A', e: 0.85 },
    { s: 'A', e: 0.4, brk: true }, { s: 'B', e: 1 }, { s: 'A', e: 0.9 }, { s: 'B', e: 0.6 },
  ],
  chordSize: 3, chord: 'crunch', comp: { steps: [0, 6, 8, 14], len: 2 },
  bass: 'picked', bassPat: [[0, 'r', 2], [2, 'r', 1], [4, 'f', 2], [8, 'r', 2], [10, 'o', 2], [12, 't', 2], [14, 'a', 2]],
  lead: 'sax', melody: { lens: [2, 2, 4, 4], rest: 0.2, lo: 0, hi: 9 },
  kit: 'rock', drums: { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '..............x.' },
  texture: 'tape', pump: 0.3, reverb: 1.8, echo: '4n',
};

const KILN_BORN_BLUES: SongSpec = {
  title: 'Kiln-Born Blues', artist: 'Hob & the Glaze',
  bpm: 110, tonic: 48, mode: 'mixolydian', meter: 4, swing: 0.08,
  progressions: { A: [0, 1, 3, 0], B: [4, 3, 0, 0] },
  form: [
    { s: 'A', e: 0.25 }, { s: 'A', e: 0.45 }, { s: 'B', e: 0.65 }, { s: 'A', e: 0.8 },
    { s: 'A', e: 0.4, brk: true }, { s: 'B', e: 0.95, up: true }, { s: 'A', e: 0.85 }, { s: 'B', e: 0.6 },
  ],
  chordSize: 4, chord: 'organ', comp: { steps: [0, 4, 8, 12], len: 4 },
  bass: 'sub', bassPat: [[0, 'r', 4], [4, 'f', 2], [8, 'r', 4], [12, 't', 2], [14, 'o', 2]],
  lead: 'guitar', melody: { lens: [2, 2, 4, 6], rest: 0.25, lo: 0, hi: 8 },
  kit: 'break', drums: { k: 'x.....x.x.....x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  texture: 'vinyl', pump: 0.4, reverb: 2.2, echo: '8n.',
};

const LEAF_BLOWER_LULLABY: SongSpec = {
  title: 'Leaf-Blower Lullaby', artist: 'The Velvet Toadstools',
  bpm: 96, tonic: 54, mode: 'dorian', meter: 4, swing: 0.1,
  progressions: { A: [0, 3, 0, 4], B: [0, 6, 1, 0] },
  form: [
    { s: 'A', e: 0.3 }, { s: 'A', e: 0.5 }, { s: 'B', e: 0.7 }, { s: 'A', e: 0.8 },
    { s: 'A', e: 0.4, brk: true }, { s: 'B', e: 0.95, up: true }, { s: 'A', e: 0.85 }, { s: 'B', e: 0.6 },
  ],
  chordSize: 3, chord: 'brass', comp: { steps: [0, 6, 10], len: 2 },
  bass: 'picked', bassPat: [[0, 'r', 3], [6, 'f', 2], [10, 'o', 2]],
  lead: 'whistle', melody: { lens: [2, 4, 4, 6], rest: 0.3, lo: 0, hi: 8 },
  kit: 'break', drums: { k: 'x.......x.......', s: '........x.......', h: '..x...x...x...x.' },
  texture: 'air', pump: 0.2, reverb: 1.9, echo: '4n.',
};

const SPRINKLER_SCARE: SongSpec = {
  title: 'Sprinkler Scare', artist: 'Burnet Gravelwright',
  bpm: 116, tonic: 57, mode: 'aeolian', meter: 4, swing: 0.05,
  progressions: { A: [0, 5, 6, 0], B: [0, 2, 4, 0] },
  form: [
    { s: 'A', e: 0.25 }, { s: 'A', e: 0.45 }, { s: 'B', e: 0.7 }, { s: 'A', e: 0.9 },
    { s: 'A', e: 0.4, brk: true }, { s: 'B', e: 1, up: true }, { s: 'A', e: 0.8 }, { s: 'B', e: 0.55 },
  ],
  chordSize: 3, chord: 'brass', comp: { steps: [0, 3, 8, 11], len: 1 },
  bass: 'acid', bassPat: [[0, 'r', 2], [3, 'r', 1], [6, 'o', 2], [8, 'r', 2], [11, 'a', 1], [14, 'f', 2]],
  lead: 'none', melody: { lens: [2, 2, 4], rest: 0.4, lo: 0, hi: 7 },
  kit: 'break', drums: { k: 'x.x.....x.x.....', s: '....x.......x.x.', h: 'x.x.x.x.x.x.x.x.' },
  texture: 'tape', pump: 0.45, reverb: 1.2, echo: '8n',
};

const HAT_ON_ENGINE_OFF: SongSpec = {
  title: 'Hat On, Engine Off', artist: 'Ivy Snailwood',
  bpm: 144, tonic: 47, mode: 'ionian', meter: 4, swing: 0,
  progressions: { A: [0, 5, 3, 4], B: [5, 3, 4, 0] },
  form: [
    { s: 'A', e: 0.3 }, { s: 'A', e: 0.5 }, { s: 'A', e: 0.7 }, { s: 'B', e: 0.8 },
    { s: 'A', e: 0.35, brk: true }, { s: 'B', e: 1, up: true }, { s: 'A', e: 0.85 }, { s: 'B', e: 0.6 },
  ],
  chordSize: 3, chord: 'crunch', comp: { steps: [0, 4, 8, 12], len: 2 },
  bass: 'acid', bassPat: [[0, 'r', 3], [3, 'f', 1], [4, 'r', 3], [8, 'o', 2], [11, 'r', 2], [14, 'a', 2]],
  lead: 'clarinet', melody: { lens: [2, 2, 4, 4, 6], rest: 0.15, lo: 0, hi: 9 },
  kit: 'rock', drums: { k: 'x...x.......x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: 'o.o.o.o.o.o.o.o.' },
  texture: 'none', pump: 0.35, reverb: 1.5, echo: '8n.',
};

const THATCH_ATTACK: SongSpec = {
  title: 'Thatch Attack', artist: 'Lou & the Gravel Boys',
  bpm: 130, tonic: 53, mode: 'mixolydian', meter: 4, swing: 0.06,
  progressions: { A: [0, 1, 6, 3], B: [3, 4, 5, 0] },
  form: [
    { s: 'A', e: 0.3 }, { s: 'A', e: 0.55 }, { s: 'B', e: 0.75 }, { s: 'A', e: 0.9 },
    { s: 'A', e: 0.4, brk: true }, { s: 'B', e: 1, up: true }, { s: 'A', e: 0.8 }, { s: 'B', e: 0.6 },
  ],
  chordSize: 3, chord: 'crunch', comp: { steps: [0, 2, 6, 8, 14], len: 2 },
  bass: 'acid', bassPat: [[0, 'r', 2], [2, 'f', 2], [6, 'o', 2], [8, 'r', 2], [12, 't', 2], [14, 'a', 2]],
  lead: 'guitar', melody: { lens: [1, 2, 2, 4, 4], rest: 0.1, lo: 0, hi: 9 },
  kit: 'break', drums: { k: 'x..x....x...x...', s: '....x.......x.o.', h: 'x.x.x.x.x.x.x.x.' },
  texture: 'none', pump: 0.4, reverb: 1.6, echo: '8n.',
};

const MULCH_ADO_ABOUT_NOTHING: SongSpec = {
  title: 'Mulch Ado About Nothing', artist: 'The Greenhouse Strip Five',
  bpm: 104, tonic: 49, mode: 'dorian', meter: 4, swing: 0.03,
  progressions: { A: [0, 3, 1, 4], B: [2, 3, 0, 0] },
  form: [
    { s: 'A', e: 0.3 }, { s: 'A', e: 0.5 }, { s: 'B', e: 0.7 }, { s: 'A', e: 0.8 },
    { s: 'A', e: 0.4, brk: true }, { s: 'B', e: 0.95, up: true }, { s: 'A', e: 0.85 }, { s: 'B', e: 0.6 },
  ],
  chordSize: 3, chord: 'organ', comp: { steps: [0, 8], len: 6 },
  bass: 'picked', bassPat: [[0, 'r', 4], [4, 'r', 2], [8, 'f', 2], [10, 'o', 2], [12, 't', 2], [14, 'r', 2]],
  lead: 'sax', melody: { lens: [2, 2, 4], rest: 0.2, lo: 0, hi: 9 },
  kit: 'rock', drums: { k: 'x.x.....x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  texture: 'vinyl', pump: 0.25, reverb: 2, echo: '8n',
};

const EDGER_THAN_THOU: SongSpec = {
  title: 'Edger Than Thou', artist: 'Dock Hoewright & the Pull Cords',
  bpm: 142, tonic: 46, mode: 'mixolydian', meter: 4, swing: 0.04,
  progressions: { A: [0, 4, 6, 3], B: [5, 4, 3, 0] },
  form: [
    { s: 'A', e: 0.3 }, { s: 'B', e: 0.5 }, { s: 'A', e: 0.7 }, { s: 'A', e: 0.8 },
    { s: 'B', e: 0.4, brk: true }, { s: 'A', e: 0.95, up: true }, { s: 'A', e: 0.85 }, { s: 'B', e: 0.6 },
  ],
  chordSize: 3, chord: 'brass', comp: { steps: [0, 4, 6, 12], len: 1 },
  bass: 'sub', bassPat: [[0, 'r', 4], [4, 'f', 4], [8, 'r', 4], [12, 'o', 2], [14, 't', 2]],
  lead: 'guitar', melody: { lens: [2, 2, 4, 6], rest: 0.2, lo: 0, hi: 9 },
  kit: 'break', drums: { k: 'x..x..x...x.x...', s: '....x..o....x..o', h: 'x.x.x.x.x.x.x.x.' },
  texture: 'none', pump: 0.35, reverb: 1.5, echo: '4n.',
};

const HEDGE_YOUR_BETS: SongSpec = {
  title: 'Hedge Your Bets', artist: 'Hob & the Glaze',
  bpm: 128, tonic: 51, mode: 'aeolian', meter: 4, swing: 0,
  progressions: { A: [0, 2, 5, 4], B: [3, 6, 5, 0] },
  form: [
    { s: 'A', e: 0.25 }, { s: 'A', e: 0.5 }, { s: 'B', e: 0.7 }, { s: 'A', e: 0.9 },
    { s: 'A', e: 0.4, brk: true }, { s: 'B', e: 1, up: true }, { s: 'A', e: 0.8 }, { s: 'B', e: 0.6 },
  ],
  chordSize: 3, chord: 'crunch', comp: { steps: [0, 2, 4, 6, 8, 10, 12, 14], len: 1 },
  bass: 'sub', bassPat: [[0, 'r', 4], [4, 'r', 4], [8, 'f', 4], [12, 'o', 4]],
  lead: 'none', melody: { lens: [2, 4], rest: 0.5, lo: 0, hi: 7 },
  kit: 'rock', drums: { k: 'x...x...x...x...', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' },
  texture: 'none', pump: 0.5, reverb: 1, echo: '8n.',
};

export const BLADE_SONGS: readonly SongSpec[] = [
  BORN_TO_BE_MOWED,
  DONT_MOW_MY_BABY_DOWN,
  TWO_STROKE_HEART,
  ZERO_TURN_ME_ROUND,
  KILN_BORN_BLUES,
  LEAF_BLOWER_LULLABY,
  SPRINKLER_SCARE,
  HAT_ON_ENGINE_OFF,
  THATCH_ATTACK,
  MULCH_ADO_ABOUT_NOTHING,
  EDGER_THAN_THOU,
  HEDGE_YOUR_BETS,
];

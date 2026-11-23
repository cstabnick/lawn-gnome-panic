// 88.7 Fescue Public Radio: slow, careful and a little sad. Music boxes, strings, a soft piano or a nylon guitar, a
// flute or a bell for the tune, a round sub bass, felt drums or none, tape hiss. Waltzes and slow 4/4 at 56-96 bpm in
// ionian, lydian, dorian and aeolian. One SongSpec per song; the order is the order on the dial's playlist.
import type { SongSpec } from '../spec';

const RAIN_ON_TERRACOTTA: SongSpec = {
  title: 'Rain on Terracotta, Part One', artist: 'Fescue Public Radio Ambience Dept.',
  bpm: 68, tonic: 53, mode: 'lydian', meter: 3, swing: 0,
  progressions: { A: [0, 1, 0, 5], B: [5, 4, 1, 0] },
  form: [
    { s: 'A', e: 0.15 }, { s: 'A', e: 0.35 }, { s: 'B', e: 0.5 }, { s: 'A', e: 0.6 },
    { s: 'B', e: 0.45 }, { s: 'A', e: 0.65, up: true }, { s: 'B', e: 0.5 }, { s: 'B', e: 0.2 },
  ],
  chordSize: 3, chord: 'musicBox', comp: { steps: [0, 2, 4, 6, 8, 10], len: 3, arp: true }, pad: true,
  bass: 'sub', bassPat: [[0, 'r', 12]],
  lead: 'flute', melody: { lens: [4, 6, 8, 12], rest: 0.2, lo: 2, hi: 9 },
  kit: 'soft', drums: { k: 'o...........', h: '....o...o...' },
  texture: 'tape', pump: 0, reverb: 4.5, echo: '4n',
};

const FENCE_CREAKS_IN_B_MINOR: SongSpec = {
  title: 'The Fence Creaks in B Minor', artist: 'Sorrel Tillbrook (recorded at the gap)',
  bpm: 60, tonic: 47, mode: 'aeolian', meter: 4, swing: 0,
  progressions: { A: [0, 5, 2, 6], B: [0, 2, 3, 0] },
  form: [
    { s: 'A', e: 0.1 }, { s: 'A', e: 0.3 }, { s: 'B', e: 0.45 }, { s: 'A', e: 0.6 },
    { s: 'B', e: 0.5, up: true }, { s: 'A', e: 0.4 }, { s: 'B', e: 0.15 },
  ],
  chordSize: 3, chord: 'strings', comp: { steps: [0, 8], len: 8 }, pad: true,
  bass: 'sub', bassPat: [[0, 'r', 8], [8, 'f', 8]],
  lead: 'clarinet', melody: { lens: [4, 8], rest: 0.3, lo: 2, hi: 7 },
  kit: 'none', drums: {},
  texture: 'tape', pump: 0, reverb: 5, echo: '4n.',
};

const KILN_HYMN: SongSpec = {
  title: 'Kiln Hymn for a Grey Afternoon', artist: 'The Mossy Wood Choir',
  bpm: 80, tonic: 50, mode: 'ionian', meter: 3, swing: 0,
  progressions: { A: [0, 5, 3, 4], B: [3, 4, 1, 0] },
  form: [
    { s: 'A', e: 0.15 }, { s: 'A', e: 0.35 }, { s: 'B', e: 0.5 }, { s: 'A', e: 0.6 },
    { s: 'B', e: 0.45, up: true }, { s: 'B', e: 0.2 },
  ],
  chordSize: 4, chord: 'piano', comp: { steps: [0, 4, 8], len: 4 }, pad: true,
  bass: 'upright', bassPat: [[0, 'r', 4], [4, 'f', 4], [8, 'f', 4]],
  lead: 'bell', melody: { lens: [4, 6, 8], rest: 0.25, lo: 2, hi: 8 },
  kit: 'soft', drums: { k: 'o...........', h: '....o.......' },
  texture: 'air', pump: 0, reverb: 4, echo: '4n',
};

const GNORWINS_LEDGER: SongSpec = {
  title: 'Gnorwin\'s Ledger, Page Nine', artist: 'Read by the Pipewrights\' Youth Band',
  bpm: 96, tonic: 55, mode: 'dorian', meter: 4, swing: 0.1,
  progressions: { A: [0, 3, 0, 4], B: [0, 6, 2, 0] },
  form: [
    { s: 'A', e: 0.1 }, { s: 'A', e: 0.25 }, { s: 'B', e: 0.4 }, { s: 'A', e: 0.55 },
    { s: 'B', e: 0.6, up: true }, { s: 'A', e: 0.6 }, { s: 'B', e: 0.5 }, { s: 'A', e: 0.3 }, { s: 'B', e: 0.15 },
  ],
  chordSize: 3, chord: 'musicBox', comp: { steps: [0, 2, 4, 6, 8, 10, 12, 14], len: 3, arp: true },
  bass: 'sub', bassPat: [[0, 'r', 8], [8, 'o', 4], [12, 'f', 4]],
  lead: 'whistle', melody: { lens: [4, 8], rest: 0.3, lo: 3, hi: 9 },
  kit: 'soft', drums: { k: 'o.......o.......', h: '..o...o...o...o.' },
  texture: 'air', pump: 0, reverb: 5.5, echo: '8n.',
};

const LULLABY_FOR_A_LAWN: SongSpec = {
  title: 'Lullaby for a Lawn Left Alone', artist: 'Ivy Snailwood',
  bpm: 56, tonic: 45, mode: 'ionian', meter: 3, swing: 0,
  progressions: { A: [0, 5, 1, 4], B: [3, 0, 5, 0] },
  form: [
    { s: 'A', e: 0.1 }, { s: 'A', e: 0.3 }, { s: 'B', e: 0.4 }, { s: 'A', e: 0.5 },
    { s: 'B', e: 0.3 }, { s: 'B', e: 0.1 },
  ],
  chordSize: 3, chord: 'musicBox', comp: { steps: [0, 3, 6, 9], len: 3, arp: true }, pad: true,
  bass: 'sub', bassPat: [[0, 'r', 12]],
  lead: 'none', melody: { lens: [4, 8], rest: 0.5, lo: 2, hi: 7 },
  kit: 'soft', drums: { k: 'o...........', h: '....o...o...' },
  texture: 'tape', pump: 0, reverb: 4.5, echo: '4n',
};

const STOPPING_STONE_WALTZ: SongSpec = {
  title: 'Stopping Stone Waltz', artist: 'The Unmowed Strings',
  bpm: 84, tonic: 52, mode: 'dorian', meter: 3, swing: 0,
  progressions: { A: [0, 3, 4, 0], B: [0, 6, 3, 0] },
  form: [
    { s: 'A', e: 0.15 }, { s: 'A', e: 0.3 }, { s: 'B', e: 0.45 }, { s: 'A', e: 0.6 },
    { s: 'B', e: 0.4, up: true }, { s: 'A', e: 0.5 }, { s: 'B', e: 0.3 }, { s: 'A', e: 0.15 },
  ],
  chordSize: 3, chord: 'strings', comp: { steps: [0, 6], len: 12 }, pad: true,
  bass: 'upright', bassPat: [[0, 'r', 4], [4, 'f', 4], [8, 'f', 4]],
  lead: 'flute', melody: { lens: [6, 8, 12], rest: 0.2, lo: 2, hi: 8 },
  kit: 'soft', drums: { k: 'o...........', h: '..o...o...o.' },
  texture: 'air', pump: 0, reverb: 5, echo: '4n.',
};

const CLOVERFIELD_AT_DUSK: SongSpec = {
  title: 'Cloverfield at Dusk', artist: 'Clay Pot Quartet',
  bpm: 72, tonic: 48, mode: 'ionian', meter: 4, swing: 0,
  progressions: { A: [0, 1, 4, 0], B: [5, 3, 0, 4] },
  form: [
    { s: 'A', e: 0.1 }, { s: 'A', e: 0.25 }, { s: 'B', e: 0.4 }, { s: 'A', e: 0.5 },
    { s: 'B', e: 0.6, up: true }, { s: 'A', e: 0.55 }, { s: 'B', e: 0.4 }, { s: 'A', e: 0.2 },
  ],
  chordSize: 4, chord: 'nylon', comp: { steps: [0, 4, 8, 12], len: 4, arp: true },
  bass: 'upright', bassPat: [[0, 'r', 4], [4, 'f', 4], [8, 'o', 4], [12, 'a', 4]],
  lead: 'vibes', melody: { lens: [4, 8], rest: 0.25, lo: 2, hi: 8 },
  kit: 'soft', drums: { k: 'o...............', h: '..o...o...o...o.' },
  texture: 'tape', pump: 0, reverb: 4, echo: '8n',
};

const GENTLE_HUM: SongSpec = {
  title: 'A Gentle Hum (Not the Blade)', artist: 'Fescue Public Radio Ambience Dept.',
  bpm: 58, tonic: 43, mode: 'lydian', meter: 4, swing: 0,
  progressions: { A: [0, 1, 2, 4], B: [0, 5, 6, 0] },
  form: [
    { s: 'A', e: 0.15 }, { s: 'A', e: 0.35 }, { s: 'B', e: 0.5 }, { s: 'A', e: 0.6 },
    { s: 'B', e: 0.45, up: true }, { s: 'B', e: 0.2 },
  ],
  chordSize: 3, chord: 'piano', comp: { steps: [0, 8], len: 8 }, pad: true,
  bass: 'sub', bassPat: [[0, 'r', 8], [8, 'f', 8]],
  lead: 'bell', melody: { lens: [4, 8, 12], rest: 0.35, lo: 2, hi: 8 },
  kit: 'none', drums: {},
  texture: 'air', pump: 0, reverb: 5.5, echo: '4n.',
};

const HEDGEROW_LANTERN: SongSpec = {
  title: 'Hedgerow Lantern at Four', artist: 'Sorrel Tillbrook',
  bpm: 92, tonic: 56, mode: 'ionian', meter: 3, swing: 0,
  progressions: { A: [0, 2, 3, 4], B: [3, 4, 5, 0] },
  form: [
    { s: 'A', e: 0.1 }, { s: 'A', e: 0.3 }, { s: 'B', e: 0.45 }, { s: 'A', e: 0.55 },
    { s: 'B', e: 0.4, up: true }, { s: 'A', e: 0.6 }, { s: 'B', e: 0.2 },
  ],
  chordSize: 4, chord: 'piano', comp: { steps: [0, 4, 8], len: 4 }, pad: true,
  bass: 'sub', bassPat: [[0, 'r', 12]],
  lead: 'vibes', melody: { lens: [4, 6, 8], rest: 0.25, lo: 2, hi: 8 },
  kit: 'soft', drums: { k: 'o...........', h: '....o.......' },
  texture: 'air', pump: 0, reverb: 4, echo: '4n.',
};

const SUNDIAL_UNDER_THE_ELMS: SongSpec = {
  title: 'Sundial Under the Elms', artist: 'Ivy Snailwood',
  bpm: 60, tonic: 55, mode: 'aeolian', meter: 4, swing: 0,
  progressions: { A: [0, 5, 2, 6], B: [0, 3, 4, 0] },
  form: [
    { s: 'A', e: 0.1 }, { s: 'A', e: 0.3 }, { s: 'B', e: 0.45 }, { s: 'A', e: 0.55 },
    { s: 'B', e: 0.5, up: true }, { s: 'B', e: 0.15 },
  ],
  chordSize: 3, chord: 'nylon', comp: { steps: [0, 4, 8, 12], len: 4, arp: true },
  bass: 'sub', bassPat: [[0, 'r', 8], [8, 'f', 8]],
  lead: 'flute', melody: { lens: [4, 8], rest: 0.3, lo: 2, hi: 7 },
  kit: 'soft', drums: { k: 'o...............', h: '....o.......o...' },
  texture: 'tape', pump: 0, reverb: 5, echo: '8n',
};

const BEES_IN_THE_FOXGLOVE: SongSpec = {
  title: 'Bees Asleep in the Foxglove', artist: 'Clay Pot Quartet',
  bpm: 64, tonic: 49, mode: 'dorian', meter: 4, swing: 0,
  progressions: { A: [0, 1, 3, 0], B: [0, 1, 6, 0] },
  form: [
    { s: 'A', e: 0.1 }, { s: 'A', e: 0.25 }, { s: 'B', e: 0.4 }, { s: 'A', e: 0.5 },
    { s: 'B', e: 0.55, up: true }, { s: 'A', e: 0.45 }, { s: 'B', e: 0.3 }, { s: 'A', e: 0.15 },
  ],
  chordSize: 3, chord: 'musicBox', comp: { steps: [0, 4, 8, 12], len: 4, arp: true },
  bass: 'upright', bassPat: [[0, 'r', 4], [4, 't', 4], [8, 'f', 4], [12, 'a', 4]],
  lead: 'clarinet', melody: { lens: [4, 8], rest: 0.3, lo: 2, hi: 8 },
  kit: 'soft', drums: { k: 'o...............' },
  texture: 'air', pump: 0, reverb: 4.5, echo: '4n',
};

const RAKE_LEFT_LEANING: SongSpec = {
  title: 'The Rake Left Leaning', artist: 'The Pipewrights\' Youth Band',
  bpm: 88, tonic: 57, mode: 'lydian', meter: 3, swing: 0,
  progressions: { A: [0, 1, 0, 4], B: [5, 4, 2, 0] },
  form: [
    { s: 'A', e: 0.1 }, { s: 'A', e: 0.3 }, { s: 'B', e: 0.45 }, { s: 'A', e: 0.5 },
    { s: 'B', e: 0.55, up: true }, { s: 'B', e: 0.15 },
  ],
  chordSize: 4, chord: 'strings', comp: { steps: [0, 6], len: 12 }, pad: true,
  bass: 'sub', bassPat: [[0, 'r', 12]],
  lead: 'whistle', melody: { lens: [6, 12], rest: 0.25, lo: 2, hi: 9 },
  kit: 'none', drums: {},
  texture: 'tape', pump: 0, reverb: 3.5, echo: '4n.',
};

export const FPR_SONGS: readonly SongSpec[] = [
  RAIN_ON_TERRACOTTA,
  FENCE_CREAKS_IN_B_MINOR,
  KILN_HYMN,
  GNORWINS_LEDGER,
  LULLABY_FOR_A_LAWN,
  STOPPING_STONE_WALTZ,
  CLOVERFIELD_AT_DUSK,
  GENTLE_HUM,
  HEDGEROW_LANTERN,
  SUNDIAL_UNDER_THE_ELMS,
  BEES_IN_THE_FOXGLOVE,
  RAKE_LEFT_LEANING,
];

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

/** A placeholder until the song gets its own spec: the first song's music under another title. */
const stub = (title: string, artist: string): SongSpec => ({ ...RAIN_ON_TERRACOTTA, title, artist });

export const FPR_SONGS: readonly SongSpec[] = [
  RAIN_ON_TERRACOTTA,
  stub('The Fence Creaks in B Minor', 'Sorrel Tillbrook (recorded at the gap)'),
  stub('Kiln Hymn for a Grey Afternoon', 'The Mossy Wood Choir'),
  stub('Gnorwin\'s Ledger, Page Nine', 'Read by the Pipewrights\' Youth Band'),
  stub('Lullaby for a Lawn Left Alone', 'Ivy Snailwood'),
  stub('Stopping Stone Waltz', 'The Unmowed Strings'),
  stub('Cloverfield at Dusk', 'Clay Pot Quartet'),
  stub('A Gentle Hum (Not the Blade)', 'Fescue Public Radio Ambience Dept.'),
];

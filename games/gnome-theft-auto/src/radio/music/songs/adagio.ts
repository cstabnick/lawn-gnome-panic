// 96.1 Radio Adagio (Pardonlin's classical station, E30): strings, harpsichord, piano and a music box for the harmony,
// violin, oboe, flute, clarinet or bell for the tune (or no tune: a chorale), a bowed cello or a plucked upright
// underneath, no drums. Minuets and waltzes in 3/4, stately 4/4 largos, one quick allegro, a nocturne, an invention, a
// pastorale and a lullaby, 56-126 bpm, in ionian, dorian, aeolian, lydian, mixolydian and harmonic minor. Every piece
// swells to a big middle and ends small on the tonic. One SongSpec per piece; the order is the dial's playlist.
import type { SongSpec } from '../spec';

const OVERTURE_TO_A_LONG_LUNCH: SongSpec = {
  title: 'Overture to a Long Lunch', artist: 'The Pardonlin Municipal Chamber Orchestra',
  bpm: 92, tonic: 50, mode: 'ionian', meter: 4, swing: 0,
  progressions: { A: [0, 3, 4, 0], B: [5, 1, 4, 0] },
  form: [
    { s: 'A', e: 0.15 }, { s: 'A', e: 0.35 }, { s: 'B', e: 0.5 }, { s: 'A', e: 0.7, up: true },
    { s: 'B', e: 0.55 }, { s: 'A', e: 0.2 },
  ],
  chordSize: 3, chord: 'strings', comp: { steps: [0, 8], len: 8 }, pad: true,
  bass: 'cello', bassPat: [[0, 'r', 8], [8, 'f', 8]],
  lead: 'violin', melody: { lens: [2, 4, 6, 8], rest: 0.15, lo: 0, hi: 9 },
  kit: 'none', drums: {},
  texture: 'vinyl', pump: 0, reverb: 3.5, echo: '4n',
};

const MINUET_QUEUE: SongSpec = {
  title: 'Minuet for a Queue That Does Not Move', artist: 'The Thymes Quartet',
  bpm: 112, tonic: 55, mode: 'ionian', meter: 3, swing: 0,
  progressions: { A: [0, 4, 0, 4], B: [3, 0, 4, 0], C: [5, 1, 4, 0] },
  form: [
    { s: 'A', e: 0.2 }, { s: 'A', e: 0.4 }, { s: 'B', e: 0.55 }, { s: 'C', e: 0.75, up: true },
    { s: 'B', e: 0.6 }, { s: 'A', e: 0.45 }, { s: 'C', e: 0.3 }, { s: 'B', e: 0.2 },
  ],
  chordSize: 3, chord: 'harpsichord', comp: { steps: [0, 4, 8], len: 3 },
  bass: 'upright', bassPat: [[0, 'r', 4], [4, 'f', 4], [8, 'f', 4]],
  lead: 'violin', melody: { lens: [2, 4, 6], rest: 0.15, lo: 2, hi: 10 },
  kit: 'none', drums: {},
  texture: 'none', pump: 0, reverb: 3, echo: '4n',
};

const CONCERTO_PIGEON: SongSpec = {
  title: 'Concerto for Cello and Pigeon in B-flat', artist: 'Maestro Ottavio Lento (conducting, loudly)',
  bpm: 74, tonic: 46, mode: 'ionian', meter: 4, swing: 0,
  progressions: { A: [0, 5, 3, 4], B: [1, 4, 0, 5], C: [3, 4, 5, 0] },
  form: [
    { s: 'A', e: 0.2 }, { s: 'B', e: 0.4 }, { s: 'A', e: 0.55 }, { s: 'C', e: 0.8, up: true },
    { s: 'B', e: 0.6 }, { s: 'A', e: 0.4 }, { s: 'C', e: 0.2 },
  ],
  chordSize: 3, chord: 'strings', comp: { steps: [0, 8], len: 8 }, pad: true,
  bass: 'cello', bassPat: [[0, 'r', 12], [12, 'a', 4]],
  lead: 'clarinet', melody: { lens: [4, 6, 8], rest: 0.2, lo: 1, hi: 8 },
  kit: 'none', drums: {},
  texture: 'air', pump: 0, reverb: 5, echo: '4n.',
};

const NOCTURNE_CLOSED: SongSpec = {
  title: 'Nocturne (Closed Until Further Notice)', artist: 'Odile Easelby (piano, reluctantly)',
  bpm: 60, tonic: 52, mode: 'aeolian', meter: 4, swing: 0,
  progressions: { A: [0, 5, 6, 0], B: [3, 6, 2, 4], C: [0, 3, 4, 0] },
  form: [
    { s: 'A', e: 0.15 }, { s: 'A', e: 0.3 }, { s: 'B', e: 0.5 }, { s: 'C', e: 0.75, up: true },
    { s: 'B', e: 0.5 }, { s: 'A', e: 0.2 },
  ],
  chordSize: 4, chord: 'piano', comp: { steps: [0, 2, 4, 6, 8, 10, 12, 14], len: 4, arp: true }, pad: true,
  bass: 'cello', bassPat: [[0, 'r', 16]],
  lead: 'none', melody: { lens: [4, 8], rest: 0.4, lo: 2, hi: 8 },
  kit: 'none', drums: {},
  texture: 'vinyl', pump: 0, reverb: 5.5, echo: '4n.',
};

const AIR_BEAN_STRING: SongSpec = {
  title: 'Air on a Bean String', artist: 'The Grand Platz Bandstand Ensemble',
  bpm: 66, tonic: 45, mode: 'ionian', meter: 4, swing: 0,
  progressions: { A: [0, 4, 5, 2], B: [3, 0, 1, 4], C: [5, 3, 1, 0] },
  form: [
    { s: 'A', e: 0.15 }, { s: 'B', e: 0.35 }, { s: 'A', e: 0.55 }, { s: 'C', e: 0.75, up: true },
    { s: 'B', e: 0.5 }, { s: 'C', e: 0.2 },
  ],
  chordSize: 3, chord: 'strings', comp: { steps: [0, 8], len: 8 }, pad: true,
  bass: 'cello', bassPat: [[0, 'r', 4], [4, 't', 4], [8, 'f', 4], [12, 't', 4]],
  lead: 'violin', melody: { lens: [4, 8, 12], rest: 0.1, lo: 3, hi: 10 },
  kit: 'none', drums: {},
  texture: 'vinyl', pump: 0, reverb: 4.5, echo: '4n',
};

const WALTZ_LITTLE_CAR: SongSpec = {
  title: 'Waltz of the Little Car That Parks Anywhere', artist: 'The Opera Hall Chorus (Without the Chorus)',
  bpm: 120, tonic: 53, mode: 'lydian', meter: 3, swing: 0,
  progressions: { A: [0, 4, 0, 5], B: [1, 4, 0, 0], C: [0, 5, 1, 0] },
  form: [
    { s: 'A', e: 0.2 }, { s: 'A', e: 0.4 }, { s: 'B', e: 0.6 }, { s: 'C', e: 0.8, up: true },
    { s: 'B', e: 0.6 }, { s: 'A', e: 0.45 }, { s: 'C', e: 0.3 }, { s: 'C', e: 0.2 },
  ],
  chordSize: 3, chord: 'strings', comp: { steps: [0, 4, 8], len: 4 },
  bass: 'upright', bassPat: [[0, 'r', 4], [4, 'f', 4], [8, 'f', 4]],
  lead: 'flute', melody: { lens: [2, 4, 6], rest: 0.15, lo: 3, hi: 11 },
  kit: 'none', drums: {},
  texture: 'air', pump: 0, reverb: 3.5, echo: '4n',
};

const REQUIEM_CROISSANT: SongSpec = {
  title: 'Requiem for a Croissant (Second Croissant)', artist: 'The Pardonlin Municipal Chamber Orchestra',
  bpm: 56, tonic: 48, mode: 'harmonic', meter: 4, swing: 0,
  progressions: { A: [0, 3, 4, 0], B: [5, 3, 4, 0], C: [0, 5, 3, 4] },
  form: [
    { s: 'A', e: 0.15 }, { s: 'A', e: 0.3 }, { s: 'B', e: 0.5 }, { s: 'C', e: 0.75, up: true },
    { s: 'B', e: 0.55 }, { s: 'A', e: 0.25 }, { s: 'B', e: 0.15 },
  ],
  chordSize: 3, chord: 'strings', comp: { steps: [0], len: 16 }, pad: true,
  bass: 'cello', bassPat: [[0, 'r', 16]],
  lead: 'none', melody: { lens: [8, 12], rest: 0.35, lo: 2, hi: 7 },
  kit: 'none', drums: {},
  texture: 'none', pump: 0, reverb: 6, echo: '4n.',
};

const SERENADE_STRIKE: SongSpec = {
  title: 'Serenade for Strings and One Strike', artist: 'The Thymes Quartet',
  bpm: 84, tonic: 43, mode: 'mixolydian', meter: 4, swing: 0,
  progressions: { A: [0, 3, 0, 4], B: [5, 3, 0, 0], C: [3, 5, 4, 0] },
  form: [
    { s: 'A', e: 0.2 }, { s: 'A', e: 0.4 }, { s: 'B', e: 0.55 }, { s: 'C', e: 0.75, up: true },
    { s: 'B', e: 0.5 }, { s: 'A', e: 0.3 }, { s: 'C', e: 0.2 },
  ],
  chordSize: 3, chord: 'strings', comp: { steps: [0, 4, 8, 12], len: 4 }, pad: true,
  bass: 'upright', bassPat: [[0, 'r', 4], [8, 'f', 4]],
  lead: 'violin', melody: { lens: [2, 4, 8], rest: 0.2, lo: 2, hi: 9 },
  kit: 'none', drums: {},
  texture: 'vinyl', pump: 0, reverb: 4, echo: '4n',
};

const INVENTION_PARKING: SongSpec = {
  title: 'Invention No. 4 in Parking Permit', artist: 'Odile Easelby (harpsichord, reluctantly)',
  bpm: 100, tonic: 57, mode: 'dorian', meter: 4, swing: 0,
  progressions: { A: [0, 3, 6, 2], B: [4, 0, 3, 6], C: [[0, 4], 3, 6, 0] },
  form: [
    { s: 'A', e: 0.25 }, { s: 'A', e: 0.4 }, { s: 'B', e: 0.55 }, { s: 'C', e: 0.75, up: true },
    { s: 'B', e: 0.6 }, { s: 'A', e: 0.4 }, { s: 'C', e: 0.2 },
  ],
  chordSize: 3, chord: 'harpsichord', comp: { steps: [0, 2, 4, 6, 8, 10, 12, 14], len: 2, arp: true },
  bass: 'cello', bassPat: [[0, 'r', 4], [4, 'f', 4], [8, 'o', 4], [12, 'f', 4]],
  lead: 'oboe', melody: { lens: [2, 4], rest: 0.2, lo: 1, hi: 8 },
  kit: 'none', drums: {},
  texture: 'none', pump: 0, reverb: 3, echo: '4n',
};

const PASTORALE_HEDGE: SongSpec = {
  title: 'Pastorale for a Hedge in Good Health', artist: 'Maestro Ottavio Lento (oboe, also)',
  bpm: 72, tonic: 50, mode: 'lydian', meter: 3, swing: 0,
  progressions: { A: [0, 0, 4, 0], B: [5, 1, 4, 0], C: [0, 4, 5, 0] },
  form: [
    { s: 'A', e: 0.15 }, { s: 'A', e: 0.35 }, { s: 'B', e: 0.55 }, { s: 'C', e: 0.75, up: true },
    { s: 'B', e: 0.5 }, { s: 'A', e: 0.25 },
  ],
  chordSize: 3, chord: 'strings', comp: { steps: [0, 6], len: 6 }, pad: true,
  bass: 'cello', bassPat: [[0, 'r', 12]],
  lead: 'oboe', melody: { lens: [3, 6, 9], rest: 0.15, lo: 2, hi: 9 },
  kit: 'none', drums: {},
  texture: 'air', pump: 0, reverb: 4.5, echo: '4n.',
};

const LULLABY_BUTTON: SongSpec = {
  title: 'Lullaby for a Button That Fell Off', artist: 'Odile Easelby',
  bpm: 58, tonic: 55, mode: 'ionian', meter: 3, swing: 0,
  progressions: { A: [0, 5, 3, 4], B: [3, 1, 4, 0] },
  form: [
    { s: 'A', e: 0.1 }, { s: 'A', e: 0.3 }, { s: 'B', e: 0.5 }, { s: 'A', e: 0.7, up: true },
    { s: 'A', e: 0.4 }, { s: 'B', e: 0.2 },
  ],
  chordSize: 3, chord: 'musicBox', comp: { steps: [0, 3, 6, 9], len: 3, arp: true }, pad: true,
  bass: 'cello', bassPat: [[0, 'r', 12]],
  lead: 'bell', melody: { lens: [3, 6, 9], rest: 0.25, lo: 3, hi: 9 },
  kit: 'none', drums: {},
  texture: 'air', pump: 0, reverb: 4, echo: '4n',
};

const ALLEGRO_COUNCIL: SongSpec = {
  title: 'Allegro for a Council Meeting Running Late', artist: 'The Grand Platz Bandstand Ensemble',
  bpm: 126, tonic: 52, mode: 'ionian', meter: 4, swing: 0,
  progressions: { A: [0, 4, 0, 4], B: [3, 0, 1, 4], C: [5, 1, [4, 4], 0] },
  form: [
    { s: 'A', e: 0.3 }, { s: 'A', e: 0.5 }, { s: 'B', e: 0.65 }, { s: 'C', e: 0.8, up: true },
    { s: 'B', e: 0.7 }, { s: 'A', e: 0.45 }, { s: 'C', e: 0.25 },
  ],
  chordSize: 3, chord: 'piano', comp: { steps: [0, 4, 8, 12], len: 3 },
  bass: 'upright', bassPat: [[0, 'r', 4], [4, 'f', 4], [8, 'r', 4], [12, 'f', 4]],
  lead: 'clarinet', melody: { lens: [2, 4], rest: 0.1, lo: 2, hi: 10 },
  kit: 'none', drums: {},
  texture: 'none', pump: 0, reverb: 3, echo: '4n',
};

const ELEGY_UMBRELLA: SongSpec = {
  title: 'Elegy for an Umbrella Left on the 14', artist: 'The Thymes Quartet',
  bpm: 62, tonic: 47, mode: 'aeolian', meter: 3, swing: 0,
  progressions: { A: [0, 3, 4, 0], B: [5, 6, 2, 0], C: [0, 6, 5, 4] },
  form: [
    { s: 'A', e: 0.15 }, { s: 'A', e: 0.35 }, { s: 'B', e: 0.55 }, { s: 'C', e: 0.75, up: true },
    { s: 'B', e: 0.5 }, { s: 'A', e: 0.25 }, { s: 'C', e: 0.15 }, { s: 'A', e: 0.15 },
  ],
  chordSize: 3, chord: 'strings', comp: { steps: [0, 6], len: 6 }, pad: true,
  bass: 'cello', bassPat: [[0, 'r', 6], [6, 'f', 6]],
  lead: 'oboe', melody: { lens: [3, 6, 9], rest: 0.2, lo: 2, hi: 8 },
  kit: 'none', drums: {},
  texture: 'vinyl', pump: 0, reverb: 5, echo: '4n.',
};

export const ADAGIO_SONGS: readonly SongSpec[] = [
  OVERTURE_TO_A_LONG_LUNCH, MINUET_QUEUE, CONCERTO_PIGEON, NOCTURNE_CLOSED, AIR_BEAN_STRING, WALTZ_LITTLE_CAR,
  REQUIEM_CROISSANT, SERENADE_STRIKE, INVENTION_PARKING, PASTORALE_HEDGE, LULLABY_BUTTON, ALLEGRO_COUNCIL,
  ELEGY_UMBRELLA,
];

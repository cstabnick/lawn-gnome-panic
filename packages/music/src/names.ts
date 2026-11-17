// "Now playing": a made-up artist, title, label and year for a run track, from its seed.
import { mulberry32 } from './theory';

export interface TrackInfo { artist: string; title: string; label: string; year: number }

export type ThemeId = 'meadow' | 'twilight' | 'fanfare' | 'acousticJungle' | 'classicJungle' | 'desert';

/** Deterministically picks a theme from a run seed (used by both startMusic and trackInfo). */
export function pickThemeId(seed: number): ThemeId {
  const r = mulberry32((seed ^ 0x85ebca6b) >>> 0)();
  if (r < 0.25) return 'meadow';
  if (r < 0.50) return 'twilight';
  if (r < 0.70) return 'fanfare';
  if (r < 0.90) return 'acousticJungle';
  return 'classicJungle';
}

const ARTIST_SOLO = ['Mulch', 'Topsoil', 'Hedgecutter', 'Dandelion', 'Sprinkler', 'Clover', 'Grasshopper', 'Compost', 'Bramble', 'Rotary'];
const ARTIST_PREFIX = ['DJ', 'MC', 'Dr.', 'Lord', 'Kid'];
const ARTIST_GROUP_A = ['Turf', 'Lawn', 'Garden', 'Shed', 'Moss', 'Acorn', 'Thicket', 'Greenhouse'];
const ARTIST_GROUP_B = ['Science', 'Soundsystem', 'Collective', 'Massive', 'Militia', 'Dubplate Crew', 'Foundation', 'Unit'];

const CHAMBER_ENSEMBLES = [
  'The Hedgerow Brass & Harp Trio',
  'Gnomoria Chamber Ensemble',
  'Cloverfield Horn Quartet',
  'The Twilight Felt Trio',
  'Moss & Briar Consort',
  'Greenhouse Acoustic Society',
  'Bramblewood Strings & Horn',
  'Old Shed Philharmonic',
];

const THEME_TITLES: Record<Exclude<ThemeId, 'classicJungle'>, string[]> = {
  meadow: [
    'Meadow Horn Waltz',
    'Sunlit Clover (Harp & Horn)',
    'Dew on the Lawn',
    'Pastoral in Three',
    'Breeze Through the Hedgerow',
  ],
  twilight: [
    'Twilight Felt Nocturne',
    'Fireflies Over the Birdbath',
    'Distant Horn at Dusk',
    'Moonlit Terrace',
    'After the Sprinklers',
  ],
  fanfare: [
    'Woodland Gnome Fanfare',
    'Patio Expedition March',
    'Two Horns in the Tall Grass',
    'Acorn Pavilion Overture',
    'Brass & Bramble Parade',
  ],
  acousticJungle: [
    'Liquid Garden',
    'Harp & Horn Amen',
    'Felt Piano Rinse',
    'Shed Echoes (Acoustic Dub)',
    'Terracotta Breakbeat',
  ],
  desert: [
    'Shifting Sand Sitar',
    'Bongo Mirage',
    'Hijaz Oasis',
    'Phrygian Dunes',
    'Saguaro Caravan',
    'Armadillo Moon',
  ],
};

const TITLE_A = ['Midnight', 'Rinse', 'Concrete', 'Rotary', 'Lawn', 'Sub', 'Dawn', 'Hedge', 'Blade', 'Pressure', 'Gnome', 'Darkside', 'Sunday', 'Two-Stroke'];
const TITLE_B = ['Runnings', 'Theory', 'Warfare', 'Patrol', 'Dread', 'Science', 'Bassline', 'Shuffle', 'Riddim', 'Steppers', 'Soldier', 'Panic', 'Ritual', 'Frequencies'];
const TITLE_STANDALONE = ['Grass Is Greener', 'Cut The Lawn', 'Keep Off The Grass', 'Mow Down', 'Gnome Is Where The Heart Is', 'Sprinkler System', 'The Long Grass', 'Fertile Ground'];
const MIXES = ['', '', '', ' (VIP Mix)', ' (Dub)', ' (Original Mix)', ' (Remix)', ' (\'95 Rework)', ' (Dubplate Special)'];
const ACOUSTIC_MIXES = ['', '', ' (Hall Mix)', ' (Reprise)', ' (Chamber Edit)', ' (Extended Riff)'];
const LABELS = ['Mowtown', 'Hedgerow Recordings', 'Topsoil Audio', 'Shed Dubs', 'Two-Stroke Records', 'Acorn White Label'];
const ACOUSTIC_LABELS = ['Gnomoria Consort', 'Greenhouse Tapes', 'Moss & Brass', 'Hedgerow Recordings', 'Acorn Chamber'];

export function trackInfo(seed: number, theme: ThemeId = 'classicJungle'): TrackInfo {
  const rnd = mulberry32((seed ^ 0x9e3779b9) >>> 0); // its own stream, so names never change the music
  const pick = <V>(xs: V[]): V => xs[Math.floor(rnd() * xs.length)];

  if (theme !== 'classicJungle') {
    const artist = rnd() < 0.65
      ? pick(CHAMBER_ENSEMBLES)
      : `${pick(ARTIST_GROUP_A)} ${pick(['Ensemble', 'Trio', 'Consort', 'Quartet'])}`;
    const title = pick(THEME_TITLES[theme]) + pick(ACOUSTIC_MIXES);
    return { artist, title, label: pick(ACOUSTIC_LABELS), year: 1996 + Math.floor(rnd() * 28) };
  }

  const style = rnd();
  const artist = style < 0.4 ? `${pick(ARTIST_PREFIX)} ${pick(ARTIST_SOLO)}`
    : style < 0.75 ? `${pick(ARTIST_GROUP_A)} ${pick(ARTIST_GROUP_B)}`
    : `${pick(ARTIST_PREFIX)} ${pick(ARTIST_SOLO)} & ${pick(ARTIST_PREFIX)} ${pick(ARTIST_SOLO)}`;
  const title = (rnd() < 0.3 ? pick(TITLE_STANDALONE) : `${pick(TITLE_A)} ${pick(TITLE_B)}`) + pick(MIXES);
  return { artist, title, label: pick(LABELS), year: 1993 + Math.floor(rnd() * 11) };
}

// "Now playing": a made-up artist, title, label and year for a run track, from its seed.
import { mulberry32 } from './theory';

export interface TrackInfo { artist: string; title: string; label: string; year: number }

const ARTIST_SOLO = ['Mulch', 'Topsoil', 'Hedgecutter', 'Dandelion', 'Sprinkler', 'Clover', 'Grasshopper', 'Compost', 'Bramble', 'Rotary'];
const ARTIST_PREFIX = ['DJ', 'MC', 'Dr.', 'Lord', 'Kid'];
const ARTIST_GROUP_A = ['Turf', 'Lawn', 'Garden', 'Shed', 'Moss', 'Acorn', 'Thicket', 'Greenhouse'];
const ARTIST_GROUP_B = ['Science', 'Soundsystem', 'Collective', 'Massive', 'Militia', 'Dubplate Crew', 'Foundation', 'Unit'];
const TITLE_A = ['Midnight', 'Rinse', 'Concrete', 'Rotary', 'Lawn', 'Sub', 'Dawn', 'Hedge', 'Blade', 'Pressure', 'Gnome', 'Darkside', 'Sunday', 'Two-Stroke'];
const TITLE_B = ['Runnings', 'Theory', 'Warfare', 'Patrol', 'Dread', 'Science', 'Bassline', 'Shuffle', 'Riddim', 'Steppers', 'Soldier', 'Panic', 'Ritual', 'Frequencies'];
const TITLE_STANDALONE = ['Grass Is Greener', 'Cut The Lawn', 'Keep Off The Grass', 'Mow Down', 'Gnome Is Where The Heart Is', 'Sprinkler System', 'The Long Grass', 'Fertile Ground'];
const MIXES = ['', '', '', ' (VIP Mix)', ' (Dub)', ' (Original Mix)', ' (Remix)', ' (\'95 Rework)', ' (Dubplate Special)'];
const LABELS = ['Mowtown', 'Hedgerow Recordings', 'Topsoil Audio', 'Shed Dubs', 'Two-Stroke Records', 'Acorn White Label'];

export function trackInfo(seed: number): TrackInfo {
  const rnd = mulberry32((seed ^ 0x9e3779b9) >>> 0); // its own stream, so names never change the music
  const pick = <V>(xs: V[]): V => xs[Math.floor(rnd() * xs.length)];
  const style = rnd();
  const artist = style < 0.4 ? `${pick(ARTIST_PREFIX)} ${pick(ARTIST_SOLO)}`
    : style < 0.75 ? `${pick(ARTIST_GROUP_A)} ${pick(ARTIST_GROUP_B)}`
    : `${pick(ARTIST_PREFIX)} ${pick(ARTIST_SOLO)} & ${pick(ARTIST_PREFIX)} ${pick(ARTIST_SOLO)}`;
  const title = (rnd() < 0.3 ? pick(TITLE_STANDALONE) : `${pick(TITLE_A)} ${pick(TITLE_B)}`) + pick(MIXES);
  return { artist, title, label: pick(LABELS), year: 1993 + Math.floor(rnd() * 11) };
}

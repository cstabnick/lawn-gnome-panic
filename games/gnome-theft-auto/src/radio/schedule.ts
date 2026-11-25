// The radio's programme: which segment plays next on the tuned station, and which bulletin cuts in. Pure: no audio, no
// timers, no DOM, so the rules can be tested (schedule.test.ts). player.ts turns segments into sound and subtitles.
//
// A station's programme runs: sign-on, then two songs, a break, two songs, a break... Breaks rotate through talk, ad, talk,
// caller, talk, traffic. Two songs per break keeps the talk rare. Nothing repeats back to back within one pool (a song, a line, a place), and every pool has at least one line.

import { PLACES } from '../config';
import { ADS, BRIDGE_TRAFFIC, EVENT_BULLETINS, HEAT_BULLETINS, STATIONS, trafficLine, type Line, type Song, type Station, type StationId } from './content';

export type SegmentKind = 'song' | 'talk' | 'ad' | 'caller' | 'traffic' | 'bulletin';
export type Rng = () => number;

export interface Segment {
  readonly kind: SegmentKind;
  readonly station: StationId;
  /** Who is speaking (a label on screen), or the song's artist. */
  readonly who: string;
  /** What goes on screen. For a song: "Title, by Artist". */
  readonly text: string;
  /** How long the segment runs before the programme moves on. */
  readonly seconds: number;
  /** Songs only: the track, and the seed the music theme is built from (different per play, so it never sounds the same twice). */
  readonly song?: { readonly title: string; readonly artist: string; readonly seed: number };
}

/** The dial order when the player presses the radio key: each station, then off, then round again. */
export const DIAL: readonly (StationId | null)[] = ['blade', 'fpr', 'beats', 'under', 'adagio', null];

const BREAKS = ['talk', 'ad', 'talk', 'caller', 'talk', 'traffic'] as const;
type BreakKind = (typeof BREAKS)[number];

interface StationProgram {
  /** What the next call returns: the sign-on, a song, or a break. */
  phase: 'sign' | 'song' | 'break';
  breaks: number;
  /** Songs played since the last break. */
  songs: number;
  bag: Song[];
}

/** Read time for a line: about 16 characters a second, never under four seconds or over ten. */
export function readSeconds(text: string): number {
  return Math.min(10, Math.max(4, text.length * 0.06 + 1.5));
}

/** A pick from `pool` that is not the one picked last time for `key`. */
function pickFresh<T>(pool: readonly T[], key: string, last: Map<string, unknown>, rng: Rng): T {
  if (pool.length === 0) throw new Error(`radio: empty pool "${key}"`);
  // Retry until the pick is a different item (pools can hold the same object more than once, see TRAFFIC_POOL).
  let item = pool[Math.floor(rng() * pool.length)];
  for (let tries = 0; tries < 20 && item === last.get(key) && pool.some((x) => x !== item); tries++) {
    item = pool[Math.floor(rng() * pool.length)];
  }
  last.set(key, item);
  return item;
}

/** Traffic reports, weighted by each place's weight (the same weights the errands use). */
// One Line object per place, repeated by weight, so the no-repeat check (which compares objects) sees the same report.
// Each bridge line is listed twice, so the five bridges come up about as often as a mid-weight place.
const TRAFFIC_POOL: readonly Line[] = [
  ...PLACES.flatMap((p) => {
    const line = trafficLine(p);
    return Array.from({ length: p.weight }, () => line);
  }),
  ...BRIDGE_TRAFFIC.flatMap((l) => [l, l]),
];

export interface Program {
  /** The tuned station, or null when the radio is off. */
  readonly station: StationId | null;
  /** Turn the dial one step (blade, fpr, beats, under, off, blade...). Returns the new station. */
  cycle(): StationId | null;
  /** Tune a station directly (used to restore the last one the player chose). */
  tune(id: StationId | null): void;
  /** The next segment on the tuned station (null when off). */
  next(): Segment | null;
  /** A bulletin for `key` on the tuned station: "heat-1" | "heat-2" | "heat-3" | "heat-4", or an event id from EVENT_BULLETINS. Null when off or unknown. */
  bulletin(key: string): Segment | null;
}

export function createProgram(rng: Rng = Math.random, stations: readonly Station[] = STATIONS): Program {
  let station: StationId | null = null;
  const programs = new Map<StationId, StationProgram>();
  const last = new Map<string, unknown>();
  const byId = new Map(stations.map((s) => [s.id, s]));

  const programOf = (id: StationId): StationProgram => {
    let p = programs.get(id);
    if (!p) {
      p = { phase: 'sign', breaks: 0, songs: 0, bag: [] };
      programs.set(id, p);
    }
    return p;
  };

  const talk = (id: StationId, kind: 'talk' | 'ad' | 'caller' | 'traffic', line: Line): Segment => ({
    kind, station: id, who: line.who, text: line.text, seconds: readSeconds(line.text),
  });

  // Songs come from a shuffled bag, so each one plays once per round. The first pick of a new round never repeats the last song.
  const song = (id: StationId, p: StationProgram): Segment => {
    const s = byId.get(id)!;
    if (p.bag.length === 0) p.bag = [...s.songs];
    let i = Math.floor(rng() * p.bag.length);
    const prev = last.get(`${id}:song`);
    if (p.bag.length > 1 && p.bag[i] === prev) i = (i + 1) % p.bag.length;
    const [track] = p.bag.splice(i, 1);
    last.set(`${id}:song`, track);
    return songSegment(id, track);
  };

  const songSegment = (id: StationId, track: Song): Segment => ({
    kind: 'song',
    station: id,
    who: track.artist,
    text: `${track.title}, by ${track.artist}`,
    seconds: 55 + rng() * 30,
    song: { title: track.title, artist: track.artist, seed: 1 + Math.floor(rng() * 999999) },
  });

  const breakSegment = (id: StationId, p: StationProgram): Segment => {
    const s = byId.get(id)!;
    const kind: BreakKind = BREAKS[p.breaks % BREAKS.length];
    p.breaks++;
    switch (kind) {
      case 'talk':
        return talk(id, 'talk', pickFresh(s.banter, `${id}:talk`, last, rng));
      case 'ad':
        return talk(id, 'ad', pickFresh([...s.ads, ...ADS], `${id}:ad`, last, rng));
      case 'caller':
        return talk(id, 'caller', pickFresh(s.calls, `${id}:caller`, last, rng));
      case 'traffic':
        return talk(id, 'traffic', pickFresh(TRAFFIC_POOL, `${id}:traffic`, last, rng));
    }
  };

  return {
    get station() { return station; },
    cycle() {
      const i = DIAL.indexOf(station);
      station = DIAL[(i + 1) % DIAL.length];
      return station;
    },
    tune(id) {
      station = id && byId.has(id) ? id : null;
    },
    next() {
      if (!station) return null;
      const id = station;
      const p = programOf(id);
      if (p.phase === 'sign') {
        p.phase = 'song';
        const s = byId.get(id)!;
        return talk(id, 'talk', s.sign);
      }
      if (p.phase === 'song') {
        const seg = song(id, p);
        p.songs++;
        p.phase = p.songs % 2 === 0 ? 'break' : 'song';
        return seg;
      }
      p.phase = 'song';
      return breakSegment(id, p);
    },
    bulletin(key) {
      if (!station) return null;
      const pool = key.startsWith('heat-')
        ? HEAT_BULLETINS[Number(key.slice(5)) as 1 | 2 | 3 | 4]
        : EVENT_BULLETINS[key];
      if (!pool || pool.length === 0) return null;
      const line = pickFresh(pool, `bulletin:${key}`, last, rng);
      return { kind: 'bulletin', station, who: line.who, text: line.text, seconds: readSeconds(line.text) + 2 };
    },
  };
}

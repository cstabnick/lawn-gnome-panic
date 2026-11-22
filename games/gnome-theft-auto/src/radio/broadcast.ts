// Deterministic live FM broadcast clock for Turfton FM.
// Pure: no DOM, no audio, so every online player on the same station hears the same segment, song seed, and offset.
import { bpmForSeed, planAt } from '@lawn/music';
import { STATIONS, type Station, type StationId } from './content';
import { createProgram, type Segment } from './schedule';

export const BLOCK_SECONDS = 3600;

export interface LiveSlot {
  readonly station: StationId;
  readonly blockId: number;
  readonly segment: Segment;
  readonly offsetSec: number;
  readonly remainingSec: number;
  readonly trackKey: string;
  readonly songSeed: number;
  readonly songOffsetSec: number;
  readonly songIndex: number;
}

export function hashStationBlock(station: StationId, blockId: number): number {
  let h = 2166136261 ^ (blockId | 0);
  for (let i = 0; i < station.length; i++) {
    h ^= station.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const stationById = (id: StationId): Station => STATIONS.find((s) => s.id === id) ?? STATIONS[0];

export function liveAt(station: StationId, nowSec: number = Date.now() / 1000): LiveSlot {
  const safeNow = Number.isFinite(nowSec) ? Math.max(0, nowSec) : 0;
  const blockId = Math.floor(safeNow / BLOCK_SECONDS);
  const elapsed = safeNow - blockId * BLOCK_SECONDS;
  const blockSeed = hashStationBlock(station, blockId);
  const st = stationById(station);

  const prog = createProgram(mulberry32(blockSeed));
  prog.tune(station);

  let acc = 0;
  let currentSeg: Segment | null = null;
  let segStart = 0;
  let lastSongSeed = 1 + (blockSeed % 999999);
  let lastSongStart = 0;
  let lastSongIndex = 0;

  for (let i = 0; i < 600; i++) {
    const seg = prog.next();
    if (!seg) break;
    if (seg.kind === 'song' && seg.song) {
      lastSongSeed = seg.song.seed;
      lastSongStart = acc;
      const idx = st.songs.findIndex((s) => s.title === seg.song!.title);
      lastSongIndex = idx >= 0 ? idx : 0;
    }
    if (acc + seg.seconds > elapsed) {
      currentSeg = seg;
      segStart = acc;
      break;
    }
    acc += seg.seconds;
  }

  if (!currentSeg) {
    currentSeg = {
      kind: 'talk',
      station,
      who: st.sign.who,
      text: st.sign.text,
      seconds: 6,
    };
    segStart = elapsed;
  }

  const offsetSec = Math.max(0, elapsed - segStart);
  const remainingSec = Math.max(0.05, currentSeg.seconds - offsetSec);

  if (station === 'under') {
    const setSeed = 1 + (blockSeed % 999999);
    const bpm = bpmForSeed(setSeed);
    const barSec = 240 / bpm;
    const cutIdx = planAt(elapsed / barSec).dominant;
    const songIndex = Math.max(0, Math.min(st.songs.length - 1, cutIdx));
    const cutSong = st.songs[songIndex];
    const segment: Segment = currentSeg.kind === 'song'
      ? {
          ...currentSeg,
          who: cutSong.artist,
          text: `${cutSong.title}, by ${cutSong.artist}`,
          song: { title: cutSong.title, artist: cutSong.artist, seed: setSeed },
        }
      : currentSeg;

    return {
      station,
      blockId,
      segment,
      offsetSec,
      remainingSec,
      trackKey: `under:${blockId}:${setSeed}`,
      songSeed: setSeed,
      songOffsetSec: elapsed,
      songIndex,
    };
  }

  const songOffsetSec = currentSeg.kind === 'song' ? offsetSec : Math.max(0, elapsed - lastSongStart);
  return {
    station,
    blockId,
    segment: currentSeg,
    offsetSec,
    remainingSec,
    trackKey: `${station}:${lastSongSeed}`,
    songSeed: lastSongSeed,
    songOffsetSec,
    songIndex: lastSongIndex,
  };
}

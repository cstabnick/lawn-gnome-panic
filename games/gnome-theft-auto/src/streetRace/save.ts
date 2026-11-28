// E26: the racing save (best times per track, finish counts, pickup and online wins, wager winnings). Key
// 'gta-racing-v1' is in the save export (saveIO.ts) and cloud-saved (cloudSave.ts MERGES: mergeRacingSaves).
// Tolerant parse like winter/save.ts: anything broken is dropped field by field; a fully broken save is an empty one.
import { TRACK_IDS, type TrackId } from '../raceTrack/tracks';

export const RACING_SAVE_KEY = 'gta-racing-v1';

export interface RacingSave {
  /** Best finish time per track, seconds (any mode: trial, pickup, online, quest). */
  best: Partial<Record<TrackId, number>>;
  /** Finished runs per track. */
  runs: Partial<Record<TrackId, number>>;
  pickupWins: number;
  onlineWins: number;
  /** Acorns won from the bookies in total (net of stakes). */
  wagerWon: number;
}

export function emptyRacingSave(): RacingSave {
  return { best: {}, runs: {}, pickupWins: 0, onlineWins: 0, wagerWon: 0 };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isPositive(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

function isNonNeg(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}

function isTrackId(v: string): v is TrackId {
  return (TRACK_IDS as readonly string[]).includes(v);
}

/** Copy the valid track entries of one record (unknown tracks and non-positive numbers are dropped). */
function trackMap(src: unknown): Partial<Record<TrackId, number>> {
  const out: Partial<Record<TrackId, number>> = {};
  if (!isRecord(src)) return out;
  for (const [id, n] of Object.entries(src)) {
    if (isTrackId(id) && isPositive(n)) out[id] = n;
  }
  return out;
}

/** Read a save string (null, '' or garbage: an empty save). */
export function parseRacingSave(raw: string | null): RacingSave {
  if (!raw) return emptyRacingSave();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyRacingSave();
  }
  if (!isRecord(parsed)) return emptyRacingSave();

  const out = emptyRacingSave();
  out.best = trackMap(parsed.best);
  out.runs = trackMap(parsed.runs);
  if (isNonNeg(parsed.pickupWins)) out.pickupWins = parsed.pickupWins;
  if (isNonNeg(parsed.onlineWins)) out.onlineWins = parsed.onlineWins;
  if (isNonNeg(parsed.wagerWon)) out.wagerWon = parsed.wagerWon;
  return out;
}

/** Two devices' saves: the lower best per track, the higher of every count. */
export function mergeRacingSaves(a: string, b: string): string {
  const x = parseRacingSave(a);
  const y = parseRacingSave(b);
  const merged = emptyRacingSave();

  for (const id of TRACK_IDS) {
    const bx = x.best[id];
    const by = y.best[id];
    if (bx !== undefined && by !== undefined) merged.best[id] = Math.min(bx, by);
    else if (bx !== undefined || by !== undefined) merged.best[id] = (bx ?? by) as number;

    const rx = x.runs[id] ?? 0;
    const ry = y.runs[id] ?? 0;
    if (rx > 0 || ry > 0) merged.runs[id] = Math.max(rx, ry);
  }
  merged.pickupWins = Math.max(x.pickupWins, y.pickupWins);
  merged.onlineWins = Math.max(x.onlineWins, y.onlineWins);
  merged.wagerWon = Math.max(x.wagerWon, y.wagerWon);

  return JSON.stringify({ v: 1, ...merged });
}

export interface RacingStore {
  data(): Readonly<RacingSave>;
  /** A finished run on `trackId` in `time` s: counts it, keeps it if it is the best, saves. */
  recordFinish(trackId: TrackId, time: number): { best: boolean };
  /** A pickup race won: `acorns` net winnings (stake not counted). Saves. */
  notePickupWin(acorns: number): void;
  noteOnlineWin(): void;
}

type RacingStorage = Pick<Storage, 'getItem' | 'setItem'>;

function resolveDefaultStorage(): RacingStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** The store over localStorage (or the given storage; null = memory only, for tests). */
export function createRacingStore(storage: RacingStorage | null = resolveDefaultStorage()): RacingStore {
  let s: RacingSave = emptyRacingSave();
  if (storage) {
    try {
      s = parseRacingSave(storage.getItem(RACING_SAVE_KEY));
    } catch {
      s = emptyRacingSave();
    }
  }

  const save = (): void => {
    if (!storage) return;
    try {
      storage.setItem(RACING_SAVE_KEY, JSON.stringify({ v: 1, ...s }));
    } catch {
      // Storage quota or private-mode access failure is non-fatal.
    }
  };

  return {
    data: () => s,
    recordFinish(trackId, time) {
      s.runs[trackId] = (s.runs[trackId] ?? 0) + 1;
      const old = s.best[trackId];
      const beat = isPositive(time) && (old === undefined || time < old);
      if (beat) s.best[trackId] = time;
      save();
      return { best: beat };
    },
    notePickupWin(acorns) {
      s.pickupWins += 1;
      s.wagerWon += Math.max(0, acorns);
      save();
    },
    noteOnlineWin() {
      s.onlineWins += 1;
      save();
    },
  };
}

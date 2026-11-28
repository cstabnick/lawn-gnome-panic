// Founders' Green sports save, gta-sports-v1 (E19 A17): pickup games and shootarounds (Drainpipe Court), the skateboard,
// combo and line bests (the Gutter Bowls). Tolerant parse like golf/save.ts: anything broken falls back field by field.
import { SKATE_LINES, type LineId } from '../skate/types';
import { notifySaveChanged } from '../saveHook';
import { SPORTS_SAVE_KEY, type SportsSave, type SportsStore } from './types';

export { SPORTS_SAVE_KEY };

type SportsStorage = Pick<Storage, 'getItem' | 'setItem'>;

let shared: SportsStore | null = null;
/** The one store both runtimes (court/, skate/) write through, so neither overwrites the other's fields with stale
 *  data. Passing `storage` (tests) replaces it. */
export function sportsStore(storage?: SportsStorage): SportsStore {
  if (!shared || storage) shared = createSportsStore(storage);
  return shared;
}

export function emptySportsSave(): SportsSave {
  return {
    v: 1,
    jam: { games: 0, wins: 0, threes: 0, dunks: 0, shootMakes: 0, swishBeaten: 0, bestMargin: 0 },
    skate: { boardOwned: false, ollies: 0, bestCombo: 0, fullRails: 0, lines: {}, linesDone: 0 },
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** A count: any number clamped to an integer >= 0; anything else is 0. */
function count(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
}

/** A best (score, margin): a finite number >= 0; anything else is 0. */
function best(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0;
}

/** Parse a stored save; anything malformed falls back field by field to emptySportsSave(). */
export function parseSportsSave(raw: string | null): SportsSave {
  if (!raw) return emptySportsSave();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptySportsSave();
  }
  if (!isRecord(parsed)) return emptySportsSave();

  const out = emptySportsSave();
  const jam = isRecord(parsed.jam) ? parsed.jam : {};
  out.jam.games = count(jam.games);
  out.jam.wins = count(jam.wins);
  out.jam.threes = count(jam.threes);
  out.jam.dunks = count(jam.dunks);
  out.jam.shootMakes = count(jam.shootMakes);
  out.jam.swishBeaten = count(jam.swishBeaten);
  out.jam.bestMargin = best(jam.bestMargin);

  const skate = isRecord(parsed.skate) ? parsed.skate : {};
  out.skate.boardOwned = skate.boardOwned === true;
  out.skate.ollies = count(skate.ollies);
  out.skate.bestCombo = best(skate.bestCombo);
  out.skate.fullRails = count(skate.fullRails);
  out.skate.linesDone = count(skate.linesDone);
  const lines = isRecord(skate.lines) ? skate.lines : {};
  for (const { id } of SKATE_LINES) {
    const t = lines[id];
    if (typeof t === 'number' && Number.isFinite(t) && t > 0) out.skate.lines[id] = t;
  }
  return out;
}

/** Two saves as one: counts take the larger side, the board stays owned once owned, bests the higher (combo, margin)
 *  or the lower (line times), line ids the union. */
export function mergeSportsSave(a: string, b: string): string {
  const x = parseSportsSave(a);
  const y = parseSportsSave(b);
  const lowerTime = (p: number | undefined, q: number | undefined): number | undefined =>
    p === undefined ? q : q === undefined ? p : Math.min(p, q);
  const lines: SportsSave['skate']['lines'] = {};
  for (const { id } of SKATE_LINES) {
    const t = lowerTime(x.skate.lines[id], y.skate.lines[id]);
    if (t !== undefined) lines[id] = t;
  }
  const merged: SportsSave = {
    v: 1,
    jam: {
      games: Math.max(x.jam.games, y.jam.games),
      wins: Math.max(x.jam.wins, y.jam.wins),
      threes: Math.max(x.jam.threes, y.jam.threes),
      dunks: Math.max(x.jam.dunks, y.jam.dunks),
      shootMakes: Math.max(x.jam.shootMakes, y.jam.shootMakes),
      swishBeaten: Math.max(x.jam.swishBeaten, y.jam.swishBeaten),
      bestMargin: Math.max(x.jam.bestMargin, y.jam.bestMargin),
    },
    skate: {
      boardOwned: x.skate.boardOwned || y.skate.boardOwned,
      ollies: Math.max(x.skate.ollies, y.skate.ollies),
      bestCombo: Math.max(x.skate.bestCombo, y.skate.bestCombo),
      fullRails: Math.max(x.skate.fullRails, y.skate.fullRails),
      lines,
      linesDone: Math.max(x.skate.linesDone, y.skate.linesDone),
    },
  };
  return JSON.stringify(merged);
}

function resolveDefaultStorage(): SportsStorage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function memoryStorage(): SportsStorage {
  const m = new Map<string, string>();
  return {
    getItem: (key) => m.get(key) ?? null,
    setItem: (key, value) => {
      m.set(key, value);
    },
  };
}

function loadData(storage: SportsStorage): SportsSave {
  try {
    return parseSportsSave(storage.getItem(SPORTS_SAVE_KEY));
  } catch {
    return emptySportsSave();
  }
}

function isLineId(id: string): id is LineId {
  return SKATE_LINES.some((l) => l.id === id);
}

/** The sports store. Reads the save once, keeps it in memory, writes it back after every change. */
export function createSportsStore(storage?: Pick<Storage, 'getItem' | 'setItem'>): SportsStore {
  const store: SportsStorage = storage ?? resolveDefaultStorage() ?? memoryStorage();
  const d = loadData(store);

  const save = (): void => {
    try {
      store.setItem(SPORTS_SAVE_KEY, JSON.stringify(d));
    } catch {
      // Storage quota or private-mode access failure is non-fatal.
    }
    notifySaveChanged();
  };

  return {
    data: () => d,
    recordGame({ won, margin, threes, dunks, swish }) {
      d.jam.games += 1;
      d.jam.threes += count(threes);
      d.jam.dunks += count(dunks);
      if (won) {
        d.jam.wins += 1;
        if (swish) d.jam.swishBeaten += 1;
        d.jam.bestMargin = Math.max(d.jam.bestMargin, best(margin));
      }
      save();
    },
    recordShootMake() {
      d.jam.shootMakes += 1;
      save();
    },
    setBoardOwned() {
      d.skate.boardOwned = true;
      save();
    },
    recordOllie() {
      d.skate.ollies += 1;
      save();
    },
    recordCombo(points) {
      if (!(Number.isFinite(points) && points > d.skate.bestCombo)) return false;
      d.skate.bestCombo = points;
      save();
      return true;
    },
    recordFullRail() {
      d.skate.fullRails += 1;
      save();
    },
    recordLine(id, time) {
      if (!isLineId(id)) return false;
      d.skate.linesDone += 1;
      const old = d.skate.lines[id];
      const isBest = Number.isFinite(time) && time > 0 && (old === undefined || time < old);
      if (isBest) d.skate.lines[id] = time;
      save();
      return isBest;
    },
  };
}

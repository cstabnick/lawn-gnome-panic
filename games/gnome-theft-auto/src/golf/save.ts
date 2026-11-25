// Hedgeworth's save, gta-golf-v1 (E15 A3): board broken, holes and rounds played, bests, aces, lost balls found,
// molehills patted. Tolerant parse like winter/save.ts: anything broken falls back field by field to the empty save.
import { notifySaveChanged } from '../saveHook';
import { GOLF_SAVE_KEY, HOLES, LOST_BALLS, MOLEHILLS, type GolfSave, type GolfStore } from './types';

export { GOLF_SAVE_KEY };

type GolfStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function emptyGolfSave(): GolfSave {
  return { v: 1, boardBroken: false, holesPlayed: 0, parHoles: 0, rounds: 0, best: HOLES.map(() => null), bestRound: null, aces: 0, ballsFound: [], molehills: [] };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNonNegInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0;
}

function isStrokes(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 1;
}

/** Known ids only, no duplicates, in the table's order (so the text is the same however it was merged). */
function knownIds(list: readonly { id: string }[], ids: unknown): string[] {
  const seen = Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : [];
  return list.map((e) => e.id).filter((id) => seen.includes(id));
}

/** Parse a stored save; anything malformed falls back field by field to emptyGolfSave(). */
export function parseGolfSave(raw: string | null): GolfSave {
  if (!raw) return emptyGolfSave();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyGolfSave();
  }
  if (!isRecord(parsed)) return emptyGolfSave();

  const out = emptyGolfSave();
  if (typeof parsed.boardBroken === 'boolean') out.boardBroken = parsed.boardBroken;
  if (isNonNegInt(parsed.holesPlayed)) out.holesPlayed = parsed.holesPlayed;
  if (isNonNegInt(parsed.parHoles)) out.parHoles = parsed.parHoles;
  if (isNonNegInt(parsed.rounds)) out.rounds = parsed.rounds;
  if (isNonNegInt(parsed.aces)) out.aces = parsed.aces;
  if (isStrokes(parsed.bestRound)) out.bestRound = parsed.bestRound;

  if (Array.isArray(parsed.best)) {
    out.best = HOLES.map((_, i) => {
      const n = parsed.best as unknown[];
      return isStrokes(n[i]) ? n[i] : null;
    });
  }

  out.ballsFound = knownIds(LOST_BALLS, parsed.ballsFound);
  out.molehills = knownIds(MOLEHILLS, parsed.molehills);
  return out;
}

/** Two saves as one: the board stays broken once broken, counts take the larger side, bests the lower, ids the union. */
export function mergeGolfSave(a: string, b: string): string {
  const x = parseGolfSave(a);
  const y = parseGolfSave(b);
  const lower = (p: number | null, q: number | null): number | null => (p === null ? q : q === null ? p : Math.min(p, q));
  const merged: GolfSave = {
    v: 1,
    boardBroken: x.boardBroken || y.boardBroken,
    holesPlayed: Math.max(x.holesPlayed, y.holesPlayed),
    parHoles: Math.max(x.parHoles, y.parHoles),
    rounds: Math.max(x.rounds, y.rounds),
    best: HOLES.map((_, i) => lower(x.best[i] ?? null, y.best[i] ?? null)),
    bestRound: lower(x.bestRound, y.bestRound),
    aces: Math.max(x.aces, y.aces),
    ballsFound: knownIds(LOST_BALLS, [...x.ballsFound, ...y.ballsFound]),
    molehills: knownIds(MOLEHILLS, [...x.molehills, ...y.molehills]),
  };
  return JSON.stringify(merged);
}

function resolveDefaultStorage(): GolfStorage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function memoryStorage(): GolfStorage {
  const m = new Map<string, string>();
  return {
    getItem: (key) => m.get(key) ?? null,
    setItem: (key, value) => {
      m.set(key, value);
    },
  };
}

function loadData(storage: GolfStorage): GolfSave {
  try {
    return parseGolfSave(storage.getItem(GOLF_SAVE_KEY));
  } catch {
    return emptyGolfSave();
  }
}

/** Hedgeworth's store. Reads the save once, keeps it in memory, writes it back after every change. */
export function createGolfStore(storage?: Pick<Storage, 'getItem' | 'setItem'>): GolfStore {
  const store: GolfStorage = storage ?? resolveDefaultStorage() ?? memoryStorage();
  const d = loadData(store);

  const save = (): void => {
    try {
      store.setItem(GOLF_SAVE_KEY, JSON.stringify(d));
    } catch {
      // Storage quota or private-mode access failure is non-fatal.
    }
    notifySaveChanged();
  };

  const addOnce = (list: string[], table: readonly { id: string }[], id: string): boolean => {
    if (!table.some((e) => e.id === id) || list.includes(id)) return false;
    list.push(id);
    save();
    return true;
  };

  return {
    data: () => d,
    breakBoard() {
      d.boardBroken = true;
      save();
    },
    recordHole(index, strokes, par) {
      if (index < 0 || index >= HOLES.length) return;
      d.holesPlayed += 1;
      if (strokes <= par) d.parHoles += 1;
      if (strokes === 1) d.aces += 1;
      const old = d.best[index];
      if (old === null || strokes < old) d.best[index] = strokes;
      save();
    },
    recordRound(total) {
      d.rounds += 1;
      if (d.bestRound === null || total < d.bestRound) d.bestRound = total;
      save();
    },
    findBall: (id) => addOnce(d.ballsFound, LOST_BALLS, id),
    flattenMolehill: (id) => addOnce(d.molehills, MOLEHILLS, id),
  };
}

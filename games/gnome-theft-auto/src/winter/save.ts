// Winter sports (E12): the gta-winter-v1 save (best times, runs, sled owned, ice catches, holes, bears hugged).
// Tolerant parse like fishSave.ts: anything broken is dropped field by field; a fully broken save is an empty one.
import { WINTER_SAVE_KEY, type RunId, type WinterSave } from './types';

export { WINTER_SAVE_KEY };

const RUN_IDS: readonly RunId[] = ['wool-run', 'tea-tray-run'];

export function emptyWinterSave(): WinterSave {
  return { v: 1, best: {}, runs: {}, clean: 0, sled: false, iceCatches: 0, holes: 0, hugged: [] };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNonNegInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0;
}

function isRunId(v: string): v is RunId {
  return (RUN_IDS as readonly string[]).includes(v);
}

/** Parse a stored save; anything malformed falls back field by field to emptyWinterSave(). */
export function parseWinterSave(raw: string | null): WinterSave {
  if (!raw) return emptyWinterSave();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyWinterSave();
  }
  if (!isRecord(parsed)) return emptyWinterSave();

  const out = emptyWinterSave();

  for (const [key, target] of [['best', out.best], ['runs', out.runs]] as const) {
    const src = parsed[key];
    if (!isRecord(src)) continue;
    for (const [id, n] of Object.entries(src)) {
      if (isRunId(id) && typeof n === 'number' && Number.isFinite(n) && n > 0) target[id] = n;
    }
  }

  if (isNonNegInt(parsed.clean)) out.clean = parsed.clean;
  if (isNonNegInt(parsed.iceCatches)) out.iceCatches = parsed.iceCatches;
  if (isNonNegInt(parsed.holes)) out.holes = parsed.holes;
  if (typeof parsed.sled === 'boolean') out.sled = parsed.sled;

  if (Array.isArray(parsed.hugged)) {
    for (const key of parsed.hugged) {
      if (typeof key === 'string' && !out.hugged.includes(key)) out.hugged.push(key);
    }
  }
  return out;
}

export interface WinterStore {
  data(): Readonly<WinterSave>;
  /** Count a finished run, keep the best time. best: this beat the old best (or there was none); first: first finish of this run. */
  recordRun(id: RunId, seconds: number, clean: boolean): { best: boolean; first: boolean };
  hasSled(): boolean;
  buySled(): void;
  /** +1 ice catch; returns the new total. */
  recordIceCatch(): number;
  /** +1 hole drilled; returns the new total. */
  recordHole(): number;
  /** Remember a bear by key; returns how many distinct bears are hugged. */
  hug(key: string): number;
}

type WinterStorage = Pick<Storage, 'getItem' | 'setItem'>;

function resolveDefaultStorage(): WinterStorage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function memoryStorage(): WinterStorage {
  const m = new Map<string, string>();
  return {
    getItem: (key) => m.get(key) ?? null,
    setItem: (key, value) => {
      m.set(key, value);
    },
  };
}

function loadData(storage: WinterStorage): WinterSave {
  try {
    return parseWinterSave(storage.getItem(WINTER_SAVE_KEY));
  } catch {
    return emptyWinterSave();
  }
}

export function createWinterStore(storage?: Pick<Storage, 'getItem' | 'setItem'>): WinterStore {
  const store: WinterStorage = storage ?? resolveDefaultStorage() ?? memoryStorage();
  const d = loadData(store);

  const save = (): void => {
    try {
      store.setItem(WINTER_SAVE_KEY, JSON.stringify(d));
    } catch {
      // Storage quota or private-mode access failure is non-fatal.
    }
  };

  return {
    data: () => d,
    recordRun(id, seconds, clean) {
      const before = d.runs[id] ?? 0;
      d.runs[id] = before + 1;
      if (clean && id === 'wool-run') d.clean += 1;
      const t = Math.round(seconds * 10) / 10;
      const old = d.best[id];
      const beat = old === undefined || t < old;
      if (beat) d.best[id] = t;
      save();
      return { best: beat, first: before === 0 };
    },
    hasSled: () => d.sled,
    buySled() {
      d.sled = true;
      save();
    },
    recordIceCatch() {
      d.iceCatches += 1;
      save();
      return d.iceCatches;
    },
    recordHole() {
      d.holes += 1;
      save();
      return d.holes;
    },
    hug(key) {
      if (!d.hugged.includes(key)) {
        d.hugged.push(key);
        save();
      }
      return d.hugged.length;
    },
  };
}

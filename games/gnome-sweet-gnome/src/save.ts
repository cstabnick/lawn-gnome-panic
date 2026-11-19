// Progress, saved in localStorage. Every read and write is guarded: the game works without storage.
import { TUNING } from './config';
import type { BoosterKind } from './engine/types';

export interface SaveData {
  /** Next level to play, 1-based. Past the last level, the last level replays. */
  level: number;
  /** Unspent stars (earned 1-3 per won level, spent on house items). */
  stars: number;
  coins: number;
  /** Built house items: slot id -> chosen variant index (0..2). Missing = not built. */
  house: Record<string, number>;
  boosters: Record<BoosterKind, number>;
  /** Best star rating per level id. */
  best: Record<number, number>;
  /** When this save was last written (ms since 1970). Breaks ties when two saves are merged (src/saveMerge.ts). */
  t?: number;
}

/** localStorage key of the save text. Also the cloud slot's saveKey (src/cloud.ts). */
export const KEY = 'gnome-sweet-gnome.save.v1';

/** Called after every successful local write (main.ts wires it to the cloud slot's pushSave). */
let afterWrite: (() => void) | null = null;
export function onSaveWritten(fn: () => void): void {
  afterWrite = fn;
}

export function defaultSave(): SaveData {
  return { level: 1, stars: 0, coins: TUNING.startCoins, house: {}, boosters: { mower: 1, bomb: 1, prism: 0 }, best: {} };
}

const count = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Any parsed save text (this browser's, or the account's after a cloud pull: both land in localStorage under KEY and
 * come through here) → a valid SaveData. Missing or broken fields get defaults, so saves from before the new homes
 * and levels (one house, 30 levels) load as they are: their built items and level carry over unchanged.
 */
export function normalizeSave(raw: unknown): SaveData {
  const d = defaultSave();
  if (!isObj(raw)) return d;
  const house: Record<string, number> = {};
  if (isObj(raw.house)) {
    for (const [id, v] of Object.entries(raw.house)) if (typeof v === 'number' && v >= 0 && v <= 2) house[id] = Math.floor(v);
  }
  const boosters = { ...d.boosters };
  if (isObj(raw.boosters)) for (const k of Object.keys(boosters) as BoosterKind[]) boosters[k] = count(raw.boosters[k], boosters[k]);
  const best: Record<number, number> = {};
  if (isObj(raw.best)) {
    for (const [id, v] of Object.entries(raw.best)) {
      const n = Number(id);
      if (Number.isInteger(n) && n >= 1 && typeof v === 'number' && v >= 1 && v <= 3) best[n] = Math.floor(v);
    }
  }
  const out: SaveData = {
    level: Math.max(1, count(raw.level, 1)),
    stars: count(raw.stars, d.stars),
    coins: count(raw.coins, d.coins),
    house,
    boosters,
    best,
  };
  if (typeof raw.t === 'number' && Number.isFinite(raw.t)) out.t = raw.t;
  return out;
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    return normalizeSave(JSON.parse(raw));
  } catch {
    return defaultSave();
  }
}

export function writeSave(s: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...s, t: Date.now() }));
  } catch {
    // Storage unavailable: progress lasts for this visit only.
    return;
  }
  try {
    afterWrite?.();
  } catch {
    // the cloud copy is best effort
  }
}

/** Load, change, write back. Returns the new data. */
export function updateSave(fn: (s: SaveData) => void): SaveData {
  const s = loadSave();
  fn(s);
  writeSave(s);
  return s;
}

/** For testing on a phone: open the page with #reset to wipe progress. */
export function resetSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

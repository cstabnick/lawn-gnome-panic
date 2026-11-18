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

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    return { ...defaultSave(), ...(JSON.parse(raw) as Partial<SaveData>) };
  } catch {
    return defaultSave();
  }
}

export function writeSave(s: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
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

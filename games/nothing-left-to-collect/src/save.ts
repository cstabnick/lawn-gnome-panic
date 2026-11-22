import { SAVE_KEY } from './config';
import type { SaveData } from './types';

const fresh = (): SaveData => ({ version: 1, chapter: 'prologue', eggs: [], finished: false, bestTotal: 0 });

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return fresh();
    const s = JSON.parse(raw) as SaveData;
    return s && s.version === 1 ? { ...fresh(), ...s } : fresh();
  } catch { return fresh(); }
}
export function writeSave(s: SaveData): void {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* private mode */ }
}
export function resetSave(): SaveData {
  const s = fresh();
  writeSave(s);
  return s;
}

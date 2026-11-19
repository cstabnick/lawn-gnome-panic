import { createInitialState, migrateState, serializeState } from './sim/state.ts';
import type { GameState } from './sim/types.ts';

export const SAVE_KEY = 'incregnomtal.save.v1';

export function loadSavedGame(): { state: GameState; offlineSec: number } {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return { state: createInitialState(), offlineSec: 0 };
    const parsed = JSON.parse(raw);
    const state = migrateState(parsed);
    if (!state) return { state: createInitialState(), offlineSec: 0 };
    const offlineSec = Math.max(0, (Date.now() - (state.lastSavedAt || Date.now())) / 1000);
    return { state, offlineSec };
  } catch {
    return { state: createInitialState(), offlineSec: 0 };
  }
}

export function saveGame(state: GameState): void {
  try {
    window.localStorage.setItem(SAVE_KEY, serializeState(state));
  } catch {
    // Storage blocked or quota full; game keeps running without saving
  }
}

export function clearSavedGame(): void {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

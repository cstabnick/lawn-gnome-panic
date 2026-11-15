// Saves the character to localStorage as one JSON blob, and loads it back.
import { INVENTORY_SIZE, SAVE_KEY } from './config';
import { player, teleportPlayer } from './player';
import { newGameState, state, type GameState } from './state';

interface SaveData {
  v: 1;
  state: Partial<GameState>;
  x: number;
  z: number;
}

/** Checks the shape of a parsed save. Returns it typed, or null if it is broken. */
function parseSave(raw: unknown): SaveData | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const d = raw as Partial<SaveData>;
  if (d.v !== 1) return null;
  if (typeof d.state !== 'object' || d.state === null) return null;
  const inventory = (d.state as Partial<GameState>).inventory;
  if (!Array.isArray(inventory) || inventory.length !== INVENTORY_SIZE) return null;
  if (!Number.isFinite(d.x) || !Number.isFinite(d.z)) return null;
  return d as SaveData;
}

export function saveGame(): void {
  if (player.dead) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, state, x: player.position.x, z: player.position.z }));
  } catch {
    // Storage full or blocked: the game keeps running without a save.
  }
}

/** Loads a save into `state` and places the player. False if there is none (or it is broken). */
export function loadGame(): boolean {
  let raw: unknown;
  try {
    const text = localStorage.getItem(SAVE_KEY);
    if (!text) return false;
    raw = JSON.parse(text);
  } catch {
    return false;
  }

  const data = parseSave(raw);
  if (!data) return false;

  const fresh = newGameState();
  const loaded = data.state;
  Object.assign(state, fresh, loaded);
  // Merge nested records so fields added in later versions keep their defaults.
  state.attributes = { ...fresh.attributes, ...loaded.attributes };
  state.skills = { ...fresh.skills, ...loaded.skills };
  state.equipment = { ...fresh.equipment, ...loaded.equipment };

  teleportPlayer(data.x, data.z);
  return true;
}

export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage blocked: nothing to delete.
  }
}

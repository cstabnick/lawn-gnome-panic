// The player's emote loadout: up to 4 emote ids, picked in the Gnome Creator, played from a game's emote menu.
// localStorage only for now (one key on the arcade origin, like the gnome profile before accounts).
import { createAchievementStore, emoteCatalog, type AchievementStore } from '@lawn/achievements';
import { EMOTES, getEmote, isEmoteId } from './catalog';
import type { EmoteDef } from './types';

export const EMOTE_LOADOUT_KEY = 'gnome.emotes.v1';
/** How many emotes a player can equip. */
export const MAX_EQUIPPED = 4;
/** The loadout of a player who never picked one: the free emotes. */
export const DEFAULT_LOADOUT: readonly string[] = EMOTES.filter((e) => e.free).map((e) => e.id);

export interface LoadoutStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const browserStorage = (): LoadoutStorage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

/** Known ids only, no repeats, at most MAX_EQUIPPED, in the given order. */
export function sanitizeLoadout(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const out: string[] = [];
  for (const id of ids) {
    if (isEmoteId(id) && !out.includes(id)) out.push(id);
    if (out.length === MAX_EQUIPPED) break;
  }
  return out;
}

/** The saved loadout, or DEFAULT_LOADOUT when there is none (or storage is blocked or holds junk). */
export function loadLoadout(storage: LoadoutStorage | null = browserStorage()): string[] {
  try {
    const raw = storage?.getItem(EMOTE_LOADOUT_KEY);
    if (!raw) return [...DEFAULT_LOADOUT];
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || (parsed as { version?: unknown }).version !== 1) return [...DEFAULT_LOADOUT];
    return sanitizeLoadout((parsed as { slots?: unknown }).slots);
  } catch {
    return [...DEFAULT_LOADOUT];
  }
}

/** Saves the loadout (sanitized) and returns what was saved. Throws nothing: blocked storage just keeps nothing. */
export function saveLoadout(ids: readonly string[], storage: LoadoutStorage | null = browserStorage()): string[] {
  const slots = sanitizeLoadout(ids);
  try {
    storage?.setItem(EMOTE_LOADOUT_KEY, JSON.stringify({ version: 1, slots }));
  } catch {
    // Storage blocked: the loadout lasts for this page only.
  }
  return slots;
}

/** The achievement that unlocks an emote (undefined for free emotes). */
export function emoteAchievementId(emoteId: string): string | undefined {
  return emoteCatalog().find((a) => a.emote?.emoteId === emoteId)?.id;
}

/** Ids of the emotes this player has: the free ones plus those whose achievement is in unlockedAchievementIds. Catalog order. */
export function unlockedEmotes(unlockedAchievementIds: Iterable<string>): string[] {
  const have = new Set(unlockedAchievementIds);
  return EMOTES.filter((e) => {
    if (e.free) return true;
    const ach = emoteAchievementId(e.id);
    return ach !== undefined && have.has(ach);
  }).map((e) => e.id);
}

/** Reads the achievement store and returns the unlocked emote ids (only the free ones if storage fails). */
export async function loadUnlockedEmotes(store: AchievementStore = createAchievementStore()): Promise<string[]> {
  try {
    const state = await store.getState();
    return unlockedEmotes(Object.entries(state.records).filter(([, r]) => r.unlockedAt).map(([id]) => id));
  } catch {
    return unlockedEmotes([]);
  }
}

/** What a game's emote menu shows: the saved loadout, minus anything this browser has not unlocked. */
export async function loadMyEmotes(
  store?: AchievementStore,
  storage: LoadoutStorage | null = browserStorage(),
): Promise<EmoteDef[]> {
  const have = new Set(await loadUnlockedEmotes(store));
  return loadLoadout(storage).filter((id) => have.has(id)).map((id) => getEmote(id)!);
}

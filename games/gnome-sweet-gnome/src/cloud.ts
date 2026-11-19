// Cloud saves for signed-in players: the local save (KEY in save.ts) is merged with the account's. See @lawn/cloudsave.
// Not signed in, or the service unreachable: the game plays from localStorage as before.
import { createCloudSlot, type CloudSlotOptions } from '@lawn/cloudsave';
import { KEY, normalizeSave } from './save';
import { mergeSaveTexts } from './saveMerge';
import { currentArea, homeOf, HOMES } from './house/houseData';

/** Short description of a save text, stored with each upload. Unreadable text → a generic line. */
export function summarize(text: string): string {
  try {
    const raw: unknown = JSON.parse(text);
    if (!raw || typeof raw !== 'object') return 'A saved game';
    const s = normalizeSave(raw);
    const area = currentArea(s.house);
    const home = area ? homeOf(area).name : HOMES[HOMES.length - 1].name;
    return `Level ${s.level} · ${home} · ${s.stars} ★ · ${Object.keys(s.house).length} house items`;
  } catch {
    return 'A saved game';
  }
}

/** Called when the slot merged another device's progress into this browser's save during play (main.ts sets it). */
let localChanged: (() => void) | null = null;
export function onCloudMerged(fn: () => void): void {
  localChanged = fn;
}

// Merge mode: this browser's save and the account's are merged (src/saveMerge.ts) instead of asking the player to
// keep one and throw the other away, which is how progress got lost before. Levels, best stars and built items from
// both sides survive.
export const CLOUD_OPTIONS = {
  game: 'GNOME_SWEET_GNOME',
  saveKey: KEY,
  syncKey: 'gnome-sweet-gnome.cloud.v1',
  summarize,
  mode: 'merge',
  merge: mergeSaveTexts,
  onLocalChanged: () => localChanged?.(),
} satisfies CloudSlotOptions;

export const cloud = createCloudSlot(CLOUD_OPTIONS);

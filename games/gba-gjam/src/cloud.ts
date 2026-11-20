// Cloud save backup for signed-in players via @lawn/cloudsave ('merge' mode).
// Not signed in, or the service unreachable: the game plays from localStorage as before.
import { createCloudSlot, type CloudSlotOptions } from '@lawn/cloudsave';
import { SAVE_KEY, mergeSaveTexts, normalizeSave } from './save';

/** Short human-readable description of a save text, stored with each cloud upload. */
export function summarize(text: string): string {
  try {
    const raw: unknown = JSON.parse(text);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return 'GBA GJAM Save';
    const s = normalizeSave(raw);
    const p = s.custom.progression;
    const base = `${s.custom.name} · ${p.gamesPlayed} GP (${p.wins} W) · ${p.tournamentWins} 🏆`;
    if (s.season && s.season.phase !== 'complete') {
      return `${base} · Season (${s.season.phase})`;
    }
    return base;
  } catch {
    return 'GBA GJAM Save';
  }
}

let localChanged: (() => void) | null = null;
export function onCloudMerged(fn: () => void): void {
  localChanged = fn;
}

export const CLOUD_OPTIONS = {
  game: 'GNOME_JAM',
  saveKey: SAVE_KEY,
  syncKey: 'gnome-jam.cloud.v1',
  summarize,
  mode: 'merge',
  merge: mergeSaveTexts,
  onLocalChanged: () => localChanged?.(),
} satisfies CloudSlotOptions;

export const cloud = createCloudSlot(CLOUD_OPTIONS);

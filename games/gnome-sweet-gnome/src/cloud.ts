// Cloud saves for signed-in players: the local save (KEY in save.ts) mirrors to the account. See @lawn/cloudsave.
// Not signed in, or the service unreachable: the game plays from localStorage as before.
import { createCloudSlot } from '@lawn/cloudsave';
import { KEY, normalizeSave } from './save';
import { currentArea, homeOf, HOMES } from './house/houseData';

/** Short description of a save text, shown when two saves conflict. Unreadable text → a generic line. */
export function summarize(text: string): string {
  try {
    const raw: unknown = JSON.parse(text);
    if (!raw || typeof raw !== 'object') return 'A saved game';
    // The same normalizing the game applies when it loads a save, so both sides of a conflict read alike.
    const s = normalizeSave(raw);
    const area = currentArea(s.house);
    const home = area ? homeOf(area).name : HOMES[HOMES.length - 1].name;
    return `Level ${s.level} · ${home} · ${s.stars} ★ · ${Object.keys(s.house).length} house items`;
  } catch {
    return 'A saved game';
  }
}

export const cloud = createCloudSlot({
  game: 'GNOME_SWEET_GNOME',
  saveKey: KEY,
  syncKey: 'gnome-sweet-gnome.cloud.v1',
  summarize,
});

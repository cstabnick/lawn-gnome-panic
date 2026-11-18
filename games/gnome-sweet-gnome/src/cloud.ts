// Cloud saves for signed-in players: the local save (KEY in save.ts) mirrors to the account. See @lawn/cloudsave.
// Not signed in, or the service unreachable: the game plays from localStorage as before.
import { createCloudSlot } from '@lawn/cloudsave';
import { KEY } from './save';

/** Short description of a save text, shown when two saves conflict. Unreadable text → a generic line. */
export function summarize(text: string): string {
  try {
    const s = JSON.parse(text) as { level?: unknown; stars?: unknown; house?: unknown } | null;
    if (!s || typeof s !== 'object') return 'A saved game';
    const level = typeof s.level === 'number' ? s.level : 1;
    const stars = typeof s.stars === 'number' ? s.stars : 0;
    const built = s.house && typeof s.house === 'object' ? Object.keys(s.house).length : 0;
    return `Level ${level} · ${stars} ★ · ${built} house items`;
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

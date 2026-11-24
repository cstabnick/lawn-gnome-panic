// Entry: load player's gnome first, then boot Gnomelock.
import { loadMyGnome } from '@lawn/gnome';

await loadMyGnome();
const { bootGnomelock } = await import('./app');
bootGnomelock();

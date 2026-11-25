// Entry: load player's custom gnome first, then boot Gnome Souls.
import { loadMyGnome } from '@lawn/gnome';

await loadMyGnome();
const { bootGnomeSouls } = await import('./app');
bootGnomeSouls();

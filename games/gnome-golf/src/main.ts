// Entry: the full game, or (#minigame) this game's Gnome Party slice played alone against 3 CPUs.
import { loadMyGnome } from '@lawn/gnome';
await loadMyGnome();
if (/[#&]minigame\b/.test(location.hash)) (await import('./minigames/play')).playOwnSlice();
else await import('./app');

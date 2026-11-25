// Entry: the full game, or (#minigame) this game's Gnome Party slice played alone against 3 CPUs.
import { loadMyGnome } from '@lawn/gnome';
import { initGtaWasm } from './wasm/gtaWasm';

await Promise.all([loadMyGnome(), initGtaWasm()]);
if (/[#&]minigame\b/.test(location.hash)) (await import('./minigames/play')).playOwnSlice();
else {
  // Cloud save first (signed in only; gives up after 4 s), so the save modules app.ts imports read the merged progress.
  await (await import('./cloudSave')).startCloudSave();
  await import('./app');
}

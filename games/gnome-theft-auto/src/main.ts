// Entry: the full game, or (#minigame) this game's Gnome Party slice played alone against 3 CPUs.
import { loadMyGnome } from '@lawn/gnome';
import { initGtaWasm } from './wasm/gtaWasm';
import { hideLoading, loadingProgress, showLoading } from './loading/loader';

showLoading(['Fetching your gnome', 'Syncing your save', 'Building Turfton', 'Planting the gnomes']);
loadingProgress(0, 'Fetching your gnome');
await Promise.all([loadMyGnome(), initGtaWasm()]);
if (/[#&]minigame\b/.test(location.hash)) {
  (await import('./minigames/play')).playOwnSlice();
  hideLoading();
} else {
  // Cloud save first (signed in only; gives up after 4 s), so the save modules app.ts imports read the merged progress.
  loadingProgress(1, 'Syncing your save');
  await (await import('./cloudSave')).startCloudSave();
  loadingProgress(2, 'Building Turfton');
  await import('./app');
}

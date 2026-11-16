import { createVolumeStore } from '@arcade/volume';
import { onSettingsChange, settings, updateSettings } from './settings';

const STORAGE_KEY = 'gnomomia-volume';

let hasSaved = false;
try {
  hasSaved = Boolean(localStorage.getItem(STORAGE_KEY));
} catch {
  // Ignore storage errors.
}

export const volume = createVolumeStore({
  storageKey: STORAGE_KEY,
  defaults: { master: settings.volume },
});

if (!hasSaved && settings.muted) {
  volume.setMuted('master', true);
}

// Keep the Settings modal's muted/volume fields synced with the shared volume store.
let syncing = false;

volume.subscribe((s) => {
  if (syncing) return;
  syncing = true;
  try {
    if (settings.volume !== s.master || settings.muted !== s.muted.master) {
      updateSettings({ volume: s.master, muted: s.muted.master });
    }
  } finally {
    syncing = false;
  }
});

onSettingsChange((s) => {
  if (syncing) return;
  syncing = true;
  try {
    if (volume.get('master') !== s.volume) volume.set('master', s.volume);
    if (volume.isMuted('master') !== s.muted) volume.setMuted('master', s.muted);
  } finally {
    syncing = false;
  }
});

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
  defaults: {
    master: settings.volume,
    music: settings.musicVolume,
  },
});

if (!hasSaved) {
  if (settings.muted) volume.setMuted('master', true);
  if (settings.musicMuted) volume.setMuted('music', true);
}

// Keep the Settings modal's audio fields synced with the shared volume store.
let syncing = false;

volume.subscribe((s) => {
  if (syncing) return;
  syncing = true;
  try {
    if (
      settings.volume !== s.master ||
      settings.muted !== s.muted.master ||
      settings.musicVolume !== s.music ||
      settings.musicMuted !== s.muted.music
    ) {
      updateSettings({
        volume: s.master,
        muted: s.muted.master,
        musicVolume: s.music,
        musicMuted: s.muted.music,
      });
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
    if (volume.get('music') !== s.musicVolume) volume.set('music', s.musicVolume);
    if (volume.isMuted('music') !== s.musicMuted) volume.setMuted('music', s.musicMuted);
  } finally {
    syncing = false;
  }
});

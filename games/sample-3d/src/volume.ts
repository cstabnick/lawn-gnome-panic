import { createVolumeStore } from '@arcade/volume';

const STORAGE_KEY = 'lgp-volume';
const LEGACY_MUTE_KEY = 'lgp-music-muted';

export const volume = createVolumeStore({ storageKey: STORAGE_KEY });

// Preserve legacy music-mute preference on first upgrade.
try {
  if (!localStorage.getItem(STORAGE_KEY) && localStorage.getItem(LEGACY_MUTE_KEY) === '1') {
    volume.setMuted('music', true);
  }
} catch {
  // Ignore storage errors.
}

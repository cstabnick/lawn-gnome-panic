import { CLEARED_AT_KEY, photoCloud } from './cloud';
import type { PhotoRecord } from './types';

export const STORAGE_KEY = 'gnomeokemon.bestPhotos.v1';

export type BestPhotoMap = Record<string, PhotoRecord>;

export function loadBestPhotos(): BestPhotoMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as BestPhotoMap;
  } catch {
    return {};
  }
}

export function saveBestPhoto(photo: PhotoRecord): { updated: boolean; best: BestPhotoMap } {
  const best = loadBestPhotos();
  const prev = best[photo.speciesId];
  const updated = !prev || photo.score.total >= prev.score.total;
  if (updated) {
    best[photo.speciesId] = photo;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(best));
    } catch {
      // Ignore storage quota errors in private/restricted browsers
    }
    photoCloud.pushSave();
  }
  return { updated, best };
}

export function clearBestPhotos(): void {
  try {
    // An empty map, not a removed key: the cloud slot then pushes the cleared gallery to the account right away.
    localStorage.setItem(STORAGE_KEY, '{}');
    localStorage.setItem(CLEARED_AT_KEY, String(Date.now()));
  } catch {
    // Ignore
  }
  photoCloud.pushSave();
}

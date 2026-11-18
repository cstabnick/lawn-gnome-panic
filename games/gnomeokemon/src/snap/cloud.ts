// Cloud sync for the best photo per species (Gnomokemon Snap). A signed-in player's photos follow them across
// devices through @lawn/cloudsave in 'merge' mode: each device ends up with the best-scoring photo of every species
// any device took. The cloud copy holds small JPEG thumbnails (full-size data URLs would exceed the save limit);
// each device keeps its own full-size photos locally.
import { createCloudSlot } from '@lawn/cloudsave';
import { STORAGE_KEY, type BestPhotoMap } from './storage';
import type { PhotoRecord } from './types';

/** localStorage key holding the time (ms) the player last cleared their photos. */
export const CLEARED_AT_KEY = 'gnomeokemon.clearedAt';

/** Data URLs shorter than this are already small enough to keep as they are. */
const SHORT_DATA_URL = 30000;
const THUMB_WIDTH = 192;
const THUMB_QUALITY = 0.6;

function parseMap(text: string | null): BestPhotoMap {
  if (!text) return {};
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as BestPhotoMap;
  } catch {
    return {};
  }
}

function scoreOf(photo: PhotoRecord): number {
  const total = photo?.score?.total;
  return typeof total === 'number' && Number.isFinite(total) ? total : -Infinity;
}

function sortedJson(map: BestPhotoMap): string {
  const out: BestPhotoMap = {};
  for (const key of Object.keys(map).sort()) out[key] = map[key];
  return JSON.stringify(out);
}

function clearedAt(): number {
  try {
    const n = Number(localStorage.getItem(CLEARED_AT_KEY) ?? 0);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * Merges this browser's best photos with the account's. Per species the higher score.total wins; on a tie the local
 * photo is kept. Remote photos captured at or before the last clear are dropped. Output keys are sorted.
 */
export function mergePhotos(local: string | null, remote: string): string {
  const merged: BestPhotoMap = { ...parseMap(local) };
  const cleared = clearedAt();
  for (const [speciesId, photo] of Object.entries(parseMap(remote))) {
    if (!photo || typeof photo !== 'object') continue;
    if (typeof photo.capturedAt === 'number' && photo.capturedAt <= cleared) continue;
    const prev = merged[speciesId];
    if (!prev || scoreOf(photo) > scoreOf(prev)) merged[speciesId] = photo;
  }
  return sortedJson(merged);
}

/** Draws a data URL into a 192 px wide JPEG thumbnail. Returns '' on any failure. */
async function shrinkDataUrl(dataUrl: string): Promise<string> {
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('image failed to load'));
      img.src = dataUrl;
    });
    if (!img.width || !img.height) return '';
    const width = THUMB_WIDTH;
    const height = Math.max(1, Math.round((img.height * THUMB_WIDTH) / img.width));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', THUMB_QUALITY);
  } catch {
    return '';
  }
}

/** The local map with every full-size photo replaced by a thumbnail. Output keys are sorted. */
export async function thumbnailPhotos(local: string, shrink: (dataUrl: string) => Promise<string> = shrinkDataUrl): Promise<string> {
  const map = parseMap(local);
  const out: BestPhotoMap = {};
  for (const [speciesId, photo] of Object.entries(map)) {
    if (!photo || typeof photo !== 'object' || typeof photo.dataUrl !== 'string' || photo.dataUrl.length < SHORT_DATA_URL) {
      out[speciesId] = photo;
      continue;
    }
    out[speciesId] = { ...photo, dataUrl: await shrink(photo.dataUrl) };
  }
  return sortedJson(out);
}

function countSpecies(text: string): number {
  return Object.keys(parseMap(text)).length;
}

export const photoCloud = createCloudSlot({
  game: 'GNOMOKEMON',
  // A getter, not the value: storage.ts imports photoCloud, so this module must not read STORAGE_KEY while it
  // is still loading. The slot only reads saveKey inside its functions.
  get saveKey() {
    return STORAGE_KEY;
  },
  syncKey: 'gnomeokemon.cloud.v1',
  mode: 'merge',
  merge: mergePhotos,
  toCloud: (text) => thumbnailPhotos(text),
  summarize: (text) => `${countSpecies(text)} species photographed`,
});

// Farm events other systems listen to (E18's chef ingredients, achievements). Module-level so a listener can subscribe
// at import time; farm/runtime.ts emits.
import type { CropId } from './types';

export interface HarvestEvent {
  crop: CropId;
  /** Produce (crops) or acorns (the oak's shake). */
  n: number;
  bed: number | null;
}

type Cb = (e: HarvestEvent) => void;
const harvestCbs = new Set<Cb>();

/** Called on every harvest and every oak shake. Returns an unsubscribe function. */
export function onHarvest(cb: Cb): () => void {
  harvestCbs.add(cb);
  return () => harvestCbs.delete(cb);
}

export function emitHarvest(e: HarvestEvent): void {
  for (const cb of harvestCbs) cb(e);
}

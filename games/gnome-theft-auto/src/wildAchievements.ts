import type { CritterEvent } from './critters';
import type { VehicleKind } from './types';

/** Wildlife events that unlock an achievement (packages/achievements catalog.ts). */
export const CRITTER_ACHIEVEMENTS: Readonly<Partial<Record<CritterEvent, string>>> = {
  'herd-herded': 'gta-herd-grapevine',
  'cow-tipped': 'gta-tipping-point',
  'drey-scattered': 'gta-drey-day',
  'snowman-smashed': 'gta-snow-joke',
  'bear-shrug': 'gta-unbearably-chill',
  'swarm-escaped': 'gta-bee-line',
};

/** The boats "Captain Clay" counts (Tessie is not one of them). */
export const HELM_BOATS: readonly VehicleKind[] = ['walnut-dinghy', 'gravy-boat', 'clog-cruiser', 'watering-can-steamer', 'hoa-patrol-boat'];
export const HELMED_KEY = 'gta-boats-helmed-v1';
export const CAPTAIN_CLAY = 'gta-captain-clay';

export interface HelmStorage { getItem(k: string): string | null; setItem(k: string, v: string): void }

/** Used when storage is missing or throws: the kinds helmed on this page. */
const memoryHelmed = new Set<string>();

/** Parse the stored set; anything that is not a JSON array of strings counts as empty. */
function parseHelmed(raw: string | null): Set<string> {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : []);
  } catch {
    return new Set();
  }
}

/** Remember that the player took the helm of `kind`. True only the first time ever for a HELM_BOATS kind
 *  (the set is a JSON array of kinds under HELMED_KEY; garbage counts as empty; a throwing or null storage
 *  keeps a per-module in-memory set instead). */
export function recordHelm(kind: VehicleKind, storage: HelmStorage | null): boolean {
  if (!HELM_BOATS.includes(kind)) return false;
  if (storage) {
    try {
      const known = parseHelmed(storage.getItem(HELMED_KEY));
      if (known.has(kind)) return false;
      known.add(kind);
      storage.setItem(HELMED_KEY, JSON.stringify([...known]));
      return true;
    } catch {
      // Storage is unavailable: fall through to the in-memory set.
    }
  }
  if (memoryHelmed.has(kind)) return false;
  memoryHelmed.add(kind);
  return true;
}

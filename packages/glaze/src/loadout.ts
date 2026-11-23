// Loadout values: the stock loadout, cleaning, a compact text code (for saves and the network), and what a change costs.
// STUB: defaultLoadout is final; the rest are placeholders with their final signatures (see the issue that owns this file).
import type { Loadout } from './types';

/** The stock vehicle in this body colour: every slot at its factory setting. */
export function defaultLoadout(paint: number): Loadout {
  return {
    paint: paint & 0xffffff, finish: 'gloss', decal: 'none', decalColor: 0xffffff, decalNumber: 7,
    tyre: 'stock', rim: 'stock', rimColor: 0xc8ccd2, wheelSize: 1, camberFront: 0, camberRear: 0, rideHeight: 0,
    steer: 'stock', lamp: 'stock', beam: 'warm', spoiler: 'none', seat: 'none', ornament: 'none', extras: [], underglow: null,
  };
}

/** Any input (a saved blob, a decoded code, a half-filled object) -> a valid Loadout: unknown ids become stock, numbers are clamped, extras deduped and capped. Never throws. */
export function normalizeLoadout(input: Partial<Loadout> | null | undefined, paintFallback = 0xd8342c): Loadout {
  return { ...defaultLoadout(paintFallback), ...(input ?? {}) };
}

/** Compact, URL-safe text for a loadout: starts with 'g1.', only [A-Za-z0-9._-], at most 120 characters. */
export function encodeLoadout(_l: Loadout): string {
  return 'g1.';
}

/** The inverse of encodeLoadout; null for anything that is not a valid code (wrong prefix, bad length, bad characters). decode(encode(l)) deep-equals normalize(l). */
export function decodeLoadout(_code: string): Loadout | null {
  return null;
}

/** True when every field is equal (extras compared as sets). */
export function sameLoadout(a: Loadout, b: Loadout): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** True when nothing but (maybe) the paint colour differs from defaultLoadout. */
export function isStockLoadout(l: Loadout): boolean {
  return sameLoadout({ ...l, paint: 0 }, { ...defaultLoadout(0) });
}

export interface CostLine { label: string; price: number }

/** What the shop charges, line by line, to turn what the player already owns into `wanted`: only things that CHANGE are charged (see PRICES and each ModDef.price in catalog.ts). */
export function loadoutCostLines(_owned: Loadout, _wanted: Loadout): CostLine[] {
  return [];
}

export function loadoutCost(owned: Loadout, wanted: Loadout): number {
  return loadoutCostLines(owned, wanted).reduce((n, l) => n + l.price, 0);
}

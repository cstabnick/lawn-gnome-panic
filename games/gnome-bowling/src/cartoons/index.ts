// The cartoon registry. To add a cartoon: write it in the pack file for its kind (or a new pack file) and make
// sure the pack's list is in ALL below. config.ts CARTOON_CHANCE sets how often a kind plays a cartoon at all.
import { CARTOON_CHANCE, type ResultKind } from '../config';
import { rng } from './crt';
import { GUTTER_CARTOONS } from './gutter';
import { SPARE_CARTOONS } from './spare';
import { STRIKE_CARTOONS } from './strike';
import { TURKEY_CARTOONS } from './turkey';
import type { Cartoon } from './types';

export const ALL_CARTOONS: readonly Cartoon[] = [...STRIKE_CARTOONS, ...TURKEY_CARTOONS, ...SPARE_CARTOONS, ...GUTTER_CARTOONS];

export function getCartoon(id: string): Cartoon | null {
  return ALL_CARTOONS.find((c) => c.id === id) ?? null;
}

/** `#cartoon=<id>` in the URL: that cartoon every time it fits the result. */
function forcedId(): string | null {
  try {
    const m = /cartoon=([a-z0-9-]+)/.exec(location.hash);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/**
 * The cartoon to play for a result of this kind, or null for the classic card. Deterministic for a seed
 * (so every device in an online game agrees).
 */
export function pickCartoon(kind: ResultKind, seed: number): string | null {
  const fits = ALL_CARTOONS.filter((c) => c.kinds.includes(kind));
  if (fits.length === 0) return null;
  const forced = forcedId();
  if (forced) {
    const f = fits.find((c) => c.id === forced);
    if (f) return f.id;
  }
  const r = rng(seed);
  if (r() >= (CARTOON_CHANCE[kind] ?? 0)) return null;
  const total = fits.reduce((a, c) => a + (c.weight ?? 1), 0);
  let x = r() * total;
  for (const c of fits) {
    x -= c.weight ?? 1;
    if (x <= 0) return c.id;
  }
  return fits[fits.length - 1].id;
}

// The street composer (E29): packs European buildings (catalog.ts EURO_BUILDINGS) into a dense, irregular row. Pure maths.
// Signatures are fixed by docs/roadmaps/gta-batch-3/E29/issues/A12-street-composer.md.

import { EURO_BUILDINGS, EURO_ROOF_TINTS, EURO_WALL_TINTS, euroBuilding } from './catalog';
import type { EuroBuilding } from './catalog';

/** Gap (m) left between neighbouring buildings so their party walls never share a face. */
export const PARTY_GAP = 0.12;

const CORNER_ID = 'euro-corner-cafe';

/** One building (or prop) to place: prefab id, world position on the ground, yaw (radians, three.js rotation.y), paints. */
export interface EuroPlacement {
  id: string;
  x: number;
  z: number;
  yaw: number;
  scale: number;
  /** Wall paint (prefab tint). */
  tint?: number;
  /** Roof paint (prefab trim). */
  trim?: number;
}

export interface StreetRowOpts {
  /** Where the row starts (world): the front-left corner of the first building, on the frontage line. */
  x: number;
  z: number;
  /** Rotation of the row (three.js rotation.y): the row runs along local +x, fronts face local +z. */
  yaw: number;
  /** Frontage length to fill (m). */
  length: number;
  /** Deterministic seed. */
  seed: number;
  /** Building ids to choose from (terrace pieces). Default: every 'terrace' building in EURO_BUILDINGS. */
  mix?: readonly string[];
  /** Largest random step back (m) of a building's front from the frontage line. Default 0.35. */
  setback?: number;
  /** End the row with a corner building ('euro-corner-cafe') when it fits. Default false. */
  corner?: boolean;
}

/** Small seeded PRNG (mulberry32). Same seed, same sequence. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(list: readonly T[], rnd: () => number): T {
  return list[Math.floor(rnd() * list.length)];
}

/** Pick from `list`, avoiding `avoid` when there is another choice. */
function pickAvoiding<T>(list: readonly T[], avoid: T | undefined, rnd: () => number): T {
  const pool = avoid === undefined ? list : list.filter((v) => v !== avoid);
  return pick(pool.length ? pool : list, rnd);
}

/** Fill a frontage with buildings, left to right. Returns nothing when no candidate fits. */
export function planStreetRow(o: StreetRowOpts): EuroPlacement[] {
  const rnd = mulberry32(o.seed);
  const setback = o.setback ?? 0.35;
  const cands: EuroBuilding[] = [];
  for (const id of o.mix ?? EURO_BUILDINGS.filter((b) => b.role === 'terrace').map((b) => b.id)) {
    const b = euroBuilding(id);
    if (b && !cands.some((c) => c.id === b.id)) cands.push(b);
  }
  const distinct = cands.length;

  // Reserve the corner at the far end of the row, when it fits at all.
  const corner = o.corner ? euroBuilding(CORNER_ID) : undefined;
  const useCorner = corner !== undefined && corner.width <= o.length;
  const limit = useCorner && corner ? o.length - corner.width - PARTY_GAP : o.length;

  const cs = Math.cos(o.yaw);
  const sn = Math.sin(o.yaw);
  const place = (b: EuroBuilding, a: number, tint: number, trim: number): EuroPlacement => {
    const jitter = rnd() * setback;
    const along = a + b.width / 2;
    const across = -(b.depth / 2) - jitter;
    return {
      id: b.id,
      x: o.x + along * cs + across * sn,
      z: o.z - along * sn + across * cs,
      yaw: o.yaw,
      scale: 1,
      tint,
      trim,
    };
  };

  const out: EuroPlacement[] = [];
  let a = 0;
  let prevId: string | undefined;
  let prevTint: number | undefined;
  for (;;) {
    const room = limit - a;
    const fits = cands.filter((b) => b.width <= room + 1e-9);
    if (fits.length === 0) break;
    let pool = fits.filter((b) => b.id !== prevId);
    if (pool.length === 0) {
      // Only the same building fits again: end the row rather than repeat it.
      if (distinct >= 2) break;
      pool = fits;
    }
    const b = pick(pool, rnd);
    const tint = pickAvoiding(EURO_WALL_TINTS, prevTint, rnd);
    const trim = pick(EURO_ROOF_TINTS, rnd);
    out.push(place(b, a, tint, trim));
    a += b.width + PARTY_GAP;
    prevId = b.id;
    prevTint = tint;
  }

  if (useCorner && corner) {
    const tint = pickAvoiding(EURO_WALL_TINTS, prevTint, rnd);
    const trim = pick(EURO_ROOF_TINTS, rnd);
    out.push(place(corner, o.length - corner.width, tint, trim));
  }
  return out;
}

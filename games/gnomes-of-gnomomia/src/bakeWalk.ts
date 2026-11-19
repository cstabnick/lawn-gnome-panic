// Baking the walkability grid: which rectangles, how, and the fingerprint that tells a stale bake from a fresh one.
import { WalkGrid, bakeTile, mulberry32, type Rect } from '@lawn/level';
import { TUNING, WORLD, type ZoneDef, type ZoneId } from './config';
import type { Terrain } from './terrainCore';

export interface WalkTileSpec {
  /** The zone id. */
  id: string;
  rect: Rect;
}

/** One tile per outdoor zone: its square plus WORLD.blend on every side. Interiors and the Deeps are not baked. */
export function walkTileSpecs(zones: Record<ZoneId, ZoneDef>): WalkTileSpec[] {
  return Object.values(zones)
    .filter((z) => !z.indoor)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((z) => {
      const o = z.origin ?? { x: 0, z: 0 };
      const h = z.half + WORLD.blend;
      return { id: z.id, rect: { minX: o.x - h, maxX: o.x + h, minZ: o.z - h, maxZ: o.z + h } };
    });
}

/** Bakes the given tiles with terrain.staticSolidAt (never the installed grid) and returns a grid holding them (added to
 * `into` when given, replacing tiles of the same id). */
export function bakeWalkTiles(t: Terrain, specs: WalkTileSpec[], into?: WalkGrid): WalkGrid {
  const grid = into ?? new WalkGrid();
  for (const spec of specs) grid.setTile(bakeTile(spec.id, spec.rect, (x, z) => t.staticSolidAt(x, z)));
  return grid;
}

/** FNV-1a over UTF-16 code units. Two lanes with different offsets make a 64-bit-wide fingerprint without node's crypto. */
function fnv1a(s: string, offset: number): string {
  let h = offset >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

const FINGERPRINT_POINTS = 8192;
const FINGERPRINT_SEED = 20240607;

/** A fingerprint of everything a bake depends on: the terrain-relevant zone data (shape in the bake docs), the delta raster,
 * WORLD and TUNING, and terrain.staticSolidAt at a fixed pseudo-random set of points inside the tiles. Pure (no node APIs):
 * the bake script, the build check and the editor all call it and must get the same string for the same inputs. */
export function computeBakeHash(t: Terrain, zones: Record<ZoneId, ZoneDef>): string {
  const outdoor = Object.values(zones)
    .filter((z) => !z.indoor)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const zoneShape = outdoor.map((z) => {
    const o = z.origin ?? { x: 0, z: 0 };
    return [
      z.id, o.x, o.z, z.half, z.shrine.x, z.shrine.z,
      z.regions.map((r) => [r.id, r.x, r.z, r.r]),
      z.lakes.map((l) => [l.x, l.z, l.r]),
      z.houses.map((h) => [h.x, h.z, h.r]),
      (z.decks ?? []).map((d) => [d.x, d.z, d.w, d.d, d.y, d.stair]),
      (z.walls ?? []).map((w) => [w.x1, w.z1, w.x2, w.z2]),
      z.exits.map((e) => [e.to, e.x, e.z]),
      z.theme.flora, z.theme.floraDensity, z.theme.hilliness,
      z.stamps ?? [],
      z.paths ?? [],
      (z.props ?? []).map((p) => [p.x, p.z, p.solidR ?? 0]),
    ];
  });

  const specs = walkTileSpecs(zones);
  let fingerprint = '';
  if (specs.length > 0) {
    const rng = mulberry32(FINGERPRINT_SEED);
    const bits: string[] = [];
    for (let i = 0; i < FINGERPRINT_POINTS; i++) {
      const { rect } = specs[i % specs.length];
      const x = rect.minX + rng() * (rect.maxX - rect.minX);
      const z = rect.minZ + rng() * (rect.maxZ - rect.minZ);
      bits.push(t.staticSolidAt(x, z) ? '1' : '0');
    }
    fingerprint = bits.join('');
  }

  // Every number is rounded to a micrometre before hashing. Some zone data is computed with sin and cos (the generated house
  // doors), and different Node / V8 versions and CPUs can differ from each other in the last bit of those: written out at
  // full precision they would give a different fingerprint on another machine (and fail the build there) for the same level.
  const round6 = (_k: string, v: unknown): unknown => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v);
  const text = JSON.stringify({ zones: zoneShape, world: WORLD, water: TUNING.waterLevel, deltas: t.deltas.toJSON(), paint: t.paint.toJSON(), fingerprint }, round6);
  return fnv1a(text, 0x811c9dc5) + fnv1a(text, 0x9747b28c);
}

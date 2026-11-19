// STUB: a worker fills this in (docs/roadmaps/level-format.md, issue C1). Keep the exported names and signatures.
// Baking the walkability grid: which rectangles, how, and the fingerprint that tells a stale bake from a fresh one.
import { WalkGrid, type Rect } from '@lawn/level';
import type { ZoneDef, ZoneId } from './config';
import type { Terrain } from './terrainCore';

export interface WalkTileSpec {
  /** The zone id. */
  id: string;
  rect: Rect;
}

/** One tile per outdoor zone: its square plus WORLD.blend on every side. Interiors and the Deeps are not baked. */
export function walkTileSpecs(_zones: Record<ZoneId, ZoneDef>): WalkTileSpec[] {
  return [];
}

/** Bakes the given tiles with terrain.staticSolidAt (never the installed grid) and returns a grid holding them (added to
 * `into` when given, replacing tiles of the same id). */
export function bakeWalkTiles(_t: Terrain, _specs: WalkTileSpec[], into?: WalkGrid): WalkGrid {
  return into ?? new WalkGrid();
}

/** A fingerprint of everything a bake depends on: the terrain-relevant zone data (shape in the bake docs), the delta raster,
 * WORLD and TUNING, and terrain.staticSolidAt at a fixed pseudo-random set of points inside the tiles. Pure (no node APIs):
 * the bake script, the build check and the editor all call it and must get the same string for the same inputs. */
export function computeBakeHash(_t: Terrain, _zones: Record<ZoneId, ZoneDef>): string {
  return '';
}

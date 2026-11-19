// A Terrain for games that are not Gnomomia: the editor's view only needs heights and ground colours, so every other question
// (walking, roads, flora, gates...) gets the plainest possible answer. Club Gnome's maps are flat; Gnome Front supplies the
// game's own height function.
import { DeltaGrid, PaintGrid, type WalkGrid } from '@lawn/level';
import type { ZoneDef } from '@gnomomia/config';
import type { Terrain } from '@gnomomia/terrainCore';

export interface StubOptions {
  zone: ZoneDef;
  /** The level's own rectangle: outside it nothing is walkable. */
  w: number;
  d: number;
  heightAt?: (x: number, z: number) => number;
  groundColourAt: (x: number, z: number) => number;
  regionNameAt?: (x: number, z: number) => string;
  /** Called by invalidate(): rebuild whatever the height or colour functions cache (Gnome Golf's per-hole boxes). */
  onInvalidate?: () => void;
}

export function createStubTerrain(o: StubOptions): Terrain {
  let deltas = new DeltaGrid();
  let paint = new PaintGrid();
  let walk: WalkGrid | null = null;
  const inside = (x: number, z: number): boolean => Math.abs(x) <= o.w / 2 && Math.abs(z) <= o.d / 2;
  const h = o.heightAt ?? (() => 0);
  return {
    zoneRectDistance: (_id, x, z) => Math.max(Math.abs(x) - o.w / 2, Math.abs(z) - o.d / 2),
    zoneAt: (x, z) => (inside(x, z) ? o.zone.id : null),
    themeZoneAt: () => o.zone,
    roadSegments: () => [],
    passes: () => [],
    passOpen: () => true,
    distToRoad: () => Infinity,
    heightAt: h,
    deckLayout: () => [],
    surfacesAt: (x, z) => [h(x, z)],
    addCollider: () => {},
    chunkFlora: () => [],
    isBlocked: (x, z) => !inside(x, z),
    findFreeSpot: (x, z) => ({ x, z }),
    isBlockedAt: (x, z) => !inside(x, z),
    standY: (x, z) => (inside(x, z) ? h(x, z) : null),
    groundColourAt: o.groundColourAt,
    regionNameAt: o.regionNameAt ?? (() => ''),
    staticSolidAt: (x, z) => !inside(x, z),
    setWalkGrid(g) { walk = g; },
    get walkGrid() { return walk; },
    get deltas() { return deltas; },
    setDeltas(g) { deltas = g; },
    get paint() { return paint; },
    setPaint(g) { paint = g; },
    invalidate: () => o.onInvalidate?.(),
  };
}

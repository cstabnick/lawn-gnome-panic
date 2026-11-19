// Club Gnome's maps are flat: the editor still wants a Terrain for the view, so this one answers every question with "flat,
// nothing in the way". Outside the map's rectangle the ground is drawn dark so the real extent of the map shows.
import { DeltaGrid, PaintGrid, type WalkGrid } from '@lawn/level';
import type { ZoneDef } from '@gnomomia/config';
import type { Terrain } from '@gnomomia/terrainCore';

const OUTSIDE = 0x2a2e36;

export interface FlatMap {
  w: number;
  d: number;
  ground: number;
  name: string;
  buildings: { label: string; x: number; z: number; w: number; d: number }[];
}

export function createFlatTerrain(zone: ZoneDef, map: FlatMap): Terrain {
  let deltas = new DeltaGrid();
  let paint = new PaintGrid();
  let walk: WalkGrid | null = null;
  const inside = (x: number, z: number): boolean => Math.abs(x) <= map.w / 2 && Math.abs(z) <= map.d / 2;
  return {
    zoneRectDistance: (_id, x, z) => Math.max(Math.abs(x) - map.w / 2, Math.abs(z) - map.d / 2),
    zoneAt: (x, z) => (inside(x, z) ? zone.id : null),
    themeZoneAt: () => zone,
    roadSegments: () => [],
    passes: () => [],
    passOpen: () => true,
    distToRoad: () => Infinity,
    heightAt: () => 0,
    deckLayout: () => [],
    surfacesAt: () => [0],
    addCollider: () => {},
    chunkFlora: () => [],
    isBlocked: (x, z) => !inside(x, z),
    findFreeSpot: (x, z) => ({ x, z }),
    isBlockedAt: (x, z) => !inside(x, z),
    standY: (x, z) => (inside(x, z) ? 0 : null),
    groundColourAt: (x, z) => (inside(x, z) ? map.ground : OUTSIDE),
    regionNameAt: (x, z) => map.buildings.find((b) => Math.abs(x - b.x) <= b.w / 2 && Math.abs(z - b.z) <= b.d / 2)?.label ?? map.name,
    staticSolidAt: (x, z) => !inside(x, z),
    setWalkGrid(g) { walk = g; },
    get walkGrid() { return walk; },
    get deltas() { return deltas; },
    setDeltas(g) { deltas = g; },
    get paint() { return paint; },
    setPaint(g) { paint = g; },
    invalidate: () => {},
  };
}

// Club Gnome's maps are flat. Outside the map's rectangle the ground is drawn dark so the real extent of the map shows.
import type { ZoneDef } from '@gnomomia/config';
import type { Terrain } from '@gnomomia/terrainCore';
import { createStubTerrain } from './stubTerrain';

const OUTSIDE = 0x2a2e36;

export interface FlatMap {
  w: number;
  d: number;
  ground: number;
  name: string;
  buildings: { label: string; x: number; z: number; w: number; d: number }[];
}

export function createFlatTerrain(zone: ZoneDef, map: FlatMap): Terrain {
  const inside = (x: number, z: number): boolean => Math.abs(x) <= map.w / 2 && Math.abs(z) <= map.d / 2;
  return createStubTerrain({
    zone, w: map.w, d: map.d,
    groundColourAt: (x, z) => (inside(x, z) ? map.ground : OUTSIDE),
    regionNameAt: (x, z) => map.buildings.find((b) => Math.abs(x - b.x) <= b.w / 2 && Math.abs(z - b.z) <= b.d / 2)?.label ?? map.name,
  });
}

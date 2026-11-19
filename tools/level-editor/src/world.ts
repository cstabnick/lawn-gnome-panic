// Loads Gnomomia's own content and terrain code (through the @gnomomia alias) and makes the editor's terrain instance.
import { DeltaGrid } from '@lawn/level';
import type { ZoneDef, ZoneId } from '@gnomomia/config';
import { OBJECTS, ZONES } from '@gnomomia/content';
import { createTerrain, type Terrain } from '@gnomomia/terrainCore';
import { loadWorldDeltas } from '@gnomomia/worldDeltas';

export interface World {
  terrain: Terrain;
  zones: Record<ZoneId, ZoneDef>;
  deltas: DeltaGrid;
  outdoorZones: ZoneId[];
  /** Flips the gate check the terrain was built with. */
  setGatesOpen(open: boolean): void;
  readonly gatesOpen: boolean;
}

export function createWorld(): World {
  let gatesOpen = true;
  const terrain = createTerrain({ zones: ZONES, objects: OBJECTS, checkCondition: () => gatesOpen });
  const deltas = loadWorldDeltas() ?? new DeltaGrid();
  terrain.setDeltas(deltas);
  const outdoorZones = (Object.values(ZONES) as ZoneDef[]).filter((z) => !z.indoor).map((z) => z.id);
  return {
    terrain,
    zones: ZONES,
    deltas,
    outdoorZones,
    setGatesOpen(open) { gatesOpen = open; },
    get gatesOpen() { return gatesOpen; },
  };
}

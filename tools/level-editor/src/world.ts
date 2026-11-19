// Loads Gnomomia's own content and terrain code (through the @gnomomia alias) and makes the editor's terrain instance.
import { DeltaGrid } from '@lawn/level';
import type { ZoneDef } from '@gnomomia/config';
import type { World } from './context';
import { OBJECTS, ZONES } from '@gnomomia/content';
import { createTerrain, type Terrain } from '@gnomomia/terrainCore';
import { loadWorldDeltas } from '@gnomomia/worldDeltas';
import { loadWorldPaint } from '@gnomomia/worldPaint';

export function createWorld(): World {
  let gatesOpen = true;
  const terrain = createTerrain({ zones: ZONES, objects: OBJECTS, checkCondition: () => gatesOpen });
  const deltas = loadWorldDeltas() ?? new DeltaGrid();
  terrain.setDeltas(deltas);
  const paint = loadWorldPaint();
  if (paint) terrain.setPaint(paint);
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

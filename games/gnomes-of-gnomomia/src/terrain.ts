// Terrain: the game's own instance of the terrain core (terrainCore.ts), built from the game's zones and quest state,
// with the brush deltas and the baked walkability grid installed. Every function the rest of the game imports from here
// is a method of that one instance, so nothing else had to change when terrain became createTerrain().
import { OBJECTS, ZONES } from './content';
import { checkCondition } from './quests';
import { createTerrain } from './terrainCore';
import { loadWalkGrid } from './walkBake';
import { loadWorldDeltas } from './worldDeltas';

export type { Flora, FloraKind, Pass, RoadSeg, Terrain, TerrainInput } from './terrainCore';

export const terrain = createTerrain({ zones: ZONES, objects: OBJECTS, checkCondition });

const deltas = loadWorldDeltas();
if (deltas) terrain.setDeltas(deltas);
const baked = loadWalkGrid();
if (baked) terrain.setWalkGrid(baked);

export const {
  zoneRectDistance, zoneAt, themeZoneAt, roadSegments, passes, passOpen, distToRoad, heightAt, deckLayout, surfacesAt,
  addCollider, chunkFlora, isBlocked, findFreeSpot, isBlockedAt, standY, groundColourAt, regionNameAt,
} = terrain;

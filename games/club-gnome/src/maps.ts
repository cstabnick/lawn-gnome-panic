// The town's maps as plain data (no three.js, no DOM). world.ts draws them, walk.ts walks them, main.ts reads the
// portals and spots. The data lives in data/levels/<id>.level.json (level documents, see levelDocs.ts); this file only
// turns them into MapDefs. Units: 1 = about one gnome's height. +z is the front (toward the camera). Rotations: rot 0 faces +z.
// Every position the issue fixed is binding; the decoration around them is free.
import type { MapDef, MapId } from './config';
import { docToMap, MAP_DOCS } from './levelDocs';

export const MAPS: Record<MapId, MapDef> = {
  town: docToMap(MAP_DOCS.town),
  gnomecino: docToMap(MAP_DOCS.gnomecino),
  arcade: docToMap(MAP_DOCS.arcade),
  park: docToMap(MAP_DOCS.park),
};

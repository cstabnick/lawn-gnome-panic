// The town's maps as plain data (no three.js, no DOM). world.ts draws them, walk.ts walks them, main.ts reads the
// portals and spots. STUB: replaced by the maps issue; keep the export names and types.
import type { MapDef, MapId } from './config';

const empty = (id: MapId): MapDef => ({
  id, w: 30, d: 20, ground: 0x7fb45a, indoor: false, spawn: { x: 0, z: 0 },
  buildings: [], props: [], blockers: [], portals: [], spots: [], signs: [],
});

export const MAPS: Record<MapId, MapDef> = {
  town: empty('town'),
  gnomecino: empty('gnomecino'),
  arcade: empty('arcade'),
  park: empty('park'),
};

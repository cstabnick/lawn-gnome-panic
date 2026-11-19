// Club Gnome: a hub of small flat maps. Each map is its own coordinate space, so one is loaded at a time (?level=).
import { getPrefab } from '@lawn/prefabs';
import type { ZoneDef } from '@gnomomia/config';
import { GAME_LINKS, MAP_IDS, MAP_NAMES, type MapDef, type MapId } from '@club/config';
import { MAPS } from '@club/maps';
import { mapToDoc } from '@club/levelDocs';
import type { GameAdapter, World } from '../context';
import { createClubObjectView } from './clubObjects';
import { CLUB_COLLECTIONS } from './clubProfile';
import { createFlatTerrain } from './clubTerrain';

function createWorld(levelId?: string): World {
  const id: MapId = (MAP_IDS as readonly string[]).includes(levelId ?? '') ? (levelId as MapId) : MAP_IDS[0];
  const map = structuredClone(MAPS[id]) as MapDef;
  // The map is the level: its own fields (props, buildings, portals...) stay on it, plus what the editor's view expects of a zone.
  const zone = { ...map, id, name: MAP_NAMES[id], half: Math.max(map.w, map.d) / 2, origin: { x: 0, z: 0 }, indoor: false } as unknown as ZoneDef;
  const terrain = createFlatTerrain(zone, { w: map.w, d: map.d, ground: map.ground, name: MAP_NAMES[id], buildings: map.buildings });
  return {
    terrain,
    zones: { [id]: zone } as unknown as World['zones'],
    deltas: terrain.deltas,
    outdoorZones: [id] as unknown as World['outdoorZones'],
    setGatesOpen() {},
    gatesOpen: true,
  };
}

export const clubAdapter: GameAdapter = {
  id: 'club-gnome',
  label: 'Club Gnome',
  singleLevel: true,
  levels: () => MAP_IDS.map((id) => ({ id, name: MAP_NAMES[id] })),
  createWorld,
  collections: CLUB_COLLECTIONS,
  editableKeys: ['props', 'buildings', 'blockers', 'portals', 'spots', 'seats', 'signs', 'patches', 'spawn'],
  zoneRect: (def) => {
    const m = def as unknown as MapDef;
    return { minX: -m.w / 2 - 2, maxX: m.w / 2 + 2, minZ: -m.d / 2 - 2, maxZ: m.d / 2 + 2 };
  },
  tools: ['view', 'select'],
  toDoc: (def) => {
    const doc = mapToDoc(def as unknown as MapDef);
    return { game: doc.game, id: doc.id, doc };
  },
  createObjectView: createClubObjectView,
  beforeSave(ctx) {
    const m = ctx.zones[ctx.zone] as unknown as MapDef;
    for (const p of m.props) if (!getPrefab(p.prefab)) throw new Error(`Prop prefab "${p.prefab}" does not exist. Fix it in Select > Prop (Browse lists every prefab).`);
    const ids = [...m.buildings, ...m.portals, ...m.spots, ...m.seats].map((e) => e.id);
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);
    if (dup) throw new Error(`The id "${dup}" is used twice on this map: ids must be unique.`);
    for (const p of m.portals) if (!(MAP_IDS as readonly string[]).includes(p.to)) throw new Error(`Portal "${p.id}" goes to "${p.to}", which is not a map.`);
    for (const s of m.spots) if (!(s.game in GAME_LINKS)) throw new Error(`Spot "${s.id}" opens "${s.game}", which is not a game.`);
    for (const b of m.buildings) if (b.link && !ids.includes(b.link)) throw new Error(`Building "${b.id}" is linked to "${b.link}", which is not a portal or spot here.`);
  },
};

// Gnome Theft Auto: one region at a time (each region is its own coordinate space, centred on 0, 0). The ground shows the game's
// own heights (hills, mesas, the glen) and terrain paint (rock, dirt trails, mud...), read from the saved region documents: an
// edit shows on the ground after it is saved and the editor reloads. The brush and paint tools are still not offered for it
// (GTA's landforms are generators and stamps in data.terrain, not hand-painted heights). Roads and water show on the ground.
// Saves go to games/gnome-theft-auto/src/data/levels/<region>.level.json.
import { getPrefab } from '@lawn/prefabs';
import { REGION_DOCS, REGION_IDS, regionDocProblems, LAYOUT, type RegionId } from '@gta/levels';
import { heightAt, setTerrainOptions } from '@gta/terrain';
import { paintAt } from '@gta/terrainPaint';
import type { GameAdapter, World } from '../context';
import { GTA_COLLECTIONS } from './gtaProfile';
import { REGION_LIST, asZone, docToLevel, groundColourAt, levelToDoc, type GtaLevel } from './gtaLevel';
import { createGtaObjectView } from './gtaObjects';
import { createStubTerrain } from './stubTerrain';

// The editor shows the authored land at full height whatever the game ships.
setTerrainOptions({ amplitude: 1, testHill: false, landforms: true });

const DEFAULT_REGION: RegionId = 'turfton';

function createWorld(levelId?: string): World {
  const id: RegionId = levelId && (REGION_IDS as readonly string[]).includes(levelId) ? (levelId as RegionId) : DEFAULT_REGION;
  const level = docToLevel(REGION_DOCS[id]);
  // The game's heights and paint are in world coordinates: a region's own (x, z) plus its origin in the layout.
  const o = LAYOUT.regions.find((r) => r.id === id)?.origin ?? { x: 0, z: 0 };
  const terrain = createStubTerrain({
    zone: asZone(level),
    w: level.w,
    d: level.d,
    heightAt: (x, z) => heightAt(x + o.x, z + o.z),
    groundColourAt: (x, z) => groundColourAt(level, x, z, (px, pz) => paintAt(px + o.x, pz + o.z)),
    regionNameAt: () => level.name,
  });
  return {
    terrain,
    zones: { [level.id]: asZone(level) } as unknown as World['zones'],
    deltas: terrain.deltas,
    outdoorZones: [level.id] as unknown as World['outdoorZones'],
    setGatesOpen() {},
    gatesOpen: true,
  };
}

export const gtaAdapter: GameAdapter = {
  id: 'gnome-theft-auto',
  label: 'Gnome Theft Auto',
  singleLevel: true,
  levels: () => REGION_LIST,
  createWorld,
  collections: GTA_COLLECTIONS,
  editableKeys: ['paths', 'props', 'markers'],
  zoneRect: (def) => {
    const l = def as unknown as GtaLevel;
    return { minX: -l.w / 2 - 20, maxX: l.w / 2 + 20, minZ: -l.d / 2 - 20, maxZ: l.d / 2 + 20 };
  },
  tools: ['view', 'select', 'road'],
  toDoc: (def) => {
    const doc = levelToDoc(def as unknown as GtaLevel);
    return { game: doc.game, id: doc.id, doc };
  },
  createObjectView: createGtaObjectView,
  beforeSave(ctx) {
    const doc = levelToDoc(ctx.zones[ctx.zone] as unknown as GtaLevel);
    const problems = regionDocProblems(doc);
    if (problems.length > 0) throw new Error(problems[0]);
    for (const p of doc.props) {
      if (!getPrefab(p.prefab)) throw new Error(`Prefab "${p.prefab}" does not exist.`);
    }
    // A road id names one highway: another region must not already hold it.
    const mine = new Set(doc.paths.filter((p) => p.kind === 'road').map((p) => p.id));
    for (const other of REGION_IDS) {
      if (other === doc.id) continue;
      const clash = REGION_DOCS[other].paths.find((p) => p.kind === 'road' && mine.has(p.id));
      if (clash) throw new Error(`Road "${clash.id}" is already in ${REGION_DOCS[other].name}.`);
    }
    const seen = new Set<string>();
    for (const m of doc.markers) {
      if (seen.has(m.id)) throw new Error(`Marker "${m.id}" appears twice in ${doc.name}.`);
      seen.add(m.id);
    }
  },
};

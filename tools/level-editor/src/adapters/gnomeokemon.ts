// Gnomokemon Snap: one course at a time (each course has its own coordinate space). The terrain is the course's stamps (the
// same functions the game uses), the ground colours show pools, islands and platforms, and the editor places and edits every
// kind of thing the course file holds, including the dog's path. The course is saved into games/gnomeokemon/src/data/levels/.
import { validateLevelDoc, type Stamp } from '@lawn/level';
import type { GameAdapter, World } from '../context';
import { GNOMEOKEMON_COLLECTIONS } from './gnomeokemonProfile';
import { COURSE_LIST, DOCS, asZone, docToLevel, groundColourAt, groundStamps, heightAt, levelToDoc, type GnomeLevel } from './gnomeokemonLevel';
import { createGnomeObjectView } from './gnomeokemonObjects';
import { createStubTerrain } from './stubTerrain';

function createWorld(levelId?: string): World {
  const id = levelId && DOCS[levelId] ? levelId : 'lawn';
  const level = docToLevel(DOCS[id]);
  // The stamps the height function reads, rebuilt after each edit (onInvalidate): moving a rail node or an island moves the ground.
  let cache: Stamp[] | null = null;
  const stamps = (): Stamp[] => (cache ??= groundStamps(level));
  const terrain = createStubTerrain({
    zone: asZone(level),
    w: level.w,
    d: level.d,
    heightAt: (x, z) => heightAt(stamps(), x, z),
    groundColourAt: (x, z) => groundColourAt(level, x, z),
    onInvalidate: () => { cache = null; },
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

export const gnomeokemonAdapter: GameAdapter = {
  id: 'gnomeokemon',
  label: 'Gnomokemon Snap',
  singleLevel: true,
  levels: () => COURSE_LIST,
  createWorld,
  collections: GNOMEOKEMON_COLLECTIONS,
  editableKeys: ['stamps', 'rail', 'props', 'zones', 'cover', 'creatures', 'ponds', 'islands', 'platforms'],
  zoneRect: (def) => {
    const l = def as unknown as GnomeLevel;
    return { minX: -l.w / 2 - 40, maxX: l.w / 2 + 40, minZ: -l.d / 2 - 40, maxZ: l.d / 2 + 40 };
  },
  tools: ['view', 'select', 'rail'],
  toDoc: (def) => {
    const doc = levelToDoc(def as unknown as GnomeLevel);
    return { game: doc.game, id: doc.id, doc };
  },
  createObjectView: createGnomeObjectView,
  beforeSave(ctx) {
    const doc = levelToDoc(ctx.zones[ctx.zone] as unknown as GnomeLevel);
    const problems = validateLevelDoc(doc);
    if (problems.length > 0) throw new Error(problems[0]);
    const rail = (doc.paths.find((p) => p.id === 'rail')?.points ?? []);
    if (rail.length < 2) throw new Error('The rail needs at least two nodes.');
    const zoneCount = doc.markers.filter((m) => m.kind === 'zone').length;
    for (const m of doc.markers) {
      if (m.kind !== 'creature') continue;
      const zone = Number((m.data as Record<string, unknown>).zone);
      if (!Number.isInteger(zone) || zone < 0 || zone >= zoneCount) {
        throw new Error(`Creature ${m.id}: its zone must be a zone index from 0 to ${zoneCount - 1}.`);
      }
    }
  },
};

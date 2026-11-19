// Gnome Golf: one island with nine holes. Ground colours come from the game's own lie function (fairway, rough, green, fringe,
// sand, tee, water), so the picture is what the ball will find.
import type { Lie } from '@golf/config';
import type { GameAdapter, World } from '../context';
import { courseOf, docToLevel, levelToDoc, asZone, type GolfLevel } from './golfLevel';
import { createGolfObjectView } from './golfObjects';
import { GOLF_COLLECTIONS } from './golfProfile';
import { createStubTerrain } from './stubTerrain';

const LIE_COLOUR: Record<Lie, number> = {
  tee: 0x9bd36a, fairway: 0x62b043, fringe: 0x75c24c, rough: 0x3f7a2c, sand: 0xe2cf8f, green: 0x86dc55, water: 0x2f6fb0,
};

function createWorld(): World {
  const level = docToLevel();
  const zone = asZone(level);
  let course = courseOf(level);
  const terrain = createStubTerrain({
    zone, w: level.w, d: level.d,
    heightAt: (x, z) => course.heightAt(x, z),
    groundColourAt: (x, z) => LIE_COLOUR[course.lieAt(x, z)],
    regionNameAt: (x, z) => course.lieAt(x, z),
    // The per-hole boxes inside the course are computed once: build a new one after every edit.
    onInvalidate: () => { course = courseOf(level); },
  });
  return {
    terrain,
    zones: { [level.id]: zone } as unknown as World['zones'],
    deltas: terrain.deltas,
    outdoorZones: [level.id] as unknown as World['outdoorZones'],
    setGatesOpen() {},
    gatesOpen: true,
  };
}

export const golfAdapter: GameAdapter = {
  id: 'gnome-golf',
  label: 'Gnome Golf',
  singleLevel: true,
  levels: () => [{ id: 'island', name: docToLevel().name }],
  createWorld,
  collections: GOLF_COLLECTIONS,
  editableKeys: ['island', 'holes', 'greens', 'pins', 'corners', 'bunkers', 'ponds'],
  zoneRect: (def) => {
    const l = def as unknown as GolfLevel;
    return { minX: -l.w / 2 - 40, maxX: l.w / 2 + 40, minZ: -l.d / 2 - 40, maxZ: l.d / 2 + 40 };
  },
  tools: ['view', 'select', 'island'],
  toDoc: (def) => {
    const doc = levelToDoc(def as unknown as GolfLevel);
    return { game: doc.game, id: doc.id, doc };
  },
  createObjectView: createGolfObjectView,
  beforeSave(ctx) {
    const l = ctx.zones[ctx.zone] as unknown as GolfLevel;
    for (const list of [l.corners, l.bunkers, l.ponds]) {
      for (const it of list) if (!Number.isInteger(it.n) || it.n < 1 || it.n > l.holes.length) throw new Error(`Something is assigned to hole ${it.n}: holes are numbered 1 to ${l.holes.length}.`);
    }
    for (const h of l.holes) {
      if (!Number.isInteger(h.par) || h.par < 3 || h.par > 5) throw new Error(`Hole ${h.n}: par must be 3, 4 or 5.`);
      if (!(h.fairwayWidth > 0)) throw new Error(`Hole ${h.n}: the fairway needs a width above 0.`);
    }
    for (const g of l.greens) if (!(g.r > 0)) throw new Error(`Hole ${g.n}: the green needs a radius above 0.`);
    for (const list of [l.bunkers, l.ponds]) for (const it of list) if (!(it.r > 0)) throw new Error(`Hole ${it.n}: a bunker or pond needs a radius above 0.`);
    if (!(l.island.rx > 0 && l.island.rz > 0)) throw new Error('The island needs a radius above 0 in both directions.');
  },
};

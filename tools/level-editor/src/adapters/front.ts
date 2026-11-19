// Gnome Front: one arena, shaped by mounds, with flags, bases, vehicle slots, landmarks at the flags and scattered cover.
import { getPrefab } from '@lawn/prefabs';
import type { ZoneDef } from '@gnomomia/config';
import { VEHICLES } from '@front/config';
import { GRASS_COLOR } from '@front/config';
import type { GameAdapter, World } from '../context';
import { arenaOf, asZone, docToLevel, levelToDoc, type FrontLevel } from './frontLevel';
import { createFrontObjectView } from './frontObjects';
import { FRONT_COLLECTIONS } from './frontProfile';
import { createStubTerrain } from './stubTerrain';

const stripe = (x: number): number => (((Math.floor(x / 6) % 2) + 2) % 2 === 0 ? 1.06 : 1);
function grassAt(x: number): number {
  const f = stripe(x);
  const ch = (c: number): number => Math.min(255, Math.round(c * f));
  return (ch((GRASS_COLOR >> 16) & 255) << 16) | (ch((GRASS_COLOR >> 8) & 255) << 8) | ch(GRASS_COLOR & 255);
}

function createWorld(): World {
  const level = docToLevel();
  const zone = asZone(level);
  const heightAt = (x: number, z: number): number => arenaOf(level).heightAt(x, z);
  const terrain = createStubTerrain({ zone, w: level.w, d: level.d, heightAt, groundColourAt: (x) => grassAt(x), regionNameAt: () => level.name });
  return {
    terrain,
    zones: { [level.id]: zone } as unknown as World['zones'],
    deltas: terrain.deltas,
    outdoorZones: [level.id] as unknown as World['outdoorZones'],
    setGatesOpen() {},
    gatesOpen: true,
  };
}

export const frontAdapter: GameAdapter = {
  id: 'gnome-front',
  label: 'Gnome Front',
  singleLevel: true,
  levels: () => [{ id: 'arena', name: docToLevel().name }],
  createWorld,
  collections: FRONT_COLLECTIONS,
  editableKeys: ['bases', 'flags', 'vehicles', 'mounds', 'landmarks', 'cover'],
  zoneRect: (def) => {
    const l = def as unknown as ZoneDef & FrontLevel;
    return { minX: -l.half - 6, maxX: l.half + 6, minZ: -l.half - 6, maxZ: l.half + 6 };
  },
  tools: ['view', 'select', 'cover'],
  toDoc: (def) => {
    const doc = levelToDoc(def as unknown as FrontLevel);
    return { game: doc.game, id: doc.id, doc };
  },
  createObjectView: createFrontObjectView,
  beforeSave(ctx) {
    const l = ctx.zones[ctx.zone] as unknown as FrontLevel;
    for (const p of [...l.landmarks.map((x) => x.prefab), ...l.cover.layers.map((x) => x.prefab)]) {
      if (!getPrefab(p)) throw new Error(`Prefab "${p}" does not exist. Fix it (Select > Landmark, or the Cover tab) before saving.`);
    }
    for (const v of l.vehicles) {
      if (!(v.vehicle in VEHICLES)) throw new Error(`Vehicle kind "${v.vehicle}" does not exist.`);
      if (v.team !== 0 && v.team !== 1) throw new Error('A vehicle\'s team must be 0 (red) or 1 (blue).');
    }
    const ids = l.flags.map((f) => f.id);
    if (new Set(ids).size !== ids.length || l.flags.length !== 5) throw new Error('The arena needs its five flags A to E, each once.');
    for (const L of l.landmarks) if (!ids.includes(L.at)) throw new Error(`A landmark belongs to flag "${L.at}", which does not exist.`);
    for (const m of l.mounds) if (!(m.r > 0)) throw new Error('A mound needs a spread above 0.');
    for (const c of l.cover.layers) if (!Number.isInteger(c.count) || c.count < 0) throw new Error(`Cover layer "${c.prefab}": the count must be a whole number, 0 or more.`);
  },
};

// Gnomes of Gnomomia: the open world. Every tool applies; levels are zones that share one coordinate space and are all loaded.
import { getPrefab } from '@lawn/prefabs';
import { ZONES } from '@gnomomia/content';
import { worldZoneToDoc } from '@gnomomia/levelDocs';
import type { GameAdapter } from '../context';
import { createObjectView } from '../objectView';
import { checkMarkersBeforeSave } from '../saveCheck';
import { COLLECTIONS } from '../profile';
import { zoneRect } from '../state';
import { createWorld } from '../world';

export const gnomomiaAdapter: GameAdapter = {
  id: 'gnomomia',
  label: 'Gnomes of Gnomomia',
  singleLevel: false,
  levels: () => Object.values(ZONES).filter((z) => !z.indoor).map((z) => ({ id: z.id, name: z.name })),
  createWorld: () => createWorld(),
  collections: COLLECTIONS,
  // 'markers' is the zone field the Objects collection writes (a collection id such as 'objects' is not a zone key).
  editableKeys: ['regions', 'lakes', 'houses', 'decks', 'stamps', 'paths', 'props', 'markers', 'spawn', 'shrine', 'exits', 'roadMode'],
  zoneRect,
  tools: ['view', 'brush', 'paint', 'select', 'road', 'analyze'],
  toDoc: (def) => {
    const doc = worldZoneToDoc(def);
    return { game: doc.game, id: doc.id, doc };
  },
  createObjectView,
  doorZones: () => ZONES,
  beforeSave(ctx, dirty) {
    // A prop whose prefab does not exist would be skipped (with a warning) by the game: stop it here instead.
    for (const id of dirty) {
      for (const p of ctx.zones[id as keyof typeof ctx.zones].props ?? []) {
        if (!getPrefab(p.prefab)) throw new Error(`Prop prefab "${p.prefab}" in ${id} does not exist. Fix it in Select > Prop (Browse lists every prefab).`);
      }
    }
    // Object and spawn markers with no pack entry: the game would fail to load, so ask before saving them.
    const zones = dirty.map((id) => ctx.zones[id as keyof typeof ctx.zones]).filter((z) => z !== undefined);
    checkMarkersBeforeSave(zones, (m) => window.confirm(m));
  },
};

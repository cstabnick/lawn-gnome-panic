// Gnomes of Gnomomia: the open world. Every tool applies; levels are zones that share one coordinate space and are all loaded.
import { getPrefab } from '@lawn/prefabs';
import { ZONES } from '@gnomomia/content';
import { worldZoneToDoc } from '@gnomomia/levelDocs';
import type { GameAdapter } from '../context';
import type { Problem } from '../agent/types';
import { createObjectView } from '../objectView';
import { checkMarkersBeforeSave, findUnknownRefs } from '../saveCheck';
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
  checks(ctx, zone): Problem[] {
    const out: Problem[] = [];
    const def = ctx.zones[zone as keyof typeof ctx.zones];
    if (!def) return out;
    (def.props ?? []).forEach((p, index) => {
      if (!getPrefab(p.prefab)) {
        out.push({ severity: 'error', code: 'unknown-prefab', msg: `Prop prefab "${p.prefab}" does not exist`, zone, ref: { collection: 'props', index }, x: p.x, z: p.z });
      }
    });
    // findUnknownRefs lists the unknown markers in marker order, so walking the markers once gives each one its index among the
    // markers of its kind (the objects and spawns collections list markers of one kind, in order).
    const refs = findUnknownRefs([def]);
    const counts: Record<string, number> = { object: 0, spawn: 0 };
    let next = 0;
    for (const m of def.markers ?? []) {
      if (m.kind !== 'object' && m.kind !== 'spawn') continue;
      const index = counts[m.kind]++;
      const r = refs[next];
      if (!r || r.kind !== m.kind || r.id !== m.id) continue;
      next++;
      out.push({
        severity: 'error',
        code: 'unknown-marker',
        msg: `${r.kind} marker "${r.id}" has no pack entry`,
        zone,
        ref: { collection: m.kind === 'object' ? 'objects' : 'spawns', index },
        x: m.x,
        z: m.z,
      });
    }
    return out;
  },
};

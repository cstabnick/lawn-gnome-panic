// Snigms: the town square, a flat level. Its document (games/snigms/src/data/levels/town.level.json) holds the props (prefabs on the
// grid, read by the game as town furniture) and the markers (spots the neighbours stand at, and the gate where trips arrive).
import { getPrefab } from '@lawn/prefabs';
import townDoc from '@snigms/data/levels/town.level.json';
import { FURNITURE } from '@snigms/config';
import type { ZoneDef } from '@gnomomia/config';
import type { CollectionDef, GameAdapter, Item, World } from '../context';
import { createClubObjectView } from './clubObjects';
import { createFlatTerrain } from './clubTerrain';

const LEVEL_ID = 'town';
const GROUND = 0x7ab648;
const TOWN_PREFABS = [...new Set(Object.values(FURNITURE).filter((d) => d.room === 'town').map((d) => d.prefab))];

interface TownDoc {
  name: string;
  bounds: { w: number; d: number };
  props: Item[];
  markers: Item[];
  data: unknown;
}
const source = townDoc as unknown as TownDoc;

/** The editable zone: the document's own fields, plus the shape the shared object view (Club Gnome's) reads. */
function zoneOf(d: TownDoc): Record<string, unknown> {
  return { id: LEVEL_ID, name: d.name, w: d.bounds.w, d: d.bounds.d, indoor: false, props: d.props, markers: d.markers, data: d.data, buildings: [], blockers: [], signs: [], patches: [] };
}

function createWorld(): World {
  const d = structuredClone(source);
  const zone = { ...zoneOf(d), half: Math.max(d.bounds.w, d.bounds.d) / 2, origin: { x: 0, z: 0 } } as unknown as ZoneDef;
  const terrain = createFlatTerrain(zone, { w: d.bounds.w, d: d.bounds.d, ground: GROUND, name: d.name, buildings: [] });
  return {
    terrain,
    zones: { [LEVEL_ID]: zone } as unknown as World['zones'],
    deltas: terrain.deltas,
    outdoorZones: [LEVEL_ID] as unknown as World['outdoorZones'],
    setGatesOpen() {},
    gatesOpen: true,
  };
}

const num = (key: string, label: string, step = 0.1, min?: number): CollectionDef['fields'][number] => ({ key, label, type: 'number', step, min });
const rid = (): string => Math.random().toString(36).slice(2, 7);

export const SNIGMS_COLLECTIONS: readonly CollectionDef[] = [
  {
    id: 'props', label: 'Town piece', color: 0x9be37a, shape: 'circle',
    radius: (i) => Math.max(0.6, Number(i.scale ?? 1) * 0.8),
    items: (d) => ((d as unknown as { props: Item[] }).props ??= []),
    make: (x, z): Item => ({ prefab: TOWN_PREFABS[0], x, z, rot: 0, scale: 1 }),
    fields: [{ key: 'prefab', label: 'Prefab', type: 'prefab' }, num('rot', 'Rotation', 0.1), num('scale', 'Scale', 0.1, 0.1)],
  },
  {
    id: 'markers', label: 'Spot or gate', color: 0xffd24a, shape: 'circle',
    radius: () => 0.8,
    items: (d) => ((d as unknown as { markers: Item[] }).markers ??= []),
    make: (x, z): Item => ({ id: `spot-${rid()}`, kind: 'spot', x, z, data: {} }),
    fields: [
      { key: 'id', label: 'Id', type: 'text' },
      { key: 'kind', label: 'Kind', type: 'enum', options: ['spot', 'gate'] },
    ],
  },
];

export const snigmsAdapter: GameAdapter = {
  id: 'snigms',
  label: 'Snigms',
  singleLevel: true,
  levels: () => [{ id: LEVEL_ID, name: source.name }],
  createWorld,
  collections: SNIGMS_COLLECTIONS,
  editableKeys: ['props', 'markers'],
  zoneRect: (def) => {
    const z = def as unknown as { w: number; d: number };
    return { minX: -z.w / 2 - 2, maxX: z.w / 2 + 2, minZ: -z.d / 2 - 2, maxZ: z.d / 2 + 2 };
  },
  tools: ['view', 'select'],
  toDoc: (def) => {
    const z = def as unknown as { w: number; d: number; props: Item[]; markers: Item[]; data: unknown };
    const doc = {
      format: 'lawn-level', version: 1, game: 'snigms', id: LEVEL_ID, name: source.name,
      bounds: { w: z.w, d: z.d }, stamps: [], paths: [], props: z.props, markers: z.markers, data: z.data,
    };
    return { game: 'snigms', id: LEVEL_ID, doc };
  },
  createObjectView: createClubObjectView,
  beforeSave(ctx) {
    const z = ctx.zones[ctx.zone] as unknown as { props: Item[]; markers: Item[] };
    for (const p of z.props) {
      if (!TOWN_PREFABS.includes(String(p.prefab))) throw new Error(`"${p.prefab}" is not a town piece. Use one of: ${TOWN_PREFABS.join(', ')}.`);
      if (!getPrefab(String(p.prefab))) throw new Error(`Prefab "${p.prefab}" does not exist.`);
    }
    const gates = z.markers.filter((m) => m.kind === 'gate').length;
    if (gates !== 1) throw new Error(`The town needs exactly one gate marker (it has ${gates}).`);
    const ids = z.markers.map((m) => String(m.id));
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);
    if (dup) throw new Error(`The marker id "${dup}" is used twice: ids must be unique.`);
  },
};

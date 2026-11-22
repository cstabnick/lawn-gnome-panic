import { getPrefab } from '@lawn/prefabs';
import velvetKeysDoc from '../../../../games/gnome-set-radio/src/data/levels/velvet-keys.level.json';
import bongoBasinDoc from '../../../../games/gnome-set-radio/src/data/levels/bongo-basin.level.json';
import chromeKilnDoc from '../../../../games/gnome-set-radio/src/data/levels/chrome-kiln.level.json';
import neonBirdbathDoc from '../../../../games/gnome-set-radio/src/data/levels/neon-birdbath.level.json';
import type { ZoneDef } from '@gnomomia/config';
import type { CollectionDef, GameAdapter, Item, World } from '../context';
import { createClubObjectView } from './clubObjects';
import { createFlatTerrain } from './clubTerrain';

interface GsrDocShape {
  id: string;
  name: string;
  bounds: { w: number; d: number };
  stamps: unknown[];
  paths: unknown[];
  props: Item[];
  markers: Item[];
  data: { groundColor?: string; buildings?: unknown[] } & Record<string, unknown>;
}

const SOURCES: Record<string, GsrDocShape> = {
  'velvet-keys': velvetKeysDoc as unknown as GsrDocShape,
  'bongo-basin': bongoBasinDoc as unknown as GsrDocShape,
  'chrome-kiln': chromeKilnDoc as unknown as GsrDocShape,
  'neon-birdbath': neonBirdbathDoc as unknown as GsrDocShape,
};

function zoneOf(d: GsrDocShape): Record<string, unknown> {
  return {
    id: d.id,
    name: d.name,
    w: d.bounds.w,
    d: d.bounds.d,
    indoor: false,
    props: d.props,
    markers: d.markers,
    stamps: d.stamps,
    paths: d.paths,
    data: d.data,
    buildings: [],
    blockers: [],
    signs: [],
    patches: [],
  };
}

function createWorld(): World {
  const zones: Record<string, ZoneDef> = {};
  const deltas: World['deltas'] = {};
  let firstTerrain: World['terrain'] | null = null;
  for (const [id, raw] of Object.entries(SOURCES)) {
    const d = structuredClone(raw);
    const zone = { ...zoneOf(d), half: Math.max(d.bounds.w, d.bounds.d) / 2, origin: { x: 0, z: 0 } } as unknown as ZoneDef;
    const color = Number.parseInt((d.data.groundColor ?? '#28223d').replace('#', ''), 16) || 0x28223d;
    const t = createFlatTerrain(zone, { w: d.bounds.w, d: d.bounds.d, ground: color, name: d.name, buildings: [] });
    if (!firstTerrain) firstTerrain = t;
    Object.assign(deltas, t.deltas);
    zones[id] = zone;
  }
  return {
    terrain: firstTerrain!,
    zones: zones as unknown as World['zones'],
    deltas,
    outdoorZones: Object.keys(SOURCES) as unknown as World['outdoorZones'],
    setGatesOpen() {},
    gatesOpen: true,
  };
}

const num = (key: string, label: string, step = 0.1, min?: number): CollectionDef['fields'][number] => ({ key, label, type: 'number', step, min });
const rid = (): string => Math.random().toString(36).slice(2, 7);

export const GSR_COLLECTIONS: readonly CollectionDef[] = [
  {
    id: 'props',
    label: 'World Prop',
    color: 0xff4ecd,
    shape: 'circle',
    radius: (i) => Math.max(0.7, Number(i.scale ?? 1) * 0.9),
    items: (d) => ((d as unknown as { props: Item[] }).props ??= []),
    make: (x, z): Item => ({ prefab: 'gsr-boombox', x, z, rot: 0, scale: 1 }),
    fields: [{ key: 'prefab', label: 'Prefab', type: 'prefab' }, num('rot', 'Rotation', 0.1), num('scale', 'Scale', 0.1, 0.1)],
  },
  {
    id: 'markers',
    label: 'Event / Spawn Marker',
    color: 0x00e5ff,
    shape: 'circle',
    radius: () => 1.0,
    items: (d) => ((d as unknown as { markers: Item[] }).markers ??= []),
    make: (x, z): Item => ({ id: `ev-${rid()}`, kind: 'event', x, z, data: {} }),
    fields: [
      { key: 'id', label: 'Id', type: 'text' },
      { key: 'kind', label: 'Kind', type: 'enum', options: ['spawn', 'event', 'boss', 'side'] },
    ],
  },
];

export const gnomeSetRadioAdapter: GameAdapter = {
  id: 'gnome-set-radio',
  label: 'Gnom Set Radio',
  levels: () => Object.values(SOURCES).map((s) => ({ id: s.id, name: s.name })),
  createWorld,
  collections: GSR_COLLECTIONS,
  editableKeys: ['props', 'markers'],
  zoneRect: (def) => {
    const z = def as unknown as { w: number; d: number };
    return { minX: -z.w / 2 - 2, maxX: z.w / 2 + 2, minZ: -z.d / 2 - 2, maxZ: z.d / 2 + 2 };
  },
  tools: ['view', 'select'],
  toDoc: (def) => {
    const z = def as unknown as { id: string; name: string; w: number; d: number; stamps: unknown[]; paths: unknown[]; props: Item[]; markers: Item[]; data: unknown };
    const doc = {
      format: 'lawn-level',
      version: 1,
      game: 'gnome-set-radio',
      id: z.id,
      name: z.name,
      bounds: { w: z.w, d: z.d },
      stamps: z.stamps ?? [],
      paths: z.paths ?? [],
      props: z.props,
      markers: z.markers,
      data: z.data,
    };
    return { game: 'gnome-set-radio', id: z.id, doc };
  },
  createObjectView: createClubObjectView,
  beforeSave(ctx) {
    const z = ctx.zones[ctx.zone] as unknown as { props: Item[]; markers: Item[] };
    for (const p of z.props) {
      if (!getPrefab(String(p.prefab))) throw new Error(`Prefab "${p.prefab}" does not exist.`);
    }
    const spawns = z.markers.filter((m) => m.kind === 'spawn').length;
    if (spawns !== 1) throw new Error(`Level needs exactly 1 spawn marker (has ${spawns}).`);
  },
};

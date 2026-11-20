// What Gnomomia lets the select tool place: each list in a zone, with the fields to edit and sensible defaults.
import type { MarkerDef, PropDef, Stamp } from '@lawn/level';
import { prefabFootprint } from '@lawn/prefabs';
import { ENEMIES, SPAWNS } from '@gnomomia/content';
import type { CollectionDef, Item } from './context';

const num = (key: string, label: string, step = 0.1, min?: number): CollectionDef['fields'][number] => ({ key, label, type: 'number', step, min });

const rid = (): string => Math.random().toString(36).slice(2, 7);

/** The game's data on an object marker (Gnomomia's `kind: 'object'`): yaw is rot.y, scale is a multiplier. */
type ObjectData = { v?: number; rot?: { x?: number; y?: number; z?: number }; scale?: number };

/**
 * An object marker as a flat view { id, x, z, yaw, scale }. The view has no data of its own: its x, z, yaw and scale are
 * accessors onto the marker, so the select tool's field edits, nudges and drags (which assign to the item they were given)
 * write straight into the marker, and into the saved file. Only yaw and scale are ever written into `data`; `v` is kept at 1.
 */
function objectView(m: MarkerDef): Item {
  const view: Record<string, unknown> = {};
  const setData = (patch: (d: ObjectData) => void): void => {
    const d = (m.data ??= { v: 1 }) as ObjectData;
    d.v = 1;
    patch(d);
  };
  Object.defineProperties(view, {
    id: { enumerable: true, get: () => m.id },
    x: { enumerable: true, get: () => m.x, set: (v: number) => { m.x = v; } },
    z: { enumerable: true, get: () => m.z, set: (v: number) => { m.z = v; } },
    yaw: {
      enumerable: true,
      get: () => (m.data as ObjectData | undefined)?.rot?.y ?? 0,
      set: (v: number) => setData((d) => { d.rot = { ...d.rot, y: v }; }),
    },
    scale: {
      enumerable: true,
      get: () => { const s = (m.data as ObjectData | undefined)?.scale; return typeof s === 'number' ? s : 1; },
      set: (v: number) => setData((d) => { d.scale = v; }),
    },
  });
  return view as Item;
}

/** The game's data on a spawn marker (Gnomomia's `kind: 'spawn'`): count and spread override the pack's values when present. */
type SpawnData = { v?: number; count?: number; spread?: number };

/**
 * A spawn marker as a flat view { id, name, x, z, count, spread }. count and spread read the marker's data and fall back to the
 * pack's value for this id (SPAWNS carries the pack values; its x and z are world positions and are not used here). Writing them
 * sets data.count / data.spread and keeps data.v at 1. name is the enemy's name, for the select list.
 */
function spawnView(m: MarkerDef): Item {
  const view: Record<string, unknown> = {};
  const pack = (): (typeof SPAWNS)[number] | undefined => SPAWNS.find((s) => s.id === m.id);
  const setData = (patch: (d: SpawnData) => void): void => {
    const d = (m.data ??= { v: 1 }) as SpawnData;
    d.v = 1;
    patch(d);
  };
  Object.defineProperties(view, {
    id: { enumerable: true, get: () => m.id },
    name: {
      enumerable: true,
      get: () => { const p = pack(); return p ? (ENEMIES[p.enemy]?.name ?? p.enemy) : m.id; },
    },
    x: { enumerable: true, get: () => m.x, set: (v: number) => { m.x = v; } },
    z: { enumerable: true, get: () => m.z, set: (v: number) => { m.z = v; } },
    count: {
      enumerable: true,
      get: () => { const c = (m.data as SpawnData | undefined)?.count; return typeof c === 'number' ? c : (pack()?.count ?? 1); },
      set: (v: number) => setData((d) => { d.count = v; }),
    },
    spread: {
      enumerable: true,
      get: () => { const s = (m.data as SpawnData | undefined)?.spread; return typeof s === 'number' ? s : (pack()?.spread ?? 0); },
      set: (v: number) => setData((d) => { d.spread = v; }),
    },
  });
  return view as Item;
}

export const COLLECTIONS: readonly CollectionDef[] = [
  {
    id: 'spawn', label: 'Spawn', color: 0x40e0d0, shape: 'circle', fixed: true,
    radius: () => 1.5,
    items: (d) => [d.spawn as unknown as Item],
    make: (x, z) => ({ x, z }),
    fields: [],
  },
  {
    id: 'shrine', label: 'Shrine', color: 0xff66ff, shape: 'circle', fixed: true,
    radius: () => 1.5,
    items: (d) => [d.shrine as unknown as Item],
    make: (x, z) => ({ x, z, name: 'a shrine' }),
    fields: [{ key: 'name', label: 'Name', type: 'text' }],
  },
  {
    // Exits to other zones; the door exits content.ts makes for houses are generated and not listed. Moving one moves the road.
    id: 'exits', label: 'Exit', color: 0x40ff80, shape: 'circle', fixed: true,
    radius: (i) => Number(i.r),
    items: (d) => d.exits as unknown as Item[],
    accepts: (i) => !i.door,
    make: (x, z) => ({ x, z, r: 3, to: '', arriveX: 0, arriveZ: 0, label: 'Exit' }),
    fields: [
      { key: 'label', label: 'Label', type: 'text' },
      num('r', 'Radius', 0.5, 1),
      num('arriveX', 'Arrive X', 0.5),
      num('arriveZ', 'Arrive Z', 0.5),
    ],
  },
  {
    id: 'regions', label: 'Region', color: 0xffd24a, shape: 'circle',
    radius: (i) => Number(i.r),
    items: (d) => (d.regions as unknown as Item[]),
    make: (x, z) => ({ id: `region-${rid()}`, name: 'New region', x, z, r: 15 }),
    fields: [{ key: 'id', label: 'Id', type: 'text' }, { key: 'name', label: 'Name', type: 'text' }, num('r', 'Radius', 0.5, 1)],
  },
  {
    id: 'lakes', label: 'Lake', color: 0x4aa3ff, shape: 'circle',
    radius: (i) => Number(i.r),
    items: (d) => (d.lakes as unknown as Item[]),
    make: (x, z) => ({ x, z, r: 10 }),
    fields: [num('r', 'Radius', 0.5, 1)],
  },
  {
    id: 'houses', label: 'House', color: 0xff8a4a, shape: 'circle',
    radius: (i) => Number(i.r),
    items: (d) => (d.houses as unknown as Item[]),
    make: (x, z) => ({ id: `house-${rid()}`, x, z, r: 3.2, yaw: 0, style: 'mushroom' }),
    fields: [
      { key: 'id', label: 'Id', type: 'text' },
      num('r', 'Radius', 0.1, 1),
      num('yaw', 'Yaw (rad)', 0.1),
      { key: 'style', label: 'Style', type: 'enum', options: ['mushroom', 'thatch', 'stone', 'log', 'tent', 'pot'] },
    ],
    // Interior zones are named <zone>/<id>, and a house with no id is called h<index>: removing a house from the middle
    // of the list would rename every un-named house after it.
    deleteBlocked: (d, index) => (d.houses.slice(index + 1).some((h) => !h.id) ? 'Houses without an id are numbered by position: delete the later ones first.' : null),
  },
  {
    id: 'decks', label: 'Deck', color: 0xc9a06a, shape: 'rect',
    radius: (i) => Math.max(Number(i.w), Number(i.d)) / 2,
    items: (d) => ((d.decks ??= []) as unknown as Item[]),
    make: (x, z) => ({ x, z, w: 4, d: 4, y: 3, stair: 's', style: 'wood' }),
    fields: [
      num('w', 'Width (x)', 0.5, 1), num('d', 'Depth (z)', 0.5, 1), num('y', 'Height', 0.5, 0.5),
      { key: 'stair', label: 'Ramp side', type: 'enum', options: ['n', 's', 'e', 'w'] },
      { key: 'style', label: 'Style', type: 'enum', options: ['wood', 'stone'] },
    ],
  },
  {
    id: 'props', label: 'Prop', color: 0x9be37a, shape: 'circle',
    radius: (i) => Math.max(1, Number(i.solidR ?? 0)),
    items: (d) => ((d.props ??= []) as unknown as Item[]),
    make: (x, z): Item => ({ prefab: 'barrel', x, z, rot: 0, scale: 1, solidR: Math.round((prefabFootprint('barrel')?.r ?? 0) * 100) / 100 } satisfies PropDef),
    fields: [{ key: 'prefab', label: 'Prefab', type: 'prefab' }, num('rot', 'Rotation', 0.1), num('scale', 'Scale', 0.1, 0.1), num('solidR', 'Solid radius', 0.1, 0)],
  },
  {
    // The world objects the level file places (markers of kind 'object'). Their ids and count come from the file: no add,
    // delete or duplicate. Only yaw and scale are editable; the view writes them into the marker's data.
    id: 'objects', label: 'Object', color: 0xe0c040, shape: 'circle', fixed: true,
    radius: () => 1.5,
    items: (d) => (d.markers ?? []).filter((m) => m.kind === 'object').map(objectView),
    make: (x, z) => ({ x, z }),
    fields: [num('yaw', 'Yaw (rad)', 0.1), num('scale', 'Scale', 0.1, 0.1)],
  },
  {
    // The spawn markers the level file places (kind 'spawn'). Their ids come from the pack: no add, delete or duplicate. The
    // spread is drawn as a ring; count and spread are written into the marker's data by the view.
    id: 'spawns', label: 'Enemy spawn', color: 0xff5050, shape: 'circle', fixed: true,
    radius: (i) => Number(i.spread),
    items: (d) => (d.markers ?? []).filter((m) => m.kind === 'spawn').map(spawnView),
    make: (x, z) => ({ x, z }),
    fields: [num('count', 'Count', 1, 1), num('spread', 'Spread (m)', 0.5, 0)],
  },
  {
    id: 'stamp-flatten', label: 'Flatten stamp', color: 0xb38cff, shape: 'circle',
    radius: (i) => Number(i.outer),
    items: (d) => ((d.stamps ??= []) as unknown as Item[]),
    accepts: (i) => i.op === 'flatten',
    make: (x, z, groundY): Item => ({ op: 'flatten', x, z, inner: 6, outer: 16, to: Math.round(groundY * 10) / 10 } satisfies Stamp),
    fields: [num('inner', 'Flat radius', 0.5, 0), num('outer', 'Blend radius', 0.5, 1), num('to', 'Height', 0.1)],
  },
  {
    id: 'stamp-gauss', label: 'Hill / pit stamp', color: 0xff7ad9, shape: 'circle',
    radius: (i) => 2 * Number(i.sigma),
    items: (d) => ((d.stamps ??= []) as unknown as Item[]),
    accepts: (i) => i.op === 'gauss',
    make: (x, z): Item => ({ op: 'gauss', x, z, sigma: 6, amount: 3 } satisfies Stamp),
    fields: [num('sigma', 'Spread', 0.5, 1), num('amount', 'Amount (+hill, -pit)', 0.1)],
  },
];

export function collection(id: string): CollectionDef {
  const c = COLLECTIONS.find((x) => x.id === id);
  if (!c) throw new Error(`no collection ${id}`);
  return c;
}

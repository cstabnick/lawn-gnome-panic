// What Gnomomia lets the select tool place: each list in a zone, with the fields to edit and sensible defaults.
import type { PropDef, Stamp } from '@lawn/level';
import { prefabFootprint } from '@lawn/prefabs';
import type { CollectionDef, Item } from './context';

const num = (key: string, label: string, step = 0.1, min?: number): CollectionDef['fields'][number] => ({ key, label, type: 'number', step, min });

const rid = (): string => Math.random().toString(36).slice(2, 7);

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

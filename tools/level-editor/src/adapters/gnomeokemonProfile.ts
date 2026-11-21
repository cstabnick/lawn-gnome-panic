// What the Select tool can place and edit on a Gnomokemon course.
import type { CollectionDef, FieldDef, Item, MutableZone } from '../context';
import type { GnomeLevel } from './gnomeokemonLevel';

const num = (key: string, label: string, step = 0.1, min?: number, max?: number): FieldDef => ({ key, label, type: 'number', step, min, max });
const txt = (key: string, label: string): FieldDef => ({ key, label, type: 'text' });
const lvl = (d: MutableZone): GnomeLevel => d as unknown as GnomeLevel;

/** The next id of a kind that no item of that list uses yet (ids are what the game and the file refer to). */
function nextId(items: readonly { id: string }[], prefix: string): string {
  const used = new Set(items.map((i) => i.id));
  let n = items.length + 1;
  while (used.has(`${prefix}-${n}`)) n += 1;
  return `${prefix}-${n}`;
}

const BEHAVIOURS = ['patrol', 'hop', 'orbit', 'swoop', 'burrow', 'roll'];

export const GNOMEOKEMON_COLLECTIONS: readonly CollectionDef[] = [
  {
    // The dog's path. The Rail tool draws it as a graph of nodes; here each node can be placed, moved and given a height.
    // A rail needs at least two nodes.
    id: 'rail', label: 'Rail node', color: 0x4ad6ff, shape: 'circle',
    radius: () => 1.5,
    items: (d) => lvl(d).rail as unknown as Item[],
    make: (x, z): Item => ({ x, z, lift: 0.5 }),
    fields: [num('lift', 'Height above the ground (m)', 0.1, 0)],
    deleteBlocked: (d, index) => (lvl(d).rail.length <= 2 ? 'The rail needs at least two nodes.' : null),
  },
  {
    // The course's own terrain stamps: hills (gauss), pits and flat shelves (flatten), in order.
    id: 'stamps', label: 'Terrain stamp', color: 0xb5e07a, shape: 'circle',
    radius: (i) => (i.op === 'gauss' ? 2 * Number(i.sigma) : Number(i.outer)),
    items: (d) => lvl(d).stamps as unknown as Item[],
    make: (x, z): Item => ({ op: 'gauss', x, z, sigma: 3, amount: 0.8 }),
    fields: [
      { key: 'op', label: 'Kind', type: 'enum', options: ['gauss', 'flatten'] },
      num('sigma', 'Hill size (sigma, m)', 0.5, 0.5),
      num('amount', 'Hill height (m; negative: pit)', 0.1),
      num('inner', 'Flat inside (m)', 0.5, 0),
      num('outer', 'Flat outside (m)', 0.5, 0),
      num('to', 'Flat height (m)', 0.1),
    ],
  },
  {
    // The roam circles. Creatures refer to them by position in this list, so zones can move and resize but not be added or removed.
    id: 'zones', label: 'Roam zone', color: 0x9be37a, shape: 'circle', fixed: true,
    radius: (i) => Number(i.r),
    items: (d) => lvl(d).zones as unknown as Item[],
    make: (x, z): Item => ({ id: 'zone', x, z, r: 4 }),
    makeIn: (d, x, z): Item => ({ id: nextId(lvl(d).zones, 'zone'), x, z, r: 4 }),
    fields: [num('r', 'Radius (m)', 0.1, 0.5)],
  },
  {
    id: 'cover', label: 'Cover', color: 0x6b8e23, shape: 'circle',
    radius: () => 1.2,
    items: (d) => lvl(d).cover as unknown as Item[],
    make: (x, z): Item => ({ id: 'cover', x, z }),
    makeIn: (d, x, z): Item => ({ id: nextId(lvl(d).cover, 'cover'), x, z }),
    fields: [],
  },
  {
    // A creature's roam circle is its zone (above); `radius` is how far it wanders from its spot.
    id: 'creatures', label: 'Creature', color: 0xff9f1c, shape: 'circle',
    radius: (i) => Math.max(0.5, Number(i.radius)),
    items: (d) => lvl(d).creatures as unknown as Item[],
    make: (x, z): Item => ({ id: 'creature', x, z, species: 'dewdrop', zone: 0, lift: 0, rotY: 0, behavior: 'patrol', speed: 0.3, radius: 2 }),
    makeIn: (d, x, z): Item => ({ id: nextId(lvl(d).creatures, 'creature'), x, z, species: 'dewdrop', zone: 0, lift: 0, rotY: 0, behavior: 'patrol', speed: 0.3, radius: 2 }),
    fields: [
      txt('species', 'Species'),
      num('zone', 'Zone (index, 0 = first)', 1, 0),
      num('lift', 'Height above ground (m)', 0.1),
      num('rotY', 'Facing (rad)', 0.1),
      { key: 'behavior', label: 'Behaviour', type: 'enum', options: BEHAVIOURS },
      num('speed', 'Speed', 0.05, 0),
      num('radius', 'Wander radius (m)', 0.1, 0),
      num('scale', 'Scale', 0.05, 0.2),
      num('bob', 'Bob on water (m, 0 = none)', 0.01, 0),
    ],
  },
  {
    id: 'ponds', label: 'Pool', color: 0x4aa3ff, shape: 'circle',
    radius: (i) => Number(i.r),
    items: (d) => lvl(d).ponds as unknown as Item[],
    make: (x, z): Item => ({ id: 'pool', x, z, r: 3, level: 0, color: 0x3b8ec4, lava: false }),
    makeIn: (d, x, z): Item => ({ id: nextId(lvl(d).ponds, 'pool'), x, z, r: 3, level: 0, color: 0x3b8ec4, lava: false }),
    fields: [num('r', 'Radius (m)', 0.1, 0.5), num('level', 'Surface height (m)', 0.1), { key: 'color', label: 'Colour', type: 'color' }, { key: 'lava', label: 'Lava', type: 'bool' }],
  },
  {
    id: 'islands', label: 'Island', color: 0x9a7b4f, shape: 'circle',
    radius: (i) => Number(i.r),
    items: (d) => lvl(d).islands as unknown as Item[],
    make: (x, z): Item => ({ id: 'island', x, z, r: 1.2, h: 0.5 }),
    makeIn: (d, x, z): Item => ({ id: nextId(lvl(d).islands, 'island'), x, z, r: 1.2, h: 0.5 }),
    fields: [num('r', 'Radius (m)', 0.1, 0.5), num('h', 'Top height (m)', 0.1)],
  },
  {
    id: 'platforms', label: 'Platform', color: 0xc2a878, shape: 'circle',
    radius: (i) => Number(i.r),
    items: (d) => lvl(d).platforms as unknown as Item[],
    make: (x, z): Item => ({ id: 'platform', x, z, r: 1.4, h: 1 }),
    makeIn: (d, x, z): Item => ({ id: nextId(lvl(d).platforms, 'platform'), x, z, r: 1.4, h: 1 }),
    fields: [num('r', 'Radius (m)', 0.1, 0.5), num('h', 'Top height (m)', 0.1)],
  },
  {
    id: 'props', label: 'Prop', color: 0xf2d16b, shape: 'circle',
    radius: () => 1.2,
    items: (d) => lvl(d).props as unknown as Item[],
    make: (x, z): Item => ({ prefab: 'yarn-ball', x, z }),
    fields: [
      { key: 'prefab', label: 'Prefab', type: 'prefab' },
      num('rot', 'Rotation (rad)', 0.05),
      num('scale', 'Scale', 0.1, 0.1),
    ],
  },
];

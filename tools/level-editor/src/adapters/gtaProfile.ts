// What the Select tool can place and edit in a Gnome Theft Auto region. Props are placed and edited; markers are one shared list
// split by kind. Landmarks, givers, sites and setpieces are fixed: the game's code names them by id, so they can be moved and
// edited but not added or deleted. Reserved zones and walk points can be added.
import type { MarkerDef } from '@lawn/level';
import type { CollectionDef, FieldDef, Item, MutableZone } from '../context';
import type { GtaLevel } from './gtaLevel';

const lvl = (d: MutableZone): GtaLevel => d as unknown as GtaLevel;
const markers = (d: MutableZone): Item[] => lvl(d).markers as unknown as Item[];

const num = (key: string, label: string, step = 0.1, min?: number): FieldDef => ({ key, label, type: 'number', step, min });
const txt = (key: string, label: string): FieldDef => ({ key, label, type: 'text' });

/** A marker's `data` (read without creating it). */
const readData = (i: Item): Record<string, unknown> => (i.data && typeof i.data === 'object' ? i.data as Record<string, unknown> : {});
/** A marker's `data`, created when absent (for writes). */
function writeData(i: Item): Record<string, unknown> {
  if (!i.data || typeof i.data !== 'object') i.data = {};
  return i.data as Record<string, unknown>;
}

/** A number field stored in a marker's `data` under `key`. */
const dataNum = (key: string, label: string, step: number, min: number): FieldDef => ({
  key, label, type: 'number', step, min,
  get: (i) => readData(i)[key],
  set: (i, v) => { writeData(i)[key] = v; },
});

/** The next free id `<prefix><n>`, where n counts the markers of that kind (ids are what the game and the file refer to). */
function nextId(ms: readonly MarkerDef[], kind: string, prefix: string): string {
  const used = new Set(ms.map((m) => m.id));
  let n = ms.filter((m) => m.kind === kind).length + 1;
  while (used.has(`${prefix}${n}`)) n += 1;
  return `${prefix}${n}`;
}

/** A fixed marker collection: the kinds listed, drawn as circles of `radius` metres, no fields. */
function fixedMarkers(id: string, label: string, color: number, kinds: readonly string[], radius: number, fields: FieldDef[] = []): CollectionDef {
  return {
    id, label, color, shape: 'circle', fixed: true,
    radius: () => radius,
    items: markers,
    accepts: (i) => kinds.includes(String(i.kind)),
    make: (x, z): Item => ({ id: `${kinds[0]}-new`, kind: kinds[0], x, z }),
    fields,
  };
}

export const GTA_COLLECTIONS: readonly CollectionDef[] = [
  {
    id: 'props', label: 'Prop', color: 0xf2d16b, shape: 'circle',
    radius: (i) => Math.max(1, Number(i.scale ?? 1)),
    items: (d) => lvl(d).props as unknown as Item[],
    make: (x, z): Item => ({ prefab: 'garden-rock', x, z, rot: 0, scale: 1 }),
    fields: [
      { key: 'prefab', label: 'Prefab', type: 'prefab' },
      num('rot', 'Rotation (rad)', 0.05),
      num('scale', 'Scale', 0.1, 0.1),
      { key: 'solid', label: 'Solid (box collider)', type: 'bool' },
      txt('tint', 'Tint #rrggbb'),
    ],
  },
  fixedMarkers('landmarks', 'Landmark', 0x4ad6ff, ['spawn', 'landmark', 'area', 'portal'], 3),
  fixedMarkers('givers', 'Quest giver', 0xffb347, ['giver'], 1.5),
  fixedMarkers('sites', 'Site', 0xc27bff, ['site'], 10),
  fixedMarkers('setpieces', 'Setpiece', 0x7fd17a, ['setpiece'], 6, [
    { key: 'yaw', label: 'Yaw (rad)', type: 'number', step: 0.05,
      get: (i) => readData(i).yaw,
      set: (i, v) => { writeData(i).yaw = v; } },
  ]),
  {
    id: 'reserves', label: 'Reserved zone', color: 0xff8a8a, shape: 'circle',
    radius: (i) => Math.max(Number(readData(i).hw ?? 0), Number(readData(i).hd ?? 0)),
    items: markers,
    accepts: (i) => i.kind === 'reserve',
    make: (x, z): Item => ({ id: 'reserve/zone-1', kind: 'reserve', x, z, data: { hw: 8, hd: 8 } }),
    makeIn: (d, x, z): Item => ({ id: nextId(lvl(d).markers, 'reserve', 'reserve/zone-'), kind: 'reserve', x, z, data: { hw: 8, hd: 8 } }),
    fields: [dataNum('hw', 'Half width (m)', 0.5, 0.5), dataNum('hd', 'Half depth (m)', 0.5, 0.5)],
  },
  {
    id: 'walks', label: 'Walk point', color: 0xa0ffd0, shape: 'circle',
    radius: () => 0.8,
    items: markers,
    accepts: (i) => i.kind === 'walk',
    make: (x, z): Item => ({ id: 'walk/1', kind: 'walk', x, z }),
    makeIn: (d, x, z): Item => ({ id: nextId(lvl(d).markers, 'walk', 'walk/'), kind: 'walk', x, z }),
    fields: [],
  },
];

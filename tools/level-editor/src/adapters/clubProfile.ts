// What the Select tool can place on a Club Gnome map. A map is a rectangle around (0, 0); +z is toward the camera.
import { GAME_LINKS, MAP_IDS } from '@club/config';
import { prefabFootprint } from '@lawn/prefabs';
import type { CollectionDef, Item } from '../context';

const num = (key: string, label: string, step = 0.1, min?: number): CollectionDef['fields'][number] => ({ key, label, type: 'number', step, min });
const rid = (): string => Math.random().toString(36).slice(2, 7);
const list = (key: string) => (d: Record<string, unknown>): Item[] => ((d[key] ??= []) as Item[]);

export const CLUB_COLLECTIONS: readonly CollectionDef[] = [
  {
    id: 'spawn', label: 'Spawn', color: 0x40e0d0, shape: 'circle', fixed: true,
    radius: () => 1.2,
    items: (d) => [(d as unknown as { spawn: Item }).spawn],
    make: (x, z) => ({ x, z }),
    fields: [],
  },
  {
    id: 'props', label: 'Prop', color: 0x9be37a, shape: 'circle',
    radius: (i) => Math.max(0.8, Number(i.scale ?? 1) * 0.6),
    items: (d) => list('props')(d as unknown as Record<string, unknown>),
    make: (x, z): Item => ({ prefab: 'bench', x, z, rot: 0, scale: 1 }),
    fields: [{ key: 'prefab', label: 'Prefab', type: 'prefab' }, num('rot', 'Rotation', 0.1), num('scale', 'Scale', 0.1, 0.1), { key: 'tint', label: 'Tint name', type: 'text' }],
  },
  {
    id: 'buildings', label: 'Building', color: 0xff8a4a, shape: 'rect',
    radius: (i) => Math.max(Number(i.w), Number(i.d)) / 2,
    items: (d) => list('buildings')(d as unknown as Record<string, unknown>),
    make: (x, z): Item => ({ id: `building-${rid()}`, label: 'NEW', x, z, w: 6, d: 5, h: 4, color: 0x2f64c9, roof: 0x23234a }),
    fields: [
      { key: 'id', label: 'Id', type: 'text' }, { key: 'label', label: 'Sign text', type: 'text' },
      num('w', 'Width (x)', 0.5, 1), num('d', 'Depth (z)', 0.5, 1), num('h', 'Height', 0.5, 1),
      { key: 'color', label: 'Wall colour', type: 'color' }, { key: 'roof', label: 'Roof colour', type: 'color' },
      { key: 'link', label: 'Door links to (id)', type: 'text' }, { key: 'neon', label: 'Neon sign', type: 'bool' },
    ],
  },
  {
    id: 'blockers', label: 'Blocker', color: 0xff5a5a, shape: 'rect',
    radius: (i) => Math.max(Number(i.w), Number(i.d)) / 2,
    items: (d) => list('blockers')(d as unknown as Record<string, unknown>),
    make: (x, z): Item => ({ x, z, w: 2, d: 2 }),
    fields: [num('w', 'Width (x)', 0.1, 0.1), num('d', 'Depth (z)', 0.1, 0.1)],
  },
  {
    id: 'portals', label: 'Portal', color: 0x6cc0ff, shape: 'circle',
    radius: (i) => Number(i.r),
    items: (d) => list('portals')(d as unknown as Record<string, unknown>),
    make: (x, z): Item => ({ id: `portal-${rid()}`, label: 'Go somewhere', x, z, r: 1, to: MAP_IDS[0], spawnX: 0, spawnZ: 0 }),
    fields: [
      { key: 'id', label: 'Id', type: 'text' }, { key: 'label', label: 'Button text', type: 'text' }, num('r', 'Radius', 0.1, 0.3),
      { key: 'to', label: 'Goes to', type: 'enum', options: MAP_IDS }, num('spawnX', 'Arrive X', 0.1), num('spawnZ', 'Arrive Z', 0.1),
    ],
    deleteBlocked: (d, index) => {
      const id = (d as unknown as { portals: { id: string }[] }).portals[index]?.id;
      const b = (d as unknown as { buildings: { id: string; link?: string }[] }).buildings.find((x) => x.link === id);
      return b ? `Building "${b.id}" has its door linked to this portal.` : null;
    },
  },
  {
    id: 'spots', label: 'Game spot', color: 0xffd24a, shape: 'circle',
    radius: (i) => Number(i.r),
    items: (d) => list('spots')(d as unknown as Record<string, unknown>),
    make: (x, z): Item => ({ id: `spot-${rid()}`, label: 'Play something', x, z, r: 1.5, game: Object.keys(GAME_LINKS)[0] }),
    fields: [
      { key: 'id', label: 'Id', type: 'text' }, { key: 'label', label: 'Button text', type: 'text' }, num('r', 'Radius', 0.1, 0.3),
      { key: 'game', label: 'Opens', type: 'enum', options: Object.keys(GAME_LINKS) },
    ],
    deleteBlocked: (d, index) => {
      const id = (d as unknown as { spots: { id: string }[] }).spots[index]?.id;
      const b = (d as unknown as { buildings: { id: string; link?: string }[] }).buildings.find((x) => x.link === id);
      return b ? `Building "${b.id}" has its door linked to this spot.` : null;
    },
  },
  {
    id: 'seats', label: 'Seat', color: 0xc084fc, shape: 'circle',
    radius: (i) => Number(i.r),
    items: (d) => list('seats')(d as unknown as Record<string, unknown>),
    make: (x, z): Item => ({ id: `seat-${rid()}`, label: 'Sit down', x, z, r: 1, facing: 0, y: 0.5 }),
    fields: [{ key: 'id', label: 'Id', type: 'text' }, { key: 'label', label: 'Button text', type: 'text' }, num('r', 'Radius', 0.1, 0.3), num('facing', 'Facing (rad)', 0.1), num('y', 'Seat height', 0.05, 0)],
  },
  {
    id: 'signs', label: 'Sign', color: 0xf0e68c, shape: 'circle',
    radius: () => 0.8,
    items: (d) => list('signs')(d as unknown as Record<string, unknown>),
    make: (x, z): Item => ({ text: 'A sign', x, z }),
    fields: [{ key: 'text', label: 'Text', type: 'text' }, num('y', 'Height (indoor)', 0.05, 0), num('rot', 'Rotation', 0.1), { key: 'color', label: 'Board colour', type: 'color' }],
  },
  {
    id: 'patches', label: 'Floor patch', color: 0x8fd0c0, shape: 'rect',
    radius: (i) => Math.max(Number(i.w), Number(i.d)) / 2,
    items: (d) => list('patches')(d as unknown as Record<string, unknown>),
    make: (x, z): Item => ({ x, z, w: 4, d: 4, color: 0xc8b48a }),
    fields: [num('w', 'Width (x)', 0.1, 0.1), num('d', 'Depth (z)', 0.1, 0.1), { key: 'color', label: 'Colour', type: 'color' }],
  },
];

/** A prop's solid radius default: the prefab's footprint (Club Gnome keeps its blockers as separate rectangles). */
export const clubFootprint = prefabFootprint;

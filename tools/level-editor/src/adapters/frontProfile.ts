// What the Select tool can place and edit in Gnome Front's arena.
import { VEHICLES } from '@front/config';
import type { CollectionDef, Item, MutableZone } from '../context';
import type { FrontLevel } from './frontLevel';

const num = (key: string, label: string, step = 0.1, min?: number, max?: number): CollectionDef['fields'][number] => ({ key, label, type: 'number', step, min, max });
const lvl = (d: MutableZone): FrontLevel => d as unknown as FrontLevel;
const FLAG_IDS = ['A', 'B', 'C', 'D', 'E'];

export const FRONT_COLLECTIONS: readonly CollectionDef[] = [
  {
    id: 'bases', label: 'Base', color: 0xff5a5a, shape: 'circle', fixed: true,
    radius: () => 3,
    items: (d) => lvl(d).bases as unknown as Item[],
    make: (x, z) => ({ x, z }),
    fields: [num('yaw', 'Facing (rad)', 0.1)],
  },
  {
    // The five conquest flags. A flag's landmarks (the birdbath, the beds, the fountain...) move with it.
    id: 'flags', label: 'Flag', color: 0xffd24a, shape: 'circle', fixed: true,
    radius: () => 3,
    items: (d) => lvl(d).flags as unknown as Item[],
    make: (x, z) => ({ x, z }),
    fields: [{ key: 'name', label: 'Name', type: 'text' }],
    follows: (d, item) => lvl(d).landmarks.filter((l) => l.at === item.id) as unknown as Item[],
  },
  {
    id: 'vehicles', label: 'Vehicle', color: 0x6cc0ff, shape: 'circle',
    radius: () => 2,
    items: (d) => lvl(d).vehicles as unknown as Item[],
    make: (x, z): Item => ({ id: 'new', vehicle: 'green', team: 0, x, z, yaw: 0 }),
    fields: [
      { key: 'vehicle', label: 'Kind', type: 'enum', options: Object.keys(VEHICLES) },
      num('team', 'Team (0 red, 1 blue)', 1, 0, 1),
      num('yaw', 'Facing (rad)', 0.1),
    ],
  },
  {
    id: 'mounds', label: 'Mound', color: 0x9be37a, shape: 'circle',
    radius: (i) => Number(i.r),
    items: (d) => lvl(d).mounds as unknown as Item[],
    make: (x, z): Item => ({ x, z, r: 15, h: 5 }),
    fields: [num('r', 'Spread', 0.5, 1), num('h', 'Height (negative = dip)', 0.5)],
  },
  {
    id: 'landmarks', label: 'Landmark', color: 0xff8a4a, shape: 'circle',
    radius: (i) => Math.max(1.5, Number(i.scale ?? 1) * 0.6),
    items: (d) => lvl(d).landmarks as unknown as Item[],
    make: (x, z): Item => ({ at: 'C', prefab: 'garden-rock', scale: 3, rotY: 0, x, z, obstacles: [{ dx: 0, dz: 0, r: 1.2, h: 1.4 }] }),
    fields: [
      { key: 'prefab', label: 'Prefab', type: 'prefab' },
      num('scale', 'Scale', 0.1, 0.1),
      num('rotY', 'Rotation', 0.1),
      { key: 'at', label: 'Belongs to flag', type: 'enum', options: FLAG_IDS },
    ],
  },
];

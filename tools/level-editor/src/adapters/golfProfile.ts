// What the Select tool can place and edit on Gnome Golf's island.
import type { CollectionDef, Item, MutableZone } from '../context';
import { nearestHole, type GolfLevel } from './golfLevel';

const num = (key: string, label: string, step = 0.1, min?: number, max?: number): CollectionDef['fields'][number] => ({ key, label, type: 'number', step, min, max });
const lvl = (d: MutableZone): GolfLevel => d as unknown as GolfLevel;
const holeField = num('n', 'Hole (1-9)', 1, 1, 9);

export const GOLF_COLLECTIONS: readonly CollectionDef[] = [
  {
    id: 'holes', label: 'Tee', color: 0xffd24a, shape: 'circle', fixed: true,
    radius: () => 6,
    items: (d) => lvl(d).holes as unknown as Item[],
    make: (x, z) => ({ x, z }),
    fields: [num('par', 'Par', 1, 3, 5), num('fairwayWidth', 'Fairway width (yd)', 1, 4), num('fairwayStart', 'Fairway starts (yd from tee)', 1, 0)],
  },
  {
    id: 'greens', label: 'Green', color: 0x7fd04a, shape: 'circle', fixed: true,
    radius: (i) => Number(i.r),
    items: (d) => lvl(d).greens as unknown as Item[],
    make: (x, z) => ({ x, z }),
    fields: [num('r', 'Radius (yd)', 0.5, 3), num('slopeX', 'Tilt toward +x', 0.001), num('slopeZ', 'Tilt toward +z', 0.001)],
  },
  {
    id: 'pins', label: 'Pin', color: 0xff5a5a, shape: 'circle', fixed: true,
    radius: () => 2,
    items: (d) => lvl(d).pins as unknown as Item[],
    make: (x, z) => ({ x, z }),
    fields: [],
  },
  {
    // The bends of a fairway. A hole with none is a straight line from tee to green.
    id: 'corners', label: 'Fairway corner', color: 0x9be37a, shape: 'circle',
    radius: () => 4,
    items: (d) => lvl(d).corners as unknown as Item[],
    make: (x, z): Item => ({ n: 1, x, z }),
    makeIn: (d, x, z): Item => ({ n: nearestHole(lvl(d), x, z), x, z }),
    fields: [holeField],
  },
  {
    id: 'bunkers', label: 'Bunker', color: 0xe2cf8f, shape: 'circle',
    radius: (i) => Number(i.r),
    items: (d) => lvl(d).bunkers as unknown as Item[],
    make: (x, z): Item => ({ n: 1, x, z, r: 6 }),
    makeIn: (d, x, z): Item => ({ n: nearestHole(lvl(d), x, z), x, z, r: 6 }),
    fields: [holeField, num('r', 'Radius (yd)', 0.5, 1)],
  },
  {
    id: 'ponds', label: 'Pond', color: 0x4aa3ff, shape: 'circle',
    radius: (i) => Number(i.r),
    items: (d) => lvl(d).ponds as unknown as Item[],
    make: (x, z): Item => ({ n: 1, x, z, r: 15 }),
    makeIn: (d, x, z): Item => ({ n: nearestHole(lvl(d), x, z), x, z, r: 15 }),
    fields: [holeField, num('r', 'Radius (yd)', 0.5, 1)],
  },
];

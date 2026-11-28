// The plant table: which prefabs are mowable and how each one mows. Tuning lives here (FLORA) so it can be changed
// without reading the runtime. A kind that is not in the table, or has mowable: false, stays a static solid prefab.
import type { PlantKind } from './types';

/** Tuning for mowing, brushing and regrowth. */
export const FLORA = {
  /** A placement taller than this (m, scaled) stays static and solid even when its kind is mowable (a giant cactus). */
  maxMowHeight: 1.8,
  /** Contact radius = this times the placed footprint's longer side. */
  contactFactor: 0.42,
  /** A cut plant is drawn at this fraction of its height (stubble). */
  stubbleY: 0.14,
  /** Regrowth (stubble back to full height) takes this long, s. */
  regrowSeconds: 4,
  /** A cut plant only starts to regrow while the player is at least this far away (m). */
  regrowAwayM: 30,
  /** Vehicles below this speed (m/s) and gnomes do not mow. */
  minMowSpeed: 1.2,
  /** A vehicle more than this far above the ground (m) does not mow (jumps, aircraft). */
  maxMowAboveGround: 0.9,
  /** Camera shake when the player's vehicle mows a big shrub. */
  bigShake: 0.12,
  /** Gnome on foot: lean away (radians) and spring back (s). */
  brushLean: 0.35,
  brushBack: 0.6,
  /** A gnome brushes plants within this radius of its feet (m). */
  brushRadius: 0.45,
  /** Sounds: at most one mow sound per vehicle per this many s, and at most this many mow sounds per frame. */
  soundGap: 0.12,
  soundsPerFrame: 3,
  /** Clippings: particles per burst for tiny / small / big plants. */
  clipCount: { tiny: 5, small: 9, big: 14 },
  /** Lawn Service: every `every` long-grass cuts on a mower pays `pay` Acorns. */
  lawn: { every: 10, pay: 3 },
  /** Achievements, counted on the player's mows. */
  achievements: { shortBack: 'gta-short-back-and-sides', groundskeeper: 'gta-head-groundskeeper' },
} as const;

/** The player's vehicle kinds that count as mowers for Lawn Service. */
export const MOWER_KINDS: readonly string[] = ['ride-on', 'zero-turn', 'mulch-spreader', 'combine', 'lawn-roller'];

const NEVER = { slow: 1, clip: 0x4a7a3a, regrow: [0, 0] as const, sound: 'mow-thunk' as const, longGrass: false };

/**
 * Every plant-like prefab placed in the world, mowable or not. Measured unscaled heights (m) in the comments; placed
 * scales are in docs/roadmaps/gta-mowable-plants.md.
 */
export const PLANT_KINDS: readonly PlantKind[] = [
  // Mowable: crops and grass (tiny/small), beds and ferns, small cacti, shrubs (big: a small slow and a shake).
  { id: 'wheat-patch', name: 'Wheat', size: 'tiny', mowable: true, slow: 1, clip: 0xd8b75a, regrow: [90, 120], sound: 'mow-snip', longGrass: true }, // 0.40
  { id: 'ornamental-grass', name: 'Ornamental grass', size: 'small', mowable: true, slow: 0.98, clip: 0xb8b060, regrow: [70, 110], sound: 'mow-snip', longGrass: true }, // 1.07
  { id: 'fern-clump', name: 'Fern', size: 'small', mowable: true, slow: 0.98, clip: 0x4f8f3a, regrow: [70, 110], sound: 'mow-snip', longGrass: false }, // 0.22
  { id: 'flower-bed', name: 'Flower bed', size: 'small', mowable: true, slow: 0.97, clip: 0xd96aa0, regrow: [70, 110], sound: 'mow-snip', longGrass: false }, // 0.59
  { id: 'wildflower-patch', name: 'Wildflowers', size: 'small', mowable: true, slow: 0.97, clip: 0xe8c43a, regrow: [70, 110], sound: 'mow-snip', longGrass: false }, // 0.88
  { id: 'lavender-row', name: 'Lavender', size: 'small', mowable: true, slow: 0.97, clip: 0x9b7fd1, regrow: [70, 110], sound: 'mow-snip', longGrass: false }, // 0.51
  { id: 'barrel-cactus', name: 'Barrel cactus', size: 'small', mowable: true, slow: 0.95, clip: 0x5d8f4a, regrow: [80, 120], sound: 'mow-chop', longGrass: false }, // 0.35
  { id: 'reed-bed', name: 'Reeds', size: 'big', mowable: true, slow: 0.9, clip: 0x8fa457, regrow: [80, 120], sound: 'mow-chop', longGrass: true }, // 1.40
  { id: 'boxwood-ball', name: 'Boxwood', size: 'big', mowable: true, slow: 0.86, clip: 0x3f7a35, regrow: [90, 120], sound: 'mow-thunk', longGrass: false }, // 1.00
  { id: 'round-bush', name: 'Round bush', size: 'big', mowable: true, slow: 0.86, clip: 0x4a8a3c, regrow: [90, 120], sound: 'mow-thunk', longGrass: false }, // 1.23
  { id: 'rose-bush', name: 'Rose bush', size: 'big', mowable: true, slow: 0.88, clip: 0xd94a6a, regrow: [90, 120], sound: 'mow-thunk', longGrass: false }, // 0.91
  { id: 'flowering-bush', name: 'Flowering bush', size: 'big', mowable: true, slow: 0.88, clip: 0xe07ab0, regrow: [90, 120], sound: 'mow-thunk', longGrass: false }, // 0.48
  { id: 'allotment-bed', name: 'Allotment bed', size: 'small', mowable: true, slow: 0.95, clip: 0x6a9a3a, regrow: [80, 120], sound: 'mow-chop', longGrass: false }, // 0.62
  // European plants (E29).
  { id: 'euro-geranium-bed', name: 'Geraniums', size: 'small', mowable: true, slow: 0.97, clip: 0xd8342c, regrow: [70, 110], sound: 'mow-snip', longGrass: false },
  // Not mowable: trees, hedgerow walls, set-piece topiary, tall cacti. They keep their colliders.
  { id: 'hedgerow', name: 'Hedgerow', size: 'big', mowable: false, ...NEVER }, // 1.30, a wall
  { id: 'hedge-arch', name: 'Hedge arch', size: 'big', mowable: false, ...NEVER },
  { id: 'topiary-cone', name: 'Topiary', size: 'big', mowable: false, ...NEVER }, // 2.20
  { id: 'tall-cactus', name: 'Tall cactus', size: 'big', mowable: false, ...NEVER }, // 4.00
  { id: 'broadleaf-tree', name: 'Tree', size: 'big', mowable: false, ...NEVER },
  { id: 'cone-pine', name: 'Pine', size: 'big', mowable: false, ...NEVER },
  { id: 'snow-pine', name: 'Snow pine', size: 'big', mowable: false, ...NEVER },
  { id: 'palm-tree', name: 'Palm', size: 'big', mowable: false, ...NEVER },
  { id: 'giant-oak', name: 'Giant oak', size: 'big', mowable: false, ...NEVER },
  // European plants (E29).
  { id: 'euro-box-hedge', name: 'Box hedge', size: 'big', mowable: false, ...NEVER },
  { id: 'euro-topiary-spiral', name: 'Spiral topiary', size: 'big', mowable: false, ...NEVER },
  { id: 'euro-topiary-lollipop', name: 'Bay tree', size: 'big', mowable: false, ...NEVER },
  { id: 'euro-espalier-pear', name: 'Espalier pear', size: 'big', mowable: false, ...NEVER },
  { id: 'euro-plane-tree', name: 'Plane tree', size: 'big', mowable: false, ...NEVER },
];

const byId = new Map<string, number>(PLANT_KINDS.map((k, i) => [k.id, i]));

/** Index of a prefab id in PLANT_KINDS, or -1. */
export function plantKindIndex(id: string): number {
  return byId.get(id) ?? -1;
}

/** The table row for a prefab id, or null. */
export function plantKind(id: string): PlantKind | null {
  const i = byId.get(id);
  return i === undefined ? null : PLANT_KINDS[i];
}

/** True when a placement of `id` whose placed height is `placedHeight` (m) is drawn and mowed by flora. */
export function mowableAt(id: string, placedHeight: number): boolean {
  const k = plantKind(id);
  return !!k && k.mowable && placedHeight <= FLORA.maxMowHeight;
}

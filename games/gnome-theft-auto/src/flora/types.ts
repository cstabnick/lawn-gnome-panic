// Mowable plants (src/flora/): shared types. Plan: docs/roadmaps/gta-mowable-plants.md.
// Small bushes, flower beds, ferns, grass and crops are not colliders: a vehicle that drives into one mows it (cut to
// stubble, clippings, a snip sound), a gnome on foot brushes it aside, and it regrows a minute or two later.
import type { StaticPrefabPlacement } from '@lawn/prefabs';

/** tiny: crops and grass (no slow, no shake); small: beds, ferns, small cacti; big: shrubs (a small slow and a shake). */
export type SizeClass = 'tiny' | 'small' | 'big';

/** World sound ids registered by flora/sounds.ts. */
export type MowSoundId = 'mow-snip' | 'mow-chop' | 'mow-thunk' | 'mow-rustle';

/** One row of the plant table (flora/kinds.ts PLANT_KINDS). `id` is the @lawn/prefabs id. */
export interface PlantKind {
  id: string;
  /** A plain-language name for the trainer and the save's per-kind counts. */
  name: string;
  size: SizeClass;
  /** False: the plant stays a static, solid prefab (trees, hedgerows, topiary, big cacti). Listed for the record. */
  mowable: boolean;
  /** A vehicle's speed is multiplied by this once when it mows the plant (1 = no slow). Never below 0.8. */
  slow: number;
  /** Clippings colour. */
  clip: number;
  /** Seconds from cut to the start of regrowth: [min, max], picked per cut. */
  regrow: readonly [number, number];
  /** Played at the plant when it is mown. */
  sound: MowSoundId;
  /** Long grass or a crop: counts toward the Lawn Service bonus when a mower cuts it. */
  longGrass: boolean;
}

/** One mowable plant taken out of a static batch (flora/harvest.ts seedOf). All positions in world metres. */
export interface PlantSeed {
  /** Index into PLANT_KINDS. */
  kind: number;
  /** The placement it came from (id, x, y, z, yaw, scale, tint, trim). */
  p: StaticPrefabPlacement;
  /** Origin on the ground (p.x, p.y ?? 0, p.z). */
  x: number; y: number; z: number;
  yaw: number;
  scale: number;
  /** Footprint centre and half sizes of the placed prefab's axis-aligned footprint. */
  cx: number; cz: number; hw: number; hd: number;
  /** Placed height above y. */
  h: number;
  /** Contact radius around the footprint centre (cx, cz) for mowing and brushing. */
  r: number;
}

/** Plant states (flora/state.ts). */
export const STANDING = 0;
export const CUT = 1;
export const REGROWING = 2;
export type PlantStateId = typeof STANDING | typeof CUT | typeof REGROWING;

/**
 * Every plant of one harvest as flat typed arrays, plus a uniform grid over them (flora/grid.ts createPlantStore).
 * Index i is the same plant in every array. Nothing here allocates per frame.
 */
export interface PlantStore {
  count: number;
  seeds: readonly PlantSeed[];
  /** Footprint centre (contact centre). */
  cx: Float32Array; cz: Float32Array;
  /** Contact radius. */
  r: Float32Array;
  kind: Uint8Array;
  /** STANDING, CUT or REGROWING. */
  state: Uint8Array;
  /** Seconds spent in the current state. */
  t: Float32Array;
  /** CUT: seconds to wait before regrowing (picked at the cut). */
  wait: Float32Array;
  /** Plants not STANDING, packed at the front: active[0..activeCount). activeAt[i] = slot in `active`, or -1. */
  active: Int32Array;
  activeAt: Int32Array;
  activeCount: number;
  /** Grid: cell size (m), origin (minimum corner), size in cells, largest r. Plants are filed by the cell of (cx, cz). */
  cell: number; ox: number; oz: number; nx: number; nz: number; maxR: number;
  /** cellItems[cellStart[c] .. cellStart[c + 1]) are the plants in cell c = iz * nx + ix. */
  cellStart: Int32Array;
  cellItems: Int32Array;
}

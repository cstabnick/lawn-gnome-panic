// Windfall Croft (E16, L69): the farm the player buys on a loan and grows produce on, or plants an oak and waits.
// Pure data and types only. The farm is private per player and saved locally (FARM.saveKey); other players see the
// croft's buildings but not its beds. Growth runs on game time while the game is open and on the wall clock while it is
// closed, capped at FARM.offlineCapS (no endless offline grind). Lore: docs/lore/entries/apocrypha/windfall-croft.md.
// World coordinates: +x east, +z south; the E01 site `farm-plot` is x 60..140, z 505..565 (flat); the `south` road
// passes ~14 m west of it, so the gate is on the west side.

export type CropId = 'radish' | 'carrot' | 'cabbage' | 'pumpkin' | 'oak';
export const CROP_IDS: readonly CropId[] = ['radish', 'carrot', 'cabbage', 'pumpkin', 'oak'];

export interface CropDef {
  id: CropId;
  name: string;
  /** Acorns per planting. */
  seedCost: number;
  /** Seconds of (watered) growth per stage. A crop has three stages: 0 sprout, 1 growing, 2 ripe (two steps). */
  stageS: number;
  /** = 2 * stageS: seconds from planting to ripe. */
  growS: number;
  /** Produce per harvest. */
  yield: number;
  /** Acorns per produce at the stall. */
  sell: number;
  /** Inventory item id of one produce (registered by farm/runtime.ts; kind 'snack' with `heal`). Oak: none. */
  item: string | null;
  /** Health (0..1) one produce heals when eaten from the bag. */
  heal: number;
  /** @lawn/prefabs ids for stages 0, 1, 2 (one plant; a bed shows BED.plants of them). */
  prefabStages: readonly [string, string, string];
  /** @lawn/prefabs id of one produce (the bag icon). Oak: 'acorn'. */
  produce: string;
  /** Each stage needs watering before it grows (crops); the oak is watered once at planting and never again. */
  needsWater: boolean;
  blurb: string;
}

const crop = (c: Omit<CropDef, 'growS'>): CropDef => ({ ...c, growS: c.stageS * 2 });

export const CROPS: readonly CropDef[] = [
  crop({ id: 'radish', name: 'Radishes', seedCost: 5, stageS: 45, yield: 4, sell: 4, item: 'produce-radish', heal: 0.08,
    prefabStages: ['crop-radish-0', 'crop-radish-1', 'crop-radish-2'], produce: 'produce-radish', needsWater: true,
    blurb: 'Quick, red and rude about it. Ready before you have finished leaning on the fence.' }),
  crop({ id: 'carrot', name: 'Carrots', seedCost: 8, stageS: 90, yield: 4, sell: 6, item: 'produce-carrot', heal: 0.12,
    prefabStages: ['crop-carrot-0', 'crop-carrot-1', 'crop-carrot-2'], produce: 'produce-carrot', needsWater: true,
    blurb: 'Grows down, which the HOA has not yet thought to forbid.' }),
  crop({ id: 'cabbage', name: 'Cabbages', seedCost: 15, stageS: 180, yield: 2, sell: 22, item: 'produce-cabbage', heal: 0.2,
    prefabStages: ['crop-cabbage-0', 'crop-cabbage-1', 'crop-cabbage-2'], produce: 'produce-cabbage', needsWater: true,
    blurb: 'A head of cabbage has more sense than most heads on the council.' }),
  crop({ id: 'pumpkin', name: 'Pumpkins', seedCost: 30, stageS: 360, yield: 1, sell: 95, item: 'produce-pumpkin', heal: 0.35,
    prefabStages: ['crop-pumpkin-0', 'crop-pumpkin-1', 'crop-pumpkin-2'], produce: 'produce-pumpkin', needsWater: true,
    blurb: 'Slow, round and worth it. A gnome can sit in a big one, and several have.' }),
  // The oak: 20 minutes of growth per stage (40 to grown), then a shake of acorns every FARM.oakShakeS.
  crop({ id: 'oak', name: 'Oak', seedCost: 50, stageS: 1200, yield: 0, sell: 0, item: null, heal: 0,
    prefabStages: ['croft-oak-0', 'croft-oak-1', 'croft-oak-2'], produce: 'acorn', needsWater: false,
    blurb: 'Plant an acorn, wait, and the acorns come back to you. Patience is also a crop.' }),
];

export function cropDef(id: CropId): CropDef {
  const c = CROPS.find((k) => k.id === id);
  if (!c) throw new Error(`farm: unknown crop ${id}`);
  return c;
}

/** Crops planted in beds (everything but the oak, which has its own spot). */
export const BED_CROPS: readonly CropId[] = ['radish', 'carrot', 'cabbage', 'pumpkin'];

/** Tuning. */
export const FARM = {
  /** E08 property (ownership.ts registerProperty / buyProperty). The loan is (price - down) * (1 + interest). */
  propertyId: 'windfall-croft',
  name: 'Windfall Croft',
  price: 2200,
  down: 300,
  interest: 0.1,
  blurb: 'A run-down croft in Cloverfield: a farmhouse, a barn, eight beds and an orchard that will not stay in. The bargain is the weeds.',
  buyHint: 'Signed for at the For Sale board by the croft gate, or in the Ledger app.',
  /** Growth applied for time the game was closed is capped at this (seconds). */
  offlineCapS: 2 * 60 * 60,
  /** A grown oak gives a shake of acorns this often (seconds of growth time). */
  oakShakeS: 10 * 60,
  /** Acorns per shake. */
  oakShakeAcorns: 40,
  /** Produce that does not fit in the bag (inventory STACK_MAX) waits in the croft's crate; the stall sells both. */
  saveKey: 'gta-farm-v1',
  /** Map blip colour (owned croft). */
  blip: '#8fb339',
} as const;

// ---- Layout (world) -------------------------------------------------------------------------------------------------

export interface FarmSpot { x: number; z: number; yaw: number }
export interface Bed { index: number; x: number; z: number; /** Along world x. */ w: number; /** Along world z. */ d: number }

export const BED = { w: 3, d: 8, /** Plants per bed (2 columns x 4). */ plants: 8, /** Prompt reach beyond the bed edge. */ reach: 1.2 } as const;

/** Eight beds: two rows of four, west to east. Index 0-3 north row, 4-7 south row. */
export const BEDS: readonly Bed[] = Array.from({ length: 8 }, (_, i) => ({
  index: i, x: 84 + 7 * (i % 4), z: i < 4 ? 522 : 542, w: BED.w, d: BED.d,
}));

export const CROFT = {
  site: { minX: 60, maxX: 140, minZ: 505, maxZ: 565 },
  /** The gate in the west fence (8 m gap), facing the road. */
  gate: { x: 60.5, z: 535, yaw: -Math.PI / 2 } as FarmSpot,
  /** The For Sale board just inside the gate (E: buy the croft); after buying it reads SOLD. */
  forSale: { x: 64, z: 541, yaw: -Math.PI / 2 } as FarmSpot,
  /** The produce stall by the gate (E: sell produce). Faces the road. */
  stall: { x: 68, z: 526, yaw: -Math.PI / 2 } as FarmSpot,
  /** The seed rack (E: pick which seed to plant next). */
  seedRack: { x: 69, z: 547, yaw: -Math.PI / 2 } as FarmSpot,
  /** The water butt beside the beds (scenery; watering is E at a dry bed). */
  waterButt: { x: 77, z: 532, yaw: 0 } as FarmSpot,
  /** The oak's spot (8 m clear round it). */
  oak: { x: 118, z: 534, yaw: 0 } as FarmSpot,
  /** Run-down farmhouse (14 x 10 m), door facing west. */
  farmhouse: { x: 128, z: 513, w: 14, d: 10, yaw: -Math.PI / 2 },
  /** Barn (14 x 12 m), doors facing west. */
  barn: { x: 128, z: 553, w: 14, d: 12, yaw: -Math.PI / 2 },
  /** The orchard along the south wall: apple trees at z ~560, windfalls rolling over the wall (z 565+). */
  orchard: { minX: 66, maxX: 116, minZ: 556, maxZ: 563 },
  /** Three spots for the croft's vignettes (4 m free). */
  story: [{ x: 110, z: 512, yaw: 0 }, { x: 80, z: 510, yaw: 0 }, { x: 135, z: 534, yaw: -Math.PI / 2 }] as readonly FarmSpot[],
} as const;

// ---- State (farm/state.ts implements the functions) -----------------------------------------------------------------

export interface BedState {
  crop: CropId | null;
  /** 0 sprout, 1 growing, 2 ripe. Meaningless when crop is null. */
  stage: 0 | 1 | 2;
  /** Seconds grown in the current stage. */
  grown: number;
  /** Watered for the current stage (growth only runs while wet). Planting does not water. */
  wet: boolean;
}

export interface OakState {
  planted: boolean;
  stage: 0 | 1 | 2;
  grown: number;
  /** Seconds since the last shake (counts only once grown, stage 2); a shake is ready at FARM.oakShakeS. */
  sinceShake: number;
}

export interface FarmStats {
  planted: number;
  harvested: number;
  sold: number;
  earned: number;
  acornsFromOak: number;
}

export interface FarmState {
  v: 1;
  /** Wall-clock ms when last saved (offline growth is measured from here). */
  savedAt: number;
  beds: BedState[];
  oak: OakState;
  /** Produce that did not fit in the bag, by crop. */
  crate: Partial<Record<CropId, number>>;
  /** The seed the next planting uses (a BED_CROPS id). */
  seed: CropId;
  stats: FarmStats;
}

export type FarmResult = { ok: true } | { ok: false; error: string };

/** What stepFarm reports (the runtime turns these into sounds, meshes and toasts). */
export type FarmEvent =
  | { kind: 'stage'; bed: number; crop: CropId; stage: 0 | 1 | 2 }
  | { kind: 'thirsty'; bed: number; crop: CropId }
  | { kind: 'oak-stage'; stage: 0 | 1 | 2 }
  | { kind: 'oak-ready' };

/** Bed status for prompts and the Farm app. */
export type BedStatus = 'empty' | 'dry' | 'growing' | 'ripe';

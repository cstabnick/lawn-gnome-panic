// Pebblewick (roadmap docs/roadmaps/gta-outskirts-town.md, lore docs/lore/entries/apocrypha/pebblewick.md): a minor
// adobe town on the far eastern edge of the Dust Flats, where the east-outer highway runs out towards the fence and the
// Speedway. Its gnomes farm dry plots watered by the Weeping Line, a buried Tall One tube that weeps every few spans.
//
// This file is the town's layout as plain data, in world coordinates: no three.js, no DOM. The level document
// (data/levels/dust-flats.level.json) holds what the rest of the world must know about: the reserve that keeps
// scenery, settlements and terrain relief out (reserve/pebblewick), the two streets (street/pebblewick-main and
// street/pebblewick-cross, real roads with traffic), the quest givers and the townsgnomes' walk points.
//
// Layout (north is -z):
//   east-outer highway ───(650,20) junction──────────────────────────
//        welcome sign (636,36)   │ Main Street x=655, z 20..190
//   workshop + Dew pump  (640,60)│ bus shelter (664,48), clinic (666,62)
//   general store        (641,80)│ market square x 662..700, z 72..112, wishing well (681,92)
//   diner                (641,97)│
//   Weeping Lane (cross street) z=125, x 600..712 ─────── hub (655,125)
//   post office         (644,140)│ town hall (667,141)
//   houses              (643,153+)│ the Green x 672..706, z 150..188, founder statue (689,168)
//   dry plots x 588..632, z 146..196 (west)          water tower (720,176), hen pen (716,158)
import type { TimeLabel } from '../atmosphere';

export const TOWN = {
  name: 'Pebblewick',
  /** "Pop. 31" on the welcome sign; 32 once the player has been. */
  population: 31,
  centre: { x: 655, z: 105 },
  /** The town's ground (the reserve marker): entering it is "arriving in Pebblewick". */
  rect: { minX: 580, maxX: 730, minZ: 10, maxZ: 200 },
  /** Where the east-outer highway meets Main Street (a road-graph node). */
  junction: { x: 650, z: 20 },
  /** Centre of Main Street x and of Weeping Lane z. */
  mainX: 655,
  crossZ: 125,
  /** The market square (open sand, no paving) and its wishing well. */
  square: { minX: 662, maxX: 700, minZ: 72, maxZ: 112 },
  /** The Green (park). */
  green: { minX: 672, maxX: 706, minZ: 150, maxZ: 188 },
  /** Map badge and trainer teleport spot: open ground on the square, west of the well. */
  blip: { x: 674, z: 100 },
  /** The Pebblewick Hopper's stop: where the player stands to ride, and where an arriving rider is put. */
  busStop: { x: 661, z: 48, arriveX: 660, arriveZ: 53, arriveYaw: Math.PI },
  /** The Old Chrome Combine, half-buried in the dunes east of town (easter egg, side quest 'sq-hum-at-three'). */
  combine: { x: 850, z: 150, yaw: 0.6 },
} as const;

/** True when (x, z) is inside Pebblewick's ground. */
export function inTown(x: number, z: number): boolean {
  const r = TOWN.rect;
  return x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ;
}

/**
 * The walking lanes: open ground no solid piece stands in. Townsfolk walk along these (Main Street and Weeping Lane,
 * road and verges) and cross between them at the hub. Any straight segment inside one lane is clear.
 */
export const LANES = {
  main: { minX: 647.5, maxX: 662.5, minZ: 45, maxZ: 190 },
  cross: { minX: 600, maxX: 712, minZ: 118.5, maxZ: 131.5 },
  hub: { x: 655, z: 125 },
} as const;

/**
 * One placed piece of the town. `prefab` is a @lawn/prefabs id. Size it with EITHER `scale` (new Pebblewick prefabs
 * and the GTA houses are modelled life-size in metres: scale 1) OR `size` (the longest side of the built prefab, in
 * metres, for hand-sized prefabs: scale = size / longest side of buildPrefab(prefab)'s bounding box).
 * `yaw`: rotation.y; a prefab's front is its local +z, so yaw PI/2 faces +x (east), -PI/2 faces -x (west), 0 faces +z
 * (south), PI faces -z (north). `solid`: a box collider of the rotated footprint. `sink`: metres pushed into the ground.
 */
export interface TownPiece {
  id: string;
  prefab: string;
  x: number;
  z: number;
  yaw: number;
  scale?: number;
  size?: number;
  solid: boolean;
  tint?: string | number;
  trim?: string | number;
  sink?: number;
  /** 'landmark' pieces are seen from far (cull class 'landmark'); everything else is culled as a building cell. */
  landmark?: boolean;
}

const E = Math.PI / 2; // faces east (+x)
const W = -Math.PI / 2; // faces west (-x)
const S = 0; // faces south (+z)
const N = Math.PI; // faces north (-z)

/** Adobe wall colours from the Dust Flats theme (regionThemes.json), varied per house. */
const WALLS = ['clay', 0xd8b080, 0xe0c49a, 0xc98f5e] as const;

let houseN = 0;
function house(x: number, z: number, yaw: number, hut = false): TownPiece {
  const n = houseN++;
  return hut
    ? { id: `house-${n}`, prefab: 'adobe-hut', x, z, yaw, size: 6, solid: true, tint: WALLS[n % WALLS.length] }
    : { id: `house-${n}`, prefab: 'adobe-house', x, z, yaw, scale: 1, solid: true, tint: WALLS[n % WALLS.length] };
}

/** Every static piece of Pebblewick (fences come from FENCE_RUNS). */
export const TOWN_PIECES: readonly TownPiece[] = [
  // ---- Main Street, west side (fronts face east onto the street) ----
  { id: 'workshop', prefab: 'pebblewick-workshop', x: 640, z: 60, yaw: E, scale: 1, solid: true },
  { id: 'dew-pump', prefab: 'gta-dew-pump', x: 646, z: 51.5, yaw: E, size: 2.2, solid: true, sink: 0.15 }, // its concrete island sits just under the sand (no z-fight)
  { id: 'fuel-drum-1', prefab: 'fuel-drum', x: 637, z: 51.5, yaw: 0, size: 1.2, solid: true },
  { id: 'fuel-drum-2', prefab: 'fuel-drum', x: 638.6, z: 51.2, yaw: 0.5, size: 1.2, solid: true },
  { id: 'general-store', prefab: 'pebblewick-general-store', x: 641.5, z: 80, yaw: E, scale: 1, solid: true },
  { id: 'store-crate-1', prefab: 'crate', x: 646, z: 76.5, yaw: 0.2, size: 1, solid: true },
  { id: 'store-crate-2', prefab: 'crate', x: 646, z: 83.5, yaw: -0.3, size: 1, solid: true },
  { id: 'diner', prefab: 'pebblewick-diner', x: 641.5, z: 97, yaw: E, scale: 1, solid: true },
  { id: 'diner-table', prefab: 'picnic-table', x: 641, z: 104.5, yaw: S, size: 2.4, solid: true },
  house(643, 111, E),
  { id: 'post-office', prefab: 'pebblewick-post-office', x: 644.5, z: 140, yaw: E, scale: 1, solid: true },
  { id: 'post-mailbox', prefab: 'mailbox', x: 646.5, z: 143.6, yaw: E, size: 1.3, solid: false },
  house(643, 153, E),
  house(644, 166, E, true),
  house(643, 180, E),
  // ---- Main Street, east side (fronts face west) ----
  { id: 'bus-shelter', prefab: 'pebblewick-bus-shelter', x: 664, z: 48, yaw: W, scale: 1, solid: true },
  { id: 'clinic', prefab: 'pebblewick-clinic', x: 666, z: 62, yaw: W, scale: 1, solid: true },
  { id: 'town-hall', prefab: 'pebblewick-town-hall', x: 667, z: 141, yaw: W, scale: 1, solid: true },
  // ---- Street lamps along Main Street and round the square ----
  { id: 'lamp-1', prefab: 'street-lamp', x: 646.5, z: 72, yaw: E, size: 4.5, solid: false },
  { id: 'lamp-2', prefab: 'street-lamp', x: 646.5, z: 134.5, yaw: E, size: 4.5, solid: false },
  { id: 'lamp-3', prefab: 'street-lamp', x: 646.5, z: 188, yaw: E, size: 4.5, solid: false },
  { id: 'lamp-4', prefab: 'street-lamp', x: 663.5, z: 54, yaw: W, size: 4.5, solid: false },
  { id: 'lamp-5', prefab: 'street-lamp', x: 663.5, z: 132.5, yaw: W, size: 4.5, solid: false },
  { id: 'lamp-6', prefab: 'street-lamp', x: 663.5, z: 188, yaw: W, size: 4.5, solid: false },
  { id: 'lamp-7', prefab: 'street-lamp', x: 664, z: 74, yaw: W, size: 4.5, solid: false },
  { id: 'lamp-8', prefab: 'street-lamp', x: 698, z: 74, yaw: W, size: 4.5, solid: false },
  { id: 'lamp-9', prefab: 'street-lamp', x: 664, z: 110, yaw: W, size: 4.5, solid: false },
  { id: 'lamp-10', prefab: 'street-lamp', x: 698, z: 110, yaw: W, size: 4.5, solid: false },
  { id: 'signpost', prefab: 'signpost', x: 647, z: 132, yaw: E, size: 2.2, solid: false },
  // ---- The market square ----
  { id: 'wishing-well', prefab: 'village-well', x: 681, z: 92, yaw: 0, size: 3, solid: true },
  { id: 'stall-1', prefab: 'market-stall', x: 670, z: 82, yaw: E, size: 4, solid: true },
  { id: 'stall-2', prefab: 'market-stall', x: 670, z: 102, yaw: E, size: 4, solid: true },
  { id: 'stall-3', prefab: 'market-stall', x: 692, z: 82, yaw: W, size: 4, solid: true },
  { id: 'stall-4', prefab: 'market-stall', x: 692, z: 102, yaw: W, size: 4, solid: true },
  { id: 'square-bench-1', prefab: 'bench', x: 681, z: 77, yaw: S, size: 2.2, solid: false },
  { id: 'square-bench-2', prefab: 'bench', x: 681, z: 107, yaw: N, size: 2.2, solid: false },
  { id: 'notice-board', prefab: 'notice-board', x: 665, z: 116.5, yaw: W, size: 2.4, solid: true },
  // ---- Weeping Lane (the cross street), north side faces south, south side faces north ----
  house(605, 113, S),
  house(620, 113, S, true),
  house(712, 113, S),
  house(605, 137, N),
  house(620, 137, N),
  house(695, 137, N, true),
  house(712, 137, N),
  { id: 'windmill', prefab: 'gta-windmill', x: 590, z: 108, yaw: 0.4, size: 12, solid: true, landmark: true },
  // ---- The Green ----
  { id: 'founder-statue', prefab: 'gnome-statue', x: 689, z: 168, yaw: W, size: 3.5, solid: true },
  { id: 'green-bench-1', prefab: 'bench', x: 680, z: 160, yaw: E, size: 2.2, solid: false },
  { id: 'green-bench-2', prefab: 'bench', x: 680, z: 176, yaw: E, size: 2.2, solid: false },
  { id: 'green-bench-3', prefab: 'bench', x: 698, z: 160, yaw: W, size: 2.2, solid: false },
  { id: 'green-palm-1', prefab: 'palm-tree', x: 676, z: 152, yaw: 0.3, size: 7, solid: false },
  { id: 'green-palm-2', prefab: 'palm-tree', x: 702, z: 152, yaw: 1.1, size: 7, solid: false },
  { id: 'green-palm-3', prefab: 'palm-tree', x: 676, z: 186, yaw: 2.0, size: 7, solid: false },
  { id: 'green-palm-4', prefab: 'palm-tree', x: 702, z: 186, yaw: 2.7, size: 7, solid: false },
  { id: 'green-bush-1', prefab: 'flowering-bush', x: 689, z: 156, yaw: 0, size: 1.6, solid: false },
  { id: 'green-bush-2', prefab: 'flowering-bush', x: 689, z: 180, yaw: 0, size: 1.6, solid: false },
  { id: 'green-table', prefab: 'picnic-table', x: 698, z: 178, yaw: S, size: 2.4, solid: true },
  // ---- Water tower (the landmark) and the hen pen ----
  { id: 'water-tower', prefab: 'pebblewick-water-tower', x: 720, z: 176, yaw: W, scale: 1, solid: true, landmark: true },
  // ---- Farmland edge: the dry plots on the Weeping Line, west of town ----
  ...[595, 609, 623].flatMap((x) => [152, 162, 172, 182, 192].map((z): TownPiece => (
    { id: `plot-${x}-${z}`, prefab: 'pebblewick-dry-plot', x, z, yaw: S, scale: 1, solid: false }
  ))),
  { id: 'scarecrow', prefab: 'scarecrow', x: 616, z: 177, yaw: 0.3, size: 2.5, solid: false },
  { id: 'hay-bale-1', prefab: 'hay-bale', x: 630, z: 148, yaw: 0.2, size: 1.3, solid: true },
  { id: 'hay-bale-2', prefab: 'hay-bale', x: 631.6, z: 148.6, yaw: 1.0, size: 1.3, solid: true },
  { id: 'wheelbarrow', prefab: 'wheelbarrow', x: 603, z: 147, yaw: 0.8, size: 1.4, solid: false },
  // ---- The welcome sign at the junction (faces the highway) ----
  { id: 'welcome-sign', prefab: 'pebblewick-welcome-sign', x: 636, z: 36, yaw: N, scale: 1, solid: true },
  // ---- The Old Chrome Combine, half-buried in the dunes east of town ----
  { id: 'old-combine', prefab: 'combine-harvester', x: TOWN.combine.x, z: TOWN.combine.z, yaw: TOWN.combine.yaw, size: 9, solid: true, tint: 0xd9dee4, sink: 1.4 },
];

/**
 * Fence runs (wattle fence, the "farmland edge"): a piece every `step` metres from `from` to `to`, each lying along the
 * run. `gaps` are distances along the run (metres from `from`) left open for a gate, each 3 m wide.
 */
export interface FenceRun { id: string; prefab: string; from: [number, number]; to: [number, number]; step: number; gaps?: number[] }

export const FENCE_RUNS: readonly FenceRun[] = [
  { id: 'plots-west', prefab: 'wattle-fence', from: [586, 146], to: [586, 198], step: 3, gaps: [24] },
  { id: 'plots-south', prefab: 'wattle-fence', from: [586, 198], to: [632, 198], step: 3 },
  { id: 'pen-north', prefab: 'wattle-fence', from: [710, 152], to: [722, 152], step: 3 },
  { id: 'pen-south', prefab: 'wattle-fence', from: [710, 164], to: [722, 164], step: 3 },
  { id: 'pen-west', prefab: 'wattle-fence', from: [710, 152], to: [710, 164], step: 3, gaps: [4.5] },
  { id: 'pen-east', prefab: 'wattle-fence', from: [722, 152], to: [722, 164], step: 3 },
];

/** The hen pen's inside (npcs.ts keeps its hens in here). */
export const HEN_PEN = { minX: 711, maxX: 721, minZ: 153, maxZ: 163 } as const;

// ---- Counters: where a keeper stands to serve (facing the street) ----------------------------------------------
export type CounterId = 'store' | 'diner' | 'workshop';

export interface CounterDef {
  id: CounterId;
  /** Shop name (sheet title, prompt). */
  name: string;
  /** The NPC who serves here (npcs.ts id). The counter is open while this NPC is present at station 0. */
  keeper: TownNpcId;
  /** The keeper's spot. The player is served within COUNTER_REACH of it. */
  x: number;
  z: number;
  yaw: number;
}

export const COUNTER_REACH = 3;

export const COUNTERS: readonly CounterDef[] = [
  { id: 'store', name: "Twine's General", keeper: 'thistle', x: 648.5, z: 80, yaw: E },
  { id: 'diner', name: 'The Dry Spoon', keeper: 'marigold', x: 648.5, z: 97, yaw: E },
  { id: 'workshop', name: "Ratchet's Mower & Dew", keeper: 'burnet', x: 648, z: 58, yaw: E },
];

/** The workshop repairs the nearest vehicle within this many metres of this point (its forecourt). */
export const WORKSHOP_BAY = { x: 650, z: 60, radius: 12 } as const;

// ---- Interactive set pieces (sights.ts) ----------------------------------------------------------------------------
export const SIGHTS = {
  /** Toss an Acorn in the wishing well (prompt from the square side). */
  well: { x: 681, z: 92, reach: 3.4 },
  /** The town hall's bell rope, on its front step. */
  bell: { x: 662.3, z: 141, reach: 2.5 },
  /** The water tower's valve wheel, at the foot of a leg. */
  valve: { x: 715.5, z: 176, reach: 2.5 },
  /** The notice board, read from the street. */
  board: { x: 663.4, z: 116.5, reach: 2.5 },
  /** Knock on the Old Chrome Combine. */
  combine: { x: TOWN.combine.x - 5, z: TOWN.combine.z - 3, reach: 4 },
} as const;

// ---- Townsfolk (npcs.ts) ---------------------------------------------------------------------------------------------
export type TownNpcId = 'yarrow' | 'marigold' | 'thistle' | 'burnet' | 'sorrel' | 'comfrey' | 'purslane' | 'mallow' | 'sedge';

/**
 * One place an NPC spends part of the day. `path`: points from the station to the nearest lane (the last point is
 * inside LANES.main or LANES.cross); empty when the station is already in a lane. `idle`: an anim row id (src/anim/).
 */
export interface Station { x: number; z: number; yaw: number; idle: string; path: [number, number][] }

/** Station index per time of day; -1 = indoors (hidden). */
export type Schedule = Record<TimeLabel, number>;

export interface TownNpcStations { id: TownNpcId; stations: Station[]; schedule: Schedule }

const st = (x: number, z: number, yaw: number, idle: string, path: [number, number][] = []): Station => ({ x, z, yaw, idle, path });

export const NPC_STATIONS: readonly TownNpcStations[] = [
  { id: 'yarrow', stations: [st(661.5, 141, W, 'hands-on-hips'), st(677, 94, E, 'take-notes', [[662, 94]]), st(686, 168, E, 'think', [[686, 150], [662, 150]])],
    schedule: { Dawn: -1, Morning: 0, Noon: 1, 'Golden Hour': 0, Dusk: 2, 'Neon Night': -1 } },
  { id: 'marigold', stations: [st(648.5, 97, E, 'stir-pot'), st(684, 156, E, 'sit-ground', [[662, 156]])],
    schedule: { Dawn: -1, Morning: 0, Noon: 0, 'Golden Hour': 0, Dusk: 0, 'Neon Night': 1 } },
  { id: 'thistle', stations: [st(648.5, 80, E, 'sweep')],
    schedule: { Dawn: 0, Morning: 0, Noon: 0, 'Golden Hour': 0, Dusk: -1, 'Neon Night': -1 } },
  { id: 'burnet', stations: [st(648, 58, E, 'wrench-fix')],
    schedule: { Dawn: 0, Morning: 0, Noon: 0, 'Golden Hour': 0, Dusk: 0, 'Neon Night': -1 } },
  { id: 'sorrel', stations: [st(648.5, 140, E, 'read'), st(661, 52, W, 'phone-call')],
    schedule: { Dawn: -1, Morning: 0, Noon: 0, 'Golden Hour': 1, Dusk: -1, 'Neon Night': -1 } },
  { id: 'comfrey', stations: [st(661.5, 62, W, 'cross-arms'), st(690, 175, W, 'look-around', [[690, 188.5], [662, 188.5]])],
    schedule: { Dawn: -1, Morning: 0, Noon: 0, 'Golden Hour': 1, Dusk: 0, 'Neon Night': 0 } },
  { id: 'purslane', stations: [st(612, 148, N, 'rake', [[612, 131]]), st(648.5, 103, E, 'lean-back')],
    schedule: { Dawn: 0, Morning: 0, Noon: 0, 'Golden Hour': 0, Dusk: 1, 'Neon Night': -1 } },
  { id: 'mallow', stations: [st(713, 171, W, 'look-around', [[706, 168], [704, 131]]), st(684, 97, W, 'juggle', [[662, 97]])],
    schedule: { Dawn: -1, Morning: 0, Noon: 1, 'Golden Hour': 0, Dusk: 0, 'Neon Night': 0 } },
  { id: 'sedge', stations: [st(686, 108.5, N, 'busk-guitar', [[686, 113], [662, 113]])],
    schedule: { Dawn: -1, Morning: -1, Noon: -1, 'Golden Hour': 0, Dusk: 0, 'Neon Night': 0 } },
];

/** Achievement ids (packages/achievements/src/catalog.ts). */
export const TOWN_ACHIEVEMENTS = {
  visit: 'gta-pop-32',
  regular: 'gta-pebblewick-regular',
  weepingLine: 'gta-weeping-line',
  humAtThree: 'gta-hum-at-three',
  knock: 'gta-three-am-knock',
} as const;

/** Side quest ids (quests/outskirtsQuests.ts). */
export const TOWN_QUESTS = { weepingLine: 'sq-weeping-line', humAtThree: 'sq-hum-at-three' } as const;

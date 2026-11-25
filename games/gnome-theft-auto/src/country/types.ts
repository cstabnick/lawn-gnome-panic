// The countryside (E16, docs/roadmaps/gta-batch-3/E16/roadmap.md): Thorne Even-Estates' three building sites, Trellisdown
// Vineyard and Brassknock Manor, the hunter camps in the empty country, deer, and the ids the farm (src/farm/) shares.
// Pure data and types only: no three.js, no DOM. World coordinates: +x east, +z south (north is -z), metres; yaw 0 faces
// +z, a facing vector is (sin yaw, cos yaw); a three.js object with rotation.y = yaw faces that way.
// Every place lies inside its E01 site (sites.ts): construction-1 x -320..-270, z -145..-95; construction-2 x 170..220,
// z 300..350; construction-3 x 1020..1080, z 220..280 (all flat); vineyard x -1290..-990, z -280..-60 (natural: a hill,
// ~14 m at its middle); mansion x -1210..-1090, z -10..90 (flat, ~1.6 m). country.test.ts checks it.
import type { Blip } from '../types';

export const N = Math.PI, E = Math.PI / 2, W = -Math.PI / 2;

export interface Spot { x: number; z: number; yaw: number }
export interface Rect { minX: number; maxX: number; minZ: number; maxZ: number }
/** A footprint: centre, width along world x, depth along world z, the way its front faces. */
export interface Footprint { x: number; z: number; w: number; d: number; yaw: number }

// ---- Thorne Even-Estates (L12): three Levelright Construction sites -----------------------------------------------

export type EstateSiteId = 'construction-1' | 'construction-2' | 'construction-3';

/**
 * One building site. Everything is placed from one local plan (see `estateLocal`) turned by `turn` about the centre,
 * so the gate always faces the nearest road. Show-homes are identical on purpose (Even-Estates: same height, colour and
 * number of windows). Zones never overlap; the gate lane (from the gate to the centre, 8 m wide) is kept clear.
 */
export interface EstateSite {
  id: EstateSiteId;
  /** Shown on its sign: "Thorne Even-Estates: Plot 1". */
  name: string;
  /** Centre and half size (a square site). */
  x: number; z: number; half: number;
  /** Radians: the local plan is turned by this (0: gate on the west side; PI: gate on the east side). */
  turn: number;
  /** The gap in the hoarding (8 m wide); yaw faces out of the site. */
  gate: Spot;
  /** The hoarding rectangle (1 m inside the site edge). */
  hoarding: Rect;
  /** The finished, identical, empty show-homes (7 x 7 m each); yaw = the way the front door faces (into the site). */
  homes: readonly Footprint[];
  /** The half-built house (8 x 8 m) with scaffolding round it. */
  halfBuilt: Footprint;
  /** The crane's base (a 3 x 3 m footing). */
  crane: Spot;
  /** Materials yard: mixer, pallets, bricks, girders (10 x 8 m). */
  yard: Footprint;
  /** The site caravan (a 6 m long caravan turned to lie along world z: w 3, d 6). construction-1's is Chard Levelright's home. */
  caravan: Footprint;
  /** Three open spots (4 m radius free) for the story vignettes (issue B2). */
  story: readonly Spot[];
  /** Where the hard-hat crew walk their loop (yard -> half-built house -> crane -> yard). */
  crewLoop: readonly Spot[];
  /** True for the site with the extra (night-shift quest) hook and Chard's caravan. */
  hq: boolean;
}

const ESTATE_DEFS: readonly { id: EstateSiteId; x: number; z: number; half: number; turn: number; hq: boolean }[] = [
  { id: 'construction-1', x: -295, z: -120, half: 25, turn: 0, hq: true },
  { id: 'construction-2', x: 195, z: 325, half: 25, turn: Math.PI, hq: false },
  { id: 'construction-3', x: 1050, z: 250, half: 30, turn: 0, hq: false },
];

/** Local (lx, lz) of a site to world (x, z). Local -x is the gate side. */
export function estateLocal(s: { x: number; z: number; turn: number }, lx: number, lz: number): { x: number; z: number } {
  const c = Math.cos(s.turn), sn = Math.sin(s.turn);
  const r = (v: number): number => Math.round(v * 100) / 100;
  return { x: r(s.x + lx * c + lz * sn), z: r(s.z - lx * sn + lz * c) };
}

function buildEstate(d: (typeof ESTATE_DEFS)[number], i: number): EstateSite {
  const H = d.half;
  const at = (lx: number, lz: number, yaw = 0): Spot => ({ ...estateLocal(d, lx, lz), yaw: yaw + d.turn });
  const fp = (lx: number, lz: number, w: number, dd: number, yaw = 0): Footprint => {
    const p = at(lx, lz, yaw);
    // A quarter turn swaps width and depth in world terms; the plans only use 0 and PI.
    return { x: p.x, z: p.z, w, d: dd, yaw: p.yaw };
  };
  const homeXs = H >= 30 ? [-18, -8, 2, 12] : [-13, -3, 7];
  return {
    id: d.id,
    name: `Thorne Even-Estates: Plot ${i + 1}`,
    x: d.x, z: d.z, half: H, turn: d.turn,
    gate: at(-H, 0, W),
    hoarding: { minX: d.x - H + 1, maxX: d.x + H - 1, minZ: d.z - H + 1, maxZ: d.z + H - 1 },
    homes: homeXs.map((lx) => fp(lx, -H + 6, 7, 7, 0)),
    halfBuilt: fp(H - 12, H - 12, 8, 8, N),
    crane: at(H - 5, -2),
    yard: fp(-2, H - 9, 10, 8),
    // Turned a quarter: 3 m along world x, 6 m along world z.
    caravan: fp(-H + 8, H - 7, 3, 6, E),
    story: [at(-H + 7, -9), at(2, 6), at(H - 12, -4)],
    crewLoop: [at(-2, H - 13), at(H - 12, H - 18), at(H - 8, -2), at(-4, 8)],
    hq: d.hq,
  };
}

export const EVEN_ESTATES: readonly EstateSite[] = ESTATE_DEFS.map(buildEstate);

// ---- Trellisdown Vineyard and Brassknock Manor (L37) ----------------------------------------------------------------

/** The vineyard on its hill. `vineyard-lane` runs east-west at z ~-31 between the vineyard and the manor. */
export const VINEYARD = {
  site: { minX: -1290, maxX: -990, minZ: -280, maxZ: -60 } as Rect,
  /** The gate arch on the south edge, facing the lane; Chicory's lodge is just inside it. */
  gate: { x: -1140, z: -61, yaw: 0 } as Spot,
  /** Chicory Snips' gardener's lodge (8 x 6 m), door facing south. */
  lodge: { x: -1172, z: -78, w: 8, d: 6, yaw: 0 } as Footprint,
  /** The press-house (12 x 9 m), door facing south; the Countess's first vine grows by its west wall. */
  pressHouse: { x: -1105, z: -95, w: 12, d: 9, yaw: 0 } as Footprint,
  /** The oldest vine, never harvested: by the press-house's west wall. */
  firstVine: { x: -1113, z: -95, yaw: 0 } as Spot,
  /** Vine rows run east-west inside this rectangle, one every `rowStep` m from minZ, split by the north-south path. */
  rows: { minX: -1280, maxX: -1000, minZ: -265, maxZ: -112 } as Rect,
  rowStep: 5,
  /** The central path up the hill (no vines): x -1146..-1134. */
  path: { minX: -1146, maxX: -1134, minZ: -270, maxZ: -62 } as Rect,
  /** The row Chicory keeps crooked on purpose (lore): the row at this z, east of the path. */
  crookedRowZ: -205,
  /** Three spots for vineyard vignettes (4 m free; between row ends and the path, or by the lodge). */
  story: [
    { x: -1128, z: -118, yaw: 0 }, { x: -1152, z: -240, yaw: N }, { x: -1190, z: -96, yaw: 0 },
  ] as readonly Spot[],
  /** Chicory's working loop: lodge door, down a row with his shears, the press-house, back. */
  chicoryLoop: [
    { x: -1172, z: -73.5, yaw: 0 }, { x: -1140, z: -100, yaw: N }, { x: -1140, z: -160, yaw: N },
    { x: -1120, z: -160, yaw: E }, { x: -1105, z: -89, yaw: 0 },
  ] as readonly Spot[],
} as const;

export const MANOR = {
  site: { minX: -1210, maxX: -1090, minZ: -10, maxZ: 90 } as Rect,
  /** The gate on the north wall, facing the lane; the gravel drive runs south from it to the forecourt. */
  gate: { x: -1150, z: -9, yaw: N } as Spot,
  /** Forecourt with the fountain, between the gate and the house. */
  fountain: { x: -1150, z: 6, yaw: 0 } as Spot,
  /** The house: long, pale, terraced, seven chimneys, front (and the terrace over the vines) facing north. */
  house: { x: -1150, z: 31, w: 46, d: 18, yaw: N } as Footprint,
  /** Walkable spot 1.5 m outside the front door (the brass knocker); yaw faces out. Enter Brassknock Manor here. */
  door: { x: -1150, z: 20.5, yaw: N } as Spot,
  /** The raised front terrace: x -1172..-1128, z 18..22 (the house front is at z 22). */
  terrace: { minX: -1172, maxX: -1128, minZ: 18, maxZ: 22 } as Rect,
  /** Where the Countess stands on the terrace looking over the vines. */
  countess: { x: -1138, z: 19.5, yaw: N } as Spot,
  /** Formal gardens behind the house (euro box hedges, topiary, the gardener). */
  gardens: { minX: -1200, maxX: -1100, minZ: 46, maxZ: 86 } as Rect,
  /** Three spots for manor vignettes (4 m free). */
  story: [
    { x: -1185, z: 62, yaw: 0 }, { x: -1150, z: 70, yaw: 0 }, { x: -1112, z: 58, yaw: 0 },
  ] as readonly Spot[],
  /** E05 interior id for the house (hall + the ledger room). */
  interior: 'brassknock-manor',
} as const;

// ---- Hunter camps (L72): data in camps.ts (CAMPS) ------------------------------------------------------------------

export type CampKind = 'shack' | 'tent' | 'camp' | 'stand' | 'blind' | 'drying';

/** What a camp leaves for a passer-by (taken with E; refills after CAMP_LOOT_REFILL_S of wall-clock time). */
export interface CampLoot {
  /** Acorns found (a tin, a jar). */
  acorns?: number;
  /** An inventory item id (inventory.ts ITEMS, e.g. 'crab-apple', 'seed-cake') and how many. */
  item?: string;
  n?: number;
  /** The E prompt verb phrase: "Check the tin", "Look in the pack". */
  prompt: string;
}

export interface CampDef {
  id: string;
  /** Shown in the toast and the camps counter: "Cutback Hide", "Old Pell's Shack". */
  name: string;
  kind: CampKind;
  x: number; z: number; yaw: number;
  loot: CampLoot;
  /** A hunter asleep by the fire (camp, tent, shack only). */
  sleeper?: boolean;
}

export const CAMP_LOOT_REFILL_S = 30 * 60;
/** At most this many camps (perf: one static batch, a fire light only within FIRE_LIGHT_RANGE). */
export const MAX_CAMPS = 30;
export const FIRE_LIGHT_RANGE = 60;

// ---- Deer and goats (L39) ------------------------------------------------------------------------------------------

/** One herd. Hinds and fawns graze together, the stag stands a little apart. countryside.ts spawns them. */
export interface HerdDef {
  id: string;
  kind: 'deer' | 'goat';
  x: number; z: number;
  /** Members (a deer herd: 1 stag + hinds + fawns; at most 6). */
  count: number;
  leash: number;
}

export const MAX_HERD = 6;

// ---- Achievements, quests, sounds, save -----------------------------------------------------------------------------

/** packages/achievements/src/catalog.ts ids (each with a wearable reward). */
export const COUNTRY_ACH = {
  /** Harvest the first crop at Windfall Croft. Reward hand 'croft-trowel'. */
  firstSprout: 'gta-first-sprout',
  /** Shake acorns from your own grown oak. Reward head 'croft-straw-hat'. */
  oakPatience: 'gta-oak-patience',
  /** Stand at Brassknock Manor's front door. Reward neck 'brass-knocker-pendant'. */
  mansion: 'gta-mansion-on-the-hill',
  /** Come within 25 m of 12 different deer (target 12). Reward head 'antler-headband'. */
  deerMe: 'gta-deer-me',
  /** Visit 10 different hunter camps (target 10). Reward back 'camp-kettle-pack'. */
  campCrasher: 'gta-camp-crasher',
  /** Walk through the gate of all three Even-Estates sites (target 3). Reward hand 'spirit-level'. */
  levelBest: 'gta-level-best',
} as const;

export const COUNTRY_QUESTS = {
  nightShift: 'sq-levelright-night-shift',
  croftDeed: 'sq-windfall-croft-deed',
} as const;

/** Sound ids (country/sounds.ts registers them with sound/bus.ts registerSound; play with playAt(id, {x, z})). */
export const COUNTRY_SOUNDS = [
  'country-campfire', 'country-site-hammer', 'country-site-mixer', 'country-crane-whir', 'country-vine-snip',
  'country-deer-bark', 'country-goat-bleat', 'country-manor-knocker', 'country-snore',
  'farm-plant', 'farm-water', 'farm-harvest', 'farm-sell', 'farm-oak-shake',
] as const;
export type CountrySoundId = (typeof COUNTRY_SOUNDS)[number];

/** Visits: estate sites walked into, camps visited, deer seen (ids), the manor door. saveIO.ts GTA_SAVE_KEYS. */
export const COUNTRY_SAVE_KEY = 'gta-country-v1';

// ---- Runtime contract ----------------------------------------------------------------------------------------------

/** One living part (index.ts installCountryside runs them in order). Every hook is optional. */
export interface CountryPart {
  /** Every frame, after the player and vehicles moved. t = seconds since install. */
  update?(dt: number, t: number): void;
  blips?(): Blip[];
  /** On foot at (x, z): the E prompt this part offers there, else null. */
  prompt?(x: number, z: number): string | null;
  /** E pressed at (x, z): true when this part handled it. */
  interact?(x: number, z: number): boolean;
}

/** What app.ts calls. */
export interface Countryside {
  update(dt: number): void;
  blips(): Blip[];
  prompt(x: number, z: number): string | null;
  interact(x: number, z: number): boolean;
}

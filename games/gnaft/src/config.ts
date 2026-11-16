// Shared types, tuning and data tables for Gnaft.
// Every system imports from here. Change numbers here, not in gameplay code.
import type * as THREE from 'three';

// =====================================================================
// Copied-model contract (gnome.ts, mowerModels.ts come from sample-3d)
// =====================================================================

export const COLORS = {
  gnomeHat: 0xd93636,
  gnomeShirt: 0x2f64c9,
  mowerDark: 0x222222,
  mowerGreen: 0x3fa34d,
  mowerYellow: 0xf2c230,
  mowerRed: 0xd8342c,
  reelWood: 0x9c6b3c,
  reelMetal: 0x8a9399,
  combineBody: 0x2e8b3a,
  combineAccent: 0xf2c230,
  combineGlass: 0x9fd8ff,
  water: 0x2f8fc4,
  waterDeep: 0x1b5f8f,
  sky: 0x7fc8f0,
  grass: 0x4caf50,
  grassTall: 0x2e7d32,
  dirt: 0x6d4c2e,
  sand: 0xe8d29a,
} as const;

/** How a gnome looks. */
export interface GnomeLook {
  hat: number;
  shirt: number;
  pants: number;
  skin: number;
  boots: number;
  beard: number | null;
  hair: { color: number; style: 'pigtails' } | null;
  freckles: boolean;
  dress: boolean;
  glasses: boolean;
}

export const CHARACTERS = {
  gnorman: {
    look: { hat: 0xd93636, shirt: 0x2f64c9, pants: 0x6b4a2e, skin: 0xf1c27d, boots: 0x222222, beard: 0xf4f4f4, hair: null, freckles: false, dress: false, glasses: false } as GnomeLook,
  },
};

/** The player's body. Feet at position (y = surface height). facing = rotation.y, 0 faces +z. */
export interface PlayerState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  facing: number;
  grounded: boolean;
  /** Jumps since last landing (1 = normal jump). */
  jumpsUsed: number;
  /** True while the gnome is in the water (player.ts sets it). */
  swimming: boolean;
}

export interface GnomeModel {
  object: THREE.Group;
  update(p: PlayerState, dt: number): void;
  setDead(dead: boolean): void;
}

export type MowerTier = 'reel' | 'green' | 'yellow' | 'red' | 'combine';

export interface MowerModel {
  setNight(night01: number): void;
  group: THREE.Group;           // built facing +z, base at y = 0
  setFlash(on: boolean): void;
  animate(dt: number, speed: number): void;
}

// =====================================================================
// Tuning
// =====================================================================

export const TUNING = {
  moveSpeed: 5,          // m/s on foot (gnome.ts reads this for the walk cycle)
  jumpSpeed: 6,
  gravity: 20,
  mouseSensitivity: 0.0025,
  cameraDistance: 7,
  cameraHeight: 3,
  sprintMult: 1.6,      // speed multiplier while holding KEYS.sprint
  zoomMin: 3.5,         // camera distance range for the mouse wheel
  zoomMax: 14,
} as const;

/** Raft grid: tile (i, j) has its centre at world (i * TILE_SIZE, RAFT_TOP, j * TILE_SIZE). */
export const TILE_SIZE = 2;
/** Height of the walkable grass/island surface. Water surface is y = 0. */
export const RAFT_TOP = 0.3;
/** Starting tiles: a little 2 x 2 patch. */
export const START_TILES: readonly [number, number][] = [[0, 0], [1, 0], [0, 1], [1, 1]];

export const GRASS = {
  growSeconds: 40,       // growth 0 -> 1
  cutMin: 0.5,           // growth needed before a tile can be cut
  cutResetTo: 0.05,      // growth after cutting
  baseYield: 2,          // grass from cutting a fully grown tile by hand
  turfStartGrowth: 0.3,
  seededStartGrowth: 0,
} as const;

export const FISHING = {
  minThrow: 4,           // metres
  maxThrow: 20,
  chargeSeconds: 1.2,    // hold time for a full throw
  hookRadius: 1.6,       // debris this close to the hook gets snagged
  reelSpeed: 8,          // m/s while holding the mouse button
  collectDistance: 1.8,  // hook this close to the player = items collected
  debrisMax: 14,         // live debris at once
  debrisSpawnSeconds: 1.6,
  spawnDistance: 45,     // debris spawns this far upstream
  spawnSpread: 30,       // sideways spread at spawn
  despawnDistance: 60,
  current: { x: -1.2, z: 0.3 }, // water flow (m/s) even when the raft is still
} as const;

/** Swimming. In the water the gnome's feet sit at feetY (head above the surface) and drift with the water. */
export const SWIM = {
  speed: 2.8,            // m/s
  feetY: -0.55,          // feet height while swimming (water surface is y = 0)
  bob: 0.06,             // bob amplitude (m)
  driftMult: 0.3,        // swimmers drift at this share of the water flow past the raft, so they can swim back
  climbReach: 0.5,       // swimming into walkable ground within this many metres climbs out
  rescueDistance: 45,    // swim further than this from the raft centre and you are hauled back aboard
} as const;

/** Grabbing floating junk by hand (E) when it is close, without the hook. */
export const GRAB = { reach: 2.4 } as const;

export const SEA = {
  driftSpeed: 1.5,       // m/s with no course
  sailSpeed: 12,         // m/s while following a course
  startHeading: Math.PI / 2,
  dockGap: -0.4,         // dock when the nearest raft tile overlaps the island shore by this much (rules.islandGap)
  fogNear: 60,
  fogFar: 260,
  cameraFar: 3000,
} as const;

export const TELESCOPE = {
  fov: 12,
  normalFov: 60,
  aimToleranceDeg: 4,    // island bearing must be within this of the view direction
  spotSeconds: 1.0,      // hold aim this long to spot
  range: 2000,
} as const;

// =====================================================================
// Items, tools, recipes
// =====================================================================

export type ItemId = 'grass' | 'dirt' | 'seed' | 'plank' | 'scrap' | 'fuel' | 'parts' | 'duck' | 'statue';
export const ITEM_IDS: readonly ItemId[] = ['grass', 'dirt', 'seed', 'plank', 'scrap', 'fuel', 'parts', 'duck', 'statue'];

export const ITEMS: Record<ItemId, { name: string; color: number; icon: string }> = {
  grass: { name: 'Grass', color: 0x4caf50, icon: '🌿' },
  dirt: { name: 'Dirt', color: 0x6d4c2e, icon: '🟫' },
  seed: { name: 'Grass Seed', color: 0xf2d16b, icon: '🌱' },
  scrap: { name: 'Scrap Metal', color: 0x9aa4ab, icon: '🔩' },
  fuel: { name: 'Fuel', color: 0xd8342c, icon: '⛽' },
  parts: { name: 'Mower Parts', color: 0xf2c230, icon: '⚙️' },
  plank: { name: 'Plank', color: 0xb07a45, icon: '🪵' },
  duck: { name: 'Rubber Duck', color: 0xffd23f, icon: '🦆' },
  statue: { name: 'Garden Gnome', color: 0xd93636, icon: '🧙' },
};

export type ToolId = 'hands' | 'push' | 'gas' | 'riding';
export const TOOL_ORDER: readonly ToolId[] = ['hands', 'push', 'gas', 'riding'];

export interface ToolDef {
  name: string;
  /** World radius cut around the mower front while moving. 0 = hands: press E to cut the tile under you. */
  radius: number;
  yieldMult: number;
  speedMult: number;
  /** Fuel used per tile cut. With 0 fuel a gas tool cannot cut. */
  fuelPerCut: number;
  /** Model from mowerModels.ts, null for hands. */
  model: MowerTier | null;
  modelScale: number;
}

export const TOOLS: Record<ToolId, ToolDef> = {
  hands: { name: 'Hands', radius: 0, yieldMult: 1, speedMult: 1, fuelPerCut: 0, model: null, modelScale: 1 },
  push: { name: 'Push Mower', radius: 1.4, yieldMult: 1.5, speedMult: 0.9, fuelPerCut: 0, model: 'reel', modelScale: 0.8 },
  gas: { name: 'Gas Mower', radius: 2.2, yieldMult: 2, speedMult: 1, fuelPerCut: 0.1, model: 'green', modelScale: 0.8 },
  riding: { name: 'Riding Mower', radius: 3.4, yieldMult: 2.5, speedMult: 1.6, fuelPerCut: 0.15, model: 'red', modelScale: 1.3 },
};

export type RecipeId = 'telescope' | 'push' | 'gas' | 'riding';
export const RECIPE_ORDER: readonly RecipeId[] = ['telescope', 'push', 'gas', 'riding'];
export interface Recipe { name: string; desc: string; cost: Partial<Record<ItemId, number>> }
export const RECIPES: Record<RecipeId, Recipe> = {
  telescope: { name: 'Telescope', desc: 'Press T to look for islands. Press C while aiming at a spotted island to chart a course.', cost: { grass: 12, dirt: 3 } },
  push: { name: 'Push Mower', desc: 'Cuts grass as you walk. 1.5x yield.', cost: { scrap: 6, grass: 8 } },
  gas: { name: 'Gas Mower', desc: 'Wider cut, 2x yield. Burns fuel.', cost: { scrap: 8, fuel: 4 } },
  riding: { name: 'Riding Mower', desc: 'Huge cut, fast, 2.5x yield. Burns fuel.', cost: { parts: 3, scrap: 10, fuel: 6 } },
};

/**
 * Building. `on` says where a kind goes:
 * - 'water': a new raft tile on water next to the raft (turf, seeded)
 * - 'tile': a prop standing on an existing tile, one per tile (sprinkler, flamingo, duck, statue)
 * - 'floor' / 'ceiling': a plank floor or roof covering a tile cell (see Structure)
 * - 'edge': a plank wall on the edge between two cells (see Structure)
 */
export type TileKind = 'turf' | 'seeded';
export type PropKind = 'sprinkler' | 'flamingo' | 'duck' | 'statue';
export type StructKind = 'floor' | 'wall' | 'ceiling';
export type BuildKind = TileKind | PropKind | StructKind;
export type BuildPlace = 'water' | 'tile' | 'floor' | 'edge' | 'ceiling';
export const BUILD_ORDER: readonly BuildKind[] = ['turf', 'seeded', 'floor', 'wall', 'ceiling', 'sprinkler', 'flamingo', 'duck', 'statue'];
export const BUILD_COSTS: Record<BuildKind, { name: string; cost: Partial<Record<ItemId, number>>; on: BuildPlace }> = {
  turf: { name: 'Turf tile', cost: { grass: 4 }, on: 'water' },
  seeded: { name: 'Seeded dirt tile', cost: { dirt: 2, seed: 1 }, on: 'water' },
  floor: { name: 'Plank floor', cost: { plank: 2 }, on: 'floor' },
  wall: { name: 'Plank wall', cost: { plank: 3 }, on: 'edge' },
  ceiling: { name: 'Plank roof', cost: { plank: 2 }, on: 'ceiling' },
  sprinkler: { name: 'Sprinkler', cost: { scrap: 3, grass: 4 }, on: 'tile' },
  flamingo: { name: 'Lawn Flamingo', cost: { grass: 3, scrap: 1 }, on: 'tile' },
  duck: { name: 'Rubber Duck', cost: { duck: 1 }, on: 'tile' },
  statue: { name: 'Garden Gnome', cost: { statue: 1 }, on: 'tile' },
};
/** Deconstructing a shed piece (right click in build mode) refunds this share of its cost, rounded down. */
export const REFUND = 0.5;

/**
 * Shed pieces. Heights are above RAFT_TOP.
 * - floor at cell (i, j): a plank slab FLOOR_THICK thick on top of the tile; the gnome stands on it.
 * - wall at (i, j, dir): dir 'x' = the wall on the +x edge of cell (i, j), centre (i*T + T/2, j*T), running along z;
 *   dir 'z' = the wall on the +z edge, centre (i*T, j*T + T/2), running along x. WALL_HEIGHT tall, WALL_THICK thick.
 *   Every wall is stored by the cell on its -x / -z side, so the wall between (0,0) and (1,0) is {wall, 0, 0, 'x'}.
 * - ceiling at cell (i, j): a plank roof slab whose underside is at WALL_HEIGHT.
 */
export const SHED = { FLOOR_THICK: 0.12, WALL_HEIGHT: 2.4, WALL_THICK: 0.12, ROOF_THICK: 0.12 } as const;
export interface Structure { kind: StructKind; i: number; j: number; dir?: 'x' | 'z' }
/** A sprinkler doubles growth on tiles whose centre is within this radius of it. */
export const SPRINKLER = { radius: 3.2, growthMult: 2 } as const;

// =====================================================================
// Debris and islands
// =====================================================================

/** When a debris kind starts appearing. */
export type Unlock = 'start' | 'tiles3' | 'island1' | 'island2';
/**
 * bottle = a message in a bottle: no item, it reveals (spots) the nearest unspotted island.
 * fun = a fun piece of junk: gives FUN[fun].loot (item/amount are ignored).
 */
export interface DebrisDef { item: ItemId; amount: number; weight: number; unlock: Unlock; bottle?: boolean; fun?: FunId }

export type FunId = 'boot' | 'duck' | 'chest' | 'statue' | 'barrel' | 'beachball' | 'toilet';
export const FUN_IDS: readonly FunId[] = ['boot', 'duck', 'chest', 'statue', 'barrel', 'beachball', 'toilet'];
export const FUN: Record<FunId, { name: string; loot: Partial<Record<ItemId, number>>; msg: string; look: string }> = {
  boot: { name: 'Old Boot', loot: { seed: 1 }, msg: 'An old boot! A grass seed was stuck in the sole.', look: 'brown leather boot lying on its side' },
  duck: { name: 'Rubber Duck', loot: { duck: 1 }, msg: 'Quack! A rubber duck. Place it in build mode.', look: 'yellow rubber duck with an orange beak' },
  chest: { name: 'Treasure Chest', loot: { plank: 4, scrap: 2, seed: 2 }, msg: 'A treasure chest! Planks, scrap and seeds!', look: 'wooden chest with gold bands and a gold lock, sparkling' },
  statue: { name: 'Garden Gnome', loot: { statue: 1 }, msg: 'A long-lost cousin! A garden gnome statue. Place it in build mode.', look: 'small garden gnome statue with a red pointed hat and white beard' },
  barrel: { name: 'Barrel', loot: { plank: 3, dirt: 1 }, msg: 'A barrel! You smash it into planks. Some dirt fell out.', look: 'wooden barrel with dark metal hoops, lying on its side' },
  beachball: { name: 'Beach Ball', loot: { seed: 2 }, msg: 'A beach ball stuffed with grass seed. Weird, but thanks!', look: 'striped beach ball (red, white, blue, yellow segments), bobbing high' },
  toilet: { name: 'Toilet Seat', loot: { scrap: 1, plank: 1 }, msg: 'A toilet seat. You do not ask questions. Scrap and a plank.', look: 'white oval toilet seat ring with an upright lid' },
};

export const DEBRIS: readonly DebrisDef[] = [
  { item: 'grass', amount: 2, weight: 6, unlock: 'start' },
  { item: 'plank', amount: 1, weight: 4, unlock: 'start' },
  { item: 'grass', amount: 0, weight: 0.5, unlock: 'start', fun: 'boot' },
  { item: 'grass', amount: 0, weight: 0.5, unlock: 'start', fun: 'duck' },
  { item: 'grass', amount: 0, weight: 0.5, unlock: 'start', fun: 'barrel' },
  { item: 'grass', amount: 0, weight: 0.3, unlock: 'start', fun: 'beachball' },
  { item: 'grass', amount: 0, weight: 0.25, unlock: 'tiles3', fun: 'chest' },
  { item: 'grass', amount: 0, weight: 0.25, unlock: 'tiles3', fun: 'statue' },
  { item: 'grass', amount: 0, weight: 0.2, unlock: 'island1', fun: 'toilet' },
  { item: 'dirt', amount: 1, weight: 3, unlock: 'tiles3' },
  { item: 'seed', amount: 1, weight: 2, unlock: 'tiles3' },
  { item: 'scrap', amount: 1, weight: 2, unlock: 'island1' },
  { item: 'fuel', amount: 1, weight: 1, unlock: 'island2' },
  { item: 'grass', amount: 0, weight: 0.4, unlock: 'tiles3', bottle: true },
];

// =====================================================================
// Day, weather, pests
// =====================================================================

/** dayTime 0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight. */
export const DAY = { lengthSeconds: 360, startTime: 0.08 } as const;
export const WEATHER = { clearMin: 90, clearMax: 180, rainMin: 30, rainMax: 60, growthMult: 2 } as const;
export const SEAGULL = { firstAfter: 60, intervalMin: 45, intervalMax: 90, eatRate: 0.25, scareDistance: 2.2, flySpeed: 9 } as const;
export const SHARK = { firstAfter: 150, intervalMin: 80, intervalMax: 140, biteSeconds: 8, bonkDistance: 3, circleRadius: 9, minTiles: 4 } as const;

export type IslandId = 'scrapyard' | 'fuelDepot' | 'mowerGraveyard';
export const ISLAND_ORDER: readonly IslandId[] = ['scrapyard', 'fuelDepot', 'mowerGraveyard'];
export interface IslandDef {
  name: string;
  /** Sea coordinates of the centre (the raft starts at sea 0,0). */
  x: number;
  z: number;
  radius: number;
  /** One entry per crate: what it gives. */
  crates: Partial<Record<ItemId, number>>[];
  /** Theme hint for the island's props. */
  theme: string;
}
export const ISLANDS: Record<IslandId, IslandDef> = {
  scrapyard: { name: 'Scrapyard Isle', x: 220, z: 160, radius: 18, theme: 'heaps of rusty scrap, a broken shed', crates: [{ scrap: 6, plank: 2 }, { scrap: 5, dirt: 2 }, { scrap: 4, seed: 2, plank: 3 }] },
  fuelDepot: { name: 'Fuel Depot Key', x: -180, z: 520, radius: 20, theme: 'red fuel drums, a little gas pump', crates: [{ fuel: 5 }, { fuel: 4, scrap: 3 }, { fuel: 3, scrap: 3 }] },
  mowerGraveyard: { name: 'Mower Graveyard', x: 560, z: 760, radius: 24, theme: 'wrecked riding mowers half buried in sand', crates: [{ parts: 1, scrap: 4 }, { parts: 1, fuel: 3 }, { parts: 1, scrap: 4 }] },
};

// =====================================================================
// Game state
// =====================================================================

export type Mode = 'title' | 'play' | 'build' | 'telescope' | 'craft';

export interface Prop { kind: PropKind; i: number; j: number }
export interface Stats { cut: number; caught: number; tilesLost: number; gullsScared: number; sharksBonked: number }

export interface Tile { i: number; j: number; growth: number }

export interface IslandState { spotted: boolean; visited: boolean; looted: boolean[] }

export interface GameState {
  mode: Mode;
  time: number;
  inv: Record<ItemId, number>;
  tools: Record<ToolId, boolean>;
  equipped: ToolId;
  hasTelescope: boolean;
  /** Keyed by tileKey(i, j). */
  tiles: Map<string, Tile>;
  /** Tiles placed by the player (not the starting ones). */
  tilesBuilt: number;
  buildKind: BuildKind;
  player: PlayerState;
  /** The raft never moves in the 3D scene (it stays round the origin); the sea moves past it. */
  sea: { x: number; z: number; heading: number; speed: number; course: IslandId | null; docked: IslandId | null };
  islands: Record<IslandId, IslandState>;
  /** Toast messages; the HUD shows and removes them. */
  messages: string[];
  /** 0..1, advanced by tickWorld. See DAY. */
  dayTime: number;
  /** Set by the weather system. Rain multiplies grass growth by WEATHER.growthMult. */
  raining: boolean;
  /** Sprinklers and decorations standing on tiles (at most one per tile). */
  props: Prop[];
  stats: Stats;
  /** True once the final objective is complete. */
  won: boolean;
  /** Shed pieces: plank floors, walls and roofs. See SHED and Structure. */
  structures: Structure[];
  /** Set every frame by fishing.ts: true while floating junk is within GRAB.reach (E grabs it instead of cutting grass). */
  canGrab: boolean;
  /**
   * Co-op role (net.ts sets it). 'solo' and 'host' run the whole world; a 'guest' forwards its actions to the host
   * (rules.netHook) and takes the host's world snapshots. Seagulls, the shark and the weather timer run only off-guest.
   */
  netRole: NetRole;
  /** Co-op lobby state shared by net.ts (owner) and coopUi.ts (the panel). See CoopState. */
  coop: CoopState;
}

export type NetRole = 'solo' | 'host' | 'guest';

/** One player in the co-op raft, for the UI. */
export interface CoopPlayer { id: number; name: string; color: number; host: boolean; me: boolean }

/**
 * Co-op lobby state. coopUi.ts writes `request`; net.ts reads and clears it every frame and keeps the rest current.
 * - status 'off': not connected. 'connecting': opening the socket / joining the room. 'in': in a shared raft.
 *   'error': failed; `message` says why (shown by the UI; a new request retries).
 * - code: the room code in use ('' when off). players: everyone in the raft, me included.
 */
export interface CoopState {
  status: 'off' | 'connecting' | 'in' | 'error';
  message: string;
  code: string;
  players: CoopPlayer[];
  /** Set by the UI: join (or create) room `code` as `name`; or 'leave'. net.ts sets it back to null. */
  request: { name: string; code: string } | 'leave' | null;
}

/** Co-op tuning. */
export const COOP = {
  snapHz: 5,             // host -> all world snapshots per second
  meHz: 15,              // everyone -> all own-gnome updates per second
  ackWaitS: 2,           // a guest skips snapshots that predate its own unacknowledged actions for at most this long
  nameKey: 'gnaft-coop-name', // localStorage key for the remembered player name
} as const;

// =====================================================================
// System contract
// =====================================================================

export type SfxName =
  | 'throw' | 'reel' | 'catch' | 'place' | 'cut' | 'craft' | 'spot' | 'dock' | 'loot' | 'error' | 'click'
  | 'splash' | 'thunder' | 'gull' | 'shark' | 'bonk' | 'win' | 'bottle' | 'chomp' | 'quack' | 'swim';

/** Everything a system gets. Systems may add objects to scene and elements under ui, never restyle #ui. */
export interface Ctx {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  state: GameState;
  input: import('./input').Input;
  /** Scene lights, created by main.ts. The day/night system animates them. */
  lights: { sun: THREE.DirectionalLight; hemi: THREE.HemisphereLight };
  /** The shared #ui element. Append your own container to it. */
  ui: HTMLElement;
}

export interface System { update(dt: number): void }

/**
 * Key bindings (KeyboardEvent.code). Mouse: left button = fishing (play) / place tile (build).
 */
export const KEYS = {
  forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', jump: 'Space',
  interact: 'KeyE',      // grab nearby floating junk / cut the tile under you by hand / open an island crate
  build: 'KeyB',         // toggle build mode
  buildKind: 'KeyR',     // in build mode: cycle BUILD_ORDER (right mouse in build mode removes a shed piece)
  tool: 'KeyQ',          // cycle owned tools
  telescope: 'KeyT',     // toggle telescope (if crafted)
  chart: 'KeyC',         // telescope: chart course to aimed island; docked: cast off
  craft: 'Tab',          // open/close the craft menu
  bonk: 'KeyF',          // bonk a shark or seagull that is close
  sprint: 'ShiftLeft',
  music: 'KeyM',         // mute/unmute music
} as const;

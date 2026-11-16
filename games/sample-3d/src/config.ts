import type * as THREE from 'three';
import type { GameMsg, MowerSnap, ServerMsg } from './net/protocol';

// =====================================================================
// World
// =====================================================================

/**
 * The lawn spans -ARENA_HALF..ARENA_HALF on x and z.
 * Scale: the world is gnome-sized. The gnome is ~1.4 units tall (~30 cm), so 1 m ~ 4.7 units.
 * North of the lawn (z < -ARENA_HALF) is the patio and a giant house; fences on the other three sides.
 */
export const ARENA_HALF = 250;
/** z of the house's front wall. */
export const HOUSE_FRONT_Z = -ARENA_HALF - 6;
export const PLAYER_RADIUS = 0.4;
/** Height of the lobby pedestal the gnome stands on. */
export const PEDESTAL_HEIGHT = 0.35;

export const COLORS = {
  sky: 0x9ad7ff,
  grass: 0x4f9a35,
  grassMowed: 0x7cc456,
  fence: 0xf2efe6,
  bush: 0x2f7a2f,
  stump: 0x7a5230,
  stone: 0x9e9e9e,
  gnomeHat: 0xd93636,
  gnomeBeard: 0xf4f4f4,
  gnomeSkin: 0xf1c27d,
  gnomeShirt: 0x2f64c9,
  gnomePants: 0x6b4a2e,
  mowerBody: 0xd8342c,
  mowerDark: 0x222222,
  mowerGreen: 0x3fa34d,
  mowerYellow: 0xf2c230,
  mowerRed: 0xd8342c,
  reelWood: 0x9c6b3c,
  reelMetal: 0x8a9399,
  combineBody: 0x2e8b3a,
  combineAccent: 0xf2c230,
  combineGlass: 0x9fd8ff,
  acorn: 0xd4a017,
  acornCap: 0x6b4a2e,
  xp: 0x9cff57,
  pebble: 0x8d8d8d,
  trowel: 0xc0c7cc,
  water: 0x5ec8f2,
  mushroomCap: 0xe53935,
  mushroomStem: 0xf5f0e1,
} as const;

/** Fixed tuning that is not a player stat. */
export const TUNING = {
  moveSpeed: 5.5,            // reference speed for the gnome's run animation only
  accel: 40,
  airControl: 0.5,
  turnSpeed: 12,
  gravity: 20,
  cameraDistance: 7,
  cameraPitchDefault: 0.35,
  cameraPitchMin: -0.1,
  cameraPitchMax: 1.2,
  cameraLookSensitivity: 0.0025,
  cameraKeyTurnSpeed: 2.5,
  pickupSpawnS: 3,           // field acorns
  pickupMax: 6,
  pickupOnObstacleChance: 0.4,
  pickupRingMin: 5,          // field acorns spawn this far from the player...
  pickupRingMax: 18,         // ...up to this far
  pickupLeashDist: 35,       // and are removed when the player is farther than this
  maxClimbableHeight: 2.0,   // tallest obstacle a double jump can reach (for acorns on top)
  spawnRingMin: 14,          // mowers spawn in a ring around the player
  spawnRingMax: 22,
  mowerLeashDist: 40,        // a mower farther than this is moved back into the spawn ring
  bossSpawnDist: 25,
  propCullDist: 200,         // props farther than this (+2x their height) are hidden
  liteCullDist: 70,          // the same in LITE mode (heights count only up to 10)
  itemSpawnS: 25,            // rare world items (chicken dinner, shop-vac, ...)
  itemMax: 3,
  itemRingMin: 20,
  itemRingMax: 40,
  itemLeashDist: 90,
  espressoS: 12,
  nukeRadius: 30,
  nukeBossDamage: 300,
  levelUpCelebrateS: 1.0,    // slow-mo celebration before the cards appear
  levelUpTimeScale: 0.2,
  comboWindowS: 2.5,         // kills within this keep the combo alive
  acornXp: 3,
  dayLengthS: 300,           // one full day + night
  dayStartT: 0.1,            // runs start mid-morning (0 = sunrise, 0.5 = sunset)
  lobbyTimeT: 0.04,          // the lobby is frozen at golden hour
  nightXpMult: 1.25,         // XP bonus while it is night                // each acorn also gives XP (a green mower's pellet is 2)
  // Battle royale (bots)
  royaleBots: 19,            // plus you = 20 gnomes
  onlineSpawnRing: 18,       // online: players start on a ring this far from the centre
  royaleSpawnRadius: 60,     // bots drop near you so the fight is visible
  zoneStartRadius: 85,       // the wall is on screen from the first second
  zoneFinalRadius: 6,
  zoneFirstDelayS: 20,       // before the first shrink
  zoneHoldS: 12,             // pause between shrinks
  zoneShrinkS: 10,           // each shrink takes this long
  zoneShrinkFactor: 0.5,     // 85 -> 42 -> 21 -> 11 -> 6: about 2 minutes to the final circle
  zoneDamageEveryS: 2,       // outside the zone: lose 1 heart this often (twice as often once the circle is small)
  zoneLateRadius: 25,        // below this radius the zone hits twice as fast
  botHearts: 3,
  botAttackRange: 5,
  botDpsStart: 12,
  botDpsPer10s: 1.5,
  mowerClimbMaxHeight: 2.8,  // mowers crawl up and over obstacles this tall or lower
  mowerClimbSpeed: 3,        // units/s up a wall
  invulnS: 1.0,              // after taking a hit
  staminaExhaustedResume: 0.25, // fraction of max stamina needed to sprint again after running dry
  bossAtS: 240,
  victoryDelayS: 3,
  survivalAcornsPer10s: 1,
  bossAcornBonus: 50,
  bossAcornDrop: 25,
  levelClearHeal: 2,         // hearts restored when a solo level's bosses fall
  levelClearAcorns: 30,
  levelBreatherS: 8,         // no spawns for this long after a level clear
} as const;

/** A solo level: the waves replay with these multipliers, then the boss fight ends the level. */
export interface LevelDef {
  name: string;
  sub: string;
  speedMult: number;
  hpMult: number;
  spawnMult: number;     // multiplies the wave spawn interval (lower = more often)
  maxAliveMult: number;
  bossCount: number;     // combines in the boss fight
  bossHpMult: number;
  bossAtS: number;       // seconds into the level when the boss fight starts
}

/** Solo levels, picked in the lobby. Each is its own run that is won by beating its boss fight; beating one unlocks the next. */
export const SOLO_LEVELS: readonly LevelDef[] = [
  { name: 'LEVEL 1: THE FRONT LAWN', sub: 'Mow or be mowed.', speedMult: 1, hpMult: 1, spawnMult: 1, maxAliveMult: 1, bossCount: 1, bossHpMult: 1, bossAtS: 300 },
  { name: 'LEVEL 2: MOW HARDER', sub: 'Same mowers. Faster, tougher, and more of them. They are upset.', speedMult: 1.15, hpMult: 1.7, spawnMult: 0.8, maxAliveMult: 1.3, bossCount: 2, bossHpMult: 1.3, bossAtS: 330 },
  { name: 'LEVEL 3: MOW HARDEST WITH A VENGEANCE', sub: 'Three combines are coming. This is fine.', speedMult: 1.3, hpMult: 2.6, spawnMult: 0.65, maxAliveMult: 1.6, bossCount: 3, bossHpMult: 1.6, bossAtS: 360 },
];

export interface MowerDifficulty {
  speedMult: number;
  hpMult: number;
  spawnMult: number;
  maxAliveMult: number;
}

export type ObstacleKind =
  | 'stump' | 'rock' | 'bush' | 'birdbath' | 'brick' | 'flowerpot' | 'bucket'
  | 'pool' | 'statue' | 'flower' | 'tree' | 'wateringCan';

/** A vertical cylinder from y=0 to y=height. Nothing may enter it from the side; the player may stand on top. */
export interface Obstacle {
  kind: ObstacleKind;
  x: number;
  z: number;
  radius: number;
  height: number;
}

/** Hand-placed obstacles near the start (coordinates from the original 120x120 layout). */
const CORE_OBSTACLES: readonly Obstacle[] = [
  // Near the house (north)
  { kind: 'pool', x: -25, z: -45, radius: 6, height: 1.6 },
  { kind: 'flowerpot', x: 10, z: -50, radius: 1.4, height: 1.8 },
  { kind: 'flowerpot', x: 14, z: -53, radius: 1.0, height: 1.2 },
  { kind: 'flowerpot', x: 18, z: -49, radius: 1.2, height: 2.2 },
  { kind: 'bucket', x: 30, z: -42, radius: 1.6, height: 2.6 },
  // Gnome statues (the "coming soon" characters, waiting their turn)
  { kind: 'statue', x: -12, z: -20, radius: 1.0, height: 6 },
  { kind: 'statue', x: 12, z: -22, radius: 1.0, height: 6 },
  { kind: 'statue', x: 0, z: -35, radius: 1.0, height: 6 },
  { kind: 'birdbath', x: -4, z: -10, radius: 1.4, height: 3.8 },
  // Giant flowers
  { kind: 'flower', x: -30, z: 10, radius: 0.35, height: 6 },
  { kind: 'flower', x: -32, z: 14, radius: 0.35, height: 7.5 },
  { kind: 'flower', x: -27, z: 16, radius: 0.35, height: 5 },
  { kind: 'flower', x: 35, z: -15, radius: 0.35, height: 7 },
  { kind: 'flower', x: 38, z: -12, radius: 0.35, height: 5.5 },
  { kind: 'flower', x: 33, z: -9, radius: 0.35, height: 6.5 },
  // Trees (trunks; canopies are far overhead)
  { kind: 'tree', x: 30, z: 30, radius: 4, height: 60 },
  { kind: 'tree', x: -42, z: -12, radius: 3.5, height: 55 },
  // Climbable clutter
  { kind: 'stump', x: -15, z: 8, radius: 1.2, height: 1.0 },
  { kind: 'stump', x: 20, z: 12, radius: 1.4, height: 0.8 },
  { kind: 'stump', x: -45, z: 35, radius: 1.2, height: 0.9 },
  { kind: 'rock', x: 5, z: 18, radius: 1.6, height: 0.8 },
  { kind: 'rock', x: -20, z: -12, radius: 1.8, height: 0.9 },
  { kind: 'rock', x: 45, z: -35, radius: 2.0, height: 1.0 },
  { kind: 'rock', x: -50, z: -40, radius: 1.5, height: 0.7 },
  { kind: 'brick', x: 8, z: -8, radius: 1.0, height: 1.1 },
  { kind: 'brick', x: -6, z: 22, radius: 1.0, height: 1.1 },
  { kind: 'brick', x: 40, z: 45, radius: 1.0, height: 1.1 },
  { kind: 'bush', x: 25, z: -30, radius: 3, height: 2.5 },
  { kind: 'bush', x: -35, z: 40, radius: 3, height: 2.5 },
  { kind: 'bush', x: 50, z: 15, radius: 2.5, height: 2.2 },
  { kind: 'wateringCan', x: -22, z: 28, radius: 1.4, height: 2.6 },
];

/** Size ranges and spawn weights for the procedural scatter across the big yard. */
const SCATTER: readonly { kind: ObstacleKind; weight: number; r: [number, number]; h: [number, number] }[] = [
  { kind: 'stump', weight: 3, r: [1.0, 1.5], h: [0.7, 1.1] },
  { kind: 'rock', weight: 4, r: [1.3, 2.2], h: [0.6, 1.1] },
  { kind: 'bush', weight: 4, r: [2.2, 3.2], h: [2.0, 2.6] },
  { kind: 'brick', weight: 2, r: [1.0, 1.0], h: [1.1, 1.1] },
  { kind: 'flowerpot', weight: 2, r: [1.0, 1.5], h: [1.2, 2.2] },
  { kind: 'bucket', weight: 1, r: [1.4, 1.8], h: [2.4, 2.8] },
  { kind: 'statue', weight: 0.5, r: [1.0, 1.0], h: [6, 6] },
  { kind: 'flower', weight: 5, r: [0.35, 0.35], h: [5, 8] },
  { kind: 'tree', weight: 2, r: [3.5, 4.5], h: [55, 65] },
  { kind: 'wateringCan', weight: 1, r: [1.4, 1.4], h: [2.6, 2.6] },
  { kind: 'pool', weight: 0.5, r: [5, 7], h: [1.6, 1.6] },
  { kind: 'birdbath', weight: 0.5, r: [1.4, 1.4], h: [3.8, 3.8] },
];

/** Deterministic PRNG so the yard is the same every run. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scatterObstacles(count: number, seed: number): Obstacle[] {
  const rnd = mulberry32(seed);
  const out: Obstacle[] = [...CORE_OBSTACLES];
  const total = SCATTER.reduce((a, s) => a + s.weight, 0);
  const lerp = (r: [number, number]) => r[0] + (r[1] - r[0]) * rnd();
  let tries = 0;
  while (out.length < CORE_OBSTACLES.length + count && tries < count * 20) {
    tries++;
    let pick = rnd() * total;
    let def = SCATTER[0];
    for (const s of SCATTER) { pick -= s.weight; if (pick < 0) { def = s; break; } }
    const radius = lerp(def.r);
    const lim = ARENA_HALF - radius - 6;
    const x = (rnd() * 2 - 1) * lim;
    const z = (rnd() * 2 - 1) * lim;
    if (Math.hypot(x, z) < 70) continue; // keep the hand-placed core as designed
    if (out.some((o) => Math.hypot(o.x - x, o.z - z) < o.radius + radius + 4)) continue;
    out.push({ kind: def.kind, x, z, radius, height: lerp(def.h) });
  }
  return out;
}

export const OBSTACLES: readonly Obstacle[] = scatterObstacles(240, 1337)

// =====================================================================
// Player stats (meta upgrades + in-run passives feed these)
// =====================================================================

export interface PlayerStats {
  moveSpeed: number;          // m/s walking
  sprintMultiplier: number;   // speed x this while sprinting
  staminaMax: number;         // seconds of sprint
  staminaRegenPerSec: number; // stamina seconds regained per second
  staminaRegenDelayS: number; // wait after sprinting before regen starts
  jumpSpeed: number;          // m/s upward per jump
  maxJumps: number;
  maxHearts: number;
  magnetRadius: number;       // m: XP and dropped acorns fly to you inside this
  xpMultiplier: number;
  damageMult: number;
  cooldownMult: number;       // weapon cooldowns are multiplied by this
  choiceCount: number;        // cards per level-up
  rerolls: number;            // level-up rerolls per run
  acornLuck: number;          // multiplies mowers' acorn drop chance
  invulnBonusS: number;       // extra invincibility after a hit
}

export const BASE_STATS: PlayerStats = {
  moveSpeed: 5.5,
  sprintMultiplier: 1.6,
  staminaMax: 1.5,
  staminaRegenPerSec: 0.5,
  staminaRegenDelayS: 1.0,
  jumpSpeed: 6.5,
  maxJumps: 2,
  maxHearts: 3,
  magnetRadius: 2.0,
  xpMultiplier: 1,
  damageMult: 1,
  cooldownMult: 1,
  choiceCount: 3,
  rerolls: 0,
  acornLuck: 1,
  invulnBonusS: 0,
};

// =====================================================================
// Meta progression ("Primitive Powers", bought in the lobby with acorns)
// =====================================================================

export type MetaUpgradeId =
  | 'sprintDuration' | 'sprintRecharge' | 'jumpHeight' | 'moveSpeed'
  | 'hearts' | 'magnet' | 'wisdom' | 'luck';

export interface MetaUpgradeDef {
  id: MetaUpgradeId;
  name: string;
  blurb: string;
  effect: string;      // short per-level effect text for the card, e.g. "+0.5s sprint"
  maxLevel: number;
  baseCost: number;
  costGrowth: number;
  perLevel: number;    // amount added to the stat per level (see stats.ts)
}

export const META_UPGRADES: readonly MetaUpgradeDef[] = [
  { id: 'sprintDuration', name: 'Cardio', blurb: 'Gnomes famously skip leg day. Not you.', effect: '+0.5s sprint', maxLevel: 5, baseCost: 10, costGrowth: 1.6, perLevel: 0.5 },
  { id: 'sprintRecharge', name: 'Second Wind', blurb: 'Stamina comes back sooner and faster.', effect: '+0.3 regen/s, -0.15s delay', maxLevel: 5, baseCost: 10, costGrowth: 1.6, perLevel: 0.3 },
  { id: 'jumpHeight', name: 'Springy Boots', blurb: 'Hop over your problems. Literally.', effect: '+0.4 jump power', maxLevel: 5, baseCost: 12, costGrowth: 1.6, perLevel: 0.4 },
  { id: 'moveSpeed', name: 'Stubby Legs++', blurb: 'The legs are still stubby. They are just faster.', effect: '+0.3 m/s', maxLevel: 5, baseCost: 12, costGrowth: 1.6, perLevel: 0.3 },
  { id: 'hearts', name: 'Extra Beard', blurb: 'The beard absorbs the blow.', effect: '+1 max heart', maxLevel: 3, baseCost: 40, costGrowth: 2.2, perLevel: 1 },
  { id: 'magnet', name: 'Pocket Magnet', blurb: 'XP and acorns come to you. As is your right.', effect: '+0.75m pickup range', maxLevel: 4, baseCost: 15, costGrowth: 1.7, perLevel: 0.75 },
  { id: 'wisdom', name: 'Ancient Gnome Wisdom', blurb: 'You have died many times. You have learned.', effect: '+10% XP', maxLevel: 5, baseCost: 15, costGrowth: 1.7, perLevel: 0.1 },
  { id: 'luck', name: 'Lucky Mushroom', blurb: 'Do not eat it. Just hold it.', effect: '+1 reroll per run', maxLevel: 3, baseCost: 30, costGrowth: 2.0, perLevel: 1 },
];

/** Acorn cost to buy the next level when the upgrade is currently at `level`. */
export function upgradeCost(def: MetaUpgradeDef, level: number): number {
  return Math.round(def.baseCost * Math.pow(def.costGrowth, level));
}

// =====================================================================
// Characters
// =====================================================================

/** How a gnome looks. The player's character and the bots are all built from one of these. */
export interface GnomeLook {
  hat: number;
  shirt: number;
  pants: number;
  skin: number;
  boots: number;
  beard: number | null;                                  // beard colour, or null for none
  hair: { color: number; style: 'pigtails' } | null;     // hair showing under the hat
  freckles: boolean;
  dress: boolean;                                        // a flared skirt over the legs
  glasses: boolean;                                      // round glasses
}

export type CharacterId = 'gnorman' | 'gnancy' | 'mine';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  rarity: string;
  flavour: string;
  look: GnomeLook;
  /** Weapons owned at the start of a run (level). Characters will differ here later. */
  startingWeapons: Partial<Record<WeaponId, number>>;
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  gnorman: {
    id: 'gnorman', name: 'GNORMAN', rarity: 'LEGENDARY (ALLEGEDLY)', flavour: 'Pointy hat. Strong beard. Weak to mowers.',
    look: { hat: 0xd93636, shirt: 0x2f64c9, pants: 0x6b4a2e, skin: 0xf1c27d, boots: 0x222222, beard: 0xf4f4f4, hair: null, freckles: false, dress: false, glasses: false },
    startingWeapons: { slingshot: 1 },
  },
  gnancy: {
    id: 'gnancy', name: 'GNANCY', rarity: 'EPIC (SELF-APPOINTED)', flavour: 'Orange-red pigtails. Freckles. Has read every mower manual and hated them all.',
    look: { hat: 0x7e57c2, shirt: 0x2e8b57, pants: 0x5d4037, skin: 0xf8dcc8, boots: 0x6d4c41, beard: null, hair: { color: 0xe2571e, style: 'pigtails' }, freckles: true, dress: true, glasses: true },
    startingWeapons: { slingshot: 1 },
  },
  // Filled from the player's saved Gnome Creator look at start-up (see main.ts); the default is a placeholder.
  mine: {
    id: 'mine', name: 'MY GNOME', rarity: 'CUSTOM-MADE', flavour: 'Made in the Gnome Creator. Same slingshot, better hat.',
    look: { hat: 0xd93636, shirt: 0x2f64c9, pants: 0x6b4a2e, skin: 0xf1c27d, boots: 0x222222, beard: 0xf4f4f4, hair: null, freckles: false, dress: false, glasses: false },
    startingWeapons: { slingshot: 1 },
  },
};

/** Lobby order. Names not in CHARACTERS are shown as locked "COMING SOON" cards. 'mine' is pushed at start-up only when the player has a gnome. */
export const CHARACTER_ORDER: CharacterId[] = ['gnorman', 'gnancy'];
export const LOCKED_CHARACTER_NAMES: readonly string[] = ['GNOAH', 'SIR GNOMESALOT'];

export interface MetaSave {
  version: 1;
  name: string;              // online display name, passed checkName()
  character: CharacterId;    // the selected character
  levelsUnlocked: number;    // solo levels available in the lobby (1..SOLO_LEVELS.length)
  acorns: number;            // bankable currency
  totalAcornsEarned: number;
  runs: number;              // completed runs (deaths + victories)
  bestTimeS: number;
  bossKills: number;
  upgrades: Record<MetaUpgradeId, number>;
}

export const SAVE_KEY = 'sample-3d.save.v1';

// =====================================================================
// In-run progression (Vampire-Survivors-style)
// =====================================================================

export type WeaponId =
  | 'slingshot' | 'trowels' | 'sprinkler' | 'mushrooms'
  | 'stormOfDaggers' | 'leafPileFireball' | 'hoseMissile' | 'windChimeLullaby' | 'leafBlower' | 'pitchfork';
export type PassiveId = 'fertilizer' | 'compost' | 'comfyBoots' | 'rake' | 'thickBeard' | 'sneakers' | 'luckyClover' | 'mulchArmor';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  blurb: string;
  levelText: readonly string[]; // index 0 = level 1 text; length = max level
}

export const WEAPON_DEFS: Record<WeaponId, WeaponDef> = {
  slingshot: {
    id: 'slingshot', name: 'Pebble Slingshot',
    blurb: 'Auto-flings pebbles at the nearest mower. Every roguelike needs a starter weapon.',
    levelText: ['Flings 1 pebble at the nearest mower.', '+30% damage, fires faster.', '+1 pebble, pierces 1 mower.', 'More damage, fires faster.', '+1 pebble, pierces 2. MAX.'],
  },
  trowels: {
    id: 'trowels', name: 'Orbiting Trowels',
    blurb: 'Garden trowels circle you menacingly. A totally original mechanic.',
    levelText: ['2 trowels orbit you.', '+1 trowel.', 'More damage, wider orbit.', '+1 trowel, spins faster.', '+1 trowel, big damage. MAX.'],
  },
  sprinkler: {
    id: 'sprinkler', name: 'Battle Sprinkler',
    blurb: 'A periodic splash that damages and slows. Hydration is a weapon.',
    levelText: ['Splashes nearby mowers and slows them.', 'Bigger splash, more damage.', 'Bigger, more often, slows longer.', 'Bigger, more often.', 'Huge splash. MAX.'],
  },
  mushrooms: {
    id: 'mushrooms', name: 'Mushroom Mines',
    blurb: 'Drops spicy mushrooms that explode near mowers. Do not eat.',
    levelText: ['Drops a mine every few seconds.', 'More mines, bigger boom.', 'Arms faster, bigger boom.', 'More mines, more damage.', 'Mushroom carpet bombing. MAX.'],
  },
  stormOfDaggers: {
    id: 'stormOfDaggers', name: 'Storm of Daggers',
    blurb: 'Hurls a cloud of tiny hand trowels that shreds whatever stands in it, arcane but with dirt.',
    levelText: ["Hurls a cloud of trowels that shreds mowers inside it.", "Bigger cloud, more trowels, more damage.", "Cloud lasts longer and hits harder.", "Bigger cloud, faster hits, more trowels.", "Trowel blizzard. Huge cloud. MAX."],
  },
  leafPileFireball: {
    id: 'leafPileFireball', name: 'Leaf Pile Fireball',
    blurb: 'Lobs a bag of damp leaves at the nearest mower; it is not a fireball, and please stop calling it one.',
    levelText: ["Lobs a leaf bag at the nearest mower. Splash.", "Bigger splash, more damage, slows survivors.", "Bigger splash, more damage, slows longer.", "Faster lobs, harder slow.", "Leaf bag of legend, huge splash. MAX."],
  },
  hoseMissile: {
    id: 'hoseMissile', name: 'Garden Hose Magic Missile',
    blurb: 'Fires hose jets that always find their target, Magic Missile with a rubber smell.',
    levelText: ["Fires 2 hose jets, each at a different mower.", "+1 jet, more damage.", "Longer reach, more damage.", "+1 jet, fires faster.", "5 jets, maximum hose pressure. MAX."],
  },
  windChimeLullaby: {
    id: 'windChimeLullaby', name: 'Wind Chime Lullaby',
    blurb: 'Rings a wind chime that puts the weakest nearby mowers to sleep, dealing no damage and getting results.',
    levelText: ["Wind chime puts the weakest nearby mowers to sleep.", "Bigger pool, wider radius, sleepers crawl slower.", "Bigger pool and radius. Sleep lasts longer.", "Faster chimes, bigger pool, deeper sleep.", "Deep lullaby, nearly stationary sleepers. MAX."],
  },
  leafBlower: {
    id: 'leafBlower', name: 'Leaf Blower of Endless Gale',
    blurb: 'Blows leaves in a cone along with anything else in it; the mowers have no say in the matter.',
    levelText: ["Blows a cone of damage and slows mowers in it.", "Longer cone, more damage.", "Wider cone, more damage, slows harder.", "Longer reach, faster ticks, harder slow.", "Gale of legend, wide cone, long reach. MAX."],
  },
  pitchfork: {
    id: 'pitchfork', name: 'Pitchfork of Sovereignty',
    blurb: 'Stabs forward in a three-pronged rectangle, and every third stab is declared royal, nobody asked.',
    levelText: ["Stabs the area in front of you. Regularly.", "Wider prongs, more damage.", "Longer reach. Royal stabs hit harder.", "Faster stabs, longer reach.", "Royal stabs hit four times as hard. Long reach. MAX."],
  },
};

export interface PassiveDef {
  id: PassiveId;
  name: string;
  blurb: string;
  effect: string;
  maxLevel: number;
  perLevel: number;
}

export const PASSIVE_DEFS: Record<PassiveId, PassiveDef> = {
  fertilizer: { id: 'fertilizer', name: 'Fertilizer', blurb: 'Grows your damage. Smells awful.', effect: '+15% damage', maxLevel: 5, perLevel: 0.15 },
  compost: { id: 'compost', name: 'Compost Heap', blurb: 'Recycled cooldowns. Eco-friendly violence.', effect: '-8% weapon cooldowns', maxLevel: 5, perLevel: 0.08 },
  comfyBoots: { id: 'comfyBoots', name: 'Comfy Boots', blurb: 'Orthopedic. Aerodynamic. Gnomish.', effect: '+8% move speed', maxLevel: 5, perLevel: 0.08 },
  rake: { id: 'rake', name: 'Garden Rake of Attraction', blurb: 'Rakes pellets and acorns to you from across the lawn.', effect: '+1.2m pickup range', maxLevel: 5, perLevel: 1.2 },
  thickBeard: { id: 'thickBeard', name: 'Thick Beard', blurb: 'More beard, more hit points. Science.', effect: '+1 max heart (and heals 1)', maxLevel: 2, perLevel: 1 },
  sneakers: { id: 'sneakers', name: 'Light-Up Sneakers', blurb: 'They blink when you run. You run longer out of pride.', effect: '+0.6s sprint', maxLevel: 4, perLevel: 0.6 },
  luckyClover: { id: 'luckyClover', name: 'Four-Leaf Clover', blurb: 'Mowers drop acorns more often. Statistically suspicious.', effect: '+40% acorn drops', maxLevel: 3, perLevel: 0.4 },
  mulchArmor: { id: 'mulchArmor', name: 'Mulch Armor', blurb: 'Soft, damp, protective. Longer invincibility after a hit.', effect: '+0.3s invincibility', maxLevel: 3, perLevel: 0.3 },
};

export interface SlingshotLevel { damage: number; cooldownS: number; projectiles: number; speed: number; pierce: number; range: number }
export interface TrowelLevel { count: number; damage: number; radius: number; revPerSec: number; hitCooldownS: number }
export interface SprinklerLevel { cooldownS: number; radius: number; damage: number; slowFactor: number; slowS: number }
export interface MushroomLevel { cooldownS: number; maxMines: number; armS: number; triggerRadius: number; blastRadius: number; damage: number }

export const SLINGSHOT_LEVELS: readonly SlingshotLevel[] = [
  { damage: 10, cooldownS: 1.0, projectiles: 1, speed: 16, pierce: 0, range: 14 },
  { damage: 13, cooldownS: 0.9, projectiles: 1, speed: 16, pierce: 0, range: 14 },
  { damage: 13, cooldownS: 0.9, projectiles: 2, speed: 17, pierce: 1, range: 15 },
  { damage: 17, cooldownS: 0.8, projectiles: 2, speed: 18, pierce: 1, range: 15 },
  { damage: 22, cooldownS: 0.7, projectiles: 3, speed: 19, pierce: 2, range: 16 },
];
export const TROWEL_LEVELS: readonly TrowelLevel[] = [
  { count: 2, damage: 8, radius: 1.8, revPerSec: 0.6, hitCooldownS: 0.5 },
  { count: 3, damage: 8, radius: 1.8, revPerSec: 0.6, hitCooldownS: 0.5 },
  { count: 3, damage: 12, radius: 2.1, revPerSec: 0.7, hitCooldownS: 0.45 },
  { count: 4, damage: 14, radius: 2.3, revPerSec: 0.75, hitCooldownS: 0.4 },
  { count: 5, damage: 18, radius: 2.5, revPerSec: 0.85, hitCooldownS: 0.35 },
];
export const SPRINKLER_LEVELS: readonly SprinklerLevel[] = [
  { cooldownS: 3.0, radius: 3.0, damage: 14, slowFactor: 0.6, slowS: 1.5 },
  { cooldownS: 2.7, radius: 3.4, damage: 18, slowFactor: 0.55, slowS: 1.8 },
  { cooldownS: 2.4, radius: 3.8, damage: 22, slowFactor: 0.5, slowS: 2.0 },
  { cooldownS: 2.1, radius: 4.3, damage: 28, slowFactor: 0.45, slowS: 2.2 },
  { cooldownS: 1.8, radius: 5.0, damage: 36, slowFactor: 0.4, slowS: 2.5 },
];
export const MUSHROOM_LEVELS: readonly MushroomLevel[] = [
  { cooldownS: 2.5, maxMines: 3, armS: 0.5, triggerRadius: 1.0, blastRadius: 2.5, damage: 35 },
  { cooldownS: 2.3, maxMines: 4, armS: 0.5, triggerRadius: 1.0, blastRadius: 2.8, damage: 45 },
  { cooldownS: 2.1, maxMines: 5, armS: 0.4, triggerRadius: 1.1, blastRadius: 3.1, damage: 55 },
  { cooldownS: 1.9, maxMines: 6, armS: 0.4, triggerRadius: 1.2, blastRadius: 3.4, damage: 70 },
  { cooldownS: 1.6, maxMines: 8, armS: 0.3, triggerRadius: 1.3, blastRadius: 3.8, damage: 90 },
];

// New weapons, from docs/design/new-weapons.md
export interface StormOfDaggersLevel {
  cooldownS: number;   // seconds between casts
  radius: number;      // cloud radius, units
  durationS: number;   // seconds the cloud lasts
  tickS: number;       // seconds between damage ticks
  damage: number;      // per tick, per enemy inside
  trowelCount: number; // visual only: trowel instances per cloud
}
export const STORM_OF_DAGGERS_LEVELS: readonly StormOfDaggersLevel[] = [
  { cooldownS: 4.0, radius: 2.2, durationS: 3.0, tickS: 0.5, damage: 6, trowelCount: 12 },
  { cooldownS: 3.7, radius: 2.4, durationS: 3.2, tickS: 0.5, damage: 8, trowelCount: 14 },
  { cooldownS: 3.3, radius: 2.7, durationS: 3.5, tickS: 0.4, damage: 10, trowelCount: 16 },
  { cooldownS: 2.8, radius: 3.0, durationS: 4.0, tickS: 0.4, damage: 13, trowelCount: 18 },
  { cooldownS: 2.2, radius: 3.6, durationS: 4.5, tickS: 0.3, damage: 16, trowelCount: 20 },
];

export interface LeafPileFireballLevel {
  cooldownS: number;   // seconds between throws
  range: number;       // units; target must be within this distance of the gnome
  blastRadius: number; // units, from the impact point
  damage: number;      // per enemy in the blast
  slowFactor: number;  // speed multiplier for survivors (0.5 = half speed)
  slowS: number;       // seconds the slow lasts; 0 = no slow
}
export const LEAF_PILE_FIREBALL_LEVELS: readonly LeafPileFireballLevel[] = [
  { cooldownS: 3.5, range: 12, blastRadius: 2.0, damage: 24, slowFactor: 1.0, slowS: 0.0 },
  { cooldownS: 3.3, range: 13, blastRadius: 2.3, damage: 32, slowFactor: 0.75, slowS: 1.2 },
  { cooldownS: 3.0, range: 14, blastRadius: 2.6, damage: 42, slowFactor: 0.7, slowS: 1.5 },
  { cooldownS: 2.7, range: 15, blastRadius: 2.9, damage: 56, slowFactor: 0.6, slowS: 1.8 },
  { cooldownS: 2.2, range: 16, blastRadius: 3.3, damage: 75, slowFactor: 0.5, slowS: 2.0 },
];

export interface HoseMissileLevel {
  cooldownS: number; // seconds between casts
  jets: number;      // jets per cast, each to a different enemy
  range: number;     // units from the gnome
  damage: number;    // per jet hit
}
export const HOSE_MISSILE_LEVELS: readonly HoseMissileLevel[] = [
  { cooldownS: 1.6, jets: 2, range: 10, damage: 7 },
  { cooldownS: 1.5, jets: 3, range: 10, damage: 9 },
  { cooldownS: 1.5, jets: 3, range: 12, damage: 11 },
  { cooldownS: 1.2, jets: 4, range: 12, damage: 13 },
  { cooldownS: 1.0, jets: 5, range: 14, damage: 17 },
];

export interface WindChimeLullabyLevel {
  cooldownS: number;  // seconds between casts
  radius: number;     // units from the gnome, to the enemy edge
  poolHp: number;     // total hp of enemies that can fall asleep per cast
  slowFactor: number; // speed multiplier for sleepers (0.1 = a tenth of normal speed)
  slowS: number;      // seconds the sleep lasts
}
export const WIND_CHIME_LULLABY_LEVELS: readonly WindChimeLullabyLevel[] = [
  { cooldownS: 6.0, radius: 3.5, poolHp: 40, slowFactor: 0.3, slowS: 2.5 },
  { cooldownS: 5.5, radius: 3.8, poolHp: 60, slowFactor: 0.25, slowS: 3.0 },
  { cooldownS: 5.0, radius: 4.2, poolHp: 90, slowFactor: 0.2, slowS: 3.5 },
  { cooldownS: 4.5, radius: 4.6, poolHp: 130, slowFactor: 0.1, slowS: 4.0 },
  { cooldownS: 4.0, radius: 5.0, poolHp: 200, slowFactor: 0.05, slowS: 5.0 },
];

export interface LeafBlowerLevel {
  range: number;        // units from the gnome, to the enemy edge
  halfAngleRad: number; // half the cone's angle, radians
  damage: number;       // per tick, per enemy inside
  tickS: number;        // seconds between ticks
  slowFactor: number;   // speed multiplier (0.7 = 70% speed)
  slowS: number;        // seconds the slow lasts after each tick
}
export const LEAF_BLOWER_LEVELS: readonly LeafBlowerLevel[] = [
  { range: 5.0, halfAngleRad: 0.5, damage: 4, tickS: 0.5, slowFactor: 0.7, slowS: 1.0 },
  { range: 5.5, halfAngleRad: 0.5, damage: 5, tickS: 0.5, slowFactor: 0.65, slowS: 1.0 },
  { range: 6.0, halfAngleRad: 0.6, damage: 6, tickS: 0.4, slowFactor: 0.6, slowS: 1.0 },
  { range: 6.5, halfAngleRad: 0.6, damage: 8, tickS: 0.35, slowFactor: 0.5, slowS: 1.2 },
  { range: 7.5, halfAngleRad: 0.7, damage: 10, tickS: 0.3, slowFactor: 0.4, slowS: 1.2 },
];

export interface PitchforkLevel {
  cooldownS: number;  // seconds between thrusts
  reach: number;      // units forward from the gnome
  halfWidth: number;  // units either side of the centre line
  damage: number;     // per enemy hit by a plain thrust
  royalEvery: number; // every Nth thrust is royal (count)
  royalMult: number;  // royal thrust damage = damage × royalMult
}
export const PITCHFORK_LEVELS: readonly PitchforkLevel[] = [
  { cooldownS: 1.8, reach: 3.0, halfWidth: 0.9, damage: 16, royalEvery: 3, royalMult: 2 },
  { cooldownS: 1.7, reach: 3.2, halfWidth: 1.0, damage: 20, royalEvery: 3, royalMult: 2 },
  { cooldownS: 1.5, reach: 3.4, halfWidth: 1.1, damage: 26, royalEvery: 3, royalMult: 3 },
  { cooldownS: 1.4, reach: 3.6, halfWidth: 1.2, damage: 32, royalEvery: 3, royalMult: 3 },
  { cooldownS: 1.2, reach: 4.0, halfWidth: 1.3, damage: 40, royalEvery: 3, royalMult: 4 },
];

export interface UpgradeChoice {
  kind: 'weapon' | 'passive' | 'heal';
  id: WeaponId | PassiveId | 'heal';
  nextLevel: number;   // level after picking (1 = new); 0 for heal
  title: string;       // e.g. "Orbiting Trowels" or "Fertilizer"
  description: string; // the level text / effect
  isNew: boolean;
}

export interface RunState {
  level: number;        // starts at 1
  xp: number;           // progress toward xpToNext
  xpToNext: number;
  hearts: number;
  invulnS: number;
  kills: number;
  acorns: number;       // collected this run (banked at the end)
  elapsedS: number;
  weapons: Partial<Record<WeaponId, number>>;   // owned weapon -> level
  passives: Partial<Record<PassiveId, number>>;
  rerollsLeft: number;
  bossSpawned: boolean;
  bossDefeated: boolean;
}

export interface RunSummary {
  runNumber: number;
  victory: boolean;
  elapsedS: number;
  kills: number;
  level: number;
  acornsCollected: number;
  survivalBonus: number;
  bossBonus: number;
  totalEarned: number;
  newBestTime: boolean;
  killedBy: MowerTier | null;
  /** Overrides the "Killed by" text, e.g. 'THE MOW ZONE'. */
  killedByText: string | null;
  /** Solo: the level played (1-based), else null. */
  soloLevel: number | null;
  /** Solo victory that unlocked a new level: its number, else null. */
  unlockedLevel: number | null;
  /** Boss fights won this run (0 or 1). */
  levelsCleared: number;
  /** Battle royale only: final position, 1 = winner. */
  placement: { rank: number; total: number } | null;
}

// =====================================================================
// Enemies: mower tiers and waves
// =====================================================================

export type MowerTier = 'reel' | 'green' | 'yellow' | 'red' | 'combine';

export interface MowerTierDef {
  tier: MowerTier;
  name: string;          // shown as "Killed by: <name>"
  hp: number;
  speed: number;
  turnRate: number;      // rad/s
  radius: number;        // collision circle
  height: number;        // player feet at or above this clear it; combine is too tall to jump
  contactDamage: number; // hearts
  xp: number;
  acornChance: number;   // chance to drop 1 acorn on death
}

export const MOWER_TIERS: Record<MowerTier, MowerTierDef> = {
  reel: { tier: 'reel', name: 'a Push Reel Mower (no engine, just vibes)', hp: 15, speed: 2.2, turnRate: 2.0, radius: 0.7, height: 0.6, contactDamage: 1, xp: 1, acornChance: 0.03 },
  green: { tier: 'green', name: 'a Green Mower', hp: 30, speed: 3.0, turnRate: 1.8, radius: 0.9, height: 0.7, contactDamage: 1, xp: 2, acornChance: 0.05 },
  yellow: { tier: 'yellow', name: 'a Yellow Mower', hp: 60, speed: 4.0, turnRate: 1.7, radius: 0.9, height: 0.7, contactDamage: 1, xp: 4, acornChance: 0.08 },
  red: { tier: 'red', name: 'a Red Mower (the fast one)', hp: 100, speed: 5.5, turnRate: 1.5, radius: 0.9, height: 0.7, contactDamage: 2, xp: 7, acornChance: 0.12 },
  combine: { tier: 'combine', name: 'THE COMBINE', hp: 2500, speed: 2.5, turnRate: 0.6, radius: 2.6, height: 2.5, contactDamage: 2, xp: 100, acornChance: 0 },
};

export type RegularTier = Exclude<MowerTier, 'combine'>;

export interface WavePhase {
  fromS: number;
  spawnEveryS: number;
  maxAlive: number;
  mix: Partial<Record<RegularTier, number>>; // spawn weights
  banner?: { title: string; sub: string };
}

/** Sorted by fromS. The phase in effect is the last one with fromS <= elapsed. */
export const WAVES: readonly WavePhase[] = [
  { fromS: 0, spawnEveryS: 1.6, maxAlive: 12, mix: { reel: 1 } },
  { fromS: 45, spawnEveryS: 1.2, maxAlive: 18, mix: { reel: 2, green: 1 }, banner: { title: 'GREEN MOWERS HAVE ENTERED THE CHAT', sub: 'They have engines now. Escalation!' } },
  { fromS: 90, spawnEveryS: 1.0, maxAlive: 24, mix: { green: 2, yellow: 1 }, banner: { title: 'YELLOW MOWERS', sub: 'Caution-coloured. Appropriately.' } },
  { fromS: 150, spawnEveryS: 0.8, maxAlive: 30, mix: { green: 1, yellow: 2, red: 1 }, banner: { title: 'RED MOWERS', sub: 'The fast ones. A classic difficulty curve.' } },
  { fromS: 210, spawnEveryS: 0.7, maxAlive: 36, mix: { yellow: 1, red: 2 }, banner: { title: 'HORDE PHASE', sub: 'Everything at once. Very authentic.' } },
];

// =====================================================================
// Module interfaces
// =====================================================================

/** Read once per frame. Edge flags are true only on the frame the button went down. */
export interface InputState {
  moveX: number;  // -1..1, +1 = right
  moveY: number;  // -1..1, +1 = forward
  jump: boolean;
  sprint: boolean; // held
  start: boolean;
  lookX: number;  // radians this frame, + = turn the view right
  lookY: number;  // radians this frame, + = raise the camera
}

/** On-screen touch controls (phones/tablets). Values use the same conventions as InputState. */
export interface TouchControls {
  /** True once a touch has been seen (or the device has a coarse pointer). */
  readonly active: boolean;
  /** Read once per frame; edge flags reset after reading, look deltas too. */
  read(): { moveX: number; moveY: number; jump: boolean; sprint: boolean; lookX: number; lookY: number };
  /** Show the controls only during a run. */
  setVisible(visible: boolean): void;
}

export interface InputController {
  read(dt: number): InputState;
  /** When false, the canvas never takes the pointer and any lock is released. When true, tries to lock now. */
  setPointerLockAllowed(allowed: boolean): void;
}

export interface PlayerState {
  position: THREE.Vector3; // feet
  velocity: THREE.Vector3;
  facing: number;          // yaw
  grounded: boolean;
  jumpsUsed: number;
  stamina: number;         // seconds of sprint left
  staminaDelay: number;    // seconds until regen starts
  sprinting: boolean;
  exhausted: boolean;      // ran dry; cannot sprint until stamina recovers
}

export type CameraView = 'third' | 'first' | 'top';
export const CAMERA_VIEWS: readonly CameraView[] = ['third', 'first', 'top'];

export interface CameraRig {
  yaw: number;
  pitch: number;
  /** Which perspective to render; switching snaps the camera. */
  view: CameraView;
  update(target: THREE.Vector3, input: InputState, dt: number): void;
  reset(yaw: number): void;
}

export interface GnomeModel {
  object: THREE.Group;
  update(p: PlayerState, dt: number): void;
  setDead(dead: boolean): void;
}

export interface World {
  /** Applies the day/night lighting (sun or moon, ambient). */
  setLighting(s: DayNightState): void;
  markMowed(x: number, z: number): void;
  /** focus = the player's feet; the sun's shadow camera follows it. */
  update(dt: number, focus: THREE.Vector3): void;
  reset(): void;
  /** Half-size of the shadowed area around the focus. */
  setShadowRange(halfExtent: number): void;
  /** Sand instead of grass (the ihategrass cheat). */
  setSand(on: boolean): void;
}

export interface PickupSystem {
  update(dt: number, playerFeet: THREE.Vector3): number;
  reset(): void;
}

/** A live enemy as other systems see it. Do not mutate except through MowerSystem methods. */
export interface EnemyView {
  readonly id: number;
  readonly tier: MowerTier;
  readonly pos: THREE.Vector3; // y = 0
  readonly radius: number;
  readonly hp: number;
  readonly maxHp: number;
}

/** by: who landed the killing blow (an online player id, -1 for a bot); undefined offline = the local player. */
export interface MowerKill { id: number; tier: MowerTier; x: number; z: number; by?: number }

export interface MowerSystem {
  /**
   * Spawns by WAVES, steers each mower at its nearest target, separates, animates.
   * targets[0] is the local player; the rest are other gnomes (bots). Returns the mowers that died since the last call.
   */
  update(dt: number, elapsedS: number, targets: readonly THREE.Vector3[], obstacles: readonly Obstacle[], onMow: (x: number, z: number) => void): MowerKill[];
  enemies(): readonly EnemyView[];
  /** by is copied into the MowerKill if this hit kills. In puppet mode only the hit flash happens. */
  damage(id: number, amount: number, by?: number): void;
  slow(id: number, factor: number, seconds: number): void;
  /** Spawns `count` combines near the player with hp x hpMult. */
  spawnBoss(count: number, hpMult: number): void;
  /** Combined hp of all living combines, else null. */
  bossHp(): { hp: number; max: number; count: number } | null;
  /** Speed, hp and spawn-rate multipliers for regular mowers (solo levels). */
  setDifficulty(d: MowerDifficulty): void;
  /** No new regular spawns for this many seconds. */
  holdSpawns(seconds: number): void;
  reset(): void;
  /** Headlights for every mower, including ones spawned later. */
  setNight(night01: number): void;
  /** Online host: every living mower, compact, numbers rounded to 2 decimals. */
  snapshot(): MowerSnap[];
  /**
   * Online client: true = mowers only follow applySnapshot. update() then does no spawning, AI, leash or kills
   * (always returns []), only moves models toward the latest snapshot, animates and calls onMow. reset() sets it back to false.
   */
  setPuppet(on: boolean): void;
  /** Puppet mode: the authoritative list. New ids appear, listed ids move there smoothly, missing ids die (shrink and spin). */
  applySnapshot(list: readonly MowerSnap[]): void;
}

export interface MowerModel {
  /** 0 = day (headlights off) .. 1 = night (headlights fully on). */
  setNight(night01: number): void;
  group: THREE.Group;           // built facing +z, base at y = 0
  setFlash(on: boolean): void;  // white hit flash
  animate(dt: number, speed: number): void; // wheels, reels, vibration
}

export interface WeaponContext {
  dt: number;
  player: THREE.Vector3;   // feet
  facing: number;
  enemies: readonly EnemyView[];
  stats: PlayerStats;      // use stats.damageMult and stats.cooldownMult
  damage(id: number, amount: number): void;
  slow(id: number, factor: number, seconds: number): void;
  playSfx(name: SfxName): void;
}

export interface Weapon {
  readonly id: WeaponId;
  setLevel(level: number): void; // 1..5
  update(ctx: WeaponContext): void;
  /** Removes everything it added to the scene. */
  dispose(): void;
}

export type WeaponFactory = (scene: THREE.Scene) => Weapon;

export interface DropSystem {
  spawnXp(x: number, z: number, amount: number): void;
  /** Sets every existing drop flying to the player, wherever it is (the Shop-Vac item). */
  vacuum(): void;
  spawnAcorns(x: number, z: number, count: number): void;
  /** Animates, magnets and collects drops. Returns what was collected this frame. */
  update(dt: number, playerFeet: THREE.Vector3, magnetRadius: number): { xp: number; acorns: number };
  reset(): void;
}

export interface LobbyStage {
  setVisible(visible: boolean): void;
  update(dt: number): void;
}

export type GameMode = 'solo' | 'royale';

export interface LobbyCallbacks {
  /** level: 1-based solo level (ignored for royale). */
  onPlay(mode: GameMode, level: number): void;
  onBuy(id: MetaUpgradeId): void;
  onVisualMode(mode: VisualMode): void;
  onSelectCharacter(id: CharacterId): void;
  /** ONLINE mode's play button. code null = public matchmaking, else an upper-cased room code. */
  onFindMatch(code: string | null): void;
  /** Cancel button while searching. */
  onLeaveMatch(): void;
  /** The name field changed to a name that passed checkName(); the argument is the cleaned name. */
  onSetName(name: string): void;
}

export interface LobbyUI {
  show(save: MetaSave): void;
  refresh(save: MetaSave): void;
  hide(): void;
  /** Highlights the current visual mode in the toggle. */
  setVisualMode(mode: VisualMode): void;
  /** Highlights the selected character card. */
  setCharacter(id: CharacterId): void;
  /** Online matchmaking status. text null = not searching (play button back to normal); else show it with a CANCEL button. */
  setMatchStatus(text: string | null): void;
}

// =====================================================================
// World items (rare pickups) and juice
// =====================================================================

export type ItemKind = 'chicken' | 'shopVac' | 'weedKiller' | 'espresso' | 'compostBin';

export interface ItemDef {
  kind: ItemKind;
  name: string;
  toast: string;   // shown big on pickup
  color: number;   // beacon colour
  weight: number;  // spawn weight
}

export const ITEM_DEFS: Record<ItemKind, ItemDef> = {
  chicken: { kind: 'chicken', name: 'CHICKEN DINNER', toast: '+2 HEARTS. WINNER WINNER.', color: 0xffa726, weight: 4 },
  shopVac: { kind: 'shopVac', name: 'SHOP-VAC OF HOLDING', toast: 'Every dropped pellet: yours.', color: 0x42a5f5, weight: 3 },
  weedKiller: { kind: 'weedKiller', name: 'INDUSTRIAL WEED KILLER', toast: 'Everything nearby: deleted.', color: 0x76ff03, weight: 2 },
  espresso: { kind: 'espresso', name: 'TRIPLE ESPRESSO', toast: 'Unlimited sprint. Heart rate: concerning.', color: 0x8d6e63, weight: 2 },
  compostBin: { kind: 'compostBin', name: 'MYSTERY COMPOST BIN', toast: "Free level up. Don't ask what's inside.", color: 0xe040fb, weight: 1 },
};

export const CHICKEN_HEAL = 2;

export interface ItemMarker {
  readonly kind: ItemKind;
  readonly pos: THREE.Vector3;
}

export interface ItemSystem {
  /** Spawns rare items near the player, animates beacons, collects on touch. Returns the kinds collected this frame. */
  update(dt: number, playerFeet: THREE.Vector3): ItemKind[];
  /** Items currently in the world (for off-screen arrows). */
  active(): readonly ItemMarker[];
  reset(): void;
}

/** Game-feel layer: floating numbers, combo counter, celebrations, toasts, shake, item arrows. DOM overlay plus camera shake. */
export interface Juice {
  damageNumber(x: number, y: number, z: number, amount: number): void;
  kill(x: number, z: number): void;
  hurt(): void;
  levelUp(level: number): void;
  toast(title: string, sub: string, color: string): void;
  shake(strength: number): void;
  /** Call once per frame after the camera has been placed: projects floating text, draws edge arrows to `markers`, adds shake to camera.position. */
  update(dt: number, camera: THREE.PerspectiveCamera, markers: readonly ItemMarker[]): void;
  reset(): void;
}

// =====================================================================
// Battle royale: bots now, networked players later (docs/design/multiplayer-royale.md)
// =====================================================================

/** Any gnome in the match, local, bot or (later) remote. */
export interface Contestant {
  readonly id: number;
  readonly name: string;
  readonly pos: THREE.Vector3;
  readonly alive: boolean;
}

export interface KillEvent {
  victim: string;
  cause: string; // e.g. 'a Red Mower (the fast one)' or 'THE MOW ZONE'
  color?: number; // victim's player colour (online); absent = default feed style
}

export interface ZoneState {
  cx: number;
  cz: number;
  radius: number;
  nextRadius: number;
  phase: 'waiting' | 'shrinking' | 'final';
  secondsToNext: number; // until the next shrink starts (waiting) or ends (shrinking)
}

export interface ZoneSystem {
  /** Advances the shrinking safe circle by the match clock. */
  update(dt: number, elapsedS: number): ZoneState;
  state(): ZoneState;
  isOutside(x: number, z: number): boolean;
  setVisible(visible: boolean): void;
  /** seed: the same seed gives the same circles on every client (online). Omitted = random. */
  reset(seed?: number): void;
}

export interface BotContext {
  elapsedS: number;
  enemies: readonly EnemyView[];
  damageEnemy(id: number, amount: number): void;
  zone: ZoneSystem;
  obstacles: readonly Obstacle[];
}

export interface BotSystem {
  /** Spawns `count` bots with generated gamertags, scattered around `center`, none within 15 of `avoid`. */
  spawn(count: number, center: THREE.Vector3, avoid: THREE.Vector3): void;
  /** Runs AI, physics, damage and death. Returns the bots that died this frame. */
  update(dt: number, ctx: BotContext): KillEvent[];
  contestants(): readonly Contestant[];
  aliveCount(): number;
  reset(): void;
}

export interface RoyaleHudData {
  alive: number;   // including the player if alive
  total: number;
  zone: ZoneState;
  playerOutside: boolean;
}

export interface RoyaleHud {
  show(): void;
  hide(): void;
  update(d: RoyaleHudData): void;
  feed(e: KillEvent): void;
}

// =====================================================================
// Feature flags and visual modes
// =====================================================================

/** 'lite' is the low-performance mode for older phones. */
export type VisualMode = 'off' | 'rtx' | 'crt' | 'lite';

export interface FeatureFlags {
  visualMode: VisualMode;
  view: CameraView;
}

export const DEFAULT_FLAGS: FeatureFlags = { visualMode: 'off', view: 'third' };
export const FLAGS_KEY = 'sample-3d.flags.v1';

export interface PostFX {
  setMode(mode: VisualMode): void;
  setSize(width: number, height: number): void;
  /** Renders one frame in the current mode (replaces renderer.render). */
  render(dt: number): void;
}

/** Things outside the lawn: sky, clouds, trees, neighbours. */
export interface Scenery {
  update(dt: number, focus: THREE.Vector3): void;
  /** Sky colours, stars, moon and cloud tint for the time of day. */
  setSky(s: DayNightState): void;
}

/** Lights in the giant house: windows glow at night. */
export interface HouseLights {
  setNight(night01: number): void;
}

// =====================================================================
// Day and night
// =====================================================================

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

export interface DayNightState {
  t: number;              // 0..1 through the cycle: 0 sunrise, 0.25 noon, 0.5 sunset, 0.75 midnight
  phase: DayPhase;
  night01: number;        // 0 = full day, 1 = full night
  lightDir: THREE.Vector3; // unit vector toward the sun by day, toward the moon by night
  lightColor: THREE.Color;
  lightIntensity: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  skyZenith: THREE.Color;
  skyHorizon: THREE.Color;
  fogColor: THREE.Color;
}

export interface DayNight {
  /** Advances the clock by dt seconds and returns the new state. */
  update(dt: number): DayNightState;
  state(): DayNightState;
  /** Jumps to a time of day (0..1). */
  setTime(t: number): void;
}

export interface HudData {
  hearts: number;
  maxHearts: number;
  stamina01: number;
  exhausted: boolean;
  xp01: number;
  level: number;
  elapsedS: number;
  kills: number;
  acorns: number;
  boss: { hp: number; max: number; count: number } | null;
  runNumber: number;
  /** e.g. 'LEVEL 2' in solo, '' otherwise. */
  levelLabel: string;
  /** Active timed buffs, e.g. Triple Espresso. */
  buffs: readonly { label: string; remaining01: number }[];
}

export interface HudUI {
  show(): void;
  hide(): void;
  update(d: HudData): void;
  /** Big centred text that fades out after `seconds`. */
  banner(title: string, sub: string, seconds: number): void;
}

export interface LevelUpUI {
  /** Shows the cards. Click a card or press 1-4 to pick; R or the button to reroll (only if rerollsLeft > 0). */
  show(choices: readonly UpgradeChoice[], rerollsLeft: number, onPick: (index: number) => void, onReroll: () => void): void;
  hide(): void;
}

/** Everything the pause screen shows about the current run. */
export interface PauseData {
  mode: GameMode;
  runNumber: number;
  elapsedS: number;
  level: number;
  xp01: number;
  hearts: number;
  maxHearts: number;
  kills: number;
  acorns: number;
  gnomesLeft: number | null; // battle royale only
  weapons: Partial<Record<WeaponId, number>>;
  passives: Partial<Record<PassiveId, number>>;
  stats: PlayerStats;
  meta: Record<MetaUpgradeId, number>;
}

export interface PauseUI {
  /** Resume: button or Esc. Quit: a button that needs a second tap to confirm. */
  show(d: PauseData, onResume: () => void, onQuit: () => void): void;
  hide(): void;
}

export interface ResultsUI {
  /** Click the button or press Space/Enter (after 0.8 s) to continue. */
  show(summary: RunSummary, onContinue: () => void): void;
  hide(): void;
}

export type GamePhase = 'lobby' | 'playing' | 'levelup' | 'paused' | 'results';

export type SfxName =
  | 'start' | 'jump' | 'pickup' | 'hit' | 'hurt'
  | 'shoot' | 'enemyHit' | 'enemyDie' | 'xp' | 'levelUp'
  | 'bossWarning' | 'buy' | 'splash' | 'boom' | 'victory';

// =====================================================================
// Online (see src/net/protocol.ts)
// =====================================================================

/** A gnome driven by the network: another player, or (on clients) one of the host's bots. */
export interface PuppetState {
  key: string;              // 'p<playerId>' for players, 'b<botId>' for bots
  name: string;
  x: number;
  y: number;
  z: number;
  facing: number | null;    // null = face the direction of movement (bots)
  alive: boolean;
  character: CharacterId | null; // null = bot: hat and shirt colours picked from a hash of the name
  color: number | null;     // player colour (PLAYER_COLORS): hat and name tag; null = default look
  look?: GnomeLook;         // a custom gnome from @lawn/gnome; wins over `character`
}

export interface PuppetSystem {
  /** Latest known state of one gnome. The first call for a key builds its model and name tag. */
  set(s: PuppetState): void;
  remove(key: string): void;
  keys(): string[];
  /** Eases every model toward its latest state (~100 ms), walks while moving, falls over when dead. */
  update(dt: number): void;
  /** Feet positions of living puppets whose key starts with prefix ('p' = players). The vectors are live; do not mutate. */
  living(prefix: string): THREE.Vector3[];
  /** Live feet position of one living puppet, or null if it is unknown or dead. Do not mutate. */
  position(key: string): THREE.Vector3 | null;
  reset(): void;
}

export interface NetClient {
  /** My player id once 'welcome' arrived, else null. */
  readonly id: number | null;
  readonly connected: boolean;
  /** Opens the socket (if not open) and sends hello. Resolves on 'welcome'; rejects if it cannot connect. */
  connect(): Promise<void>;
  queue(code: string | null, character: string, name: string): void;
  leave(): void;
  send(to: number | null, d: GameMsg): void;
  /** Sends a chat line to my queue group or match. */
  chat(text: string): void;
  /** performance.now() when the last server message arrived (0 before any). */
  readonly lastHeardAt: number;
  /** Abandons a stalled socket at once (no closing handshake); onClose listeners run immediately. connect() opens a fresh one. */
  drop(): void;
  /** Every server message, including 'welcome'. Called after connect() resolves too. */
  onMessage(fn: (m: ServerMsg) => void): void;
  /** Called once when the socket closes for any reason. */
  onClose(fn: () => void): void;
}

/** Text chat for online queues and matches (src/ui/chat.ts). */
export interface ChatUI {
  /** true: show the chat log and the CHAT button (in a queue or match). false: hide everything, close the box, clear the log. */
  setEnabled(on: boolean): void;
  readonly enabled: boolean;
  /** True while the text box is open (typing). */
  readonly isOpen: boolean;
  open(): void;
  close(): void;
  /** A player's line: name and text in their colour on a dark chip. */
  add(name: string, color: number, text: string): void;
  /** A grey italic line from the game (joins, rate-limit notices). */
  system(text: string): void;
  /** Called whenever the text box opens or closes. */
  onOpenChange(fn: (open: boolean) => void): void;
}

/** Online spectator bar (src/ui/spectate.ts), shown after my gnome dies. */
export interface SpectateCallbacks {
  onPrev(): void;
  onNext(): void;
  /** Free camera on/off. */
  onToggleFree(): void;
}

export interface SpectateBar {
  show(): void;
  hide(): void;
  /** target null = free camera. alive = gnomes still alive in the match. Cheap to call every frame (only touches the DOM on change). */
  set(target: { name: string; color: number } | null, alive: number): void;
}

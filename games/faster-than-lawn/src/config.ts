export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const SCENES = {
  boot: 'Boot',
  title: 'Title',
  map: 'Map',
  combat: 'Combat',
  event: 'Event',
  shop: 'Shop',
  gameOver: 'GameOver',
} as const;

/** Texture keys generated in BootScene. Sizes in pixels. */
export const TEX = {
  gnome: 'gnome',           // 24x32, player gnome (red hat)
  gnomeEnemy: 'gnomeEnemy', // 24x32, enemy gnome (blue hat)
  clipping: 'clipping',     // 12x6, green blaster shot
  pinecone: 'pinecone',     // 12x14, brown lobbed shot
  fire: 'fire',             // 20x20, orange flame
  spark: 'spark',           // 6x6 white square, for particles
  beacon: 'beacon',         // 28x28 circle, map beacon (tint it per kind)
} as const;

export const COLORS = {
  background: '#1b2a14',
  lawnDark: 0x2e4a1f,
  lawnLight: 0x3f6b2a,
  hullPlayer: 0xc0392b,  // red mower body
  hullEnemy: 0x2c6fbb,   // blue mower body
  room: 0x4a4a4a,
  roomStroke: 0xdddddd,
  roomHover: 0xffe082,
  roomSelected: 0x80deea,
  shield: 0x4fc3f7,
  fire: 0xff7043,
  damage: 0xe53935,
  power: 0x7cfc00,
  powerOff: 0x555555,
  text: '#f1f8e9',
  textDim: '#9e9e9e',
  accent: '#ffd54f',
  danger: '#ff5252',
  button: 0x33691e,
  buttonHover: 0x558b2f,
  buttonDisabled: 0x424242,
} as const;

/** Where ships are drawn in CombatScene. Room x/y/w/h are in tiles; pixel = origin + tile * TILE. */
export const LAYOUT = {
  tile: 64,
  playerOrigin: { x: 110, y: 180 },
  enemyOrigin: { x: 850, y: 180 },
} as const;

/** Gameplay tuning. Change these to change the feel. */
export const TUNING = {
  crewMoveMsPerTile: 450,       // walking time per tile of Manhattan distance between room top-left corners
  crewMaxHp: 100,
  crewDamagePerHit: 15,         // each crew in a hit room loses this per point of damage
  repairMsPerPoint: 4000,       // one crew repairs 1 damage point in this long
  fireDamageIntervalMs: 3000,   // a burning room damages its system by 1 this often
  fireCrewDps: 6,               // hp/s lost by crew standing in a burning room
  fireExtinguishPerCrewPerSec: 20, // fire "hp" (starts at 100) removed per crew per second
  medbayHealPerSecPerPower: 6,  // hp/s healed per powered medbay bar
  shieldRechargeMs: 2500,       // one shield layer regenerates in this long (manned: x0.8)
  evasionPerEnginePower: 0.05,  // dodge chance per engines power bar
  evasionMannedBonus: 0.05,     // extra dodge if engines manned
  evasionMax: 0.6,
  weaponMannedChargeMult: 0.9,  // charge time multiplier when weapons room is manned
  projectileTravelMs: 900,
  jumpChargeMs: 20000,          // time to charge the escape jump (needs manned pilot + powered engines)
  scrapPerWinBase: 15,
  scrapPerWinPerTier: 6,
  shopHullRepairCost: 2,        // scrap per hull point
  shopPineconeCost: 3,          // scrap per pinecone
  shopReactorCost: 30,
  shopSystemUpgradeCost: 25,    // scrap per system level
  shopHireCost: 45,
  shopMaxSystemLevel: 8,
  aiRetargetMs: 6000,
} as const;

export type SfxName = 'click' | 'fire' | 'hit' | 'shieldBlock' | 'miss' | 'jump' | 'win' | 'lose' | 'buy';

/** this.scene.start(SCENES.combat, data) */
export interface CombatSceneData {
  tier: number;     // 1..5, enemy strength
  isBoss: boolean;  // true at the exit beacon; winning it wins the run
}

/** this.scene.start(SCENES.event, data) */
export interface EventSceneData {
  eventId: string;  // id from EVENTS in src/sim/events.ts
}

/** this.scene.start(SCENES.gameOver, data) */
export interface GameOverData {
  victory: boolean;
  jumps: number;
  scrap: number;
}

export const STORAGE_KEY_BEST = 'faster-than-lawn.best';

// Fishing (docs/roadmaps/gta-fishing.md): shared types and tuning. Canon (R-021, R-049, the fishing ruling): fish are
// never hurt. A Turfton rod ends in a nibble-clip (a bent pin with no point): a fish bites the bait and holds on, the gnome
// lands it, measures it, writes a catch card and slips it back. The Bent Pin buys catch cards, not fish.
import type { TimeLabel } from '../atmosphere';
import type { RegionId } from '../levels';

export type { TimeLabel, RegionId };

/** The kind of water a bobber sits on (waterKind.ts fishWaterAt). */
export type FishWater = 'loch' | 'river' | 'canal' | 'sea';
export type FishRarity = 'common' | 'uncommon' | 'rare' | 'mythic';
/** Turfton has no real weather: pick.ts weatherAt derives it from region and time (Frostbite snow, loch dawn mist). */
export type FishWeather = 'clear' | 'mist' | 'snow';
/** How a hooked fish fights (FIGHT below). */
export type FightStyle = 'steady' | 'darter' | 'thrasher' | 'sulker' | 'runner';

export interface FishSpecies {
  id: string;
  name: string;
  rarity: FishRarity;
  /** Length range in cm [min, max]. */
  size: [number, number];
  waters: readonly FishWater[];
  /** Only in these regions (absent: any region with the right water). */
  regions?: readonly RegionId[];
  /** Weight multipliers by time of day (absent time: 1). 0 = never then. */
  times?: Partial<Record<TimeLabel, number>>;
  /** Weight multipliers by weather (absent: 1). */
  weather?: Partial<Record<FishWeather, number>>;
  /** Weight multipliers by bait id (absent: 1). */
  baits?: Partial<Record<string, number>>;
  fight: FightStyle;
  /** 1 (easy) .. 5 (hard): shorter bite window, harder pulls. */
  difficulty: number;
  /** Lowest rod tier that can land it (RodDef.tier); a weaker rod never gets its bite. */
  minRod: number;
  /** Lives only at this hot spot (FishSpot.id). */
  spot?: string;
  /** Acorns for a catch card at the middle of its size range (catchValue in species.ts). */
  value: number;
  /** @lawn/prefabs id: modelled 1 unit long, nose toward +z, centred on the origin. */
  prefab: string;
  /** One line for the journal. */
  blurb: string;
}

export interface RodDef {
  id: string;
  name: string;
  /** 0 twig .. 3 moonline. */
  tier: number;
  price: number;
  /** @lawn/prefabs id held in the right hand. */
  prefab: string;
  /** The rod tip in the prefab's own coordinates (where the line starts). */
  tip: [number, number, number];
  /** Longest cast, world units. */
  castRange: number;
  /** Line strength: tension rises this many times slower. */
  strength: number;
  /** Line reeled per second, world units. */
  reelSpeed: number;
  blurb: string;
}

export interface BaitDef {
  id: string;
  name: string;
  /** @lawn/prefabs id for its icon ('bait-' + id). */
  prefab: string;
  emoji: string;
  /** Acorns per pack (0 = free and unlimited: the dough). */
  price: number;
  /** Baits per pack. */
  pack: number;
  /** True: one is used up per landed fish or snapped line. False: a lure, kept. */
  consumed: boolean;
  /** Multiplies the wait before a bite (< 1 is quicker). */
  biteSpeed: number;
  /** Multiplies rare and mythic weights. */
  rareBonus: number;
  blurb: string;
}

/** A hot spot: bites come quicker and rarer fish come more often within FISH.spotRadius. */
export interface FishSpot {
  id: string;
  name: string;
  x: number;
  z: number;
  water: FishWater;
}

export interface FightDef {
  /** Seconds between pull bursts [min, max]. */
  every: [number, number];
  /** Burst length, seconds [min, max]. */
  burst: [number, number];
  /** Pull 0..1 at the height of a burst (before difficulty and size). */
  strength: number;
  /** Multiplies how fast the fish takes line while the gnome is not reeling. */
  run: number;
  /** Multiplies how slowly the fish tires (higher = longer fight). */
  stamina: number;
}

export const FIGHT: Record<FightStyle, FightDef> = {
  steady: { every: [1.6, 2.6], burst: [0.6, 1.0], strength: 0.55, run: 0.8, stamina: 1 },
  darter: { every: [0.8, 1.4], burst: [0.3, 0.5], strength: 0.6, run: 1.1, stamina: 0.8 },
  thrasher: { every: [1.2, 2.0], burst: [0.5, 0.8], strength: 0.85, run: 0.9, stamina: 1 },
  sulker: { every: [2.2, 3.2], burst: [1.0, 1.6], strength: 0.5, run: 0.5, stamina: 1.6 },
  runner: { every: [1.4, 2.2], burst: [1.0, 1.5], strength: 0.7, run: 1.6, stamina: 1.1 },
};

export const RARITY_WEIGHT: Record<FishRarity, number> = { common: 10, uncommon: 4, rare: 1.2, mythic: 0.5 };

export type FishPhase = 'idle' | 'charge' | 'flight' | 'wait' | 'bite' | 'reel' | 'landed' | 'lost';
/** What one sim step reports (fishing.ts turns these into sounds, toasts and a buzz). */
export type FishEvent =
  | 'cast' | 'dry' | 'plop' | 'nibble' | 'bite' | 'hooked' | 'early' | 'missed' | 'burst' | 'landed' | 'snapped' | 'slipped';

/** The whole state of one gnome's line (sim.ts). Plain data, mutated in place. */
export interface FishingState {
  phase: FishPhase;
  /** Seconds in this phase. */
  t: number;
  /** Cast power 0..1 while charging (kept after the cast). */
  charge: number;
  /** Where the cast left from (rod tip) and where it lands. */
  fromX: number; fromY: number; fromZ: number;
  toX: number; toZ: number;
  /** The water surface at the landing point. */
  surface: number;
  /** The bobber now. */
  bobX: number; bobY: number; bobZ: number;
  /** Bobber dip 0 (floating) .. 1 (pulled under). */
  dip: number;
  /** Seconds until the next bite (wait). */
  biteIn: number;
  /** Seconds until the next nibble dip (wait, inside FISH.nibbleLead). */
  nibbleT: number;
  /** The fish on the line (bite, reel, landed) and its length in cm. */
  fish: FishSpecies | null;
  size: number;
  /** Seconds left to hook (bite). */
  window: number;
  /** Line out (reel), world units, and what it was when hooked. */
  line: number;
  startLine: number;
  /** 0..1: at 1 the clip pops off ('snapped'). */
  tension: number;
  /** The fish's pull now 0..1. */
  pull: number;
  /** Seconds to the next burst (reel; < 0 while a burst runs, counting the burst down). */
  pullT: number;
  /** Seconds left in the current burst (0 = none). */
  burstT: number;
  /** 1 fresh .. 0 tired. */
  stamina: number;
  /** Seconds the line has been slack (tension < FISH.slackBelow). */
  slackT: number;
  /** Sideways wobble of the bobber while reeling, world units. */
  wobble: number;
}

/** What fishing.ts hands the sim each frame. hold/pressed/released come from the hold button, fire, A or Space. */
export interface SimInput {
  hold: boolean;
  /** Hold went down this frame. */
  pressed: boolean;
  /** Hold went up this frame. */
  released: boolean;
}

export interface SimEnv {
  rod: RodDef;
  bait: BaitDef;
  /** Rod tip now (cast origin and the line's near end) and the cast direction (yaw: 0 = +z, PI/2 = +x). Mutated by the caller. */
  origin: { x: number; y: number; z: number; yaw: number };
  /** The water surface height at (x, z), or null on land. */
  water(x: number, z: number): number | null;
  /** Seconds to wait for the next bite at the bobber (pick.ts biteDelay). */
  biteDelay(): number;
  /** Who bites now at the bobber (pick.ts pickFish + rollSize), or null for nobody. Called once per bite. */
  pick(): { fish: FishSpecies; size: number } | null;
  rnd(): number;
}

/** Tuning. Times in seconds, distances in world units (1 = a gnome's height). */
export const FISH = {
  /** Shortest cast; a cast lands at minCast + charge * (castRange - minCast). */
  minCast: 3,
  /** Seconds of holding to reach full charge. */
  chargeTime: 1.1,
  /** Bobber flight time and arc height. */
  flightTime: 0.7,
  arc: 2.2,
  /** Wait before a bite, before bait and hot spot multipliers [min, max]. */
  biteMin: 3,
  biteMax: 9,
  /** Nibbles (small dips) start this long before the bite, every ~0.5 s. */
  nibbleLead: 1.6,
  /** Seconds to hook a bite at difficulty 0 (window = biteWindow * (1.15 - 0.1 * difficulty)). */
  biteWindow: 1.2,
  /** Landed when the line is this short. */
  landDist: 1.2,
  /** Tension per second while reeling: tensionRise * (0.4 + pull * 1.6) / rod.strength. */
  tensionRise: 0.5,
  /** Tension lost per second while not reeling. */
  tensionFall: 0.55,
  /** Tension when the fish is hooked. */
  hookTension: 0.35,
  /** Slack below this tension for slackLimit seconds: the fish slips the clip. */
  slackBelow: 0.06,
  slackLimit: 1.6,
  /** Line the fish takes per second at full pull while not reeling (times FIGHT.run). */
  runSpeed: 2.2,
  /** Stamina lost per second at full effort (divided by FIGHT.stamina). */
  tire: 0.12,
  /** The fish escapes ('slipped') when the line passes rod.castRange * maxLineMul. */
  maxLineMul: 1.6,
  /** Pull between bursts. */
  restPull: 0.1,
  /** Hot spot: bite wait multiplier, and rare/mythic weight multiplier. */
  hotspotBite: 0.6,
  hotspotRare: 2.5,
  spotRadius: 7,
  /** Hot-spot markers show within this range, at most maxSpotsShown at once. */
  spotShowRange: 70,
  maxSpotsShown: 4,
  /** On foot: water within this range shows the fishing button. */
  nearWater: 9,
  /** In a boat: fishing needs |speed| below this. */
  boatMaxSpeed: 0.6,
  /** Catch cards carried before you must sell. */
  cardCap: 30,
  /** Landed fish length in world units per cm (a 50 cm trout is 0.6 units: half a gnome). */
  unitsPerCm: 0.012,
  /** Seconds the landed fish is shown before it is let go, and a lost line's message stays. */
  landedShow: 2.4,
  lostShow: 1.4,
  /** The Bent Pin Derby: seconds, total length to win (cm), entry fee and prize (Acorns). */
  derbySeconds: 180,
  derbyTarget: 150,
  derbyFee: 10,
  derbyPrize: 120,
  /** Re-check whether the player can fish (water near) this often, seconds. */
  probeEvery: 0.25,
} as const;

/** The Bent Pin, bait & tackle on the Southern Drainage Canal's south bank by Old Brick wharf. Faces the canal (-z). */
export const SHOP = {
  x: -110,
  z: 252,
  /** PI: the front faces -z (the canal). */
  yaw: Math.PI,
  name: 'The Bent Pin',
  keeper: 'Wenna Gudgeon',
  blip: '#3f8fb0',
} as const;

/** Achievement ids (packages/achievements/src/catalog.ts). */
export const FISH_ACHIEVEMENTS = {
  /** Land your first fish. */
  firstBite: 'gta-first-bite',
  /** Sell 25 catch cards (target 25). */
  cardSharp: 'gta-card-sharp',
  /** Land every species. */
  everyFin: 'gta-every-fin',
  /** Land Old Mossjaw. */
  mossjaw: 'gta-old-mossjaw',
  /** Win the Bent Pin Derby. */
  derby: 'gta-derby-day',
} as const;

/** Every procedural sound fishing registers (sounds.ts). */
export const FISH_SOUND_IDS = [
  'fish-cast', 'fish-plop', 'fish-nibble', 'fish-bite', 'fish-reel', 'fish-splash', 'fish-land', 'fish-snap', 'fish-sell',
] as const;
export type FishSoundId = (typeof FISH_SOUND_IDS)[number];

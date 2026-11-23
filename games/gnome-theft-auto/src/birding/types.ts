// Birding (docs/roadmaps/gta-birding.md): every shared type, the tuning, the hide, the optics and the milestones.
// Pure data: no three.js, no DOM. Birds are never harmed in Turfton (R-021, R-049): birding is watching, listening,
// and now and then a photograph. Every other file in src/birding/ imports its contracts from here.
import type { TimeLabel } from '../atmosphere';
import type { RegionId } from '../levels';

export type { TimeLabel } from '../atmosphere';
export type { RegionId } from '../levels';

/** How often a species turns up: the base spawn weight is RARITY_WEIGHT[rarity]. */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic';
/** Field-guide family, for the journal and the achievements (all 'owl' species = Night Owl). */
export type BirdGroup = 'city' | 'songbird' | 'wader' | 'raptor' | 'owl' | 'seabird' | 'waterfowl' | 'exotic' | 'comical' | 'mythic';
/** The wind of the moment (spawner.ts windAt): some birds like it still, some like it gusty. Shown on the birding HUD. */
export type Wind = 'calm' | 'breezy' | 'blustery';

/**
 * How a species flies (flock.ts):
 * - flap: steady wingbeats.
 * - bound: a finch's undulation, flap bursts and folded dips.
 * - glide: a few beats, then a long glide (herons, owls).
 * - soar: circles on still wings (raptors, gulls).
 * - hover: hangs in the air beating fast (kestrel, skylark).
 * - runner: never flies; runs away along the ground when flushed (roadrunner, dodo).
 * - swim: sits on water; when flushed it patters up and flies low and flapping.
 */
export type FlightStyle = 'flap' | 'bound' | 'glide' | 'soar' | 'hover' | 'runner' | 'swim';
/** Where a bird settles (perches.ts). roof, fence and tree come from world.boxes tops; ground, water and shore are sampled. */
export type PerchKind = 'roof' | 'fence' | 'tree' | 'ground' | 'water' | 'shore';

/** The synth voice of a call (sounds.ts recipeFor). */
export type CallKind = 'whistle' | 'trill' | 'chirp' | 'warble' | 'coo' | 'hoot' | 'screech' | 'kek' | 'quack' | 'honk' | 'croak' | 'chime';

/** One species' call as data: sounds.ts turns it into a world-sound recipe registered as birdSoundId(species.id). */
export interface CallRecipe {
  kind: CallKind;
  /** Base pitch of each note, Hz. */
  hz: number;
  /** Pitch at the end of each note as a multiple of hz (1 = flat, 1.5 = rising, 0.7 = falling). */
  slide: number;
  /** Notes per call, 1..12. */
  notes: number;
  /** Seconds each note lasts. */
  note: number;
  /** Seconds between note starts (>= note for separate notes). */
  gap: number;
}

export interface BirdSpecies {
  /** Unique, kebab-case. The world-sound id of its call is birdSoundId(id). */
  id: string;
  name: string;
  group: BirdGroup;
  rarity: Rarity;
  /** Spawn weight multiplier per region; a region not listed = 0 (never there). */
  regions: Readonly<Partial<Record<RegionId, number>>>;
  /** Spawn weight multiplier per time of day; a label not listed = 0 (use the DAY/NIGHT/TWILIGHT/ALWAYS presets). */
  time: Readonly<Partial<Record<TimeLabel, number>>>;
  /** Spawn weight multiplier per wind (use the WIND_ANY/WIND_STILL/WIND_GUSTY presets). */
  wind: Readonly<Record<Wind, number>>;
  /** @lawn/prefabs id: a bird body plan (pivots wing-0, wing-1 only; forward +z; see packages/prefabs catalog gta-birds.ts). */
  prefab: string;
  /** Body colour (the prefab's tint) and wing colour (its trim), 0xRRGGBB. */
  tint: number;
  trim: number;
  /** Scale applied to the prefab (the body plans are about 0.5 units long at scale 1). */
  scale: number;
  /** Body length in world units (1 = a gnome's height): how far off it can be made out (spotting range). */
  size: number;
  flight: FlightStyle;
  /** Flying (or running) speed, units/s. */
  speed: number;
  /** Cruising height above the ground while flying, units. */
  altitude: number;
  /** Where it settles, most liked first. */
  perches: readonly PerchKind[];
  /** Flock size, [min, max] inclusive. */
  flock: readonly [number, number];
  /** Flushes from a walking gnome within this many units (still: half; running: 1.5x). */
  shy: number;
  call: CallRecipe;
  /** Seconds between two calls of one flock, [min, max]. */
  callEvery: readonly [number, number];
  /** Background bird: spawns more often and sometimes as a high circling sky flock. */
  ambient?: boolean;
  /** Journal line before it is seen (where and when to look). */
  hint: string;
  /** Journal line once seen. */
  blurb: string;
}

// ---- Presets for the species table ------------------------------------------------------------------------------

export const DAY: Readonly<Partial<Record<TimeLabel, number>>> = { Dawn: 0.6, Morning: 1, Noon: 1, 'Golden Hour': 1, Dusk: 0.4 };
export const NIGHT: Readonly<Partial<Record<TimeLabel, number>>> = { Dusk: 0.6, 'Neon Night': 1, Dawn: 0.5 };
export const TWILIGHT: Readonly<Partial<Record<TimeLabel, number>>> = { Dawn: 1, 'Golden Hour': 0.8, Dusk: 1, Morning: 0.3 };
export const ALWAYS: Readonly<Partial<Record<TimeLabel, number>>> = { Dawn: 1, Morning: 1, Noon: 1, 'Golden Hour': 1, Dusk: 1, 'Neon Night': 1 };
export const WIND_ANY: Readonly<Record<Wind, number>> = { calm: 1, breezy: 1, blustery: 1 };
export const WIND_STILL: Readonly<Record<Wind, number>> = { calm: 1.6, breezy: 1, blustery: 0.3 };
export const WIND_GUSTY: Readonly<Record<Wind, number>> = { calm: 0.4, breezy: 1, blustery: 2 };

export const RARITY_WEIGHT: Readonly<Record<Rarity, number>> = { common: 10, uncommon: 4, rare: 1, mythic: 0.15 };
/** Acorns for the first sighting of a species, by rarity. */
export const NEW_SPECIES_ACORNS: Readonly<Record<Rarity, number>> = { common: 10, uncommon: 20, rare: 40, mythic: 100 };

/** The world-sound id (sound/bus.ts registerSound) of a species' call. */
export function birdSoundId(speciesId: string): string {
  return `bird-${speciesId}`;
}

/** Extra birding sounds registered by sounds.ts. */
export const BIRD_SFX = {
  /** A clatter of small wings: a flock flushing. */
  flush: 'bird-flush',
  /** The camera shutter in the scope. */
  shutter: 'bird-shutter',
  /** A bright two-note chime: a new species on the life list. */
  tick: 'bird-tick',
} as const;

// ---- Simulation (flock.ts) --------------------------------------------------------------------------------------

export type FlockMode = 'perched' | 'flying' | 'circling' | 'swimming' | 'running';

/** One bird. flock.ts writes the pose every step; birdView.ts draws it. Forward is +z at yaw 0. */
export interface Bird {
  readonly id: number;
  readonly species: BirdSpecies;
  x: number; y: number; z: number;
  yaw: number;
  /** Nose up (negative) / down (positive), radians. */
  pitch: number;
  /** Roll, radians (positive = right wing down). */
  bank: number;
  /** Wing rotation, radians: 0 = spread flat, + = tips up, -1.35 = folded against the body. */
  wingAngle: number;
  /** Flap phase, radians (free running). */
  phase: number;
  /** Offset from the flock centre in the flock's frame (x right, y up, z forward), units. */
  slotX: number; slotY: number; slotZ: number;
  /** Its own perch while the flock is settled. */
  perchX: number; perchY: number; perchZ: number;
  /** 0..1, fixed per bird: desynchronises flaps, hops and wobble. */
  seed: number;
}

export interface Flock {
  readonly id: number;
  readonly species: BirdSpecies;
  readonly members: Bird[];
  mode: FlockMode;
  /** Seconds left in the current mode ('flying' ends on arrival instead). */
  modeT: number;
  /** Centre. */
  x: number; y: number; z: number;
  /** Heading of the centre, radians (yaw convention: 0 = +z). */
  heading: number;
  /** Where the flock is going (flying) or circles round (circling). */
  tx: number; ty: number; tz: number;
  /** The perch kind it is going to settle on. */
  targetKind: PerchKind;
  /** Where it roams round. */
  homeX: number; homeZ: number;
  /** Seconds to the next call. */
  callT: number;
  /** Seconds since it last flushed (big while calm). */
  sinceFlush: number;
  /** Accumulated dt for throttled (far) stepping; birding.ts owns it. */
  acc: number;
}

/** A spot to settle on. */
export interface PerchSpot { x: number; y: number; z: number; kind: PerchKind }

/** Where things are (birding.ts wires terrain, water and the perch index in). */
export interface FlockEnv {
  /** Ground height. */
  ground(x: number, z: number): number;
  /** Water surface height at (x, z), or null on dry land. */
  water(x: number, z: number): number | null;
  /** Writes a perch of one of `kinds` (tried in order) within `radius` of (x, z) into `out`; false when none. */
  perch(kinds: readonly PerchKind[], x: number, z: number, radius: number, out: PerchSpot): boolean;
  /** 0..1. */
  rnd(): number;
}

/** Something fast that flushes birds: a vehicle. */
export interface Threat { x: number; z: number; speed: number }

/** What a flock sees each step. */
export interface FlockFrame {
  dt: number;
  /** Seconds since start. */
  time: number;
  playerX: number;
  playerZ: number;
  /** The gnome is on foot (a gnome in a vehicle counts as a Threat instead). */
  onFoot: boolean;
  /** Speed on foot, units/s. */
  footSpeed: number;
  /** Vehicles near the player (the player's own included when driving). */
  threats: readonly Threat[];
  /** A gun went off at the player this frame. */
  shot: boolean;
  /** Looking through the scope: the gnome is still and quiet (flush distance x0.5 on top of standing still). */
  viewing: boolean;
}

// ---- Scope (scope.ts) --------------------------------------------------------------------------------------------

export interface ScopeFrame {
  dt: number;
  /** On foot, not in a menu, cutscene, vehicle or fall: the scope may be up. False lowers it. */
  canView: boolean;
  /** Look deltas this frame (the game input's camYaw / camPitch, radians). */
  lookYaw: number;
  lookPitch: number;
  /** The chase camera's yaw and pitch: where the scope starts pointing when raised. */
  camYaw: number;
  camPitch: number;
  /** Zoom steps of the optics owned (OPTICS[i].zooms). */
  zooms: readonly number[];
}

// ---- Save (birdSave.ts) ------------------------------------------------------------------------------------------

export interface BirdSighting {
  /** ISO date (YYYY-MM-DD) of the first sighting. */
  first: string;
  /** Times spotted. */
  count: number;
}

export interface BirdSaveData {
  v: 1;
  seen: Record<string, BirdSighting>;
  /** Species heard (a call within BIRDING.hearRange), seen or not. Sorted. */
  heard: string[];
  /** Species photographed through the scope. Sorted. */
  photos: string[];
  /** Milestones paid out (an index into MILESTONES: the first `claimed` are paid). */
  claimed: number;
  /** Best optics owned (an index into OPTICS). */
  optics: number;
}

/** A life-list milestone, paid by the hide keeper. count 0 = every species in the table. */
export interface Milestone { count: number; acorns: number; label: string }

export const MILESTONES: readonly Milestone[] = [
  { count: 5, acorns: 50, label: 'Five on the list' },
  { count: 10, acorns: 120, label: 'Ten on the list' },
  { count: 15, acorns: 200, label: 'Fifteen on the list' },
  { count: 20, acorns: 300, label: 'Twenty on the list' },
  { count: 25, acorns: 450, label: 'Twenty-five on the list' },
  { count: 0, acorns: 800, label: 'The full life list' },
];

/** Optics sold at the hide. The gnome starts with OPTICS[0]. */
export interface Optics { name: string; price: number; zooms: readonly number[]; blurb: string }

export const OPTICS: readonly Optics[] = [
  { name: 'Pocket Binoculars', price: 0, zooms: [2, 4], blurb: 'Small, scuffed and always in a pocket.' },
  { name: 'Field Glasses', price: 250, zooms: [2, 4, 7], blurb: 'Brass, heavy, and sharp to the far hedge.' },
  { name: 'Reedwatch Scope', price: 600, zooms: [2, 5, 10], blurb: 'The hide\'s own long glass. Counts the feathers on a gull across the loch.' },
];

// ---- Places, tuning, achievements -------------------------------------------------------------------------------

/** The Reedwatch Hide on the south shore of Loch Moss: a wooden bird hide whose viewing slot faces the loch (-z). */
export const HIDE = {
  x: -630,
  z: -546,
  /** Yaw of the hide prefab: its front (the viewing slot, +z in the prefab) turned to face -z, the loch. */
  yaw: Math.PI,
  /** reedwatch-hide prefab scale. */
  scale: 2.5,
  name: 'The Reedwatch Hide',
  keeper: 'Dunnock Pell',
  blip: '#5a9a8a',
} as const;

/** Tuning. Distances in world units (1 = a gnome's height), times in seconds. */
export const BIRDING = {
  /** Most birds alive at once (desktop / coarse-pointer phones). */
  maxBirds: 48,
  maxBirdsPhone: 28,
  /** Most flocks alive at once. */
  maxFlocks: 12,
  /** Seconds between spawn attempts. */
  spawnEvery: 1.2,
  /** New flocks appear this far from the player. */
  spawnMin: 45,
  spawnMax: 120,
  /** Flocks whose centre is farther than this from the player are removed. */
  despawnRadius: 180,
  /** Flocks within this of the player step every frame; farther ones every `farEvery` frames (with the summed dt). */
  nearRadius: 70,
  farEvery: 3,
  /** Calls are played within this distance. */
  callRadius: 90,
  /** A call within this distance puts the species on the heard list. */
  hearRange: 45,
  /** A vehicle this fast flushes birds within 2x their shy distance. */
  flushVehicleSpeed: 6,
  /** A gunshot flushes every settled flock within this distance of the player. */
  shotFlush: 45,
  /** A bird can be made out through the scope out to (spotBase + size * spotPerSize) * zoom, capped at spotMax. */
  spotBase: 18,
  spotPerSize: 40,
  spotMax: 170,
  /** A bird counts as in view when within this fraction of the half-FOV from the centre. */
  viewCone: 0.8,
  /** And as centred (for a photo) within this fraction. */
  photoCone: 0.35,
  /** Seconds a species must stay in view to be spotted. */
  spotSeconds: 0.8,
  /** Acorns for the first photo of a species. */
  photoAcorns: 5,
  /** A press of the scope key or button shorter than this latches the scope up (tap = toggle, hold = while held). */
  tapSeconds: 0.25,
  /** Eye height above the gnome's feet, and how far ahead of the eye the scope camera sits. */
  eyeHeight: 0.85,
  eyeForward: 0.45,
  /** Scope pitch limits, radians (positive = looking down, like the chase camera). */
  pitchMin: -1.2,
  pitchMax: 0.9,
} as const;

/** Achievement ids (packages/achievements/src/catalog.ts). */
export const BIRD_ACHIEVEMENTS = {
  /** Spot your first species. */
  firstTick: 'gta-first-tick',
  /** Spot 10 species (target 10, incremented once per new species). */
  lifeList10: 'gta-life-list-10',
  /** Spot every species. */
  fullList: 'gta-full-life-list',
  /** Spot every owl (group 'owl'). */
  nightOwl: 'gta-night-owl',
  /** Spot a mythic bird (group 'mythic'). */
  mythic: 'gta-mythic-sighting',
  /** Photograph 10 species (target 10, incremented once per new species photographed). */
  photographer: 'gta-bird-photographer',
} as const;

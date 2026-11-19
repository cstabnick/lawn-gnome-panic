// Gnome Theft Auto: every tuning number, layout constant and name list. Tweak here, not in gameplay code.
import type { GnomeLook } from '@lawn/gnome';
import type { BiomeId, GunKind, VehicleKind, VehicleSpec } from './types';
export type { BiomeId };

export const GAME_ID = 'gnome-theft-auto';

// ---- World layout ------------------------------------------------------------------------------------------------
// Turfton (the city) is a grid in the middle. Four biomes fill the rest, split along the diagonals, joined to the city
// by winding highways. The ground is flat everywhere (y = 0); biomes differ by colour, props, roads and landmarks.
/** Playable area is x, z in [-WORLD_HALF, WORLD_HALF]. */
export const WORLD_HALF = 600;
/** Turfton is the square |x| <= CITY_HALF and |z| <= CITY_HALF. */
export const CITY_HALF = 215;
/** City road centre lines run along x = each value and along z = each value (a grid, 60 apart). */
export const ROAD_LINES = [-180, -120, -60, 0, 60, 120, 180] as const;
export const ROAD_WIDTH = 10;
/** Sidewalk strip on each side of a road, outside the road edge. */
export const SIDEWALK_WIDTH = 2.5;
export const LANE_OFFSET = 2.5;
/** Spacing between the grid roads. */
export const ROAD_PITCH = 60;

/**
 * city: the grid. desert (east): Fort Sandpit and the airfield. forest (west). tundra (north). farmland (south).
 * Outside the city square the dominant axis picks the biome: |x| >= |z| is desert/forest, else tundra/farmland.
 */
export const BIOMES: readonly BiomeId[] = ['city', 'desert', 'forest', 'tundra', 'farmland'];
export const BIOME_NAMES: Record<BiomeId, string> = {
  city: 'Turfton', desert: 'The Dust Flats', forest: 'Mossy Wood', tundra: 'Frostbite Fells', farmland: 'Cloverfield Farms',
};
export function biomeAt(x: number, z: number): BiomeId {
  if (Math.abs(x) <= CITY_HALF && Math.abs(z) <= CITY_HALF) return 'city';
  if (Math.abs(x) >= Math.abs(z)) return x > 0 ? 'desert' : 'forest';
  return z < 0 ? 'tundra' : 'farmland';
}
/** Ground colour of each biome (the city is grass between its blocks). */
export const BIOME_GROUND: Record<BiomeId, number> = {
  city: 0x5fae4a, desert: 0xd9b87a, forest: 0x2f6b3a, tundra: 0xe8f0f5, farmland: 0x8fc24f,
};

/**
 * Highways: polylines of [x, z] points. Drivable road (ROAD_WIDTH wide). A road node sits at every vertex and at least
 * every 40 units along a leg; polylines that share an exact vertex share its node. A highway that starts at a city
 * grid crossing, e.g. [180, 0] or [0, -180], joins the grid there.
 */
export interface Highway { id: string; points: [number, number][] }
export const HIGHWAYS: readonly Highway[] = [
  { id: 'east', points: [[180, 0], [250, 0], [300, 40], [374, 70], [450, 70], [520, 30], [570, 30]] },
  { id: 'fort-gate', points: [[374, 70], [374, 34]] },
  { id: 'airfield-spur', points: [[450, 70], [450, -70], [500, -70]] },
  { id: 'west', points: [[-180, 0], [-250, -20], [-320, 20], [-400, 0], [-470, -30], [-570, -30]] },
  { id: 'north', points: [[0, -180], [0, -260], [40, -330], [0, -400], [-40, -470], [-20, -570]] },
  { id: 'south', points: [[0, 180], [0, 260], [-40, 320], [10, 390], [60, 450], [40, 570]] },
];

/** Fort Sandpit sits in the desert. The gate is a gap in the north wall (z = maxZ), on the fort-gate highway. */
export const BASE = {
  minX: 340, maxX: 408, minZ: -34, maxZ: 34,
  gateX: 374, gateZ: 34, gateWidth: 10,
  padX: 358, padZ: -8,
  wallHeight: 3,
  guardPosts: [
    { x: 368, z: 30 }, { x: 380, z: 30 }, { x: 348, z: 6 }, { x: 392, z: -18 }, { x: 350, z: -24 },
  ],
} as const;

/** The desert airfield: a runway along +x (plane yaw PI/2 faces +x) and an apron with the planes parked on it. */
export const AIRFIELD = {
  x: 480, z: -110, yaw: Math.PI / 2, length: 170, width: 18,
  planeSpots: [
    { x: 415, z: -92, yaw: Math.PI / 2, kind: 'plane' as VehicleKind },
    { x: 440, z: -92, yaw: Math.PI / 2, kind: 'plane' as VehicleKind },
  ],
} as const;

export const SPAWN = { x: -6.25, z: 14, yaw: 0 } as const;

/** Fog and camera range. Fog hides the far edge of the loaded world; flyers see further. */
export const VIEW = { fogNear: 150, fogFar: 420, cameraFar: 700 } as const;

/** City buildings: downtown (within DOWNTOWN_RADIUS of the origin) gets towers, the rest bigger garden buildings. */
export const BUILDINGS = {
  downtownRadius: 130,
  towerMinHeight: 24, towerMaxHeight: 78,
  towerMinFootprint: 22, towerMaxFootprint: 36,
  /** Garden-object buildings outside downtown are drawn at this footprint range. */
  gardenMinFootprint: 16, gardenMaxFootprint: 30,
} as const;

// ---- Colours ---------------------------------------------------------------------------------------------------
export const COLORS = {
  sky: 0x8fd0f2,
  grass: 0x5fae4a,
  road: 0x55555b,
  roadLine: 0xf2e7a6,
  sidewalk: 0xc9bfa8,
  sand: 0xe5cf8e,
  baseWall: 0x8a7a55,
} as const;

// ---- Player on foot ---------------------------------------------------------------------------------------------
export const PLAYER = {
  walkSpeed: 6,
  jumpSpeed: 6.5,
  gravity: 20,
  radius: 0.4,
  /** How close (units, centre to centre) a vehicle must be to get in. */
  enterRange: 3.2,
} as const;

/** Look used when the player never made a gnome in the creator. */
export const DEFAULT_LOOK: GnomeLook = {
  hat: 0xd93636, shirt: 0x2f8a4a, pants: 0x4b3a2a, skin: 0xf1c27d, boots: 0x222222, beard: 0xf4f4f4,
  hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
};

// ---- Vehicles ---------------------------------------------------------------------------------------------------
export const VEHICLES: Record<VehicleKind, VehicleSpec> = {
  'push-bike': {
    kind: 'push-bike', name: 'Push-Mower Bike', prefab: 'push-mower-bike', scale: 1.6,
    maxSpeed: 16, accel: 14, turnRate: 2.8, radius: 0.9, seat: [0, 0.3, -0.6], flies: false, mass: 1,
  },
  'ride-on': {
    kind: 'ride-on', name: 'Ride-On Mower', prefab: 'ride-on-mower', scale: 1.5,
    maxSpeed: 20, accel: 10, turnRate: 2.0, radius: 1.4, seat: [0, 0.42, -0.52], flies: false, mass: 2,
  },
  'zero-turn': {
    kind: 'zero-turn', name: 'Zero-Turn Racer', prefab: 'zero-turn-mower', scale: 1.5,
    maxSpeed: 27, accel: 16, turnRate: 3.4, radius: 1.4, seat: [0, 0.45, -0.45], flies: false, mass: 2,
  },
  'combine': {
    kind: 'combine', name: 'Combine Harvester', prefab: 'combine-harvester', scale: 3,
    maxSpeed: 12, accel: 5, turnRate: 1.1, radius: 3.2, seat: [0, 3.4, 0.45], flies: false, mass: 6,
  },
  'plane': {
    kind: 'plane', name: 'Crop Duster', prefab: 'crop-duster', scale: 1.5,
    maxSpeed: 55, accel: 14, turnRate: 1.0, radius: 3, seat: [0, 0.9, 0.2], flies: true, fixedWing: true,
    stallSpeed: 22, ceiling: 300, mass: 5,
  },
  'whirligig': {
    kind: 'whirligig', name: 'The Whirligig', prefab: 'whirligig-mower', scale: 1.5,
    maxSpeed: 30, accel: 12, turnRate: 1.9, radius: 1.8, seat: [0, 0.45, -0.3], flies: true, mass: 3,
  },
};
/** Body colours a ride-on, push-bike or zero-turn may get (prefab tint). */
export const MOWER_TINTS = [0xd8342c, 0x3fa34d, 0xf2c230, 0x2f64c9, 0xf08a24, 0x8e44ad, 0xeeeeee] as const;
export const FLY = {
  climb: 9,
  /** Default ceiling, above the tallest tower. A spec's own `ceiling` overrides it. */
  ceiling: 100,
  /** Fixed-wing climb rate at full pull, units/s, once at or above stall speed. */
  planeClimb: 14,
  /** Below stall speed in the air a plane sinks at this speed, units/s, and cannot climb. */
  stallSink: 12,
  gravity: 6,
  /** Fraction of horizontal speed kept per second with no throttle. */
  drag: 0.5,
} as const;
/** Ground vehicles keep this fraction of speed per second when coasting. */
export const GROUND_DRAG = 0.35;

// ---- Traffic ----------------------------------------------------------------------------------------------------
export const TRAFFIC = {
  count: 14,
  cruise: 0.55,          // fraction of spec.maxSpeed
  kinds: ['ride-on', 'ride-on', 'ride-on', 'push-bike', 'push-bike', 'zero-turn'] as VehicleKind[],
  despawnDistance: 120,  // npc vehicles farther than this from the player are moved to a road node near the player
  stopDistance: 5,       // brake for a vehicle or the player ahead
} as const;

// ---- Pedestrians ------------------------------------------------------------------------------------------------
export const PEDESTRIANS = {
  count: 36,
  walkSpeed: 1.8,
  fleeSpeed: 6.5,
  fleeSeconds: 6,
  /** Pedestrians flee from a player vehicle closer than this that moves faster than 4 units/s. */
  vehicleScare: 6,
  /** Despawn/respawn farther than this from the player. */
  recycleDistance: 90,
} as const;

export const NPC_FIRST = [
  'Burdock', 'Sorrel', 'Yarrow', 'Clover', 'Primrose', 'Nettle', 'Hollyhock', 'Chervil', 'Lupin', 'Sedge',
  'Teasel', 'Marjoram', 'Rue', 'Comfrey', 'Lovage', 'Woodruff', 'Campion', 'Vetch', 'Mallow', 'Dill',
] as const;
export const NPC_LAST = [
  'Loamsby', 'Clodbury', 'Spadewell', 'Pebblecup', 'Mudkettle', 'Rakeham', 'Sievewright', 'Kettleby',
  'Gravelbottom', 'Hoesworth', 'Twinebarrow', 'Bucketts', 'Peatley', 'Dibbler',
] as const;
/** What a gnome says when soaked (toasted as `Name: "line"`). Dry, no gore, no pop culture. */
export const SOAK_LINES = [
  'My good coat!',
  'I was dry. I had plans.',
  'Not the hat. Anything but the hat.',
  'Hands up! Nobody squirt!',
  'That was a perfectly good beard.',
  'I will be drying for a week.',
  'Take the mower. Take anything.',
  'I am glazed, you know. It still counts.',
] as const;
export const STEAL_LINES = [
  'That is my mower!',
  'I only stopped for seed!',
  'Bring it back with the blades on!',
  'Hands up, I am getting off!',
] as const;

// ---- Guns ---------------------------------------------------------------------------------------------------------
// Real guns: hitscan bullets from the crosshair, magazines and reloads. Hits are cartoon-safe: a shot gnome puts its
// hands up and runs, an officer gives up (same reactions as before); nobody bleeds.
export interface GunSpec {
  kind: GunKind; name: string;
  /** @lawn/prefabs id of the held model (muzzle at +y, grip at the origin; see buildHeld). */
  prefab: string;
  /** Shots per second. */
  rate: number;
  /** Hold to keep firing (true) or one shot per click (false). */
  auto: boolean;
  /** Bullets per shot (shotgun pellets). */
  pellets: number;
  /** Random cone half-angle per bullet, radians. */
  spread: number;
  /** Bullets die after this many units. */
  range: number;
  /** Magazine size, and seconds to reload. */
  mag: number;
  reload: number;
  /** Camera kick per shot, radians of pitch. */
  recoil: number;
}
export const GUNS: Record<GunKind, GunSpec> = {
  pistol: { kind: 'pistol', name: 'Pistol', prefab: 'gta-pistol', rate: 4, auto: false, pellets: 1, spread: 0.008, range: 140, mag: 12, reload: 1.2, recoil: 0.012 },
  smg: { kind: 'smg', name: 'SMG', prefab: 'gta-smg', rate: 14, auto: true, pellets: 1, spread: 0.03, range: 110, mag: 30, reload: 1.6, recoil: 0.006 },
  shotgun: { kind: 'shotgun', name: 'Shotgun', prefab: 'gta-shotgun', rate: 1.2, auto: false, pellets: 8, spread: 0.07, range: 50, mag: 6, reload: 2.2, recoil: 0.05 },
  rifle: { kind: 'rifle', name: 'Rifle', prefab: 'gta-rifle', rate: 5, auto: true, pellets: 1, spread: 0.005, range: 240, mag: 20, reload: 1.8, recoil: 0.02 },
};
export const GUN_ORDER: GunKind[] = ['pistol', 'smg', 'shotgun', 'rifle'];
/** Bullet tracer and impact looks. */
export const BULLET = { tracerLife: 0.08, tracerColor: 0xffe9a8, flashLife: 0.05, stepLength: 0.3 } as const;

// ---- Parachute ----------------------------------------------------------------------------------------------------
// Bailing out of a flyer above BAIL_MIN_ALTITUDE puts the gnome in free fall; the chute opens by itself.
export const BAIL_MIN_ALTITUDE = 3;
export const CHUTE = {
  /** Seconds of free fall before the chute opens by itself (if still above minDeployAltitude). */
  deployDelay: 0.9,
  minDeployAltitude: 12,
  /** Free-fall gravity and terminal speed, units/s. */
  fallGravity: 25, terminalFall: 32,
  /** Steady descent under canopy, and the horizontal glide speed (stick steers and glides). */
  descend: 4.5, glideSpeed: 9,
  /** Canopy yaw steering rate, radians/s, and how fast the canopy opens (per second, 0..1). */
  steerRate: 2.2, openRate: 3,
  /** Landing faster than this without a canopy costs this much dryness (a splat; never fatal on its own below 1). */
  hardLandingSpeed: 14, hardLandingSoak: 0.6,
} as const;

// ---- The Hat Watch (police) and the Spade Guard (Fort Sandpit) ------------------------------------------------------
export const MAX_HEAT = 3;
export const HEAT = {
  soakPedestrian: 0.34,
  stealOccupied: 1,
  soakOfficer: 0.6,
  trespass: 2,
  stealWhirligig: 3,
  /** Heat lost per second once no officer has seen the player for `coolDelay` s. */
  coolRate: 0.08,
  coolDelay: 8,
} as const;
export const WATCH = {
  /** Officers on the street per heat level (level 1, 2, 3). */
  officersPerLevel: [0, 2, 4, 7],
  speed: 6.8,
  sprayRange: 9,
  /** Player dryness lost per second per spraying officer. */
  sprayPerSecond: 0.06,
  /** Droplet hits to make an officer or guard give up and flee. */
  soakHits: 5,
  fleeSeconds: 8,
  spawnDistance: 35,
  hat: 0x1f3a93,
  coat: 0xf2c230,
  guardHat: 0x556b2f,
  guardCoat: 0x6b7a3a,
} as const;
export const WASHED_OUT_TEXT = 'WASHED OUT';

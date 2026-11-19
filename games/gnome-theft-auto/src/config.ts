// Gnome Theft Auto: every tuning number, layout constant and name list. Tweak here, not in gameplay code.
import type { GnomeLook } from '@lawn/gnome';
import type { GunKind, VehicleKind, VehicleSpec } from './types';

export const GAME_ID = 'gnome-theft-auto';

// ---- Town layout (Turfton) -------------------------------------------------------------------------------------
/** Playable area is x, z in [-WORLD_HALF, WORLD_HALF]. */
export const WORLD_HALF = 130;
/** Road centre lines run along x = each value and along z = each value (a grid). */
export const ROAD_LINES = [-100, -50, 0, 50, 100] as const;
export const ROAD_WIDTH = 10;
/** Sidewalk strip on each side of a road, outside the road edge. */
export const SIDEWALK_WIDTH = 2.5;
export const LANE_OFFSET = 2.5;
/** Fort Sandpit fills this corner. No roads inside it except the stub that ends at the gate. */
export const BASE = {
  minX: 58, maxX: 126, minZ: -126, maxZ: -58,
  /** The gate is a gap in the north wall (z = maxZ), centred on the x = 100 road. */
  gateX: 100, gateZ: -58, gateWidth: 10,
  padX: 92, padZ: -100,
  wallHeight: 3,
  guardPosts: [
    { x: 94, z: -62 }, { x: 106, z: -62 }, { x: 80, z: -95 }, { x: 110, z: -110 }, { x: 70, z: -70 },
  ],
} as const;
export const SPAWN = { x: -6.25, z: 14, yaw: 0 } as const;

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
  'whirligig': {
    kind: 'whirligig', name: 'The Whirligig', prefab: 'whirligig-mower', scale: 1.5,
    maxSpeed: 30, accel: 12, turnRate: 1.9, radius: 1.8, seat: [0, 0.45, -0.3], flies: true, mass: 3,
  },
};
/** Body colours a ride-on, push-bike or zero-turn may get (prefab tint). */
export const MOWER_TINTS = [0xd8342c, 0x3fa34d, 0xf2c230, 0x2f64c9, 0xf08a24, 0x8e44ad, 0xeeeeee] as const;
export const FLY = {
  climb: 9,
  ceiling: 60,
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

// ---- Water guns -------------------------------------------------------------------------------------------------
export interface GunSpec {
  kind: GunKind; name: string; prefab: string;
  /** Droplets per second while firing. */
  rate: number;
  speed: number;
  /** Random cone half-angle, radians. */
  spread: number;
  /** Tank used per droplet. */
  cost: number;
  /** Droplet lifetime, s. */
  life: number;
}
export const GUNS: Record<GunKind, GunSpec> = {
  'squirt-pistol': { kind: 'squirt-pistol', name: 'Squirt Pistol', prefab: 'squirt-pistol', rate: 9, speed: 26, spread: 0.025, cost: 0.012, life: 1.1 },
  'super-soaker': { kind: 'super-soaker', name: 'Pump Soaker', prefab: 'super-soaker', rate: 22, speed: 32, spread: 0.06, cost: 0.008, life: 1.3 },
};
export const GUN_ORDER: GunKind[] = ['squirt-pistol', 'super-soaker'];
export const WATER = {
  gravity: 9,
  refillPerSecond: 0.18,
  /** Seconds without firing before the tank refills. */
  refillDelay: 0.6,
  dropRadius: 0.08,
  maxDrops: 300,
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

// Gnome Theft Auto: every tuning number, layout constant and name list. Tweak here, not in gameplay code.
import type { GnomeLook } from '@lawn/gnome';
import type { BiomeId, GunKind, MountStyle, VehicleKind, VehicleSpec } from './types';
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
  city: 0x5fae4a, desert: 0xd9b87a, forest: 0x3d8a45, tundra: 0xe8f0f5, farmland: 0x8fc24f,
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
  // The ring road: each link joins two highway vertices exactly, so the four biomes connect without going through town.
  { id: 'ring-ne', points: [[300, 40], [335, -90], [250, -230], [40, -330]] },
  { id: 'ring-nw', points: [[0, -400], [-130, -390], [-260, -320], [-340, -190], [-400, 0]] },
  { id: 'ring-sw', points: [[-320, 20], [-300, 150], [-200, 290], [-40, 320]] },
  { id: 'ring-se', points: [[60, 450], [200, 400], [320, 250], [300, 40]] },
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
/** The Mulch Club (quest giver) fills the block centred here, door facing +x (towards the road at x = 0). */
export const MULCH_CLUB = { x: -30, z: -30, footprint: 22 } as const;
/** The Glaze Clinic Hospital fills the block centred here (door facing -x, towards the road); the player wakes at `respawn`. */
export const HOSPITAL = { x: 30, z: 30, footprint: 30, respawn: { x: 7, z: 30, yaw: -Math.PI / 2 } } as const;
/** Named story storefronts and Turfton district landmarks (block-centred, clear of ROAD_LINES and SPAWN). */
export const BODEGA = { x: -90, z: 90, footprint: 18 } as const;
export const SIDE_VALVE = { x: -150, z: 90, footprint: 24, bay: { x: -150, z: 72 } } as const;
export const PAY_N_GLAZE = { x: 90, z: 150, footprint: 22, bay: { x: 90, z: 150, radius: 7 } } as const;
export const GNOMECINO = { x: 90, z: -30, footprint: 26 } as const;
export const THORNE_TOWER = { x: 30, z: -30, footprint: 30, height: 86 } as const;
export const CLAY_MART = { x: -150, z: 150, footprint: 34 } as const;
export const AMPHITHEATER = { x: -90, z: -90, footprint: 32 } as const;
export const PATIO_HEIGHTS = { minX: 125, maxX: 210, minZ: -210, maxZ: -125 } as const;
export const GREENHOUSE_STRIP = { minX: 45, maxX: 105, minZ: -55, maxZ: 55 } as const;
export const GNOMA_TRUCK = { x: 13, z: 44, yaw: 0 } as const;
export const CULVERT_PORTALS = { downtown: { x: -10, z: -10 }, canal: { x: -195, z: 195 } } as const;

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

/** Getting in, out and yanking a driver out (mount.ts). Times are seconds. Nothing drives until the sequence has finished. */
export const MOUNT = {
  /** The gnome walks to its mount point at this speed, or faster when the vehicle is moving. */
  walkSpeed: 6,
  /** Extra speed over a moving vehicle's, so a gnome can catch up with it. */
  catchUp: 3,
  /** How far the gnome stands off the vehicle's edge when it reaches for the rim or a door. */
  standOff: 0.7,
  reachSeconds: 0.35,
  /** Opening or closing a door. */
  doorSeconds: 0.4,
  /** Yanking: the driver slides out of the seat to the ground. */
  pullSeconds: 0.7,
  /** The climb takes this much longer per unit of seat height (a combine's seat is high). */
  climbPerHeight: 0.08,
  /** Settling into the seat (or onto the ground, on the way out). */
  settleSeconds: 0.25,
  /** Door panels swing this far, radians. */
  doorAngle: 1.3,
} as const;

/** How a gnome climbs: how high it lifts over the rim or through a door, and how long the climb takes (before the seat height). */
export const MOUNT_STYLES: Record<MountStyle, { arc: number; seconds: number }> = {
  vault: { arc: 1.0, seconds: 0.55 },
  hop: { arc: 0.5, seconds: 0.4 },
  clamber: { arc: 1.7, seconds: 0.9 },
  door: { arc: 0.3, seconds: 0.5 },
};

/** Look used when the player never made a gnome in the creator. */
export const DEFAULT_LOOK: GnomeLook = {
  hat: 0xd93636, shirt: 0x2f8a4a, pants: 0x4b3a2a, skin: 0xf1c27d, boots: 0x222222, beard: 0xf4f4f4,
  hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
};

// ---- Vehicles ---------------------------------------------------------------------------------------------------
// Ground vehicle top speeds and pickup are 25% above the first tuning pass (it felt slow in Casual). One place: arcade, the physics model, traffic, HUD and engine sound all read these.
export const VEHICLES: Record<VehicleKind, VehicleSpec> = {
  'push-bike': {
    kind: 'push-bike', mountStyle: 'hop', name: 'Push-Mower Bike', prefab: 'push-mower-bike', scale: 1.6,
    maxSpeed: 20, accel: 17.5, turnRate: 2.8, radius: 0.9, seat: [0, 0.3, -0.6], flies: false, mass: 1,
    passengerSeats: [[0, 0.3, -1.25]],
  },
  'ride-on': {
    kind: 'ride-on', mountStyle: 'vault', name: 'Ride-On Mower', prefab: 'ride-on-mower', scale: 1.5,
    maxSpeed: 25, accel: 12.5, turnRate: 2.0, radius: 1.4, seat: [0, 0.42, -0.52], flies: false, mass: 2,
    passengerSeats: [[0.55, 0.42, -0.52]],
  },
  'zero-turn': {
    kind: 'zero-turn', mountStyle: 'vault', name: 'Zero-Turn Racer', prefab: 'zero-turn-mower', scale: 1.5,
    maxSpeed: 34, accel: 20, turnRate: 3.4, radius: 1.4, seat: [0, 0.45, -0.45], flies: false, mass: 2,
    passengerSeats: [[-0.55, 0.45, -0.45]],
  },
  'combine': {
    kind: 'combine', mountStyle: 'clamber', name: 'Combine Harvester', prefab: 'combine-harvester', scale: 3,
    maxSpeed: 15, accel: 6.25, turnRate: 1.1, radius: 3.2, seat: [0, 3.4, 0.45], flies: false, mass: 6,
    passengerSeats: [[-1.4, 3.4, 0.45], [1.4, 3.4, 0.45], [0, 3.4, -0.9]],
  },
  'plane': {
    kind: 'plane', mountStyle: 'hop', name: 'Crop Duster', prefab: 'crop-duster', scale: 3.75,
    maxSpeed: 55, accel: 14, turnRate: 1.0, radius: 3, seat: [0, 0.9, 0.2], flies: true, fixedWing: true,
    stallSpeed: 22, ceiling: 300, mass: 5,
    passengerSeats: [[0, 0.9, -0.9]],
  },
  'whirligig': {
    kind: 'whirligig', mountStyle: 'vault', name: 'The Whirligig', prefab: 'whirligig-mower', scale: 1.5,
    maxSpeed: 30, accel: 12, turnRate: 1.9, radius: 1.8, seat: [0, 0.45, -0.3], flies: true, mass: 3,
    passengerSeats: [[0, 0.45, -1.0]],
  },
  'lowrider': {
    kind: 'lowrider', mountStyle: 'hop', name: 'Ride-On Lowrider', prefab: 'ride-on-mower', scale: 1.55,
    maxSpeed: 26, accel: 14, turnRate: 2.3, radius: 1.4, seat: [0, 0.44, -0.52], flies: false, mass: 2.2,
    passengerSeats: [[-0.6, 0.44, -0.52], [0.6, 0.44, -1.1], [-0.6, 0.44, -1.1]],
  },
  'boot-float': {
    kind: 'boot-float', mountStyle: 'clamber', name: "Gnorwin's Boot Float", prefab: 'boot-parade-float', scale: 3.2,
    maxSpeed: 13, accel: 5.5, turnRate: 1.0, radius: 3.8, seat: [0, 1.48, 2.64], flies: false, mass: 10,
    passengerSeats: [[-1.6, 1.48, 2.64], [1.6, 1.48, 2.64], [0, 1.48, 0.9], [0, 1.48, 4.2]],
  },
  'snail-coach': {
    kind: 'snail-coach', mountStyle: 'door', openTop: false, doors: [
      { side: 'right', pivot: 'door-right', at: [-1.22, 1.0, 1.96] },
    ], name: 'Snail-Coach', prefab: 'snail-coach', scale: 2.0,
    maxSpeed: 22, accel: 9.5, turnRate: 1.6, radius: 2.5, seat: [0, 1.04, 1.5], flies: false, mass: 5,
    // No passenger seats yet: the coach is a closed box, so riders inside it cannot be seen.
  },
  'mulch-spreader': {
    kind: 'mulch-spreader', mountStyle: 'vault', name: 'Mulch-Spreader Mower', prefab: 'mulch-spreader-mower', scale: 1.6,
    maxSpeed: 23, accel: 12, turnRate: 2.0, radius: 1.6, seat: [0, 0.9, 0.08], flies: false, mass: 2.6,
    passengerSeats: [[0, 0.9, -0.6]],
  },
  'hoa-van': {
    kind: 'hoa-van', mountStyle: 'door', openTop: false, doors: [
      { side: 'left', pivot: 'door-left', at: [1.04, 0.99, 1.26] },
      { side: 'right', pivot: 'door-right', at: [-1.04, 0.99, 1.26] },
    ], name: 'HOA Code-Enforcement Van', prefab: 'hoa-van', scale: 1.8,
    maxSpeed: 27, accel: 13, turnRate: 1.9, radius: 2.1, seat: [0, 0.94, 0.63], flies: false, mass: 4.5,
    // No passenger seats yet: the van is an enclosed cab, so riders inside it cannot be seen.
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
  /** Seconds a driver sits behind a blocker before pulling out around it (each driver rolls its own, so a standoff breaks). */
  patience: [1.5, 3.5] as readonly [number, number],
  /** A driver that moved less than stuckDistance in stuckSeconds is wedged: it reverses for reverseSeconds, then tries again. */
  stuckSeconds: 2.5,
  stuckDistance: 1,
  reverseSeconds: 1.4,
  /** A driver wedged this long, and at least this far from the player, is moved to a fresh road spot (never in sight). */
  giveUpSeconds: 14,
  giveUpDistance: 40,
  /** Seconds a driver stays at its destination before setting off for the next errand. */
  dwell: [3.5, 6.0] as readonly [number, number],
} as const;

/**
 * Places the NPC drivers head for. Each is a real landmark; a driver goes to the road node nearest to it, parks a little
 * short of the junction for a few seconds, then picks its next errand. `reason` finishes "I was on my way to ...".
 * `far` places are a long drive on the highways (push-bikes do not go there). `weight` is how often it is picked.
 */
export interface Place { id: string; name: string; reason: string; x: number; z: number; weight: number; far?: boolean }
export const PLACES: readonly Place[] = [
  { id: 'hospital', name: 'Glaze Clinic Hospital', reason: 'to the Glaze Clinic Hospital for a chip repair', x: HOSPITAL.x, z: HOSPITAL.z, weight: 3 },
  { id: 'mulch-club', name: 'Mulch Club', reason: 'to the Mulch Club', x: MULCH_CLUB.x, z: MULCH_CLUB.z, weight: 3 },
  { id: 'park', name: 'Turfton Park', reason: 'to the park for a picnic', x: -30, z: 30, weight: 3 },
  { id: 'downtown', name: 'Downtown', reason: 'downtown for work', x: 0, z: 0, weight: 4 },
  { id: 'high-street', name: 'the east shops', reason: 'to the shops for seed', x: 120, z: 60, weight: 3 },
  { id: 'west-end', name: 'the west end', reason: 'home to the west end', x: -120, z: -120, weight: 3 },
  { id: 'bodega', name: 'Bodega & Sons', reason: 'to Bodega & Sons for a lukewarm Acorn-Cola', x: BODEGA.x, z: BODEGA.z, weight: 2 },
  { id: 'side-valve', name: 'Side-Valve Salvage', reason: 'to Side-Valve Salvage for spare blades', x: SIDE_VALVE.x, z: SIDE_VALVE.z, weight: 2 },
  { id: 'pay-n-glaze', name: "Pay 'n' Glaze", reason: "to Pay 'n' Glaze for a fresh coat", x: PAY_N_GLAZE.x, z: PAY_N_GLAZE.z, weight: 2 },
  { id: 'gnomecino', name: 'The Gnomecino', reason: 'to The Gnomecino to test my luck', x: GNOMECINO.x, z: GNOMECINO.z, weight: 2 },
  { id: 'clay-mart', name: 'Clay-Mart', reason: 'to Clay-Mart for bulk mulch', x: CLAY_MART.x, z: CLAY_MART.z, weight: 2 },
  { id: 'patio-heights', name: 'Patio Heights', reason: 'to Patio Heights to mow a flagstone', x: 150, z: -150, weight: 1 },
  { id: 'fort-sandpit', name: 'Fort Sandpit', reason: 'to Fort Sandpit with a delivery', x: 374, z: 34, weight: 1, far: true },
  { id: 'airfield', name: 'the airfield', reason: 'to the airfield to watch the planes', x: 450, z: -70, weight: 1, far: true },
  { id: 'farms', name: 'Cloverfield Farms', reason: 'to Cloverfield Farms for clover', x: 40, z: 570, weight: 1, far: true },
  { id: 'mossy-wood', name: 'Mossy Wood', reason: 'to Mossy Wood for a walk', x: -570, z: -30, weight: 1, far: true },
  { id: 'fells', name: 'Frostbite Fells', reason: 'to Frostbite Fells to look at the snow', x: -20, z: -570, weight: 1, far: true },
];

// ---- Pedestrians ------------------------------------------------------------------------------------------------
export const PEDESTRIANS = {
  count: 22,
  walkSpeed: 1.8,
  fleeSpeed: 6.5,
  fleeSeconds: 6,
  /** Pedestrians flee from a player vehicle closer than this that moves faster than 4 units/s. */
  vehicleScare: 6,
  /** Despawn/respawn farther than this from the player. */
  recycleDistance: 90,
} as const;

/** Vehicles at or above this speed (units/s) fling the pedestrians they reach (ragdoll). */
export const RUN_OVER = { minSpeed: 6, reach: 0.9 } as const;

export const NPC_FIRST = [
  'Burdock', 'Sorrel', 'Yarrow', 'Clover', 'Primrose', 'Nettle', 'Hollyhock', 'Chervil', 'Lupin', 'Sedge',
  'Teasel', 'Marjoram', 'Rue', 'Comfrey', 'Lovage', 'Woodruff', 'Campion', 'Vetch', 'Mallow', 'Dill',
] as const;
export const NPC_LAST = [
  'Loamsby', 'Clodbury', 'Spadewell', 'Pebblecup', 'Mudkettle', 'Rakeham', 'Sievewright', 'Kettleby',
  'Gravelbottom', 'Hoesworth', 'Twinebarrow', 'Bucketts', 'Peatley', 'Dibbler',
] as const;
/** What a gnome says when a mower flings it (toasted as `Name: "line"`). Dry, no gore. */
export const RUNOVER_LINES = [
  'I have never been so airborne.',
  'Whoa. Whoa. Whoa.',
  'Mind the hat!',
  'I regret every shortcut.',
  'My boots are somewhere else now.',
  'That was my lane. Mine.',
] as const;

/** What a gnome says when it cracks apart (toasted as `Name: "line"`). Clay, no gore, no pop culture. */
export const CRACK_LINES = [
  'My good glaze!',
  'I was whole. I had plans.',
  'Not the hat. Anything but the hat.',
  'That was a perfectly good beard.',
  'Somebody fetch the glue.',
  'I am only chipped, you know. Mostly.',
  'Mind the pieces.',
  'It is only a flesh wound. I have no flesh.',
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
/** Hit points (0..1) one bullet takes off a vehicle; at 0 it explodes, charred black and burning. The pistol takes 10 shots. */
export const VEHICLE_SHOT_DAMAGE: Record<GunKind, number> = {
  pistol: 0.1,
  smg: 0.07,
  shotgun: 0.025,
  rifle: 0.15,
  'leaf-blower': 0.02,
  'acorn-mortar': 0.35,
  'tow-whip': 0.25,
  'dandelion-grenade': 0,
  'trip-mine': 0.2,
};

export const GUNS: Record<GunKind, GunSpec> = {
  pistol: { kind: 'pistol', name: 'Pistol', prefab: 'gta-pistol', rate: 4, auto: false, pellets: 1, spread: 0.008, range: 140, mag: 12, reload: 1.2, recoil: 0.012 },
  smg: { kind: 'smg', name: 'SMG', prefab: 'gta-smg', rate: 14, auto: true, pellets: 1, spread: 0.03, range: 110, mag: 30, reload: 1.6, recoil: 0.006 },
  shotgun: { kind: 'shotgun', name: 'Shotgun', prefab: 'gta-shotgun', rate: 1.2, auto: false, pellets: 8, spread: 0.07, range: 50, mag: 6, reload: 2.2, recoil: 0.05 },
  rifle: { kind: 'rifle', name: 'Rifle', prefab: 'gta-rifle', rate: 5, auto: true, pellets: 1, spread: 0.005, range: 240, mag: 20, reload: 1.8, recoil: 0.02 },
  'leaf-blower': { kind: 'leaf-blower', name: 'Leaf-Blower Cannon', prefab: 'leaf-blower-cannon', rate: 2.2, auto: true, pellets: 1, spread: 0.05, range: 16, mag: 20, reload: 1.5, recoil: 0.025 },
  'acorn-mortar': { kind: 'acorn-mortar', name: 'Acorn Mortar', prefab: 'acorn-mortar', rate: 0.9, auto: false, pellets: 1, spread: 0.01, range: 70, mag: 4, reload: 2.4, recoil: 0.06 },
  'tow-whip': { kind: 'tow-whip', name: 'Tow-Cable Whip', prefab: 'tow-cable-whip', rate: 1.8, auto: false, pellets: 1, spread: 0, range: 5, mag: 12, reload: 0.8, recoil: 0.015 },
  'dandelion-grenade': { kind: 'dandelion-grenade', name: 'Dandelion Puff-Grenade', prefab: 'dandelion-puff-grenade', rate: 0.8, auto: false, pellets: 1, spread: 0.01, range: 35, mag: 4, reload: 2.0, recoil: 0.02 },
  'trip-mine': { kind: 'trip-mine', name: 'Acorn Trip-Mine', prefab: 'acorn-trip-mine', rate: 1.0, auto: false, pellets: 1, spread: 0, range: 4, mag: 3, reload: 2.0, recoil: 0.01 },
};
export const GUN_ORDER: GunKind[] = [
  'pistol', 'smg', 'shotgun', 'rifle',
  'leaf-blower', 'acorn-mortar', 'tow-whip', 'dandelion-grenade', 'trip-mine',
];
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
  /** Landing faster than this without a canopy costs this much health (a splat; never fatal on its own below 1). */
  hardLandingSpeed: 14, hardLandingDamage: 0.6,
} as const;

// ---- The Hat Watch (police), the HOA, and the Spade Guard (Fort Sandpit) -------------------------------------------
export const MAX_HEAT = 4;
export const HEAT = {
  crackPedestrian: 0.34,
  stealOccupied: 1,
  crackOfficer: 0.6,
  trespass: 2,
  stealWhirligig: 3,
  /** Heat lost per second once no officer has seen the player for `coolDelay` s. */
  coolRate: 0.08,
  coolDelay: 8,
} as const;
export const WATCH = {
  /** Officers on the street per heat level (level 1, 2, 3, 4). */
  officersPerLevel: [0, 2, 4, 6, 8],
  speed: 6.8,
  shootRange: 9,
  /** Player health lost per second per shooting officer. */
  damagePerSecond: 0.06,
  /** Bullet hits that crack an officer or guard apart. */
  crackHits: 3,
  fleeSeconds: 8,
  spawnDistance: 35,
  hat: 0x1f3a93,
  coat: 0xf2c230,
  guardHat: 0x556b2f,
  guardCoat: 0x6b7a3a,
  hoaHat: 0x18181e,
  hoaCoat: 0xc9b99b,
  porcelainHat: 0xf4f4f8,
  porcelainCoat: 0xe6e8f0,
} as const;
export const CRACKED_TEXT = 'CRACKED';

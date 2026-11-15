// Lawn Prix: every tuning number and every shared type. Gameplay modules import from here; tweak here.
//
// Coordinates: metres, y up. Yaw/heading h: the forward vector is (sin h, 0, cos h), so h = 0 faces +z
// (the gnome model faces +z at yaw 0 too). Increasing h turns LEFT. Left of heading h is (cos h, 0, -sin h).

// ------------------------------------------------------------------ vehicles

/** Two to start. Planned: 'combine' (a combine harvester: huge, unstoppable, maxSpeed about 6; nobody will pick it). */
export type VehicleId = 'cart' | 'bike';

export interface VehicleSpec {
  id: VehicleId;
  name: string;
  /** One line for the menu card. */
  blurb: string;
  /** Top speed on the mown track, m/s. */
  maxSpeed: number;
  /** Throttle acceleration, m/s². */
  accel: number;
  /** Deceleration when braking / reversing, m/s². */
  brake: number;
  /** Yaw rate at full steer, rad/s (scaled down at low speed, see turnSpeedRef). */
  turnRate: number;
  /** How fast sideways sliding is killed, 1/s (higher = grippier). */
  grip: number;
  /** Bump weight: the lighter kart gets pushed more. */
  mass: number;
  /** Collision circle radius, m. */
  radius: number;
  /** Model scale multiplier (1 = gnome-sized mower). */
  scale: number;
}

export const VEHICLES: Record<VehicleId, VehicleSpec> = {
  cart: {
    id: 'cart', name: 'Ride-On Cart', blurb: 'Heavy ride-on mower. Higher top speed, wins every bump.',
    maxSpeed: 19, accel: 9, brake: 18, turnRate: 2.1, grip: 7, mass: 1.5, radius: 0.95, scale: 1,
  },
  bike: {
    id: 'bike', name: 'Push-Mower Bike', blurb: 'Light hand mower ridden like a bike. Quick off the line, turns tight, gets shoved.',
    maxSpeed: 17.5, accel: 13, brake: 20, turnRate: 2.8, grip: 10, mass: 0.8, radius: 0.6, scale: 0.85,
  },
};

export const VEHICLE_ORDER: readonly VehicleId[] = ['cart', 'bike'];

/** Mower paint choices, menu order. */
export const MOWER_COLORS: readonly { name: string; hex: number }[] = [
  { name: 'Mower Red', hex: 0xd8342c },
  { name: 'Deere Green', hex: 0x2f8f3a },
  { name: 'Sunny Yellow', hex: 0xf2c230 },
  { name: 'Sky Blue', hex: 0x3a8de0 },
  { name: 'Tangerine', hex: 0xf07a1e },
  { name: 'Grape', hex: 0x8a4fd0 },
  { name: 'Hot Pink', hex: 0xf05aa0 },
  { name: 'Chrome', hex: 0xc8ccd2 },
];

// ------------------------------------------------------------------ driving

export const DRIVE = {
  /** Below this speed turning is scaled down linearly (no spinning on the spot). */
  turnSpeedRef: 6,
  /** Rolling drag with no throttle, 1/s (fraction of speed lost per second). */
  coastDrag: 0.6,
  /** Reverse top speed, m/s. */
  reverseMax: 5,
  /** Off the mown track (long grass): top speed multiplier and extra drag 1/s. */
  offTrackSpeedMul: 0.45,
  offTrackDrag: 2.5,
  /** Kart-kart bounce: 0 = dead stop, 1 = perfectly elastic. */
  bumpRestitution: 0.4,
} as const;

export const DRIFT = {
  /** Hold drift while steering above this speed to start a drift. */
  minSpeed: 8,
  /** Turn-rate multiplier while drifting, and grip multiplier (lower = more slide). */
  turnMul: 1.35,
  gripMul: 0.35,
  /** Drift charge needed for a boost, seconds of drifting. */
  chargeForBoost: 0.8,
  /** Boost on release: duration s, and top speed multiplier while it lasts. */
  boostS: 1.0,
  boostSpeedMul: 1.3,
  /** Extra acceleration while boosting, m/s². */
  boostAccel: 20,
} as const;

// ------------------------------------------------------------------ race

export const RACE = {
  laps: 3,
  /** Rivals in the full game. */
  cpuCount: 3,
  /** Countdown before GO, seconds (the full game; the party runner has its own). */
  countdownS: 3,
  /** After the first kart finishes, the race ends this many seconds later at most. */
  finishGraceS: 12,
  /** CPU top-speed factors by kart index (index 0 is usually the player and ignores it). */
  cpuSkill: [0.97, 0.95, 0.93, 0.91] as readonly number[],
} as const;

// ------------------------------------------------------------------ track

/** One garden loop. Control points of a closed Catmull-Rom centreline, x/z metres, driven in this order. */
export const TRACK = {
  width: 9,
  /** Scale applied to controlPoints. */
  scale: 1.2,
  controlPoints: [
    [0, -30], [0, 10], [4, 24], [16, 30], [28, 24], [30, 12], [22, 2], [24, -8], [36, -14], [44, -26],
    [38, -38], [24, -40], [12, -36], [4, -44], [-10, -44], [-16, -34], [-10, -28], [-4, -34],
  ] as readonly (readonly [number, number])[],
  /** Centreline samples per control point. */
  samplesPerSegment: 24,
  /** Start line distance along the track, m (karts line up behind it). */
  startS: 6,
  /** Grid: rows this far apart along the track, and the two columns this far either side of the centre. */
  gridRowGap: 4,
  gridColOffset: 2.2,
  /** Hedge boundary: karts are kept inside this box (x/z min/max, metres, after scale). */
  bounds: { minX: -40, maxX: 72, minZ: -72, maxZ: 52 },
} as const;

// ------------------------------------------------------------------ camera

export const CAMERA = {
  /** Behind and above the kart, m. */
  distance: 5,
  height: 2.4,
  /** Look at a point this far ahead of the kart, m, and this high. */
  lookAhead: 4,
  lookHeight: 1,
  /** Follow sharpness, 1/s (position lerp 1 - exp(-dt * follow)). */
  follow: 12,
  fov: 70,
} as const;

// ------------------------------------------------------------------ shared types

/** One kart's control input for one step. */
export interface KartInput {
  /** -1..1, +1 = steer RIGHT (heading decreases). */
  steer: number;
  /** -1..1: +1 full throttle, negative brakes then reverses. */
  throttle: number;
  /** Drift/hop button held. */
  drift: boolean;
}

/** One kart in the race. Plain JSON (the party slice sends it 15 times a second): keep keys short. */
export interface KartState {
  vehicle: VehicleId;
  x: number;
  z: number;
  /** Heading (yaw), radians. */
  h: number;
  /** World velocity, m/s. */
  vx: number;
  vz: number;
  /** Last steer input (-1..1), for the view's lean and wheel turn. */
  st: number;
  /** Track position (TrackHit.s) at the last step, 0..TRACK_LENGTH. */
  s: number;
  /** Unwrapped progress along the track, m: starts slightly negative behind the line; laps done = floor(dist / TRACK_LENGTH). */
  dist: number;
  /** Laps completed, 0..laps. */
  lap: number;
  /** Drift direction: 0 not drifting, +1 drifting right, -1 drifting left. */
  drift: number;
  /** Seconds of drift charge built up. */
  charge: number;
  /** Boost seconds left. */
  boost: number;
  /** True while off the mown track (in long grass). */
  off: boolean;
  /** Top-speed factor (1 for humans, RACE.cpuSkill for CPUs). */
  skill: number;
  /** Race time when this kart crossed the line on its last lap, or null. */
  fin: number | null;
}

export interface RaceState {
  /** Race time since GO, s. */
  t: number;
  laps: number;
  karts: KartState[];
  /** Race time when the first kart finished, or null. */
  firstFin: number | null;
  /** True once every kart finished or finishGraceS passed after the first finish. */
  over: boolean;
}

/** What the player picked in the menu. */
export interface RacerChoice {
  vehicle: VehicleId;
  /** 0xRRGGBB, one of MOWER_COLORS. */
  color: number;
}

/** localStorage key of the last RacerChoice. */
export const CHOICE_KEY = 'lawn-prix.choice.v1';

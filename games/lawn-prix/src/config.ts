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
  /** Turn-rate multiplier while drifting, and grip multiplier (lower = more slide). Kept shallow: a wide, gentle arc. */
  turnMul: 1.05,
  gripMul: 0.6,
  /** While drifting, the turn = drift direction * bias + steer * steerShare (so steering widens or tightens the arc). */
  bias: 0.35,
  steerShare: 0.45,
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

// ------------------------------------------------------------------ track (shared by every course; courses.ts has the layouts)

export const TRACK = {
  /** Mown surface width, m (every course). */
  width: 9,
  /** Centreline samples per control point. */
  samplesPerSegment: 24,
  /** Grid: rows this far apart along the track, and the two columns this far either side of the centre. */
  gridRowGap: 4,
  gridColOffset: 2.2,
} as const;

export type CourseId = 'garden' | 'panic' | 'front' | 'golf';

// ------------------------------------------------------------------ hop drift

export const HOP = {
  /** Pressing drift makes a little hop this long, s; landing with steer held past minSteer starts the drift. */
  duration: 0.28,
  /** Peak height of the hop, m (view only). */
  height: 0.35,
  minSteer: 0.3,
} as const;

// ------------------------------------------------------------------ items

/** What an item box can give. */
export type ItemKind = 'acorn' | 'boost';

export const ITEMS = {
  /** Item boxes per row (spread across the track), and seconds before a taken box comes back. */
  boxesPerRow: 4,
  boxRespawnS: 6,
  /** Pickup distance from a box centre, m. */
  pickupRadius: 1.3,
  /** Acorn: launch speed m/s (added to the thrower's forward speed), lifetime s, hit radius m, max in flight. */
  acornSpeed: 32,
  acornLifeS: 1.6,
  acornRadius: 0.5,
  maxAcorns: 4,
  /** Spin-out from an acorn hit, s. */
  acornSpinS: 1.0,
  /** Speed boost item: seconds of boost (same top speed as a drift boost). */
  boostS: 1.6,
  /** Chance of an acorn by race place (0 = 1st .. 3 = 4th); otherwise a boost. Leaders get acorns, the back gets boosts. */
  acornChanceByPlace: [0.85, 0.6, 0.4, 0.2] as readonly number[],
} as const;

// ------------------------------------------------------------------ hazards (the background show's vehicles)

export const HAZARD = {
  /** Spin-out when a kart touches a background vehicle, s (the punishment). */
  spinS: 1.6,
  /** Speed kept after the hit (fraction). */
  speedKept: 0.2,
} as const;

/** Spin-outs (acorn or hazard): the kart cannot steer or accelerate and slows hard. */
export const SPIN = {
  /** Deceleration factor while spinning, 1/s. */
  drag: 3,
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
  /** Drift/hop button held (a press hops; landing while steering starts a drift). */
  drift: boolean;
  /** Use-item button held (a press uses the held item). */
  item: boolean;
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
  /** Track position (TrackHit.s) at the last step, 0..track.length. */
  s: number;
  /** Unwrapped progress along the track, m: starts slightly negative behind the line; laps done = floor(dist / track.length). */
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
  /** Hop seconds left (0 = on the ground). */
  hop: number;
  /** Spin-out seconds left (0 = driving normally). */
  spin: number;
  /** Held item, or null. */
  item: ItemKind | null;
  /** Drift and item buttons as held on the last step (to detect presses). */
  dh: boolean;
  ih: boolean;
}

/** An acorn in flight. o = the thrower's kart index (it cannot hit its own thrower); t = seconds of life left. */
export interface Acorn {
  x: number;
  z: number;
  vx: number;
  vz: number;
  o: number;
  t: number;
}

export interface RaceState {
  course: CourseId;
  /** Race time since GO, s. */
  t: number;
  laps: number;
  karts: KartState[];
  /** Race time when the first kart finished, or null. */
  firstFin: number | null;
  /** True once every kart finished or finishGraceS passed after the first finish. */
  over: boolean;
  /** One entry per item box (order of boxSpots(track)): race time when it is back, 0 = there now. */
  boxes: number[];
  acorns: Acorn[];
}

/** 'race': 3 laps against CPU rivals. 'trial': a solo time trial against your best ghost on this course and vehicle. */
export type GameMode = 'race' | 'trial';

/** What the player picked in the menu. */
export interface RacerChoice {
  /** Default 'race'. */
  mode?: GameMode;
  vehicle: VehicleId;
  /** 0xRRGGBB, one of MOWER_COLORS. */
  color: number;
  course: CourseId;
}

/** localStorage key of the last RacerChoice. */
export const CHOICE_KEY = 'lawn-prix.choice.v2';

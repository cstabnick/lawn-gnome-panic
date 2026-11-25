// Golf tuning and plain types, shared by Gnome Golf and any game that plays golf. No three.js, no DOM.
// Units: 1 world unit = 1 yard. y is up, the sea surface is y = 0.
// Directions: yaw a points along (sin a, 0, cos a); the right-hand side of that is (-cos a, 0, sin a).

export interface Vec3 { x: number; y: number; z: number }

export type ClubId = 'DR' | '3W' | '4H' | '5I' | '6I' | '7I' | '8I' | '9I' | 'PW' | 'GW' | 'SW' | 'PT';
/** Longest first. The club selector steps through this list. */
export const CLUB_ORDER: readonly ClubId[] = ['DR', '3W', '4H', '5I', '6I', '7I', '8I', '9I', 'PW', 'GW', 'SW', 'PT'];

export interface ClubDef {
  name: string;
  /** Full-power carry on flat ground with no wind, in yards. physics.ts calibrates launch speed to hit it exactly. For the putter: roll distance on a flat green. */
  carry: number;
  /** Launch angle in degrees (0 for the putter). */
  launch: number;
  /** How much a mishit curves (driver most, wedges least). */
  curve: number;
  /** 0..1: how much backspin kills the first bounce (wedges check up). */
  spin: number;
}

export const CLUBS: Record<ClubId, ClubDef> = {
  DR: { name: 'Driver', carry: 205, launch: 12, curve: 1.0, spin: 0.0 },
  '3W': { name: '3 Wood', carry: 185, launch: 14, curve: 0.9, spin: 0.05 },
  '4H': { name: '4 Hybrid', carry: 168, launch: 17, curve: 0.75, spin: 0.1 },
  '5I': { name: '5 Iron', carry: 158, launch: 19, curve: 0.7, spin: 0.15 },
  '6I': { name: '6 Iron', carry: 148, launch: 21, curve: 0.65, spin: 0.2 },
  '7I': { name: '7 Iron', carry: 138, launch: 24, curve: 0.6, spin: 0.28 },
  '8I': { name: '8 Iron', carry: 127, launch: 27, curve: 0.55, spin: 0.35 },
  '9I': { name: '9 Iron', carry: 116, launch: 30, curve: 0.5, spin: 0.42 },
  PW: { name: 'Pitching Wedge', carry: 102, launch: 34, curve: 0.45, spin: 0.5 },
  GW: { name: 'Gap Wedge', carry: 86, launch: 39, curve: 0.4, spin: 0.58 },
  SW: { name: 'Sand Wedge', carry: 70, launch: 46, curve: 0.35, spin: 0.65 },
  PT: { name: 'Putter', carry: 30, launch: 0, curve: 0.1, spin: 0 },
};

export type Lie = 'tee' | 'fairway' | 'fringe' | 'rough' | 'sand' | 'green' | 'water';

export interface LieDef {
  name: string;
  /** Multiplies launch speed of shots played from this lie. */
  power: number;
  /** Multiplies the accuracy error of shots played from this lie. */
  wobble: number;
  /** Rolling deceleration, yards/s². */
  roll: number;
  /** Vertical bounce restitution (0 = dead stop). */
  bounce: number;
  /** Fraction of horizontal speed kept on a bounce. */
  keep: number;
}

export const LIES: Record<Lie, LieDef> = {
  tee: { name: 'Tee', power: 1, wobble: 1, roll: 6, bounce: 0.3, keep: 0.6 },
  fairway: { name: 'Fairway', power: 1, wobble: 1, roll: 6, bounce: 0.3, keep: 0.6 },
  fringe: { name: 'Fringe', power: 0.97, wobble: 1, roll: 3, bounce: 0.25, keep: 0.55 },
  rough: { name: 'Rough', power: 0.85, wobble: 1.4, roll: 14, bounce: 0.15, keep: 0.35 },
  sand: { name: 'Bunker', power: 0.62, wobble: 1.6, roll: 25, bounce: 0.02, keep: 0.1 },
  green: { name: 'Green', power: 1, wobble: 1, roll: 1.25, bounce: 0.22, keep: 0.5 },
  water: { name: 'Water', power: 0, wobble: 1, roll: 999, bounce: 0, keep: 0 },
};
/** Sand and gap wedges dig out of bunkers better: their power from sand is this instead of LIES.sand.power. */
export const WEDGE_SAND_POWER = 0.88;

export const PHYS = {
  gravity: 10.7,          // yd/s² (9.81 m/s²)
  drag: 0.0042,           // per yard: a = -drag * |v| * v (air, relative to wind)
  lift: 0.0016,           // per yard: upward a = lift * horizontalSpeed²
  /** Sideways yd/s² per unit accuracy error per unit club curve (positive error curves right). */
  curveAccel: 5,
  /** Start-line error in degrees per unit accuracy error. */
  startLineDeg: 3,
  /** Power above 1 (overswing) adds this much random-free error in the swing's direction. */
  overswingError: 1.5,
  simDt: 1 / 120,
  recordEvery: 4,         // record one trajectory sample every N sim steps (30 per second)
  maxSeconds: 40,
  stopSpeed: 0.08,
  /** Rolling ball is captured by the cup within this radius when slower than cupMaxSpeed. */
  cupRadius: 0.12,
  cupMaxSpeed: 4.5,
  /** Visual ball radius (bigger than a real one so it reads at distance). */
  ballRadius: 0.07,
} as const;

export const SWING = {
  /** Seconds for the marker to rise from 0 to full (1.0) power. */
  riseSeconds: 0.95,
  /** The marker keeps rising past 1 up to this (overswing) and then sets power there automatically. */
  maxPower: 1.1,
  /** Seconds for the marker to come back down from the power mark to the accuracy line. */
  fallSeconds: 0.55,
  /** Width of the accuracy window either side of the line, in meter units (0..1 scale). Missing it gives error ±1. */
  accuracyWindow: 0.12,
  /** Putter meter speed multiplier (slower rise for touch). */
  puttRiseScale: 1.4,
} as const;

export interface Circle { x: number; z: number; r: number }

export interface HoleDef {
  par: number;
  /** Tee centre (ground position of the tee markers). */
  tee: { x: number; z: number };
  /** Fairway centreline: tee, then any dogleg corners, then the green centre. */
  path: readonly { x: number; z: number }[];
  /** Fairway width in yards (full width). Fairway starts fairwayStart yards from the tee. */
  fairwayWidth: number;
  fairwayStart: number;
  /** Green centre (same as the last path point), radius and tilt (rise in yards per yard along x and z). */
  green: { x: number; z: number; r: number; slopeX: number; slopeZ: number };
  /** Pin position (on the green). */
  pin: { x: number; z: number };
  bunkers: readonly Circle[];
  ponds: readonly Circle[];
}

export const TEE_HALF = 5; // tee box half-size in yards (square, flattened)
export const FRINGE = 2.5; // fringe band around each green, yards

export interface FlightEvent {
  /** Seconds after impact. */
  t: number;
  kind: 'bounce' | 'roll' | 'cup' | 'water' | 'rest' | 'chains';
  lie: Lie;
  /** Impact speed in yd/s (bounces), for sound volume. */
  speed: number;
}

export interface SwingState {
  /** idle: waiting for the first tap. power: marker rising. accuracy: marker falling to the line. */
  stage: 'idle' | 'power' | 'accuracy';
  /** Marker position: 0 at the accuracy line, 1 = full power, up to SWING.maxPower. */
  marker: number;
  /** Locked power (0..SWING.maxPower) once the second tap lands. */
  power: number;
}

export interface Shot {
  club: ClubId;
  /** 0..SWING.maxPower */
  power: number;
  /** -1..1, 0 = perfect, negative = pulled/hooked left, positive = pushed/sliced right. */
  accuracy: number;
  yaw: number;
}

export interface Wind {
  /** Direction the wind blows TOWARD, as a yaw. */
  yaw: number;
  mph: number;
}

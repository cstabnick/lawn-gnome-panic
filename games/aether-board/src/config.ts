// Aether Board: shared types and tuning. Every module takes its contracts from here.
// The simulation (world.ts, physics.ts, tricks.ts) is pure: THREE math only, no DOM, no window, no Math.random.
import * as THREE from 'three';

// ---------------------------------------------------------------- simulation tuning (feel lives here)
/** Fixed simulation rate; the renderer interpolates between steps. */
export const SIM_HZ = 120;

export const TUNE = {
  gravity: 30,            // m/s²
  // ground
  pushAccel: 16,          // W / stick forward, only below pushMax
  pushMax: 17,
  brakeDecel: 22,         // S: powerslide
  carveRate: 2.6,         // rad/s board turn at low speed
  carveRateFast: 1.35,    // rad/s at maxCarveSpeed and above
  maxCarveSpeed: 45,
  grip: 9,                // how fast sideways velocity dies (1/s)
  carveKeep: 0.9,         // share of sideways speed turned into forward speed while carving (fluid carves)
  rollDrag: 0.025,        // linear, per second
  airDrag: 0.0042,        // quadratic: terminal speed about 35-46 m/s on the island slopes (boost goes past it)
  maxSpeed: 62,           // soft cap
  stickMin: 0.07,         // m: the ground may drop this far below the board in one step and we still stick...
  stickMax: 0.4,          // ...up to this at rest; faster = lifts off crests more easily
  // pop
  chargeTime: 0.32,       // s to full crouch
  ollieMin: 8.5,          // m/s along the normal (+ a little up)
  ollieMax: 13.5,
  // air
  spinRate: 8.2,          // rad/s at full steer
  spinResponse: 14,       // how fast spin speed follows the stick (1/s)
  flipRate: 6.2,          // rad/s front/back flip with W/S
  airSteer: 4,            // m/s² sideways air control
  landYawTol: 0.95,       // rad: board vs travel direction (or its reverse, for switch) to land clean
  landFlipTol: 0.7,       // rad off a whole flip to land clean
  landTrickDone: 0.82,    // a board trick must be this far along at touchdown
  perfectImpact: 0.32,    // landing with (impact speed / speed) under this is a "perfect" (smooth) landing
  perfectBoost: 2.5,        // m/s added on a perfect landing
  // grind / ley-lines
  grindSnap: 1.4,         // m: catch distance to a rail
  grindAlign: 0.55,       // |cos| between velocity and rail needed to lock on
  leyAccel: 10,           // ley-lines push you along (m/s²), up to leyMax
  leyMax: 48,
  grindCooldown: 0.35,
  // boost (Shift / RB), fed by flow
  boostAccel: 34,
  boostDrain: 0.42,       // flow per second while boosting
  flowDrain: 0.03,        // flow per second always
  // bail
  bailTime: 1.1,
  bailKeep: 0.35,         // share of speed kept when you bail
} as const;

/** Board-only tricks (the skate-style flick tricks). flip = board roll in turns (+ kickflip way, − heelflip way),
 *  shove = board yaw in turns (+ backside, − frontside), dur = seconds the animation takes in the air. */
export type BoardTrick =
  | 'ollie' | 'kickflip' | 'heelflip' | 'popShove' | 'fsShove' | 'varialKick' | 'varialHeel'
  | 'treFlip' | 'hardflip' | 'impossible' | 'doubleKick'
  | 'doubleHeel' | 'threeShove' | 'fsThreeShove' | 'laserFlip' | 'inwardHeel' | 'nightmare' | 'doubleTre';

export interface BoardTrickDef { name: string; flip: number; shove: number; dur: number; points: number }

export const BOARD_TRICKS: Record<BoardTrick, BoardTrickDef> = {
  ollie:      { name: 'Ollie',            flip: 0,  shove: 0,    dur: 0.0,  points: 50 },
  kickflip:   { name: 'Kickflip',         flip: 1,  shove: 0,    dur: 0.42, points: 120 },
  heelflip:   { name: 'Heelflip',         flip: -1, shove: 0,    dur: 0.42, points: 120 },
  popShove:   { name: 'Pop Shove-it',     flip: 0,  shove: 0.5,  dur: 0.36, points: 90 },
  fsShove:    { name: 'FS Shove-it',      flip: 0,  shove: -0.5, dur: 0.36, points: 90 },
  varialKick: { name: 'Varial Kickflip',  flip: 1,  shove: 0.5,  dur: 0.5,  points: 180 },
  varialHeel: { name: 'Varial Heelflip',  flip: -1, shove: -0.5, dur: 0.5,  points: 180 },
  treFlip:    { name: '360 Flip',         flip: 1,  shove: 1,    dur: 0.6,  points: 300 },
  hardflip:   { name: 'Hardflip',         flip: 1,  shove: -0.5, dur: 0.5,  points: 220 },
  impossible: { name: 'Impossible',       flip: 0,  shove: 0,    dur: 0.5,  points: 220 }, // board wraps around the back foot (view: pitch 1 turn)
  doubleKick: { name: 'Double Kickflip',  flip: 2,  shove: 0,    dur: 0.62, points: 260 },
  doubleHeel: { name: 'Double Heelflip',  flip: -2, shove: 0,    dur: 0.62, points: 260 },
  threeShove: { name: '360 Shove-it',     flip: 0,  shove: 1,    dur: 0.5,  points: 200 },
  fsThreeShove: { name: 'FS 360 Shove-it', flip: 0, shove: -1,   dur: 0.5,  points: 200 },
  laserFlip:  { name: 'Laser Flip',       flip: -1, shove: -1,   dur: 0.62, points: 320 },
  inwardHeel: { name: 'Inward Heelflip',  flip: -1, shove: 0.5,  dur: 0.5,  points: 220 },
  nightmare:  { name: 'Nightmare Flip',   flip: 2,  shove: 0.5,  dur: 0.66, points: 340 },
  doubleTre:  { name: 'Double 360 Flip',  flip: 2,  shove: 1,    dur: 0.75, points: 420 },
};

/** Stick zones (the trick stick's 8 directions, or C for centre). */
export type Zone = 'C' | 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

// ---------------------------------------------------------------- how each board trick is done (tricks.ts recognizes these; the trick book shows them)
/**
 * Ground tricks: pull the trick stick back (down), then move it along `path` (the zones after leaving the bottom; the
 * last one is where the flick ends). `mod`: a grab button held while you pop (LMB / RMB, Q / E, LT / RT, GRAB on touch).
 */
export interface GroundGesture { trick: BoardTrick; path: Exclude<Zone, 'C'>[]; mod: boolean }
export const GROUND_GESTURES: readonly GroundGesture[] = [
  { trick: 'ollie', path: ['N'], mod: false },
  { trick: 'kickflip', path: ['NW'], mod: false },
  { trick: 'heelflip', path: ['NE'], mod: false },
  { trick: 'popShove', path: ['W'], mod: false },
  { trick: 'fsShove', path: ['E'], mod: false },
  { trick: 'varialKick', path: ['W', 'NW'], mod: false },
  { trick: 'varialHeel', path: ['E', 'NE'], mod: false },
  { trick: 'treFlip', path: ['W', 'N'], mod: false },
  { trick: 'hardflip', path: ['E', 'N'], mod: false },
  { trick: 'impossible', path: ['N'], mod: true },
  { trick: 'doubleKick', path: ['NW'], mod: true },
  { trick: 'doubleHeel', path: ['NE'], mod: true },
  { trick: 'threeShove', path: ['W'], mod: true },
  { trick: 'fsThreeShove', path: ['E'], mod: true },
  { trick: 'nightmare', path: ['W', 'NW'], mod: true },
  { trick: 'laserFlip', path: ['E', 'NE'], mod: true },
  { trick: 'doubleTre', path: ['W', 'N'], mod: true },
  { trick: 'inwardHeel', path: ['E', 'N'], mod: true },
];

/** Air tricks: a quick flick from centre to `zone` while in the air (and no grab held: then the stick picks the grab). */
export const AIR_GESTURES: readonly { trick: BoardTrick; zone: Exclude<Zone, 'C'> }[] = [
  { trick: 'kickflip', zone: 'W' },
  { trick: 'heelflip', zone: 'E' },
  { trick: 'varialKick', zone: 'NW' },
  { trick: 'varialHeel', zone: 'NE' },
  { trick: 'impossible', zone: 'N' },
  { trick: 'popShove', zone: 'S' },
  { trick: 'treFlip', zone: 'SW' },
  { trick: 'hardflip', zone: 'SE' },
];

// ---------------------------------------------------------------- grabs and grinds

/** The zone of a stick (centre below 0.5). */
export function zoneOf(stick: { x: number; y: number }): Zone {
  if (Math.hypot(stick.x, stick.y) < 0.5) return 'C';
  const a = (Math.atan2(stick.x, stick.y) * 180) / Math.PI; // 0 = up, 90 = right
  const abs = Math.abs(a);
  if (abs < 22.5) return 'N';
  if (abs >= 157.5) return 'S';
  if (a > 0) return a < 67.5 ? 'NE' : a < 112.5 ? 'E' : 'SE';
  return a > -67.5 ? 'NW' : a > -112.5 ? 'W' : 'SW';
}

export type GrabKind = 'indy' | 'melon' | 'nosegrab' | 'tailgrab' | 'method' | 'stalefish' | 'crail' | 'mute' | 'japan' | 'roastBeef';

/**
 * A grab: which hand reaches (front = the hand toward the nose, back = toward the tail), where on the board it holds
 * (nose / tail end, or the toe / heel edge between the feet), and how the board is tweaked while held (radians:
 * pitch = nose up +, roll = toe edge up +). points: base, + per second held (see tricks.ts).
 */
export interface GrabDef { name: string; hand: 'front' | 'back'; spot: 'nose' | 'tail' | 'toe' | 'heel'; pitch: number; roll: number; points: number }

export const GRABS: Record<GrabKind, GrabDef> = {
  indy:      { name: 'Indy',       hand: 'back',  spot: 'toe',  pitch: 0,     roll: 0.25,  points: 100 },
  melon:     { name: 'Melon',      hand: 'front', spot: 'heel', pitch: 0,     roll: -0.25, points: 100 },
  nosegrab:  { name: 'Nosegrab',   hand: 'front', spot: 'nose', pitch: 0.45,  roll: 0,     points: 120 },
  tailgrab:  { name: 'Tailgrab',   hand: 'back',  spot: 'tail', pitch: -0.45, roll: 0,     points: 120 },
  method:    { name: 'Method',     hand: 'front', spot: 'heel', pitch: 0.15,  roll: -0.7,  points: 160 },
  stalefish: { name: 'Stalefish',  hand: 'back',  spot: 'heel', pitch: -0.15, roll: -0.35, points: 150 },
  crail:     { name: 'Crail',      hand: 'back',  spot: 'nose', pitch: 0.35,  roll: 0.2,   points: 150 },
  mute:      { name: 'Mute',       hand: 'front', spot: 'toe',  pitch: 0.1,   roll: 0.35,  points: 130 },
  japan:     { name: 'Japan',      hand: 'front', spot: 'toe',  pitch: 0.55,  roll: 0.5,   points: 180 },
  roastBeef: { name: 'Roast Beef', hand: 'back',  spot: 'heel', pitch: -0.3,  roll: -0.3,  points: 160 },
};

/** Which grab: the stick picks it while a grab button is held (centre: Indy on grab 1, Melon on grab 2). */
export function grabFor(button: 1 | 2, stick: { x: number; y: number }): GrabKind {
  switch (zoneOf(stick)) {
    case 'N': return 'nosegrab';
    case 'S': return 'tailgrab';
    case 'W': return 'method';
    case 'E': return 'stalefish';
    case 'NW': return 'crail';
    case 'NE': return 'mute';
    case 'SW': return 'japan';
    case 'SE': return 'roastBeef';
    default: return button === 1 ? 'indy' : 'melon';
  }
}

export type GrindKind = 'fiftyFifty' | 'noseGrind' | 'fiveO' | 'boardslide' | 'lipslide' | 'crooked' | 'noseslide' | 'smith' | 'feeble';

/** A grind: board yaw relative to the rail (0 = along it, π/2 = across: a slide), board pitch (nose down −),
 *  and points (base + per second, see tricks.ts). */
export interface GrindDef { name: string; yaw: number; pitch: number; base: number; perS: number }

export const GRINDS: Record<GrindKind, GrindDef> = {
  fiftyFifty: { name: '50-50',      yaw: 0,             pitch: 0,     base: 100, perS: 60 },
  noseGrind:  { name: 'Nosegrind',  yaw: 0,             pitch: -0.25, base: 140, perS: 80 },
  fiveO:      { name: '5-0',        yaw: 0,             pitch: 0.25,  base: 140, perS: 80 },
  boardslide: { name: 'Boardslide', yaw: Math.PI / 2,   pitch: 0,     base: 120, perS: 70 },
  lipslide:   { name: 'Lipslide',   yaw: -Math.PI / 2,  pitch: 0,     base: 150, perS: 80 },
  crooked:    { name: 'Crooked',    yaw: 0.35,          pitch: -0.25, base: 170, perS: 90 },
  noseslide:  { name: 'Noseslide',  yaw: Math.PI / 2,   pitch: -0.2,  base: 160, perS: 90 },
  smith:      { name: 'Smith',      yaw: -0.3,          pitch: 0.3,   base: 170, perS: 90 },
  feeble:     { name: 'Feeble',     yaw: 0.3,           pitch: 0.25,  base: 160, perS: 85 },
};

/** Which grind: the trick stick's direction when you lock on (and while you hold a new direction, you switch). */
export function grindFor(stick: { x: number; y: number }): GrindKind {
  switch (zoneOf(stick)) {
    case 'N': return 'noseGrind';
    case 'S': return 'fiveO';
    case 'W': return 'boardslide';
    case 'E': return 'lipslide';
    case 'NW': return 'crooked';
    case 'NE': return 'noseslide';
    case 'SW': return 'smith';
    case 'SE': return 'feeble';
    default: return 'fiftyFifty';
  }
}

// ---------------------------------------------------------------- input (one frame)
export interface Input {
  /** -1..1, right positive. A/D, left stick x. Ground: carve. Air: spin. */
  steer: number;
  /** -1..1, forward positive. W/S, left stick y. Ground: push (+) / brake (−). Air: front flip (+) / back flip (−). */
  lean: number;
  /** The trick stick (mouse as a springy virtual stick, or the right stick): unit disc, x right, y up (= forward). */
  stick: { x: number; y: number };
  /** Space / pad A held: crouch to charge, release to ollie. On a rail: hop off. */
  jump: boolean;
  /** 0 none, 1 = LMB / Q / LT (Indy), 2 = RMB / E / RT (Melon). Air only. */
  grab: 0 | 1 | 2;
  /** Shift / RB: aether boost, burns flow. */
  boost: boolean;
  /** R / pad Y: back to the last island. True on the frame it was pressed. */
  respawn: boolean;
}

export const NO_INPUT: Input = { steer: 0, lean: 0, stick: { x: 0, y: 0 }, jump: false, grab: 0, boost: false, respawn: false };

/** What the trick-stick recognizer (tricks.ts) asks the physics to do this step. */
export type TrickCmd =
  | { kind: 'pop'; trick: BoardTrick; power: number } // on the ground (or rail): jump now with this power 0..1 and start trick
  | { kind: 'air'; trick: BoardTrick };               // in the air: start this board trick if none is running

// ---------------------------------------------------------------- player
export type Mode = 'ground' | 'air' | 'grind' | 'bail';

export interface Player {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  /** Board yaw: the board's nose points along (sin h, 0, cos h). Increasing h turns left. */
  heading: number;
  mode: Mode;
  /** Ground normal (up while airborne). */
  normal: THREE.Vector3;
  /** 0..1 crouch charge (jump held or stick pulled back). */
  crouch: number;
  jumpHeld: boolean;
  /** Riding switch (backwards); flips when you land a 180. */
  switchStance: boolean;
  // air
  airT: number;
  /** Yaw turned since takeoff (rad, signed), and its current rate. */
  spin: number;
  spinVel: number;
  /** Front/back flip (rad, signed, + = front flip), and its current rate. */
  flip: number;
  flipVel: number;
  /** Push/brake held through takeoff does not flip you: W/S (or the stick) must be let go and pressed again in the air. */
  flipLock: boolean;
  /** The board trick in progress (air), or null. t counts up to BOARD_TRICKS[id].dur. */
  trick: { id: BoardTrick; t: number } | null;
  /** Board tricks completed this air (for the landing bonus). */
  tricksThisAir: number;
  grab: 0 | 1 | 2;
  /** Which grab is held (picked by the trick stick while the grab button is down). Meaningful while grab > 0. */
  grabKind: GrabKind;
  grabT: number;
  // grind
  /** t: seconds in the current grind kind (a switch restarts it). */
  grind: { rail: number; s: number; dir: 1 | -1; speed: number; t: number; kind: GrindKind } | null;
  grindCooldown: number;
  lastRail: number;
  /** The halfpipe you last rode (index into World.pipes), or -1: in the air above it you are steered back in. */
  lastPipe: number;
  // bail
  bailT: number;
  /** 0..1, earned by clean landings and tricks, burned by boost. */
  flow: number;
  boosting: boolean;
  /** Island under you (or last touched), and where R / the void sends you. */
  island: number;
  lastSafe: { pos: THREE.Vector3; heading: number };
  t: number;
}

// ---------------------------------------------------------------- physics events (for scoring, sound, effects)
export type PhysEvent =
  | { e: 'takeoff'; speed: number; ollie: boolean }
  | { e: 'pop'; trick: BoardTrick }                 // a board trick started (a pop, or a flick in the air)
  | { e: 'trickDone'; trick: BoardTrick }
  | { e: 'land'; perfect: boolean; spin: number; flips: number; airT: number; impact: number; switchLand: boolean }
  | { e: 'bail'; reason: string }
  | { e: 'grindStart'; rail: number; ley: boolean; spin: number; kind: GrindKind } // spin: degrees turned on the way in (rounded to 180s)
  | { e: 'grindSwitch'; from: GrindKind; to: GrindKind; t: number; ley: boolean }  // t: seconds spent in `from`
  | { e: 'grindEnd'; t: number; ley: boolean; kind: GrindKind }                   // t: seconds in the last kind
  | { e: 'grabStart'; kind: 1 | 2; name: GrabKind }
  | { e: 'grabEnd'; kind: 1 | 2; t: number; name: GrabKind }
  | { e: 'skyfall' }                                // fell off: dropped out of the sky onto the next island
  | { e: 'boostStart' }
  | { e: 'island'; id: number }
  | { e: 'warp' }                                   // through the aether gate, back to the first island
  | { e: 'respawn' };

// ---------------------------------------------------------------- scoring view (tricks.ts → hud.ts)
export interface ComboView {
  /** Trick names in the running combo, oldest first ('Kickflip', 'BS 540', 'Indy 1.2s', 'Ley-line Grind', ...). */
  lines: string[];
  /** Points in the running combo, and its multiplier (number of tricks). */
  points: number;
  mult: number;
  /** Seconds left to keep the combo alive while rolling on the ground (0 when airborne or no combo). */
  linkLeft: number;
  total: number;
  best: number;
  /** The last banked or lost combo, for the big landing text. t = Player.t when it happened. */
  last: { text: string; points: number; t: number; kind: 'landed' | 'bailed' } | null;
}

// ---------------------------------------------------------------- look
/** Jet Set Radio-ish candy palette. Views use these. */
export const PALETTE = {
  pink: 0xff3fa4, cyan: 0x2de2e6, lime: 0xb6ff3b, purple: 0x8b5cff, orange: 0xff9f1c, yellow: 0xffe14d,
  mint: 0x7cffc4, lilac: 0xc9a7ff, sky: 0x6ad7ff, ink: 0x17072e,
} as const;
/** Island top colours, cycled by island id. */
export const ISLAND_TOPS: readonly number[] = [0x7cffc4, 0xff8fd1, 0xc9a7ff, 0xffe14d, 0x8ff0ff, 0xb6ff3b];

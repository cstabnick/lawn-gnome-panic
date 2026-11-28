// Skate trick tables and shared types: tricks, gestures, grabs, grinds, the assists the combo reads, physics events and the
// combo view. Pure data and functions: no three.js, no DOM. Moved verbatim from Aether Board's config.ts.

/**
 * Descent assists, set by the run's perks (descent/perks.ts applyPerks, and app.ts per hill). The defaults change
 * nothing, so free ride plays exactly as before. physics.ts and tricks.ts read these every step.
 */
export const ASSIST = {
  /** Bad landings left this hill that are landed anyway (Guardian Gnome). physics.ts spends them. */
  landSaves: 0,
  /** Landing tolerances (landYawTol, landFlipTol) are multiplied by this after BIG_AIR_S of airtime (Soft Knees). */
  bigAirTol: 1,
  /** Close Call points are multiplied by this (Daredevil). */
  closeCall: 1,
};
/** Airtime (s) from which a landing counts as a big air (Soft Knees). */
export const BIG_AIR_S = 1;
/** A clean landing within this many metres of a hazard's edge is a Close Call. */
export const CLOSE_CALL_M = 6;
/** Close Call base points (tricks.ts). */
export const CLOSE_CALL_POINTS = 250;

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

// ---------------------------------------------------------------- recognizer output, modes, events, combo view
/** What the trick-stick recognizer (tricks.ts) asks the physics to do this step. */
export type TrickCmd =
  | { kind: 'pop'; trick: BoardTrick; power: number } // on the ground (or rail): jump now with this power 0..1 and start trick
  | { kind: 'air'; trick: BoardTrick };               // in the air: start this board trick if none is running

/** What the board is doing (Aether Board's Player.mode). */
export type Mode = 'ground' | 'air' | 'grind' | 'bail';

// ---------------------------------------------------------------- physics events (for scoring, sound, effects)
export type PhysEvent =
  | { e: 'takeoff'; speed: number; ollie: boolean }
  | { e: 'pop'; trick: BoardTrick }                 // a board trick started (a pop, or a flick in the air)
  | { e: 'trickDone'; trick: BoardTrick }
  | { e: 'land'; perfect: boolean; spin: number; flips: number; airT: number; impact: number; switchLand: boolean; near?: boolean } // near: landed clean next to a Descent hazard (a close call)
  | { e: 'saved'; reason: string }                 // a landing that would have bailed (reason) was saved by ASSIST.landSaves
  | { e: 'bail'; reason: string }
  | { e: 'grindStart'; rail: number; ley: boolean; spin: number; kind: GrindKind } // spin: degrees turned on the way in (rounded to 180s)
  | { e: 'grindSwitch'; from: GrindKind; to: GrindKind; t: number; ley: boolean }  // t: seconds spent in `from`
  | { e: 'grindEnd'; t: number; ley: boolean; kind: GrindKind }                   // t: seconds in the last kind
  | { e: 'grabStart'; kind: 1 | 2; name: GrabKind }
  | { e: 'grabEnd'; kind: 1 | 2; t: number; name: GrabKind }
  | { e: 'skyfall' }                                // fell off: dropped out of the sky onto the next island
  | { e: 'manualStart'; kind: 'nose' | 'tail' }
  | { e: 'manualEnd'; kind: 'nose' | 'tail'; t: number; fell: boolean } // fell: lost the balance (no bail, the combo goes on)
  | { e: 'boostStart' }
  | { e: 'bump'; kind: 'wall' | 'post'; speed: number } // bounced off a bumper (speed: m/s into it)
  | { e: 'surf'; on: boolean }                      // Flood Run: started / stopped riding a surge
  | { e: 'blast'; by: 'cannon' | 'geyser' }         // Flood Run: knocked about by a water cannon or a geyser
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

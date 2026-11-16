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
  | 'treFlip' | 'hardflip' | 'impossible' | 'doubleKick';

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
};

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
  /** The board trick in progress (air), or null. t counts up to BOARD_TRICKS[id].dur. */
  trick: { id: BoardTrick; t: number } | null;
  /** Board tricks completed this air (for the landing bonus). */
  tricksThisAir: number;
  grab: 0 | 1 | 2;
  grabT: number;
  // grind
  grind: { rail: number; s: number; dir: 1 | -1; speed: number; t: number } | null;
  grindCooldown: number;
  lastRail: number;
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
  | { e: 'grindStart'; rail: number; ley: boolean; spin: number } // spin: degrees turned on the way in (rounded to 180s)
  | { e: 'grindEnd'; t: number; ley: boolean }
  | { e: 'grabStart'; kind: 1 | 2 }
  | { e: 'grabEnd'; kind: 1 | 2; t: number }
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

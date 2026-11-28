// Aether Board: shared types and tuning. Every module takes its contracts from here.
// The simulation (world.ts, physics.ts, tricks.ts) is pure: THREE math only, no DOM, no window, no Math.random.
import * as THREE from 'three';
export {
  ASSIST, BIG_AIR_S, CLOSE_CALL_M, CLOSE_CALL_POINTS, BOARD_TRICKS, GROUND_GESTURES, AIR_GESTURES, zoneOf, GRABS, grabFor, GRINDS, grindFor,
} from '@lawn/trickboard';
export type {
  BoardTrick, BoardTrickDef, Zone, GroundGesture, GrabKind, GrabDef, GrindKind, GrindDef, TrickCmd, Mode, PhysEvent, ComboView,
} from '@lawn/trickboard';
import type { BoardTrick, GrabKind, GrindKind, Mode } from '@lawn/trickboard';

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
  maxSpeed: 62,           // soft cap (free ride scales it by RACE_SPEED_SCALE)
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
  leyMax: 48,             // free ride scales it by RACE_SPEED_SCALE
  grindCooldown: 0.35,
  // boost (Shift / RB), fed by flow
  boostAccel: 34,
  boostDrain: 0.42,       // flow per second while boosting
  flowDrain: 0.03,        // flow per second always
  // bail
  bailTime: 1.1,
  bailKeep: 0.35,         // share of speed kept when you bail
  // manuals (hold a grab on the ground: GRAB 1 nose manual, GRAB 2 manual; balance with W/S or the left stick)
  manualHold: 0.12,       // s a grab must be held on the ground before the board tips up
  manualDrift: 1.5,       // how hard the balance wanders on its own
  manualTip: 1.6,         // the further off balance, the faster it tips (an inverted pendulum)
  manualControl: 3.4,     // how hard W/S push the balance back
  manualDamp: 1.3,        // 1/s
} as const;

// The trick tables, ASSIST, PhysEvent, ComboView and the rest of the trick layer live in @lawn/trickboard (re-exported above).

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

// ---------------------------------------------------------------- player
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
  /**
   * A manual in progress, or null. balance: -1..1 (0 = perfect; past ±1 you drop out of it), vel: its rate, t: seconds.
   * On the ground, W/S (lean) steer the balance instead of pushing and braking.
   */
  manual: { kind: 'nose' | 'tail'; balance: number; vel: number; t: number } | null;
  /** 0..1: how much of the board is riding on water (Flood Run; always 0 elsewhere). Water lets go of grip. */
  wet: number;
  /** Seconds a grab button has been held (any mode): landing with a grab held drops straight into a manual. */
  manualHoldT: number;
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

/** Free ride (the race to the gate) caps top speed at this share of TUNE.maxSpeed and TUNE.leyMax. Descent and Flood Run do not. */
export const RACE_SPEED_SCALE = 0.7;

// ---------------------------------------------------------------- look
/** Jet Set Radio-ish candy palette. Views use these. */
export const PALETTE = {
  pink: 0xff3fa4, cyan: 0x2de2e6, lime: 0xb6ff3b, purple: 0x8b5cff, orange: 0xff9f1c, yellow: 0xffe14d,
  mint: 0x7cffc4, lilac: 0xc9a7ff, sky: 0x6ad7ff, ink: 0x17072e,
} as const;
/** Island top colours, cycled by island id. */
export const ISLAND_TOPS: readonly number[] = [0x7cffc4, 0xff8fd1, 0xc9a7ff, 0xffe14d, 0x8ff0ff, 0xb6ff3b];

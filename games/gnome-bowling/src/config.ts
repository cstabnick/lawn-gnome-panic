// Shared types, tuning and data tables for Gnome Bowling.
// Every system imports from here. Change numbers here, not in gameplay code.
// Units: metres. y is up; the lane surface is y = 0.
// The lane runs along +z: the foul line is z = 0, the head pin is at z = LANE.length.
// x runs across the lane; +x is the BOWLER'S LEFT (they face +z; a model built facing +z has its left at +x).
// A yaw a points along (sin a, 0, cos a): yaw 0 = straight down the lane, yaw > 0 angles toward +x (left).
import type * as THREE from 'three';
import type { GnomeLook } from './models/config';

// =====================================================================
// Lane and equipment (regulation sizes; the gnomes are just small, ~1.1 m tall)
// =====================================================================

export const LANE = {
  /** Foul line (z = 0) to the centre of the head pin. */
  length: 18.29,
  /** Playing surface half width (x in [-halfWidth, halfWidth]). */
  halfWidth: 0.527,
  /** Each gutter's width, outside the lane edge. */
  gutterWidth: 0.235,
  /** Gutter depth below the lane surface. */
  gutterDepth: 0.09,
  /** The approach behind the foul line, z in [-approach, 0]. */
  approach: 4.6,
  /** End of the pin deck (start of the pit), measured past the head pin. */
  deckPastHeadPin: 0.95,
  /** Pit depth behind the deck. */
  pitDepth: 0.6,
  /** Distance between lane centres for the neighbouring decorative lanes. */
  lanePitch: 1.6,
  /** Oil: the ball skids straight until here (z), then hooks. */
  oilEnd: 11.5,
} as const;

export const BALL = {
  radius: 0.109,
  mass: 6.5, // kg
  /** Where the ball is let go (z) and its centre height. */
  releaseZ: 0.25,
} as const;

export const PIN = {
  height: 0.381,
  /** Collision radius of a standing pin (widest at the belly). */
  radius: 0.061,
  mass: 1.5, // kg
} as const;

/** Pin centre spacing (12 in) and row spacing (12 in * sqrt(3) / 2). */
const PS = 0.3048;
const PR = 0.264;
/**
 * Pin spots, index 0..9 = pins 1..10. Pin 1 is the head pin; 2, 4, 7 are on the bowler's LEFT (+x),
 * 3, 6, 10 on the right (-x). [x, z].
 */
export const PIN_SPOTS: readonly (readonly [number, number])[] = [
  [0, LANE.length],                                                   // 1
  [PS / 2, LANE.length + PR], [-PS / 2, LANE.length + PR],             // 2 3
  [PS, LANE.length + 2 * PR], [0, LANE.length + 2 * PR], [-PS, LANE.length + 2 * PR], // 4 5 6
  [PS * 1.5, LANE.length + 3 * PR], [PS / 2, LANE.length + 3 * PR],   // 7 8
  [-PS / 2, LANE.length + 3 * PR], [-PS * 1.5, LANE.length + 3 * PR], // 9 10
];

// =====================================================================
// A throw
// =====================================================================

/** Everything that decides a throw. Produced by controls.ts (or received over the net), consumed by physics.ts. */
export interface ThrowInput {
  /** Ball centre x at the foul line, clamped to THROW.xRange. */
  x: number;
  /** Launch yaw in radians (0 = straight, > 0 toward +x / the bowler's left), clamped to THROW.aimRange. */
  aim: number;
  /** Ball speed at release, m/s, clamped to THROW.speedMin..speedMax. */
  speed: number;
  /** Hook, -1..1. > 0 curves the ball toward +x (left) once it leaves the oil. */
  spin: number;
}

export const THROW = {
  xRange: 0.45,
  aimRange: 0.05,
  speedMin: 3.5,
  speedMax: 10,
  /** Sideways acceleration at spin = 1 once past the oil (m/s^2). */
  hookAccel: 1.0,
  /** Seconds of the bowler's run-up before the ball is let go (game.ts phase 'approach'). */
  approachSeconds: 1.3,
} as const;

/** One recorded instant of a pin. */
export interface PinSample {
  x: number;
  z: number;
  /** Height of the pin's base above the lane (negative once it drops into the pit or gutter). */
  y: number;
  /** 0 = upright .. PI/2 = lying flat. */
  tilt: number;
  /** Yaw the pin leans toward (same yaw convention as everything else). */
  tiltDir: number;
  /** Spin of the pin about its own long axis, radians (cosmetic). */
  spin: number;
}

export interface BallSample {
  x: number;
  y: number; // centre height
  z: number;
  /** Roll angle about the ball's axis, radians (for the finger holes to turn). */
  roll: number;
}

export type SimEventKind = 'release' | 'gutter' | 'ballPin' | 'pinPin' | 'pinFall' | 'pit';

export interface SimEvent {
  /** Seconds since release. */
  t: number;
  kind: SimEventKind;
  /** 0..1, how hard (for sound volume). */
  strength: number;
  /** Pin index 0..9 for ballPin / pinPin / pinFall, else -1. */
  pin: number;
}

/** The whole throw, simulated up front by physics.simulateThrow and then played back. */
export interface SimResult {
  /** Seconds between samples. */
  sampleDt: number;
  /** One per sample; ball[i] is at time i * sampleDt after release. */
  ball: BallSample[];
  /** pins[p][i]: pin p at sample i. Pins that were not standing at the start stay at their first sample (hidden by the view). */
  pins: PinSample[][];
  /** Seconds from release to the end (everything stopped or the time limit). = (ball.length - 1) * sampleDt. */
  duration: number;
  /** Pins (0..9) knocked down by this throw (were standing at the start, are not standing at the end). */
  down: boolean[];
  /** The ball went into a gutter. */
  gutter: boolean;
  /** Seconds after release when the ball reached the head pin row (or the pit, for a gutter ball); camera cue. */
  reachPinsAt: number;
  events: SimEvent[];
}

// =====================================================================
// Players and looks
// =====================================================================

export type LookId = 'gnorman' | 'gnancy' | 'gnorbert' | 'gnelly';

/** Bowling outfits. Every look has a bowl cut. The hat colour is replaced by the player's colour. */
export const LOOKS: Record<LookId, { name: string; look: GnomeLook }> = {
  gnorman: {
    name: 'Gnorman',
    look: { hat: 0xd93636, shirt: 0x2f64c9, pants: 0x6b4a2e, skin: 0xf1c27d, boots: 0x222222, beard: 0xf4f4f4, hair: null, freckles: false, dress: false, glasses: false, bowlCut: 0x8a5a2b },
  },
  gnancy: {
    name: 'Gnancy',
    look: { hat: 0x7e57c2, shirt: 0x2e8b57, pants: 0x5d4037, skin: 0xf8dcc8, boots: 0x6d4c41, beard: null, hair: null, freckles: true, dress: true, glasses: true, bowlCut: 0xe2571e },
  },
  gnorbert: {
    name: 'Gnorbert',
    look: { hat: 0x2e9e5b, shirt: 0xe0a020, pants: 0x3a3a5a, skin: 0xc68e5a, boots: 0x3b2a1a, beard: 0x222222, hair: null, freckles: false, dress: false, glasses: true, bowlCut: 0x1c1c1c },
  },
  gnelly: {
    name: 'Gnelly',
    look: { hat: 0xff6fd0, shirt: 0x8a3ec9, pants: 0x2b2b2b, skin: 0xf1d0b0, boots: 0xffffff, beard: null, hair: null, freckles: false, dress: true, glasses: false, bowlCut: 0xf2d45c },
  },
};
export const LOOK_ORDER: readonly LookId[] = ['gnorman', 'gnancy', 'gnorbert', 'gnelly'];

/** Player colours for local play, by seat. Online players get their colour from the server. */
export const SEAT_COLORS: readonly number[] = [0xff5a5a, 0x4fd8ff, 0xffd54f, 0x5cff7a];
export const MAX_LOCAL_PLAYERS = 4;
export const MAX_ONLINE_PLAYERS = 4;

export interface Player {
  name: string;
  look: LookId;
  /** 0xRRGGBB: name tag, scoreboard row, hat. */
  color: number;
  /** Pins knocked by each ball, in order (bowling's roll list; scoring.ts reads it). */
  rolls: number[];
  /** True when this device bowls for this player (always true in local play). */
  local: boolean;
  /** Online player id from the server, or -1 in local play. */
  netId: number;
  /** Left the online match: their turns are skipped. */
  gone: boolean;
}

// =====================================================================
// Game state
// =====================================================================

/**
 * title    menu (menu.ts shows it)
 * lobby    online: waiting for the match (menu.ts shows it)
 * intro    "Gnancy - Frame 3" banner for ROUND.introSeconds (hud.ts shows it)
 * aim      the current bowler sets position and aim, then swipes (controls.ts, local bowler only)
 * approach the bowler's run-up, THROW.approachSeconds; the ball is still in the hand
 * roll     the simulated throw plays back; rollTime = seconds since release
 * result   the outcome screen for ROUND.resultSeconds (celebrate.ts)
 * final    final standings (hud.ts)
 */
export type Phase = 'title' | 'lobby' | 'intro' | 'aim' | 'approach' | 'roll' | 'result' | 'final';

export type ResultKind =
  | 'strike' | 'double' | 'turkey' | 'hambone' // 1, 2, 3, 4+ strikes in a row
  | 'spare'
  | 'gutter'   // ball in the gutter, nothing knocked
  | 'miss'     // stayed on the lane but knocked nothing
  | 'split'    // first ball leaves a split (scoring.isSplit)
  | 'nine'     // 9 on the first ball (one pin left, not a split)
  | 'pins';    // anything else

export interface BallResult {
  kind: ResultKind;
  /** Pins knocked by this ball. */
  count: number;
  /** Player index who bowled it. */
  player: number;
  /** Bumped every result so systems can spot a new one. */
  serial: number;
}

export type Mode = 'local' | 'online';

export interface NetStatus {
  status: 'off' | 'connecting' | 'queued' | 'playing' | 'error';
  message: string;
  /** Room code in use, or null for a public match. */
  code: string | null;
  /** Players waiting in the queue group (while 'queued'). */
  waiting: number;
  /** Seconds until the match starts (while 'queued'). */
  startsInS: number;
}

export interface GameState {
  phase: Phase;
  /** Seconds in the current phase. */
  phaseTime: number;
  /** Seconds since load. */
  time: number;
  mode: Mode;
  players: Player[];
  /** Index into players of who is bowling. */
  current: number;
  /** 0..9 */
  frame: number;
  /** Ball within the frame: 0, 1, or 2 (tenth frame only). */
  ballInFrame: number;
  /** Which pins (0..9) are standing on the deck right now. */
  standing: boolean[];
  /** Current aim, edited by controls.ts during 'aim'. x and aim as in ThrowInput. */
  aimX: number;
  aimYaw: number;
  /** The throw in progress (set in 'approach', kept through 'roll' and 'result'). */
  input: ThrowInput | null;
  /** The simulated throw (set in 'approach'). */
  sim: SimResult | null;
  /** Seconds since release while 'roll' (0 during 'approach'). */
  rollTime: number;
  /** Latest ball outcome (set when 'result' starts). */
  result: BallResult | null;
  /** Total throws so far this game (online turn counter). */
  turn: number;
  net: NetStatus;
}

export const ROUND = {
  introSeconds: 1.4,
  /** How long the result screen stays (celebrate.ts animates within it). */
  resultSeconds: 2.6,
  /** Strikes and better stay up longer. */
  bigResultSeconds: 3.4,
  /** After the sim ends, wait this long before 'result' (pins settling on screen). */
  settleSeconds: 0.4,
} as const;

// =====================================================================
// Systems
// =====================================================================

/** Online API, implemented by net.ts and used by menu.ts and hud.ts. */
export interface NetApi {
  /** Online is configured for this build (a server URL exists). */
  available(): boolean;
  /** Public match with up to MAX_ONLINE_PLAYERS. */
  quickMatch(name: string, look: LookId): void;
  /** Private room code (4-8 of A-Z 0-9). */
  joinRoom(code: string, name: string, look: LookId): void;
  /** Leave the queue or match. */
  leave(): void;
}

export interface Ctx {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  state: GameState;
  /** The shared #ui element: append your own container, never restyle it. */
  ui: HTMLElement;
  lights: { key: THREE.DirectionalLight; hemi: THREE.HemisphereLight };
  net: NetApi;
}

export interface System {
  update(dt: number): void;
}

export const LOOK_COLORS = {
  background: 0x1a1030,
  laneWood: 0xd9a86c,
  laneWoodDark: 0xb98450,
  gutter: 0x2a2a35,
  approach: 0xc99a62,
  carpet: 0x3a2266,
  neonPink: 0xff3fb4,
  neonCyan: 0x3ff0ff,
  pinWhite: 0xf6f2ea,
  pinRed: 0xd23030,
} as const;

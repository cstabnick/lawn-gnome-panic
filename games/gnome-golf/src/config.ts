// Shared types, tuning and data tables for Gnome Golf.
// Every system imports from here. Change numbers here, not in gameplay code.
// Units: 1 world unit = 1 yard. y is up, the sea surface is y = 0.
// Directions: yaw a points along (sin a, 0, cos a); the right-hand side of that is (-cos a, 0, sin a).
import type * as THREE from 'three';
import type { GnomeLook } from './models/config';
import { COURSE_DOC, loadHoles, loadIsland } from './levelDoc';

// Clubs, lies, ball physics and swing tuning, the hole shape and the flight/swing/shot types live in @lawn/golf
// (shared with other games); re-exported here so every import from './config' keeps working.
import type { ClubId, FlightEvent, HoleDef, Lie, Shot, SwingState, Wind } from '@lawn/golf';
export { CLUB_ORDER, CLUBS, LIES, WEDGE_SAND_POWER, PHYS, SWING, TEE_HALF, FRINGE } from '@lawn/golf';
export type { ClubId, ClubDef, Lie, LieDef, Circle, HoleDef, FlightEvent, SwingState, Shot, Wind } from '@lawn/golf';

export const ISLAND = loadIsland(COURSE_DOC);

export const HOLES: readonly HoleDef[] = loadHoles(COURSE_DOC);

/** Clubhouse position (world.ts draws a small building here; the title camera orbits the island). */
export const CLUBHOUSE = { x: 10, z: 410 } as const;

// =====================================================================
// Round flow (round.ts)
// =====================================================================

export type Phase =
  | 'title'   // title screen; camera orbits the island
  | 'intro'   // hole flyover with the hole banner (tap to skip)
  | 'aim'     // player aims and picks a club; the swing meter is idle
  | 'swing'   // swing meter running (controls.ts owns state.swing)
  | 'flight'  // ball is moving along state.flight
  | 'result'  // ball at rest; banner shows what happened
  | 'drive'   // the mower drives the party to the ball
  | 'holed'   // ball in the cup; banner shows the score name
  | 'card'    // scorecard between holes (button: next hole)
  | 'final';  // scorecard after the last hole (button: play again)

export const ROUND = {
  introSeconds: 3.2,
  resultSeconds: 1.6,
  holedSeconds: 2.6,
  /** Mower speed while driving between shots, yards/s; drive time is clamped to [driveMin, driveMax]. */
  driveSpeed: 45,
  driveMin: 1.2,
  driveMax: 4.5,
  /** A hole is picked up at this many strokes. */
  maxStrokes: 10,
  /** Max wind for a hole, mph. */
  maxWind: 12,
} as const;

/**
 * Stroke play together (together.ts): every golfer plays their own ball on one hole at the same time, no turns.
 * Gnome Party's "Golf Hole" slice is this mode for four on a par 3.
 */
export const TOGETHER = {
  /** Yards between neighbouring balls on the tee, across the line to the pin. */
  teeSpread: 1.5,
  /** A ball is picked up at par + this many strokes. */
  pickupOverPar: 3,
  /** There is no swing meter: a stroke's accuracy error is uniform in +-half of this. */
  accuracySpread: 0.3,
  /** The big ball: drawn at this many times PHYS.ballRadius, so every ball on the hole reads from one camera. */
  bigBallScale: 3,
} as const;

/** Where the party stands relative to the ball, in the shot's frame: side = yards to the golfer's left, back = yards behind the ball. */
export const PARTY = {
  golfer: { side: 0.62, back: 0 },
  mower: { side: 3.6, back: 1.2 },
  partner: { side: 2.4, back: 1.0 },
} as const;

export interface Spot {
  x: number;
  y: number;
  z: number;
  /** Yaw the thing faces (see the direction convention at the top of this file). */
  facing: number;
}

export interface ShotResult {
  /** Samples every PHYS.simDt * PHYS.recordEvery seconds, starting at impact (t = 0). */
  points: THREE.Vector3[];
  sampleDt: number;
  /** Total seconds until the ball stopped (or was holed / found water). */
  duration: number;
  events: FlightEvent[];
  end: THREE.Vector3;
  endLie: Lie;
  holed: boolean;
  /** Yards from start to the first landing (0 for a putt that never left the ground). */
  carry: number;
  /** Highest point above the start, yards. */
  apex: number;
  /** Total yards from start to rest (horizontal). */
  total: number;
  /** For water: the last dry point along the flight, where the ball is dropped. */
  dropPoint: THREE.Vector3 | null;
}

/** 'golf': the classic game. 'disc': Gnome Disc, where Disco the living frisbee hurls a gnome at a chain basket. */
export type GameMode = 'golf' | 'disc';

export interface DiscState {
  /** Release tilt in tilt steps, -DISC.maxTilt..DISC.maxTilt. Positive = hyzer (curves left), negative = anhyzer (curves right). */
  tilt: number;
  /** Seconds the whirl has been held (phase 'swing'). */
  held: number;
  /** Orbit angle of the gnome round Disco, as the yaw its velocity points along. */
  orbit: number;
  /** Power locked in at release, 0..DISC.maxPower. */
  power: number;
  /** Release error in radians (0 = let go exactly on the aim line). */
  releaseError: number;
  /** Mid-air flails left on the current throw. */
  flails: number;
  /** state.time of the last flail (for the arm flap animation), -1 if none. */
  lastFlail: number;
  /** True when Disco got dizzy and let go on his own. */
  dizzy: boolean;
}

export interface GameState {
  /** Online play (lobby or round), or null for solo. See OnlineView. */
  online: OnlineView | null;
  mode: GameMode;
  disc: DiscState;
  phase: Phase;
  /** Seconds since phase started. */
  phaseTime: number;
  /** Seconds since the page loaded (ambient animation clock). */
  time: number;
  holeIndex: number;
  /** Strokes on the current hole so far (incl. penalties). */
  strokes: number;
  /** Final score per hole, null if not played yet. */
  scores: (number | null)[];
  ball: THREE.Vector3;
  lie: Lie;
  aimYaw: number;
  club: ClubId;
  wind: Wind;
  swing: SwingState;
  /** The shot in the air (phase 'flight' and 'result'). */
  flight: ShotResult | null;
  lastShot: Shot | null;
  /** Banner text for 'result' / 'holed' (e.g. "Fairway · 212 yd", "Birdie!"). */
  banner: string;
  /** Penalty strokes taken this hole (water). */
  penalties: number;
  /** Mower ride between shots (phase 'drive'): party spots before and after. */
  /** path: the mower's route (x, z) from from.mower to to.mower, around water, greens and bunkers. */
  drive: { from: PartySpots; to: PartySpots; duration: number; path: { x: number; z: number }[] } | null;
  /** Where the party is parked now (updated when a drive finishes and at hole start). */
  party: PartySpots;
  /** Camera mode toggled by the player: behind the ball, or overhead of the hole. */
  view: 'behind' | 'overhead';
  /** Cigarillos left this round. */
  cigarillos: number;
  /** Shots left on the lit cigarillo (> 0 = smoking: cigarillo in the golfer's mouth, swing meter slowed). */
  smokeShots: number;
  /** Cans of golf water (beer) left this round. */
  beers: number;
  /** Cans drunk this round (for the scorecard; no effect on play). */
  beersDrunk: number;
  /** Seconds since the current sip started; -1 when not drinking. Drinking lasts CONSUMABLES.drinkSeconds. */
  drinkTime: number;
  /** What the party drives: the mower cart, or the secret 2008 Nissan 350Z (type 350z on the title screen). */
  ride: Ride;
}

export type Ride = 'mower' | '350z';

// =====================================================================
// Consumables (round.ts rules, controls.ts buttons, party.ts props)
// =====================================================================

export const CONSUMABLES = {
  cigarillosPerRound: 3,
  /** A lit cigarillo lasts this many shots. */
  smokeShots: 3,
  /** Swing meter speed multiplier while smoking (0.6 = the marker moves at 60% speed: easier timing). */
  smokeMeterScale: 0.6,
  beersPerRound: 6,
  /** Length of the drinking animation, seconds. */
  drinkSeconds: 2.4,
} as const;

export interface PartySpots {
  golfer: Spot;
  mower: Spot;
  partner: Spot;
}

// =====================================================================
// Gnome Disc (discPhysics.ts, disc.ts)
// =====================================================================

export const DISC = {
  /** Full-power carry on flat ground with no wind and a flat (0) tilt, yards. discPhysics calibrates launch speed to it. */
  carry: 140,
  /** Launch angle, degrees. */
  launchDeg: 7,
  /** Release height above the ground, yards. */
  releaseHeight: 1.1,
  drag: 0.0021,           // per yard, like PHYS.drag
  lift: 0.0034,           // per yard: up accel = lift * spin * horizontalSpeed² * cos(bank)
  /** Spin left after one second of flight (spin decays exponentially; lift scales with it). */
  spinKeep: 0.78,
  /** Sideways accel from bank: lift * spin * vh² * sin(bank) toward the low side. One tilt step is this many degrees of bank. */
  tiltStepDeg: 15,
  maxTilt: 3,
  /** High-speed turn (right) and low-speed fade (left), yd/s² at full and zero relative speed. */
  turn: 1.6,
  fade: 6,
  /** Whirl: seconds of holding for full power; overwhirl past maxPower; Disco gets dizzy at dizzyPower and lets go himself. */
  windupSeconds: 2.0,
  maxPower: 1.1,
  dizzyPower: 1.45,
  /** Orbit speed of the gnome round Disco, rad/s, at zero and full power. */
  orbitMin: 2.5,
  orbitMax: 10.5,
  /** Radius of the gnome's orbit round Disco's middle, yards. */
  orbitRadius: 1.15,
  /** Release error (radians, orbit vs aim) to launch direction offset; and the clamp on the offset. */
  releaseSpread: 0.4,
  maxReleaseOffset: 1.3,
  /** |release error| under this counts as a perfect release. */
  perfectWindow: 0.28,
  /** Flails per throw: each one adds upward speed, a little spin, and costs a little forward speed. */
  flailsPerThrow: 2,
  flailUp: 2.7,
  flailSpin: 0.35,
  flailKeep: 0.93,
  /** Basket catch zone round the pin: horizontal radius, and height band above the ground, yards. */
  basketRadius: 0.85,
  basketLow: 0.25,
  basketHigh: 1.65,
  /** Faster than this into the chains and the gnome chains out (bounces back off), yd/s. */
  catchSpeed: 34,
  /** Ground contact: bounce restitution and horizontal keep on a skip, then a skid that stops at skidDecel + lie roll. */
  bounce: 0.25,
  keep: 0.6,
  skidDecel: 10,
  /** Power multiplier by lie: Disco cannot get his footing in sand. */
  liePower: { tee: 1, fairway: 1, fringe: 1, green: 1, rough: 0.9, sand: 0.72, water: 0.9 } as Record<Lie, number>,
} as const;

// =====================================================================
// Look
// =====================================================================

export const LOOK = {
  sky: 0x8fd3f4,
  fogNear: 500,
  fogFar: 1700,
  cameraFar: 5000,
  water: 0x2b8fc4,
  waterDeep: 0x16577f,
  fairway: 0x5cbf4a,
  rough: 0x3c8f37,
  green: 0x6fd65a,
  fringe: 0x58b84a,
  tee: 0x62c450,
  sand: 0xead9a0,
  beach: 0xf0e2b0,
  pond: 0x2f86b8,
} as const;

/** The player and partner, plus bots on other holes, use these looks (createGnomeModel from models/gnome.ts). */
export const GOLFER_LOOK: GnomeLook = { hat: 0xd93636, shirt: 0xf4f4f4, pants: 0x2b3a67, skin: 0xf1c27d, boots: 0x222222, beard: 0xf4f4f4, hair: null, freckles: false, dress: false, glasses: false };
export const PARTNER_LOOK: GnomeLook = { hat: 0x7e57c2, shirt: 0xf2c230, pants: 0x5d4037, skin: 0xf8dcc8, boots: 0x6d4c41, beard: null, hair: { color: 0xe2571e, style: 'pigtails' }, freckles: true, dress: true, glasses: true };

// =====================================================================
// Engine contract
// =====================================================================

export interface Ctx {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  state: GameState;
  /** The shared #ui element. Append your own container; never restyle or hide #ui itself. */
  ui: HTMLElement;
  lights: { sun: THREE.DirectionalLight; hemi: THREE.HemisphereLight };
}

export interface System {
  update(dt: number): void;
}

export type SfxName =
  | 'swing'      // club whoosh at impact
  | 'hit'        // clean full-swing contact
  | 'putt'       // putter tap
  | 'bounce'     // ball lands on grass
  | 'sand'       // ball lands in a bunker
  | 'splash'     // ball in the water
  | 'cup'        // ball drops in the hole
  | 'tick'       // UI: club change, meter start
  | 'click'      // UI: meter power/accuracy tap
  | 'cheer'      // small gnome cheer (birdie or better)
  | 'light'      // lighter flick and a first puff (cigarillo lit)
  | 'crack'      // can of golf water cracked open
  | 'sip'        // gulp
  | 'whirl'      // Gnome Disc: one whoosh per turn of the whirl
  | 'wheee'      // Gnome Disc: the gnome yells as he is let go
  | 'flail'      // Gnome Disc: mid-air arm flap and a "hup!"
  | 'chains'     // Gnome Disc: gnome hits the basket chains
  | 'thud';      // Gnome Disc: gnome lands face first

// =====================================================================
// Online play (online.ts runs it; lobby.ts, hud.ts, party.ts and remotes.ts draw it)
// =====================================================================

/**
 * 'together': one group plays the hole like a real foursome (up to 12, in carts of 4): everyone has their own
 *   ball, whoever is farthest from the pin plays next, and every cart drives to that ball to watch.
 * 'race' (GNOME W FRIENDS): everyone plays their own round at once in their own cart; points per hole for strokes,
 * plus a speed bonus for the fastest three on each hole (raceScore.ts). Most points wins.
 */
export type Format = 'together' | 'race';

export interface XYZ { x: number; y: number; z: number }

/** Race mode: what another player's game looks like right now (relayed about 8 times a second). */
export interface RacePose {
  /** 0-based hole they are on. */
  hole: number;
  phase: Phase;
  mode: GameMode;
  /** Their cart (same meaning as mowerPose()). */
  cart: { x: number; y: number; z: number; facing: number; speed: number };
  /** True while they ride their cart (phase 'drive'). */
  riding: boolean;
  /** Where their gnome stands (state.party.golfer) when not riding. */
  golfer: { x: number; y: number; z: number; facing: number };
  /** Their ball: in flight (sampled from the flight) or at rest. In disc mode: the flying gnome. */
  ball: XYZ;
  /** Seconds from their round start to finishing the last hole; null until then. */
  finishedS: number | null;
  /** The sender's performance.now() when this pose was taken (ms), for interpolation timing. */
  ms?: number;
}

/** One human in an online round. Kept after they leave (left = true) so the scorecard still shows them. */
export interface Golfer {
  id: number;
  name: string;
  /** One of PLAYER_COLORS from @lawn/mp (0xRRGGBB): their hat, name tag and (race) cart. */
  color: number;
  /** Their ball on the current hole (together mode; in race mode their pose's ball). */
  ball: XYZ;
  lie: Lie;
  /** Strokes on the current hole (incl. penalties). */
  strokes: number;
  /** Done with the current hole (holed out or picked up). */
  holed: boolean;
  /** Score per hole, null if not played (or before they joined). */
  scores: (number | null)[];
  /** Race: seconds from their first aim on each hole to holing out; null if not holed out (or picked up). */
  times: (number | null)[];
  /** 0-based hole index they joined the round on (0 = there from the start). */
  joinedHole: number;
  left: boolean;
  /** Race mode: their latest pose (mine too, updated as I send it), or null before the first one. */
  race: RacePose | null;
  /** A custom gnome from @lawn/gnome; absent means the golf outfit (GOLFER_LOOK). */
  look?: GnomeLook;
}

export interface OnlineView {
  format: Format;
  /** My player id and the host's. The host decides turns and holes (together) and starts the round. */
  me: number;
  hostId: number;
  /** Room code, or null for the public lobby. */
  code: string | null;
  /** Round seed (wind per hole). */
  seed: number;
  /** false while in the lobby (phase 'title', carts parked at the first tee). */
  started: boolean;
  /** Everyone in join order, me included. */
  golfers: Golfer[];
  /** Together mode: whose ball is being played (everyone watches it); null between holes. */
  turn: number | null;
  /** Pass the phone: one device, no network. `me` and `hostId` follow `turn`, so whoever holds the phone plays. */
  hotseat?: boolean;
  /** Pass the phone: the phone is between hands, so nobody may aim until the next player taps ready. */
  handoff?: boolean;
}

/** Up to this many gnomes per cart (together mode). Seats 0-1 face forward, seats 2-3 (the back bench) face backwards. */
export const CART_SEATS = 4;
/** Together-mode cart colours, by cart index (cart k carries golfers 4k..4k+3 in join order). */
export const CART_COLORS: readonly number[] = [0xd8342c, 0x2a6fd6, 0xf2c230];
/** The 4-seat cart's collision box, centred on the cart's origin (cartModel.ts must fit inside it). Yards. */
export const CART_BOX = { halfWidth: 0.8, halfLength: 1.5, height: 2.1 } as const;
/** Together mode: parked carts line up behind the first one, this far apart (yards). */
export const CONVOY_GAP = 3.8;

export const NET = {
  /** Together mode: the shooter relays aim and swing this often while aiming (Hz). */
  aimHz: 10,
  /** Race mode: pose updates per second. */
  poseHz: 8,
  /** Everyone relays a heartbeat this often (s): the server drops members silent for 8 s. */
  heartbeatS: 2.5,
  /** The server sends a beat every second; nothing for this long = connection lost (drop it and reconnect). */
  stallS: 5,
  /** Keep trying to get my seat back this long after a drop (the server holds it for RESUME_S = 45 s). */
  reconnectS: 40,
} as const;

/** The golfer look with this hat colour (each online player's gnome). */
export function lookWithHat(hat: number, base: GnomeLook = GOLFER_LOOK): GnomeLook {
  return { ...base, hat };
}

/**
 * What the online controller offers the UI (lobby.ts, hud.ts). Created by createOnline() in online.ts.
 * Everything here is safe to call at any time; calls that do not apply right now do nothing.
 */
export interface OnlineApi {
  /** False when this build has no matchmaking server (serverUrl() is ''). */
  readonly available: boolean;
  /** 'off': not online. 'connecting': opening the socket or queueing. 'lobby': in a match, round not started. 'playing': round started. */
  readonly status: 'off' | 'connecting' | 'lobby' | 'playing';
  /** Last problem to show (bad name, server unreachable, connection lost), '' when none. */
  readonly message: string;
  /** The connection dropped mid-match and I am trying to get my seat back (show "Reconnecting…"). */
  readonly reconnecting: boolean;
  /** Am I the host (picks game and format, starts the round, advances holes in together mode)? */
  readonly isHost: boolean;
  /** The lobby's choice (the host's, mirrored to everyone). */
  readonly game: GameMode;
  readonly format: Format;
  /** My saved name (localStorage), or a generated one. */
  readonly name: string;
  /** Checks a name with the shared filter: null if fine, else the reason to show. */
  checkName(name: string): string | null;
  /** Connect and join: code null = the public lobby, else a room code (4-8 of A-Z, 0-9; lower case is fine). Saves the name. */
  join(code: string | null, name: string): void;
  /** Leave the match or the queue and go back to the solo title screen. */
  leave(): void;
  /** Host, in the lobby: choose the game and format (everyone's lobby shows it). */
  configure(game: GameMode, format: Format): void;
  /** Host, in the lobby: start the round for everyone. */
  start(): void;
  /** Pass the phone: 2-4 golfers share this device, taking turns (together format, no network). */
  startHotseat(names: string[], game: GameMode): void;
  /** Pass the phone: the next golfer taps ready (clears the handoff). */
  readyHandoff(): void;
  /**
   * Scorecard button. Together: host only, starts the next hole for everyone (after the last: back to the lobby).
   * Race: my own next hole; after the final card, host only: back to the lobby.
   */
  next(): void;
  /** Can I press the scorecard button right now (false = show "Waiting for the host")? */
  canNext(): boolean;
}

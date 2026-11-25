// Drainpipe Court (batch 3 E19, source items L59/L60): the public basketball court in Founders' Green, Downtown Turfton.
// Shared constants and types for court/*.ts. Pure: no three.js, no DOM.
//
// Basketball is GBA GJAM's simulation (@lawn/jam JamSimulation), run 2v2 on its own court frame and drawn here scaled by
// COURT_SCALE: GJAM's gnomes are 1.25x a street gnome, so 0.8 keeps every proportion (rim 2.44 m for a 1 m gnome).
// Sim frame: +x is the home team's attacking hoop, metres, facing = yaw. World = COURT_ORIGIN + sim * COURT_SCALE
// on x and z, y = ground + sim.y * COURT_SCALE (the court's long axis runs east-west). The player is home slot 0.
import { COURT_HALF_X, COURT_HALF_Z, HOOP_X, HOOP_Y, THREE_PT_RADIUS } from '@lawn/jam';
import type { Blip, InputState } from '../types';

/** Centre of the court = the E01 site `basketball-court` centre. The site rect is x -110..-70, z 16..44 (flat). */
export const COURT_ORIGIN = { x: -90, z: 30 } as const;
export const COURT_SCALE = 0.8;
export const COURT_SITE = { minX: -110, maxX: -70, minZ: 16, maxZ: 44 } as const;

/** The court in world metres (y values are heights above the court's ground). Exported for E18/E21. */
export const COURT = {
  x: COURT_ORIGIN.x,
  z: COURT_ORIGIN.z,
  /** Half length (x) and half width (z) of the painted court: 9.2 x 4.96. */
  halfX: COURT_HALF_X * COURT_SCALE,
  halfZ: COURT_HALF_Z * COURT_SCALE,
  /** Rim height above the ground (2.44) and the three-point radius (4.32) round each hoop. */
  hoopY: HOOP_Y * COURT_SCALE,
  threeRadius: THREE_PT_RADIUS * COURT_SCALE,
  /** The two rims (world x, z). 'left' is the west hoop (home defends it), 'right' the east hoop (home attacks it). */
  hoops: [
    { side: 'left' as const, x: COURT_ORIGIN.x - HOOP_X * COURT_SCALE, z: COURT_ORIGIN.z },
    { side: 'right' as const, x: COURT_ORIGIN.x + HOOP_X * COURT_SCALE, z: COURT_ORIGIN.z },
  ],
} as const;

export function simToWorld(sx: number, sz: number): { x: number; z: number } {
  return { x: COURT_ORIGIN.x + sx * COURT_SCALE, z: COURT_ORIGIN.z + sz * COURT_SCALE };
}

export function worldToSim(x: number, z: number): { x: number; z: number } {
  return { x: (x - COURT_ORIGIN.x) / COURT_SCALE, z: (z - COURT_ORIGIN.z) / COURT_SCALE };
}

// ---- Places and people -----------------------------------------------------------------------------------------------

export interface Spot { x: number; z: number; yaw: number }

/** The chalk scoreboard on its easel by the south sideline: E here starts a pickup game. */
export const SCOREBOARD: Spot = { x: -90, z: 37.5, yaw: Math.PI };
/** The ball cage by the east end: E here takes a ball for a shootaround (free shooting, no opponents). */
export const BALL_CAGE: Spot = { x: -77.5, z: 22, yaw: -Math.PI / 2 };
/** The bench older than the court (Old Burdock's), north side, facing the court. */
export const OLD_BENCH: Spot = { x: -95, z: 21.5, yaw: 0 };
/** Prompt range for SCOREBOARD and BALL_CAGE, metres. */
export const COURT_RANGE = 2.5;

export type CourtPersonId = 'cardoon' | 'lintel' | 'pansy' | 'benchley';

export interface CourtPerson {
  id: CourtPersonId;
  name: string;
  /** Where they stand or sit when no game is on. */
  spot: Spot;
  /** GJAM ratings 0..100 (speed, threePt, dunk, defense) when they play. */
  stats: { speed: number; threePt: number; dunk: number; defense: number };
  /** Shirt number on the chalk scoreboard. */
  number: number;
}

/** The regulars (lore: docs/lore/entries/apocrypha/). Cardoon and Lintel are the opponents; Pansy is the player's teammate. */
export const COURT_PEOPLE: Record<CourtPersonId, CourtPerson> = {
  cardoon: { id: 'cardoon', name: 'Cardoon "Swish" Trowelly', spot: { x: -84.5, z: 30, yaw: Math.PI / 2 },
    stats: { speed: 70, threePt: 85, dunk: 55, defense: 70 }, number: 7 },
  lintel: { id: 'lintel', name: 'Lintel Crossover', spot: { x: -97, z: 38, yaw: Math.PI }, // all fakes
    stats: { speed: 80, threePt: 55, dunk: 65, defense: 60 }, number: 3 },
  pansy: { id: 'pansy', name: 'Pansy Rebound', spot: { x: -103, z: 22, yaw: Math.PI / 2 }, // the player's teammate
    stats: { speed: 65, threePt: 50, dunk: 70, defense: 85 }, number: 22 },
  benchley: { id: 'benchley', name: 'Old Burdock Benchley', spot: OLD_BENCH, // never plays: keeps the chalk score
    stats: { speed: 20, threePt: 40, dunk: 5, defense: 30 }, number: 0 },
};

// ---- Games -----------------------------------------------------------------------------------------------------------

export const PICKUP = {
  /** First to this many points wins (2s and 3s). Story quest #14 plays to 7. */
  target: 11,
  questTarget: 7,
  /** Acorns for a win, and for beating Swish. */
  winAcorns: 15,
  swishAcorns: 30,
  /** The sim's quarter clock is set long; the game ends on points, or at maxSeconds with the leader winning. */
  quarterSeconds: 900,
  maxSeconds: 480,
  /** 'rookie' | 'pro' | 'allstar' (GJAM difficulty) for the two opponent sets. */
  difficulty: { regulars: 'rookie', swish: 'pro' } as const,
} as const;

/** Who the player and Pansy play: two regulars who happen to be about, or Cardoon and Lintel properly. */
export type Opponents = 'regulars' | 'swish';

export interface PickupOpts {
  target?: number;
  opponents?: Opponents;
  seed?: number;
}

/** What a frame of a pickup game reports (court/game.ts stepPickup). */
export type CourtEvent =
  | { kind: 'score'; team: 0 | 1; points: 2 | 3; dunk: boolean; byPlayer: boolean }
  | { kind: 'end'; won: boolean; score: [number, number] }
  | { kind: 'sound'; id: CourtSoundId; x: number; z: number }
  | { kind: 'burst'; x: number; y: number; z: number; type: 'fire' | 'confetti' | 'dust' }
  | { kind: 'rim'; side: 'left' | 'right'; strength: number };

/** One gnome on court, world coordinates (court/game.ts pickupView -> court/render.ts). */
export interface CourtGnomeView {
  x: number; y: number; z: number;
  yaw: number;
  /** Horizontal speed m/s (walk/run animation). */
  speed: number;
  hasBall: boolean;
  /** Airborne (jump shot, dunk, block). */
  air: boolean;
  /** Slot 0 = the player, 1 = Pansy, 2 = Cardoon (or a regular), 3 = Lintel (or a regular). */
  slot: 0 | 1 | 2 | 3;
  name: string;
}

export interface PickupView {
  gnomes: CourtGnomeView[];
  ball: { x: number; y: number; z: number };
  /** [home (player's team), away]. */
  score: [number, number];
  target: number;
  /** Seconds played. */
  t: number;
  phase: 'tipoff' | 'live' | 'scored' | 'finished';
  /** 0..1 shot charge of the player's gnome (GJAM shootHold), 0 when not shooting. */
  charge: number;
  /** 0..100 turbo left for the player's gnome. */
  turbo: number;
  /** The home slot the player steers now (GJAM hands control to whichever of the two has the ball): 0 or 1. */
  controlled: 0 | 1;
}

/** The control a frame of input gives the player's gnome (the @lawn/jam PlayerControlInput, same fields). */
export interface CourtControl {
  moveX: number; moveZ: number; turbo: boolean;
  shootDown: boolean; shootPressed: boolean; shootReleased: boolean;
  passPressed: boolean; fakePressed: boolean;
}

/** The court HUD's touch buttons this frame (court/hud.ts). Held = down now; pressed = went down since the last read. */
export interface CourtTouch {
  shootHeld: boolean;
  passPressed: boolean;
  turboHeld: boolean;
  fakePressed: boolean;
  quitPressed: boolean;
}

// ---- Shootaround (court/shootaround.ts) -------------------------------------------------------------------------------

export const SHOOT = {
  /** Seconds to fill the release meter; the sweet spot is SWEET_LO..SWEET_HI of the meter. */
  fillS: 0.9,
  sweetLo: 0.72,
  sweetHi: 0.88,
  /** Farther than this from the cage (metres) ends the shootaround. */
  leaveRange: 28,
  /** Ball flight seconds per metre of distance (min 0.6 s). */
  flightPerM: 0.09,
} as const;

export type ShootEvent =
  | { kind: 'release'; charge: number; three: boolean }
  | { kind: 'make'; three: boolean; swish: boolean }
  | { kind: 'miss'; clang: boolean }
  | null;

// ---- Runtime (court/runtime.ts) --------------------------------------------------------------------------------------

export interface CourtGameResult { won: boolean; score: [number, number]; target: number; opponents: Opponents }

/** Hooks for story quests (E20 #14 m14-drainpipe-court: startGame({ target: 7, opponents: 'swish' })). */
export interface CourtApi {
  /** Start a pickup game now (the player is put on court). Null when started, else why not. */
  startGame(opts?: PickupOpts): string | null;
  quitGame(): void;
  inGame(): boolean;
  /** Hand the player a ball for free shooting. Null when started, else why not. */
  startShootaround(): string | null;
  onGame(cb: (r: CourtGameResult) => void): () => void;
}

/** What app.ts calls. */
export interface Court {
  /** Every frame after the player and vehicles moved, with the frame's raw input. */
  update(dt: number, inp: InputState): void;
  /** On foot: the E prompt (scoreboard, ball cage), else null. */
  prompt(x: number, z: number): string | null;
  interact(x: number, z: number): boolean;
  blips(): Blip[];
  /** 'game': app.ts zeroes all the gnome's controls (court reads raw input); 'shootaround': fire, aim, jump and gun
   *  switching are held back (the ball is in hand), walking still works. */
  inputMode(): 'none' | 'shootaround' | 'game';
  /** After the chase camera: the broadcast camera during a game. True when it drove the camera. */
  applyCamera(dt: number): boolean;
  api: CourtApi;
  debug(): unknown;
}

// ---- Achievements, probes, sounds ------------------------------------------------------------------------------------

export const COURT_ACH = {
  dunk: 'gta-drainpipe-dunk',
  three: 'gta-drainpipe-three',
  win: 'gta-drainpipe-win',
} as const;

/** Quest probe names (city/probes.ts, read from the gta-sports-v1 save). */
export const COURT_PROBES = {
  games: 'jam-games',
  wins: 'jam-wins',
  threes: 'jam-threes',
  dunks: 'jam-dunks',
  swishBeaten: 'jam-swish-beaten',
  shootMakes: 'jam-shoot-makes',
} as const;

/** Sound ids (sports/sounds.ts registers them). */
export type CourtSoundId =
  | 'jam-bounce' | 'jam-swish' | 'jam-clang' | 'jam-dunk' | 'jam-whistle' | 'jam-cheer' | 'jam-drainpipe';

export const COURT_QUEST = 'sq-court-regulars';

// Winter sports (E12, docs/roadmaps/gta-batch-3/E12/roadmap.md): Snowdrop Slope with the Bootlace Tow, the Wool Run
// (skis, slalom) and the Tea-Tray Run (sled), the Woolly Sock Lodge, Pail Pond ice fishing, and the Snowcap polar bears.
// Pure types, places and tuning only: no three.js, no DOM. World coordinates: +x east, +z south (north is -z), metres;
// yaw 0 faces +z. Every place below lies inside its E01 site (`ski-hill` x -460..-240, z -1300..-1000; `ice-lake`
// x -730..-550, z -1130..-990); winter/places.test.ts checks it.
import type { Blip, InputState, Vehicle } from '../types';

// ---- Slide rider (slideRider.ts): one kinematic body for skis and the sled ------------------------------------------

/** What the rider stands on, as slideRider sees it. */
export type SlideSurface = 'snow' | 'ice' | 'other';

/** The ground under the rider. Both functions must be cheap (called a few times per sub-step). */
export interface SlideGround {
  /** Ground height at (x, z), metres. */
  height(x: number, z: number): number;
  /** The surface at (x, z): 'snow' and 'ice' slide, 'other' (grass, road, rock...) brakes hard. */
  surface(x: number, z: number): SlideSurface;
}

export interface SlideInput {
  /** -1 (left) .. 1 (right). Carve on the ground; spin in the air. */
  steer: number;
  /** 0..1: snowplough (skis) / heels down (sled). */
  brake: number;
  /** 0..1: pole push (skis) / scoot (sled); only helps below tuning.pushMax. */
  push: number;
  /** Edge: hop. Only on the ground. */
  jump: boolean;
}

export interface SlideState {
  x: number;
  y: number;
  z: number;
  /** World velocity, m/s. */
  vx: number;
  vy: number;
  vz: number;
  /** Heading, radians (0 faces +z). The rider points this way; velocity is pulled toward it by grip. */
  yaw: number;
  /** On the ground this step. */
  grounded: boolean;
  /** Seconds in the air this jump (0 on the ground). */
  air: number;
  /** Shown lean -1..1 (eased toward steer). */
  lean: number;
  /** Radians turned in the air since take-off (for spins). */
  spin: number;
  /** Smoothed ground normal (unit). */
  nx: number;
  ny: number;
  nz: number;
}

/** What stepSlide reports for one call (the last event of its sub-steps, landing wins over jumped). */
export type SlideEvent =
  | { t: 'jumped' }
  | { t: 'landed'; air: number; spins: number; impact: number }
  | { t: 'crash'; speed: number }
  | null;

export interface SlideTuning {
  /** m/s^2, the game's gravity. */
  gravity: number;
  /** Coulomb friction coefficient on snow, on ice and on 'other' ground. */
  muSnow: number;
  muIce: number;
  muOther: number;
  /** Air drag: a = -drag * |v| * v (per metre). */
  drag: number;
  /** Carve: yaw rate at full steer, rad/s, reached from carveSpeed m/s up (scaled down linearly below it). */
  carve: number;
  carveSpeed: number;
  /** Lateral grip: the sideways part of the ground velocity decays as exp(-grip * dt). */
  grip: number;
  /** Extra friction coefficient at brake 1. */
  brakeMu: number;
  /** Push acceleration at push 1, m/s^2, only while horizontal speed < pushMax. */
  pushAccel: number;
  pushMax: number;
  /** Hop: vy kick, m/s. */
  jumpV: number;
  /** Air spin rate at full steer, rad/s. */
  airSpin: number;
  /** Landing bounce: vy = impact * bounce when impact > bounceMin (sled bumps); 0 = none. */
  bounce: number;
  bounceMin: number;
  /** Speed clamp, m/s. */
  maxSpeed: number;
  /** Sub-step length cap, seconds (<= 1/60). */
  maxStep: number;
  /** Half-span of the three height samples for the normal, metres. */
  probe: number;
  /** Normal smoothing: the shown normal eases to the measured one at this rate, per second. */
  normalRate: number;
  /** A wall hit at more than this speed (m/s, into the wall) reports 'crash'. */
  crashSpeed: number;
}

export const SKI: SlideTuning = {
  gravity: 18, muSnow: 0.045, muIce: 0.02, muOther: 0.6, drag: 0.0035,
  carve: 2.2, carveSpeed: 3, grip: 5, brakeMu: 0.35, pushAccel: 4, pushMax: 5, jumpV: 5,
  airSpin: 6, bounce: 0, bounceMin: 99, maxSpeed: 60, maxStep: 1 / 60, probe: 0.6, normalRate: 10, crashSpeed: 14,
};

export const SLED: SlideTuning = {
  gravity: 18, muSnow: 0.07, muIce: 0.03, muOther: 0.7, drag: 0.005,
  carve: 1.2, carveSpeed: 3, grip: 2.5, brakeMu: 0.45, pushAccel: 2.5, pushMax: 3, jumpV: 3,
  airSpin: 3, bounce: 0.35, bounceMin: 3, maxSpeed: 60, maxStep: 1 / 60, probe: 0.6, normalRate: 8, crashSpeed: 12,
};

// ---- Places ----------------------------------------------------------------------------------------------------------

export interface Spot { x: number; z: number; yaw?: number }

/** The Woolly Sock Lodge at the foot of Snowdrop Slope: its centre, front door facing east (+x). */
export const LODGE = { x: -449, z: -1020, yaw: Math.PI / 2, size: 14 } as const;
/** Interaction spots on the lodge porch (prompt range RANGE). */
export const SLED_STACK: Spot = { x: -437, z: -1013 };
export const COCOA_HATCH: Spot = { x: -437, z: -1020 };
export const SKI_RACK: Spot = { x: -437, z: -1027 };
export const RANGE = 2.4;

/** The Bootlace Tow: a rope tow from the foot to near the top, up the east side of the slope. */
export const TOW = {
  base: { x: -300, z: -1028 },
  top: { x: -325, z: -1270 },
  /** m/s along the line. */
  speed: 8,
  /** A rider (skis or sled, moving slower than grabSpeed) within grabRange of the base can grab a handle. */
  grabRange: 4,
  grabSpeed: 7,
  /** Rope height above the ground, metres, and how far behind the handle the rider trails. */
  ropeY: 1.1,
  /** Pylons along the line (count, ends included) and handles on the rope loop. */
  pylons: 7,
  handles: 24,
} as const;

export type RunId = 'wool-run' | 'tea-tray-run';

export interface Gate { x: number; z: number; /** Half the gap between the two poles, metres. */ half: number }

export interface RunDef {
  id: RunId;
  name: string;
  /** Which ride the run is for. */
  ride: 'snow-skis' | 'tea-tray-sled';
  /** Start line: crossing z = start.z heading south (+z) with |x - start.x| <= start.half starts the clock. */
  start: Gate;
  /** Slalom gates in order, north to south. Empty for the sled run. */
  gates: readonly Gate[];
  /** Finish line: crossing z = finish.z heading south with |x - finish.x| <= finish.half stops it. */
  finish: Gate;
  /** Seconds added per missed gate. */
  penalty: number;
  /** A finished run slower than this is still a finish; par for "under par" toasts. */
  parS: number;
}

export const WOOL_RUN: RunDef = {
  id: 'wool-run', name: 'the Wool Run', ride: 'snow-skis',
  start: { x: -350, z: -1255, half: 12 },
  gates: [
    { x: -375, z: -1225, half: 3.5 },
    { x: -350, z: -1195, half: 3.5 },
    { x: -375, z: -1165, half: 3.5 },
    { x: -350, z: -1135, half: 3.5 },
    { x: -375, z: -1105, half: 3.5 },
    { x: -350, z: -1075, half: 3.5 },
  ],
  finish: { x: -360, z: -1045, half: 22 },
  penalty: 3,
  parS: 22,
};

export const TEA_TRAY_RUN: RunDef = {
  id: 'tea-tray-run', name: 'the Tea-Tray Run', ride: 'tea-tray-sled',
  start: { x: -405, z: -1250, half: 14 },
  gates: [],
  finish: { x: -405, z: -1040, half: 18 },
  penalty: 0,
  parS: 22,
};

export const RUNS: readonly RunDef[] = [WOOL_RUN, TEA_TRAY_RUN];

/** A clean Wool Run (no missed gate) at or under this many seconds earns Black Diamond. */
export const BLACK_DIAMOND_S = 18;

/** Rental prices (Acorns) and how many rented rides of each kind may exist at once (older ones are removed). */
export const RENT = { skis: 8, sled: 4, max: 2, cocoa: 6, ownSled: 30 } as const;

/** Pail Pond (E01 site `ice-lake`): the frozen pail, ice within ICE_R of its centre (terrain paint). */
export const PAIL_POND = { x: -640, z: -1060, r: 62 } as const;
/** Thermos Theo's shanty on the ice (lends a jigging rod, sells nothing). */
export const SHANTY: Spot = { x: -612, z: -1040, yaw: -Math.PI / 2 };

/** Ice holes: drilling time, radius, how many stay open at once (the oldest refreezes). */
export const ICE = { drillS: 1.6, holeR: 0.45, maxHoles: 4, /** Stand this close to drill or fish a hole. */ reach: 2.5 } as const;

/** The Snowcap polar bears (critters/snowcap.ts), each being chill in its own way. */
export type BearPose = 'nap' | 'tube' | 'fish' | 'mug';
export interface BearSpot { id: string; x: number; z: number; yaw: number; pose: BearPose }
export const SNOWCAP_BEARS: readonly BearSpot[] = [
  { id: 'pond-nap', x: -662, z: -1078, yaw: 0.6, pose: 'nap' },
  { id: 'pond-tube', x: -628, z: -1090, yaw: 0, pose: 'tube' },
  { id: 'pond-fisher', x: -604, z: -1052, yaw: -1.3, pose: 'fish' },
  { id: 'lodge-mug', x: -438, z: -1035, yaw: Math.PI / 2, pose: 'mug' },
];
/** The Fells' Bear Deck (critters/fells.ts DECK_CX/DECK_CZ): map blip and the trail sign. */
export const BEAR_DECK = { x: 330, z: -640 } as const;
/** Standing within this many metres of a bear counts for Bear Hug. */
export const HUG_RANGE = 3.5;

// ---- Achievements, probes, app ---------------------------------------------------------------------------------------

export const WINTER_ACHIEVEMENTS = {
  teaTray: 'gta-tea-tray-run',
  firstTracks: 'gta-first-tracks',
  blackDiamond: 'gta-black-diamond',
  iceStation: 'gta-ice-station',
  bearHug: 'gta-bear-hug',
} as const;
/** Ice Station target (catches through the ice) and Bear Hug target (5 deck bears + 4 Snowcap bears). */
export const ICE_STATION_TARGET = 3;
export const BEAR_HUG_TARGET = 9;

/** Quest probes (city/probes.ts, read from the gta-winter-v1 save). */
export const WINTER_PROBES = {
  sledRuns: 'winter-sled-runs',
  skiRuns: 'winter-ski-runs',
  holes: 'ice-holes',
  catches: 'ice-catches',
} as const;

export const WINTER_APP_ID = 'ski-runs';

// ---- Save (save.ts) ------------------------------------------------------------------------------------------------

export const WINTER_SAVE_KEY = 'gta-winter-v1';

export interface WinterSave {
  v: 1;
  /** Best finished time per run, seconds (penalties included). */
  best: Partial<Record<RunId, number>>;
  /** Finished runs per run. */
  runs: Partial<Record<RunId, number>>;
  /** Clean Wool Runs (no missed gate). */
  clean: number;
  /** Owns a tea-tray sled (dropped anywhere on snow from the app). */
  sled: boolean;
  /** Fish landed through the ice. */
  iceCatches: number;
  /** Holes drilled. */
  holes: number;
  /** Bears stood beside, by key `${Math.round(x)},${Math.round(z)}`. */
  hugged: string[];
}

// ---- Runs (course.ts) ----------------------------------------------------------------------------------------------

export interface RunState {
  run: RunDef;
  phase: 'ready' | 'running' | 'done';
  /** Seconds since the start line (running) or the final raw time (done). */
  t: number;
  /** Index of the next gate to pass. */
  next: number;
  passed: number;
  missed: number;
}

export interface RunResult {
  id: RunId;
  /** Raw seconds + penalties. */
  seconds: number;
  missed: number;
  clean: boolean;
  /** Ridden with the run's own ride. */
  ride: Vehicle['kind'];
}

export type RunEvent =
  | { t: 'start' }
  | { t: 'gate'; index: number; ok: boolean }
  | { t: 'finish'; result: Omit<RunResult, 'ride'> }
  | null;

// ---- Tow (tow.ts) --------------------------------------------------------------------------------------------------

export interface TowRide {
  /** Metres along the line from the base. */
  s: number;
  /** Line length, metres. */
  len: number;
  done: boolean;
}

// ---- Runtime (runtime.ts) ------------------------------------------------------------------------------------------

/** Hooks for story epics (E18, E21): read from winterApi() once the game has installed the runtime. */
export interface WinterApi {
  /** Put the player on the run's ride at its start line (rents for free). Null on success, else why not. */
  startRun(id: RunId): string | null;
  /** True on Snowdrop Slope's snow (inside the ski-hill site and on snow). */
  isOnSlope(x: number, z: number): boolean;
  /** Called with every finished run; returns an unsubscribe. */
  onFinish(cb: (r: RunResult) => void): () => void;
}

/** What app.ts calls on the winter runtime (runtime.ts installWinter). */
export interface Winter {
  /** True when `v` is a sled or skis the player rides: app.ts must not step it (stepRider does). */
  drives(v: Vehicle): boolean;
  /** app.ts calls this in the vehicle-step slot for a ride `drives` claimed. */
  stepRider(v: Vehicle, inp: InputState, dt: number): void;
  /** Every frame: tow, runs, HUD, ice holes, bear hugs, rentals. */
  update(dt: number): void;
  blips(): Blip[];
  /** Standing at a lodge spot, the shanty or on ice: the E prompt, else null. */
  prompt(x: number, z: number): string | null;
  /** E there: true when handled. */
  interact(x: number, z: number): boolean;
  /** fishing.ts onCatch: a fish was landed on `water`. */
  onCatch(water: string): void;
  api: WinterApi;
  /** Trainer / debug (?debug __gta.winter). */
  debug(): WinterDebug;
}

export interface WinterDebug {
  riding: Vehicle['kind'] | null;
  speed: number;
  towing: boolean;
  run: { id: RunId; phase: RunState['phase']; t: number; next: number; missed: number } | null;
  holes: number;
  save: WinterSave;
}

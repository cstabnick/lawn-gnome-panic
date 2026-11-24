// Quest sim contracts (docs/roadmaps/gta-quest-sim.md). Type-only except the cheat table. The same solvers run in both
// layers: the headless layer (harness.ts, vitest) and the browser layer (browser.ts, tools/quest-sim.mjs), through SimCtx.
import type { DriveControls, Npc, Npcs, Player, Vehicle, VehicleKind, Watch, World } from '../types';
import type { Economy } from '../economy';
import type { Quests } from '../quests/quests';
import type { ObjectiveDef } from '../quests/types';

// ---- Cheats --------------------------------------------------------------------------------------------------------

/**
 * What the bot may cheat on: only things that do not decide whether the quest logic works. Kill counts, deliveries,
 * race and gate times, reaching places and choices are always done through the game's own rules.
 */
export interface Cheats {
  /** Never run out of water. */
  infiniteAmmo: boolean;
  /** Player health is topped up every step. */
  godMode: boolean;
  /** Heat is cleared every step (no Hat Watch chase), except right after a quest adds it (the sim records the add). */
  noHeat: boolean;
  /** Teleport instead of walking or driving between places (never during a timed run or a chase). */
  instantTravel: boolean;
  /** Cutscenes end after one step (the sim still checks the scene exists and compiles to a finite length). */
  skipCutscenes: boolean;
  /** Start every quest with plenty of Acorns, for things the quest makes the player buy. */
  freeAcorns: boolean;
  /** Same as noHeat for the wanted level (kept separate so the trainer can show both). */
  noWanted: boolean;
  /** Rods, licences and optics the quest does not ask the player to buy are granted. */
  unlockAllItems: boolean;
  /** Waiting (survive timers, start lights) runs with a bigger step. */
  fastClock: boolean;
  /** The player's vehicle is repaired every step, unless the objective limits damage (maxDamage). */
  vehicleRepair: boolean;
}

export type CheatId = keyof Cheats;

export const CHEAT_IDS: readonly CheatId[] = [
  'infiniteAmmo', 'godMode', 'noHeat', 'instantTravel', 'skipCutscenes', 'freeAcorns', 'noWanted', 'unlockAllItems', 'fastClock', 'vehicleRepair',
];

/** The headless default: every cheat on. */
export const ALL_CHEATS: Cheats = {
  infiniteAmmo: true, godMode: true, noHeat: true, instantTravel: true, skipCutscenes: true,
  freeAcorns: true, noWanted: true, unlockAllItems: true, fastClock: true, vehicleRepair: true,
};

/** No cheats at all (the bot walks and drives everywhere; slow). */
export const NO_CHEATS: Cheats = {
  infiniteAmmo: false, godMode: false, noHeat: false, instantTravel: false, skipCutscenes: false,
  freeAcorns: false, noWanted: false, unlockAllItems: false, fastClock: false, vehicleRepair: false,
};

// ---- Findings and results ------------------------------------------------------------------------------------------

/** Why something failed: the bot cannot do it yet, the game is wrong, the quest data is wrong, or it depends on unbuilt work. */
export type FailClass = 'bot' | 'bug' | 'content' | 'blocked';

export interface Finding {
  questId: string;
  /** Objective index, when the finding is about one step. */
  step?: number;
  /** Short check name: 'spot-in-collider', 'unlock-unreachable', 'scene-missing', 'stuck', 'reward-twice', ... */
  check: string;
  class: FailClass;
  detail: string;
}

export interface StepResult {
  step: number;
  kind: ObjectiveDef['kind'];
  status: 'pass' | 'fail' | 'skipped';
  /** Sim seconds the solver took. */
  simSeconds: number;
  detail?: string;
}

export interface QuestResult {
  questId: string;
  title: string;
  /** 'A' or 'B' for one ending of a choice quest; absent otherwise. */
  variant?: string;
  status: 'pass' | 'fail' | 'blocked';
  /** The first failure, one line (empty on a pass). */
  reason: string;
  steps: StepResult[];
  cheats: { id: CheatId; why: string }[];
  findings: Finding[];
  /** What the quest paid out, as recorded by the session. */
  acorns: number;
  achievements: string[];
  bulletins: string[];
  /** Scene ids that played (intro, beats, arrival scenes, outro). */
  scenes: string[];
  /** Objective steps a comms call was found for (commsFor). */
  comms: number[];
  /** Thrown exceptions and console errors during the run. */
  errors: string[];
  simSeconds: number;
  wallMs: number;
}

// ---- The context every solver gets ---------------------------------------------------------------------------------

/** Things the probes watch that come from UI or systems outside the quest engine (city/install.ts live getters). */
export interface SimActions {
  /** Open the weapon wheel (true) or close it. */
  setWheelOpen(open: boolean): Promise<void>;
  /** Open the Pocket Kit (true) or close it. */
  setKitOpen(open: boolean): Promise<void>;
  /** Play an emote; `pair` = a two-gnome social emote next to a townsgnome. */
  emote(pair: boolean): Promise<void>;
  /** A street event the player joined ended well. */
  streetEventDone(): Promise<void>;
  /** Store the player's current vehicle in the Side-Valve Lock-Up (the player must be driving it in the bay). */
  storeInLockup(): Promise<void>;
  /** Fly / stand near a sky-banner tow plane (spawns one when none is up). */
  nearBanner(): Promise<void>;
  /** Start or join an online party. Headless: not possible (throws 'blocked'). */
  joinParty(): Promise<void>;
}

/** One way to play: the same calls run headless (harness.ts) and in the browser (browser.ts). */
export interface SimCtx {
  readonly layer: 'headless' | 'browser';
  readonly world: World;
  readonly player: Player;
  /** The live vehicle list (runners push their spawns here). */
  readonly vehicles: Vehicle[];
  readonly npcs: Npcs;
  readonly watch: Watch;
  readonly quests: Quests;
  readonly economy: Economy;
  readonly cheats: Cheats;
  readonly actions: SimActions;
  /** Mission squad units (watch.spawnSquad: convoy escorts, the boss's guards) still in play. Not in npcs.list. */
  readonly squad: Npc[];
  /** Sim seconds since the session started. */
  now(): number;
  /** Advance the game by `dt` seconds (default 1/30). Headless: one engine step. Browser: waits that long in frames. */
  step(dt?: number): Promise<void>;
  /** Hold these controls on the player's vehicle until changed; null lets go (throttle 0, steer 0, lift 0). */
  drive(c: DriveControls | null): void;
  /** Hold this foot input (walk / glide; moveY +1 = forward along camYaw) until changed; null stands still. */
  walk(input: { moveX: number; moveY: number; camYaw: number } | null): void;
  /**
   * Put the player (or the vehicle they drive) at (x, z), on the ground or deck there unless `y` is given. The caller
   * records the instantTravel cheat (useCheat) when this replaces travel.
   */
  teleport(x: number, z: number, opts?: { y?: number; yaw?: number }): void;
  /** Spawn a vehicle of `kind` at (x, z) facing `yaw` into the live list (the trainer's / ?debug spawn). */
  spawnVehicle(kind: VehicleKind, x: number, z: number, yaw: number): Vehicle;
  /** Take the driver's seat of `v` (the game's takeWheel). */
  enter(v: Vehicle): void;
  /** Leave the vehicle (stands at its side). */
  exit(): void;
  /** Leave a flyer in mid-air (the player's bail); false when too low. */
  bail(): boolean;
  /**
   * Shoot `npc` the way a water-gun bullet does (app.ts hitTest): a pedestrian / quest target goes through
   * quests.onCracked + npcs.crack; a Hat Watch or squad unit through watch.crack (repeated until it cracks). The bot
   * must be within 40 m (the caller moves there first).
   */
  shoot(npc: Npc): void;
  /** Record that a cheat was used (once per id per quest run is enough). */
  useCheat(id: CheatId, why: string): void;
  /** A line for the report / HUD ('solving: visit (120, -40)'). */
  log(msg: string): void;
}

/** Everything a session saw happen, for the runner's checks and the report. The browser layer fills what it can. */
export interface SessionRecord {
  toasts: string[];
  banners: string[];
  achievements: string[];
  bulletins: string[];
  /** Every economy.earn: amount and reason ('Quest: <title>' for a quest's reward). */
  earned: { amount: number; reason: string }[];
  /** Scenes the cutscene player was asked to play: a script id, or 'dialogue:<title>' / 'contract'. */
  scenes: string[];
  /** Scene problems: a script that compiles to no length or throws. */
  sceneErrors: string[];
  /** onObjectiveStart calls, and whether comms had a call for it. */
  objectiveStarts: { questId: string; step: number; comms: boolean }[];
  /** 'call' steps that fired from scenes. */
  triggers: string[];
  cheats: Map<CheatId, string>;
  log: string[];
  errors: string[];
  /** Heat the quest added (watch.addHeat), summed. */
  heatAdded: number;
}

/** A SimCtx the runner can read back and close. */
export interface RunSession extends SimCtx {
  readonly record: SessionRecord;
  dispose(): void;
}

/** Opens sessions for the runner: headless (harness.ts) or in the page (browser.ts). */
export interface SessionHost {
  /** A fresh profile holding exactly these quest saves (gta-quests-v1), then a session on it. */
  open(saves: Record<string, import('../quests/types').QuestSave>, cheats: Cheats): Promise<RunSession>;
  /** The save round trip: close `old` and open a session that loads what it saved. Null = not supported (browser). */
  reopen: ((old: RunSession) => Promise<RunSession>) | null;
}

// ---- Solvers -------------------------------------------------------------------------------------------------------

export interface SolveOpts {
  questId: string;
  /** The objective index being solved. */
  step: number;
  /** For 'choice': which option to take. */
  choice?: 'A' | 'B';
  /** Sim seconds before the solver must give up. */
  budget: number;
}

/**
 * One objective kind. `solve` acts until the quest engine moves past `opts.step` (see util.ts stepDone) or the budget is
 * spent; it throws SimFail to explain a failure. `check` is optional static validation of the objective's data.
 */
export interface Solver<K extends ObjectiveDef['kind'] = ObjectiveDef['kind']> {
  kind: K;
  solve(obj: Extract<ObjectiveDef, { kind: K }>, ctx: SimCtx, opts: SolveOpts): Promise<void>;
  check?(obj: Extract<ObjectiveDef, { kind: K }>, world: World, questId: string, step: number): Finding[];
}

/** Thrown by solvers and the runner: the run failed for this reason. */
export class SimFail extends Error {
  constructor(readonly failClass: FailClass, message: string) {
    super(message);
    this.name = 'SimFail';
  }
}

// ---- Plans (plans.ts) -----------------------------------------------------------------------------------------------

/** What the sim expects of a quest. The CI suite fails when a result differs from it. */
export type Expectation = 'pass' | { status: 'fail' | 'blocked'; class: FailClass; reason: string };

export type SimSuite = 'story' | 'side' | 'city' | 'newcomers' | 'races';

export interface QuestPlan {
  /** Which sim suite file runs it (<suite>.sim.test.ts, opt-in). */
  suite: SimSuite;
  /** Run once per ending ('A', 'B') for a quest with a 'choice' objective; absent = one run. */
  variants?: ('A' | 'B')[];
  /** Sim-second budget per objective (default 600). */
  budget?: number;
  expect: Expectation;
  note?: string;
}

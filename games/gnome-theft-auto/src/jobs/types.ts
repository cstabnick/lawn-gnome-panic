// Sim jobs (docs/roadmaps/gta-sim-jobs-and-tubing.md): the contracts every jobs module shares. Pure types, no imports
// of game systems at runtime. Four jobs (taxi driver, courier, pilot, boat driver) run the same machine: a GIG is a list
// of STOPS (pick up, drop off, fly through a gate, land, drop cargo) that the vehicle reaches; a comfort/condition
// rating runs while passengers or parcels are aboard; pay, tips, XP and a career level come out at the end.
//
// Online: jobs are per player (own state, own save, own Acorns). The world they use is shared, through the online hub
// (online/hub.ts) with three systems (protocol.ts): SYS.cab (a real player calls a cab; drivers take it), SYS.pax (NPC
// passengers and parcels in a job vehicle, seen by everyone) and SYS.tow (a boat's tow line, riders and NPC tubes).
import type * as THREE from 'three';
import type { Economy } from '../economy';
import type { Phone } from '../phone/phone';
import type { TimeLabel } from '../atmosphere';
import type { Blip, Box, Hud, InputState, Player, Sfx, Vehicle, VehicleKind, World } from '../types';
import type { Hub } from '../online/hub';

export type JobId = 'taxi' | 'courier' | 'pilot' | 'boat';
export const JOB_IDS: readonly JobId[] = ['taxi', 'courier', 'pilot', 'boat'];

/** A fare's or passenger's temperament: changes what they mind and how they tip. */
export type Personality = 'plain' | 'hurry' | 'nervous' | 'chatty' | 'celebrity';
export const PERSONALITIES: readonly Personality[] = ['plain', 'hurry', 'nervous', 'chatty', 'celebrity'];

/** Courier parcel types. food: hot, short deadline. fragile: damage ruins it. heavy: needs a vehicle of mass >= 2.5.
 *  vip: big pay, strict deadline. mail: a bundle of letters (Pigeon-Drop's mail round), many cheap drops. */
export type ParcelKind = 'food' | 'fragile' | 'heavy' | 'vip' | 'mail';
export const PARCEL_KINDS: readonly ParcelKind[] = ['food', 'fragile', 'heavy', 'vip', 'mail'];

/**
 * What a gig is. fare: taxi NPC fare. player-fare: a real online player called a cab. route: courier multi-drop.
 * charter: pilot passengers from pad/stand to a landing zone. scenic: fly through sky gates and land back. cargo: fly
 * a crate to a drop zone and release it (job action). water-taxi: boat passenger dock to dock. ferry: the scheduled
 * Loch Moss loop with due times at each stop.
 */
export type GigKind = 'fare' | 'player-fare' | 'route' | 'charter' | 'scenic' | 'cargo' | 'water-taxi' | 'ferry';

/**
 * What reaching a stop means (gig.ts stepGig):
 *   pickup / drop: inside `radius` (2D), |speed| < maxSpeed, held for `dwell` seconds.
 *   land: as pickup, and aboveGround <= 0.6 (an aircraft on the ground).
 *   gate: inside `radius` (2D) and minAlt <= aboveGround <= maxAlt: passed at once (no dwell).
 *   cargo: inside `radius` (2D) when the job action is pressed: passed at once; the crate's landing is scored.
 */
export type StopAction = 'pickup' | 'drop' | 'land' | 'gate' | 'cargo';

export interface Stop {
  /** Place id (places.ts) or a generated id ('kerb-123', 'addr-4'). */
  id: string;
  /** Shown in the HUD: "Clay-Mart", "12 Fern Row", "Gate 2". */
  name: string;
  x: number;
  z: number;
  action: StopAction;
  radius: number;
  /** m/s: slower than this to count (pickup, drop, land). */
  maxSpeed: number;
  /** Seconds held inside (pickup, drop, land). */
  dwell: number;
  /** Gates: height above ground band, metres. */
  minAlt?: number;
  maxAlt?: number;
  /** Soft deadline: seconds since the gig started. Late arrival lowers pay; it never fails the gig. */
  due?: number;
  /** Hard deadline: seconds since the gig started. Not reached by then: the gig fails with `hardReason`. */
  hardDue?: number;
  hardReason?: string;
  /** Courier drop: which parcel is handed over here. */
  parcel?: ParcelKind;
  /** player-fare pickup: also needs the calling player seated in my vehicle (Sample.playerAboard). */
  needsPlayer?: boolean;
  /** Ferry stops: NPC passengers boarding here (seated by the runtime). */
  board?: number;
}

export interface Gig {
  job: JobId;
  kind: GigKind;
  /** HUD title: "Fare: Bess Rootley", "Pigeon-Drop round (3 parcels)", "Charter to Fort Sandpit". */
  title: string;
  /** NPC client name, or the calling player's name. */
  client: string;
  personality: Personality;
  /** A real player fare: the call key (cabCalls.ts callKey) and the player id. */
  playerFare?: { key: string; id: number; from: number };
  stops: Stop[];
  /** Acorns before time, tip and condition. */
  basePay: number;
  /** Seconds the whole gig should take (pay falls off past it); 0 = no clock. */
  timeLimit: number;
  /** NPC passengers aboard after the first pickup (taxi 1, charter 1, water taxi 1-3, ferry by stop). */
  passengers: number;
  /** Courier: parcels aboard after the depot pickup (one per drop stop, in stop order). */
  parcels: ParcelKind[];
  /** For NPC looks and chatter picks. */
  seed: number;
}

export type GigPhase = 'running' | 'done' | 'failed';

/** Live ride quality. score 100 = perfect; stepComfort takes points off and slowly gives some back. */
export interface ComfortState {
  score: number;
  jolts: number;
  crashes: number;
  runOvers: number;
  /** Seconds airborne in a ground vehicle or boat (jumps), or seconds stalled in an aircraft. */
  air: number;
  stalls: number;
  /** Seconds of rough water at speed (boats). */
  rough: number;
  /** Previous frame, for jerk and turn rate. */
  lastSpeed: number;
  lastYaw: number;
  lastVy: number;
  /** False until the first sample (no jerk on frame one). */
  primed: boolean;
}

export interface GigState {
  gig: Gig;
  /** Index of the stop being driven to. stops.length once all are reached. */
  idx: number;
  phase: GigPhase;
  /** Seconds since start. */
  t: number;
  /** Seconds held inside the current stop. */
  dwellT: number;
  /** Seconds out of the job vehicle (fails at OUT_OF_VEHICLE_S). */
  outT: number;
  comfort: ComfortState;
  /** Courier parcels' condition 0..1 (1 = mint). */
  condition: number;
  /** Seconds since start when each reached stop was reached. */
  reachedAt: number[];
  /** Cargo / landing stops: 0..100 accuracy per reached stop index (absent for other stops). */
  scores: Record<number, number>;
  /** Touchdown vertical speed on the last 'land' stop, m/s (negative = down). */
  touchdownVy: number;
  failReason: string | null;
}

/** What stepGig reports for one frame. */
export type GigEvent =
  | { t: 'reached'; stop: number }
  | { t: 'done' }
  | { t: 'failed'; reason: string }
  | null;

/** One frame of the job vehicle, sampled by the runtime. */
export interface Sample {
  x: number;
  y: number;
  z: number;
  /** |forward speed|, m/s. */
  speed: number;
  yaw: number;
  /** Vertical speed, m/s (+ up). */
  vy: number;
  /** Metres above the ground (or the water surface for boats). */
  aboveGround: number;
  /** Hit points lost this frame (>= 0). */
  hpLoss: number;
  /** Ran a pedestrian over this frame. */
  ranOver: boolean;
  /** Boats: wave steepness under the hull 0..~0.3 (|waveSlope|), 0 on land and in the air. */
  waveSlope: number;
  /** Fixed-wing below its stall speed while > 2 m up. */
  stalled: boolean;
  /** The job action (I key, R3, HUD button) was pressed this frame. */
  action: boolean;
  /** The player sits in the job vehicle's driver seat. */
  inVehicle: boolean;
  /** player-fare: the calling player sits in my vehicle. */
  playerAboard: boolean;
}

/** Active world events that change pay and how often work comes (surge.ts). */
export interface Surge {
  /** Morning or Dusk: more fares, fares x1.25. */
  rush: boolean;
  /** Blustery sea (waves.ts seaState): boat and pilot hazard pay x1.4, comfort is harder. */
  storm: boolean;
  /** This gig's client is a celebrity (rolled per gig at level >= 3). */
  celebrity: boolean;
  payMult: number;
  spawnMult: number;
  /** HUD tag: "RUSH HOUR", "STORM PAY", null. */
  label: string | null;
}

/** What a level gives (defs.ts perksFor). */
export interface JobPerks {
  /** Multiplies tips. */
  tipMult: number;
  /** Multiplies base pay. */
  payMult: number;
  /** Multiplies how often work appears (>1 = sooner). */
  spawnMult: number;
  /** Gig kinds unlocked at this level. */
  kinds: GigKind[];
  /** Max stops on a courier round, max passengers on a water taxi, etc. */
  capacity: number;
  /** Human lines for the board ("Tips +10%", "Long-haul fares to Pebblewick"). */
  lines: string[];
}

export interface PayResult {
  base: number;
  /** + early / - late. */
  time: number;
  tip: number;
  /** Surge, celebrity, real-player bonus. */
  bonus: number;
  /** Max(0, sum), rounded. What the economy earns. */
  total: number;
  stars: 1 | 2 | 3 | 4 | 5;
  xp: number;
  /** Shift-summary lines: "Smooth ride +8", "Late -5". */
  notes: string[];
}

// ---- Career save (career.ts) ----

export interface JobRecord {
  xp: number;
  done: number;
  failed: number;
  earned: number;
  bestTip: number;
  fiveStars: number;
  licensed: boolean;
}

export interface JobsSave {
  v: 1;
  jobs: Record<JobId, JobRecord>;
  /** Courier parcels delivered (all kinds). */
  parcels: number;
  /** Fragile parcels delivered at condition >= 0.99. */
  fragileClean: number;
  /** Landings scoring >= 95 with passengers. */
  perfectLandings: number;
  /** Full ferry loops. */
  ferryLoops: number;
  /** Real online players carried as fares. */
  playerFares: number;
  /** Tubing: seconds towed on a tube (as a rider), best single-run points, most riders towed at once (as a driver). */
  tubeSeconds: number;
  tubeBest: number;
  towedMax: number;
  /** Buoy run best time, seconds, or null. */
  buoyBest: number | null;
}

/** Objective-friendly counters for quests (jobs.stats(), career.ts jobStats()). */
export interface JobStats {
  taxiFares: number;
  parcels: number;
  flights: number;
  boatTrips: number;
  ferryLoops: number;
  playerFares: number;
  tubeSeconds: number;
  buoyBest: number | null;
  earned: number;
  levels: Record<JobId, number>;
  onDuty: JobId | null;
}

// ---- Runtime wiring (app.ts builds one JobsDeps; jobs/runtime.ts and tubing/runtime.ts both take it) ----

export interface JobsNet {
  myId(): number | null;
  /** Online with at least one other player. */
  online(): boolean;
  /** Players seated in the vehicle I drive, with their seat (seats.ts SeatBook). */
  riders(): { id: number; seat: number }[];
  /** My passenger seat in another player's vehicle, or null. */
  riding(): { host: number; seat: number } | null;
  nameOf(id: number): string | null;
  /** The vehicle a remote player drives (their relayed pose), or null on foot / unknown. */
  vehicleOf(id: number): Vehicle | null;
  /** A remote player's position, or null. */
  posOf(id: number): { x: number; z: number } | null;
}

export interface JobsDeps {
  scene: THREE.Scene;
  /** The shared #ui element: append your own containers, never restyle it. */
  ui: HTMLElement;
  world: World;
  hud: Hud;
  economy: Economy;
  phone: Phone;
  /** The game's vehicle list (tow tubes are pushed here while they exist). */
  vehicles: Vehicle[];
  player: Player;
  play(sfx: Sfx): void;
  unlock(id: string): void;
  increment(id: string, by?: number): void;
  /** Why a job cannot start or a phone action cannot run now (cutscene, dead, wanted), or null. */
  blocked(): string | null;
  /** The sky's time label (atmosphere.ts), or null when there is no atmosphere. */
  timeLabel(): TimeLabel | null;
  net: JobsNet;
  /** The online world-sync hub (app.ts onlineSync.hub): jobs and tubing register their SYS adapters on it. */
  hub: Hub;
  /** Put the player in `v`'s driver seat at once (no walk-up): boarding a tube from the phone or the rack. */
  seatPlayer(v: Vehicle): void;
  /** Throw the player off `v` as a ragdoll with world velocity (vx, vy, vz) m/s; `v` is left empty ('none'). */
  throwPlayer(v: Vehicle, vx: number, vy: number, vz: number): void;
}

/** What app.ts calls on the jobs runtime (jobs/runtime.ts installJobs). */
export interface Jobs {
  /** Every frame, after the player and vehicles moved. */
  update(dt: number): void;
  /** The active gig's next stop as the HUD route target, or null. direct: draw a straight line (water, air). */
  waypoint(): { x: number; z: number; color: string; label: string; direct: boolean } | null;
  blips(): Blip[];
  /** Standing at a depot kiosk / dispatcher: the E prompt, else null. */
  prompt(x: number, z: number): string | null;
  /** E at a depot: true when handled. */
  interact(x: number, z: number): boolean;
  /** The player ran a pedestrian over (npcs.onRunOver, player-driven). */
  onRunOver(): void;
  stats(): JobStats;
  // Trainer / debug (?debug __gta.jobs):
  onDuty(): JobId | null;
  /** Go on duty in the current vehicle; returns null or the reason it cannot. */
  goOnDuty(job: JobId): string | null;
  goOffDuty(): void;
  /** Start a gig now (on duty, none running): null or a reason. */
  forceGig(kind?: GigKind): string | null;
  addXp(job: JobId, xp: number): void;
  /** Rider: call a player cab to place `dest` (places.ts id). */
  callCab(dest: string): string | null;
  /** Driver on taxi duty: accept the nearest open player call. */
  takeCall(): string | null;
  /** Debug snapshot. */
  debug(): JobsDebug;
}

export interface JobsDebug {
  duty: JobId | null;
  /** next: the stop being driven to (null once all are reached). */
  gig: { kind: GigKind; idx: number; stops: number; phase: GigPhase; t: number; comfort: number; next: { x: number; z: number } | null } | null;
  cab: { phase: string; driver: number | null };
  openCalls: number;
  earnedShift: number;
  fares: number;
}

/** Re-exported so modules can import every job-side type from one place. */
export type { Blip, Box, InputState, Vehicle, VehicleKind };

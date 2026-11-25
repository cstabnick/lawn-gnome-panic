// E26 street racing and race modes: the shared contracts. Data and types only (no DOM, no three.js at import).
// Full contract: docs/roadmaps/gta-batch-3/E26/contracts.md.
//
//   meets.ts      MEETS: where each street-race meet stands (organiser, bookie, flag-dropper, crowd, dressing area)
//   cast.ts       MEET_CAST: who is there and what they say (written from lore), pickup rosters, signs, vignettes
//   meetScene.ts  buildMeet(scene, world, meet, cast): one meet's dressing and people, an Area
//   session.ts    createRaceSession: pickup races (wagers), time trials (ghost + best) and online races, on raceRun
//   save.ts       the racing save (best times, counts) and the local ghost store
//   ghost.ts      record and replay a time-trial ghost
//   raceApp.ts    the "Race Club" Gnomlet app: the mode picker
//   index.ts      createStreetRacing: composes the meets, the session, prompts and blips for app.ts
//   ../online/raceSync.ts  the SYS.race adapter: implements RaceNet over @lawn/mp
import type { GnomeLook } from '@lawn/gnome';
import type { AnimId } from '../anim/types';
import type { RaceRival } from '../quests/types';
import type { StreetTrackId, TrackId } from '../raceTrack/tracks';
import type { VehicleKind } from '../types';

export const MEET_IDS = ['skyway-foot', 'pardonlin', 'saltbucket'] as const;
export type MeetId = (typeof MEET_IDS)[number];

/** A spot to stand: world x, z and the facing (yaw 0 = +z, atan2(dx, dz)). */
export interface MeetSpot { x: number; z: number; yaw: number }

/** Where a street-race meet stands (meets.ts). Every spot is off the road, on open ground, clear of world.boxes. */
export interface StreetMeet {
  id: MeetId;
  /** Shown on the map and in the app, e.g. "The Skyway Foot". */
  name: string;
  /** The meet's middle: map blip, ambient sound. */
  centre: { x: number; z: number };
  /** All the meet's dressing stays inside this rectangle (centre x, z; half sizes hw along x, hd along z). */
  area: { x: number; z: number; hw: number; hd: number };
  /** Street routes raced from here; tracks[0] is the meet's own (the flag-dropper stands at its grid). */
  tracks: readonly StreetTrackId[];
  /** The organiser: quest giver `street-<meet id>` (quests/streetRaces.ts) and the meet's host. */
  organiser: MeetSpot;
  /** The bookie: takes wagers and starts pickup races (the meet's prompt). */
  bookie: MeetSpot;
  /** The flag-dropper, beside tracks[0]'s grid, off the road edge, facing the cars. */
  flagger: MeetSpot;
  /** Spectators: 6..12 spots on the pavement or verge facing the road. */
  crowd: readonly MeetSpot[];
  /** Residents doing something specific to the place (cast.ts residents, in order). */
  residents: readonly MeetSpot[];
  /** Vignette anchors (cast.ts vignettes, in order): 3 or more. */
  vignettes: readonly MeetSpot[];
  /** Sign anchors (cast.ts signs, in order): 4 or more. */
  signs: readonly MeetSpot[];
  /** True: the meet is at its liveliest after dark (lights on, crowd full); by day a few regulars hang about. */
  night?: boolean;
}

/** A gnome at a meet (organiser, bookie, flag-dropper, resident). */
export interface MeetPerson {
  /** Ambient-gnome id, e.g. 'street-skyway-foot-organiser'. The organiser's is the giver id `street-<meet id>`. */
  id: string;
  name: string;
  look: Partial<GnomeLook>;
  /** Speech bubble when the player walks past. */
  bubble: string;
  idle?: AnimId;
}

/** A small story told with props (no text needed): prefab ids from @lawn/prefabs, laid out around the anchor. */
export interface MeetVignette {
  id: string;
  name: string;
  /** One or two sentences: what a player should read from the props. */
  story: string;
  /** Prefab ids (must exist in @lawn/prefabs), with offsets from the anchor in metres (local: +z = the anchor's facing). */
  props: readonly { id: string; dx: number; dz: number; yaw?: number; scale?: number }[];
}

/** Who is at a meet and what they say (cast.ts, written from lore). */
export interface MeetCast {
  organiser: MeetPerson;
  bookie: MeetPerson & {
    /** Said (toast) when a wager is placed, when the player wins, when they lose. One picked at random. */
    takeLines: readonly string[];
    winLines: readonly string[];
    loseLines: readonly string[];
  };
  flagger: MeetPerson;
  /** Doing something specific to the place (one per meet.residents spot). */
  residents: readonly (MeetPerson & { does: string })[];
  /** Pickup-race rivals (3), driving the meet's usual rides. */
  roster: readonly RaceRival[];
  /** The vehicle pickup races are run in (the player gets one on the grid). */
  pickupVehicle: VehicleKind;
  /** Sign and poster text with jokes that fit the place (one per meet.signs spot). */
  signs: readonly { text: string; sub?: string }[];
  vignettes: readonly MeetVignette[];
  /** Spectator looks the crowd is drawn from (4 or more). */
  crowdLooks: readonly Partial<GnomeLook>[];
}

// ---- Race modes (session.ts) -----------------------------------------------------------------------------------------

export type RaceModeKind = 'pickup' | 'trial' | 'online';

/** Wagers the bookie takes, in Acorns (0 = a friendly). */
export const WAGERS = [0, 25, 100, 250] as const;

export interface RaceModeStart {
  kind: RaceModeKind;
  trackId: TrackId;
  vehicle: VehicleKind;
  /** Laps on a circuit (open routes: 1). */
  laps: number;
  /** pickup: the meet's roster. trial / online: none. */
  rivals?: readonly RaceRival[];
  /** pickup: Acorns staked (taken at the start; twice the stake paid back on a win). */
  wager?: number;
  meetId?: MeetId;
}

export interface RaceResult {
  kind: RaceModeKind;
  trackId: TrackId;
  /** Finish time in seconds, or null when the race was abandoned. */
  time: number | null;
  place: number;
  of: number;
  /** A new best time on this track. */
  best: boolean;
  /** Acorns won (pickup wins; 0 otherwise). */
  won: number;
}

/** The race-mode runner (session.ts). At most one mode race at a time, never while a quest race runs. */
export interface RaceSession {
  /** The race running now, or null. */
  active(): RaceModeStart | null;
  /** Start a race: null when it started, else why not (already racing, no Acorns for the wager, offline...). */
  start(s: RaceModeStart): string | null;
  /** End the running race at once (no result). */
  stop(why?: string): void;
  update(dt: number): void;
  blips(): import('../types').Blip[];
  /** The last finished (or abandoned) race. */
  lastResult(): RaceResult | null;
}

// ---- Online races (online/raceSync.ts implements RaceNet) ---------------------------------------------------------

export interface RaceLobby {
  hostId: number;
  hostName: string;
  trackId: TrackId;
  laps: number;
  vehicle: VehicleKind;
  /** Host first, then joiners by id. A member's grid slot is its index here. */
  members: readonly { id: number; name: string }[];
  phase: 'lobby' | 'countdown' | 'racing';
}

export interface RaceRacer {
  id: number;
  name: string;
  /** Race distance (m from the start line). */
  dist: number;
  /** Seconds from their GO to their finish, or null. */
  finishedAt: number | null;
  /** Gave up or dropped out. */
  dnf: boolean;
}

/** Online race lobbies and progress, relayed as one SYS.race record per player (online/raceSync.ts). */
export interface RaceNet {
  /** Online with at least one peer. */
  online(): boolean;
  myId(): number | null;
  /** Lobbies other players host that are still open (phase 'lobby'). */
  lobbies(): readonly RaceLobby[];
  /** The lobby I host or joined (with its members as seen now), or null. */
  mine(): RaceLobby | null;
  /** Host a lobby (leaves any other first). */
  host(trackId: TrackId, laps: number, vehicle: VehicleKind): void;
  join(hostId: number): void;
  leave(): void;
  /** Host only: start the countdown for everyone in my lobby. */
  go(): void;
  /** True once my lobby's host said go (from then until I leave). */
  started(): boolean;
  /** My progress while racing, published to the others. */
  progress(p: { dist: number; finishedAt: number | null; dnf: boolean }): void;
  /** The other members of my lobby and their progress (not me). */
  racers(): readonly RaceRacer[];
  /** Set by the session: called once when another player opens a lobby (an invite toast). */
  onInvite: ((l: RaceLobby) => void) | null;
}

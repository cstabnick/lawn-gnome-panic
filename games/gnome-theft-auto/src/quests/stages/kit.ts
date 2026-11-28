// Stage types and helpers, shared by stages.ts and the region files (stages/<region>.ts). See stages.ts for the conventions.
import type { Loadout } from '@lawn/glaze';
import type { RegionId } from '../../levels';
import type { VehicleKind } from '../../types';
import type { CutsceneRoom } from '../types';

/** A ground point: world x, z. */
export type XZ = readonly [number, number];
/** A point in the air: world x, height above the ground there, world z. */
export type XHZ = readonly [number, number, number];

export type Pose = 'stand' | 'sit' | 'lean' | 'work' | 'kneel' | 'lie' | 'drive';
export type TimeOfDay = 'dawn' | 'day' | 'golden' | 'dusk' | 'night' | 'any';

/** Where one character stands for a scene. `who` is a CAST id, or a role such as 'hoa-guard' or 'player'. */
export interface ActorMark {
  who: string;
  at: XZ;
  yaw: number;
  pose: Pose;
  /** What they are doing on this mark, e.g. "taps the lien against the bay door". */
  note?: string;
  /** Metres above the ground when they stand on something (a stage, a platform, a combine deck); no collider check then. */
  lift?: number;
}

/** A camera position for the scene: `from` and `look` heights are above the ground. */
export interface CameraSpot {
  id: string;
  from: XHZ;
  look: XHZ;
  /** Vertical field of view, degrees. */
  fov: number;
  note: string;
}

/** An idle routine: a walk loop (or a back-and-forth when loop is false) with a pause at each point. */
export interface IdleWalk {
  who: string;
  points: readonly XZ[];
  loop: boolean;
  /** Walking speed, m/s (a stroll is about 1.2). */
  speed: number;
  /** Seconds spent at each point doing `activity`. */
  pauseS: number;
  activity: string;
}

/** A vehicle in the scene: parked (where it lives), pull-up (where an arriving one stops) or exit (where one leaves from). */
export interface VehicleMark {
  id: string;
  role: 'parked' | 'pull-up' | 'exit';
  kind: VehicleKind;
  /** CAST id of the driver/owner, if any. */
  owner?: string;
  at: XZ;
  yaw: number;
  note?: string;
}

/**
 * A drivable path: approach (driving in from the wider world), arrival (the last stretch to a pull-up mark), getaway
 * (leaving), patrol (a loop someone drives while idle), chase (a story chase route). Paths follow roads unless offRoad
 * is set; boat paths (boat kinds) must stay on water.
 */
export interface DrivePath {
  id: string;
  role: 'approach' | 'arrival' | 'getaway' | 'patrol' | 'chase';
  kind: VehicleKind;
  points: readonly XZ[];
  /** True for a path that is allowed to leave the roads (fields, desert, forest tracks). */
  offRoad?: boolean;
  note?: string;
}

/** One piece of set dressing: a @lawn/prefabs id stood on the ground. */
export interface SetProp {
  prefab: string;
  at: XZ;
  yaw: number;
  scale?: number;
  /** Metres above the ground, for a prop standing on another prop (a boat on a trailer). */
  lift?: number;
  /** Collider half-width (x), half-depth (z) and height, for props the player should bump into (before yaw). */
  solid?: readonly [number, number, number];
  /**
   * GR3 (FX05): a story stage's set is shown only while its quest window is open (stageSets.ts). `always`: this prop is
   * part of the place itself (a door, a sign that is there before and after the story) and stays for good.
   */
  always?: boolean;
  /**
   * GR3: a solid prop may stand on a road (stageSets.test.ts checks) only when it is marked here and is scene-only (a
   * roadblock that exists while its quest runs). Never with `always`.
   */
  overRoad?: boolean;
}

export interface Stage {
  id: string;
  name: string;
  region: RegionId;
  /** The middle of the action. */
  center: XZ;
  /** Rough size of the playable space around center, m. */
  radius: number;
  /** Which way the place "faces" (its front door, its stage), as a yaw. */
  facing: number;
  /** Boat scene: center, marks and set may sit on water. */
  water?: boolean;
  /** Time of day the scenes here want by default. */
  time: TimeOfDay;
  /** existing: already in the world; dressed: in the world, with extra set dressing from `set`; new: only exists through `set`. */
  built: 'existing' | 'dressed' | 'new';
  /** The off-map cutscene room this place is the outside of, if any. */
  room?: CutsceneRoom;
  /** GIVERS ids whose marker stands here. */
  givers?: readonly string[];
  /** Quest ids (and other cutscenes) that use this place. */
  usedBy: readonly string[];
  /** One line: what it looks like (props, lighting). The long form is in environments.md. */
  look: string;
  /** One line: what it sounds like. */
  sounds: string;
  marks: readonly ActorMark[];
  cameras: readonly CameraSpot[];
  walks: readonly IdleWalk[];
  vehicles: readonly VehicleMark[];
  paths: readonly DrivePath[];
  set: readonly SetProp[];
  /** GR3: keep this story stage's set once its quest is done (a world change keeps it); default: hidden again. */
  setStays?: boolean;
}

/** A named character and where they belong. */
export interface CastMember {
  id: string;
  name: string;
  /** Their CHARACTER_PRESETS key in cutscene.ts, if they have one. */
  preset?: string;
  /** Stage id they live or work at. */
  home: string;
  /** Other stage ids they turn up at. */
  haunts: readonly string[];
  /** One line: their daily routine. */
  routine: string;
  /** What they drive. `parkedAt` is a VehicleMark id in their home stage; null = they walk. */
  vehicle: { kind: VehicleKind; glaze?: Partial<Loadout>; parkedAt: string; note: string } | null;
}

// ---- Helpers used by the region files ------------------------------------------------------------------------------

/** The yaw that faces from `from` towards `to`. */
export function yawTo(from: XZ, to: XZ): number {
  return Math.atan2(to[0] - from[0], to[1] - from[1]);
}

/** An actor mark; `face` is a point to face or a yaw. */
export function mark(who: string, at: XZ, face: XZ | number, pose: Pose = 'stand', note?: string, lift?: number): ActorMark {
  return { who, at, yaw: typeof face === 'number' ? face : yawTo(at, face), pose, ...(note ? { note } : {}), ...(lift ? { lift } : {}) };
}

/** A camera spot (fov defaults to 50). */
export function cam(id: string, from: XHZ, look: XHZ, note: string, fov = 50): CameraSpot {
  return { id, from, look, fov, note };
}

/** A vehicle mark; `face` is a point to face or a yaw. */
export function car(id: string, role: VehicleMark['role'], kind: VehicleKind, at: XZ, face: XZ | number, owner?: string, note?: string): VehicleMark {
  return { id, role, kind, at, yaw: typeof face === 'number' ? face : yawTo(at, face), ...(owner ? { owner } : {}), ...(note ? { note } : {}) };
}


// Rival drivers for the Speedway races: arcade vehicles (stepVehicle) that follow the centre line at their own pace,
// line and nerve. STUB: filled in by its issue; the exported signatures are the contract.
import type * as THREE from 'three';
import type { RaceRival } from '../quests/types';
import type { Vehicle, VehicleKind, World } from '../types';

export interface Rival {
  def: RaceRival;
  v: Vehicle;
  /** Index of the nearest centre-line sample last frame (locate() hint). */
  hint: number;
  /** Race distance: metres driven along the lap since the start (negative while still behind the line). */
  dist: number;
  /** Seconds since the start when it finished, or null. */
  finishedAt: number | null;
}

/** Context for one frame of a rival's driving. */
export interface RivalCtx {
  /** True during the countdown: hold still on the grid. */
  hold: boolean;
  /** The player's race distance (for the rubber band). */
  playerDist: number;
  /** Seconds since the start. */
  time: number;
}

/** Create a rival's vehicle (with its driver gnome) on grid `slot` and add it to `vehicles`. */
export function spawnRival(scene: THREE.Scene, vehicles: Vehicle[], def: RaceRival, kind: VehicleKind, slot: number): Rival {
  void scene; void vehicles; void def; void kind; void slot;
  throw new Error('raceAi: not built yet');
}

/** Put a rival back on grid `slot`, stopped and repaired (a restart). */
export function resetRival(r: Rival, slot: number): void {
  void r; void slot;
}

/** One frame of driving: steer along the lap, keep its speed for the corners ahead, update `dist` and `hint`. */
export function driveRival(r: Rival, dt: number, world: World, ctx: RivalCtx): void {
  void r; void dt; void world; void ctx;
}

/** Take the rival's vehicle out of the scene and out of `vehicles`. */
export function removeRival(scene: THREE.Scene, vehicles: Vehicle[], r: Rival): void {
  void scene; void vehicles; void r;
}

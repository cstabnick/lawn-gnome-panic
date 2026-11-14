// src/combat.ts: rifle fire, reloads, grenades, line of sight, tracers and explosions. STUB: filled in by epic 2.
import * as THREE from 'three';
import type { Game, Soldier } from './config';

/** Fires one rifle shot if the soldier can (alive, fireT <= 0, ammo > 0, not reloading). origin/dir in world space (dir normalised). Returns true if a shot was fired. */
export function tryFire(game: Game, s: Soldier, origin: THREE.Vector3, dir: THREE.Vector3): boolean {
  void game; void s; void origin; void dir;
  return false;
}

/** Starts a reload if the magazine is not full, reserve > 0 and none is in progress. */
export function startReload(game: Game, s: Soldier): void {
  void game; void s;
}

/** Throws a pinecone grenade if the soldier has one. Returns true if thrown. */
export function throwGrenade(game: Game, s: Soldier, origin: THREE.Vector3, dir: THREE.Vector3): boolean {
  void game; void s; void origin; void dir;
  return false;
}

/** Distance along the ray to the first obstacle or the ground, or maxDist if none. dir normalised. */
export function raycastWorld(game: Game, origin: THREE.Vector3, dir: THREE.Vector3, maxDist: number): number {
  void game; void origin; void dir;
  return maxDist;
}

/** True if nothing static (obstacles, terrain) blocks the segment from a to b. */
export function lineOfSight(game: Game, a: THREE.Vector3, b: THREE.Vector3): boolean {
  void game; void a; void b;
  return true;
}

/** Weapon timers and reload completion, grenade flight and explosions, and fading tracer/explosion visuals. */
export function updateCombat(game: Game, dt: number): void {
  void game; void dt;
}

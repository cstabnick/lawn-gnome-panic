// src/conquest.ts: flags, capturing, tickets, spawn points, win condition. STUB: filled in by epic 2.
import type * as THREE from 'three';
import { BASES, FLAGS, type FlagState, type Game, type Team } from './config';

/** Creates the neutral flags and their visuals (pole, cloth, ground ring). */
export function createFlags(scene: THREE.Scene): FlagState[] {
  void scene;
  return FLAGS.map((def) => ({ def, owner: null, progress: 0, contested: false }));
}

/** Where a team may spawn: its HQ first, then each flag it owns. yaw faces the middle of the map. */
export function spawnPoints(game: Game, team: Team): { x: number; z: number; yaw: number }[] {
  void game;
  return [BASES[team]];
}

/** Capture progress, ownership changes, ticket bleed, flag visuals and the end of the match. */
export function updateConquest(game: Game, dt: number): void {
  void game; void dt;
}

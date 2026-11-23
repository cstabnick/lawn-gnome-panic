// The Speedway crowd: hundreds of little spectator gnomes on the grandstand decks, cheering harder when cars pass.
// STUB: filled in by its issue; the exported signatures are the contract.
import type * as THREE from 'three';
import type { Deck } from './track';

export interface Crowd {
  /** Per frame. `excitement` 0..1 (a race running, a car going past); far from the player the crowd stands still. */
  update(dt: number, px: number, pz: number, excitement: number): void;
}

export function createCrowd(scene: THREE.Scene, decks: readonly Deck[]): Crowd {
  void scene; void decks;
  return { update() {} };
}

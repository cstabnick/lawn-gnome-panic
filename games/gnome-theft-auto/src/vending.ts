// Vending machines hit by a vehicle at speed wobble or tip, settle back upright, and spit out a few cans of what they sell.
// STUB: lane B epic 2 fills in the body; the signatures are final.
import type * as THREE from 'three';
import type { Fx, Sfx, Vehicle, VendingSpot } from './types';

export interface Vending {
  /** Detect vehicle hits, animate the wobble and the flying cans. Call once per frame. */
  update(dt: number, vehicles: readonly Vehicle[]): void;
}

/**
 * `spots` is world.vending. `onSpill(brand, by)` is called once per hit that spills cans; `by` is the vehicle that hit it
 * (main unlocks an achievement when by.driver === 'player').
 */
export function createVending(
  scene: THREE.Scene,
  spots: readonly VendingSpot[],
  fx: Fx,
  play: (sfx: Sfx) => void,
  onSpill: (brand: VendingSpot['brand'], by: Vehicle) => void,
): Vending {
  void scene; void spots; void fx; void play; void onSpill;
  return { update() { /* stub */ } };
}

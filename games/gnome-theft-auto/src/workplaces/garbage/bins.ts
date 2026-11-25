// E25 garbage: the round's wheelie bins in the world (prefab gta-wheelie-bin at each stop), the lorry's arm and the bin
// riding it during a lift, and litter left by a spill. STUB: issue 07 fills it in.
import type * as THREE from 'three';
import type { Vehicle } from '../../types';
import type { BinRound, BinStop, LiftState } from './types';

export interface BinView {
  /** Place a bin at every stop of `round` (clears the previous round's bins first; spilled litter stays until clear()). */
  show(round: BinRound): void;
  /** Remove every bin and all litter. */
  clear(): void;
  /**
   * During a lift (every frame): pose the lorry's arm from `s.tilt` and carry `stop`'s bin on the claw (grab phase:
   * the bin slides from the kerb to the claw as the swing settles). s = null: put the arm back to rest.
   */
  pose(stop: BinStop | null, s: LiftState | null, lorry: Vehicle | null): void;
  /** After a lift: the bin back on the kerb at its stop, turned by (1 - neat) * 0.6 rad and shifted up to 0.5 m. */
  setDown(stop: BinStop, neat: number): void;
  /** A spill: litter scattered round the stop (flat litter prefab on a draw layer, a couple of bags). */
  spill(stop: BinStop): void;
  /** Every frame (lid wobble, a fly or two over spilled litter). */
  update(dt: number): void;
}

export function createBinView(scene: THREE.Scene): BinView {
  void scene;
  return { show() {}, clear() {}, pose() {}, setDown() {}, spill() {}, update() {} };
}

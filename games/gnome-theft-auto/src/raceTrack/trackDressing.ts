// Everything that stands around the Speedway: barriers (with colliders), grandstands built from the Great Spill's
// Tall-One junk, the start gantry, floodlights, sponsor boards, the pit garages, the Speedway Pay 'n' Glaze and the podium.
// STUB: filled in by its issue; the exported signatures are the contract.
import type * as THREE from 'three';
import type { Box } from '../types';
import type { Deck } from './track';

export interface TrackDressing {
  /** Where the crowd stands (crowd.ts fills them). */
  decks: readonly Deck[];
  /** Per frame: floodlights glow at night (`night` 0..1); the start lights show `lights` red lamps lit (0..5), or green when -1. */
  update(dt: number, px: number, pz: number, night: number, lights: number): void;
}

/** Build the dressing into `scene` and push its colliders into `boxes`. */
export function buildTrackDressing(scene: THREE.Scene, boxes: Box[]): TrackDressing {
  void scene; void boxes;
  return { decks: [], update() {} };
}

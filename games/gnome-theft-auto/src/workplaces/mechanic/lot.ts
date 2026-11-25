// E24 mechanic: the client lot at Turfton's Pay 'n' Glaze (STUB: built by its E24 issue).
import type * as THREE from 'three';
import type { World } from '../../types';

export interface ClientLot {
  /** The work-order board: stand here on foot for the "Take a work order" prompt. */
  board: { x: number; z: number };
  /** Where a client's car is parked (clear ground, facing the bay). */
  car: { x: number; z: number; yaw: number };
  /** Where the client stands waiting, and faces. */
  client: { x: number; z: number; yaw: number };
}

/** Build the lot's props once (idempotent) and return its spots. Pushes colliders into world.boxes. */
export function buildClientLot(scene: THREE.Scene, world: World): ClientLot {
  void scene; void world;
  return { board: { x: 90, z: 132 }, car: { x: 98, z: 130, yaw: 0 }, client: { x: 95, z: 130, yaw: 0 } };
}

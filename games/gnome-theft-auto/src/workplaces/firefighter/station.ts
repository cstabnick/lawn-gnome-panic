// E25 firefighter: Turfton Fire Station No. 1 on the Mossy Wood edge (site 'fire-station'): the engine house with its
// bay, the bell, Chief Hydra Pumpwell, a yard hydrant, and three small stories. STUB: issue 14 fills it in.
import type * as THREE from 'three';
import { HYDRANT_SPOTS } from '../../destructibles';
import { anchorOf } from '../../sites';
import type { World } from '../../types';

export interface Station {
  /** Where the Pumper is parked for a shift (in the bay, facing out). */
  engine: { x: number; z: number; yaw: number };
  /** The "Answer the bell" spot (on foot). */
  bell: { x: number; z: number };
  /** Hydrants the station adds (its yard); the runtime adds HYDRANT_SPOTS and one per call. */
  hydrants: { x: number; z: number }[];
}

/** Every fixed hydrant in the world the engine can refill at (downtown kerb hydrants). */
export function cityHydrants(): { x: number; z: number }[] {
  return HYDRANT_SPOTS.map(([x, z]) => ({ x, z }));
}

/** Build the station once (idempotent) and return its spots. Pushes colliders into world.boxes. */
export function buildStation(scene: THREE.Scene, world: World): Station {
  void scene; void world;
  const e = anchorOf('fire-station', 'engine');
  const d = anchorOf('fire-station', 'door');
  return { engine: { x: e.x, z: e.z, yaw: e.yaw ?? 0 }, bell: { x: d.x, z: d.z + 2 }, hydrants: [] };
}

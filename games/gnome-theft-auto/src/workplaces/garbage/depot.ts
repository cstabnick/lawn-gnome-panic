// E25 garbage: the Turfton Bin Depot beside the Compost Heap (site 'bin-depot'): yard, office, lorry bay, tipping
// ramp toward the heap, Mags Wheelie and a crew gnome, and three small stories. STUB: issue 08 fills it in.
import type * as THREE from 'three';
import { anchorOf } from '../../sites';
import type { World } from '../../types';

export interface Depot {
  /** Where the Bin Lorry is parked for a round (facing out of the gate). */
  lorry: { x: number; z: number; yaw: number };
  /** The "Start a bin round" spot (on foot, by the office). */
  start: { x: number; z: number };
  /** Drive the full lorry here to tip the load into the heap and end the round. */
  tip: { x: number; z: number };
}

/** Build the depot once (idempotent) and return its spots. Pushes colliders into world.boxes. */
export function buildDepot(scene: THREE.Scene, world: World): Depot {
  void scene; void world;
  const l = anchorOf('bin-depot', 'lorry');
  const o = anchorOf('bin-depot', 'office');
  const t = anchorOf('bin-depot', 'tip');
  return { lorry: { x: l.x, z: l.z, yaw: l.yaw ?? 0 }, start: { x: o.x, z: o.z + 3 }, tip: { x: t.x, z: t.z } };
}

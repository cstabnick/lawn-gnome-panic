// E31 living world: parked vehicles in the outer bands and the Unmown (the ranger buggy at the station, campers at the
// lay-bys and the High Tarn trailhead, cars in the hamlets, the cone van in Dunelow). Stub (E31 foundation): issue D7
// fills it. Keep the exported signature.
import type { Box, ParkedSpot } from '../types';

/** Parked spots to add to world.parked. `boxes` are the colliders built so far: skip a spot inside one. */
export function livingParked(boxes: readonly Box[]): ParkedSpot[] {
  void boxes;
  return [];
}

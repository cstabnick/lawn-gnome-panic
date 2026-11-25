// E31 living world: parked vehicles in the outer bands and the Unmown: the ranger buggy at the station and the gate,
// campers at the High Tarn path start and the north-band lay-bys, cone vans in Dunelow and by the boardwalk, local
// rides in each hamlet, European rides by the Grand Wicket. world.ts adds them to world.parked once every collider is
// built; a spot inside a collider or in water is dropped. Yaw follows the nearest road.
import { HIGHWAYS } from '../config';
import { waterAt } from '../terrain';
import type { Box, ParkedSpot, VehicleKind } from '../types';

interface Candidate { x: number; z: number; kind: VehicleKind; yaw?: number; yard?: boolean }

/** Spots 5.5..9 m from a road (the kerb side), or in a yard (`yard`, with a fixed yaw). */
export const PARKED_CANDIDATES: readonly Candidate[] = [
  { x: -1575, z: -1135, kind: 'ranger-buggy', yaw: 0, yard: true },  // the station yard
  { x: -1435, z: -1031, kind: 'ranger-buggy' },                      // the Unmown gate, by the lane
  { x: 1067, z: -1290, kind: 'shell-camper' },                       // the High Tarn path start
  { x: -480, z: -953, kind: 'shell-camper' },                        // north-band lay-bys
  { x: -150, z: -958, kind: 'shell-camper' },
  { x: 400, z: 1007, kind: 'shell-camper' },                         // south-band-east
  { x: -545, z: 1013, kind: 'cone-van' },                            // Dunelow
  { x: 7, z: 1040, kind: 'cone-van' },                               // on the coast spur near the boardwalk (x 0)
  { x: -1060, z: -508, kind: 'golf-cart' },                          // Espalier End (south of the hamlet, road kerb)
  { x: -1110, z: -509, kind: 'deux-pots' },
  { x: 520, z: -1325, kind: 'ride-on' },                             // Mittenholt
  { x: 585, z: -1315, kind: 'dirt-bike' },
  { x: -600, z: 1015, kind: 'wespa' },                               // Dunelow
  { x: -520, z: 1012, kind: 'push-bike' },
  { x: -1300, z: -37, kind: 'deux-pots' },                           // by the Grand Wicket approach
  { x: -1340, z: -37, kind: 'wespa' },
];

const MIN_ROAD = 5.5;
const MAX_ROAD = 9;

/** Nearest road centre line: distance and direction (unit) of that segment. */
function nearestRoad(x: number, z: number): { d: number; dx: number; dz: number } {
  let best = { d: Infinity, dx: 0, dz: 1 };
  for (const h of HIGHWAYS) {
    for (let i = 0; i + 1 < h.points.length; i++) {
      const [ax, az] = h.points[i], [bx, bz] = h.points[i + 1];
      const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
      if (l2 === 0) continue;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
      const d = Math.hypot(x - ax - t * dx, z - az - t * dz);
      if (d < best.d) { const l = Math.sqrt(l2); best = { d, dx: dx / l, dz: dz / l }; }
    }
  }
  return best;
}

function insideAny(x: number, z: number, boxes: readonly Box[], m: number): boolean {
  for (const b of boxes) if (x > b.minX - m && x < b.maxX + m && z > b.minZ - m && z < b.maxZ + m) return true;
  return false;
}

/** Parked spots to add to world.parked. `boxes` are the colliders built so far: skip a spot inside one. */
export function livingParked(boxes: readonly Box[]): ParkedSpot[] {
  const out: ParkedSpot[] = [];
  for (const c of PARKED_CANDIDATES) {
    if (insideAny(c.x, c.z, boxes, 2) || waterAt(c.x, c.z)) continue;
    const r = nearestRoad(c.x, c.z);
    if (!c.yard && (r.d < MIN_ROAD || r.d > MAX_ROAD)) continue;
    const yaw = c.yaw ?? Math.atan2(r.dx, r.dz);
    out.push({ x: c.x, z: c.z, yaw, kind: c.kind });
  }
  return out;
}

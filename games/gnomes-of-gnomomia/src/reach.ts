// STUB: a worker fills this in (docs/roadmaps/level-format.md, issue D1). Keep the exported names and signatures.
// Reachability: can a walker get from a zone's spawn to everything that matters in it?
import type { ZoneDef, ZoneId } from './config';
import type { Terrain } from './terrainCore';

export interface ReachTarget {
  kind: 'spawn' | 'shrine' | 'region' | 'exit' | 'house' | 'deck' | 'prop';
  id: string;
  label: string;
  /** Where a walker has to get to, world coordinates. */
  x: number;
  z: number;
}

export interface ReachResult extends ReachTarget {
  reachable: boolean;
}

export interface ReachReport {
  zone: ZoneId;
  /** Cells the flood fill visited. */
  cells: number;
  results: ReachResult[];
  /** True when the flood fill visited the cell containing (x, z). */
  reached(x: number, z: number): boolean;
}

/** Flood fill over the terrain's isBlocked from def.spawn, 0.5 m cells, 4-connected, limited to the zone square plus
 * WORLD.blend, then checks every target. Uses whatever gate state `t` was built with. */
export function computeReachability(_t: Terrain, def: ZoneDef): ReachReport {
  return { zone: def.id, cells: 0, results: [], reached: () => false };
}

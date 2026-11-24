// Walking routes for Pebblewick's townsfolk between their stations (town.ts). Pure: no three.js, no DOM.
import { LANES, type Station } from './town';

type Pt = [number, number];

function inRect(x: number, z: number, r: { minX: number; maxX: number; minZ: number; maxZ: number }): boolean {
  return x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ;
}

/** Which walking lane (town.ts LANES) holds (x, z); main wins where the two overlap. Null off the lanes. */
export function laneOf(x: number, z: number): 'main' | 'cross' | null {
  if (inRect(x, z, LANES.main)) return 'main';
  if (inRect(x, z, LANES.cross)) return 'cross';
  return null;
}

/**
 * The points an NPC walks through from station a to station b: a's path out to its lane, then (when the two ends
 * are not in the same lane) the hub, then b's path back in. Consecutive duplicate points are dropped.
 */
export function routeBetween(a: Station, b: Station): [number, number][] {
  if (a === b || (a.x === b.x && a.z === b.z)) return [[a.x, a.z]];
  const pa: Pt[] = [[a.x, a.z], ...a.path];
  const pb: Pt[] = [[b.x, b.z], ...b.path];
  const ea = pa[pa.length - 1];
  const eb = pb[pb.length - 1];
  const la = laneOf(ea[0], ea[1]);
  const lb = laneOf(eb[0], eb[1]);

  const out: Pt[] = [...pa];
  if (la === null || lb === null || la !== lb) out.push([LANES.hub.x, LANES.hub.z]);
  for (let i = pb.length - 1; i >= 0; i--) out.push(pb[i]);

  const route: Pt[] = [];
  for (const p of out) {
    const last = route[route.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) route.push(p);
  }
  return route;
}

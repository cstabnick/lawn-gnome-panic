// Walkable rooftops (E05, L75): the registry and the surface queries. Pure (no three.js): terrain.ts groundAt and
// craft/aircraft.ts floorUnder call rooftopSurfaceBelow on their hot paths, so lookups go through a 32 m grid.
// Building the rooftops from the towers, parapets and pads: rooftopsBuild.ts. Later epics: addRooftop.
import type { Rooftop } from './types';

const CELL = 32;
const roofs: Rooftop[] = [];
/** Every rooftop registered so far (towers, the Double Pot slab, later epics' buildings). */
export const ROOFTOPS: readonly Rooftop[] = roofs;

let grid: Map<number, Rooftop[]> | null = null;
const key = (i: number, j: number): number => i * 65536 + j;

function gridNow(): Map<number, Rooftop[]> {
  if (grid) return grid;
  const g = new Map<number, Rooftop[]>();
  for (const r of roofs) {
    for (let i = Math.floor(r.minX / CELL); i <= Math.floor(r.maxX / CELL); i++) {
      for (let j = Math.floor(r.minZ / CELL); j <= Math.floor(r.maxZ / CELL); j++) {
        const k = key(i, j);
        const list = g.get(k);
        if (list) list.push(r); else g.set(k, [r]);
      }
    }
  }
  grid = g;
  return g;
}

/** Register a rooftop. Throws on a duplicate id or an empty rectangle. Returns it. */
export function addRooftop(def: Rooftop): Rooftop {
  if (roofs.some((r) => r.id === def.id)) throw new Error(`addRooftop: duplicate id ${def.id}`);
  if (!(def.maxX > def.minX && def.maxZ > def.minZ)) throw new Error(`addRooftop ${def.id}: empty rectangle`);
  roofs.push(def);
  grid = null;
  return def;
}

export function rooftopById(id: string): Rooftop | undefined {
  return roofs.find((r) => r.id === id);
}

/**
 * The highest rooftop surface over (x, z) at or below maxY, or null. `includeSolid` false skips roofs a box collider
 * already holds up (towers): groundAt uses that, aircraft (floorUnder) include them.
 */
export function rooftopSurfaceBelow(x: number, z: number, maxY: number, includeSolid = true): number | null {
  if (roofs.length === 0) return null;
  const list = gridNow().get(key(Math.floor(x / CELL), Math.floor(z / CELL)));
  if (!list) return null;
  let best: number | null = null;
  for (const r of list) {
    if (!includeSolid && r.solid) continue;
    if (r.y > maxY || (best !== null && r.y <= best)) continue;
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) best = r.y;
  }
  return best;
}

/** The rooftop a body at (x, y, z) stands on (its feet within `tol` of the surface), or null. */
export function rooftopAt(x: number, z: number, y: number, tol = 0.6): Rooftop | null {
  if (roofs.length === 0) return null;
  const list = gridNow().get(key(Math.floor(x / CELL), Math.floor(z / CELL)));
  if (!list) return null;
  for (const r of list) {
    if (Math.abs(y - r.y) <= tol && x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return r;
  }
  return null;
}

/** Every landing pad (for the map and for missions such as "land on the Thorne roof"). */
export function landingPads(): { id: string; name?: string; x: number; y: number; z: number; r: number }[] {
  return roofs.filter((r) => r.pad).map((r) => ({ id: r.id, name: r.name, x: r.pad!.x, y: r.y, z: r.pad!.z, r: r.pad!.r }));
}

/** Tests only: forget every rooftop. */
export function clearRooftops(): void {
  roofs.length = 0;
  grid = null;
}

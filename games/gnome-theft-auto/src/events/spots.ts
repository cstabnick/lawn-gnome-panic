// Finding places for street events: road nodes and sidewalk walk points in a distance ring. Pure.
import type { World } from '../types';
import type { EventAnchor, EventDef } from './types';

/** A spot for an event: a road node (yaw along a linked road) or a walk point (yaw towards the player), min..max away. */
export function pickAnchor(
  world: Pick<World, 'roads' | 'walkPoints'>,
  kind: EventDef['anchor'],
  px: number,
  pz: number,
  rand: () => number,
  min: number,
  max: number,
): EventAnchor | null {
  const inRing = (x: number, z: number, lo: number, hi: number): boolean => {
    const d = Math.hypot(x - px, z - pz);
    return d >= lo && d <= hi;
  };
  for (const [lo, hi] of [[min, max], [min * 0.4, max * 1.8]] as const) {
    if (kind === 'road') {
      // Ground nodes only: a node on a skyway deck (n.deck set) would put the event on the land under the deck.
      const nodes = world.roads.nodes.filter((n) => n.deck === undefined && inRing(n.x, n.z, lo, hi) && n.links.length > 0);
      if (nodes.length === 0) continue;
      const n = nodes[Math.floor(rand() * nodes.length) % nodes.length];
      const linkId = n.links[Math.floor(rand() * n.links.length) % n.links.length];
      const link = world.roads.nodes.find((m) => m.id === linkId) ?? world.roads.nodes[linkId];
      const yaw = link ? Math.atan2(link.x - n.x, link.z - n.z) : 0;
      return { x: n.x, z: n.z, yaw };
    }
    const pts = world.walkPoints.filter((p) => inRing(p.x, p.z, lo, hi));
    if (pts.length === 0) continue;
    const p = pts[Math.floor(rand() * pts.length) % pts.length];
    return { x: p.x, z: p.z, yaw: Math.atan2(px - p.x, pz - p.z) };
  }
  return null;
}

/** Half the drivable width of a road around its centre line (config ROAD_WIDTH 10), plus a kerb margin. */
export const ROAD_HALF = 5;

/** Distance from (x, z) to the nearest road centre line of the graph, and the unit direction pointing away from it. */
export function roadClearance(roads: World['roads'], x: number, z: number): { dist: number; nx: number; nz: number } {
  let best = Infinity;
  let nx = 1;
  let nz = 0;
  const byId = new Map(roads.nodes.map((n) => [n.id, n]));
  for (const a of roads.nodes) {
    // Quick reject: segments are rarely longer than ~200 units.
    if (Math.abs(a.x - x) > 260 || Math.abs(a.z - z) > 260) continue;
    for (const id of a.links) {
      const b = byId.get(id);
      if (!b) continue;
      const dx = b.x - a.x, dz = b.z - a.z;
      const l2 = dx * dx + dz * dz;
      const t = l2 > 0 ? Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2)) : 0;
      const cx = a.x + t * dx, cz = a.z + t * dz;
      const d = Math.hypot(x - cx, z - cz);
      if (d < best) {
        best = d;
        if (d > 1e-3) { nx = (x - cx) / d; nz = (z - cz) / d; }
        else if (l2 > 0) { const l = Math.sqrt(l2); nx = dz / l; nz = -dx / l; }
      }
    }
  }
  return { dist: best, nx, nz };
}

/** (x, z) moved sideways off any road surface (to ROAD_HALF + margin from the centre line); unchanged when already off. */
export function offRoad(roads: World['roads'], x: number, z: number, margin = 1.5): { x: number; z: number } {
  const c = roadClearance(roads, x, z);
  const need = ROAD_HALF + margin;
  if (c.dist >= need) return { x, z };
  const push = need - c.dist;
  return { x: x + c.nx * push, z: z + c.nz * push };
}

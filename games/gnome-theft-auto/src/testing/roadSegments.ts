// Test-only: every drivable centre-line segment of the real world (road graph links, the Skyway deck, ramp-foot connectors)
// and distance queries over them. Used by the E26 street-route and street-meet tests.
import type { World } from '../types';
import { footConnectors } from '../highways/roads';
import { SKYWAYS } from '../highways/skyways';

export interface RoadSeg { ax: number; az: number; bx: number; bz: number; half: number }

/** Segments: graph links (half width 5), the Turfton Skyway deck (5.5) and the ramp-foot connectors (5). */
export function roadSegments(world: World): RoadSeg[] {
  const out: RoadSeg[] = [];
  const nodes = world.roads.nodes;
  for (const a of nodes) {
    for (const l of a.links) {
      const b = nodes[l];
      if (b && b.id > a.id) out.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z, half: 5 });
    }
  }
  const deck = SKYWAYS.find((s) => s.id === 'turfton-skyway');
  if (deck) {
    for (let i = 1; i < deck.points.length; i++) {
      const p = deck.points[i - 1], q = deck.points[i];
      out.push({ ax: p.x, az: p.z, bx: q.x, bz: q.z, half: deck.width / 2 });
    }
  }
  for (const c of footConnectors()) out.push({ ax: c.foot.x, az: c.foot.z, bx: c.to.x, bz: c.to.z, half: 5 });
  return out;
}

export function distToSeg(s: RoadSeg, x: number, z: number): number {
  const dx = s.bx - s.ax, dz = s.bz - s.az;
  const len2 = dx * dx + dz * dz;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / len2)) : 0;
  return Math.hypot(x - (s.ax + dx * t), z - (s.az + dz * t));
}

/** Distance to the nearest segment, and how far that is past the segment's own half width. */
export function nearestRoad(segs: readonly RoadSeg[], x: number, z: number): { dist: number; over: number } {
  let dist = Infinity, over = Infinity;
  for (const s of segs) {
    const d = distToSeg(s, x, z);
    if (d < dist) dist = d;
    if (d - s.half < over) over = d - s.half;
  }
  return { dist, over };
}

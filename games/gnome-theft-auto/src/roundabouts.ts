// Roundabouts (GTA batch 3, E28). A roundabout is data: a road path whose id starts with `roundabout/` and whose points
// form a closed ring (first point = last point), with the roads that meet it ending on its vertices. Everything else
// follows from that:
//   - the road graph (world.ts) marks every node on a ring with `ring` = the roundabout id, and the ring's links one-way
//     with `noDrive` (applyRoundabouts): traffic goes round anticlockwise seen from above with north (-z) up, so the
//     island is on the driver's left, matching right-hand traffic (lanes sit to the right of the centre line);
//   - errands, the GPS route and re-routing never take a link a node forbids (canDrive);
//   - a car entering gives way to cars already on the ring (traffic.ts, entering / onRing);
//   - the island in the middle is scenery (roundaboutIslands.ts), solid, round.
//
// Pure: no three.js, no DOM.
import { HIGHWAYS } from './config';
import type { RoadNode } from './types';

/** Road path ids starting with this are roundabout rings. */
export const ROUNDABOUT_PREFIX = 'roundabout/';

export interface Roundabout {
  /** The ring's road path id ('roundabout/hatwheel'). */
  id: string;
  /** Centre and ring radius (the centre line), metres. */
  x: number;
  z: number;
  r: number;
  /** Paved width of the ring road. */
  width: number;
}

/**
 * A ring's centre and radius from its points (the closing point counted once): a least-squares circle fit, since the
 * vertices are not evenly spread round the ring (they sit on its spokes) and their mean is off centre.
 */
function fromRing(id: string, points: readonly (readonly [number, number])[], width: number): Roundabout {
  const pts = points.slice(0, -1);
  // Fit x^2 + z^2 + D x + E z + F = 0 (Kasa), about the mean for conditioning.
  const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const mz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  let sxx = 0, sxz = 0, szz = 0, sx = 0, sz = 0, sxw = 0, szw = 0, sw = 0;
  for (const [px, pz] of pts) {
    const x = px - mx, z = pz - mz, w = -(x * x + z * z);
    sxx += x * x; sxz += x * z; szz += z * z; sx += x; sz += z; sxw += x * w; szw += z * w; sw += w;
  }
  const n = pts.length;
  // Normal equations [sxx sxz sx; sxz szz sz; sx sz n] [D E F] = [sxw szw sw], solved by Cramer's rule.
  const det3 = (a: number[]): number =>
    a[0] * (a[4] * a[8] - a[5] * a[7]) - a[1] * (a[3] * a[8] - a[5] * a[6]) + a[2] * (a[3] * a[7] - a[4] * a[6]);
  const M = [sxx, sxz, sx, sxz, szz, sz, sx, sz, n];
  const det = det3(M) || 1e-12;
  const D = det3([sxw, sxz, sx, szw, szz, sz, sw, sz, n]) / det;
  const E = det3([sxx, sxw, sx, sxz, szw, sz, sx, sw, n]) / det;
  const x = mx - D / 2, z = mz - E / 2;
  const r = pts.reduce((s, p) => s + Math.hypot(p[0] - x, p[1] - z), 0) / pts.length;
  return { id, x, z, r, width };
}

/** Every roundabout on the map, in highway order. */
export const ROUNDABOUTS: readonly Roundabout[] = HIGHWAYS
  .filter((h) => h.id.startsWith(ROUNDABOUT_PREFIX))
  .map((h) => fromRing(h.id, h.points, h.width));

/** The roundabout whose ring road (centre line +- width/2, grown by margin) or island holds (x, z), or null. */
export function roundaboutAt(x: number, z: number, margin = 0): Roundabout | null {
  for (const rb of ROUNDABOUTS) {
    if (Math.hypot(x - rb.x, z - rb.z) <= rb.r + rb.width / 2 + margin) return rb;
  }
  return null;
}

/** True when (x, z) is on the ring road of `rb` (within the paved width, grown by margin), not the island. */
export function onRing(rb: Roundabout, x: number, z: number, margin = 0): boolean {
  return Math.abs(Math.hypot(x - rb.x, z - rb.z) - rb.r) <= rb.width / 2 + margin;
}

/** Radius of the island (kerb to kerb inside the ring road). */
export function islandRadius(rb: Roundabout): number {
  return Math.max(2, rb.r - rb.width / 2 - 0.5);
}

/** Every ring applyRoundabouts has marked (the map's, plus any a test graph used), by id. */
const APPLIED = new Map<string, Roundabout>(ROUNDABOUTS.map((r) => [r.id, r]));

/** The roundabout a node's `ring` names, or null. */
export function ringById(id: string | undefined): Roundabout | null {
  return id === undefined ? null : APPLIED.get(id) ?? null;
}

/** True when a car may drive from node `from` to its neighbour `toId` (false along a one-way ring the wrong way). */
export function canDrive(from: RoadNode, toId: number): boolean {
  return !from.noDrive || !from.noDrive.includes(toId);
}

/** True when travelling a -> b keeps the point (cx, cz) on the driver's left (lanes are on the right of the line). */
export function islandOnLeft(ax: number, az: number, bx: number, bz: number, cx: number, cz: number): boolean {
  const dx = bx - ax, dz = bz - az;
  // Right of travel is (-dz, dx) (traffic.ts / trafficSim.ts lanePose), so left is (dz, -dx).
  return (cx - ax) * dz + (cz - az) * -dx > 0;
}

/**
 * Mark the roundabouts in a built road graph: `ring` on every node on a ring, `noDrive` on each ring link's wrong-way
 * end. Ring nodes are the nodes within 0.75 m of a ring's radius and inside its paved band; only links between two
 * nodes of the same ring become one-way. Idempotent. Call once, after the nodes are linked.
 */
export function applyRoundabouts(nodes: RoadNode[], rings: readonly Roundabout[] = ROUNDABOUTS): void {
  for (const rb of rings) {
    APPLIED.set(rb.id, rb);
    const on = nodes.filter((n) => n.deck === undefined && Math.abs(Math.hypot(n.x - rb.x, n.z - rb.z) - rb.r) < 0.75);
    const ids = new Set(on.map((n) => n.id));
    for (const n of on) n.ring = rb.id;
    for (const a of on) {
      for (const bid of a.links) {
        if (!ids.has(bid)) continue;
        const b = nodes[bid] && nodes[bid].id === bid ? nodes[bid] : nodes.find((q) => q.id === bid)!;
        if (islandOnLeft(a.x, a.z, b.x, b.z, rb.x, rb.z)) continue;
        a.noDrive ??= [];
        if (!a.noDrive.includes(bid)) a.noDrive.push(bid);
      }
    }
  }
}

/** Watches one body (the player) for a full lap of a roundabout, the right way round (achievement gta-roundabout-lap). */
export interface LapWatch {
  /** Feed the position each frame; true on the frame a lap completes (then it starts counting afresh). */
  step(x: number, z: number, dt: number): boolean;
}

/** A lap counts when the angle round one ring falls by a full turn (island on the left) without leaving it for 2 s. */
export function createLapWatch(rings: readonly Roundabout[] = ROUNDABOUTS): LapWatch {
  let ring: Roundabout | null = null;
  let last = 0;
  let turned = 0;
  let offT = 0;
  return {
    step(x, z, dt) {
      const rb = rings.find((r) => onRing(r, x, z, 1.5)) ?? null;
      if (!rb) {
        offT += dt;
        if (offT > 2) { ring = null; turned = 0; }
        return false;
      }
      offT = 0;
      const a = Math.atan2(z - rb.z, x - rb.x);
      if (rb !== ring) { ring = rb; last = a; turned = 0; return false; }
      turned += Math.atan2(Math.sin(a - last), Math.cos(a - last));
      last = a;
      if (turned <= -2 * Math.PI) { turned = 0; return true; }
      return false;
    },
  };
}

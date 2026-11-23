// Wide-area traffic: cars off-screen are "ghosts" that drive the road graph cheaply (no three.js, no DOM). A ghost follows
// the same errands as a live driver (errands.ts), slows behind the car ahead, parks for a visit, and is only ever placed
// where no viewer can see it (spots). traffic.ts wires these in; this file is pure maths, unit-tested headless.
import { TRAFFIC } from './config';
import { freshErrand, nextLeg, placeNodes, type Errand, type ErrandWorld } from './errands';
import type { RoadNode, VehicleKind } from './types';

/** A ghost this close to the end of its errand's last segment parks for a visit. */
export const GHOST_PARK = 14;

export interface SimSeg { a: number; b: number; len: number; mx: number; mz: number }
export interface SimGraph {
  nodes: readonly RoadNode[];
  byId: ReadonlyMap<number, RoadNode>;
  laneOffset: number;
  ew: ErrandWorld;
  /** Every undirected road segment once (a < b), with length and midpoint. Nodes with no links add nothing. */
  segs: readonly SimSeg[];
}

const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));
/** Wrap an angle to (-PI, PI]. */
const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/** Build the sim view of a road graph: id lookup, the errand world, and each undirected segment once. */
export function simGraph(nodes: readonly RoadNode[], laneOffset: number): SimGraph {
  const byId = new Map<number, RoadNode>();
  for (const n of nodes) byId.set(n.id, n);
  const segs: SimSeg[] = [];
  const seen = new Set<string>();
  for (const n of nodes) {
    for (const l of n.links) {
      const m = byId.get(l);
      if (!m || m.id === n.id) continue;
      const [p, q] = n.id < m.id ? [n, m] : [m, n];
      const key = `${p.id}>${q.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      segs.push({
        a: p.id, b: q.id, len: Math.hypot(q.x - p.x, q.z - p.z), mx: (p.x + q.x) / 2, mz: (p.z + q.z) / 2,
      });
    }
  }
  return { nodes, byId, laneOffset, ew: { nodes, placeNode: placeNodes(nodes) }, segs };
}

export interface LanePose { x: number; z: number; yaw: number }

/** Unit direction from node `from` to node `to` in (x, z), with the length; +z and length 0 when either node is missing or they coincide. */
function segDir(g: SimGraph, from: number, to: number): { x: number; z: number; len: number } {
  const a = g.byId.get(from);
  const b = g.byId.get(to);
  if (!a || !b) return { x: 0, z: 1, len: 0 };
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) return { x: 0, z: 1, len: 0 };
  return { x: dx / len, z: dz / len, len };
}

/** Driving length of the road from node `from` to node `to` (0 if a node is missing). */
export function segLength(g: SimGraph, from: number, to: number): number {
  return segDir(g, from, to).len;
}

/** t metres along the lane from -> to (t clamped to [0, len]). */
export function lanePose(g: SimGraph, from: number, to: number, t: number): LanePose {
  const a = g.byId.get(from);
  if (!a) return { x: 0, z: 0, yaw: 0 };
  const d = segDir(g, from, to);
  const s = clamp(t, 0, d.len);
  return {
    x: a.x - d.z * g.laneOffset + d.x * s,
    z: a.z + d.x * g.laneOffset + d.z * s,
    yaw: Math.atan2(d.x, d.z),
  };
}

/** Projection of (x, z) onto the from -> to centre line, clamped to [0, len]. */
export function laneT(g: SimGraph, from: number, to: number, x: number, z: number): number {
  const a = g.byId.get(from);
  if (!a) return 0;
  const d = segDir(g, from, to);
  return clamp((x - a.x) * d.x + (z - a.z) * d.z, 0, d.len);
}

export interface Ghost {
  id: number;
  kind: VehicleKind;
  tint: number;
  from: number; to: number;
  next: number | null;
  t: number;
  speed: number;
  cruise: number;
  corner: number;
  errand: Errand | null;
  dwellT: number;
  x: number; z: number; yaw: number;
  rx: number; rz: number; ryaw: number;
  live: boolean;
}
export interface Spot { from: number; to: number; t: number; x: number; z: number; yaw: number }

let nextGhostId = 1;

/** The node after `to` on an errand, or null: path[1] of a fresh errand. */
function nextOf(errand: Errand | null): number | null {
  return errand && errand.path.length > 1 ? errand.path[1] : null;
}

/** A new ghost on `spot`, moving at `cruise`, with a fresh errand (freshErrand(g.ew, kind, spot.to, spot.from, rand)). ids count up from 1. */
export function createGhost(
  g: SimGraph, spot: Spot, kind: VehicleKind, tint: number, cruise: number, corner: number, rand: () => number = Math.random,
): Ghost {
  const errand = freshErrand(g.ew, kind, spot.to, spot.from, rand);
  return {
    id: nextGhostId++, kind, tint,
    from: spot.from, to: spot.to, next: nextOf(errand), t: spot.t,
    speed: cruise, cruise, corner, errand, dwellT: 0,
    x: spot.x, z: spot.z, yaw: spot.yaw,
    rx: spot.x, rz: spot.z, ryaw: spot.yaw,
    live: false,
  };
}

/** Move a ghost to a new spot (a respawn): fresh errand, pose and smoothed pose set to the spot, speed = cruise, dwellT 0, live false. */
export function placeGhost(g: SimGraph, ghost: Ghost, spot: Spot, rand: () => number = Math.random): void {
  ghost.from = spot.from;
  ghost.to = spot.to;
  ghost.t = spot.t;
  ghost.errand = freshErrand(g.ew, ghost.kind, spot.to, spot.from, rand);
  ghost.next = nextOf(ghost.errand);
  ghost.speed = ghost.cruise;
  ghost.dwellT = 0;
  ghost.live = false;
  ghost.x = spot.x;
  ghost.z = spot.z;
  ghost.yaw = spot.yaw;
  ghost.rx = spot.x;
  ghost.rz = spot.z;
  ghost.ryaw = spot.yaw;
}

/** Heading (yaw) of the segment a -> b. */
function headingOf(g: SimGraph, a: number, b: number): number {
  const d = segDir(g, a, b);
  return Math.atan2(d.x, d.z);
}

/** Absolute turn (radians) at node `to` between the segment from -> to and the segment to -> next. */
function turnAt(g: SimGraph, from: number, to: number, next: number): number {
  return Math.abs(wrap(headingOf(g, to, next) - headingOf(g, from, to)));
}

/** Set a ghost's pose from its lane position. */
function setPose(g: SimGraph, gh: Ghost): void {
  const p = lanePose(g, gh.from, gh.to, gh.t);
  gh.x = p.x;
  gh.z = p.z;
  gh.yaw = p.yaw;
}

/** One non-live ghost's step: parking, speed, movement along the road, then its pose. `snap` holds the start-of-frame t and speed. */
function advanceGhost(
  gh: Ghost, dt: number, g: SimGraph, groups: ReadonlyMap<string, Ghost[]>,
  snap: ReadonlyMap<Ghost, { t: number; speed: number }>, rand: () => number,
): void {
  if (gh.dwellT > 0) {
    gh.dwellT -= dt;
    gh.speed = 0;
    if (gh.dwellT <= 0) {
      gh.dwellT = 0;
      gh.errand = freshErrand(g.ew, gh.kind, gh.to, gh.from, rand);
      gh.next = nextOf(gh.errand);
    }
    setPose(g, gh);
    return;
  }

  const len = segLength(g, gh.from, gh.to);
  const remaining = len - gh.t;
  if (gh.errand !== null && gh.errand.step === gh.errand.path.length - 1 && remaining <= GHOST_PARK) {
    const dwell = TRAFFIC.dwell;
    gh.dwellT = dwell[0] + rand() * (dwell[1] - dwell[0]);
    gh.speed = 0;
    setPose(g, gh);
    return;
  }

  const me = snap.get(gh) ?? { t: gh.t, speed: gh.speed };
  // The nearest car ahead: on this segment, or on the next one (so a car that has just crossed a junction keeps its gap).
  let lead: { speed: number; gap: number } | null = null;
  const ahead = [`${gh.from}>${gh.to}`];
  if (gh.next !== null) ahead.push(`${gh.to}>${gh.next}`);
  for (let k = 0; k < ahead.length; k++) {
    for (const o of groups.get(ahead[k]) ?? []) {
      if (o === gh) continue;
      const os = snap.get(o);
      if (!os) continue;
      const gap = k === 0 ? os.t - me.t : remaining + os.t;
      if (gap <= 0) continue;
      if (lead === null || gap < lead.gap) lead = { speed: os.speed, gap };
    }
  }

  let target = gh.cruise;
  if (gh.next !== null && remaining < 20 && turnAt(g, gh.from, gh.to, gh.next) > 0.5) target = gh.corner;
  if (lead !== null) {
    const gap = lead.gap;
    if (gap < TRAFFIC.ghostGap) target = 0;
    else if (gap < TRAFFIC.ghostGap + 10) target = Math.min(target, lead.speed);
  }
  gh.speed = gh.speed < target
    ? Math.min(target, gh.speed + 3 * dt)
    : Math.max(target, gh.speed - 8 * dt);

  let t = gh.t + gh.speed * dt;
  if (lead !== null) t = Math.max(me.t, Math.min(t, me.t + lead.gap - TRAFFIC.ghostGap * 0.5));
  let segLen = len;
  for (let i = 0; i < 4 && t >= segLen; i++) {
    t -= segLen;
    const came = gh.from;
    gh.from = gh.to;
    const leg = nextLeg(g.ew, gh.kind, gh.errand, gh.from, came, rand);
    gh.errand = leg.errand;
    gh.to = leg.to;
    gh.next = leg.next;
    segLen = segLength(g, gh.from, gh.to);
    if (segLen < 1e-6) {
      t = 0;
      break;
    }
  }
  gh.t = t;
  setPose(g, gh);
}

/** Advance every non-live ghost by dt (see the algorithm). */
export function stepGhosts(ghosts: Ghost[], dt: number, g: SimGraph, rand: () => number = Math.random): void {
  const groups = new Map<string, Ghost[]>();
  const snap = new Map<Ghost, { t: number; speed: number }>();
  for (const gh of ghosts) {
    snap.set(gh, { t: gh.t, speed: gh.speed });
    const key = `${gh.from}>${gh.to}`;
    const list = groups.get(key);
    if (list) list.push(gh);
    else groups.set(key, [gh]);
  }
  for (const gh of ghosts) {
    if (!gh.live) advanceGhost(gh, dt, g, groups, snap, rand);
  }
  const k = 1 - Math.exp(-6 * dt);
  for (const gh of ghosts) {
    if (gh.live) {
      gh.rx = gh.x;
      gh.rz = gh.z;
      gh.ryaw = gh.yaw;
    } else {
      gh.rx += (gh.x - gh.rx) * k;
      gh.rz += (gh.z - gh.rz) * k;
      gh.ryaw += wrap(gh.yaw - gh.ryaw) * k;
    }
  }
}

export interface Viewer { x: number; z: number; dirX: number; dirZ: number }

/** Could this viewer see (x, z)? false at or beyond TRAFFIC.hideDistance; true nearer than TRAFFIC.nearHidden; true when
 *  dirX and dirZ are both 0 (unknown facing); otherwise true when the angle between (dirX, dirZ) and the direction to the point
 *  is below TRAFFIC.viewHalfAngle. */
export function inView(v: Viewer, x: number, z: number): boolean {
  const dx = x - v.x;
  const dz = z - v.z;
  const d = Math.hypot(dx, dz);
  if (d >= TRAFFIC.hideDistance) return false;
  if (d < TRAFFIC.nearHidden) return true;
  const facing = Math.hypot(v.dirX, v.dirZ);
  if (facing < 1e-6) return true;
  const cos = clamp((v.dirX * dx + v.dirZ * dz) / (facing * d), -1, 1);
  return Math.acos(cos) < TRAFFIC.viewHalfAngle;
}

/** True when no viewer could see (x, z). */
export function hiddenFromAll(viewers: readonly Viewer[], x: number, z: number): boolean {
  return viewers.every((v) => !inView(v, x, z));
}

/** Metres of road whose segment midpoint is within radius of (x, z). */
export function roadLengthNear(g: SimGraph, x: number, z: number, radius: number): number {
  let total = 0;
  for (const s of g.segs) {
    if (Math.hypot(s.mx - x, s.mz - z) <= radius) total += s.len;
  }
  return total;
}

/** Math.round(roadLengthNear(g, x, z, TRAFFIC.simRadius) / TRAFFIC.spacing), clamped to [TRAFFIC.minCars, TRAFFIC.maxCars]. */
export function targetPopulation(g: SimGraph, x: number, z: number): number {
  const n = Math.round(roadLengthNear(g, x, z, TRAFFIC.simRadius) / TRAFFIC.spacing);
  return clamp(n, TRAFFIC.minCars, TRAFFIC.maxCars);
}

export interface SpotQuery {
  x: number; z: number;
  minDist: number; maxDist: number;
  viewers: readonly Viewer[];
  avoid: readonly { x: number; z: number }[];
  clear: number;
}

/** A random lane spot in the query's ring that no viewer can see and that keeps `clear` metres from every avoided point; null after 40 tries. */
export function pickSpot(g: SimGraph, q: SpotQuery, rand: () => number = Math.random): Spot | null {
  const cands = g.segs.filter((s) => Math.hypot(s.mx - q.x, s.mz - q.z) <= q.maxDist + s.len / 2);
  let total = 0;
  for (const s of cands) total += s.len;
  if (total <= 0) return null;
  for (let tries = 0; tries < 40; tries++) {
    let roll = rand() * total;
    let seg = cands[cands.length - 1];
    for (const s of cands) {
      roll -= s.len;
      if (roll <= 0) {
        seg = s;
        break;
      }
    }
    const t = seg.len < 8 ? seg.len / 2 : 3 + rand() * (seg.len - 6);
    const forward = rand() < 0.5;
    const from = forward ? seg.a : seg.b;
    const to = forward ? seg.b : seg.a;
    const p = lanePose(g, from, to, t);
    const dist = Math.hypot(p.x - q.x, p.z - q.z);
    if (dist < q.minDist || dist > q.maxDist) continue;
    if (q.viewers.length > 0 && !hiddenFromAll(q.viewers, p.x, p.z)) continue;
    if (q.avoid.some((a) => Math.hypot(a.x - p.x, a.z - p.z) < q.clear)) continue;
    return { from, to, t, x: p.x, z: p.z, yaw: p.yaw };
  }
  return null;
}

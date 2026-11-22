// Town walks: simulated gnomes walk between the landmarks, doorways and NPCs of every town with the game's real
// pathfinding (findPath3 + standY, the click-to-move road cost) and a stepper like the player's, so a town that a
// gnome cannot get round shows up in a report and a test instead of in play. Pure: no THREE, no DOM. It takes a
// terrain-like object, so the script (scripts/sim-town.mjs), the test and the game (src/townTour.ts) share it.
import { mulberry32 } from '@lawn/level';
import { TUNING, WORLD } from '../config';
import { findPath3, type Point3 } from '../pathfind';
import { enemyMayEngage, inTown, TOWNS, townById, townWaypoints, type Town, type TownWaypoint } from '../towns';

export interface TownWalkTerrain {
  standY(x: number, z: number, fromY: number): number | null;
  heightAt(x: number, z: number): number;
  findFreeSpot(x: number, z: number, maxRadius?: number): { x: number; z: number };
  distToRoad(x: number, z: number): number;
}

/** stroller: a random waypoint each leg. errand: doorways and NPCs, alternately. scripted: a nearest-neighbour loop
 * over every waypoint, from the shrine (or the town centre). */
export type TownWalkPolicy = 'stroller' | 'errand' | 'scripted';

export interface TownWalkSpec {
  townId: string;
  walkers: number;
  /** Legs per walker. 0 (scripted only): one full loop, every waypoint once and back to the first. */
  legs: number;
  policy: TownWalkPolicy;
  seed: number;
  /** Waypoint ids that are intentionally unreachable (src/townBlocks.ts TOWN_BLOCKS for this town). */
  skip?: readonly string[];
}

export interface TownWalkLeg {
  walker: number;
  from: string;
  to: string;
  ok: boolean;
  /** Where the walker stopped, metres from the waypoint. */
  endDist: number;
  /** Length of the planned path, metres. */
  pathLen: number;
  /** Walking time at TUNING.walkSpeed. */
  seconds: number;
  expanded?: number;
}

export interface TownWalkResult {
  townId: string;
  policy: TownWalkPolicy;
  legs: TownWalkLeg[];
  okRate: number;
  /** Samples (every 1 m walked) inside a town within aggro reach of an ambient spawn group that may engage there. */
  threats: number;
  failures: string[];
}

/** A spawn group as the threat check needs it (content.ts SPAWNS fits). */
export interface TownWalkSpawn {
  id?: string;
  x: number;
  z: number;
  spread: number;
  townFight?: boolean;
  enemy: string;
}

/** A leg ends ok when the walker stops this close to the waypoint (the same 1.5 m the player's repath uses). */
export const TOWN_WALK_REACH = 1.5;
const STEP = 0.25;
const SAMPLE_EVERY = 1;

/** Where a town walk starts: the shrine when it stands in town, otherwise the town centre. */
export function townStartPoint(town: Town, waypoints: readonly TownWaypoint[] = townWaypoints(town)): { x: number; z: number } {
  const shrine = waypoints.find((w) => w.kind === 'shrine');
  return shrine ? { x: shrine.x, z: shrine.z } : { x: town.x, z: town.z };
}

function nearestNeighbourTour(points: readonly TownWaypoint[], start: { x: number; z: number }): TownWaypoint[] {
  const left = [...points];
  const out: TownWaypoint[] = [];
  let cx = start.x;
  let cz = start.z;
  while (left.length > 0) {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < left.length; i++) {
      const d = Math.hypot(left[i].x - cx, left[i].z - cz);
      if (d < bestD) { bestD = d; best = i; }
    }
    const w = left.splice(best, 1)[0];
    out.push(w);
    cx = w.x;
    cz = w.z;
  }
  return out;
}

function pick<T>(list: readonly T[], rng: () => number, not?: T): T {
  if (list.length > 1 && not !== undefined) {
    const rest = list.filter((x) => x !== not);
    return rest[Math.floor(rng() * rest.length)];
  }
  return list[Math.floor(rng() * list.length)];
}

/**
 * The waypoints a walker visits, in order (the walker starts at townStartPoint). `skip` ids are left out.
 * scripted ignores rng; legs <= 0 gives one full loop (every waypoint, then back to the first), and more legs than
 * waypoints go round the loop again.
 */
export function townRoute(town: Town, policy: TownWalkPolicy, rng: () => number, legs: number, skip?: readonly string[]): TownWaypoint[] {
  const all = townWaypoints(town);
  const skipped = new Set(skip ?? []);
  const points = all.filter((w) => !skipped.has(w.id));
  if (points.length === 0) return [];
  if (policy === 'scripted') {
    const tour = nearestNeighbourTour(points, townStartPoint(town, all));
    const n = legs > 0 ? legs : tour.length + 1;
    const out: TownWaypoint[] = [];
    for (let i = 0; i < n; i++) out.push(tour[i % tour.length]);
    return out;
  }
  const n = Math.max(1, legs);
  const out: TownWaypoint[] = [];
  let prev: TownWaypoint | undefined;
  if (policy === 'stroller') {
    for (let i = 0; i < n; i++) out.push((prev = pick(points, rng, prev)));
    return out;
  }
  const doors = points.filter((w) => w.kind === 'door');
  const npcs = points.filter((w) => w.kind === 'npc');
  for (let i = 0; i < n; i++) {
    const want = i % 2 === 0 ? doors : npcs;
    const list = want.length > 0 ? want : doors.length > 0 ? doors : npcs.length > 0 ? npcs : points;
    out.push((prev = pick(list, rng, prev)));
  }
  return out;
}

/** The click-to-move step cost (src/player.ts roadCostFn): roads cost TUNING.roadPathBias, open ground 1. */
function roadCost(t: TownWalkTerrain): (x: number, z: number) => number {
  const memo = new Map<number, number>();
  return (x, z) => {
    const i = Math.round(x);
    const j = Math.round(z);
    const key = (i + 4096) * 8192 + (j + 4096);
    let c = memo.get(key);
    if (c === undefined) {
      c = t.distToRoad(i, j) < WORLD.roadHalfWidth ? TUNING.roadPathBias : 1;
      memo.set(key, c);
    }
    return c;
  };
}

/** Plans a path like click-to-move does (default budget, road cost when TUNING.roadPathBias < 1). */
export function planTownPath(t: TownWalkTerrain, from: Point3, goal: Point3): Point3[] {
  if (TUNING.roadPathBias < 1) {
    return findPath3(from, goal, t.standY, undefined, { cost: roadCost(t), minCost: TUNING.roadPathBias });
  }
  return findPath3(from, goal, t.standY);
}

/** Re-plans a walker makes after a blocked step before a leg counts as failed (matches src/player.ts). */
export const BLOCK_REPLANS = 2;

interface WalkOut { x: number; y: number; z: number; stuck: boolean; blocked: boolean; walked: number }

/** Walks a path in STEP-metre steps with standY and the axis slide the player uses; onSample fires every metre. */
function walkPath(t: TownWalkTerrain, start: Point3, path: readonly Point3[], onSample: (x: number, z: number) => void): WalkOut {
  let x = start.x;
  let y = start.y;
  let z = start.z;
  let walked = 0;
  let sinceSample = 0;
  let blocked = false;
  let k = 0;
  let pathLen = 0;
  { let px = x; let pz = z; for (const p of path) { pathLen += Math.hypot(p.x - px, p.z - pz); px = p.x; pz = p.z; } }
  const maxSteps = Math.ceil(pathLen / STEP) * 3 + 200;
  for (let steps = 0; k < path.length && steps < maxSteps; steps++) {
    const wp = path[k];
    const dx = wp.x - x;
    const dz = wp.z - z;
    const dist = Math.hypot(dx, dz);
    if (dist <= 0.1) { k++; continue; }
    const stepLen = Math.min(dist, STEP);
    let nx = x + (dx / dist) * stepLen;
    let nz = z + (dz / dist) * stepLen;
    let ny = t.standY(nx, nz, y);
    if (ny === null) {
      const sx = Math.abs(dx) > 1e-4 ? t.standY(nx, z, y) : null;
      const sz = Math.abs(dz) > 1e-4 ? t.standY(x, nz, y) : null;
      if (sx !== null && (sz === null || Math.abs(dx) >= Math.abs(dz))) { nz = z; ny = sx; }
      else if (sz !== null) { nx = x; ny = sz; }
      else { blocked = true; break; }
    }
    const moved = Math.hypot(nx - x, nz - z);
    x = nx; y = ny; z = nz;
    walked += moved;
    sinceSample += moved;
    while (sinceSample >= SAMPLE_EVERY) { sinceSample -= SAMPLE_EVERY; onSample(x, z); }
    if (Math.hypot(wp.x - x, wp.z - z) <= 0.1) k++;
  }
  return { x, y, z, stuck: k < path.length, blocked, walked };
}

/** Runs one town-walk scenario. `spawns` (content.ts SPAWNS) feed the threat count; leave it out to skip that check. */
export function simulateTownWalk(t: TownWalkTerrain, spec: TownWalkSpec, spawns?: readonly TownWalkSpawn[]): TownWalkResult {
  const town = townById(spec.townId);
  if (!town) throw new Error(`town walk: unknown town ${spec.townId}`);
  const reach = TUNING.aggroRange;
  const near = (spawns ?? []).filter((g) => g.townFight !== true
    && Math.hypot(g.x - town.x, g.z - town.z) <= town.r + reach + g.spread + 1);
  const legs: TownWalkLeg[] = [];
  const failures: string[] = [];
  let threats = 0;
  const onSample = (x: number, z: number): void => {
    if (!inTown(x, z)) return;
    for (const g of near) {
      if (Math.hypot(x - g.x, z - g.z) <= reach + g.spread && enemyMayEngage(x, z, g.townFight === true)) threats++;
    }
  };
  const start = townStartPoint(town);
  for (let w = 0; w < Math.max(1, spec.walkers); w++) {
    const rng = mulberry32((spec.seed >>> 0) + w * 7919);
    const route = townRoute(town, spec.policy, rng, spec.legs, spec.skip);
    const s = t.findFreeSpot(start.x + (w === 0 ? 0 : (rng() - 0.5) * 4), start.z + (w === 0 ? 0 : (rng() - 0.5) * 4));
    let pos: Point3 = { x: s.x, y: t.heightAt(s.x, s.z), z: s.z };
    let fromId = 'start';
    for (const wp of route) {
      // Aim at the nearest spot a gnome can stand on: a landmark like the Thatchford fountain is itself solid.
      const stand = t.findFreeSpot(wp.x, wp.z);
      const goal: Point3 = { x: stand.x, y: t.heightAt(stand.x, stand.z), z: stand.z };
      const path = planTownPath(t, pos, goal);
      let pathLen = 0;
      { let px = pos.x; let pz = pos.z; for (const p of path) { pathLen += Math.hypot(p.x - px, p.z - pz); px = p.x; pz = p.z; } }
      let out = walkPath(t, pos, path, onSample);
      // Like click-to-move (src/player.ts): a step the 1 m planner judged clear can graze a collider edge; the walker
      // plans again from where it stopped (up to BLOCK_REPLANS times) before giving up.
      for (let r = 0; r < BLOCK_REPLANS && out.blocked; r++) {
        const here: Point3 = { x: out.x, y: out.y, z: out.z };
        const again = walkPath(t, here, planTownPath(t, here, goal), onSample);
        out = { ...again, walked: out.walked + again.walked };
      }
      const endDist = Math.hypot(out.x - goal.x, out.z - goal.z);
      const ok = !out.stuck && endDist <= TOWN_WALK_REACH;
      legs.push({ walker: w, from: fromId, to: wp.id, ok, endDist, pathLen, seconds: out.walked / TUNING.walkSpeed });
      if (!ok) {
        const why = out.blocked ? 'blocked on the way (the path crosses ground standY refuses)' : out.stuck ? 'ran out of steps' : path.length === 0 ? 'no path' : 'path ends short';
        failures.push(`${town.id} w${w}: ${fromId} -> ${wp.id} (${wp.label}) at (${wp.x.toFixed(1)}, ${wp.z.toFixed(1)}): ${why}, stopped ${endDist.toFixed(1)} m away`);
      }
      pos = { x: out.x, y: out.y, z: out.z };
      fromId = wp.id;
    }
  }
  const okCount = legs.filter((l) => l.ok).length;
  return { townId: town.id, policy: spec.policy, legs, okRate: legs.length ? okCount / legs.length : 1, threats, failures };
}

/** Scenario id for a spec, e.g. `town-thatchford-stroller`. */
export function townWalkId(spec: Pick<TownWalkSpec, 'townId' | 'policy'>): string {
  return `town-${spec.townId}-${spec.policy}`;
}

/** One stroller, one errand and one scripted (full loop) scenario per town. Callers add `skip` from TOWN_BLOCKS. */
export const TOWN_WALK_SCENARIOS: readonly TownWalkSpec[] = TOWNS.flatMap((t) => [
  { townId: t.id, walkers: 4, legs: 12, policy: 'stroller' as const, seed: 1 },
  { townId: t.id, walkers: 3, legs: 10, policy: 'errand' as const, seed: 2 },
  { townId: t.id, walkers: 1, legs: 0, policy: 'scripted' as const, seed: 3 },
]);

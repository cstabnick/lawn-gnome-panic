Epic: 1, traffic pass
Depends on: none

## Environment
Read `docs/roadmaps/gta-traffic-pass/_env.md` first (working directory, node path, rules: no install, no commit, no dev server,
other workers editing other files).

## Goal
A new pure module `games/gnome-theft-auto/src/trafficSim.ts` that simulates off-screen traffic cars ("ghosts") cheaply along
the road graph, plus the spawn rules (a car may only appear where no viewer can see it). No three.js, no DOM. The planner wires
it into traffic.ts afterwards; you only write this module and its test.

## Read first
- `games/gnome-theft-auto/src/errands.ts`: `Errand`, `ErrandWorld`, `placeNodes`, and at the bottom `freshErrand` and `nextLeg`
  (use these two for all routing; do not change errands.ts, another worker owns it).
- `games/gnome-theft-auto/src/config.ts`: the `TRAFFIC` object (around line 468): `dwell`, `simRadius`, `hideDistance`,
  `viewHalfAngle`, `nearHidden`, `ghostGap`, `spacing`, `minCars`, `maxCars`.
- `games/gnome-theft-auto/src/types.ts`: `RoadNode` is `{ id: number; x: number; z: number; links: number[] }`; `VehicleKind`.
- `games/gnome-theft-auto/src/traffic.ts` lines 66-95 (`segmentDir`, `placeOn`): the lane convention you must match.
- `games/gnome-theft-auto/src/traffic.test.ts` lines 26-41: `gridNodes()` (copy it into your test).

## Change
Create `games/gnome-theft-auto/src/trafficSim.ts` exporting exactly the contract below, and
`games/gnome-theft-auto/src/trafficSim.test.ts` (vitest).

### Lane convention (must match traffic.ts)
For a segment from node A to node B: `dir = unit(B - A)` in (x, z), `right = (-dir.z, dir.x)`. The lane line is
`A + right * laneOffset`, and a point `t` metres along it is `A + right * laneOffset + dir * t`. Heading `yaw = Math.atan2(dir.x, dir.z)`.
For a zero-length segment use `dir = (0, 1)`.

### Ghost stepping (`stepGhosts`), per frame
1. Group ALL ghosts (live ones too) by segment key `${from}>${to}`.
2. For each ghost with `live === false`:
   a. Parked (`dwellT > 0`): `dwellT -= dt`, `speed = 0`. When it reaches <= 0: `dwellT = 0`,
      `errand = freshErrand(g.ew, kind, to, from, rand)`, `next = errand && errand.path.length > 1 ? errand.path[1] : null`.
      Then go to the pose step (e).
   b. `len = segLength(g, from, to)`, `remaining = len - t`. If the errand is on its last leg
      (`errand !== null && errand.step === errand.path.length - 1`) and `remaining <= GHOST_PARK`: start a visit:
      `dwellT = dwell[0] + rand() * (dwell[1] - dwell[0])` with `TRAFFIC.dwell`, `speed = 0`, go to (e).
   c. Target speed: `cruise`; if `next !== null` and `remaining < 20` and the turn at `to` (absolute wrapped angle between
      heading A->B and heading B->next) is > 0.5 rad, the target is `corner`. Leader = the ghost on the same segment with the
      smallest `t` greater than this ghost's `t` (ties: ignore). If there is a leader with `gap = leader.t - t`: gap <
      `TRAFFIC.ghostGap` -> target 0; else gap < `TRAFFIC.ghostGap + 10` -> target = min(target, leader.speed).
      Speed eases: up at 3 m/s², down at 8 m/s², never past the target.
   d. `t += speed * dt`. With a leader, never end closer than `TRAFFIC.ghostGap * 0.5` behind it (but never move backwards).
      While `t >= len` (at most 4 times): `t -= len`, `came = from`, `from = to`, then
      `leg = nextLeg(g.ew, kind, errand, from, came, rand)`; set `errand = leg.errand`, `to = leg.to`, `next = leg.next`,
      `len = segLength(...)`; if `len < 1e-6` set `t = 0` and stop.
   e. Pose: `x, z, yaw` = `lanePose(g, from, to, t)`.
3. Smoothing, every ghost: live ghosts copy `rx = x, rz = z, ryaw = yaw`. Others ease: `k = 1 - Math.exp(-6 * dt)`,
   `rx += (x - rx) * k`, `rz += (z - rz) * k`, `ryaw += wrap(yaw - ryaw) * k` where `wrap(a) = Math.atan2(Math.sin(a), Math.cos(a))`.

### Spots (`pickSpot`)
Candidate segments: every entry of `g.segs` whose midpoint lies within `q.maxDist + seg.len / 2` of `(q.x, q.z)`.
Up to 40 tries: pick a candidate weighted by `len`; `t = len < 8 ? len / 2 : 3 + rand() * (len - 6)`; direction
`rand() < 0.5` -> from `a` to `b`, else from `b` to `a`; pose from `lanePose`. Reject when the distance from (q.x, q.z) is
outside `[q.minDist, q.maxDist]`, when `q.viewers.length > 0 && !hiddenFromAll(q.viewers, x, z)`, or when any point in
`q.avoid` is within `q.clear`. Return the first accepted spot, or null.

## Contract
```ts
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
  ew: ErrandWorld;               // { nodes, placeNode: placeNodes(nodes) }
  /** Every undirected road segment once (a < b), with length and midpoint. Nodes with no links add nothing. */
  segs: readonly SimSeg[];
}
export function simGraph(nodes: readonly RoadNode[], laneOffset: number): SimGraph;

export interface LanePose { x: number; z: number; yaw: number }
export function segLength(g: SimGraph, from: number, to: number): number;          // 0 if a node is missing
/** t metres along the lane from -> to (t clamped to [0, len]). */
export function lanePose(g: SimGraph, from: number, to: number, t: number): LanePose;
/** Projection of (x, z) onto the from -> to centre line, clamped to [0, len]. */
export function laneT(g: SimGraph, from: number, to: number, x: number, z: number): number;

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

/** A new ghost on `spot`, moving at `cruise`, with a fresh errand (freshErrand(g.ew, kind, spot.to, spot.from, rand)). ids count up from 1. */
export function createGhost(g: SimGraph, spot: Spot, kind: VehicleKind, tint: number, cruise: number, corner: number, rand?: () => number): Ghost;
/** Move a ghost to a new spot (a respawn): fresh errand, pose and smoothed pose set to the spot, speed = cruise, dwellT 0, live false. */
export function placeGhost(g: SimGraph, ghost: Ghost, spot: Spot, rand?: () => number): void;
/** Advance every non-live ghost by dt (see the algorithm). */
export function stepGhosts(ghosts: Ghost[], dt: number, g: SimGraph, rand?: () => number): void;

export interface Viewer { x: number; z: number; dirX: number; dirZ: number }
/** Could this viewer see (x, z)? false at or beyond TRAFFIC.hideDistance; true nearer than TRAFFIC.nearHidden; true when
 *  dirX and dirZ are both 0 (unknown facing); otherwise true when the angle between (dirX, dirZ) and the direction to the point
 *  is below TRAFFIC.viewHalfAngle. */
export function inView(v: Viewer, x: number, z: number): boolean;
export function hiddenFromAll(viewers: readonly Viewer[], x: number, z: number): boolean;

/** Metres of road whose segment midpoint is within radius of (x, z). */
export function roadLengthNear(g: SimGraph, x: number, z: number, radius: number): number;
/** Math.round(roadLengthNear(g, x, z, TRAFFIC.simRadius) / TRAFFIC.spacing), clamped to [TRAFFIC.minCars, TRAFFIC.maxCars]. */
export function targetPopulation(g: SimGraph, x: number, z: number): number;

export interface SpotQuery {
  x: number; z: number;
  minDist: number; maxDist: number;
  viewers: readonly Viewer[];
  avoid: readonly { x: number; z: number }[];
  clear: number;
}
export function pickSpot(g: SimGraph, q: SpotQuery, rand?: () => number): Spot | null;
```
`rand` defaults to `Math.random` everywhere.

## Tests (`trafficSim.test.ts`, copy `gridNodes()` from traffic.test.ts; use `simGraph(gridNodes(), 2.5)`)
1. `lanePose` on the segment from node (0,0) to node (0,60): at t = 10 it is `{ x: -2.5, z: 10, yaw: 0 }` (close to);
   `laneT(g, from, to, pose.x, pose.z)` gives back 10; t = 999 clamps to 60.
2. `segs`: no duplicates (each a < b), and `roadLengthNear(g, 0, 0, 1e6)` equals the sum of every link length / 2.
3. Drive 30 ghosts (spots from `pickSpot` with `viewers: []`, `minDist 0`, `maxDist 400`, `avoid` = the spots so far, `clear 10`;
   `cruise 12`, `corner 6`) for 3 simulated minutes at dt = 1/30. Expect: every ghost covered more than 300 m in total;
   at every 30th step no two non-parked ghosts on the same segment are closer than `TRAFFIC.ghostGap * 0.5 - 0.01`;
   U-turns (a ghost's new `to` equals the node it just left, at a node with 2+ links) are under 3 % of its junction passes,
   counted over all ghosts; at least 70 % of the ghosts parked for a visit at least once (dwellT > 0 seen).
4. `inView`: viewer at (0,0) looking +z (dirX 0, dirZ 1): (0, 100) visible; (0, -100) hidden; (0, 450) hidden (past
   hideDistance); (0, -20) visible (nearer than nearHidden); dir (0,0) -> (0, -100) visible.
5. `pickSpot` with that viewer, minDist 100, maxDist 350, 200 calls: every returned spot is hidden from it and its distance is
   in range; with a viewer whose dir is (0, 0) and maxDist 350 (all within hideDistance) it returns null.
6. `targetPopulation` is within [minCars, maxCars]; far outside the map (x = 5000) it is `TRAFFIC.minCars`.
7. `placeGhost` resets dwellT, live, speed and the smoothed pose.

## Done when
- `npx vitest run src/trafficSim.test.ts` passes, run from `games/gnome-theft-auto`
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in trafficSim.ts or trafficSim.test.ts

## Out of scope
Every other file. Do not edit errands.ts, traffic.ts, traffic.test.ts or config.ts.

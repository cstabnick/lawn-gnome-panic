// NPC-driven mowers on the roads, in two tiers. Every car is a "ghost" in trafficSim.ts: it lives on the road graph out to
// TRAFFIC.simRadius around the player and keeps driving its errand while nobody is near (cheap lane-following, drawn far
// off as an impostor, trafficImpostors.ts). Within TRAFFIC.liveRadius a ghost becomes a real vehicle (physics,
// collisions, a driver model) and drives here. Every driver has an errand (errands.ts: a real place, a route along the road
// graph, a few seconds' visit, then the next place). Live drivers follow their lane with pure pursuit, hold a target speed
// (slower into corners), brake for the player and other vehicles, and never sit stuck: a driver blocked by something that is
// not moving pulls out around it, a wedged driver reverses and re-routes, and one wedged for good is moved somewhere new.
// A car only ever appears, or is moved, where no viewer can see it (trafficSim.ts pickSpot), and a moved car is a new car:
// it comes back repaired.
import type * as THREE from 'three';
import { createGnomeModel } from '@lawn/gnome';
import { angleDiff } from './collide';
import { MOWER_TINTS, PLACES, TRAFFIC, VEHICLES, biomeAt } from './config';
import { districtAt } from './districts';
import { errandReason, freshErrand, nextLeg, placeNodes, type Errand, type ErrandWorld } from './errands';
import { biomeLookFor, gnomeState, randomTownLook } from './gnomes';
import { clearHands, poseHands } from './driverHands';
import { createVehicle, exitPoint, removeVehicle, repairVehicle, stepVehicle, syncVehicleMesh } from './vehicles';
import { heightAt } from './terrain';
import {
  createGhost, hiddenFromAll, lanePose, laneT, pickSpot, placeGhost, simGraph, stepGhosts, targetPopulation,
  type Ghost, type Spot, type Viewer,
} from './trafficSim';
import { createTrafficImpostors, type ImpostorPose } from './trafficImpostors';
import type { RoadNode, Traffic, TrafficView, Vehicle, VehicleKind, World } from './types';
import { inKeepOut, type KeepOutZone } from './cutscene/liveArea';

/** Where a driver is on the road graph and what it is up to. */
interface Driver {
  /** The segment it is driving: from -> to (node ids). `next` is the node after `to`, when known (to slow for the corner). */
  from: number;
  to: number;
  next: number | null;
  errand: Errand | null;
  /** Seconds this driver waits behind a stationary blocker before pulling out (rolled per driver, so standoffs break). */
  patience: number;
  /** Seconds continuously blocked by something ahead. */
  blockedT: number;
  /** While > 0: pulling out around a blocker, shifted `passSide` (-1 left, 1 right) of the lane. */
  passT: number;
  passSide: number;
  /** While > 0: backing out of a jam, nose swinging to `reverseSteer`. */
  reverseT: number;
  reverseSteer: number;
  /** Parked at the destination for `dwellT` more seconds. */
  visiting: boolean;
  dwellT: number;
  /** Progress watch: where it was `watchT` seconds ago, and how long it has been wedged in total. */
  watchT: number;
  watchX: number;
  watchZ: number;
  wedgedT: number;
}

const SPAWN_CLEAR = 12;
/** New cars per frame at most (filling up the population), and moved cars per frame at most. */
const MAX_SPAWNS_PER_FRAME = 3;
const MAX_MOVES_PER_FRAME = 4;
/** Off-screen cars turned into real vehicles per frame at most (building a vehicle and its driver is the costly part). */
const MAX_MATERIALIZE_PER_FRAME = 2;
const MAX_VEHICLES = 40;
const CLEANUP_DISTANCE = 60;
const ARRIVE_DISTANCE = 4;
const BRAKE_SIDE = 2.5;
/** A driver this close to the end of its last segment brakes to a stop and starts its visit. */
const PARK_DISTANCE = 14;
/** Pulling out around a blocker: how far off the lane line, and for how long. */
const PASS_SHIFT = 3.0;
const PASS_SECONDS = 3.2;
/** A vehicle slower than this counts as stopped (it will not clear the road by itself soon). */
const STILL_SPEED = 1.5;
/** Keep-out zones (a live-world cutscene): no spawning within this many metres of one. */
const KEEP_OUT_SPAWN_PAD = 14;
/** Pure pursuit: aim at the lane line this far ahead (grows with speed). */
const LOOK_MIN = 5;
const LOOK_MAX = 12;
/** Giving way to crossing traffic: paths meeting within this many seconds, between cars crossing at ~35 to ~145 degrees. */
const YIELD_SECONDS = 1.6;
/** A wedged driver backs out no faster than this (m/s). */
const REVERSE_SPEED = 3;
/** Edging round a stopped car while pulling out (m/s). */
const CREEP_SPEED = 2.5;
const CROSS_COS = 0.82;
/** Corner speed is the vehicle's turn rate times this radius, never above cruise. */
const CORNER_RADIUS = 4.5;
/** The viewer moved farther than this in one frame: a teleport (respawn, taxi, cutscene), refill traffic round the new spot. */
const TELEPORT = 120;
/** Seconds between population recounts (road length near the player changes slowly). */
const RECOUNT_SECONDS = 2;
/** A ghost this far past simRadius is moved somewhere hidden near the player. */
const SIM_SLACK = 1.08;
/** The odd rides (oddRides.ts): only spawned in town, where their crawl does not hold up a highway. */
const ODD_RIDES: readonly VehicleKind[] = ['pot-rod', 'lawn-roller', 'teacup-trundler', 'barrow-buggy'];
const TOWN_HALF = 200;
/** ?traffic=odd (demos): every new car in town is an odd ride. */
const ODD_ONLY = typeof location !== 'undefined' && new URLSearchParams(location.search).get('traffic') === 'odd';

const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
const between = (r: readonly [number, number]): number => r[0] + Math.random() * (r[1] - r[0]);
const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

/** Unit direction from a to b (falls back to +z for a zero-length segment). */
function segmentDir(a: RoadNode, b: RoadNode): { x: number; z: number } {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) return { x: 0, z: 1 };
  return { x: dx / len, z: dz / len };
}

/** Hidden from this viewer with room to spare: beyond hideDistance, or at least VIEW_MARGIN outside its view cone (and not close). */
const VIEW_MARGIN = 0.2;
function clearOfView(w: Viewer, x: number, z: number): boolean {
  const d = Math.hypot(x - w.x, z - w.z);
  if (d >= TRAFFIC.hideDistance) return true;
  if (d < TRAFFIC.nearHidden || (w.dirX === 0 && w.dirZ === 0)) return false;
  return ((x - w.x) * w.dirX + (z - w.z) * w.dirZ) / d < Math.cos(TRAFFIC.viewHalfAngle + VIEW_MARGIN);
}

/** Cruise and corner speeds of a vehicle model in traffic. */
function speedsOf(kind: VehicleKind): { cruise: number; corner: number } {
  const spec = VEHICLES[kind];
  const cruise = TRAFFIC.cruise * spec.maxSpeed;
  return { cruise, corner: Math.min(cruise, Math.max(5, spec.turnRate * CORNER_RADIUS)) };
}

/** What is in the way ahead of a driver: the nearest thing in its lane within braking range. */
/** `creep`: a stopped thing still ahead while pulling out round it, not close yet: edge on slowly while steering wide. */
interface Blocker { still: boolean; side: number; creep?: boolean }

export function createTraffic(scene: THREE.Scene, world: World, onToast?: (text: string) => void): Traffic {
  const drivers = new Map<number, Driver>();
  const nodeIndex = new Map<number, RoadNode>();
  for (const n of world.roads.nodes) nodeIndex.set(n.id, n);
  const errandWorld: ErrandWorld = { nodes: world.roads.nodes, placeNode: placeNodes(world.roads.nodes) };
  const seat = gnomeState(0, 0, 0, 0, 0, true);
  const offset = world.roads.laneOffset;
  const graph = simGraph(world.roads.nodes, offset);
  const impostors = createTrafficImpostors(scene);
  const impostorPoses: ImpostorPose[] = [];
  /** Every ambient car, near or far, and the real vehicle of each one that has been near (kept while it is far). */
  const ghosts: Ghost[] = [];
  const vehicleOf = new Map<number, Vehicle>();
  const ghostOf = new Map<number, Ghost>();
  let rivalryCooldown = 0;
  /** A live-world cutscene's clear zones (setKeepOut), and whether the ones inside still have to be moved out. */
  let keepOut: KeepOutZone[] | null = null;
  let purge = false;
  /** Where the viewer was last frame (null before the first update), the population to keep, and when to recount it. */
  let lastView: { x: number; z: number } | null = null;
  let target = 0;
  let recountT = 0;

  const nodeOf = (id: number): RoadNode | undefined => nodeIndex.get(id);

  /** A fresh driver on the segment from -> to, with an errand that starts at `to`. */
  function newDriver(v: Vehicle, from: number, to: number): Driver {
    const errand = freshErrand(errandWorld, v.kind, to, from);
    return driverFor(v, from, to, errand, errand && errand.path.length > 1 ? errand.path[1] : null);
  }

  function driverFor(v: Vehicle, from: number, to: number, errand: Errand | null, next: number | null): Driver {
    return {
      from, to, next, errand,
      patience: between(TRAFFIC.patience), blockedT: 0, passT: 0, passSide: -1, reverseT: 0, reverseSteer: 0,
      visiting: false, dwellT: 0, watchT: 0, watchX: v.x, watchZ: v.z, wedgedT: 0,
    };
  }

  /**
   * A driver on an existing vehicle with no route (or a wedged one re-routing): the nearest junction, driving on along the
   * link that points most the way the vehicle faces, so a re-route does not turn it round.
   */
  function driverFromHere(v: Vehicle): Driver | null {
    let best: RoadNode | undefined;
    let bestD = Infinity;
    for (const n of world.roads.nodes) {
      if (n.links.length === 0) continue;
      const dist = Math.hypot(n.x - v.x, n.z - v.z);
      if (dist < bestD) { bestD = dist; best = n; }
    }
    if (!best) return null;
    const fx = Math.sin(v.yaw);
    const fz = Math.cos(v.yaw);
    // Ahead of the vehicle already? Drive to it from the neighbour behind; else leave it along the best-facing link.
    const ahead = (best.x - v.x) * fx + (best.z - v.z) * fz > 2;
    let pickId = best.links[0];
    let pickDot = -Infinity;
    for (const l of best.links) {
      const m = nodeOf(l);
      if (!m) continue;
      const d = segmentDir(best, m);
      const dot = ahead ? -(d.x * fx + d.z * fz) : d.x * fx + d.z * fz;
      if (dot > pickDot) { pickDot = dot; pickId = l; }
    }
    return ahead ? newDriver(v, pickId, best.id) : newDriver(v, best.id, pickId);
  }

  /** The driver reached node `arrive` (the end of its segment): the next segment, along its errand when it has one. */
  function advance(v: Vehicle, d: Driver, arrive: RoadNode): void {
    const came = d.from;
    d.from = arrive.id;
    const leg = nextLeg(errandWorld, v.kind, d.errand, arrive.id, came);
    d.errand = leg.errand;
    d.to = leg.to;
    d.next = leg.next;
  }

  /** The nearest thing ahead in the lane that a driver must brake for, or null. `passing` ignores stopped vehicles. */
  function blockerAhead(v: Vehicle, vehicles: Vehicle[], onFoot: boolean, playerX: number, playerZ: number, passing: boolean): Blocker | null {
    const sinY = Math.sin(v.yaw);
    const cosY = Math.cos(v.yaw);
    let best: Blocker | null = null;
    let bestFwd = Infinity;
    const consider = (ox: number, oz: number, radius: number, along: number, still: boolean, parkedKerb = false): void => {
      const dx = ox - v.x;
      const dz = oz - v.z;
      const fwd = dx * sinY + dz * cosY;
      if (fwd <= 0 || fwd >= bestFwd) return;
      const side = -dx * cosY + dz * sinY;
      // Pulling out past a stopped car: go round it; while it is still dead ahead, edge on at a crawl (a touch, not a crash).
      if (passing && still && Math.abs(side) >= (v.spec.radius + radius) * 0.8) return;
      const sideLimit = parkedKerb ? v.spec.radius + radius * 0.45 : Math.min(BRAKE_SIDE, v.spec.radius + radius * 0.65);
      if (Math.abs(side) >= sideLimit) return;
      const gapAhead = TRAFFIC.stopDistance + v.spec.radius;
      if (fwd >= gapAhead) return;
      // Something moving away from us at least as fast as we go is not in our way.
      if (!still && along >= v.speed - 0.3 && fwd > v.spec.radius + radius + 1.5) return;
      bestFwd = fwd;
      best = { still, side, creep: passing && still };
    };
    // A player in a vehicle is that vehicle (below); on foot they are a gnome standing in the road.
    if (onFoot) consider(playerX, playerZ, 0.4, 0, true);
    for (const o of vehicles) {
      if (o === v) continue;
      const along = o.speed * (Math.sin(o.yaw) * sinY + Math.cos(o.yaw) * cosY);
      consider(o.x, o.z, o.spec.radius, along, Math.abs(o.speed) < STILL_SPEED, o.driver === 'none');
    }
    if (best || v.speed < 1) return best;
    // Crossing traffic (a junction, a car pulling out): give way when our paths meet within YIELD_SECONDS and the other car
    // is further into the crossing than we are. Without this, cars T-bone each other at every junction and drive on dented.
    for (const o of vehicles) {
      if (o === v || Math.abs(o.speed) < STILL_SPEED) continue;
      const ox = Math.sin(o.yaw);
      const oz = Math.cos(o.yaw);
      if (Math.abs(ox * sinY + oz * cosY) > CROSS_COS) continue; // same way or head-on: the lane checks handle those
      const px = o.x - v.x;
      const pz = o.z - v.z;
      const wx = ox * o.speed - sinY * v.speed;
      const wz = oz * o.speed - cosY * v.speed;
      const w2 = wx * wx + wz * wz;
      if (w2 < 1e-6) continue;
      const tc = -(px * wx + pz * wz) / w2;
      if (tc <= 0 || tc > YIELD_SECONDS) continue;
      const miss = Math.hypot(px + wx * tc, pz + wz * tc);
      if (miss > v.spec.radius + o.spec.radius + 0.6) continue;
      const usToThem = px * sinY + pz * cosY;
      const themToUs = -(px * ox + pz * oz);
      if (usToThem < themToUs || (usToThem === themToUs && v.id < o.id)) continue; // we are in first: they give way
      return { still: false, side: -px * cosY + pz * sinY };
    }
    return null;
  }

  /** Drive one NPC vehicle one frame. */
  function drive(v: Vehicle, d: Driver, dt: number, vehicles: Vehicle[], onFoot: boolean, playerX: number, playerZ: number): { recycle: boolean } {
    const fromNode = nodeOf(d.from);
    const toNode = nodeOf(d.to);
    if (!fromNode || !toNode) return { recycle: true };

    const dir = segmentDir(fromNode, toNode);
    const right = { x: -dir.z, z: dir.x };
    const len = Math.hypot(toNode.x - fromNode.x, toNode.z - fromNode.z);
    // Along the lane line: t is how far along from its start the vehicle is; the lane ends at len.
    const ax = fromNode.x + right.x * offset;
    const az = fromNode.z + right.z * offset;
    const t = (v.x - ax) * dir.x + (v.z - az) * dir.z;
    const remaining = len - t;

    // ---- Visiting: parked short of the junction until the visit is over, then on to the next errand --------------
    const lastLeg = d.errand !== null && d.errand.step === d.errand.path.length - 1;
    if (d.visiting) {
      d.dwellT -= dt;
      if (d.dwellT <= 0) {
        d.visiting = false;
        const next = freshErrand(errandWorld, v.kind, d.to, d.from);
        d.errand = next;
        d.next = next && next.path.length > 1 ? next.path[1] : null;
        d.watchT = 0;
        d.watchX = v.x;
        d.watchZ = v.z;
      }
      return finish(v, { throttle: v.speed > 0.3 ? -1 : 0, steer: 0, lift: 0 }, dt);
    }
    if (lastLeg && remaining <= PARK_DISTANCE) {
      if (Math.abs(v.speed) < 0.4) {
        d.visiting = true;
        d.dwellT = between(TRAFFIC.dwell);
        d.passT = 0;
        d.blockedT = 0;
      }
      return finish(v, { throttle: v.speed > 0 ? -1 : 0, steer: 0, lift: 0 }, dt);
    }

    // ---- Arrived at the end of the segment: on to the next one -------------------------------------------------------
    const endX = toNode.x + right.x * offset;
    const endZ = toNode.z + right.z * offset;
    if (Math.hypot(endX - v.x, endZ - v.z) < ARRIVE_DISTANCE || remaining < 0.5) {
      advance(v, d, toNode);
      if (!nodeOf(d.from) || !nodeOf(d.to)) return { recycle: true };
      return finish(v, { throttle: 0.2, steer: 0, lift: 0 }, dt);
    }

    // ---- Wedged? Back out ---------------------------------------------------------------------------------------------
    if (d.reverseT > 0) {
      d.reverseT -= dt;
      if (d.reverseT <= 0) {
        // Back out done: try again, pulling out wide of whatever was there.
        d.passT = PASS_SECONDS;
        d.passSide = Math.random() < 0.5 ? -1 : 1;
        d.watchT = 0;
        d.watchX = v.x;
        d.watchZ = v.z;
      }
      // Back out gently, and stop backing the moment something is right behind (no reversing into the car behind).
      const bx = -Math.sin(v.yaw);
      const bz = -Math.cos(v.yaw);
      const behind = vehicles.some((o) => {
        if (o === v) return false;
        const rx = o.x - v.x;
        const rz = o.z - v.z;
        const back = rx * bx + rz * bz;
        return back > 0 && back < v.spec.radius + o.spec.radius + 1.5 && Math.abs(-rx * bz + rz * bx) < v.spec.radius + o.spec.radius;
      });
      if (behind) d.reverseT = Math.min(d.reverseT, dt);
      const backThrottle = behind ? (v.speed < -0.3 ? 1 : 0) : v.speed < -REVERSE_SPEED ? 0 : -1;
      return finish(v, { throttle: backThrottle, steer: d.reverseSteer, lift: 0 }, dt);
    }

    // ---- A live cutscene's clear zone ahead: wait at its edge like traffic held at a closed road -------------------------
    if (keepOut && !inKeepOut(keepOut, v.x, v.z)) {
      const ahead = v.spec.radius + 3 + Math.max(0, v.speed) * 0.8;
      if (inKeepOut(keepOut, v.x + Math.sin(v.yaw) * ahead, v.z + Math.cos(v.yaw) * ahead)) {
        d.blockedT = 0;
        d.watchT = 0;
        d.watchX = v.x;
        d.watchZ = v.z;
        return finish(v, { throttle: v.speed > 0.3 ? -1 : 0, steer: 0, lift: 0 }, dt);
      }
    }

    // ---- What is ahead -----------------------------------------------------------------------------------------------
    const passing = d.passT > 0;
    if (passing) d.passT -= dt;
    const blocker = blockerAhead(v, vehicles, onFoot, playerX, playerZ, passing);
    if (blocker) {
      d.blockedT += dt;
      // Stopped behind a blocker past patience: pull out toward the road center to pass.
      if (d.blockedT > d.patience && Math.abs(v.speed) < STILL_SPEED + 1) {
        d.passT = PASS_SECONDS;
        d.passSide = blocker.side >= 0 ? -1 : 1;
        d.blockedT = 0;
      }
    } else {
      d.blockedT = 0;
    }

    // ---- Steering: pure pursuit on the lane line (shifted while pulling out) ----------------------------------------
    const look = clamp(LOOK_MIN + Math.abs(v.speed) * 0.4, LOOK_MIN, LOOK_MAX);
    const shift = d.passT > 0 ? d.passSide * PASS_SHIFT : 0;
    const aimAlong = Math.min(len, Math.max(t, 0) + look);
    const aimX = ax + dir.x * aimAlong + right.x * shift;
    const aimZ = az + dir.z * aimAlong + right.z * shift;
    const desired = Math.atan2(aimX - v.x, aimZ - v.z);
    const diff = angleDiff(desired, v.yaw);
    const steer = clamp(-diff * 2, -1, 1);

    // ---- Speed: cruise on the straight, corner speed into a turn --------------------------------------------------------
    const { cruise, corner } = speedsOf(v.kind);
    let target = cruise;
    const nextNode = d.next !== null ? nodeOf(d.next) : undefined;
    if (nextNode && remaining < 22) {
      const turn = Math.abs(angleDiff(Math.atan2(nextNode.x - toNode.x, nextNode.z - toNode.z), Math.atan2(dir.x, dir.z)));
      if (turn > 0.5) target = corner;
    }
    if (Math.abs(diff) > 0.6) target = Math.min(target, corner);
    if (passing) target = Math.min(target, 0.4 * v.spec.maxSpeed);

    let throttle = clamp((target - v.speed) * 0.8, -1, 1);
    if (blocker) throttle = blocker.creep ? clamp((CREEP_SPEED - v.speed) * 0.8, -1, 1) : v.speed > 0 ? -1 : 0;

    // ---- Progress watch: wedged on something? -------------------------------------------------------------------------
    // Waiting briefly behind a blocker is fine, but if blocked too long (> 4.5s) let wedgedT advance so we reverse/re-route.
    if (blocker && !passing && d.blockedT < 4.5) {
      d.watchT = 0;
      d.watchX = v.x;
      d.watchZ = v.z;
    } else {
      d.watchT += dt;
      if (d.watchT >= TRAFFIC.stuckSeconds) {
        if (Math.hypot(v.x - d.watchX, v.z - d.watchZ) < TRAFFIC.stuckDistance) {
          d.wedgedT += d.watchT;
          d.reverseT = TRAFFIC.reverseSeconds;
          d.reverseSteer = Math.random() < 0.5 ? -0.7 : 0.7;
          // Second failure running: forget the segment and aim for the nearest road again.
          if (d.wedgedT >= 2 * TRAFFIC.stuckSeconds) {
            const fresh = driverFromHere(v);
            if (fresh) {
              fresh.wedgedT = d.wedgedT;
              fresh.reverseT = d.reverseT;
              fresh.reverseSteer = d.reverseSteer;
              drivers.set(v.id, fresh);
              d = fresh;
            }
          }
        } else {
          d.wedgedT = 0;
        }
        d.watchT = 0;
        d.watchX = v.x;
        d.watchZ = v.z;
      }
    }
    if (d.wedgedT >= TRAFFIC.giveUpSeconds && Math.hypot(v.x - playerX, v.z - playerZ) > TRAFFIC.giveUpDistance) {
      return { recycle: true };
    }

    return finish(v, { throttle, steer, lift: 0 }, dt);
  }

  /** Step the vehicle with the controls and tick its rider. */
  function finish(v: Vehicle, c: { throttle: number; steer: number; lift: number }, dt: number): { recycle: boolean } {
    stepVehicle(v, c, dt, world);
    syncVehicleMesh(v, dt);
    if (v.rider) {
      const s = v.spec.seat;
      seat.position.set(s[0], s[1], s[2]);
      v.rider.update(seat, dt);
      poseHands(v.rider, v, 0, dt);
    }
    return { recycle: false };
  }

  // ---- Ghosts: the wide-area population ------------------------------------------------------------------------------

  /** Which model a new car at (x, z) is: the district and biome mix, at most one Snail-Coach, odd rides now and then in town. */
  function pickKind(x: number, z: number): VehicleKind {
    const hasBus = ghosts.some((g) => g.kind === 'snail-coach');
    if (!hasBus && Math.random() < 0.14) return 'snail-coach';
    const odd = ODD_ONLY ? 1 : TRAFFIC.oddRideChance;
    if (Math.abs(x) < TOWN_HALF && Math.abs(z) < TOWN_HALF && Math.random() < odd) return pick(ODD_RIDES);
    const dist = districtAt(x, z);
    const biome = typeof world.biomeAt === 'function' ? world.biomeAt(x, z) : biomeAt(x, z);
    if (dist === 'patio-heights' || dist === 'greenhouse') {
      const r = Math.random();
      return r < 0.25 ? 'lowrider' : r < 0.6 ? 'zero-turn' : pick(TRAFFIC.kinds);
    }
    if (biome === 'farmland') {
      const r = Math.random();
      return r < 0.2 ? 'combine' : r < 0.45 ? 'mulch-spreader' : pick(TRAFFIC.kinds);
    }
    if (dist === 'industrial') return Math.random() < 0.25 ? 'mulch-spreader' : pick(TRAFFIC.kinds);
    return pick(TRAFFIC.kinds);
  }

  /** Points new cars keep clear of: every car, near or far. */
  function occupied(vehicles: Vehicle[]): { x: number; z: number }[] {
    const out: { x: number; z: number }[] = [];
    for (const g of ghosts) if (!g.live) out.push(g);
    for (const v of vehicles) out.push(v);
    return out;
  }

  /** A road spot for a new or moved car: hidden from every viewer unless `anywhere` (behind a fade), clear of other cars. */
  function spotFor(px: number, pz: number, viewers: Viewer[], avoid: { x: number; z: number }[], anywhere: boolean): Spot | null {
    for (let i = 0; i < 2; i++) {
      const spot = pickSpot(graph, {
        x: px, z: pz,
        minDist: anywhere ? 25 : TRAFFIC.nearHidden, maxDist: TRAFFIC.simRadius,
        viewers: anywhere ? [] : viewers, avoid, clear: SPAWN_CLEAR,
      });
      if (!spot || inKeepOut(keepOut, spot.x, spot.z, KEEP_OUT_SPAWN_PAD)) continue;
      // A margin past the edge of view: the car drives on (and the camera turns) the moment it is placed.
      if (!anywhere && !viewers.every((w) => clearOfView(w, spot.x, spot.z))) continue;
      return spot;
    }
    return null;
  }

  /** A ghost starts over somewhere else: a new car, so its vehicle (if it has one) comes back repaired. */
  function respawn(g: Ghost, spot: Spot): void {
    placeGhost(graph, g, spot);
    const v = vehicleOf.get(g.id);
    if (v) {
      repairVehicle(v);
      v.knock = undefined;
    }
  }

  /** Bring a ghost near the player to life as a real vehicle (made the first time, reused after). */
  function materialize(g: Ghost, vehicles: Vehicle[]): void {
    let v = vehicleOf.get(g.id);
    if (!v) {
      v = createVehicle(scene, g.kind, g.x, g.z, g.yaw, g.tint);
      const look = typeof biomeLookFor === 'function' ? biomeLookFor(g.x, g.z) : randomTownLook();
      const m = createGnomeModel(look);
      v.object.add(m.object);
      v.rider = m;
      v.riderLook = look;
      vehicleOf.set(g.id, v);
      ghostOf.set(v.id, g);
    } else {
      scene.add(v.object);
    }
    v.driver = 'npc';
    v.x = g.x;
    v.z = g.z;
    v.y = heightAt(g.x, g.z);
    v.yaw = g.yaw;
    v.speed = g.speed;
    v.vy = 0;
    v.slideX = 0;
    v.slideZ = 0;
    v.knock = undefined;
    syncVehicleMesh(v, 0);
    vehicles.push(v);
    const d = driverFor(v, g.from, g.to, g.errand, g.next);
    if (g.dwellT > 0) { d.visiting = true; d.dwellT = g.dwellT; }
    drivers.set(v.id, d);
    g.live = true;
  }

  /** A live car left the near ring: back to a ghost where its driver is on the road, vehicle kept off-scene for later. */
  function dematerialize(g: Ghost, v: Vehicle, vehicles: Vehicle[]): void {
    const d = drivers.get(v.id);
    if (d) {
      g.from = d.from;
      g.to = d.to;
      g.next = d.next;
      g.errand = d.errand;
      g.dwellT = d.visiting ? Math.max(0, d.dwellT) : 0;
    }
    g.t = laneT(graph, g.from, g.to, v.x, v.z);
    g.speed = Math.max(0, v.speed);
    const p = lanePose(graph, g.from, g.to, g.t);
    g.x = p.x; g.z = p.z; g.yaw = p.yaw;
    g.rx = v.x; g.rz = v.z; g.ryaw = v.yaw;
    g.live = false;
    drivers.delete(v.id);
    const i = vehicles.indexOf(v);
    if (i >= 0) vehicles.splice(i, 1);
    scene.remove(v.object);
  }

  /** Forget a ghost for good (its vehicle was stolen, wrecked, taken by a quest, or it is surplus). */
  function dropGhost(g: Ghost, disposeVehicle: boolean): void {
    const i = ghosts.indexOf(g);
    if (i >= 0) ghosts.splice(i, 1);
    const v = vehicleOf.get(g.id);
    vehicleOf.delete(g.id);
    if (v) {
      ghostOf.delete(v.id);
      if (disposeVehicle) removeVehicle(scene, v);
    }
  }

  /** Take over an NPC road vehicle that is not a ghost (a convoy car that drove off): it becomes part of the population. */
  function adopt(v: Vehicle, d: Driver): Ghost {
    const { cruise, corner } = speedsOf(v.kind);
    const t = laneT(graph, d.from, d.to, v.x, v.z);
    const p = lanePose(graph, d.from, d.to, t);
    const g = createGhost(graph, { from: d.from, to: d.to, t, x: p.x, z: p.z, yaw: p.yaw }, v.kind, v.tint, cruise, corner);
    g.errand = d.errand;
    g.next = d.next;
    g.live = true;
    ghosts.push(g);
    vehicleOf.set(g.id, v);
    ghostOf.set(v.id, g);
    return g;
  }

  /** One frame of the wide-area population: counts, spawns, hidden moves, off-screen driving, and live <-> ghost swaps. */
  function updateGhosts(dt: number, vehicles: Vehicle[], px: number, pz: number, viewers: Viewer[]): void {
    const view = viewers[0];
    const teleported = lastView === null || Math.hypot(view.x - lastView.x, view.z - lastView.z) > TELEPORT;
    lastView = { x: view.x, z: view.z };

    // Release ghosts whose vehicle is no longer an ambient NPC: stolen, ejected, wrecked, taken by a quest, removed.
    const inWorld = new Set(vehicles);
    for (let i = ghosts.length - 1; i >= 0; i--) {
      const g = ghosts[i];
      if (!g.live) continue;
      const v = vehicleOf.get(g.id);
      if (!v || !inWorld.has(v) || v.driver !== 'npc' || v.questOwned || v.exploded) dropGhost(g, false);
    }

    // How many cars to keep round here (more in town, fewer out on the highways).
    recountT -= dt;
    if (recountT <= 0 || teleported) {
      recountT = RECOUNT_SECONDS;
      target = targetPopulation(graph, px, pz);
    }

    // Moved far (a teleport) or just started: start over round the new spot, anywhere (the screen is faded or just loaded).
    let moves = 0;
    let avoid = occupied(vehicles);
    for (const g of ghosts) {
      if (g.live) continue;
      const d = Math.hypot(g.x - px, g.z - pz);
      if (!teleported && d <= TRAFFIC.simRadius * SIM_SLACK) continue;
      if (!teleported && moves >= MAX_MOVES_PER_FRAME) break;
      const spot = spotFor(px, pz, viewers, avoid, teleported);
      if (!spot) continue;
      respawn(g, spot);
      avoid.push(spot);
      moves++;
    }

    // Fill up to the population (all at once on a teleport), or let a surplus car go where nobody sees it.
    const perFrame = teleported ? TRAFFIC.maxCars : MAX_SPAWNS_PER_FRAME;
    for (let s = 0; s < perFrame && ghosts.length < target; s++) {
      const spot = spotFor(px, pz, viewers, avoid, teleported);
      if (!spot) break;
      const kind = pickKind(spot.x, spot.z);
      const { cruise, corner } = speedsOf(kind);
      ghosts.push(createGhost(graph, spot, kind, pick(MOWER_TINTS), cruise, corner));
      avoid.push(spot);
    }
    if (ghosts.length > target + 4) {
      let far: Ghost | null = null;
      let farD = -1;
      for (const g of ghosts) {
        if (g.live || !hiddenFromAll(viewers, g.rx, g.rz)) continue;
        const d = Math.hypot(g.x - px, g.z - pz);
        if (d > farD) { farD = d; far = g; }
      }
      if (far) dropGhost(far, true);
    }

    // Live ghosts follow their vehicle (so off-screen cars queue behind them); then the off-screen ones drive.
    for (const g of ghosts) {
      if (!g.live) continue;
      const v = vehicleOf.get(g.id)!;
      const d = drivers.get(v.id);
      if (d) { g.from = d.from; g.to = d.to; g.t = laneT(graph, d.from, d.to, v.x, v.z); }
      g.x = v.x; g.z = v.z; g.yaw = v.yaw; g.speed = Math.max(0, v.speed);
    }
    stepGhosts(ghosts, dt, graph);

    // Live <-> ghost: far live cars go back to ghosts; the nearest ghosts in the ring come to life (up to maxLive).
    for (const g of ghosts) {
      if (!g.live) continue;
      const v = vehicleOf.get(g.id)!;
      if (Math.hypot(v.x - px, v.z - pz) > TRAFFIC.liveRadiusOut) dematerialize(g, v, vehicles);
    }
    let live = 0;
    for (const g of ghosts) if (g.live) live++;
    if (live < TRAFFIC.maxLive) {
      const near = ghosts
        .filter((g) => !g.live && Math.hypot(g.x - px, g.z - pz) < TRAFFIC.liveRadius && !inKeepOut(keepOut, g.x, g.z, 3))
        .sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
      let made = 0;
      for (const g of near) {
        if (live >= TRAFFIC.maxLive || (made >= MAX_MATERIALIZE_PER_FRAME && !teleported)) break;
        const r = VEHICLES[g.kind].radius;
        // Not on top of another vehicle (it waits as an impostor a moment longer).
        if (vehicles.some((o) => Math.hypot(o.x - g.x, o.z - g.z) < r + o.spec.radius + 0.5)) continue;
        materialize(g, vehicles);
        made++;
        live++;
      }
    }

    // Far cars as impostors (smoothed pose: they ease round corners).
    impostorPoses.length = 0;
    for (const g of ghosts) {
      if (g.live || Math.hypot(g.rx - view.x, g.rz - view.z) > TRAFFIC.hideDistance + 40) continue;
      impostorPoses.push({ kind: g.kind, tint: g.tint, x: g.rx, y: heightAt(g.rx, g.rz), z: g.rz, yaw: g.ryaw });
    }
    impostors.update(impostorPoses);
    avoid = [];
  }

  return {
    update(dtIn: number, vehicles: Vehicle[], _world: World, playerX: number, playerZ: number, view?: TrafficView) {
      // A negative step (a stale first frame) would brake cars up to silly speeds: never step backwards.
      const dt = Math.max(0, dtIn);
      const viewers: Viewer[] = [view ?? { x: playerX, z: playerZ, dirX: 0, dirZ: 0 }];

      // Forget drivers of vehicles that no longer have an NPC driver.
      const npcIds = new Set<number>();
      for (const v of vehicles) if (v.driver === 'npc' && !v.questOwned) npcIds.add(v.id);
      for (const id of drivers.keys()) if (!npcIds.has(id)) drivers.delete(id);

      // A live cutscene just started (behind its fade-in): move every car out of its clear zones.
      if (purge) {
        purge = false;
        const avoid = occupied(vehicles);
        for (const v of vehicles.slice()) {
          if (v.driver !== 'npc' || v.questOwned || !inKeepOut(keepOut, v.x, v.z, 3)) continue;
          let g = ghostOf.get(v.id);
          const d = drivers.get(v.id);
          if (!g && d && !v.spec.boat && !v.spec.flies) g = adopt(v, d);
          if (!g) continue;
          dematerialize(g, v, vehicles);
          const spot = spotFor(playerX, playerZ, viewers, avoid, true);
          if (spot) respawn(g, spot);
        }
        for (const g of ghosts) {
          if (g.live || !inKeepOut(keepOut, g.x, g.z, 3)) continue;
          const spot = spotFor(playerX, playerZ, viewers, avoid, true);
          if (spot) respawn(g, spot);
        }
      }

      updateGhosts(dt, vehicles, playerX, playerZ, viewers);

      // Buck-Iron vs. Razor-Back rivalry honk when a Ride-On and Zero-Turn pass close to each other near the player.
      rivalryCooldown = Math.max(0, rivalryCooldown - dt);
      if (onToast && rivalryCooldown <= 0) {
        outer: for (let i = 0; i < vehicles.length; i++) {
          const a = vehicles[i];
          if (a.kind !== 'ride-on' || a.driver !== 'npc') continue;
          if (Math.hypot(a.x - playerX, a.z - playerZ) > 45) continue;
          for (let j = 0; j < vehicles.length; j++) {
            const b = vehicles[j];
            if (b.kind !== 'zero-turn' || b.driver !== 'npc') continue;
            if (Math.hypot(a.x - b.x, a.z - b.z) <= 8) {
              rivalryCooldown = 20;
              onToast(
                Math.random() < 0.5
                  ? 'Buck-Iron driver: "Over-caffeinated blender!"'
                  : 'Razor-Back driver: "Out of the lane, grandpa tractor!"',
              );
              break outer;
            }
          }
        }
      }

      // Drive every NPC vehicle (excluding quest/event-owned vehicles).
      const recycle: Vehicle[] = [];
      const onFoot = !vehicles.some((o) => o.driver === 'player');
      for (const v of vehicles) {
        if (v.driver !== 'npc' || v.questOwned) continue;
        let d = drivers.get(v.id);
        if (!d) {
          const fresh = driverFromHere(v);
          if (!fresh) continue;
          d = fresh;
          drivers.set(v.id, d);
        }
        if (drive(v, d, dt, vehicles, onFoot, playerX, playerZ).recycle) recycle.push(v);
      }

      // Wedged for good: start over somewhere hidden, but only while nobody can see it go (a road vehicle that is not a
      // ghost yet, such as a convoy car, joins the population for that). Non-ghost road NPCs that drive out of the near
      // ring join the population too, so they keep driving off-screen instead of being lost.
      const avoid = occupied(vehicles);
      for (const v of vehicles.slice()) {
        if (v.driver !== 'npc' || v.questOwned || v.spec.boat || v.spec.flies) continue;
        const wedged = recycle.includes(v);
        const far = Math.hypot(v.x - playerX, v.z - playerZ) > TRAFFIC.liveRadiusOut;
        if (!wedged && !(far && !ghostOf.has(v.id))) continue;
        const d = drivers.get(v.id);
        let g = ghostOf.get(v.id);
        if (!g && d) g = adopt(v, d);
        if (!g) continue;
        if (wedged && !hiddenFromAll(viewers, v.x, v.z)) continue;
        dematerialize(g, v, vehicles);
        if (wedged) {
          const spot = spotFor(playerX, playerZ, viewers, avoid, false);
          if (spot) { respawn(g, spot); avoid.push(spot); }
        }
      }

      // Cleanup: too many vehicles, so drop the farthest abandoned one (never the Whirligig or quest vehicles).
      if (vehicles.length > MAX_VEHICLES) {
        let best = -1;
        let bestD = -1;
        for (let i = 0; i < vehicles.length; i++) {
          const v = vehicles[i];
          if (v.driver !== 'none' || v.kind === 'whirligig' || v.questOwned) continue;
          const dd = Math.hypot(v.x - playerX, v.z - playerZ);
          if (dd > CLEANUP_DISTANCE && dd > bestD) { bestD = dd; best = i; }
        }
        if (best >= 0) {
          const gone = vehicles[best];
          removeVehicle(scene, gone);
          vehicles.splice(best, 1);
          drivers.delete(gone.id);
        }
      }
    },

    setKeepOut(zones: readonly KeepOutZone[] | null) {
      keepOut = zones && zones.length > 0 ? zones.slice() : null;
      purge = keepOut !== null;
    },

    ejectDriver(v: Vehicle) {
      if (v.driver !== 'npc' || !v.rider || !v.riderLook) return null;
      const look = v.riderLook;
      const reason = errandReason(drivers.get(v.id)?.errand);
      clearHands(v.rider);
      v.object.remove(v.rider.object);
      v.rider = null;
      v.riderLook = null;
      v.driver = 'none';
      v.speed = 0;
      drivers.delete(v.id);
      // The car is the player's business now: it leaves the population (a new car takes its place out of sight).
      const g = ghostOf.get(v.id);
      if (g) dropGhost(g, false);
      return { ...exitPoint(v), look, reason };
    },

    spawnConvoy(routeNodes: number[], kinds: VehicleKind[], vehicles: Vehicle[]): Vehicle[] {
      const spawned: Vehicle[] = [];
      if (routeNodes.length < 2 || kinds.length === 0) return spawned;
      const from = nodeOf(routeNodes[0]);
      const to = nodeOf(routeNodes[1]);
      if (!from || !to) return spawned;
      const d = segmentDir(from, to);
      const yaw = Math.atan2(d.x, d.z);
      const place = PLACES[0];
      for (let i = 0; i < kinds.length; i++) {
        const back = i * 9;
        const x = from.x - d.z * offset - d.x * back;
        const z = from.z + d.x * offset - d.z * back;
        const v = createVehicle(scene, kinds[i], x, z, yaw, pick(MOWER_TINTS));
        v.driver = 'npc';
        const look = randomTownLook();
        const m = createGnomeModel(look);
        v.object.add(m.object);
        v.rider = m;
        v.riderLook = look;
        vehicles.push(v);
        const errand: Errand = { place, path: routeNodes.slice(), step: 1 };
        drivers.set(v.id, driverFor(v, from.id, to.id, errand, routeNodes[2] ?? null));
        syncVehicleMesh(v, 0);
        spawned.push(v);
      }
      return spawned;
    },

    debugGhosts() {
      return ghosts;
    },
  };
}

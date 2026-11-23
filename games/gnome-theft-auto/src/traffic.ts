// NPC-driven mowers on the roads. Every driver has an errand (errands.ts: a real place, a route along the road graph, a
// few seconds' visit, then the next place). They follow their lane with pure pursuit, hold a target speed (slower into
// corners), brake for the player and other vehicles, and never sit stuck: a driver blocked by something that is not
// moving pulls out around it, a wedged driver reverses and re-routes, and one wedged for good is moved somewhere new.
import type * as THREE from 'three';
import { createGnomeModel } from '@lawn/gnome';
import { angleDiff } from './collide';
import { MOWER_TINTS, PLACES, TRAFFIC, biomeAt } from './config';
import { districtAt } from './districts';
import { errandReason, pickBusErrand, pickErrand, placeNodes, type Errand, type ErrandWorld } from './errands';
import { biomeLookFor, gnomeState, randomTownLook } from './gnomes';
import { clearHands, poseHands } from './driverHands';
import { createVehicle, exitPoint, removeVehicle, stepVehicle, syncVehicleMesh } from './vehicles';
import type { RoadNode, Traffic, Vehicle, VehicleKind, World } from './types';
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

const SPAWN_MIN = 25;
const SPAWN_MAX = 90;
const SPAWN_CLEAR = 12;
const MAX_SPAWNS_PER_FRAME = 3;
const MAX_VEHICLES = 40;
const CLEANUP_DISTANCE = 60;
const ARRIVE_DISTANCE = 4;
const BRAKE_SIDE = 2.5;
const SPAWN_TRIES = 12;
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
/** Corner speed is the vehicle's turn rate times this radius, never above cruise. */
const CORNER_RADIUS = 4.5;

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

interface Spot { x: number; z: number; yaw: number; from: number; to: number }

/** Lane spot just past `from`, facing `to`. */
function placeOn(from: RoadNode, to: RoadNode, offset: number): Spot {
  const d = segmentDir(from, to);
  const ahead = Math.min(2, Math.hypot(to.x - from.x, to.z - from.z) / 2);
  return {
    x: from.x - d.z * offset + d.x * ahead,
    z: from.z + d.x * offset + d.z * ahead,
    yaw: Math.atan2(d.x, d.z),
    from: from.id,
    to: to.id,
  };
}

/** What is in the way ahead of a driver: the nearest thing in its lane within braking range. */
interface Blocker { still: boolean; side: number }

export function createTraffic(scene: THREE.Scene, world: World, onToast?: (text: string) => void): Traffic {
  const drivers = new Map<number, Driver>();
  const nodeIndex = new Map<number, RoadNode>();
  for (const n of world.roads.nodes) nodeIndex.set(n.id, n);
  const errandWorld: ErrandWorld = { nodes: world.roads.nodes, placeNode: placeNodes(world.roads.nodes) };
  const seat = gnomeState(0, 0, 0, 0, 0, true);
  const offset = world.roads.laneOffset;
  let rivalryCooldown = 0;
  /** A live-world cutscene's clear zones (setKeepOut), and whether the ones inside still have to be moved out. */
  let keepOut: KeepOutZone[] | null = null;
  let purge = false;

  const nodeOf = (id: number): RoadNode | undefined => nodeIndex.get(id);

  /** A road spot 25..90 units from the player (any node if none is that far), clear of other vehicles if asked. */
  function findSpot(px: number, pz: number, vehicles: Vehicle[], self: Vehicle | null, requireClear: boolean): Spot | null {
    const near: RoadNode[] = [];
    const any: RoadNode[] = [];
    for (const n of world.roads.nodes) {
      if (n.links.length === 0) continue;
      any.push(n);
      const dist = Math.hypot(n.x - px, n.z - pz);
      if (dist >= SPAWN_MIN && dist <= SPAWN_MAX) near.push(n);
    }
    const pool = near.length > 0 ? near : any;
    if (pool.length === 0) return null;
    for (let t = 0; t < SPAWN_TRIES; t++) {
      const from = pick(pool);
      const to = nodeOf(pick(from.links));
      if (!to) continue;
      const spot = placeOn(from, to, offset);
      if (requireClear && vehicles.some((o) => o !== self && Math.hypot(o.x - spot.x, o.z - spot.z) < SPAWN_CLEAR)) continue;
      if (inKeepOut(keepOut, spot.x, spot.z, KEEP_OUT_SPAWN_PAD)) continue;
      return spot;
    }
    return null;
  }

  /** A fresh driver on the segment from -> to, with an errand that starts at `to`. */
  function newDriver(v: Vehicle, from: number, to: number): Driver {
    const errand = v.kind === 'snail-coach'
      ? pickBusErrand(errandWorld, to, from)
      : pickErrand(errandWorld, v.kind, to, from);
    const d: Driver = {
      from, to, next: null, errand,
      patience: between(TRAFFIC.patience), blockedT: 0, passT: 0, passSide: -1, reverseT: 0, reverseSteer: 0,
      visiting: false, dwellT: 0, watchT: 0, watchX: v.x, watchZ: v.z, wedgedT: 0,
    };
    d.next = errand && errand.path.length > 1 ? errand.path[1] : null;
    return d;
  }

  /** A driver standing on an existing vehicle with no route: start on the nearest node's first link. */
  function driverFromHere(v: Vehicle): Driver | null {
    let best: RoadNode | undefined;
    let bestD = Infinity;
    for (const n of world.roads.nodes) {
      if (n.links.length === 0) continue;
      const dist = Math.hypot(n.x - v.x, n.z - v.z);
      if (dist < bestD) { bestD = dist; best = n; }
    }
    const to = best ? nodeOf(best.links[0]) : undefined;
    return best && to ? newDriver(v, best.id, to.id) : null;
  }

  function applySpot(v: Vehicle, spot: Spot): void {
    v.x = spot.x;
    v.z = spot.z;
    v.yaw = spot.yaw;
    v.speed = 0;
    drivers.set(v.id, newDriver(v, spot.from, spot.to));
    syncVehicleMesh(v, 0);
  }

  /** The driver reached node `arrive` (the end of its segment): the next segment, along its errand when it has one. */
  function advance(v: Vehicle, d: Driver, arrive: RoadNode): void {
    const came = d.from;
    d.from = arrive.id;
    const e = d.errand;
    if (e) {
      e.step++;
      if (e.step >= e.path.length) {
        // Arrived without a visit (a recycled or re-routed driver): look for the next errand from here.
        d.errand = v.kind === 'snail-coach'
          ? pickBusErrand(errandWorld, arrive.id, came)
          : pickErrand(errandWorld, v.kind, arrive.id, came);
        if (d.errand) d.errand.step = 1;
      }
    }
    const cur = d.errand;
    let to: number | undefined = cur ? cur.path[cur.step] : undefined;
    if (to === undefined) {
      const options = arrive.links.filter((l) => l !== came);
      to = options.length > 0 ? pick(options) : came;
      d.errand = null;
    }
    d.to = to;
    d.next = d.errand && d.errand.step + 1 < d.errand.path.length ? d.errand.path[d.errand.step + 1] : null;
  }

  /** The nearest thing ahead in the lane that a driver must brake for, or null. `passing` ignores stopped vehicles. */
  function blockerAhead(v: Vehicle, vehicles: Vehicle[], onFoot: boolean, playerX: number, playerZ: number, passing: boolean): Blocker | null {
    const sinY = Math.sin(v.yaw);
    const cosY = Math.cos(v.yaw);
    let best: Blocker | null = null;
    let bestFwd = Infinity;
    const consider = (ox: number, oz: number, radius: number, along: number, still: boolean, parkedKerb = false): void => {
      if (passing && still) return;
      const dx = ox - v.x;
      const dz = oz - v.z;
      const fwd = dx * sinY + dz * cosY;
      if (fwd <= 0 || fwd >= bestFwd) return;
      const side = -dx * cosY + dz * sinY;
      const sideLimit = parkedKerb ? v.spec.radius + radius * 0.45 : Math.min(BRAKE_SIDE, v.spec.radius + radius * 0.65);
      if (Math.abs(side) >= sideLimit) return;
      const gapAhead = TRAFFIC.stopDistance + v.spec.radius;
      if (fwd >= gapAhead) return;
      // Something moving away from us at least as fast as we go is not in our way.
      if (!still && along >= v.speed - 0.3 && fwd > v.spec.radius + radius + 1.5) return;
      bestFwd = fwd;
      best = { still, side };
    };
    // A player in a vehicle is that vehicle (below); on foot they are a gnome standing in the road.
    if (onFoot) consider(playerX, playerZ, 0.4, 0, true);
    for (const o of vehicles) {
      if (o === v) continue;
      const along = o.speed * (Math.sin(o.yaw) * sinY + Math.cos(o.yaw) * cosY);
      consider(o.x, o.z, o.spec.radius, along, Math.abs(o.speed) < STILL_SPEED, o.driver === 'none');
    }
    return best;
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
        const next = v.kind === 'snail-coach'
          ? pickBusErrand(errandWorld, d.to, d.from)
          : pickErrand(errandWorld, v.kind, d.to, d.from);
        if (next) {
          d.errand = next;
          d.next = next.path.length > 1 ? next.path[1] : null;
        } else {
          d.errand = null;
        }
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
      return finish(v, { throttle: -1, steer: d.reverseSteer, lift: 0 }, dt);
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
    const cruise = TRAFFIC.cruise * v.spec.maxSpeed;
    const corner = Math.min(cruise, Math.max(5, v.spec.turnRate * CORNER_RADIUS));
    let target = cruise;
    const nextNode = d.next !== null ? nodeOf(d.next) : undefined;
    if (nextNode && remaining < 22) {
      const turn = Math.abs(angleDiff(Math.atan2(nextNode.x - toNode.x, nextNode.z - toNode.z), Math.atan2(dir.x, dir.z)));
      if (turn > 0.5) target = corner;
    }
    if (Math.abs(diff) > 0.6) target = Math.min(target, corner);
    if (passing) target = Math.min(target, 0.4 * v.spec.maxSpeed);

    let throttle = clamp((target - v.speed) * 0.8, -1, 1);
    if (blocker) throttle = v.speed > 0 ? -1 : 0;

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

  return {
    update(dt: number, vehicles: Vehicle[], _world: World, playerX: number, playerZ: number) {
      // Forget drivers of vehicles that no longer have an NPC driver.
      const npcIds = new Set<number>();
      for (const v of vehicles) if (v.driver === 'npc' && !v.questOwned) npcIds.add(v.id);
      for (const id of drivers.keys()) if (!npcIds.has(id)) drivers.delete(id);

      // A live cutscene just started (behind its fade-in): move every NPC driver out of its clear zones.
      if (purge) {
        purge = false;
        for (const v of vehicles) {
          if (v.driver !== 'npc' || v.questOwned || !inKeepOut(keepOut, v.x, v.z, 3)) continue;
          const spot = findSpot(playerX, playerZ, vehicles, v, true) ?? findSpot(playerX, playerZ, vehicles, v, false);
          if (spot) applySpot(v, spot);
        }
      }

      // Spawn NPC drivers up to the count. Include at most 1 Snail-Coach bus in ambient city traffic.
      let npcCount = npcIds.size;
      let hasBus = vehicles.some((v) => v.driver === 'npc' && !v.questOwned && v.kind === 'snail-coach');
      for (let s = 0; s < MAX_SPAWNS_PER_FRAME && npcCount < TRAFFIC.count; s++) {
        const spot = findSpot(playerX, playerZ, vehicles, null, true);
        if (!spot) break;
        const dist = districtAt(spot.x, spot.z);
        const biome = typeof world.biomeAt === 'function' ? world.biomeAt(spot.x, spot.z) : biomeAt(spot.x, spot.z);
        let kind: VehicleKind;
        if (!hasBus && Math.random() < 0.14) {
          kind = 'snail-coach';
          hasBus = true;
        } else if (dist === 'patio-heights' || dist === 'greenhouse') {
          const r = Math.random();
          kind = r < 0.25 ? 'lowrider' : r < 0.6 ? 'zero-turn' : pick(TRAFFIC.kinds);
        } else if (biome === 'farmland') {
          const r = Math.random();
          kind = r < 0.2 ? 'combine' : r < 0.45 ? 'mulch-spreader' : pick(TRAFFIC.kinds);
        } else if (dist === 'industrial') {
          kind = Math.random() < 0.25 ? 'mulch-spreader' : pick(TRAFFIC.kinds);
        } else {
          kind = pick(TRAFFIC.kinds);
        }
        const v = createVehicle(scene, kind, spot.x, spot.z, spot.yaw, pick(MOWER_TINTS));
        v.driver = 'npc';
        const look = typeof biomeLookFor === 'function' ? biomeLookFor(spot.x, spot.z) : randomTownLook();
        const m = createGnomeModel(look);
        v.object.add(m.object);
        v.rider = m;
        v.riderLook = look;
        vehicles.push(v);
        drivers.set(v.id, newDriver(v, spot.from, spot.to));
        npcCount++;
      }

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

      // Recycle NPC drivers that fell far behind the player, or that are wedged for good: move them to a fresh road spot
      // near the player (never into view: a spot is 25+ units away, and wedged drivers are only moved from 40+ away).
      for (const v of vehicles) {
        if (v.driver !== 'npc' || v.questOwned) continue;
        if (!recycle.includes(v) && Math.hypot(v.x - playerX, v.z - playerZ) <= TRAFFIC.despawnDistance) continue;
        const spot = findSpot(playerX, playerZ, vehicles, v, true) ?? findSpot(playerX, playerZ, vehicles, v, false);
        if (spot) applySpot(v, spot);
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
        drivers.set(v.id, {
          from: from.id, to: to.id, next: routeNodes[2] ?? null, errand,
          patience: between(TRAFFIC.patience), blockedT: 0, passT: 0, passSide: -1, reverseT: 0, reverseSteer: 0,
          visiting: false, dwellT: 0, watchT: 0, watchX: x, watchZ: z, wedgedT: 0,
        });
        syncVehicleMesh(v, 0);
        spawned.push(v);
      }
      return spawned;
    },
  };
}

// NPC-driven mowers on the roads: spawn, drive along the road graph on the right-hand lane, brake for the player and
// other vehicles, recycle far-away drivers, and let the player pull a driver off.
import type * as THREE from 'three';
import { createGnomeModel } from '@lawn/gnome';
import { angleDiff } from './collide';
import { MOWER_TINTS, TRAFFIC } from './config';
import { gnomeState, randomTownLook } from './gnomes';
import { createVehicle, exitPoint, removeVehicle, stepVehicle, syncVehicleMesh } from './vehicles';
import type { RoadNode, Traffic, Vehicle, VehicleKind, World } from './types';

interface Route { from: number; to: number }

const SPAWN_MIN = 25;
const SPAWN_MAX = 90;
const SPAWN_CLEAR = 12;
const MAX_SPAWNS_PER_FRAME = 3;
const MAX_VEHICLES = 40;
const CLEANUP_DISTANCE = 60;
const ARRIVE_DISTANCE = 4;
const BRAKE_SIDE = 2.5;
const SPAWN_TRIES = 12;

const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

/** Unit direction from a to b (falls back to +z for a zero-length segment). */
function segmentDir(a: RoadNode, b: RoadNode): { x: number; z: number } {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) return { x: 0, z: 1 };
  return { x: dx / len, z: dz / len };
}

/** Lane point on the segment from -> to: the `to` node shifted to the right of the direction of travel. */
function laneTarget(from: RoadNode, to: RoadNode, offset: number): { x: number; z: number } {
  const d = segmentDir(from, to);
  return { x: to.x - d.z * offset, z: to.z + d.x * offset };
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

export function createTraffic(scene: THREE.Scene, world: World): Traffic {
  const routes = new Map<number, Route>();
  const nodeIndex = new Map<number, RoadNode>();
  for (const n of world.roads.nodes) nodeIndex.set(n.id, n);
  const seat = gnomeState(0, 0, 0, 0, 0, true);

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
      const spot = placeOn(from, to, world.roads.laneOffset);
      if (requireClear && vehicles.some((o) => o !== self && Math.hypot(o.x - spot.x, o.z - spot.z) < SPAWN_CLEAR)) continue;
      return spot;
    }
    return null;
  }

  /** Route for a driver standing on an existing vehicle with no route yet: head for the nearest node's first link. */
  function routeFromHere(v: Vehicle): Route | null {
    let best: RoadNode | undefined;
    let bestD = Infinity;
    for (const n of world.roads.nodes) {
      if (n.links.length === 0) continue;
      const d = Math.hypot(n.x - v.x, n.z - v.z);
      if (d < bestD) { bestD = d; best = n; }
    }
    const to = best ? nodeOf(best.links[0]) : undefined;
    return best && to ? { from: best.id, to: to.id } : null;
  }

  function applySpot(v: Vehicle, spot: Spot): void {
    v.x = spot.x;
    v.z = spot.z;
    v.yaw = spot.yaw;
    v.speed = 0;
    routes.set(v.id, { from: spot.from, to: spot.to });
    syncVehicleMesh(v, 0);
  }

  return {
    update(dt: number, vehicles: Vehicle[], _world: World, playerX: number, playerZ: number) {
      // Forget routes of vehicles that no longer have an NPC driver.
      const npcIds = new Set<number>();
      for (const v of vehicles) if (v.driver === 'npc') npcIds.add(v.id);
      for (const id of routes.keys()) if (!npcIds.has(id)) routes.delete(id);

      // Spawn NPC drivers up to the count.
      let npcCount = npcIds.size;
      for (let s = 0; s < MAX_SPAWNS_PER_FRAME && npcCount < TRAFFIC.count; s++) {
        const spot = findSpot(playerX, playerZ, vehicles, null, true);
        if (!spot) break;
        const kind: VehicleKind = pick(TRAFFIC.kinds);
        const v = createVehicle(scene, kind, spot.x, spot.z, spot.yaw, pick(MOWER_TINTS));
        v.driver = 'npc';
        const look = randomTownLook();
        const m = createGnomeModel(look);
        v.object.add(m.object);
        v.rider = m;
        v.riderLook = look;
        vehicles.push(v);
        routes.set(v.id, { from: spot.from, to: spot.to });
        npcCount++;
      }

      // Drive every NPC vehicle.
      for (const v of vehicles) {
        if (v.driver !== 'npc') continue;
        let r = routes.get(v.id);
        if (!r) {
          const fresh = routeFromHere(v);
          if (!fresh) continue;
          r = fresh;
          routes.set(v.id, r);
        }
        let from = nodeOf(r.from);
        let to = nodeOf(r.to);
        if (!from || !to) {
          const fresh = routeFromHere(v);
          if (!fresh) continue;
          routes.set(v.id, fresh);
          from = nodeOf(fresh.from);
          to = nodeOf(fresh.to);
          if (!from || !to) continue;
          r = fresh;
        }

        // Arrived at the target node: pick the next link, never the one we came from unless it is the only one.
        let lane = laneTarget(from, to, world.roads.laneOffset);
        if (Math.hypot(lane.x - v.x, lane.z - v.z) < ARRIVE_DISTANCE) {
          const came = r.from;
          const arrive = to;
          const options = arrive.links.filter((l) => l !== came);
          const next = options.length > 0 ? pick(options) : came;
          r.from = arrive.id;
          r.to = next;
          from = arrive;
          to = nodeOf(next) ?? arrive;
          lane = laneTarget(from, to, world.roads.laneOffset);
        }

        const desired = Math.atan2(lane.x - v.x, lane.z - v.z);
        const diff = angleDiff(desired, v.yaw);
        const steer = Math.max(-1, Math.min(1, -diff * 2));

        // Brake for the player or any other vehicle just ahead in our lane.
        const sinY = Math.sin(v.yaw);
        const cosY = Math.cos(v.yaw);
        const ahead = (ox: number, oz: number): boolean => {
          const dx = ox - v.x;
          const dz = oz - v.z;
          const fwd = dx * sinY + dz * cosY;
          if (fwd <= 0) return false;
          const side = -dx * cosY + dz * sinY;
          if (Math.abs(side) >= BRAKE_SIDE) return false;
          return fwd < TRAFFIC.stopDistance + v.spec.radius;
        };
        let braking = ahead(playerX, playerZ);
        for (let i = 0; !braking && i < vehicles.length; i++) {
          const o = vehicles[i];
          if (o === v) continue;
          if (ahead(o.x, o.z)) braking = true;
        }

        let throttle: number;
        if (braking) throttle = v.speed > 0 ? -1 : 0;
        else throttle = Math.abs(diff) > 0.6 ? 0.3 : TRAFFIC.cruise;

        stepVehicle(v, { throttle, steer, lift: 0 }, dt, world);
        syncVehicleMesh(v, dt);

        if (v.rider) {
          const s = v.spec.seat;
          seat.position.set(s[0], s[1], s[2]);
          v.rider.update(seat, dt);
        }
      }

      // Recycle NPC drivers that fell far behind the player: move them to a fresh road spot near the player.
      for (const v of vehicles) {
        if (v.driver !== 'npc') continue;
        if (Math.hypot(v.x - playerX, v.z - playerZ) <= TRAFFIC.despawnDistance) continue;
        const spot = findSpot(playerX, playerZ, vehicles, v, true) ?? findSpot(playerX, playerZ, vehicles, v, false);
        if (spot) applySpot(v, spot);
      }

      // Cleanup: too many vehicles, so drop the farthest abandoned one (never the Whirligig).
      if (vehicles.length > MAX_VEHICLES) {
        let best = -1;
        let bestD = -1;
        for (let i = 0; i < vehicles.length; i++) {
          const v = vehicles[i];
          if (v.driver !== 'none' || v.kind === 'whirligig') continue;
          const d = Math.hypot(v.x - playerX, v.z - playerZ);
          if (d > CLEANUP_DISTANCE && d > bestD) { bestD = d; best = i; }
        }
        if (best >= 0) {
          const gone = vehicles[best];
          removeVehicle(scene, gone);
          vehicles.splice(best, 1);
          routes.delete(gone.id);
        }
      }
    },

    ejectDriver(v: Vehicle) {
      if (v.driver !== 'npc' || !v.rider || !v.riderLook) return null;
      const look = v.riderLook;
      v.object.remove(v.rider.object);
      v.rider = null;
      v.riderLook = null;
      v.driver = 'none';
      v.speed = 0;
      routes.delete(v.id);
      return { ...exitPoint(v), look };
    },
  };
}

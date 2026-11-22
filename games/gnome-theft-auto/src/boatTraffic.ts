// NPC boats and the Hat Watch on water (Wild World Epic 4). The ferry, the dinghy and the gravy boat sail their routes;
// at Hat Watch heat WATER.patrolHats or more, while the player is in a boat, an HOA Patrol Boat chases them down.
import type * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import { WATER, VEHICLES } from './config';
import { angleDiff } from './collide';
import { BODIES, ISLANDS, shorePoint } from './water';
import { waterAt } from './terrain';
import { createVehicle, removeVehicle, stepVehicle } from './vehicles';
import type { Player, Vehicle, VehicleKind, World } from './types';

export interface BoatTraffic {
  /** The NPC and patrol boats this module made (they are also in the shared `vehicles` list). */
  readonly boats: readonly Vehicle[];
  /** Drive the NPC boats; at `hats` >= WATER.patrolHats while the player is in a boat, an HOA patrol boat joins in. */
  update(dt: number, player: Player, hats: number): void;
}

const PATROL_KIND: VehicleKind = 'hoa-patrol-boat';
/** NPC boats stop being driven farther than this from the player. */
const ACTIVE_RANGE = 450;
/** A waypoint counts as reached inside this distance (m). */
const WAYPOINT_RANGE = 12;
/** The patrol slows to this throttle once it is this close to the player. */
const RAM_RANGE = 6;
const PATROL_LEAVE_T = 20;
const PATROL_DEPART_RANGE = 120;
/** Depth (m) a patrol boat needs under its spawn point. */
const SPAWN_DEPTH = 1.2;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Loop points closer than this many island radii to an island are moved to this distance, on the loch-centre side. */
const ISLAND_CLEAR = 1.9;

/**
 * `count` points on the body's shore pulled in toward its centre by `scale` (a loop route on the water). A point near an
 * island (Tessie's, in Loch Moss) is moved off it toward the body's centre, so the route stays in deep water.
 */
export function loopRoute(bodyId: string, scale: number, count: number): { x: number; z: number }[] {
  const b = BODIES.find((w) => w.id === bodyId);
  if (!b) throw new Error(`loopRoute: no water body ${bodyId}`);
  const pts: { x: number; z: number }[] = [];
  for (let i = 0; i < count; i++) {
    const p = shorePoint(b, (2 * Math.PI * i) / count);
    let x = b.cx + (p.x - b.cx) * scale, z = b.cz + (p.z - b.cz) * scale;
    for (const isl of ISLANDS) {
      const clear = isl.r * ISLAND_CLEAR;
      if (Math.hypot(x - isl.x, z - isl.z) >= clear) continue;
      const ux = b.cx - isl.x, uz = b.cz - isl.z, ul = Math.hypot(ux, uz) || 1;
      x = isl.x + (ux / ul) * clear;
      z = isl.z + (uz / ul) * clear;
    }
    pts.push({ x, z });
  }
  return pts;
}

/** The steer (-1..1) that turns the boat toward (tx, tz). +1 turns right (lowers yaw). */
export function steerToward(v: { x: number; z: number; yaw: number }, tx: number, tz: number): number {
  const heading = Math.atan2(tx - v.x, tz - v.z);
  return clamp(-angleDiff(heading, v.yaw) * 1.5, -1, 1);
}

/** A spot in the water 40 m (then 60 m) from (px, pz), facing it; null when no ring point is deep enough. */
export function patrolSpawn(px: number, pz: number): { x: number; z: number; yaw: number } | null {
  for (const r of [40, 60]) {
    for (let i = 0; i < 16; i++) {
      const ang = (2 * Math.PI * i) / 16;
      const x = px + Math.cos(ang) * r;
      const z = pz + Math.sin(ang) * r;
      const hit = waterAt(x, z);
      if (hit && hit.depth >= SPAWN_DEPTH) return { x, z, yaw: Math.atan2(px - x, pz - z) };
    }
  }
  return null;
}

interface NpcRoute {
  kind: VehicleKind;
  route: { x: number; z: number }[];
  throttle: number;
  /** The boat once created (null until its prefab has loaded). */
  vehicle: Vehicle | null;
  wp: number;
}

export function createBoatTraffic(scene: THREE.Scene, vehicles: Vehicle[], world: World): BoatTraffic {
  const boats: Vehicle[] = [];
  const routes: NpcRoute[] = [
    { kind: 'watering-can-steamer', route: loopRoute('water/loch-moss', 0.6, 8), throttle: 0.8, vehicle: null, wp: 1 },
    { kind: 'gravy-boat', route: loopRoute('water/puddle-sea', 0.55, 6), throttle: 0.6, vehicle: null, wp: 1 },
    { kind: 'walnut-dinghy', route: [{ x: -180, z: 230 }, { x: -110, z: 230 }], throttle: 0.6, vehicle: null, wp: 1 },
  ];
  let patrol: Vehicle | null = null;
  let patrolLowT = 0;
  let outOfBoatT = 0;

  const register = (v: Vehicle): void => {
    v.driver = 'npc';
    v.questOwned = true;
    vehicles.push(v);
    boats.push(v);
  };
  const unregister = (v: Vehicle): void => {
    const i = vehicles.indexOf(v);
    if (i >= 0) vehicles.splice(i, 1);
    const j = boats.indexOf(v);
    if (j >= 0) boats.splice(j, 1);
  };

  /** Make each NPC boat once its prefab has loaded (the prefabs load after the world is built). */
  const makeRoutes = (): void => {
    for (const r of routes) {
      if (r.vehicle || !getPrefab(VEHICLES[r.kind].prefab)) continue;
      const start = r.route[0];
      const next = r.route[1 % r.route.length];
      const v = createVehicle(scene, r.kind, start.x, start.z, Math.atan2(next.x - start.x, next.z - start.z));
      register(v);
      r.vehicle = v;
    }
  };

  const driveRoutes = (dt: number, player: Player): void => {
    for (const r of routes) {
      const v = r.vehicle;
      // Skip a wreck, and a boat the player has taken.
      if (!v || v.exploded || v.driver !== 'npc') continue;
      if (Math.hypot(v.x - player.x, v.z - player.z) > ACTIVE_RANGE) continue;
      let wp = r.route[r.wp];
      if (Math.hypot(wp.x - v.x, wp.z - v.z) < WAYPOINT_RANGE) {
        r.wp = (r.wp + 1) % r.route.length;
        wp = r.route[r.wp];
      }
      const steer = steerToward(v, wp.x, wp.z);
      stepVehicle(v, { throttle: r.throttle, steer, lift: 0 }, dt, world);
    }
  };

  const updatePatrol = (dt: number, player: Player, hats: number): void => {
    const inBoat = !!player.vehicle?.spec.boat;
    if (!patrol && hats >= WATER.patrolHats && inBoat && getPrefab(VEHICLES[PATROL_KIND].prefab)) {
      const spot = patrolSpawn(player.x, player.z);
      if (spot) {
        patrol = createVehicle(scene, PATROL_KIND, spot.x, spot.z, spot.yaw);
        register(patrol);
        patrolLowT = 0;
        outOfBoatT = 0;
      }
    }
    if (!patrol) return;

    const v = patrol;
    const d = Math.hypot(v.x - player.x, v.z - player.z);
    if (!v.exploded) {
      const throttle = d < RAM_RANGE ? 0.4 : 1;
      const steer = steerToward(v, player.x, player.z);
      stepVehicle(v, { throttle, steer, lift: 0 }, dt, world);
    }

    patrolLowT = hats < WATER.patrolHats ? patrolLowT + dt : 0;
    outOfBoatT = inBoat ? 0 : outOfBoatT + dt;
    const gaveUp = patrolLowT >= PATROL_LEAVE_T;
    const lostPlayer = outOfBoatT >= PATROL_LEAVE_T && d > PATROL_DEPART_RANGE;
    if (gaveUp || lostPlayer) {
      removeVehicle(scene, v);
      unregister(v);
      patrol = null;
    }
  };

  return {
    boats,
    update(dt: number, player: Player, hats: number): void {
      makeRoutes();
      driveRoutes(dt, player);
      updatePatrol(dt, player, hats);
    },
  };
}

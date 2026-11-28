// NPC boats and the Hat Watch on water (Wild World Epic 4). The ferry, the dinghy and the gravy boat sail their routes;
// at Hat Watch heat WATER.patrolHats or more, while the player is in a boat, an HOA Patrol Boat chases them down.
import type * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { WATER, VEHICLES } from './config';
import { angleDiff } from './collide';
import { BODIES, ISLANDS, courseProfile, shorePoint } from './water';
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
/** A waterway boat that moves less than STUCK_DIST (m) in STUCK_T (s) while driven skips to its next waypoint. */
const STUCK_DIST = 2;
const STUCK_T = 6;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** The sightseeing loop offshore of the boardwalk (E11): clear of the slalom (z ~1300) and the ship. */
export const SEA_LOOP: { x: number; z: number }[] = [
  { x: -600, z: 1450 }, { x: -200, z: 1380 }, { x: 400, z: 1420 }, { x: 900, z: 1480 }, { x: 400, z: 1560 }, { x: -300, z: 1560 },
];

/** Where the Saltcut clog cruiser ends: out past the Long Spoon Pier and the Bathtub Queen's hull (A12), not off her bow. */
export const SALTCUT_END = { x: 450, z: 1330 };

/** The fishing smack: one slow silhouette working along the far horizon line (A12). */
const SMACK_Z = 1560;
const SMACK_X_MIN = -1300;
const SMACK_X_MAX = 1300;
const SMACK_SPEED = 2.5;
const SMACK_TURN_T = 10;
/** Scale of the `fishing-smack` prefab in this game, and its waterline (local y) at scale 1. */
const SMACK_SCALE = 6;
const SMACK_WATERLINE = 0.15;
const SMACK_BOB = 0.25;
const SMACK_ROLL = 0.04;
const SMACK_LEG_T = (SMACK_X_MAX - SMACK_X_MIN) / SMACK_SPEED;
/** One leg (east or west) plus the turn at its end. A full cycle is two of these. */
const SMACK_HALF_T = SMACK_LEG_T + SMACK_TURN_T;
const SMACK_PERIOD_T = 2 * SMACK_HALF_T;

/** Heading yaw for east (+x) and west (-x): bow is +z, so east is PI/2. */
const YAW_EAST = Math.PI / 2;
const YAW_WEST = -Math.PI / 2;

/**
 * The fishing smack's pose at elapsed time `t` (s), written into `out`. It sails east along z = 1560 from x -1300 to 1300
 * at 2.5 m/s, turns round over 10 s at each end (yaw eases through north or south), and repeats. Pure and deterministic.
 */
export function smackPoseInto(t: number, out: { x: number; z: number; yaw: number }): { x: number; z: number; yaw: number } {
  const p = ((t % SMACK_PERIOD_T) + SMACK_PERIOD_T) % SMACK_PERIOD_T;
  const east = p < SMACK_HALF_T;
  const q = east ? p : p - SMACK_HALF_T;
  const from = east ? YAW_EAST : YAW_WEST;
  const startX = east ? SMACK_X_MIN : SMACK_X_MAX;
  const endX = east ? SMACK_X_MAX : SMACK_X_MIN;
  out.z = SMACK_Z;
  if (q < SMACK_LEG_T) {
    out.x = startX + (east ? 1 : -1) * SMACK_SPEED * q;
    out.yaw = from;
  } else {
    // Turning at the far end: hold position and ease the heading round through a half-turn (ends on the opposite heading).
    const u = Math.min(1, (q - SMACK_LEG_T) / SMACK_TURN_T);
    const e = u * u * (3 - 2 * u);
    out.x = endX;
    out.yaw = from + (east ? Math.PI : -Math.PI) * e;
  }
  return out;
}

/** The fishing smack's pose at elapsed time `t` (s). */
export function smackPose(t: number): { x: number; z: number; yaw: number } {
  return smackPoseInto(t, { x: 0, z: 0, yaw: 0 });
}

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

/**
 * The centre line of the given water courses, in order (downstream if listed upstream first): every `every`-th sample
 * of each course, always including its last sample. Optional `from` and `to` points bracket it. [] if any course is
 * missing (the dry world).
 */
export function waterwayRoute(
  courses: readonly string[],
  opts: { from?: { x: number; z: number }; to?: { x: number; z: number }; every?: number } = {},
): { x: number; z: number }[] {
  const every = Math.max(1, Math.round(opts.every ?? 10));
  const profiles = courses.map((id) => courseProfile(id));
  if (profiles.some((p) => !p)) return [];
  const pts: { x: number; z: number }[] = [];
  if (opts.from) pts.push({ x: opts.from.x, z: opts.from.z });
  for (const p of profiles) {
    if (!p) continue;
    const last = p.s.length - 1;
    for (let k = 0; k <= last; k += every) pts.push({ x: p.x[k], z: p.z[k] });
    if (last >= 0 && last % every !== 0) pts.push({ x: p.x[last], z: p.z[last] });
  }
  if (opts.to) pts.push({ x: opts.to.x, z: opts.to.z });
  return pts;
}

/** `pts` followed by its reverse, without repeating the two ends: [a, b, c] -> [a, b, c, b] (a looped index walks there and back). */
export function pingPong<T>(pts: readonly T[]): T[] {
  if (pts.length < 3) return [...pts];
  return [...pts, ...pts.slice(1, -1).reverse()];
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
  /** A waterway route (the stuck check applies). */
  waterway: boolean;
  /** Stuck check (waterway routes): where the boat was and how long it has stayed near there. */
  stuckAt: { x: number; z: number } | null;
  stuckT: number;
}

function npcRoute(kind: VehicleKind, route: { x: number; z: number }[], throttle: number, waterway = false): NpcRoute {
  return { kind, route, throttle, vehicle: null, wp: 1, waterway, stuckAt: null, stuckT: 0 };
}

export function createBoatTraffic(scene: THREE.Scene, vehicles: Vehicle[], world: World): BoatTraffic {
  const boats: Vehicle[] = [];
  // The chain of water from the loch to the sea (ravine river, canal, farm river), walked there and back.
  const chain = ['river-ravine', 'canal', 'river-farm'];
  const lochToSea = waterwayRoute(chain, { from: { x: -680, z: -640 }, to: { x: 660, z: 820 } });
  const seaToLoch = [...lochToSea].reverse();
  const upper = waterwayRoute(['river-upper'], { to: { x: -640, z: -650 } });
  const allRoutes: NpcRoute[] = [
    npcRoute('watering-can-steamer', loopRoute('water/loch-moss', 0.6, 8), 0.8),
    npcRoute('gravy-boat', loopRoute('water/puddle-sea', 0.55, 6), 0.6),
    npcRoute('walnut-dinghy', [{ x: -180, z: 230 }, { x: -110, z: 230 }], 0.6),
    npcRoute('clog-cruiser', pingPong(lochToSea), 0.7, true),
    npcRoute('walnut-dinghy', pingPong(seaToLoch), 0.6, true),
    npcRoute('walnut-dinghy', pingPong(upper).reverse(), 0.5, true),
    npcRoute('clog-cruiser', pingPong(waterwayRoute(['saltcut'], { from: { x: 690, z: 860 }, to: SALTCUT_END })), 0.6, true),
    npcRoute('gravy-boat', SEA_LOOP, 0.7),
    // E31: far-out sea line, a fishing loop off Dunelow, the Thymes river run (small boats under its low bridges),
    // and slow loops on the High Tarn and in the Pardonlin basin.
    npcRoute('clog-cruiser', pingPong([{ x: -1500, z: 1450 }, { x: 0, z: 1450 }, { x: 1500, z: 1450 }]), 0.6),
    npcRoute('walnut-dinghy', [{ x: -500, z: 1350 }, { x: -542, z: 1407 }, { x: -609, z: 1385 }, { x: -609, z: 1315 }, { x: -542, z: 1293 }], 0.5),
    npcRoute('walnut-dinghy', pingPong(waterwayRoute(['thymes'], { every: 5 }).filter((p) => p.z >= -600 && p.z <= 900)), 0.5, true),
    npcRoute('walnut-dinghy', loopRoute('water/high-tarn', 0.5, 6), 0.3),
    npcRoute('gravy-boat', loopRoute('water/pardonlin-basin', 0.5, 6), 0.4),
  ];
  // A route with no water to follow (the dry world) is skipped.
  const routes = allRoutes.filter((r) => r.route.length > 0);
  let patrol: Vehicle | null = null;
  let patrolLowT = 0;
  let outOfBoatT = 0;
  // The fishing smack: a scenery prop (not a vehicle), built once its prefab has loaded.
  let smack: THREE.Group | null = null;
  let smackT = 0;
  const smackPoseScratch = { x: 0, z: 0, yaw: 0 };

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
      if (Math.hypot(v.x - player.x, v.z - player.z) > ACTIVE_RANGE) {
        r.stuckAt = null;
        r.stuckT = 0;
        continue;
      }
      let wp = r.route[r.wp];
      if (Math.hypot(wp.x - v.x, wp.z - v.z) < WAYPOINT_RANGE) {
        r.wp = (r.wp + 1) % r.route.length;
        wp = r.route[r.wp];
      }
      if (r.waterway) {
        // A waterway boat stuck on a bank (no real progress for STUCK_T s) gives up on this waypoint.
        if (!r.stuckAt || Math.hypot(v.x - r.stuckAt.x, v.z - r.stuckAt.z) >= STUCK_DIST) {
          r.stuckAt = { x: v.x, z: v.z };
          r.stuckT = 0;
        } else {
          r.stuckT += dt;
          if (r.stuckT >= STUCK_T) {
            r.wp = (r.wp + 1) % r.route.length;
            wp = r.route[r.wp];
            r.stuckAt = null;
            r.stuckT = 0;
          }
        }
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

  /** Build the smack once its prefab has loaded, then sail it along the far line (one object, no per-frame allocation). */
  const driveSmack = (dt: number): void => {
    smackT += dt;
    if (!smack) {
      if (!getPrefab('fishing-smack')) return;
      smack = buildPrefab('fishing-smack', { lights: false, scale: SMACK_SCALE });
      smack.rotation.order = 'YXZ';
      scene.add(smack);
    }
    const p = smackPoseInto(smackT, smackPoseScratch);
    const surface = waterAt(p.x, p.z)?.surface ?? 0;
    const bob = Math.sin(smackT * 0.9) * SMACK_BOB;
    smack.position.set(p.x, surface - SMACK_WATERLINE * SMACK_SCALE + bob, p.z);
    smack.rotation.y = p.yaw;
    smack.rotation.z = Math.sin(smackT * 0.7) * SMACK_ROLL;
  };

  return {
    boats,
    update(dt: number, player: Player, hats: number): void {
      makeRoutes();
      driveRoutes(dt, player);
      updatePatrol(dt, player, hats);
      driveSmack(dt);
    },
  };
}

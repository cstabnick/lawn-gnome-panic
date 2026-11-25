// The Hat Watch (heat, officers, pursuit mowers), 4-Hat HOA Code-Enforcement Van, faction squads, and the Spade Guard
// (Fort Sandpit). Officers chase and shoot when heat is 1+; guards defend the base.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { createGnomeModel, type PlayerState } from '@lawn/gnome';
import { buildHeld } from '@lawn/prefabs';
import { HEAT, MAX_HEAT, WATCH } from './config';
import { clearGunArms, muzzleWorld, placeInHand, poseGunArms } from './gunHold';
import { angleDiff, clampToWorld, pushOutOfBoxes } from './collide';
import { isPlayerHidden } from './critters';
import { groundAt, heightAt } from './terrain';
import { nodeY } from './highways/roads';
import { runOverHit } from './runOver';
import { clearHandsUp, gnomeState, makeGnome, poseHandsUp, randomGnomeName, randomTownLook } from './gnomes';
import { createRagdoll, impulse, poseRagdoll, ragdollCentre, resetPose, stepRagdoll, type Ragdoll } from './ragdoll';
import { createVehicle, exitPoint, removeVehicle, stepVehicle, syncVehicleMesh } from './vehicles';
import type { Box, Fx, Npc, RoadNode, Vehicle, VehicleKind, Watch, WatchContext, WatchSearch, World } from './types';

/** Body radius for collisions with boxes and the world edge. */
const BODY_R = 0.4;

/** Road nodes within [minD, maxD] of (x, z) that sit at height y (within 3 m): the level a pursuit or roadblock uses. */
export function levelNodes(nodes: RoadNode[], x: number, z: number, y: number, minD: number, maxD: number): RoadNode[] {
  return nodes.filter((n) => {
    const d = Math.hypot(n.x - x, n.z - z);
    return d >= minD && d <= maxD && Math.abs(nodeY(n) - y) < 3;
  });
}
/** False when the 2D segment a-b crosses any box at least 1.6 m tall (slab test on the AABB; shape ignored). */
export function lineOfSight(boxes: Box[], ax: number, az: number, bx: number, bz: number): boolean {
  const sMinX = Math.min(ax, bx), sMaxX = Math.max(ax, bx);
  const sMinZ = Math.min(az, bz), sMaxZ = Math.max(az, bz);
  const dx = bx - ax, dz = bz - az;
  for (const b of boxes) {
    if (b.h < 1.6) continue;
    if (b.maxX < sMinX || b.minX > sMaxX || b.maxZ < sMinZ || b.minZ > sMaxZ) continue;
    let t0 = 0, t1 = 1;
    let hit = true;
    for (let axis = 0; axis < 2 && hit; axis++) {
      const o = axis === 0 ? ax : az, d = axis === 0 ? dx : dz;
      const lo = axis === 0 ? b.minX : b.minZ, hi = axis === 0 ? b.maxX : b.maxZ;
      if (Math.abs(d) < 1e-9) {
        if (o < lo || o > hi) hit = false;
      } else {
        let ta = (lo - o) / d, tb = (hi - o) / d;
        if (ta > tb) { const t = ta; ta = tb; tb = t; }
        t0 = Math.max(t0, ta);
        t1 = Math.min(t1, tb);
        if (t0 > t1) hit = false;
      }
    }
    if (hit) return false;
  }
  return true;
}

/** Chasers stop this far (horizontal) from their target. */
const STOP_DISTANCE = 4;
/** Only shoot while the target is below this height. */
const SPRAY_MAX_Y = 4;
const SPRAY_INTERVAL = 0.12;
/** Officers within this distance of the player count as "seeing" the player for cooling. */
const SEEN_DISTANCE = 40;
/** Guards start chasing from this far outside the base, while heat is 2+. */
const GUARD_WAKE_DISTANCE = 6;
/** A surplus officer leaves once this far from the player. */
const LEAVE_DISTANCE = 60;
const POST_EPSILON = 0.3;

interface Unit {
  npc: Npc;
  role: 'officer' | 'guard' | 'squad';
  /** Droplet hits taken so far. */
  hits: number;
  /** Guards only: the post they stand at. */
  post: { x: number; z: number } | null;
  /** Surplus officer walking away from the player. */
  leaving: boolean;
  /** Seconds since the last shot. */
  sprayT: number;
  /** Reused PlayerState for model.update. */
  state: PlayerState;
  rag: Ragdoll | null;
  upFromX: number;
  upFromZ: number;
  /** The pistol in the right hand (gunHold.ts placeInHand). */
  held: THREE.Object3D;
  /** True while the aim pose (gunHold.ts poseGunArms) is on the arms. */
  aimed: boolean;
}

interface Pursuit {
  vehicle: Vehicle;
  kind: 'ride-on' | 'zero-turn' | 'hoa-van';
  ring?: THREE.Mesh;
  lightbar?: { red: THREE.MeshBasicMaterial; blue: THREE.MeshBasicMaterial; group: THREE.Group };
  citationT: number;
  dismounted: boolean;
  crew: Unit[];
  stuckT: number;
}

interface Roadblock {
  vehicles: Vehicle[];
  cones: THREE.Mesh[];
  x: number;
  z: number;
}

const muzzleAt = new THREE.Vector3();
const WATCH_BARKS = [
  'Hat Watch: "Pull that mower over to the kerb!"',
  'Hat Watch: "Suspect is fleeing on an unlicensed blade-deck!"',
  'Hat Watch: "Backup requested—bring extra glue!"',
] as const;
const HOA_CITATIONS = [
  'HOA §404-B: Unpermitted grass height! Slow down for inspection!',
  'HOA §404-B: Crooked hat detected within municipal limits!',
  'HOA §404-B: Non-compliant clay glaze! Pull over immediately!',
] as const;

export function createWatch(
  scene: THREE.Scene,
  _world: World,
  fx: Fx,
  vehicles: Vehicle[] = [],
  onToast?: (text: string) => void,
  onShot?: (x: number, z: number) => void,
): Watch {
  // Per-unit data, keyed by npc.id. Ids are negative so they never clash with pedestrian ids.
  const units = new Map<number, Unit>();
  const pursuits: Pursuit[] = [];
  let roadblock: Roadblock | null = null;
  let roadblockCooldown = 0;
  let barkCooldown = 8;
  const riderAnim = gnomeState(0, 0, 0, 0, 0, true);
  let nextId = -1;
  let guardsMade = false;
  let time = 0;
  /** Seconds since any officer or guard was within SEEN_DISTANCE of the player. */
  let unseenFor = 0;
  /** Heat ceiling set by a quest (null = none). */
  let cap: number | null = null;
  let lastLevel = 0;
  /** Seconds until the units of the newest level arrive. */
  let dispatchT = 0;
  /** Player heading estimate (unit vector) and last position. */
  let hx = 0, hz = 1;
  let lastPx = 0, lastPz = 0, hasLast = false;
  /** Search centre (last seen point) and whether a unit sees the player right now. */
  let searchX = 0, searchZ = 0, seenNow = false;

  function newNpc(name: string, look: Npc['look'], x: number, z: number, yaw: number, state: Npc['state']): Npc {
    return {
      id: nextId--, name, x, z, yaw, state,
      fleeTime: 0, fromX: x, fromZ: z, targetX: x, targetZ: z,
      look, model: makeGnome(scene, look),
    };
  }

  function makeUnit(role: Unit['role'], npc: Npc, post: { x: number; z: number } | null): Unit {
    // A pistol sits in the right hand, held the way the player holds one.
    const held = buildHeld('gta-pistol');
    placeInHand(held, 'gta-pistol', npc.model.arms.right);
    const unit: Unit = {
      npc, role, hits: 0, post, leaving: false, sprayT: SPRAY_INTERVAL, held, aimed: false,
      state: {
        position: new THREE.Vector3(npc.x, heightAt(npc.x, npc.z), npc.z),
        velocity: new THREE.Vector3(),
        facing: npc.yaw,
        grounded: true,
        jumpsUsed: 0,
      },
      rag: null,
      upFromX: npc.x,
      upFromZ: npc.z,
    };
    units.set(npc.id, unit);
    return unit;
  }

  function knockUnit(u: Unit, vx: number, vy: number, vz: number, spin: number, fromX: number, fromZ: number): void {
    const n = u.npc;
    u.upFromX = fromX;
    u.upFromZ = fromZ;
    if (n.state === 'ragdoll' && u.rag) {
      impulse(u.rag, vx, vy, vz, spin);
      return;
    }
    const sp = n.state === 'walk' || n.state === 'flee' ? WATCH.speed : 0;
    u.rag = createRagdoll(n.x, 0, n.z, n.yaw, Math.sin(n.yaw) * sp, Math.cos(n.yaw) * sp);
    impulse(u.rag, vx, vy, vz, spin);
    n.state = 'ragdoll';
    clearHandsUp(n.model);
  }

  function removeUnit(u: Unit): void {
    scene.remove(u.npc.model.object);
    units.delete(u.npc.id);
  }

  /** Pick a random point from `pts`, preferring ones behind the player's heading. */
  function pickBehind<T extends { x: number; z: number }>(pts: T[], px: number, pz: number): T | null {
    if (pts.length === 0) return null;
    const behind = pts.filter((p) => {
      const d = Math.hypot(p.x - px, p.z - pz) || 1;
      return ((p.x - px) / d) * hx + ((p.z - pz) / d) * hz < -0.2;
    });
    const from = behind.length > 0 ? behind : pts;
    return from[Math.floor(Math.random() * from.length)];
  }

  function spawnOfficer(world: World, px: number, pz: number): boolean {
    const inBand = (min: number, max: number) => world.walkPoints.filter((p) => {
      const d = Math.hypot(p.x - px, p.z - pz);
      return d >= min && d <= max;
    });
    let p = pickBehind(inBand(WATCH.officerSpawnMin, WATCH.officerSpawnMax), px, pz);
    if (!p) p = pickBehind(inBand(Math.max(25, WATCH.spawnNever), WATCH.spawnDistance + 10), px, pz);
    if (!p) return false;
    const look = randomTownLook({ hat: WATCH.hat, shirt: WATCH.coat });
    const npc = newNpc(`Officer ${randomGnomeName()}`, look, p.x, p.z, Math.atan2(px - p.x, pz - p.z), 'walk');
    makeUnit('officer', npc, null);
    return true;
  }

  function spawnGuards(world: World): void {
    guardsMade = true;
    const base = world.base;
    for (const post of base.guardPosts) {
      const look = randomTownLook({ hat: WATCH.guardHat, shirt: WATCH.guardCoat });
      const yaw = Math.atan2(base.gateX - post.x, base.gateZ - post.z);
      const npc = newNpc(`Sentry ${randomGnomeName()}`, look, post.x, post.z, yaw, 'idle');
      makeUnit('guard', npc, { x: post.x, z: post.z });
    }
  }

  /** Move a unit by `step` along the unit vector (ux, uz), out of boxes and inside the world. Guards stay in the base unless fleeing. */
  function nudge(u: Unit, ux: number, uz: number, step: number, world: World): void {
    const n = u.npc;
    const wx = n.x + ux * step, wz = n.z + uz * step;
    const p = pushOutOfBoxes(wx, wz, BODY_R, world.boxes, groundAt(wx, wz, u.state.position.y));
    const c = clampToWorld(p.x, p.z, world.half, BODY_R);
    n.x = c.x;
    n.z = c.z;
    if (u.role === 'guard' && n.state !== 'flee') {
      const b = world.base;
      n.x = Math.max(b.minX + 1, Math.min(b.maxX - 1, n.x));
      n.z = Math.max(b.minZ + 1, Math.min(b.maxZ - 1, n.z));
    }
  }

  /** Run the model's animation for this unit at a horizontal speed. Call poseHandsUp / arm tweaks after this. */
  function animate(u: Unit, dt: number, speed: number): void {
    const n = u.npc;
    const s = u.state;
    s.position.set(n.x, groundAt(n.x, n.z, s.position.y), n.z);
    s.velocity.set(Math.sin(n.yaw) * speed, 0, Math.cos(n.yaw) * speed);
    s.facing = n.yaw;
    n.model.update(s, dt);
  }

  function distToRect(world: World, x: number, z: number): number {
    const b = world.base;
    const rx = Math.max(b.minX - x, 0, x - b.maxX);
    const rz = Math.max(b.minZ - z, 0, z - b.maxZ);
    return Math.hypot(rx, rz);
  }

  /** Advance one unit by dt. Returns the damage it deals to the player this frame. */
  function stepUnit(u: Unit, dt: number, world: World, px: number, pz: number, tx: number, ty: number, tz: number): number {
    const n = u.npc;
    const model = n.model;

    if (n.state === 'ragdoll') {
      const r = u.rag;
      if (!r) { n.state = 'walk'; return 0; }
      stepRagdoll(r, dt, world.boxes);
      const c = { x: 0, y: 0, z: 0 };
      ragdollCentre(r, c);
      const cl = clampToWorld(c.x, c.z, world.half, BODY_R);
      n.x = cl.x;
      n.z = cl.z;
      poseRagdoll(model, r);
      if ((r.still > 1.2 && r.age > 0.6) || r.age > 4.0) {
        u.rag = null;
        resetPose(model);
        n.yaw = Math.atan2(tx - n.x, tz - n.z);
        model.object.position.set(n.x, groundAt(n.x, n.z, u.state.position.y), n.z);
        n.state = 'walk';
      }
      return 0;
    }

    // Fast vehicles fling standing officers/guards into ragdoll.
    for (const v of vehicles) {
      if (v.driver === 'police' || !runOverHit(v, n.x, n.z, BODY_R, dt)) continue;
      const dx = n.x - v.x, dz = n.z - v.z;
      const sp = v.speed;
      const dir = Math.sign(sp);
      const vx = Math.sin(v.yaw) * dir, vz = Math.cos(v.yaw) * dir;
      const side = (dx * vz - dz * vx) > 0 ? 1 : -1;
      const f = Math.min(Math.abs(sp), 30);
      knockUnit(u, vx * f * 0.9 - vz * side * 2, 3 + f * 0.35, vz * f * 0.9 + vx * side * 2, 1.2 + f * 0.05, v.x, v.z);
      return 0;
    }

    if (n.state === 'flee') {
      n.fleeTime -= dt;
      if (n.fleeTime > 0) {
        let ux = n.x - n.fromX;
        let uz = n.z - n.fromZ;
        const L = Math.hypot(ux, uz);
        if (L < 1e-3) {
          ux = Math.sin(n.yaw);
          uz = Math.cos(n.yaw);
        } else {
          ux /= L;
          uz /= L;
        }
        n.yaw = Math.atan2(ux, uz);
        nudge(u, ux, uz, WATCH.speed * dt, world);
        animate(u, dt, WATCH.speed);
        poseHandsUp(model, time);
        return 0;
      }
      if (u.role === 'officer') {
        removeUnit(u);
        return 0;
      }
      // A guard that ran off walks back to its post now.
      n.state = 'walk';
      u.hits = 0;
      clearHandsUp(model);
    }

    if (u.leaving) {
      const dx = n.x - px;
      const dz = n.z - pz;
      const d = Math.hypot(dx, dz);
      if (d >= LEAVE_DISTANCE) {
        removeUnit(u);
        return 0;
      }
      const ux = d > 1e-3 ? dx / d : Math.sin(n.yaw);
      const uz = d > 1e-3 ? dz / d : Math.cos(n.yaw);
      n.yaw = Math.atan2(ux, uz);
      nudge(u, ux, uz, WATCH.speed * dt, world);
      n.state = 'walk';
      animate(u, dt, WATCH.speed);
      return 0;
    }

    let chase: boolean;
    if (u.role === 'officer' || u.role === 'squad') {
      chase = true;
    } else {
      const b = world.base;
      const inBase = tx > b.minX && tx < b.maxX && tz > b.minZ && tz < b.maxZ;
      chase = inBase || (w.heat >= 2 && distToRect(world, tx, tz) <= GUARD_WAKE_DISTANCE);
    }

    let moving = false;
    let spraying = false;

    if (chase) {
      const dT = Math.hypot(tx - n.x, tz - n.z);
      // An officer with no line of sight, far away, heads for the search centre instead of straight at the player.
      let gx = tx, gz = tz;
      if (u.role === 'officer' && dT > 12 && !(dT <= SEEN_DISTANCE && lineOfSight(world.boxes, n.x, n.z, tx, tz))) {
        gx = searchX;
        gz = searchZ;
      }
      const dG = Math.hypot(gx - n.x, gz - n.z);
      if (dG > STOP_DISTANCE) {
        const ux = (gx - n.x) / dG;
        const uz = (gz - n.z) / dG;
        n.yaw = Math.atan2(ux, uz);
        nudge(u, ux, uz, Math.min(WATCH.speed * dt, dG - STOP_DISTANCE), world);
        moving = true;
      }
      const d = Math.hypot(tx - n.x, tz - n.z);
      if (d <= WATCH.shootRange && ty < SPRAY_MAX_Y && !isPlayerHidden()) {
        spraying = true;
        n.yaw = Math.atan2(tx - n.x, tz - n.z);
      }
      n.targetX = tx;
      n.targetZ = tz;
    } else if (u.post) {
      const dx = u.post.x - n.x;
      const dz = u.post.z - n.z;
      const d = Math.hypot(dx, dz);
      if (d > POST_EPSILON) {
        nudge(u, dx / d, dz / d, Math.min(WATCH.speed * dt, d), world);
        n.yaw = Math.atan2(dx, dz);
        moving = true;
      } else {
        // At the post: stand facing the gate.
        n.yaw = Math.atan2(world.base.gateX - n.x, world.base.gateZ - n.z);
      }
      n.targetX = u.post.x;
      n.targetZ = u.post.z;
    }

    n.state = moving ? 'walk' : 'idle';
    animate(u, dt, moving ? WATCH.speed : 0);

    if (spraying) {
      poseGunArms(model, 'gta-pistol', { aiming: true, pitch: 0 }, u.held);
      u.aimed = true;
      u.sprayT += dt;
      if (u.sprayT >= SPRAY_INTERVAL) {
        u.sprayT = 0;
        // From the pistol in the raised hand, not from the head.
        model.object.updateMatrixWorld(true);
        muzzleWorld(u.held, muzzleAt);
        fx.flash(muzzleAt.x, muzzleAt.y, muzzleAt.z);
        fx.tracer(muzzleAt.x, muzzleAt.y, muzzleAt.z, tx, ty + 0.7, tz);
        onShot?.(muzzleAt.x, muzzleAt.z);
      }
      return WATCH.damagePerSecond * dt;
    }
    if (u.aimed) {
      clearGunArms(model, u.held);
      u.aimed = false;
    }
    u.sprayT = SPRAY_INTERVAL;
    return 0;
  }

  function spawnPursuit(kind: Pursuit['kind'], world: World, px: number, pz: number, py: number): void {
    let nodes = levelNodes(world.roads.nodes, px, pz, py, WATCH.pursuitSpawnMin, WATCH.pursuitSpawnMax);
    if (nodes.length === 0) nodes = world.roads.nodes.filter((n) => n.deck === undefined && Math.hypot(n.x - px, n.z - pz) >= WATCH.pursuitSpawnMin && Math.hypot(n.x - px, n.z - pz) <= WATCH.pursuitSpawnMax);
    const node = pickBehind(nodes, px, pz);
    // No road in range: nothing arrives (never pop in next to the player).
    if (!node) return;
    const x = node.x;
    const z = node.z;
    const yaw = Math.atan2(px - x, pz - z);
    const tint = kind === 'hoa-van' ? WATCH.hoaHat : WATCH.hat;
    const v = createVehicle(scene, kind, x, z, yaw, tint);
    v.y = nodeY(node);
    v.driver = 'police';
    const look = kind === 'hoa-van'
      ? randomTownLook({ hat: WATCH.hoaHat, shirt: WATCH.hoaCoat })
      : randomTownLook({ hat: WATCH.hat, shirt: WATCH.coat });
    const rider = createGnomeModel(look);
    v.object.add(rider.object);
    v.rider = rider;
    v.riderLook = look;
    vehicles.push(v);

    let ring: THREE.Mesh | undefined;
    if (kind === 'hoa-van') {
      const geo = new THREE.RingGeometry(11.4, 12.0, 40);
      geo.rotateX(-Math.PI / 2);
      const mat = flatLayer(new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.45, side: THREE.DoubleSide }), LAYER.marker);
      ring = new THREE.Mesh(geo, mat);
      ring.position.y = 0.08;
      v.object.add(ring);
    }
    const barGroup = new THREE.Group();
    const barY = kind === 'hoa-van' ? 2.1 : 1.35;
    barGroup.position.set(0, barY, 0.1);
    const redMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    const blueMat = new THREE.MeshBasicMaterial({ color: 0x2266ff });
    const redLamp = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.22), redMat);
    redLamp.position.x = -0.18;
    const blueLamp = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.22), blueMat);
    blueLamp.position.x = 0.18;
    barGroup.add(redLamp, blueLamp);
    v.object.add(barGroup);
    pursuits.push({
      vehicle: v, kind, ring, lightbar: { red: redMat, blue: blueMat, group: barGroup },
      citationT: 1.5, dismounted: false, crew: [], stuckT: 0,
    });
  }

  function removePursuit(p: Pursuit, removeVeh: boolean): void {
    if (p.ring) p.ring.removeFromParent();
    if (p.lightbar) p.lightbar.group.removeFromParent();
    for (const u of p.crew) {
      if (units.has(u.npc.id)) removeUnit(u);
    }
    p.crew.length = 0;
    if (removeVeh) {
      removeVehicle(scene, p.vehicle);
      const idx = vehicles.indexOf(p.vehicle);
      if (idx >= 0) vehicles.splice(idx, 1);
    }
  }

  function dismountPursuit(p: Pursuit): void {
    const v = p.vehicle;
    p.dismounted = true;
    p.stuckT = 0;
    if (v.rider) {
      v.object.remove(v.rider.object);
      v.rider = null;
      v.riderLook = null;
    }
    v.driver = 'none';
    v.speed = 0;
    const count = p.kind === 'hoa-van' ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const pt = exitPoint(v);
      const ox = pt.x + (i === 1 ? 1.4 : 0);
      const oz = pt.z + (i === 1 ? 1.4 : 0);
      const isHoa = p.kind === 'hoa-van';
      const look = randomTownLook({
        hat: isHoa ? WATCH.hoaHat : WATCH.hat,
        shirt: isHoa ? WATCH.hoaCoat : WATCH.coat,
      });
      const npc = newNpc(`${isHoa ? 'HOA Enforcer' : 'Officer'} ${randomGnomeName()}`, look, ox, oz, v.yaw, 'walk');
      p.crew.push(makeUnit('officer', npc, null));
    }
  }

  function reboardPursuit(p: Pursuit, u: Unit): void {
    const v = p.vehicle;
    const look = u.npc.look;
    removeUnit(u);
    const idx = p.crew.indexOf(u);
    if (idx >= 0) p.crew.splice(idx, 1);
    v.driver = 'police';
    const rider = createGnomeModel(look);
    v.object.add(rider.object);
    v.rider = rider;
    v.riderLook = look;
    p.dismounted = false;
    p.stuckT = 0;
  }

  function stepPursuits(dt: number, ctx: WatchContext, world: World, level: number): void {
    const wantRideOn = level >= 2 ? 1 : 0;
    const wantZeroTurn = level >= 3 ? 1 : 0;
    const wantHoaVan = level >= 4 ? 1 : 0;

    // Release stolen or exploded pursuit vehicles from tracking.
    for (let i = pursuits.length - 1; i >= 0; i--) {
      const p = pursuits[i];
      if (p.vehicle.exploded || (p.vehicle.driver !== 'police' && !p.dismounted)) {
        removePursuit(p, false);
        pursuits.splice(i, 1);
      }
    }

    const countOf = (k: Pursuit['kind']): number => pursuits.filter((p) => p.kind === k).length;
    const spawnY = ctx.playerVehicle ? ctx.playerVehicle.y : ctx.playerY;
    const canSpawn = dispatchT <= 0;
    if (canSpawn && countOf('ride-on') < wantRideOn) spawnPursuit('ride-on', world, ctx.playerX, ctx.playerZ, spawnY);
    if (canSpawn && countOf('zero-turn') < wantZeroTurn) spawnPursuit('zero-turn', world, ctx.playerX, ctx.playerZ, spawnY);
    if (canSpawn && countOf('hoa-van') < wantHoaVan) spawnPursuit('hoa-van', world, ctx.playerX, ctx.playerZ, spawnY);

    // Despawn surplus pursuit vehicles when heat cools down.
    for (let i = pursuits.length - 1; i >= 0; i--) {
      const p = pursuits[i];
      const keep = (p.kind === 'ride-on' && level >= 2) || (p.kind === 'zero-turn' && level >= 3) || (p.kind === 'hoa-van' && level >= 4);
      if (!keep) {
        removePursuit(p, true);
        pursuits.splice(i, 1);
      }
    }

    const tx = ctx.playerVehicle ? ctx.playerVehicle.x : ctx.playerX;
    const tz = ctx.playerVehicle ? ctx.playerVehicle.z : ctx.playerZ;
    barkCooldown = Math.max(0, barkCooldown - dt);
    if (level >= 2 && pursuits.length > 0 && barkCooldown <= 0) {
      barkCooldown = 14;
      onToast?.(WATCH_BARKS[Math.floor(Math.random() * WATCH_BARKS.length)]);
    }

    // Heat 3+ Roadblock: two angled patrol vehicles + cones on a road node ahead of the player.
    roadblockCooldown = Math.max(0, roadblockCooldown - dt);
    if (roadblock) {
      const d = Math.hypot(roadblock.x - tx, roadblock.z - tz);
      if (level < 2 || d > 110) {
        for (const c of roadblock.cones) c.removeFromParent();
        for (const rv of roadblock.vehicles) {
          if (rv.driver !== 'player') {
            removeVehicle(scene, rv);
            const idx = vehicles.indexOf(rv);
            if (idx >= 0) vehicles.splice(idx, 1);
          }
        }
        roadblock = null;
      }
    } else if (level >= 3 && roadblockCooldown <= 0 && world.roads.nodes.length > 0) {
      // Same level as the target, and never on a ramp foot or junction (a node whose links change deck).
      const ty = ctx.playerVehicle ? ctx.playerVehicle.y : ctx.playerY;
      const cands = levelNodes(world.roads.nodes, tx, tz, ty, 45, 75).filter((n) => n.links.every((l) => world.roads.nodes[l]?.deck === n.deck));
      if (cands.length > 0) {
        const node = cands[Math.floor(Math.random() * cands.length)];
        const ny = nodeY(node);
        const yawBase = Math.atan2(tx - node.x, tz - node.z) + Math.PI / 2;
        const rbVehs: Vehicle[] = [];
        const rbCones: THREE.Mesh[] = [];
        const coneGeo = new THREE.ConeGeometry(0.28, 0.7, 8);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xff6b1a, roughness: 0.6 });
        for (const side of [-2.8, 2.8]) {
          const vx = node.x + Math.cos(yawBase) * side;
          const vz = node.z - Math.sin(yawBase) * side;
          const rv = createVehicle(scene, level >= 4 ? 'hoa-van' : 'ride-on', vx, vz, yawBase + side * 0.15, level >= 4 ? WATCH.hoaHat : WATCH.hat);
          rv.y = groundAt(vx, vz, ny + 0.6);
          rv.driver = 'none';
          vehicles.push(rv);
          rbVehs.push(rv);
        }
        for (let k = -1; k <= 1; k++) {
          const cone = new THREE.Mesh(coneGeo, coneMat);
          const cx = node.x + k * 2.2, cz = node.z + 2.5;
          cone.position.set(cx, groundAt(cx, cz, ny + 0.6) + 0.35, cz);
          scene.add(cone);
          rbCones.push(cone);
        }
        roadblock = { vehicles: rbVehs, cones: rbCones, x: node.x, z: node.z };
        roadblockCooldown = 28;
        onToast?.('Hat Watch Roadblock ahead!');
      }
    }

    for (const p of pursuits) {
      const v = p.vehicle;
      if (p.lightbar) {
        const flash = Math.sin(time * 16) > 0;
        p.lightbar.red.color.setHex(flash ? 0xff2222 : 0x330808);
        p.lightbar.blue.color.setHex(flash ? 0x081844 : 0x3388ff);
      }
      const dx = tx - v.x;
      const dz = tz - v.z;
      const dist = Math.hypot(dx, dz);

      if (p.dismounted) {
        // Prune dead/fled crew; if player fled far away and a crew member is near the rig, reboard it.
        p.crew = p.crew.filter((u) => units.has(u.npc.id));
        if (v.driver === 'none' && !v.exploded && dist > 36) {
          const boarder = p.crew.find((u) => u.npc.state !== 'ragdoll' && u.npc.state !== 'flee' && Math.hypot(u.npc.x - v.x, u.npc.z - v.z) < 20);
          if (boarder) reboardPursuit(p, boarder);
        }
        continue;
      }

      if (Math.abs(v.speed) < 1.5 && dist < 24) p.stuckT += dt;
      else p.stuckT = 0;

      if (dist <= 14 || p.stuckT > 1.5) {
        dismountPursuit(p);
        continue;
      }

      const desired = Math.atan2(dx, dz);
      const diff = angleDiff(desired, v.yaw);
      const steer = Math.max(-1, Math.min(1, -diff * 2.2));
      const throttle = dist > 7 ? 1 : dist > 4 ? 0.35 : 0;
      stepVehicle(v, { throttle, steer, lift: 0 }, dt, world);
      if (p.kind !== 'hoa-van' && v.speed > 21) v.speed = 21;
      syncVehicleMesh(v, dt);
      if (v.rider) {
        const s = v.spec.seat;
        riderAnim.position.set(s[0], s[1], s[2]);
        v.rider.update(riderAnim, dt);
      }

      if (p.kind === 'hoa-van') {
        if (p.ring) {
          const mat = p.ring.material as THREE.MeshBasicMaterial;
          const pulse = 0.5 + 0.5 * Math.sin(time * 7);
          mat.color.setHex(pulse > 0.5 ? 0xff3b3b : 0xd4af37);
          mat.opacity = 0.28 + pulse * 0.25;
        }
        p.citationT -= dt;
        if (dist <= 12) {
          if (ctx.playerVehicle && !ctx.playerVehicle.spec.flies) {
            ctx.playerVehicle.speed *= Math.max(0.7, 1 - 0.55 * dt);
            if (ctx.playerVehicle.sim) {
              const b = ctx.playerVehicle.sim.ctrl.body;
              b.vel.x *= Math.max(0.7, 1 - 0.55 * dt);
              b.vel.z *= Math.max(0.7, 1 - 0.55 * dt);
            }
          }
          if (p.citationT <= 0) {
            p.citationT = 7;
            onToast?.(HOA_CITATIONS[Math.floor(Math.random() * HOA_CITATIONS.length)]);
          }
        }
      }
    }
  }

  function tick(dt: number, ctx: WatchContext, world: World): number {
    time += dt;
    if (!guardsMade) spawnGuards(world);

    const px = ctx.playerX;
    const pz = ctx.playerZ;
    // Chasers go after the vehicle when the player is driving one.
    const tx = ctx.playerVehicle ? ctx.playerVehicle.x : px;
    const ty = ctx.playerVehicle ? ctx.playerVehicle.y : ctx.playerY;
    const tz = ctx.playerVehicle ? ctx.playerVehicle.z : pz;

    // Heading estimate from the player's movement.
    if (hasLast) {
      const mx = px - lastPx, mz = pz - lastPz;
      const ml = Math.hypot(mx, mz);
      if (ml > 0.05) { hx = mx / ml; hz = mz / ml; }
    }
    lastPx = px; lastPz = pz; hasLast = true;
    const capMax = Math.min(MAX_HEAT, cap ?? MAX_HEAT);
    if (w.heat > capMax) w.heat = capMax;

    // Cooling: a unit sees the player only within SEEN_DISTANCE with a clear line. Inside giant grass on foot
    // (Tallgrass Commons, critters.ts isPlayerHidden) nobody sees the player at all.
    const hiddenNow = isPlayerHidden();
    const canSee = (x: number, z: number): boolean =>
      Math.hypot(x - px, z - pz) <= SEEN_DISTANCE && lineOfSight(world.boxes, x, z, px, pz);
    let near = false;
    if (!hiddenNow) {
      for (const u of units.values()) {
        if (canSee(u.npc.x, u.npc.z)) { near = true; break; }
      }
      if (!near) {
        for (const p of pursuits) {
          if (canSee(p.vehicle.x, p.vehicle.z)) { near = true; break; }
        }
      }
    }
    seenNow = near;
    if (near) { searchX = px; searchZ = pz; }
    const sr = WATCH.searchRadius + WATCH.searchRadiusPerLevel * Math.max(0, Math.floor(w.heat) - 1);
    const insideSearch = Math.hypot(px - searchX, pz - searchZ) <= sr;
    unseenFor = near ? 0 : unseenFor + dt * (insideSearch ? 1 : 1.5);
    if (unseenFor > HEAT.coolDelay && w.heat > 0) {
      w.heat = Math.max(0, w.heat - HEAT.coolRate * dt * (insideSearch ? 1 : 2));
    }

    // A level-up starts the dispatch delay; units of the new level arrive only after it.
    const levelNow = Math.floor(w.heat);
    if (levelNow > lastLevel) dispatchT = WATCH.dispatchDelay[Math.min(levelNow, WATCH.dispatchDelay.length - 1)];
    lastLevel = levelNow;
    if (dispatchT > 0) dispatchT = Math.max(0, dispatchT - dt);

    // Officer count follows heat. Surplus officers (farthest first) walk away.
    const levels = WATCH.officersPerLevel;
    const heatLevel = Math.min(levels.length - 1, Math.max(0, Math.floor(w.heat)));
    const target = levels[heatLevel];
    const active: Unit[] = [];
    for (const u of units.values()) {
      if (u.role === 'officer' && !u.leaving && u.npc.state !== 'flee') active.push(u);
    }
    let need = target - active.length;
    while (dispatchT <= 0 && need > 0 && spawnOfficer(world, px, pz)) need--;
    if (active.length > target) {
      active.sort((a, b) => Math.hypot(b.npc.x - px, b.npc.z - pz) - Math.hypot(a.npc.x - px, a.npc.z - pz));
      for (let i = 0; i < active.length - target; i++) active[i].leaving = true;
    }

    stepPursuits(dt, ctx, world, heatLevel);

    let damage = 0;
    for (const u of [...units.values()]) {
      damage += stepUnit(u, dt, world, px, pz, tx, ty, tz);
    }
    return damage;
  }

  const w: Watch = {
    heat: 0,
    addHeat(a: number) {
      w.heat = Math.max(0, Math.min(MAX_HEAT, cap ?? MAX_HEAT, w.heat + a));
    },
    setCap(c: number | null) {
      cap = c;
      if (c !== null && w.heat > c) {
        w.heat = c;
        if (c <= 0) w.clear();
      }
    },
    search(): WatchSearch | null {
      const level = Math.floor(w.heat);
      if (level < 1) return null;
      const r = WATCH.searchRadius + WATCH.searchRadiusPerLevel * (level - 1);
      const inside = Math.hypot(lastPx - searchX, lastPz - searchZ) <= r;
      let evade = 0;
      if (!seenNow) {
        evade = unseenFor <= HEAT.coolDelay
          ? 0.5 * unseenFor / HEAT.coolDelay
          : 0.5 + 0.5 * (1 - (w.heat - level));
      }
      return { x: searchX, z: searchZ, r, seen: seenNow, inside, evade: Math.max(0, Math.min(1, evade)), level, dispatchIn: Math.max(0, dispatchT) };
    },
    clear() {
      w.heat = 0;
      dispatchT = 0;
      lastLevel = 0;
      unseenFor = 0;
      for (const u of [...units.values()]) {
        if (u.role === 'officer') removeUnit(u);
      }
      for (const p of pursuits) removePursuit(p, true);
      pursuits.length = 0;
      if (roadblock) {
        for (const c of roadblock.cones) c.removeFromParent();
        for (const rv of roadblock.vehicles) {
          if (rv.driver !== 'player') {
            removeVehicle(scene, rv);
            const idx = vehicles.indexOf(rv);
            if (idx >= 0) vehicles.splice(idx, 1);
          }
        }
        roadblock = null;
      }
    },
    update(dt: number, ctx: WatchContext, world: World): number {
      return tick(dt, ctx, world);
    },
    hitTest(x: number, y: number, z: number): Npc | null {
      let best: Npc | null = null;
      let bestD = 0.5;
      for (const u of units.values()) {
        const d = Math.hypot(u.npc.x - x, u.npc.z - z);
        // Height above this officer's own ground.
        const h = y - u.state.position.y;
        if (h < 0 || h > 1.2) continue;
        if (d < bestD) {
          bestD = d;
          best = u.npc;
        }
      }
      return best;
    },
    crack(o: Npc): boolean {
      const u = units.get(o.id);
      if (!u) return false;
      u.hits++;
      const g = groundAt(o.x, o.z, u.state.position.y);
      fx.spark(o.x, g + 1, o.z);
      if (u.hits < WATCH.crackHits) return false;
      fx.crack(o.x, g + 0.8, o.z, o.look.shirt);
      if (u.role === 'officer' || u.role === 'squad' || !u.post) {
        removeUnit(u);
      } else {
        // A cracked guard is glued back together at its post.
        o.x = u.post.x;
        o.z = u.post.z;
        o.state = 'walk';
        u.hits = 0;
        const g = groundAt(o.x, o.z, u.state.position.y);
        u.state.position.set(o.x, g, o.z);
        o.model.object.position.set(o.x, g, o.z);
      }
      return true;
    },
    spawnSquad(kind: 'hoa' | 'porcelain' | 'spade', points: [number, number][]): Npc[] {
      const out: Npc[] = [];
      const hat = kind === 'hoa' ? WATCH.hoaHat : kind === 'porcelain' ? WATCH.porcelainHat : WATCH.guardHat;
      const shirt = kind === 'hoa' ? WATCH.hoaCoat : kind === 'porcelain' ? WATCH.porcelainCoat : WATCH.guardCoat;
      const prefix = kind === 'hoa' ? 'HOA Enforcer' : kind === 'porcelain' ? 'Porcelain Guard' : 'Spade Guard';
      for (const [x, z] of points) {
        const look = randomTownLook({ hat, shirt });
        const npc = newNpc(`${prefix} ${randomGnomeName()}`, look, x, z, 0, 'walk');
        makeUnit('squad', npc, null);
        out.push(npc);
      }
      return out;
    },
    despawnSquad(npcs: Npc[]): void {
      for (const npc of npcs) {
        const u = units.get(npc.id);
        if (u) removeUnit(u);
      }
    },
    onSneeze(x: number, z: number, radius: number): number {
      let count = 0;
      for (const u of units.values()) {
        if (u.npc.state === 'flee') continue;
        if (Math.hypot(u.npc.x - x, u.npc.z - z) <= radius) {
          u.npc.state = 'flee';
          u.npc.fleeTime = 6;
          u.npc.fromX = x;
          u.npc.fromZ = z;
          count++;
        }
      }
      return count;
    },
    knockArea(x: number, z: number, radius: number, force: number, up: number, fromX: number, fromZ: number): number {
      let count = 0;
      for (const u of units.values()) {
        const dx = u.npc.x - x;
        const dz = u.npc.z - z;
        const d = Math.hypot(dx, dz);
        if (d > radius) continue;
        const k = d > 0.01 ? force / d : force;
        const ux = d > 0.01 ? dx * k : force;
        const uz = d > 0.01 ? dz * k : 0;
        knockUnit(u, ux, up, uz, (Math.random() - 0.5) * 10, fromX, fromZ);
        count++;
      }
      return count;
    },
    ejectPursuitDriver(v: Vehicle) {
      if (v.driver !== 'police') return;
      if (v.rider) {
        v.object.remove(v.rider.object);
        v.rider = null;
        v.riderLook = null;
      }
      v.driver = 'none';
      v.speed = 0;
      const pt = exitPoint(v);
      const look = randomTownLook({ hat: v.kind === 'hoa-van' ? WATCH.hoaHat : WATCH.hat, shirt: v.kind === 'hoa-van' ? WATCH.hoaCoat : WATCH.coat });
      const npc = newNpc(`Officer ${randomGnomeName()}`, look, pt.x, pt.z, v.yaw, 'flee');
      npc.fleeTime = 6;
      npc.fromX = v.x;
      npc.fromZ = v.z;
      makeUnit('officer', npc, null);
    },
  };
  return w;
}

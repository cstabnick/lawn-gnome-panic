// The Hat Watch (heat, officers) and the Spade Guard (Fort Sandpit). Officers chase and shoot the player when heat is 1+.
// Guards defend the base. Officers and guards that take enough hits crack apart into clay shards.
import * as THREE from 'three';
import type { PlayerState } from '@lawn/gnome';
import { buildHeld } from '@lawn/prefabs';
import { HEAT, MAX_HEAT, WATCH } from './config';
import { clampToWorld, pushOutOfBoxes } from './collide';
import { clearHandsUp, makeGnome, poseHandsUp, randomGnomeName, randomTownLook } from './gnomes';
import type { Fx, Npc, Watch, WatchContext, World } from './types';

/** Body radius for collisions with boxes and the world edge. */
const BODY_R = 0.4;
/** Chasers stop this far (horizontal) from their target. */
const STOP_DISTANCE = 4;
/** Only shoot while the target is below this height. */
const SPRAY_MAX_Y = 4;
const SPRAY_INTERVAL = 0.12;
/** Officers within this distance of the player count as "seeing" the player for cooling. */
const SEEN_DISTANCE = 30;
/** Guards start chasing from this far outside the base, while heat is 2+. */
const GUARD_WAKE_DISTANCE = 6;
/** A surplus officer leaves once this far from the player. */
const LEAVE_DISTANCE = 60;
const POST_EPSILON = 0.3;

interface Unit {
  npc: Npc;
  role: 'officer' | 'guard';
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
}

const muzzleAt = new THREE.Vector3();

export function createWatch(scene: THREE.Scene, _world: World, fx: Fx): Watch {
  // Per-unit data, keyed by npc.id. Ids are negative so they never clash with pedestrian ids.
  const units = new Map<number, Unit>();
  let nextId = -1;
  let guardsMade = false;
  let time = 0;
  /** Seconds since any officer or guard was within SEEN_DISTANCE of the player. */
  let unseenFor = 0;

  function newNpc(name: string, look: Npc['look'], x: number, z: number, yaw: number, state: Npc['state']): Npc {
    return {
      id: nextId--, name, x, z, yaw, state,
      fleeTime: 0, fromX: x, fromZ: z, targetX: x, targetZ: z,
      look, model: makeGnome(scene, look),
    };
  }

  function makeUnit(role: Unit['role'], npc: Npc, post: { x: number; z: number } | null): Unit {
    // A pistol sits in the right hand, muzzle along the arm.
    const held = buildHeld('gta-pistol');
    held.position.set(0, -0.32, 0.02);
    held.rotation.x = Math.PI;
    npc.model.arms.right.add(held);
    const unit: Unit = {
      npc, role, hits: 0, post, leaving: false, sprayT: SPRAY_INTERVAL,
      state: {
        position: new THREE.Vector3(npc.x, 0, npc.z),
        velocity: new THREE.Vector3(),
        facing: npc.yaw,
        grounded: true,
        jumpsUsed: 0,
      },
    };
    units.set(npc.id, unit);
    return unit;
  }

  function removeUnit(u: Unit): void {
    scene.remove(u.npc.model.object);
    units.delete(u.npc.id);
  }

  function spawnOfficer(world: World, px: number, pz: number): boolean {
    const cands = world.walkPoints.filter((p) => {
      const d = Math.hypot(p.x - px, p.z - pz);
      return d >= 25 && d <= WATCH.spawnDistance + 10;
    });
    if (cands.length === 0) return false;
    const p = cands[Math.floor(Math.random() * cands.length)];
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
    const p = pushOutOfBoxes(n.x + ux * step, n.z + uz * step, BODY_R, world.boxes);
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
    s.position.set(n.x, 0, n.z);
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
    if (u.role === 'officer') {
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
      if (dT > STOP_DISTANCE) {
        const ux = (tx - n.x) / dT;
        const uz = (tz - n.z) / dT;
        n.yaw = Math.atan2(ux, uz);
        nudge(u, ux, uz, Math.min(WATCH.speed * dt, dT - STOP_DISTANCE), world);
        moving = true;
      }
      const d = Math.hypot(tx - n.x, tz - n.z);
      if (d <= WATCH.shootRange && ty < SPRAY_MAX_Y) {
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
      model.arms.right.rotation.x = -Math.PI / 2;
      u.sprayT += dt;
      if (u.sprayT >= SPRAY_INTERVAL) {
        u.sprayT = 0;
        // From the pistol in the raised hand, not from the head.
        model.object.updateMatrixWorld(true);
        model.arms.right.localToWorld(muzzleAt.set(0, -0.72, 0.02));
        fx.flash(muzzleAt.x, muzzleAt.y, muzzleAt.z);
        fx.tracer(muzzleAt.x, muzzleAt.y, muzzleAt.z, tx, ty + 0.7, tz);
      }
      return WATCH.damagePerSecond * dt;
    }
    u.sprayT = SPRAY_INTERVAL;
    return 0;
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

    // Cooling: heat drops only after nobody has been close to the player for a while.
    let near = false;
    for (const u of units.values()) {
      if (Math.hypot(u.npc.x - px, u.npc.z - pz) <= SEEN_DISTANCE) {
        near = true;
        break;
      }
    }
    unseenFor = near ? 0 : unseenFor + dt;
    if (unseenFor > HEAT.coolDelay && w.heat > 0) {
      w.heat = Math.max(0, w.heat - HEAT.coolRate * dt);
    }

    // Officer count follows heat. Surplus officers (farthest first) walk away.
    const levels = WATCH.officersPerLevel;
    const target = levels[Math.min(levels.length - 1, Math.max(0, Math.floor(w.heat)))];
    const active: Unit[] = [];
    for (const u of units.values()) {
      if (u.role === 'officer' && !u.leaving && u.npc.state !== 'flee') active.push(u);
    }
    let need = target - active.length;
    while (need > 0 && spawnOfficer(world, px, pz)) need--;
    if (active.length > target) {
      active.sort((a, b) => Math.hypot(b.npc.x - px, b.npc.z - pz) - Math.hypot(a.npc.x - px, a.npc.z - pz));
      for (let i = 0; i < active.length - target; i++) active[i].leaving = true;
    }

    let damage = 0;
    for (const u of [...units.values()]) {
      damage += stepUnit(u, dt, world, px, pz, tx, ty, tz);
    }
    return damage;
  }

  const w: Watch = {
    heat: 0,
    addHeat(a: number) {
      w.heat = Math.max(0, Math.min(MAX_HEAT, w.heat + a));
    },
    clear() {
      w.heat = 0;
      for (const u of [...units.values()]) {
        if (u.role === 'officer') removeUnit(u);
      }
    },
    update(dt: number, ctx: WatchContext, world: World): number {
      return tick(dt, ctx, world);
    },
    hitTest(x: number, y: number, z: number): Npc | null {
      if (y < 0 || y > 1.2) return null;
      let best: Npc | null = null;
      let bestD = 0.5;
      for (const u of units.values()) {
        const d = Math.hypot(u.npc.x - x, u.npc.z - z);
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
      fx.spark(o.x, 1, o.z);
      if (u.hits < WATCH.crackHits) return false;
      fx.crack(o.x, 0.8, o.z, o.look.shirt);
      if (u.role === 'officer' || !u.post) {
        removeUnit(u);
      } else {
        // A cracked guard is glued back together at its post.
        o.x = u.post.x;
        o.z = u.post.z;
        o.state = 'walk';
        u.hits = 0;
        u.state.position.set(o.x, 0, o.z);
        o.model.object.position.set(o.x, 0, o.z);
      }
      return true;
    },
  };
  return w;
}

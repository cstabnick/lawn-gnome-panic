// Pedestrians: townsgnomes that wander the sidewalks. A speeding mower scares them into running with their hands up;
// a bullet cracks them apart into clay shards (no gore) and another townsgnome wanders in.
import * as THREE from 'three';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import { angleDiff, clampToWorld, pushOutOfBoxes } from './collide';
import { PEDESTRIANS } from './config';
import { biomeLookFor, clearHandsUp, makeGnome, poseHandsUp, randomGnomeName, randomTownLook } from './gnomes';
import { createRagdoll, impulse, poseRagdoll, ragdollCentre, resetPose, stepRagdoll, type Ragdoll } from './ragdoll';
import { aboveGround, heightAt } from './terrain';
import { runOverHit } from './runOver';
import type { Fx, Npc, Npcs, Vehicle, World } from './types';
import { inKeepOut, type KeepOutZone } from './cutscene/liveArea';
import { createAnimator, type Animator } from './anim/animator';
import type { AnimId } from './anim/types';
import { animStride, newAnimClock, stepAnimClock, type AnimClock } from './animStride';

type PlayerStateLike = Parameters<GnomeModel['update']>[0];

/** Hit test: horizontal radius and the height band of a gnome's body. */
const HIT_RADIUS = 0.5;
const HIT_TOP = 1.2;
/** Body radius used for walls and boxes. */
const BODY_R = 0.4;
/** Max yaw change, radians per second. */
const TURN_RATE = 10;
/** Distance at which a walking gnome counts as arrived. */
const ARRIVE_DIST = 0.6;
const WALK_TARGET_RANGE = 30;
const IDLE_MIN = 1;
const IDLE_MAX = 4;
/** Vehicles faster than this scare pedestrians. */
const SCARE_SPEED = 4;
const SCARE_HEADING = 0.5;
/** Spawn pedestrians at least this far from the player. */
const SPAWN_MIN_PLAYER = 8;
/** Recycled pedestrians reappear this far from the player. */
const RECYCLE_MIN = 30;
const RECYCLE_MAX = 80;
/** Extra gnomes above PEDESTRIANS.count tolerated before the farthest idle ones are removed. */
const EXTRA_SLACK = 4;
/** A walking gnome that has not moved this far in STUCK_WINDOW seconds picks a new target. */
const STUCK_WINDOW = 2;
const STUCK_DIST = 0.5;
/** A downed gnome gets up after lying this still for this long, or after RAGDOLL_MAX seconds in all. */
const RAGDOLL_LIE = 1.1;
const RAGDOLL_MAX = 7;

type NpcTrait = 'normal' | 'grumpy' | 'spectator';

/** Idle loops a pedestrian may pick while it stands about, by temperament (anim row ids). */
const IDLE_NORMAL: readonly AnimId[] = ['look-around', 'stretch', 'yawn', 'scratch-head', 'tap-foot', 'hands-on-hips', 'think'];
const IDLE_GRUMPY: readonly AnimId[] = ['cross-arms', 'tap-foot', 'hands-on-hips', 'look-around'];
const IDLE_SPECTATOR: readonly AnimId[] = ['look-around', 'clap', 'point', 'think', 'hands-on-hips'];
const IDLE_BY_TRAIT: Record<NpcTrait, readonly AnimId[]> = { normal: IDLE_NORMAL, grumpy: IDLE_GRUMPY, spectator: IDLE_SPECTATOR };
/** Chance a pedestrian that arrives at a spot (and is not crowded) plays an idle loop, and its idle length then. */
const IDLE_ANIM_CHANCE = 0.7;
const IDLE_ANIM_MIN = 2.5;

/** Private per-gnome bookkeeping (kept out of the Npc contract). */
interface Aux {
  /** Seconds of idling left. */
  idle: number;
  /** Own clock: drives the flee wobble and the hands-up sway. */
  clock: number;
  /** Extra heading added for the rest of this flee after a blocked run: 0 or ±PI/2. */
  turn: number;
  /** Walking progress check. */
  stuckT: number;
  anchorX: number;
  anchorZ: number;
  /** The skeleton while state is 'ragdoll'. */
  rag: Ragdoll | null;
  /** Where the gnome flees from once it gets up. */
  upFromX: number;
  upFromZ: number;
  trait: NpcTrait;
  /** The animation this gnome plays: idle loop, wave, panic, shake-fist, cheer or clap. */
  anim: Animator;
  /** Fleeing with the 'panic' arms loop instead of the hands-up pose. */
  panic: boolean;
  /** Seconds until the recycle step may look for a new walk point again (set after a failed search). */
  recycleT: number;
  /** Pose level of detail (animStride.ts): far gnomes are posed every few frames. */
  animClock: AnimClock;
}

function freshAux(x: number, z: number): Aux {
  const r = Math.random();
  const trait: NpcTrait = r < 0.22 ? 'grumpy' : r < 0.45 ? 'spectator' : 'normal';
  return { idle: 0, clock: Math.random() * 10, turn: 0, stuckT: 0, anchorX: x, anchorZ: z, rag: null, upFromX: x, upFromZ: z, trait, anim: createAnimator(), panic: false, recycleT: 0, animClock: newAnimClock(Math.floor(Math.random() * 4)) };
}

function rnd<T>(a: readonly T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

/** Side of one cell of the walk-point index, m. */
const WALK_CELL = 64;
type WalkPoint = { x: number; z: number };
/** Spatial index of each walkPoints array, built once (the array never changes after the world is built). */
const walkIndex = new WeakMap<readonly WalkPoint[], Map<string, WalkPoint[]>>();

function cellKey(cx: number, cz: number): string {
  return `${cx},${cz}`;
}

function indexFor(points: readonly WalkPoint[]): Map<string, WalkPoint[]> {
  let idx = walkIndex.get(points);
  if (!idx) {
    idx = new Map<string, WalkPoint[]>();
    for (const p of points) {
      const k = cellKey(Math.floor(p.x / WALK_CELL), Math.floor(p.z / WALK_CELL));
      let arr = idx.get(k);
      if (!arr) {
        arr = [];
        idx.set(k, arr);
      }
      arr.push(p);
    }
    walkIndex.set(points, idx);
  }
  return idx;
}

/**
 * A random walk point whose distance from (x, z) is within [minD, maxD]. Prefers a spot at least 8 m from every gnome
 * in `avoid`: it tries up to 16 random candidates, then falls back to any candidate in range.
 */
function pickNear(
  world: World,
  x: number,
  z: number,
  minD: number,
  maxD: number,
  avoid?: readonly Npc[],
): WalkPoint | null {
  let pool: readonly WalkPoint[] = world.walkPoints;
  if (Number.isFinite(maxD)) {
    const idx = indexFor(world.walkPoints);
    const gathered: WalkPoint[] = [];
    const cx0 = Math.floor((x - maxD) / WALK_CELL), cx1 = Math.floor((x + maxD) / WALK_CELL);
    const cz0 = Math.floor((z - maxD) / WALK_CELL), cz1 = Math.floor((z + maxD) / WALK_CELL);
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cz = cz0; cz <= cz1; cz++) {
        const arr = idx.get(cellKey(cx, cz));
        if (arr) for (const p of arr) gathered.push(p);
      }
    }
    pool = gathered;
  }
  const ok = pool.filter((p) => {
    const d = Math.hypot(p.x - x, p.z - z);
    return d >= minD && d <= maxD;
  });
  if (ok.length === 0) return null;
  if (avoid && avoid.length > 0) {
    const uncrowded = (p: WalkPoint): boolean => avoid.every((o) => Math.hypot(o.x - p.x, o.z - p.z) >= 8);
    for (let i = 0; i < 16; i++) {
      const p = rnd(ok);
      if (uncrowded(p)) return p;
    }
  }
  return rnd(ok);
}

/** Choose a new walk target within WALK_TARGET_RANGE of the gnome, avoiding crowded spots. */
function pickTarget(n: Npc, world: World, all?: readonly Npc[]): void {
  const p = pickNear(world, n.x, n.z, 0, WALK_TARGET_RANGE, all) ?? (world.walkPoints.length > 0 ? rnd(world.walkPoints) : null);
  if (p) {
    n.targetX = p.x;
    n.targetZ = p.z;
  } else {
    n.targetX = n.x;
    n.targetZ = n.z;
  }
}

function resetStuck(n: Npc, a: Aux): void {
  a.stuckT = 0;
  a.anchorX = n.x;
  a.anchorZ = n.z;
}

/**
 * Move along `heading` at `speed` for dt, push out of boxes, stay in the world, and ease yaw toward the heading.
 * Returns true when a box blocked the way.
 */
function moveAlong(n: Npc, world: World, dt: number, heading: number, speed: number): boolean {
  const p = pushOutOfBoxes(n.x + Math.sin(heading) * speed * dt, n.z + Math.cos(heading) * speed * dt, BODY_R, world.boxes, heightAt(n.x, n.z));
  const c = clampToWorld(p.x, p.z, world.half, BODY_R);
  n.x = c.x;
  n.z = c.z;
  const maxStep = TURN_RATE * dt;
  const diff = angleDiff(heading, n.yaw);
  n.yaw += Math.max(-maxStep, Math.min(maxStep, diff));
  return p.hit;
}

/** A driving vehicle heading toward the gnome, close enough to scare it, or null. */
function scaringVehicle(n: Npc, vehicles: Vehicle[]): Vehicle | null {
  for (const v of vehicles) {
    if (Math.abs(v.speed) <= SCARE_SPEED) continue;
    const dx = n.x - v.x;
    const dz = n.z - v.z;
    const d = Math.hypot(dx, dz);
    if (d < 1e-3 || d >= PEDESTRIANS.vehicleScare) continue;
    // Direction of travel: forward, flipped when reversing.
    const dir = Math.sign(v.speed);
    const dot = (Math.sin(v.yaw) * dir * dx + Math.cos(v.yaw) * dir * dz) / d;
    if (dot > SCARE_HEADING) return v;
  }
  return null;
}

export function createNpcs(scene: THREE.Scene, _world: World, fx: Fx): Npcs {
  let nextId = 1;
  let seeded = false;
  /** A live-world cutscene's clear zones (setKeepOut), and whether the gnomes inside still have to be moved out. */
  let keepOut: KeepOutZone[] | null = null;
  let purge = false;
  const aux = new WeakMap<Npc, Aux>();
  const ps = {
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    facing: 0,
    grounded: true,
    jumpsUsed: 0,
    sitting: false,
  } as PlayerStateLike;

  function getAux(n: Npc): Aux {
    let a = aux.get(n);
    if (!a) {
      a = freshAux(n.x, n.z);
      aux.set(n, a);
    }
    return a;
  }

  /** Start (or restart) a flee from the point (fromX, fromZ). */
  function startFlee(n: Npc, a: Aux, fromX: number, fromZ: number): void {
    n.state = 'flee';
    n.fleeTime = PEDESTRIANS.fleeSeconds;
    n.fromX = fromX;
    n.fromZ = fromZ;
    a.turn = 0;
    a.anim.cancel(n.model);
    // Half the time the arms go into the 'panic' loop; otherwise the hands-up pose in tick() does it.
    a.panic = Math.random() < 0.5 && a.anim.play('panic', { loop: true });
  }

  function knockNpc(n: Npc, a: Aux, vx: number, vy: number, vz: number, spin: number, fromX: number, fromZ: number): boolean {
    a.upFromX = fromX;
    a.upFromZ = fromZ;
    if (n.state === 'ragdoll' && a.rag) {
      impulse(a.rag, vx, vy, vz, spin);
      return false;
    }
    const sp = n.state === 'flee' ? PEDESTRIANS.fleeSpeed : 0;
    a.anim.cancel(n.model);
    a.panic = false;
    a.rag = createRagdoll(n.x, heightAt(n.x, n.z), n.z, n.yaw, Math.sin(n.yaw) * sp, Math.cos(n.yaw) * sp);
    impulse(a.rag, vx, vy, vz, spin);
    n.state = 'ragdoll';
    clearHandsUp(n.model);
    return true;
  }

  function tickRagdoll(n: Npc, a: Aux, dt: number, world: World): void {
    const r = a.rag;
    if (!r) { n.state = 'walk'; return; }
    stepRagdoll(r, dt, world.boxes);
    const c = { x: 0, y: 0, z: 0 };
    ragdollCentre(r, c);
    const cl = clampToWorld(c.x, c.z, world.half, BODY_R);
    n.x = cl.x;
    n.z = cl.z;
    poseRagdoll(n.model, r);
    // Up again once it has lain still, or after a long tumble.
    if ((r.still > RAGDOLL_LIE && r.age > 0.6) || r.age > RAGDOLL_MAX) {
      a.rag = null;
      resetPose(n.model);
      n.yaw = Math.atan2(n.x - a.upFromX, n.z - a.upFromZ);
      n.model.object.position.set(n.x, heightAt(n.x, n.z), n.z);
      startFlee(n, a, a.upFromX, a.upFromZ);
      resetStuck(n, a);
    }
  }

  function seed(world: World, px: number, pz: number): void {
    seeded = true;
    for (let i = 0; i < PEDESTRIANS.count; i++) {
      const p = pickNear(world, px, pz, SPAWN_MIN_PLAYER, PEDESTRIANS.recycleDistance, npcs.list)
        ?? pickNear(world, px, pz, SPAWN_MIN_PLAYER, Infinity, npcs.list)
        ?? rnd(world.walkPoints);
      const look = biomeLookFor(p.x, p.z);
      const model = makeGnome(scene, look);
      model.object.position.set(p.x, heightAt(p.x, p.z), p.z);
      const n: Npc = {
        id: nextId++, name: randomGnomeName(), x: p.x, z: p.z, yaw: Math.random() * Math.PI * 2,
        state: 'walk', fleeTime: 0, fromX: p.x, fromZ: p.z, targetX: p.x, targetZ: p.z, look, model,
      };
      pickTarget(n, world, npcs.list);
      const a = freshAux(n.x, n.z);
      aux.set(n, a);
      npcs.list.push(n);
    }
  }

  function tick(n: Npc, dt: number, world: World, px: number, pz: number, vehicles: Vehicle[]): void {
    const a = getAux(n);
    a.clock += dt;

    // Scare: a speeding mower heading at a gnome makes it run.
    if (n.state === 'ragdoll') {
      tickRagdoll(n, a, dt, world);
      return;
    }

    // Run over: a fast vehicle that reaches a standing gnome flings it.
    for (const v of vehicles) {
      if (Math.abs(v.x - n.x) > 15 || Math.abs(v.z - n.z) > 15) continue;
      if (!runOverHit(v, n.x, n.z, BODY_R, dt)) continue;
      const dx = n.x - v.x, dz = n.z - v.z;
      const sp = v.speed;
      const dir = Math.sign(sp);
      const vx = Math.sin(v.yaw) * dir, vz = Math.cos(v.yaw) * dir;
      const side = (dx * vz - dz * vx) > 0 ? 1 : -1;
      const f = Math.min(Math.abs(sp), 30);
      // Forward with a little sideways kick, and up: faster is higher and spinnier.
      knockNpc(n, a, vx * f * 0.9 - vz * side * 2, 3 + f * 0.35, vz * f * 0.9 + vx * side * 2, 1.2 + f * 0.05, v.x, v.z);
      npcs.onRunOver?.(n, v);
      return;
    }

    if (n.state !== 'flee' && !n.calm) {
      const v = scaringVehicle(n, vehicles);
      if (v) startFlee(n, a, v.x, v.z);
    }

    // Recycle: a calm gnome far from the player reappears nearer the player.
    if (a.recycleT > 0) a.recycleT = Math.max(0, a.recycleT - dt);
    if (!n.quest && n.state !== 'flee' && a.recycleT <= 0 && Math.hypot(n.x - px, n.z - pz) > PEDESTRIANS.recycleDistance) {
      const c = pickNear(world, px, pz, RECYCLE_MIN, RECYCLE_MAX, npcs.list);
      // Never into a live cutscene's clear zones.
      const p = c && !inKeepOut(keepOut, c.x, c.z, 2) ? c : null;
      if (p) {
        n.x = p.x;
        n.z = p.z;
        n.state = 'walk';
        a.idle = 0;
        a.anim.cancel(n.model);
        pickTarget(n, world, npcs.list);
        resetStuck(n, a);
        n.model.object.position.set(n.x, heightAt(n.x, n.z), n.z);
      } else {
        // Nothing nearby is free: do not search again every frame.
        a.recycleT = 1;
      }
    }

    // Soft pedestrian-to-pedestrian separation so gnomes never stack into a single blob.
    let crowded = false;
    for (const o of npcs.list) {
      if (o === n || o.state === 'ragdoll') continue;
      const sdx = n.x - o.x;
      const sdz = n.z - o.z;
      const sd = Math.hypot(sdx, sdz);
      if (sd < 2.2) crowded = true;
      if (sd > 0.01 && sd < 1.3) {
        const push = (1.3 - sd) * 2.5 * dt;
        const p = pushOutOfBoxes(n.x + (sdx / sd) * push, n.z + (sdz / sd) * push, BODY_R, world.boxes, heightAt(n.x, n.z));
        const c = clampToWorld(p.x, p.z, world.half, BODY_R);
        n.x = c.x;
        n.z = c.z;
      }
    }

    // A live cutscene's clear zones: never walk into (or across) one; stand still rather than cross it.
    if (keepOut && !n.quest && n.state === 'walk' && !inKeepOut(keepOut, n.x, n.z)) {
      const into = (): boolean => inKeepOut(keepOut, n.targetX, n.targetZ, 1)
        || inKeepOut(keepOut, (n.x + n.targetX) / 2, (n.z + n.targetZ) / 2, 1);
      if (into()) {
        pickTarget(n, world, npcs.list);
        if (into()) {
          n.targetX = n.x;
          n.targetZ = n.z;
        }
      }
    }

    let moving = false;
    let speed = 0;

    if (n.state === 'flee') {
      n.fleeTime -= dt;
      if (n.fleeTime <= 0) {
        n.state = 'walk';
        a.turn = 0;
        a.panic = false;
        a.anim.stop();
        clearHandsUp(n.model);
        pickTarget(n, world, npcs.list);
        resetStuck(n, a);
      } else {
        // Run directly away from the source, with a sideways wobble.
        const away = Math.atan2(n.x - n.fromX, n.z - n.fromZ);
        const heading = away + a.turn + Math.sin(a.clock * 3) * 0.3;
        const blocked = moveAlong(n, world, dt, heading, PEDESTRIANS.fleeSpeed);
        if (blocked && a.turn === 0) a.turn = (Math.random() < 0.5 ? -1 : 1) * (Math.PI / 2);
        moving = true;
        speed = PEDESTRIANS.fleeSpeed;
      }
    } else if (n.state === 'walk') {
      const dx = n.targetX - n.x;
      const dz = n.targetZ - n.z;
      if (Math.hypot(dx, dz) < ARRIVE_DIST) {
        n.state = 'idle';
        a.idle = crowded ? 0.35 : IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN);
        if (!crowded && Math.random() < IDLE_ANIM_CHANCE) {
          a.anim.play(rnd(IDLE_BY_TRAIT[a.trait]), { offset: Math.random() });
          a.idle = Math.max(a.idle, IDLE_ANIM_MIN);
        }
      } else {
        moveAlong(n, world, dt, Math.atan2(dx, dz), PEDESTRIANS.walkSpeed);
        moving = true;
        speed = PEDESTRIANS.walkSpeed;
        a.stuckT += dt;
        if (a.stuckT >= STUCK_WINDOW) {
          if (Math.hypot(n.x - a.anchorX, n.z - a.anchorZ) < STUCK_DIST) pickTarget(n, world, npcs.list);
          resetStuck(n, a);
        }
      }
    } else {
      // idle
      if (crowded && a.idle > 0.35) a.idle = 0.35;
      a.idle -= dt;
      if (a.idle <= 0) {
        pickTarget(n, world, npcs.list);
        n.state = 'walk';
        a.anim.stop();
        resetStuck(n, a);
      }
    }

    // Animate. One shared state object; model.update() reads it synchronously. Far gnomes are posed every few frames
    // (animStride.ts) but placed every frame.
    const sp = moving ? speed : 0;
    const step = stepAnimClock(a.animClock, dt, animStride(Math.hypot(n.x - px, n.z - pz)));
    if (step > 0) {
      ps.position.set(n.x, heightAt(n.x, n.z), n.z);
      ps.velocity.set(Math.sin(n.yaw) * sp, 0, Math.cos(n.yaw) * sp);
      ps.facing = n.yaw;
      n.model.update(ps, step);
      if (n.state === 'flee') {
        if (!a.panic) poseHandsUp(n.model, a.clock);
      } else {
        clearHandsUp(n.model);
      }
      a.anim.apply(n.model, step);
    } else {
      n.model.object.position.set(n.x, heightAt(n.x, n.z), n.z);
      n.model.object.rotation.y = n.yaw;
    }
  }

  const npcs: Npcs = {
    list: [],

    update(dt: number, world: World, playerX: number, playerZ: number, vehicles: Vehicle[]) {
      if (!seeded && world.walkPoints.length > 0) seed(world, playerX, playerZ);

      // A live cutscene just started (behind its fade-in): calm gnomes inside its clear zones go elsewhere.
      if (purge && keepOut) {
        purge = false;
        for (const n of npcs.list) {
          if (n.quest || n.state === 'flee' || n.state === 'ragdoll' || !inKeepOut(keepOut, n.x, n.z, 1)) continue;
          const area = keepOut.find((k) => Math.hypot(n.x - k.x, n.z - k.z) < k.r + 1) ?? keepOut[0];
          let p = null;
          for (let i = 0; i < 6 && !p; i++) {
            const c = pickNear(world, area.x, area.z, area.r + 6, area.r + 45, npcs.list);
            if (c && !inKeepOut(keepOut, c.x, c.z, 2)) p = c;
          }
          if (!p) continue;
          n.x = p.x;
          n.z = p.z;
          getAux(n).anim.cancel(n.model);
          n.state = 'idle';
          n.targetX = p.x;
          n.targetZ = p.z;
          n.model.object.position.set(n.x, heightAt(n.x, n.z), n.z);
        }
      }

      for (const n of npcs.list) tick(n, dt, world, playerX, playerZ, vehicles);

      // Trim surplus pedestrians (fleeing ones stay): farthest calm gnomes go first.
      if (npcs.list.length > PEDESTRIANS.count + EXTRA_SLACK) {
        const calm = npcs.list
          .filter((n) => n.state !== 'flee' && n.state !== 'ragdoll' && !n.quest)
          .sort((a, b) => Math.hypot(b.x - playerX, b.z - playerZ) - Math.hypot(a.x - playerX, a.z - playerZ));
        for (const n of calm) {
          if (npcs.list.length <= PEDESTRIANS.count + EXTRA_SLACK) break;
          getAux(n).anim.cancel(n.model);
          scene.remove(n.model.object);
          npcs.list.splice(npcs.list.indexOf(n), 1);
        }
      }
    },

    setKeepOut(zones) {
      keepOut = zones && zones.length > 0 ? zones.slice() : null;
      purge = keepOut !== null;
    },

    hitTest(x: number, y: number, z: number): Npc | null {
      const rise = aboveGround(x, y, z);
      if (rise < 0 || rise > HIT_TOP) return null;
      let best: Npc | null = null;
      let bestD = Infinity;
      for (const n of npcs.list) {
        const d = Math.hypot(n.x - x, n.z - z);
        if (d < HIT_RADIUS && d < bestD) {
          best = n;
          bestD = d;
        }
      }
      return best;
    },

    crack(n: Npc, px: number, pz: number): void {
      fx.crack(n.x, heightAt(n.x, n.z) + 0.8, n.z, n.look.shirt);
      if (n.quest) {
        // A quest target is gone for good.
        scene.remove(n.model.object);
        const at = npcs.list.indexOf(n);
        if (at >= 0) npcs.list.splice(at, 1);
        return;
      }
      const ag = getAux(n);
      ag.anim.cancel(n.model);
      ag.panic = false;
      if (ag.rag) {
        ag.rag = null;
        resetPose(n.model);
      }
      const p = pickNear(_world, px, pz, RECYCLE_MIN, RECYCLE_MAX);
      if (p) {
        n.x = p.x;
        n.z = p.z;
        n.state = 'walk';
        const a = getAux(n);
        a.idle = 0;
        pickTarget(n, _world);
        resetStuck(n, a);
        n.model.object.position.set(n.x, heightAt(n.x, n.z), n.z);
      }
      clearHandsUp(n.model);
    },

    onRunOver: null,

    reactToHorn(x: number, z: number): string | null {
      const GRUMPY_LINES = [
        'Keep your hat on! I am walking here!',
        'Do I look like a driveway?!',
        'That horn is a municipal noise violation!',
        'Take it to the ring road, speed-freak!',
      ];
      let yelled: string | null = null;
      for (const n of npcs.list) {
        if (n.state === 'ragdoll' || n.calm) continue;
        const d = Math.hypot(n.x - x, n.z - z);
        if (d > 14) continue;
        const a = getAux(n);
        if (a.trait === 'grumpy') {
          n.yaw = Math.atan2(x - n.x, z - n.z);
          n.state = 'idle';
          a.idle = 2.0;
          a.anim.play('shake-fist');
          if (!yelled) yelled = `${n.name}: "${rnd(GRUMPY_LINES)}"`;
        } else if (d < 8) {
          startFlee(n, a, x, z);
        }
      }
      return yelled;
    },

    cheerAt(x: number, z: number): number {
      let count = 0;
      for (const n of npcs.list) {
        if (n.state === 'ragdoll' || n.state === 'flee') continue;
        if (Math.hypot(n.x - x, n.z - z) > 16) continue;
        const a = getAux(n);
        if (a.trait === 'spectator' || Math.random() < 0.35) {
          a.anim.play(a.trait === 'spectator' ? 'cheer' : 'clap');
          n.yaw = Math.atan2(x - n.x, z - n.z);
          count++;
        }
      }
      return count;
    },

    knock(n: Npc, vx: number, vy: number, vz: number, spin: number, fromX: number, fromZ: number): boolean {
      return knockNpc(n, getAux(n), vx, vy, vz, spin, fromX, fromZ);
    },

    spawnNamed(name: string, x: number, z: number, look: GnomeLook, questTarget: string): Npc {
      const model = makeGnome(scene, look);
      model.object.position.set(x, heightAt(x, z), z);
      const n: Npc = {
        id: nextId++, name, x, z, yaw: Math.random() * Math.PI * 2,
        state: 'idle', fleeTime: 0, fromX: x, fromZ: z, targetX: x, targetZ: z, look, model, quest: questTarget,
      };
      aux.set(n, freshAux(x, z));
      npcs.list.push(n);
      return n;
    },

    scare(n: Npc, fromX: number, fromZ: number): void {
      if (n.state === 'ragdoll') return;
      startFlee(n, getAux(n), fromX, fromZ);
    },

    spawnFleeing(x: number, z: number, fromX: number, fromZ: number, look: GnomeLook | null): Npc {
      const l = look ?? randomTownLook();
      const model = makeGnome(scene, l);
      model.object.position.set(x, heightAt(x, z), z);
      const n: Npc = {
        id: nextId++, name: randomGnomeName(), x, z, yaw: Math.atan2(x - fromX, z - fromZ),
        state: 'walk', fleeTime: 0, fromX, fromZ, targetX: x, targetZ: z, look: l, model,
      };
      const a = freshAux(x, z);
      aux.set(n, a);
      startFlee(n, a, fromX, fromZ);
      npcs.list.push(n);
      return n;
    },
  };
  return npcs;
}

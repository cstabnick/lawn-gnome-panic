// The player's gnome: click-to-move along an A* path, and walking to an entity to attack, talk or take.
import * as THREE from 'three';
import { createGnomeModel, getMyGnome } from '@lawn/gnome';
import type { GnomeModel } from '@lawn/gnome';
import { PLAYER_ID, SPAWN, TUNING, PLAYER_LOOK } from './config';
import { findPath3 } from './pathfind';
import type { Point3 } from './pathfind';
import { findFreeSpot, heightAt, standY } from './terrain';
import { getEntity } from './entities';
import { pickUpLoot } from './inventory';
import { bus } from './events';
import { objectPosition, useObject } from './objects';
import { equippedWeapon, state } from './state';
import { speedFactor } from './combat';
import { ITEMS } from './content';
import { createGearRig, syncGear } from './gear';

export type PlayerAction =
  | { type: 'attack' | 'talk' | 'take'; target: number; object?: undefined }
  // target is optional and undefined here so code that reads action.target still type-checks.
  | { type: 'use'; object: string; target?: undefined };

/** Walk distance (m) at which a use-object action fires. */
const OBJECT_USE_RANGE = 1.8;
/** Attack distance (m) for sling, blowpipe and thrown weapons. */
const RANGED_RANGE = 12;
const RANGED_CLASSES = new Set(['sling', 'blowpipe', 'thrown']);

export type AttackKind = 'chop' | 'thrust' | 'ranged' | 'cast';

export const player: {
  position: THREE.Vector3;
  facing: number;
  /** Current interaction; null = idle or just walking. combat.ts swings while action.type === 'attack' and in range. */
  action: PlayerAction | null;
  /** Remaining waypoints. */
  path: Point3[];
  model: GnomeModel | null;
  dead: boolean;
  /** Seconds left of the weapon-swing animation; combat.ts sets it to 0.35 on each swing or cast. */
  swing: number;
  /** Seconds left of the shield-block animation; combat.ts sets it when a shield blocks an attack. */
  block: number;
  /** Which weapon motion to play while `swing > 0`. */
  attackKind: AttackKind;
} = {
  position: new THREE.Vector3(SPAWN.x, 0, SPAWN.z), facing: 0, action: null, path: [], model: null, dead: false,
  swing: 0, block: 0, attackKind: 'chop',
};

const gearRig = createGearRig();

/** Re-syncs the 3D equipped gear on the player's gnome model. */
export function syncPlayerGear(): void {
  if (player.model) syncGear(gearRig, player.model, state.equipment);
}

/** Longest sub-step (m) of a walk, so the height follows ramps. */
const WALK_SUBSTEP = 0.25;
/** Seconds between re-paths while chasing a moving entity. */
const REPATH_SECONDS = 0.4;
/** Seconds since the last re-path (only counts while an action is set). */
let repathTimer = 0;
/** Velocity over the last frame, for the model's animation. */
const velocity = new THREE.Vector3();

export function createPlayer(scene: THREE.Scene): void {
  const model = createGnomeModel(getMyGnome()?.look ?? PLAYER_LOOK);
  model.object.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  scene.add(model.object);
  player.model = model;
  syncPlayerGear();
  player.position.y = heightAt(player.position.x, player.position.z);
}

/** Path from the player's current spot to (x, z), ending at height y (default: the ground there). */
function pathTo(x: number, z: number, y?: number): Point3[] {
  const from = { x: player.position.x, y: player.position.y, z: player.position.z };
  return findPath3(from, { x, y: y ?? heightAt(x, z), z }, standY);
}

/** Where the current action's target stands, or null if it is gone. */
function actionPoint(action: PlayerAction): { x: number; z: number } | null {
  if (action.type === 'use') {
    const p = objectPosition(action.object);
    return p ? { x: p.x, z: p.z } : null;
  }
  const e = getEntity(action.target);
  return e ? { x: e.position.x, z: e.position.z } : null;
}

/** Path to the current action's target, or no path if the target is gone. */
function repath(): void {
  const action = player.action;
  if (!action) return;
  const p = actionPoint(action);
  player.path = p ? pathTo(p.x, p.z) : [];
  repathTimer = 0;
}

/** Melee reach, or 12 m with a ranged weapon equipped. */
function attackRange(): number {
  const w = equippedWeapon();
  return w?.weaponClass && RANGED_CLASSES.has(w.weaponClass) ? RANGED_RANGE : TUNING.meleeRange;
}

/** Walk to a point (y: the height clicked, to tell a deck from the ground under it); cancels any action. */
export function walkTo(x: number, z: number, y?: number): void {
  if (player.dead) return;
  player.action = null;
  player.path = pathTo(x, z, y);
}

/** Walk to an entity and then attack / talk / take. */
export function interact(type: 'attack' | 'talk' | 'take', entityId: number): void {
  if (player.dead) return;
  player.action = { type, target: entityId };
  repath();
}

/** Walk to a world object and use it (its verb). */
export function useWorldObject(id: string): void {
  if (player.dead) return;
  if (!objectPosition(id)) return;
  player.action = { type: 'use', object: id };
  repath();
}

/** Stop moving and drop the action. */
export function stopPlayer(): void {
  player.path = [];
  player.action = null;
}

/** Place the player (respawn, load). Snaps to the nearest walkable spot if `(x, z)` is blocked. */
export function teleportPlayer(x: number, z: number): void {
  const spot = findFreeSpot(x, z);
  player.position.set(spot.x, heightAt(spot.x, spot.z), spot.z);
  player.path = [];
  player.action = null;
  player.dead = false;
  player.model?.setDead(false);
}

export function updatePlayer(dt: number): void {
  // 1. Dead: lie down and stop.
  if (player.dead) {
    velocity.set(0, 0, 0);
    player.model?.setDead(true);
    player.model?.update({ position: player.position, velocity, facing: player.facing, grounded: true, jumpsUsed: 0 }, dt);
    return;
  }

  // 2. Action: walk into range, then act.
  const action = player.action;
  if (action?.type === 'use') {
    const p = actionPoint(action);
    if (!p) {
      player.action = null;
      player.path = [];
    } else {
      const dist = Math.hypot(p.x - player.position.x, p.z - player.position.z);
      if (dist <= OBJECT_USE_RANGE) {
        player.path = [];
        player.facing = Math.atan2(p.x - player.position.x, p.z - player.position.z);
        const id = action.object;
        player.action = null;
        useObject(id);
      } else {
        repathTimer += dt;
        if (repathTimer >= REPATH_SECONDS) repath();
      }
    }
  } else if (action) {
    const e = getEntity(action.target);
    if (!e || e.dead) {
      player.action = null;
      player.path = [];
    } else {
      const range = action.type === 'attack' ? attackRange() : action.type === 'talk' ? TUNING.talkRange : TUNING.takeRange;
      const dist = Math.hypot(e.position.x - player.position.x, e.position.z - player.position.z);
      if (dist <= range) {
        player.path = [];
        player.facing = Math.atan2(e.position.x - player.position.x, e.position.z - player.position.z);
        if (action.type === 'talk') {
          bus.emit('talk', { npcId: e.defId, entityId: e.id });
          player.action = null;
        } else if (action.type === 'take') {
          pickUpLoot(e.id);
          player.action = null;
        }
        // attack: keep the action; combat.ts swings while in range.
      } else {
        repathTimer += dt;
        if (repathTimer >= REPATH_SECONDS) repath();
      }
    }
  }

  // 3. Move along the path at walk speed (scaled by Slowed / Rooted), in sub-steps of at most 0.25 m. Each sub-step
  // takes the height it lands on (standY), so ramps are climbed step by step; a step that cannot be taken ends the walk.
  const startX = player.position.x;
  const startZ = player.position.z;
  let x = startX;
  let z = startZ;
  let y = player.position.y;
  let remaining = TUNING.walkSpeed * dt * speedFactor(PLAYER_ID);
  while (remaining > 1e-6 && player.path.length > 0) {
    const wp = player.path[0];
    const dx = wp.x - x;
    const dz = wp.z - z;
    const dist = Math.hypot(dx, dz);
    if (dist <= 0.1) {
      player.path.shift();
      continue;
    }
    const stepLen = Math.min(remaining, dist, WALK_SUBSTEP);
    const nx = x + (dx / dist) * stepLen;
    const nz = z + (dz / dist) * stepLen;
    const ny = standY(nx, nz, y);
    if (ny === null) {
      // Blocked, or a deck edge: keep the last good spot and drop the path.
      player.path = [];
      break;
    }
    x = nx;
    z = nz;
    y = ny;
    remaining -= stepLen;
    player.facing = Math.atan2(dx, dz);
    if (Math.hypot(wp.x - x, wp.z - z) <= 0.1) player.path.shift();
  }
  player.position.x = x;
  player.position.z = z;
  velocity.set(dt > 0 ? (x - startX) / dt : 0, 0, dt > 0 ? (z - startZ) / dt : 0);

  // 4. Stand at the height the walk reached (set by standY above; a teleport sets it with heightAt).
  player.position.y = y;

  // 5. Sync equipped gear and animate the model.
  syncPlayerGear();
  player.model?.update({ position: player.position, velocity, facing: player.facing, grounded: true, jumpsUsed: 0 }, dt);

  // 6. Weapon swing / thrust / ranged / cast and shield block, after the model has set its arms.
  if (player.model) {
    player.model.rig.rotation.y = 0;
    player.model.arms.right.position.z = 0;

    if (player.swing > 0) {
      player.swing -= dt;
      const s = Math.sin(Math.PI * (1 - Math.max(0, player.swing) / 0.35));
      if (player.attackKind === 'thrust') {
        player.model.arms.right.rotation.x = -1.6 * s;
        player.model.arms.right.position.z = 0.14 * s;
      } else if (player.attackKind === 'ranged') {
        player.model.arms.right.rotation.x = -1.7 * s;
        player.model.arms.left.rotation.x = -0.7 * s;
      } else if (player.attackKind === 'cast') {
        player.model.arms.right.rotation.x = -1.9 * s;
        player.model.arms.left.rotation.x = -0.6 * s;
      } else {
        player.model.arms.right.rotation.x = -2.4 * s;
        player.model.rig.rotation.y = -0.35 * s;
      }
    }

    if (player.block > 0) {
      player.block -= dt;
      const b = Math.sin(Math.PI * (1 - Math.max(0, player.block) / 0.3));
      player.model.arms.left.rotation.x = -1.25 * b;
    } else if (player.action?.type === 'attack') {
      const offhandId = state.equipment.offhand;
      if (offhandId && ITEMS[offhandId]?.armorType === 'shield') {
        player.model.arms.left.rotation.x = Math.min(player.model.arms.left.rotation.x, -0.45);
      }
    }
  }
}

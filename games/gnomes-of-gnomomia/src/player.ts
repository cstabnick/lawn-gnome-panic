// The player's gnome: click-to-move along an A* path, and walking to an entity to attack, talk or take.
import * as THREE from 'three';
import { createGnomeModel, getMyGnome } from '@lawn/gnome';
import type { GnomeModel } from '@lawn/gnome';
import { SPAWN, TUNING, PLAYER_LOOK } from './config';
import { findPath } from './pathfind';
import { heightAt, isBlocked } from './world';
import { getEntity } from './entities';
import { pickUpLoot } from './inventory';
import { bus } from './events';

export type PlayerAction = { type: 'attack' | 'talk' | 'take'; target: number };

export const player: {
  position: THREE.Vector3;
  facing: number;
  /** Current interaction; null = idle or just walking. combat.ts swings while action.type === 'attack' and in range. */
  action: PlayerAction | null;
  /** Remaining waypoints. */
  path: { x: number; z: number }[];
  model: GnomeModel | null;
  dead: boolean;
  /** Seconds left of the weapon-swing animation; combat.ts sets it to 0.35 on each swing or cast. */
  swing: number;
} = { position: new THREE.Vector3(SPAWN.x, 0, SPAWN.z), facing: 0, action: null, path: [], model: null, dead: false, swing: 0 };

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
  player.position.y = heightAt(player.position.x, player.position.z);
}

/** Path from the player's current spot to (x, z). */
function pathTo(x: number, z: number): { x: number; z: number }[] {
  return findPath({ x: player.position.x, z: player.position.z }, { x, z }, isBlocked);
}

/** Path to the current action's target, or no path if the target is gone. */
function repath(): void {
  const action = player.action;
  if (!action) return;
  const e = getEntity(action.target);
  player.path = e ? pathTo(e.position.x, e.position.z) : [];
  repathTimer = 0;
}

/** Walk to a ground point; cancels any action. */
export function walkTo(x: number, z: number): void {
  if (player.dead) return;
  player.action = null;
  player.path = pathTo(x, z);
}

/** Walk to an entity and then attack / talk / take. */
export function interact(type: PlayerAction['type'], entityId: number): void {
  if (player.dead) return;
  player.action = { type, target: entityId };
  repath();
}

/** Stop moving and drop the action. */
export function stopPlayer(): void {
  player.path = [];
  player.action = null;
}

/** Place the player (respawn, load). */
export function teleportPlayer(x: number, z: number): void {
  player.position.set(x, heightAt(x, z), z);
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
  if (action) {
    const e = getEntity(action.target);
    if (!e || e.dead) {
      player.action = null;
      player.path = [];
    } else {
      const range = action.type === 'attack' ? TUNING.meleeRange : action.type === 'talk' ? TUNING.talkRange : TUNING.takeRange;
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

  // 3. Move along the path at walk speed.
  const startX = player.position.x;
  const startZ = player.position.z;
  let x = startX;
  let z = startZ;
  let remaining = TUNING.walkSpeed * dt;
  while (remaining > 1e-6 && player.path.length > 0) {
    const wp = player.path[0];
    const dx = wp.x - x;
    const dz = wp.z - z;
    const dist = Math.hypot(dx, dz);
    if (dist <= 0.1) {
      player.path.shift();
      continue;
    }
    const step = Math.min(remaining, dist);
    x += (dx / dist) * step;
    z += (dz / dist) * step;
    remaining -= step;
    player.facing = Math.atan2(dx, dz);
    if (Math.hypot(wp.x - x, wp.z - z) <= 0.1) player.path.shift();
  }
  player.position.x = x;
  player.position.z = z;
  velocity.set(dt > 0 ? (x - startX) / dt : 0, 0, dt > 0 ? (z - startZ) / dt : 0);

  // 4. Stick to the ground.
  player.position.y = heightAt(x, z);

  // 5. Animate the model.
  player.model?.update({ position: player.position, velocity, facing: player.facing, grounded: true, jumpsUsed: 0 }, dt);

  // 6. Weapon swing, after the model has set its arms: a chop forward and back.
  if (player.swing > 0 && player.model) {
    player.swing -= dt;
    player.model.arms.right.rotation.x = -2.4 * Math.sin(Math.PI * (1 - Math.max(0, player.swing) / 0.35));
  }
}

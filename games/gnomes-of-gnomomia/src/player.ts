// The player's gnome: click-to-move along an A* path, and walking to an entity to attack, talk or take.
import * as THREE from 'three';
import { createGnomeModel, getMyGnome } from '@lawn/gnome';
import type { GnomeModel } from '@lawn/gnome';
import { buildHeld } from '@lawn/prefabs';
import { PLAYER_ID, SPAWN, TUNING, PLAYER_LOOK, UI } from './config';
import { findPath3 } from './pathfind';
import type { Point3 } from './pathfind';
import { findFreeSpot, heightAt, standY } from './terrain';
import { getEntity } from './entities';
import { pickUpLoot } from './inventory';
import { bus, say } from './events';
import { objectPosition, useObject } from './objects';
import { equippedWeapon, state } from './state';
import { hasStatus, speedFactor } from './combat';
import { ITEMS } from './content';
import { createGearRig, syncGear } from './gear';

export type SitKind = 'seat' | 'rest';

export interface SitState {
  kind: SitKind;
  x: number;
  y: number;
  z: number;
  facing: number;
  standX: number;
  standY: number;
  standZ: number;
  label: string;
}

export type PlayerAction =
  | { type: 'attack' | 'talk' | 'take'; target: number; object?: undefined }
  // target is optional and undefined here so code that reads action.target still type-checks.
  | { type: 'use'; object: string; target?: undefined }
  | {
      type: 'sit';
      kind: SitKind;
      x: number;
      y: number;
      z: number;
      facing: number;
      approachX: number;
      approachZ: number;
      label: string;
      target?: undefined;
      object?: undefined;
    };

/** Walk distance (m) at which a use-object action fires. */
const OBJECT_USE_RANGE = 1.8;
/** Walk distance (m) at which a sit-on-seat action fires. */
const SEAT_SIT_RANGE = 1.4;
/** Walk distance (m) at which a sit-to-rest action fires. */
const REST_SIT_RANGE = 0.4;
/** Vertical offset from seat surface (or ground) to gnome's hip/origin when seated. */
const SEAT_HIP_OFFSET = 0.25;
const GROUND_HIP_OFFSET = 0.16;
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
  /** Non-null while seated on a seat or resting near a fire. */
  sitting: SitState | null;
  /** Seconds left of the shield-block animation; combat.ts sets it when a shield blocks an attack. */
  block: number;
  /** Which weapon motion to play while `swing > 0`. */
  attackKind: AttackKind;
} = {
  position: new THREE.Vector3(SPAWN.x, 0, SPAWN.z), facing: 0, action: null, path: [], model: null, dead: false,
  swing: 0, sitting: null, block: 0, attackKind: 'chop',
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
/** A* budget for those re-paths (about 0.15 s when the target cannot be reached; the first plan uses the default). */
const CHASE_PATH_EXPAND = 1500;
/** Extra seconds before the next re-path after one that did not reach the target. */
const CHASE_FAIL_WAIT_SECONDS = 2;
/** A re-path keeps the current path while it still ends this close to the target. */
const CHASE_KEEP_PATH_M = 1.5;
/** Seconds since the last re-path (only counts while an action is set). */
let repathTimer = 0;
/** Velocity over the last frame, for the model's animation. */
const velocity = new THREE.Vector3();

// Cosmetic smoking & drinking visuals (props, smoke puffs, arm gestures).
let cigGroup: THREE.Group | null = null;
let cigTip: THREE.Object3D | null = null;
let beerGroup: THREE.Group | null = null;
let sipTimer = 0;
let sipCycle = 0;
let puffGestureTimer = 0;
let smokeSpawnTimer = 0;
let tipsyTime = 0;

interface SmokePuff {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  age: number;
  life: number;
  vx: number;
  vz: number;
}
const smokePuffs: SmokePuff[] = [];
const puffWorld = new THREE.Vector3();

function buildCigProp(): { group: THREE.Group; tip: THREE.Object3D } {
  const group = buildHeld('clover-cig', { lights: false });
  group.position.set(0.03, 0.74, 0.16);
  group.rotation.set(Math.PI / 2 + 0.22, 0.25, 0);
  group.visible = false;
  const inner = group.children[0];
  const tip = inner?.children[inner.children.length - 1] ?? group;
  return { group, tip };
}

function buildBeerProp(): THREE.Group {
  const group = buildHeld('stout-tankard', { lights: false });
  group.position.set(0, -0.32, 0.05);
  group.visible = false;
  return group;
}

export function createPlayer(scene: THREE.Scene): void {
  const model = createGnomeModel(getMyGnome()?.look ?? PLAYER_LOOK);
  model.object.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  const cig = buildCigProp();
  model.rig.add(cig.group);
  cigGroup = cig.group;
  cigTip = cig.tip;

  beerGroup = buildBeerProp();
  model.arms.right.add(beerGroup);

  const puffGeo = new THREE.SphereGeometry(0.035, 6, 5);
  for (let i = 0; i < 10; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xdcdcdc, transparent: true, opacity: 0 });
    const mesh = new THREE.Mesh(puffGeo, mat);
    mesh.visible = false;
    scene.add(mesh);
    smokePuffs.push({ mesh, mat, age: 0, life: 1.4, vx: 0, vz: 0 });
  }

  bus.on('status', (e) => {
    if (e.target !== PLAYER_ID) return;
    if (e.status === 'tipsy') sipTimer = 1.6;
    if (e.status === 'smoking') puffGestureTimer = 1.1;
  });

  scene.add(model.object);
  player.model = model;
  syncPlayerGear();
  player.position.y = heightAt(player.position.x, player.position.z);
}

/** Path from the player's current spot to (x, z), ending at height y (default: the ground there). */
function pathTo(x: number, z: number, y?: number, maxExpand?: number): Point3[] {
  const from = { x: player.position.x, y: player.position.y, z: player.position.z };
  return findPath3(from, { x, y: y ?? heightAt(x, z), z }, standY, maxExpand);
}

/** Where the current action's target stands, or null if it is gone. */
function actionPoint(action: PlayerAction): { x: number; z: number } | null {
  if (action.type === 'use') {
    const p = objectPosition(action.object);
    return p ? { x: p.x, z: p.z } : null;
  }
  if (action.type === 'sit') {
    return { x: action.approachX, z: action.approachZ };
  }
  const e = getEntity(action.target);
  return e ? { x: e.position.x, z: e.position.z } : null;
}

/**
 * Path to the current action's target, or no path if the target is gone. The first plan (on the click) may search
 * far; the re-plans while chasing get a small budget, and one that cannot reach the target keeps the old path and
 * waits before trying again. An unreachable target (across water, behind a wall) used to cost a full search, about
 * 1.5 s with the game frozen and the music stalled, every REPATH_SECONDS.
 */
function repath(chasing = false): void {
  const action = player.action;
  if (!action) return;
  repathTimer = 0;
  const p = actionPoint(action);
  if (!p) {
    player.path = [];
    return;
  }
  // Still heading for where the target stands: nothing to plan.
  const last = player.path[player.path.length - 1];
  if (chasing && last && Math.hypot(last.x - p.x, last.z - p.z) <= CHASE_KEEP_PATH_M) return;
  const path = pathTo(p.x, p.z, undefined, chasing ? CHASE_PATH_EXPAND : undefined);
  const end = path[path.length - 1];
  const reached = !!end && Math.hypot(end.x - p.x, end.z - p.z) <= 1.5;
  if (!reached && chasing) {
    repathTimer = -CHASE_FAIL_WAIT_SECONDS;
    if (player.path.length > 0) return;
  }
  player.path = path;
}

/** Melee reach, or 12 m with a ranged weapon equipped. */
function attackRange(): number {
  const w = equippedWeapon();
  return w?.weaponClass && RANGED_CLASSES.has(w.weaponClass) ? RANGED_RANGE : TUNING.meleeRange;
}

/** Stand up if currently seated or resting, restoring the standing spot outside any seat collider. */
export function standUp(): void {
  const s = player.sitting;
  if (!s) return;
  if (s.kind === 'seat') {
    player.position.set(s.standX, s.standY, s.standZ);
  } else {
    player.position.y = heightAt(player.position.x, player.position.z);
  }
  player.sitting = null;
}

/** Walk to a point (y: the height clicked, to tell a deck from the ground under it); cancels any action. */
export function walkTo(x: number, z: number, y?: number): void {
  if (player.dead) return;
  standUp();
  player.action = null;
  player.path = pathTo(x, z, y);
}

/** Walk to an entity and then attack / talk / take. */
export function interact(type: 'attack' | 'talk' | 'take', entityId: number): void {
  if (player.dead) return;
  standUp();
  player.action = { type, target: entityId };
  repath();
}

/** Walk to a world object and use it (its verb). */
export function useWorldObject(id: string): void {
  if (player.dead) return;
  if (!objectPosition(id)) return;
  standUp();
  player.action = { type: 'use', object: id };
  repath();
}

/** Walk to a seat or fire-rest spot and sit down. */
export function sitAt(opts: { kind: SitKind; x: number; y: number; z: number; facing: number; label: string }): void {
  if (player.dead) return;
  standUp();
  const approach = findFreeSpot(opts.x, opts.z);
  const y = opts.kind === 'seat' ? opts.y - SEAT_HIP_OFFSET : heightAt(approach.x, approach.z) - GROUND_HIP_OFFSET;
  const x = opts.kind === 'seat' ? opts.x : approach.x;
  const z = opts.kind === 'seat' ? opts.z : approach.z;
  player.action = {
    type: 'sit',
    kind: opts.kind,
    x,
    y,
    z,
    facing: opts.facing,
    approachX: approach.x,
    approachZ: approach.z,
    label: opts.label,
  };
  repath();
}

/** Stop moving and drop the action. */
export function stopPlayer(): void {
  standUp();
  player.path = [];
  player.action = null;
}

/** Place the player (respawn, load). Snaps to the nearest walkable spot if `(x, z)` is blocked. */
export function teleportPlayer(x: number, z: number): void {
  player.sitting = null;
  const spot = findFreeSpot(x, z);
  player.position.set(spot.x, heightAt(spot.x, spot.z), spot.z);
  player.path = [];
  player.action = null;
  player.dead = false;
  player.model?.setDead(false);
}

function updateSmokePuffs(smoking: boolean, dt: number): void {
  if (smoking && cigTip) {
    smokeSpawnTimer -= dt;
    if (smokeSpawnTimer <= 0) {
      smokeSpawnTimer = 0.32;
      const slot = smokePuffs.find((p) => !p.mesh.visible);
      if (slot) {
        cigTip.getWorldPosition(puffWorld);
        slot.mesh.position.copy(puffWorld);
        slot.mesh.scale.setScalar(0.5);
        slot.mesh.visible = true;
        slot.age = 0;
        slot.life = 1.3;
        slot.vx = (Math.random() - 0.5) * 0.2;
        slot.vz = (Math.random() - 0.5) * 0.2;
      }
    }
  }
  for (const p of smokePuffs) {
    if (!p.mesh.visible) continue;
    p.age += dt;
    const t = p.age / p.life;
    if (t >= 1) {
      p.mesh.visible = false;
      continue;
    }
    p.mesh.position.y += dt * 0.55;
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.z += p.vz * dt;
    p.mesh.scale.setScalar(0.5 + t * 1.4);
    p.mat.opacity = 0.55 * (1 - t);
  }
}

function updateCosmetics(dt: number): void {
  const smoking = !player.dead && hasStatus(PLAYER_ID, 'smoking');
  const tipsy = !player.dead && hasStatus(PLAYER_ID, 'tipsy');

  if (cigGroup) cigGroup.visible = smoking;
  if (beerGroup) beerGroup.visible = tipsy;
  updateSmokePuffs(smoking, dt);

  if (!player.model) return;
  if (tipsy) {
    tipsyTime += dt;
    player.model.rig.rotation.z = Math.sin(tipsyTime * 2.6) * 0.08;
    sipCycle += dt;
    if (sipCycle >= 5.5) {
      sipCycle = 0;
      sipTimer = 1.4;
    }
  } else {
    tipsyTime = 0;
    sipCycle = 0;
    sipTimer = 0;
    player.model.rig.rotation.z = 0;
  }

  if (smoking) {
    if (puffGestureTimer > 0) puffGestureTimer = Math.max(0, puffGestureTimer - dt);
  } else {
    puffGestureTimer = 0;
  }

  if (player.swing <= 0) {
    if (sipTimer > 0) {
      sipTimer = Math.max(0, sipTimer - dt);
      const lift = Math.sin(Math.PI * (1 - sipTimer / 1.6));
      player.model.arms.right.rotation.x = -1.65 * lift;
      player.model.arms.right.rotation.z = -0.3 * lift;
    } else if (puffGestureTimer > 0) {
      const lift = Math.sin(Math.PI * (1 - puffGestureTimer / 1.1));
      player.model.arms.right.rotation.x = -1.3 * lift;
      player.model.arms.right.rotation.z = -0.25 * lift;
    } else {
      player.model.arms.right.rotation.z = 0;
    }
  } else {
    player.model.arms.right.rotation.z = 0;
  }
}

export function updatePlayer(dt: number): void {
  // 1. Dead: lie down and stop.
  if (player.dead) {
    player.sitting = null;
    velocity.set(0, 0, 0);
    player.model?.setDead(true);
    player.model?.update({ position: player.position, velocity, facing: player.facing, grounded: true, jumpsUsed: 0 }, dt);
    updateCosmetics(dt);
    return;
  }

  // 1b. Seated or resting: hold pose until the player walks or acts.
  if (player.sitting) {
    velocity.set(0, 0, 0);
    player.position.set(player.sitting.x, player.sitting.y, player.sitting.z);
    player.facing = player.sitting.facing;
    player.model?.update(
      { position: player.position, velocity, facing: player.facing, grounded: true, jumpsUsed: 0, sitting: true },
      dt,
    );
    return;
  }

  // 2. Action: walk into range, then act.
  const action = player.action;
  if (action?.type === 'sit') {
    const dist = Math.hypot(action.approachX - player.position.x, action.approachZ - player.position.z);
    const range = action.kind === 'seat' ? SEAT_SIT_RANGE : REST_SIT_RANGE;
    if (dist <= range) {
      player.path = [];
      player.action = null;
      player.sitting = {
        kind: action.kind,
        x: action.x,
        y: action.y,
        z: action.z,
        facing: action.facing,
        standX: player.position.x,
        standY: player.position.y,
        standZ: player.position.z,
        label: action.label,
      };
      player.position.set(action.x, action.y, action.z);
      player.facing = action.facing;
      if (action.kind === 'rest') say(`You sit near the ${action.label} and rest.`, UI.good);
      else say(`You sit on the ${action.label}.`, UI.textWhite);
      velocity.set(0, 0, 0);
      player.model?.update(
        { position: player.position, velocity, facing: player.facing, grounded: true, jumpsUsed: 0, sitting: true },
        dt,
      );
      return;
    }
  } else if (action?.type === 'use') {
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
        if (repathTimer >= REPATH_SECONDS) repath(true);
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
        if (repathTimer >= REPATH_SECONDS) repath(true);
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
    let nx = x + (dx / dist) * stepLen;
    let nz = z + (dz / dist) * stepLen;
    let ny = standY(nx, nz, y);
    if (ny === null) {
      // Slide along x or z if waypoint-popping tolerance caused a slight graze on a collider or bank.
      const sx = Math.abs(dx) > 1e-4 ? standY(nx, z, y) : null;
      const sz = Math.abs(dz) > 1e-4 ? standY(x, nz, y) : null;
      if (sx !== null && (sz === null || Math.abs(dx) >= Math.abs(dz))) {
        nz = z;
        ny = sx;
      } else if (sz !== null) {
        nx = x;
        ny = sz;
      } else {
        // Blocked, or a deck edge: keep the last good spot and drop the path.
        player.path = [];
        break;
      }
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

  // 7. Cosmetic smoking & drinking props, smoke puffs, and idle gestures.
  updateCosmetics(dt);
}

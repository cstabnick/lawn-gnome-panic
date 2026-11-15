// The world's population: NPCs, enemies with simple AI, and loot piles. Driven once per frame by updateEntities.
import * as THREE from 'three';
import { player } from './player';
import { heightAt, isBlocked } from './world';
import { enemyAttack } from './combat';
import { bus, say } from './events';
import { ENEMIES, NPCS, SPAWN_GROUPS, TUNING, UI } from './config';
import type { Entity, EnemyDef, InvSlot, NpcDef } from './config';
import { createEnemyRig, createNpcRig, createLootRig } from './models';
import type { CreatureRig } from './models';

/** Private per-entity AI state, kept beside the public Entity. */
interface Slot {
  entity: Entity;
  rig: CreatureRig;
  enemy?: EnemyDef;
  npc?: NpcDef;
  /** Current walk target (wander spot, or the player while chasing is handled inline). null = standing. */
  target: { x: number; z: number } | null;
  /** Enemy: seconds until the next wander pick. NPC: seconds of pause left. Loot: seconds left on the ground. */
  timer: number;
  /** Enemy is walking back to its home after leashing. */
  returning: boolean;
  /** Enemy: seconds since it died. */
  deadFor: number;
  /** How far the entity moved this frame, in units per second (drives the walk animation). */
  speed: number;
}

const slots = new Map<number, Slot>();
let nextId = 1;
let sceneRef: THREE.Scene | null = null;

/** Seeded random for the spawn layout, so every game places the same creatures. */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seconds an enemy stands still between wander picks. */
const wanderDelay = (): number => 3 + 4 * Math.random();
/** Seconds an NPC pauses between walks. */
const npcPause = (): number => 2 + 4 * Math.random();

/** Adds an entity: its rig becomes the entity's object, tagged with its id, and joins the scene. */
function addSlot(p: {
  kind: Entity['kind'];
  defId: string;
  name: string;
  level: number;
  x: number;
  z: number;
  rig: CreatureRig;
  hp: number;
  enemy?: EnemyDef;
  npc?: NpcDef;
  loot?: InvSlot[];
  gold?: number;
}): Slot {
  const id = nextId++;
  const home = new THREE.Vector3(p.x, heightAt(p.x, p.z), p.z);
  const entity: Entity = {
    id,
    kind: p.kind,
    defId: p.defId,
    name: p.name,
    level: p.level,
    position: home.clone(),
    home,
    facing: 0,
    object: p.rig.object,
    hp: p.hp,
    maxHp: p.hp,
    dead: false,
    inCombat: false,
    attackTimer: 0,
    sinceHit: Infinity,
    loot: p.loot ?? [],
    gold: p.gold ?? 0,
  };
  // Every node carries the id so a raycast hit on any part finds the entity.
  p.rig.object.traverse((o) => {
    o.userData.entityId = id;
  });
  if (sceneRef) sceneRef.add(p.rig.object);
  const slot: Slot = {
    entity,
    rig: p.rig,
    enemy: p.enemy,
    npc: p.npc,
    target: null,
    timer: 0,
    returning: false,
    deadFor: 0,
    speed: 0,
  };
  slots.set(id, slot);
  return slot;
}

/** Spawns every NPC in NPCS and every enemy in SPAWN_GROUPS. Call once after buildWorld. */
export function spawnWorldEntities(scene: THREE.Scene): void {
  sceneRef = scene;
  for (const s of slots.values()) scene.remove(s.entity.object);
  slots.clear();

  for (const def of Object.values(NPCS)) {
    const slot = addSlot({ kind: 'npc', defId: def.id, name: def.name, level: 0, x: def.x, z: def.z, rig: createNpcRig(def), hp: 1, npc: def });
    slot.timer = Math.random() * 4;
  }

  const rng = mulberry32(99);
  for (const group of SPAWN_GROUPS) {
    const def = ENEMIES[group.enemy];
    for (let i = 0; i < group.count; i++) {
      // Up to 10 tries for a free spot; the last try is used even if it is blocked.
      let x = group.x;
      let z = group.z;
      for (let tries = 0; tries < 10; tries++) {
        const a = rng() * Math.PI * 2;
        const r = Math.sqrt(rng()) * group.spread;
        x = group.x + Math.cos(a) * r;
        z = group.z + Math.sin(a) * r;
        if (!isBlocked(x, z)) break;
      }
      const slot = addSlot({ kind: 'enemy', defId: def.id, name: def.name, level: def.level, x, z, rig: createEnemyRig(def), hp: def.hp, enemy: def });
      slot.timer = Math.random() * 3;
    }
  }
}

/** Moves an entity toward (tx, tz) at `speed`. Tries the full step, then x only, then z only. Returns the speed used (0 if stuck). */
function walk(slot: Slot, tx: number, tz: number, speed: number, dt: number): number {
  const e = slot.entity;
  const p = e.position;
  const dx = tx - p.x;
  const dz = tz - p.z;
  const d = Math.hypot(dx, dz);
  if (d < 1e-3) return 0;
  const step = Math.min(speed * dt, d);
  const nx = p.x + (dx / d) * step;
  const nz = p.z + (dz / d) * step;
  let moved = false;
  if (!isBlocked(nx, nz)) {
    p.x = nx;
    p.z = nz;
    moved = true;
  } else if (!isBlocked(nx, p.z)) {
    p.x = nx;
    moved = true;
  } else if (!isBlocked(p.x, nz)) {
    p.z = nz;
    moved = true;
  }
  if (!moved) return 0;
  e.facing = Math.atan2(dx, dz);
  return speed;
}

/** Turns an entity to face (tx, tz). */
function face(slot: Slot, tx: number, tz: number): void {
  const p = slot.entity.position;
  slot.entity.facing = Math.atan2(tx - p.x, tz - p.z);
}

/** A random free point within `radius` of `home`, or null if none was found in 5 tries. */
function pickSpot(home: THREE.Vector3, radius: number): { x: number; z: number } | null {
  for (let tries = 0; tries < 5; tries++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius;
    const x = home.x + Math.cos(a) * r;
    const z = home.z + Math.sin(a) * r;
    if (!isBlocked(x, z)) return { x, z };
  }
  return null;
}

function updateEnemy(slot: Slot, def: EnemyDef, dt: number): void {
  const e = slot.entity;

  if (e.dead) {
    // Lies dead for a while, then vanishes; after its respawn time it returns home.
    slot.deadFor += dt;
    if (slot.deadFor >= 1.5) e.object.visible = false;
    if (slot.deadFor >= def.respawnSeconds) {
      e.position.copy(e.home);
      e.hp = e.maxHp;
      e.dead = false;
      e.inCombat = false;
      e.attackTimer = 0;
      e.sinceHit = Infinity;
      e.object.visible = true;
      slot.rig.setDead(false);
      slot.returning = false;
      slot.target = null;
      slot.deadFor = 0;
      slot.timer = wanderDelay();
    }
    return;
  }

  e.attackTimer -= dt;
  const pp = player.position;
  const toPlayer = Math.hypot(pp.x - e.position.x, pp.z - e.position.z);
  const homeDist = Math.hypot(e.position.x - e.home.x, e.position.z - e.home.z);
  const playerFromHome = Math.hypot(pp.x - e.home.x, pp.z - e.home.z);

  // Aggro: an aggressive enemy starts a fight when the player comes near and is not too far from home.
  if (!e.inCombat && def.aggressive && !player.dead && toPlayer < TUNING.aggroRange && playerFromHome < TUNING.leashRange) {
    e.inCombat = true;
    slot.returning = false;
  }

  if (e.inCombat) {
    if (player.dead || homeDist > TUNING.leashRange) {
      // Give up: heal and walk home (handled below).
      e.inCombat = false;
      e.hp = e.maxHp;
      slot.returning = true;
    } else {
      if (toPlayer > TUNING.meleeRange * 0.9) {
        slot.speed = walk(slot, pp.x, pp.z, TUNING.enemyWalkSpeed, dt);
      } else {
        face(slot, pp.x, pp.z);
        if (e.attackTimer <= 0) {
          enemyAttack(e);
          slot.rig.swing();
          e.attackTimer = def.attackSeconds;
        }
      }
      return;
    }
  }

  if (slot.returning) {
    if (homeDist < 0.3) {
      slot.returning = false;
    } else {
      slot.speed = walk(slot, e.home.x, e.home.z, TUNING.enemyWalkSpeed, dt);
      if (slot.speed === 0) slot.returning = false; // stuck: stop trying
      return;
    }
  }

  // Idle: every few seconds pick a new spot near home and amble there at half speed.
  slot.timer -= dt;
  if (slot.timer <= 0) {
    slot.timer = wanderDelay();
    slot.target = pickSpot(e.home, TUNING.wanderRadius);
  }
  if (slot.target) {
    const t = slot.target;
    slot.speed = walk(slot, t.x, t.z, TUNING.enemyWalkSpeed * 0.5, dt);
    if (slot.speed === 0 || Math.hypot(t.x - e.position.x, t.z - e.position.z) < 0.1) slot.target = null;
  }
}

function updateNpc(slot: Slot, def: NpcDef, dt: number): void {
  const e = slot.entity;
  const pp = player.position;

  // Stop and face the player when close.
  if (Math.hypot(pp.x - e.position.x, pp.z - e.position.z) < 3.5) {
    slot.target = null;
    face(slot, pp.x, pp.z);
    return;
  }
  if (def.wander === 0) {
    e.facing = 0; // stands still, facing +z
    return;
  }

  if (!slot.target) {
    // Pausing between walks.
    slot.timer -= dt;
    if (slot.timer <= 0) {
      slot.target = pickSpot(e.home, def.wander);
      if (!slot.target) slot.timer = 0.5; // no spot found: try again soon
    }
    return;
  }
  const t = slot.target;
  slot.speed = walk(slot, t.x, t.z, 1.2, dt);
  if (slot.speed === 0 || Math.hypot(t.x - e.position.x, t.z - e.position.z) < 0.1) {
    slot.target = null;
    slot.timer = npcPause();
  }
}

function updateLoot(slot: Slot, dt: number): void {
  slot.timer -= dt;
  if (slot.timer <= 0) removeEntity(slot.entity.id);
}

export function updateEntities(dt: number): void {
  // Snapshot: a loot pile may be removed while we loop.
  for (const slot of Array.from(slots.values())) {
    if (!slots.has(slot.entity.id)) continue;
    const e = slot.entity;
    e.sinceHit += dt;
    slot.speed = 0;
    if (slot.enemy) updateEnemy(slot, slot.enemy, dt);
    else if (slot.npc) updateNpc(slot, slot.npc, dt);
    else updateLoot(slot, dt);
    e.position.y = heightAt(e.position.x, e.position.z);
    slot.rig.update(e.position, e.facing, slot.speed, dt);
  }
}

export function getEntity(id: number): Entity | undefined {
  return slots.get(id)?.entity;
}

/** Every live entity (dead enemies included, check .dead). */
export function allEntities(): readonly Entity[] {
  return Array.from(slots.values(), (s) => s.entity);
}

/** The entity a raycast hit belongs to (walks up parents for userData.entityId). */
export function entityFromObject(obj: THREE.Object3D): Entity | undefined {
  let o: THREE.Object3D | null = obj;
  while (o) {
    const id = o.userData.entityId;
    if (typeof id === 'number') return getEntity(id);
    o = o.parent;
  }
  return undefined;
}

/** Kill an enemy: death pose, loot pile, 'enemy-killed', respawn timer. */
export function killEntity(id: number): void {
  const slot = slots.get(id);
  if (!slot || !slot.enemy || slot.entity.dead) return;
  const e = slot.entity;
  const def = slot.enemy;
  e.dead = true;
  e.hp = 0;
  e.inCombat = false;
  slot.returning = false;
  slot.target = null;
  slot.deadFor = 0;
  slot.rig.setDead(true);

  const items: InvSlot[] = [];
  for (const drop of def.loot) {
    if (Math.random() < drop.chance) items.push({ item: drop.item, count: drop.count ?? 1 });
  }
  const gold = def.gold[0] + Math.floor(Math.random() * (def.gold[1] - def.gold[0] + 1));
  if (items.length > 0 || gold > 0) spawnLoot(e.position.x, e.position.z, items, gold);

  bus.emit('enemy-killed', { defId: def.id, entityId: id });
  say(`You defeated the ${def.name}.`, UI.good);
}

export function spawnLoot(x: number, z: number, items: InvSlot[], gold: number): Entity | null {
  const slot = addSlot({
    kind: 'loot',
    defId: 'loot',
    name: 'Loot',
    level: 0,
    x,
    z,
    rig: createLootRig(),
    hp: 1,
    loot: items.map((i) => ({ ...i })),
    gold,
  });
  slot.timer = TUNING.lootSeconds;
  return slot.entity;
}

/** Remove an entity (a looted pile) from the world for good. */
export function removeEntity(id: number): void {
  const slot = slots.get(id);
  if (!slot) return;
  sceneRef?.remove(slot.entity.object);
  slots.delete(id);
}

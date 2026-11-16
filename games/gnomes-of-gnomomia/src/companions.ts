// Clueless AI gnome companions that follow the player, magically keep up with their level and zone,
// mildly compete for loot, and sync over the MMO relay so every player's world feels fuller.
import * as THREE from 'three';
import { createGnomeModel, type GnomeModel } from '@lawn/gnome';
import { TUNING, look, type Entity } from './config';
import { dealDamage } from './combat';
import { allEntities, removeEntity } from './entities';
import { bus } from './events';
import { player } from './player';
import { state } from './state';
import { findFreeSpot, standY } from './terrain';
import type { CompanionPose } from './net/protocol';

const COMPANION_COUNT = 3;
const COMPANION_ATTACKER_ID = -2;
const ORBIT_MIN = 3.0;
const ORBIT_MAX = 9.5;
const SPRINT_DIST = 15;
const TELEPORT_DIST = 28;
const FIGHT_SEARCH_RADIUS = 11;
const FORAGE_SEARCH_RADIUS = 14;
const FORAGE_PLAYER_BUFFER = 2.8;
const MELEE_RANGE = 1.9;
const SWING_ANIM_S = 0.35;
const RESPAWN_S = 6;
const WALK_SUBSTEP = 0.25;

const HAT_COLORS = [0x3b8a57, 0x3b6ea5, 0xc46b28, 0x8b4ca5, 0xc49e28, 0x2f8f8f];
const SHIRT_COLORS = [0x6e5438, 0x3f5475, 0x7c4632, 0x57416b, 0x4b6344, 0x5f5f5f];
const BEARD_COLORS = [0xd8c8a8, 0xb88c5a, 0x8f5d38, 0xe8e2d5, 0x7a6855];

const NAMES = [
  'Barnaby', 'Sprout', 'Pebble', 'Gnomercy', 'Bramble', 'Twig', 'Mossy',
  'Thimble', 'Wobbles', 'Turnip', 'Pippin', 'Crumb', 'Dandelion', 'Clover',
];

const IDLE_LINES = [
  'Nice moss.',
  'Did that bush just blink?',
  'I forgot why we came here.',
  'Is that a beetle or a pebble?',
  'I am contributing!',
  'Wait for me!',
  'My boots are full of dew.',
];

const FORAGE_LINES = [
  'Ooh, shiny!',
  'Dibbs!',
  'Found a coin!',
  'Yoink!',
];

const FIGHT_LINES = [
  'Take that! ...I think.',
  'Did I help?',
  'Have at thee, foul lawn!',
];

type Mood = 'wander' | 'admire' | 'npc' | 'forage' | 'fight';

export interface CompanionBubble {
  text: string;
  until: number;
}

export interface CompanionView {
  readonly id: number;
  readonly name: string;
  readonly position: THREE.Vector3;
  readonly level: number;
  readonly hp: number;
  readonly hpMax: number;
  readonly dead: boolean;
  readonly bubble: CompanionBubble | null;
}

interface Companion {
  id: number;
  name: string;
  hatColor: number;
  shirtColor: number;
  position: THREE.Vector3;
  facing: number;
  model: GnomeModel;
  level: number;
  hp: number;
  hpMax: number;
  dead: boolean;
  respawnS: number;
  swing: number;
  swings: number;
  attackTimer: number;
  stealCooldown: number;
  bonkTimer: number;
  mood: Mood;
  moodTimer: number;
  target: { x: number; z: number } | null;
  targetEntityId: number | null;
  admireSpin: number;
  bubble: CompanionBubble | null;
}

const companions: Companion[] = [];
const scratchVel = new THREE.Vector3();
let sceneRef: THREE.Scene | null = null;

function pickNames(count: number): string[] {
  const pool = [...NAMES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function maxHpForLevel(level: number): number {
  return Math.round(14 + level * 4);
}

function sayBubble(c: Companion, lines: readonly string[], chance = 1): void {
  if (Math.random() > chance) return;
  const text = lines[Math.floor(Math.random() * lines.length)];
  c.bubble = { text, until: performance.now() + 3400 };
}

function randomSpotNearPlayer(minR = ORBIT_MIN, maxR = ORBIT_MAX): { x: number; z: number } {
  const a = Math.random() * Math.PI * 2;
  const r = minR + Math.random() * (maxR - minR);
  const spot = findFreeSpot(player.position.x + Math.cos(a) * r, player.position.z + Math.sin(a) * r, 4);
  return { x: spot.x, z: spot.z };
}

function teleportNearPlayer(c: Companion): void {
  const spot = randomSpotNearPlayer(2.5, 6.5);
  const y = standY(spot.x, spot.z, player.position.y) ?? player.position.y;
  c.position.set(spot.x, y, spot.z);
  c.target = null;
  c.targetEntityId = null;
}

function findLootTarget(c: Companion): Entity | null {
  let best: Entity | null = null;
  let bestDist = FORAGE_SEARCH_RADIUS;
  for (const e of allEntities()) {
    if (e.kind !== 'loot' || e.dead) continue;
    if (e.gold <= 0 && e.loot.length === 0) continue;
    const distToPlayer = Math.hypot(e.position.x - player.position.x, e.position.z - player.position.z);
    if (distToPlayer < FORAGE_PLAYER_BUFFER) continue;
    const d = Math.hypot(e.position.x - c.position.x, e.position.z - c.position.z);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  return best;
}

function findEnemyTarget(c: Companion): Entity | null {
  let best: Entity | null = null;
  let bestDist = FIGHT_SEARCH_RADIUS;
  for (const e of allEntities()) {
    if (e.kind !== 'enemy' || e.dead) continue;
    const d = Math.hypot(e.position.x - c.position.x, e.position.z - c.position.z);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  return best;
}

function findNpcTarget(c: Companion): Entity | null {
  let best: Entity | null = null;
  let bestDist = 12;
  for (const e of allEntities()) {
    if (e.kind !== 'npc' || e.dead) continue;
    const d = Math.hypot(e.position.x - c.position.x, e.position.z - c.position.z);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  return best;
}

function nibbleLoot(c: Companion, e: Entity): void {
  let took = false;
  if (e.gold > 0) {
    const amt = e.gold > 2 ? 2 : 1;
    e.gold -= amt;
    took = true;
  } else if (e.loot.length > 0 && e.loot[0].count > 1) {
    e.loot[0].count -= 1;
    took = true;
  } else if (e.loot.length > 1) {
    e.loot.shift();
    took = true;
  }
  if (e.gold <= 0 && e.loot.length === 0) {
    removeEntity(e.id);
  }
  if (took) {
    c.stealCooldown = 11 + Math.random() * 6;
    sayBubble(c, FORAGE_LINES, 0.85);
  }
}

function chooseMood(c: Companion): void {
  const roll = Math.random();
  if (c.stealCooldown <= 0 && roll < 0.35) {
    const loot = findLootTarget(c);
    if (loot) {
      c.mood = 'forage';
      c.targetEntityId = loot.id;
      c.target = { x: loot.position.x, z: loot.position.z };
      c.moodTimer = 5;
      return;
    }
  }
  const enemy = findEnemyTarget(c);
  if (enemy && roll < 0.7) {
    c.mood = 'fight';
    c.targetEntityId = enemy.id;
    c.target = null;
    c.moodTimer = 4 + Math.random() * 3;
    return;
  }
  if (roll < 0.82) {
    const npc = findNpcTarget(c);
    if (npc) {
      c.mood = 'npc';
      c.targetEntityId = npc.id;
      c.target = { x: npc.position.x, z: npc.position.z };
      c.moodTimer = 3.5 + Math.random() * 2;
      return;
    }
  }
  if (roll < 0.92) {
    c.mood = 'wander';
    c.targetEntityId = null;
    c.target = randomSpotNearPlayer();
    c.moodTimer = 3 + Math.random() * 3;
    return;
  }
  c.mood = 'admire';
  c.targetEntityId = null;
  c.target = null;
  c.admireSpin = (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 1.4);
  c.moodTimer = 1.8 + Math.random() * 1.8;
  sayBubble(c, IDLE_LINES, 0.35);
}

function moveToward(c: Companion, tx: number, tz: number, speed: number, dt: number): boolean {
  let x = c.position.x;
  let z = c.position.z;
  let y = c.position.y;
  const dx = tx - x;
  const dz = tz - z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.15) return false;
  c.facing = Math.atan2(dx, dz);

  let remaining = Math.min(dist, speed * dt);
  let moved = false;
  while (remaining > 1e-5) {
    const step = Math.min(remaining, WALK_SUBSTEP);
    const nx = x + (dx / dist) * step;
    const nz = z + (dz / dist) * step;
    const ny = standY(nx, nz, y);
    if (ny === null) break;
    x = nx;
    z = nz;
    y = ny;
    remaining -= step;
    moved = true;
  }
  c.position.set(x, y, z);
  return moved;
}

function stepCompanion(c: Companion, dt: number): void {
  // Sync level magically with the player.
  if (c.level !== state.level) {
    c.level = state.level;
    const prevMax = c.hpMax;
    c.hpMax = maxHpForLevel(c.level);
    c.hp = Math.min(c.hpMax, c.hp + Math.max(0, c.hpMax - prevMax));
  }

  if (c.bubble && performance.now() >= c.bubble.until) c.bubble = null;

  if (c.dead) {
    c.respawnS -= dt;
    if (c.respawnS <= 0) {
      c.dead = false;
      c.hp = c.hpMax;
      c.model.setDead(false);
      teleportNearPlayer(c);
      c.mood = 'wander';
      c.moodTimer = 1.5;
      sayBubble(c, ["I'm okay!", 'Tis but a grass stain.'], 0.8);
    }
    scratchVel.set(0, 0, 0);
    c.model.setDead(true);
    c.model.update({ position: c.position, velocity: scratchVel, facing: c.facing, grounded: true, jumpsUsed: 0 }, dt);
    return;
  }

  c.attackTimer -= dt;
  c.stealCooldown -= dt;
  c.bonkTimer -= dt;
  c.moodTimer -= dt;
  if (c.swing > 0) c.swing = Math.max(0, c.swing - dt);

  const distToPlayer = Math.hypot(player.position.x - c.position.x, player.position.z - c.position.z);
  const heightDiff = Math.abs(player.position.y - c.position.y);
  if (distToPlayer > TELEPORT_DIST || heightDiff > 8) {
    teleportNearPlayer(c);
  }

  const prevX = c.position.x;
  const prevZ = c.position.z;
  const baseSpeed = TUNING.walkSpeed * 0.95;

  if (distToPlayer > SPRINT_DIST) {
    moveToward(c, player.position.x, player.position.z, baseSpeed * 1.25, dt);
  } else {
    if (c.moodTimer <= 0) chooseMood(c);

    if (c.mood === 'forage') {
      const e = c.targetEntityId !== null ? allEntities().find((ent) => ent.id === c.targetEntityId) : undefined;
      if (!e || e.kind !== 'loot' || (e.gold <= 0 && e.loot.length === 0)) {
        chooseMood(c);
      } else {
        const d = Math.hypot(e.position.x - c.position.x, e.position.z - c.position.z);
        if (d <= TUNING.takeRange) {
          c.facing = Math.atan2(e.position.x - c.position.x, e.position.z - c.position.z);
          nibbleLoot(c, e);
          chooseMood(c);
        } else {
          moveToward(c, e.position.x, e.position.z, baseSpeed, dt);
        }
      }
    } else if (c.mood === 'fight') {
      const e = c.targetEntityId !== null ? allEntities().find((ent) => ent.id === c.targetEntityId) : undefined;
      if (!e || e.kind !== 'enemy' || e.dead) {
        chooseMood(c);
      } else {
        const d = Math.hypot(e.position.x - c.position.x, e.position.z - c.position.z);
        if (d > MELEE_RANGE) {
          moveToward(c, e.position.x, e.position.z, baseSpeed, dt);
        } else {
          c.facing = Math.atan2(e.position.x - c.position.x, e.position.z - c.position.z);
          if (c.attackTimer <= 0) {
            c.attackTimer = 2.0 + Math.random() * 0.7;
            c.swing = SWING_ANIM_S;
            c.swings += 1;
            if (Math.random() < 0.3) {
              sayBubble(c, ['Missed!', 'Whoa, slippery grass.'], 0.45);
            } else {
              const dmg = Math.max(1, Math.round(1 + c.level * 0.35));
              dealDamage(e.id, dmg, 'crush', { attacker: COMPANION_ATTACKER_ID });
              sayBubble(c, FIGHT_LINES, 0.18);
            }
          }
          // Comical occasional bonk back so companion HP moves and they sometimes take a dirt nap.
          if (c.bonkTimer <= 0) {
            c.bonkTimer = 3.5 + Math.random() * 2.5;
            if (Math.random() < 0.45) {
              c.hp -= Math.max(1, Math.round(1 + e.level * 0.3));
              if (c.hp <= 0) {
                c.hp = 0;
                c.dead = true;
                c.respawnS = RESPAWN_S;
                c.model.setDead(true);
                sayBubble(c, ['Oof!', 'Nap time...'], 0.9);
              }
            }
          }
        }
      }
    } else if (c.mood === 'npc') {
      const e = c.targetEntityId !== null ? allEntities().find((ent) => ent.id === c.targetEntityId) : undefined;
      if (!e || e.kind !== 'npc') {
        chooseMood(c);
      } else {
        const d = Math.hypot(e.position.x - c.position.x, e.position.z - c.position.z);
        if (d > 2.2) moveToward(c, e.position.x, e.position.z, baseSpeed * 0.9, dt);
        else c.facing = Math.atan2(e.position.x - c.position.x, e.position.z - c.position.z);
      }
    } else if (c.mood === 'wander') {
      if (!c.target) c.target = randomSpotNearPlayer();
      const d = Math.hypot(c.target.x - c.position.x, c.target.z - c.position.z);
      if (d < 0.5 || !moveToward(c, c.target.x, c.target.z, baseSpeed * 0.9, dt)) {
        c.mood = 'admire';
        c.moodTimer = 1.2 + Math.random() * 1.2;
      }
    } else {
      c.facing += c.admireSpin * dt;
    }
  }

  const vx = dt > 0 ? (c.position.x - prevX) / dt : 0;
  const vz = dt > 0 ? (c.position.z - prevZ) / dt : 0;
  scratchVel.set(vx, 0, vz);
  c.model.update({ position: c.position, velocity: scratchVel, facing: c.facing, grounded: true, jumpsUsed: 0 }, dt);
  if (c.swing > 0) {
    c.model.arms.right.rotation.x = -2.4 * Math.sin(Math.PI * (1 - Math.max(0, c.swing) / SWING_ANIM_S));
  }
}

export function initCompanions(scene: THREE.Scene): void {
  sceneRef = scene;
  const names = pickNames(COMPANION_COUNT);
  for (let i = 0; i < COMPANION_COUNT; i++) {
    const hatColor = HAT_COLORS[i % HAT_COLORS.length];
    const shirtColor = SHIRT_COLORS[i % SHIRT_COLORS.length];
    const beardColor = BEARD_COLORS[i % BEARD_COLORS.length];
    const model = createGnomeModel(look(hatColor, shirtColor, beardColor));
    model.object.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    sceneRef.add(model.object);

    const spot = randomSpotNearPlayer(2.5, 6);
    const y = standY(spot.x, spot.z, player.position.y) ?? player.position.y;
    const level = state.level;
    const hpMax = maxHpForLevel(level);

    companions.push({
      id: i,
      name: names[i],
      hatColor,
      shirtColor,
      position: new THREE.Vector3(spot.x, y, spot.z),
      facing: Math.random() * Math.PI * 2,
      model,
      level,
      hp: hpMax,
      hpMax,
      dead: false,
      respawnS: 0,
      swing: 0,
      swings: 0,
      attackTimer: 1 + Math.random(),
      stealCooldown: 4 + Math.random() * 6,
      bonkTimer: 3 + Math.random() * 3,
      mood: 'wander',
      moodTimer: 1 + Math.random() * 2,
      target: null,
      targetEntityId: null,
      admireSpin: 0,
      bubble: null,
    });
  }

  bus.on('zone-changed', () => {
    for (const c of companions) teleportNearPlayer(c);
  });
}

export function updateCompanions(dt: number): void {
  for (const c of companions) stepCompanion(c, dt);
}

export function localCompanions(): readonly CompanionView[] {
  return companions;
}

const r2 = (v: number): number => Math.round(v * 100) / 100;

export function companionPoses(): CompanionPose[] {
  return companions.map((c) => [
    c.id,
    c.name,
    r2(c.position.x),
    r2(c.position.z),
    r2(c.facing),
    c.dead ? 1 : 0,
    c.swings,
    r2(c.position.y),
    c.hatColor,
    c.shirtColor,
  ]);
}

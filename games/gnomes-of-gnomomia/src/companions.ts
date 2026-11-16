// Independent AI gnome players roaming Gnomomia: each has a personality, flavor-matched name,
// class, and quest progression drawn from the player's active quests and recent prior quests,
// making the world feel like a living MMO even with single-digit real players.
import * as THREE from 'three';
import { createGnomeModel, type GnomeModel } from '@lawn/gnome';
import { TUNING, WORLD, look, type ClassId, type Entity, type ZoneId } from './config';
import { ENEMIES, NPCS, OBJECTS, QUESTS, SPAWNS, ZONES } from './content';
import { dealDamage } from './combat';
import { allEntities, removeEntity } from './entities';
import { bus } from './events';
import { findPath3, type Point3 } from './pathfind';
import { player } from './player';
import { state } from './state';
import { findFreeSpot, heightAt, standY, zoneAt } from './terrain';
import { isTeleportExit } from './zones';
import type { CompanionPose } from './net/protocol';
import {
  createCompanionRoster, nextZoneExit, resolveStageTarget, selectQuestPools,
  type CompanionPersonalityId, type PersonalityDef,
} from './companionLogic';

const COMPANION_COUNT = 6;
const COMPANION_ATTACKER_ID = -2;
const FORAGE_SEARCH_RADIUS = 13;
const FORAGE_PLAYER_BUFFER = 2.8;
const MELEE_RANGE = 1.9;
const SWING_ANIM_S = 0.35;
const RESPAWN_S = 6;
const WALK_SUBSTEP = 0.25;
const SIM_FIGHT_SWINGS = 3;

type Role = 'current' | 'prior';
type Activity = 'quest' | 'forage' | 'admire';

export interface CompanionBubble {
  text: string;
  until: number;
}

export interface CompanionView {
  readonly id: number;
  readonly name: string;
  readonly personality: CompanionPersonalityId;
  readonly classId: ClassId | null;
  readonly plateColor: string;
  readonly position: THREE.Vector3;
  readonly level: number;
  readonly hp: number;
  readonly hpMax: number;
  readonly dead: boolean;
  readonly bubble: CompanionBubble | null;
}

interface Companion {
  id: number;
  role: Role;
  personality: CompanionPersonalityId;
  personalityDef: PersonalityDef;
  plateColor: string;
  name: string;
  classId: ClassId;
  hatColor: number;
  shirtColor: number;
  zone: ZoneId;
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
  simSwings: number;
  stealCooldown: number;
  bonkTimer: number;
  activity: Activity;
  activityTimer: number;
  pauseTimer: number;
  admireSpin: number;
  stuckTimer: number;
  lastProgressPos: { x: number; z: number };
  path: Point3[];
  targetEntityId: number | null;
  questId: string | null;
  questStage: number;
  questCount: number;
  bubble: CompanionBubble | null;
}

const companions: Companion[] = [];
const scratchVel = new THREE.Vector3();
let sceneRef: THREE.Scene | null = null;

function maxHpForLevel(level: number, classId: ClassId): number {
  const base = 16 + level * 5;
  return Math.round(classId === 'warden' ? base * 1.25 : base);
}

function sayBubble(c: Companion, lines: readonly string[], chance = 1): void {
  if (lines.length === 0 || Math.random() > chance) return;
  if (Math.hypot(player.position.x - c.position.x, player.position.z - c.position.z) > WORLD.plateRadius) return;
  const text = lines[Math.floor(Math.random() * lines.length)];
  c.bubble = { text, until: performance.now() + 3400 };
}

function questTables() {
  return { quests: QUESTS, npcs: NPCS, objects: OBJECTS, spawns: SPAWNS, enemies: ENEMIES };
}

function syncLevelToQuest(c: Companion, questId: string | null): void {
  const qLevel = questId && QUESTS[questId] ? QUESTS[questId].level : state.level;
  const offset = (c.id % 3) - 1;
  const targetLevel = Math.max(1, Math.min(Math.max(state.level + 1, qLevel + 1), qLevel + offset));
  if (c.level !== targetLevel) {
    c.level = targetLevel;
    const prevMax = c.hpMax;
    c.hpMax = maxHpForLevel(c.level, c.classId);
    c.hp = Math.min(c.hpMax, c.hp + Math.max(0, c.hpMax - prevMax));
  }
}

function assignQuest(c: Companion, randomStage = false): void {
  const pools = selectQuestPools(QUESTS, state.quests, state.zone, state.level);
  const primary = c.role === 'current' ? pools.current : pools.prior;
  const fallback = c.role === 'current' ? pools.prior : pools.current;
  const pool = primary.length > 0 ? primary : fallback;
  if (pool.length === 0) {
    c.questId = null;
    c.questStage = 0;
    c.questCount = 0;
    syncLevelToQuest(c, null);
    return;
  }
  // Spread companions across available quests in the pool when possible.
  const taken = new Set(companions.filter((o) => o.id !== c.id && o.questId).map((o) => o.questId!));
  const fresh = pool.filter((id) => !taken.has(id));
  const choices = fresh.length > 0 ? fresh : pool;
  const qid = choices[Math.floor(Math.random() * choices.length)];
  const def = QUESTS[qid];
  c.questId = qid;
  c.questStage = randomStage && def && def.stages.length > 1
    ? Math.floor(Math.random() * def.stages.length)
    : 0;
  c.questCount = 0;
  c.simSwings = 0;
  c.pauseTimer = 0;
  c.path = [];
  syncLevelToQuest(c, qid);
}

function placeAtQuestStart(c: Companion): void {
  if (!c.questId) return;
  const target = resolveStageTarget(c.questId, c.questStage, questTables());
  if (!target) return;
  const jitter = Math.min(6, target.radius);
  const a = Math.random() * Math.PI * 2;
  const spot = findFreeSpot(target.x + Math.cos(a) * jitter, target.z + Math.sin(a) * jitter, 6);
  const y = standY(spot.x, spot.z, heightAt(spot.x, spot.z)) ?? heightAt(spot.x, spot.z);
  c.zone = target.zone;
  c.position.set(spot.x, y, spot.z);
  c.lastProgressPos = { x: spot.x, z: spot.z };
  c.path = [];
}

function advanceQuestStage(c: Companion): void {
  if (!c.questId || !QUESTS[c.questId]) {
    assignQuest(c);
    return;
  }
  const def = QUESTS[c.questId];
  c.questStage += 1;
  c.questCount = 0;
  c.simSwings = 0;
  c.pauseTimer = 0;
  c.path = [];
  if (c.questStage >= def.stages.length) {
    sayBubble(c, c.personalityDef.lines.quest, 0.7);
    assignQuest(c);
    c.pauseTimer = 2 + Math.random() * 2.5;
  }
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

function findLiveEnemyForStage(c: Companion, tx: number, tz: number, enemyId?: string): Entity | null {
  let best: Entity | null = null;
  let bestDist = 20;
  for (const e of allEntities()) {
    if (e.kind !== 'enemy' || e.dead) continue;
    if (enemyId && e.defId !== enemyId) continue;
    const def = ENEMIES[e.defId];
    const isBoss = def && (def.rank === 'boss' || def.rank === 'worldboss' || def.rank === 'final' || def.rank === 'miniboss');
    if (isBoss && !e.inCombat) continue;
    const fromAnchor = Math.hypot(e.position.x - tx, e.position.z - tz);
    if (fromAnchor > 26) continue;
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
    c.stealCooldown = c.personalityDef.id === 'lootgoblin' ? 6 + Math.random() * 4 : 12 + Math.random() * 7;
    sayBubble(c, c.personalityDef.lines.forage, 0.85);
  }
}

function tryStepDir(c: Companion, dx: number, dz: number, stepDist: number): boolean {
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) return false;
  const nx = c.position.x + (dx / len) * stepDist;
  const nz = c.position.z + (dz / len) * stepDist;
  const ny = standY(nx, nz, c.position.y);
  if (ny === null) return false;
  c.position.set(nx, ny, nz);
  return true;
}

function moveToward(c: Companion, tx: number, tz: number, speed: number, dt: number): boolean {
  const dx = tx - c.position.x;
  const dz = tz - c.position.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.15) return false;
  c.facing = Math.atan2(dx, dz);

  let remaining = Math.min(dist, speed * dt);
  let moved = false;
  while (remaining > 1e-5) {
    const step = Math.min(remaining, WALK_SUBSTEP);
    const cdx = tx - c.position.x;
    const cdz = tz - c.position.z;
    const ok = tryStepDir(c, cdx, cdz, step)
      || tryStepDir(c, cdx, 0, step)
      || tryStepDir(c, 0, cdz, step);
    if (!ok) break;
    remaining -= step;
    moved = true;
  }
  return moved;
}

function followTargetWithPath(c: Companion, tx: number, tz: number, speed: number, dt: number): boolean {
  if (c.path.length > 0) {
    const wp = c.path[0];
    const d = Math.hypot(wp.x - c.position.x, wp.z - c.position.z);
    if (d < 0.6) {
      c.path.shift();
    } else if (moveToward(c, wp.x, wp.z, speed, dt)) {
      return true;
    } else {
      c.path = [];
    }
  }
  if (moveToward(c, tx, tz, speed, dt)) return true;

  // Blocked in a straight line: try local A* up to 50 m toward target.
  const dist = Math.hypot(tx - c.position.x, tz - c.position.z);
  const cap = Math.min(dist, 50);
  const gx = dist > cap ? c.position.x + ((tx - c.position.x) / dist) * cap : tx;
  const gz = dist > cap ? c.position.z + ((tz - c.position.z) / dist) * cap : tz;
  const gy = standY(gx, gz, heightAt(gx, gz)) ?? heightAt(gx, gz);
  const path = findPath3(
    { x: c.position.x, y: c.position.y, z: c.position.z },
    { x: gx, y: gy, z: gz },
    standY,
  );
  if (path.length > 0) {
    c.path = path;
    const wp = c.path[0];
    return moveToward(c, wp.x, wp.z, speed, dt);
  }
  return false;
}

function respawnAtShrine(c: Companion): void {
  const zDef = ZONES[c.zone] ?? ZONES[state.zone];
  const spot = findFreeSpot(zDef.shrine.x, zDef.shrine.z, 5);
  const y = standY(spot.x, spot.z, heightAt(spot.x, spot.z)) ?? heightAt(spot.x, spot.z);
  c.position.set(spot.x, y, spot.z);
  c.path = [];
  c.targetEntityId = null;
}

function takeBonk(c: Companion, enemyLevel: number): void {
  if (c.bonkTimer > 0) return;
  c.bonkTimer = 3.2 + Math.random() * 2.4;
  if (Math.random() < 0.42) {
    const dmg = Math.max(1, Math.round(1 + enemyLevel * 0.35));
    c.hp -= dmg;
    if (c.hp <= 0) {
      c.hp = 0;
      c.dead = true;
      c.respawnS = RESPAWN_S;
      c.model.setDead(true);
      sayBubble(c, ['Oof!', 'Nap time...'], 0.9);
    }
  }
}

function swingAtEnemy(c: Companion, e: Entity, distToPlayer: number): void {
  c.facing = Math.atan2(e.position.x - c.position.x, e.position.z - c.position.z);
  if (c.attackTimer <= 0) {
    c.attackTimer = (2.0 + Math.random() * 0.5) * c.personalityDef.attackCooldownMult;
    c.swing = SWING_ANIM_S;
    c.swings += 1;
    const missChance = c.personalityDef.id === 'wanderer' ? 0.3 : 0.15;
    if (Math.random() < missChance) {
      sayBubble(c, ['Missed!', 'Whoa, slippery grass.'], 0.35);
    } else if (distToPlayer <= 35) {
      const dmg = Math.max(1, Math.round(1 + c.level * 0.4));
      dealDamage(e.id, dmg, 'crush', { attacker: COMPANION_ATTACKER_ID });
      if (e.dead) c.questCount += 1;
      sayBubble(c, c.personalityDef.lines.combat, 0.22);
    } else {
      c.simSwings += 1;
      if (c.simSwings >= SIM_FIGHT_SWINGS) {
        c.simSwings = 0;
        c.questCount += 1;
      }
    }
  }
  takeBonk(c, e.level);
}

function stepQuesting(c: Companion, speed: number, dt: number, distToPlayer: number): void {
  if (!c.questId || !QUESTS[c.questId]) {
    assignQuest(c);
    if (!c.questId) return;
  }

  // Periodically check if a 'current' companion's quest was finished by the player and is now stale.
  const target = resolveStageTarget(c.questId, c.questStage, questTables());
  if (!target) {
    advanceQuestStage(c);
    return;
  }

  const liveZone = zoneAt(c.position.x, c.position.z);
  if (liveZone) c.zone = liveZone;

  // Travel between zones when needed.
  if (c.zone !== target.zone) {
    const exit = nextZoneExit(c.zone, target.zone, ZONES);
    if (!exit) {
      if (distToPlayer > 220) placeAtQuestStart(c);
      else assignQuest(c);
      return;
    }
    const dExit = Math.hypot(exit.x - c.position.x, exit.z - c.position.z);
    if (isTeleportExit(c.zone, exit.to) && dExit <= exit.r + 1.5) {
      const y = standY(exit.arriveX, exit.arriveZ, heightAt(exit.arriveX, exit.arriveZ)) ?? heightAt(exit.arriveX, exit.arriveZ);
      c.position.set(exit.arriveX, y, exit.arriveZ);
      c.zone = exit.to;
      c.path = [];
      return;
    }
    const moved = followTargetWithPath(c, exit.x, exit.z, speed * 1.1, dt);
    if (!moved && distToPlayer > 220 && c.stuckTimer > 2.5) {
      const y = standY(exit.arriveX, exit.arriveZ, heightAt(exit.arriveX, exit.arriveZ)) ?? heightAt(exit.arriveX, exit.arriveZ);
      c.position.set(exit.arriveX, y, exit.arriveZ);
      c.zone = exit.to;
      c.path = [];
      c.stuckTimer = 0;
    }
    return;
  }

  // Same zone: execute stage objective.
  if (target.kind === 'enemy') {
    if (c.questCount >= target.count) {
      advanceQuestStage(c);
      return;
    }
    const enemy = findLiveEnemyForStage(c, target.x, target.z, target.enemyId);
    if (enemy) {
      const d = Math.hypot(enemy.position.x - c.position.x, enemy.position.z - c.position.z);
      if (d > MELEE_RANGE) {
        followTargetWithPath(c, enemy.position.x, enemy.position.z, speed, dt);
      } else {
        swingAtEnemy(c, enemy, distToPlayer);
      }
      return;
    }
    // No live enemy nearby (e.g. zone entities despawned off-screen): go to spawn camp and simulate skirmishes.
    const dCamp = Math.hypot(target.x - c.position.x, target.z - c.position.z);
    if (dCamp > Math.min(4, target.radius)) {
      followTargetWithPath(c, target.x, target.z, speed, dt);
    } else if (c.attackTimer <= 0) {
      c.attackTimer = (2.2 + Math.random() * 0.6) * c.personalityDef.attackCooldownMult;
      c.swing = SWING_ANIM_S;
      c.swings += 1;
      c.simSwings += 1;
      if (c.simSwings >= SIM_FIGHT_SWINGS) {
        c.simSwings = 0;
        c.questCount += 1;
      }
      takeBonk(c, c.level);
    }
    return;
  }

  const dTarget = Math.hypot(target.x - c.position.x, target.z - c.position.z);
  if (dTarget > target.radius) {
    followTargetWithPath(c, target.x, target.z, speed, dt);
    return;
  }

  c.facing = Math.atan2(target.x - c.position.x, target.z - c.position.z);
  if (c.pauseTimer <= 0) {
    const [lo, hi] = c.personalityDef.talkPauseS;
    c.pauseTimer = lo + Math.random() * (hi - lo);
    if (target.kind === 'object') {
      c.swing = SWING_ANIM_S;
      c.swings += 1;
    }
    sayBubble(c, c.personalityDef.lines.quest, 0.35);
    return;
  }
  c.pauseTimer -= dt;
  if (c.pauseTimer <= 0) {
    c.questCount += 1;
    if (c.questCount >= target.count) advanceQuestStage(c);
  }
}

function stepCompanion(c: Companion, dt: number): void {
  if (c.bubble && performance.now() >= c.bubble.until) c.bubble = null;

  const distToPlayer = Math.hypot(player.position.x - c.position.x, player.position.z - c.position.z);
  const visible = distToPlayer <= WORLD.remoteViewRadius;
  c.model.object.visible = visible;

  if (c.dead) {
    c.respawnS -= dt;
    if (c.respawnS <= 0) {
      c.dead = false;
      c.hp = c.hpMax;
      c.model.setDead(false);
      respawnAtShrine(c);
      c.activity = 'quest';
      sayBubble(c, c.personalityDef.lines.respawn, 0.85);
    }
    if (visible) {
      scratchVel.set(0, 0, 0);
      c.model.setDead(true);
      c.model.update({ position: c.position, velocity: scratchVel, facing: c.facing, grounded: true, jumpsUsed: 0 }, dt);
    }
    return;
  }

  c.attackTimer -= dt;
  c.stealCooldown -= dt;
  c.bonkTimer -= dt;
  c.activityTimer -= dt;
  if (c.swing > 0) c.swing = Math.max(0, c.swing - dt);

  const prevX = c.position.x;
  const prevZ = c.position.z;
  const baseSpeed = TUNING.walkSpeed * 0.94 * c.personalityDef.speedMult;

  // Occasionally switch from questing into a personality detour (forage loot or admire scenery).
  if (c.activity === 'quest' && c.activityTimer <= 0) {
    c.activityTimer = 5 + Math.random() * 6;
    if (visible && c.stealCooldown <= 0 && Math.random() < c.personalityDef.forageChance) {
      const loot = findLootTarget(c);
      if (loot) {
        c.activity = 'forage';
        c.targetEntityId = loot.id;
        c.activityTimer = 5;
      }
    } else if (visible && Math.random() < c.personalityDef.admireChance) {
      c.activity = 'admire';
      c.admireSpin = (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 1.1);
      c.activityTimer = 1.6 + Math.random() * 1.6;
      sayBubble(c, c.personalityDef.lines.idle, 0.45);
    }
  }

  if (c.activity === 'forage') {
    const e = c.targetEntityId !== null ? allEntities().find((ent) => ent.id === c.targetEntityId) : undefined;
    if (!e || e.kind !== 'loot' || (e.gold <= 0 && e.loot.length === 0) || c.activityTimer <= 0) {
      c.activity = 'quest';
      c.targetEntityId = null;
    } else {
      const d = Math.hypot(e.position.x - c.position.x, e.position.z - c.position.z);
      if (d <= TUNING.takeRange) {
        c.facing = Math.atan2(e.position.x - c.position.x, e.position.z - c.position.z);
        nibbleLoot(c, e);
        c.activity = 'quest';
        c.targetEntityId = null;
      } else {
        followTargetWithPath(c, e.position.x, e.position.z, baseSpeed, dt);
      }
    }
  } else if (c.activity === 'admire') {
    c.facing += c.admireSpin * dt;
    if (c.activityTimer <= 0) c.activity = 'quest';
  } else {
    stepQuesting(c, baseSpeed, dt, distToPlayer);
  }

  // Track stuck time so off-screen companions never stall indefinitely.
  const movedDist = Math.hypot(c.position.x - c.lastProgressPos.x, c.position.z - c.lastProgressPos.z);
  if (movedDist > 0.4 || c.activity === 'admire' || c.pauseTimer > 0) {
    c.stuckTimer = 0;
    c.lastProgressPos.x = c.position.x;
    c.lastProgressPos.z = c.position.z;
  } else {
    c.stuckTimer += dt;
    if (distToPlayer > 240 && c.stuckTimer > 4) {
      c.stuckTimer = 0;
      placeAtQuestStart(c);
    }
  }

  if (visible) {
    const vx = dt > 0 ? (c.position.x - prevX) / dt : 0;
    const vz = dt > 0 ? (c.position.z - prevZ) / dt : 0;
    scratchVel.set(vx, 0, vz);
    c.model.update({ position: c.position, velocity: scratchVel, facing: c.facing, grounded: true, jumpsUsed: 0 }, dt);
    if (c.swing > 0) {
      c.model.arms.right.rotation.x = -2.4 * Math.sin(Math.PI * (1 - Math.max(0, c.swing) / SWING_ANIM_S));
    }
  }
}

function refreshQuestAssignments(): void {
  const pools = selectQuestPools(QUESTS, state.quests, state.zone, state.level);
  const valid = new Set([...pools.current, ...pools.prior]);
  for (const c of companions) {
    const qLevel = c.questId && QUESTS[c.questId] ? QUESTS[c.questId].level : state.level;
    const stale = !c.questId || (!valid.has(c.questId) && Math.abs(qLevel - state.level) > 3);
    if (stale) {
      assignQuest(c, false);
      const distToPlayer = Math.hypot(player.position.x - c.position.x, player.position.z - c.position.z);
      if (distToPlayer > 280) placeAtQuestStart(c);
    } else {
      syncLevelToQuest(c, c.questId);
    }
  }
}

export function initCompanions(scene: THREE.Scene): void {
  sceneRef = scene;
  const roster = createCompanionRoster(COMPANION_COUNT);
  for (let i = 0; i < COMPANION_COUNT; i++) {
    const idSpec = roster[i];
    const model = createGnomeModel(look(idSpec.hatColor, idSpec.shirtColor, idSpec.beardColor));
    model.object.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    sceneRef.add(model.object);

    const level = Math.max(1, state.level);
    const hpMax = maxHpForLevel(level, idSpec.classId);
    const c: Companion = {
      id: i,
      role: i < Math.ceil(COMPANION_COUNT / 2) ? 'current' : 'prior',
      personality: idSpec.personality.id,
      personalityDef: idSpec.personality,
      plateColor: idSpec.personality.plateColor,
      name: idSpec.name,
      classId: idSpec.classId,
      hatColor: idSpec.hatColor,
      shirtColor: idSpec.shirtColor,
      zone: state.zone,
      position: new THREE.Vector3(player.position.x, player.position.y, player.position.z),
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
      simSwings: 0,
      stealCooldown: 4 + Math.random() * 6,
      bonkTimer: 3 + Math.random() * 3,
      activity: 'quest',
      activityTimer: 3 + Math.random() * 4,
      pauseTimer: 0,
      admireSpin: 0,
      stuckTimer: 0,
      lastProgressPos: { x: player.position.x, z: player.position.z },
      path: [],
      targetEntityId: null,
      questId: null,
      questStage: 0,
      questCount: 0,
      bubble: null,
    };
    assignQuest(c, true);
    placeAtQuestStart(c);
    companions.push(c);
  }

  bus.on('quest-updated', refreshQuestAssignments);
  bus.on('zone-changed', refreshQuestAssignments);
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

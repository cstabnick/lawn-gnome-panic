// Independent AI gnome players roaming Gnomomia: each has a personality, flavor-matched name,
// class, and quest progression drawn from the player's active quests and recent prior quests,
// making the world feel like a living MMO even with single-digit real players.
import * as THREE from 'three';
import { createGnomeModel, type GnomeModel } from '@lawn/gnome';
import { EQUIP_SLOTS, TUNING, WORLD, look, type ClassId, type Entity, type EquipSlot, type QuestDef, type ZoneId } from './config';
import { ENEMIES, NPCS, OBJECTS, QUESTS, SPAWNS, ZONES } from './content';
import { classToWire, companionEquipment, companionHitDamage, companionMaxHp, levelFitsZone, personalityToWire, questLevelFor, zoneLevelFor } from './companionGear';
import { createGearRig, syncGear, type GearRig } from './gear';
import {
  ARRIVE_LINGER_S, BREAK_AFTER_QUEST_CHANCE, IDLE_S, LIFE_LINES, QUEST_STINT_S, REST_RING_M, REST_S, SIT_DROP,
  TRAVEL_SPEED_MULT, pickLifeActivity, pickTravelDestination, restSpot, rollRange, type LifeSpot,
} from './companionLife';
import { dealDamage } from './combat';
import {
  COMPANION_TARGET_BASE, allEntities, encounterOf, getEntity, isEntityAuthority, isTownFight, provokeEnemy, removeEntity,
  setCompanionTargets,
} from './entities';
import { bus } from './events';
import { findPath3, type Point3 } from './pathfind';
import { PARTY, followSlot, helperLevel, pickAssistTarget, type AssistCandidate } from './party/partyLogic';
import { player } from './player';
import { companionMayTake } from './questRules';
import { state } from './state';
import { findFreeSpot, heightAt, standY, zoneAt } from './terrain';
import { isTeleportExit } from './zones';
import { townAt, townWaypoints, type Town, type TownWaypoint } from './towns';
import type { CompanionPose } from './net/protocol';
import {
  createCompanionRoster, nextStrollWaypoint, nextZoneExit, pickTownStrollers, resolveStageTarget, selectQuestPools,
  type CompanionPersonalityId, type PersonalityDef,
} from './companionLogic';

/** Companions never run player-only quests, trainer quests, or defend/escort quests (questRules.ts). */
const mayTake = (q: QuestDef): boolean => companionMayTake(q, NPCS);

const COMPANION_COUNT = 6;
const FORAGE_SEARCH_RADIUS = 13;
const FORAGE_PLAYER_BUFFER = 2.8;
const MELEE_RANGE = 1.9;
const SWING_ANIM_S = 0.35;
const RESPAWN_S = 6;
const WALK_SUBSTEP = 0.25;
/** A* budget for a companion's local detour (about 70 ms when the goal cannot be reached). The default (for player
 * clicks) is 16000, about 1.5 s: a blocked companion re-planning every frame with it froze the game and stalled the
 * music. */
const COMPANION_PATH_EXPAND = 800;
/** Seconds a companion waits before planning again after a search that did not reach its goal; doubles with each
 * failure in a row, up to the cap, so a companion that is truly stuck costs almost nothing. */
const REPATH_AFTER_FAIL_S = 1;
const REPATH_AFTER_FAIL_MAX_S = 16;
const SIM_FIGHT_SWINGS = 3;
/** Chance a real enemy's swing lands on a companion. */
const ENEMY_HIT_CHANCE = 0.7;

type Role = 'current' | 'prior';
type Activity = 'quest' | 'forage' | 'admire' | 'stroll' | 'idle' | 'rest' | 'travel' | 'party';

/** Seconds between checks of which town (if any) the player stands in. */
const TOWN_CHECK_S = 0.5;
/** A stroller further than this from the town's edge (or in another zone) is placed just inside it instead. */
const STROLL_PLACE_DIST = 120;
/** How far inside the town edge a placed stroller appears (m). */
const STROLL_EDGE_INSET = 4;
const STROLL_ARRIVE = 1.5;
const STROLL_PAUSE_MIN_S = 2;
const STROLL_PAUSE_MAX_S = 6;
/** Waypoint ids a stroller remembers, so it does not bounce between two. */
const STROLL_RECENT = 3;
/** A stroller that makes no progress this long gives up on its waypoint and picks another. */
const STROLL_GIVE_UP_S = 6;

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
  equipment: Record<EquipSlot, string | null>;
  gear: GearRig;
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
  /** Seconds until this companion may run A* again (set after a search that did not reach its goal). */
  repathS: number;
  /** Searches in a row that did not reach their goal. */
  repathFails: number;
  targetEntityId: number | null;
  questId: string | null;
  questStage: number;
  questCount: number;
  bubble: CompanionBubble | null;
  /** While strolling: the waypoint it walks to (null: pick one), and the ids it visited last. */
  strollTarget: TownWaypoint | null;
  strollRecent: string[];
  /** Questing seconds left before a break. */
  stintS: number;
  /** Seconds left in idle, rest or the linger after a trip. */
  lifeTimer: number;
  /** Rest or travel goal. */
  spot: LifeSpot | null;
  /** Rest: has sat down. */
  arrived: boolean;
  sitting: boolean;
  /** Seconds left of the left-arm wave. */
  waveS: number;
  /** Has waved during this break. */
  waved: boolean;
  /** In the player's party: follows and fights with them (party.ts), never quests or strolls. */
  inParty: boolean;
}

const companions: Companion[] = [];
/** A companion ran A* this frame; the rest wait for a later one. */
let searchedThisFrame = false;
const scratchVel = new THREE.Vector3();
const scratchSit = new THREE.Vector3();
let sceneRef: THREE.Scene | null = null;
/** The town the player stood in at the last check, and the countdown to the next check. */
let playerTown: Town | null = null;
let townCheckS = 0;
const waypointCache = new Map<string, TownWaypoint[]>();

function cachedWaypoints(town: Town): TownWaypoint[] {
  let w = waypointCache.get(town.id);
  if (!w) {
    w = townWaypoints(town);
    waypointCache.set(town.id, w);
  }
  return w;
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

const baseZone = (z: ZoneId): ZoneId => (z.includes('/') ? z.split('/')[0] : z) as ZoneId;

/** Sets level, re-rolls the loadout (drawn on the model) and max hp; hp grows by what max hp gained. */
function setLevel(c: Companion, level: number): void {
  if (c.level === level) return;
  c.level = level;
  c.equipment = companionEquipment(c.classId, level, c.personality, c.id);
  syncGear(c.gear, c.model, c.equipment);
  const prevMax = c.hpMax;
  c.hpMax = companionMaxHp(level, c.classId, c.equipment);
  c.hp = Math.min(c.hpMax, c.hp + Math.max(0, c.hpMax - prevMax));
}

function syncLevelToQuest(c: Companion, questId: string | null): void {
  if (questId && QUESTS[questId]) {
    setLevel(c, questLevelFor(QUESTS[questId].level, c.id));
  } else {
    setLevel(c, zoneLevelFor(ZONES[baseZone(c.zone)].levels, state.level, c.id));
  }
}

function assignQuest(c: Companion, randomStage = false): void {
  const pools = selectQuestPools(QUESTS, state.quests, state.zone, state.level, 4, mayTake);
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
    if (Math.random() < BREAK_AFTER_QUEST_CHANCE) startBreak(c);
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
    if (encounterOf(e.id) !== undefined) continue;
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

  // Blocked in a straight line: try local A* up to 50 m toward target, unless a recent search failed or another
  // companion already searched this frame (six blocked at once would stack their searches into one long frame).
  if (c.repathS > 0 || searchedThisFrame) return false;
  searchedThisFrame = true;
  const dist = Math.hypot(tx - c.position.x, tz - c.position.z);
  const cap = Math.min(dist, 50);
  const gx = dist > cap ? c.position.x + ((tx - c.position.x) / dist) * cap : tx;
  const gz = dist > cap ? c.position.z + ((tz - c.position.z) / dist) * cap : tz;
  const gy = standY(gx, gz, heightAt(gx, gz)) ?? heightAt(gx, gz);
  const path = findPath3(
    { x: c.position.x, y: c.position.y, z: c.position.z },
    { x: gx, y: gy, z: gz },
    standY,
    COMPANION_PATH_EXPAND,
  );
  const end = path[path.length - 1];
  if (!end || Math.hypot(end.x - gx, end.z - gz) > 1.5) {
    c.repathS = Math.min(REPATH_AFTER_FAIL_MAX_S, REPATH_AFTER_FAIL_S * 2 ** c.repathFails);
    c.repathFails++;
  } else {
    c.repathFails = 0;
  }
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

/** Target id enemies use for this companion (see COMPANION_TARGET_BASE). */
const targetId = (c: Companion): number => COMPANION_TARGET_BASE - c.id;

/** A hit from an enemy of `enemyLevel`; at 0 hp the companion goes down until its respawn. */
function hurt(c: Companion, enemyLevel: number): void {
  if (c.activity === 'idle' || c.activity === 'rest') endBreak(c);
  c.hp -=Math.max(1, Math.round(1 + enemyLevel * 0.35));
  if (c.hp > 0) return;
  c.hp = 0;
  c.dead = true;
  c.respawnS = c.inParty ? PARTY.helperRespawnS : RESPAWN_S;
  c.path = [];
  c.model.setDead(true);
  sayBubble(c, ['Oof!', 'Nap time...'], 0.9);
}

/** A fight this client only simulates (no enemy here fights back): now and then a made-up hit. */
function takeBonk(c: Companion, enemyLevel: number): void {
  if (c.bonkTimer > 0) return;
  c.bonkTimer = 3.2 + Math.random() * 2.4;
  if (Math.random() < 0.42) hurt(c, enemyLevel);
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
    } else if (distToPlayer <= 35 && isEntityAuthority(e.id)) {
      const dmg = companionHitDamage(c.level, c.equipment);
      dealDamage(e.id, dmg, 'crush', { attacker: targetId(c) });
      if (e.dead) c.questCount += 1;
      sayBubble(c, c.personalityDef.lines.combat, 0.22);
    } else {
      c.simSwings += 1;
      if (c.simSwings >= SIM_FIGHT_SWINGS) {
        c.simSwings = 0;
        c.questCount += 1;
      }
    }
    // Swung at, hit or not: an enemy that was minding its own business turns on this companion.
    if (!e.dead) provokeEnemy(e.id, targetId(c));
  }
  // An enemy this client runs fights back for real (entities.ts targets the companion). One run by another client's
  // world never learns of this companion, so its hits stay simulated.
  if (!isEntityAuthority(e.id)) takeBonk(c, e.level);
}

/** One step toward `zone` through its exits (teleport exits hop when in reach; far from the player a stuck
 * walker hops). 'no-route' when no exit leads there. */
function stepToZone(c: Companion, zone: ZoneId, speed: number, dt: number, distToPlayer: number): 'moving' | 'no-route' {
  const exit = nextZoneExit(c.zone, zone, ZONES);
  if (!exit) return 'no-route';
  const dExit = Math.hypot(exit.x - c.position.x, exit.z - c.position.z);
  if (isTeleportExit(c.zone, exit.to) && dExit <= exit.r + 1.5) {
    const y = standY(exit.arriveX, exit.arriveZ, heightAt(exit.arriveX, exit.arriveZ)) ?? heightAt(exit.arriveX, exit.arriveZ);
    c.position.set(exit.arriveX, y, exit.arriveZ);
    c.zone = exit.to;
    c.path = [];
    return 'moving';
  }
  const moved = followTargetWithPath(c, exit.x, exit.z, speed * 1.1, dt);
  if (!moved && distToPlayer > 220 && c.stuckTimer > 2.5) {
    const y = standY(exit.arriveX, exit.arriveZ, heightAt(exit.arriveX, exit.arriveZ)) ?? heightAt(exit.arriveX, exit.arriveZ);
    c.position.set(exit.arriveX, y, exit.arriveZ);
    c.zone = exit.to;
    c.path = [];
    c.stuckTimer = 0;
  }
  return 'moving';
}

/** Walks to `spot` (crossing zones like questing). 'arrived' within `radius` of it in its zone. */
function goToSpot(
  c: Companion, spot: LifeSpot, radius: number, speed: number, dt: number, distToPlayer: number,
): 'moving' | 'arrived' | 'no-route' {
  const liveZone = zoneAt(c.position.x, c.position.z);
  if (liveZone) c.zone = liveZone;
  if (c.zone !== spot.zone) return stepToZone(c, spot.zone, speed, dt, distToPlayer);
  if (Math.hypot(spot.x - c.position.x, spot.z - c.position.z) <= radius) return 'arrived';
  followTargetWithPath(c, spot.x, spot.z, speed, dt);
  return 'moving';
}

function startBreak(c: Companion): void {
  if (c.activity !== 'quest' || c.dead) return;
  c.path = [];
  c.pauseTimer = 0;
  c.targetEntityId = null;
  c.waved = false;
  c.sitting = false;
  const kind = pickLifeActivity(c.personality, Math.random);
  if (kind === 'rest') {
    const s = restSpot(c.zone, c.position.x, c.position.z);
    if (s) {
      const a = Math.random() * 2 * Math.PI;
      const d = rollRange(REST_RING_M, Math.random);
      c.spot = { ...s, x: s.x + Math.cos(a) * d, z: s.z + Math.sin(a) * d };
      c.arrived = false;
      c.activity = 'rest';
      c.lifeTimer = rollRange(REST_S, Math.random);
      return;
    }
  } else if (kind === 'travel') {
    const s = pickTravelDestination(c.zone, c.position.x, c.position.z, (b) => levelFitsZone(c.level, b), Math.random);
    if (s) {
      c.spot = s;
      c.activity = 'travel';
      sayBubble(c, LIFE_LINES[c.personality].travel, 0.5);
      return;
    }
  }
  c.activity = 'idle';
  c.lifeTimer = rollRange(IDLE_S, Math.random);
  sayBubble(c, c.personalityDef.lines.idle, 0.4);
}

function endBreak(c: Companion): void {
  c.activity = 'quest';
  c.sitting = false;
  c.spot = null;
  c.arrived = false;
  c.waveS = 0;
  c.path = [];
  c.pauseTimer = 0;
  c.stintS = rollRange(QUEST_STINT_S[c.personality], Math.random);
}

/** Waves once per break when the player is close. */
function waveAtPlayer(c: Companion, distToPlayer: number): void {
  if (distToPlayer <= 6 && !c.waved) {
    c.waved = true;
    c.waveS = 1.2;
  }
}

/** Stands and looks about; faces a close player and waves. */
function stepIdle(c: Companion, distToPlayer: number, dt: number): void {
  c.lifeTimer -= dt;
  if (distToPlayer <= 6) {
    c.facing = Math.atan2(player.position.x - c.position.x, player.position.z - c.position.z);
    waveAtPlayer(c, distToPlayer);
  } else {
    c.facing += Math.sin(c.lifeTimer * 0.9) * 0.6 * dt;
  }
  if (c.lifeTimer <= 0) endBreak(c);
}

/** Walks to the rest spot, sits down, and gets up when the rest is over. */
function stepRest(c: Companion, speed: number, dt: number, distToPlayer: number): void {
  if (!c.arrived) {
    const r = goToSpot(c, c.spot!, 0.8, speed, dt, distToPlayer);
    if (r === 'no-route') {
      endBreak(c);
      return;
    }
    if (r !== 'arrived' && c.stuckTimer <= 8) return;
    c.arrived = true;
    c.sitting = true;
    c.path = [];
    c.facing = Math.random() * 2 * Math.PI;
    sayBubble(c, LIFE_LINES[c.personality].rest, 0.5);
  }
  c.lifeTimer -= dt;
  waveAtPlayer(c, distToPlayer);
  if (c.lifeTimer <= 0) endBreak(c);
}

/** Runs to a spot in a zone that suits its level, then lingers there as idle. */
function stepTravel(c: Companion, speed: number, dt: number, distToPlayer: number): void {
  const r = goToSpot(c, c.spot!, 3, speed * TRAVEL_SPEED_MULT, dt, distToPlayer);
  if (r === 'no-route') {
    endBreak(c);
    return;
  }
  if (r !== 'arrived') return;
  sayBubble(c, LIFE_LINES[c.personality].arrive, 0.6);
  c.spot = null;
  c.activity = 'idle';
  c.lifeTimer = rollRange(ARRIVE_LINGER_S, Math.random);
  c.waved = false;
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
    if (stepToZone(c, target.zone, speed, dt, distToPlayer) === 'no-route') {
      if (distToPlayer > 220) placeAtQuestStart(c);
      else assignQuest(c);
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

/** Puts a stroller at a free spot just inside `town`'s edge, on the side facing where it is now. */
function placeAtTownEdge(c: Companion, town: Town): void {
  let dx = c.position.x - town.x;
  let dz = c.position.z - town.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-3) { dx = 1; dz = 0; } else { dx /= len; dz /= len; }
  const inset = Math.max(0, town.r - STROLL_EDGE_INSET);
  const spot = findFreeSpot(town.x + dx * inset, town.z + dz * inset, Math.min(6, Math.max(2, town.r * 0.3)));
  const y = standY(spot.x, spot.z, heightAt(spot.x, spot.z)) ?? heightAt(spot.x, spot.z);
  c.zone = town.zone;
  c.position.set(spot.x, y, spot.z);
  c.lastProgressPos = { x: spot.x, z: spot.z };
  c.path = [];
  c.stuckTimer = 0;
}

function startStroll(c: Companion, town: Town): void {
  c.activity = 'stroll';
  c.targetEntityId = null;
  c.strollTarget = null;
  c.strollRecent = [];
  c.pauseTimer = 0;
  c.path = [];
  c.sitting = false;
  c.spot = null;
  c.arrived = false;
  if (c.dead) return;
  const fromEdge = Math.hypot(c.position.x - town.x, c.position.z - town.z) - town.r;
  if (c.zone !== town.zone || fromEdge > STROLL_PLACE_DIST) placeAtTownEdge(c, town);
  if (!c.dead) {
    const band = ZONES[town.zone].levels;
    if (!levelFitsZone(c.level, band)) setLevel(c, zoneLevelFor(band, state.level, c.id));
  }
}

function stopStroll(c: Companion): void {
  c.activity = 'quest';
  c.strollTarget = null;
  c.pauseTimer = 0;
  c.path = [];
}

/** At most every TOWN_CHECK_S: when the player is in a town the picked companions stroll there; out of town they quest. */
function checkPlayerTown(dt: number): void {
  townCheckS -= dt;
  if (townCheckS > 0) return;
  townCheckS = TOWN_CHECK_S;
  const town = townAt(player.position.x, player.position.z);
  const changed = (town?.id ?? null) !== (playerTown?.id ?? null);
  playerTown = town;
  const strollers = new Set(town ? pickTownStrollers(companions.map((c) => c.role)) : []);
  companions.forEach((c, i) => {
    if (c.inParty) return;
    if (town && strollers.has(i)) {
      // A companion respawned (activity reset to 'quest') or the player walked into another town: (re)start.
      if (c.activity !== 'stroll' || changed) startStroll(c, town);
    } else if (c.activity === 'stroll') {
      stopStroll(c);
    }
  });
}

/** A gnome running errands: walk to a town waypoint, linger a few seconds, pick the next. Never fights. */
function stepStrolling(c: Companion, speed: number, dt: number): void {
  const town = playerTown;
  if (!town) {
    stopStroll(c);
    return;
  }
  if (c.pauseTimer > 0) {
    c.pauseTimer -= dt;
    if (c.pauseTimer <= 0) c.strollTarget = null;
    return;
  }
  if (!c.strollTarget) {
    c.strollTarget = nextStrollWaypoint(cachedWaypoints(town), c.position.x, c.position.z, c.strollRecent, Math.random);
    c.stuckTimer = 0;
    if (!c.strollTarget) {
      c.pauseTimer = STROLL_PAUSE_MIN_S;
      return;
    }
  }
  const t = c.strollTarget;
  const d = Math.hypot(t.x - c.position.x, t.z - c.position.z);
  if (d <= STROLL_ARRIVE || c.stuckTimer > STROLL_GIVE_UP_S) {
    c.strollRecent.push(t.id);
    if (c.strollRecent.length > STROLL_RECENT) c.strollRecent.shift();
    c.path = [];
    if (d <= STROLL_ARRIVE) {
      c.pauseTimer = STROLL_PAUSE_MIN_S + Math.random() * (STROLL_PAUSE_MAX_S - STROLL_PAUSE_MIN_S);
      sayBubble(c, c.personalityDef.lines.idle, 0.3);
    } else {
      c.strollTarget = null; // gave up: pick another next frame
      c.stuckTimer = 0;
    }
    return;
  }
  followTargetWithPath(c, t.x, t.z, speed, dt);
}

/** A party member is set to the player's level minus one (setLevel keeps its gear and hp in step). */
function syncHelperLevel(c: Companion): void {
  setLevel(c, helperLevel(state.level));
}

/** This member's slot in the party, in roster order (0 for the first). */
function partyIndex(c: Companion): number {
  return companions.filter((o) => o.inParty).indexOf(c);
}

/** Puts a party member at its follow slot beside the player, on a free spot. */
function placeBesidePlayer(c: Companion): void {
  const s = followSlot(player.position.x, player.position.z, player.facing, partyIndex(c));
  const spot = findFreeSpot(s.x, s.z, 4);
  const y = standY(spot.x, spot.z, heightAt(spot.x, spot.z)) ?? heightAt(spot.x, spot.z);
  c.zone = state.zone;
  c.position.set(spot.x, y, spot.z);
  c.lastProgressPos = { x: spot.x, z: spot.z };
  c.path = [];
  c.stuckTimer = 0;
}

/** A party member: fights what the player fights (or anything fighting near the player), else follows the player. */
function stepParty(c: Companion, speed: number, dt: number, distToPlayer: number): void {
  syncHelperLevel(c);
  if (player.dead) {
    c.facing = Math.atan2(player.position.x - c.position.x, player.position.z - c.position.z);
    return;
  }
  const liveZone = zoneAt(c.position.x, c.position.z);
  if (liveZone) c.zone = liveZone;
  if (c.zone !== state.zone || distToPlayer > PARTY.teleportDist) {
    placeBesidePlayer(c);
    return;
  }

  const px = player.position.x;
  const pz = player.position.z;
  const candidates: AssistCandidate[] = [];
  for (const e of allEntities()) {
    if (Math.hypot(e.position.x - px, e.position.z - pz) > PARTY.assistTargetRange + 5) continue;
    candidates.push({ id: e.id, x: e.position.x, z: e.position.z, dead: e.dead, inCombat: e.inCombat, enemy: e.kind === 'enemy' });
  }
  const playerTarget = player.action?.type === 'attack' ? player.action.target : null;
  let id = pickAssistTarget(px, pz, playerTarget, candidates);
  // The Bound-Peace: inside a town, helpers fight only what is already a town fight.
  if (id !== null && townAt(px, pz) && !isTownFight(id)) id = null;
  if (id !== null) {
    const e = getEntity(id);
    if (e && !e.dead) {
      const d = Math.hypot(e.position.x - c.position.x, e.position.z - c.position.z);
      if (d > MELEE_RANGE) followTargetWithPath(c, e.position.x, e.position.z, speed * 1.15, dt);
      else swingAtEnemy(c, e, distToPlayer);
      return;
    }
  }

  const s = followSlot(px, pz, player.facing, partyIndex(c));
  const d = Math.hypot(s.x - c.position.x, s.z - c.position.z);
  if (d > 0.8) followTargetWithPath(c, s.x, s.z, d > PARTY.catchUpDist ? speed * 1.3 : speed, dt);
  else c.facing = player.facing;
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
      if (c.inParty) placeBesidePlayer(c);
      else respawnAtShrine(c);
      c.activity = c.inParty ? 'party' : 'quest';
      c.sitting = false;
      c.spot = null;
      c.arrived = false;
      sayBubble(c, c.personalityDef.lines.respawn, 0.85);
    }
    if (visible) {
      scratchVel.set(0, 0, 0);
      c.position.y = heightAt(c.position.x, c.position.z); // a body that fell where it stood rests on the ground
      c.model.setDead(true);
      c.model.update({ position: c.position, velocity: scratchVel, facing: c.facing, grounded: true, jumpsUsed: 0 }, dt);
    }
    return;
  }

  c.attackTimer -= dt;
  c.stealCooldown -= dt;
  c.bonkTimer -= dt;
  c.activityTimer -= dt;
  if (c.repathS > 0) c.repathS -= dt;
  if (c.swing > 0) c.swing = Math.max(0, c.swing - dt);

  const prevX = c.position.x;
  const prevZ = c.position.z;
  const baseSpeed = TUNING.walkSpeed * 0.94 * c.personalityDef.speedMult;

  // A questing stint runs out: take a break once the gnome has not swung for a couple of seconds.
  if (c.activity === 'quest') {
    c.stintS -= dt;
    if (c.stintS <= 0 && c.targetEntityId === null && c.attackTimer < -2) startBreak(c);
  }

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
  } else if (c.activity === 'party') {
    stepParty(c, baseSpeed, dt, distToPlayer);
  } else if (c.activity === 'stroll') {
    stepStrolling(c, baseSpeed * 0.8, dt);
  } else if (c.activity === 'idle') {
    stepIdle(c, distToPlayer, dt);
  } else if (c.activity === 'rest') {
    stepRest(c, baseSpeed, dt, distToPlayer);
  } else if (c.activity === 'travel') {
    stepTravel(c, baseSpeed, dt, distToPlayer);
  } else {
    stepQuesting(c, baseSpeed, dt, distToPlayer);
  }

  // Track stuck time so off-screen companions never stall indefinitely.
  const movedDist = Math.hypot(c.position.x - c.lastProgressPos.x, c.position.z - c.lastProgressPos.z);
  if (movedDist > 0.4 || c.activity === 'admire' || c.pauseTimer > 0 || c.activity === 'idle' || (c.activity === 'rest' && c.arrived)) {
    c.stuckTimer = 0;
    c.lastProgressPos.x = c.position.x;
    c.lastProgressPos.z = c.position.z;
  } else {
    c.stuckTimer += dt;
    if (c.activity !== 'stroll' && !c.inParty && distToPlayer > 240 && c.stuckTimer > 4) {
      c.stuckTimer = 0;
      if ((c.activity === 'travel' || c.activity === 'rest') && c.spot) {
        const p = findFreeSpot(c.spot.x, c.spot.z, 6);
        const y = standY(p.x, p.z, heightAt(p.x, p.z)) ?? heightAt(p.x, p.z);
        c.zone = c.spot.zone;
        c.position.set(p.x, y, p.z);
        c.path = [];
        c.lastProgressPos = { x: p.x, z: p.z };
      } else {
        placeAtQuestStart(c);
      }
    }
  }

  if (visible) {
    const vx = dt > 0 ? (c.position.x - prevX) / dt : 0;
    const vz = dt > 0 ? (c.position.z - prevZ) / dt : 0;
    scratchVel.set(vx, 0, vz);
    if (c.sitting) {
      scratchSit.copy(c.position);
      scratchSit.y -= SIT_DROP;
    }
    c.model.update({
      position: c.sitting ? scratchSit : c.position, velocity: scratchVel, facing: c.facing, grounded: true, jumpsUsed: 0,
      sitting: c.sitting,
    }, dt);
    if (c.swing > 0) {
      c.model.arms.right.rotation.x = -2.4 * Math.sin(Math.PI * (1 - Math.max(0, c.swing) / SWING_ANIM_S));
    }
    if (c.waveS > 0) {
      c.waveS = Math.max(0, c.waveS - dt);
      c.model.arms.left.rotation.x = -2.6 + 0.35 * Math.sin(c.waveS * 14);
    }
  }
}

function refreshQuestAssignments(): void {
  const pools = selectQuestPools(QUESTS, state.quests, state.zone, state.level, 4, mayTake);
  const valid = new Set([...pools.current, ...pools.prior]);
  for (const c of companions) {
    if (c.inParty) continue;
    const qLevel = c.questId && QUESTS[c.questId] ? QUESTS[c.questId].level : state.level;
    const banned = !!c.questId && !!QUESTS[c.questId] && !mayTake(QUESTS[c.questId]);
    const stale = banned || !c.questId || (!valid.has(c.questId) && Math.abs(qLevel - state.level) > 3);
    if (stale) {
      assignQuest(c, false);
      const distToPlayer = Math.hypot(player.position.x - c.position.x, player.position.z - c.position.z);
      if (distToPlayer > 280) {
        if (c.activity === 'idle' || c.activity === 'rest' || c.activity === 'travel') endBreak(c);
        placeAtQuestStart(c);
      }
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

    const equipment = {} as Record<EquipSlot, string | null>;
    for (const slot of EQUIP_SLOTS) equipment[slot] = null;
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
      level: 0,
      equipment,
      gear: createGearRig(),
      hp: 1,
      hpMax: 1,
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
      repathS: 0,
      repathFails: 0,
      targetEntityId: null,
      questId: null,
      questStage: 0,
      questCount: 0,
      bubble: null,
      strollTarget: null,
      strollRecent: [],
      stintS: Math.random() * rollRange(QUEST_STINT_S[idSpec.personality.id], Math.random),
      lifeTimer: 0,
      spot: null,
      arrived: false,
      sitting: false,
      waveS: 0,
      waved: false,
      inParty: false,
    };
    assignQuest(c, true);
    placeAtQuestStart(c);
    c.hp = c.hpMax;
    companions.push(c);
  }

  setCompanionTargets({
    *targets() {
      for (const c of companions) yield { id: targetId(c), x: c.position.x, z: c.position.z, zone: c.zone, dead: c.dead };
    },
    attack(id, enemy) {
      const c = companions[COMPANION_TARGET_BASE - id];
      if (!c || c.dead) return;
      if (Math.random() < ENEMY_HIT_CHANCE) hurt(c, enemy.level);
      else sayBubble(c, ['Missed me!', 'Ha, too slow.'], 0.25);
    },
  });
  bus.on('quest-updated', refreshQuestAssignments);
  bus.on('zone-changed', refreshQuestAssignments);
}

export function updateCompanions(dt: number): void {
  searchedThisFrame = false;
  checkPlayerTown(dt);
  // Start with a different companion each frame, so the A* turn goes round.
  const n = companions.length;
  const first = n > 0 ? frameNo++ % n : 0;
  for (let k = 0; k < n; k++) stepCompanion(companions[(first + k) % n], dt);
}
let frameNo = 0;

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
    c.level,
    classToWire(c.classId),
    personalityToWire(c.personality),
    c.sitting ? 1 : 0,
  ]);
}

/** Puts companion `id` into (on) or out of my party. False when there is no such companion. */
export function setCompanionPartyMember(id: number, on: boolean): boolean {
  const c = companions.find((o) => o.id === id);
  if (!c) return false;
  if (on) {
    c.inParty = true;
    c.activity = 'party';
    c.targetEntityId = null;
    c.strollTarget = null;
    c.path = [];
    c.pauseTimer = 0;
    // Clear any break left over from questing (a rest seat, a travel goal).
    c.sitting = false;
    c.spot = null;
    c.arrived = false;
    c.waveS = 0;
    syncHelperLevel(c);
    if (c.zone !== state.zone || Math.hypot(player.position.x - c.position.x, player.position.z - c.position.z) > PARTY.teleportDist) {
      placeBesidePlayer(c);
    }
    return true;
  }
  c.inParty = false;
  c.activity = 'quest';
  assignQuest(c);
  return true;
}

/** A speech bubble over companion `id` (shown only within plate range). */
export function companionSay(id: number, text: string): void {
  const c = companions.find((o) => o.id === id);
  if (c) sayBubble(c, [text], 1);
}

import {
  PLAYER_ID,
  TUNING,
  type BossMoveDef,
  type EnemyDef,
  type Entity,
  type StatusId,
} from '../config';
import { ENEMIES, ITEMS } from '../content';
import {
  abilityCooldown,
  knownAbilities,
  resetAbilitiesState,
  resource,
  updateAbilities,
  useHotbar,
} from '../abilities';
import {
  applyStatus,
  canAct,
  castSpell,
  dealDamage,
  enemyAttack,
  hasStatus,
  healPlayer,
  isRangedWeapon,
  playerMitigation,
  resetCombatState,
  setCombatRng,
  spellCooldown,
  speedFactor,
  swingCooldown,
  updateCombat,
  weaponReach,
} from '../combat';
import { RAID_HELPER_TARGET_BASE, allEntities, getEntity, removeEntity, spawnEnemyAt } from '../entities';
import { bus } from '../events';
import {
  assignSwing,
  createHelperState,
  damageHelper,
  helperStats,
  isUp,
  pickHealTarget,
  tickHelper,
  type HelperState,
} from '../raidHelperLogic';
import { player } from '../player';
import { enemyStats, mulberry32 } from '../rules';
import { equippedWeapon, maxHp, maxMp, state } from '../state';
import { applyLoadout } from './loadout';
import {
  SIM_STEP_S,
  type DeathCause,
  type EnemySpawnSpec,
  type LoadoutSpec,
  type ScenarioSpec,
  type SimAction,
  type SimEnemyView,
  type SimObservation,
  type SimRunResult,
  type SimTelegraph,
} from './types';

const STATUS_IDS: readonly StatusId[] = [
  'chipped', 'poisoned', 'burning', 'soaked', 'slowed', 'rooted',
  'staggered', 'stunned', 'cracked', 'glazed', 'marked',
];

const CONE_HALF_ANGLE = Math.PI / 6;
/** Arena enemies are a called fight: the arena sits at world (0, 0), inside Mossbottom's bounds, and the Bound-Peace
 * (src/towns.ts) must not switch its fights off. */
const ARENA_FIGHT = { townFight: true } as const;

function inDisc(cx: number, cz: number, r: number, x: number, z: number): boolean {
  return (x - cx) ** 2 + (z - cz) ** 2 <= r * r;
}

function angleDiff(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

function inCone(cx: number, cz: number, r: number, dir: number, x: number, z: number): boolean {
  const dx = x - cx;
  const dz = z - cz;
  if (dx * dx + dz * dz > r * r) return false;
  if (dx === 0 && dz === 0) return true;
  return angleDiff(Math.atan2(dx, dz), dir) <= CONE_HALF_ANGLE;
}

function inLane(cx: number, cz: number, dir: number, len: number, wid: number, x: number, z: number): boolean {
  const dx = x - cx;
  const dz = z - cz;
  const along = dx * Math.sin(dir) + dz * Math.cos(dir);
  const across = Math.abs(dx * Math.cos(dir) - dz * Math.sin(dir));
  return along >= 0 && along <= len && across <= wid / 2;
}

export interface SimArena {
  readonly scenario: ScenarioSpec;
  observe(): SimObservation;
  step(action: SimAction, dt?: number): void;
  isDone(): boolean;
  result(seed: number): SimRunResult;
  dispose(): void;
}

interface ActiveTelegraph extends SimTelegraph {
  sourceEntityId: number;
  move: BossMoveDef;
}

interface ActivePool {
  x: number;
  z: number;
  radius: number;
  left: number;
  tick: number;
  def: EnemyDef;
  move: BossMoveDef;
}

interface PendingSummon {
  left: number;
  sourceId: number;
  enemyId: string;
  count: number;
}

interface PendingPull {
  left: number;
  sourceId: number;
}

export function createArena(scenario: ScenarioSpec, loadout: LoadoutSpec, seed: number): SimArena {
  const rng = mulberry32(seed);

  // Clear existing entities and reset state
  for (const e of allEntities()) removeEntity(e.id);
  resetCombatState();
  resetAbilitiesState();
  setCombatRng(rng);
  applyLoadout(loadout);

  player.position.set(0, 0, 0);
  player.facing = 0;
  player.action = null;
  player.path = [];
  player.dead = false;
  player.swing = 0;

  let time = 0;
  let done = false;
  let won = false;
  let deathCause: DeathCause = 'none';
  let lastDamageSource: DeathCause = 'auto-attack';

  let playerHitsLanded = 0;
  let playerMisses = 0;
  let playerCrits = 0;
  let potionsUsed = 0;
  let potionCooldown = 0;
  let wentOom = false;
  let telegraphsSpawned = 0;
  let telegraphsDodged = 0;
  let telegraphsHit = 0;
  let nextTelegraphId = 1;
  let pendingDamageSource = 'auto';

  const damageDealtBySource: Record<string, number> = {};
  const damageTakenBySource: Record<string, number> = {};

  const telegraphs: ActiveTelegraph[] = [];
  const pools: ActivePool[] = [];
  const pendingSummons: PendingSummon[] = [];
  const pendingPulls: PendingPull[] = [];
  const moveTimers = new Map<string, number>();
  const hiddenBosses = new Map<number, number>();
  const summonedIds = new Set<number>();

  // Raid helpers (scenario.helpers): the same pure logic the game's Wayfarers use (src/raidHelperLogic.ts).
  // helpers[n] is the n-th helper seat; its RAID_HELPER_TARGET_BASE - index id is the attacker id.
  const helpers: HelperState[] = (scenario.helpers ?? [])
    .filter((s) => s.kind === 'helper')
    .map((s, i) => createHelperState(i, s));
  const helperStatList = helpers.map((h) => helperStats(h.role, h.level));
  let raidBossSeen = false;

  // Wave management
  let nextWaveIdx = 0;
  let restTimer = 0;
  let defendRingoutTimer = 0;

  // Mechanic state
  let veshLeechTimer = 15;
  const veshLeechIds = new Set<number>();
  let gromwellFloodTimer: number | null = null;
  let magpieLowHpTimer = 0;

  // Track spawned waves for non-gauntlet timed spawns
  const spawnedWaves = new Set<number>();

  function spawnSpec(spec: EnemySpawnSpec, isAdd = false): void {
    const count = spec.count ?? 1;
    const baseDist = spec.distance ?? 8;
    const spread = spec.angleSpread ?? Math.PI * 0.6;
    for (let i = 0; i < count; i++) {
      const offset = count === 1 ? 0 : ((i / (count - 1)) - 0.5) * spread;
      const angle = offset;
      const x = Math.sin(angle) * baseDist;
      const z = Math.cos(angle) * baseDist;
      const e = spawnEnemyAt(spec.enemyId, x, z, ARENA_FIGHT);
      if (e) {
        e.inCombat = true;
        e.attackTimer = 0.8 + rng() * 0.8;
        if (isAdd) summonedIds.add(e.id);
        if (scenario.raidBoss !== undefined && e.defId === scenario.raidBoss) raidBossSeen = true;
      }
    }
  }

  if (scenario.kind === 'gauntlet') {
    if (scenario.waves.length > 0) {
      spawnSpec(scenario.waves[0]);
      nextWaveIdx = 1;
    }
  } else {
    for (let i = 0; i < scenario.waves.length; i++) {
      const w = scenario.waves[i];
      if ((w.spawnAtSeconds ?? 0) <= 0) {
        spawnSpec(w);
        spawnedWaves.add(i);
      }
    }
  }

  const onHit = (h: {
    attacker: number;
    target: number;
    damage: number;
    spell?: boolean;
    damageType?: string;
    crit?: boolean;
  }) => {
    if (h.attacker === PLAYER_ID && h.target !== PLAYER_ID) {
      playerHitsLanded++;
      if (h.crit) playerCrits++;
      let src = pendingDamageSource;
      if (src === 'combat-update') {
        if (h.crit !== undefined) {
          src = 'auto';
        } else if (h.damageType === 'slash') {
          src = 'chipped';
        } else if (h.damageType === 'pierce') {
          src = 'poisoned';
        } else if (h.damageType === 'sun') {
          src = 'burning';
        } else {
          src = 'dot';
        }
      }
      damageDealtBySource[src] = (damageDealtBySource[src] ?? 0) + h.damage;
    } else if (h.target === PLAYER_ID) {
      let srcKey: string;
      if (pendingDamageSource.startsWith('telegraph:')) {
        srcKey = pendingDamageSource;
        lastDamageSource = pendingDamageSource as DeathCause;
      } else if (h.attacker !== PLAYER_ID) {
        const attackerEnt = getEntity(h.attacker);
        const defId = attackerEnt?.defId ?? 'enemy';
        srcKey = `${defId}:auto`;
        lastDamageSource = summonedIds.has(h.attacker) ? `adds:${defId}` : 'auto-attack';
      } else {
        srcKey = `dot:${h.damageType ?? 'status'}`;
        lastDamageSource = 'dot:poisoned';
      }
      damageTakenBySource[srcKey] = (damageTakenBySource[srcKey] ?? 0) + h.damage;
    }
  };

  const onMiss = (m: { attacker: number; target: number }) => {
    if (m.attacker === PLAYER_ID && m.target !== PLAYER_ID) {
      playerMisses++;
    }
  };

  const onPlayerDied = () => {
    if (!done) {
      done = true;
      won = false;
      deathCause = lastDamageSource;
    }
  };

  bus.on('hit', onHit);
  bus.on('miss', onMiss);
  bus.on('player-died', onPlayerDied);

  function liveEnemies(): Entity[] {
    return allEntities().filter((e) => e.kind === 'enemy' && !e.dead);
  }

  function liveBoss(): Entity | undefined {
    if (scenario.raidBoss === undefined) return undefined;
    return liveEnemies().find((e) => e.defId === scenario.raidBoss);
  }

  function nearestToPlayer(list: readonly Entity[]): Entity | undefined {
    let best: Entity | undefined;
    let bestDist = Infinity;
    for (const e of list) {
      const d = Math.hypot(e.position.x - player.position.x, e.position.z - player.position.z);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  /** Tank and healer hit the boss (or the nearest enemy without one); the damage helper takes the weakest add. */
  function helperAttackTarget(h: HelperState): Entity | undefined {
    const enemies = liveEnemies();
    const boss = liveBoss();
    if (h.role === 'damage') {
      let weakest: Entity | undefined;
      for (const e of enemies) {
        if (e === boss) continue;
        if (!weakest || e.hp < weakest.hp) weakest = e;
      }
      return weakest ?? boss;
    }
    return boss ?? nearestToPlayer(enemies);
  }

  /** Raid helpers act once per step: tick their timers, then attack or heal. */
  function stepHelpers(dt: number): void {
    if (player.dead) return;
    for (let i = 0; i < helpers.length; i++) {
      const h = helpers[i];
      const st = helperStatList[i];
      const ticks = tickHelper(h, dt);
      if (!isUp(h)) continue;
      if (ticks.attack) {
        const target = helperAttackTarget(h);
        if (target) {
          const dealt = dealDamage(target.id, st.hit, st.damageType, {
            attacker: RAID_HELPER_TARGET_BASE - h.index,
            noRoll: true,
          });
          const key = `helper:${h.role}`;
          damageDealtBySource[key] = (damageDealtBySource[key] ?? 0) + dealt;
        }
      }
      if (ticks.heal && st.heal > 0) {
        const to = pickHealTarget(state.hp / maxHp(), helpers);
        if (to === 'player') {
          healPlayer(st.heal);
        } else if (typeof to === 'number') {
          const ally = helpers[to];
          if (ally) ally.hp = Math.min(ally.hpMax, ally.hp + st.heal);
        }
      }
    }
  }

  function playerStatuses(): ReadonlySet<StatusId> {
    const s = new Set<StatusId>();
    for (const id of STATUS_IDS) if (hasStatus(PLAYER_ID, id)) s.add(id);
    return s;
  }

  function enemyStatuses(id: number): ReadonlySet<StatusId> {
    const s = new Set<StatusId>();
    for (const st of STATUS_IDS) if (hasStatus(id, st)) s.add(st);
    return s;
  }

  function hitPlayerFromMove(def: EnemyDef, move: BossMoveDef): void {
    if (player.dead) return;
    const [lo, hi] = enemyStats(def).damage;
    const avg = (lo + hi) / 2;
    let dmg = avg * (move.damage ?? 1);
    if (def.damageType === 'slash' || def.damageType === 'crush' || def.damageType === 'pierce') {
      dmg *= 1 - playerMitigation(def.level);
    }
    const prev = pendingDamageSource;
    pendingDamageSource = `telegraph:${move.id}`;
    dealDamage(PLAYER_ID, dmg, def.damageType, { noRoll: true });
    pendingDamageSource = prev;
    if (move.status) {
      const isDot = move.status === 'poisoned' || move.status === 'burning' || move.status === 'chipped';
      const dotPower = isDot ? Math.max(1, avg * (move.kind === 'pool' ? 0.1 : 0.22)) : 0;
      applyStatus(PLAYER_ID, move.status, move.statusSeconds ?? 3, dotPower);
    }
  }

  function triggerBossMove(e: Entity, def: EnemyDef, move: BossMoveDef): void {
    const cx = e.position.x;
    const cz = e.position.z;
    const px = player.position.x;
    const pz = player.position.z;

    if (move.kind === 'ring' || move.kind === 'cone' || move.kind === 'lane' || move.kind === 'pool' || move.kind === 'vanish') {
      const dir = Math.atan2(px - cx, pz - cz);
      const tcx = move.kind === 'pool' ? px : cx;
      const tcz = move.kind === 'pool' ? pz : cz;
      telegraphsSpawned++;
      telegraphs.push({
        id: nextTelegraphId++,
        moveId: move.id,
        moveName: move.name,
        kind: move.kind,
        cx: tcx,
        cz: tcz,
        dir,
        radius: move.radius ?? (move.kind === 'cone' ? 6 : move.kind === 'pool' ? 2 : 3),
        length: move.length ?? 8,
        width: move.width ?? 1.5,
        age: 0,
        duration: Math.max(0.2, move.telegraph),
        damageMult: move.damage ?? 1,
        status: move.status,
        statusSeconds: move.statusSeconds,
        enemyDef: def,
        sourceEntityId: e.id,
        move,
      });
    } else if (move.kind === 'summon' && move.summon) {
      pendingSummons.push({
        left: move.telegraph,
        sourceId: e.id,
        enemyId: move.summon.enemy,
        count: move.summon.count,
      });
    } else if (move.kind === 'pull') {
      pendingPulls.push({
        left: move.telegraph,
        sourceId: e.id,
      });
    }
  }

  function observe(): SimObservation {
    const res = resource();
    const enemies: SimEnemyView[] = liveEnemies().map((e) => ({
      id: e.id,
      defId: e.defId,
      def: ENEMIES[e.defId],
      x: e.position.x,
      z: e.position.z,
      dist: Math.hypot(e.position.x - player.position.x, e.position.z - player.position.z),
      hp: e.hp,
      maxHp: e.maxHp,
      statuses: enemyStatuses(e.id),
    }));

    const readyAbilities = knownAbilities().filter(
      (a) => a.kind !== 'passive' && a.kind !== 'summon' && abilityCooldown(a.id) <= 0 && res.value >= a.cost,
    );

    const poolTelegraphs: SimTelegraph[] = pools.map((p, idx) => ({
      id: 100000 + idx,
      moveId: p.move.id,
      moveName: p.move.name,
      kind: 'pool',
      cx: p.x,
      cz: p.z,
      dir: 0,
      radius: p.radius,
      length: 0,
      width: 0,
      age: p.move.telegraph,
      duration: p.move.telegraph,
      damageMult: p.move.damage ?? 0.5,
      status: p.move.status,
      statusSeconds: p.move.statusSeconds,
      enemyDef: p.def,
    }));

    return {
      time,
      state,
      hp: state.hp,
      maxHp: maxHp(),
      mp: state.mp,
      maxMp: maxMp(),
      resource: res,
      x: player.position.x,
      z: player.position.z,
      statuses: playerStatuses(),
      weaponReach: weaponReach(),
      isRanged: isRangedWeapon(equippedWeapon()),
      swingReady: swingCooldown() <= 0,
      spellReady: spellCooldown() <= 0,
      readyAbilities,
      enemies,
      telegraphs: [...telegraphs.map((t) => ({ ...t })), ...poolTelegraphs],
      defendRadius: scenario.defendRadius,
    };
  }

  function movePlayerToward(tx: number, tz: number, dt: number): void {
    if (player.dead || !canAct(PLAYER_ID)) return;
    const dx = tx - player.position.x;
    const dz = tz - player.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 1e-4) return;
    const step = Math.min(dist, TUNING.walkSpeed * speedFactor(PLAYER_ID) * dt);
    player.position.x += (dx / dist) * step;
    player.position.z += (dz / dist) * step;
    player.facing = Math.atan2(dx, dz);
  }

  function step(action: SimAction, dt = SIM_STEP_S): void {
    if (done) return;
    time += dt;
    potionCooldown = Math.max(0, potionCooldown - dt);

    // Move if requested
    if (action.type === 'move') {
      movePlayerToward(action.x, action.z, dt);
    } else if ('move' in action && action.move) {
      movePlayerToward(action.move.x, action.move.z, dt);
    }

    // Execute player action
    if (action.type === 'attack') {
      player.action = { type: 'attack', target: action.targetId };
    } else if (action.type === 'cast') {
      if (action.targetId !== undefined) {
        player.action = { type: 'attack', target: action.targetId };
      }
      pendingDamageSource = action.spell;
      castSpell(action.spell);
      pendingDamageSource = 'auto';
    } else if (action.type === 'ability') {
      if (action.targetId !== undefined) {
        player.action = { type: 'attack', target: action.targetId };
      }
      const existingSlot = state.hotbar.indexOf(action.abilityId);
      const slot = existingSlot >= 2 ? existingSlot : 7;
      const saved = state.hotbar[7];
      if (existingSlot < 2) state.hotbar[7] = action.abilityId;
      pendingDamageSource = action.abilityId;
      useHotbar(slot);
      pendingDamageSource = 'auto';
      if (existingSlot < 2) state.hotbar[7] = saved;
    } else if (action.type === 'potion' && potionCooldown <= 0) {
      for (let i = 0; i < state.inventory.length; i++) {
        const slot = state.inventory[i];
        if (!slot) continue;
        const def = ITEMS[slot.item];
        if (!def || def.kind !== 'potion') continue;
        if (action.kind === 'heal' && def.heal) {
          healPlayer(def.heal);
          slot.count--;
          if (slot.count <= 0) state.inventory[i] = null;
          potionsUsed++;
          potionCooldown = 2.0;
          break;
        }
        if (action.kind === 'mana' && def.mana) {
          state.mp = Math.min(maxMp(), state.mp + def.mana);
          slot.count--;
          if (slot.count <= 0) state.inventory[i] = null;
          potionsUsed++;
          potionCooldown = 2.0;
          break;
        }
      }
    }

    // Step combat & abilities
    pendingDamageSource = 'combat-update';
    updateCombat(dt);
    pendingDamageSource = 'auto';
    updateAbilities(dt);

    if (state.classId === 'mage' && maxMp() > 0 && state.mp / maxMp() < 0.1) {
      wentOom = true;
    }

    // Update hidden vanished bosses
    for (const [id, left] of hiddenBosses) {
      if (left - dt <= 0) {
        hiddenBosses.delete(id);
        const b = getEntity(id);
        if (b && !b.dead) {
          b.position.x = player.position.x + 1.5;
          b.position.z = player.position.z;
        }
      } else {
        hiddenBosses.set(id, left - dt);
      }
    }

    // Update telegraphs
    for (let i = telegraphs.length - 1; i >= 0; i--) {
      const t = telegraphs[i];
      t.age += dt;
      if (t.age < t.duration) continue;
      telegraphs.splice(i, 1);
      if (t.kind === 'pool') {
        pools.push({ x: t.cx, z: t.cz, radius: t.radius, left: 6, tick: 1, def: t.enemyDef, move: t.move });
      } else if (t.kind === 'vanish') {
        hiddenBosses.set(t.sourceEntityId, 3);
      } else {
        const px = player.position.x;
        const pz = player.position.z;
        const hit =
          t.kind === 'ring'
            ? inDisc(t.cx, t.cz, t.radius, px, pz)
            : t.kind === 'cone'
              ? inCone(t.cx, t.cz, t.radius, t.dir, px, pz)
              : inLane(t.cx, t.cz, t.dir, t.length, t.width, px, pz);
        if (hit) {
          telegraphsHit++;
          hitPlayerFromMove(t.enemyDef, t.move);
        } else {
          telegraphsDodged++;
        }
      }
    }

    // Update lingering pools
    for (let i = pools.length - 1; i >= 0; i--) {
      const p = pools[i];
      p.left -= dt;
      p.tick -= dt;
      if (p.tick <= 0) {
        p.tick += 1;
        if (inDisc(p.x, p.z, p.radius, player.position.x, player.position.z)) {
          hitPlayerFromMove(p.def, p.move);
        }
      }
      if (p.left <= 0) pools.splice(i, 1);
    }

    // Update pending summons & pulls
    for (let i = pendingSummons.length - 1; i >= 0; i--) {
      const ps = pendingSummons[i];
      ps.left -= dt;
      if (ps.left > 0) continue;
      pendingSummons.splice(i, 1);
      const boss = getEntity(ps.sourceId);
      if (boss && !boss.dead && liveEnemies().length < 8) {
        for (let k = 0; k < ps.count; k++) {
          const a = (k / ps.count) * Math.PI * 2 + rng();
          const add = spawnEnemyAt(ps.enemyId, boss.position.x + Math.cos(a) * 2.5, boss.position.z + Math.sin(a) * 2.5, ARENA_FIGHT);
          if (add) {
            add.inCombat = true;
            add.attackTimer = 1.0;
            summonedIds.add(add.id);
          }
        }
      }
    }

    for (let i = pendingPulls.length - 1; i >= 0; i--) {
      const pp = pendingPulls[i];
      pp.left -= dt;
      if (pp.left > 0) continue;
      pendingPulls.splice(i, 1);
      const boss = getEntity(pp.sourceId);
      if (boss && !boss.dead && !player.dead) {
        player.position.x += (boss.position.x - player.position.x) * 0.7;
        player.position.z += (boss.position.z - player.position.z) * 0.7;
      }
    }

    stepHelpers(dt);

    // Step enemy AI & boss move timers
    for (const e of liveEnemies()) {
      if (hiddenBosses.has(e.id)) continue;
      const def = ENEMIES[e.defId];
      if (!def) continue;

      // Vesh leech behavior: walk toward Mother Vesh and heal her if within 1.5m
      if (veshLeechIds.has(e.id)) {
        const vesh = liveEnemies().find((x) => x.defId === 'mother-vesh' || x.defId.includes('vesh'));
        if (vesh) {
          const dx = vesh.position.x - e.position.x;
          const dz = vesh.position.z - e.position.z;
          const d = Math.hypot(dx, dz);
          if (d <= 1.5) {
            vesh.hp = Math.min(vesh.maxHp, vesh.hp + Math.round(vesh.maxHp * 0.15));
            removeEntity(e.id);
            veshLeechIds.delete(e.id);
            continue;
          }
          if (canAct(e.id)) {
            const spd = TUNING.enemyWalkSpeed * 0.5 * speedFactor(e.id) * dt;
            e.position.x += (dx / d) * Math.min(d, spd);
            e.position.z += (dz / d) * Math.min(d, spd);
          }
          continue;
        }
      }

      const dx = player.position.x - e.position.x;
      const dz = player.position.z - e.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > TUNING.meleeRange && canAct(e.id)) {
        const spd = TUNING.enemyWalkSpeed * speedFactor(e.id) * dt;
        const stepDist = Math.min(dist - TUNING.meleeRange, spd);
        if (stepDist > 0) {
          e.position.x += (dx / dist) * stepDist;
          e.position.z += (dz / dist) * stepDist;
        }
      }

      e.attackTimer = Math.max(0, e.attackTimer - dt * speedFactor(e.id));
      if (e.attackTimer <= 0 && canAct(e.id)) {
        // With helpers, the swing may land on one of them (any distance); otherwise the player swing is unchanged.
        const to = helpers.length > 0 ? assignSwing(def.rank, rng, helpers) : 'player';
        if (to !== 'player') {
          e.attackTimer = def.attackSeconds ?? 2.4;
          const [lo, hi] = enemyStats(def).damage;
          damageHelper(helpers[to], (lo + hi) / 2);
        } else if (dist <= TUNING.meleeRange + 0.3) {
          e.attackTimer = def.attackSeconds ?? 2.4;
          enemyAttack(e);
        }
      }

      if (def.moves && !done) {
        for (const move of def.moves) {
          const key = `${e.id}:${move.id}`;
          const left = (moveTimers.get(key) ?? move.every * 0.6) - dt;
          if (left > 0) {
            moveTimers.set(key, left);
            continue;
          }
          moveTimers.set(key, move.every);
          if (!canAct(e.id)) continue;
          if (move.belowHpPct !== undefined && e.hp / e.maxHp > move.belowHpPct) continue;
          triggerBossMove(e, def, move);
        }
      }
    }

    // Scenario mechanics
    if (!done && scenario.mechanic === 'vesh-leeches') {
      const vesh = liveEnemies().find((x) => x.defId === 'mother-vesh' || x.defId.includes('vesh'));
      if (vesh) {
        veshLeechTimer -= dt;
        if (veshLeechTimer <= 0) {
          veshLeechTimer = 12;
          const leechId = ENEMIES['c5-brood-leech'] ? 'c5-brood-leech' : ENEMIES['pipe-leech'] ? 'pipe-leech' : 'slug';
          const baseAngle = Math.atan2(player.position.z - vesh.position.z, player.position.x - vesh.position.x) + Math.PI / 2;
          for (let k = 0; k < 2; k++) {
            const a = baseAngle + (k === 0 ? -0.3 : 0.3);
            const leech = spawnEnemyAt(leechId, vesh.position.x + Math.cos(a) * 9, vesh.position.z + Math.sin(a) * 9, ARENA_FIGHT);
            if (leech) {
              leech.inCombat = true;
              veshLeechIds.add(leech.id);
              summonedIds.add(leech.id);
            }
          }
        }
      }
    }

    if (!done && scenario.mechanic === 'gromwell-flood') {
      const gromwell = liveEnemies().find((x) => x.defId.includes('gromwell'));
      if (gromwell) {
        if (gromwellFloodTimer === null && gromwell.hp / gromwell.maxHp <= 0.3) {
          gromwellFloodTimer = 25;
        } else if (gromwellFloodTimer !== null) {
          gromwellFloodTimer -= dt;
          if (gromwellFloodTimer <= 0) {
            done = true;
            won = false;
            deathCause = 'mechanic';
          }
        }
      }
    }

    if (!done && scenario.mechanic === 'kiln-kneel') {
      const kiln = liveEnemies().find((x) => x.defId.includes('kiln'));
      if (kiln && kiln.hp / kiln.maxHp <= 0.1) {
        done = true;
        won = true;
      }
    }

    if (!done && scenario.mechanic === 'magpie-flee') {
      const magpie = liveEnemies().find((x) => x.defId === 'magpie-thief');
      if (magpie && magpie.hp / magpie.maxHp < 0.2) {
        magpieLowHpTimer += dt;
        if (magpieLowHpTimer > 4) {
          done = true;
          won = false;
          deathCause = 'mechanic';
        }
      } else {
        magpieLowHpTimer = 0;
      }
    }

    // Defend ringout check
    if (!done && scenario.defendRadius !== undefined) {
      const distFromCenter = Math.hypot(player.position.x, player.position.z);
      if (distFromCenter > scenario.defendRadius + 6) {
        defendRingoutTimer += dt;
        if (defendRingoutTimer > 5) {
          done = true;
          won = false;
          deathCause = 'defend-ringout';
        }
      } else {
        defendRingoutTimer = 0;
      }
      if (!done && scenario.defendSeconds !== undefined && time >= scenario.defendSeconds) {
        done = true;
        won = true;
      }
    }

    // Raid win: the boss has spawned and died; the remaining adds go with it.
    if (!done && scenario.raidBoss !== undefined && raidBossSeen && !liveBoss()) {
      for (const e of liveEnemies()) removeEntity(e.id);
      done = true;
      won = true;
    }

    // Wave progression
    if (!done && scenario.kind === 'gauntlet') {
      if (liveEnemies().length === 0) {
        if (nextWaveIdx < scenario.waves.length) {
          restTimer += dt;
          if (restTimer >= (scenario.restBetweenWavesSeconds ?? 8)) {
            restTimer = 0;
            spawnSpec(scenario.waves[nextWaveIdx]);
            nextWaveIdx++;
          }
        } else {
          done = true;
          won = true;
        }
      }
    } else if (!done) {
      for (let i = 0; i < scenario.waves.length; i++) {
        if (spawnedWaves.has(i)) continue;
        const w = scenario.waves[i];
        if (time >= (w.spawnAtSeconds ?? 0)) {
          spawnSpec(w);
          spawnedWaves.add(i);
        }
      }
      if (scenario.kind !== 'defend' && spawnedWaves.size === scenario.waves.length && liveEnemies().length === 0) {
        done = true;
        won = true;
      }
    }

    // Hard timeout
    const maxSec = scenario.maxSeconds ?? (scenario.kind === 'boss' ? 240 : 120);
    if (!done && time >= maxSec) {
      done = true;
      won = false;
      deathCause = 'timeout';
    }
  }

  function dispose(): void {
    bus.off('hit', onHit);
    bus.off('miss', onMiss);
    bus.off('player-died', onPlayerDied);
    for (const e of allEntities()) removeEntity(e.id);
    resetCombatState();
    resetAbilitiesState();
  }

  return {
    scenario,
    observe,
    step,
    isDone: () => done,
    result: (s: number): SimRunResult => ({
      seed: s,
      won,
      durationSeconds: Number(time.toFixed(2)),
      hpRemainingPct: maxHp() > 0 ? Math.max(0, state.hp) / maxHp() : 0,
      mpRemainingPct: maxMp() > 0 ? Math.max(0, state.mp) / maxMp() : 0,
      playerHitsLanded,
      playerMisses,
      playerCrits,
      potionsUsed,
      wentOom,
      telegraphsSpawned,
      telegraphsDodged,
      telegraphsHit,
      damageDealtBySource,
      damageTakenBySource,
      deathCause: won ? 'none' : deathCause,
    }),
    dispose,
  };
}

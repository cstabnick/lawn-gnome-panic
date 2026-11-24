// Pure 2v2 MOBA world simulation: heroes, creeps, Soul Acorn Orbs, towers, 5-min Gilded Relic, abilities, and projectiles.
import { intersectRaySphere, dist3 } from './combat';
import {
  ECONOMY,
  levelForAcorns,
  MATCH_CONFIG,
  MOVEMENT,
  type AbilitySlot,
  type HeroId,
  type Team,
} from './config';
import { HEROES, type HeroDef } from './heroes';
import { computeHeroStats, ITEM_BY_ID, type ComputedStats } from './items';
import {
  FOUNTAINS,
  groundHeightAt,
  isNearShop,
  RELIC_ALTAR,
  STRUCTURES,
} from './map';
import { createMoveState, stepHeroMovement, type MoveInput, type MoveState } from './movement';

export interface HeroEntity {
  slot: number; // 0..3 (0,1 = Team 0; 2,3 = Team 1)
  team: Team;
  heroId: HeroId;
  name: string;
  isBot: boolean;
  userId?: string;
  characterCode?: string;
  move: MoveState;
  yaw: number;
  pitch: number;
  hp: number;
  maxHp: number;
  shield: number;
  shieldTimer: number;
  alive: boolean;
  respawnTimer: number;
  acorns: number;
  totalAcorns: number;
  level: number;
  kills: number;
  deaths: number;
  assists: number;
  lastHits: number;
  orbsConfirmed: number;
  orbsDenied: number;
  streak: number;
  items: string[];
  ammo: number;
  reloadTimer: number;
  fireCooldown: number;
  cooldowns: Record<AbilitySlot, number>;
  stats: ComputedStats;
  // Status buffs
  speedBuffTimer: number;
  speedBuffMult: number;
  fireRateBuffTimer: number;
  fireRateBuffMult: number;
  dmgBuffTimer: number;
  dmgBuffMult: number;
  infiniteAmmoTimer: number;
  cdrBuffTimer: number;
  stealthTimer: number;
  // Economy breakdown for balance telemetry
  incomePassive: number;
  incomeLastHit: number;
  incomeOrb: number;
  incomeKill: number;
  incomeObjective: number;
  // Damage attribution
  lastDamagedBySlot: number;
  lastDamagedTimer: number;
}

export interface CreepEntity {
  id: number;
  team: Team;
  kind: 'melee' | 'ranged' | 'super';
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  damage: number;
  range: number;
  fireCooldown: number;
  bounty: number;
  lastDamagedBySlot: number;
}

export interface StructureEntity {
  id: string;
  team: Team;
  tier: 1 | 2 | 3 | 4;
  name: string;
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  range: number;
  damage: number;
  fireIntervalS: number;
  fireCooldown: number;
  radius: number;
  invulnerable: boolean;
  targetId: string | null;
  aggroHeroSlot: number | null;
  aggroTimer: number;
}

export interface SoulOrbEntity {
  id: number;
  team: Team; // team that gets it if confirmed or expired
  x: number;
  y: number;
  z: number;
  acorns: number;
  ttl: number;
}

export interface TurretEntity {
  id: number;
  ownerSlot: number;
  team: Team;
  x: number;
  y: number;
  z: number;
  ttl: number;
  fireCooldown: number;
  damage: number;
}

export interface AoeZoneEntity {
  id: number;
  ownerSlot: number;
  team: Team;
  kind: 'root' | 'sap' | 'overheat' | 'bomb' | 'spore' | 'blackhole';
  x: number;
  y: number;
  z: number;
  radius: number;
  ttl: number;
  tickTimer: number;
  dps: number;
  slowMult: number;
  rootS: number;
  pullStrength?: number;
  explodeDmg?: number;
}

export interface RelicState {
  spawned: boolean;
  alive: boolean;
  hp: number;
  maxHp: number;
  claimedByTeam: Team | null;
  blessingTimer: Record<Team, number>;
}

export type SimEvent =
  | { type: 'shot'; slot: number; team: Team; ox: number; oy: number; oz: number; tx: number; ty: number; tz: number; hitKind: 'none' | 'body' | 'orb-confirm' | 'orb-deny' | 'structure' }
  | { type: 'damage'; targetKind: 'hero' | 'creep' | 'structure' | 'relic'; targetSlot?: number; x: number; y: number; z: number; amount: number; sourceSlot: number }
  | { type: 'orbConfirm'; slot: number; team: Team; acorns: number; x: number; y: number; z: number }
  | { type: 'orbDeny'; slot: number; team: Team; acorns: number; x: number; y: number; z: number }
  | { type: 'heroKill'; killerSlot: number; victimSlot: number; x: number; y: number; z: number }
  | { type: 'towerDown'; team: Team; tier: number; killerSlot: number; x: number; y: number; z: number }
  | { type: 'relicSpawn' }
  | { type: 'relicClaimed'; team: Team; killerSlot: number }
  | { type: 'ability'; slot: number; team: Team; ability: AbilitySlot; x: number; y: number; z: number; tx: number; ty: number; tz: number }
  | { type: 'flowTier3'; slot: number }
  | { type: 'dashJump'; slot: number }
  | { type: 'moveTech'; slot: number; kind: 'jump' | 'doubleJump' | 'wallJump' | 'dash' | 'slide' };

export interface HeroActionInput {
  move: MoveInput;
  pitch: number;
  fireHeld: boolean;
  reloadPressed: boolean;
  abilityPressed: AbilitySlot | null;
}

export interface MatchState {
  timeS: number;
  nextEntityId: number;
  waveTimerS: number;
  waveCount: number;
  heroes: HeroEntity[];
  creeps: CreepEntity[];
  structures: StructureEntity[];
  orbs: SoulOrbEntity[];
  turrets: TurretEntity[];
  zones: AoeZoneEntity[];
  relic: RelicState;
  winner: Team | null;
  leaderAt5Min: Team | null;
  leadPctAt5Min: number;
  snapshot5MinTaken: boolean;
  events: SimEvent[];
  rng: () => number;
}

export function createRng(seed = 1337): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export interface SlotSetup {
  heroId: HeroId;
  name: string;
  isBot: boolean;
  userId?: string;
  characterCode?: string;
}

export function createMatchState(slots: SlotSetup[], seed = 1337): MatchState {
  const rng = createRng(seed);
  const heroes: HeroEntity[] = slots.map((s, idx) => {
    const team: Team = idx < 2 ? 0 : 1;
    const spawnZ = team === 0 ? -116 : 116;
    const spawnX = idx % 2 === 0 ? -3.2 : 3.2;
    const spawnY = groundHeightAt(spawnX, spawnZ);
    const def = HEROES[s.heroId];
    const stats = computeHeroStats(def, [], 1, 0, false);
    return {
      slot: idx,
      team,
      heroId: s.heroId,
      name: s.name,
      isBot: s.isBot,
      userId: s.userId,
      characterCode: s.characterCode,
      move: createMoveState(spawnX, spawnY, spawnZ, stats.maxStamina),
      yaw: team === 0 ? Math.PI : 0, // face center (0,0)
      pitch: 0,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      shield: 0,
      shieldTimer: 0,
      alive: true,
      respawnTimer: 0,
      acorns: ECONOMY.startingAcorns,
      totalAcorns: ECONOMY.startingAcorns,
      level: 1,
      kills: 0,
      deaths: 0,
      assists: 0,
      lastHits: 0,
      orbsConfirmed: 0,
      orbsDenied: 0,
      streak: 0,
      items: [],
      ammo: stats.magSize,
      reloadTimer: 0,
      fireCooldown: 0,
      cooldowns: { Q: 0, E: 0, F: 0, X: 0 },
      stats,
      speedBuffTimer: 0,
      speedBuffMult: 1,
      fireRateBuffTimer: 0,
      fireRateBuffMult: 1,
      dmgBuffTimer: 0,
      dmgBuffMult: 1,
      infiniteAmmoTimer: 0,
      cdrBuffTimer: 0,
      stealthTimer: 0,
      incomePassive: ECONOMY.startingAcorns,
      incomeLastHit: 0,
      incomeOrb: 0,
      incomeKill: 0,
      incomeObjective: 0,
      lastDamagedBySlot: -1,
      lastDamagedTimer: 0,
    };
  });

  const structures: StructureEntity[] = STRUCTURES.map((st) => ({
    ...st,
    y: groundHeightAt(st.x, st.z),
    hp: st.maxHp,
    fireCooldown: 0,
    invulnerable: st.tier > 1,
    targetId: null,
    aggroHeroSlot: null,
    aggroTimer: 0,
  }));

  const state: MatchState = {
    timeS: 0,
    nextEntityId: 1,
    waveTimerS: 3, // first wave spawns 3s in
    waveCount: 0,
    heroes,
    creeps: [],
    structures,
    orbs: [],
    turrets: [],
    zones: [],
    relic: {
      spawned: false,
      alive: false,
      hp: RELIC_ALTAR.maxHp,
      maxHp: RELIC_ALTAR.maxHp,
      claimedByTeam: null,
      blessingTimer: { 0: 0, 1: 0 },
    },
    winner: null,
    leaderAt5Min: null,
    leadPctAt5Min: 0,
    snapshot5MinTaken: false,
    events: [],
    rng,
  };
  return state;
}

function awardAcorns(
  h: HeroEntity,
  amount: number,
  bucket: 'passive' | 'lastHit' | 'orb' | 'kill' | 'objective',
): void {
  const amt = Math.round(amount);
  if (amt <= 0) return;
  h.acorns += amt;
  h.totalAcorns += amt;
  if (bucket === 'passive') h.incomePassive += amt;
  else if (bucket === 'lastHit') h.incomeLastHit += amt;
  else if (bucket === 'orb') h.incomeOrb += amt;
  else if (bucket === 'kill') h.incomeKill += amt;
  else h.incomeObjective += amt;
  h.level = levelForAcorns(h.totalAcorns);
}

export function teamTotalAcorns(state: MatchState, team: Team): number {
  let sum = 0;
  for (const h of state.heroes) {
    if (h.team === team) sum += h.totalAcorns;
  }
  return sum;
}

export function tryBuyItem(state: MatchState, slot: number, itemId: string): boolean {
  const h = state.heroes[slot];
  if (!h || !h.alive) return false;
  if (h.items.length >= 6) return false;
  if (h.items.includes(itemId)) return false;
  const item = ITEM_BY_ID.get(itemId);
  if (!item || h.acorns < item.cost) return false;
  if (!isNearShop(h.move.pos.x, h.move.pos.z, h.team)) return false;

  h.acorns -= item.cost;
  h.items.push(itemId);
  recomputeHeroStats(state, h);
  h.hp = Math.min(h.maxHp, h.hp + (item.stats.maxHp ?? 0));
  return true;
}

function recomputeHeroStats(state: MatchState, h: HeroEntity): void {
  const def = HEROES[h.heroId];
  const blessing = state.relic.blessingTimer[h.team] > 0;
  h.stats = computeHeroStats(def, h.items, h.level, h.move.flowTier, blessing);
  h.maxHp = h.stats.maxHp;
  if (h.hp > h.maxHp) h.hp = h.maxHp;
  h.move.maxStamina = h.stats.maxStamina;
  if (h.move.stamina > h.move.maxStamina) h.move.stamina = h.move.maxStamina;
  h.move.speedBonus = h.stats.moveSpeedBonus;
  const speedMult = h.speedBuffTimer > 0 ? h.speedBuffMult : 1;
  h.move.statusSpeedMult = speedMult;
}

function updateStructureLocks(state: MatchState): void {
  for (const team of [0, 1] as const) {
    const t1 = state.structures.find((s) => s.team === team && s.tier === 1);
    const t2 = state.structures.find((s) => s.team === team && s.tier === 2);
    const t3 = state.structures.find((s) => s.team === team && s.tier === 3);
    const t4 = state.structures.find((s) => s.team === team && s.tier === 4);
    if (t1) t1.invulnerable = false;
    if (t2) t2.invulnerable = Boolean(t1 && t1.hp > 0);
    if (t3) t3.invulnerable = Boolean(t2 && t2.hp > 0);
    if (t4) t4.invulnerable = Boolean(t3 && t3.hp > 0);
  }
}

function spawnCreepWave(state: MatchState, superCount = 0): void {
  state.waveCount++;
  const scale = 1 + Math.min(1.8, state.timeS / 360);
  for (const team of [0, 1] as const) {
    const baseZ = team === 0 ? -94 : 94;
    const dir = team === 0 ? 1 : -1;
    for (let i = 0; i < MATCH_CONFIG.creepsPerWave; i++) {
      const isRanged = i === MATCH_CONFIG.creepsPerWave - 1;
      const offsetX = (i - 1.5) * 2.1;
      const z = baseZ + (isRanged ? -2.2 * dir : 0);
      state.creeps.push({
        id: state.nextEntityId++,
        team,
        kind: isRanged ? 'ranged' : 'melee',
        x: offsetX,
        y: groundHeightAt(offsetX, z),
        z,
        hp: Math.round((isRanged ? 150 : 230) * scale),
        maxHp: Math.round((isRanged ? 150 : 230) * scale),
        damage: Math.round((isRanged ? 18 : 15) * scale),
        range: isRanged ? 10 : 2.3,
        fireCooldown: 0.4,
        bounty: ECONOMY.creepBaseBounty,
        lastDamagedBySlot: -1,
      });
    }
    for (let s = 0; s < superCount; s++) {
      const offsetX = (s - 0.5) * 3.0;
      state.creeps.push({
        id: state.nextEntityId++,
        team,
        kind: 'super',
        x: offsetX,
        y: groundHeightAt(offsetX, baseZ),
        z: baseZ,
        hp: Math.round(460 * scale),
        maxHp: Math.round(460 * scale),
        damage: Math.round(34 * scale),
        range: 3.0,
        fireCooldown: 0.3,
        bounty: 120,
        lastDamagedBySlot: -1,
      });
    }
  }
}

function applyDamageToHero(state: MatchState, victim: HeroEntity, amount: number, sourceSlot: number): void {
  if (!victim.alive || amount <= 0) return;
  victim.move.outOfCombatTimer = 0;
  let rem = amount;
  if (victim.shield > 0) {
    const absorbed = Math.min(victim.shield, rem);
    victim.shield -= absorbed;
    rem -= absorbed;
  }
  if (rem > 0) {
    victim.hp -= rem;
    if (sourceSlot >= 0) {
      victim.lastDamagedBySlot = sourceSlot;
      victim.lastDamagedTimer = 6;
      // Trigger tower aggro if near enemy tower
      for (const st of state.structures) {
        if (st.hp > 0 && st.team === victim.team) {
          const attacker = state.heroes[sourceSlot];
          if (attacker && attacker.team !== st.team) {
            const d = Math.hypot(attacker.move.pos.x - st.x, attacker.move.pos.z - st.z);
            if (d <= st.range) {
              st.aggroHeroSlot = sourceSlot;
              st.aggroTimer = 3.0;
            }
          }
        }
      }
    }
  }

  state.events.push({
    type: 'damage',
    targetKind: 'hero',
    targetSlot: victim.slot,
    x: victim.move.pos.x,
    y: victim.move.pos.y + 1.0,
    z: victim.move.pos.z,
    amount: Math.round(amount),
    sourceSlot,
  });

  if (victim.hp <= 0) {
    victim.hp = 0;
    victim.alive = false;
    victim.deaths++;
    victim.streak = 0;
    const min = state.timeS / 60;
    let resp = Math.min(MATCH_CONFIG.respawnMaxS, MATCH_CONFIG.respawnBaseS + min * MATCH_CONFIG.respawnScalePerMin);
    if (state.relic.blessingTimer[victim.team] > 0) {
      resp *= ECONOMY.relicBlessingRespawnMult;
    }
    victim.respawnTimer = resp;

    const killerSlot = sourceSlot >= 0 ? sourceSlot : victim.lastDamagedBySlot;
    if (killerSlot >= 0 && state.heroes[killerSlot]) {
      const killer = state.heroes[killerSlot];
      killer.kills++;
      killer.streak++;
      const trailingBonus =
        teamTotalAcorns(state, killer.team) < teamTotalAcorns(state, victim.team)
          ? Math.min(ECONOMY.comebackBonusMax, Math.round((teamTotalAcorns(state, victim.team) - teamTotalAcorns(state, killer.team)) * 0.08))
          : 0;
      const bounty = ECONOMY.heroKillBase + killer.streak * ECONOMY.heroKillStreakStep + trailingBonus;
      awardAcorns(killer, bounty, 'kill');
      // Assist to teammate if nearby
      for (const ally of state.heroes) {
        if (ally.team === killer.team && ally.slot !== killer.slot && ally.alive) {
          if (Math.hypot(ally.move.pos.x - victim.move.pos.x, ally.move.pos.z - victim.move.pos.z) < 24) {
            ally.assists++;
            awardAcorns(ally, bounty * 0.4, 'kill');
          }
        }
      }
    }

    state.events.push({
      type: 'heroKill',
      killerSlot: killerSlot >= 0 ? killerSlot : -1,
      victimSlot: victim.slot,
      x: victim.move.pos.x,
      y: victim.move.pos.y + 0.8,
      z: victim.move.pos.z,
    });
  }
}

function handleCreepDeath(state: MatchState, creep: CreepEntity, killerSlot: number): void {
  if (killerSlot >= 0 && state.heroes[killerSlot]?.team !== creep.team) {
    const killer = state.heroes[killerSlot];
    killer.lastHits++;
    const instant = Math.round(creep.bounty * ECONOMY.creepLastHitShare);
    const orbVal = Math.round(creep.bounty * ECONOMY.creepOrbShare);
    awardAcorns(killer, instant, 'lastHit');
    // Spawn Soul Acorn Orb!
    state.orbs.push({
      id: state.nextEntityId++,
      team: killer.team,
      x: creep.x,
      y: creep.y + 0.85,
      z: creep.z,
      acorns: orbVal,
      ttl: ECONOMY.orbLifetimeS,
    });
  } else {
    // Missed last-hit: proximity share to nearby enemy heroes
    const proxVal = Math.round(creep.bounty * ECONOMY.creepProximityShare);
    for (const h of state.heroes) {
      if (h.team !== creep.team && h.alive) {
        if (Math.hypot(h.move.pos.x - creep.x, h.move.pos.z - creep.z) <= 18) {
          awardAcorns(h, proxVal, 'passive');
        }
      }
    }
  }
}

function damageStructure(state: MatchState, st: StructureEntity, amount: number, sourceSlot: number): void {
  if (st.hp <= 0 || st.invulnerable) return;
  const mult = MATCH_CONFIG.overtimeMult(state.timeS);
  const dmg = amount * mult;
  st.hp = Math.max(0, st.hp - dmg);
  state.events.push({
    type: 'damage',
    targetKind: 'structure',
    x: st.x,
    y: st.y + 2.2,
    z: st.z,
    amount: Math.round(dmg),
    sourceSlot,
  });

  if (st.hp <= 0) {
    if (st.tier === 4) {
      state.winner = st.team === 0 ? 1 : 0;
    } else {
      const bounty = ECONOMY.towerBounty[st.tier];
      const killerTeam: Team = st.team === 0 ? 1 : 0;
      for (const h of state.heroes) {
        if (h.team === killerTeam) {
          awardAcorns(h, bounty, 'objective');
        }
      }
      updateStructureLocks(state);
    }
    state.events.push({
      type: 'towerDown',
      team: st.team,
      tier: st.tier,
      killerSlot: sourceSlot,
      x: st.x,
      y: st.y + 2.0,
      z: st.z,
    });
  }
}

function damageRelic(state: MatchState, amount: number, sourceSlot: number): void {
  if (!state.relic.alive || state.relic.hp <= 0) return;
  state.relic.hp = Math.max(0, state.relic.hp - amount);
  state.events.push({
    type: 'damage',
    targetKind: 'relic',
    x: RELIC_ALTAR.x,
    y: groundHeightAt(RELIC_ALTAR.x, RELIC_ALTAR.z) + 1.5,
    z: RELIC_ALTAR.z,
    amount: Math.round(amount),
    sourceSlot,
  });

  if (state.relic.hp <= 0 && sourceSlot >= 0 && state.heroes[sourceSlot]) {
    const team = state.heroes[sourceSlot].team;
    state.relic.alive = false;
    state.relic.claimedByTeam = team;
    state.relic.blessingTimer[team] = ECONOMY.relicBlessingDurationS;
    for (const h of state.heroes) {
      if (h.team === team) {
        awardAcorns(h, ECONOMY.relicBountyPerPlayer, 'objective');
      }
    }
    // Spawn immediate super-creep for the claiming team
    const scale = 1 + Math.min(1.4, state.timeS / 420);
    const baseZ = team === 0 ? -90 : 90;
    for (let i = 0; i < 1; i++) {
      state.creeps.push({
        id: state.nextEntityId++,
        team,
        kind: 'super',
        x: (i - 0.5) * 3.2,
        y: groundHeightAt((i - 0.5) * 3.2, baseZ),
        z: baseZ,
        hp: Math.round(520 * scale),
        maxHp: Math.round(520 * scale),
        damage: Math.round(38 * scale),
        range: 3.0,
        fireCooldown: 0.3,
        bounty: 120,
        lastDamagedBySlot: -1,
      });
    }
    state.events.push({ type: 'relicClaimed', team, killerSlot: sourceSlot });
  }
}

function fireWeapon(state: MatchState, h: HeroEntity): void {
  const def = HEROES[h.heroId];
  const w = def.weapon;
  const sliding = h.move.sliding;
  const unlimited = sliding || h.infiniteAmmoTimer > 0;
  if (!unlimited) {
    if (h.ammo <= 0) {
      if (h.reloadTimer <= 0) h.reloadTimer = w.reloadS;
      return;
    }
    h.ammo--;
    if (h.ammo === 0) h.reloadTimer = w.reloadS;
  }

  const rateMult =
    h.stats.fireRateMult *
    (sliding ? 1 + MOVEMENT.slideFireRateBonus : 1) *
    (h.fireRateBuffTimer > 0 ? h.fireRateBuffMult : 1);
  h.fireCooldown = w.fireIntervalS / Math.max(0.4, rateMult);

  const ox = h.move.pos.x;
  const oy = h.move.pos.y + (sliding ? 0.55 : 0.92);
  const oz = h.move.pos.z;

  const cosP = Math.cos(h.pitch);
  const sinP = Math.sin(h.pitch);
  const sinY = Math.sin(h.yaw);
  const cosY = Math.cos(h.yaw);
  const baseDx = -sinY * cosP;
  const baseDy = sinP;
  const baseDz = -cosY * cosP;

  for (let p = 0; p < w.pellets; p++) {
    const sx = (state.rng() - 0.5) * 2 * w.spreadRad;
    const sy = (state.rng() - 0.5) * 2 * w.spreadRad;
    let dx = baseDx + sx;
    let dy = baseDy + sy;
    let dz = baseDz;
    const len = Math.hypot(dx, dy, dz) || 1;
    dx /= len;
    dy /= len;
    dz /= len;

    let bestT = w.range;
    let hitKind: 'none' | 'body' | 'orb-confirm' | 'orb-deny' | 'structure' = 'none';
    let hitTarget:
      | { kind: 'orb'; orb: SoulOrbEntity }
      | { kind: 'creep'; creep: CreepEntity }
      | { kind: 'hero'; hero: HeroEntity }
      | { kind: 'structure'; st: StructureEntity }
      | { kind: 'relic' }
      | null = null;

    // 1. Check Soul Acorn Orbs (high priority for snappy last-hit/deny!)
    for (const orb of state.orbs) {
      const hit = intersectRaySphere(ox, oy, oz, dx, dy, dz, orb.x, orb.y, orb.z, ECONOMY.orbHitRadius, bestT);
      if (hit && hit.t < bestT) {
        bestT = hit.t;
        hitKind = orb.team === h.team ? 'orb-confirm' : 'orb-deny';
        hitTarget = { kind: 'orb', orb };
      }
    }

    // 2. Check enemy heroes
    for (const other of state.heroes) {
      if (other.team === h.team || !other.alive) continue;
      const cy = other.move.pos.y + (other.move.sliding ? 0.42 : 0.65);
      const hit = intersectRaySphere(ox, oy, oz, dx, dy, dz, other.move.pos.x, cy, other.move.pos.z, 0.58, bestT);
      if (hit && hit.t < bestT) {
        bestT = hit.t;
        hitKind = 'body';
        hitTarget = { kind: 'hero', hero: other };
      }
    }

    // 3. Check enemy creeps
    for (const cr of state.creeps) {
      if (cr.team === h.team || cr.hp <= 0) continue;
      const hit = intersectRaySphere(ox, oy, oz, dx, dy, dz, cr.x, cr.y + 0.55, cr.z, 0.62, bestT);
      if (hit && hit.t < bestT) {
        bestT = hit.t;
        hitKind = 'body';
        hitTarget = { kind: 'creep', creep: cr };
      }
    }

    // 4. Check enemy structures
    for (const st of state.structures) {
      if (st.team === h.team || st.hp <= 0) continue;
      const hit = intersectRaySphere(ox, oy, oz, dx, dy, dz, st.x, st.y + 2.0, st.z, st.radius + 0.4, bestT);
      if (hit && hit.t < bestT) {
        bestT = hit.t;
        hitKind = 'structure';
        hitTarget = { kind: 'structure', st };
      }
    }

    // 5. Check 5:00 Relic
    if (state.relic.alive && state.relic.hp > 0) {
      const ry = groundHeightAt(RELIC_ALTAR.x, RELIC_ALTAR.z) + 1.4;
      const hit = intersectRaySphere(ox, oy, oz, dx, dy, dz, RELIC_ALTAR.x, ry, RELIC_ALTAR.z, RELIC_ALTAR.radius, bestT);
      if (hit && hit.t < bestT) {
        bestT = hit.t;
        hitKind = 'structure';
        hitTarget = { kind: 'relic' };
      }
    }

    const dmg = w.damage * h.stats.weaponDmgMult * (h.dmgBuffTimer > 0 ? h.dmgBuffMult : 1);
    if (hitTarget?.kind === 'orb') {
      const orb = hitTarget.orb;
      const idx = state.orbs.indexOf(orb);
      if (idx >= 0) state.orbs.splice(idx, 1);
      awardAcorns(h, orb.acorns, 'orb');
      if (orb.team === h.team) {
        h.orbsConfirmed++;
        state.events.push({ type: 'orbConfirm', slot: h.slot, team: h.team, acorns: orb.acorns, x: orb.x, y: orb.y, z: orb.z });
      } else {
        h.orbsDenied++;
        state.events.push({ type: 'orbDeny', slot: h.slot, team: h.team, acorns: orb.acorns, x: orb.x, y: orb.y, z: orb.z });
      }
    } else if (hitTarget?.kind === 'hero') {
      applyDamageToHero(state, hitTarget.hero, dmg, h.slot);
      if (h.stats.bulletLifesteal > 0) {
        h.hp = Math.min(h.maxHp, h.hp + dmg * h.stats.bulletLifesteal);
      }
    } else if (hitTarget?.kind === 'creep') {
      const cr = hitTarget.creep;
      cr.hp -= dmg;
      cr.lastDamagedBySlot = h.slot;
      state.events.push({ type: 'damage', targetKind: 'creep', x: cr.x, y: cr.y + 0.8, z: cr.z, amount: Math.round(dmg), sourceSlot: h.slot });
      if (cr.hp <= 0) {
        handleCreepDeath(state, cr, h.slot);
      }
    } else if (hitTarget?.kind === 'structure') {
      damageStructure(state, hitTarget.st, dmg, h.slot);
    } else if (hitTarget?.kind === 'relic') {
      damageRelic(state, dmg, h.slot);
    }

    if (p === 0) {
      state.events.push({
        type: 'shot',
        slot: h.slot,
        team: h.team,
        ox,
        oy,
        oz,
        tx: ox + dx * bestT,
        ty: oy + dy * bestT,
        tz: oz + dz * bestT,
        hitKind,
      });
    }
  }
}

function castAbility(state: MatchState, h: HeroEntity, slot: AbilitySlot): void {
  const def = HEROES[h.heroId];
  const ab = def.abilities[slot];
  if (h.cooldowns[slot] > 0) return;

  h.cooldowns[slot] = ab.cooldownS * h.stats.cooldownMult;
  const powerDmg = ab.baseDamage + h.stats.spiritPower * ab.spiritScale;
  const sinY = Math.sin(h.yaw);
  const cosY = Math.cos(h.yaw);
  const fwdX = -sinY;
  const fwdZ = -cosY;
  const ox = h.move.pos.x;
  const oy = h.move.pos.y + 0.8;
  const oz = h.move.pos.z;
  let tx = ox + fwdX * Math.max(4, ab.range * 0.7);
  let ty = oy;
  let tz = oz + fwdZ * Math.max(4, ab.range * 0.7);

  if (h.heroId === 'bramble') {
    if (slot === 'Q') {
      // Mulch Charge
      h.move.vel.x = fwdX * 21;
      h.move.vel.z = fwdZ * 21;
      for (const e of state.heroes) {
        if (e.team !== h.team && e.alive && Math.hypot(e.move.pos.x - ox, e.move.pos.z - oz) < 7) {
          applyDamageToHero(state, e, powerDmg, h.slot);
          e.move.rootedTimer = 0.85;
        }
      }
      for (const cr of state.creeps) {
        if (cr.team !== h.team && cr.hp > 0 && Math.hypot(cr.x - ox, cr.z - oz) < 7) {
          cr.hp -= powerDmg;
          if (cr.hp <= 0) handleCreepDeath(state, cr, h.slot);
        }
      }
    } else if (slot === 'E') {
      h.shield = 190 + h.stats.spiritPower * 0.6;
      h.shieldTimer = 3.5;
      h.speedBuffMult = 1.25;
      h.speedBuffTimer = 3.5;
    } else if (slot === 'F') {
      state.zones.push({
        id: state.nextEntityId++,
        ownerSlot: h.slot,
        team: h.team,
        kind: 'root',
        x: tx,
        y: groundHeightAt(tx, tz),
        z: tz,
        radius: 4.5,
        ttl: 3.0,
        tickTimer: 0.1,
        dps: powerDmg / 3.0,
        slowMult: 0.45,
        rootS: 1.0,
      });
    } else if (slot === 'X') {
      h.move.vel.y = 11.5;
      for (const e of state.heroes) {
        if (e.team !== h.team && e.alive && Math.hypot(e.move.pos.x - ox, e.move.pos.z - oz) < ab.range) {
          applyDamageToHero(state, e, powerDmg, h.slot);
          e.move.vel.y = 8.5;
          e.move.grounded = false;
        }
      }
      for (const cr of state.creeps) {
        if (cr.team !== h.team && cr.hp > 0 && Math.hypot(cr.x - ox, cr.z - oz) < ab.range) {
          cr.hp -= powerDmg;
          if (cr.hp <= 0) handleCreepDeath(state, cr, h.slot);
        }
      }
    }
  } else if (h.heroId === 'tansy') {
    if (slot === 'Q') {
      h.move.vel.x = fwdX * 22;
      h.move.vel.z = fwdZ * 22;
      h.move.stamina = Math.min(h.move.maxStamina, h.move.stamina + 1);
      h.fireRateBuffMult = 1.25;
      h.fireRateBuffTimer = 2.5;
    } else if (slot === 'E') {
      const airBonus = !h.move.grounded || h.move.sliding ? 1.35 : 1.0;
      for (const e of state.heroes) {
        if (e.team !== h.team && e.alive && Math.hypot(e.move.pos.x - ox, e.move.pos.z - oz) < ab.range) {
          applyDamageToHero(state, e, powerDmg * airBonus, h.slot);
        }
      }
      for (const cr of state.creeps) {
        if (cr.team !== h.team && cr.hp > 0 && Math.hypot(cr.x - ox, cr.z - oz) < ab.range) {
          cr.hp -= powerDmg * airBonus;
          if (cr.hp <= 0) handleCreepDeath(state, cr, h.slot);
        }
      }
    } else if (slot === 'F') {
      h.stealthTimer = 3.0;
      h.speedBuffMult = 1.35;
      h.speedBuffTimer = 3.0;
    } else if (slot === 'X') {
      for (const e of state.heroes) {
        if (e.team !== h.team && e.alive && Math.hypot(e.move.pos.x - ox, e.move.pos.z - oz) < ab.range) {
          applyDamageToHero(state, e, powerDmg, h.slot);
        }
      }
      for (const st of state.structures) {
        if (st.team !== h.team && st.hp > 0 && Math.hypot(st.x - ox, st.z - oz) < ab.range) {
          damageStructure(state, st, powerDmg * 0.55, h.slot);
        }
      }
    }
  } else if (h.heroId === 'fernwick') {
    if (slot === 'Q') {
      state.zones.push({
        id: state.nextEntityId++,
        ownerSlot: h.slot,
        team: h.team,
        kind: 'sap',
        x: tx,
        y: groundHeightAt(tx, tz),
        z: tz,
        radius: 4.8,
        ttl: 3.5,
        tickTimer: 0.05,
        dps: powerDmg / 2.5,
        slowMult: 0.65,
        rootS: 0,
      });
    } else if (slot === 'E') {
      let bestHero: HeroEntity | null = null;
      let bestDist = ab.range;
      for (const e of state.heroes) {
        if (e.team !== h.team && e.alive) {
          const d = Math.hypot(e.move.pos.x - ox, e.move.pos.z - oz);
          if (d < bestDist) {
            bestDist = d;
            bestHero = e;
          }
        }
      }
      if (bestHero) {
        tx = bestHero.move.pos.x;
        ty = bestHero.move.pos.y + 0.8;
        tz = bestHero.move.pos.z;
        applyDamageToHero(state, bestHero, powerDmg, h.slot);
      } else {
        for (const cr of state.creeps) {
          if (cr.team !== h.team && cr.hp > 0 && Math.hypot(cr.x - ox, cr.z - oz) < ab.range) {
            cr.hp -= powerDmg;
            if (cr.hp <= 0) handleCreepDeath(state, cr, h.slot);
            break;
          }
        }
      }
    } else if (slot === 'F') {
      h.fireRateBuffMult = 1.3;
      h.fireRateBuffTimer = 4.0;
      h.speedBuffMult = 1.25;
      h.speedBuffTimer = 4.0;
      h.move.stamina = h.move.maxStamina;
    } else if (slot === 'X') {
      state.zones.push({
        id: state.nextEntityId++,
        ownerSlot: h.slot,
        team: h.team,
        kind: 'overheat',
        x: ox,
        y: h.move.pos.y,
        z: oz,
        radius: ab.range,
        ttl: 2.2,
        tickTimer: 0.05,
        dps: powerDmg / 1.8,
        slowMult: 0.75,
        rootS: 0,
      });
    }
  } else if (h.heroId === 'potsworth') {
    if (slot === 'Q') {
      const px = ox + fwdX * 2.5;
      const pz = oz + fwdZ * 2.5;
      state.turrets.push({
        id: state.nextEntityId++,
        ownerSlot: h.slot,
        team: h.team,
        x: px,
        y: groundHeightAt(px, pz),
        z: pz,
        ttl: 14,
        fireCooldown: 0.3,
        damage: powerDmg,
      });
    } else if (slot === 'E') {
      for (const e of state.heroes) {
        if (e.team !== h.team && e.alive && Math.hypot(e.move.pos.x - ox, e.move.pos.z - oz) < ab.range) {
          applyDamageToHero(state, e, powerDmg, h.slot);
          e.move.rootedTimer = 1.25;
          tx = e.move.pos.x;
          ty = e.move.pos.y + 0.8;
          tz = e.move.pos.z;
          break;
        }
      }
    } else if (slot === 'F') {
      h.move.vel.y = 14.5;
      h.move.grounded = false;
      h.move.doubleJumpAvailable = true;
    } else if (slot === 'X') {
      for (const e of state.heroes) {
        if (e.team !== h.team && e.alive && Math.hypot(e.move.pos.x - ox, e.move.pos.z - oz) < ab.range) {
          const exec = e.hp / e.maxHp < 0.45 ? 1.65 : 1.0;
          applyDamageToHero(state, e, powerDmg * exec, h.slot);
          tx = e.move.pos.x;
          ty = e.move.pos.y + 0.8;
          tz = e.move.pos.z;
          break;
        }
      }
    }
  } else if (h.heroId === 'hookwort') {
    if (slot === 'Q') {
      // Garden Hook: raycast forward to snag first enemy hero or creep and pull right in front of Hookwort
      const cosP = Math.cos(h.pitch);
      const dx = -sinY * cosP;
      const dy = Math.sin(h.pitch);
      const dz = -cosY * cosP;
      let bestT = ab.range;
      let pulledHero: HeroEntity | null = null;
      let pulledCreep: CreepEntity | null = null;
      for (const e of state.heroes) {
        if (e.team === h.team || !e.alive) continue;
        const hit = intersectRaySphere(ox, oy, oz, dx, dy, dz, e.move.pos.x, e.move.pos.y + 0.65, e.move.pos.z, 1.05, bestT);
        if (hit && hit.t < bestT) {
          bestT = hit.t;
          pulledHero = e;
          pulledCreep = null;
        }
      }
      if (!pulledHero) {
        for (const cr of state.creeps) {
          if (cr.team === h.team || cr.hp <= 0) continue;
          const hit = intersectRaySphere(ox, oy, oz, dx, dy, dz, cr.x, cr.y + 0.55, cr.z, 0.9, bestT);
          if (hit && hit.t < bestT) {
            bestT = hit.t;
            pulledCreep = cr;
          }
        }
      }
      const destX = ox + fwdX * 2.2;
      const destZ = oz + fwdZ * 2.2;
      const destY = groundHeightAt(destX, destZ);
      if (pulledHero) {
        pulledHero.move.pos.x = destX;
        pulledHero.move.pos.y = destY;
        pulledHero.move.pos.z = destZ;
        pulledHero.move.vel.x = 0;
        pulledHero.move.vel.y = 0;
        pulledHero.move.vel.z = 0;
        pulledHero.move.rootedTimer = Math.max(pulledHero.move.rootedTimer, 0.65);
        applyDamageToHero(state, pulledHero, powerDmg, h.slot);
        tx = destX;
        ty = destY + 0.8;
        tz = destZ;
      } else if (pulledCreep) {
        pulledCreep.x = destX;
        pulledCreep.y = destY;
        pulledCreep.z = destZ;
        pulledCreep.hp -= powerDmg;
        if (pulledCreep.hp <= 0) handleCreepDeath(state, pulledCreep, h.slot);
        tx = destX;
        ty = destY + 0.6;
        tz = destZ;
      }
    } else if (slot === 'E') {
      // Mulch Uppercut
      for (const e of state.heroes) {
        if (e.team !== h.team && e.alive && Math.hypot(e.move.pos.x - ox, e.move.pos.z - oz) < ab.range) {
          applyDamageToHero(state, e, powerDmg, h.slot);
          e.move.vel.y = 10.5;
          e.move.vel.x += fwdX * 8;
          e.move.vel.z += fwdZ * 8;
          e.move.grounded = false;
        }
      }
      for (const cr of state.creeps) {
        if (cr.team !== h.team && cr.hp > 0 && Math.hypot(cr.x - ox, cr.z - oz) < ab.range) {
          cr.hp -= powerDmg;
          if (cr.hp <= 0) handleCreepDeath(state, cr, h.slot);
        }
      }
    } else if (slot === 'F') {
      // Sticky Seed-Bomb (explodes after 1.5s)
      state.zones.push({
        id: state.nextEntityId++,
        ownerSlot: h.slot,
        team: h.team,
        kind: 'bomb',
        x: tx,
        y: groundHeightAt(tx, tz),
        z: tz,
        radius: 5.2,
        ttl: 1.5,
        tickTimer: 99,
        dps: 0,
        slowMult: 0.75,
        rootS: 0,
        explodeDmg: powerDmg,
      });
    } else if (slot === 'X') {
      // Hyper Sprinkler piercing beam
      for (const e of state.heroes) {
        if (e.team !== h.team && e.alive && Math.hypot(e.move.pos.x - ox, e.move.pos.z - oz) < ab.range) {
          applyDamageToHero(state, e, powerDmg, h.slot);
        }
      }
      for (const cr of state.creeps) {
        if (cr.team !== h.team && cr.hp > 0 && Math.hypot(cr.x - ox, cr.z - oz) < ab.range) {
          cr.hp -= powerDmg;
          if (cr.hp <= 0) handleCreepDeath(state, cr, h.slot);
        }
      }
    }
  } else if (h.heroId === 'buckshot') {
    if (slot === 'Q') {
      h.ammo = h.stats.magSize;
      h.reloadTimer = 0;
      h.move.stamina = Math.min(h.move.maxStamina, h.move.stamina + 1);
      h.fireRateBuffMult = 1.4;
      h.fireRateBuffTimer = 4.0;
    } else if (slot === 'E') {
      h.dmgBuffMult = 1.3;
      h.dmgBuffTimer = 5.0;
    } else if (slot === 'F') {
      h.speedBuffMult = 1.4;
      h.speedBuffTimer = 3.5;
      h.move.stamina = Math.min(h.move.maxStamina, h.move.stamina + 1);
    } else if (slot === 'X') {
      h.infiniteAmmoTimer = 6.0;
      h.ammo = h.stats.magSize;
      h.reloadTimer = 0;
      h.fireRateBuffMult = 1.4;
      h.fireRateBuffTimer = 6.0;
      h.dmgBuffMult = 1.2;
      h.dmgBuffTimer = 6.0;
    }
  } else if (h.heroId === 'thistle') {
    if (slot === 'Q') {
      let bestHero: HeroEntity | null = null;
      let bestD = ab.range;
      for (const e of state.heroes) {
        if (e.team !== h.team && e.alive) {
          const d = Math.hypot(e.move.pos.x - ox, e.move.pos.z - oz);
          if (d < bestD) {
            bestD = d;
            bestHero = e;
          }
        }
      }
      if (bestHero) {
        applyDamageToHero(state, bestHero, powerDmg, h.slot);
        tx = bestHero.move.pos.x;
        ty = bestHero.move.pos.y + 0.8;
        tz = bestHero.move.pos.z;
      } else {
        for (const cr of state.creeps) {
          if (cr.team !== h.team && cr.hp > 0 && Math.hypot(cr.x - ox, cr.z - oz) < ab.range) {
            cr.hp -= powerDmg;
            if (cr.hp <= 0) handleCreepDeath(state, cr, h.slot);
            tx = cr.x;
            ty = cr.y + 0.5;
            tz = cr.z;
            break;
          }
        }
      }
    } else if (slot === 'E') {
      state.zones.push({
        id: state.nextEntityId++,
        ownerSlot: h.slot,
        team: h.team,
        kind: 'spore',
        x: tx,
        y: groundHeightAt(tx, tz),
        z: tz,
        radius: 4.5,
        ttl: 1.2,
        tickTimer: 0.05,
        dps: powerDmg / 1.2,
        slowMult: 0.7,
        rootS: 0,
      });
    } else if (slot === 'F') {
      h.move.vel.y = 8.2;
      h.move.grounded = false;
      h.move.stamina = Math.min(h.move.maxStamina, h.move.stamina + 1);
      h.cooldowns.Q = Math.max(0, h.cooldowns.Q - 2.0);
      h.cooldowns.E = Math.max(0, h.cooldowns.E - 2.0);
    } else if (slot === 'X') {
      h.hp = Math.min(h.maxHp, h.hp + 180 + h.stats.spiritPower * 0.5);
      h.cdrBuffTimer = 6.0;
    }
  } else if (h.heroId === 'loam') {
    if (slot === 'Q') {
      for (const e of state.heroes) {
        if (e.team !== h.team && e.alive && Math.hypot(e.move.pos.x - ox, e.move.pos.z - oz) < ab.range) {
          applyDamageToHero(state, e, powerDmg, h.slot);
          e.move.vel.y = 9.0;
          e.move.grounded = false;
        }
      }
      for (const cr of state.creeps) {
        if (cr.team !== h.team && cr.hp > 0 && Math.hypot(cr.x - ox, cr.z - oz) < ab.range) {
          cr.hp -= powerDmg;
          if (cr.hp <= 0) handleCreepDeath(state, cr, h.slot);
        }
      }
    } else if (slot === 'E') {
      // Wormhole Blink
      const bx = Math.max(-36, Math.min(36, ox + fwdX * ab.range));
      const bz = Math.max(-120, Math.min(120, oz + fwdZ * ab.range));
      h.move.pos.x = bx;
      h.move.pos.z = bz;
      h.move.pos.y = groundHeightAt(bx, bz);
      h.fireRateBuffMult = 1.2;
      h.fireRateBuffTimer = 2.5;
      tx = bx;
      ty = h.move.pos.y + 0.8;
      tz = bz;
    } else if (slot === 'F') {
      // Compost Mend
      const heal = 160 + h.stats.spiritPower * 0.6;
      for (const ally of state.heroes) {
        if (ally.team === h.team && ally.alive && Math.hypot(ally.move.pos.x - ox, ally.move.pos.z - oz) <= ab.range) {
          ally.hp = Math.min(ally.maxHp, ally.hp + heal);
        }
      }
    } else if (slot === 'X') {
      // Singularity Sinkhole (Black Hole!)
      const bhX = ox + fwdX * 7.5;
      const bhZ = oz + fwdZ * 7.5;
      state.zones.push({
        id: state.nextEntityId++,
        ownerSlot: h.slot,
        team: h.team,
        kind: 'blackhole',
        x: bhX,
        y: groundHeightAt(bhX, bhZ),
        z: bhZ,
        radius: 10.5,
        ttl: 3.2,
        tickTimer: 0.05,
        dps: powerDmg / 3.2,
        slowMult: 0.25,
        rootS: 0.2,
        pullStrength: 13.5,
      });
      tx = bhX;
      ty = groundHeightAt(bhX, bhZ) + 1.2;
      tz = bhZ;
    }
  }

  state.events.push({
    type: 'ability',
    slot: h.slot,
    team: h.team,
    ability: slot,
    x: ox,
    y: oy,
    z: oz,
    tx,
    ty,
    tz,
  });
}

export function stepWorld(state: MatchState, inputs: HeroActionInput[], dt: number): void {
  if (state.winner !== null || dt <= 0) return;
  state.events.length = 0;
  state.timeS += dt;

  // 5:00 Gilded Relic spawn + 5-min clarity snapshot
  if (state.timeS >= MATCH_CONFIG.relicSpawnS) {
    if (!state.snapshot5MinTaken) {
      state.snapshot5MinTaken = true;
      const a0 = teamTotalAcorns(state, 0);
      const a1 = teamTotalAcorns(state, 1);
      const diff = Math.abs(a0 - a1);
      const maxA = Math.max(1, a0, a1);
      state.leadPctAt5Min = diff / maxA;
      state.leaderAt5Min = state.leadPctAt5Min >= 0.03 ? (a0 > a1 ? 0 : 1) : null;
    }
    if (!state.relic.spawned) {
      state.relic.spawned = true;
      state.relic.alive = true;
      state.events.push({ type: 'relicSpawn' });
    }
  }

  for (const t of [0, 1] as const) {
    if (state.relic.blessingTimer[t] > 0) {
      state.relic.blessingTimer[t] = Math.max(0, state.relic.blessingTimer[t] - dt);
    }
  }

  // Creep waves
  state.waveTimerS -= dt;
  if (state.waveTimerS <= 0) {
    state.waveTimerS = MATCH_CONFIG.creepWaveIntervalS;
    const supers = state.timeS >= 480 ? 1 : 0;
    spawnCreepWave(state, supers);
  }

  // Step heroes
  for (let i = 0; i < state.heroes.length; i++) {
    const h = state.heroes[i];
    const inp = inputs[i];

    // Passive income
    const passiveGain = ECONOMY.passiveAcornsPerS * dt;
    h.acorns += passiveGain;
    h.totalAcorns += passiveGain;
    h.incomePassive += passiveGain;
    h.level = levelForAcorns(h.totalAcorns);

    if (!h.alive) {
      h.respawnTimer -= dt;
      if (h.respawnTimer <= 0) {
        h.alive = true;
        const spawnZ = h.team === 0 ? -116 : 116;
        const spawnX = h.slot % 2 === 0 ? -3.2 : 3.2;
        h.move.pos.x = spawnX;
        h.move.pos.z = spawnZ;
        h.move.pos.y = groundHeightAt(spawnX, spawnZ);
        h.move.vel.x = 0;
        h.move.vel.y = 0;
        h.move.vel.z = 0;
        recomputeHeroStats(state, h);
        h.hp = h.maxHp;
        h.ammo = h.stats.magSize;
        h.reloadTimer = 0;
      }
      continue;
    }

    h.lastDamagedTimer = Math.max(0, h.lastDamagedTimer - dt);
    if (h.lastDamagedTimer <= 0) h.lastDamagedBySlot = -1;
    h.shieldTimer = Math.max(0, h.shieldTimer - dt);
    if (h.shieldTimer <= 0) h.shield = 0;
    h.speedBuffTimer = Math.max(0, h.speedBuffTimer - dt);
    h.fireRateBuffTimer = Math.max(0, h.fireRateBuffTimer - dt);
    h.dmgBuffTimer = Math.max(0, h.dmgBuffTimer - dt);
    h.infiniteAmmoTimer = Math.max(0, h.infiniteAmmoTimer - dt);
    h.cdrBuffTimer = Math.max(0, h.cdrBuffTimer - dt);
    h.stealthTimer = Math.max(0, h.stealthTimer - dt);

    const cdTick = h.cdrBuffTimer > 0 ? dt * 2.2 : dt;
    for (const s of ['Q', 'E', 'F', 'X'] as const) {
      h.cooldowns[s] = Math.max(0, h.cooldowns[s] - cdTick);
    }

    recomputeHeroStats(state, h);

    // Fountain healing
    const f = FOUNTAINS[h.team];
    const inFountain = Math.hypot(h.move.pos.x - f.x, h.move.pos.z - f.z) <= f.radius;
    const regen = h.stats.hpRegen + (inFountain ? 85 : 0);
    h.hp = Math.min(h.maxHp, h.hp + regen * dt);

    // Movement
    h.yaw = inp.move.yaw;
    h.pitch = inp.pitch;
    const mEvents = stepHeroMovement(h.move, inp.move, dt);
    if (mEvents.jumped) state.events.push({ type: 'moveTech', slot: h.slot, kind: 'jump' });
    if (mEvents.doubleJumped) state.events.push({ type: 'moveTech', slot: h.slot, kind: 'doubleJump' });
    if (mEvents.wallJumped) state.events.push({ type: 'moveTech', slot: h.slot, kind: 'wallJump' });
    if (mEvents.dashed) state.events.push({ type: 'moveTech', slot: h.slot, kind: 'dash' });
    if (mEvents.startedSlide) state.events.push({ type: 'moveTech', slot: h.slot, kind: 'slide' });
    if (mEvents.dashJumped) state.events.push({ type: 'dashJump', slot: h.slot });
    if (mEvents.reachedFlowTier3) state.events.push({ type: 'flowTier3', slot: h.slot });

    // Reload & fire
    h.fireCooldown = Math.max(0, h.fireCooldown - dt);
    if (h.reloadTimer > 0) {
      h.reloadTimer -= dt;
      if (h.reloadTimer <= 0) {
        h.reloadTimer = 0;
        h.ammo = h.stats.magSize;
      }
    } else if (inp.reloadPressed && h.ammo < h.stats.magSize) {
      h.reloadTimer = HEROES[h.heroId].weapon.reloadS;
    }

    if (inp.abilityPressed) {
      castAbility(state, h, inp.abilityPressed);
    }
    if (inp.fireHeld && h.fireCooldown <= 0 && (h.reloadTimer <= 0 || h.move.sliding || h.infiniteAmmoTimer > 0)) {
      fireWeapon(state, h);
    }
  }

  // Step creeps
  for (const cr of state.creeps) {
    if (cr.hp <= 0) continue;
    cr.fireCooldown = Math.max(0, cr.fireCooldown - dt);
    const enemyTeam: Team = cr.team === 0 ? 1 : 0;
    const marchDir = cr.team === 0 ? 1 : -1;

    // Find closest enemy creep or structure
    let targetCreep: CreepEntity | null = null;
    let targetSt: StructureEntity | null = null;
    let bestD = 12;

    for (const other of state.creeps) {
      if (other.team !== enemyTeam || other.hp <= 0) continue;
      const d = Math.hypot(other.x - cr.x, other.z - cr.z);
      if (d < bestD) {
        bestD = d;
        targetCreep = other;
      }
    }
    if (!targetCreep) {
      for (const st of state.structures) {
        if (st.team !== enemyTeam || st.hp <= 0 || st.invulnerable) continue;
        const d = Math.hypot(st.x - cr.x, st.z - cr.z) - st.radius;
        if (d < bestD) {
          bestD = d;
          targetSt = st;
        }
      }
    }

    if (targetCreep && bestD <= cr.range) {
      if (cr.fireCooldown <= 0) {
        cr.fireCooldown = 1.0;
        targetCreep.hp -= cr.damage;
        if (targetCreep.hp <= 0) handleCreepDeath(state, targetCreep, -1);
      }
    } else if (targetSt && bestD <= cr.range) {
      if (cr.fireCooldown <= 0) {
        cr.fireCooldown = 1.0;
        damageStructure(state, targetSt, cr.damage, -1);
      }
    } else {
      // Move toward target or march down lane
      const goalX = targetCreep ? targetCreep.x : targetSt ? targetSt.x : 0;
      const goalZ = targetCreep ? targetCreep.z : targetSt ? targetSt.z : cr.z + marchDir * 10;
      const dx = goalX - cr.x;
      const dz = goalZ - cr.z;
      const d = Math.hypot(dx, dz) || 1;
      const spd = cr.kind === 'super' ? 6.2 : 5.5;
      cr.x += (dx / d) * spd * dt;
      cr.z += (dz / d) * spd * dt;
      cr.y = groundHeightAt(cr.x, cr.z);
    }
  }
  state.creeps = state.creeps.filter((c) => c.hp > 0);

  // Step structures
  for (const st of state.structures) {
    if (st.hp <= 0) continue;
    st.fireCooldown = Math.max(0, st.fireCooldown - dt);
    st.aggroTimer = Math.max(0, st.aggroTimer - dt);
    if (st.aggroTimer <= 0) st.aggroHeroSlot = null;

    if (st.fireCooldown > 0) continue;

    let fired = false;
    // 1. Aggro hero
    if (st.aggroHeroSlot !== null) {
      const target = state.heroes[st.aggroHeroSlot];
      if (target && target.alive && Math.hypot(target.move.pos.x - st.x, target.move.pos.z - st.z) <= st.range) {
        applyDamageToHero(state, target, st.damage, -1);
        st.targetId = `hero:${target.slot}`;
        fired = true;
      } else {
        st.aggroHeroSlot = null;
      }
    }

    // 2. Closest enemy creep
    if (!fired) {
      let bestCr: CreepEntity | null = null;
      let bestD = st.range;
      for (const cr of state.creeps) {
        if (cr.team === st.team || cr.hp <= 0) continue;
        const d = Math.hypot(cr.x - st.x, cr.z - st.z);
        if (d <= bestD) {
          bestD = d;
          bestCr = cr;
        }
      }
      if (bestCr) {
        bestCr.hp -= st.damage;
        if (bestCr.hp <= 0) handleCreepDeath(state, bestCr, -1);
        st.targetId = `creep:${bestCr.id}`;
        fired = true;
      }
    }

    // 3. Closest enemy hero
    if (!fired) {
      let bestH: HeroEntity | null = null;
      let bestD = st.range;
      for (const h of state.heroes) {
        if (h.team === st.team || !h.alive) continue;
        const d = Math.hypot(h.move.pos.x - st.x, h.move.pos.z - st.z);
        if (d <= bestD) {
          bestD = d;
          bestH = h;
        }
      }
      if (bestH) {
        applyDamageToHero(state, bestH, st.damage, -1);
        st.targetId = `hero:${bestH.slot}`;
        fired = true;
      }
    }

    if (fired) {
      st.fireCooldown = st.fireIntervalS;
    } else {
      st.targetId = null;
    }
  }

  // Step Soul Acorn Orbs
  for (let i = state.orbs.length - 1; i >= 0; i--) {
    const orb = state.orbs[i];
    orb.y += ECONOMY.orbRiseSpeed * dt;
    orb.ttl -= dt;
    if (orb.ttl <= 0) {
      // Unpopped orb expires to original team's heroes in range (or split)
      const allies = state.heroes.filter((h) => h.team === orb.team);
      if (allies.length > 0) {
        const share = Math.round(orb.acorns / allies.length);
        for (const a of allies) awardAcorns(a, share, 'orb');
      }
      state.orbs.splice(i, 1);
    }
  }

  // Step turrets
  for (let i = state.turrets.length - 1; i >= 0; i--) {
    const tu = state.turrets[i];
    tu.ttl -= dt;
    tu.fireCooldown = Math.max(0, tu.fireCooldown - dt);
    if (tu.ttl <= 0) {
      state.turrets.splice(i, 1);
      continue;
    }
    if (tu.fireCooldown <= 0) {
      let hit = false;
      for (const e of state.heroes) {
        if (e.team !== tu.team && e.alive && dist3(tu.x, tu.y, tu.z, e.move.pos.x, e.move.pos.y, e.move.pos.z) <= 15) {
          applyDamageToHero(state, e, tu.damage, tu.ownerSlot);
          hit = true;
          break;
        }
      }
      if (!hit) {
        for (const cr of state.creeps) {
          if (cr.team !== tu.team && cr.hp > 0 && Math.hypot(cr.x - tu.x, cr.z - tu.z) <= 15) {
            cr.hp -= tu.damage;
            if (cr.hp <= 0) handleCreepDeath(state, cr, tu.ownerSlot);
            hit = true;
            break;
          }
        }
      }
      if (hit) tu.fireCooldown = 0.75;
    }
  }

  // Step AoE zones
  for (let i = state.zones.length - 1; i >= 0; i--) {
    const zn = state.zones[i];
    zn.ttl -= dt;
    zn.tickTimer -= dt;

    // Continuous Black Hole gravity pull
    if (zn.pullStrength && zn.pullStrength > 0) {
      for (const e of state.heroes) {
        if (e.team !== zn.team && e.alive) {
          const dx = zn.x - e.move.pos.x;
          const dz = zn.z - e.move.pos.z;
          const d = Math.hypot(dx, dz);
          if (d <= zn.radius && d > 0.35) {
            const pull = zn.pullStrength * dt;
            e.move.pos.x += (dx / d) * Math.min(d - 0.3, pull);
            e.move.pos.z += (dz / d) * Math.min(d - 0.3, pull);
            e.move.vel.x = (dx / d) * 3.0;
            e.move.vel.z = (dz / d) * 3.0;
          }
        }
      }
      for (const cr of state.creeps) {
        if (cr.team !== zn.team && cr.hp > 0) {
          const dx = zn.x - cr.x;
          const dz = zn.z - cr.z;
          const d = Math.hypot(dx, dz);
          if (d <= zn.radius && d > 0.35) {
            const pull = zn.pullStrength * dt;
            cr.x += (dx / d) * Math.min(d - 0.3, pull);
            cr.z += (dz / d) * Math.min(d - 0.3, pull);
          }
        }
      }
    }

    if (zn.ttl <= 0) {
      if (zn.explodeDmg && zn.explodeDmg > 0) {
        for (const e of state.heroes) {
          if (e.team !== zn.team && e.alive && Math.hypot(e.move.pos.x - zn.x, e.move.pos.z - zn.z) <= zn.radius) {
            applyDamageToHero(state, e, zn.explodeDmg, zn.ownerSlot);
          }
        }
        for (const cr of state.creeps) {
          if (cr.team !== zn.team && cr.hp > 0 && Math.hypot(cr.x - zn.x, cr.z - zn.z) <= zn.radius) {
            cr.hp -= zn.explodeDmg;
            if (cr.hp <= 0) handleCreepDeath(state, cr, zn.ownerSlot);
          }
        }
      }
      state.zones.splice(i, 1);
      continue;
    }
    if (zn.tickTimer <= 0) {
      zn.tickTimer = 0.25;
      for (const e of state.heroes) {
        if (e.team !== zn.team && e.alive && Math.hypot(e.move.pos.x - zn.x, e.move.pos.z - zn.z) <= zn.radius) {
          applyDamageToHero(state, e, zn.dps * 0.25, zn.ownerSlot);
          if (zn.rootS > 0) e.move.rootedTimer = Math.max(e.move.rootedTimer, 0.35);
          e.move.statusSpeedMult = Math.min(e.move.statusSpeedMult, zn.slowMult);
        }
      }
      for (const cr of state.creeps) {
        if (cr.team !== zn.team && cr.hp > 0 && Math.hypot(cr.x - zn.x, cr.z - zn.z) <= zn.radius) {
          cr.hp -= zn.dps * 0.25;
          if (cr.hp <= 0) handleCreepDeath(state, cr, zn.ownerSlot);
        }
      }
    }
  }
}

// Raids ("horn calls"): from the horn to the loot. docs/design/gnomomia/raids.md.
import type * as THREE from 'three';
import { ENEMIES, ITEMS, OBJECTS, RAIDS } from './content';
import { raidClearGold, raidClearXp } from './economy';
import { UI } from './config';
import { bus, say } from './events';
import { grantXp } from './progression';
import { player, teleportPlayer } from './player';
import { allEntities, getEntity, provokeEnemy, removeEntity, spawnEnemyAt, spawnLoot } from './entities';
import { maxHp, setFlag, state } from './state';
import { RAID_TUNING } from './data/raidTuning';
import { seatRaid, partyMembersNear } from './raidRoster';
import { despawnRaidHelpers, spawnRaidHelpers, tankTargetId, updateRaidHelpers, upHelperTargetIds } from './raidHelpers';
import type { RaidDef, RaidSeat } from './raidTypes';

export type RaidPhase = 'countdown' | 'fight' | 'won' | 'lost';
export interface RaidStatus { raid: RaidDef; phase: RaidPhase; elapsed: number; countdown: number; bossHp: number; bossHpMax: number; seats: readonly RaidSeat[] }

/** The one active raid, or null when idle. */
interface ActiveRaid {
  raid: RaidDef;
  phase: RaidPhase;
  countdown: number;
  elapsed: number;
  seats: readonly RaidSeat[];
  bossId: number | null;
  bossHpMax: number;
  spawnedWaves: Set<number>;
  enemyIds: number[];
  outside: number;
  lingerLeft: number;
  bossPos: { x: number; z: number } | null;
}

let current: ActiveRaid | null = null;
let subscribed = false;

/** Subscribes to the game events once. The scene is not needed here (the raid's enemies live in entities.ts). */
export function initRaids(_scene: THREE.Scene): void {
  if (subscribed) return;
  subscribed = true;
  bus.on('interacted', ({ objectId }) => {
    const raid = Object.values(RAIDS).find((r) => r.horn === objectId);
    if (raid) startRaid(raid.id);
  });
  bus.on('player-died', () => {
    if (current && (current.phase === 'countdown' || current.phase === 'fight')) {
      lose('You fall. The horn call breaks up.');
    }
  });
  bus.on('enemy-killed', ({ entityId }) => {
    if (current && current.phase === 'fight' && entityId === current.bossId) win();
  });
}

export function updateRaids(dt: number): void {
  const a = current;
  if (!a) return;
  updateRaidHelpers(dt, a.bossId);

  if (a.phase === 'countdown') {
    a.countdown -= dt;
    if (a.countdown <= 0) pull(a);
    return;
  }

  if (a.phase === 'fight') {
    a.elapsed += dt;
    spawnDueWaves(a);
    const boss = a.bossId !== null ? getEntity(a.bossId) : undefined;
    if (boss) a.bossPos = { x: boss.position.x, z: boss.position.z };

    const { raid } = a;
    const dist = Math.hypot(player.position.x - raid.x, player.position.z - raid.z);
    if (dist > raid.r + RAID_TUNING.leaveMargin) a.outside += dt;
    else a.outside = 0;
    if (a.outside > RAID_TUNING.leaveGraceSeconds) {
      lose('You left the horn call.');
      return;
    }
    if (a.elapsed > RAID_TUNING.maxSeconds) lose('The horn call runs out of breath.');
    return;
  }

  if (a.phase === 'won') {
    a.lingerLeft -= dt;
    if (a.lingerLeft <= 0) {
      despawnRaidHelpers();
      current = null;
    }
  }
}

export function raidStatus(): RaidStatus | null {
  const a = current;
  if (!a) return null;
  const boss = a.bossId !== null ? getEntity(a.bossId) : undefined;
  return {
    raid: a.raid,
    phase: a.phase,
    elapsed: a.elapsed,
    countdown: a.countdown,
    bossHp: boss?.hp ?? 0,
    bossHpMax: a.bossHpMax,
    seats: a.seats,
  };
}

export function startRaid(raidId: string): boolean {
  const raid = RAIDS[raidId];
  if (!raid) {
    say('The horn is silent. Nothing answers.', UI.bad);
    return false;
  }
  if (current) {
    say('A horn call is already under way.', UI.bad);
    return false;
  }
  if (player.dead) {
    say('You cannot blow the horn while you are down.', UI.bad);
    return false;
  }
  if (state.level < raid.minLevel) {
    say(`The horn is too heavy for you yet. Come back at level ${raid.minLevel}.`, UI.bad);
    return false;
  }

  const seats = seatRaid(
    RAID_TUNING.seats,
    { name: 'You', classId: state.classId, level: state.level },
    partyMembersNear(state.zone, player.position.x, player.position.z, RAID_TUNING.partyRange),
    Math.random,
  );
  spawnRaidHelpers(seats, raid);
  current = {
    raid,
    phase: 'countdown',
    countdown: RAID_TUNING.pullDelaySeconds,
    elapsed: 0,
    seats,
    bossId: null,
    bossHpMax: 0,
    spawnedWaves: new Set(),
    enemyIds: [],
    outside: 0,
    lingerLeft: 0,
    bossPos: null,
  };
  say(raid.intro, UI.quest);
  bus.emit('raid-started', { raidId, seats: seats.map(({ kind, id, name }) => ({ kind, id, name })) });
  return true;
}

export function abandonRaid(): void {
  if (current && current.phase !== 'won') lose('You blow the horn twice: the call is off.');
}

/** Dev only (?raid=<id>): a fresh character at the horn, then the horn is blown. */
export function debugRaid(raidId: string): void {
  const raid = RAIDS[raidId];
  if (!raid) return;
  state.level = Math.max(state.level, raid.level);
  state.classId ??= 'warden';
  state.hp = maxHp();
  const horn = OBJECTS[raid.horn];
  if (horn) teleportPlayer(horn.x, horn.z);
  startRaid(raidId);
}

/** The countdown ran out: the boss comes to the arena centre and its tank (if any) takes it. */
function pull(a: ActiveRaid): void {
  const boss = spawnEnemyAt(a.raid.boss, a.raid.x, a.raid.z);
  if (!boss) {
    lose('The horn call finds nothing to fight.');
    return;
  }
  a.bossId = boss.id;
  a.bossHpMax = boss.maxHp;
  a.bossPos = { x: boss.position.x, z: boss.position.z };
  a.enemyIds.push(boss.id);
  const tank = tankTargetId();
  if (tank !== null) provokeEnemy(boss.id, tank);
  else boss.inCombat = true;
  a.phase = 'fight';
  a.elapsed = 0;
}

/** Spawns each wave whose time has come. Every second add is provoked onto a helper (if one is up); the rest go for the player. */
function spawnDueWaves(a: ActiveRaid): void {
  const { raid } = a;
  raid.waves.forEach((wave, w) => {
    if (a.spawnedWaves.has(w) || wave.at > a.elapsed) return;
    a.spawnedWaves.add(w);
    const ups = upHelperTargetIds();
    for (let n = 0; n < wave.count; n++) {
      const angle = Math.random() * Math.PI * 2;
      const x = raid.x + Math.cos(angle) * (raid.r - 1);
      const z = raid.z + Math.sin(angle) * (raid.r - 1);
      const add = spawnEnemyAt(wave.enemy, x, z);
      if (!add) continue;
      a.enemyIds.push(add.id);
      if (n % 2 === 1 && ups.length > 0) provokeEnemy(add.id, ups[Math.floor(Math.random() * ups.length)]);
      else add.inCombat = true;
    }
  });
}

function win(): void {
  const a = current;
  if (!a) return;
  const { raid } = a;
  a.phase = 'won';

  const drops = raid.drops.filter(() => Math.random() < RAID_TUNING.dropChance);
  const gold = raidClearGold(raid.level);
  const at = a.bossPos ?? { x: raid.x, z: raid.z };
  spawnLoot(at.x, at.z, drops.map((item) => ({ item, count: 1 })), gold);
  grantXp(raidClearXp(raid.level, state.level));

  const flag = `raid:${raid.id}:clears`;
  const previous = Number(state.flags[flag] ?? 0);
  setFlag(flag, String(previous + 1));

  say(raid.victory, UI.gold);
  if (drops.length > 0) say(`Horn-marked gear: ${drops.map((id) => ITEMS[id]?.name ?? id).join(', ')}`, UI.quest);
  else say('No horn-marked gear this time.', UI.quest);

  cleanUp();
  bus.emit('raid-ended', { raidId: raid.id, won: true, seconds: a.elapsed, drops });
  a.lingerLeft = RAID_TUNING.helperLingerSeconds;
}

function lose(reason: string): void {
  const a = current;
  if (!a) return;
  a.phase = 'lost';
  say(reason, UI.bad);
  cleanUp();
  despawnRaidHelpers();
  bus.emit('raid-ended', { raidId: a.raid.id, won: false, seconds: a.elapsed, drops: [] });
  current = null;
}

/** Removes every enemy this raid put in the arena: the ones it spawned, plus any live boss, wave or boss-summoned enemy
 * within the arena and a margin (boss summons come from bossmoves.ts). */
function cleanUp(): void {
  const a = current;
  if (!a) return;
  const { raid } = a;
  for (const id of a.enemyIds) removeEntity(id);
  a.enemyIds = [];

  const kinds = new Set<string>([raid.boss, ...raid.waves.map((w) => w.enemy)]);
  for (const m of ENEMIES[raid.boss]?.moves ?? []) {
    if (m.kind === 'summon' && m.summon) kinds.add(m.summon.enemy);
  }
  const reach = raid.r + 20;
  for (const e of allEntities()) {
    if (e.kind !== 'enemy' || !kinds.has(e.defId)) continue;
    if (Math.hypot(e.position.x - raid.x, e.position.z - raid.z) <= reach) removeEntity(e.id);
  }
}

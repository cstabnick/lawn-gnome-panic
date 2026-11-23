// Raid helper numbers and decisions, shared by the game (raidHelpers.ts) and the combat arena (sim/arena.ts). Pure.
import type { ClassId, DamageType, Rank } from './config';
import type { HelperRole, RaidSeat } from './raidTypes';
import { RAID_TUNING } from './data/raidTuning';
import { avgHit } from './rules';

export interface HelperStats { hpMax: number; hit: number; attackSeconds: number; range: number; damageType: DamageType; heal: number; healSeconds: number }
export interface HelperState { index: number; seatId: string; role: HelperRole; level: number; hp: number; hpMax: number; downFor: number; attackTimer: number; healTimer: number }

const H = RAID_TUNING.helper;

/** Ranks the helpers' tank takes swings for (the game's enemies choose for themselves; the arena uses assignSwing). */
const TANK_RANKS: ReadonlySet<Rank> = new Set<Rank>(['boss', 'worldboss', 'miniboss', 'elite', 'final']);

const ROLE_CLASS: Record<HelperRole, ClassId> = { tank: 'warden', healer: 'mage', damage: 'slinger' };
const ROLE_DAMAGE: Record<HelperRole, DamageType> = { tank: 'crush', healer: 'sun', damage: 'pierce' };

export function roleForClass(classId: ClassId): HelperRole {
  if (classId === 'warden') return 'tank';
  if (classId === 'mage') return 'healer';
  return 'damage';
}

export function helperStats(role: HelperRole, level: number): HelperStats {
  const base = avgHit(level);
  const hpMax = Math.round(base * H.hpNormals[role]);
  return {
    hpMax,
    hit: Math.round(base * H.hitNormals[role]),
    attackSeconds: H.attackSeconds,
    range: H.range[role],
    damageType: ROLE_DAMAGE[role],
    heal: role === 'healer' ? Math.round(base * H.healNormals) : 0,
    healSeconds: H.healSeconds,
  };
}

export function createHelperState(index: number, seat: RaidSeat): HelperState {
  const hpMax = helperStats(seat.role, seat.level).hpMax;
  return {
    index,
    seatId: seat.id,
    role: seat.role,
    level: seat.level,
    hp: hpMax,
    hpMax,
    downFor: 0,
    attackTimer: H.attackSeconds * (0.3 + 0.2 * index),
    healTimer: H.healSeconds,
  };
}

export function isUp(h: HelperState): boolean { return h.downFor <= 0; }

/** Damage to a helper. Ignored while down; at 0 HP the helper is down for reviveSeconds. */
export function damageHelper(h: HelperState, amount: number): void {
  if (!isUp(h)) return;
  h.hp -= amount * H.damageTakenMult;
  if (h.hp <= 0) {
    h.hp = 0;
    h.downFor = H.reviveSeconds;
  }
}

/** Advances one helper by dt seconds. Reports the swing and the heal that fell due this tick. */
export function tickHelper(h: HelperState, dt: number): { attack: boolean; heal: boolean } {
  if (!isUp(h)) {
    h.downFor -= dt;
    if (h.downFor <= 0) {
      h.hp = Math.round(h.hpMax * H.reviveHpFrac);
      h.downFor = 0;
    }
    return { attack: false, heal: false };
  }
  let attack = false;
  let heal = false;
  h.attackTimer -= dt;
  if (h.attackTimer <= 0) {
    h.attackTimer += H.attackSeconds;
    attack = true;
  }
  if (h.role === 'healer') {
    h.healTimer -= dt;
    if (h.healTimer <= 0) {
      h.healTimer += H.healSeconds;
      heal = true;
    }
  }
  return { attack, heal };
}

/** The lowest-HP-fraction target among the player and the up helpers, if it is below healBelow. */
export function pickHealTarget(playerHpFrac: number, helpers: readonly HelperState[]): 'player' | number | null {
  let best: 'player' | number = 'player';
  let bestFrac = playerHpFrac;
  for (const h of helpers) {
    if (!isUp(h)) continue;
    const frac = h.hp / h.hpMax;
    if (frac < bestFrac) {
      bestFrac = frac;
      best = h.index;
    }
  }
  return bestFrac < H.healBelow ? best : null;
}

/** Which seat an enemy swing lands on (combat arena). Bosses and elites go to the up tank; adds mostly go to the player. */
export function assignSwing(rank: Rank, rng: () => number, helpers: readonly HelperState[]): 'player' | number {
  if (TANK_RANKS.has(rank)) {
    const tank = helpers.find((h) => h.role === 'tank' && isUp(h));
    return tank ? tank.index : 'player';
  }
  if (rng() < RAID_TUNING.sim.addsOnPlayerShare) return 'player';
  const up = helpers.filter(isUp);
  if (up.length === 0) return 'player';
  return up[Math.floor(rng() * up.length)].index;
}

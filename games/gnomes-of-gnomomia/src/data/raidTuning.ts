// Raid tuning: every number behind raid fights and helpers. Tune against `npm run sim:raid -w games/gnomes-of-gnomomia`
// (target: a clear inside targetSeconds). XP, coins and item value are in src/data/economy.ts (ECONOMY.raid).
import type { Condition } from '../config';
import { avgHit } from '../rules';
import type { HelperRole } from '../raidTypes';

/** Raids open once Chapter 2 is done (A Letter for the Queen, Thatchford): after the second town. */
export const RAID_UNLOCK: Condition = { quest: { id: 'c2-letter-for-the-queen', status: 'done' } };

export const RAID_TUNING = {
  /** Seats including the player; helpers fill those no party member takes. */
  seats: 4,
  /** Chance of each listed drop on a win. */
  dropChance: 0.2,
  /** Wanted clear time from the pull (sim:raid --check). */
  targetSeconds: [120, 180] as const,
  /** Seconds from the horn to the pull. */
  pullDelaySeconds: 5,
  /** A raid still going after this is lost. */
  maxSeconds: 360,
  /** Leaving the arena by more than leaveMargin metres for leaveGraceSeconds loses the raid. */
  leaveMargin: 10,
  leaveGraceSeconds: 8,
  /** Party members this close to the horn take seats. */
  partyRange: 30,
  /** Helpers stay this long after a win, then go. */
  helperLingerSeconds: 6,
  /** Boss and add HP, in normal enemies of the same level (raidBossHp / raidAddHp). */
  bossHpNormals: 180,
  addHpNormals: 1.5,
  helper: {
    /** Damage per swing, in avgHit(level). */
    hitNormals: { tank: 3.0, healer: 4.0, damage: 5.0 } satisfies Record<HelperRole, number>,
    attackSeconds: 2.0,
    /** Max HP, in avgHit(level). */
    hpNormals: { tank: 12, healer: 7, damage: 7 } satisfies Record<HelperRole, number>,
    /** How close a helper stands to its target (m). */
    range: { tank: 1.6, healer: 9, damage: 9 } satisfies Record<HelperRole, number>,
    /** Healer: heals healNormals x avgHit(level) every healSeconds to whoever is lowest, when below healBelow of max. */
    healNormals: 1.2,
    healSeconds: 3,
    healBelow: 0.75,
    /** A downed helper gets up after reviveSeconds with reviveHpFrac of max HP. */
    reviveSeconds: 20,
    reviveHpFrac: 0.5,
    damageTakenMult: 1,
  },
  /** Combat-arena only (the game's enemies pick targets themselves). */
  sim: { addsOnPlayerShare: 0.5 },
} as const;

/** HP of one normal enemy of this level (the formula in rules.enemyStats): the unit raid HP counts in. */
export function normalHp(level: number): number {
  return avgHit(level) * Math.min(5, 3 + level / 5);
}
export function raidBossHp(level: number): number {
  return Math.round(normalHp(level) * RAID_TUNING.bossHpNormals);
}
export function raidAddHp(level: number): number {
  return Math.round(normalHp(level) * RAID_TUNING.addHpNormals);
}

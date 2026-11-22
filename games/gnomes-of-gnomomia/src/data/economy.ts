// Economy tuning: every number behind XP, levels, coin rewards and skill growth. Read only through src/economy.ts.
// Tune these against the economy sim (`npm run sim:economy -w games/gnomes-of-gnomomia`), not by feel:
// docs/design/gnomomia/economy.md explains the model and the targets.
import type { Rank } from '../config';

export const ECONOMY = {
  /** Highest character level. */
  levelCap: 30,
  /** XP to the next level at level L: round((base + perLevel L + perLevelSq L^2) * growth^(L-1)). */
  levelXp: { base: 150, perLevel: 90, perLevelSq: 20, growth: 1.04 },
  /** Kill XP of an enemy of level L: round((base + perLevel L) * growth^(L-1) * rank * level difference). */
  killXp: { base: 6, perLevel: 2, growth: 1.07 },
  /** Rank multiplier on kill XP. */
  rankXp: { trivial: 0.5, normal: 1, elite: 3, miniboss: 6, boss: 10, worldboss: 20, final: 40 } satisfies Record<Rank, number>,
  /** Quest XP = kill XP of a normal enemy of the quest's level, times this per tier. */
  questTierXp: { side: 10, main: 20, finale: 40 },
  /** Level difference (enemy level - player level): +abovePer per level above (max aboveMax),
   * -belowPer per level below, nothing at zeroAt or more levels below. */
  levelDiff: { abovePer: 0.1, aboveMax: 0.3, belowPer: 0.2, zeroAt: 5 },
  /** Quest coin reward: round(reward.gold * scale * growth^(level-1) * tier). */
  questGold: { scale: 0.1, growth: 1.11, tier: { side: 1, main: 1, finale: 1 } },
  /** Enemy coin drop: each end of EnemyDef.gold times scale * growth^(level-1), rounded. */
  enemyGold: { scale: 0.1, growth: 1.11 },
  /** Use-based skills. Cap at character level L: capBase + capPerLevel L.
   * Uses to go from skill level s to s+1: floor(usesBase + usesPerLevel s + usesPerLevelSq s^2). */
  skill: { capBase: 5, capPerLevel: 4, usesBase: 2, usesPerLevel: 0.5, usesPerLevelSq: 0.02 },
} as const;

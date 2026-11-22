// Pure economy formulas: XP, levels, coins and skill growth from the tuning table in src/data/economy.ts.
// No state, no events, no DOM: gameplay (progression.ts, quests.ts, entities.ts, rules.ts) and the economy sim
// (src/sim/economy.ts) both call these, so the sim always measures the real rules.
import type { EnemyDef, QuestDef, Rank } from './config';
import { ECONOMY } from './data/economy';

/** XP needed to go from character level `level` to the next. */
export function xpToNextLevel(level: number): number {
  const c = ECONOMY.levelXp;
  return Math.round((c.base + c.perLevel * level + c.perLevelSq * level * level) * Math.pow(c.growth, level - 1));
}

/** Total XP from level 1 to reach `level`. */
export function xpToReachLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpToNextLevel(l);
  return total;
}

/** Level-difference multiplier on kill and quest XP. */
export function levelDiffMult(enemyLevel: number, playerLevel: number): number {
  const c = ECONOMY.levelDiff;
  const d = enemyLevel - playerLevel;
  if (d > 0) return 1 + Math.min(c.aboveMax, c.abovePer * d);
  if (d <= -c.zeroAt) return 0;
  return Math.max(0, 1 + c.belowPer * d);
}

/** Kill XP for an enemy of this level and rank, for a player of `playerLevel`. Whole XP. */
export function killXpAt(enemyLevel: number, rank: Rank, playerLevel: number): number {
  const c = ECONOMY.killXp;
  const base = (c.base + c.perLevel * enemyLevel) * Math.pow(c.growth, enemyLevel - 1);
  return Math.round(base * ECONOMY.rankXp[rank] * levelDiffMult(enemyLevel, playerLevel));
}

/** Quest XP for a player of `playerLevel`. */
export function questXpAt(q: QuestDef, playerLevel: number): number {
  return killXpAt(q.level, 'normal', playerLevel) * ECONOMY.questTierXp[q.tier];
}

/** Coins a quest pays on completion (reward.gold scaled by the quest's level and tier). */
export function questGold(q: QuestDef): number {
  const c = ECONOMY.questGold;
  return Math.round(q.reward.gold * c.scale * Math.pow(c.growth, q.level - 1) * c.tier[q.tier]);
}

/** [min, max] coins an enemy drops. */
export function enemyGoldRange(def: EnemyDef): [number, number] {
  const c = ECONOMY.enemyGold;
  const k = c.scale * Math.pow(c.growth, def.level - 1);
  const lo = Math.round(def.gold[0] * k);
  return [lo, Math.max(lo, Math.round(def.gold[1] * k))];
}

/** Highest level a use-based skill may reach at this character level. */
export function skillCapAt(level: number): number {
  return ECONOMY.skill.capBase + ECONOMY.skill.capPerLevel * level;
}

/** Uses of a skill needed to go from `skillLevel` to the next. */
export function skillUsesToNext(skillLevel: number): number {
  const c = ECONOMY.skill;
  return Math.max(1, Math.floor(c.usesBase + c.usesPerLevel * skillLevel + c.usesPerLevelSq * skillLevel * skillLevel));
}

// Pure economy formulas: XP, levels, coins and skill growth from the tuning table in src/data/economy.ts.
// No state, no events, no DOM: gameplay (progression.ts, quests.ts, entities.ts, rules.ts) and the economy sim
// (src/sim/economy.ts) both call these, so the sim always measures the real rules.
// Every formula is defined for any level, not only 1..levelCap: the sim's level-70 projection calls them past the cap.
import type { EnemyDef, QuestDef, Rank } from './config';
import { ECONOMY } from './data/economy';

const KNEE = ECONOMY.curveKnee;

/** XP needed to go from character level `level` to the next. */
export function xpToNextLevel(level: number): number {
  const c = ECONOMY.levelXp;
  const growth = Math.pow(c.growth, Math.min(level, KNEE) - 1) * Math.pow(c.lateGrowth, Math.max(0, level - KNEE));
  return Math.round((c.base + c.perLevel * level + c.perLevelSq * level * level) * growth);
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
export function questXpAt(q: Pick<QuestDef, 'level' | 'tier'> & { zone?: QuestDef['zone'] }, playerLevel: number): number {
  const zone = q.zone?.split('/')[0] as keyof typeof ECONOMY.questZoneXp | undefined;
  const zoneMult = (zone && ECONOMY.questZoneXp[zone]) ?? 1;
  return Math.round(killXpAt(q.level, 'normal', playerLevel) * ECONOMY.questTierXp[q.tier] * zoneMult);
}

/** Coin multiplier at a content level, shared by quest and enemy gold (see ECONOMY.coins). */
export function coinMult(level: number): number {
  const c = ECONOMY.coins;
  return c.scale * Math.pow(c.growth, Math.min(level, KNEE) - 1) * Math.pow(Math.max(level, KNEE) / KNEE, c.latePower);
}

/** Coins a quest pays on completion (reward.gold scaled by the quest's level and tier). */
export function questGold(q: Pick<QuestDef, 'level' | 'tier' | 'reward'>): number {
  return Math.round(q.reward.gold * coinMult(q.level) * ECONOMY.questGold.tier[q.tier]);
}

/** [min, max] coins an enemy drops. */
export function enemyGoldRange(def: Pick<EnemyDef, 'level' | 'gold'>): [number, number] {
  const k = coinMult(def.level);
  const lo = Math.round(def.gold[0] * k);
  return [lo, Math.max(lo, Math.round(def.gold[1] * k))];
}

/** Highest level a use-based skill may reach at this character level. */
export function skillCapAt(level: number): number {
  const c = ECONOMY.skill;
  return c.capBase + c.capPerLevel * Math.min(level, KNEE) + c.lateCapPerLevel * Math.max(0, level - KNEE);
}

/** Uses of a skill needed to go from `skillLevel` to the next. The s^2 term stops growing at the knee's skill cap
 * (125): past it each skill level costs only usesPerLevel more, so a level-70 skill still moves (no effect up to 30). */
export function skillUsesToNext(skillLevel: number): number {
  const c = ECONOMY.skill;
  const sq = Math.min(skillLevel, skillCapAt(KNEE));
  return Math.max(1, Math.floor(c.usesBase + c.usesPerLevel * skillLevel + c.usesPerLevelSq * sq * sq));
}

/** How much one use of a skill counts: catchUpMult while the skill is below catchUpBelow x its cap, else 1. */
export function skillUseValue(skillLevel: number, cap: number): number {
  const c = ECONOMY.skill;
  return skillLevel < c.catchUpBelow * cap ? c.catchUpMult : 1;
}

// Experience, skill use and character level. Epic 2: level comes from XP (kills and quests), skills are capped by level.
import { UI, type QuestDef, type Rank, type SkillId } from './config';
import { ATTRIBUTES, SKILLS } from './data/core';
import { CLASSES } from './data/classes';
import { ENEMIES, QUESTS } from './content';
import { bus, say } from './events';
import { skillXpToNext } from './rules';
import { maxHp, maxMp, state } from './state';

/** Level cap for the game. */
const LEVEL_CAP = 30;

/** Rank multiplier on kill XP. */
const RANK_MULT: Record<Rank, number> = {
  trivial: 0.5, normal: 1, elite: 3, miniboss: 6, boss: 10, worldboss: 20, final: 40,
};

/** Experience needed to reach the next character level. */
export function xpToNext(level: number): number {
  return 40 + 30 * level + 4 * level * level;
}

/** Level-difference multiplier: +10% per level above you (max +30%), -20% per level below, 0 at 5 or more below. */
function levelDiffMult(enemyLevel: number): number {
  const d = enemyLevel - state.level;
  if (d > 0) return 1 + Math.min(0.3, 0.1 * d);
  if (d <= -5) return 0;
  return 1 + 0.2 * d;
}

/** Experience for killing an enemy of this level and rank, relative to the player's level. Rounded to whole XP. */
export function killXp(enemyLevel: number, rank: Rank): number {
  return Math.round((6 + 2 * enemyLevel) * RANK_MULT[rank] * levelDiffMult(enemyLevel));
}

/** Experience for finishing a quest. */
export function questXp(q: QuestDef): number {
  const tierMult = q.tier === 'finale' ? 40 : q.tier === 'main' ? 20 : 10;
  return killXp(q.level, 'normal') * tierMult;
}

/** Adds experience and loops character level-ups (capped at LEVEL_CAP). */
export function grantXp(amount: number): void {
  state.xp += amount;
  while (state.level < LEVEL_CAP && state.xp >= xpToNext(state.level)) {
    state.xp -= xpToNext(state.level);
    state.level++;
    for (const a of ATTRIBUTES) state.attributes[a]++;
    if (state.classId) state.attributes[CLASSES[state.classId].primary]++;
    state.skillPoints++;
    state.hp = maxHp();
    state.mp = maxMp();
    bus.emit('level-up', { level: state.level });
    say(`Level up! You are now level ${state.level}.`, UI.gold);
  }
  bus.emit('xp-gained', { amount, total: state.xp });
  bus.emit('changed', {});
}

/** Highest level a skill may reach at this character level. */
export function skillCap(level: number = state.level): number {
  return 5 + 4 * level;
}

/** Subscribes progression systems to events. */
export function initProgression(): void {
  bus.on('enemy-killed', ({ defId }) => {
    const def = ENEMIES[defId];
    if (def) grantXp(killXp(def.level, def.rank));
  });
  bus.on('quest-completed', ({ questId }) => {
    const q = QUESTS[questId];
    if (!q) return;
    grantXp(questXp(q));
    if (q.tier === 'finale') {
      state.skillPoints++;
      say('Finale reward: you gain a skill point.', UI.quest);
      bus.emit('changed', {});
    }
  });
}

/** Record `xp` uses of a skill: may raise the skill up to skillCap(). Does not change character level. */
export function useSkill(skill: SkillId, xp = 1): void {
  const s = state.skills[skill];
  const cap = skillCap();
  if (s.level >= cap) return;
  s.xp += xp;
  while (s.level < cap && s.xp >= skillXpToNext(s.level)) {
    s.xp -= skillXpToNext(s.level);
    s.level++;
    state.skillUps++;
    bus.emit('skill-up', { skill, level: s.level });
    const name = SKILLS.find((k) => k.id === skill)?.name ?? skill;
    say(`Your ${name} skill is now ${s.level}.`, UI.good);
  }
  bus.emit('changed', {});
}

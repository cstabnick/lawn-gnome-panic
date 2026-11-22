// Experience, skill use and character level. Epic 2: level comes from XP (kills and quests), skills are capped by level.
import { UI, type QuestDef, type Rank, type SkillId } from './config';
import { ATTRIBUTES, SKILLS } from './data/core';
import { CLASSES } from './data/classes';
import { ENEMIES, QUESTS } from './content';
import { bus, say } from './events';
import { skillXpToNext } from './rules';
import { maxHp, maxMp, state } from './state';
import { killXpAt, questXpAt, skillCapAt, xpToNextLevel } from './economy';
import { ECONOMY } from './data/economy';

/** Level cap for the game. */
const LEVEL_CAP = ECONOMY.levelCap;

/** Experience needed to reach the next character level (src/economy.ts). */
export function xpToNext(level: number): number {
  return xpToNextLevel(level);
}

/** Experience for killing an enemy of this level and rank, relative to the player's level. Rounded to whole XP. */
export function killXp(enemyLevel: number, rank: Rank): number {
  return killXpAt(enemyLevel, rank, state.level);
}

/** Experience for finishing a quest, relative to the player's level. */
export function questXp(q: QuestDef): number {
  return questXpAt(q, state.level);
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
  return skillCapAt(level);
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

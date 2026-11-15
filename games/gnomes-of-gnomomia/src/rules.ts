// Pure RPG rules (dice, to-hit, skill progression). Skill and level-up changes go through state and the event bus.
import { ATTRIBUTES, SKILLS, TUNING, UI, type SkillId } from './config';
import { bus, say } from './events';
import { maxHp, maxMp, state } from './state';

/** Sum of `count` dice with `sides` faces each. */
export function rollDice(count: number, sides: number, rng: () => number = Math.random): number {
  let total = 0;
  for (let i = 0; i < count; i++) total += Math.floor(rng() * sides) + 1;
  return total;
}

/** RuneScape-style attribute bonus: 10 is 0, 12 is +1, 8 is -1. */
export function attributeMod(value: number): number {
  return Math.floor((value - 10) / 2);
}

/** Every 5 levels of a skill add +1 to rolls. */
export function skillBonus(level: number): number {
  return Math.floor(level / 5);
}

/** d20 roll. Hits on 20 always, misses on 1 always, otherwise needs roll + bonus >= 10 + armor. */
export function attackRoll(bonus: number, armor: number, rng: () => number = Math.random): { hit: boolean; roll: number } {
  const roll = rollDice(1, 20, rng);
  const hit = roll === 20 || (roll !== 1 && roll + bonus >= 10 + armor);
  return { hit, roll };
}

/** Uses of a skill needed to reach the next level. */
export function skillXpToNext(level: number): number {
  return 2 + Math.floor(level / 2);
}

/** Record `xp` uses of a skill: may raise the skill, and the character level after enough skill-ups. */
export function useSkill(skill: SkillId, xp = 1): void {
  const s = state.skills[skill];
  if (s.level >= 100) return;
  s.xp += xp;
  while (s.level < 100 && s.xp >= skillXpToNext(s.level)) {
    s.xp -= skillXpToNext(s.level);
    s.level++;
    state.skillUps++;
    bus.emit('skill-up', { skill, level: s.level });
    const name = SKILLS.find((k) => k.id === skill)?.name ?? skill;
    say(`Your ${name} skill is now ${s.level}.`, UI.good);
  }
  // Character level: every skillUpsPerLevel skill-ups, one level, full HP and mana.
  while (state.skillUps >= TUNING.skillUpsPerLevel) {
    state.skillUps -= TUNING.skillUpsPerLevel;
    state.level++;
    for (const a of ATTRIBUTES) state.attributes[a]++;
    state.hp = maxHp();
    state.mp = maxMp();
    bus.emit('level-up', { level: state.level });
    say(`Level up! You are now level ${state.level}.`, UI.gold);
  }
  bus.emit('changed', {});
}

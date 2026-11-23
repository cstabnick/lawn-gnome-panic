// Skills: XP per skill, levels, and the time and failure effects (roadmap 8.13). Step 0 stub: every skill at 0, no effect.
import type { Bus } from './bus';
import type { SkillSystem } from './types';
import { SKILLS, type SkillId } from '../sim/types';

export function createSkills(bus: Bus): SkillSystem {
  const xp = Object.fromEntries(SKILLS.map((s) => [s, 0])) as Record<SkillId, number>;
  return {
    xp,
    level: (s: SkillId): number => 0,
    gain: (s: SkillId, kind: 'easy' | 'hard' | 'fail', mul?: number): void => { /* roadmap 8.13 */ },
    timeMul: (s: SkillId): number => 1,
    failChance: (s: SkillId, need: number): number => 0,
    load: (v: Partial<Record<SkillId, number>>): void => { /* roadmap 8.13 */ },
    onLevel: (fn: (s: SkillId, level: number) => void): (() => void) => () => {},
  };
}

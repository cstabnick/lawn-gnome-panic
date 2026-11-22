// Skill levels for the combat balance loadouts (src/sim/loadout.ts), taken from the economy sim, so both sims assume
// the same player: a level-L warden in the arena has the Blade, Blunt and Toughness the economy run had at level L.
// One default economy run per class, cached. Skills the economy sim does not track get a stand-in (see below).
import type { ClassId, SkillId } from '../config';
import { SKILLS } from '../data/core';
import { ECONOMY } from '../data/economy';
import { runEconomy, type EconomyReport } from './economy';

const cache = new Map<ClassId, EconomyReport>();

function report(classId: ClassId): EconomyReport {
  let r = cache.get(classId);
  if (!r) cache.set(classId, (r = runEconomy({ classId })));
  return r;
}

/** Every skill's level for a character of this class and level, from the default economy run.
 * Untracked skills: Block (trained by being missed with a shield up) takes Toughness's level (trained by being hit);
 * a weapon or school skill the class never trained takes the class's lowest trained weapon or school skill. */
export function economySkills(classId: ClassId | null, level: number): Record<SkillId, number> {
  const r = report(classId ?? 'warden');
  const L = Math.max(1, Math.min(ECONOMY.levelCap, Math.round(level)));
  let snap = r.skillsAtLevel[L];
  for (let l = L; !snap && l >= 1; l--) snap = r.skillsAtLevel[l];
  const known = snap ?? {};
  const weaponLike = SKILLS.map((s) => s.id).filter((id) => id !== 'toughness' && id !== 'block' && known[id] !== undefined);
  const lowest = weaponLike.length ? Math.min(...weaponLike.map((id) => known[id]!)) : 5;
  const out = {} as Record<SkillId, number>;
  for (const s of SKILLS) {
    out[s.id] = known[s.id] ?? (s.id === 'block' ? known.toughness ?? lowest : lowest);
  }
  return out;
}

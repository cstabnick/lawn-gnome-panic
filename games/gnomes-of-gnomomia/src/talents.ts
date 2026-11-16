// Talents and classes: the rank of each talent and the class the player chose.
import { UI, type ClassId } from './config';
import { CLASSES, TALENTS, TIER_GATE } from './data/classes';
import { bus, say } from './events';
import { setFlag, state } from './state';

/** Current rank of a talent (0 when not learned). */
export function talentRank(id: string): number {
  return state.talents[id] ?? 0;
}

/** Points spent in one branch of a class's talent tree. */
export function branchPoints(classId: ClassId, branch: string): number {
  let total = 0;
  for (const [id, t] of Object.entries(TALENTS)) {
    if (t.classId === classId && t.branch === branch) total += talentRank(id);
  }
  return total;
}

/** Capstones (tier 6 talents) the player has at least one rank in, not counting `exceptId`. */
function otherCapstones(classId: ClassId, exceptId: string): number {
  let n = 0;
  for (const [id, t] of Object.entries(TALENTS)) {
    if (id !== exceptId && t.classId === classId && t.tier === 6 && talentRank(id) > 0) n++;
  }
  return n;
}

/** Whether the player may spend a point on this talent right now. */
export function canLearn(id: string): boolean {
  const t = TALENTS[id];
  const classId = state.classId;
  if (!t || classId === null) return false;
  if (t.classId !== classId) return false;
  if (talentRank(id) >= t.maxRank) return false;
  if (state.skillPoints <= 0) return false;
  if (branchPoints(classId, t.branch) < TIER_GATE[t.tier]) return false;
  if (t.tier === 6 && otherCapstones(classId, id) >= 2) return false;
  return true;
}

/** Spends a point on a talent. Says the new ability's name when the talent grants one. */
export function learnTalent(id: string): void {
  if (!canLearn(id)) return;
  const t = TALENTS[id];
  const before = talentRank(id);
  state.talents[id] = before + 1;
  state.skillPoints--;
  if (before === 0 && t.grants && state.classId !== null) {
    const ability = CLASSES[state.classId].abilities.find((a) => a.id === t.grants);
    if (ability) say(`New ability: ${ability.name}`, UI.quest);
  }
  bus.emit('talents-changed', {});
  bus.emit('changed', {});
}

/**
 * Gives back every talent point. The first respec is free (it sets the flag `respec-used`);
 * after that it costs level² gold. Refuses, and changes nothing, when the gold is short.
 */
export function respec(): void {
  const free = !state.flags['respec-used'];
  const cost = state.level * state.level;
  if (!free && state.gold < cost) {
    say(`Respeccing costs ${cost} gold.`, UI.bad);
    return;
  }
  if (free) {
    setFlag('respec-used', '1');
  } else {
    state.gold -= cost;
  }
  let refund = 0;
  for (const rank of Object.values(state.talents)) refund += rank;
  state.talents = {};
  state.skillPoints += refund;
  say('Your talents are reset.', UI.good);
  bus.emit('talents-changed', {});
  bus.emit('changed', {});
}

/** Picks the player's class. Only once. Its first ability goes on hotbar slot 3 (index 2). */
export function chooseClass(c: ClassId): void {
  if (state.classId !== null) return;
  state.classId = c;
  const first = CLASSES[c].abilities[0];
  if (first) state.hotbar[2] = first.id;
  bus.emit('class-chosen', { classId: c });
  bus.emit('changed', {});
}

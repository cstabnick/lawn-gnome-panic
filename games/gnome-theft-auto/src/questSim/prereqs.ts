// Quest sim: what a save must hold for a quest to be offered, and whether every quest can ever be offered. Pure.
import { TESSIE } from '../config';
import { isQuestAvailable } from '../quests/quests';
import { unlockRule } from '../quests/unlocks';
import type { QuestDef, QuestSave } from '../quests/types';

const done = (q: QuestDef | undefined): QuestSave => ({ state: 'done', step: q ? q.objectives.length : 0, cracked: [] });

/**
 * The smallest save in which `q` is offered: its prereq chain and every unlock beat (SIDE_UNLOCKS `after`) done,
 * recursively, and the Tessie unlock entry for the Tessie quest. Throws when the chain loops or names a missing quest.
 */
export function savesToStart(q: QuestDef, quests: readonly QuestDef[]): Record<string, QuestSave> {
  const byId = new Map(quests.map((x) => [x.id, x]));
  const saves: Record<string, QuestSave> = {};
  const seen = new Set<string>();
  const need = (id: string, chain: string[]): void => {
    if (id === TESSIE.unlockKey) {
      saves[id] = { state: 'done', step: 0, cracked: [] };
      return;
    }
    if (saves[id]) return;
    if (seen.has(id)) throw new Error(`prereq loop: ${[...chain, id].join(' -> ')}`);
    seen.add(id);
    const dq = byId.get(id);
    if (!dq) throw new Error(`missing quest ${id} (needed by ${chain[chain.length - 1] ?? q.id})`);
    if (dq.prereq) need(dq.prereq, [...chain, id]);
    const rule = unlockRule(id);
    if (rule) need(rule.after, [...chain, id]);
    saves[id] = done(dq);
  };
  if (q.prereq) need(q.prereq, [q.id]);
  const rule = unlockRule(q.id);
  if (rule) need(rule.after, [q.id]);
  // A giver offers the first available quest in table order: anything before `q` at the same giver that this save
  // would offer instead is marked done too.
  let again = true;
  while (again) {
    again = false;
    for (const o of quests) {
      if (o.id === q.id) break;
      if (o.giver === q.giver && isQuestAvailable(o, saves)) {
        saves[o.id] = done(o);
        again = true;
      }
    }
  }
  return saves;
}

/**
 * Play the whole quest table forward from an empty save: keep finishing every offered quest (and turning the Tessie
 * unlock on when its beat is done, as checkUnlock does) until nothing new opens. Returns the ids never offered.
 */
export function neverOffered(quests: readonly QuestDef[]): string[] {
  const saves: Record<string, QuestSave> = {};
  let changed = true;
  while (changed) {
    changed = false;
    const tessieAfter = unlockRule(TESSIE.questId)?.after;
    if (tessieAfter && saves[tessieAfter]?.state === 'done' && !saves[TESSIE.unlockKey]) {
      saves[TESSIE.unlockKey] = { state: 'done', step: 0, cracked: [] };
      changed = true;
    }
    for (const q of quests) {
      if (saves[q.id]) continue;
      if (isQuestAvailable(q, saves)) {
        saves[q.id] = done(q);
        changed = true;
      }
    }
  }
  return quests.filter((q) => !saves[q.id]).map((q) => q.id);
}

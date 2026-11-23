// Shared quest rules: which quests the AI gnome adventurers (src/companions.ts) may run, and how quest-spawned
// enemies are tagged. Pure: no DOM, no three, no game state.
import type { NpcDef, Objective, QuestDef } from './config';

export type DefendObjective = Extract<Objective, { type: 'defend' }>;

/** True when an AI gnome may pretend to run quest `def`: it is not `solo`, its giver is not a class trainer (the
 * Calling trials are personal), and no stage is a defend or an escort (those spawn or move things around the real
 * player). */
export function companionMayTake(def: QuestDef, npcs: Readonly<Record<string, NpcDef>>): boolean {
  if (def.solo) return false;
  if (npcs[def.giver]?.trainer) return false;
  return !def.stages.some((s) => s.objective.type === 'defend' || s.objective.type === 'escort');
}

/** The key that tags the enemies stage `stage` of quest `questId` spawns (entities.ts spawnEnemyAt/clearEncounter). */
export function encounterKey(questId: string, stage: number): string {
  return `${questId}#${stage}`;
}

/** How many enemies one run of a defend stage spawns, all waves together. */
export function defendWaveTotal(o: DefendObjective): number {
  return o.waves.reduce((n, w) => n + w.count, 0);
}

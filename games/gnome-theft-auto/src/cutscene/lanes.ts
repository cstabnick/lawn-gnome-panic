// Which re-direction lane owns each scene (docs/design/gnome-theft-auto/direction/lanes.md), and how a quest plays it
// (intro, payoff, arrival / mid-quest beat), from the quest definitions. Used by the pacing report and test.
import type { QuestDef } from '../quests/types';
import type { SceneKind } from './script';

export type Lane = 'Story A' | 'Story B' | 'Side A' | 'Side B' | 'Examples';
export const LANES: readonly Lane[] = ['Story A', 'Story B', 'Side A', 'Side B', 'Examples'];

/** The first six side quests in sideQuests.ts order are Side A; the rest, Tessie and the races are Side B. */
export const SIDE_A_QUESTS = [
  'sq-grid-truthers', 'sq-porcelain-blues', 'sq-fescue-fugitive', 'sq-hoa-audit', 'sq-castaway-drydock', 'sq-mulch-pyramid',
];

export interface SceneUse { quest: string; chapter?: number; kind: SceneKind; order: number }

/** Every scene id a quest names, with how it plays it, in quest order. */
export function sceneUses(quests: readonly QuestDef[]): Map<string, SceneUse> {
  const out = new Map<string, SceneUse>();
  let order = 0;
  const put = (id: unknown, q: QuestDef, kind: SceneKind): void => {
    if (typeof id !== 'string' || out.has(id)) return;
    out.set(id, { quest: q.id, chapter: q.chapter, kind, order: order++ });
  };
  for (const q of quests) {
    if (q.cutscene?.kind === 'script') put(q.cutscene.script, q, 'intro');
    for (const o of q.objectives) {
      if (o.kind === 'visit' && o.scene) put(o.scene, q, 'arrival');
    }
    for (const id of Object.values(q.beats ?? {})) put(id, q, 'arrival');
    for (const o of q.objectives) {
      if (o.kind === 'choice') {
        put(o.optionA.outro, q, 'outro');
        put(o.optionB.outro, q, 'outro');
      }
    }
    if (q.outro?.kind === 'script') put(q.outro.script, q, 'outro');
  }
  return out;
}

/** The lane of a scene id. */
export function laneOf(id: string, use: SceneUse | undefined): Lane {
  if (id.startsWith('race-') || id.startsWith('sq-tessie')) return 'Side B';
  const quest = use?.quest ?? (id.startsWith('sq-') ? SIDE_A_QUESTS.find((q) => id.startsWith(`${q}-`)) ?? 'sq-other' : '');
  if (quest.startsWith('sq-')) return SIDE_A_QUESTS.includes(quest) ? 'Side A' : 'Side B';
  if (use?.chapter !== undefined) return use.chapter <= 2 ? 'Story A' : 'Story B';
  return 'Examples';
}

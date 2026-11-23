// Pure edits on the quest save and the hunting save, for the Save Trainer's Story and Hunting editors. No DOM, no
// localStorage: every function returns new objects and never mutates its input.
import type { QuestDef, QuestSave } from '../quests/types';
import type { HuntSaveData } from '../hunting/huntSave';

export type Saves = Record<string, QuestSave>;
export type QuestState = 'none' | 'active' | 'done';

export function questState(saves: Saves, id: string): QuestState {
  const s = saves[id];
  if (!s) return 'none';
  return s.state === 'done' ? 'done' : 'active';
}

/** Done: { state: 'done', step: q.objectives.length, cracked: [] }. */
export function completeQuest(saves: Saves, q: QuestDef): Saves {
  return { ...saves, [q.id]: { state: 'done', step: q.objectives.length, cracked: [] } };
}

/** Removes the quest's entry (back to not started). */
export function resetQuest(saves: Saves, id: string): Saves {
  const out: Saves = { ...saves };
  delete out[id];
  return out;
}

/** Story quests = quests with a `chapter`, in `quests` order. Every story quest before `id` -> done, `id` and every later story quest -> removed. Side quests untouched. Unknown id -> unchanged copy. */
export function storyStartAt(saves: Saves, quests: readonly QuestDef[], id: string): Saves {
  const story = quests.filter((q) => q.chapter !== undefined);
  const at = story.findIndex((q) => q.id === id);
  const out: Saves = { ...saves };
  if (at < 0) return out;
  story.forEach((q, i) => {
    if (i < at) out[q.id] = { state: 'done', step: q.objectives.length, cracked: [] };
    else delete out[q.id];
  });
  return out;
}

/** storyStartAt the first story quest of chapter n; n past the last chapter -> every story quest done. */
export function storyStartOfChapter(saves: Saves, quests: readonly QuestDef[], n: number): Saves {
  const story = quests.filter((q) => q.chapter !== undefined);
  const first = story.find((q) => q.chapter === n);
  if (first) return storyStartAt(saves, quests, first.id);
  const last = Math.max(0, ...story.map((q) => q.chapter ?? 0));
  const out: Saves = { ...saves };
  if (story.length > 0 && n > last) {
    for (const q of story) out[q.id] = { state: 'done', step: q.objectives.length, cracked: [] };
  }
  return out;
}

export function setLicensed(d: HuntSaveData, on: boolean): HuntSaveData {
  return { ...d, licensed: on, bag: { ...d.bag }, journal: { ...d.journal } };
}

/** Every species id gets an entry: existing ones keep their numbers (taken at least 1), new ones { taken: 1, keepsakes: 0, first: today, bestShot: 0 }. */
export function fillJournal(d: HuntSaveData, speciesIds: readonly string[], today: string): HuntSaveData {
  const journal: HuntSaveData['journal'] = { ...d.journal };
  for (const id of speciesIds) {
    const sid = id as keyof HuntSaveData['journal'];
    const existing = journal[sid];
    journal[sid] = existing
      ? { ...existing, taken: Math.max(1, existing.taken) }
      : { taken: 1, keepsakes: 0, first: today, bestShot: 0 };
  }
  return { ...d, bag: { ...d.bag }, journal };
}

export function clearJournal(d: HuntSaveData): HuntSaveData {
  return { ...d, bag: { ...d.bag }, journal: {} };
}

export function emptyBag(d: HuntSaveData): HuntSaveData {
  return { ...d, bag: {}, journal: { ...d.journal } };
}

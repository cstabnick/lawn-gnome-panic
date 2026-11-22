// When the Tessie side quest unlocks (Wild World Epic 7). Pure: plain data in, plain data out.
//
// When a save starts the story, one trigger beat is rolled from the objectives of chapters 1 to 4 and stored in the
// quest save (gta-quests-v1, so cloud saves keep it) under TESSIE.unlockKey, as a pseudo-quest entry:
//   { state: 'active', step: 0, cracked: [], beat: '<questId>#<objective index>' }
// The beat is reached once that objective is finished (the quest is done, or its step has moved past the index). The
// entry then turns 'done', which is what makes the Tessie quest available (its prereq is TESSIE.unlockKey). An old save
// already past its rolled beat unlocks at its next objective, because the check runs after every objective.
import { TESSIE } from '../config';
import { CHAPTER_1_QUESTS } from './chapter1';
import { CHAPTER_2_QUESTS } from './chapter2';
import { CHAPTER_3_QUESTS } from './chapter3';
import { CHAPTER_4_QUESTS } from './chapter4';
import type { QuestDef, QuestSave } from './types';

/** The story quests a beat may be rolled from (chapters 1 to 4). */
export const BEAT_QUESTS: readonly QuestDef[] = [...CHAPTER_1_QUESTS, ...CHAPTER_2_QUESTS, ...CHAPTER_3_QUESTS, ...CHAPTER_4_QUESTS];

/** Every possible beat, "<questId>#<objective index>", in story order. */
export function allBeats(quests: readonly QuestDef[] = BEAT_QUESTS): string[] {
  return quests.flatMap((q) => q.objectives.map((_, i) => `${q.id}#${i}`));
}

/** One beat, picked uniformly with `rand` (0..1). */
export function rollBeat(rand: () => number = Math.random, quests: readonly QuestDef[] = BEAT_QUESTS): string {
  const beats = allBeats(quests);
  return beats[Math.min(beats.length - 1, Math.floor(rand() * beats.length))];
}

/** Has the player finished the objective a beat names? An unknown beat counts as reached (a renamed quest). */
export function beatReached(saves: Record<string, QuestSave>, beat: string, quests: readonly QuestDef[] = BEAT_QUESTS): boolean {
  const cut = beat.lastIndexOf('#');
  const id = beat.slice(0, cut);
  const step = Number(beat.slice(cut + 1));
  if (!quests.some((q) => q.id === id) || !Number.isFinite(step)) return true;
  const s = saves[id];
  if (!s) return false;
  return s.state === 'done' || s.step > step;
}

/** Has this save started the story (any chapter 1-4 quest taken)? */
export function storyStarted(saves: Record<string, QuestSave>, quests: readonly QuestDef[] = BEAT_QUESTS): boolean {
  return quests.some((q) => !!saves[q.id]);
}

/**
 * Roll and store the beat if the story has started and there is none yet (or `force`, for `?tessie=now`). Mutates
 * `saves`. Returns true when it added the entry (the caller stores the save).
 */
export function ensureBeat(saves: Record<string, QuestSave>, rand: () => number = Math.random, force = false): boolean {
  const cur = saves[TESSIE.unlockKey];
  if (cur?.beat) return false;
  if (!force && !storyStarted(saves)) return false;
  saves[TESSIE.unlockKey] = { state: cur?.state ?? 'active', step: 0, cracked: [], beat: rollBeat(rand) };
  return true;
}

/** Turn the entry 'done' if its beat has been reached (or `force`). Mutates `saves`. True only on the change. */
export function checkUnlock(saves: Record<string, QuestSave>, force = false): boolean {
  const cur = saves[TESSIE.unlockKey];
  if (!cur || cur.state === 'done') return false;
  if (!force && !(cur.beat && beatReached(saves, cur.beat))) return false;
  cur.state = 'done';
  return true;
}

/** True once the Tessie quest is unlocked in this save. */
export function tessieUnlocked(saves: Record<string, QuestSave>): boolean {
  return saves[TESSIE.unlockKey]?.state === 'done';
}

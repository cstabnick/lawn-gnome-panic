Epic: 1 Save Trainer
Depends on: none

## Environment
Read and follow `docs/roadmaps/gta-save-trainer/_env.md` first (paths, rules, the trainer foundation files).

## Goal
The Character tab's two save-backed editors: **Story & quests** (set the story to the start of any chapter or quest, complete or reset one quest, reset all) and **Hunting** (Tuft License on/off, fill or clear the species journal, empty the game bag). The edits are pure functions on the save data (tested), written to localStorage, then the page reloads so every system reads the new save.

## Read first
- `games/gnome-theft-auto/src/trainer/sections/progress.ts` (stub: keep both exports and signatures)
- `games/gnome-theft-auto/src/quests/types.ts`: `QuestDef` (`id`, `title`, `chapter?` (1..5, story quests only), `objectives: ObjectiveDef[]`), `QuestSave` (`{ state: 'active' | 'done'; step: number; cracked: string[]; beat?: string }`).
- `games/gnome-theft-auto/src/quests/defs.ts`: `QUESTS` (story order: chapter 1..5, then side, Tessie, races), `questById`.
- `games/gnome-theft-auto/src/quests/questSave.ts`: `parseSavesJson(raw)`; the save is localStorage `'gta-quests-v1'` (`SAVE_KEY` in `quests/quests.ts`): `{ [questId]: QuestSave }`. The key `TESSIE.unlockKey` ('tessie-unlock', config.ts) may also be in it: leave it alone except in "Reset all quests".
- `games/gnome-theft-auto/src/hunting/huntSave.ts`: `HUNT_KEY`, `HuntSaveData` (`{ v: 1, licensed, bag, journal: Partial<Record<SpeciesId, JournalEntry>>, sold, earned }`), `JournalEntry` (`{ taken, keepsakes, first: 'YYYY-MM-DD', bestShot }`), `parseHuntSave(raw)`, `emptyHuntSave()`.
- `games/gnome-theft-auto/src/hunting/species.ts`: `SPECIES` (`id`, `name`).
- `games/gnome-theft-auto/src/saveHook.ts` (`notifySaveChanged()`), `src/trainer/mark.ts` (`markTrainerModified(what)`).

## Change
- NEW `games/gnome-theft-auto/src/trainer/progressEdit.ts` (pure: no DOM, no localStorage; return new objects, never mutate the input):
  ```ts
  import type { QuestDef, QuestSave } from '../quests/types';
  import type { HuntSaveData } from '../hunting/huntSave';
  export type Saves = Record<string, QuestSave>;
  export type QuestState = 'none' | 'active' | 'done';
  export function questState(saves: Saves, id: string): QuestState;
  /** Done: { state: 'done', step: q.objectives.length, cracked: [] }. */
  export function completeQuest(saves: Saves, q: QuestDef): Saves;
  /** Removes the quest's entry (back to not started). */
  export function resetQuest(saves: Saves, id: string): Saves;
  /** Story quests = quests with a `chapter`, in `quests` order. Every story quest before `id` -> done, `id` and every later story quest -> removed. Side quests untouched. Unknown id -> unchanged copy. */
  export function storyStartAt(saves: Saves, quests: readonly QuestDef[], id: string): Saves;
  /** storyStartAt the first story quest of chapter n; n past the last chapter -> every story quest done. */
  export function storyStartOfChapter(saves: Saves, quests: readonly QuestDef[], n: number): Saves;
  export function setLicensed(d: HuntSaveData, on: boolean): HuntSaveData;
  /** Every species id gets an entry: existing ones keep their numbers (taken at least 1), new ones { taken: 1, keepsakes: 0, first: today, bestShot: 0 }. */
  export function fillJournal(d: HuntSaveData, speciesIds: readonly string[], today: string): HuntSaveData;
  export function clearJournal(d: HuntSaveData): HuntSaveData;
  export function emptyBag(d: HuntSaveData): HuntSaveData;
  ```
- NEW `games/gnome-theft-auto/src/trainer/progressEdit.test.ts` (vitest): use the real `QUESTS` for storyStartAt / storyStartOfChapter (chapter 1 start = no story quest in the save; chapter 2 start = every chapter-1 quest done and nothing of chapter 2+; side quest entries survive), completeQuest / resetQuest, and the four hunt helpers on `emptyHuntSave()`; check inputs are not mutated.
- `games/gnome-theft-auto/src/trainer/sections/progress.ts`: implement
  - `buildStoryEditor(el, ctx)`: one `status()`; note "Changes rewrite the quest save and reload the game." When `cloudSignedIn() && !cloudPaused()` (from `../../cloudSave`), add a note: "Signed in: the cloud keeps the furthest quest progress, so a rewind comes back. Pause cloud sync in the Save tab first." A `row('Start of chapter', select of 1..5 plus 'All done' (value 6), button('Go'))` -> `storyStartOfChapter`. A `select` of every quest in `QUESTS` (label `[ch N] Title` for story, `[side] Title` otherwise, plus ` (done)` / ` (active)`), and buttons "Start story here" (story quests only; else status error), "Complete" (`completeQuest`), "Reset" (`resetQuest`). `confirmButton('Reset all quests')` -> `{}`. Apply = read `parseSavesJson(localStorage.getItem('gta-quests-v1'))`, edit, `localStorage.setItem('gta-quests-v1', JSON.stringify(next))`, `markTrainerModified('quests: ' + what)`, `notifySaveChanged()`, status "Saved. Reloading...", `reloadSoon()`. Wrap storage in try/catch.
  - `buildHuntEditor(el, ctx)`: note with license yes/no, species in journal `N / SPECIES.length`, items in bag (from `parseHuntSave(localStorage.getItem(HUNT_KEY))`). Buttons "License on" / "License off", "Fill species journal" (today = `new Date().toISOString().slice(0, 10)`), `confirmButton('Clear species journal')`, "Empty game bag". Apply the same way as quests (write HUNT_KEY, mark `'hunting: ' + what`, notify, reload).

## Contract
```ts
export function buildStoryEditor(el: HTMLElement, ctx: TrainerCtx): void; // in sections/progress.ts
export function buildHuntEditor(el: HTMLElement, ctx: TrainerCtx): void;
```
(`sections/character.ts`, written by another worker now, calls them.)

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/trainer` passes (your new test included).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your three files.

## Out of scope
quests/*, hunting/* (do not edit), `sections/character.ts`, every other file.

Epic: 1 (solvers and tools, all parallel)
Depends on: none (codes against the `QuestSimApi` contract in `src/questSim/browser.ts`, filled in by another worker)

(Read `docs/roadmaps/gta-quest-sim/_env.md` first: environment and style.)

## Goal
The Save Trainer has a 'Quest sim' tab: pick a quest (and ending), tick cheats, press 'Play this quest with the bot' or
'Play chapter', and watch progress and results.

## Read first
- `src/questSim/trainer.ts`: the stub (`registerQuestSimSection`, tab id 'quest-sim', label 'Quest sim', order 75).
  It is already registered from `src/trainer/sections/index.ts`.
- `src/trainer/types.ts` (`TrainerSection.build(container, ctx)`), `src/trainer/ui.ts` (helpers: `heading`, `note`,
  `grid`, `row`, `button`, `select`, `status`), and one built-in tab for the style, e.g. `src/trainer/sections/world.ts`.
- `src/questSim/browser.ts` (`QuestSimApi`: `run(id, { variant, cheats })`, `queue(runs, cheats)`, `status()`,
  `stop()`, `results()`; `mountQuestSim(ctx)` returns it). A run may reload the page to prepare the save; results
  survive in `results()`.
- `src/questSim/plans.ts` (`QUEST_PLANS`: suite, variants), `src/questSim/types.ts` (`CHEAT_IDS`, `ALL_CHEATS`,
  `Cheats`, `QuestResult`), `src/quests/defs.ts` (`questById(id)?.title`, `.chapter`).

## Change
- `src/questSim/trainer.ts` (fill in; keep `registerQuestSimSection()` and the tab id/label/order). It must stay
  import-light: import `browser.ts` only inside button handlers (`const m = await import('./browser')`), never at
  the top. `build(el, ctx)`:
  - `heading('Quest bot')`, a `note` saying what it does (plays the quest through the real game; cheats only for
    travel, health, heat, money and cutscenes; a run may reload the page once).
  - A quest `select` (every `QUEST_PLANS` id, label `title (id)`), an ending `select` (A / B) shown only when the plan
    has `variants`.
  - Cheat checkboxes, one per `CHEAT_IDS` entry (a plain `<label><input type=checkbox> name</label>`, 44 px tall rows),
    remembered in `localStorage['gta-questsim-cheats']` (wrap every read/write in try/catch).
  - Buttons: 'Play this quest with the bot' -> `api.run(id, { variant, cheats })`; 'Play chapter' with a chapter
    `select` (1-5) -> `api.queue(<story plans whose questById(id).chapter === n, both endings for variant quests>, cheats)`;
    'Stop' -> `api.stop()`. Each closes nothing; the trainer panel can stay open.
  - Progress: a `status()` line refreshed every 500 ms with `api.status().line` while `el.isConnected` (clear the
    interval when it is not), and a small results table (last 12 of `api.results()`: quest, ending, PASS / FAIL /
    BLOCKED, reason), refreshed with it. Get `api` lazily: `mountQuestSim(ctx)` on first use (it is idempotent).
- No test file needed (DOM-only); keep the logic that builds the chapter run list in an exported pure function
  `chapterRuns(n: number): { questId: string; variant?: 'A' | 'B' }[]` and test it in `src/questSim/trainer.test.ts`
  (import './globals' first): chapter 1 has 6 runs starting with 'prologue-fresh-kiln'; chapter 5 has 2 runs
  ('ch5-even-cut' A and B).

## Contract
`export function registerQuestSimSection(): void`; `export function chapterRuns(n: number): { questId: string; variant?: 'A' | 'B' }[]`.

## Done when
- `npx vitest run src/questSim/trainer.test.ts` passes.
- `npx tsc --noEmit -p .` shows no error in `src/questSim/trainer*.ts`.

## Out of scope
Every other file, including `src/trainer/*` (already registers the tab) and `browser.ts`.

## Environment (same for every quest-sim issue)

- Repo: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn` (Windows; use the Bash tool with Git Bash syntax). Game:
  `games/gnome-theft-auto`. If `node`/`npx` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Run commands
  from `games/gnome-theft-auto`.
- Other workers edit other files in `src/questSim/` (and other people edit other parts of the game) at the same time.
  Edit ONLY the files listed under Change. Never commit, push, stash or switch branches. No `vite build`. Do not start a
  dev server unless the issue says so.
- Style: LF line endings, 2-space indent, single quotes, semicolons, lines up to ~140 chars, short plain comments that
  say what and why. TypeScript strict: no `any` where a real type exists.
- The quest sim (`src/questSim/`) plays the game's quests with a bot. Before coding, read:
  - `src/questSim/types.ts`: the contracts (`SimCtx`, `Solver`, `SolveOpts`, `Cheats`, `SimFail`, `QuestResult`).
  - `src/questSim/util.ts`: helpers (`stepDone`, `runUntil`, `waitFor`, `travelTo`, `nearestVehicle`, `getInto`,
    `objectiveBlips`, `fmt`).
  - `src/questSim/harness.ts`: the headless game (`buildSimWorld`, `openSession`; how `step`, `teleport`, `enter`,
    `shoot`, `spawnVehicle`, `drive`, `walk`, `bail` work).
  - `src/questSim/testkit.ts`: `objectiveSession(sim, obj)` starts a one-objective test quest (`TEST_QUEST`).
- Solver rules: act only through `ctx` (SimCtx) and the game's own public functions; never edit quest data, the quest
  engine, `harness.ts`, `runner.ts`, `util.ts` or `types.ts`. Cheats (`ctx.cheats`) may replace travel (`travelTo`
  teleports and records `instantTravel`), health, heat, money and cutscene waiting. What the quest tests (cracking a
  target, delivering, reaching a spot, a race, a timed run, the choice) must be done for real, through the objective
  runner's own rules. Record any cheat you rely on: `ctx.useCheat(id, why)`. Explain a failure by throwing
  `new SimFail(cls, message)` with cls `'bot'` (the bot cannot do it yet), `'bug'` (the game is wrong), `'content'` (the
  quest data is wrong) or `'blocked'` (needs work not built yet). Use `runUntil(ctx, { questId, step, budget, what }, tick)`
  for the main loop: it steps until the engine has moved past the step and throws a 'bot' SimFail when the budget runs out.
- Tests: the first import of every test file is `import './globals';` (installs a fake document / window /
  localStorage), then `vitest` and the rest. Build the world ONCE per file at describe level:
  `const sim = buildSimWorld();` (about 1.5 s). Each `it` gets a 60_000 ms timeout. Run one file with
  `npx vitest run src/questSim/<file>.test.ts`. Type-check with `npx tsc --noEmit -p .`.
- Quest data lives in `src/quests/` (`types.ts` has every `ObjectiveDef` kind; `defs.ts` exports `QUESTS`, `GIVERS`,
  `questById`). Each objective kind has a runner (`src/quests/quests.ts` crack/visit, `objectivesDrive.ts`,
  `objectivesAction.ts`, `objectivesTessie.ts`, `objectivesTessieEscort.ts`, `objectivesRace.ts`, `objectivesCity.ts`):
  read the runner of your kind to see exactly what completes it.

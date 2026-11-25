Epic: E19-0 (courts and skate park: the shared packages)
Depends on: none
Agent: general-purpose (Sonnet): a careful extraction that must not change GBA GJAM's behaviour

## Environment
- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a9c8e1a7b64667118` (Git Bash). Use absolute
  paths; `cd` resets between commands. Node: if `node` is missing, `export PATH="/c/Program Files/nodejs:$PATH"`.
  Dependencies are installed; after adding the new package run `npm install` once at the repo root (it links the
  workspace; no new external dependencies).
- Others edit `games/gnome-theft-auto`, `games/aether-board` and `packages/trickboard` at the same time. You own
  `packages/jam/` and `games/gba-gjam/`. Never commit, never push, never `git stash`. Do not run `npm install` while
  another package is half-written? It is safe: workspaces link by folder; run it once after your package.json exists.
- Line endings: keep LF (a few files may be CRLF: keep theirs). Use `git mv` to move files so history follows, then edit
  with the Edit tool. `git diff --stat` must show only real changes.
- Rule (master plan): GBA GJAM's build and tests must still pass and its behaviour must not change. If a move would
  change behaviour, leave that piece in the game and say so.

## Goal
A new workspace package `packages/jam` (`@lawn/jam`) holds GBA GJAM's headless basketball: `JamSimulation`, its balance
config, the match/profile types it needs, the court constants, the control-input type and the pure bots. GBA GJAM
imports them from the package (its own modules re-export them, so every other GJAM import keeps working) and plays
exactly as before, proven by a golden test captured before the move. Gnome Theft Auto imports the package next (not
your job), building a `JamSimulation` with no Vite, no DOM and no Worker.

## Read first
- `games/gba-gjam/src/sim.ts` (imports, `SimPlayer`, `SimBall`, `SimCallbacks`, constructor, `step`, `setBot`,
  `getSnapshot`, `dispose`), `balance.ts`, `types.ts`, `arena.ts` lines 1-20 (the constants `COURT_HALF_X` 11.5,
  `COURT_HALF_Z` 6.2, `HOOP_X` 10.1, `HOOP_Y` 3.05, `THREE_PT_RADIUS` 5.4 sit beside scene building with `buildPrefab`),
  `input.ts` lines 1-12 (`PlayerControlInput`), `ai/index.ts` (`createBotFromAssignment` imports `?raw` scripts, a
  Worker script loader and a remote HTTP bot: those stay in the game), `ai/types.ts`, `ai/snapshot.ts`,
  `ai/classicBot.ts`, `ai/bots/` (check each is pure), `ai/eval.ts` (`withSeededRandom`, `simulateMatch`,
  `mulberry32`: use them for the golden), `sim.test.ts`, `ai/ai.test.ts`.
- `packages/golf/package.json`, `tsconfig.json`, `README.md`: the shape of a small package.

## Change
1. **Golden first.** Before moving anything, add `games/gba-gjam/src/sim.golden.test.ts`: at least 8 seeded full
   matches (`withSeededRandom` + `simulateMatch` or a direct `JamSimulation` loop with fixed dt 1/60 and bot input for
   every slot): mix difficulties, rosters (balanced/shooter/dunker), short `quarterSeconds` (e.g. 20-30) so it runs in a
   few seconds, and at least two non-classic presets. Record per match the final score, winner, overtime, every box
   score, the number of ticks, and a hash of all four players' and the ball's positions rounded to 1e-6 sampled every
   30 ticks, into `sim.golden.json` (capture with `GOLDEN_CAPTURE=1`; the test compares otherwise). It must pass before
   and after the move, never recaptured after.
2. **`packages/jam/`**: `package.json` (`"name": "@lawn/jam"`, private, type module, `exports` `./src/index.ts`, scripts
   `typecheck` and `test`, dependencies `three` `0.187.0` and `@lawn/gnome` `*` (types only), devDependencies
   `@types/three` `0.187.0`, `typescript` 7.0.2, `vitest` 5.1.0), `tsconfig.json`, `README.md` (what it is, the API
   below, the court frame: +x is the home team's attacking hoop, metres, yaw = facing), and `src/`:
   - `court.ts`: the five court constants (moved verbatim out of `arena.ts`; `arena.ts` imports and re-exports them).
   - `input.ts`: `PlayerControlInput` (moved; the game's `input.ts` re-exports the type and keeps `JamInput`).
   - `balance.ts`, `sim.ts`, the types sim needs (`types.ts`: at least `PlayerStats`, `GnomePlayerProfile`,
     `Difficulty`, `OpponentMode`, `MatchConfig`, `PlayerBoxScore`, `MatchResult`, `DunkStyle`, `AnnouncerEvent`; season
     and team types may stay in the game; the game's `types.ts` re-exports the moved ones).
   - `ai/`: `types.ts`, `snapshot.ts`, `classicBot.ts`, the pure `bots/`, and a bot factory seam:
     ```ts
     export type BotFactory = (assignment: BotSlotAssignment | undefined, opts: CreateBotOptions) => BotController;
     /** The factory JamSimulation uses for slots with no explicit bot. Default: classic bot for undefined/'classic',
      *  the pure preset bots by id, and the classic bot for anything that needs the game (scripts, remote). */
     export function setBotFactory(f: BotFactory | null): void;
     ```
     The game's `ai/index.ts` keeps `createBotFromAssignment` (scripts, Worker, remote) and registers it with
     `setBotFactory` at module load, so GJAM's sims are built exactly as today. Make sure every GJAM entry point that
     builds a `JamSimulation` imports `ai/index.ts` first (it already does through `sim.ts` today: if `sim.ts` moves, the
     game must still load `ai/index.ts` before the first match: import it from `main.ts`/`eval.ts`/tests as needed).
     If you find a cleaner seam that keeps behaviour identical (e.g. a `createBot` option on `CreateBotOptions`), use it
     and document it in the README.
   - `index.ts` exporting at least: `JamSimulation`, `SimPlayer`, `SimBall`, `SimCallbacks`, `DunkState`, `MatchConfig`,
     `MatchResult`, `PlayerBoxScore`, `GnomePlayerProfile`, `PlayerStats`, `Difficulty`, `PlayerControlInput`,
     `COURT_HALF_X`, `COURT_HALF_Z`, `HOOP_X`, `HOOP_Y`, `THREE_PT_RADIUS`, `DEFAULT_BALANCE_CONFIG`,
     `SimBalanceConfig`, `createClassicBot`, `BotController`, `BotInput`, `GameStateSnapshot`, `captureGameState`,
     `normalizeBotInput`, `setBotFactory`, and `mulberry32(seed): () => number` (move it from eval.ts or copy-free
     re-export).
   - `src/sim.test.ts` in the package: a headless match with no factory registered runs to `phase === 'finished'`
     with classic bots on all four slots (p1 input = idle) and calls `onMatchEnd` once; a second test: with
     `withSeededRandom`-style seeding the package sim gives the same result twice. A test that `JamSimulation` builds
     in plain Node (no `window`, no `Worker`).
3. `games/gba-gjam`: `package.json` gains `"@lawn/jam": "*"`; moved modules become thin re-exports
   (`export * from '@lawn/jam/...'` is not possible with a single export entry: re-export named things from
   `'@lawn/jam'`). Keep `renderer.ts`, `ui.ts`, `audio.ts`, `music.ts`, `net.ts`, `cloud.ts`, `season.ts`, `teams.ts`,
   `announcer.ts`, `ai/eval.ts`, `ai/index.ts`, `ai/scriptLoader.ts`, `ai/remoteBot.ts`, `ai/scripts/` in the game.
4. Do not touch `AGENT_INDEX.md` (the lead does).

## Done when
- `npm test -w packages/jam` and `npx tsc --noEmit -p packages/jam` pass.
- `npm run build -w games/gba-gjam` and `npm test -w games/gba-gjam` pass, including `sim.golden.test.ts` unchanged
  since capture (say in your report that you captured it before moving any file).
- `git status` shows the moves as renames where possible; no file outside `packages/jam/`, `games/gba-gjam/` and the
  root `package-lock.json` changed.

## Out of scope
`games/gnome-theft-auto`, `games/aether-board`, `packages/trickboard`, any balance or gameplay change.

Report in at most 20 lines: what moved, the bot-factory seam you chose, the exact index.ts export list, test counts.

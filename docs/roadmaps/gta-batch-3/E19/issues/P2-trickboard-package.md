Epic: E19-0 (courts and skate park: the shared packages)
Depends on: none
Agent: general-purpose (Sonnet): a careful extraction that must not change Aether Board's behaviour

## Environment
- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a9c8e1a7b64667118` (Git Bash). Use absolute
  paths; `cd` resets between commands. Node: if `node` is missing, `export PATH="/c/Program Files/nodejs:$PATH"`.
  After adding the new package run `npm install` once at the repo root (links the workspace; no new external deps).
- Others edit `games/gnome-theft-auto`, `games/gba-gjam` and `packages/jam` at the same time. You own
  `packages/trickboard/` and `games/aether-board/`. Never commit, never push, never `git stash`.
- Line endings: keep LF (keep CRLF where a file already has it). Edit with the Edit tool. `git diff --stat` must show
  only real changes.
- Rule (master plan): Aether Board's build and tests must still pass and its behaviour must not change.

## Goal
A new workspace package `packages/trickboard` (`@lawn/trickboard`) holds Aether Board's skate trick layer with no
three.js: the trick, grab and grind tables, gesture tables and `zoneOf`/`grabFor`/`grindFor`, the trick-stick
recognizer and the combo scorer. Aether Board imports them from the package (its `config.ts` and `tricks.ts` re-export,
so its other imports are unchanged) and plays exactly as before. Gnome Theft Auto will drive the combo scorer from its
own skateboard controller next (not your job): it feeds `PhysEvent`s it builds itself and reads `ComboView`.

## Read first
- `games/aether-board/src/config.ts` lines 60-260 and 320-360: `ASSIST` (mutated by descent perks: `app.ts:172`,
  `descent/perks.ts:68-69`), `BIG_AIR_S`, `CLOSE_CALL_M`, `CLOSE_CALL_POINTS`, `BoardTrick`, `BoardTrickDef`,
  `BOARD_TRICKS`, `Zone`, `GroundGesture`, `GROUND_GESTURES`, `AIR_GESTURES`, `zoneOf`, `GrabKind`, `GrabDef`, `GRABS`,
  `grabFor`, `GrindKind`, `GrindDef`, `GRINDS`, `grindFor`, `Input`, `NO_INPUT`, `TrickCmd`, `Mode`, `Player` (uses
  `THREE.Vector3`), `PhysEvent`, `ComboView`, `PALETTE` (THREE colours: stays in the game).
- `games/aether-board/src/tricks.ts` (all; `createCombo` reads only `p.t` and `p.mode` from `Player`).
- `games/aether-board/src/tricks.test.ts`, `cheat.test.ts`, `physics.test.ts` (must stay green).
- `packages/golf/package.json`, `tsconfig.json`, `README.md`: the shape of a small package.

## Change
1. **Parity first.** Before moving anything, add `games/aether-board/src/tricks.golden.test.ts`: drive one recognizer
   with a fixed scripted stick sequence (about 600 steps at `1/SIM_HZ`, mixing ground flicks with and without `mod`,
   air flicks, idle, every `GROUND_GESTURES` path and every `AIR_GESTURES` zone) and record every returned `TrickCmd`;
   drive one combo with a fixed list of ~40 `PhysEvent`s and ticks (takeoff, pop, trickDone, grabs, land with spins and
   flips, grinds with switches and ley lines, manuals, bail, respawn) and record `view()` after each. Save to
   `tricks.golden.json` (`GOLDEN_CAPTURE=1` captures). It must pass before and after, never recaptured.
2. **`packages/trickboard/`**: `package.json` (`"name": "@lawn/trickboard"`, private, type module, `exports`
   `./src/index.ts`, scripts `typecheck` and `test`, devDependencies `typescript` 7.0.2 and `vitest` 5.1.0; **no
   three.js**), `tsconfig.json`, `README.md` (what it is, the tables, how a game feeds the combo its own events,
   the stick convention: unit disc, x right, y up = forward; points), and `src/`:
   - `tables.ts`: every table/type/function listed above except `Input`, `NO_INPUT`, `Player` and `PALETTE`, moved
     verbatim. `ASSIST` moves too (one object: Aether Board's `config.ts` re-exports the same object, so its perks still
     mutate what the combo reads).
   - `tricks.ts`: `createRecognizer`, `Recognizer`, `createCombo`, `Combo`, moved verbatim except that `Combo.event` and
     `Combo.tick` take `p: ComboPlayer` where `export interface ComboPlayer { t: number; mode: Mode }` (Aether Board's
     `Player` satisfies it structurally).
   - `index.ts` exporting all of it, plus `export const TRICK_STICK_DEADZONE` only if `zoneOf` uses a dead zone you
     can name without changing it (otherwise skip).
   - `src/tricks.test.ts`: a copy of the game's `tricks.test.ts` with imports pointed at the package (drop cases that
     need Aether physics, keep every recognizer and combo case), plus one test that `createCombo` scores
     `takeoff, pop{ollie}, trickDone{kickflip}, land{spin:180}` and banks after the link time as Aether Board does.
3. `games/aether-board`: `package.json` gains `"@lawn/trickboard": "*"`; `config.ts` re-exports the moved names from
   `'@lawn/trickboard'` (keep `Input`, `NO_INPUT`, `Player`, `PALETTE`, `TUNE`, `SIM_HZ` and the rest in the game);
   `tricks.ts` becomes a re-export of the package's recognizer and combo.
4. Do not touch `AGENT_INDEX.md` (the lead does).

## Done when
- `npm test -w packages/trickboard` and `npx tsc --noEmit -p packages/trickboard` pass.
- `npm run build -w games/aether-board` and `npm test -w games/aether-board` pass, including `tricks.golden.test.ts`
  unchanged since capture (say in your report that you captured it before moving).
- No file outside `packages/trickboard/`, `games/aether-board/` and the root `package-lock.json` changed.

## Out of scope
`games/gnome-theft-auto`, `games/gba-gjam`, `packages/jam`, any tuning change.

Report in at most 15 lines: what moved, the exact index.ts export list, test counts.

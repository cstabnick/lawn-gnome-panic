Epic: E23-1 Framework (parallel)
Depends on: none
Model: sonnet

## Environment
Read `docs/roadmaps/gta-batch-3/E23/env.md` first (worktree, toolchain, line endings, contracts in place, rules).

## Goal
The quest sim bot passes the two quests it still fails because of bot limits (no game or quest-data changes):
- `city-glow-band-express`: timed `checkpoints` (push-bike, 90 s, 4 gates across town: (55,-43) → (64,-30) → (-62,90)
  → (-62.5,-90)). Baseline: "3 timed attempts failed (best gate 2/4)".
- `city-skyway-robbery` step 0: timed `checkpoints` on a zero-turn up the Skyway: gate 0 on-ramp (-219,-40), then deck
  gates at `height: 7.5` over (0,-60), (316,-60), (440,-46), off-ramp (550,16). Baseline: "stuck at gate 2 (Skyway deck
  over Downtown)": `driveTo` heads straight for the gate and never climbs the deck ramp.
Timebox: if one of them needs more than a contained solver change, finish the other and report what the remaining one
needs.

## Read first
- `src/questSim/solvers/checkpoints.ts` (`timedAttempt`, `timed`, `getRide`), `src/questSim/solvers/driver.ts`
  (`driveTo(ctx, x, z, { arrive, why, deckY, until })`: how it steers, what `deckY` does), `src/route.ts` (the game's
  road router used by the HUD: find the exported function that returns a road route between two points, with deck /
  under levels — `HudRoute.points[].level` is `'deck' | 'under'`), `src/highways/roads.ts` (`nodeY`, deck nodes, ramp
  links), `src/questSim/util.ts`.

## Change
- `src/questSim/solvers/driver.ts` and/or `src/questSim/solvers/checkpoints.ts` only:
  - A route-following drive: `driveRoute(ctx, x, z, o)` that asks the game's road router for the road path from the
    player to the gate (on the gate's level: for a deck gate, a route that ends on deck nodes and uses the on-ramp),
    then `driveTo`s each route point in turn with a small `arrive` (e.g. 5 m), finishing with the gate itself. Use it
    in `timedAttempt` for ground vehicles; keep `driveTo` as the fallback when no route is found.
  - For the push-bike run: check why it misses time (log speeds; e.g. it brakes for every route point, or cuts across
    buildings and gets stuck). Fixes allowed: not slowing for intermediate route points, cutting corners within the
    road, using the bike's boost if the game has one for it. Never teleport after gate 0 (the existing rule).
- Do not change `src/quests/*`, gate positions or the clock.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for your files.
- `cd games/gnome-theft-auto && npx vitest run --config vitest.sim.config.ts src/questSim/solvers/checkpoints.sim.test.ts src/questSim/solvers/driver.sim.test.ts` passes.
- From the worktree root: `npm run quest-sim -w games/gnome-theft-auto -- --quest city-glow-band-express,city-skyway-robbery --force`
  shows both passing (or one, with the other's blocker explained in your report), and
  `npm run quest-sim -w games/gnome-theft-auto -- --suite city --force` has no new failures.

## Out of scope
Every file outside `src/questSim/solvers/`. The fuzzer (another worker adds `src/questSim/fuzz/` and edits
`src/questSim/runner.ts` at the same time: do not touch runner.ts).

Epic: E19-B (courts and skate park: runtimes and quests)
Depends on: E19-A (the save `sports/save.ts`, the probes in `city/probes.ts`, the cast rows)
Agent: general-purpose (Sonnet)

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own the new files
`games/gnome-theft-auto/src/quests/sportsQuests.ts`, `src/quests/stages/sports.ts`, and additions to
`src/quests/defs.ts`, `src/quests/unlocks.ts`, `src/quests/stages.ts` (or wherever stage lists are joined),
`src/questSim/solvers/probe.ts`, `src/data/levels/turfton.level.json` (two giver markers) and
`src/layout.golden.json` (regenerate). Two other workers write `court/runtime.ts` and `skate/runtime.ts` at the same
time: do not edit them.

## Goal
The two side quests of the side-quest schedule for Founders' Green: `sq-court-regulars` "Run With the Regulars"
(Cardoon "Swish" Trowelly) and `sq-gutter-bowls-sessions` "Gutter Bowls Sessions" (Fennel Gripwax), with givers,
stages, unlock rules and quest-sim solvers.

## Read first
- `docs/design/gnome-theft-auto/side-quest-schedule.md` rows `sq-court-regulars` and `sq-gutter-bowls-sessions`.
- `games/gnome-theft-auto/src/quests/golfQuests.ts` (the model: dialogue cutscene with looks, `probe` objectives with
  `at`/`hint`, rewards), `quests/defs.ts` (the golf givers block and `placed()`; how GOLF_QUESTS joins the list),
  `quests/unlocks.ts` (the Hedgeworth rows), `quests/stages/golf.ts` and how `GOLF_STAGES` is joined, and
  `questSim/solvers/probe.ts` (the golf solvers through the store).
- `games/gnome-theft-auto/src/court/types.ts` (`COURT_QUEST`, `COURT_PROBES`, `COURT_PEOPLE`, `SCOREBOARD`,
  `BALL_CAGE`, `PICKUP`), `src/skate/types.ts` (`SKATE_QUEST`, `SKATE_PROBES`, `SKATE_LINES`, `SKATE_PEOPLE`,
  `BOARD_LIBRARY`; line probes are `skate-line-<id>`), `src/sports/types.ts` (`SPORTS_CAST` names and looks),
  `src/sports/save.ts` (`createSportsStore`).
- Lore: `docs/lore/entries/apocrypha/cardoon-trowelly.md`, `fennel-gripwax.md`, `the-gutter-bowls.md`,
  `drainpipe-court.md`, `lintel-crossover.md`, `pansy-rebound.md`.
- `games/gnome-theft-auto/src/layout.golden.test.ts` (regenerate with `UPDATE_GOLDEN=1 npx vitest run
  src/layout.golden.test.ts` after adding markers).

## Change
- `src/quests/sportsQuests.ts`, `export const SPORTS_QUESTS: readonly QuestDef[]`:
  - `sq-court-regulars` "Run With the Regulars", giver 'cardoon', reward 200 Acorns, hoa 'off'. Dialogue: Swish liked
    your defence ("You stand in the way like you mean it."), the court has rules, nobody owns it, he is the nearest
    thing; he wants to see you shoot, then win, then play him properly. Objectives (probe, count = more than now):
    1) `jam-shoot-makes` count 3 "Sink three in a shootaround" at BALL_CAGE, hint "E at the ball cage for a ball";
    2) `jam-wins` count 1 "Win a pickup game with Pansy" at SCOREBOARD, hint "E at the chalk scoreboard";
    3) `jam-swish-beaten` count 1 "Beat Swish and Lintel to 7" at Cardoon's spot, hint "E by Swish to challenge him".
  - `sq-gutter-bowls-sessions` "Gutter Bowls Sessions", giver 'fennel', reward 250, hoa 'off'. Dialogue: Fennel gave
    the cap back (#9), feeds the strays, keeps a list of lines nobody has skated; the Board Library, take one, leave
    one. Objectives: 1) `skate-board-owned` absolute 1 "Take a board from the Board Library" at BOARD_LIBRARY;
    2) `skate-line-first-push` absolute 1 "Skate First Push" (hint: "Roll through Fennel's chalk marks: the run-up, off
    the kicker, along the rail"); 3) `skate-line-bowl-line` absolute 1 "Skate Round the Kidney"; 4)
    `skate-line-long-gutter-line` absolute 1 "Skate the Long Gutter". `at` = each line's first gate in world
    coordinates (SKATE_ORIGIN + (u, v)).
  Dry, warm, specific lines in the house voice; Swish is a hustler with a heart, Fennel laid-back.
- `src/quests/defs.ts`: givers `cardoon` ("Drainpipe Court", "Talk to Swish Trowelly") and `fennel` ("The Gutter
  Bowls", "Talk to Fennel Gripwax") with `placed(...)` like the golf givers; join `SPORTS_QUESTS` to the list where
  `GOLF_QUESTS` is joined.
- `src/data/levels/turfton.level.json`: giver markers `giver/cardoon` at Cardoon's spot plus 1.5 m south (x -84.5,
  z 31.5) and `giver/fennel` near his spot (x -47, z 93.5), each with an `exit` like the other giver markers; then
  regenerate `layout.golden.json`.
- `src/quests/unlocks.ts`: rows (temporary, like the Hedgeworth ones): both after `ch1-founders-boot` ("The schedule has
  it after #14 m14-drainpipe-court / #15; E20 moves it." with the place reason). Check `ch1-founders-boot` exists.
- `src/quests/stages/sports.ts`: two stages (`cardoon` at the court, `fennel` at the Bowls) in golf.ts's format
  (look, sounds, marks, a camera), joined where `GOLF_STAGES` is.
- `src/questSim/solvers/probe.ts`: 'api' solvers for every probe the quests use, writing through
  `createSportsStore(store())` (`recordShootMake`, `recordGame({ won: true, margin: 2, threes: 0, dunks: 0, swish })`,
  `setBoardOwned`, `recordLine(id, 20)`).
- If a stages/doc test or the coverage test wants more (a stage per giver, a solver per probe), satisfy it.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/quests src/questSim/coverage.test.ts src/layout.golden.test.ts src/levels.test.ts` passes.
- `npx vitest run --config vitest.sim.config.ts src/questSim/side.sim.test.ts` passes for the two new quests (if the
  suite takes a filter, run only them; report the result).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
court/, skate/, sports/ (read only).

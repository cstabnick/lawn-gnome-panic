# Gnome Theft Auto: quest sim players

The user's words: "add quest sim players. so that we can simulate playing the quest. make it a sort of test if you
will. can have cheats for things that don't really matter (like ammo)".

A bot that plays every quest in `src/quests/` through the game's real systems (quest engine, objective runners,
pedestrians, Hat Watch, player, vehicle physics) and checks that each quest can be taken, that every objective can be
done, and that it completes with its reward, achievement, bulletin, scenes and comms, surviving a save round trip.
Failures are the product: each one is classified and listed below.

## Design (decided)

- **Two layers, one bot.** Solvers (one per objective kind, `src/questSim/solvers/`, table in `solvers/index.ts`) act
  only through `SimCtx` (`src/questSim/types.ts`). The runner (`runner.ts`) takes a quest from its giver, calls the
  solver for each objective, and checks the session record afterwards.
  - Headless (`harness.ts`, vitest): the real `buildWorld` once per test file, then per quest a fresh session: real
    `createQuests`, `createNpcs`, `createWatch`, `createPlayer`, `createEconomy`, `stepVehicle`; the HUD, audio and
    cutscene player are recorders. The cutscene recorder compiles each scene (`cutscene/timeline.ts compile`) to check
    it has a finite length and fires its 'call' steps. Fixed step 1/30 s; ~0.2 ms a step.
  - Browser (`browser.ts`, `?debug&questsim=<id>`, `tools/quest-sim.mjs`): the same runner and solvers on the live game.
    `questSim/input.ts` lays the bot's controls over the frame input (one line in app.ts). A run prepares the save and
    reloads once (the quest engine reads its save at boot); no save round trip in this layer.
- **Cheats are explicit** (`Cheats` in types.ts): infiniteAmmo, godMode, noHeat, instantTravel, skipCutscenes,
  freeAcorns, noWanted, unlockAllItems, fastClock, vehicleRepair. Each run records which ones it actually used. What a
  quest tests is never cheated: targets are shot through the same path as a bullet (`ctx.shoot` mirrors app.ts
  `hitTest`), vehicles are delivered by driving them into the ring, races are driven by the Speedway's racing line
  through `stepVehicle`, timed gate runs are driven / flown after the start gate, the Tessie dredger is rammed.
- **Prerequisites**: `prereqs.ts savesToStart(q)` builds the smallest save in which the quest is offered (its prereq
  chain, its SIDE_UNLOCKS beat, the Tessie unlock, and any earlier quest at the same giver). `neverOffered()` plays the
  table forward to prove every quest can be offered.
- **Expectations**: `plans.ts` has one plan per quest (coverage.test.ts fails for a quest without one); each plan says
  `expect: 'pass'` or the known failure (status, class, reason). The opt-in sim suites `<suite>.sim.test.ts` (story, side,
  city, newcomers, races) fail when a result differs from its plan, both ways.
- **Static checks** (`checks.ts`): spots inside colliders / on water / off the world, missing scenes, unreachable
  unlocks, with a known baseline.
- **At most 6 sim players at once** (user requirement): `MAX_SIM_PLAYERS = 6` in `src/questSim/config.ts`;
  `--parallel N` may only lower it (`simParallel`). `pool.ts runPool` enforces it (`pool.test.ts` proves the pool
  never exceeds 6 and queues the rest). Headless: one quest run at a time per vitest process (the sim shares module
  state), and `vitest.sim.config.ts` runs at most `MAX_SIM_PLAYERS` (6) sim test files at once (`maxWorkers`); none run under `npm test`.
  Browser: `tools/quest-sim.mjs` keeps at most N (<= 6) pages open, closes each page when its run ends and the
  browser on exit, failure, timeout or Ctrl+C. Planner-launched Haiku workers: no more than 6 at once (epic 1 was
  launched as 12 before this rule arrived; no new worker started until fewer than 6 were running).
- **Not quests**: traffic errands (`errands.ts`) are traffic routing, not quests; the sim-jobs intro is the Newcomers'
  `nc-odd-jobs` quest (probe `job-gigs`).

## How to run (manual validation tool, not CI)

The quest sim is opt-in. `npm test` runs only its fast unit tests (`pool`, `coverage`, `report`, `browser`, `trainer`:
about 4 s). Everything that builds the world or plays quests is named `*.sim.test.ts`, is excluded by
`vitest.config.ts`, and runs only through `vitest.sim.config.ts` or the tool. Do not run the full sim for small fixes:
rerun only the quests you changed.

- Smoke: `npm run quest-sim -w games/gnome-theft-auto -- --quick` (one quest per objective kind, 13 runs, ~10 s).
- A slice: `-- --quest id[,id]` (5-10 s) or `-- --chapter n` / `-- --suite story|side|city|newcomers|races` (20-40 s).
- Everything: `-- --all` (58 runs, ~1-2 min headless). Results are cached per code version
  (`<os tmp>/gta-quest-sim/cache.json`, keyed by git HEAD + the game's uncommitted src): quests already run on the same
  code are skipped; `--force` reruns them. Reports: `report.json` + `report.md` under `<os tmp>/gta-quest-sim/<stamp>`.
- The suites with expectations (plans.ts): `npm run quest-sim:suites -w games/gnome-theft-auto` (~1-2 min).
- Browser: dev server up (`npx vite --port 5445 --strictPort` in games/gnome-theft-auto), then
  `npm run quest-sim:e2e -w games/gnome-theft-auto -- --quest first-contract [--headful]`; or open
  `http://localhost:5445/?debug&questsim=first-contract` to watch; or the Save Trainer's 'Quest sim' tab.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 0. Foundation (planner) | types, harness, runner, prereqs, util, plans, suites, coverage, stubs, app.ts / trainer hooks; tsc passes | written by the planner |
| 1. Solvers and tools | every solver + its test, driver, static checks, report + CLI, browser layer, trainer tab; tsc and `npm test` pass for questSim | 12, parallel |
| 2. Run, classify, fix | every quest run; results table below; bot limitations improved, small genuine bugs fixed | by the planner from the results |

Issues of epic 1 (each a file next to this one; `_env.md` is pasted by reference into each):

| Issue | Files |
| --- | --- |
| [E1-01 foot](gta-quest-sim/E1-01-foot.md) | solvers/foot.ts, foot.sim.test.ts |
| [E1-02 drive](gta-quest-sim/E1-02-drive.md) | solvers/drive.ts, drive.sim.test.ts |
| [E1-03 action](gta-quest-sim/E1-03-action.md) | solvers/action.ts, action.sim.test.ts |
| [E1-04 tessie](gta-quest-sim/E1-04-tessie.md) | solvers/tessie.ts, tessie.sim.test.ts |
| [E1-05 race](gta-quest-sim/E1-05-race.md) | solvers/race.ts, race.sim.test.ts |
| [E1-06 driver](gta-quest-sim/E1-06-driver.md) | solvers/driver.ts, driver.sim.test.ts |
| [E1-07 checkpoints](gta-quest-sim/E1-07-checkpoints.md) | solvers/checkpoints.ts, checkpoints.sim.test.ts |
| [E1-08 probe](gta-quest-sim/E1-08-probe.md) | solvers/probe.ts, probe.sim.test.ts |
| [E1-09 checks](gta-quest-sim/E1-09-checks.md) | checks.ts, checks.sim.test.ts |
| [E1-10 report + CLI](gta-quest-sim/E1-10-report-cli.md) | report.ts, report.test.ts, cli.sim.test.ts, tools/quest-sim.mjs |
| [E1-11 browser](gta-quest-sim/E1-11-browser.md) | browser.ts, browser.test.ts |
| [E1-12 trainer](gta-quest-sim/E1-12-trainer.md) | trainer.ts, trainer.test.ts |

## Results (headless, ALL_CHEATS, one full run + the slices changed after it)

55 quests, 58 runs (choice quests run both endings): **55 pass, 2 fail, 1 blocked**. Every story chapter (1-5, both
Even Cut endings), all 11 Strangers & Freaks, both Pebblewick quests, Tessie (both endings), all 4 Fizz Cup races
(driven for real; won on attempt 1-4 as the bot corners harder after a loss), 3 of 5 city contracts, 14 of 15
Newcomers' Card tutorials. Every passing run checked: offered by its giver, every objective done through its runner,
save round trip mid-quest, reward paid once, achievement, radio bulletin, every intro / beat / arrival / outro scene
played and compiled, no exceptions.

| Quest | Result | Class | Why |
| --- | --- | --- | --- |
| city-glow-band-express | pass | | E23: passes since `driveTo` stopped skipping a route aim behind the bike (it used to cut into a building near (47,-37)). |
| city-skyway-robbery | pass | | E23: passes since deck gates need the deck height and the route starts from the street under a deck node. |
| nc-party | blocked | blocked | Needs the @lawn/mp relay; headless has none. |
| every other quest (52 quests, 55 runs) | pass | | |

Cheats used: instantTravel (every quest, travel between places), skipCutscenes (every quest), godMode + fastClock (the
Frostbite derby), unlockAllItems (Tessie boats, spawned rides, golf cart), freeAcorns (purchases in the tutorials),
vehicleRepair (timed city runs). Never cheated: cracks, deliveries, races, timed gates after the start, the dredger rams.

Browser layer (E2E): built; the save-prepare-and-reload flow was seen working in headless Edge, but no quest was
watched to the end (the first try hit the stuck timer while the dev server was still loading; fixed: the stuck clock
now starts when the bot is playing). Not validated end to end.

### Bugs found

1. **Squad units shot with water never count for the quest** (fixed, one line): app.ts `hitTest` called
   `quests.onCracked` only for pedestrians, so convoy escorts (ch2-dew-run) and the Grand Combine's guards
   (ch5-even-cut) could only be cleared by knocking them over at the right moment: a softlock for a player who shoots
   them. Fix: `quests.onCracked(o)` when `watch.crack(o)` cracks a unit. Repro before the fix:
   `npm run quest-sim -w games/gnome-theft-auto -- --quest ch2-dew-run --force`.
2. **Skyway west on-ramp landing is walled** (not fixed, for the cleanup pass): `highways/colliders.ts skywayColliders`
   leaves a side-rail box across the deck at x -213.5..-208.9, z -59.7..-60.3 (and x -213.5..-212.9, z -60.3..-55.7)
   where the west ramp turns east; a vehicle climbing the ramp stops there. Repro:
   `npm run quest-sim -w games/gnome-theft-auto -- --quest city-skyway-robbery --force`.
3. Content (static checks, `checks.sim.test.ts` KNOWN_STATIC): derby arena centre (0, -350) inside a collider;
   nc-odd-jobs visit spot (-30, 34) and the Tuft & Tally lodge probe spot (-548, -52) inside buildings; nc-hangar visit
   spot (-690, -566) on water; sq-big-lou-embargo van spawn (-90, -56) against a Skyway collider (the runner nudges it
   out). All quests still pass (the bot's teleport / the runner's nudge hide them; a walking player may not).

### What the bot cannot do yet

- Drive timed city routes reliably (glow-band); follow a chase or walk long distances without instantTravel (it
  teleports); fly the air-drop plane for real (teleports it over the zone); UI-only probes headless (wheel, kit, emotes,
  street events, lock-up, banner) go through the sim's stand-ins, and Sling-Lift / Slipway / Hopper are paid through
  the economy with the activity's reason instead of their full UI; online party; the browser layer's round trip.
- Not quests, not simulated: traffic errands (errands.ts is traffic routing). The sim-jobs intro is nc-odd-jobs (pass,
  via the jobs store's recordGig).

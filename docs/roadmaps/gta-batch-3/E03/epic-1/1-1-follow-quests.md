Epic: 1 Fixes (parallel) · Item: L03 "make sure every follow quest is completable. many times they get stuck" · Model: sonnet
Depends on: none

## Environment
See `docs/roadmaps/gta-batch-3/E03/env.md` (read it first; its rules are part of this issue).

## Goal
Every `chase-follow` quest can always be finished: the leader never stalls for good, a slow or lagging player can catch
up, and the quest sim proves it with a realistic follower (not a 6 m teleport) and a "no stall" check.

## What is known
- Follow objectives: `quests/chapter1.ts` (prologue-fresh-kiln obj 0, push-bike, speed 11, maxDist 75; ch1-two-coat-tail
  obj 0, ride-on, speed 15), `quests/chapter4.ts` (ch4-spade-truce obj 0, zero-turn to the Fort Sandpit gate),
  `quests/outskirtsQuests.ts` (sq-hum-at-three, hoa-van, maxDist 60). Tessie escort is separate and passes; leave it.
- Runner: `quests/objectivesDrive.ts` `chaseFollowRun` (~line 253). Leader follows `expandRoadWaypoints` path with
  `steerToward` -> `stepNpcCar` (`npcChassis.ts`, collides with world boxes). Problems seen in code:
  1. Stuck detector `if (moved < 0.5 * dt * 10)` = under 5 m/s. Corner pace is `pace * 0.6` and pace drops to
     `speed * 0.55` when the player is 65% of maxDist away, so a legitimately slow leader (e.g. 11*0.55*0.6 = 3.6 m/s)
     counts as stuck and is TELEPORTED 3 m toward the aim every 2.5 s, through walls/kerbs/boxes, which can wedge it.
  2. A truly wedged leader only gets 3 m nudges toward the aim point (straight line, possibly into the same box).
  3. When the player is beyond `maxDist * 1.05` the leader stops with only a "Wait up!" toast; no marker on the
     leader saying it waits, and the HUD line does not change.
  4. Final waypoint: if the player is not within maxDist on arrival `wpIdx` resets and the leader circles the last aim.
- Quest sim: `questSim/solvers/drive.ts` `chaseFollowSolver` teleports the player 6 m behind the leader every tick
  (needs `instantTravel`), so it never tests a lagging player. Runner helpers in `questSim/runner.ts`/`util.ts`
  (`runUntil`, `waitFor`, `ctx.teleport`, `ctx.useCheat`), `questSim/checks.ts` holds post-conditions, sim suites run
  with `npm run quest-sim:suites -w games/gnome-theft-auto` (vitest.sim.config.ts, `*.sim.test.ts`).
  Single quests: `npm run quest-sim -w games/gnome-theft-auto -- --quest prologue-fresh-kiln --force` (headless,
  writes report.md; at most 6 sim players, headless runs one at a time).

## Change
- New `quests/followWatchdog.ts` (pure, no THREE): `createFollowWatchdog(opts?)` returning
  `{ step(dt, s: { leaderX, leaderZ, aimX, aimZ, playerDist, maxDist, waiting: boolean }): FollowAction; stalledFor(): number; maxStall(): number }`
  with `type FollowAction = 'none' | 'nudge' | 'snap-road' | 'skip-waypoint'`. Progress = distance to the aim point
  shrinking (not raw speed). No progress while not `waiting` for 4 s -> 'nudge' (back off 2 m and re-aim), 8 s ->
  'snap-road' (put leader on the nearest ground road node on its path), 15 s -> 'skip-waypoint'. Reset on progress.
  Unit tests `quests/followWatchdog.test.ts`.
- `quests/objectivesDrive.ts` `chaseFollowRun` ONLY (do not touch `stealDeliverRun`, another issue edits it next):
  replace the speed-based stuck/teleport with the watchdog; implement the actions (snap: nearest `deps.world.roads.nodes`
  node without `deck`, on or near the path, pushed clear with `pushOutOfBoxes`); while the player is too far, the leader
  waits (as now) and `lines()` shows `{{Leader}} is waiting for you`, and after 20 s of waiting the effective maxDist grows
  by 50% (catch-up grace); arrival at the last waypoint completes when the player is within the effective maxDist, or
  after the leader has waited at the end for 10 s with the player within 2x maxDist. Expose for the sim a debug getter
  on the Run: `followStats?(): { maxStall: number; waited: number }` (add the optional field to the `Run` interface in
  `quests/types.ts` - only that one optional line in that file).
- `questSim/solvers/drive.ts` `chaseFollowSolver`: replace the 6 m teleport with a "trail" follower: keep a breadcrumb
  of leader positions and teleport the player to where the leader was 2.5 s ago (still `instantTravel`, still a cheat
  note), plus one lag episode: once per run, stand still for 12 s (player falls behind), then resume trailing. After
  the run, fail with `SimFail('bug', ...)` if `followStats().maxStall > 20`. Add the stall assertion to `questSim/checks.ts`
  if checks live there.
- `questSim/solvers/drive.sim.test.ts`: one sim test per follow quest (the 4 ids above) that it finishes with the trail
  follower.

## Done when
- `npx vitest run src/quests/followWatchdog.test.ts` passes; `npx tsc --noEmit -p games/gnome-theft-auto` clean for your files.
- `npx vitest run --config vitest.sim.config.ts src/questSim/solvers/drive.sim.test.ts` passes (from the game dir).
- `npm run quest-sim -w games/gnome-theft-auto -- --quest prologue-fresh-kiln,ch1-two-coat-tail,ch4-spade-truce,sq-hum-at-three --force`
  all pass. Put the root cause(s) you confirmed (which quest stalled where, and why) in your report.

## Out of scope
`stealDeliverRun`, `convoyAmbushRun`, `collide.ts` (E02 owns it: if a leader wedges on a collider, report it), app.ts,
any other questSim solver.

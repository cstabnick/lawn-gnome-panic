Epic: 1 (solvers and tools, all parallel)
Depends on: none

(Read `docs/roadmaps/gta-quest-sim/_env.md` first: environment, style and solver rules.)

## Goal
The quest bot wins the Fizz Cup races (`race` objectives) by actually driving them, with the Speedway's racing-line
driver, through the game's own vehicle physics. No cheat may decide the result.

## Read first
- `src/quests/objectivesRace.ts`: phases 'travel' -> 'countdown' (starts when the player sits in the race vehicle
  `mine`, spawned at `gridSlot(obj.rivals.length)`, kind `obj.vehicle`, `questOwned`) -> 'racing' -> 'won' -> podium
  scene -> 'done'. A lost race (not in `mustPlace` or better) goes back to the grid after a few seconds ('travel'
  again: the player is put back in `mine`? check `abandon` / the fail path and re-enter `mine` when needed). The player's
  lap distance comes from `locate(mine.x, mine.z, ...)`; leaving the vehicle more than 8 s abandons the race.
- `src/raceTrack/autopilot.ts`: `racingLine(s, speed, grip)` and `steerTo(x, z, yaw, aimS)`; `autopilotInput` shows how
  they turn into input: `moveX = steerTo(...)`, `moveY = speed < target ? 1 : speed > target + 1.5 ? -1 : 0`.
- `src/raceTrack/track.ts`: `locate(x, z, reach, hint)` returns `{ s, i } | null`, `gridSlot(slot)`.
- `src/app.ts` line ~1580: the game drives with `stepVehicle(v, { throttle: moveY, steer: moveX, lift }, dt, world)`
  (the harness does the same with `ctx.drive`).
- `src/questSim/harness.ts`: `ctx.drive(c)` holds controls on the player's vehicle; `ctx.step(dt)`.

## Change
- `src/questSim/solvers/race.ts` (replace the stub; keep `raceSolver: Solver<'race'>`):
  - Find `mine`: the vehicle of kind `obj.vehicle` with `questOwned` and `driver !== 'npc'` nearest
    `gridSlot(obj.rivals.length)` (wait up to 2 s). `getInto(ctx, mine, 'race grid')` (travel to the grid may teleport).
  - `runUntil(ctx, { ..., budget: o.budget }, tick)` where tick: if `ctx.player.vehicle !== mine` -> `ctx.enter(mine)`;
    else compute `spot = locate(mine.x, mine.z, 60, hint)` (keep `hint = spot.i`), `{ aimS, target } = racingLine(spot.s,
    mine.speed, GRIP)` with `GRIP = 0.95`, and `ctx.drive({ throttle: mine.speed < target ? 1 : mine.speed > target + 1.5 ? -1 : 0,
    steer: steerTo(mine.x, mine.z, mine.yaw, aimS), lift: 0 })`. When `locate` returns null (off the track), steer
    toward the nearest track point and throttle 0.5.
  - Count attempts: each time the objective lines show a new race start, `ctx.log('race attempt N')`. After 4 lost
    attempts throw `new SimFail('content', 'race <raceId>: lost 4 times with the racing line at grip 0.95 (time limit / rivals too fast?)')`.
    Simple way: count banner texts `ctx.record`? Not on SimCtx; instead count transitions of `mine.speed` from > 5 to 0
    while on the grid, or read `ctx.quests.getJournal().activeLines[0]` ('Lap 1/3 ...') resets. Pick one and comment it.
  - Never call `useCheat` for driving; it is all real. Call `ctx.drive(null)` before returning.
  - `check()`: none needed.
- `src/questSim/solvers/race.test.ts` (new): `objectiveSession(sim, questById('race-rookie-mowdown')!.objectives[0])`,
  solve with budget 900: done. Log the sim seconds it took (`s.now()`).
  Then the same for `race-fizz-cup-final` (accept solved OR a `SimFail` of class 'content'; log which).

## Contract
`export const raceSolver: Solver<'race'>`.

## Done when
- `npx vitest run src/questSim/solvers/race.test.ts` passes (keep each `it` under 60 s wall time; if a race takes more,
  raise that test's timeout to 120_000 and say so in your report).
- `npx tsc --noEmit -p .` shows no error in `src/questSim/solvers/race*.ts`.

## Out of scope
Every other file, in particular `src/raceTrack/*` and `src/quests/*`.

Epic: 1 (solvers and tools, all parallel)
Depends on: none

(Read `docs/roadmaps/gta-quest-sim/_env.md` first: environment, style and solver rules.)

## Goal
The quest bot can solve the set-piece objective kinds: `air-drop`, `survive-derby` and `boss-combine`.

## Read first
- `src/quests/objectivesAction.ts`: `airDropRun`, `surviveDerbyRun`, `bossCombineRun`. Key facts:
  - air-drop: optional plane spawned at `obj.planeAt` (kind 'plane', in `ctx.vehicles`). The runner sets `wasAirborne`
    once `player.airborne` or the player's flyer is above y 4; it completes when, after that, the player is on foot,
    not airborne, `player.y <= 1.2`, inside `obj.radius` of `(dropZone[0], dropZone[2])` (then, with `targetVehicle`,
    when the player is in a vehicle of that kind).
  - survive-derby: a timer runs down while the player is within `radius + 10` of `arena` with health > 0; attackers
    ram the player.
  - boss-combine: three 'porcelain' squad guards (`watch.spawnSquad`); the combine moves from `startZ` toward `endZ` on
    x = 0; done when no guard is alive (cracked via the runner's `onCracked` or in state 'ragdoll') and the player is
    within 5 m of the intake `(0, intakeZ)`, `intakeZ = bossZ + (endZ > bossZ ? 8 : -8)`; the objective blip is at
    `(0, bossZ)`.
- `src/questSim/harness.ts`: `ctx.bail()`, `ctx.walk()` (glide input while airborne; moveY +1 goes along camYaw),
  `ctx.squad`, `ctx.shoot`. NOTE: in the real game a squad unit cracked by a bullet is removed but the quest runner is
  never told (app.ts `hitTest` calls `quests.onCracked` only for pedestrians). If every guard has been shot
  (`ctx.squad` empty) and the player stands at the intake but the step is not done, that is a GAME BUG: throw
  `new SimFail('bug', 'boss-combine: guards cracked by water are never counted (app.ts hitTest does not call quests.onCracked for squad units)')`.
  Do not work around it.
- `src/config.ts`: `BAIL_MIN_ALTITUDE`. `src/terrain.ts`: `heightAt(x, z)`.

## Change
- `src/questSim/solvers/action.ts` (replace the stubs; keep names `airDropSolver`, `surviveDerbySolver`,
  `bossCombineSolver`):
  - air-drop: get into a flyer: the plane nearest `obj.planeAt` if given, else `ctx.spawnVehicle('plane', zx, zz + 30, 0)`
    near the zone (record `ctx.useCheat('instantTravel', 'air-drop: plane put over the zone')`). Teleport it to
    `(zx, zz)` at `y = heightAt(zx, zz) + 60` (`ctx.teleport(zx, zz, { y })`), step once, `ctx.bail()` (false ->
    `SimFail('bot', ...)`), then each step `ctx.walk({ moveX: 0, moveY: 1, camYaw })` with camYaw pointing from the
    player to the zone centre (`Math.atan2(zx - px, zz - pz)`) while farther than 3 m, else `ctx.walk(null)`. When
    landed (`!ctx.player.airborne`) outside the zone, `travelTo` its centre. With `targetVehicle`: then find the nearest
    vehicle of that kind within 80 m (`nearestVehicle`) and `getInto` it. Use `runUntil` for the whole thing.
  - survive-derby: `travelTo` the arena centre, then `runUntil` with a tick that `travelTo`s back when farther than
    `radius` (bumps push the player). With `ctx.cheats.fastClock` pass `dt = 0.1` to `runUntil` and record
    `ctx.useCheat('fastClock', 'derby timer stepped at 0.1 s')`. godMode is applied by the harness; record
    `ctx.useCheat('godMode', 'derby: health kept full')` when `ctx.cheats.godMode`.
  - boss-combine: shoot every unit in `ctx.squad` (copy first; `travelTo` within 8 m of each, `ctx.shoot`), then
    `runUntil` with a tick that teleports to the intake (from the blip: `(0, blip.z + (obj.endZ > blip.z ? 8 : -8))`)
    and, after 10 s at the intake with `ctx.squad` empty, throws the bug SimFail above.
  - A `check()` per solver: 'content' Finding 'spot-off-world' for points outside `world.half`.
- `src/questSim/solvers/action.test.ts` (new), with `objectiveSession` and real objectives:
  - air-drop: the 'air-drop' objective of `questById('ch4-sandpit-drop')`: solved.
  - survive-derby: the 'survive-derby' objective of `questById('ch3-kiln-resin-ice')`: solved.
  - boss-combine: the 'boss-combine' objective of `questById('ch5-even-cut')`: accepts solved OR a `SimFail` with
    `failClass === 'bug'` (log which).

## Contract
`export const airDropSolver: Solver<'air-drop'>`, `surviveDerbySolver: Solver<'survive-derby'>`,
`bossCombineSolver: Solver<'boss-combine'>`.

## Done when
- `npx vitest run src/questSim/solvers/action.test.ts` passes.
- `npx tsc --noEmit -p .` shows no error in `src/questSim/solvers/action*.ts`.

## Out of scope
Every other file.

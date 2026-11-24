Epic: 1 (solvers and tools, all parallel)
Depends on: none

(Read `docs/roadmaps/gta-quest-sim/_env.md` first: environment, style and solver rules.)

## Goal
The quest bot can solve the vehicle objective kinds: `steal-deliver`, `chase-follow` and `convoy-ambush`.

## Read first
- `src/quests/objectivesDrive.ts`: all three runners. Key facts:
  - steal-deliver: the runner spawns `target` (kind `obj.vehicleKind`) near `obj.spawnAt` (nudged out of buildings) and
    pushes it into `deps.vehicles`; done when the player DRIVES that vehicle (`deps.player.vehicle === target`) within
    `obj.radius` of `obj.dropAt`. Too much damage (`maxDamage`) respawns it.
  - chase-follow: an NPC `leader` drives the road path; it waits while the player is more than `maxDist` away; done when
    it reaches the last waypoint with the player within `maxDist`. The leader is in `ctx.vehicles` with
    `driver === 'npc'` and `questOwned === true`; its position is also the objective blip (`objectiveBlips(ctx)`).
  - convoy-ambush: a `hauler` (kind 'ride-on', driver 'npc', questOwned) plus `obj.escorts` HOA units from
    `deps.watch.spawnSquad('hoa', ...)`; done when the player drives the hauler within 12 m of `obj.dropAt` and every
    escort is cracked (the runner's `onCracked`) or in state 'ragdoll'.
- `src/questSim/harness.ts`: `ctx.squad` lists live squad units (escorts); `ctx.shoot(npc)` mirrors the game's bullet
  hit (for a squad unit that is `watch.crack`, as in app.ts). NOTE: in the real game a squad unit cracked by a bullet is
  removed but the quest runner is never told (app.ts `hitTest` calls `quests.onCracked` only for pedestrians). If the
  bot has shot every escort (`ctx.squad` empty) and the step is still not done with the hauler at the drop, that is a
  GAME BUG: throw `new SimFail('bug', 'convoy-ambush: escorts cracked by water are never counted (app.ts hitTest does not call quests.onCracked for squad units)')`.
  Do not work around it.
- `src/questSim/util.ts` (`getInto`, `nearestVehicle`, `travelTo`, `objectiveBlips`).

## Change
- `src/questSim/solvers/drive.ts` (replace the stubs; keep names `stealDeliverSolver`, `chaseFollowSolver`,
  `convoyAmbushSolver`):
  - steal-deliver: find the target with `nearestVehicle(ctx, obj.spawnAt[0], obj.spawnAt[1], obj.vehicleKind, 40)`
    (wait up to 2 s with `waitFor`); none -> `new SimFail('bug', 'steal-deliver: no <kind> spawned near <spawnAt>')`.
    `getInto`, then `travelTo(ctx, obj.dropAt[0], obj.dropAt[1], 'deliver')` (teleports the vehicle while driving;
    instantTravel is recorded), then `runUntil` (tick: if not in the target any more, `getInto` again).
  - chase-follow: `runUntil` with a tick that keeps the player close to the leader: the leader = the vehicle with
    `driver === 'npc' && questOwned` nearest the first objective blip. With `ctx.cheats.instantTravel`, teleport the
    player (on foot is fine: the runner only measures distance) to 6 m behind the leader
    (`leader.x - Math.sin(leader.yaw) * 6`, `leader.z - Math.cos(leader.yaw) * 6`) every tick, and record
    `ctx.useCheat('instantTravel', 'chase: kept 6 m behind the leader')`. Without the cheat, throw
    `new SimFail('bot', 'chase-follow: needs instantTravel until driveTo can follow')`.
  - convoy-ambush: shoot every unit in `ctx.squad` (copy the array first; `travelTo` within 8 m of each, then
    `ctx.shoot(npc)`), then get into the hauler (the vehicle of kind 'ride-on' with `questOwned` nearest the objective
    blip; `ctx.enter(hauler)` takes it from its NPC driver), `travelTo` `obj.dropAt`, then `runUntil` with budget 10;
    if that throws while `ctx.squad` is empty, throw the bug SimFail above instead.
  - A `check()` per solver: a 'content' Finding 'spot-off-world' when spawnAt / dropAt / a waypoint / route point is
    outside `world.half`.
- `src/questSim/solvers/drive.test.ts` (new), with `objectiveSession` and real objectives:
  - steal-deliver: the first 'steal-deliver' objective of `questById('ch1-mowers-keepers')`: solved.
  - chase-follow: objective 0 of `questById('prologue-fresh-kiln')`: solved (budget 600).
  - convoy-ambush: the 'convoy-ambush' objective of `questById('ch2-dew-run')`: the test accepts EITHER solved OR a
    rejection whose error is a `SimFail` with `failClass === 'bug'`; `console.log` which one happened.

## Contract
`export const stealDeliverSolver: Solver<'steal-deliver'>`, `chaseFollowSolver: Solver<'chase-follow'>`,
`convoyAmbushSolver: Solver<'convoy-ambush'>`.

## Done when
- `npx vitest run src/questSim/solvers/drive.test.ts` passes.
- `npx tsc --noEmit -p .` shows no error in `src/questSim/solvers/drive*.ts`.

## Out of scope
Every other file (including `app.ts`, `police.ts`, `harness.ts`).

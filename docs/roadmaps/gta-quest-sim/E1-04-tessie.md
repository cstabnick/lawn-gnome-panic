Epic: 1 (solvers and tools, all parallel)
Depends on: none

(Read `docs/roadmaps/gta-quest-sim/_env.md` first: environment, style and solver rules.)

## Goal
The quest bot can solve the four Tessie objective kinds: `tessie-sightings`, `tessie-buoys`, `tessie-escort`,
`tessie-ride` (the 'choice' at the end of the Tessie quest is solved by another issue).

## Read first
- `src/quests/objectivesTessie.ts`:
  - sightings: for each point in order, a hump rises when the player is IN A BOAT (`player.vehicle.spec.boat`) within
    `obj.radius`; the sighting completes after the hump's rise/hold/sink (a few seconds) with no further condition.
  - buoys: a buoy drops when the player is in a boat within `obj.radius` of an undropped point; an HOA patrol boat
    circles and, if the player is in a boat within `obj.spotRadius` of it after a buoy is down, every buoy is fished out.
    The patrol is a vehicle of kind 'hoa-patrol-boat' in `ctx.vehicles`.
- `src/quests/objectivesTessieEscort.ts`:
  - escort: the egg clutch moves along `obj.route` only while the player is within `TESSIE.escortLeash` (30 m) of it; an
    HOA dredger moves toward the clutch; the player must RAM the dredger `TESSIE.rams` (3) times: a ram counts when the
    player's boat is at speed >= `TESSIE.ramSpeed` (5 m/s) and touching it (`isRam(boat.speed, dist, boat.spec.radius,
    TESSIE.ramSpeed)`), with a stun pause of `TESSIE.stunS` between rams. The blips (`ctx.quests.blips()`, kind
    'objective') carry `quest: 'Egg clutch'` (clutch position) and `quest: 'HOA dredger'` (dredger position).
  - ride: a vehicle of kind 'tessie' (boat, `questOwned`) spawns at `obj.spawnAt`; done when the player rides it within
    `obj.radius` of `obj.to`.
- `src/config.ts`: `TESSIE` (sightings, buoys, escortLeash, rams, ramSpeed, stunS, ...).
- `src/types.ts`: boat vehicle kinds (`'gravy-boat'`, ...; `spec.boat === true`).

## Change
- `src/questSim/solvers/tessie.ts` (replace the stubs; keep names `tessieSightingsSolver`, `tessieBuoysSolver`,
  `tessieEscortSolver`, `tessieRideSolver`):
  - A helper `ensureBoat(ctx, x, z)`: when not already in a boat, `ctx.spawnVehicle('gravy-boat', x, z, 0)` on the
    water near (x, z) and `ctx.enter` it; record `ctx.useCheat('unlockAllItems', 'tessie: a boat spawned on the loch')`.
  - sightings: `ensureBoat` at the first point; `runUntil` with a tick that teleports the boat (instantTravel, recorded)
    to the first point whose sighting is not done yet: keep a local index, advance it when the toast count of
    'Sighting' messages grows (read the objective lines `ctx.quests.getJournal().activeLines` if simpler) or simply sit
    at point k for 8 s, then move to k + 1.
  - buoys: `ensureBoat`; for each point: teleport there, step 1 s. Before each teleport, if the patrol boat is within
    `obj.spotRadius + 10` of the target point, wait (step) until it is not (the patrol moves). `runUntil` around it.
  - escort: `ensureBoat` near the clutch. Ramming is the test, so do it for real: each tick, read the dredger blip;
    while it exists, place the boat 12 m from the dredger on the side away from it (teleport only when farther than
    40 m; record instantTravel), face it, and `ctx.drive({ throttle: 1, steer, lift: 0 })` straight at it (steer from
    `-2 * angleDiff(atan2(dx - bx, dz - bz), boat.yaw)` clamped to [-1, 1]; `angleDiff` is in `src/collide.ts`). After
    the dredger blip is gone, keep within 15 m of the clutch blip (teleport behind it) until done.
  - ride: the 'tessie' vehicle nearest `obj.spawnAt` (wait up to 2 s); `getInto`; `travelTo(obj.to)`; `runUntil`.
  - A `check()` per solver: 'content' Finding 'spot-off-world' for points outside `world.half`.
- `src/questSim/solvers/tessie.test.ts` (new), with `objectiveSession` and the four objectives of `questById('sq-tessie')`
  (each in its own session): each solved. The escort test must show the dredger was rammed (the solver ran
  `ctx.drive` with throttle 1): assert `s.record.toasts.some(t => t.startsWith('Rammed the dredger'))`.

## Contract
`export const tessieSightingsSolver: Solver<'tessie-sightings'>`, `tessieBuoysSolver: Solver<'tessie-buoys'>`,
`tessieEscortSolver: Solver<'tessie-escort'>`, `tessieRideSolver: Solver<'tessie-ride'>`.

## Done when
- `npx vitest run src/questSim/solvers/tessie.test.ts` passes.
- `npx tsc --noEmit -p .` shows no error in `src/questSim/solvers/tessie*.ts`.

## Out of scope
Every other file.

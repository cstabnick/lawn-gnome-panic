Epic: 1 (solvers and tools, all parallel)
Depends on: none (uses the `driveTo` / `flyTo` signatures from `src/questSim/solvers/driver.ts`, which another worker is
filling in at the same time; until then they throw `SimFail('bot', ...)`. Code against the signatures only.)

(Read `docs/roadmaps/gta-quest-sim/_env.md` first: environment, style and solver rules.)

## Goal
The quest bot can solve `checkpoints` objectives (courier rounds, the Skyway jobs, the Thorne Tower fly-by): untimed
runs by hopping gate to gate, timed runs by really driving / flying them after the start gate.

## Read first
- `src/quests/objectivesCity.ts` `checkpointsRun`: gates in order; `gateHit(g, x, y, z, groundY)` (a gate with `height`
  counts only within `radius` of `groundY + height`, and y is the vehicle's y when driving); the clock (`seconds`) starts
  at gate 0 and running out puts the run back to gate 0; `vehicle` spawns the job's ride (kind `vehicle.kind` at
  `vehicle.at`, pushed into `ctx.vehicles`); with `requireVehicle` gates count only while driving that kind;
  `maxDamage` restarts the run when the ride is too damaged. Tracker lines: `[text, 'Next: {{label}} (k/n) · 12s']`
  (k = next gate index + 1).
- `src/questSim/solvers/driver.ts`: `driveTo(ctx, x, z, { arrive, why, deckY?, until? })`,
  `flyTo(ctx, x, y, z, { arrive, why, until? })`.
- `src/terrain.ts` `heightAt(x, z)`. `src/config.ts` `VEHICLES[kind].maxSpeed`.
- Uses of the kind: `src/quests/cityQuests.ts` (`city-glow-band-express` 90 s on a push-bike, `city-penthouse-exclusive`
  air gates in a 'sycamore-copter', `city-skyway-robbery` 55 s on a 'zero-turn' along the Skyway deck) and
  `src/quests/newcomerQuests.ts` (`nc-skyway`, `nc-take-off`).

## Change
- `src/questSim/solvers/checkpoints.ts` (replace the stub; keep `checkpointsSolver: Solver<'checkpoints'>`):
  - `nextGate(ctx)`: parse `(k/n)` from `ctx.quests.getJournal().activeLines` -> k - 1 (or -1 when not shown).
  - The ride: kind `obj.requireVehicle ?? obj.vehicle?.kind`. If `obj.vehicle`, the nearest vehicle of that kind to
    `obj.vehicle.at` (wait up to 2 s); else if `requireVehicle`, `ctx.spawnVehicle(kind, ...)` next to the player and
    record `ctx.useCheat('unlockAllItems', 'checkpoints: <kind> spawned')`. `getInto` it. Without either, the gates
    can be done on foot.
  - Gate position: `y = g.height !== undefined ? heightAt(x, z) + g.height : undefined`.
  - Untimed (`!obj.seconds`): for each gate from `nextGate`, `ctx.teleport(x, z, { y })` (record instantTravel:
    'checkpoints: hop to gate <label>'), step 0.2 s, repeat until done (`runUntil`).
  - Timed: teleport to gate 0 (allowed: the clock starts there). After the clock starts, NO teleports: for each next
    gate use `flyTo` (flyer) or `driveTo` (ground / boat, `deckY: y`) with `until: () => nextGate(ctx) !== i ||
    stepDone(...)` and `arrive: g.radius * 0.6`. If `nextGate` falls back to 0 (out of time, or too much damage),
    count an attempt; after 3 attempts throw: `SimFail('content', ...)` if the straight-line length of the route from
    gate 0 divided by `VEHICLES[kind].maxSpeed` is more than `obj.seconds` (impossible even in a straight line), else
    `SimFail('bot', 'checkpoints <text>: 3 timed attempts failed (best gate k/n)')`. A `SimFail('bot')` from
    driveTo/flyTo passes through unchanged.
  - `check(obj, world, questId, step)`: 'content' Findings: 'spot-off-world' (gate outside `world.half`),
    'gate-time-impossible' (timed run whose straight-line length / maxSpeed of the ride kind > seconds).
- `src/questSim/solvers/checkpoints.test.ts` (new), with `objectiveSession` and real objectives:
  - untimed: objective 0 of `questById('nc-skyway')`: solved.
  - untimed air: the 'checkpoints' objective of `questById('city-penthouse-exclusive')`: solved.
  - timed: the 'checkpoints' objective of `questById('city-glow-band-express')`: accept solved OR a `SimFail` (log the
    class and message: until driver.ts is filled in it is 'bot').
  - `check()` on every checkpoints objective in `QUESTS` returns an array (log the findings).

## Contract
`export const checkpointsSolver: Solver<'checkpoints'>`.

## Done when
- `npx vitest run src/questSim/solvers/checkpoints.test.ts` passes.
- `npx tsc --noEmit -p .` shows no error in `src/questSim/solvers/checkpoints*.ts`.

## Out of scope
Every other file, in particular `driver.ts` (another worker owns it).

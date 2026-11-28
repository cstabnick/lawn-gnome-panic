Epic: E02-2 Wiring
Depends on: epic 1 (npcChassis.ts and civilianMods.ts implemented)
Items: L93 (NPC driving on the casual handling model, robust on any preset), L91 (civilian cars with a mod or two)
Model: Sonnet

(Environment: paste `../epic-1/_environment.md`.)

## Goal
Live traffic near the player, the follow-quest leader and the Speedway rivals drive on the casual sim chassis through `stepNpcCar`; about one civilian car in seven shows 1-2 Pay 'n' Glaze mods.

## Read first
- `npcChassis.ts`: `stepNpcCar(v, c, dt, world)` (sim when the car has a chassis, arcade otherwise), `assignNpcChassis(vehicles, focusX, focusZ)` (once per frame; only cars stepped through `stepNpcCar` recently get a chassis), `NPC_CHASSIS`, `NPC_ASSIST`.
- `civilianMods.ts`: `rollCivilianMods(id, kind): Partial<Loadout> | null`.
- `traffic.ts`: `update` (where the frame starts, `focusX`/`focusZ`), `finish` (~446: `stepVehicle(v, c, dt, world); syncVehicleMesh(v, dt); ...rider anim`), `materialize` (~536: creates the live vehicle the first time for a ghost id `g.id`), the steering block (~380-400: pure pursuit `steer = clamp(-diff * 2, -1, 1)`, `LOOK_MIN`/`LOOK_MAX`), wedge recovery.
- `vehicles.ts` `setVehicleLook(v, look)` (~876) and `v.look` (the car's Loadout; undefined for undressed kinds).
- `quests/objectivesDrive.ts` `steerToward` (~73: the follow-quest leader's step) and `raceTrack/raceAi.ts` (~275: the rivals' `stepVehicle`).
- Tests: `traffic.test.ts`, `trafficSim.test.ts`, `traffic.levels.test.ts`, `raceTrack/*.test.ts`, `questSim` race solver tests.

## Change
- `traffic.ts`:
  - At the start of `update` (after the focus point is known), call `assignNpcChassis(vehicles, focusX, focusZ)`.
  - `finish`: replace `stepVehicle(v, c, dt, world)` with `stepNpcCar(v, c, dt, world)`. Keep the rest.
  - With a sim chassis the car no longer turns instantly: if the pure-pursuit gains make cars weave or run wide on the sim (watch the tests and the max lateral error), tune only the steering block constants for chassis cars (e.g. a longer look-ahead `LOOK_MIN`/`LOOK_MAX` when `npcChassisOf(v)` is set, a lower corner speed); keep arcade cars exactly as today. Keep the existing yield / stop / pass / wedge logic.
  - `materialize`: when a live vehicle is created the first time for a ghost (the `if (!v)` branch), `const mods = rollCivilianMods(g.id, g.kind); if (mods && v.look) setVehicleLook(v, { ...v.look, ...mods });`. Reused vehicles keep their look.
- `quests/objectivesDrive.ts` `steerToward`: `stepVehicle(...)` -> `stepNpcCar(...)` (import from `../npcChassis`). Nothing else in that file (another epic owns the follow-quest logic).
- `raceTrack/raceAi.ts`: `stepVehicle(...)` -> `stepNpcCar(...)` for the rivals. Rivals only get a chassis when `assignNpcChassis` sees them (the traffic update passes the shared `vehicles` list; check the rivals are in it with `driver === 'npc'`). Then run the race tests and the quest sim race solver; if rivals on the sim can no longer finish or the race balance tests fail and a small steering tweak in raceAi does not fix it, revert raceAi to `stepVehicle` and report it (rivals stay arcade, deferred).
- Tests (add to `traffic.test.ts`): a live traffic car within 60 m of the focus has `npcChassisOf(v)` set after an update; one beyond 80 m does not; a car following a lane through a 90-degree corner stays within the road (`ROAD_WIDTH`) with the player preset set to `arcade`, `casual`, `simcade` and `drift` (via `setTune`), restoring the tune after; `rollCivilianMods` results applied on materialize (a car whose ghost id rolls mods has `v.look` fields equal to the roll).

## Contract
NPC steering never reads the player's preset (`getTune`, `simActive`). Online mirrors send pose only (`vehicleSync`, `remotes.ts`): unaffected. Do not change `trafficSim.ts`, `trafficImpostors.ts` or ghost maths.

## Done when
- `npx vitest run src/traffic.test.ts src/trafficSim.test.ts src/traffic.levels.test.ts src/trafficImpostors.test.ts src/npcChassis.test.ts src/civilianMods.test.ts src/raceTrack src/questSim` pass; `npx tsc --noEmit -p .` clean.
- Report: any constant you retuned, whether rivals stayed on the sim, and a timing of `traffic.update` with 8 chassis cars (1000 frames) vs before.

## Out of scope
`app.ts`, `vehicles.ts`, `simdrive.ts`, `npcChassis.ts` (report needed changes instead), `police.ts`, `boatTraffic.ts`.

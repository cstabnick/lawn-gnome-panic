Epic: E25-3 (jobs III, runtimes)
Depends on: E25-2 (all modules below are implemented)

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Glue and game-feel issue. Two other workers write the garbage and
Gnomazon runtimes at the same time (other files). You may run ONE dev server on port **5362** only
(`cd games/gnome-theft-auto && npx vite --port 5362 --strictPort`, background); stop it after.

## Goal
`workplaces/firefighter/runtime.ts`: the fire brigade job: answer the bell at Fire Station No. 1, drive the
Watering-Can Pumper (siren on) to a fire call, man the hose (aim, spray, refill at hydrants), ladder a rescue, paid per
call through `finishShift`, achievements, then the next call while on duty.

## Read first
- `games/gnome-theft-auto/src/workplaces/mechanic/runtime.ts`: a finished E24 runtime (spots, a spawned vehicle,
  `finishShift`, achievements, `deps.showroom`, dev hook, an NPC gnome with `makeGnome`/`gnomeState`).
- `games/gnome-theft-auto/src/workplaces/types.ts` (`WorkDeps` incl. `fx`, `seatPlayer`; `waypoint`),
  `workplaces/shift.ts` (`finishShift`, `workLevel`), `../shiftHud.ts`, `../sounds3.ts`.
- `games/gnome-theft-auto/src/workplaces/firefighter/types.ts` (FireCall, CallOutcome, FIRE_JOB, PUMPER,
  FIRE_START_EVENT), `calls.ts` (`makeCall`, `scoreCall`, `FOREST_PLACES`), `hose.ts` (`hoseLanding`, `hoseArc`,
  `drainTank`, `refillTank`, `stepLadder`, HOSE, LADDER), `hoseView.ts`, `hoseUi.ts`, `station.ts` (`buildStation`,
  `updateStation`, `cityHydrants`).
- `games/gnome-theft-auto/src/fire/sim.ts` + `fire/view.ts` (the shared fire system; header comments show use).
- `games/gnome-theft-auto/src/sound/watchVehicles.ts` `SIREN_VEHICLES` (add the engine's id while racing to a call).
- `games/gnome-theft-auto/src/homes/data.ts` `homePlaces()`, `jobs/places.ts` `LAND_PLACES` (call places),
  `lockup/safeSpot.ts` (`findSafeSpot`, `boxesBlocked`) and `workplaces/mechanic/lot.ts` for the probe pattern.
- `games/gnome-theft-auto/src/jobs/workDefs.ts`: `WORK_JOBS.firefighter`, `WORK_ACHIEVEMENTS` (hoseGnome, ladderGnome,
  bbqSeason), `RESCUE_PAY`.

## Change
- `games/gnome-theft-auto/src/workplaces/firefighter/runtime.ts` (`installFirefighter(deps)`; keep the signature):
  - Once: sounds, shift HUD, a `createFireField()`, `createFireView(deps.scene, deps.fx)`, `createHoseView(deps.scene)`;
    on first update `buildStation` and an `addInteractSpot` at `station.bell`: 'Answer the bell (firefighter)' / 'Go
    off duty'; listen for `FIRE_START_EVENT`. `updateStation(dt)` every frame. Every frame `stepFires(field, dt,
    fuelPoints)` and `fireView.update(dt, field, player.x, player.z)` (fires always simulate; they are few).
  - On duty: spawn the Pumper (`createVehicle(..., 'fire-engine', ...station.engine)`), push, `seatPlayer`, play
    'fire-bell', and after `FIRE_JOB.nextCallS` a call.
  - A call: places = `homePlaces()` + `LAND_PLACES` (area city/outskirts as given; others as 'outskirts') +
    `FOREST_PLACES`, only those 80..900 m from the station; `makeCall(level, seed, places, id)`. Find clear ground for
    the centre near the place with `findSafeSpot` (radius 5, maxDist 40); facing = toward the nearest road or random.
    Build its props (`buildPrefab`, rotate offsets by the facing), `ignite` each fire (group `call-<id>`, kind =
    call.kind) and make `fuelPoint`s for `spread`. Rescue: a gnome (`makeGnome`, a random town look) or the
    `asphalt-cat` prefab standing on the perch (dx, y, dz). Hydrants = `cityHydrants()` + station hydrants; if none
    within 60 m of the call, place a `kerb-hydrant` prefab on clear ground 12-25 m from the centre and add it. Toast
    "Call: <title>. <caller>: \"<line>\"". `SIREN_VEHICLES.add(engine.id)` until the engine is within 40 m.
  - Hose: in the engine, |speed| < `FIRE_JOB.stopSpeed`, within `FIRE_JOB.hoseRange` of the centre: action 'Man the
    hose' -> `openHoseUi(deps.ui)`, `deps.showroom({ ..., fixedYaw })` behind the engine looking at the fire, aim
    starts at the nearest burning fire (yaw toward it; pitch by trying values until `hoseLanding` lands nearest).
    Every frame: aim from `read()` (yawRate/pitchRate, pitch clamped), nozzle world position from the engine's `nozzle`
    pivot (`getObjectByName` each frame; fallback engine position + 2 m up) and rotate the pivot to the aim for looks;
    while spray and tank > 0: `drainTank(tank, dt, FIRE_JOB.litresPerS)`, land = `hoseLanding(nozzle, aim,
    heightAt(...))` (two iterations on the ground height), `douse(field, land.x, land.z, HOSE.sprayRadius, litres)`,
    steam when heat was removed (throttled), `hoseArc` -> `hoseView.set`, 'hose-spray' every 0.9 s, add litres to the
    call's water. Ladder (call.rescue not done): `setLadder(ext, band)`; `stepLadder` with the ladder button; animate
    the `ladder` pivot (rotation.x = -0.9 * min(1, ext * 2), scale.z = 1 + 1.4 * ext); 'rescue' -> the gnome/cat
    moves down to the ground beside the engine over 1.5 s, 'rescue-cheer' or 'cat-meow', toast the thanks; 'bonk' ->
    'ladder-clunk'. Tank: `level` = cap = `(FIRE_JOB.tankS + FIRE_JOB.tankPerLevelS * (level - 1)) *
    FIRE_JOB.litresPerS`; refill when the engine is stopped within `FIRE_JOB.hydrantRadius` of a hydrant (in the cab
    or at the hose), shown on the HUD / hose UI. Leave: `leave` -> close, `deps.showroom(null)`, `hoseView.set(null)`.
  - Call end: all fires of the group out or burnt AND the rescue resolved (done, or failed when the fires are out and
    the player drove > 150 m away, or the call timed out at `FIRE_JOB.callTimeoutS`). burnt = burned fuel / starting
    fuel. `scoreCall` -> `finishShift(deps, 'firefighter', { units: [{ stars }], extra: { fires: put out, calls: 1,
    rescues }, bonus: rescued ? RESCUE_PAY : 0, bonusNote: 'Rescue', quote, onClose: schedule the next call })`.
    Achievements: `increment(hoseGnome, put out)`, `increment(ladderGnome)` per rescue, `bbqSeason`: a localStorage
    set `gta-fire-kinds-v1` of kinds put out (like chef's menu set) -> `increment(bbqSeason, newKinds)`. Props stay
    (burnt shed: swap `garden-shed` for `fire-garden-shed-burnt` when burnt > 0.6) and are removed when the player is
    200 m away or at the next call.
  - Off duty: the bell spot again, the engine wrecked, or out of it > `FIRE_JOB.abandonDist` for `abandonS`: clear the
    call (no pay unless it was finished), remove the engine when the player is away from it.
  - HUD, waypoint (the call centre, labelled with the title; then nothing between calls), blips (station always:
    '🚒 Fire Station No. 1 (firefighter)'; the call), `isOpen()` = hose UI open.
  - Dev hook `?firecall`: 2 s after load teleport to the station, go on duty, and make the first call at the place
    nearest the station; `?firecall=hose` also puts the engine 18 m from the call facing it and opens the hose.
- Check in the browser (5362): smoke `bash tools/smoke.sh "http://localhost:5362/?offline&no-intro&firecall" gta-gnomlet`;
  screenshots with `node tools/gta-shots.mjs "http://localhost:5362/?offline&no-intro&firecall=hose" <dir> hose:0,0,0 --wait 12`
  (check how gta-shots treats a held camera) and at 390x844. Look at them: the fire, the stream and the controls must read.

## Contract
`installFirefighter(deps: WorkDeps): WorkJobRuntime` with `waypoint`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your file.
- `cd games/gnome-theft-auto && npx vitest run src/workplaces src/fire src/jobs` passes.
- Smoke OK and screenshots looked at; server stopped.

## Out of scope
Every other file (describe blockers in your report; a one-line fix in a firefighter/ file is fine).

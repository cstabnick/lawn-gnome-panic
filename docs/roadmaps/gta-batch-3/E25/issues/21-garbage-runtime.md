Epic: E25-3 (jobs III, runtimes)
Depends on: E25-2 (all modules below are implemented)

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Glue and game-feel issue. Two other workers write the firefighter
and Gnomazon runtimes at the same time (other files). You may run ONE dev server on port **5361** only
(`cd games/gnome-theft-auto && npx vite --port 5361 --strictPort`, background); stop it after.

## Goal
`workplaces/garbage/runtime.ts`: the whole bin-round job: start at the depot, the Bin Lorry handed over, drive to each
kerbside bin, lift it with the minigame, tip the load at the depot, paid through `finishShift`, achievements unlocked.

## Read first
- `games/gnome-theft-auto/src/workplaces/mechanic/runtime.ts` and `chef/runtime.ts`: two finished E24 runtimes (spots,
  vehicles pushed to `deps.vehicles` and removed, `finishShift`, achievements, `deps.showroom`, dev hooks).
- `games/gnome-theft-auto/src/workplaces/types.ts` (`WorkDeps`: `fx`, `seatPlayer`, `showroom`, `teleport`, `getOut`;
  `WorkJobRuntime.waypoint`), `workplaces/shift.ts` (`finishShift(deps, job, { units, extra, bonus, bonusNote, quote,
  onClose })`, `workLevel`).
- `games/gnome-theft-auto/src/workplaces/garbage/types.ts` (GARBAGE, BinStop, LiftResult, LIFT, ARM,
  GARBAGE_START_EVENT), `round.ts` (`makeRound`), `liftUi.ts` (`openLiftUi`), `bins.ts` (`createBinView`), `depot.ts`
  (`buildDepot`, `updateDepot`), `../shiftHud.ts` (`createShiftHud`), `../sounds3.ts` (`registerJobs3Sounds`, ids).
- `games/gnome-theft-auto/src/jobs/workDefs.ts`: `WORK_JOBS.garbage`, `WORK_ACHIEVEMENTS` (binDay, notADrop,
  kerbAppeal), `SPILL_FINE`. `games/gnome-theft-auto/src/camera.ts` `ShowroomTarget` (`fixedYaw`, `distance`; read
  how fixedYaw places the camera).

## Change
- `games/gnome-theft-auto/src/workplaces/garbage/runtime.ts` (`installGarbage(deps)`; keep the signature):
  - Once: `registerJobs3Sounds()`, a `createShiftHud(deps.ui)`, `createBinView(deps.scene)`; on first `update`
    `buildDepot(deps.scene, deps.world)` and an `addInteractSpot` (from '../../interactables') at `depot.start`:
    prompt 'Start a bin round (bin crew)' (or 'End the round' while one runs). Listen for `GARBAGE_START_EVENT` too.
    Call `updateDepot(dt)` every frame.
  - Start: `deps.blocked()` check (toast the reason); spawn `createVehicle(deps.scene, 'bin-lorry', ...depot.lorry)`
    (from '../../vehicles'), push to `deps.vehicles`, `deps.seatPlayer(lorry)`. `makeRound(deps.world.roads, { level,
    seed: Date.now() & 0xffff, from: depot.lorry, clear })` where `clear` uses `boxesBlocked(deps.world.boxes,
    deps.world.half)` (lockup/safeSpot) and `waterAt` (terrain). `binView.show(round)`. Toast Mags' line (write 6
    dry ones: "Every bin. Lids down. If it spills, the HOA bills.").
  - Each frame during a round: the target bin = the first stop with state 'full'. When the player drives the lorry,
    |speed| < `GARBAGE.stopSpeed` and ANY full bin is within `GARBAGE.stopRadius` of the lorry: action 'Lift bin'.
    On the action: `openLiftUi(deps.ui, { heavy, onEvent, onDone, onCancel })` and `deps.showroom({ x, y, z, radius: 3,
    distance: 7, fixedYaw })` looking across the lorry at the bin from the street side; every frame while open
    `binView.pose(stop, lift.state(), lorry)`. Events -> sounds: grabbed 'bin-arm-hydraulic', grab-miss 'bin-clank',
    tipped 'bin-tip', spill 'bin-spill' + `binView.spill(stop)` + toast "HOA litter citation (-5 🌰)", set-down
    'bin-set-down'. onDone: stop.state = spilled ? 'spilled' : 'done', `binView.setDown(stop, r.neat)`, keep the
    LiftResult, `deps.showroom(null)`, `binView.pose(null, null, lorry)`. onCancel: same without changing the stop.
  - When no full bins are left (or the player chooses, via the depot spot), the waypoint goes to `depot.tip`; in the
    lorry, stopped within `GARBAGE.tipRadius`: action 'Tip the load' -> play 'bin-tip', end the round.
  - End: `finishShift(deps, 'garbage', { units: results.map((r) => ({ stars: r.stars })), extra: { bins, neatBins,
    spills }, bonus: -SPILL_FINE * spills, bonusNote: 'HOA litter citation', quote: 'Mags: "..."' })` (bins = results
    length, neatBins = results with neat >= LIFT.neatBar and no spill). Achievements: `deps.increment(binDay, bins)`,
    `deps.increment(kerbAppeal, neatBins)` (when > 0), `deps.unlock(notADrop)` when bins >= 8, spills 0 and every stop
    is done. Then `binView.clear()`; the lorry stays until the player is out of it and 30 m away, then is removed
    (`removeVehicle` and spliced from `deps.vehicles`).
  - Abandon: lorry exploded / gone, or the player out of it and farther than `GARBAGE.abandonDist` for
    `GARBAGE.abandonS` s: end the round with what was done (toast "Mags took the lorry back.").
  - HUD (`shiftHud.set` every frame during a round, null otherwise): icon 🗑️, title "Bin round: <done> of <N> bins",
    lines: next bin street + distance (or "Back to the depot to tip"), "Spills: k", meter { label: 'Round', frac:
    done/N }, action label as above, color `WORK_JOBS.garbage.color`. `shiftHud.onAction` runs the current action.
  - `waypoint()`: the target bin (label its street) or the depot tip; null with no round. `blips()`: the depot always
    ('🗑️ Bin Depot (bin crew)', kind 'shop' like chef), the full bins during a round. `isOpen()`: the lift UI is open.
  - Dev hook `?binround`: 2 s after load `deps.teleport(depot.start...)` then start. `?binround=lift` also drives the
    lorry next to the first bin (set its x/z/yaw beside it) and opens the lift UI, for screenshots.
- Check in the browser: dev server on 5361, `bash tools/smoke.sh "http://localhost:5361/?offline&no-intro&binround" gta-gnomlet`
  and `node tools/gta-shots.mjs "http://localhost:5361/?offline&no-intro&binround=lift" C:/Users/cpsai/AppData/Local/Temp/e25-bins lift:0,0,0 --wait 10`
  (the shot spot is ignored when the camera is held; check how gta-shots positions the camera and adjust), plus a
  390x844 shot. Look at them: the lift UI, the arm and bin must read.

## Contract
`installGarbage(deps: WorkDeps): WorkJobRuntime` with `waypoint`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your file.
- `cd games/gnome-theft-auto && npx vitest run src/workplaces src/jobs` passes.
- Smoke OK and screenshots looked at; server stopped.

## Out of scope
Every other file (if another module has a bug that blocks you, describe it in your report rather than editing it,
unless it is a one-line fix in a garbage/ file).

Epic: E25-3 (jobs III, runtimes)
Depends on: E25-2 (all modules below are implemented)

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Two other workers write the garbage and firefighter runtimes at the
same time (other files). You may run ONE dev server on port **5363** only
(`cd games/gnome-theft-auto && npx vite --port 5363 --strictPort`, background); stop it after.

## Goal
`workplaces/gnomazon/runtime.ts`: clock in at the packing station on the FC-1 floor, pack against the quota, paid
through `finishShift`, sounds, Kippy's lines, achievements.

## Read first
- `games/gnome-theft-auto/src/workplaces/chef/runtime.ts`: the model to follow almost line for line (event-started
  full-screen session, `finishShift`, achievements, a localStorage set, dev hook, blip).
- `games/gnome-theft-auto/src/workplaces/gnomazon/types.ts` (`GNOMAZON`, `GNOMAZON_FLOOR_ID`, `GNOMAZON_START_EVENT`,
  `PackOpts`, `ShiftResult`), `orders.ts` (`quotaFor`, `KIPPY_LINES`), `packUi.ts` (`openPackStation`), `warehouse.ts`
  (`buildWarehouseOutside`, `warehouseDoor`), `../sounds3.ts`, `../shift.ts`.
- `games/gnome-theft-auto/src/jobs/workDefs.ts`: `WORK_JOBS.gnomazon`, `WORK_ACHIEVEMENTS` (fulfilled, beatTheBot,
  timeOffTask), `QUOTA_BONUS`. `games/gnome-theft-auto/src/interiors/runtime.ts` `enterInterior(id)`.

## Change
- `games/gnome-theft-auto/src/workplaces/gnomazon/runtime.ts` (`installGnomazon(deps)`; keep the signature):
  - `registerJobs3Sounds()`; on first update `buildWarehouseOutside(deps.scene, deps.world)`.
  - On `GNOMAZON_START_EVENT`: blocked check; `openPackStation(deps.ui, { level, title: workTitle('gnomazon', level),
    seed, quota: quotaFor(level), shiftS: GNOMAZON.shiftS, kippy: (l) => { deps.hud.toast('Kippy: "' + l + '"', 3500);
    play2d('kippy-chime'); }, onParcel: (s) => play2d('tape-screech'), then 'scanner-beep' (s.stars >= 3) or
    'kippy-error'; 'box-thud', onEnd })`.
  - onEnd(r): n = parcels; units = parcels' stars; quota met = n >= r.quota (play 'quota-fanfare'); `finishShift(deps,
    'gnomazon', { units, extra: { parcels: n, rightSized }, bonus: met ? QUOTA_BONUS : 0, bonusNote: 'Quota bonus',
    quote: 'Kippy: "<an end line>"' })`. Achievements: `increment(fulfilled, n)` when n > 0; `unlock(beatTheBot)` when
    met, n > 0 and every parcel rightBox; `unlock(timeOffTask)` when r.idle.
  - `update(dt)` drives the session; `isOpen()`; `blips()`: the door ('📦 Gnomazon FC-1 (associate)', kind 'shop').
  - Dev hook `?gnomazonshift`: 1.5 s after load `enterInterior(GNOMAZON_FLOOR_ID)`, 2 s later start a shift.
- Check in the browser (5363): `bash tools/smoke.sh "http://localhost:5363/?offline&no-intro&gnomazonshift" gta-gnomlet`
  and screenshots (desktop and 390x844) of the packing screen with `tools/gta-shots.mjs`; look at them.

## Contract
`installGnomazon(deps: WorkDeps): WorkJobRuntime`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your file.
- `cd games/gnome-theft-auto && npx vitest run src/workplaces src/jobs` passes.
- Smoke OK and screenshots looked at; server stopped.

## Out of scope
Every other file (describe blockers in your report).

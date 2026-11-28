Epic: FX12 (Snowcap snow, Snowdrop Slope, Pail Pond) · Issue A: the Wool Run from the summit, the Nursery, the run-out brake
Depends on: none (the lead already added `NURSERY_RUN` and the `'nursery'` RunId)
Model: Sonnet (tuning)
Port: 5521

(Paste of `_env.md` goes here when launched.)

## Goal
The Wool Run starts at the top of Snowdrop Slope and takes 35-45 s for a clean, sensible run (decision D26 (a)): an
upper start near the summit, 10-12 slalom gates with a traverse/chicane across the slope, `BLACK_DIAMOND_S` retuned.
The old short course is "the Nursery" (already declared as `NURSERY_RUN` in `src/winter/types.ts`, same gates as the
old Wool Run) with its own best times; old saves migrate (never wipe). The Bootlace Tow reaches the new start. After any
finish the rider is braked to a stop in a few seconds instead of coasting onto the band road (G4#9). The Tea-Tray Run
stays short (sledding should be short).

## Read first
- `src/winter/types.ts`: `TOW`, `WOOL_RUN`, `NURSERY_RUN`, `TEA_TRAY_RUN`, `RUNS`, `BLACK_DIAMOND_S`, `SKI`, `WinterSave`.
- `src/winter/course.ts` (`stepRun`: gates are crossed heading south, in order) and `src/winter/runtime.ts`
  (`installWinter`, `newRide` makes one `RunState` per run of the ride's kind, `stepRider`, `finishRun`, `letGoTow`,
  `startRun` in `winterApiImpl` ~line 505, `refreshHud`).
- `src/winter/save.ts` (`parseWinterSave`, `createWinterStore`, `recordRun`) and `src/winter/winterApp.ts` (the Snowdrop
  Slope cards).
- Tests: `src/winter/runtime.test.ts` (`straightRun` rides the real terrain with no input), `course.test.ts`,
  `save.test.ts`, `tow.test.ts`, `places.test.ts`, `winterApp.test.ts`.

## Change
- `src/winter/types.ts` (you own `TOW`, `WOOL_RUN`, `TEA_TRAY_RUN`, `NURSERY_RUN`, `BLACK_DIAMOND_S`, `SKI`/`SLED`,
  `WinterSave`):
  - `TOW.top`: move up the slope so the tow ends near the summit (about z -1325; the peak is near (-350, -1340), the
    `ski-hill` site now spans x -460..-240, z -1350..-1000 — `places.test.ts` keeps every place inside it). Keep
    `TOW.base` where it is (quests and the lodge use it). Raise `TOW.speed` if the ride gets long (aim ≤ 35 s up).
    Measure the heights with `heightAt` (src/terrain.ts) under `setTerrainOptions({ amplitude: 1, testHill: false,
    landforms: true })` in a scratch test: the top must be on snow and not on a rock face.
  - `WOOL_RUN`: start line near the top (west of the tow top, e.g. start.z about -1320), 10-12 gates that swing wide
    across the slope (a traverse or chicane: alternate x by 40-80 m, not the old ±12 m), finish at the foot (keep
    `finish.z` about -1045). The gates must lie inside the site and on snow. `parS` to match.
  - `BLACK_DIAMOND_S`: a clean run by a good line, around 35-45 s (decide from your measured autopilot times; tell the
    lead the number). Update the achievement description in `packages/achievements/src/catalog.ts`
    (`gta-black-diamond`: "A clean Wool Run (every gate) in 18 seconds or less.") to the new number — that one line
    only — and run `npm test -w packages/achievements`.
  - Do not change `NURSERY_RUN`'s course (it is the old one) unless a test proves it unreachable.
- `src/winter/runtime.ts`:
  - A ski ride now has two runs (`wool-run` and `nursery`). While the Wool Run is `running`, the Nursery must not start
    (its start line is crossed mid-run); a ride that starts at the Nursery start only runs the Nursery. One finish per
    descent, never two callouts.
  - The run-out (G4#9): after `finishRun`, brake the ride for 3 s (add the `brakeMu` of a full snowplough, e.g. force
    `input.brake = 1` or a stronger friction) so a rider stops well before the band road (z ~-958) from either finish.
    Add a small toast or callout only if it reads naturally ("Run-out! Plough to a stop." is fine; the HUD already shows
    the time).
  - `letGoTow` top toast: say where the Wool Run starts now.
  - `startRun('nursery')` must work like the others (teleport to its start line, rent free).
- `src/winter/course.ts`: only if you need a helper (e.g. a pure `autopilotSteer(run, state, slide)` for the test; it may
  also live in the test file).
- `src/winter/save.ts`: migration: an old save (no marker) moves `best['wool-run']` to `best['nursery']` (the old course
  was the Nursery's). Keep `runs['wool-run']` as it is (quest probes count it). Mark migrated saves (e.g. `v: 2` with
  `WinterSave.v: 1 | 2`, or a `nursery: true` flag) so it never runs twice. `'nursery'` is a valid RunId in
  `parseWinterSave`.
- `src/winter/winterApp.ts`: a third card, "the Nursery" (best, runs, "Ski it"), after the Wool Run card; the Wool Run
  card's Black Diamond line uses the new number.
- `src/app.ts` (hot file: one-line additive edit only): `?winter=nursery` is accepted next to `wool-run|tea-tray-run`
  (~line 2956).
- Tests: update `course.test.ts` (the old 6-gate expectations move to the Nursery; add a Wool Run case), `tow.test.ts`,
  `save.test.ts` (migration: an old `{ v: 1, best: { 'wool-run': 17.2 } }` loads as `best.nursery === 17.2`, `best['wool-run']`
  undefined, and loading the migrated save again changes nothing), `places.test.ts`, `winterApp.test.ts`, and in
  `runtime.test.ts`:
  - a scripted Wool Run: an autopilot that steers the skis toward the next gate (`steer` from the heading error, light
    `brake` when faster than a target speed) finishes clean in **35-45 s** (assert the range). Log the time.
  - the run-out: after the finish the rider's speed falls below 1 m/s within 4 s and it never reaches z > -965.
  - the Nursery and the Tea-Tray Run still finish (`straightRun`).

## Contract
- `RunId = 'wool-run' | 'tea-tray-run' | 'nursery'`; `RUNS` keeps all three; `WOOL_RUN.gates`, `NURSERY_RUN.gates`,
  `TOW.base`, `TOW.top` stay exported with the same shapes. Another worker (hill.ts) places flags for every gate of every
  skis run in `RUNS` and a top-station hut at `TOW.top`, reading them at build time, so you may move gates freely.
- Do not edit `src/winter/hill.ts`, `slopeLife.ts`, `pond.ts`, `src/critters/*`, the level JSON or the prefab
  catalog (other workers own them).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.
- `cd games/gnome-theft-auto && npx vitest run src/winter` passes (the scripted Wool Run 35-45 s, the run-out, the
  migration), and `npm test -w packages/achievements` passes.
- Shots on port 5521: `?winter=wool-run` (the start, e.g. spot `woolStart` at the start line facing south), and the tow
  top. Look at them: the start is on the snow near the summit with the slope below.

## Out of scope
The jump lip (needs a terrain stamp; leave it out and say so), any scenery, flags or signs (hill.ts), the quest files.

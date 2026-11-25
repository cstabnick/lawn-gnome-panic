Epic: E24-3 (workplace runtimes)
Depends on: E24-2 (material, show clock, club, stage UI, prefabs, sounds are in place)

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first. Two other workers write the chef and mechanic runtimes at the same
time (other files). You may run ONE dev server on port **5353** only; stop it when done. This must be FUNNY TO WATCH:
timing, the locked camera on the gnome, the silence, the tomato hitting.

## Goal
The comedy job works end to end in Le Petit Groan: "Go on stage" puts the player's own gnome on the stage, the camera
locks on it from the crowd, the show clock plays the set (subtitles, the gnome's gestures, crowd sounds, heckles,
tomatoes thrown from the seats), the player can only Double Down or Walk off, and at the end the booker's verdict and a
tiny pay (plus hazard pay per tomato) come through the jobs career.

## Read first
- `games/gnome-theft-auto/src/workplaces/comedy/runtime.ts` (stub `installComedy(deps)`), `workplaces/types.ts`
  (`WorkDeps`: `teleport`, `showroom`, `ui`, `scene`, `world`, `blocked`), `workplaces/shift.ts` (`finishShift`,
  `workLevel`).
- `games/gnome-theft-auto/src/workplaces/comedy/types.ts` (`COMEDY_CLUB_ID`, `COMEDY_START_EVENT`, `CLUB`, `ShowEvent`,
  `CrowdReaction`), `comedy/material.ts` (`setFor`, `HECKLES`, `HECKLERS`, `DOUBLE_DOWN_LINES`, `VERDICTS`),
  `comedy/show.ts` (`createShow`), `comedy/stageUi.ts` (`openStageUi`), `comedy/club.ts` (`buildClubStreet`,
  `CLUB_DOOR`).
- `games/gnome-theft-auto/src/camera.ts` `ShowroomTarget` (`fixedYaw`, `fixedPitch`, `distance`: the camera sits at
  look - (sin(yaw), cos(yaw)) * distance, so `fixedYaw: Math.PI` puts it on the +z side, among the crowd, looking at
  the stage).
- `games/gnome-theft-auto/src/interiors/index.ts`: `interiorToWorld(id, lx, lz)`, `currentInterior()`.
- `games/gnome-theft-auto/src/jobs/workDefs.ts`: `WORK_ACHIEVEMENTS` (comedian, tomatoes, doubleDown),
  `TOMATO_HAZARD_PAY`, `WORK_JOBS.comedy`.

## Change
- `games/gnome-theft-auto/src/workplaces/comedy/runtime.ts`, `installComedy(deps)`:
  - Install: `registerWorkSounds()` (`../sounds`); on the first `update`, `buildClubStreet(deps.scene, deps.world)`.
  - On `window` event `COMEDY_START_EVENT`: ignore if a set runs; `deps.blocked()` reason -> toast. Else:
    `level = workLevel('comedy')`; `played` from localStorage `gta-comedy-v1` (`{ played: number }`, try/catch);
    `set = setFor(level, played)` (none -> toast "Mireille: 'No material, no stage.'"); `show = createShow(set, {
    heckles: HECKLES, hecklers: HECKLERS, doubleDownLines: DOUBLE_DOWN_LINES, seed: Date.now() & 0xffff })`;
    `[sx, sz] = interiorToWorld(COMEDY_CLUB_ID, CLUB.stage.x, CLUB.stage.z)`; `deps.teleport(sx, sz, CLUB.stage.yaw)`;
    `deps.showroom({ x: sx, y: 0.4, z: sz, radius: 1.3, fixedYaw: Math.PI, fixedPitch: 0.1, distance: 6 })` (adjust
    y/distance/pitch so the gnome fills the middle third and the front-row heads show at the bottom; check in a
    screenshot); `ui = openStageUi(deps.ui, { title: set.title, onDoubleDown, onLeave })`.
  - Each `update(dt)` while running: `for (const e of show.step(dt)) handle(e)`; `ui.meter(show.cringe())`;
    `ui.setDoubleDown(show.canDoubleDown())`; advance flying tomatoes.
  - `handle(e)`: intro -> `ui.line('MIREILLE', e.text, 3.5)`; line -> `ui.line('YOU', e.text, e.s)` and, when
    `e.anim`, `window.dispatchEvent(new CustomEvent('gta:emote', { detail: e.anim }))`; react -> `ui.reaction(e.kind)`
    and a sound with `play2d` (`../../sound/bus`): groan 'crowd-groan', boo 'crowd-boo', cough 'crowd-cough', sigh
    'crowd-sigh', pity-clap 'pity-clap', cricket 'cricket', walkout 'crowd-cough' (+ a chair: 'door-creak' if it
    exists), silence nothing, heckle nothing (the heckle event follows); heckle -> `ui.heckle(e.who.name, e.text)`;
    tomato -> throw one; doubled -> `ui.line('YOU', e.text, 3)` + emote 'point'; closer -> `ui.line('YOU', e.text, 3)`
    + emote 'bow'; end -> `endSet(false)`.
  - Tomato: `buildPrefab('comedy-tomato')` (`@lawn/prefabs`; skip the 3D part if `getPrefab` has none) added to the
    scene at the seat's world point (`interiorToWorld(COMEDY_CLUB_ID, seat.x, seat.z)`, y 1.0), flies on a parabola
    (apex +1.2 m) to the gnome's head (stage point, y 1.6) in 0.75 s, spinning; 'tomato-whoosh' at the throw; on
    arrival remove it, play 'tomato-splat', `ui.splat()`, emote 'flinch'. Max 3 in the air.
  - `onDoubleDown`: `show.doubleDown()`; when true play 'comedy-rimshot' (a drummer who hates you).
  - `onLeave` -> `endSet(true)`.
  - `endSet(quit)`: remove tomatoes; `ui.close()`; `deps.showroom(null)`; put the player at
    `interiorToWorld(COMEDY_CLUB_ID, CLUB.after.x, CLUB.after.z)` facing `CLUB.after.yaw`; if quit: `finishShift(deps,
    'comedy', { units: [], quote: 'Mireille: "Even they noticed you leave."' })`; else `stars = show.stars()`,
    `finishShift(deps, 'comedy', { units: [{ stars }], extra: { sets: 1, tomatoes: show.tomatoes(), doubleDowns:
    show.doubleDowns() }, bonus: show.tomatoes() * TOMATO_HAZARD_PAY, bonusNote: 'Hazard pay (tomatoes)', quote:
    'Mireille: "' + VERDICTS[stars - 1] + '"' })`, save `played + 1`, `deps.increment(WORK_ACHIEVEMENTS.comedian)`,
    `deps.increment(WORK_ACHIEVEMENTS.tomatoes, show.tomatoes())` when > 0, `show.doubleDowns() >= 5` ->
    `deps.unlock(WORK_ACHIEVEMENTS.doubleDown)`.
  - Leaving the interior mid-set (`currentInterior() !== COMEDY_CLUB_ID`) or `deps.blocked()` -> `endSet(true)`.
  - `isOpen()`: a set is running. `blips()`: `{ x: CLUB_DOOR.x, z: CLUB_DOOR.z, color: WORK_JOBS.comedy.color, label:
    '🎤 Le Petit Groan (comedian)' }`.
  - Dev hook: `?comedyset` (with `?interior=le-petit-groan`) dispatches `COMEDY_START_EVENT` 3 s after the player is
    inside the club.

## Contract
`export function installComedy(deps: WorkDeps): WorkJobRuntime` (unchanged).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `workplaces/comedy/runtime.ts`.
- `cd games/gnome-theft-auto && npx vitest run src/workplaces` passes.
- Dev server on 5353: `bash tools/smoke.sh "http://localhost:5353/?offline&no-intro&interior=le-petit-groan&comedyset" gta-gnomlet gta-stage-ui`
  passes, and a screenshot `node tools/gta-shots.mjs "http://localhost:5353/?interior=le-petit-groan&comedyset" C:/Users/cpsai/AppData/Local/Temp/e24-comedy set:0,0,0 --wait 14`
  shows the gnome on stage from the crowd with subtitles (look at it; adjust the camera numbers if the framing is
  wrong). Stop the server.

## Out of scope
`comedy/material.ts`, `show.ts`, `stageUi.ts`, `club.ts`, `camera.ts` (report bugs; small fixes only if a check fails
because of them), every other file.

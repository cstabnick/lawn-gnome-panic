Epic: E14-2 (content on the track registry)
Depends on: none (epic 1 is merged in the worktree)
Worker: Sonnet (general-purpose)

## Environment
Read `docs/roadmaps/gta-batch-3/E14/issues/_env.md` first (worktree, toolchain, rules, the Track contract).

## Goal
The race machinery runs on any registered track, closed or point-to-point: the 'race' quest objective, the rival
drivers, the racing-line autopilot, the quest-sim race solver and the map all take a Track, and there is a mesh builder
for dirt track surfaces. The Speedway's behaviour is unchanged.

## Read first
- `games/gnome-theft-auto/src/raceTrack/trackDef.ts` (the Track API), `src/raceTrack/tracks.ts`, `src/raceTrack/track.ts`
- `src/raceTrack/raceAi.ts`, `src/raceTrack/autopilot.ts`, `src/quests/objectivesRace.ts`, `src/questSim/solvers/race.ts`
- `src/raceTrack/trackMesh.ts` (Speedway surfaces; `drapedRibbon` from `terrainMesh.ts`), `src/hud.ts` ~780-810 (the map's track drawing)

## Change
- `src/quests/types.ts`: the `kind: 'race'` objective gains two optional fields (keep the rest):
  `trackId?: TrackId` (import type from `../raceTrack/tracks`; absent = `'lost-and-found'`) and
  `timeAchievement?: { seconds: number; id: string }` (unlocked when the player finishes within `mustPlace` in under
  `seconds` of race time). On a track where `closed` is false, `laps` must be 1 (document it in the comment).
- `src/raceTrack/raceAi.ts`: `Rival` gains `track: Track`. `spawnRival(scene, vehicles, def, kind, slot, track: Track = SPEEDWAY)`
  stores it; `resetRival`, `driveRival` and everything inside use `r.track` (its `gridSlot`, `locate`, `sampleAt`,
  `frame`, `length`, `wrapS`, `def.barrierOffset`) instead of the Speedway free functions. Race distance on an open track
  is measured from the start line (`s - track.startS()`), no wrapping. A rival with `finishedAt !== null` on an open track
  brakes to a stop and stays put. Keep exported names and the existing Speedway behaviour.
- `src/raceTrack/autopilot.ts`: every exported function takes an optional last parameter `track: Track = SPEEDWAY`
  (keep the existing parameter order); `racingLine` works on open tracks (clamp, no wrap).
- `src/quests/objectivesRace.ts`: `raceRun` uses `const track = trackById(obj.trackId ?? 'lost-and-found')` for the grid,
  gates (`track.tracker()` instead of `new GateTracker()`), distances, locate and rivals (pass `track` to `spawnRival`).
  Open track: the player's race distance starts at `slotS - track.startS()` (negative behind the line) and finishing is
  the tracker's 'lap' event; HUD shows `POS p/n  CP passed/(gates-2)  m:ss.s` instead of LAP. Closed tracks other than the
  Speedway keep LAP. The travel line uses the track's name: `Head to the {{<track.name>}} grid ...` for the Speedway as
  today; for other tracks `Head to the ${track.name} start and get in your ...`. The Speedway podium cutscene plays only
  on the Speedway; elsewhere the quest completes `PODIUM_AFTER` seconds after the finish (confetti and banner as now).
  `timeAchievement`: on a qualifying finish with `raceTime < seconds`, call the quest deps' achievement unlock (find how
  `deps` unlocks achievements in `src/quests/types.ts` `QuestDeps`; if there is none, add an optional
  `unlock?(id: string): void` to `QuestDeps` and wire it where QuestDeps is built in `app.ts` — that one-line `app.ts`
  edit is allowed) and toast `Gold time! <m:ss.s>`.
- `src/questSim/solvers/race.ts`: use the objective's track (same `trackById` default) for grid and locate; pass the
  track to the autopilot.
- `src/raceTrack/trackMesh.ts`: add and export
  `buildDirtTrackSurface(scene: THREE.Scene, track: Track, opts: { prefix: string; road?: number; runoff?: number }): void`
  that adds draped meshes named `${prefix}-road` (width `track.def.width`, colour `opts.road ?? 0x8a6a48`, layer
  `LAYER.road` or the layer the Speedway road uses), `${prefix}-runoff` (both sides out to `track.def.barrierOffset`,
  colour `opts.runoff ?? 0x6f5a3e`, the Speedway run-off's layer), `${prefix}-line` (start line; open tracks also a
  finish line at `finishS()`; white/black chequer like the Speedway's) and `${prefix}-grid` (4 grid boxes from
  `track.gridSlot(0..3)`). Open tracks must not join the last point to the first. Reuse the file's `drapedRibbon` /
  `mat()` helpers; `buildTrackSurface(scene)` for the Speedway stays as it is.
- `src/hud.ts`: the map draws every track in `ALL_TRACKS` (open ones as an open line): the Speedway exactly as now; the
  others in a dirt colour (`#9a7a52`, edge `#5b4630`) at their `def.width`.
- Tests: `src/raceTrack/raceAi.test.ts` gains a case per non-Speedway track (`TRACKS.rutbottom`, `TRACKS['capwood-run']`):
  a rival spawned on the track and driven for 60 s of game time with `driveRival` makes progress (`dist` > 150 m) and
  stays within `barrierOffset + 3` of the centre line at least 90% of the time (copy the existing test's world stub and
  terrain setup; terrain may be flat). Add `src/raceTrack/trackMesh.test.ts` cases: `buildDirtTrackSurface(scene,
  TRACKS.rutbottom, { prefix: 'rutbottom' })` makes the four named meshes, all polygon-offset.

## Contract
- `spawnRival(scene, vehicles, def, kind, slot, track?)`, `Rival.track`, `buildDirtTrackSurface(scene, track, opts)`,
  objective fields `trackId?` and `timeAchievement?` exactly as above: epic 3 (dressing, quests) calls them.
- Do not change `trackDef.ts`, `tracks.ts`, `track.ts` or the `defs/` files (other workers own `defs/`). If the Track API
  lacks something you need, write a local helper in your file.

## Done when
- `npx tsc --noEmit -p .` passes for your files.
- `npx vitest run src/raceTrack src/quests/objectivesRace.test.ts src/questSim` passes (questSim may have slow suites;
  at least `src/raceTrack` and `objectivesRace.test.ts` must pass).
- The existing Speedway tests (`track.test.ts`, `raceAi.test.ts`, `lapTimer.test.ts`, `trackMesh.test.ts`) still pass unchanged.

## Out of scope
`src/raceTrack/defs/*`, `trackDef.ts`, `tracks.ts`, `track.ts`, `lapTimer.ts` (free-roam timer stays Speedway-only),
`quests/races.ts` and any new quest file, every area module (`rutbottom/`, `capwood/`, `dirtCountry/`).

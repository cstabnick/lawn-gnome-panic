# FX05 roadmap: quest-scoped stage sets, scene weather and key-frame light

Brief: `docs/roadmaps/gta-batch-3/review/fix/FX05-stage-sets-and-scene-light.md` (G1#1, G1#21, G10#3, G10#6, G10#25,
G11#16, G11#17, G11#18, G12#10; GR3, GR6, D3, D5, D49).

## Foundation (lead, before the epic)

- `cutscene/script.ts`: `SceneScript.weather?: WeatherKind | 'world'`, `keyLights?: SceneKeyLight[]`,
  `faceFill?: boolean | number`; `SceneKeyLight { at: Target; lift?; color?; intensity?; range?; from?; until?; flicker? }`;
  PacingCode gains `'face-hidden' | 'speaker-blocked'`.
- `cutscene/timeline.ts`: `sceneWeather(script)` (default clear; rain under a rain/storm bed, snow under a snow bed;
  `'world'` keeps the schedule), `keyLightLevel(from, until, t)`, `wantsFaceFill(script, night)` (on for night/golden
  world scenes).
- `cutscene/director.ts`: hooks `setWeather`, `night`, `onScene`; key lights and a camera-side face fill (strongest in
  close shots, gone by 9 m) in the stage group; weather pinned for the scene and given back after.
- `app.ts` (additive): `setWeather` through `forceWeather` (the old forced weather restored), `night`, `onScene` ->
  `stageSets.scene(id)`; `stageSets.bind(journal)` after the quest engine; `stageSets.update(dt)` per frame.
- `stageSets.ts`: story stage sets (quests/stages/story/) are quest-scoped (`stageWindows`, `windowOpen`): hidden and not
  solid outside their quest window, shown while a quest of theirs is active or one of its scenes plays. `SetProp.always`
  (part of the place, stays), `SetProp.overRoad`, `Stage.setStays` (quests/stages/kit.ts). `?stagesets=all` shows every set.
- `stageSets.test.ts`: window test (s62 hidden before #62, shown in its intro / while active / in its outro, hidden
  after) and the GR3 road-overlap test (no solid story prop on a carriageway unless `overRoad` and quest-scoped; props
  lifted more than 3 m are over the road, not on it).
- `cutscene/pacing.ts` `keyFrameFaults` + `KEY_FRAME` (face within 60 deg, looked down on at most 40 deg, nobody between
  camera and face or at the lens); `pacing.test.ts` reports them for every scene under "Key frames" and enforces them on
  `KEY_FRAME_STRICT` (every scene in the files this epic owns).
- Scene shot tool (scratchpad, lead only): `scene-shots.mjs` plays `?cutscene=<id>` and shoots at scene-clock times.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Sets and scenes | tsc; `npx vitest run src/stageSets.test.ts src/quests/stages.test.ts src/cutscene/pacing.test.ts src/cutscene/cutscenes.test.ts`; re-shoots | 9 (parallel, no shared files) |
| Lead pass | full build + test, smoke, zfight, perf, re-shoot every finding, iterate | lead |

Issue I3 (road overlaps) is mechanical (haiku-worker); the rest need taste (staging, light) and run on Sonnet
general-purpose agents that look at their own screenshots.

Online: not applicable (scene presentation and quest-scoped dressing; weather pinning is local only, the shared weather
schedule is untouched). Mobile: every re-shoot is also taken at 390x844.

## Epic 1

The full issue texts are in `issues/I1.md` .. `issues/I9.md` next to this file (each pastes the shared environment block
from `issues/_env.md`).

| Issue | Findings | Owns |
|---|---|---|
| I1 D3 lockup + tunnel door | G1#1, G1#21 | `quests/stages/story/s62-cams-cell.ts`, `cutscene/scenes/story/m62-cams-cell.ts`, `quests/story/62-cams-cell.ts` (positions only), `city/megaBlock.ts` (door) |
| I2 D5 roof-garden tour | G10#6 (set), G10#25 (rain in #21) | `quests/stages/story/s21-penthouse-viewing.ts`, `cutscene/scenes/story/m21-penthouse-viewing.ts`, `quests/story/21-penthouse-viewing.ts` (positions, hint text) |
| I3 road overlaps | G1#1 (GR3 test) | `quests/stages/story/s13-diner-on-route-south.ts`, `s54-the-heist-board.ts`, `s58-the-reeves-barn.ts` |
| I4 #14 Drainpipe Court | G10#3 | `cutscene/scenes/story/m14-drainpipe-court.ts`, `quests/stages/story/s14-drainpipe-court.ts` |
| I5 #15 Founders' Boot crowd, #34 party | G10#25 | `cutscene/scenes/story/ch1d.ts`, `cutscene/scenes/story/m34-forty-seven-wrenches.ts` |
| I6 night key light #39 #44 #50 | G11#16 | `m39-couch-surfing.ts`, `m44-the-bathtub-queen.ts`, `m50-trellisdown-tasting.ts` |
| I7 faces #41 #43 #46 | G11#18 | `m41-pinwheel-ridge.ts`, `m43-saltbucket-boardwalk.ts`, `m46-starfall-at-the-anthill.ts` |
| I8 #52 The Test Cut | G11#17, G11#18 | `m52-the-test-cut.ts`, `quests/stages/story/s52-the-test-cut.ts` |
| I9 #64 All Hats | G12#10 | `m64-all-hats.ts`, `m64a-all-hats.ts` |

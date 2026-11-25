# E26 roadmap: street racing and race modes

Brief: [../E26-street-racing.md](../E26-street-racing.md). Contracts: [contracts.md](contracts.md). Issues: `issues/`
(each pastes `issues/_env.md`). Foundation written by the lead before epic A: `relief: 'none'` (trackDef.ts),
five street ids in the registry with placeholder defs (tracks.ts, defs/streets.ts), `SYS.race` (protocol.ts), the
race objective's `night` / `closedRoad` fields, `RaceRunOpts` types, and stubs with final signatures for every
`streetRace/` module and `online/raceSync.ts`.

| Epic | Issues | Done when |
|---|---|---|
| A foundations | A1 routes + meets (Sonnet), A2 writing/cast/quests/lore (Sonnet), A3 raceRun opts (Sonnet), A4 rivals in traffic (Sonnet), A5 online race sync (Sonnet), A6 save (Haiku), A7 ghosts (Haiku), A8 achievements + gear (Haiku) | tsc, each issue's tests, lore, package tests |
| B building | B1 session (Sonnet), B2 meet scene (Haiku), B3 wager panel (Haiku), B4 Race Club app (Haiku), B5 quest registration (Haiku), B6 composer (Haiku), B7 app wiring (Sonnet) | build, game tests, smoke |
| C checks | lead + Sonnet: quest-sim on the five quests, two-client online race, screenshot pass (`screens/`), fixes | all checks in the brief |

File ownership (no two issues in an epic share a file): A1 defs/streets.ts, streetTracks.test.ts, meets.ts(+test);
A2 cast.ts, quests/streetRaces.ts(+test), docs/lore; A3 objectivesRace.ts(+test); A4 raceAi.ts(+test); A5
raceSync.ts(+test), online/install.ts; A6 save.ts(+test), saveIO.ts, cloudSave.ts, saveIO.test.ts; A7 ghost.ts,
ghostView.ts(+test); A8 packages/prefabs catalog, packages/achievements catalog. B1 session.ts(+test); B2
meetScene.ts(+test); B3 wagerPanel.ts(+test); B4 raceApp.ts(+test); B5 defs.ts, level json, unlocks.ts(+test),
stages/street.ts, stages.ts, questSim/plans.ts, generated golden/doc; B6 index.ts(+test); B7 app.ts.

Lead fix-ups between epics: pass `others: vehicles` from objectivesRace.ts into `driveRival` (A3/A4 meet there).

No party slice: street racing lives inside the open world (a party round of it would be the Speedway slice idea in
the GTA backlog row, not this epic).

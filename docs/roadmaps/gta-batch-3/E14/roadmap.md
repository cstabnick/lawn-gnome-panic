# E14 Dirt, rally and toadstools: roadmap

Brief: [../E14-dirt-rally-toadstools.md](../E14-dirt-rally-toadstools.md). Source items L17 (a toadstool forest), L56
(a bumpy dirt track with big banked turns, a new dirt-bike-like vehicle), L81 (a rally route up and down the mountain
through the toadstools, with water crossings of special water that cannot fully waterlog the car).

Sites (E01/E28): `dirt-track` Rutbottom Dirt Bowl (resized by this epic to centre (1200, -650), 400 x 260),
`toadstool-forest` Capwood (250, -1180), `rally-route` the Capwood Run paddock (90, -760). Shared notes for every issue:
[issues/_env.md](issues/_env.md). Contract for later epics: [contracts.md](contracts.md).

## Shape

| Epic | What | Done when | Issues |
|---|---|---|---|
| E14-1 Foundation (lead) | `TrackDef` + `createTrack` (closed and point-to-point, 'raise' and 'ribbon' relief, whoops, fords), Speedway behind its old exports, `TRACKS` registry with placeholder defs, terrain/surfaces/waterAt/waterlog wiring (`fordCap`), dirt-track site resize, area-module stubs wired into `app.ts`, `capwood/spots.ts`, empty prefab catalog files, `buildSignText` exported | tsc, `src/raceTrack`, sites/levels tests | lead |
| E14-2 Content on the registry | race runtime on any track (2A), Rutbottom circuit (2B), Capwood Run route + fords + scatter keep-out (2C), the Knobbly dirt bike (2D), world prefabs (2E), gear + achievements (2F), lore (2G) | build, game tests, prefabs/achievements tests, lore | 7 |
| E14-3 Places and quests | Rutbottom dressing + storytelling (3A), Capwood forest (3B), Capwood Run dressing + ford pools (3C), quests (3D) | build, tests, quest-sim, smoke, zfight | 4 |
| E14-4 Finish (lead) | checks, screenshot pass, contracts, AGENT_INDEX, commit | all checks | lead |

Parallelism: within an epic no two issues change the same file, except two one-line `app.ts` edits in E14-2 (2A: quest
deps unlock wiring if needed; 2D: parked dirt bikes), on different lines. E14-3 issues each own one area folder; 3D owns
the quest files.

Issues: [issues/](issues/).

## Log

- E14-1: done by the lead. Placeholder track defs already pass the generic registry test (`tracks.test.ts`).

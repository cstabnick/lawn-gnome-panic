# E31 roadmap: the living world

Brief: [../E31-living-world.md](../E31-living-world.md). Common rules for every issue: [_common.md](_common.md).
Issues: [issues/](issues/).

| Step | Who | Issues | Done when |
|---|---|---|---|
| 0 foundation | lead | — | tsc clean; stubs (`src/unmown/*`, `src/living/*`, `critters/unmown.ts`, `critters/bands.ts`), `living/config.ts` constants, new critter kinds (+`swims`/`hop`), three vehicle kinds registered, `water/reedmere` + `water/high-tarn` + `trail/high-tarn-path`, `buildLivingWorld` in world.ts, `createLivingWorld` in app.ts (people, checklist, achievement watches, blips, sound), empty prefab catalog files |
| 1 prefabs and systems | 13 workers in parallel | P1 P2 P3 P5 P6 (prefabs, gear + achievements), V1 (rides + registration), V2 (traffic mix + fleet), V3 (boats + sky), C3 C4 (wildlife), C5 (birds), A6 (sound), B6 (checklist app) | prefab, achievements, gnome tests; GTA tests of each area |
| 2 building the places | 12 workers in parallel | B1 station, B2 boardwalk, B3 hides, B4 trails, B5 vignettes + people, D1 band settlements, D2-D4 hamlets, D5 High Tarn, D6 roadside, D7 parked | each builder's test; then the lead: build, full tests, golden regen |
| 3 lore and checks | 1 worker + lead | L1 lore | `npm run lore`; smoke, zfight, perf, screenshots |

Dependencies: wave 2 places the prefab ids wave 1 makes (builders guard with `getPrefab`, so the order is for the look,
not the build). Online: nothing new is relayed except the three vehicle kinds in `VEHICLE_CODES`. Mobile: the checklist
is a Gnomlet app with 44 px rows; no new keys.

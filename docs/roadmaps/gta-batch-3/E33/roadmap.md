# E33 roadmap: mountain routes

Brief: [../E33-mountain-routes.md](../E33-mountain-routes.md). Common rules for every issue: [_common.md](_common.md).
Contracts: [contracts.md](contracts.md). Issues: [issues/](issues/).

| Step | Who | Issues | Done when |
|---|---|---|---|
| 0 foundation | lead | — | the Hatbrim in `landscape.json`; `src/mountainRoutes/` (types, routes registry with stub lines, pads, deps, index, stubs for graph/surface/rails/dressing/life/progress, `driveAlong` test helper); `GROUND_TRACKS` in `raceTrack/tracks.ts` (relief, surfaces, keep-out) + `applyPadRelief` in `terrain.ts`; `addMountainRoads` in `highways/install.ts`; `createMountainRoutes` in `app.ts`; three empty prefab catalog files registered; tsc clean |
| 1 geometry and systems | 3 Sonnet + 8 Haiku in parallel | G1 Hatbrim routes (Sonnet), G2 Spine Cut (Sonnet), E3 guard rails and roadside furniture (Sonnet); E1 road graph, E2 surfaces, P1 road prefabs, P2 place prefabs, P3 gear + achievements, M1 map lines, A1 progress + blips, L1 lore (Haiku) | each issue's test; then the lead: build, the game's tests, prefabs/achievements/gnome tests, lore |
| 2 dressing and life | 3 Sonnet + 1 Haiku in parallel | D1 Brim Gap Road dressing, D2 Hatband + Brim Walk dressing (Summit Register), D3 Spine Cut dressing (the Keyhole), D4 life and sound | each dresser's plan test; then the lead: full checks, golden regen |
| 3 checks | lead | — | smoke, z-fight, screenshots (3 per route) in `screens/`, perf on the Brim Gap Road, contracts, index |

Dependencies: wave 2 places things at the spots and pads wave 1's geometry issues name (the names are fixed in the
issues, so the code compiles either way). Online: nothing new is relayed (terrain and routes are data; progress and the
register are per player). Mobile: no new controls (the register uses the interact button).

Not done (decided): a coastal clifftop road (the macro relief is masked near water, so no sea cliffs without a terrain
change); a real tunnel (height-field terrain: the Keyhole is an arch over a cut).

# E33 contracts: the Hatbrim and the mountain routes

What E33 (mountain routes, L116) gives later epics. Code under `games/gnome-theft-auto/src/mountainRoutes/`. World: +x
east, +z south; yaw 0 faces +z. Lore: R-223..R-225 (renumber at merge if E26/E32 took numbers), entries `hatbrim`,
`brim-gap-road`, `hatband`, `brim-walk`, `spine-cut`, `top-hat-cafe`, `velma-crown`, `plumb-bob`.

## The land

`src/data/landscape.json` gains three features (data; the Wasm kernel reads them as data, parity unchanged):
`mountain/the-bobble` (690, -1690) r 210 h 124, `mountain/old-pate` (800, -1500) r 165 h 72, `ridge/hatbrim`. The Bobble's
top is about 105 m (the yard's highest point), Old Pate about 72 m, Brim Gap about 39 m. Snow paint above 32 m comes from
the north-highlands rule. `landforms.test.ts` height cap raised to 130 m.

## Routes (data + registry)

| id | name | kind | length | character |
|---|---|---|---|---|
| `brim-gap-road` | the Brim Gap Road | road (asphalt, 7 m, in the graph) | 1.77 km | pass road from the north band road by Mittenholt (648, -1301), 3 hairpins up Old Pate's west face to Brim Gap (the Top Hat café, 40 m level), 2 more down to the High Tarn, back to the band road (950, -1298); grade <= 0.098 |
| `hatband` | the Hatband | track (gravel, 4 m, bikes and buggies) | 0.49 km | shelf round the Bobble's cone at 55-65 m, sheer drop on ~70 % of it, the World's Edge lookout over the north fence; leaves and rejoins the road at Brim Gap |
| `brim-walk` | the Brim Walk | trail (dirt, 2.5 m, on foot) | 1.65 km | stile at Mittenholt, Old Pate's cairn, across the road at Brim Gap, Pate's Bothy, the Bobble's summit (Summit Register), down to the High Tarn's bothy |
| `spine-cut` | the Spine Cut | road (asphalt, 7 m, in the graph) | 0.73 km | from the north band road (440, -1325) through a 25 m-deep cut in the Highland Spine under the Keyhole arch (576.5, -1195.8), across the moor to the east band road (1011.6, -990) |

- `types.ts`: `RouteDef extends TrackDef { kind: 'road' | 'track' | 'trail'; relief: 'ribbon'; blurb }`, `RouteSpot`,
  `PadDef`. `routes.ts`: `ROUTE_IDS`, `ROUTE_DEFS`, `ROUTES` (Tracks), `ALL_ROUTES`, `routeKind`, `routesOfKind`,
  `routeById`. Named spots per route in `defs/*` (`BRIM_GAP_SPOTS`, `HATBAND_SPOTS`, `BRIM_WALK_SPOTS`,
  `SPINE_CUT_SPOTS`): hairpins, `cafe`, `lookout`, `tarnLayby`, `gateWest/East`, `worldsEdge`, `summit`, `bothy`,
  `keyhole`, `surveyor`... Use them (quests, races) instead of typing coordinates.
- Pads (`pads.ts`, `defs/hatbrimPads.ts`, `SPINE_PADS`): level rectangles at their route's road height —
  `cafe-terrace`, `tarn-layby`, `worlds-edge`, `summit-platform`, `bothy-terrace`, `keyhole-pullin`, `moor-layby`.
  `padAt`, `padHeight(id)`, `padSurfaceAt`.
- Terrain wiring: `raceTrack/tracks.ts` `GROUND_TRACKS = [...ALL_TRACKS, ...ALL_ROUTES]` (relief, surfaces, fords,
  `nearTrack` keep-out); `ALL_TRACKS` stays the race list. `terrain.ts` applies `GROUND_TRACKS` relief then
  `applyPadRelief`. New optional `TrackDef.pinEnds` (m): an open ribbon eases back to the ground at its ends (so a route
  meets a highway at the highway's height); unset for the race tracks.
- Races: every route is a `Track`, so E26 or later can race them (`trackById` does not know them: use `routeById`).

## Systems

- `graph.ts` `addMountainRoads(graph)` (called by `highways/install.ts` after the skyways): 'road' routes join
  `world.roads` as ground nodes (5 m apart on bends, 12 m on straights), ends spliced into the band roads. Traffic and the
  GPS use them; trails and the Hatband are not in the graph.
- `surface.ts`: asphalt + lines + verges (verge on `LAYER.tint` under the road and pads), gravel shelf, dirt path (cut
  where it crosses a wider route), pads on `LAYER.area`.
- `rails.ts`: `railRuns()` (pure; rails where the ground drops >= 1.5 m or on the outside of hard bends, not across pads,
  ends or crossings), `buildGuardRails` (prefab `mountain-guard-rail` sections with 0.9 m colliders, reflector posts,
  Hatband poles).
- `progress.ts`: `RouteRun` end-to-end detection either way, `modeOk` (road: any ground vehicle; track: radius <= 1.2;
  trail: on foot), toasts, achievements, trailhead blips.
- Dressing: `brimGap.ts` + `brimGapPlan.ts` (Top Hat café, Velma Crown, 5 named hairpins, 5 vignettes), `hatbrim.ts` +
  `hatbrimPlan.ts` (bollard gates with 2.6 m gaps, stile, cairns, Pate's Bothy, the Summit Register interact spot,
  5 vignettes), `spine.ts` + `spinePlan.ts` (the Keyhole arch, Plumb Bob, rockfall, Old Bangs, ear tag no. 41),
  `life.ts` (7 goats, 2 raptors, wind and bleats).
- `driveAlong.ts` (tests only): a vehicle on the casual sim chassis follows a route end to end.

## Prefabs and achievements

- Prefabs: `gta-mountain-roads.ts` (`mountain-guard-rail`, `road-marker-post`, `hatband-pole`, `hairpin-chevron-sign`,
  `gradient-sign`, `falling-rocks-sign`, `route-name-sign`, `viewpoint-topograph`), `gta-mountain-places.ts`
  (`top-hat-cafe`, `summit-register-box`, `stone-stile`, `picnic-blanket-spread`, `keyhole-arch`, `scree-pile`,
  `stuck-camper-chocks`), `gta-mountain-gear.ts` (rewards).
- Achievements: `gta-brim-gap-road` (head `pass-driving-goggles`), `gta-spine-cut` (back `keyhole-pennant`),
  `gta-hatband` (neck `goat-bell`), `gta-brim-walk` (head `mountain-bobble-beanie`; `bobble-beanie` was taken by E12),
  `gta-summit-register` (hand `alpenstock`).

## Checks

Geometry + drive-along tests: `hatbrim.geometry.test.ts` (road: ride-on and lowrider both ways, lane 1.75, lookahead 6;
Hatband: dirt-bike both ways), `spine.geometry.test.ts` (ride-on and lowrider both ways). Perf: `node tools/gta-perf.mjs
<url> --legs '<json>'` (new option) along the Brim Gap Road: 7.5-7.8 ms avg, p95 8.1 ms at 390x844 @2x (same as the
E31 baseline). Screens: `screens/` (see `screens.md`).

## Known / deferred

- The Hatband is 0.49 km (the cone is small) and the climb has 3 hairpins (+2 on the descent), not 5-8.
- The Brim Walk crosses the north band road twice near its Mittenholt start.
- The chevron prefab points one way only: at left-hand hairpins the board reads correctly for one direction.
- A coastal clifftop road (sea cliffs are impossible while the macro relief is masked near water) and real tunnels
  (height field) are out of scope.

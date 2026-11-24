# E13 Campus and skyline
Wave: 5 · Depends on: E01, E05 · Kind: Content
Source items: L52, L74, L82

- L52 add a research university somewhere. should have a good number of buildings. may require map extension to support. also ensure it has an observatory. observatory should be on a giant hill (perhaps giant ant hill or termite mound?) and have a ramp that allows players to drive off it
- L74 in one of the new areas added, make a new runway.
- L82 add wind turbines somewhere

## Goal
Fill three E01 slots: a research university (about 10 to 14 buildings, quad, roads, parking) with an observatory on a giant
termite or ant mound that has a drive-off ramp; a second, longer runway with its own apron and hangar; a wind farm on a ridge.
Everything walkable inside uses E05; all of it is reachable by road and by air.

## Scope
In: the campus layout and buildings, the mound landform, the observatory (exterior, interior, telescope), the observatory ramp
(a registered stunt ramp), runway 2 including aircraft spawns and the map/airfield plumbing, wind turbines (static, rotating,
with a service road and a climbable-roof turbine hub optional), spur road(s), NPC walkers on the quad, props, achievements.
Out: quests and cutscenes (E20 to E22 use these places; E04 names them), the ground and slot reservation (E01), the interior
system itself (E05), the golf course (E15), vehicle physics for the jump (E02: floaty landing, bounce).

## Code pointers (confirmed)
- Slots to fill (E01, placeholder ids): `campus` (1130,-180) 340x300, `observatory-mound` (1240,140) r120 with a flat summit r30, `runway-2` (1300,600) yaw 0 length 420 width 24, `wind-farm` (850,-1180) 300x90 on the ridge, in the new regions `east-campus` and `north-highlands`; read through `src/sites.ts` (`siteById`, `anchorOf`).
- Existing airfield, the template to copy: marker `site` id `airfield` in `src/data/levels/dust-flats.level.json` {x 80, z -110 (region-local), yaw PI/2, length 170, width 18, `planeSpots[]` {dx,dz,yaw,kind}}, read once in `src/config.ts:93` as `AIRFIELD` and used by: `terrain.ts:136` (flat site), `biomes.ts:160,367,423` (apron/runway meshes, hangar, windsock, `buildBiomes`), `landforms/macro.ts:64` (macro mask), `cityScenery/site.ts:213`, `settlements.ts:143`, `surfaces.ts:77 onAirfieldRunway` (asphalt grip), `craft/spawns.ts` (`CRAFT_SPAWNS` offsets from the airfield: hedge-hopper, sycamore-copter, dandelion-drifter), `app.ts:661` (parks `plane` kind at `planeSpots`), `hud.ts:727` (map runway), `mapPois.ts:47`, `jobs/places.ts`, `lockup/runtime.ts:313` (aircraft storage), `skyTraffic/behaviours.ts:42` (`airfieldCircuit`), `quests/chapter4.ts:32`, `quests/newcomerQuests.ts:206`. E01 provides `AIRFIELDS[]` so runway 2 is data; this epic converts the consumers that must know about both (terrain, macro, biomes builder, surfaces, hud, mapPois, skyTraffic, lockup, spawns).
- Flight: `craft/flight.ts stepAir`, `craft/aircraft.ts stepAircraft` (`floorUnder` = land, deck, water; `sweepCircleBoxes(..., v.y)`), tunable via `craft/tuning.ts`. `Vehicle` kinds `plane` (Crop Duster), `hedge-hopper`, `sycamore-copter`, `dandelion-drifter` (`config.ts VEHICLES`). A 420 m strip is ample for the Crop Duster's takeoff (the desert strip is 170 m).
- Ramp: `src/stunts.ts` `STUNT_RAMPS` (`StuntRamp {id,name,x,z,yaw,width,length,height,biome}`; 12 today, all about 3 m high), drawn as wedges by `buildWedgeGeo`, driven by `src/ramps.ts` (`rampGroundProbe`, `pushOutOfRampSides`, `rampContactAt`) and scored by `createStunts` (jump distance, `STUNTS_STORAGE_KEY`). The wedge height is relative to `heightAt`, so a ramp placed at the summit of a raised mound launches from the mound's height. `biome` must be a `BiomeId` (E01's `campus`).
- Mound geometry: world relief = `terrain.ts heightAt` = region landform (`src/landforms/<region>.ts`, `GtaTerrainFeature` kinds in the region doc `data.terrain.features`) + macro (`landforms/macro.ts`, features in `src/data/landscape.json` kinds `mountain|ridge|hill`) + document `stamps` (gauss/flatten). A mound = a `hill` macro feature (r 120, h 45) plus a `flatten` stamp on the summit; the `site` mask keeps the road and summit flat (`macroMaskAt`). Terrain texture paint (dirt, rock) in `src/terrainPaint.ts` (`trail/` ids).
- Roads: region doc `paths` of `kind:'road'` (drivable, traffic uses them) vs `trail/` (dirt, no traffic); highways appended in `src/data/world.layout.json`. A switchback `trail/observatory-road` climbs the mound at <= 16 degrees.
- Buildings: no university prefabs exist. Use `@lawn/prefabs` (`packages/prefabs/src/catalog/`; existing `hangar`, `hangar-two`, `gta-windmill`, `giant-spotted-toadstool`, `gsr-telescope-stand`, `windsock-scarf`) and `placeProp`/`buildStaticCells` (`cull.ts`) for scenery; Turfton's tower kit (`src/towers/`, `silhouettes.ts`) can style the tall lecture halls if a building needs a facade atlas. Rooftops: E05 `addRooftop`.
- Lore search: `npm run lore -- find university|observatory|campus|termite|wind turbine` returns nothing today (verified); `runway` finds `desert-airfield`, `hangar-two`, `crop-duster`. Nearby settings: `docs/lore/settings.md`, `docs/lore/entries/apocrypha/dust-flats.md`.

## Proposed design
- Region `east-campus` content (E01 made the empty region): campus quad centred (1130,-180) with a ring road (`kind:'road'`) joined to a spur from `east-outer`; 12 named buildings (library, lab block, lecture hall, dorm, refectory, "faculty club", glasshouse, mulch-science barn, engineering shed, gate lodge, stadium-lite, gnome-physics hall), each a `placeProp` or `setpiece` (add builder ids to `SETPIECE_BUILDERS`), colliders from the prefab footprint, 3 with E05 interiors (library, lab block, observatory), 2 with walkable roofs.
- Observatory on the mound (1240,140): dome + telescope on the summit flat, termite-mound surface texture (new `terrainPaint` kind or tinted dirt), tunnels as decoration only; ramp at the summit rim facing the campus quad: `STUNT_RAMPS` entry `observatory-leap` (width 8, length 18, height 4.5, biome `campus`) landing area flat and clear of props for 60 m.
- Runway 2 at (1300,600): marker `site` `university-runway` with the same data shape as `airfield`; paint, lights (night emissive strip), windsock, a hangar (prefab `hangar`), tower; `CRAFT_SPAWNS` gains a second set via the site's `planeSpots`; skyTraffic gets a second circuit so intermittent planes (E06 cadence) use both fields.
- Wind farm: 8 to 12 turbines along the ridge, a new prefab `gta-wind-turbine` with a rotor mesh animated by one shared uniform or rotation per turbine (static batches cannot rotate: keep rotors as a small separate group registered with `registerCull(..., 'landmark')`), a gravel service road, a substation shed; the tallest is climbable by stairs to a platform (E05 rooftop) for a view.

## Contracts this epic provides
- `CAMPUS` constants (centre, buildings with ids and door anchors) in `src/campus/` for E20 to E22 quests and E17/E18 jobs; interiors `uni-library`, `uni-lab`, `observatory` through `defineInterior`.
- `OBSERVATORY` {summit, ramp, telescope anchor}; stunt `observatory-leap` for achievements and side quests ("jump the observatory").
- `AIRFIELDS[1]` runway 2 data, map POI "University Airstrip", landing pad list for GPS and flight lessons (`trainer/` can add a second course).
- `WIND_FARM` turbine positions for story and a possible "climb the turbine" quest; `windTurbine` prefab id.
- Map POIs for E07 (`mapPois.ts` rows: campus, observatory, airstrip, wind farm) and region theme for `east-campus`.

## Contracts this epic consumes
- E01: slot rects and anchors (`siteById`), `AIRFIELDS[]`, new biome ids, `POS_BOUND`/`WORLD_HALF`, spur highways.
- E05: `defineInterior`, `kit`, `addRooftop`, `landingPads()`.
- E04: names for campus buildings, staff and the observatory (placeholders now); E02: the landing physics after ramps (only tuned, not changed here).

## Online / mobile / achievements / prefabs / lore
- Online: nothing new to sync; the new aircraft spawn through the same `spawnCraft` path (relayed like other vehicles); remote players in the east band are inside `POS_BOUND` once E01 raises it.
- Mobile: no new controls; check a 390x844 view of the quad, and keep turbine and building draw counts inside `cull.ts` budgets (static cells, 96 m); rotors are the only per-frame work.
- Achievements: "Termite Take-off" (clear the observatory jump), "First Class Honours" (visit 12 campus buildings), "Windfall" (fly under a turbine blade line) or similar; cosmetic rewards from existing prefabs (a mortarboard-style `head` item may need a new prefab in `cosmetics-head-*.ts`). `npm test -w packages/achievements`.
- Prefabs: add `PrefabDef`s in a new `packages/prefabs/src/catalog/gta-campus.ts` (lecture hall, library, dorm, observatory dome, telescope, termite mound decor, wind turbine, runway light) following `docs/roadmaps/prefab-library/_common.md`; `npm test -w packages/prefabs`. Use the existing `gsr-telescope-stand` for the interior telescope.
- Lore: write the entries yourself unless E04 has (check `docs/lore/` first): the university, the observatory (the mound's makers: termite or ant, rule it once in `rulings.md`), runway owners. `npm run lore` must pass.

## Risks and open questions (decisions taken)
- A 45 m mound is steep for the vehicle probe: decision, mound slopes <= 16 degrees along the switchback road and up to 30 degrees only off-road; verify with `terrainDrive.test.ts` style probes (`src/terrainDrive.test.ts` exists) and `PROBE=` map tooling. A fall from a 49 m jump kills a car: the landing area is a ramped-down runout (a second long wedge) rather than the flat plain, and damage comes from E02's landing rules.
- Static prefab batches cannot rotate: turbine rotors are separate meshes, at most 12, culled as landmarks.
- Generalising `AIRFIELD` touches ~15 files: decision, keep `AIRFIELD` exported and unchanged for the desert quests; only the listed consumers loop over `AIRFIELDS`; the golden test must stay byte-identical for the desert area.
- The campus must not look like Turfton's towers: use low buildings, courtyards and a distinct region theme (`regionThemes.json`).
- If E05 slips, buildings ship with closed doors and the interiors are deferred; the exteriors, mound, ramp, runway and turbines do not depend on E05.
- Quest markers for story visits are E20 to E22's job; this epic only exposes anchors.

## Done when
`npm run build -w games/gnome-theft-auto`; `npm test -w games/gnome-theft-auto` (adds `campus.test.ts`: buildings inside the slot and off roads, ramp lip height matches the summit, runway 2 data valid, a plane can take off and land in `flight.test.ts` style simulation); `npm test -w packages/prefabs`, `-w packages/achievements`; `npm run lore`;
dev server + `bash tools/smoke.sh <url> <marker>`; `npm run zfight -- <url>` (runway paint, quad paths, mound texture); manual: drive up the observatory road and off the ramp, fly the Crop Duster from runway 2, walk into the library, phone viewport check.

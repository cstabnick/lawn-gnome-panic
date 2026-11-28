# E01 World expansion and site plan
Wave: 1 · Depends on: none · Kind: Engine
Source items: L92, plus site slots for L12, L17, L35, L37, L43, L51, L52, L56, L58, L59, L61, L74, L81, L82, L85, L40, L50

- L92 take out 3 of the blocks in the main square and make a contiguous park. then make one mega 2x1 with a tunnel underneath somewhere else.
- L12 add some construction sites. make them gnome themed and lore appropriate
- L17 add a toadstool forest somewhere
- L35 add an ocean region with skiing and tubing so that gnomes can have fun. not sure how this will reconcile with the world but surely it won't matter. add some new quests, maybe tie in to some other quests. boardwalk too for sure. ferris wheel as well.
- L37 add a vineyard and mansion somewhere appropriate
- L40 add a cult somewhere.
- L43 add a ski hill and skiing
- L50 add an underground society. this will have a small mini-questline for moles and doing mole jobs. (...) make dj moleman make an appearance.
- L51 add a pirate ship somewhere
- L52 add a research university somewhere. should have a good number of buildings. may require map extension to support. also ensure it has an observatory. observatory should be on a giant hill (perhaps giant ant hill or termite mound?) and have a ramp that allows players to drive off it
- L56 add a dirt race track that is rather bumpy with big banked turns. (...) may require map extension.
- L58 introduce buildings or apartments or stuff where the main characters and side characters live and work. (...) all characters should have a home. (E04 writes who lives where, E10 builds: E01 only reserves the ground.)
- L59 add public basketball court / L61 add public skate park
- L74 in one of the new areas added, make a new runway.
- L81 add a rally race track that goes up and down mountain through toadstool stuff and also has some water crossing parts (...)
- L82 add wind turbines somewhere
- L85 add a golf course. (...) will need a lot of new land space. add by breaking through a fence into someone else's yard. (...)

(Only the ground and the registry are E01's; the content of every slot belongs to the epic named in the master plan's Epic map.)

## Goal
Make room. Grow the world past 1800 x 1800, give each new place a named, reserved footprint in one registry that
content epics read, and rebuild the downtown blocks L92 asks for, so nobody fights for ground later.

## Scope
In: (1) `worldHalf` 900 -> **1400** (2800 x 2800, `fenceEdge` 1395) with four new band regions around the old seven;
(2) the site registry `src/sites.ts` plus a `slot` marker kind; (3) terrain, water-reserve, road and map-extent plumbing
so the ring is walkable, drivable, on the map and on the net; (4) the downtown restructure (L92); (5) ground-only
placeholders: flat or raised ground, a spur road to each cluster, region themes. Out: any building, track, quest or
prop belonging to a slot (those epics fill them), the ocean's waves and boardwalk (E11), interiors (E05).

## Code pointers (confirmed)
- World size is one number: `src/data/world.layout.json` (`worldHalf` 900, `fenceEdge` 895, `regions[]` with origins,
  `highways[]` ids in road-graph order, append only). Read as `LAYOUT` in `src/levels.ts`; `WORLD_HALF` in `src/config.ts:35`
  feeds `terrain.ts` (`GRID_N`, step 2: 2801^2 floats at 1400, ~2.4x today), `terrainMesh.ts`, `terrainPaint.ts`,
  `landforms/fields.ts` (macro grid), `landforms/macro.ts` (`backgroundAt` rim: `rimWidth` 130, `rimHeight` 18 in
  `src/data/landscape.json`), `biomes.ts` (the perimeter fence from `LAYOUT.fenceEdge`, ~line 914), critters, destructibles,
  `cityScenery/site.ts` (edge = WORLD_HALF-20), and the minimap/big-map picture `buildBackground` in `hud.ts:611`
  (1 px per world unit, `world.half`: 2800^2 px, see Risks).
- Regions: `RegionId` union, `GENERATORS`, `REGION_DOCS`, `REGION_PRIORITY` (levels.ts); each doc in `src/data/levels/*.level.json`
  has `data.border` (polygons that tile the whole square, first match wins), `data.region` biome (one region per biome, pinned by
  `levels.test.ts`), `paths` (roads `kind:'road'`, `trail/` dirt, `water`), `markers`. Current origins: turfton (0,0); dust-flats
  (400,0) east; mossy-wood (-400,0) west; frostbite-fells (0,-400) north (-z); cloverfield-farms (0,400) south; loch-moss (-600,-600);
  tallgrass-commons (-600,600). The old regions' outer borders stop exactly at +-900, so the ring is four bands that tile the rest.
- Per-biome tables a new biome must be added to (compile errors will list them): `BiomeId` in `types.ts`, `REGION_BIOMES`/`RegionBiome` in
  `levels.ts`, `atmosphere.ts` `BIOME_PROFILES`, `sound/ambience.ts` `DAY`, `terrainMesh.ts` `GROUND_KIND`, `world.ts:686` `regionKind`,
  `fringe/belt.ts` `FRINGE_THEMES` (per RegionId), `data/regionThemes.json` (+ lore "Look and motifs"), `landforms/index.ts` `LANDFORMS`,
  `hud.ts` `MAP` colours, `GENERATORS`. Scatter generators `gta-*-scatter` live in `biomes.ts` (`buildBiomes`, props from
  `REGIONS[id].props`); a new region may start with `props: []` and an empty relief.
- Existing reservations: `reserve` markers (data `hw`,`hd`) are read in five places: `terrain.ts:145` (flatten within `TERRAIN.siteMargin`),
  `biomes.ts:376`, `cityScenery/site.ts:209`, `landforms/macro.ts:68` (macro mask), `settlements.ts:136`. `site` markers hold the fort and airfield
  (read by `config.ts` as `BASE`, `AIRFIELD`).
- Golden test: `src/layout.golden.test.ts` snapshots every batch and a biome raster over `WORLD_HALF` against `src/data/layout.golden.json`.
  `levels.test.ts` pins 900/895 (line 81), "one region per biome" (line 24), borders tile the map (line 99), old highways reach the edges (line 118).
- Net clamp: `net.ts` `POS_BOUND = 950` (rejects poses beyond it). `collide.ts` `clampToWorld(world.half)` is applied to player, NPCs, police,
  vehicles, boats, aircraft. Cull cells and traffic are position-based, no world constant (`cull.ts` `STATIC_CELL` 96; `traffic.ts` biome by `biomeAt`).
- Downtown: Turfton grid in `turfton.level.json` `data.grid` {half 215, lines -180..180 step 60, pitch 60}; block centres are odd multiples of 30.
  `world.ts:~935` block loop (`EDGES`, per-landmark `if (cx === X.x && cz === X.z)`, `placeTowers` inside `BUILDINGS.downtownRadius` 130, else garden blocks from
  `landscaping.ts`); parks are `src/parks/blocks.ts` `PARKS` (Gnorwin (-30,30) is built by `world.ts buildPark`, the other five by `src/parks/`), kiosks/alleys in
  `cityScenery/street.ts downtownBlocks()`, districts in `districts.ts`. Occupied blocks: mulch (-30,-30), hospital (30,30), thorne (30,-30), gnomecino (90,-30),
  bodega (-90,90), side-valve (-150,90), clay-mart (-150,150), pay-n-glaze (90,150), amphitheater (-90,-90), patio-heights (150,-150), parks at (-30,-150) (-150,-30)
  (-30,150) (150,30) (150,90). Rooftop billboards: `brands.ts` (-90,-30), (90,90).
- Water: `water.ts` reads `water` markers as reserved rectangles (`waterBodies()`), carved from the height grid by `carveWater`; `WATER.order` chains the navigable water.

## Proposed plan
**Bands** (placeholder ids, biome in brackets; borders are rectangles beyond the old square, tiled so the whole 2800 square is covered; world coords, +z south, north = -z):
`north-highlands` [highland] z -1400..-900 full width; `south-shore` [coast] z 900..1400; `east-campus` [campus] x 900..1400, |z|<=900; `west-estates` [estate] x -1400..-900, |z|<=900.
Each gets a spur highway appended to `layout.highways` joining an existing `*-outer` highway end (extend the dead ends; fix the test at line 118) and a minimal landform generator (copy `lochMoss.ts` shape).
**Landscape:** keep the north mountain: `mountain/fells` (300,-900) r260 becomes mid-slope, add a continuing range to z -1300 in `landscape.json`; move the rim to the new edge automatically.
**Slots** (centre x,z, half-size hw x hd; indicative, verify each with `terrainProbe`):
| id | where | centre | size | ground |
|---|---|---|---|---|
| ski-hill | highlands W | (-350,-1120) | 220x260, slope toward -z | raised, not flat |
| ice-lake | highlands W | (-640,-1030) | 90x70 | water reserve |
| toadstool-forest | highlands E | (250,-1150) | 300x200 | natural |
| rally-route | frostbite -> mountain -> forest | start (450,-760), finish (150,-1300) | corridor 24 wide | trail path + reserve at start/finish |
| wind-farm | highlands ridge | (850,-1180) | 300x90 | ridge crest |
| dirt-track | east N | (1150,-620) | 300x200 | flat |
| campus | east mid | (1130,-180) | 340x300 | flat |
| observatory-mound | east | (1240,140) | r120 | raised mound, flat summit r30 |
| runway-2 | east S | (1300,600) yaw 0, 420x24 | 460x80 | flat, same data shape as `airfield` |
| coast | south | shore z~1150, boardwalk (0,1140) | ocean water marker (0,1290) 2600x220 | water reserve |
| ferris-wheel / pirate-ship | coast | (-120,1120) / (240,1290) | 60x60 / 70x40 | flat / water |
| golf-yard | west S, via fence breach at (-895,640) | (-1180,620) | 360x420 | flat |
| vineyard, mansion | west N | (-1150,-120), (-1230,-120) | 360x300 | gentle slope |
| cult-camp | west far N, near the loch | (-1130,-640) | 180x180 | flat |
| mole-entrance | west edge of the wood | (-1000,360) | 30x30 | flat |
| construction-1..3 | Turfton fringe | e.g. (-300,-320), (310,260), (-120,330) | 60x60 | flat |
| court, skate-park | downtown blocks | (-90,-150), (-150,-90) | 50x50 each | in-block |
| homes (12) | 4 downtown, 8 settlement lots | ids `home-01..12` | per lot | assigned by E10 from `settlements.ts` lots |
**Downtown (L92):** park = Gnorwin (-30,30) + (-90,30) + (-30,90); the two 10 m street segments between them are repaved as grass (kerbs and crosswalk marks removed) but stay drivable, so
the road graph, GPS (`route.ts`) and traffic are untouched. Mega block = (90,-90)+(150,-90), the road x=120 (z -120..-60) runs under it as a tunnel: two wall boxes along the lane edges, a visual
roof slab ~8 m up, walkable top (see E05 rooftop contract). Update `parks/blocks.ts`, `world.ts` block loop, `cityScenery/street.ts downtownBlocks()`, `districts.ts` if needed.

## Contracts this epic provides
- `src/sites.ts`: `SiteId`, `Site { id, kind, region, x, z, hw, hd, yaw, epic, flat: boolean, anchors: Record<string,{x,z,yaw?}> }`, `SITES`, `siteById(id)`, `sitesByEpic(e)`, `siteRect(id)`,
  `anchorOf(id,name)`, `reservedRects()` (all `reserve` + `slot` rects, replacing the five loops above). Backed by a new marker kind `slot` (add to `MARKER_KINDS`, validate in `regionDocProblems`)
  in each region doc, data `{hw,hd,yaw,epic,flat,anchors}`. Slots with `flat:true` also flatten in `terrain.ts`; all keep scenery/fringe/traffic out. A test asserts slots do not overlap each other or any road.
- `Airstrip` generalisation: `AIRFIELDS: readonly Airfield[]` in `config.ts` (the desert `AIRFIELD` stays exported unchanged) so E13 can add runway 2 without rewriting 15 call sites.
- `MAP_EXTENT` (= `WORLD_HALF`) read by hud/E07; `POS_BOUND` derived from `WORLD_HALF` (+50).
- Reserved off-map coordinates (document, keep clear): cutscene rooms (3000,3000), glaze stage (4000,0), gun back room (4000,900), interiors from x >= 5000 (E05).
- Region/biome registration checklist (this brief's table) as a short section in `docs/roadmaps/gta-batch-3/E01/` so later epics add no more biomes.

## Contracts this epic consumes
None (wave 1). E04 names are placeholders; renaming a slot id is a one-line change.

## Online / mobile / achievements / prefabs / lore
- Online: `POS_BOUND` fix is mandatory or remote players in the ring vanish; nothing else is synced. Mobile: no new UI; check the map picture memory.
- Achievements: one "Edge of the Yard" style unlock per band entered, `packages/achievements/src/catalog.ts` (cosmetic reward from an existing prefab).
- Prefabs: ground-only, plus a few `construction-*` and signpost prefabs only if a slot marker prop needs one; no one-off meshes.
- Lore: add a `settings.md` row and a first-pass lore entry per band (E04 writes the prose; E01 uses placeholder names and a TODO ruling). `npm run lore` must pass.

## Risks and open questions (decisions taken)
- Minimap picture 2800^2 px (31 MB) is heavy on phones: decision, `buildBackground` draws at a scale of `min(1, 2048 / (2*half))` and the big map reads that scale; E07 builds zoom on top.
- Regenerating `layout.golden.json` is expected, but the old 1800 square must not change except the rim and fence: compare with `GOLDEN_OUT=` and review the diff by region before `UPDATE_GOLDEN=1`.
- Rim moves outward so the old edge hills (18 m rim) vanish; accepted. Old fence at 895 is removed, the new one is built at 1395; the golf breach is a gap in a Turfton-side wall built by E15, not the world fence.
- Terrain build time grows ~2.4x: measure with `perf.ts`; fallback is a coarser step (3 m) beyond |x| or |z| 900.
- Closing downtown streets was rejected (road graph, GPS, traffic and 30+ scripted routes depend on the grid); the park is a repaved, still drivable greenway.
- Biome per region means ~10 table edits per band; accepted, done once here.

## Done when
`npm run build -w games/gnome-theft-auto`; `npm test -w games/gnome-theft-auto` (levels, golden regenerated on purpose, new `sites.test.ts`); `npm test -w packages/achievements`;
`npm run lore`; dev server + `bash tools/smoke.sh <url> <marker>`; `npm run zfight -- <url>` (park, mega block, tunnel); `MAPDUMP=out.png npx vitest run src/terrainMap.probe.test.ts` shows the ring;
manual: drive to each band edge, fence at 1395, remote player visible at (1300,600), phone viewport map opens.

# E28 World expansion II: the European yard, nature preserve, roundabouts
Wave: 2 · Depends on: E01 · Kind: Engine
Source items: L99 (land, reslotting, nature-preserve ground, roundabouts and traffic-director hats, pushing existing
edges out), plus the Wasm kernel resize the orchestrator handed over.

- L99 add anotehr world expansion too, push into another yard. make it a whole kit and deal and just keep designing it
  out. The world should feel alive, the player should have the experience to visit a lot of areas. include a nature
  preserve too somewhere. continuing pushign existing environments out. may need to reslot a bit but yeah just keep it
  going non-stop. i think that the next yard should have a more european style city with closer buildings and ambling
  paths and make them a bit stereotypical in the satirical way we are already doing. kind of a parondonlin type of deal.
  it's a lot moree scope but i think the world will be better for it. adapt whatever we have planned to accomodate this.
  be ambitious and make sure to spend a lot of time detailing and environmentally story telling (add success criteira
  for that as part of AC for that task). more birds and animals too. more veicles as well. especially if we can start
  adopting european type vehicles. this will require another new set of prefabs, so make sure to build those. eorpean
  platns and backyard styling too. and include a new radio station for them that is just classical music or something.
  add trafic directing hats and roundabouts too

E28 owns only the ground, roads and engine parts of L99. The European prefab kit is E29; the town's buildings, people,
storytelling, classical radio and quests are E30; the preserve's life, more birds, animals and traffic vehicles and the
detailing of existing places are E31.

## Goal
Grow the map a second time and give the next yard its land: a European-style riverside town and a nature preserve,
with streets, footpaths, a river, squares and reserved sites for E30/E31; add roundabouts that traffic, the GPS and the
NPC chassis drive correctly, and traffic-director hat gnomes whose stop/go traffic obeys; make the Wasm kernel work at
the new size.

## Decisions (taken; later epics do not reopen them)
- **World size:** `worldHalf` 1400 -> **1800** (3600 x 3600, `fenceEdge` 1795). The terrain grid at step 2 grows from
  1401^2 to 1801^2 (13 MB of floats, 1.65x). 2000 was rejected as mostly empty land and twice the load time.
- **The new yard (town):** region `pardonlin`, name **Pardonlin**, biome `continental`, x -1800..-1400, z -900..1100,
  document origin (-1600, 100). A Paris/London/Berlin mash named for the polite "pardon" (one pun, apocrypha allows it).
  Another Tall One's garden west of Trellisdown, laid out as a formal continental garden: gravel walks, box hedges,
  a long garden rill the gnomes call **the Thymes** that runs north to south through the town into **Pardonlin Basin**.
  Entered through the old perimeter fence, which stays standing between Trellisdown and Pardonlin (x = -1397) with
  three gated gaps where roads pass, **the Wickets** (main gate: **the Grand Wicket** at z = -30), each with a customs
  hut (the Continentals stamp a gnome's hat on the way in).
- **The nature preserve:** region `the-unmown`, name **the Unmown**, biome `preserve`: an L in the north-west,
  x -1800..-200 at z -1800..-1400 plus x -1800..-1400 at z -1400..-900, document origin (-1000, -1500). A corner the
  Tall One stopped mowing; tall meadow, reed beds, scrub and old trees. Reached by the Unmown Road off the north-west
  ring corner.
- **Pushing existing places out:** Snowcap Rise (north-highlands) takes the rest of the new north strip and the NE
  corner; Rootwell (east-campus) takes the east strip to z 1100; Saltbucket Shore (south-shore) takes the whole new south
  strip plus the SW and SE corners. The `ocean` and `beach` slots widen to the new edge (E11 builds the water there).
  No existing site moves; every existing site id is kept.
- **Roads:** Pardonlin gets a dense irregular street net of narrow (7 m) lanes on both banks, three bridges over the
  Thymes, a quay road, and two roundabouts (**the Hatwheel**, the town's Étoile, and **Place du Pot**). Three entrance
  roads cross Trellisdown to the Wickets (north gate z = -500, Grand Wicket z = -30 via **Vineyard Lane** between the
  vineyard and Brassknock Manor, harbour road z = 1000 from the SW ring corner). Footpaths are `trail/` paths (no
  traffic): the Thymes Walk on both banks, the Jardin walks, alleys.
- **Roundabouts** are data: a road path whose id starts with `roundabout/` and whose points form a closed ring (first
  point = last point). `src/roundabouts.ts` finds them, and the road graph marks ring links one-way (anticlockwise
  seen from above with north up, i.e. the island on the driver's left, matching right-hand traffic) through a new
  optional `RoadNode.noDrive` list. Everything that walks the graph for driving (errands `planRoute` and `nextLeg`,
  GPS `route.ts`, `traffic.ts` re-routing, the ambulance) respects `noDrive`. Two existing junctions become roundabouts:
  the west band junction (-950, -30) (4 spokes: east, north, south and Vineyard Lane) and the east band junction
  (940, 40) (3 spokes). Entering traffic gives way to cars already on the ring.
- **Traffic-director hats:** `src/trafficDirectors.ts`: a list of busy junctions (three in Turfton, one in Pardonlin)
  where an HOA traffic gnome in a tall striped hat stands on a podium and alternates stop/go between the two axes every
  few seconds. Live drivers on a stopped axis stop at the line; ghosts in `trafficSim.ts` slow the same way. Hat Watch
  is not involved (keep it charming: the gnome whistles and turns).
- **Wasm kernel:** its memory layout is computed from the world size at start (raster, distance fields, height grid,
  scratch), memory grows to fit, the band, Pardonlin and Unmown relief/paint generators are ported, the
  `KERNEL_MAX_WORLD_HALF` guard goes, and the parity tests run again over the whole map.

## Scope
In: layout 1800/1795; two new region documents + biomes and every per-biome table; extended band borders; Pardonlin
streets, trails, the Thymes and the basin; the Unmown road and trunk trails; roundabouts (engine + data + island
visuals); traffic directors (engine + visuals); the Wickets fence and gates; site slots for E30/E31; landforms and
first-pass scatter for the two regions; band achievements and lore; map colours and POIs; the Wasm resize.
Out: town buildings, café rows, people, radio station content, quests (E30); preserve wildlife, hides content, more
birds/animals/vehicles everywhere (E31); European prefabs beyond what the gates, directors and islands need (E29).

## Code pointers (confirmed)
- World size: `src/data/world.layout.json` (`worldHalf`, `fenceEdge`, `regions`, `highways`). `WORLD_HALF` (config.ts)
  drives terrain (`GRID_N`), terrain mesh chunks, the macro grid, the rim, the fence (`biomes.ts`), `POS_BOUND`
  (`net.ts` = WORLD_HALF + 50), `MAP_EXTENT` (`sites.ts`) and the map picture (hud.ts, capped at 2048 px).
- Region/biome checklist (E01 contracts): `types.ts` `BiomeId`; `levels.ts` `RegionBiome`, `RegionId`, `REGION_BIOMES`,
  `GENERATORS`, `REGION_DOCS`, `REGION_PRIORITY`; `atmosphere.ts` `BIOME_PROFILES`; `sound/ambience.ts` `DAY`;
  `terrainMesh.ts` `GROUND_KIND`; `world.ts` `regionKind`; `fringe/belt.ts` `FRINGE_THEMES`; `data/regionThemes.json`;
  `hud.ts` `MAP`; `birding/species.ts` (3+ species per region); `landforms/index.ts` `LANDFORMS`; `biomes.ts` batches;
  `bandAchievements.ts`.
- Road graph: built in `world.ts` (~line 777) from the Turfton grid and `HIGHWAYS` (exact shared vertices join roads;
  a closed ring joins itself). Consumers of `links`: `errands.ts` (`planRoute`, `nextLeg`), `route.ts` (`astar`),
  `traffic.ts` (`driverFromHere`), `trafficSim.ts` (`simGraph` segments, undirected), `ambulance.ts`, `police.ts`,
  `events/spots.ts`, `hud.ts` (map drawing), `highways/roads.ts` (`addSkywayRoads`).
- Water: `water.ts` reads `water` paths (courses) and `water` markers (still bodies); a course not in `WATER.order`
  starts its own chain; road crossings become bridges (`WATER.bridgeClearance` per course id).
- Wasm: `assembly/kernel.ts` fixed pointers (lines 9-62), `src/wasm/gtaWasm.ts` (`KERNEL_MAX_WORLD_HALF`, static upload,
  per-region landform params), `scripts/build-wasm.mjs` (`--initialMemory 212 --maximumMemory 216`),
  `src/wasm/gtaWasm.test.ts` (skipped parity tests).

## Contracts this epic provides
Written up in `docs/roadmaps/gta-batch-3/E28/contracts.md`: the new regions and their slots (ids, labels, epics,
anchors), the street and trail ids, `roundabouts.ts` (`ROUNDABOUTS`, `roundaboutAt`, `isOneWayBlocked`/`canDrive`),
`RoadNode.noDrive`, `trafficDirectors.ts` (`DIRECTORS`, `directorPhase`, `directorStops`), the Wickets, and the Wasm
kernel's sizing rule.

## Contracts this epic consumes
E01's site registry, band documents, `reservedRects`, `POS_BOUND` rule and region checklist.

## Online / mobile / achievements / prefabs / lore notes
- Online: `POS_BOUND` follows `WORLD_HALF` (1850). Directors are deterministic from the clock (no sync needed).
- Mobile: no new controls; the map picture stays capped at 2048 px.
- Achievements: one per new region entered (Pardonlin, the Unmown), one for a full lap of a roundabout, one for
  waiting for a traffic hat's wave; cosmetic rewards from new prefabs (the HOA traffic hat among them).
- Prefabs: the traffic-director hat and podium, the Wicket gate and customs hut, roundabout islands (reuse fountains /
  planters where they fit).
- Lore: rulings for Pardonlin, the Thymes, the Wickets, the Unmown, roundabouts and traffic hats; a settings row update.

## Environmental storytelling (acceptance criteria, standing decision)
E28 builds ground, so its storytelling is at the thresholds it owns: (a) three vignettes: the customs queue at the Grand
Wicket (luggage, a stamped hat, a gnome being waved back), a rusting mower swallowed by the meadow at the Unmown's
entrance, a lost tourist's map and suitcase on the Hatwheel's island; (b) signs with jokes at each Wicket and the
Unmown gate; (c) residents doing something specific: the traffic-hat gnomes directing traffic; (d) ambience: per-biome
day ambience for both regions; (e) screenshot pass: three spots per new area recorded in `E28/screens.md` (or listed
as deferred when no browser can take them). The town and preserve interiors are E30/E31.

## Risks and open questions (decisions taken)
- Load time and memory grow with the map (1.65x grid): accepted; measured in the smoke run.
- Roundabout deadlock (everyone yielding): entering cars yield only to ring cars within a short window, and the
  existing wedged-driver recovery still applies; a sim test drives cars through a roundabout.
- Water through a dense town: bridges use a low clearance (`WATER.bridgeClearance.thymes`) so their ramps stay short.
- Golden layout changes everywhere the new roads and bands go: reviewed and regenerated on purpose.
- Rulings numbers may collide with E03/E05 at merge: the orchestrator renumbers.

## Done when
`npm run build -w games/gnome-theft-auto`; `npm test -w games/gnome-theft-auto` (levels, sites, roundabouts,
directors, Wasm parity, golden regenerated on purpose); `npm test -w packages/achievements` and `-w packages/prefabs` if
touched; `npm run lore`; dev server + `bash tools/smoke.sh` at spawn and in Pardonlin; `npm run zfight`.

# E11 Coast and boardwalk
Wave: 4 · Depends on: E01 (coast site and world extent), E04 (names, ties), E05 optional (interiors) · Kind: Content

Source items:
- L35 "add an ocean region with skiing and tubing so that gnomes can have fun. not sure hwo this will reconcile with the world but surely it won't matter. add some new quests, maybe tie in to some other quests. boardwalk too for sure. ferris wheel as well."
- L51 "add a pirate ship somewhere"

## Goal
A seaside region at the south end of the map: open water with real swell, a boardwalk with amusements and a rideable
ferris wheel, a pirate ship (landmark and place to visit, ideally boardable), and two water-fun activities: the existing
tubing extended with a **water-skiing** mode, and tubing on the open sea. Three to five new quests that start inside the
existing story and side-quest web and send the player to the coast.

## Scope
In:
- A water body for the ocean (carve, wave gain, boat traffic, swim/bob rules) placed in the E01 `coast` site.
- Boardwalk (planks, railings, stalls, lamp posts, a pier), amusements, a ferris wheel the player rides as a passenger
  (seated, rotating, view over the world, no steering), a pirate ship moored or beached (collider hull, walkable deck,
  cabin as an E05 interior if ready, else a deck-only set piece).
- Water skiing: a `ski` mode of the tow runtime (rider on skis behind a boat, faster speed band, wake-jump ramp, slalom
  buoy line). Tubing stays and gets an ocean buoy course.
- New quests, achievements with cosmetic rewards, map POIs and blips.

Out: new vehicle types beyond existing boats; weather (E06); snow skiing (L43, E12: share no code path beyond naming);
main-story act beats that visit the coast (E21 owns them; this epic provides the places and tie-in side quests).

## Code pointers (confirmed)
- `games/gnome-theft-auto/src/water.ts`: `COURSES` / `BODIES` built from `waterPaths()` / `waterBodies()` (world layout
  markers), `waterLevelAt`, `waterBedAt`, `waterDepthAt`, `carveWater`, `onWaterCourse`, `bodyRadius`, `shorePoint`.
- `src/config.ts` `WATER` block (~line 770): `order: ['river-upper','water/loch-moss','river-ravine','canal','river-farm','water/puddle-sea']`
  (each stretch is fed by the one before it, surface never higher) and `bodies: {'water/puddle-sea': {depth: 3, shelf: 0.6, bank: 10}}`.
  A new `water/<ocean-id>` goes in both. The `puddle-coast` POI is at `config.ts` ~line 593 (x 0, z 870, near `worldHalf` 900 in `data/world.layout.json`).
- `src/waves.ts`: `WAVES.bodyGain` (`'water/loch-moss': 1, 'water/puddle-sea': 1.35`), `waveAmplitudeScale`, `waveSurfaceOffset`,
  `seaState` / `setSeaState`, `registerCalmSpots` (calm lagoons at the pier and ski dock). `waves.test.ts` and `waveShader.test.ts` stay green.
- `src/boats.ts` and `src/craft/hull.ts` (`stepHull`, `hullSpecOf`) boat physics; `src/boatTraffic.ts` (`npcRoute`, `loopRoute('water/puddle-sea', 0.55, 6)` ~line 139) for NPC boats on the ocean.
- `src/tubing/`: `types.ts` (`TOW` tuning, `TubeState`, `Tubing`, `BoatPose`, `Sea`), `tow.ts` (`stepTube`, `newTube`, `hookPoint`, `scoreStep`),
  `course.ts` (`BUOY_GATES`, the Loch Moss hexagon at (-700,-665), `RUN_TIMEOUT_S`), `runtime.ts` (`installTubing`; `RACK = {x:-702, z:-548}`, the Mossbank
  tube rack; wired in `app.ts` ~lines 869, 1509, 1588, 1800, 2083), `view.ts` (`createTubingView`, `MAX_ROPES`). Vehicle kind `'tow-tube'` in `config.ts` ~415 and `types.ts` ~46.
  The ski mode is a second tuning plus a `mode: 'tube' | 'ski'` on `TubeState`, not a copy of the module.
- `src/jobs/` (`defs.ts`, `places.ts`): the boat-driver job can gain the ocean as a place. `src/swim.ts` (`swimState`), `src/waterlog.ts`, `src/wake.ts`.
- `src/mapPois.ts` (`placeBlips`, `landmarkBlips`), `src/mapIcons.ts`, `src/city/places.ts`: POIs and icons.
- Quests: `quests/sideQuests.ts`, `quests/newcomerQuests.ts`, `quests/types.ts` (`QuestDef`, `ObjectiveDef` kinds `visit`, `steal-deliver`, `chase-follow`, ...), `quests/objectivesDrive.ts`.
  Tie-in candidates found in lore: Driftwood and his trailer and "lawn sharks" (`apocrypha/driftwood-castaway.md`, `driftwoods-shark.md`), Baroness Brenda's Sovereign Republic of New Puddle (shore flags, `the-puddle-sea.md`), Clog Cruiser.
- `src/online/seaSync.ts`: sea state shared online; the ocean must use the same `waveTime()` clock.
- Prefabs: `tube-rack` and `tow-tube` exist (`packages/prefabs/src/catalog/`); a grep of catalog ids found no ferris wheel, pirate ship, pier or skis. Add them.

## Contracts this epic provides
- Exported constants: ocean body id, boardwalk bounds, ferris wheel and pirate ship positions (E21 set pieces, E18 pacing).
- `Tubing` rider records gain `mode`; `tubing.debug()` extended; ski tuning exported for tests.
- Quest ids prefixed `coast-`; a `coast` unlock condition E18 can reference for side-quest pacing.
- Achievements and rewards in `packages/achievements/src/catalog.ts` (`game: 'gnome-theft-auto'`).

## Contracts this epic consumes
- E01: the `coast` site slot (footprint, shore line, any water marker in `data/world.layout.json` regions), `WORLD_HALF` growth, a drivable road from southern Turfton. If E01 reserves only land, this epic adds the water marker plus the `WATER.order` / `bodies` entries.
- E04: coast characters and which existing quests the coast ties into (proposal above; E04 may overrule).
- E05 (optional): pirate-ship cabin or boardwalk arcade interior; else deck-only.

## Online / mobile / achievements / prefabs / lore notes
- Online: ski reuses the tubing relay (`SYS.tow` adapter in `tubing/runtime.ts`); the rider is relayed as a `'tow-tube'` vehicle, so add a `ski` flag to the existing record, not a new system. Ferris wheel angle is a pure function of `waveTime()` so there is nothing to sync. Net position bound is 950 (`docs/roadmaps/gta-online-sync.md`), below the new coast: E01 must raise it; flag it if not.
- Mobile: lean and hop already map to touch in tubing; ferris wheel board/exit and the ski jump need on-screen buttons >= 44 px, portrait and landscape.
- Achievements: ski distance, wake jump, full ferris wheel ride, find the treasure; cosmetic `head` / `neck` rewards through prefabs (bandana, eye patch).
- Prefabs: ferris wheel, pirate ship, pier and plank, skis, wake ramp, stalls, anchor, chest. Planks and flat decals use `flatLayer(material, LAYER.<x>)`; run `npm run zfight -- <url>`.
- Lore: `npm run lore -- find sea|ocean|pirate|boardwalk` found only Driftwood's "lawn-ocean", the Puddle Sea (R-038), Waterworks boardwalks and the Aether's pirate broadcasts. Add entries for each named place and a settings row.

## Risks and open questions (decision taken)
- An ocean next to a runoff-pool Puddle Sea. Decision: the new water is "the Lawn Ocean" beyond the Puddle Sea's south shore; gnomes take it as the real thing and Driftwood is vindicated. The Puddle Sea stays the channel to it. Record a ruling in `docs/lore/rulings.md` consistent with R-038.
- Wave and tow stability at higher swell. Decision: cap ocean `bodyGain` (target about 1.6) so `TOW.tooFast` and the lean fall-risk rules still allow a clean run; ski uses lower `launch` and wider `sideFast`.
- Ferris wheel cost. Decision: instanced gondolas, one `registerCull` group, no per-frame allocation, at most 12 gondolas.
- "Skiing" collides with L43. Decision: code names are `tubing/ski.ts` and "water-skiing"; E12 owns snow skiing.
- A sailing pirate ship. Decision: moored landmark with deck, cannon colliders and a treasure quest; sailing deferred.

## Done when
- `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, `npm test -w packages/prefabs`, `npm test -w packages/achievements`, `npm run lore`.
- New tests: ocean water level and carve (`water.test.ts` style), ski tow physics (`tubing/tow.test.ts` style), ferris wheel angle function, quest defs (`quests.test.ts`), ocean buoy gates in >= 1.5 m water (`tubing/course.test.ts` style).
- Dev server up: `bash tools/smoke.sh <url> <dom-marker>...` and `npm run zfight -- <url>`. Manual: drive to the coast, rent a tube, ski behind a boat, ride the wheel, board the ship, at 390x844 and desktop.

# E33 Mountain routes
Wave: 6 · Depends on: E12, E14 (and E31's Mittenholt and High Tarn) · Kind: Content
Source items: L116 "Add a few different routes on the mountains and such." Read with L117 ("I want the world to feel hand
crafted and that requires spending a lot of time on the details") and the standing decisions (keep the charm;
environmental storytelling is acceptance criteria).

## Goal
A few hand-made routes over high ground, each with its own character, that a player wants to drive, ride or walk for
the view and the small stories along the way. Snowcap Rise is "the high country" in the lore, yet its only real peak was
the ski hill; it gets a proper range at the north edge, **the Hatbrim**, and the routes live on it and on the Highland
Spine.

## Scope
In:
- **The Hatbrim** (new landscape features, `src/data/landscape.json`): **the Bobble** (about 105 m, the yard's highest
  point) and **Old Pate** (a bald dome, about 72 m), joined by a ridge, with **Brim Gap** (about 40 m) between them, on
  the north edge between Mittenholt (550, -1375) and the High Tarn (1000, -1600). Snow above 32 m comes from the
  north-highlands paint rule, rock on steep faces from the slope rule.
- Four routes (`src/mountainRoutes/`), each a `TrackDef` with 'ribbon' relief (cut and fill, grade-limited):
  1. **the Brim Gap Road** (road, cars): a pass road from the north band road east of Mittenholt, hairpins up Old Pate's
     west face to Brim Gap (the **Top Hat** café and lookout), down to the High Tarn's west shore and back to the band
     road. Guard rails, hairpin chevrons, gradient signs, lay-bys. In the road graph (traffic, GPS).
  2. **the Hatband** (track, bikes and buggies only): a gravel shelf round the Bobble's steep cone with a sheer drop
     outside and marker poles instead of rails, the World's Edge lookout over the north fence; bollard gates keep cars
     out. Not in the graph.
  3. **the Brim Walk** (trail, on foot): stile at Mittenholt, over Old Pate (cairn), across the road at Brim Gap, up the
     ridge to the Bobble's summit (summit cairn and **the Summit Register**), past **Pate's Bothy**, down to the High
     Tarn's bothy where it meets the tarn path.
  4. **the Spine Cut** (road, cars): a gorge road through the Highland Spine under **the Keyhole** (a rock arch left
     standing over the road), out across the moor to the east band road: a short cut across the Snowcap loop. In the
     road graph.
- Pads (level lay-bys, café terrace, lookouts, summit platform) beside the routes.
- Dressing per route: signs and posters with jokes, at least 3 story vignettes per route area (an abandoned picnic at a
  hairpin, a camper stuck on a hairpin, the summit register book, a rockfall...), residents doing something specific
  (the café owner, a cyclist fixing a chain, a surveyor at the Keyhole), wildlife and sound (wind on the tops, goat bells,
  the eagle, café clatter).
- Big map lines for the routes, blips for the trailheads and the café.
- Five achievements with wearable rewards (drive the pass; through the Keyhole; ride the Hatband; walk the Brim Walk;
  sign the Summit Register).
- Lore: entries for the Hatbrim, the four routes, the Top Hat and its owner; rulings from R-223 (E26/E32 may take
  numbers in parallel: renumber at merge with `tools/renumber-rulings.py`).

Out: a coastal clifftop road toward Saltbucket (the macro relief is masked to 0 within ~85 m of any water, so no cliffs
can stand at the sea without a water-masking change: deferred); real tunnels (the terrain is a height field: the Keyhole
is an arch over a cut instead); races on the routes (E26 owns race modes; the routes are `Track`s, so a later epic can
race them); quests (E20-E22 may use the places).

## Code pointers (confirmed)
- `src/raceTrack/trackDef.ts` `createTrack(def)`, 'ribbon' relief (`maxGrade`, `smooth`, `fade`, `shoulder`).
- `src/raceTrack/tracks.ts`: E33 adds `GROUND_TRACKS = [...ALL_TRACKS, ...ALL_ROUTES]` (relief, surfaces, fords,
  scatter keep-out); `ALL_TRACKS` stays the race list (E26 adds to `TRACK_IDS`; merge is additive).
- `src/terrain.ts` buildGrid: `GROUND_TRACKS` relief, then `applyPadRelief` (E33), after the flat sites.
- `src/landforms/macro.ts` + `src/data/landscape.json`: data, mirrored by the Wasm kernel as data (no kernel change).
- `src/highways/install.ts` `installSkyways` → `addMountainRoads(world.roads)` (E33).
- `src/app.ts`: `createMountainRoutes(scene, world, deps)` beside `createDirtCountry`.
- `src/living/config.ts` (Mittenholt, High Tarn), `src/living/highTarn.ts` (bothy, board, path).

## Contracts
See `E33/contracts.md` (written by the lead with the foundation; updated at the end).

## Online / mobile / achievements / prefabs / lore
- Online: nothing new to relay (terrain and routes are deterministic data; the register and progress are per player).
- Mobile: no new controls; the register uses the existing interact button.
- Prefabs: three catalog files `gta-mountain-roads.ts`, `gta-mountain-places.ts`, `gta-mountain-gear.ts`.
- Achievements: `gta-brim-gap-road`, `gta-spine-cut`, `gta-hatband`, `gta-brim-walk`, `gta-summit-register`.

## Risks and decisions
- Ribbons can dig trenches or build dykes if a line climbs faster than the land: the geometry tests bound cut/fill.
- Crossings (walk x road at Brim Gap, walk x Hatband): relief order trails, then tracks, then roads, so the road's grade
  wins; pads are levelled last and never touch a road's cells.
- New terrain under existing things: the Hatbrim keeps clear of Mittenholt and the High Tarn; the golden layout is
  regenerated by the lead after reviewing its diff.
- Traffic on hairpins: graph nodes every 5 m on bends; the drive-along test runs the casual chassis both ways.

## Done when
Build, tests (game, prefabs, gnome, achievements), lore, smoke and z-fight pass; drive-along tests pass for both roads
and the Hatband; screenshot pass (3 spots per route) under `E33/screens/`; perf check on the Brim Gap Road.

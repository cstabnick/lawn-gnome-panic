# Gnome Theft Auto: Wild World Roadmap (terrain, water, wildlife, boats, Tessie)

Goal: make the land outside Turfton as interesting as the city. Each region gets its own life (farm animals and a gang
of evil squirrels in Cloverfield Farms; snowmen, sgnowmes and very relaxed polar bears in Frostbite Fells; giant grass
and bees in a new parkland). A river runs through several regions into a loch, with boats to sail it. A turtle
inspired by the Loch Ness monster gets a side quest that unlocks at a random point in the story. The map grows to make
room, and the ground stops being flat.

This is the top-level plan. Each epic below is meant to be split into worker issues by the **decompose** skill in a
session of its own (`docs/roadmaps/gnome-theft-auto-wild-world/<epic>/`). Nothing here is built yet.

Game: [games/gnome-theft-auto](../../games/gnome-theft-auto/README.md). Lore setting: `apocrypha`
([R-021](../lore/rulings.md): fired clay cracks and is glued back; nothing bleeds; nothing gets wet, soaked or dripping).

---

## Where the game is today (what the plan has to work around)

- **The ground is flat.** `config.ts` says it: "The ground is flat everywhere (y = 0)". Around 94 places in `src/` set
  or assume `y = 0` (spawns, traffic, townsgnomes, police, props, parachute landing, destructibles). `collide.ts`
  `groundHeight()` only knows box tops. `@lawn/vehicle` already takes a `GroundProbe` (raycast, normal, surface
  velocity), so the driving model is ready for hills; GTA just passes it a flat one.
- **The layout is code.** `WORLD_HALF = 600` (a 1200 x 1200 map). `biomeAt()` splits the land outside Turfton along the
  diagonals. `HIGHWAYS`, `BASE`, `AIRFIELD` and the landmarks are constants in `config.ts`. `biomes.ts` (1209 lines)
  places everything procedurally. `world.ts` (1165 lines) builds one big ground plane plus four tinted wedges.
- **Surfaces exist.** `surfaces.ts` already has `asphalt | ice | snow | sand | mud | grass | farm` with driving feel per
  surface. Water will be one more kind.
- **Lore hooks to reuse:** the Frozen Birdbath Basin (an ice bowl in the Fells, `0, -350`); the Southern Drainage Canal
  (between Turfton and the farms, with a culvert portal at `-195, 195`); Driftwood the castaway, who babbles about
  "lawn sharks" and "open-ocean lawn-boats"; squirrels on Route West that "don't bluff".
- **Prefabs that already fit:** `snowman`, `snow-pine`, `snow-lodge`, `haystack`, `hay-bale`, `scarecrow`, `lily-pad`,
  `fishing-rod`, `rubber-duck`, `stag-beetle`. There are no farm animals, squirrels, bees, hives, bears, boats, docks,
  bridges or turtles yet.
- **Tools to adopt:** `@lawn/level` (level docs: base generator, stamps, paths, props, markers, chunked height deltas,
  paint grid) and `tools/level-editor` (one `GameAdapter` per game; Gnomomia, Club Gnome, Front, Golf, Gnomokemon and
  Snigms use it). Gnomomia's open world is the model for tiling: one level doc per zone, each placed at an origin
  (`src/data/layout.ts`).

---

## Decisions (made here; flag any you want changed)

1. **Adopt the level format, tiled by region.** The GTA world becomes level documents in
   `games/gnome-theft-auto/src/data/levels/`: one `<region>.level.json` per region (Turfton, Dust Flats, Mossy Wood,
   Frostbite Fells, Cloverfield Farms, plus the new regions), each with its own origin and bounds, like Gnomomia's zones.
   A `world.layout.json` (or `layout.ts`) lists the tiles. Why: the river, the loch, animal pens, herds, docks, hills
   and squirrel dens are spatial work that is painful as TypeScript constants and easy in the editor. A doc per region
   keeps files small, gives each worker a separate file to edit, and lets the editor open one region at a time.
2. **Data moves, code stays.** Like Level Format stage 2, the generators (dunes, ridges, rolling fields) stay in code
   as registered `base` generators. The numbers, stamps, paths and placements move into the docs. A golden fixture of
   today's layout is captured first, and the migration is done when it still passes, unedited.
3. **One height function.** `src/terrain.ts` exposes `heightAt(x, z)`, `normalAt(x, z)`, `surfaceAt(x, z)` and
   `waterAt(x, z)` (surface height and depth, or null), built from the docs. Everything that puts something on the
   ground asks it. Roads, Turfton and the big flat sites (the fort, the airfield, the farmyards) are flattened by
   stamps, so the city plays exactly as it does now.
4. **The map grows to 1800 x 1800** (`WORLD_HALF` 600 to 900, 2.25x the area). Turfton stays at the centre, unchanged.
   The four biomes reach further out, and the corners become new regions (see the map below). Region borders become
   polygons in the docs; the diagonal rule in `biomeAt()` is removed.
5. **Ground is chunked.** The terrain mesh is built in 64 m chunks (about 2 m vertex spacing), with chunks beyond the
   fog skipped, and the critters and dressing culled by distance, following Gnomomia's perf work (#325). 1800 m at
   2 m spacing is about 810k vertices, too many for one mesh on a phone.
6. **Boats are the game's own physics**, not `@lawn/vehicle` (which models wheels). It is a small buoyancy-and-thrust
   hull model in `src/boats.ts`, using the same input, camera, seats, mount and net code as mowers. It moves to a
   package only once a second game wants boats.
7. **Critters share one runtime** (`src/critters.ts`): spawn by region, wander, flee, chase, get knocked over, LOD.
   Each region's animals are data plus a small behaviour file. Animals never die: a shot or a hit knocks them over in
   a puff of fluff or feathers and they run off, the same as townsgnomes putting their hands up.
8. **Animal bodies are prefabs.** Cows, squirrels, bears, bees and the turtle are `PrefabDef`s (`stag-beetle` shows
   that creatures fit the catalog), with named parts that the game animates. Sgnowmes are gnomes, so they are built
   with `createGnomeModel` and a frosty look, never as a one-off model.
9. **Online:** terrain and water come from the docs, so every player sees the same land. Boats are relayed like mowers
   (`net.ts` / `remotes.ts`), with passenger seats. Critters stay local to each browser, like townsgnomes and traffic.
   The Tessie quest is single-player, like the rest of the story.
10. **Mobile:** boats use the drive stick, and bobbing in water uses the walk stick. No new buttons beyond what mowers
    have. The epics that add UI (the map, the quest) are checked at 390x844 and 844x390.

### Proposed region map (1800 x 1800, north is -z)

```
   x: -900 ............................... 0 ............................... +900
z
-900 +----------------+---------------------------------+----------------------+
     |  LOCH MOSS     |        FROSTBITE FELLS  (high: the house side)         |
     |  highland glen,| sgnowme village, polar-bear lounge, snowman field      |
     |  Tessie   <~~~~~~~~~~ river <~~~ Basin thaw outlet (0,-350)             |
     |     ~          |                                                        |
     +-----~----------+------------+------------+---------+--------------------+
     | MOSSY WOOD     |            |            |         |  DUST FLATS        |
     | ravine ~       |            |  TURFTON   |         |  dunes, mesas,     |
     |  sawmill ~     |            | (flat,     |         |  Fort Sandpit,     |
     |           ~ culvert (-195,195)  unchanged)|         |  airfield          |
     +-------------~~~~ SOUTHERN DRAINAGE CANAL (locks, wharves) ~~~~----------+
     | TALLGRASS      | CLOVERFIELD FARMS           ~                          |
     | COMMONS        | pens, Drey Gang dens,        ~ sluices, mill pond      |
     | giant grass,   | rolling hills, terraces       ~~~~                     |
     | bees, hives    |                                   ~~~~ PUDDLE SEA      |
+900 +----------------+------------------------(low)-- New Puddle marina ------+
```

The river rises at the Frozen Birdbath Basin's thaw outlet, runs west through the Fells into **Loch Moss**, leaves the
loch south through Mossy Wood's ravine, enters Turfton's south-west corner at the culvert portal (`-195, 195`) and
becomes the **Southern Drainage Canal** along the city's south edge, then turns south through Cloverfield Farms and
spreads into the **Puddle Sea** on the south edge (the open water that Baroness Brenda's New Puddle already claims).
That is five regions, with bridges where it crosses `ring-nw`, `west`, `ring-sw` and `south`. The north-east and
south-east corners stay extensions of their neighbours for now (room for later).

### The water makes sense twice: the Tall Ones' plumbing and the gnomes' waterworks

Canon ([canon.md](../lore/canon.md) 1 and 3): the world is a garden seen from gnome height, and the Tall Ones are never
seen, only their huge traces. So every stretch of water has two readings. **The Tall-One reading** decides *where the
water is and which way it runs*: it is ordinary garden plumbing at giant scale, and the layout has to make sense as a
real back garden. **The gnome reading** is what's on screen: a civilization built in the Tall Ones' absence dammed it,
locked it, named it and built along it. When the two disagree about anything visible (names, buildings, bridges,
boats, who controls what), the gnomes win. The Tall-One reading is never spoken in the game. It shows only as hints:
a hose nozzle sticking out of a hillside, a mossy pond-liner edge, the concrete lip of a gutter.

| Stretch | What it is to the Tall Ones (never said) | What it is to the gnomes (on screen) |
|---|---|---|
| Source | The birdbath (already the Basin) overflows, fed by a garden hose left dripping since they left, up by the house | The Frozen Birdbath Basin's thaw outlet; the Fells gnomes' "Everspring", where the Carburettors' drift arena drains |
| Upper river | The runoff swale down the side of the garden | A fast, rocky stream with the sgnowmes' ice-mill and a ford |
| Loch Moss | The overgrown ornamental pond in the back corner, gone wild, with a pond-liner rim and a tipped stone heron | A highland loch: the Watering-Can Steamer ferry, a fishing village on stilts, a gnome-built weir at the outlet |
| Ravine | The pond's overflow trench, cut through the shrubbery bed | Mossy Wood's ravine, with a waterwheel sawmill and a rope bridge |
| Canal | The concrete storm gutter along the patio and driveway (lore: "built by the Tall Ones for rainwater runoff") | The Southern Drainage Canal: lock gates, Old Brick and Industrial wharves, the culvert portal, Brenda's bike gang on the bridges |
| Farm river | The vegetable patch's irrigation channel | Cloverfield's river, with gnome sluices feeding the field ditches and a mill pond |
| Puddle Sea | The low corner of the lawn where all the runoff pools | The Puddle Sea and the Sovereign Republic of New Puddle: marina, beach, the place Driftwood washed in from |

Two rules for the layout:

- **The water runs downhill.** The garden slopes gently from the house (north, the Fells) to the low corner (south, the
  Puddle Sea), so the terrain gets a regional tilt and the river bed must never rise along its path (a test in Epic 4).
  The loch sits in a dip that a real pond would sit in.
- **Gnome engineering explains everything the Tall Ones wouldn't have left:** locks where the canal has to step down,
  weirs that hold the loch level, sluices into the fields, bridges sized for mowers. Each one is a prefab with gnome
  branding (and a sponsor, since this is Turfton).

Tessie fits both readings: to the Tall Ones she is the pet pond turtle they left behind, still living in the pond years
later; to the gnomes she is a giant, ancient monster that most of Turfton thinks is made up.

Names (Loch Moss, Tallgrass Commons, Tessie, the Drey Gang) are proposals. Each one is checked with
`npm run lore -- find` and recorded in `docs/lore/` by the epic that adds it.

---

## Shape

| Epic | Name | Depends on | Done when | Likely issues |
|---|---|---|---|---|
| **1** | World as level documents (flat parity) + editor adapter | none | golden layout fixture passes unedited; the editor opens and saves GTA regions; build, tests, smoke | ~5 |
| **2** | Terrain engine: heights everywhere | 1 | every system stands on `heightAt`; amplitude 0 is byte-identical to Epic 1; hills drivable; zfight clean | ~6 |
| **3** | World expansion and the region map | 1 (2 may run alongside if file ownership is split) | 1800 x 1800 map, region polygons, new highways, Loch Moss and Tallgrass Commons exist (empty); minimap and big map updated | ~5 |
| **4** | Water, bridges and boats | 2, 3 | the river, loch and Puddle Sea carved, running downhill and rendered; bridges; mowers stall in deep water; 4 boats drivable, seated, online | ~6 |
| **5** | Terrain variation per region | 2, 3 | each region has its own landforms and surface paint, authored in the editor | ~6 (one per region) |
| **6** | Wildlife and region life | 3 (2 for placement on hills) | the critter runtime, plus farm animals, Drey Gang, Fells folk, Commons grass and bees | ~6 |
| **7** | The Tessie side quest | 4 (6 nice to have) | random story unlock, the quest playable end to end, saved in the cloud | ~4 |
| **8** | Integration: radio, achievements, perf, lore, docs, demos | all | full checks, phone viewport, perf budget, demos in the PR | ~5 |

Epics 4, 5 and 6 can run in parallel sessions once 2 and 3 have merged, as long as each one keeps to its own files
(below). Epic 7 needs boats. Epic 8 is last.

---

## Epic 1: World as level documents (flat parity) + editor adapter

**Why first:** everything later is authoring (river courses, hills, pens, docks). Do it once, in the editor, not in
`config.ts`.

- **Planner foundation:** capture `layout.golden.json` from today's code (highways, landmarks, fort, airfield, givers,
  every biome prop `biomes.ts` places, with its seed). Define the GTA `data` block types (region id, ground colour,
  surface defaults, spawns for traffic and townsgnomes).
- **Issues (sketch):**
  - Region docs: write `turfton`, `dust-flats`, `mossy-wood`, `frostbite-fells`, `cloverfield-farms` `.level.json` from
    the constants (paths = highways, props = landmarks and biome dressing, markers = givers, spawns, garages).
  - Loader: `src/levels.ts` reads the docs; `config.ts` keeps tuning only, and its layout constants become derived
    values so existing imports keep working.
  - `biomes.ts` / `world.ts` read placements from the docs instead of placing them procedurally (the seeded scatter
    stays in code as a generator; hand-placed things move to props).
  - Editor: `tools/level-editor/src/adapters/gta.ts` (+ `gtaLevel.ts`, `gtaObjects.ts`, `gtaProfile.ts`), opening
    one region tile at a time, with the prefab picker and roads mode.
  - Tests: the golden test, a doc validator (`npm test -w games/gnome-theft-auto`), editor e2e for GTA.
- **Out of scope:** any visible change. The game must look and play the same.

## Epic 2: Terrain engine: heights everywhere

- **Planner foundation:** `src/terrain.ts` (`heightAt`, `normalAt`, `surfaceAt`, with a stub `waterAt` returning null), the
  chunked ground mesh builder, and `TERRAIN.amplitude` (0 = flat). Road and city flatten stamps generated from the
  highway paths and the Turfton square.
- **Issues (sketch), split by who touches the ground:**
  - Player, on-foot collision, parachute landing, ragdoll (`player.ts`, `collide.ts`, `ragdoll.ts`).
  - Vehicles and planes: a `GroundProbe` built on `heightAt`/`normalAt` for `@lawn/vehicle`; planes' take-off and
    landing height; `simdrive.ts`, `mount.ts`.
  - Traffic and road graph (`traffic.ts`), police (`police.ts`, `ambulance.ts`): follow the road height.
  - Townsgnomes, vibe NPCs, encounters, world events, quest markers, givers (`npcs.ts`, `vibeNpcs.ts`,
    `ambientGnomes.ts`, `encounters.ts`, `worldEvents.ts`, `quests/*` marker placement).
  - Props and dressing (`biomes.ts`, `districts.ts`, `worldDetails.ts`, `destructibles.ts`, `easterEggs.ts`,
    `brands.ts`): sit on the ground and lean to it where it makes sense.
  - Camera (`camera.ts`): don't clip into hills; the minimap gets a hillshade.
- **Rule:** with `amplitude = 0` the golden fixture and the existing tests pass unchanged. A test hill (one gauss stamp
  in the Dust Flats) proves that mowers, traffic and the player cross it.
- **Risk:** this is the epic most likely to break things everywhere. Run `tools/smoke.sh` and `npm run zfight` at the
  end, and drive every vehicle over the test hill.

## Epic 3: World expansion and the region map

- `WORLD_HALF` to 900; region polygons in the docs; `biomeAt()` becomes `regionAt()` (a lookup over the polygons, with
  a coarse raster cached for speed). `BiomeId` gains `loch` and `parkland`.
- New region docs `loch-moss.level.json` and `tallgrass-commons.level.json` (ground colour, bounds, flat for now).
- Highways: the current ones reach the new edges; a new spur to Loch Moss and one into the Commons; the ring road
  adjusted. The river course is **reserved** here as a path of kind `water` (nothing carved yet), so the roads already
  meet it at the four bridge points.
- Fog and view distance, traffic density and townsgnome spawn rules re-tuned for the larger map.
- Minimap and big map (`hud.ts`): new extents, region names, the reserved river drawn.
- Online: players far apart still show on the map (no change to the relay, but check the position packing range).

## Epic 4: Water, bridges and boats

- **Lore first (ruling):** what happens to a clay gnome in deep water, without anything getting wet. Proposal: fired
  clay gnomes are hollow, so they **bob** upright like a fishing float and paddle slowly; no firing while bobbing.
  Mowers that drive into deep water **conk out and sink**, and come back later like a wrecked mower. Shallow water
  (the canal floor, fords) is drivable and slows you down.
- **Issues (sketch):**
  - Water bodies: `waterAt()` from the `water` paths (river: width and depth along the path) and polygons (loch,
    Puddle Sea); beds carved into the terrain by stamps; water surface meshes on a draw layer, shore foam, flow
    animation that runs downhill; `water` surface kind. Test: the river bed never rises along its path, and the canal
    only steps down at a lock.
  - Gnome waterworks (see "The water makes sense twice"): canal lock gates, the loch weir, field sluices, a waterwheel
    mill, wharves; the Tall-One hints (hose nozzle, pond-liner rim, gutter lip) as quiet scenery.
  - Bridges: a bridge prefab sized to the road; the ground probe and `heightAt` return the deck on the bridge; boats
    pass under it.
  - Boat physics: `src/boats.ts` (buoyancy at four points, thrust, rudder, drag, wake), boats beached on shore stop.
  - Boats as vehicles: new `VehicleKind`s with prefabs (garden-scale proposals: **Walnut Dinghy** (rowing, slow, 2
    seats), **Gravy Boat** (speedboat), **Clog Cruiser** (mid, 4 seats), **Watering-Can Steamer** (slow ferry on the
    loch)); mount styles from a dock; seats; radio; net relay.
  - Docks and marinas: dock prefabs and boat spawns at the loch, the canal wharves and the New Puddle marina; a few
    NPC boats.
  - Hat Watch on water: at 3+ hats an HOA patrol boat joins in.
- **Mobile:** boats use the drive stick; the Enter button boards from a dock.

## Epic 5: Terrain variation per region

Content, done mostly in the editor, one issue per region doc, all parallel (each issue owns one `.level.json` and its
deltas file):

| Region | Landforms | Surface paint |
|---|---|---|
| All | a gentle tilt from the north (the house side) to the Puddle Sea, so the water runs the right way | |
| Dust Flats | dunes (generator), mesas and a canyon; flat fort and airfield | sand, packed dirt on the tracks |
| Mossy Wood | rolling floor, the river ravine, mossy boulders | grass, mud along the river |
| Frostbite Fells | ridges, a glacier tongue, the Basin bowl kept flat for the drift arena | snow, ice on the Basin and the frozen ponds |
| Cloverfield Farms | gentle rolling hills, terraced fields, a raised farmyard | farm rows, mud in the pens |
| Tallgrass Commons | soft meadow mounds, a hilltop for the hives | grass |
| Loch Moss | steep glen walls, a shingle shore, an island for Tessie's lair | grass, gravel shore |

Shared work: a slope-and-height paint rule (steep ground becomes rock, low ground near water becomes mud), rock and
cliff prefabs if none fit, and off-road dirt trails as paths of kind `road` with a `trail` style.

## Epic 6: Wildlife and region life

- **Planner foundation:** `src/critters.ts` (spawn tables by region, wander, flee, chase, knocked-over reaction,
  distance LOD and culling, a hit hook for weapons and vehicles).
- **Issues (sketch), one per region plus prefabs:**
  - **Prefabs:** cow, sheep, pig, hen, squirrel, polar bear, bee and hive, giant grass blade (instanced), deck chair if
    none fits, sgnowme gear (earmuffs or a scarf) for the gnome's `head`/`neck` slot.
  - **Cloverfield Farms, animals:** herds in pens and loose fields; they scatter from mowers; tipping a cow is a stunt.
    The combine and the mulch spreader herd them.
  - **Cloverfield Farms, the Drey Gang (evil squirrels):** dens in the hedgerows and the silo; they steal Acorns from
    your pockets (`economy.ts`) and pelt you with acorns, which chips your clay; they mob a parked mower and drive
    off with it now and then. Shooting them scatters them; they regroup. A radio bulletin when they raid.
  - **Frostbite Fells, the locals:** a snowman field (destructible, they rebuild overnight); a sgnowme village with
    townsgnomes in a frosty look (`createGnomeModel`, `randomTownLook` with a snow palette); **really chill polar
    bears** lounging in deck chairs with sunglasses, who never get angry: shooting or ramming one gets a slow shrug,
    and they never join a fight.
  - **Tallgrass Commons:** giant grass that hides you on foot (the Hat Watch loses sight of you inside it) and slows
    mowers (a mower mows a path, which grows back); bees around flowers and hives; knocking a hive sends a swarm
    after you that chips your clay until you reach water or outrun it.
- **Lore:** what sgnowmes are (proposal: tundra gnomes glazed with frost-white glaze who call themselves sgnowmes;
  still fired clay, so no melting), the Drey Gang entry, the polar bears' entry, the Commons' entry.

## Epic 7: The Tessie side quest

A *Strangers & Freaks*-style quest built on the existing quest engine (`quests/types.ts`, cutscenes, `@lawn/mutter`).

- **Random unlock:** when a save starts the story, roll one trigger beat from the story objectives in chapters 1 to 4
  and store it in `gta-quests-v1` (so cloud saves keep it). When the player reaches that beat, a Turfton FM breaking-news
  bulletin reports "something big in Loch Moss", and Driftwood turns up at the loch as the quest giver ("I told you
  about the lawn sharks..."). Old saves already past their beat get it at their next objective. A dev switch
  (`?tessie=now`) unlocks it at once.
- **Quest arc (proposal, 4 to 5 steps):** follow sightings around the loch by boat at dusk; set out sonar buoys
  (Hat-Watch-free stealth by water); the HOA wants the loch drained for a golf development, so you escort the turtle's
  egg clutch past a dredger; Tessie surfaces, a huge, ancient turtle with a mossy shell, and you ride her back across
  the loch; at the end you choose whether to sell the photo to the tabloids (Acorns) or keep her secret (a cosmetic).
- **Afterwards:** Tessie sometimes surfaces in the loch for everyone (a world event), and you can ride her again.
- **Achievements:** one for the unlock, one for finishing, one per ending; the reward is a turtle-shell `back` gear prefab.
- **Online:** single-player like the rest of the story; Tessie's appearances afterwards are local world events.

## Epic 8: Integration

- Turfton FM: bulletins (squirrel raids, Tessie sightings, polar bear weather reports), boat and marina adverts,
  traffic reports for the bridges (`src/radio/content.ts`; no wetness on air, R-021).
- Achievements for the new regions and boats (`packages/achievements/src/catalog.ts`), each with a gear reward
  (proposals: Herd It Through the Grapevine, Unbearably Chill, Drey Day, Bee Line, Captain Clay).
- Perf budget on a phone-class viewport: chunk culling, instanced grass and animals, critter LOD; a frame-time check
  driving across all regions.
- A party slice idea for the backlog: a boat regatta round on the loch (`packages/party/README.md` row).
- Lore: Loch Moss, Tallgrass Commons, Tessie, the Drey Gang, sgnowmes, the polar bears, the boats; `npm run lore`.
- README, `AGENT_INDEX.md`, demos (a river run by boat, the Drey Gang raid, Tessie surfacing), smoke check, zfight.

---

## Open questions for you

1. **Gnomes in water:** bob like a float (proposed), sink and walk the bottom, or get washed back to shore?
2. **Sgnowmes:** frost-glazed clay gnomes (proposed), or real snow gnomes that melt in the desert?
3. **Parkland:** a new corner region, Tallgrass Commons (proposed), or should Turfton Park & Arts inside the city get
   the giant grass and bees?
4. **Map size:** 1800 x 1800 (proposed) or bigger. Bigger pushes chunk streaming (load and unload tiles) into Epic 3.
5. **Tessie's end choice:** a two-way choice (proposed) or one fixed ending?
6. **Tall-One hints:** quiet scenery only (proposed: a hose nozzle, a pond-liner rim, a gutter lip), or should a
   quest (Tessie's, say) point at the garden-plumbing reading outright?

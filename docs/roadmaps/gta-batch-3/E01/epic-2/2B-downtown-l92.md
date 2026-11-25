Epic: E01-2 Fill (GTA batch 3, world expansion)
Depends on: none

## Environment
- Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af7a6a91d2dd2fbef` (a git worktree). Game: `games/gnome-theft-auto` (three.js, Vite, TypeScript).
- Git Bash. If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. `node_modules` is installed.
- Other workers are editing other files of this game at the same time: `src/hud.ts`, `src/biomes.ts`, `src/landforms/*`,
  `src/app.ts`, the four band level documents, `docs/lore`. Touch only the files listed under Change. Do not commit.
  Do not run `vite build` or a dev server.
- Keep each file's line endings as they are (use the Edit tool; for new files any is fine).
- `src/layout.golden.test.ts` fails on purpose right now (the world grew); never touch `src/data/layout.golden.json`.
- Repo rules that apply: read `AGENTS.md` sections "3D scenes must not z-fight" (anything flat on the ground or on
  another surface takes `flatLayer(material, LAYER.<x>)` from `@lawn/depth`; touching boxes must not share a face;
  docs/rendering.md) and "New objects go through the prefab library" (benches, trees, hoops, lamps... are `@lawn/prefabs`
  prefabs placed with the existing park kit; only the building shell, slab and paving are built here, which no prefab
  expresses).

## Goal
Source item L92: "take out 3 of the blocks in the main square and make a contiguous park. then make one mega 2x1 with a
tunnel underneath somewhere else." After this issue:
1. **The park.** Downtown Turfton's Gnorwin Clayfoot Park block (-30, 30) is joined by the block west of it (-90, 30)
   and the block south of it (-30, 90): three blocks, one park. The two towers blocks become park. The two streets
   between them (x = -60 for z 0..60, and z = 60 for x -60..0) are repaved as a park promenade (light paving, no kerb
   lamps on the park side) but stay drivable roads: the road graph, GPS, traffic and parked mowers are NOT changed.
2. **The mega block.** Blocks (90, -90) and (150, -90) become one 2x1 building over the street x = 120 between the
   crossings z = -120 and z = -60. The street runs through it in a tunnel: the two building halves stand on the block
   footprints, and a roof slab joins them over the street at 8 m, so the whole thing reads as one long block with a
   road tunnel through its middle. The slab's top is a walkable roof later (another epic adds rooftops; here it is only
   built and its rectangle exported).

## Site registry (already in the code; read, do not edit)
`src/sites.ts` exports `siteById(id)`, `siteRect(id)` and `anchorOf(id, name)`. Relevant sites (world coordinates):
- `basketball-court`: centre (-90, 30), hw 20, hd 14 (a court goes here later, epic E19). Inside the new park block (-90, 30).
- `skate-park`: centre (-30, 90), hw 20, hd 20 (a skate park goes here later, E19). Inside the new park block (-30, 90).
- `double-pot`: centre (120, -90), hw 51, hd 21 (x 69..171, z -111..-69), `overRoad: true`, anchors `roof` (120, -90),
  `tunnel-north` (120, -111), `tunnel-south` (120, -69). The story names it **the Double Pot** (Thorne Lawn & Order's 2x1
  tower over the street) and its tunnel **the Double Pot Tunnel**; the park is **Founders' Green**.
- `home-01` (-90, 140) 24 x 16, `home-02` (80, -150) 20 x 30, `home-03` (102, -150) 16 x 24, `home-04` (-150, 30) 20 x 20,
  `saucer-court` (30, 90) 42 x 42: town homes and the player's block of flats, filled by a later epic (E10). Three homes
  sit in ordinary garden blocks: gardens must keep out of them (see Change, world.ts).
Street scenery and park dressing already keep out of every site rectangle (`cityScenery/site.ts` reads `reservedRects()`),
so the park layout you write will automatically leave the court and skate-park rectangles empty: leave them as plain
grass for E19.

## Read first
- `games/gnome-theft-auto/src/world.ts`: constants at the top (`HALF_ROAD`, `SIDE_OFF`, `BLOCK_INSET` = 9, `EDGES`,
  `CITY_SEG`, `PARK_CENTRE`, `crossCuts`, `strip`, `merged`), the road/sidewalk/lamp drawing (search `lampSpots`,
  `crossCuts()`, `strip(`), `buildPark`, `parkWalkPoints`, `addTower`/`placeTowers` and the block loop
  (`for (let i = 0; i < EDGES.length - 1; i++)`, ~line 879): each block centre `(cx, cz)` is an odd multiple of 30, the
  block rectangle is the 60 x 60 cell minus `BLOCK_INSET` on each side (42 x 42).
- `games/gnome-theft-auto/src/parks/blocks.ts` (`PARKS`, `isParkBlock`), `src/parks/layouts.ts` (`LAYOUTS`, `planParks`),
  `src/parks/kit.ts` (`parkCtx`, `perimeter`, `patch`, `bench`, `lamp`, `tree`, `noticeboard`, `gnome`, `floorPatch`,
  `dressAt`: the park kit, local (u, v) coordinates in metres from the block centre), `src/parks/layoutA.ts`
  (`layoutGnorwin`, `layoutKilnsideRec` as examples).
- `games/gnome-theft-auto/src/cityScenery/street.ts` `downtownBlocks()` (~line 243): it already skips every block in
  `PARKS`, so adding the two blocks to `PARKS` removes kiosks and alleys there.
- `games/gnome-theft-auto/src/sites.ts` (read only).
- `games/gnome-theft-auto/src/towers/` (how `buildTowers(scene, towerSpecs)` styles a `TowerSpec`; read only).

## Change
- `src/parks/blocks.ts`: add two `ParkId`s and `PARKS` rows for the new park blocks, named as parts of one park,
  Founders' Green: `{ id: 'gnorwin-courts', name: "Founders' Green", x: -90, z: 30 }` and
  `{ id: 'gnorwin-skate', name: "Founders' Green", x: -30, z: 90 }` (leave Gnorwin's own row as it is; a later story
  quest renames the whole park). `isParkBlock` stays as is (they are not
  'gnorwin', so it returns true for them). Update the file comment.
- `src/parks/layoutC.ts` (new): `export function layoutGnorwinCourts(c: ParkCtx): void` and
  `export function layoutGnorwinSkate(c: ParkCtx): void`, written with the park kit like `layoutA.ts`: perimeter
  hedge or civic railing that leaves the sides facing Gnorwin open (`skipSides`), a few benches, lamps and trees in the
  margins round the reserved rectangle, paving paths joining to Gnorwin's side. Keep everything outside the reserved
  site rectangle (the kit's placement already refuses it; do not fight it).
- `src/parks/layouts.ts`: register the two layouts in `LAYOUTS`.
- `src/world.ts`:
  - In the block loop, the two new park blocks must not get towers: test `isParkBlock(cx, cz)` BEFORE the
    `downtownRadius` tower branch. To keep every later random draw the same as before, still consume the random
    numbers `placeTowers(block)` would have drawn (write a small `skipTowers(block)` that makes the same `rnd()` calls
    in the same order without placing anything), then `continue`.
  - The mega block: when the loop reaches (90, -90) or (150, -90), do not run the normal branch; instead, once (at
    (90, -90)), call `buildMegaBlock(...)` from the new `src/city/megaBlock.ts` (below), which adds two `TowerSpec`s via the
    existing `addTower` (so `buildTowers` styles them like the rest of downtown; same height for both halves, between
    `BUILDINGS.towerMinHeight` and `BUILDINGS.towerMaxHeight`, capped below the intro camera path the way
    `placeTowers` caps), and at (150, -90) just `continue`. Keep the random draws the two blocks consumed before
    (90, -90) drew via `placeTowers`; (150, -90) drew via `planGardenBlock` - consume them the same way (call
    `planGardenBlock(block, rnd, () => true)` and throw the result away, as the park-block branch already does).
  - The promenade: where the grid road surface, kerbs, sidewalks and lamps are drawn, the two park streets
    (x = -60 for z in [0, 60], z = 60 for x in [-60, 0], between the crossings) get: a light paving overlay over the road
    surface (one merged mesh, material `flatLayer(..., LAYER.marking)` or the layer the crosswalk marks use, so it
    never z-fights the road), sidewalks on those stretches drawn as paving too, and no street lamps on them (skip those
    `lampSpots`). Do not change `world.roads` (the road graph) or anything traffic reads.
  - Gardens keep out of every site: in `gardenBlocked` (the predicate passed to `planGardenBlock`), also return true when
    the rectangle overlaps any `reservedRects()` entry (import from `./sites`) whose centre is inside the city
    (`|x| <= CITY_HALF && |z| <= CITY_HALF`). Towers are not affected (the `saucer-court` tower block keeps its towers
    until E10 rebuilds it).
  - Export nothing new from world.ts unless needed.
- `src/city/megaBlock.ts` (new): pure layout numbers plus a builder.
  ```ts
  /** The Double Pot (L92 mega block): two block footprints joined over street x = 120 by a roof slab (the tunnel roof). */
  export const MEGA_BLOCK = {
    /** The two building halves (world rectangles, the block footprints minus the usual inset). */
    west: { minX: 69, maxX: 111, minZ: -111, maxZ: -69 },
    east: { minX: 129, maxX: 171, minZ: -111, maxZ: -69 },
    /** The tunnel roof slab over the street: its rectangle and its top (walkable later, E05 rooftops). */
    roof: { minX: 111, maxX: 129, minZ: -111, maxZ: -69, y: 9, thickness: 1 },
    /** Clear height under the slab (vehicles, the bus). */
    clearance: 8,
  } as const;
  export function buildMegaBlock(scene: THREE.Scene, addTower: (...) => void, rnd: () => number, ...): void
  ```
  Use the exact numbers above (they match the `double-pot` site: x 69..171, z -111..-69; take them from
  `siteRect('double-pot')` if you prefer, and assert they agree). The slab is a `THREE.BoxGeometry` mesh (material
  like the towers' concrete), its underside at `clearance` (8 m) and top at `roof.y` (9). It must not share a face with
  the tower boxes: overlap it 0.2 m into each tower instead of touching. Add a few soft lights or lamp prefabs under it
  only if cheap. The slab is NOT a `world.boxes` collider (a box collider is solid from the ground up and would block the
  road): leave collision of the roof to the later rooftop epic.

## Contract
- `src/city/megaBlock.ts` exports `MEGA_BLOCK` (shape above, exact numbers) and `buildMegaBlock`. Later epics read
  `MEGA_BLOCK.roof` for the walkable roof.
- `PARKS` gains `gnorwin-courts` (-90, 30) and `gnorwin-skate` (-30, 90); `ParkId` gains both ids.
- The road graph (`world.roads`), `ROAD_LINES`, highways and GPS are unchanged.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` succeeds.
- `npx vitest run src/parks src/cityScenery src/route src/traffic src/quests src/questSim src/stageSets src/worldDetails src/propsOffRoad src/parkedRoads src/scenery src/terrainDrive src/ambientGnomes` passes (from `games/gnome-theft-auto`).
- Then the whole suite except the golden: `npx vitest run --exclude src/layout.golden.test.ts` passes. If a test fails
  because it pinned a tower or prop in one of the four changed blocks, fix the cause (move the thing, or skip it in the
  park) or, if the test pins the old layout on purpose, update its expectation and say so in your report.
- No tower collider remains in the block x -111..-69, z 9..51 or the block x -51..-9, z 69..111 (only park props);
  the mega block has exactly two tower specs (x 69..111 and 129..171, z -111..-69, same height) and no `world.boxes`
  entry over the street x 111..129, z -111..-69.

## Out of scope
- `src/data/layout.golden.json` (the lead regenerates it), `src/hud.ts`, `src/biomes.ts`, `src/app.ts`, `src/landforms/*`,
  level documents, `src/sites.ts`. Basketball court and skate park contents (epic E19). Interiors and roof walking (E05).

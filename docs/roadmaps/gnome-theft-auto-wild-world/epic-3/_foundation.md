# Epic 3 foundation (done by the planner)

What exists before the issues run, so the workers and later epics know where things are.

## The map

- `WORLD_HALF` is 900 (`src/data/world.layout.json` `worldHalf`), the perimeter fence stands at 895 (`fenceEdge`).
- Seven regions. Two new documents, both empty (no props, markers or scatter yet):
  `src/data/levels/loch-moss.level.json` (biome `loch`, origin -600, -600) and
  `src/data/levels/tallgrass-commons.level.json` (biome `parkland`, origin -600, 600).
- Every region document has `data.border`: its border polygon, region-local like everything else in the document.
  `Region.border` (from `REGIONS[id]`) is the same polygon in world coordinates. In world coordinates (C = 215):

  | Region | Biome | Border |
  |---|---|---|
  | turfton | city | the square +-215 |
  | dust-flats | desert | (C,-C) (900,-900) (900,900) (C,C) |
  | mossy-wood | forest | (-C,-C) (-C,C) (-600,600) (-600,300) (-900,300) (-900,-300) (-600,-300) (-600,-600) |
  | frostbite-fells | tundra | (-C,-C) (-600,-600) (-300,-600) (-300,-900) (900,-900) (C,-C) |
  | cloverfield-farms | farmland | (-C,C) (C,C) (900,900) (-300,900) (-300,600) (-600,600) |
  | loch-moss | loch | (-900,-900) (-300,-900) (-300,-600) (-600,-600) (-600,-300) (-900,-300) |
  | tallgrass-commons | parkland | (-900,300) (-600,300) (-600,600) (-300,600) (-300,900) (-900,900) |

  Inside the old 1200 x 1200 square every point keeps its old biome (the diagonal rule), edges included; the
  north-east and south-east corners are the diagonal extensions of their neighbours. Loch Moss and Tallgrass Commons
  are L-shaped corners entirely outside the old square.
- `src/levels.ts` adds `regionAt(x, z)` (raster of 16 m cells, exact polygon test where a border touches a cell),
  `regionAtExact`, `inPolygon`, `biomeAtPoint`, `REGION_PRIORITY` (who wins on a shared edge), `REGION_BIOMES`,
  `waterPaths()`, `waterBodies()`, marker kind `water`. `config.ts` `biomeAt` now calls `biomeAtPoint`, and
  `BIOMES`, `BIOME_NAMES`, `BIOME_GROUND` cover all seven biomes. `types.ts` `BiomeId` gains `loch` and `parkland`.
  `atmosphere.ts` has profiles for both (a misty glen, a bright meadow).

## Roads

Six new highways, appended to `LAYOUT.highways` (so every old road-graph node keeps its id; the four old end nodes
gain one link each):

| Id | Region doc | World points |
|---|---|---|
| east-outer | dust-flats | (570,30) (650,20) (760,50) (870,50) |
| west-outer | mossy-wood | (-570,-30) (-650,-20) (-720,-30) (-870,-30) |
| north-outer | frostbite-fells | (-20,-570) (-10,-660) (30,-760) (20,-870) |
| south-outer | cloverfield-farms | (40,570) (30,660) (-10,760) (0,870) |
| loch-spur | loch-moss | (-720,-30) (-735,-150) (-710,-280) (-720,-480) |
| commons-spur | tallgrass-commons | (-720,-30) (-705,110) (-735,240) (-720,420) |

The ring roads are unchanged (they lie inside the old square, which stays identical).

## The reserved river (Epic 4 carves it)

`@lawn/level` now allows path kind `water` (types, validator, test, README). GTA documents hold the course as `water`
paths and the still water as `water` markers (`{ w, d }` rectangles). Nothing is drawn in 3D or carved yet.

| Id | Doc | Width | World points |
|---|---|---|---|
| river-upper | frostbite-fells | 8 | (0,-350) Basin ... (-120,-425) ... (-570,-665) into the loch |
| river-ravine | mossy-wood | 10 | (-600,-570) loch outlet ... (-482,-30) ... (-260,230) (-190,230) |
| canal | cloverfield-farms | 10 | (-190,230) (190,230), the existing Southern Drainage Canal |
| river-farm | cloverfield-farms | 12 | (190,230) ... (660,800) into the Puddle Sea |
| water/loch-moss (marker) | loch-moss | 300 x 240 | centred (-700,-680) |
| water/puddle-sea (marker) | cloverfield-farms | 400 x 120 | centred (690,830) |

It crosses roads at five bridge points (pinned by `levels.test.ts`): river-upper x ring-nw (about -65,-395),
river-ravine x west (-482,-30), river-ravine x ring-sw (about -243,230), canal x south (0,230, the existing gap),
river-farm x ring-se (about 223,371). That is one more than the roadmap's four: the farm river has to leave the ring.

## Parity: how the old world stayed identical

- The four biome scatters are generator **version 2**: version 1, unchanged, then an outer-ring pass. The version 1
  part reads what the old world looked like from `base.params`: `half` 600 (its pick range and edge margin), `fence`
  595 (the old perimeter fence, still a virtual collider for its clearance checks) and `roads` 10 (it only sees the
  first ten highways). `base.params.outerSeed` seeds the outer-ring pass (`outerRing(id)` in `biomes.ts`, a stub
  here; issue 3C fills it). The outer passes run after all four version 1 parts.
- The **Old Fence panel**: the knot-hole cluster (Knot-Hole Nora's thimble, the Fence-Line Overlook statue, an acorn,
  the knot-hole setpiece) stood on the old west fence at x = -595. Five bays of the old fence (z -160 to -85, with the
  knot-hole window) still stand there, with one collider. Issue 3E records why in the lore.
- Golden diff after the foundation (old fixture vs new): every scatter batch item, walk point, parked mower and dew
  barrel identical; the four old fence colliders replaced by the panel's collider and the four new ones; old road nodes
  identical except four extra links; new road nodes appended; the ground, road and fence meshes grew. Nothing else.
  The fixture is regenerated once, by the planner, after the epic's workers finish.
- `layout.golden.test.ts` takes `GOLDEN_OUT=<path>` to write the snapshot elsewhere without touching the fixture.

## For later epics

- **Epic 2 (terrain):** `y = 0` is still flat everywhere. The region borders, not the diagonals, say which region a
  point is in (`regionAt`). The ground is now one polygon per region (issue 3A), so a chunked terrain mesh can colour
  vertices by `regionAt`.
- **Epic 4 (water):** carve from `waterPaths()` / `waterBodies()`. About 55 colliders (old scatter: trees, rocks) sit on
  the river course inside the old square; clearing them changes the golden fixture inside the old bounds, so say so.
  The outer-ring scatter (3C) already keeps clear of the course. Five bridges, not four.
- **Epic 5 (terrain per region):** Loch Moss and Tallgrass Commons generators (`gta-loch-scatter`,
  `gta-parkland-scatter`, version 1) place nothing; give them code and bump the version.
- **Epic 6 (wildlife):** spawn tables can key on `regionAt` / `BiomeId` `loch` and `parkland`.
- **Epic 8:** `gta-explorer` (Grand Tour) counts biomes visited; issue 3F moves it to 7.

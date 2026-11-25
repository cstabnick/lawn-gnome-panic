# E01 contracts: the bigger map and the site registry

What E01 (world expansion and site plan) gives every later batch-3 epic. Code: `games/gnome-theft-auto`. World
coordinates throughout: +x east, +z south (north is -z), metres.

## The map

- **E28 update:** the map grew again to 3600 x 3600 (`worldHalf` 1800, fence 1795) and the bands below were pushed to
  the new edge; Pardonlin and the Unmown were added. See [../E28/contracts.md](../E28/contracts.md). The E01 numbers
  below are as E01 left them, except where marked "E28".
- `WORLD_HALF` (`config.ts`, from `src/data/world.layout.json` `worldHalf`) was **1400** (E28: 1800): the map was 2800 x 2800. The
  perimeter fence stands at `fenceEdge` **1395**. `MAP_EXTENT` (`sites.ts`) is the same number for map code.
- The old 1800 square (|x|, |z| <= 900) keeps its seven regions. Four band regions surround it; each is its own region
  document with its own biome:

| region id | name (E04) | biome | area | document origin |
|---|---|---|---|---|
| `north-highlands` | Snowcap Rise | `highland` | x -1400..1400, z -1400..-900 (E28: + z -1800..-1400 east of x -200, + x 1400..1800) | (0, -1150) |
| `south-shore` | Saltbucket Shore | `coast` | x -1400..1400, z 900..1400 (E28: the whole strip z 1100..1800 too) | (0, 1150) |
| `east-campus` | Rootwell | `campus` | x 900..1400, z -900..900 (E28: + x 1400..1800 to z 1100) | (1150, 0) |
| `west-estates` | Trellisdown | `estate` | x -1400..-900, z -900..900 | (-1150, 0) |

- New highways (appended to `layout.highways`, so the old road graph numbering is unchanged): `north-band`,
  `north-band-east`, `east-band`, `east-band-south`, `runway-spur`, `south-band`, `south-band-east`, `coast-spur`,
  `west-band`, `west-band-south`. Each outer highway (`north-outer`, `east-outer`, `south-outer`, `west-outer`) runs on into
  its band, and the band roads close a ring round the old square (`levels.test.ts` pins the joins).
- Landscape (`src/data/landscape.json`) gained `mountain/ski-hill` (peak ~(-350, -1340), r 360, h 85),
  `ridge/highland-spine`, `ridge/wind-farm`, `hill/observatory-mound` ((1240, 150), r 120, h 45) and `hill/vineyard-slope`.
  The Fells mountain at (300, -900) is now whole (it used to be cut by the old edge). The world rim moved to the new edge.
- Band relief generators: `gta-highland-relief`, `gta-coast-relief`, `gta-campus-relief`, `gta-estate-relief`
  (`src/landforms/`). Band scatter: batches `highland-scenery`, `coast-scenery`, `campus-scenery`, `estate-scenery`
  (`biomes.ts`); a band document's hand-placed `props` go into its batch.

### Adding a region later (e.g. a further yard or a nature preserve)

1. Ground: either carve it out of a band (shrink that band's `data.border` and give the new document the freed
   rectangle; borders must still tile the map, `levels.test.ts`) or grow the map: raise `worldHalf`/`fenceEdge` in
   `world.layout.json`, add the new band documents round the edge, and update the 2800/1400 pins in `levels.test.ts`,
   `sites.test.ts` (`WORLD_HALF` 1400) and the golden (`UPDATE_GOLDEN=1`, after reviewing a `GOLDEN_OUT` diff).
   `POS_BOUND`, `MAP_EXTENT`, the map picture and the terrain grid follow `worldHalf` on their own.
2. Document: copy a band document (e.g. `west-estates.level.json`): `id`, `name`, `bounds`, `base` (a new
   `gta-<biome>-scatter` v1 with its own seed), `data` (`region` biome, `ground`, `surface`, `batch`, `border`,
   optional `terrain`). Add the region to `world.layout.json` `regions` (with its origin) and its roads to `highways`
   (append only; a road joins another where they share an exact vertex).
3. Code tables: the checklist below (a new biome per region; one region per biome is tested).
4. Sites: add `slot` markers to the new document (data `{ hw, hd, kind, epic, flat, label?, anchors? }`, region-local
   coordinates) and their ids to `SITE_IDS` in `sites.ts`; run `npx vitest run src/sites.test.ts src/levels.test.ts`.
5. Optional: a landform module (`src/landforms/`), a scatter block in `biomes.ts` (`startBand(id)`), a lore entry,
   a band achievement (`src/bandAchievements.ts`).

### Adding a biome or region later (checklist)
`types.ts` `BiomeId`; `levels.ts` `RegionBiome`, `RegionId`, `REGION_BIOMES`, `GENERATORS`, `REGION_DOCS` (+ import),
`REGION_PRIORITY`; `world.layout.json` `regions`; `atmosphere.ts` `BIOME_PROFILES`; `sound/ambience.ts` `DAY`;
`terrainMesh.ts` `GROUND_KIND`; `world.ts` `regionKind`; `fringe/belt.ts` `FRINGE_THEMES`; `data/regionThemes.json`
(+ lore "Look and motifs"); `hud.ts` `MAP` colours; `birding/species.ts` (3+ species per region, tested);
`landforms/index.ts` `LANDFORMS` (+ `landforms.test.ts` `PROMISED_PAINT`); `biomes.ts` scatter batch. `tsc` lists most.

## Online

- `net.ts` `POS_BOUND = WORLD_HALF + 50` (1450): remote poses anywhere on the map are believed. Off-map rooms
  (interiors at x >= 5000) are outside it on purpose: E05 decides how players inside interiors are relayed.

## Airfields

- `config.ts` exports `interface Airfield { id, x, z, yaw, length, width, planeSpots[] }` and
  `AIRFIELDS: readonly Airfield[]` = `[{ id: 'airfield', ...AIRFIELD }]`. `AIRFIELD` (the desert strip) is unchanged.
  E13 appends Rootwell Field from the `runway-2` site (anchor `runway`: centre (1300, 600), yaw 0, i.e. runs along z;
  the slot is 180 x 460 so a 420 m runway and an apron fit) and converts the consumers that must know about both.

## The site registry: `src/sites.ts`

Data: `slot` markers in the region documents (marker kind added to `levels.ts` `MARKER_KINDS`, validated by
`regionDocProblems`), marker `data` `{ hw, hd, yaw?, kind, epic, flat, label?, parent?, overRoad?, anchors?: { name: { dx, dz, yaw? } } }`.

```ts
export const SITE_IDS: readonly [...];               // every id; sites.test.ts checks it against the documents
export type SiteId = (typeof SITE_IDS)[number];
export type SiteKind = 'venue' | 'water' | 'natural' | 'corridor' | 'airfield' | 'dealer' | 'building' | 'home' | 'park'
  | 'block' | 'farm' | 'society' | 'construction';
export interface SiteAnchor { x: number; z: number; yaw?: number }   // world coordinates
export interface Site {
  id: SiteId; label: string; kind: SiteKind; region: RegionId; x: number; z: number; hw: number; hd: number;
  yaw: number; epic: string; flat: boolean; parent?: SiteId; overRoad?: boolean; anchors: Record<string, SiteAnchor>;
}
export const SITES: readonly Site[];
export function siteById(id: SiteId): Site;                 // throws when missing
export function sitesByEpic(epic: string): Site[];           // 'E13'
export function siteRect(id: SiteId): SiteRect;             // { minX, maxX, minZ, maxZ }
export function anchorOf(id: SiteId, name: string): SiteAnchor;   // throws when missing
export function inSite(id: SiteId, x: number, z: number, margin = 0): boolean;
export function reservedRects(opts?: { flatOnly?: boolean }): ReservedRect[];  // reserve markers + slots
export const MAP_EXTENT: number;                             // = WORLD_HALF
export const OFF_MAP: readonly { id; x; z; what }[];         // rooms kept clear off the map
export const INTERIOR_MIN_X = 5000;                          // every x >= this is interior space (E05)
export function isOffMap(x: number, z: number): boolean;
```

What a slot does before its epic fills it: scenery, settlements, fringe lots and street dressing keep out of every slot
(`reservedRects()` replaced the five `reserve`-marker loops in `terrain.ts`, `landforms/macro.ts`, `biomes.ts`,
`settlements.ts`, `cityScenery/site.ts`; downtown gardens in `world.ts` too). A `flat: true` slot is levelled (flat within
`TERRAIN.siteMargin`, blended over `siteFade`; `reserve` markers are levelled after slots, so they stay exact) and
keeps the macro hills off; `flat: false` keeps its natural ground (ski hill, Capwood, Pinwheel Ridge, the Anthill, the
vineyard, the sea and beach, the Burrow Door mound). Rectangles are axis-aligned; `yaw` is only the facing.

`sites.test.ts` rules every epic must keep when it edits a slot: ids match `SITE_IDS`; on the map, inside the fence and in
the region whose document holds it; no two slots overlap unless one is the other's `parent`; no slot covers a highway or
a city street (unless `overRoad`), a `reserve` marker or a still-water body; the promised sites per epic exist.
Moving or resizing a slot is a document edit (marker `x`, `z`, `data.hw/hd`): run `npx vitest run src/sites.test.ts`.

Filling a slot: build inside `siteRect(id)`, read doors and starts with `anchorOf(id, name)`; if your content needs a
different footprint, edit the marker (and keep the test green) rather than building outside it.

### Every site

Sizes are full width x depth (hw/hd x 2). "natural" = `flat: false`.

| id | label (E04 name) | epic | kind | centre | size | ground | anchors / notes |
|---|---|---|---|---|---|---|---|
| `basketball-court` | Drainpipe Court | E19 | park | (-90, 30) | 40 x 28 | flat | centre (-90, 30, yaw 1.5708); inside Founders' Green |
| `skate-park` | the Gutter Bowls | E19 | park | (-30, 90) | 40 x 40 | flat | inside Founders' Green |
| `double-pot` | the Double Pot | E10 | block | (120, -90) | 102 x 42 | flat | tunnel-north (120, -111), tunnel-south (120, -69), roof (120, -90); overRoad |
| `saucer-court` | Saucer Court | E10 | block | (30, 90) | 42 x 42 | flat | a downtown tower block E10 rebuilds as the player's block of flats (flat 3B) |
| `home-01` | home-01 | E10 | home | (-90, 140) | 24 x 16 | flat | door (-90, 129); E04: Juniper, Kerb Row (Bodega's street) |
| `home-02` | home-02 | E10 | home | (80, -150) | 20 x 30 | flat | E04: Mayor Mulch's villa; block west of Patio Heights |
| `home-03` | home-03 | E10 | home | (102, -150) | 16 x 24 | flat | E04: Reginald Vance's townhouse; same block |
| `home-04` | home-04 | E10 | home | (-150, 30) | 20 x 20 | flat | E04: Mabel's flat (the cab rank is at (-30, 52)) |
| `home-05` | home-05 | E10 | home | (-400, 50) | 24 x 24 | flat | E04: Sorrel's cottage, Mossy Wood (her booth exit is at (-352, 12)) |
| `home-06` | home-06 | E10 | home | (615, 220) | 24 x 24 | flat | E04: Diggs' bungalow, just south of Pebblewick |
| `home-07` | home-07 | E10 | home | (45, 260) | 24 x 24 | flat | E04: Fence-Post Frank's shack behind the south welcome sign (0, 225) |
| `home-08` | home-08 | E10 | home | (-60, -600) | 24 x 24 | flat | Frostbite Fells, unassigned |
| `home-09` | home-09 | E10 | home | (80, 645) | 24 x 24 | flat | Cloverfield Farms, unassigned |
| `home-10` | home-10 | E10 | home | (-750, -380) | 24 x 24 | flat | Loch Moss, unassigned |
| `home-11` | home-11 | E10 | home | (-700, 300) | 24 x 24 | flat | Mossy Wood / Commons edge, unassigned |
| `home-12` | home-12 | E10 | home | (320, -210) | 24 x 24 | flat | Dust Flats, unassigned |
| `car-dealer` | car dealership | E08 | dealer | (35, 320) | 60 x 45 | flat | door (5, 320), lot (40, 320); on Route South |
| `boat-dealer` | boat dealership | E08 | dealer | (-640, -530) | 50 x 30 | flat | door (-640, -515), slip (-640, -560) into Loch Moss |
| `aircraft-dealer` | aircraft dealership | E08 | dealer | (1150, 640) | 70 x 60 | flat | door (1150, 610); beside Rootwell Field, end of `runway-spur` |
| `skyway-under` | the Underspan | E17 | society | (580, -26) | 40 x 50 | flat | beside the Unfinished Span (x 610, z -56..4) |
| `cult-camp` | Wader's Rest | E17 | society | (-1130, -640) | 180 x 180 | flat | Trellisdown, ~400 m west of Loch Moss |
| `mole-entrance` | the Burrow Door | E17 | society | (-1000, 300) | 30 x 30 | natural | Trellisdown, across `west-band-south` from Mossy Wood's edge |
| `rally-route` | the Capwood Run | E14 | corridor | (90, -760) | 40 x 30 | flat | start paddock; anchors start (90, -760), summit (300, -900), forest (250, -1180), finish (150, -1300) |
| `toadstool-forest` | Capwood | E14 | natural | (250, -1180) | 300 x 200 | natural | the Fells mountain's north flank |
| `dirt-track` | Rutbottom Dirt Bowl | E14 | venue | (1150, -650) | 300 x 200 | flat | gate (1000, -650) on `east-band` |
| `ski-hill` | Snowdrop Slope | E12 | venue | (-350, -1150) | 220 x 300 | natural | top (-350, -1290) ~60 m, bottom (-350, -1010) ~3 m, lift-base (-290, -1015) |
| `ice-lake` | Pail Pond | E12 | water | (-640, -1060) | 180 x 140 | flat | ground only: E12 adds the water/ice |
| `wind-farm` | Pinwheel Ridge | E13 | natural | (850, -1200) | 300 x 90 | natural | on `ridge/wind-farm` (~24 m crest) |
| `campus` | Rootwell University | E13 | venue | (1140, -200) | 320 x 300 | flat | gate (980, -200) facing the `east-band` road |
| `observatory-mound` | the Anthill | E13 | natural | (1240, 150) | 240 x 240 | natural | summit (1240, 150) ~45 m; the summit is rounded: E13 flattens r 30 for the observatory |
| `runway-2` | Rootwell Field | E13 | airfield | (1290, 600) | 180 x 460 | flat | runway (1300, 600, yaw 0), apron (1235, 600) |
| `construction-3` | Thorne Even-Estates (site 3) | E16 | construction | (1050, 250) | 60 x 60 | flat | Rootwell, near the new areas |
| `construction-1` | Thorne Even-Estates (site 1) | E16 | construction | (-295, -120) | 50 x 50 | flat | Turfton fringe, by the west highway |
| `construction-2` | Thorne Even-Estates (site 2) | E16 | construction | (195, 325) | 50 x 50 | flat | Turfton fringe, by Route South |
| `farm-plot` | Windfall Croft | E16 | farm | (100, 535) | 80 x 60 | flat | Cloverfield Farms |
| `vineyard` | Trellisdown Vineyard | E16 | farm | (-1140, -170) | 300 x 220 | natural | on `hill/vineyard-slope` (~14 m) |
| `mansion` | Brassknock Manor | E16 | building | (-1150, 40) | 120 x 100 | flat | door (-1150, -10) |
| `golf-yard` | Hedgeworth Links | E15 | venue | (-1180, 620) | 360 x 420 | flat | breach (-895, 640) = the Kicked Board, approach (-1000, 500) |
| `ocean` | the Saltwater | E11 | water | (0, 1490) (E28; was (0, 1290)) | 3580 x 600 (E28; was 2780 x 200) | natural | land only: E11 adds the water marker, `WATER.order`/bodies and the carve; the rim raises the ground near the edge |
| `beach` | Saltbucket Shore beach | E11 | natural | (0, 1165) | 3580 x 50 (E28; was 2780 x 50) | natural | |
| `boardwalk` | Saltbucket Boardwalk | E11 | venue | (0, 1115) | 420 x 50 | flat | entrance (0, 1090) at the end of `coast-spur` (0, 1060) |
| `ferris-wheel` | the Spokewheel | E11 | venue | (-260, 1100) | 60 x 60 | flat | |
| `pirate-ship` | the Bathtub Queen | E11 | venue | (300, 1280) | 80 x 50 | natural | parent `ocean` |

Where the ground differs from E04's plan (lore ruling R-168): Drainpipe Court and the Gutter Bowls are inside Founders'
Green, not in their own blocks; the Underspan is beside the Unfinished Span; Wader's Rest is in Trellisdown west of the
loch, not on its shore; homes 02/03 stand in the block west of Patio Heights, not inside it.

## Downtown (L92)

- Founders' Green: blocks (-30, 30) (Gnorwin's park), (-90, 30) and (-30, 90) (`parks/blocks.ts` `PARKS` rows
  `gnorwin-courts`, `gnorwin-skate`). The streets between them are a paved promenade but stay roads: the road graph,
  GPS and traffic are unchanged.
- The Double Pot: `src/city/megaBlock.ts` `MEGA_BLOCK = { west, east, roof: { minX: 111, maxX: 129, minZ: -111, maxZ: -69, y: 9, thickness: 1 }, clearance: 8 }`.
  Two tower halves over blocks (90, -90) and (150, -90); street x = 120 runs through the tunnel under the roof slab.
  The slab is visual only (no collider): E05 makes `MEGA_BLOCK.roof` a walkable rooftop.

## Off the map

`sites.ts` `OFF_MAP`: cutscene rooms (3000, 3000), Pay 'n' Glaze stage (4000, 0), gun back room (4000, 900), interiors
from x = 5000 (`INTERIOR_MIN_X`). All are outside `MAP_EXTENT`.

## Map picture

`hud.ts` draws the map background at `min(1, 2048 / 2800)` px per world unit (2048 px square); the minimap and big map
read it at that scale. E07 builds zoom on top.

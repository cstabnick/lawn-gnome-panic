# Epic 5 foundation (done by the planner)

What exists before the issues run, so the workers and later epics know where things are.

## Files

- `games/gnome-theft-auto/src/landforms/`: the region landforms.
  - `types.ts`: the contract (`Landform`, `LandformInput`, `LandformFeature`, `GroundFacts`, `PaintKind`, `PAINT_KINDS`).
  - `index.ts`: the registry (`LANDFORMS`, one generator per region; Turfton has none), `tiltAt` (the regional tilt),
    `reliefMaskAt`, `reliefAt` (the region's relief, masked), `regionPaintAt`, `landformInput`. Throws at import when a
    document's `data.terrain.relief` id/version disagrees with the code.
  - `fields.ts`: distance fields on 4 m cells, bilinear, built once: `riverDistAt` (from a river or canal bank),
    `waterDistAt` (any water, 0 inside the loch / Puddle Sea), `borderDistAt` (a region's inner border), `roadDistAt`
    (highway centre lines).
  - `noise.ts`: `valueNoise`, `fbm`, `ridged`, `distToPolyline`, `nearestOnPolyline`, re-exports `clamp`, `smoothstep`,
    `distToSeg`.
  - `dustFlats.ts`, `mossyWood.ts`, `frostbiteFells.ts`, `cloverfieldFarms.ts`, `tallgrassCommons.ts`, `lochMoss.ts`:
    one generator per region (stubs `relief: () => 0` until the issues fill them).
- `games/gnome-theft-auto/src/terrainPaint.ts`: the paint grid (one cell per 2 m height-grid cell, built lazily from the
  finished heights): `paintAt`, `paintedSurfaceAt`, `paintedGroundAt`, `PAINT_SURFACE`, `PAINT_GROUND`.
- `games/gnome-theft-auto/src/landforms.test.ts`: one `describe` per region (`-t <region-id>`): landforms present, heights
  in range, highways and trails drivable, land mostly drivable, rivers not rising, flat sites flat, buildings level,
  promised paint present.

## Edits to shared files (small, targeted)

- `config.ts` `TERRAIN`: `tiltPerM` 0.004, `tiltFlatHalf` 263, `reliefBorderFade` 50, `riverClear` 10, `riverFade` 30,
  `trailWidth` 4, `trailFade` 6, `rockSlope` 0.8, `mudReach` 6.
- `levels.ts`: `GtaRegionData.terrain?: GtaTerrain` (`{ relief: { id, version, params }, features? }`), its validation in
  `regionDocProblems`, `TRAIL_PREFIX = 'trail/'`, `trails()`; `highways()` skips trails.
- `terrain.ts`: `RELIEFS = [tiltAt, reliefAt]`; `TerrainOptions.landforms` (the tilt, the landforms and the document
  stamps; off for `?terrain=hill`, and `setTerrainOptions({ testHill: true })` turns it off unless `landforms` is given);
  trails are flattened across like highways (width/2 + 1, fade `trailFade`).
- `surfaces.ts`: `SurfaceKind` gains `rock`, `dirt`, `gravel`; `surfaceAt` uses the paint after asphalt and the Basin ice.
- `textures.ts`: ground kinds `rock`, `dirt`, `gravel`, `mud`, `ice` (procedural canvases).
- `terrainMesh.ts`: each triangle takes its cell's paint, else its region's ground.

## How the height is built now

natural = amplitude x (tilt + mask x region relief, then the document stamps); then highways and trails flat across,
then flat sites, then Turfton at 0, then (Epic 4) the water carved. `mask` is 0 on inner region borders (fading in over
50 m) and within 10 m of a river bank (back to full 40 m out), so a region's relief never crosses a border or the river.
Stamps are not masked.

**The tilt** is level across Turfton's band (|z| <= 263) and falls 0.004 m per m southward beyond it: +2.5 m at the
north edge, -2.5 m at the south edge. The river runs Basin -> west -> Loch Moss (north-west: under the tilt the upper
river rises about 1.3 m) -> south down the ravine (falls) -> east along the canal (level) -> south-east to the Puddle
Sea (falls). No plane tilt can make a river that runs west, then south, then east fall everywhere, so the tilt stays
gentle and Epic 4 carves the beds (`landforms.test.ts` allows at most 1.5 m of natural rise along any water path).

## The paint rule

In order, the first that applies: asphalt (roads, runway) and the Basin ice (surfaces.ts, before paint); a trail cell ->
dirt; slope >= 0.8 (outside Turfton) -> rock; the region's own `paint()`; within 6 m of a river bank -> mud; else
unpainted (the region's ground texture and `data.surface`). `forest`, `moss`, `meadow` paint drive like grass but keep
those textures. Paint is null everywhere while the terrain is flat or without landforms.

## Trails

Road paths whose id starts `trail/` (default width 4): no traffic, not in the road graph, flattened across, painted
dirt. Not drawn on the minimap yet (Epic 8).

## Issues and results

All seven ran in parallel and passed their checks: 5A Dust Flats (swell, dunes, 3 mesas, a canyon, 2 dirt tracks),
5B Mossy Wood (rolling floor, raised ravine banks, 12 `garden-rock` boulders, forest/moss/mud paint), 5C Frostbite
Fells (ridges growing northward, 3 crags, a glacier tongue, 3 frozen ponds; deviation: the base swell is also calmed
near highways, or `ring-nw` climbed 0.18-0.32), 5D Cloverfield Farms (rolling hills sinking to the Puddle Sea, 2
terraces, a raised farmyard stamp under Granny's farm, 5 muddy pens, a sand beach), 5E Tallgrass Commons (meadow
mounds, the flat-topped `hive-hill` at (-750, 720), a trail up to it), 5F Loch Moss (rock glen walls on the north and
west sides, moor above, gravel shore, `tessie-island` at (-760, -720), natural top 8.8 m), 5G editor (the GTA view shows
the game's heights and paint from the saved documents; trails in dirt colour).

## Added after the workers ran

- `TERRAIN.amplitude` is **1** (shipped). Tests that mean the flat world now say `amplitude: 0` (`terrain.test.ts`,
  `terrainDrive.test.ts`, `water.test.ts`'s dry-world case); `surfaces.test.ts` runs with `landforms: false` (it tests
  the unpainted biome mapping).
- `drapedRibbon` (terrainMesh.ts) has 5 vertices across, not 2: on sloping land the ground across a bend or junction is
  not dead level, and it bulged through the 10 m chord (zfight at the east / ring-ne junction).
- Checks: build, `npm test -w games/gnome-theft-auto` (all but the golden, which is regenerated once by the
  orchestrator), `landforms.test.ts` 51/51, `npm test -w tools/level-editor`, smoke at five spots across the regions,
  zfight at seven spots: no pair involves the landforms or roads. The pairs left are Epic 4's wharves and boats on the
  water, and a Turfton decal at (76, -30) on flat city ground.

## For later epics

- **Epic 4 (water):** the water is carved after the landforms; `tessie-island` is a relief feature inside the loch
  rectangle, so the loch bed carve may lay over it: keep the ground there if it is above the loch floor. Paint runs on
  the carved grid, so steep carved banks paint rock before the river-mud rule.
- **Epic 6 (wildlife):** the hive hill top is flat within 22 m of (-750, 720); Mossy Wood's boulders are solid props.
- **Epic 7 (Tessie):** the island is `data.terrain.features` id `tessie-island` in `loch-moss.level.json`.
- **Epic 8:** trails are not on the minimap yet; the paint adds ground meshes per chunk (one per ground kind), so count
  draw calls in the phone perf pass; the grid plus paint build is about 1-2 s on a desktop (`landforms.test.ts` limits
  the height grid to 6 s).

Epic: E28-2 Fill (GTA batch 3, world expansion II)
Depends on: none

(Read `docs/roadmaps/gta-batch-3/E28/epic-2/_env.md` first: environment, coordinates and the new places.)

## Goal
The two new regions get their first-pass procedural scenery, and the three pushed-out bands get enough extra scenery
that their new land is not bare: Pardonlin reads as a clipped continental garden (box balls, topiary, lime trees in
rows), the Unmown as a wild unmown corner (dense trees and bushes, wildflowers, tall grass, reeds, rocks).

## Read first
- `games/gnome-theft-auto/src/biomes.ts`: `buildBiomes` (line ~164), the `batches` record (line ~176) and the batch
  name map (line ~471: `'highland-scenery': batches.highland, ...`), the static-batch list near the end (line ~1339:
  `['estate-scenery', batches.estate]`), and the band blocks at line ~1296-1323 (`startBand('north-highlands')`, then
  `treeAt(...)` / `scatter(...)` loops). `treeAt` and `scatter` already keep out of roads, trails, water, slots and
  `reserve` markers and only place inside the region of the biome passed.
- `games/gnome-theft-auto/src/levels.ts`: `GENERATORS` now has `pardonlin: { id: 'gta-continental-scatter', version: 1 }`
  and `'the-unmown': { id: 'gta-preserve-scatter', version: 1 }`; the region documents' `data.batch` are
  `'continental-scenery'` and `'preserve-scenery'`; their biomes are `'continental'` and `'preserve'`.
- Prefab ids you may use (all exist in `@lawn/prefabs`): `broadleaf-tree`, `cone-pine`, `round-bush`, `topiary-cone`,
  `boxwood-ball`, `flower-bed`, `wildflower-patch`, `ornamental-grass`, `garden-rock`, `fallen-log`, `fern-clump`,
  `stone-cairn`, `woodpile`. Check any other id with `grep -rn "id: '<id>'" packages/prefabs/src/catalog` before use.

## Change
- `src/biomes.ts` only:
  - add `continental: []` and `preserve: []` to `batches` (and its type), `'continental-scenery': batches.continental`
    and `'preserve-scenery': batches.preserve` to the name map, and both to the static-batch list;
  - a Pardonlin block after the west-estates block: `startBand('pardonlin')`, then about 120 `broadleaf-tree`
    (scale 0.8-1.1), 80 `boxwood-ball`, 40 `topiary-cone`, 30 `flower-bed` (solid false). Pardonlin is a town: keep the
    trees off the town blocks between the streets by placing them only where `p.z < -460 || p.z > 470` (the Jardin and
    the south) or within 30 m of the river centre line x = -1612 (the quays), using the `ok` predicate parameter the
    south-shore block already uses (`treeAt(C, 'palm-tree', 'coast', uni(0.9, 1.2), ok)`).
  - an Unmown block: `startBand('the-unmown')`, then about 500 `broadleaf-tree` (half of them in clumps: pick a centre,
    place 4-6 within 25 m), 120 `cone-pine`, 300 `round-bush`, 250 `wildflower-patch`, 250 `ornamental-grass`,
    80 `fern-clump`, 60 `fallen-log`, 40 `garden-rock`. Keep everything at least 4 m off the trails (the helpers do it).
  - the pushed-out bands: scale the north-highlands, east-campus and south-shore loops' counts by the area they gained
    (north-highlands roughly x2.2, east-campus x2.1, south-shore x1.8; south-shore keeps its `p.z < 1140` rule).
- If a count makes `npx vitest run src/biomes` or the scenery tests slow beyond ~60 s, halve it and say so.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- `cd games/gnome-theft-auto && npx vitest run src/scenery.test.ts src/propsOffRoad.test.ts src/terrainBiomes.test.ts src/destructibles.test.ts`
  pass (the golden test is expected to fail; ignore it).

## Out of scope
Every file but `src/biomes.ts`. No new prefabs. No props inside the Pardonlin town blocks (E30 builds the town).

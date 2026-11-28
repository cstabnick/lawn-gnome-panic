Epic: E16-C (countryside, scenery wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/country/vineyard.ts` builds Trellisdown Vineyard on its hill: east-west vine rows following
the ground, the crooked row, the path up the middle, the gate arch on the lane, Chicory's lodge, the press-house with
the first vine on its wall, frost-pots among the rows, with colliders, in culled static batches.

## Read first
- `games/gnome-theft-auto/src/country/types.ts`: `VINEYARD` (site x -1290..-990, z -280..-60; `gate` (-1140, -61)
  facing south (yaw 0) onto vineyard-lane at z ~-31; `lodge` (-1172, -78) 8 x 6; `pressHouse` (-1105, -95) 12 x 9;
  `firstVine` (-1113, -95); `rows` x -1280..-1000, z -265..-112, one row every `rowStep` 5 m from minZ; `path`
  x -1146..-1134 (no vines); `crookedRowZ` -205 (east of the path); `story` spots; `chicoryLoop`).
- `games/gnome-theft-auto/src/homes/pieces.ts`: `buildPieces`, `HomePiece` (`y` lifts a piece), `textPlate`.
- `games/gnome-theft-auto/src/terrain.ts` `heightAt` (the vineyard is a natural hill, ~14 m at its middle: every row
  segment stands at its own ground height).
- Prefabs (`packages/prefabs/src/catalog/gta-country-vineyard.ts`; read sizes there): `vine-row` and `vine-row-crooked`
  (5 m along local x, posts at the ends, ~1.6 tall), `vine-first`, `frost-pot`, `press-house` (12 x 9, open arch on
  +z), `gardener-lodge` (8 x 6, door on +z), `vineyard-gate` (8 m clear gap), `grape-crate`, `grape-trough`.

## Change
`src/country/vineyard.ts` (keep `export function buildVineyard(scene, boxes): void`):
- Rows: for each z from `rows.minZ` to `rows.maxZ` step `rowStep`, lay 5 m segments end to end along x across
  `rows.minX..rows.maxX`, skipping the `path` x range and skipping any segment within 3 m of the lodge, press-house or
  the story spots; each segment at yaw 0 (runs along x) and at `heightAt` of its centre (pieces stand on the ground by
  default: check `buildPieces` does this; if it uses the ground under the centre, that is right). On the hill a segment
  may float or sink a little at its ends: keep segments 5 m so it stays small. The row at `crookedRowZ` east of the path
  uses `vine-row-crooked`. Expect ~30 rows x ~50 segments: put ALL rows in one `buildPieces` call (one static cell
  batch) with `solid: false` on every segment (no per-segment colliders: a gnome or a mower can push into a row but the
  rows must not become 1500 boxes). Instead add ONE thin collider per row half (west of the path and east of it): a box
  0.3 deep along the row line, h 1.6, so vehicles bump along rows rather than through them. The path stays open.
- Gate: `vineyard-gate` at `gate` (yaw 0); colliders only for its two piers (1 x 1, h 2.6 at x ±4.2 from the gate).
  A `textPlate` on a post beside it: "TRELLISDOWN VINEYARD · KEEP OFF THE ROWS · BY ORDER OF THE GARDENER".
- Lodge: `gardener-lodge` at `lodge` (yaw 0), collider 8 x 6, h 5; a `textPlate` "C. SNIPS, HEAD GARDENER. KNOCK. THEN
  WAIT. THEN GO AWAY." beside the door.
- Press-house: `press-house` at `pressHouse` (yaw 0), colliders for its walls but NOT the arch opening (three boxes: back
  wall and two side walls, h 4.5, so a gnome can walk in under the arch); `grape-trough` inside it (1 m from the back
  wall); `vine-first` at `firstVine` facing west (yaw -PI/2) standing 0.1 m out from the press-house west wall
  (wall at x = pressHouse.x - 6 = -1111: put the vine at x -1111.4); two `grape-crate`s by the arch.
- Frost-pots: one at both ends of every third row (about 20), standing 1 m beyond the end segment; `solid: false`.
- Path: a dirt path decal up the middle (x -1146..-1134, z -270..-62) following the ground: a `PlaneGeometry` with enough
  segments along z (e.g. 1 per 4 m) whose vertices take `heightAt + 0.04`, `flatLayer(material, LAYER.road)`, its own
  material; and a short gravel apron decal (`LAYER.area`, its own material) in front of the press-house arch.
- Push every collider into `boxes`.

## Contract
`buildVineyard(scene, boxes)` unchanged. Leave free (nothing within 4 m): every `VINEYARD.story` spot and the
`chicoryLoop` points (other workers put vignettes and Chicory there).

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` shows no errors in your file.
- `npx vitest run src/flora src/sites.test.ts` passes.
- A temporary vitest file (deleted afterwards) runs `buildVineyard(new THREE.Scene(), boxes)` and asserts fewer than 120
  boxes, none inside the `path` rectangle, all inside `VINEYARD.site` grown by 2 m.

## Out of scope
`src/country/trellisLife.ts` (vignettes, people, sounds), `src/country/manor.ts`, `src/country/types.ts`, every other file.

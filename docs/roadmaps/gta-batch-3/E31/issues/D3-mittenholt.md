Epic: E31 wave 2 (building the places)
Depends on: wave 1 (prefabs exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first. Writing and dressing issue: the jokes and the little stories
matter as much as the placement.

## Goal
Mittenholt, a hamlet in Snowcap Rise (the cold northern band), exists: a cluster of houses round a small centre beside the band road, a name sign at the
road, village furniture, at least 3 story vignettes, satirical signage and two residents doing something specific to the
place (environmental storytelling AC (a)-(c)). Travelling through it should feel like passing a real little place.

## Read first
- `games/gnome-theft-auto/src/living/hamletMittenholt.ts` (your stub: keep `buildMittenholt(scene, boxes): void` and `mittenholtPeople(): AmbientGnomeDef[]`)
- `games/gnome-theft-auto/src/living/place.ts` (USE THESE: `Piece`, `placePieces(scene, boxes, pieces, name)` places a
  culled static batch, skips solid pieces that would overlap existing colliders and pushes the colliders; `roadDist(x, z)`
  distance to the nearest road/trail centre line; `seeded(seed)` RNG; `pieceBox`)
- `games/gnome-theft-auto/src/living/config.ts` (`HAMLETS`: Mittenholt centre (550, -1375), radius 75)
- `games/gnome-theft-auto/src/ambientGnomes.ts` lines 1-80 (`AmbientGnomeDef` and example bubbles)
- `packages/prefabs/src/catalog/gta-hamlet-kit.ts` (hamlet-sign: board face centre (0, 1.45, 0.05) 1.8 x 0.7;
  milestone; wayside-shrine; village-pump; hamlet-picnic-table; hamlet-phone-box; drystone-wall (3.0 m along x, place
  sections 3.06 m apart); hamlet-stone-cairn)

## Place facts
- Centre (550, -1375). The road `north-band-east` runs roughly west-east here through (400,-1330) and (700,-1295)
  (z ~-1312 at x 550). Build NORTH of it (z -1450..-1335). The wind farm site is x 700..1000, z -1245..-1155 (south of
  the road: leave it), the High Tarn is to the north-east at (1000,-1600) (leave it).
- Character: a snowed-in mountain hamlet of knitters and woodcutters; everyone has one mitten too many or too few.

## Rules for the layout
- Houses: 'snow-cottage' and 'log-cabin', warm reds/ochres with white roofs (tint/trim numbers); woodpiles, sleds ('tea-tray-sled' prefab if it exists), snow lumps (any 'snow' prop: search the catalog), 'euro-washing-line'. 8-12 houses, scale so they are 6-10 m across (check `prefabBounds(id)` from place.ts), fronts facing
  the centre or the road, every house centre at least 16 m from any road centre line (`roadDist`) and inside 75 m of the
  centre, at least 3 m apart (placePieces skips overlaps; place houses first). Ground: sloped ground is fine, set `y` to the
  lowest `heightAt` of the house's four footprint corners so nothing floats.
- The centre: a small green or square (a ground patch: a `THREE.Mesh` CircleGeometry/PlaneGeometry lifted 0.03 m with
  `flatLayer(material, LAYER.area)` from '@lawn/depth' is allowed as a ground feature) with the centre piece below.
- A `hamlet-sign` on each side where the road enters (10-14 m off the road centre, facing traffic) with a `textPlate` name
  (and a one-line motto under the name, e.g. "Twinned with nowhere, by request") 0.03 m in front of the board face.
- Furniture: `village-pump` or the centre piece, a `hamlet-phone-box`, `bus-shelter` (existing prefab) by the road with a
  timetable `textPlate` joke, `mailbox`, `bench`, `litter-bin`, a `wayside-shrine`, `drystone-wall` runs or `hedgerow`
  along 2-3 plot edges, garden bits (flowers, washing lines) — all off the road.
- Three vignettes (props only, readable without text): (1) the Snowman Committee: a snowman half built, its carrot nose missing, three different carrots on a bench
  beside it with numbered tags; (2) the Odd Mitten Line: a washing line of single mittens of every colour (small coloured
  props) and exactly one matching pair pegged in the middle; (3) the Sled That Got Away: a sled stuck nose-first in a
  snowdrift at the bottom of a slope with a scarf trailing back up the hill.
- A `rules-board` (from gta-preserve-trail: face centre (0, 1.45, 0.05) 1.4 x 0.9) as the village notice board with a
  `textPlate` of 3-5 notices in this voice: "FOUND: 41 left mittens. Owners please collect. Right mittens need not apply."; "Hot cocoa on Thursdays. On other days, cold cocoa."; "Do not lick the pump."
- Batches: houses + dressing through `placePieces(..., 'mittenholt')` (one or two calls). Text plates and the green are
  separate meshes added to the scene. Colliders for houses, walls, the phone box, shelters, pump; none for flowers.
- Two residents from `mittenholtPeople()`, ids prefixed 'mittenholt-', each with a look, an idle and a bubble: a knitter on a bench knitting (idle 'sit-ground' or 'read'): "Every mitten I knit is a left one. I have
  stopped asking why."; a woodcutter at the woodpile (idle 'saw'): "Split enough logs for winter. Then winter came early and asked for more."

## Change
- `games/gnome-theft-auto/src/living/hamletMittenholt.ts`: the builder and the residents, with an exported pure planner
  `planMittenholt(): Piece[]` (houses first) so it can be tested without a scene.
- NEW `games/gnome-theft-auto/src/living/hamletMittenholt.test.ts`: the plan has 8-12 house pieces; every house is >= 16 m from roads and
  within 75 m of the centre; every piece is in region 'north-highlands' (`regionAt` from '../levels'); building into a fresh
  `THREE.Scene` with an empty boxes array does not throw and pushes >= 10 boxes; the residents are in the region, 2 of
  them, unique ids.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/living/hamletMittenholt.test.ts` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
Other `living/*` files (other workers: the other hamlets, roadside, the tarn), `settlements.ts`, prefabs, lore docs.

Epic: E31 wave 2 (building the places)
Depends on: wave 1 (prefabs exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first. Writing and dressing issue: the jokes and the little stories
matter as much as the placement.

## Goal
Espalier End, a hamlet in Trellisdown (the estates country west of the old yard), exists: a cluster of houses round a small centre beside the band road, a name sign at the
road, village furniture, at least 3 story vignettes, satirical signage and two residents doing something specific to the
place (environmental storytelling AC (a)-(c)). Travelling through it should feel like passing a real little place.

## Read first
- `games/gnome-theft-auto/src/living/hamletEspalier.ts` (your stub: keep `buildEspalierEnd(scene, boxes): void` and `espalierPeople(): AmbientGnomeDef[]`)
- `games/gnome-theft-auto/src/living/place.ts` (USE THESE: `Piece`, `placePieces(scene, boxes, pieces, name)` places a
  culled static batch, skips solid pieces that would overlap existing colliders and pushes the colliders; `roadDist(x, z)`
  distance to the nearest road/trail centre line; `seeded(seed)` RNG; `pieceBox`)
- `games/gnome-theft-auto/src/living/config.ts` (`HAMLETS`: Espalier End centre (-1080, -420), radius 75)
- `games/gnome-theft-auto/src/ambientGnomes.ts` lines 1-80 (`AmbientGnomeDef` and example bubbles)
- `packages/prefabs/src/catalog/gta-hamlet-kit.ts` (hamlet-sign: board face centre (0, 1.45, 0.05) 1.8 x 0.7;
  milestone; wayside-shrine; village-pump; hamlet-picnic-table; hamlet-phone-box; drystone-wall (3.0 m along x, place
  sections 3.06 m apart); hamlet-stone-cairn)

## Place facts
- Centre (-1080, -420). The road `wicket-north-approach` runs west-east at z ~-500 (from (-950,-500) through
  (-1180,-505) to (-1400,-500)); `west-band-north` runs north-south at x -950. Build NORTH of the z -500 road (z -490..-345)
  and west of x -965. The Trellisdown vineyard site is x -1290..-990, z -280..-60 (stay south of z -300) and the cult camp
  site x -1220..-1040, z -730..-550 (do not cross the road).
- Character: a genteel estate-gardeners' hamlet in the vineyard country: everything is trained, clipped, espaliered.

## Rules for the layout
- Houses: 'gnome-cottage' and 'thatched-cottage', tinted in soft creams and sage (tint/trim numbers), plus E29 garden kit: 'euro-espalier-pear', 'euro-box-hedge', 'euro-topiary-spiral', 'euro-topiary-lollipop', 'euro-rose-arch', 'euro-water-butt'. 8-12 houses, scale so they are 6-10 m across (check `prefabBounds(id)` from place.ts), fronts facing
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
- Three vignettes (props only, readable without text): (1) the Topiary Contest: four clipped topiary pieces on plinths with rosette stakes, the winner a hedge clipped into
  a ride-on mower, a ladder and shears abandoned beside a half-clipped fifth; (2) the Pear Incident: a ladder against an
  espalier wall, a toppled basket, pears (any small round prop) rolled down the slope into the road verge; (3) the
  Feud: two neighbouring gardens with a box hedge between them clipped to two different heights, a tape measure lying
  on top.
- A `rules-board` (from gta-preserve-trail: face centre (0, 1.45, 0.05) 1.4 x 0.9) as the village notice board with a
  `textPlate` of 3-5 notices in this voice: "TOPIARY CONTEST: entries must not resemble the judges."; "LOST: one pear. Answers to nothing."; "The hedge between No. 3 and No. 4 is 1.2 m. It is ALSO 1.4 m. Mediation Tuesday."
- Batches: houses + dressing through `placePieces(..., 'espalier-end')` (one or two calls). Text plates and the green are
  separate meshes added to the scene. Colliders for houses, walls, the phone box, shelters, pump; none for flowers.
- Two residents from `espalierPeople()`, ids prefixed 'espalier-', each with a look, an idle and a bubble: a topiary judge with a clipboard (idle 'think'): "Points off for symmetry. Symmetry is for the HOA."; a
  pear-picker on the ground by the toppled basket (idle 'scratch-head').

## Change
- `games/gnome-theft-auto/src/living/hamletEspalier.ts`: the builder and the residents, with an exported pure planner
  `planEspalierEnd(): Piece[]` (houses first) so it can be tested without a scene.
- NEW `games/gnome-theft-auto/src/living/hamletEspalier.test.ts`: the plan has 8-12 house pieces; every house is >= 16 m from roads and
  within 75 m of the centre; every piece is in region 'west-estates' (`regionAt` from '../levels'); building into a fresh
  `THREE.Scene` with an empty boxes array does not throw and pushes >= 10 boxes; the residents are in the region, 2 of
  them, unique ids.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/living/hamletEspalier.test.ts` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
Other `living/*` files (other workers: the other hamlets, roadside, the tarn), `settlements.ts`, prefabs, lore docs.

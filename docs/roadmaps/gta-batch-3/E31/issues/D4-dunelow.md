Epic: E31 wave 2 (building the places)
Depends on: wave 1 (prefabs exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first. Writing and dressing issue: the jokes and the little stories
matter as much as the placement.

## Goal
Dunelow, a hamlet in the Saltbucket hinterland (the strip behind the southern coast), exists: a cluster of houses round a small centre beside the band road, a name sign at the
road, village furniture, at least 3 story vignettes, satirical signage and two residents doing something specific to the
place (environmental storytelling AC (a)-(c)). Travelling through it should feel like passing a real little place.

## Read first
- `games/gnome-theft-auto/src/living/hamletDunelow.ts` (your stub: keep `buildDunelow(scene, boxes): void` and `dunelowPeople(): AmbientGnomeDef[]`)
- `games/gnome-theft-auto/src/living/place.ts` (USE THESE: `Piece`, `placePieces(scene, boxes, pieces, name)` places a
  culled static batch, skips solid pieces that would overlap existing colliders and pushes the colliders; `roadDist(x, z)`
  distance to the nearest road/trail centre line; `seeded(seed)` RNG; `pieceBox`)
- `games/gnome-theft-auto/src/living/config.ts` (`HAMLETS`: Dunelow centre (-560, 965), radius 75)
- `games/gnome-theft-auto/src/ambientGnomes.ts` lines 1-80 (`AmbientGnomeDef` and example bubbles)
- `packages/prefabs/src/catalog/gta-hamlet-kit.ts` (hamlet-sign: board face centre (0, 1.45, 0.05) 1.8 x 0.7;
  milestone; wayside-shrine; village-pump; hamlet-picnic-table; hamlet-phone-box; drystone-wall (3.0 m along x, place
  sections 3.06 m apart); hamlet-stone-cairn)

## Place facts
- Centre (-560, 965). The road `south-band` runs through it roughly west-east: (-300,1000) to (-700,1010)
  (z ~1005 at x -560). Build on BOTH sides of the road (z 905..985 north of it, z 1025..1080 south of it), never south of
  z 1090 (the beach and the sea are beyond). x -640..-480.
- Character: a windblown fishing-and-ice-cream hamlet behind the dunes; nets, lobster pots, gulls that run the place.

## Rules for the layout
- Houses: 'gnome-cottage' and 'stilt-cottage' in seaside pastels (tint/trim numbers); coast props from `packages/prefabs/src/catalog/gta-coast-kit.ts` (search it: nets, pots, beach huts, deckchairs, 'gull-sign', lifebuoys) and 'walnut-dinghy' upturned on blocks as a prop if it builds as a static prefab. 8-12 houses, scale so they are 6-10 m across (check `prefabBounds(id)` from place.ts), fronts facing
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
- Three vignettes (props only, readable without text): (1) the Gull Standoff: a chip-shop counter or stall with one open paper of chips and three gull props (birds:
  'bird-gull' prefab) lined up on the roof edge staring at it, a gnome's hat dropped on the ground; (2) the Deckchair
  Collapse: a stack of folded deckchairs fallen over like dominoes beside a hire board; (3) the Sandcastle Judging:
  three sandcastle mounds (sand-coloured small props) with rosettes, the biggest with a bucket still on top.
- A `rules-board` (from gta-preserve-trail: face centre (0, 1.45, 0.05) 1.4 x 0.9) as the village notice board with a
  `textPlate` of 3-5 notices in this voice: "GULLS ARE NOT TO BE FED. GULLS ARE AWARE OF THIS AND DISAGREE."; "Ice cream van Tuesdays and whenever it hears you."; "Lost: one flip-flop. Left. Possibly at sea."
- Batches: houses + dressing through `placePieces(..., 'dunelow')` (one or two calls). Text plates and the green are
  separate meshes added to the scene. Colliders for houses, walls, the phone box, shelters, pump; none for flowers.
- Two residents from `dunelowPeople()`, ids prefixed 'dunelow-', each with a look, an idle and a bubble: a net-mender sitting on a crate (idle 'sit-ground'): "Mended this net forty times. The fish have learned
  where the holes were."; an ice cream seller by a parked spot (idle 'hands-on-hips'): "Ninety-nine flavours. Ninety-eight
  of them are vanilla."

## Change
- `games/gnome-theft-auto/src/living/hamletDunelow.ts`: the builder and the residents, with an exported pure planner
  `planDunelow(): Piece[]` (houses first) so it can be tested without a scene.
- NEW `games/gnome-theft-auto/src/living/hamletDunelow.test.ts`: the plan has 8-12 house pieces; every house is >= 16 m from roads and
  within 75 m of the centre; every piece is in region 'south-shore' (`regionAt` from '../levels'); building into a fresh
  `THREE.Scene` with an empty boxes array does not throw and pushes >= 10 boxes; the residents are in the region, 2 of
  them, unique ids.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/living/hamletDunelow.test.ts` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
Other `living/*` files (other workers: the other hamlets, roadside, the tarn), `settlements.ts`, prefabs, lore docs.

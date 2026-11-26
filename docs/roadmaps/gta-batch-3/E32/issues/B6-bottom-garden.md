Epic: E32-B (nine holes, parallel build)
Depends on: none · Worker: sonnet (general-purpose) — hole dressing and environmental storytelling

First read `docs/roadmaps/gta-batch-3/E32/issues/_env.md` (environment + foundation facts) and
`docs/roadmaps/gta-batch-3/E32/issues/_canon.md` (names, story, tone: follow it exactly).

## Goal
The Bottom Garden is built and dressed so each of holes 4..8 feels hand-crafted and tells small stories: the potting
shed with its walkable roof tee and ladder, the giant birdbath in the Drip, the rhubarb patch with giant plants ringing
hole 8's green, the opening ribbon and marquee at hole 4, maze dressing at hole 5, and signs with jokes. This is the
epic's main craft piece: spend the time on placement, scale and small details, look at screenshots, adjust, repeat.

## Read first
- `games/gnome-theft-auto/src/golf/bottomGarden.ts` (the stub you fill; keep its exported interface).
- `games/gnome-theft-auto/src/golf/life.ts` lines 1-110 and 128-250: the helpers `put`, `decal`, `vignette`,
  `plateAt`, `firstOf` and how E15's vignettes and signs are made (copy these helpers into your file, do not import from
  life.ts, which another worker edits). `buildPieces` from `../homes/pieces` makes standing pieces with colliders.
- `games/gnome-theft-auto/src/golf/types.ts`: `HOLES` (indices 4..8), `POTTING_SHED`, `TURN_GATE`, `BOTTOM_GARDEN`,
  `MAZE_HEDGES`, `CART_PATHS`, `inPlay`, `inYard`, `distToLine`.
- `games/gnome-theft-auto/src/interiors/rooftops.ts`: `addRooftop({ id, name, minX, maxX, minZ, maxZ, y, solid,
  parapet })` (see `src/country/manor.ts` around line 140 for a terrace example), `rooftopById`.
- `packages/prefabs/src/catalog/gta-golf-plants.ts` (giant plant style) and `gta-golf-props.ts`.

Existing prefabs you can use (check with `getPrefab(id)` and fall back gracefully): `garden-shed`, `lean-to-shed`,
`ladder`, `birdbath`, `crop-cabbage-0..2`, `crop-pumpkin-0..2`, `cold-frame`, `wheelbarrow`, `compost-heap`,
`compost-bin`, `deck-chair`, `bunting-span`, `watering-can`, `bench`, `park-bench`, `signpost`, `tee-sign`,
`golf-ball`, `golf-bag`, `golf-club`, `golf-tee`, `teacup`, `thermos`, `picnic-basket`, `bunker-rake`,
`lost-ball-bucket`, `giant-hosta`, `giant-fern`, `giant-foxglove`, `giant-flower`, `giant-grass-blade`, `hedge-shears`,
`gnome-statue`, `glaze-rim-sunflower`, `pl-marrow`. Search more in `packages/prefabs/src/catalog/` (grep `id: '`).

## Change
- `packages/prefabs/src/catalog/gta-golf-nine-props.ts` (yours): add what is missing, at least:
  `potting-shed` (a Tall-One potting shed with a **flat** felt roof, 8 m along x × 6 m along z × 2.6 m tall, door on
  +z, a window on the north (-z) side, a gutter; origin at the ground centre), `giant-rhubarb` (huge crinkled leaves on
  red stalks, ~3 m), `giant-sunflower` (~4.5 m), `opening-ribbon` (two brass posts 6 m apart with a red ribbon and a bow,
  1 m tall), `ceremonial-scissors` (oversized, ~1 m), `turf-roll-stack`, `opening-marquee` (small white party tent,
  4×4 m, bunting on the ridge), `giant-birdbath` (stone pedestal bowl, about 4.5 m tall and 5 m across the bowl; or
  scale the existing `birdbath` if it looks right), `slug-trail`-free: slug trails are decals in code. Five `examine`
  lines each in the Hedgeworth voice. `npm test -w packages/prefabs` must pass for your ids.
- `src/golf/bottomGarden.ts`: `buildBottomGarden(scene)` builds into one named group `hedgeworth-bottom-garden`:
  1. **The potting shed** at `POTTING_SHED` (yaw 0) with solid wall colliders (one Box over its rectangle with
     `h = ground + roofY - 0.02`), and `addRooftop({ id: 'hedgeworth-potting-shed-roof', name: 'the potting shed roof',
     minX/maxX/minZ/maxZ: the shed rectangle, y: ground + POTTING_SHED.roofY, solid: false, parapet: false })` (guard
     with `rooftopById` so a second build does not throw). The `ladder` prefab leaning against the east wall at
     `POTTING_SHED.ladder` (top at the roof edge). A small sign by the ladder: `HOLE 7 TEE: UP THE LADDER.\nONE GNOME AT
     A TIME.\nTHE ROOF IS LISTENING.` Roof details: a deck chair at the west end of the roof, a flowerpot, a watering
     can; keep the middle 5×5 m clear (the tee mat is drawn there by another file).
  2. **Hole 4, Peony's Promise**: `opening-ribbon` across the front of the green (between green and tee side, about
     (-1259, 860), yaw so the ribbon runs north-south across the approach, posts **outside** the green circle r+1),
     `ceremonial-scissors` on a little stand or cushion beside it, `opening-marquee` off the fairway north of the
     green with `bunting-span`, a trestle of untouched teacups and a cake under a cloche, `turf-roll-stack`s by the
     tee. A plaque sign: `HOLE 4. PROMISED: EVERY SEASON.\nDELIVERED: THIS ONE.` Vignette story: the opening nobody
     held (chairs in rows facing the ribbon, one knocked over, programmes on the grass as decals).
  3. **Hole 5, The Maze**: dressing inside the maze (no new hedges; walls come from another file): a member's tam on
     the grass with a trail of golf tees as breadcrumbs that loops back on itself (decals or `golf-tee` props), a
     dropped scorecard with a hand-drawn map (decal), a ball resting against a hedge. Sign at the tee: `THE MAZE.\nIF
     FOUND, PLEASE RETURN MEMBERS TO THE CLUBHOUSE.` Keep props off hole 5's fairway centreline (rough only, ≥ 2 m off
     the path line) except decals.
  4. **Hole 6, The Drip**: `giant-birdbath` standing in the pond at (-1248, 934) with a round solid collider (the
     pedestal only, Box `shape: 'round'`), a leaking hosepipe running from the north edge of the garden into the pond
     (a thin green tube of cylinder segments, or a prefab if one fits) with a drip, a heap of wet balls on the bank with
     a long-handled net, sign `THE DRIP.\nFED BY HOSEPIPE POND,\nWHEN THRIFT REMEMBERS.`
  5. **Hole 7, The Potting Shed**: cabbage rows on the right (south) of the line of play, off the fairway; a bunker
     rake in the front bunker.
  6. **Hole 8, The Rhubarb Patch**: the vegetable patch inside the dogleg (about x -1095..-1045, z 890..922, keep it
     out of `inPlay(x, z, 1)`): rows of cabbages, pumpkins, a cold frame, a wheelbarrow with a fork, slug trails
     (decals) toward a half-eaten cabbage, a scarecrow-gnome if a prefab fits. A ring of `giant-rhubarb` and
     `giant-sunflower` round hole 8's green just outside the fringe (green r 9 + 3 m fringe: place at r + 4..r + 7 m),
     leaving the front (east, toward the fairway) open about 70 degrees wide. These giants are **soft** (no collider):
     return them in `soft` (`{ x, z, r }`, r ≈ 0.4 × footprint). Sign: `THE RHUBARB PATCH.\nTHE PLANTS WERE HERE FIRST.`
  7. **The Turn** (south side of the Turn Gate): a little halfway table with a tea urn, cups and an honesty box, sign
     `THE TURN.\nTEA: HONESTY BOX.\nHONESTY: ALSO HONESTY BOX.`
  8. Anything solid gets a Box; anything you can drive through has none. Nothing solid may stand in `inPlay(x, z, 0.5)`
     except the shed (it is the tee) and the birdbath (it is in the pond). Flat things (decals, ribbons on the ground)
     use `flatLayer(material, LAYER.decal)` from `@lawn/depth` and a small lift; boxes must not share faces.
  9. `update(dt, t)`: the hosepipe drip (a falling drop every ~1.5 s) and a gentle bunting sway are enough.
- `src/golf/bottomGarden.test.ts` (new): with `installFakeDom()` (see `src/flora/world.test.ts` for the import) build into
  a `THREE.Scene`; assert the group exists, the rooftop is registered at about ground + 2.6, `soft` has ≥ 8 entries all
  inside `BOTTOM_GARDEN` and outside `inPlay(x, z)`, and every box is inside `inYard` and (except the shed and birdbath
  boxes) does not overlap `inPlay(centre, 0.5)`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/bottomGarden.test.ts` passes; `npm test -w packages/prefabs`
  passes for your ids; `npx tsc --noEmit -p games/gnome-theft-auto` clean for your files.
- Screenshot pass (scratchpad `B6/`), at least: `h4:-1150,850,-1.6`, `h4green:-1245,852,-1.3`, `h5:-1318,842,0`,
  `h6:-1282,932,1.5`, `h7roof:-1176,954,1.75`, `h8:-1030,955,3.14`, `h8green:-1080,868,-1.4`, `turn:-1140,836,3.14`.
  Look at every one, fix what looks wrong (floating, sunk, too small to read, clutter on the fairway), re-shoot. Do at
  least two rounds of adjustments. Report the final list and what you changed between rounds.

## Out of scope
yard.ts (fences, hedges, the Turn Gate prefab), life.ts (residents, hole signs at the tees, the mole), course.ts /
greens.ts (tee mats, greens), runtime.ts, types.ts (report a coordinate problem instead of editing).

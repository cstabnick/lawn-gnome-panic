Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): campus layout and dressing

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
`src/campus/grounds.ts` lays out Rootwell University's grounds so the campus reads as an old, mown, well-kept university
(and not as Turfton's towers): the gate and drive in from the road, the car park, the quad with its striped lawn, cross
paths and the founder's statue, paths to every front door, clipped hedges, trees, lamps, benches, bike racks, bins and
college banners. Everything is drivable where it should be and nothing blocks a door.

## Background (confirmed)
- Places (`src/campus/types.ts`): `CAMPUS.site` x 980..1300, z -350..-50 (flat ground); `CAMPUS.quad` x 1080..1210,
  z -265..-140, `quadCentre` (1145, -202); `gate` (982, -200) facing east; `drive` from (946, -200) (the `east-band-north`
  road's edge, x ~945) to (1080, -200), 8 m wide; `parking` x 1000..1060, z -190..-152; `sugarStore` (1265, -224)
  (another worker dresses it); `pitch` (1040, -95). `CAMPUS_BUILDINGS`: every building's centre, yaw, w x d (footprint:
  w along x and d along z for yaw 0/PI, swapped for +-PI/2) and front `door` spot. The buildings themselves, their
  colliders and name plates are another worker's (`buildings.ts`); vignettes, signs and posters are another worker's
  (`story.ts`): leave the strip 3..10 m in front of each building free of anything but your paths, so they have room.
- Region look (`docs/lore/entries/apocrypha/rootwell-university.md`): mown lawns, clipped hedges, iron railings round
  old learned halls; stone and clay walls, slate roofs, red flowers.
- Existing prefabs to use (check each id exists with `getPrefab(id)` from `@lawn/prefabs` or by grepping
  `packages/prefabs/src/catalog/`): `euro-box-hedge`, `hedgerow`, `hedge-arch`, `euro-plane-tree`, `broadleaf-tree`,
  `giant-oak`, `city-round-tree`, `garden-lamp-post`, `euro-lamp-post`, `park-bench`, `bench`, `bike-rack`,
  `euro-bike-rack`, `litter-bin`, `park-noticeboard`, `notice-board`, `roundabout-planter`, `signpost`, `parking-meter`.
  New E13 prefabs being added right now (place them; a missing one is skipped with a warning): `founder-statue`,
  `quad-sundial`, `college-banner` (tint red, trim gold).
- Flora rule: no colliders on mowable plants (flowers, little bushes <= 1.8 m). Hedges and trees are solid scenery
  prefabs (use `solid: true` for trees and hedges, `solid: false` for lamps' thin poles is fine either way; benches
  solid false).
- Scenery helpers: `src/homes/pieces.ts` `buildPieces` (returns AABB colliders: push into `boxes`), `textPlate`.
  Flat surfaces: `THREE.PlaneGeometry` rotated flat, 0.02-0.06 above `heightAt`, `MeshLambertMaterial`,
  `flatLayer(mat, LAYER.<x>)` from `@lawn/depth` (one material per layer). Put flat meshes in one group; merge
  geometries per material where there are many (`mergeGeometries` from `three/examples/jsm/utils/BufferGeometryUtils.js`)
  and register the group with `registerCull(group, 'building')` from `../cull` if it is large, or split it into a few
  cells (`src/cull.ts` `STATIC_CELL` = 96 m) so phones draw only what is near.

## Read first
- `games/gnome-theft-auto/src/campus/types.ts`; `src/campus/grounds.ts` (stub; keep the signature).
- `games/gnome-theft-auto/src/homes/pieces.ts`.
- `games/gnome-theft-auto/src/winter/hill.ts` (a finished scenery builder: pieces, plates, flat decals, layers).
- `games/gnome-theft-auto/src/cull.ts` lines 1-80 and `registerCull` / `buildStaticCells` (what the cull classes mean).

## Change
`src/campus/grounds.ts`, `buildCampusGrounds(scene, boxes)`:
- **Drive and gate**: the drive as a dark asphalt strip (LAYER.road) from (946, -200) to (1080, -200), 8 m wide, with a
  white centre dash line (LAYER.marking); two stone gate pillars (architecture boxes 1.2 x 3.2 x 1.2, colliders) either
  side of the drive at x 982 (z -205.5 and -194.5), each with a `textPlate` "ROOTWELL\nUNIVERSITY" facing west, and an
  iron railing fence (thin dark boxes: posts every 2.5 m and two rails, colliders 0.2 thick) along the site's west edge
  (x 981) north and south of the gate for ~60 m each way, leaving the drive open.
- **Car park** (`CAMPUS.parking`): an asphalt area (LAYER.area) with white bay lines (LAYER.marking) for ~14 bays in two
  rows facing a central aisle, joined to the drive; a `parking-meter`; a sign "VISITORS / FACULTY / DEAN (ALL OF THEM)".
- **The quad**: lawn stripes (alternate light/dark green strips 6 m wide, LAYER.tint, inside `CAMPUS.quad`), a
  pale gravel path ring just inside the quad edge (3 m wide, LAYER.road), two diagonal cross paths meeting at the
  centre, a round paved plaza (r 7, LAYER.area) at `quadCentre` with the `founder-statue` on it (solid; its plinth plaque
  gets a `textPlate` "OUR FOUNDER\nWHO FELL FIRST" on the plinth's +z face, check `prefabBox('founder-statue')` for
  where that is) and the `quad-sundial` 9 m south-east of it (solid false); low `euro-box-hedge` borders along the
  quad's long sides with gaps where paths cross; 4-6 `park-bench`es facing in round the ring.
- **Paths to doors**: a 3 m gravel path (LAYER.road) from the quad ring (or the drive, for Wicket Lodge, the Dean's
  lodge, Bedstraw House, the Clod) to every building's `door` spot, ending at the door. No colliders on any path.
- **Trees, lamps, banners**: 18-26 trees (mix `euro-plane-tree` along the drive as an avenue, `broadleaf-tree` / `giant-oak`
  round the quad corners and between buildings, never inside 4 m of a door, a path, the drive or a building footprint),
  12-16 lamps along the drive and the quad ring, 6 `college-banner`s on the quad corners and at the gate, 3-4 bike
  racks by Bedstraw House and the Long Shelf, 4-6 litter bins, a `park-noticeboard` by the quad's west entrance (the
  story worker pins posters near it: leave 3 m clear in front of it).
- **Red flowers**: window-box red is in the buildings; add 4-6 `roundabout-planter`s (or another planter prefab) with red
  flowers at path junctions (solid false).
- Everything inside `CAMPUS.site`; nothing solid inside the quad except the statue (within 4 m of `quadCentre`) and
  the hedges; nothing on the drive.
- New `src/campus/grounds.test.ts` (vitest, `installFakeDom` from `../testing/fakeDom` if needed): after
  `buildCampusGrounds(new THREE.Scene(), boxes)`: no collider contains any `CAMPUS_BUILDINGS` door spot (1 m margin) or
  any point of the drive centre line sampled every 4 m; every collider lies inside `CAMPUS.site`; no collider overlaps
  any building footprint (compute it from x, z, w, d, yaw as described above); the quad (minus 5 m round the centre and
  the hedge rows) has no collider at a 6 m grid of sample points.

## Contract
`buildCampusGrounds(scene, boxes): void` (stub signature).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/campus/grounds.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/campus/grounds*.ts`.
- Do not run or update `src/layout.golden.test.ts` (the lead does).

## Out of scope
Every other file (buildings, story, interiors and the rest of `src/campus/` are other workers').

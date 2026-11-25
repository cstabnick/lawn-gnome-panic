Epic: E28-2 Fill (GTA batch 3, world expansion II)
Depends on: none (prefabs from issue 2D are being added in parallel: guard every placement with `getPrefab(id)`)

(Read `docs/roadmaps/gta-batch-3/E28/epic-2/_env.md` first: environment, coordinates and the new places.)

## Goal
Three thresholds of the second expansion exist in the world, each with a small story told by props:
1. **The Wickets**: the old perimeter fence still stands on x = -1397 from z -900 to z 1100 (between Trellisdown and
   Pardonlin), with a 14 m gap where each road passes (z -500, z -30, z 1000). Each gap has a `wicket-gate` (open, on
   the north side of the gap), a `customs-hut` on the south side and a `wicket-sign` facing east (toward arriving
   Turfton traffic). Vignette at the Grand Wicket (z -30): a queue of luggage (`lost-suitcase` x2, `crate`), a gnome's
   hat on the hut's counter with a stamp beside it, a `traffic-cone` marking the "declare your acorns" line.
2. **Roundabout islands**: every roundabout in `ROUNDABOUTS` (`src/roundabouts.ts`) gets a kerbed grass island and a
   planter; the Hatwheel's island also gets the "lost tourist" vignette: a `lost-suitcase` lying open, a `signpost`
   with too many arms, three `boxwood-ball`s.
3. **The Unmown's gate** at the end of `unmown-lane` (around (-1540, -1120), ranger station site centre (-1560, -1150),
   do not build inside the rectangle x -1585..-1535, z -1170..-1130): an `unmown-sign` beside the lane, and the
   "swallowed mower" vignette 12 m off the lane: an old mower prefab (pick one from
   `packages/prefabs/src/catalog/mowers.ts`, tinted rust `0x8a4b2a`) sunk 0.3 m into the ground with
   `wildflower-patch` and `ornamental-grass` growing through and round it.

## Read first
- `games/gnome-theft-auto/src/pardonlin/wickets.ts`, `src/roundaboutIslands.ts`, `src/unmownGate.ts`: the stubs you
  fill (keep the exported signatures; `world.ts` already calls them after the biomes, scenery and water are built).
- `games/gnome-theft-auto/src/roundabouts.ts`: `ROUNDABOUTS` (`{ id, x, z, r, width }`), `islandRadius(rb)`.
- `games/gnome-theft-auto/src/biomes.ts` lines ~919-966: how the perimeter fence is built (plank bays and posts as merged
  box geometries, one collider box per side). The Wickets fence is that same fence continuing: copy the look (same
  heights, plank step and colours), not the code path.
- `games/gnome-theft-auto/src/collide.ts`: `placeRoundBox(boxes, cx, cz, r, h)`. A `Box` is `{ minX, maxX, minZ, maxZ, h }`
  where `h` is the **world y of its top** (ground height + object height).
- `games/gnome-theft-auto/src/terrainMesh.ts`: `placeOnGround(obj, x, z, lift?, lean?)`, `addGroundToGeometry(geo)`.
- `games/gnome-theft-auto/src/terrain.ts`: `heightAt(x, z)`.
- `packages/depth/src/layers.ts`: `flatLayer(material, LAYER.area)` for anything laid flat on the ground (the island
  grass disk); the kerb is a short cylinder ring, not a flat decal.
- `@lawn/prefabs`: `buildPrefab(id, { scale?, lights?: false })` returns a `THREE.Group` (origin on the ground, front +z);
  `getPrefab(id)` is undefined for unknown ids. Existing ids you may use: `crate`, `traffic-cone` (check with grep),
  `signpost`, `boxwood-ball`, `wildflower-patch`, `ornamental-grass`. New ids (issue 2D, may not exist yet):
  `wicket-gate`, `customs-hut`, `wicket-sign`, `roundabout-planter`, `lost-suitcase`, `unmown-sign`.

## Change
- `src/pardonlin/wickets.ts`: `buildWickets(scene, boxes)`: the fence (merged geometry, one `THREE.Mesh` per material),
  three collider boxes per gap-separated run (0.8 m thick, fence height + 1), the gates, huts, signs and the vignette;
  solid colliders for gate posts and huts (`boxes.push({ ..., h: heightAt(x, z) + height })`). Nothing within 7 m of a
  road centre line (gate leaves stand beside the road, not across it).
- `src/roundaboutIslands.ts`: `buildRoundaboutIslands(scene, boxes)`: for each roundabout, a grass disk of
  `islandRadius(rb)` (CircleGeometry, rotated flat, `addGroundToGeometry`, a MeshLambertMaterial grass green with
  `flatLayer(mat, LAYER.area)`), a 0.25 m kerb ring (CylinderGeometry open-ended or a thin TorusGeometry, light grey) at
  the island edge, a `roundabout-planter` scaled to about a third of the island radius in the middle, one round
  collider `placeRoundBox(boxes, rb.x, rb.z, islandRadius(rb), heightAt(rb.x, rb.z) + 0.35)`. The Hatwheel
  (`rb.id === 'roundabout/hatwheel'`) gets the vignette props inside the island.
- `src/unmownGate.ts`: `buildUnmownGate(scene, boxes)`: the sign and the swallowed-mower vignette, colliders for the
  mower and sign.
- Every prefab placement: skip silently when `getPrefab(id)` is undefined; set `castShadow` like other scenery if the
  file you copy from does.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- `cd games/gnome-theft-auto && npx vitest run src/collide.test.ts src/propsOffRoad.test.ts` pass.
- A short note in your report of every placement's world coordinates (the lead screenshots them).

## Out of scope
`world.ts`, `biomes.ts`, `roundabouts.ts`, any prefab catalog file (issue 2D owns them), traffic code.

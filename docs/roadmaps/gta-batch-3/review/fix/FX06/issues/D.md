Epic: FX06 epic 1, issue D: the Unmown's trails as a soft-edged ribbon (G6#11, D58)
Depends on: none (dev port 5519)

## Goal
The Unmown loop and the Reedmere trail read as worn footpaths with soft, slightly irregular edges, instead of dirt
painted on the 2 m terrain grid with 90-degree stair-steps several metres across (editor shot
`...\shots\G6\reedmere-hide.png`).

## The problem today
The trails are road paths `trail/unmown-loop` (width 4) and `trail/reedmere-boardwalk` (width 3) in
`src/data/levels/the-unmown.level.json`. `src/terrainPaint.ts` rasterises every trail into the 2 m paint grid (cells
whose centre is within width/2 -> dirt), and `terrainMesh.ts` draws each cell with that texture: a staircase.
Another worker (in parallel) adds a feathered border pass to the paint grid; that makes edges irregular but still
2 m cells. Your ribbon covers the trail properly.

## Read first
- `src/unmown/trails.ts` (`buildUnmownTrails(scene, boxes)`, called once from `src/living/build.ts` during the world
  build; also runs in tests without a DOM).
- `src/levels.ts` `trails()` (line ~261): `{ id, region, points: [x, z][] (WORLD coordinates), width }[]`.
- `src/terrain.ts` `heightAt(x, z)` (the ground follows the 2 m height grid triangles; heights vary along a trail).
- `@lawn/depth`: `flatLayer(material, LAYER.road)` (polygon offset draw layer; LAYER.road = 3). Repo rule: anything
  flat on the ground takes a draw layer, never only a lift.
- `src/textures.ts` `groundTexture(kind: GroundKind)` ('dirt' is a kind) and how `terrainMesh.ts` sets UVs
  (`planarUv(geo, TILE[kind])`) so your ribbon's dirt matches the terrain dirt scale.

## Change (only `src/unmown/trails.ts` and `src/unmown/trails.test.ts`)
1. Export `planTrailRibbon(points: readonly (readonly [number, number])[], width: number): { positions: number[]; alphas: number[]; index: number[] }`
   (pure: x/z/y triples with y = heightAt + 0.03, a per-vertex alpha): a strip along the polyline sampled every
   ~1.5 m (and at each corner, with mitred/rounded joins so corners do not pinch), 4-6 vertices across: an opaque core
   of width + 1.6 m (it must fully hide the painted 2 m cells, which reach about 1.4 m past width/2) feathering to
   alpha 0 at about width/2 + 2 m on each side. Wobble the outer edge a little with smooth noise
   (`valueNoise` from `src/landforms/noise.ts`) so it reads worn, not machine-cut. Skip samples on water
   (`waterAt`) if any.
2. In `buildUnmownTrails`, build one mesh per trail id in `['trail/unmown-loop', 'trail/reedmere-boardwalk']` from
   `trails()`: `MeshStandardMaterial({ map: groundTexture('dirt'), transparent: true, depthWrite: false, roughness: 1 })`
   with per-vertex alpha (a `color` attribute of itemSize 4 with `vertexColors: true`, or an `alphaMap`-free
   `onBeforeCompile`; the simplest that works), on `flatLayer(material, LAYER.road)`, `receiveShadow = true`. UVs: the
   same planar world-space tiling as the terrain dirt. Name the meshes `unmown-trail-ribbon`. No DOM needed for the
   plan; the mesh build may guard `typeof document` like other builders if the texture needs a canvas.
3. Worn grass edge: optionally a second, wider and fainter band (darker, drier grass colour) under the feather; only if
   it looks better in the screenshots.
4. `src/unmown/trails.test.ts`: `planTrailRibbon` covers every point within width/2 + 0.8 m of the centre line with
   alpha 1 (sample a few hundred points), has alpha 0 at the outer edge, and every y is within 0.1 m of
   heightAt + 0.03.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/unmown` passes; `npx tsc --noEmit -p games/gnome-theft-auto` clean in your files.
- Screenshots (dev server on 5519), compared with `...\shots\G6\reedmere-hide.png`: stand on the Reedmere trail by the
  hide (the hide is in `src/living/config.ts` `UNMOWN_HIDES`; pick the Reedmere one, stand 6 m off it on the trail
  facing it) and on a diagonal stretch of the Unmown loop; also `--size 390x844`. No stair-steps visible; no
  flicker (run `npm run zfight -- http://localhost:5519/` from the repo root while your server is up and report it).

## Out of scope
`terrainPaint.ts`, `terrainMesh.ts`, the level json, every other file.

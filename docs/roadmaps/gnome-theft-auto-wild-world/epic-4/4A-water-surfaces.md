Epic: 4 (Wild World: water, bridges and boats)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: if `node`/`npm` is not found, in Git Bash run `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
  installed: never run `npm install`. Never commit, push, stash, reset, or `git checkout`/`git restore` any file.
- About ten other workers and two other planning sessions edit other files of this game at the same time. Edit only
  the files this issue names. If `tsc` or a test fails in a file you do not own, someone is mid-edit: ignore it.
- Repo rules: 3D scenes must not z-fight: anything flat on another surface takes a draw layer
  (`flatLayer(material, LAYER.<x>)` from `@lawn/depth`), not just a small lift. Self-generated textures only.

## Goal
`games/gnome-theft-auto/src/waterMesh.ts` draws the water: a ribbon along every river and the canal at its water
level, a surface for Loch Moss and the Puddle Sea, a foam line along the shores, and a flow texture that scrolls
downstream. Today the file is a stub that draws nothing.

## Read first
- `games/gnome-theft-auto/src/waterMesh.ts`: the stub and its exported signature (keep it exactly).
- `games/gnome-theft-auto/src/water.ts`: `COURSES`, `BODIES`, `courseProfile(id)` (`s[]` arclength, `x[]`, `z[]`,
  `surface[]` sampled every ~2 m from upstream to downstream), `bodyLevel(id)`, `bodyRadius(w, x, z)` (< 1 inside),
  `shorePoint(w, angle)`, `waterOn()`.
- `packages/depth/src/layers.ts`: `LAYER` (`ground 0, tint 1, area 2, road 3, edge 4, marking 5, decal 6`) and
  `flatLayer(material, layer)`.
- `games/gnome-theft-auto/src/config.ts`: the `WATER` block at the end (`colour`, `deepColour`, `foam`, `flowSpeed`).

## Change
- `games/gnome-theft-auto/src/waterMesh.ts`: implement `buildWaterMeshes(scene)`:
  - If `!waterOn()`, return the no-op object.
  - **Rivers and canal**: for each `c` of `COURSES`, take `p = courseProfile(c.id)`. Build one `THREE.BufferGeometry`
    triangle strip: at each sample k, a left and a right vertex at `(x[k], z[k]) +- n * (c.width / 2 + 1.5)` (n = the
    unit normal of the path at k, from the neighbouring samples) and `y = p.surface[k]`. Skip samples inside a body
    (`bodyRadius(b, x, z) < 0.97` for any `b` of `BODIES`), keeping a run contiguous (split into separate strips if a
    body cuts one in the middle). UV: `u` 0 on the left, 1 on the right; `v = p.s[k] / 6` (so v grows downstream).
    `computeVertexNormals()`.
  - **Lochs and sea**: for each `b` of `BODIES` with `level = bodyLevel(b.id)`: a fan of 96 triangles from the centre
    `(b.cx, level, b.cz)` to rim points `shorePoint(b, a)` pushed out by `2 / Math.min(b.a, b.b)` of the radius (so the
    edge tucks under the bank). UV = world `x / 8`, `z / 8`.
  - **Foam**: thin strips at the waterline: for courses, two strips per side from `c.width / 2 - 0.6` to
    `c.width / 2 + 0.3` from the centre line; for bodies a ring from radius 0.985 to 1.005 of the shore. All at the
    water level + 0.01.
  - **Flow texture**: one `THREE.CanvasTexture` from a 128 x 128 canvas (`document.createElement('canvas')`): fill
    `WATER.colour`, then ~60 short lighter streaks (`WATER.foam` at alpha 0.15-0.3) drawn with a seeded random (copy a
    small mulberry32; never `Math.random`, so every load looks the same). `wrapS = wrapT = THREE.RepeatWrapping`. A
    second texture instance (`tex.clone()`, `needsUpdate = true`) for the bodies.
  - Materials: water `new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, roughness: 0.2, metalness: 0.1,
    transparent: true, opacity: 0.88 })`; foam `new THREE.MeshBasicMaterial({ color: WATER.foam, transparent: true,
    opacity: 0.45 })`. Every water and foam material goes through `flatLayer(...)` with these layers, so overlapping
    surfaces never z-fight: bodies `LAYER.tint`; `river-upper` and `canal` `LAYER.area`; `river-ravine` and
    `river-farm` `LAYER.road`; all foam `LAYER.decal`. Use a separate material per layer.
  - Meshes: `name` `water:<id>` and `water-foam:<id>`, `receiveShadow = true`, `castShadow = false`; add them all to
    one `THREE.Group` named `water`, added to `scene`.
  - `update(dt, focusX, focusZ)`: scroll the river texture downstream: `riverTex.offset.y -= (WATER.flowSpeed / 6) * dt`
    (v grows downstream, so a falling offset moves the pattern downstream); drift the body texture slowly
    (`offset.x += 0.01 * dt`). Ignore focusX/focusZ (keep the parameters).
- Optional: `games/gnome-theft-auto/src/waterMesh.test.ts`: with `installFakeDom()` from `./testing/fakeDom` (see
  `layout.golden.test.ts` for how it is used), `buildWaterMeshes(new THREE.Scene())` adds a `water` group with a
  `water:canal` mesh whose vertices all sit at `courseProfile('canal').surface` values.

## Contract
```ts
export interface WaterMeshes { update(dt: number, focusX: number, focusZ: number): void }
export function buildWaterMeshes(scene: THREE.Scene): WaterMeshes
```
`world.ts` already calls it after the biomes and calls `update` every frame. Do not edit world.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `waterMesh.ts`.
- `(cd games/gnome-theft-auto && npx vitest run src/water.test.ts)` passes (and your own test, if you wrote one).
- With a dev server on **port 5481 only** (`npm run dev -w games/gnome-theft-auto -- --port 5481 --strictPort`, in the
  background), `npm run zfight -- "http://localhost:5481/?offline&no-intro&at=-60,240,1.57"` reports no z-fighting in
  any `water*` mesh, and `bash tools/smoke.sh "http://localhost:5481/?offline&no-intro&at=-60,240,1.57" gta-hud` shows
  no console errors. Stop the server afterwards.

## Out of scope
`water.ts`, `terrain.ts`, `world.ts`, `biomes.ts`, any other file. Do not regenerate `layout.golden.json`.

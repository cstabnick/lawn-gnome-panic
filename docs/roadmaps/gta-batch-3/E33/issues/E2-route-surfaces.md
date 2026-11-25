Epic: E33 mountain routes, wave 1. Worker: Haiku.
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E33/_common.md` first. Another worker is redesigning the route lines at the same time:
your code must work for any line (read everything from the Track, never hard-code coordinates).

## Goal
The mountain routes are drawn: asphalt with a dashed white centre line and solid edge lines on the two roads, gravel on
the Hatband, a dirt path on the Brim Walk, and the pads (lay-bys, café terrace, lookouts) as flat patches. Draped on the
ground, on draw layers, no z-fighting, no colliders.

## Read first
- `games/gnome-theft-auto/src/mountainRoutes/surface.ts` (the stub you fill in), `routes.ts`, `pads.ts`, `types.ts`
- `games/gnome-theft-auto/src/raceTrack/trackMesh.ts` — lines 1-125 and 210-290: `mat`, `quad`, `dashes`, `addMesh`,
  `trackLane`, and `buildDirtTrackSurface` (draped ribbons with `drapedRibbon(points, width, lift)` from
  `../terrainMesh`, merged with `mergeGeometries` from `three/examples/jsm/utils/BufferGeometryUtils.js`, textured with
  `groundTexture(kind)` and `planarUv(geo, TILE[kind])` from `../textures`). These helpers are not exported: copy the
  few you need into surface.ts (small private functions).
- `packages/depth/src/layers.ts` — `LAYER.area` (2), `LAYER.road` (3), `LAYER.edge` (4), `LAYER.marking` (5).

## Change
- `src/mountainRoutes/surface.ts` — implement `export function buildRouteSurfaces(scene: THREE.Scene): void`:
  - For each route in `ALL_ROUTES` (from `./routes`) by `track.def` (a `RouteDef`, cast `track.def as RouteDef` to read
    `kind`):
    - 'road': mesh `e33-<id>-road`: `drapedRibbon(lane(0), def.width, 0.08)`, material on `LAYER.road`, textured
      `groundTexture('asphalt')`, `planarUv(geo, TILE.asphalt)`; mesh `e33-<id>-lines`: two solid edge lines 0.15 m wide
      at lat ±(width/2 − 0.35) and the centre line dashed (3 m on, 5 m off), 0.15 m wide, white 0xf2f2f2, lift 0.11,
      on `LAYER.marking`; mesh `e33-<id>-verge`: a gravel strip each side from the road edge to `width/2 + shoulder`,
      lift 0.06, `LAYER.edge`, textured `groundTexture('gravel')`.
    - 'track': mesh `e33-<id>-road`: ribbon `def.width` wide, lift 0.07, `LAYER.road`, `groundTexture('gravel')`.
    - 'trail': mesh `e33-<id>-path`: ribbon `def.width` wide, lift 0.06, `LAYER.road`, `groundTexture('dirt')`, colour
      tint 0xd8c8a8 so it reads as a trodden path.
    Lanes: points every 2nd sample (`trackLane` from trackMesh.ts: `[S[k].x + S[k].nx * lat, S[k].z + S[k].nz * lat]`,
    plus the last sample). Use `drapedRibbon` with its default step.
  - For each pad in `ALL_PADS` (from `./pads`): one flat rectangle (the four corners from `p.x, p.z, p.yaw, p.hw, p.hd`:
    local +z is `(sin yaw, cos yaw)`, local +x is `(cos yaw, -sin yaw)`), subdivided into a grid of cells about 2 m so
    it drapes, lifted 0.05 m and draped with `addGroundToGeometry` (from `../terrainMesh`), merged per surface kind into
    meshes `e33-pads-asphalt`, `e33-pads-gravel`, `e33-pads-dirt`, `e33-pads-rock`, on `LAYER.area`, textured with the
    matching `groundTexture`. Skip the part of a pad that lies on a route's road (a cell whose centre has
    `track.onRoad(x, z)` true for any route), so the pad never overlaps the road mesh.
  - Every mesh: `receiveShadow = true`, `castShadow = false`, `name` as above, added to `scene`.
- New test `src/mountainRoutes/surface.test.ts`: under node with `installFakeDom()` (from `../testing/fakeDom`) and
  `vi.mock('../audio', () => ({ play: () => undefined }))`, call `buildRouteSurfaces(new THREE.Scene())` and check: a
  `e33-<id>-road` (or `-path`) mesh exists for every route id; `e33-brim-gap-road-lines` and `e33-spine-cut-lines` exist;
  every material of these meshes has `polygonOffset === true` (flatLayer sets it); every vertex of the road meshes lies
  between 0.0 and 0.3 m above `heightAt` at its x, z (sample 200 vertices per mesh).

## Contract
`export function buildRouteSurfaces(scene: THREE.Scene): void` — unchanged signature (index.ts calls it once).

## Done when
- `npx vitest run src/mountainRoutes/surface.test.ts` passes.
- `npx tsc --noEmit -p .` clean in your files.

## Out of scope
Every other file under `src/mountainRoutes/`, `raceTrack/trackMesh.ts` (read only, do not export from it),
`terrainMesh.ts`, `textures.ts`.

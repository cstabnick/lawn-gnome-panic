Epic: 2 Parts
Depends on: none

## Environment
Read `docs/roadmaps/gta-race-track/_env.md` first (it lists the track API you use).

## Goal
`buildTrackSurface(scene)` in `games/gnome-theft-auto/src/raceTrack/trackMesh.ts` draws every flat surface of the
Lost & Found Speedway: gravel run-off, the asphalt road, red/white kerbs on the corners, a white edge line, the
chequered start/finish line, the grid boxes, and the pit lane with its markings. All merged into a handful of meshes,
each on its draw layer, draped on the terrain (the terrain already has the track's hills, banking and jumps).

## Read first
- `games/gnome-theft-auto/src/raceTrack/track.ts` (all of it)
- `games/gnome-theft-auto/src/raceTrack/trackMesh.ts` (the stub you fill; keep its exported signature)
- `games/gnome-theft-auto/src/terrainMesh.ts` lines 15-140: `drapedRibbon(points, width, lift, step)` (a ribbon along
  a polyline, draped on heightAt, normals from the ground) and `addGroundToGeometry(geo)` (adds heightAt to every
  vertex y of a flat world-space geometry)
- `games/gnome-theft-auto/src/world.ts` lines 110-125 (`merged()`: how a road mesh gets its texture:
  `planarUv(geo, TILE[kind])`, `groundTexture(kind)` from `src/textures.ts`, `flatLayer(material, LAYER.road)`) and
  lines 690-735 (how highways are drawn on hills)

## Change
`games/gnome-theft-auto/src/raceTrack/trackMesh.ts`:
- Build polylines from `trackSamples()` (every 2nd sample is plenty), CLOSED: append the first point at the end so the
  ribbon joins up. Offset polylines: point + n * lat (n = (nx, nz), the left normal).
- Run-off: `drapedRibbon(centre, 2 * TRACK.barrierOffset, 0.015)` with the 'gravel' ground texture, `LAYER.area`.
- Road: `drapedRibbon(centre, TRACK.width, 0.03)`, 'asphalt' texture, `LAYER.road`. Make it read as a race track:
  multiply the material colour to a slightly darker 0xb8b8bc.
- Edge lines: two white ribbons 0.3 wide at lat +-(TRACK.width/2 - 0.4), lift 0.04, `LAYER.marking`.
- Kerbs: where the corner radius 1/|curv| < 80 m, on both edges, a ribbon 1.2 wide centred at lat
  +-(TRACK.width/2 + 0.6), lift 0.045, `LAYER.edge`, split into 2 m blocks alternating red 0xd8342c and white 0xf4f4f4
  (two merged meshes, one per colour). Skip kerb blocks inside `BARRIER_GAPS` ranges on that side (side 'left' = +lat).
- Start/finish line: at s = 0 a band 2 m long across the full road width, a chequer of 1 m squares (black/white, two
  merged meshes), lift 0.05, `LAYER.marking`. Build each square as a small flat quad at its 4 corners' heightAt + lift
  (use `addGroundToGeometry` on a PlaneGeometry rotated flat and translated to world).
- Grid boxes: for slot 0..7 `gridSlot(slot)` gives {x, z, yaw}: a white open rectangle (three 0.25 wide strips: front
  and two sides, 2.6 wide x 4 long) around each, lift 0.05, `LAYER.marking`.
- Pit lane: `drapedRibbon(PIT_LANE, PIT_LANE_WIDTH, 0.03)` asphalt `LAYER.road` (same material as the road is fine),
  a dashed yellow 0xffd21f centre line (ribbons 0.25 wide, 2 m on / 2 m off) `LAYER.marking`, and the word-free
  "pit box" markings: for x = 714, 723, 732, 752, 761, 770 and 800 a yellow rectangle outline 6 x 6 centred at
  (x, -391) (outline strips 0.25 wide), `LAYER.marking`.
- Meshes `receiveShadow = true`, never `castShadow`. Give each mesh a `name` starting with `speedway-`.
- Keep a separate material per layer (flatLayer changes the material in place). Dispose the source geometries after
  merging (`mergeGeometries` from 'three/examples/jsm/utils/BufferGeometryUtils.js').
- Add a vitest `games/gnome-theft-auto/src/raceTrack/trackMesh.test.ts`: install the fake DOM
  (`installFakeDom()` from `src/testing/fakeDom`, see how `src/layout.golden.test.ts` imports it), mock
  `../audio` if needed, build into a `new THREE.Scene()`, and assert: at least 6 meshes named `speedway-*`, every one
  has `material.polygonOffset === true`, the road mesh's vertices all lie within 0.2 of `heightAt(x, z) + 0.03`.

## Contract
`export function buildTrackSurface(scene: THREE.Scene): void` (unchanged signature). No colliders, no prefabs.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files
- `npx vitest run src/raceTrack/trackMesh.test.ts` (from `games/gnome-theft-auto`) passes

## Out of scope
Every other file. Barriers, grandstands and lights are another issue (trackDressing.ts).

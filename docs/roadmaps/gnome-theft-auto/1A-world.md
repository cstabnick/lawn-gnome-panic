Epic: 1 (parallel modules)
Depends on: none

## Environment

- Repo root: `/home/user/lawn-gnome-panic` (Linux). Run commands from there. Dependencies are installed: do not run `npm install`. Do not commit.
- Game: `games/gnome-theft-auto` (three.js 0.187 + TypeScript + Vite). It already builds: every module exists as a STUB with its final exported signature. Your job is to replace ONE stub (or the files named below) with the real thing.
- About ten other workers are editing the other files of this game at the same time. Edit only the files your issue names. Keep every exported name and signature of your file exactly as in its stub, so other files keep compiling.
- The contracts are in `games/gnome-theft-auto/src/types.ts` (read it first, do not edit it) and all tuning numbers are in `games/gnome-theft-auto/src/config.ts` (read, do not edit). `src/collide.ts` (box collision, `angleDiff`) and `src/gnomes.ts` (town looks, names, `makeGnome`, `poseHandsUp`, `clearHandsUp`, `gnomeState`) are shared helpers: use them, do not edit them. `src/main.ts` is the wiring that calls your module; read it to see how you are called, do not edit it.
- Conventions: y up, 1 unit = one gnome's height (a gnome model is about 1.1 tall). Yaw 0 faces +z; forward = `(Math.sin(yaw), 0, Math.cos(yaw))`; the gnome's right = `(-Math.cos(yaw), 0, Math.sin(yaw))`. Turning right DECREASES yaw. Prefab models from `@lawn/prefabs` stand on y = 0 and face +z.
- `buildPrefab(id, { scale, tint })` (from `@lawn/prefabs`) returns a `THREE.Group`; it throws `Unknown prefab` for an id that does not exist yet. The new ids `squirt-pistol`, `super-soaker`, `zero-turn-mower`, `whirligig-mower`, `sandbag-wall`, `watch-tower` are being added by another worker right now; you may reference them, they will exist when the epic is done.
- Lore (Gnome Theft Auto is a parody set in the town of Turfton): no gore, nothing bleeds or dies; water guns only; soaked gnomes put their hands up and run. Gnomes are fired clay. No humans ever appear.
- Mobile matters: anything a player does must work by touch too (only the input/HUD issues build UI).
- Check: `npx tsc --noEmit -p games/gnome-theft-auto` must show no errors in YOUR files (errors in another worker's file mean they are mid-edit: ignore those). Do NOT run `vite build`, `npm run build` or a dev server: other workers share the folder and the port.

## Goal
`games/gnome-theft-auto/src/world.ts` builds Turfton: a grid town of roads and sidewalks whose buildings are giant garden objects, plus Fort Sandpit (a walled military base in a sandbox) in the south-east corner, and returns the `World` data (colliders, road graph, walk points, parked mowers).

## Read first
- `games/gnome-theft-auto/src/types.ts`: `World`, `Box`, `RoadGraph`, `RoadNode`, `FortSandpit`, `ParkedSpot`.
- `games/gnome-theft-auto/src/config.ts`: `WORLD_HALF` (130), `ROAD_LINES` ([-100,-50,0,50,100]), `ROAD_WIDTH` (10), `SIDEWALK_WIDTH` (2.5), `LANE_OFFSET`, `BASE`, `SPAWN` ({x:-6.25,z:14}), `COLORS`.
- `games/gnome-theft-auto/src/world.ts`: the stub to replace (keep `export function buildWorld(scene: THREE.Scene, renderer: THREE.WebGLRenderer): World`).
- `packages/prefabs/README.md`: `buildPrefab` usage.

## Change
`games/gnome-theft-auto/src/world.ts` only. Use a seeded RNG (mulberry32 with seed 7, written in the file) so the town is the same every load.

1. **Sky and light.** `scene.background = new THREE.Color(COLORS.sky)`, `scene.fog = new THREE.Fog(COLORS.sky, 90, 230)`. A `HemisphereLight(0xffffff, 0x4a6b3a, 0.9)` and a `DirectionalLight(0xfff2d8, 1.6)` at (60, 100, 40) with `castShadow = true`, `shadow.mapSize` 2048x2048, shadow camera left/right/top/bottom ±140, near 1, far 300. `renderer` is passed in; you may ignore it.
2. **Ground.** One grass plane `WORLD_HALF*2` square (`COLORS.grass`, `receiveShadow`), rotated flat at y = 0.
3. **Roads.** For every value v in `ROAD_LINES`: a strip along z at x = v, and a strip along x at z = v, from -WORLD_HALF to WORLD_HALF, `ROAD_WIDTH` wide, colour `COLORS.road`, at y = 0.02 (flat planes or very thin boxes, `receiveShadow`). Sidewalk strips `SIDEWALK_WIDTH` wide on both sides of each road (colour `COLORS.sidewalk`, y = 0.03). Dashed centre lines (`COLORS.roadLine`, 0.25 wide, 3 long every 6) at y = 0.04. **Leave out every road, sidewalk and line inside the base rectangle** (`x > BASE.minX && z < BASE.maxZ`), except the x = 100 road which stops exactly at the gate (z = BASE.maxZ). Merge strips of the same colour into one mesh if you like (BufferGeometryUtils `mergeGeometries` from `three/examples/jsm/utils/BufferGeometryUtils.js`) to keep draw calls low.
4. **Road graph.** One `RoadNode` per intersection (x, z) of two `ROAD_LINES` values, except intersections inside the base rectangle (that removes (100,-100)). `links` = ids of the neighbouring intersections along the same line (next value in `ROAD_LINES` in each direction) if both ends exist. `roads.laneOffset = LANE_OFFSET`. Every node must end up with at least 2 links.
5. **Blocks and buildings.** The blocks are the rectangles between consecutive road lines (and between ±100 and ±WORLD_HALF at the edges), shrunk by `ROAD_WIDTH/2 + SIDEWALK_WIDTH + 1.5` on every side. Skip blocks that overlap the base rectangle (grown by 4). Fill each block with 1 to 4 "buildings" placed so they don't overlap each other, chosen from this list of giant garden objects (prefab id, footprint size in units to scale it to):
   `flower-pot` 12, `garden-shed` 14, `birdbath` 10, `mailbox` 8, `watering-can` 12, `wheelbarrow` 12, `brick-stack` 10, `compost-heap` 12, `round-bush` 8, `cone-pine` 8, `stone-fountain` 10.
   For each: `const g = buildPrefab(id)`; measure it with `new THREE.Box3().setFromObject(g)`; `g.scale.setScalar(footprint / Math.max(sizeX, sizeZ))`; random yaw in steps of 90°; position it; `scene.add(g)`; then `g.updateMatrixWorld(true)` and push `Box3().setFromObject(g)` as a `Box` `{ minX, maxX, minZ, maxZ, h: max.y }` into `boxes`. Set `castShadow`/`receiveShadow` on its meshes.
   The block whose centre is (-25, 25) is a park instead: grass only, one `stone-fountain` (footprint 8) in the middle with its box, four `picnic-table` (scale 1.6, boxes too) and two `round-bush` (footprint 4).
   Street lamps: a `mushroom-lamp` scaled by 2.5 every 25 units along the outer edge of sidewalks (no box needed; pass `{ lights: false }` to buildPrefab to skip point lights).
6. **Fort Sandpit.** A sand plane over the base rectangle (`COLORS.sand`, y = 0.025). Walls on all four sides: thickness 1.5, height `BASE.wallHeight`, made of `sandbag-wall` prefabs tiled along each side (measure one with Box3 and repeat it; scale it so it is `BASE.wallHeight` tall), with a gap `BASE.gateWidth` wide centred on `BASE.gateX` in the north wall (z = `BASE.maxZ`). Add one `Box` per wall segment (two for the north wall, one each side of the gate). Inside: two `watch-tower` prefabs scaled to 7 tall next to the gate at (gateX ± 9, maxZ - 4) (boxes), three `hq-tent` (footprint 8, boxes) at (70, -80), (75, -112), (112, -78), a landing pad at (`BASE.padX`, `BASE.padZ`): a flat dark-grey cylinder radius 5, height 0.06, with a yellow ring (`THREE.RingGeometry` 3.6..4.2, flat) on top; four `crate` (footprint 2, boxes) and two `team-banner` (scale 3, tint 0x556b2f) near the tents.
   Fill `base` from `BASE` (minX, maxX, minZ, maxZ, padX, padZ, gateX, gateZ, guardPosts copied).
7. **Walk points.** Along every sidewalk outside the base, every 8 units, the point in the middle of the sidewalk (distance `ROAD_WIDTH/2 + SIDEWALK_WIDTH/2` from the road centre line), dropped if it is inside any box (`insideBox(x, 0.5, z, boxes)` from `./collide`) or outside ±(WORLD_HALF - 2). Also 6 points in the park.
8. **Parked mowers.** `parked`: 10 spots at the kerb (on the road, `ROAD_WIDTH/2 - 1.2` from the centre line, yaw along the road), none inside the base, not inside a box, at least 6 units apart: kinds 4 x `ride-on`, 2 x `push-bike`, 2 x `zero-turn`, 1 x `combine` (put it on the x = -100 road, it is 6 units wide), and make the first spot a `ride-on` at (-3.8, 22, yaw 0) and the second a `zero-turn` at (-3.8, 34, yaw 0), both close to the spawn.
9. **spawn** = `{ ...SPAWN }`, `half` = `WORLD_HALF`, `update(dt)` animates the two `team-banner`s (small sway with `Math.sin`) or does nothing.

Make sure no box covers the spawn point (-6.25, 14) or the first two parked spots, and none lies on a road or sidewalk.

## Contract
`export function buildWorld(scene: THREE.Scene, renderer: THREE.WebGLRenderer): World` with `World` exactly as in `types.ts`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/world.ts`.
- Reading the code: roads skip the base except the gate stub; every road node has ≥ 2 links; spawn and the first two parked spots are clear of boxes.

## Out of scope
Every other file. Do not add vehicles, gnomes or the Whirligig (main.ts and other modules do that).

Epic: 1 (Modules), issue 1H: the big city, the ground, the highways and the road graph (world.ts)
Depends on: none

## Environment
Working directory: C:\Users\cstab\Documents\gaming (Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnome-theft-auto (Vite + TypeScript + three.js 0.187). Several other workers are editing other files of this game at the same time: change only the files named under "Change". Do not run `npm run build` or `npm run dev`, do not start servers, do not git commit.
The check is `npx tsc --noEmit -p games/gnome-theft-auto`. An error in a file you do not own means another worker is mid-edit: ignore it unless your change caused it. NEVER edit types.ts, config.ts or collide.ts: they are final contracts, already written. Read them first (types.ts: every interface; config.ts: WORLD_HALF, CITY_HALF, ROAD_LINES, BIOMES, biomeAt, HIGHWAYS, BASE, AIRFIELD, VIEW, BUILDINGS, VEHICLES, FLY, GUNS, BULLET, CHUTE).
Conventions: y is up, 1 unit = one gnome's height (about 1.3). Yaw 0 faces +z, forward = (sin yaw, 0, cos yaw), turning right DECREASES yaw. The ground is flat (y = 0) everywhere. No per-frame allocation in hot loops (reuse scratch vectors). Free assets only: everything is built from code or from @lawn/prefabs (prefabs are data in packages/prefabs/src/catalog). The game is a gnome parody (lore setting: apocrypha): keep any text dry and cartoon-safe, no gore, no real brands.
The world: a 1200 x 1200 flat map. Turfton (the city grid, |x|,|z| <= 215) in the middle; outside it four biomes split along the diagonals: desert east (Fort Sandpit and the airfield with two planes), forest west, tundra north, farmland south, joined to the city by highways (config.ts HIGHWAYS).

## Goal
`buildWorld` builds a 1200 x 1200 world: a bigger city grid with tall towers downtown and larger buildings elsewhere, coloured biome ground, winding highways with a connected road graph, and it calls `buildBiomes` for everything else. Fort Sandpit has MOVED out of this file into the desert (biomes.ts builds it).

## Read first
- games/gnome-theft-auto/src/world.ts: the whole file. Reuse its helpers (`mulberry32`, `strip`, `merged`, `measure`, `instantiate`, `boxOf`, `subtract`, the street-lamp, walk-point and park code). Its base/fort code (sandbag walls, towers, tents, pad, crates, banners) is deleted from here.
- games/gnome-theft-auto/src/config.ts: `WORLD_HALF`, `CITY_HALF`, `ROAD_LINES` (7 lines, 60 apart), `ROAD_PITCH`, `ROAD_WIDTH`, `SIDEWALK_WIDTH`, `LANE_OFFSET`, `HIGHWAYS`, `BIOME_GROUND`, `biomeAt`, `BASE`, `AIRFIELD`, `VIEW`, `BUILDINGS`, `SPAWN`, `COLORS`.
- games/gnome-theft-auto/src/types.ts: `World`, `RoadNode`, `RoadGraph`, `Box`, `ParkedSpot`.
- games/gnome-theft-auto/src/biomes.ts: the `buildBiomes(scene, rnd): BiomeBuild` stub another worker fills in (`boxes`, `walkPoints`, `parked`, `update(dt)`).
- games/gnome-theft-auto/src/collide.ts: `insideBox`.

## Change
- games/gnome-theft-auto/src/world.ts:
  - Sky, fog and light: `scene.background` sky colour; `scene.fog = new THREE.Fog(COLORS.sky, VIEW.fogNear, VIEW.fogFar)`. Keep the hemisphere light and the sun, but add `sun.target` to the scene and in `update(dt, focusX, focusZ)` move `sun.target.position` to `(focusX, 0, focusZ)` and `sun.position` to `focus + (60, 100, 40)` so the shadow box (about 280 wide) follows the player.
  - Ground: one large plane `WORLD_HALF * 2` square in `BIOME_GROUND.city`. On top of it (tiny y offsets and `polygonOffset` like the road meshes, so nothing z-fights) four triangles from the origin to the world corners, one per biome (desert: (0,0),(H,-H),(H,H); forest: (0,0),(-H,H),(-H,-H); tundra: (0,0),(-H,-H),(H,-H); farmland: (0,0),(H,H),(-H,H)) in `BIOME_GROUND`, then the city square `|x|,|z| <= CITY_HALF` again in `BIOME_GROUND.city` over them. All receive shadows.
  - City grid: the old road code with `ROAD_LINES` and roads/sidewalks/centre lines running to `+-CITY_HALF`; no base cut (the grid is a full 7 x 7 grid now; delete `roadSegs`' base logic, every road runs the whole length).
  - Highways: for each polyline in `HIGHWAYS` draw a road of `ROAD_WIDTH` (a rotated plane strip per leg at the same y as city roads, a round cap (circle) at each vertex so corners look joined) and a dashed centre line. Merge all geometry per colour. No sidewalks on highways.
  - Road graph (`roads`): nodes at the 49 grid crossings (as the old code, no base exclusion) plus highway nodes: one at every vertex and extra nodes so no leg is longer than 40 units; two polyline points with identical coordinates (or the same as a grid crossing, e.g. [180, 0], [0, -180], [0, 180]) share ONE node; every consecutive pair is linked both ways (ids are indices into `nodes`; `links` hold ids). `laneOffset: LANE_OFFSET`.
  - Blocks (the city only): block interiors are 42 wide (60 pitch minus road, sidewalk and inset). The block whose centre is (-30, 30) is the park (rebuild the old park there: fountain footprint 8, four picnic tables, two bushes, shifted from the old (-25, 25)). A block whose centre is within `BUILDINGS.downtownRadius` of the origin (downtown, about the inner 4 x 4 blocks) gets 1 or 2 TOWERS; the other blocks get 1 to 3 garden-object buildings from the old `GARDEN` list but each drawn at a footprint chosen in `[BUILDINGS.gardenMinFootprint, BUILDINGS.gardenMaxFootprint]` (so they are much bigger than before).
  - Towers: a box of footprint chosen in `[towerMinFootprint, towerMaxFootprint]` (clamped to fit the block with a 2-unit gap to neighbours), height in `[towerMinHeight, towerMaxHeight]`, centred in its block region (two towers per block sit in different halves). Texture: draw 4 window-grid `CanvasTexture`s once (4 palettes: warm brick, glass blue, concrete grey, sandstone; lit and dark windows at random, `RepeatWrapping`, `colorSpace = SRGBColorSpace`) and share them; use `texture.repeat` via cloned textures or UVs so the window size is constant (about 2.5 x 3 units per window) whatever the tower size. Add a roof slab slightly wider than the body, and on some towers a roof water tank (cylinder), an antenna (thin cylinder with a red light), or a stepped upper section. `castShadow` and `receiveShadow`. Push one `Box` per tower with `h` = its height. Keep the total tower mesh count under 60.
  - Street lamps along the city sidewalks as before (`mushroom-lamp`, every 25 units) but only inside the city.
  - Walk points on the city sidewalks as before (every 8 units, skipping crossings and boxes), plus the park points.
  - Parked mowers in the city: the two fixed ones near spawn ((-3.8, 22) ride-on and (-3.8, 34) zero-turn) plus the old random kerb placement with `restKinds` (ride-on x3, push-bike x2, zero-turn, combine) over the whole city grid; a combine sits on a road line. Keep the validity checks (not inside a box, 6+ apart, not near crossings).
  - Call `const biomes = buildBiomes(scene, rnd)` after the city is built; concatenate `biomes.boxes` into `boxes`, `biomes.walkPoints` into `walkPoints`, `biomes.parked` into `parked`. In `update(dt, focusX, focusZ)` also call `biomes.update(dt)`.
  - Return the `World` with `half: WORLD_HALF`, `biomeAt` (import from config), `base` built from `BASE` (as before: `minX, maxX, minZ, maxZ, padX, padZ, gateX, gateZ, guardPosts`), `airfield: { ...AIRFIELD, planeSpots: copies }`, `spawn: { ...SPAWN }`.
  - Performance: merge static geometry; do not create a mesh per lamp or per window.

## Contract
`export function buildWorld(scene: THREE.Scene, renderer: THREE.WebGLRenderer): World` (unchanged signature) returning the `World` in types.ts. Imports `buildBiomes` and `BiomeBuild` from './biomes' (the stub exists; its signature is final).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` reports no error in world.ts.
- By reading the code: every `links` entry is a valid node id, every highway endpoint joins a node, `boxes` contains no box on a road centre line crossing.

## Out of scope
types.ts, config.ts, collide.ts, biomes.ts (another worker builds the biomes, the fort and the airfield), main.ts, hud.ts, every other file.

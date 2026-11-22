# Epic 2 foundation (done by the planner)

What exists before the issues run, so the workers and later epics know where things are.

## Files

- `games/gnome-theft-auto/src/terrain.ts`: the one height function. Pure (no three.js, no DOM).
- `games/gnome-theft-auto/src/terrainMesh.ts`: three.js side: the chunked ground mesh, draped road ribbons, and the
  helpers that put objects on the ground.
- `games/gnome-theft-auto/src/terrain.test.ts`: flat is exactly 0; the test hill; roads flat across; Turfton 0; probe.
- `src/config.ts` `TERRAIN`: `amplitude` (0 = flat, the shipped default), `step` 2 m, `chunk` 64 m,
  `chunkViewDistance`, road/city/site flatten margins and fades, `testHill { x: 545, z: 30, sigma: 25, amount: 6 }`.
- `src/world.ts`: `buildTerrainChunks(scene)` replaces the flat ground planes (base plane, region polygons, city
  square) when the terrain is not flat; highways become draped ribbons (`drapedRibbon`, mitred joins, no round caps)
  with their dashes lifted onto the ground; `world.update` hides chunks beyond `chunkViewDistance` of the player.
  While flat, world.ts builds exactly what it built before (golden fixture unchanged).
- `src/app.ts`: vehicle trail and near-miss checks and the bail-out altitude use `aboveGround`; `__gta.terrain` under
  `?debug`.

## Added after the workers ran

- `terrainMesh.ts`: a chunk that is dead level and one ground kind is a single quad (Turfton, flat sites, land with no
  relief). Without it the hill world had 1.6 M coplanar ground triangles and `npm run zfight` overflowed.
- `simdrive.ts`: a bump stop on hills (`SIM_FLOOR` 0.08: the chassis's centre of mass never goes below the terrain).
  `@lawn/vehicle` has no bump stop, and at top speed into the foot of the hill (about 2 g) the 0.15 m mower suspension
  bottomed out and the body sank 0.4 m into the ground. Off while the terrain is flat. A real bump stop in
  `packages/vehicle` would be the proper fix.

## Issues and results

All eight ran in parallel and passed: 2A player (`terrainWalk.test.ts` walks the player over the hill), 2B vehicles
(`terrainDrive.test.ts`: sim mower and arcade NPC car cross the hill; flat sim parity to 1e-9), 2C traffic and police,
2D townsgnomes, 2E encounters and quests, 2F biome props (`terrainBiomes.test.ts`), 2G dressing, 2H camera and map
(`terrainCamera.test.ts`; hillshade on the minimap when not flat). Golden fixture unedited.

## How the height is built

1. **Natural height** = `amplitude` x (sum of `RELIEFS` generators + every region document's `stamps`, moved to world
   coordinates + the test hill when on). `RELIEFS` is empty: Epic 5 adds the region landforms there.
2. **Roads** (`HIGHWAYS`): flat across within half the road width + `roadShoulder`, blended back over `roadFade`. The
   road's height is the natural height of the nearest centre-line point, so a road follows a hill along its length.
   Where segments overlap, the nearest one wins.
3. **Sites**, in order: Fort Sandpit's rectangle, the airfield (runway bounds joined with the apron), every `reserve`
   marker rectangle (the setpieces, the canal banks, the dew stations), each flat at the natural height of its centre
   within `siteMargin`, blended over `siteFade`. Then **Turfton** (the square +-215): exactly 0 out to 223, blended
   over 40 m.
4. Sampled once on a 2 m grid (901 x 901 Float32, built lazily on the first non-flat query). `heightAt` interpolates
   on the same triangles the mesh draws (each cell split along its (i, j)-(i+1, j+1) diagonal), so anything standing
   on `heightAt` stands exactly on the visible ground.

While flat (`amplitude` 0 or nothing authored), nothing is built: `heightAt` returns exactly 0, `normalAt` (0, 1, 0)
and `terrainProbe()` delegates to `flatGround(0)`. Farmyards are not flattened (they are placed procedurally inside
`buildBiomes`, after the grid is needed); Epic 5 can add them as `reserve` markers or document `flatten` stamps.

## The API (Epics 4, 5 and 6 build on it)

```ts
// src/terrain.ts
heightAt(x, z): number                      // ground height, metres; points off the map clamp to the edge
normalAt(x, z, out?): { x, y, z }           // unit normal, smoothed (central differences, one grid step)
slopeAt(x, z): number                       // rise over run
naturalHeightAt(x, z): number               // before roads and sites are flattened
aboveGround(x, y, z): number                // y - heightAt(x, z)
withGround(p)                               // placement {x, z, y?} lifted onto the ground; p itself where the ground is 0
surfaceAt(x, z): SurfaceKind                // asphalt / ice / region surface (surfaces.ts)
waterAt(x, z): { surface, depth } | null    // STUB, always null: Epic 4 fills it
terrainProbe(): GroundProbe                 // @lawn/vehicle probe (vertical fast path, march + bisect otherwise)
terrainFlat(): boolean
heightGrid(): Float32Array | null; GRID_N   // the raw grid (terrainMesh.ts reads it)
terrainOptions(), setTerrainOptions({ amplitude?, testHill? }), resetTerrainOptions()   // tests and dev
// src/terrainMesh.ts
placeOnGround(obj, x, z, lift = 0, lean = false)   // lean keeps yaw; never touches rotation on level ground
addGroundToGeometry(geo)                           // world-space geometry follows the ground (no-op while flat)
drapedRibbon(points, width, lift, step = 2)        // a road/path ribbon on the ground
buildTerrainChunks(scene): TerrainChunks | null    // null while flat
GROUND_KIND                                        // biome -> ground texture kind
```

Conventions every system now follows: `y` is absolute world height; `Box.h` is the absolute top; "on the ground"
tests use `aboveGround`.

## Dev

- `?terrain=hill`: amplitude 1 plus the test hill for this visit (Dust Flats, on the east highway at x 545, z 30).
- `?terrain=<number>`: set the amplitude (no effect until Epic 5 authors relief).
- `?debug` exposes `__gta.terrain` (the module).
- `?at=x,z[,yaw]` starts the player there (on the ground); `?no-intro` skips the first-run tour. The hill:
  `?offline&no-intro&terrain=hill&at=505,32,1.57`. `npm run zfight` and `tools/smoke.sh` take the same URL.

## For later epics

- **Epic 4 (water):** implement `waterAt` in `terrain.ts`; carve beds by adding stamps (or a carve pass after the site
  pass in `buildGrid`); the river must still be flattened across like a road. Bridges: `heightAt` stays the terrain;
  a bridge deck is a box/probe override in the vehicle and walk code, or a separate `deckAt` that `terrainProbe` and
  `groundHeight` consult.
- **Epic 5 (landforms):** push generators into `RELIEFS` (pure `(x, z) => metres`, world coordinates, blend across
  region borders yourself), author stamps and deltas in the documents, and decide the shipped `TERRAIN.amplitude`
  (1 once landforms exist). Regenerate the golden fixture once, deliberately, when amplitude changes. The regional
  tilt (north high, south low) is a relief generator.
- **Epic 6 (wildlife):** spawn and move critters with `heightAt`/`normalAt`, as the townsgnomes do.
- **Perf:** with hills on, the grid build is about 0.8 M evaluations and the mesh about 840 chunk meshes (hidden
  beyond 560 m). Epic 8 measures it on a phone.

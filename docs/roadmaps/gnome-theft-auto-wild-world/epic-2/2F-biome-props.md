Epic: 2 Terrain engine: heights everywhere (Gnome Theft Auto Wild World)
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, use absolute
  paths). Game: `games/gnome-theft-auto` (Vite + TypeScript + three.js 0.187, tests with vitest).
- Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not
  run `npm install`.
- Seven other workers are editing OTHER files of this game at the same time. Edit only the files your issue lists under
  Change. Do not run `npm run build` / `vite build` (it writes `dist/`), do not start a dev server, do not commit or
  touch git.
- Type-check: `npx tsc --noEmit -p games/gnome-theft-auto`. If it reports errors only in files you do not own, that is
  another worker mid-edit: wait a minute and re-run; if they persist, mention them in your report, do not fix them.
- Tests: from `games/gnome-theft-auto`, `npx vitest run <files>`. Always include `src/layout.golden.test.ts`.
- Repo rules that apply: anything laid flat on the ground keeps its `@lawn/depth` draw layer (`flatLayer(material,
  LAYER.x)`); no new art or prefabs; mobile and online behaviour must not change.

## The terrain API (already exists in `src/terrain.ts` and `src/terrainMesh.ts`; do not edit those files)

`y` is ABSOLUTE world height everywhere. The ground under `(x, z)` is `heightAt(x, z)`. Until now the ground was
always `y = 0`, so code that meant "the ground" wrote `0`. It must now ask `heightAt`.

```ts
import { aboveGround, heightAt, normalAt, slopeAt, surfaceAt, terrainFlat, terrainProbe, waterAt, withGround,
  setTerrainOptions, resetTerrainOptions } from './terrain';          // from src/quests/: '../terrain'
import { addGroundToGeometry, placeOnGround } from './terrainMesh';  // three.js helpers

heightAt(x: number, z: number): number            // ground height; exactly 0 everywhere while the terrain is flat (default)
normalAt(x: number, z: number, out?): { x, y, z } // unit ground normal; exactly (0, 1, 0) while flat
aboveGround(x: number, y: number, z: number): number  // y - heightAt(x, z): use for every "on the ground?" / "how high?" test
slopeAt(x, z): number                              // rise over run, 0 on level ground
withGround<T extends { x: number; z: number; y?: number }>(p: T): T
  // returns p itself (no y key added) where the ground is 0, else a copy with y = (p.y ?? 0) + heightAt(p.x, p.z)
terrainFlat(): boolean                             // true while every point is at 0
terrainProbe(): GroundProbe                        // @lawn/vehicle ground probe; exactly flatGround(0) while flat
surfaceAt(x, z): SurfaceKind; waterAt(x, z): { surface, depth } | null   // waterAt is null everywhere for now
setTerrainOptions({ amplitude: 1, testHill: true }) // TESTS ONLY: turn the test hill on, before building anything
resetTerrainOptions()                              // TESTS ONLY: back to flat; call in afterEach

placeOnGround(obj: THREE.Object3D, x: number, z: number, lift = 0, lean = false): void
  // obj.position.set(x, heightAt(x, z) + lift, z). lean: also tilt onto the ground normal keeping the yaw it already
  // has (set rotation.y first, call once). On level ground the rotation is left untouched.
addGroundToGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry
  // adds heightAt under each vertex to its y (world-space flat geometry built at its lift); no-op while flat
```

- The test hill: `TERRAIN.testHill` in `src/config.ts` is `{ x: 545, z: 30, sigma: 25, amount: 6 }`, a 6 m gaussian
  hill (slopes up to about 12 degrees) on the east highway in the Dust Flats. The highway runs along z = 30 from
  (520, 30) to (570, 30), then on to (650, 20); before that (450, 70) to (520, 30). Roads stay flat across and follow
  the hill along their length. With the hill on, Turfton (|x| and |z| <= 223) is still exactly 0. In the browser,
  `?terrain=hill` turns it on.
- Box colliders (`Box` in `src/types.ts`: `{ minX, maxX, minZ, maxZ, h }`): `h` is the ABSOLUTE top height. When code
  builds a box from a height above the ground, `h` = `heightAt(cx, cz) + height`. A box measured from a placed object
  (`new THREE.Box3().setFromObject(obj)`) is already absolute. `collide.ts`: `pushOutOfBoxes(x, z, r, boxes, y)` ignores
  boxes whose top `h <= y` (pass an absolute y); `groundHeight(x, z, r, boxes, maxY)` returns the highest walkable top.

## The parity rule (hard)

With the default flat terrain the game must build and behave byte-identically. `src/layout.golden.test.ts` snapshots
the built world (every collider, static prefab placement, walk point, parked spot, and each top-level scene object's
position, rotation, bounding box and vertex count) and must pass with `src/data/layout.golden.json` UNEDITED. Never
regenerate it (never set `UPDATE_GOLDEN`). So:

- A literal `0` meaning "the ground" becomes `heightAt(x, z)`; a lift like `0.08` becomes `heightAt(x, z) + 0.08`.
  `v.y <= 0` meaning "on the ground" becomes `aboveGround(v.x, v.y, v.z) <= 0`.
- Never add a `y` key to a plain placement object that had none: use `withGround(p)`.
- Never write a rotation or quaternion that was not there before: use `placeOnGround(obj, x, z, lift, true)`, which
  skips it on level ground.
- Positions of children inside a group (`head.position.set(0, 0.28, 0.13)`) are relative to their parent: leave them.
  Only top-level world positions and world-space height tests change.
- Do not reorder or add random-number draws (`rnd()`, `Math.random()` order in builders feeds the golden layout).

## Goal

Everything `buildBiomes` puts in the six outer regions (scatter trees, cacti, rocks, villages, farms, fields, Fort
Sandpit, the airfield, the setpieces, the perimeter fence, dew barrels, banners, the windsock, parked machines) sits on
`heightAt`, its colliders have absolute tops, and with the test hill on, the scatter near the hill stands on it.

## Read first

- `games/gnome-theft-auto/src/biomes.ts` (1262 lines). The places that put things on the ground:
  - `drop` (~200), `placeAt` (~217), `tree` (~251), `village` (~277), and every other `batch.push({ id, x, z, yaw,
    scale })` (e.g. ~441, ~1101): static prefab placements, later built by `buildStaticPrefabs(batch, ...)` (~1238).
  - `addBox(...)` / `addSafeBox(...)` / `boxes.push(...)` with `h: <height>` (dozens): collider tops measured from 0.
  - Flat ground pieces built in world space: `PlaneGeometry/CircleGeometry/RingGeometry(...).rotateX(-Math.PI / 2)
    .translate(x, <lift>, z)` (fort floor ~334, pad ring ~365, runway `onRunway` ~374-379, apron ~397, setpiece pads
    ~487, ~551, ~642, ~752, ~794, ~854, ~1025 ...), and world-space solids from `boxGeo`/`cylGeo` (~457-469), merged.
  - Objects positioned with `position.set(x, <y>, z)`: dew barrels (~407, `dewBarrels.push({ x, y: 0.6, z, ... })`
    ~411), banners (~422), windsock (~431), the Whirligig pad (~361), steam puffs (~475, animated at ~1253 from
    `0.4 + t * maxH`), the chapel van (~565, ~574 with a fixed tilt), signs (~596), halos (~632).
  - The perimeter fence (~880-916): long boxes along the world edge.
  - `parked.push(...)` spots: plain `{ x, z, yaw, kind }` (vehicles.ts puts the vehicle on the ground itself: leave).
  - `walkPoints`: plain `{ x, z }`: leave.

## Change (only `src/biomes.ts`, plus the new test)

- Static placements: wrap each pushed placement in `withGround(...)`: `batch.push(withGround({ id, x, z, yaw, scale
  }))`. Never write `y: heightAt(...)` directly (that adds a `y` key on flat ground and breaks the golden fixture).
- Box colliders: `h` becomes the absolute top: `h: heightAt(cx, cz) + <height>` with (cx, cz) the box centre. For a
  long box (more than 8 m on a side, e.g. the perimeter fence and the fort walls) use the highest ground along it:
  add a small local helper `maxGround(minX, maxX, minZ, maxZ)` that samples `heightAt` every 4 m over the rectangle
  (corners included) and returns the max; `h: maxGround(...) + <height>`. On flat ground both give exactly the old h.
- World-space flat or solid geometry (the `.translate(x, y, z)` pieces, merged meshes of setpieces, runway, apron, fort
  floor, fence planks): pass each finished world-space geometry through `addGroundToGeometry(geo)` before merging or
  adding (it adds the ground height under each vertex, so a pad follows the ground and a post moves up with it). A
  setpiece or site stands on ground that terrain.ts already flattened (every `reserve` marker, the fort and the
  airfield are flat sites), so this keeps them level.
- Objects with `position.set(x, y, z)`: `placeOnGround(obj, x, z, y)` (keeps rotation; tilt only scenery that sits
  flat, like a crate or rock, with `lean = true` after its yaw is set). Steam puffs: store the base ground height with
  the puff and animate `baseY + 0.4 + t * maxH`. Dew barrels: `y: heightAt(x, z) + 0.6` in the `dewBarrels` entry (the
  key already exists, so flat stays identical).
- Do not change the order or number of random draws (`rnd()`, `uni()`, ...), the reserved-zone logic, or which
  items get placed. Only heights change.
- New `src/terrainBiomes.test.ts`: `installFakeDom()` (from `./testing/fakeDom`), then
  `setTerrainOptions({ amplitude: 1, testHill: true })`, then `const { buildBiomes } = await import('./biomes')`,
  `const b = buildBiomes(new THREE.Scene())`; `afterAll(resetTerrainOptions)`. Assert: (a) every box whose centre is
  within 100 m of (545, 30) has `h > heightAt(cx, cz)` and there is at least one such box (if none, widen to 150 m);
  (b) every dew barrel has `y >= heightAt(x, z) + 0.5`. Run this test file on its own (it changes terrain options).

## Contract

- `buildBiomes(scene: THREE.Scene): BiomeBuild` keeps its signature and return shape.
- Flat terrain: the golden fixture passes unedited (same placements, no new keys, same boxes, same scene objects).

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` passes (or only shows other workers' files).
- From `games/gnome-theft-auto`: `npx vitest run src/terrainBiomes.test.ts` and `npx vitest run
  src/layout.golden.test.ts src/levels.test.ts` pass, golden fixture unedited.

## Out of scope

`src/world.ts` (the planner owns it), `src/terrain.ts`, `src/terrainMesh.ts`, `src/config.ts`, `src/levels.ts`, the
level documents in `src/data/`, `src/districts.ts`, `src/worldDetails.ts`, `src/destructibles.ts`,
`src/easterEggs.ts`, `src/brands.ts` and every other file not listed above.

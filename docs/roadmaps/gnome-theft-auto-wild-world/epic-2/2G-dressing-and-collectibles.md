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

The world details and vignettes, destructible props, Easter eggs and collectibles, and billboards stand on
`heightAt` (with absolute collider tops), wherever they are in the world.

## Read first

- `games/gnome-theft-auto/src/worldDetails.ts` (403 lines): micro-details across Turfton and the outer biomes; uses
  `HIGHWAYS`; boxes with `h`.
- `games/gnome-theft-auto/src/destructibles.ts` (543 lines): roadside props along `HIGHWAYS` (~299) that get knocked
  over and reset; flying pieces that land (search for a floor at 0, `y <= 0`, `position.y = `).
- `games/gnome-theft-auto/src/easterEggs.ts` (647 lines): collectibles (Golden Acorns, Stopping-Stone Shards, HOA
  signs) at landmark coordinates, flat rings on `LAYER` layers, bobbing pickups.
- `games/gnome-theft-auto/src/brands.ts` (568 lines): billboards, roadside and rooftop placements (`placeBillboards`).
  Rooftop ones sit on Turfton buildings (Turfton is always at 0; leave rooftop heights as they are).
- Their tests: `src/worldDetails.test.ts`, `src/destructibles.test.ts`, `src/easterEggs.test.ts`,
  `src/brands.test.ts`.

## Change (only these four files)

- Every top-level world position on the ground becomes `heightAt(x, z) + <its old y>` at its own x, z. For an
  Object3D use `placeOnGround(obj, x, z, lift)` (keeps its rotation; `lean = true` only for things that sit flat,
  after their yaw is set). Plain placement objects for `buildStaticPrefabs` go through `withGround(p)`.
- Box colliders built from a height: `h: heightAt(cx, cz) + <height>`. Boxes measured from a placed object
  (`Box3.setFromObject`) are already absolute.
- World-space geometry built with `.translate(x, y, z)` (merged or flat on a `LAYER`): pass it through
  `addGroundToGeometry(geo)` before merging/adding.
- Things that move or fall (knocked-over props, bobbing pickups, flying pieces): their floor/rest height is
  `heightAt(x, z)` (+ lift) at their current x, z; pickups bob around `heightAt(x, z) + <old base>`.
- Pickup and trigger distance checks in x and z stay as they are. A check that compares a y against a constant ground
  level uses `aboveGround`.
- No new test file is required. If you add one, name it `src/terrainDressing.test.ts`.

## Contract

- No exported signature changes in these four files.
- Flat terrain: every changed expression gives exactly the old value; the golden fixture passes unedited.

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` passes (or only shows other workers' files).
- From `games/gnome-theft-auto`: `npx vitest run src/worldDetails.test.ts src/destructibles.test.ts
  src/easterEggs.test.ts src/brands.test.ts src/layout.golden.test.ts` passes, golden fixture unedited.

## Out of scope

`src/districts.ts` (Turfton only, always flat), `src/biomes.ts`, `src/world.ts`, `src/terrain.ts`,
`src/terrainMesh.ts`, `src/config.ts`, `src/app.ts` and every other file not listed above.

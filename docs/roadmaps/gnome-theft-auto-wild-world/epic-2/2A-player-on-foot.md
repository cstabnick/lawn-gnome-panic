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

The player on foot, the parachute, ragdolls, bullets, effects and other players' gnomes stand on `heightAt` instead
of y = 0, and a test walks the player over the test hill.

## Read first

- `games/gnome-theft-auto/src/collide.ts`: `groundHeight` (starts from `best = 0`).
- `games/gnome-theft-auto/src/player.ts`: `createPlayer(scene, look)`; `updateAir` (free fall and parachute: `p.y >
  CHUTE.minDeployAltitude` near line 79, landing via `groundHeight` near line 118), `updateFoot` (lines 162-224),
  `exit()` (`p.y = Math.max(0, v.y)`, `p.grounded = p.y <= 0.1`), `respawn()` (`p.y = 0`).
- `games/gnome-theft-auto/src/ragdoll.ts`: `collide()` near line 126 (`if (pos[o + 1] < RAGDOLL.radius)` is the ground).
- `games/gnome-theft-auto/src/weapons.ts`: line ~52 `if (y <= 0)` (hitscan hits the ground), line ~358
  `p.y <= 0` (a projectile lands), line ~381 `mesh.position.set(x, 0, z)`.
- `games/gnome-theft-auto/src/fx.ts`: line ~386 `if (p.y < 0.06) { p.y = 0.06; ...` (particles bounce on the
  ground); search the file for other ground floors (`< 0`, `0.05`, `position.set(x, 0, z)`).
- `games/gnome-theft-auto/src/remotes.ts`: line ~184 `state.grounded = y < 0.05 || !!p.vehicle`.

## Change

- `src/collide.ts`: `groundHeight` starts from `let best = heightAt(x, z);` (import from `./terrain`) instead of 0;
  update its doc comment ("or the terrain height"). Nothing else in this file changes.
- `src/player.ts`:
  - `updateFoot`: walking downhill must not go airborne every frame. When `p.grounded` and `floorY < p.y` by no more
    than `STEP_DOWN` (a new module constant, 0.6), snap `p.y = floorY`; only a bigger drop (a box edge, a cliff)
    starts a fall. The existing "floor above the feet → step up" and jump logic stays.
  - `updateAir`: the auto-deploy altitude test uses `aboveGround(p.x, p.y, p.z) > CHUTE.minDeployAltitude`.
  - `exit()`: `p.y = Math.max(heightAt(at.x, at.z), v.y)`; `p.grounded = aboveGround(at.x, p.y, at.z) <= 0.1`.
  - `respawn(x, z, yaw)`: `p.y = heightAt(x, z)`.
  - Any other place in the file that writes or tests y against 0 as the ground: same treatment.
- `src/ragdoll.ts` `collide()`: the ground for joint `i` is `heightAt(pos[o], pos[o + 2]) + RAGDOLL.radius` instead of
  `RAGDOLL.radius` (both the test and the clamp). Leave `poseRagdoll` / `resetPose` (`model.rig.position.y = 0` are
  local positions).
- `src/weapons.ts`: hitscan stops at the ground when `y <= heightAt(x, z)`; projectiles land when
  `aboveGround(p.x, p.y, p.z) <= 0`; ground-placed meshes use `heightAt(x, z)` (+ their lift).
- `src/fx.ts`: particle floors become `heightAt(p.x, p.z) + <lift>` (e.g. `const floor = heightAt(p.x, p.z) + 0.06;
  if (p.y < floor) { p.y = floor; ...`). Effects spawned "on the ground" by their callers already get a world y; do
  not change function signatures.
- `src/remotes.ts`: `state.grounded = aboveGround(x, y, z) < 0.05 || !!p.vehicle` (use the variables in scope there).
- New `src/terrainWalk.test.ts`:
  - `afterEach(resetTerrainOptions)`; each test that needs the hill calls `setTerrainOptions({ amplitude: 1,
    testHill: true })` first.
  - `groundHeight(545, 30, 0.3, [], 100)` equals `heightAt(545, 30)` (> 5 with the hill); with a box
    `{ minX: 544, maxX: 546, minZ: 29, maxZ: 31, h: heightAt(545, 30) + 1 }` and maxY above it, it returns the box top.
  - Walk the player over the hill: call `installFakeDom()` from `./testing/fakeDom` before importing the player
    module (dynamic `await import('./player')`, as `src/layout.golden.test.ts` does with `./world`), build it with
    `createPlayer(new THREE.Scene(), DEFAULT_LOOK)` (`DEFAULT_LOOK` from `./config`), put it at x = 470, z = 50,
    y = heightAt(470, 50), grounded, and call `player.updateFoot(input, camYaw, 1 / 60, world)` for up to 60 s of
    frames with `world = { boxes: [], half: 900 } as unknown as World` and an input with `moveY = 1` (forward). The
    forward direction is `(sin(camYaw), cos(camYaw))`: steer by setting `camYaw = Math.atan2(tx - p.x, tz - p.z)` each
    frame towards the next waypoint of (520, 30) then (620, 30). Build the input from the `InputState` type in
    `src/types.ts` (every field zero/false except `moveY: 1`). Assert: the player reaches x > 610; on every frame
    `Math.abs(p.y - heightAt(p.x, p.z)) < 0.05`; it passed a point where `heightAt > 5`.
  - If `createPlayer` cannot be built under vitest (a missing DOM API), keep the `groundHeight` tests and say why in
    your report.

## Contract

- No exported signature changes in any file you edit (other workers call them).
- Flat terrain: every changed expression gives exactly the old value (heightAt is exactly 0).

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` passes (or only shows other workers' files).
- From `games/gnome-theft-auto`: `npx vitest run src/terrainWalk.test.ts src/collide.test.ts src/layout.golden.test.ts`
  passes, golden fixture unedited.

## Out of scope

`src/terrain.ts`, `src/terrainMesh.ts`, `src/config.ts`, `src/app.ts`, `src/world.ts`, `src/camera.ts`,
`src/vehicles.ts`, `src/mount.ts`, `src/npcs.ts`, `src/police.ts` and every other file not listed above (other
workers own them).

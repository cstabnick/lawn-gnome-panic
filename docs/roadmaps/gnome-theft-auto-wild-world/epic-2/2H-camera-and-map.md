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

The chase camera never sinks into a hill (it treats the ground like a wall when it pulls in), and the minimap and the
big map show a hillshade of the terrain when it is not flat.

## Read first

- `games/gnome-theft-auto/src/camera.ts` (234 lines): `MIN_Y = 0.4` (~45); in `update`: `if (out.y < MIN_Y) out.y =
  MIN_Y;` (~138) and `if (placed.y < MIN_Y) placed.y = MIN_Y;` (~149); `isBlocked(x, y, z, radius, world)` (~195) used
  by `clipPoint` and `clipDist` (march from the look point towards the desired camera spot).
- `games/gnome-theft-auto/src/hud.ts`: `buildBackground(world)` (~366-460): the static map picture, 1 pixel per world
  unit, `W = 2 * world.half` pixels square, mirrored in x: `X(x) = H - x`, `Y(z) = H - z` with `H = world.half`.
  Regions are filled first, then Turfton, water, roads. Both the minimap and the big map draw from this canvas.

## Change

- `src/camera.ts`:
  - `isBlocked`: the ground counts as a wall for the clip march where it rises above the ground under the player:
    blocked also when `heightAt(x, z) > baseGround + 0.3 && y < heightAt(x, z) + 0.3`, with `baseGround =
    heightAt(target.x, target.z)` computed once per `update` and passed down through `clipPoint` / `clipDist` /
    `isBlocked` (they are module-private; add a parameter). So the camera pulls in in front of a hill between it and
    the player, and on level ground nothing changes.
  - The two `MIN_Y` floors become ground-relative: `const floor = heightAt(out.x, out.z) + MIN_Y; if (out.y < floor)
    out.y = floor;` and the same for `placed`.
  - Nothing else changes (orbit, follow, FOV, shake, recoil).
- `src/hud.ts` `buildBackground`: after the region fills and Turfton, and before water and roads, when `!terrainFlat()`
  draw a hillshade:
  - Sample at `CELL = 4` m: `n = Math.ceil(W / CELL)`; an offscreen canvas `n x n` and `ctx.createImageData(n, n)`.
    For pixel (px, py) the world point is `x = H - (px + 0.5) * CELL`, `z = H - (py + 0.5) * CELL` (the mirror above).
  - Light from the north-west and above: `L = normalize(-0.5, 0.75, -0.5)` (west is -x, north is -z) in world axes; `shade = nx * Lx + ny * Ly +
    nz * Lz` with `normalAt(x, z)`; flat ground gives `shade0 = Ly`. Write black with alpha `clamp((shade0 - shade) *
    1.6, 0, 0.45) * 255` where it is darker than flat and white with alpha `clamp((shade - shade0) * 1.2, 0, 0.3) * 255`
    where it is lighter; alpha 0 on level ground.
  - `putImageData`, then `g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, W, W)`.
  - When the terrain is flat, draw nothing (the map is unchanged).
- New `src/terrainCamera.test.ts` (`afterEach(resetTerrainOptions)`, hill on with `setTerrainOptions({ amplitude: 1,
  testHill: true })`): build `createChaseCamera(new THREE.PerspectiveCamera(60, 1, 0.1, 1000))`, a target on the far
  slope of the hill (target at (575, heightAt(575, 30), 30) with `targetYaw = Math.PI / 2`, facing +x: the forward
  direction is `(sin yaw, cos yaw)`, so the camera sits behind it at smaller x, up the slope towards the top at x = 545),
  a zeroed `InputState` (every field 0/false), and `world = {
  boxes: [], half: 900 } as unknown as World`; call `update(1 / 60, target, targetYaw, 'foot', input, world)` for 120
  frames and assert the camera is at least 0.3 above `heightAt` under it on every frame. Check the `CameraMode` type
  in `src/types.ts` for the mode names.

## Contract

- No exported signature changes in `camera.ts` or `hud.ts`.
- Flat terrain: the camera behaves exactly as before (the floor is MIN_Y and the new ground test never fires because
  `heightAt(x, z) > baseGround + 0.3` is false); the map picture is unchanged.

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` passes (or only shows other workers' files).
- From `games/gnome-theft-auto`: `npx vitest run src/terrainCamera.test.ts src/layout.golden.test.ts` passes, golden
  fixture unedited.
- Phone viewport: no layout change (the hillshade draws into the existing map canvas).

## Out of scope

`src/collide.ts`, `src/app.ts`, `src/terrain.ts`, `src/terrainMesh.ts`, `src/config.ts`, `src/atmosphere.ts`,
`src/options.ts` and every other file not listed above.

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

Every vehicle stands on, drives over and lands on the terrain: the physics chassis (`@lawn/vehicle`) uses the terrain
ground probe, the arcade model (traffic and the Arcade mode) follows `heightAt` and tilts to the slope, planes and the
Whirligig take off and land on the ground under them, and mount sequences and stunt jumps use the ground height. A
test drives a mower and an NPC car over the test hill.

## Read first

- `games/gnome-theft-auto/src/vehicles.ts`: `createVehicle` (`y: 0`), `stepVehicle` (wreck drop `if (v.y > 0) ...`),
  `stepPilotedPlane` (`air = v.y > 0.05`, `if (v.y <= 0)` landing), `stepOther` (`onGround = !flying && v.y <= 0.15`,
  flyer floor `if (v.y <= 0)`, the hop arc, the `else { v.y = 0; v.vy = 0; }` branch, `canDrive = !flying || v.y >
  0.3`), `moveVehicle`, `syncVehicleMesh` (`v.object.rotation.set(pitch, v.yaw, roll, 'YXZ')`, `v.y < 0.05` for plane
  wheels), `hopLowrider` (`v.y > 0.08`), `updateMulchSlicks` (`v.y > 0.5`), `collideVehicles` (`Math.abs(a.y - b.y)`
  is fine: both absolute).
- `games/gnome-theft-auto/src/simdrive.ts`: `createSimDrive` (`new VehicleController(mowerConfig(v.spec))`,
  `ctrl.place(v3(v.x, 0, v.z), ...)`), `writePose` (`v.y = 0`), `stepSimDrive` (`pushOutOfBoxes(..., 0)`, the
  righting `ctrl.place(v3(body.pos.x, 0, body.pos.z), ...)`).
- `packages/vehicle/src/controller.ts` lines 76-115 and 144-160: `new VehicleController(cfg, opts?: { ground?:
  GroundProbe; gravity?: number })`; `place(position: Vec3, yaw, forwardSpeed = 0)` casts down from `position.y + 50`.
- `games/gnome-theft-auto/src/mount.ts`: `standing()`, the `walk` phase (`seq.pos.y = v.y`), `riderAt` (vehicle-local
  y, leave it), the exit/settle poses: where the gnome's feet go back to the ground.
- `games/gnome-theft-auto/src/stunts.ts` lines 225-300: ramp elevation (`rampElevationAt` returns the height above the
  ramp's ground), `if (v.y < currentElev) v.y = currentElev`, `v.y > 0.3`, landing `if (v.y <= 0) { v.y = 0; ...`.
- `games/gnome-theft-auto/src/bump.test.ts` and `src/handling.test.ts`: how existing tests build a `VehicleController`
  and vehicles (copy the setup style).

## Change

- `src/simdrive.ts`:
  - `createSimDrive`: `new VehicleController(mowerConfig(v.spec), { ground: terrainProbe() })` and
    `ctrl.place(v3(v.x, heightAt(v.x, v.z), v.z), v.yaw, v.speed)`.
  - `writePose`: `v.y = heightAt(v.x, v.z)` (after setting v.x / v.z) instead of `v.y = 0`. The mesh keeps using
    `sd.px/py/pz` (the chassis pose already rides the probed ground).
  - `stepSimDrive`: `pushOutOfBoxes(body.pos.x, body.pos.z, v.spec.radius, world.boxes, heightAt(body.pos.x,
    body.pos.z))`; righting `ctrl.place(v3(body.pos.x, heightAt(body.pos.x, body.pos.z), body.pos.z), ...)`.
  - Any other `mowerConfig`/`VehicleController` construction in the file passes the same `{ ground: terrainProbe() }`.
- `src/vehicles.ts`:
  - `createVehicle`: `y: heightAt(x, z)`.
  - Wreck: `const g = heightAt(v.x, v.z); if (v.y > g) v.y = Math.max(g, v.y - 18 * dt);`.
  - `stepPilotedPlane`: `const g = heightAt(v.x, v.z)`; `air = v.y - g > 0.05`; land when `v.y <= g` (set `v.y = g`);
    ceiling: `Math.max(ceiling, g + 5)` stays an absolute height.
  - `stepOther`: `onGround = !flying && aboveGround(v.x, v.y, v.z) <= 0.15`; flyer floor `g = heightAt(v.x, v.z)`;
    the hop arc lands on `g`; the plain ground branch sets `v.y = g`. `canDrive = !flying || aboveGround(...) > 0.3`.
    Gentle gravity along the slope for ground vehicles on the ground: `const n = normalAt(v.x, v.z); v.speed += 9.8 *
    0.5 * (n.x * Math.sin(v.yaw) + n.z * Math.cos(v.yaw)) * dt;` (positive facing downhill; exactly 0 when flat).
  - `moveVehicle`: after the move and the clamps, a ground vehicle that is not airborne (not flying, `v.vy <= 0`, and
    within 0.15 of the ground before the move) snaps to `v.y = heightAt(v.x, v.z)`, so it follows the hill. Keep
    passing the absolute `v.y` to `pushOutOfBoxes`.
  - `syncVehicleMesh` (non-sim branch): for a ground vehicle (`!spec.flies`) on the ground, take pitch and roll from
    the ground normal. The model faces +z at yaw 0 (it moves by `(sin yaw, cos yaw)`); a positive `rotation.x` tips
    the nose DOWN and a positive `rotation.z` raises the model's local +x side. With `n = normalAt(v.x, v.z)`:
    `pitch = Math.atan2(n.x * Math.sin(v.yaw) + n.z * Math.cos(v.yaw), n.y)` and
    `roll = Math.atan2(-(n.x * Math.cos(v.yaw) - n.z * Math.sin(v.yaw)), n.y)`. Check the signs in your test (nose up
    when climbing: the model's nose point, `object.localToWorld(new THREE.Vector3(0, 0, 1))`, is higher than its tail). When the normal is straight
    up these are exactly 0, as today. Plane wheels: `aboveGround(v.x, v.y, v.z) < 0.05`.
  - `hopLowrider`, `updateMulchSlicks`, and any other `v.y` vs constant ground test: use `aboveGround`.
  - `stepKnock`: pass `v.y` (absolute) as now.
- `src/mount.ts`: wherever the gnome stands on the ground (`standing()`, exit landing, settle on the ground) its y is
  `heightAt(x, z)` of that point; the `walk` phase keeps `seq.pos.y = v.y` only while the vehicle is on the ground,
  otherwise `heightAt(seq.pos.x, seq.pos.z)`. Vehicle-local poses (`riderAt`) stay.
- `src/stunts.ts`: ramp height is above the ramp's ground: `const g = heightAt(v.x, v.z)`;
  `if (v.y < g + currentElev) v.y = g + currentElev`; lip test `aboveGround(v.x, v.y, v.z) > 0.3`; land when
  `v.y <= heightAt(v.x, v.z)` and set `v.y` to it. If stunt ramps build meshes at y = 0 in this file, place them with
  `placeOnGround(mesh, x, z)` (keep their rotation).
- New `src/terrainDrive.test.ts` (`afterEach(resetTerrainOptions)`, `setTerrainOptions({ amplitude: 1, testHill: true
  })` inside each hill test; `installFakeDom()` from `./testing/fakeDom` before dynamically importing `./vehicles` /
  `./simdrive` if they need a DOM):
  1. Sim mower over the hill: a `VehicleController` built like `createSimDrive` does (`mowerConfig(VEHICLES['ride-on'])`
     from `./simdrive`, `{ ground: terrainProbe() }`), placed at (470, heightAt, 50) facing the hill along the highway
     (yaw = `Math.atan2(dx, dz)` towards (520, 30), then steer towards (620, 30) each tick with a simple proportional
     steer), throttle 1, `ctrl.update(1 / 60, { steer, throttle: 1, brake: 0, handbrake: 0, source: 'stick' })` for up
     to 60 s. Assert it reaches x > 610, never tips (body up vector y > 0.7), and its wheels stay near the ground
     (`body.pos.y - heightAt(body.pos.x, body.pos.z)` between 0 and 2 every tick).
  2. Arcade NPC car over the hill: `createVehicle(new THREE.Scene(), 'ride-on', 470, 50, yaw)`, `v.driver = 'npc'`,
     `stepVehicle(v, { throttle: 1, steer, lift: 0 }, 1 / 60, world)` (with `world = { boxes: [], half: 900, biomeAt:
     () => 'desert', airfield: AIRFIELD } as unknown as World`, using `AIRFIELD` from `./config`) steering the same way;
     assert it reaches x > 610 and `Math.abs(v.y - heightAt(v.x, v.z)) < 0.05` every frame while it is on the ground,
     and that `syncVehicleMesh` gives a non-zero pitch on the slope (nose up going uphill).
  3. Flat parity: with the default terrain a sim mower driven for 2 s on flat ground gives the same `body.pos` as one
     built with no `ground` option (`flatGround()`), to 1e-9.
  Check the `DriveControls` type in `src/types.ts` for the exact control fields.

## Contract

- No exported signature changes in `vehicles.ts`, `simdrive.ts`, `mount.ts`, `stunts.ts` (traffic, police, app and
  the player call them).
- `Vehicle.y` is the absolute height of the vehicle's origin (its wheels' contact level for ground vehicles).

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` passes (or only shows other workers' files).
- From `games/gnome-theft-auto`: `npx vitest run src/terrainDrive.test.ts src/bump.test.ts src/handling.test.ts
  src/mount.test.ts src/stunts.test.ts src/layout.golden.test.ts` passes, golden fixture unedited.

## Out of scope

`src/terrain.ts`, `src/terrainMesh.ts`, `src/config.ts`, `src/app.ts`, `src/world.ts`, `src/traffic.ts`,
`src/police.ts`, `src/player.ts`, `src/collide.ts`, `packages/vehicle/` and every other file not listed above.

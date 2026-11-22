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

Traffic, the Hat Watch (officers on foot, roadblocks, pursuit vehicles, the Spade Guard) and the ambulance stand on
`heightAt`: everything they place or move "on the ground" uses the ground height, and their height checks use
`aboveGround`.

Vehicle movement itself (`stepVehicle`, `createVehicle` in `vehicles.ts`) is another worker's job: a vehicle created
or stepped there already gets `v.y = heightAt`. This issue covers what these three files place or test themselves.

## Read first

- `games/gnome-theft-auto/src/traffic.ts`: spawns NPC vehicles with `createVehicle` and steps them with `stepVehicle`;
  search it for anything placed or compared at a literal ground height (`position.set(..., 0, ...)`, `.y = 0`,
  `y <= 0`, `y > 0.`, driver gnomes getting out, parked errands). There may be very little.
- `games/gnome-theft-auto/src/police.ts`: line ~176 `pushOutOfBoxes(n.x + ux * step, n.z + uz * step, BODY_R,
  world.boxes)` (no y: defaults to 0), ~191 `s.position.set(n.x, 0, n.z)`, ~213-223 officer models at `(n.x, 0, n.z)`,
  ~231 `v.y > 1.5` (a vehicle in the air), ~381 `ring.position.y = 0.08` (flat marker ring), ~530 roadblock cones at
  y 0.35, ~692 `if (y < 0 || y > 1.2) return null` (a bullet height vs an officer standing on the ground), ~719-720
  officers repositioned at `(o.x, 0, o.z)`. Officers' per-frame position updates.
- `games/gnome-theft-auto/src/ambulance.ts`: ~118 `mesh.position.set(x, 0, z)` (debris pile), ~154 `body.position.set
  (first.x, 0, first.z)`, ~218 `r.mesh.position.set(r.x, 0, r.z)` (the ambulance driving its path).

## Change

- `src/police.ts`:
  - Every gnome, sprite, cone or mesh put at a world position on the ground: `y = heightAt(x, z) + <its lift>` (use
    `placeOnGround(obj, x, z, lift)` for an Object3D, keeping its rotation). Per-frame moves of officers on foot set y
    the same way each frame.
  - `pushOutOfBoxes(..., world.boxes)` calls that rely on the default y = 0: pass `heightAt(x, z)` of that point.
  - Hit tests against an officer standing on the ground (line ~692): compare the height above the officer's ground,
    e.g. `const h = y - heightAt(x, z); if (h < 0 || h > 1.2) return null;` (use the officer's own x, z).
  - `v.y > 1.5` style tests on vehicles: `aboveGround(v.x, v.y, v.z) > 1.5`.
  - The flat gold marker ring (`ring.position.y = 0.08`, `LAYER.marker`): put it at `heightAt + 0.08` at its x, z and
    tilt it onto the slope with `placeOnGround(ring, x, z, 0.08, true)` if it is placed once; if it follows something
    every frame, set y each frame (no tilt needed).
- `src/ambulance.ts`: the debris pile, the ambulance body and its path movement use `heightAt` for y (pile: once;
  ambulance: each frame at its x, z; tilt it with `placeOnGround(mesh, x, z, 0, true)` only if you also reset its
  rotation to the path yaw each frame before calling, otherwise just set y).
- `src/traffic.ts`: same treatment for anything found; no change needed where it only calls `createVehicle` /
  `stepVehicle` / `syncVehicleMesh`.
- No new test file is required. If you add one, name it `src/terrainPolice.test.ts`.

## Contract

- No exported signature changes in these three files.
- Flat terrain: every changed expression gives exactly the old value.

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` passes (or only shows other workers' files).
- From `games/gnome-theft-auto`: `npx vitest run src/traffic.test.ts src/layout.golden.test.ts` passes (the traffic
  test "pull out around a vehicle left in their lane" is known to be flaky because it uses `Math.random`: if only it
  fails, run it again), golden fixture unedited.
- `grep -n "position.set([^)]*, 0, \|y <= 0\|y < 0" src/police.ts src/ambulance.ts src/traffic.ts` shows no world-space
  ground at 0 left (child positions inside a group are fine).

## Out of scope

`src/vehicles.ts`, `src/simdrive.ts`, `src/terrain.ts`, `src/terrainMesh.ts`, `src/config.ts`, `src/app.ts`,
`src/npcs.ts`, `src/collide.ts` and every other file not listed above.

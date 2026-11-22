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

Townsgnomes (pedestrians), the ambient gnomes and the vibe NPCs (and their little props: crates, chairs, fishing
poles, barrels, stands) stand on `heightAt` wherever they are placed or walk.

## Read first

- `games/gnome-theft-auto/src/npcs.ts` (495 lines): pedestrians: spawn/recycle near the player, walk between
  `world.walkPoints`, flee, get flung (ragdoll), hands up. Search for `position.set(`, `.y = `, `y: 0`, `y <= 0`,
  `pushOutOfBoxes(` without a y argument, and how a ragdolled gnome is put back on its feet.
- `games/gnome-theft-auto/src/ambientGnomes.ts` (397 lines): one hit; find where the gnomes are positioned.
- `games/gnome-theft-auto/src/vibeNpcs.ts` (815 lines): ~50 positions. Most are CHILD positions inside a vignette group
  (`crate.position.y = 0.26`, `head.position.set(0, 0.28, 0.13)`, `pole.position.y = 1.2`): leave those. The group
  roots are the world positions: `g.position.set(x, 0, z)` (lines ~68, 191, 221, 261, 280, 293, 315, 350, 411, 431),
  `chair.position.set(x, 0, z)` (~127), `poleGroup.position.set(x + 1.4, 0, z + 1.6)` (~168), `thimble.position.set(x,
  0.16, z)` (~404), and the NPC gnome models themselves (search `model.object.position`).

## Change

- In all three files, every top-level world position on the ground: `y = heightAt(x, z) + <its old y>`, at its own x,
  z. Prefer `placeOnGround(obj, x, z, lift)` (keeps the rotation; leave `lean` false for gnomes, which stand upright;
  `lean = true` is fine for a placed chair or crate group whose yaw is already set).
- Things that move each frame (walking gnomes, fleeing gnomes, a gnome put back on its feet after a ragdoll) set y to
  `heightAt` of their new x, z every frame.
- `pushOutOfBoxes(x, z, r, boxes)` calls with no y (default 0): pass `heightAt(x, z)` (the gnome's feet) so boxes on a
  hillside still block it.
- Height tests that mean "on the ground" (`y <= 0`, `y < 0.05`) use `aboveGround`.
- No new test file is required. If you add one, name it `src/terrainTownsgnomes.test.ts`.

## Contract

- No exported signature changes in these three files.
- Flat terrain: every changed expression gives exactly the old value.

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` passes (or only shows other workers' files).
- From `games/gnome-theft-auto`: `npx vitest run src/ambientGnomes.test.ts src/layout.golden.test.ts` passes, golden
  fixture unedited.

## Out of scope

`src/gnomes.ts`, `src/ragdoll.ts`, `src/player.ts`, `src/police.ts`, `src/encounters.ts`, `src/worldEvents.ts`,
`src/terrain.ts`, `src/terrainMesh.ts`, `src/config.ts`, `src/app.ts` and every other file not listed above.

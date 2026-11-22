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

Encounters, public world events, quest givers, quest markers and objective props stand on `heightAt`: marker rings
lie on the ground, beacons rise from it, quest props and quest gnomes stand on it.

## Read first

- `games/gnome-theft-auto/src/encounters.ts` (286 lines): ~13 places; search `position.set(`, `.y = `, `y: 0`.
- `games/gnome-theft-auto/src/worldEvents.ts` (379 lines): ~5 places.
- `games/gnome-theft-auto/src/quests/quests.ts`: giver markers (`m.position.y = 2.3` floating icon, `m.position.y =
  0.06` flat ring on `LAYER.marker`, around lines 78-89: see how they are positioned at the giver's x, z),
  `group.position.set(x, 0, z)` (~193, a hose prop; its children ~203-261 are local), `ring.position.set(obj.at[0],
  0.08, obj.at[1])` (~229).
- `games/gnome-theft-auto/src/quests/objectivesAction.ts`: `m.position.set(x, 0.08, z)` (~20, flat ring), `m.position
  .set(x, 20, z)` (~30, a tall beacon column standing on the ground at half its height?), the boss at `(0, 0, bossZ)`
  (~197, 225), `intakeRing.position.set(0, 0.1, intakeZ)` (~227), `g.model.object.position.set(g.x, 0, g.z)` (~235).
- `games/gnome-theft-auto/src/quests/objectivesDrive.ts`: `m.position.y = 2.9` (~21), `m.position.set(x, 0.08, z)`
  (~65), `pickupRing.position.set(target.x, 0.08, target.z)` (~176).
- `src/quests/cutscene.ts` builds an indoor stage: it is NOT on the terrain; do not change it.

## Change

- In `src/encounters.ts`, `src/worldEvents.ts`, `src/quests/quests.ts`, `src/quests/objectivesAction.ts`,
  `src/quests/objectivesDrive.ts`: every top-level world position becomes `heightAt(x, z) + <its old y>` at its own x,
  z (import from `'./terrain'` or, inside `src/quests/`, from `'../terrain'` and `'../terrainMesh'`).
  - Flat rings and discs on `LAYER.marker` placed once: `placeOnGround(ring, x, z, 0.08, true)` (tilted onto the
    slope). Rings that are moved every frame: set `position.y = heightAt(x, z) + lift` each frame.
  - Floating icons and beacons (`y = 2.3`, `2.9`, `20`): `heightAt(x, z) + <old y>`.
  - Gnomes and props moved each frame: y from `heightAt` each frame.
  - Distance or arrival checks that only use x and z stay as they are.
- No new test file is required. If you add one, name it `src/terrainQuests.test.ts`.

## Contract

- No exported signature changes in these files (the quest engine, app.ts and the HUD call them).
- Flat terrain: every changed expression gives exactly the old value.

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` passes (or only shows other workers' files).
- From `games/gnome-theft-auto`: `npx vitest run src/quests/quests.test.ts src/worldEvents.test.ts
  src/layout.golden.test.ts` passes, golden fixture unedited.

## Out of scope

`src/quests/cutscene.ts`, `src/quests/chapter*.ts`, `src/quests/defs.ts`, `src/npcs.ts`, `src/vibeNpcs.ts`,
`src/terrain.ts`, `src/terrainMesh.ts`, `src/config.ts`, `src/app.ts` and every other file not listed above.

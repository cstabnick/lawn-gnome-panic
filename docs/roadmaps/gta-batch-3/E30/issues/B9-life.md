Epic: E30-B (Pardonlin content, all parallel)
Depends on: none

## Environment
Repo = the current working directory (a git worktree of lawn-gnome-panic). Git Bash; if `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Keep LF line endings. Do not commit. Many workers edit other files of
`games/gnome-theft-auto` at the same time; touch only the two files below. World axes: +x east, +z south, metres;
yaw = three.js rotation.y, a model faces its local +z, so moving with yaw `a` means dx = sin(a), dz = cos(a).

## Goal
Pardonlin moves: pigeons peck on the squares and burst into the air when the player comes close, then come back;
swans glide on the Thymes; Continentals stroll the river footpaths and cycle along them on push-bikes.

## Read first
- `games/gnome-theft-auto/src/pardonlin/life.ts`: your file (stub with the final signature; app.ts already calls it).
- `games/gnome-theft-auto/src/ambientGnomes.ts`: how a gnome model is made and posed each frame: `makeGnome(scene,
  look)`, `model.update(gnomeState(x, y, z, yaw, speed), dt)` (speed > 0 makes it walk), `heightAt` from
  `../terrain`, `animStride` / `stepAnimClock` / `newAnimClock` (pose far gnomes less often).
- `games/gnome-theft-auto/src/pardonlin/layout.ts`: `pathPoints(id)` gives world points of a footpath or the river
  (`'trail/thymes-walk'`, `'trail/rive-gauche'`, `'thymes'`), `insideEuroYard(x, z)`.
- `packages/prefabs/src/index.ts` exports `buildPrefab(id, { lights: false })` (a THREE.Group, origin on the ground,
  front +z). Prefab ids: `bird-pigeon`, `bird-swan`, `push-mower-bike` (or search `grep -rho "id: '[a-z-]*bike[a-z-]*'"
  packages/prefabs/src/catalog/`).

## Change
- `games/gnome-theft-auto/src/pardonlin/life.ts` (keep the exported names and signature):
  ```ts
  export interface PardonlinLife { update(dt: number, px: number, pz: number, night: number): void }
  export function createPardonlinLife(scene: THREE.Scene): PardonlinLife
  ```
  (change `import type * as THREE` to `import * as THREE` if you need values; rename `_scene` to `scene`.)
  - **Pigeon flocks** (export `PIGEON_SPOTS: readonly { x: number; z: number; n: number }[]` with these five:
    the Grand Platz (-1510,-240, n 12), the Bean Tower garden (-1520,-340, n 8), Teacup Row (-1522,180, n 8), the
    Beetle Market (-1733,150, n 10), Basin Quay (-1500,1030, n 8)). Each pigeon: a `bird-pigeon` group, starting at a
    fixed offset within 5 m of its spot (seeded, no Math.random at build), pecking (a small nod: tilt the group's x
    rotation by 0.3 rad for 0.15 s every 1-3 s) and shuffling (walk 0.3 m at 0.4 m/s now and then). When the player
    comes within 4 m of a pigeon (on foot or in a vehicle) its whole flock flushes: each bird flies up and away from
    the player at 6 m/s climbing to 8-14 m, wings implied by a quick roll wobble, then circles the spot once at that
    height for 6-10 s and lands back at a new offset. Night (night > 0.6): flocks roost (hidden, `visible = false`).
  - **Swans**: 4 `bird-swan`s on the Thymes, each gliding at 0.6 m/s along `pathPoints('thymes')` between z -500 and
    z 500, turning back at the ends, at y = the water level: use `waterAt(x, z)` from `../terrain` if it returns a
    surface height (check its signature), else `heightAt(x, z) + 0.05`; face the way they swim; a gentle bob.
  - **Strollers and cyclists**: 6 Continentals walking (1.1 m/s) and 3 cycling (4 m/s, gnome seated on a bike: put
    the bike group under the gnome and set the gnome a little higher, `gnomeState(..., sitting = true)`) along
    `pathPoints('trail/thymes-walk')` and `pathPoints('trail/rive-gauche')`, from end to end and back, each with a
    fixed look (berets: hat colours 0x1f2a44, 0x7a1f2b, 0x2e4a2e; striped shirts 0xf5efe4 / 0x1f4f8f; skin varied).
    Pose with `animStride`-style LOD (far ones every few frames). They pass through each other (no collision).
  - Cheap when far: if the player is more than 600 m from (-1600, 100) (and px < 1e5), skip all updates except
    hiding; on a cutscene (px >= 1e5) keep everything still.
  - All objects are added to the scene at creation; total under ~70 objects. Do not register them with the culler
    yourself (app.ts's late registration does that).
- `games/gnome-theft-auto/src/pardonlin/life.test.ts` (new): pure checks with no scene rendering: `PIGEON_SPOTS` has 5
  spots all with `insideEuroYard` true; export and test a pure helper `flushTarget(bx, bz, px, pz, height)` that
  returns the point a flushed pigeon heads for (away from the player, at `height`).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/pardonlin/life.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `life.ts` / `life.test.ts`.

## Out of scope
`app.ts` (already calls `createPardonlinLife(scene)` and `update(dt, simX, simZ, night)`), every other file.

Epic: 4 (Wild World: water, bridges and boats)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: if `node`/`npm` is not found, in Git Bash run `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
  installed: never run `npm install`. Never commit, push, stash, reset, or `git checkout`/`git restore` any file.
- About ten other workers and two other planning sessions edit other files of this game at the same time. Edit only
  the files this issue names (player.ts with small Edit-tool edits). If `tsc` or a test fails in a file you do not
  own, someone is mid-edit: ignore it.

## Goal
The lore ruling for water, in code: a fired-clay gnome is hollow, so in deep water it **bobs upright like a fishing
float** and paddles slowly (no firing: app.ts already blocks it while `player.swimming`); in shallow water (the canal
floor, river edges) it wades on the bed. A mower (any ground vehicle) that drives into deep water **conks out and
sinks**, and comes back later where it was first parked. Nothing ever gets wet: no drips, no "soaked".

## Read first
- `games/gnome-theft-auto/src/swim.ts`: the planner stub and its exported signatures (keep them exactly).
- `games/gnome-theft-auto/src/player.ts`: `createPlayer` and `updateFoot` (camera-relative move, `pushOutOfBoxes`,
  `groundHeight`, jump and gravity, then `model.update(state, dt)`). The player object already has `swimming: false`.
- `games/gnome-theft-auto/src/terrain.ts`: `waterAt(x, z)` -> `{ surface, depth } | null` (depth = surface - bed;
  ignores bridge decks), `bedAt(x, z)` (the bed, also under a bridge), `heightAt(x, z)` (the bridge deck on a bridge).
- `games/gnome-theft-auto/src/config.ts`: the `WATER` block at the end (`wadeDepth` 0.7, `stallDepth` 0.75,
  `sinkRespawnS` 45, `respawnClear` 60, `paddleSpeed` 2.2, `bobAmp` 0.06, `bobHz` 0.8, `floatDepth` 0.55) and `PLAYER`.
- How the stubs are already called (do not edit these files): `vehicles.ts stepVehicle` returns early for `v.sunk`
  and calls `checkSink(v)` after every ground move; `app.ts` calls `checkSink(v)` after the physics-model step, ejects
  the player (`player.exit()`, a toast) when the player's vehicle becomes `sunk`, never offers a sunk vehicle to
  enter, and calls `stepSunk(vehicles, dt, player.x, player.z, repairVehicle)` every frame.

## Change
- `games/gnome-theft-auto/src/swim.ts`: implement the three functions (pure: import only `./config`, `./terrain` and
  types; never import `./vehicles`):
  - `swimState(x, y, z)`: `w = waterAt(x, z)`; `'dry'` if `!w` or `y > w.surface + 0.05` (on a bridge, on the bank,
    in the air); `'wade'` if `w.depth < WATER.wadeDepth`; else `'bob'`.
  - `checkSink(v)`: return false for boats (`v.spec.boat`), flyers (`v.spec.flies`), `v.sunk`, `v.exploded`. If
    `w = waterAt(v.x, v.z)` has `w.depth > WATER.stallDepth` and `v.y < w.surface - 0.2` (the wheels are under water:
    a ground vehicle's y is the ground under it): set `v.sunk = true`, `v.sunkT = 0`, `v.speed = 0`, `v.vy = 0`,
    `v.boostActive = false`, `v.sim = undefined`, hide `v.headlights` if present, and return true. Else false.
  - `stepSunk(vehicles, dt, px, pz, repair?)`: for each `v.sunk`: `v.sunkT += dt`; settle `v.y` toward
    `bedAt(v.x, v.z)` at 1.5 m/s (never below it); `v.speed = 0`. When `v.sunkT >= WATER.sinkRespawnS`, `v.home` is
    set, and both the vehicle and its home are farther than `WATER.respawnClear` from (px, pz): move it to
    `v.home` (`x, z, yaw`), `y = heightAt(home)`, `sunk = false`, `sunkT = 0`, `driver = 'none'`, then `repair?.(v)`.
- `games/gnome-theft-auto/src/player.ts`, inside `updateFoot` only (small edits):
  - After the horizontal move and box push, compute `const sw = swimState(p.x, p.y, p.z)`.
  - `'bob'`: set `p.swimming = true`; the move speed is `WATER.paddleSpeed` instead of `PLAYER.walkSpeed` (apply it to
    `vel` before the move: compute the state from the previous position, so the move uses the right speed); no jump;
    `p.vy = 0`; `p.grounded = true`; `p.y = w.surface - WATER.floatDepth + WATER.bobAmp * Math.sin(t * 2 * Math.PI *
    WATER.bobHz)` with `t` a time accumulator in the closure; skip the `groundHeight` / gravity block. The model
    stands upright (the normal `model.update` with `state.grounded = true` is fine); keep both arms down
    (`model.arms.*.rotation.set(0, 0, 0)`) and do not raise the aiming arm.
  - Climbing out: when the state is `'wade'` or `'dry'` the normal walk code runs (`p.swimming = false`). Wading: walk
    at `0.6 * PLAYER.walkSpeed` while `swimState` is `'wade'`.
  - Entering from above (walking off a bank or a bridge): the normal gravity code runs until the feet reach the water;
    once `p.y <= w.surface - WATER.floatDepth` with depth >= `wadeDepth`, it becomes `'bob'` (clamp `p.y` up to that
    float height; never let the gnome sink to the bed in deep water).
  - Leave `updateAir`, `updateRiding`, `enter`, `exit`, `respawn` as they are, except that `respawn` and `enter` set
    `p.swimming = false`.
- `games/gnome-theft-auto/src/swim.test.ts` (new):
  1. `swimState` is `'dry'` at (0, 0, 0) (Turfton), `'bob'` at the loch centre (-700, y = surface - 0.5, -680),
     `'wade'` in the middle of the canal at (-150, surface - 0.4, 230) (canal depth 0.55), and `'dry'` on the canal
     bridge deck at (0, heightAt(0, 230), 230).
  2. `checkSink` on a plain ground-vehicle object (`{ spec: VEHICLES['ride-on'], x: -700, z: -680, y: bedAt(-700, -680),
     speed: 5, ... } as Vehicle`) returns true and sets `sunk`; the same at (-150, 230) in the canal returns false
     (shallow); a boat spec never sinks.
  3. `stepSunk` with a sunk vehicle whose `home` is 200 m away: after 44 s it is still sunk; after 46 s with the player
     far from both, it is back at `home`, not sunk, and `repair` was called once.

## Contract
```ts
export type SwimState = 'dry' | 'wade' | 'bob';
export function swimState(x: number, y: number, z: number): SwimState
export function checkSink(v: Vehicle): boolean
export function stepSunk(vehicles: readonly Vehicle[], dt: number, playerX: number, playerZ: number, repair?: (v: Vehicle) => void): void
```
`Player.swimming` (optional boolean in types.ts) is true exactly while bobbing.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `swim.ts`, `player.ts`, `swim.test.ts`.
- `(cd games/gnome-theft-auto && npx vitest run src/swim.test.ts src/terrainWalk.test.ts src/collide.test.ts)` passes
  (terrainWalk walks the player over a test hill: walking on land must be unchanged).
- `npm test -w games/gnome-theft-auto` shows no new failures except `layout.golden.test.ts` (expected to fail in this
  epic) and files other workers own.

## Out of scope
`vehicles.ts`, `app.ts`, `simdrive.ts`, `terrain.ts`, `water.ts`, `config.ts`, `types.ts`, any other file.

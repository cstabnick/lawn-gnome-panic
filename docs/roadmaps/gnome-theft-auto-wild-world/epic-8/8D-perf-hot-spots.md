Epic: 8 Integration (Gnome Theft Auto Wild World)
Depends on: none

## Environment
Working directory `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, do not commit).
Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Other workers are editing other files
of `games/gnome-theft-auto` at the same time (`src/app.ts`, `src/tessie.ts`, `src/radio/*`, new
`src/wildAchievements.ts`): do not touch them. If you run a dev server, use port **5477** only.

## Goal
Remove three CPU / draw-call hot spots measured at a phone viewport on the 1800 m map, without changing what the game
does: townsgnome walk-point picking, NPC route planning, and the ground's draw calls.

Measured: outside Turfton, `npcs.ts` `pickNear` costs about 5% of the frame (it filters every walk point on the map for
every call, and the recycle step calls it every frame for every far-away calm gnome even when it finds nothing), and
`errands.ts` `planRoute` about 4-6% (Dijkstra that scans the open set linearly and rebuilds an id map every call).
The ground is about 1230 chunk meshes (64 m chunks, one mesh per chunk and ground kind), 200-430 of them drawn.

## Read first
- `games/gnome-theft-auto/src/npcs.ts`: `pickNear` (~line 77), `pickTarget`, `seed` (~line 213), the recycle step
  (~line 264, "Recycle: a calm gnome far from the player reappears nearer the player"), and the other `pickNear` call
  (~line 403). `World.walkPoints` is a fixed array built once by world.ts (never changes after the world is built).
- `games/gnome-theft-auto/src/errands.ts`: `planRoute(nodes, from, goal, noBack?)` and its callers in the same file.
- `games/gnome-theft-auto/src/traffic.test.ts` lines 60-90: the `planRoute` / `pickErrand` tests (they must still pass).
- `games/gnome-theft-auto/src/config.ts` lines ~160-175: `TERRAIN.step` 2, `TERRAIN.chunk` 64, `chunkViewDistance`.
- `games/gnome-theft-auto/src/terrainMesh.ts` `buildTerrainChunks` (read only: it splits the grid into
  `TERRAIN.chunk / TERRAIN.step` cells per chunk and draws one mesh per chunk and ground kind).

## Change
- `src/npcs.ts`:
  - Add a lazily built spatial index of `world.walkPoints`, cached in a module-level
    `WeakMap<readonly { x: number; z: number }[], Map<string, { x: number; z: number }[]>>` keyed by the walkPoints
    array, with 64 m cells (`key = \`${Math.floor(x / 64)},${Math.floor(z / 64)}\``).
  - `pickNear(world, x, z, minD, maxD, avoid?)`: same contract and return type. When `maxD` is finite, gather
    candidates only from the cells overlapping the square `x ± maxD`, `z ± maxD` (then the exact `minD..maxD` distance
    test); when `maxD` is `Infinity`, use the whole array as now. Then, instead of testing every candidate against every
    `avoid` gnome, try up to 16 random candidates and return the first that is at least 8 from every `avoid` gnome; if
    none is, return a random candidate (as now when no uncrowded one exists).
  - Recycle step: give each gnome's private `Aux` a `recycleT: number` (start 0 in `freshAux`). When the recycle
    `pickNear` returns null, set `a.recycleT = 1` (seconds) and skip the recycle attempt while `a.recycleT > 0`
    (count it down by `dt` in the same per-gnome update). Behaviour when a point is found is unchanged.
- `src/errands.ts` `planRoute`: same signature and the same routes. Cache the `id -> RoadNode` map per `nodes` array in
  a module-level `WeakMap`, and replace the linear scan of the open set with a small binary min-heap of `[dist, id]`
  (skip stale entries whose dist is larger than `dist.get(id)`). Keep the `noBack` retry (`run(noBack) ?? run(undefined)`).
- `src/config.ts`: `TERRAIN.chunk` 64 -> 128 and update its comment ("one mesh per chunk and ground kind; 128 m keeps the
  ground to about a quarter of the draw calls of 64 m"). Change nothing else in config.ts.

## Contract
No exported signature changes in `npcs.ts`, `errands.ts`, `config.ts`. `TERRAIN.chunk` must stay a multiple of
`TERRAIN.step` (128 / 2 = 64 cells per chunk, 65 x 65 = 4225 vertices, inside 16-bit indices).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes (errors only in files other workers own: report them).
- `cd games/gnome-theft-auto && npx vitest run src/traffic.test.ts src/ambientGnomes.test.ts src/terrain.test.ts src/terrainWalk.test.ts src/landforms.test.ts src/layout.golden.test.ts`
  passes.
- Add to `src/traffic.test.ts` one test: on a 10 x 10 grid of linked nodes, `planRoute` from corner to corner returns
  a path of 19 nodes, and a second call with the same `nodes` array returns an equal path.
- Optional: with `npx vite games/gnome-theft-auto --port 5477 --strictPort` running,
  `bash tools/smoke.sh "http://localhost:5477/?offline&no-intro&at=300,600" canvas` is clean. Stop the server after.

## Out of scope
`terrainMesh.ts` (read only), `app.ts`, `critters.ts`, `src/critters/*`, `tessie.ts`, `src/radio/*`, every package.

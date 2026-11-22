Epic: 6 Wildlife and region life (Gnome Theft Auto Wild World)
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: in Git Bash, if `node`/`npm` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run `npm install`. Do not `git commit`, push or stash. Do not start a dev server and do not run `vite build` or `npm run build` (other workers share the tree).
- Many other workers are editing other files in `games/gnome-theft-auto/` and `packages/prefabs/` at the same time. Edit ONLY the files named under Change. Type or test errors in files you did not touch are other workers mid-edit: ignore them, re-run later.
- The prefabs `giant-grass-blade`, `bee`, `bee-hive` are being made right now by another worker. Until they land: build the grass only when `getPrefab('giant-grass-blade')` exists (from `@lawn/prefabs`; if it does not, still keep the patch data, so hiding and slowing work, just draw nothing), and use `critterMesh('bee-hive', 1.3)` from `../critters` for hives (a grey box until it lands).

## Goal

Tallgrass Commons has four stands of giant grass: on foot inside unmown grass the Hat Watch cannot see you; a mower in it slows right down but mows a path, which grows back. Bees work the flowers round four hives; knocking a hive sends a swarm after you that chips your clay until you reach water or outrun it.

## Read first

- `docs/roadmaps/gnome-theft-auto-wild-world/epic-6/_runtime.md`: the critter runtime contract and the rules (`setPlayerHidden`, `roadDistance`, `openSpot`).
- `games/gnome-theft-auto/src/critters.ts`: the runtime (bees are kind 'bee', `flyHeight` 1.6: they hover).
- `packages/prefabs/src/instances.ts`: `buildPrefabInstances(id, matrices, opts)` returns a `THREE.Group` whose children are `THREE.InstancedMesh`es, all with the same instance order as `matrices`. To change one copy: for every child mesh, `mesh.setMatrixAt(i, m)` then `mesh.instanceMatrix.needsUpdate = true`.
- `games/gnome-theft-auto/src/critters.test.ts`: how to build a runtime in a test.
- `games/gnome-theft-auto/src/critters/commons.ts`: the stub you fill.

## Change

- `games/gnome-theft-auto/src/critters/commons.ts`: replace the stub. Keep `export const commonsLife: RegionLife` with `id: 'tallgrass-commons'`. Region 'tallgrass-commons' for everything; world coordinates.
  1. **Grass patches**: export `GRASS_PATCHES = [{ id: 'west', x: -800, z: 480, r: 55 }, { id: 'south', x: -470, z: 760, r: 65 }, { id: 'corner', x: -760, z: 800, r: 55 }, { id: 'middle', x: -620, z: 660, r: 35 }]`. In `init`, for each patch lay tufts on a 2.2-unit grid jittered by up to 0.7, keeping points inside the circle, with `regionAt(x, z) === 'tallgrass-commons'` and `roadDistance(x, z) > 7`. Each tuft: position (x, heightAt(x, z), z), random yaw, uniform scale 2.0 to 3.0 (a 6 to 9 unit tall tuft). Build one `buildPrefabInstances('giant-grass-blade', matrices)` group per patch, add it to `rt.scene`. Keep per patch: the tuft positions, scales and matrices, `cutAt: Float32Array` (time each tuft was mown, or -1), and a cell lookup (a `Map` from `Math.floor(x / 2.2) + ',' + Math.floor(z / 2.2)` to tuft indices) for fast queries. Hide a patch group when the player is more than `r + 260` from its centre.
  2. Export pure helpers: `export function tallGrassAt(x: number, z: number, time: number): boolean` (true when an unmown tuft is within 1.6 of the point) built on the patch data, and `export function inPatch(x: number, z: number): boolean` (inside any patch circle). They read module-level patch data filled by `init` (also expose `export function buildPatches(): void` that fills it without three.js meshes, so tests can call it).
  3. **Hiding** (`update`): `setPlayerHidden(!ctx.playerVehicle && tallGrassAt(ctx.playerX, ctx.playerZ, ctx.time))` EVERY frame (always set it, true or false). On the frame it turns true, at most once every 30 s: `rt.deps.toast('Hidden in the tall grass. The Hat Watch cannot see you.')`.
  4. **Mowing and slowing** (`update`): for every vehicle not flying (or flying lower than 2 above `heightAt`), inside a patch: every unmown tuft within `v.spec.radius + 0.5` of it is mown: `cutAt[i] = ctx.time`, its matrix becomes the same position and yaw with scale (s, 0.06, s) (stubble), update all child meshes of the group. If the vehicle touched unmown grass this frame and `Math.abs(v.speed) > 6`: slow it, `v.speed -= Math.sign(v.speed) * Math.min(Math.abs(v.speed) - 6, 20 * ctx.dt)` (the player's physics model picks this up from `v.speed`). Regrow: a mown tuft whose `cutAt` is more than 45 s ago gets its full matrix back and `cutAt = -1` (check about 200 tufts per frame round-robin, not all of them).
  5. **Hives and bees**: export `HIVES = [{ id: 'hive-west', x: -735, z: 470 }, { id: 'hive-south', x: -395, z: 760 }, { id: 'hive-corner', x: -690, z: 810 }, { id: 'hive-middle', x: -575, z: 640 }]`. `groups`: one per hive, `{ id: <hive id>, kind: 'bee', region: 'tallgrass-commons', x, z, count: 5, spread: 4, leash: 10 }`. In `init`, at each group's centre (`rt.inGroup(id)[0].homeX/homeZ`): the hive (`critterMesh('bee-hive', 1.3)` at heightAt) and 6 `giant-flower` prefabs (`buildPrefab('giant-flower', { scale: 3, lights: false, tint })`, 3.5 tall at that scale) in a ring of radius 7, tints from [0xf26b8a, 0xf2c230, 0xffffff, 0xb57edc].
     - **Knocking a hive**: a bullet within 1.2 (x/z) of a hive and below `heightAt + 1.6` (`hitTest`), or a vehicle at more than 3 units/s within `v.spec.radius + 1` (`update`). The hive tilts (rotation.z 0.5) and is "angry" for the swarm; it cannot be knocked again until 60 s after the swarm ends (then stands up again). On knock: `rt.deps.toast('You knocked a hive! RUN!')`, `rt.deps.play('bump')`, `rt.deps.event('hive-knocked')`; its 5 bees plus 6 more spawned there (`rt.spawn('bee', hx, hz, { region: 'tallgrass-commons', group: <hive id>, leash: 10 })`; remember the extra ones and `rt.remove` them when the swarm ends: this is the only removal allowed, the extras are a temporary swarm) all `rt.chase(c, 40)`.
     - **Swarm** (`update`): while a hive is angry, keep its bees chasing (`rt.chase(c, 1)` again each frame for any that dropped out and are not down), and every bee within 1.4 units of the player (in x/z) adds `0.02 * ctx.dt` to the player's damage this frame: call `rt.deps.hurtPlayer(total)` once per frame (it is ignored in a vehicle, so driving off is a way out). The swarm ends when the player is in water (`waterAt(ctx.playerX, ctx.playerZ) !== null`), more than 140 units from the hive, or after 40 s: bees go `mode = 'idle'` (the runtime flies them home), extras removed, `rt.deps.toast('You lost the swarm.')`, `rt.deps.event('swarm-escaped')`.
     - `onHit` (bees only, return `false` for other kinds): shot bees are knocked over by the runtime as usual (return `false`).
- `games/gnome-theft-auto/src/critters/commons.test.ts` (new): `buildPatches()` then: `tallGrassAt` is true at a patch centre and false 20 units outside every patch; `inPatch(-800, 480)` true. With a runtime (`createCritters(new THREE.Scene(), world, deps, [commonsLife])`, fake world, recording deps): 4 bee groups of 5; the player on foot at a patch centre -> after one update `isPlayerHidden()` is true; in a vehicle at the same place -> false; a vehicle driving through a patch at speed 12 for 10 frames ends slower than 12 and mows tufts (`tallGrassAt` false along its path afterwards), and 46 s later (`time` advanced, enough updates for the round-robin) the grass is back; shooting a hive (`rt.hitTest(hx, heightAt + 0.8, hz)`) starts a swarm (its bees in 'chase') and `rt.list` grows by 6; moving the player 150 units away ends it (`rt.list` back to the start count, an 'swarm-escaped' event).

## Contract

`export const commonsLife: RegionLife`, `GRASS_PATCHES`, `HIVES`, `tallGrassAt`, `inPatch`, `buildPatches`. Only `setPlayerHidden` talks to the Hat Watch (police.ts already reads `isPlayerHidden()`). Do not change `critters.ts`, `critters/index.ts`, `police.ts`, `app.ts`, `vehicles.ts`.

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/critters/commons.ts` or its test.
- `npx vitest run --root games/gnome-theft-auto src/critters/commons.test.ts` passes.

## Out of scope

`src/critters.ts`, `src/critters/index.ts`, the other files in `src/critters/` (other workers: `cloverfield.ts`, `dreyGang.ts`, `fells.ts`), `police.ts`, `app.ts`, `config.ts`, `terrain.ts` (`waterAt` belongs to another epic), `radio/`, `packages/`. No new buttons, no networking.

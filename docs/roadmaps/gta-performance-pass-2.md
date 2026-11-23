# Gnome Theft Auto: performance pass 2

Goal: find where the frame goes now that the batch added street events, hunting, the animator, highways, debris and
engine voices, and cut the biggest costs without changing the look. Follows `gta-perf-pass.md` (culling, quality
tiers, the profiler and the `?perf` overlay).

## How it was measured

- Dev server without HMR (other planners edit the same worktree, and Vite's full reload killed the runs): a small
  script calling Vite's `createServer({ root: games/gnome-theft-auto, server: { port: 5410, hmr: false, watch: { ignored: ['**/*'] } } })`.
- `node tools/gta-perf.mjs http://127.0.0.1:5410/ --cpu 4` (phone viewport 390x844 @2x, CPU slowed 4x like a mid
  phone, drive across every region at 40 m/s, profiler sections per leg).
- A CDP CPU profile (`Profiler.start`, 200 us sampling, 8 s) while circling Turfton at (60, -60) and the Turfton Skyway
  at (330, -60), 4x CPU throttle, summed by function (self and inclusive).
- In-page micro timings of `scene.updateMatrixWorld()` and `renderer.render()` (20 runs, 4x throttle), and the scene
  census (nodes, meshes, culled meshes, programs, geometries) at the start and after a 3-minute tour.

## Measured before (4x CPU, 390x844 @2x, medium tier)

`gta-perf --cpu 4`:

| leg | avg ms | p50 | p95 | >50 ms frames | draws avg/max | tris avg (k) | CPU ms (profiler) | render ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Turfton | 65.1 | 55.5 | 173.5 | 19 | 198/218 | 657 | 199 (first second) | 97.6 |
| Frostbite Fells | 34.9 | 34.7 | 62.5 | 45 | 155/304 | 369 | 30.5 | 19.2 |
| Loch Moss | 28.6 | 27.4 | 48.7 | 29 | 117/205 | 269 | 23.6 | 14.4 |
| Mossy Wood | 29.3 | 27.7 | 55.5 | 30 | 94/269 | 281 | 23.5 | 14.9 |
| Tallgrass Commons | 26.6 | 20.9 | 48.6 | 18 | 61/118 | 368 | 21.7 | 14.1 |
| Cloverfield Farms | 31.0 | 27.8 | 55.6 | 65 | 100/444 | 482 | 25.3 | 17.4 |
| Dust Flats | 36.7 | 34.7 | 62.4 | 59 | 139/450 | 423 | 29.3 | 21.0 |
| Turfton (back) | 57.2 | 55.5 | 90.3 | 117 | 254/395 | 544 | 46.0 | 30.7 |

Draw calls (60-250) and triangles (0.3-0.7 M) are no longer the problem. The render's CPU side is: two thirds of the
CPU frame is `render`, with only 100-250 draws.

CPU profile, Turfton, inclusive share of the frame:

| what | share |
| --- | --- |
| `renderer.render` | 53 % |
| - `updateMatrixWorld` (5 700 nodes, 4 600 auto-updating, every frame) | 17 % |
| - `projectObject` (main pass walk + frustum tests) | 10 % |
| - shadow pass (`WebGLShadowMap.render`, its own walk of the whole scene) | 11 % |
| - main pass draws (`renderObjects`, `setProgram` 11.5 %) | 15 % |
| traffic (`drive` 7.3 %, of which `finish` 5.5 %: rider pose + `poseHands`, which forces `updateMatrixWorld(true)` on the whole vehicle) | 9.4 % |
| radio music (Tone.js parts and synth starts, `radio/music/build.ts`) | about 9 % |
| npcs (`tick` 3.5 %, gnome `model.update` 2.3 % across all gnomes) | 3.7 % |
| hud (`drawMap`, the minimap canvas every frame) | 1.9 % |
| world-life (destructibles, lamps, ambient gnomes, vibe npcs) | 3-4 % |
| garbage collector | 0.3 % (per-frame allocation is not a problem) |

Scene census at (60, -60): 5 700 nodes, 3 400 meshes, of which 1 030 culled by layer (still walked three times per
frame: matrices, main pass, shadow pass) and 950 hidden with `visible = false`.

In-page timings (4x): `updateMatrixWorld` 2.1 ms, `render` 15.9 ms. Hiding the 382 fully culled roots with `visible`
and skipping their matrices: `updateMatrixWorld` 1.25 ms, `render` 11.4 ms (-28 %). Freezing the matrices of the
named static groups (terrain chunks, scenery cells; 1 700 nodes): only -0.1 ms (not worth it). Not re-rendering the
shadow map that frame: a further -1.3 ms.

### Hitch: every material compiled twice

`app.ts` set `renderer.shadowMap.type = THREE.PCFSoftShadowMap`. three r187 removed it: the first shadow render
switches the type to `PCFShadowMap` with a warning. So the load-time `renderer.compile` (the 0.4-3 s "shader warm-up")
built every program for the wrong shadow type, and during play every material compiled again the first time it was
seen: 11 new programs in 60 s of driving round Turfton (each a 50-300 ms stall on a phone), every one differing from a
warmed program only in `shadowMapType` 2 -> 1.

### Growth over time

After a 3-minute tour: nodes 5 700 -> 7 400, meshes 3 400 -> 4 500. Critters (cows, sheep, hens, squirrels, bees) and
hunting quarry keep their meshes once made (hidden with `visible` past their mesh radius), about 1 500 nodes. Hidden
objects are skipped by the render walks but still get their matrices updated. GPU geometries 200 -> 2 400 as more of
the world is drawn the first time (2 500 unique geometries in the scene: each gnome bakes its own); not a leak.

## What this pass does

| change | where | expected |
| --- | --- | --- |
| Shadow type `PCFShadowMap` (what three uses anyway): the warm-up compiles the programs play uses | app.ts (1 line) | no shader-compile stalls in play |
| Culled objects leave the render walks: during the render a culled root reads `visible = false` (the game still sees its own value) and skips its matrix update | cull.ts | render CPU -25..30 % |
| Shadow map re-rendered every 2nd frame on `low`, every 3rd on the new `min` tier | quality.ts, app.ts | shadow pass -50..66 % on slow devices |
| New lowest tier `min` (DPR 0.8, 512 shadow map, 35 m shadow box, view x0.45): the governor drops to it when `low` is still slow | quality.ts | phones that are still slow on `low` |
| NPC drivers' pose and hands stepped by distance (every frame near, every 2nd / 4th frame further, none past 160 m) | traffic.ts + animStride.ts | traffic -3..4 % of the frame |
| Pedestrians' pose stepped by distance, run-over check skips far vehicles | npcs.ts + animStride.ts | npcs -1..2 % |
| Minimap canvas redrawn every 2nd frame | hud.ts | -1 % |

Also done (planner, found while checking load time): `landforms/fields.ts` built its four distance fields (river, water,
border, highway) by measuring every cell against every segment. It now skips segments whose bounding box is already
further than the best distance so far, starting from the previous cell's nearest segment. The fields come out exactly the
same (checked: all four fields equal at every 2 m sample over the map), and the build is 1.0 s -> 0.18 s. The
height grid (`heightGrid()`, which `landforms.test.ts` limits to 6 s) went from 2.4 s to 1.4 s on its own. The
test had been failing only when the whole suite ran in parallel with other planners' runs.

## Measured after (same machine, same commands)

`gta-perf --cpu 4`. The adaptive governor stayed at a 1024 shadow map through Cloverfield in both runs, and dropped to
`min` (512) from Dust Flats on in the after run:

| leg | avg ms before -> after | p95 | >50 ms frames | render ms (profiler) | CPU ms |
| --- | --- | --- | --- | --- | --- |
| Turfton | 65.1 -> 55.6 | 173.5 -> 90.4 | 19 -> 15 | 97.6 -> 63.5 | 199 -> 176 (first second, load) |
| Frostbite Fells | 34.9 -> 29.0 | 62.5 -> 48.6 | 45 -> 15 | 19.2 -> 17.1 | 30.5 -> 27.9 |
| Loch Moss | 28.6 -> 21.9 | 48.7 -> 34.8 | 29 -> 11 | 14.4 -> 10.6 | 23.6 -> 18.0 |
| Mossy Wood | 29.3 -> 21.6 | 55.5 -> 41.6 | 30 -> 7 | 14.9 -> 11.8 | 23.5 -> 19.4 |
| Tallgrass Commons | 26.6 -> 17.9 | 48.6 -> 34.7 | 18 -> 2 | 14.1 -> 9.3 | 21.7 -> 15.9 |
| Cloverfield Farms | 31.0 -> 22.7 | 55.6 -> 34.9 | 65 -> 5 | 17.4 -> 11.5 | 25.3 -> 19.1 |
| Dust Flats | 36.7 -> 26.4 | 62.4 -> 41.7 | 59 -> 7 | 21.0 -> 14.6 | 29.3 -> 22.1 |
| Turfton (back) | 57.2 -> 42.8 | 90.3 -> 69.4 | 117 -> 59 | 30.7 -> 22.8 | 46.0 -> 36.7 |

- Frames over 50 ms on the whole route: 382 -> 121. Profiler hitches over 50 ms: 133 -> 57.
- Programs compiled during 60 s of driving round Turfton: 11 -> 0. Programs at load: 47 -> 36.
- During the render, 2 530 nodes are walked instead of 4 030: culled roots are out of the render.
- Load (desktop, warm Vite, no throttle): game ready in 3.2-3.9 s. World build is 1.1-1.25 s, the first long task
  2.5-2.7 s. The 30 s loads other runs saw are the Vite dev server transforming about 250 modules cold, or many
  headless browsers and test runs sharing the machine. They are not the game's own start.

## Found, not fixed

| what | cost (4x CPU) | idea | expected |
| --- | --- | --- | --- |
| Radio music synthesised live with Tone.js (`radio/music/build.ts` parts, PolySynth starts) | about 9 % of the frame while the radio plays | render each song to an AudioBuffer once (Tone.Offline, in idle time) and play the buffer; or fewer `fatsawtooth` voices | up to 9 % while driving |
| `syncVehicleMesh` runs twice per frame for NPC traffic (traffic.ts `finish`, then app.ts for every vehicle), so wheels spin at double speed too | about 1 % | sync once (needs vehicles.ts or app.ts; vehicles.ts belongs to the air-and-sea planner this batch) | 1 %, and the wheel speed is fixed |
| `poseHands` forces `v.object.updateMatrixWorld(true)` on the whole vehicle for every driver (driverHands.ts) | part of the 2.6 % | update only the grip chain (`grips[side].updateWorldMatrix(true, false)`) | 1-2 % |
| Weapon wheel builds every gun's prefab icon at start (`createWeaponWheel` -> `prefabIcon`, 3-4 % of load) | about 100 ms of load | build icons when the wheel first opens | 100 ms of load |
| Gnome models bake their own geometry each (2 500 unique geometries in the scene) | GPU memory, first-draw uploads | share baked parts per look | memory |
| ambientGnomes / vibeNpcs pose every gnome every frame | 1-2 % | the same `animStride` clock as npcs.ts | 1 % |
| Critters and hunting quarry keep their meshes once made and still get matrix updates while hidden | small | release meshes far away, or register them with the culler | small |

## How to reproduce

1. Start a dev server without HMR (other sessions edit the tree): a script with Vite's `createServer` and
   `server: { port: 5410, strictPort: true, hmr: false, watch: { ignored: ['**/*'] } }`. Restart it after changing code.
2. `node tools/gta-perf.mjs http://127.0.0.1:5410/ --cpu 4 --json out.json`.
3. For a CPU profile, run CDP `Profiler.start` on the page while a script drives the mower round (60, -60), then sum the
   samples by function. For programs compiled in play, compare `renderer.info.programs` before and after 60 s of
   driving (with `?debug`, `__gta.renderer`). These were one-off puppeteer scripts and are not in the repo.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 1. Frame-cost cuts (workers) + culling walk, shadow rate, `min` tier, shadow type (planner) | `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, `gta-perf --cpu 4` re-run | 3 worker issues; the planner does cull.ts, quality.ts, animStride.ts, app.ts |

The planner wrote `src/animStride.ts` (+ test) first; workers import it.

## Epic 1

### 1A. Traffic: NPC riders posed by distance

~~~~text
Epic: 1 Frame-cost cuts
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (a shared git worktree; never commit, stash, or
switch branches). Node: in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Other workers
and planners are editing other files in games/gnome-theft-auto at the same time: edit ONLY the file listed under
Change. Errors that `tsc` reports in files you did not touch are not yours; report them, do not fix them.

## Goal
Far NPC traffic drivers stop costing a full pose every frame: the rider's gnome pose and its hands on the wheel are
stepped every frame near the player, every 2nd frame from 40 m, every 4th from 80 m, and not at all past 160 m. The
lane-blocker scan skips vehicles that are obviously too far away.

## Read first
- games/gnome-theft-auto/src/animStride.ts (already written; do not edit): `animStride(d)` returns 1, 2, 4 or 0;
  `newAnimClock(seed)` makes an `AnimClock`; `stepAnimClock(clock, dt, stride)` returns the dt to step with this frame,
  or 0 for "skip this frame".
- games/gnome-theft-auto/src/traffic.ts:
  - `function finish(v, c, dt)` (about line 432): calls `stepVehicle`, `syncVehicleMesh`, then when `v.rider` sets the
    shared `seat` state and calls `v.rider.update(seat, dt)` and `poseHands(v.rider, v, 0, dt)`.
  - `update(dtIn, vehicles, _world, playerX, playerZ, view?)` (about line 685): the per-frame entry; `drive(...)` is
    called per NPC vehicle from it, and `drive` calls `finish` from several places.
  - `function blockerAhead(v, vehicles, onFoot, playerX, playerZ, passing)` (about line 210): loops over every vehicle
    twice (lane check via `consider`, then crossing traffic).

## Change
- games/gnome-theft-auto/src/traffic.ts only:
  1. `import { animStride, newAnimClock, stepAnimClock, type AnimClock } from './animStride';`
  2. Inside the factory (next to `drivers` / the other per-vehicle maps), add
     `const riderClocks = new Map<number, AnimClock>();` keyed by `v.id`, and two closure variables
     `let focusX = 0; let focusZ = 0;`. At the top of `update(...)` set `focusX = playerX; focusZ = playerZ;`.
  3. In `finish`, replace the rider block with:
     ```ts
     if (v.rider) {
       let clock = riderClocks.get(v.id);
       if (!clock) { clock = newAnimClock(v.id); riderClocks.set(v.id, clock); }
       const step = stepAnimClock(clock, dt, animStride(Math.hypot(v.x - focusX, v.z - focusZ)));
       if (step > 0) {
         const s = v.spec.seat;
         seat.position.set(s[0], s[1], s[2]);
         v.rider.update(seat, step);
         poseHands(v.rider, v, 0, step);
       }
     }
     ```
     Keep `stepVehicle(v, c, dt, world)` and `syncVehicleMesh(v, dt)` exactly as they are.
  4. Where `update` forgets drivers of vehicles that no longer have an NPC driver (the loop
     `for (const id of drivers.keys()) if (!npcIds.has(id)) drivers.delete(id);`), also delete those ids from
     `riderClocks` the same way.
  5. In `blockerAhead`, in BOTH loops over `vehicles`, skip a vehicle early when it cannot matter: add right after
     `if (o === v) continue;` (first loop) and after the existing first `continue` checks (second loop):
     `if (Math.abs(o.x - v.x) > FAR_SKIP || Math.abs(o.z - v.z) > FAR_SKIP) continue;`
     with a module-level `const FAR_SKIP = 110;` and a one-line comment: nothing further than this can block or cross
     within the look-ahead (TRAFFIC.stopDistance 5 m, plus YIELD_SECONDS 1.6 s of two cars closing at 30 m/s each).

## Contract
No exported signature changes. `createTraffic` and everything it returns keep their types.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` reports no errors in traffic.ts.
- `npx vitest run src/traffic.test.ts src/trafficSim.test.ts src/animStride.test.ts` (run from
  games/gnome-theft-auto) passes.

## Out of scope
Every other file, in particular vehicles.ts, driverHands.ts, app.ts, npcs.ts, animStride.ts. Do not start a dev
server.
~~~~

### 1B. Pedestrians posed by distance

~~~~text
Epic: 1 Frame-cost cuts
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (a shared git worktree; never commit, stash, or
switch branches). Node: in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Other workers
and planners are editing other files in games/gnome-theft-auto at the same time (someone may also have uncommitted
edits in npcs.ts: keep your edits to the spots named below and use exact-string edits, never rewrite the file).
Errors that `tsc` reports in files you did not touch are not yours; report them, do not fix them.

## Goal
Pedestrian gnomes far from the player are posed less often (every 2nd frame from 40 m, every 4th from 80 m, none past
160 m) while they still move every frame, and the run-over check skips vehicles that are obviously far away.

## Read first
- games/gnome-theft-auto/src/animStride.ts (already written; do not edit): `animStride(d)` returns 1, 2, 4 or 0;
  `newAnimClock(seed)` makes an `AnimClock`; `stepAnimClock(clock, dt, stride)` returns the dt to step with this frame,
  or 0 for "skip this frame".
- games/gnome-theft-auto/src/npcs.ts:
  - `interface Aux` (about line 59) and `function freshAux(x, z)` (about line 84): per-gnome bookkeeping.
  - `function tick(n, dt, world, px, pz, vehicles)` (about line 307): the run-over loop
    `for (const v of vehicles) { if (!runOverHit(v, n.x, n.z, BODY_R, dt)) continue; ...`, and at its end the block
    starting with the comment `// Animate. One shared state object; model.update() reads it synchronously.` which sets
    `ps`, calls `n.model.update(ps, dt)`, `poseHandsUp` / `clearHandsUp`, and `a.anim.apply(n.model, dt)`.

## Change
- games/gnome-theft-auto/src/npcs.ts only:
  1. `import { animStride, newAnimClock, stepAnimClock, type AnimClock } from './animStride';`
  2. Add a field to `Aux`: `/** Pose level of detail (animStride.ts): far gnomes are posed every few frames. */ animClock: AnimClock;`
     and in `freshAux` set `animClock: newAnimClock(Math.floor(Math.random() * 4))`. If any other place builds an
     `Aux` object literal, add the field there too (tsc will tell you).
  3. In `tick`, inside the run-over loop, before calling `runOverHit`, add
     `if (Math.abs(v.x - n.x) > 15 || Math.abs(v.z - n.z) > 15) continue;` (no vehicle covers 15 m in one frame).
  4. Replace the animate block at the end of `tick` with:
     ```ts
     // Animate. One shared state object; model.update() reads it synchronously. Far gnomes are posed every few frames
     // (animStride.ts) but placed every frame.
     const sp = moving ? speed : 0;
     const step = stepAnimClock(a.animClock, dt, animStride(Math.hypot(n.x - px, n.z - pz)));
     if (step > 0) {
       ps.position.set(n.x, heightAt(n.x, n.z), n.z);
       ps.velocity.set(Math.sin(n.yaw) * sp, 0, Math.cos(n.yaw) * sp);
       ps.facing = n.yaw;
       n.model.update(ps, step);
       if (n.state === 'flee') {
         if (!a.panic) poseHandsUp(n.model, a.clock);
       } else {
         clearHandsUp(n.model);
       }
       a.anim.apply(n.model, step);
     } else {
       n.model.object.position.set(n.x, heightAt(n.x, n.z), n.z);
       n.model.object.rotation.y = n.yaw;
     }
     ```
     Keep every variable name the existing block uses (`moving`, `speed`, `ps`, `a`); if the existing block differs
     from the description above (someone changed it), keep its extra lines inside the `step > 0` branch.
  Do not change the ragdoll path (`tickRagdoll`), which returns earlier in `tick`.

## Contract
No exported signature changes (`createNpcs` / the `Npcs` interface stay as they are).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` reports no errors in npcs.ts.
- `npx vitest run src/animStride.test.ts src/runOver.test.ts` (from games/gnome-theft-auto) passes, and any test file
  that imports npcs.ts (`grep -l "from './npcs'" src/*.test.ts`) passes too.

## Out of scope
Every other file, in particular traffic.ts, ambientGnomes.ts, app.ts, animStride.ts and packages/gnome. Do not start
a dev server.
~~~~

### 1C. Minimap redrawn every second frame

~~~~text
Epic: 1 Frame-cost cuts
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (a shared git worktree; never commit, stash, or
switch branches). Node: in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Other workers
and planners are editing other files in games/gnome-theft-auto at the same time: edit ONLY hud.ts, with exact-string
edits. Errors that `tsc` reports in files you did not touch are not yours; report them, do not fix them.

## Goal
The minimap canvas is redrawn on every second `hud.set` call (about 30 Hz) instead of every frame. Everything else in
`set` (meters, text, the big map) keeps updating every call.

## Read first
- games/gnome-theft-auto/src/hud.ts: `function drawMap(s: HudState)` (about line 895) and, near the end of the `set(s)`
  method (about line 1284), the lines `drawMap(s);` and `if (bigOpen) drawBig(s);`. Check how `size` / `sizeMap(want)`
  is handled at the top of `drawMap`.

## Change
- games/gnome-theft-auto/src/hud.ts only:
  - Add a closure variable next to the other per-HUD state inside the factory: `let mapFrame = 0;` with the comment
    `// The minimap is redrawn every 2nd frame (about 30 Hz): it was 2 % of a phone's frame.`
  - Replace `drawMap(s);` in `set` with:
    ```ts
    // A resize redraws at once, so the map never shows at the wrong size.
    const mapWant = window.innerWidth < 420 ? 96 : 128;
    if ((mapFrame++ & 1) === 0 || mapWant !== size) drawMap(s);
    ```
    using the same expression `drawMap` uses for its wanted size (copy it from the top of `drawMap`; if it is not
    `window.innerWidth < 420 ? 96 : 128`, use what is there) and the same `size` variable it compares against.
  - Leave `if (bigOpen) drawBig(s);` unchanged (the big map keeps every frame).

## Contract
No exported signature changes.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` reports no errors in hud.ts.
- `npx vitest run src/mapIcons.test.ts` (from games/gnome-theft-auto) passes.

## Out of scope
Every other file. Do not start a dev server.
~~~~

## Planner work in epic 1 (not issues)

- `src/animStride.ts` + `animStride.test.ts` (pure stride and clock).
- `src/cull.ts`: culled roots leave the render walks (a `visible` that reads false only during the culled render, an
  `updateMatrixWorld` that skips while culled), set from `updateCull` and cleared by the scene's `onAfterRender`.
- `src/quality.ts`: `shadowEvery` per tier, new tier `min`; tests in `cull.test.ts`.
- `src/app.ts`: `PCFShadowMap`; the shadow map rendered every `shadowEvery` frames.

## Epic 2 (round 2)

Planner work: `vehicles.ts` `beginVehicleFrame()` + a second timed `syncVehicleMesh` in one frame only places the mesh
(test `vehicleSync.test.ts`), `app.ts` calls it at the top of `frame`; `driverHands.ts` no longer forces
`updateMatrixWorld(true)` on the whole vehicle (getWorldPosition and reachArm update their own parent chain).

### 2A. Ambient and vibe gnomes posed by distance

~~~~text
Epic: 2 Frame-cost cuts, round 2
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (a shared git worktree; never commit, stash, or
switch branches). Node: in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Other workers
and planners edit other files in games/gnome-theft-auto at the same time: edit ONLY ambientGnomes.ts and vibeNpcs.ts,
with exact-string edits (never rewrite a whole file). tsc errors in files you did not touch are not yours; report them.

## Goal
The ambient gnomes (ambientGnomes.ts) and the vibe characters (vibeNpcs.ts) are posed every frame near the player,
every 2nd frame from 40 m, every 4th from 80 m and not at all past 160 m, using the existing helper animStride.ts.

## Read first
- games/gnome-theft-auto/src/animStride.ts (do not edit): `animStride(d)` returns 1, 2, 4 or 0; `newAnimClock(seed)`
  returns an `AnimClock`; `stepAnimClock(clock, dt, stride)` returns the dt to step with this frame, or 0 = skip.
- games/gnome-theft-auto/src/ambientGnomes.ts: the `entries` array type (about line 384), `entries.push({...})` (about
  line 420, where `i` is the index), and `update(dt, px, pz)` (about line 430). In update, each entry computes
  `d = Math.hypot(px - e.def.x, pz - e.def.z)`, then later `e.yaw += ...`, `const gy = heightAt(...)`,
  `e.model.update(gnomeState(...), dt)`, the rig sway line, and `e.animator.apply(e.model, dt)`.
  NOTE: app.ts calls `update(dt, 1e6, 1e6)` during live cutscenes to hide bubbles; the gnomes must still animate then.
- games/gnome-theft-auto/src/vibeNpcs.ts: `interface VibeEntry` (about line 18) and `interface StandoffGnome` (about
  line 33), where entries / redCaps / blueCaps are pushed (about lines 492, 715, 720), and in
  `update(dt, playerX, playerZ, playerVehicle)` (about line 740) the two loops that call `model.update(...)` for
  `entries` and for `[...redCaps, ...blueCaps]`.

## Change
- ambientGnomes.ts:
  1. `import { animStride, newAnimClock, stepAnimClock, type AnimClock } from './animStride';`
  2. Add `/** Pose level of detail (animStride.ts). */ clock: AnimClock;` to the entries element type, and
     `clock: newAnimClock(i)` in the `entries.push({...})`.
  3. In update, keep the yaw easing and `gy` every frame, then replace the three posing statements
     (`e.model.update(...)`, the sway block with `cur`, `e.animator.apply(...)`) with:
     ```ts
     // Far gnomes are posed every few frames (animStride.ts); during a live cutscene (px 1e6) every one is posed.
     const step = stepAnimClock(e.clock, dt, px >= 1e5 ? 1 : animStride(d));
     if (step > 0) {
       e.model.update(gnomeState(e.def.x, gy, e.def.z, e.yaw, 0), step);
       <the existing sway lines, unchanged>
       e.animator.apply(e.model, step);
     }
     ```
     Leave the bubble code below it unchanged (it must run every frame).
- vibeNpcs.ts:
  1. The same import.
  2. Add `/** Pose level of detail (animStride.ts). */ clock: AnimClock;` to `VibeEntry` and to `StandoffGnome`;
     set `clock: newAnimClock(<the index or counter used at that push, e.g. entries.length or i>)` at each push.
     If tsc reports other places that build these objects, add the field there too.
  3. In update, wrap each loop body's posing in a stride step. For `entries`:
     ```ts
     const step = stepAnimClock(e.clock, dt, animStride(Math.hypot(e.x - playerX, e.z - playerZ)));
     if (step > 0) {
       e.model.update(gnomeState(e.x, e.y, e.z, e.yaw, 0, e.sitting), step);
       e.model.rig.rotation.z = Math.sin(elapsed * 1.6 + e.phase) * 0.025;
     }
     ```
     keeping the cooldown line outside the `if` (every frame). For the red/blue caps: the `throwTimer` countdown stays
     every frame; only `g.model.update(...)` and the rig sway go inside `if (step > 0)` with `step`; the throw arm
     line (`g.model.arms.right.rotation.x = ...`) must run after `g.model.update` when both run, so keep the original
     order inside the `if` and also run the arm line on skipped frames only while `g.throwTimer > 0` (it is cheap).
     If vibeNpcs.update is also given a far-away player during cutscenes (check app.ts `liveWorldFrame`; do not edit
     it), use stride 1 when `playerX >= 1e5`, as in ambientGnomes.

## Contract
No exported signature changes.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` reports no errors in ambientGnomes.ts or vibeNpcs.ts.
- From games/gnome-theft-auto: `npx vitest run src/ambientGnomes.test.ts src/animStride.test.ts` passes.

## Out of scope
Every other file (app.ts, npcs.ts, traffic.ts, animStride.ts, packages/). Do not start a dev server. Do not commit.
~~~~

### 2B. Weapon wheel builds its gun icons on first show

~~~~text
Epic: 2 Frame-cost cuts, round 2
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (a shared git worktree; never commit, stash, or
switch branches). Node: in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Other workers
edit other files in games/gnome-theft-auto at the same time: edit ONLY weaponWheel.ts, with exact-string edits.
tsc errors in files you did not touch are not yours; report them.

## Goal
Building every gun's prefab icon (`prefabIconElement`, which renders a 3D prefab to an image) was 3-4 % of the game's
load. The weapon wheel now builds the icons the first time it is shown instead of in `createWeaponWheel`.

## Read first
- games/gnome-theft-auto/src/weaponWheel.ts: in `createWeaponWheel`, the `buttons` map (about line 109) that does
  `b.appendChild(prefabIconElement(GUNS[k].prefab, '🔫', 34));`, and `function show()` (about line 164).
- games/gnome-theft-auto/src/weaponWheel.test.ts: what the tests check about buttons (they must keep passing).

## Change
- weaponWheel.ts only:
  - Remove the `b.appendChild(prefabIconElement(...))` line from the buttons map.
  - After the buttons are created, add
    ```ts
    // Gun icons are rendered the first time the wheel shows (perf pass 2: building them was 3-4 % of the load).
    let iconsBuilt = false;
    function buildIcons(): void {
      if (iconsBuilt) return;
      iconsBuilt = true;
      buttons.forEach((b, i) => b.prepend(prefabIconElement(GUNS[GUN_ORDER[i]].prefab, '🔫', 34)));
    }
    ```
    (declare it before `show` uses it; keep names consistent with the file).
  - Call `buildIcons()` as the first line of `show()` after the `if (shown) return;` guard.
  - If anything else makes the wheel visible without `show()` (search for `root.style.display = 'flex'`), call
    `buildIcons()` there too.

## Contract
No exported signature changes.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` reports no errors in weaponWheel.ts.
- From games/gnome-theft-auto: `npx vitest run src/weaponWheel.test.ts` passes.

## Out of scope
Every other file. Do not start a dev server. Do not commit.
~~~~

### Round 2: done, measured, and not done

Done:

| change | where | measured (4x CPU, `gta-perf --query '&quality=medium'`, avg ms per frame over the 7 legs after Turfton) |
| --- | --- | --- |
| A second timed `syncVehicleMesh` of a vehicle in one frame only places it (`beginVehicleFrame`). NPC wheels no longer spin at double speed | vehicles.ts, app.ts (2 lines), `vehicleSync.test.ts` | vehicles section unchanged within noise. The gain is in `traffic`/`police`, and the wheel speed is fixed |
| `poseHands` no longer forces `updateMatrixWorld(true)` on the whole vehicle | driverHands.ts | not measured on its own: `poseHands` was 0.9 % of the Turfton profile after round 1 (2.6 % before it), and this removes its biggest part |
| Ambient and vibe gnomes posed by distance (`animStride`) | ambientGnomes.ts, vibeNpcs.ts (worker 2A) | `world-life` 1.65 -> 0.93 ms |
| Weapon wheel icons built on first show | weaponWheel.ts (worker 2B) | about 100 ms off the load (3-4 % of the load profile) |
| On-foot radio: a song nobody can hear (speaker out of range for 3 s) is stopped, and re-synced to the broadcast clock when back in range | radio/player.ts | `radio` section 0.51 -> 0.06 ms. Tone.js synthesis (about 10 % of the frame) stops while you are away from the car |

Whole-route frame times were too noisy to compare this round. Other planners' test runs and browsers shared the
machine: two back-to-back runs of the same code differed by 30-200 % on the Turfton legs. Per-system profiler numbers
are the reliable comparison above.

New content, cost per frame (4x CPU, medium, avg over the legs): birding 0.26 ms; critters + hunting 0.63-0.66 ms;
street events (`world-events`) 0.07 ms; lock-ups, craft and highways sit in `world-life`, 0.9-1.6 ms with everything
else there. Fishing and the sky-traffic planes were still being built and had no section yet. None of it is a big cost.
Render is still 60-65 % of the CPU frame.

Not done, with reasons:

- **Pre-rendering radio songs to an AudioBuffer does not save work.** A song is composed as `form.length * 4` bars,
  about 32 bars, about 60 s, and a song segment airs for 55-85 s, so each song is heard only 1.0-1.4 times. An offline
  render (Tone.Offline) runs the same per-note JavaScript on the main thread, only all at once (a hitch), and holds
  about 20-40 MB of float audio per song. The cost is Tone's per-note object creation (`triggerAttack` ->
  `ToneOscillatorNode`, `OneShotSource`, `deepMerge` options): about 10 % of the frame while in a car, plus a song-start
  spike (building the song's graph, a new `Reverb` per song: 7 % of an 8 s profile, about 150 ms on a phone). Real
  fixes: keep one effects chain (reverb, delay, compressor) for the whole session instead of one per song, and play
  notes with native `OscillatorNode`/`GainNode` voices instead of Tone synth wrappers. That is a music-engine rewrite
  for the radio's owner.
- **Freezing static matrices and merging the scene walk further.** The render walk is now about 2 400 nodes: 22
  vehicles about 750 nodes, 22 pedestrians about 330, other registered props about 600, terrain chunks 174. Most of it
  moves every frame. Freezing all the named static groups saved 0.1 ms in round 1. The static props
  (mailboxes, vending machines, picnic tables) are knocked over or rocked by destructibles.ts and vending.ts, so a
  blanket `matrixAutoUpdate = false` would freeze them in place. A real cut needs vehicle bodies merged per material
  (the glaze rig keeps parts separate on purpose) or instanced gnomes.
- **Sharing gnome geometry.** `@lawn/gnome` bakes each gnome's parts with its own colours. Sharing needs per-instance
  colours (vertex colours or an instanced material) in the shared package, which every game uses.

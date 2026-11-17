Epic: 1 Descent
Depends on: none

## Environment
Working directory: `C:\Users\cstab\Documents\gaming` (Windows, Git Bash). If `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Do not run `git commit`.
Other workers are editing other files in `games/aether-board` at the same time (world.ts, physics.ts, descent/*,
app.ts). Touch only the files listed under Change. Three.js 0.187 (`import * as THREE from 'three'`).

## Goal
1. The world view draws Descent hazards (clusters of glowing aether spikes on the runs).
2. `WorldView.dispose()` and `Crowd.dispose()` really remove what they added to the scene, so the app can build the
   next hill in the same scene (it calls `old.dispose()` then `createWorldView(scene, newWorld)` and
   `createCrowd(scene, newWorld)`) without doubled lights, leftover meshes or leaking GPU memory.

## Read first
- `games/aether-board/src/view/world.ts`: `createWorldView` (everything it passes to `scene.add`: lights, `sky`,
  `root`; and `scene.background` / `scene.fog`), the `dispose()` stub at the end, and the helpers `toonMat`,
  `addOutline` (from `./toon`), `PALETTE`.
- `games/aether-board/src/view/crowd.ts`: `createCrowd` (every `scene.add(...)`), the `dispose()` stub at the end.
- `games/aether-board/src/world.ts`: `export interface Hazard { x; y; z; r; h; island }` (`y` is the ground height
  under its centre, `r` its radius 1.6..2.6 m, `h` the spike height 1.6..2.4 m) and `World.hazards` (empty in free
  ride; another worker is filling it in for Descent right now, so test with hazards you push yourself).
- `games/aether-board/src/view/toon.ts`: `toonMat(color, opts?)`, `addOutline(mesh, width)`.

## Change
- `games/aether-board/src/view/world.ts`:
  - A private `function buildHazard(hz: Hazard): THREE.Group`: 5 to 7 spikes (`THREE.ConeGeometry(radius, height, 5)`,
    base radius 0.35..0.6 m, height hz.h × 0.6..1.1, leaning outward up to ~0.35 rad) spread within `hz.r * 0.7` of
    the centre, standing on the ground at `hz.y` (use the module's `yAt(isl, x, z)` helper if you want each spike
    seated: `w.islands[hz.island]`), material `toonMat(0xff2d4b, { emissive: 0xff2d4b, emissiveIntensity: 0.9 })`
    with `addOutline(mesh, 0.06)`. Plus a flat warning ring on the ground (`THREE.RingGeometry(hz.r, hz.r + 0.35, 32)`
    rotated flat, `MeshBasicMaterial` color `PALETTE.yellow`, transparent, opacity 0.7, `depthWrite: false`,
    `polygonOffset: true, polygonOffsetFactor: -2`) slightly above `hz.y`. Use a seeded random (the file's `rng`
    helper, seeded from the hazard index) so it looks the same every load. Add a gentle pulse of the ring opacity in
    `update` (one shared ring material is fine).
  - In `createWorldView`: `for (const hz of w.hazards) root.add(buildHazard(hz));` (with its index for the seed).
  - Track every object passed to `scene.add` in a local array. `dispose()`: `scene.remove` each, then traverse them
    and call `.dispose()` on every `geometry` and every material (arrays too) found on meshes, points and lines.
    Do not dispose module-level shared objects twice in a way that throws (three's dispose is safe to repeat).
    Set `scene.fog = null` and `scene.background = null` (the next createWorldView sets them again).
- `games/aether-board/src/view/crowd.ts`: track every object passed to `scene.add`; `dispose()` removes them and
  disposes their geometries and materials the same way.

## Contract
`WorldView { update(dt, t, camPos, flow): void; dispose(): void }` and
`Crowd { update(p, dt, t, events): void; dispose(): void }` exactly as they are now in the files.
`createWorldView(scene, w)` and `createCrowd(scene, w)` signatures unchanged. Free ride (no hazards) must look the
same as before.

## Done when
- `cd games/aether-board && npx tsc --noEmit -p .` passes (errors in files you did not touch are another worker's
  mid-edit; rerun once, then report them rather than fixing them).
- `cd games/aether-board && npx vitest run` passes (existing tests).
- Code check: after `createWorldView(scene, w)` then `dispose()`, `scene.children.length` is back to what it was
  before (describe in your report how you checked; a unit test is not required since these modules use WebGL-free
  three objects only, a vitest test with `new THREE.Scene()` is welcome if `createWorldView` runs under node).

## Out of scope
world.ts, physics.ts, view/rider.ts, view/fx.ts, camera.ts, descent/*, app.ts, hud.ts.

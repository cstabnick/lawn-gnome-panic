Epic: 2 Snowboard Descenders
Depends on: none

## Environment
Working directory: `C:\Users\cstab\Documents\gaming` (Windows, Git Bash). If `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Do not run `git commit`.
Other workers are editing other files in `games/aether-board` at the same time (world.ts generation, physics.ts,
tricks.ts, descent/*). Touch only the file listed under Change. Three.js 0.187 (`import * as THREE from 'three'`).

## Goal
Descent hills look like a snowy pine mountain (Descenders on snow), still cel-shaded: white / icy-blue snow runs,
dark-green toon pines (there can be several hundred), grey boulders, the existing red aether spikes, cliffs that read
as rock faces, a pale-blue sky and fog. Free ride (`world.theme === 'aether'`) looks exactly as before.

## Read first
- `games/aether-board/src/view/world.ts`: `createWorldView` (sky, fog, background, lights, the per-island
  `buildTop` / `buildUnderside`, `buildHazard(hz, index)`, the tracked objects for `dispose()`), `buildTop` (vertex
  colours from `ISLAND_TOPS`, grid of 2.5 m rows), `yAt`, `rng`, `toonMat`, `addOutline`.
- `games/aether-board/src/world.ts`: `World.theme: 'aether' | 'snow'`, `Hazard { kind: 'spike' | 'tree' | 'rock'; x; y;
  z; r; h; island }` (tree: r = trunk 0.7..1, h = 9..16 m tall; rock: r 1.4..3, h 1.2..2.6), `Island.drops`
  (`Drop { al; h; half; lead }`) and `dropHeight(dr, al, sd)` (exported).
- `games/aether-board/src/view/toon.ts`: `toonMat`, `addOutline`, `GRADIENT`.

## Change
- `games/aether-board/src/view/world.ts`:
  - Snow theme (only when `w.theme === 'snow'`): `scene.background` and fog colour `0xcfe6ff` (fog 140..1100), the
    sky dome tinted toward pale blue (if the sky shader has no colour uniform, hide the sky dome and rely on the
    background colour), the hemisphere light sky `0xffffff` / ground `0x8fb4e8`. Island tops: snow colours instead of
    `ISLAND_TOPS`: base `0xf4f8ff` with a slight blue in shade, and vertices where the ground is steep (cliff faces:
    compare `yAt` of neighbouring grid points; a height change over 2 m across one 2.5 m row) coloured grey rock
    `0x6d6a7a`. Undersides: grey-blue rock `0x5b6478` instead of crystal colours where a colour is chosen.
  - Trees: ONE `THREE.InstancedMesh` per part for all `kind === 'tree'` hazards (count = number of trees), not one mesh
    per tree: a trunk (`CylinderGeometry(0.25, 0.35, 1, 6)`, brown `0x5a3b2a`) and three stacked cone layers
    (`ConeGeometry(1, 1, 7)`, greens `0x1f5a3a`, `0x24683f`, `0x2b7748`, with a snow-tipped top layer `0xeaf4ff`
    optional). Per tree: height `hz.h`, canopy radius about `hz.h * 0.28` at the bottom layer shrinking upward, a
    small random yaw / scale jitter from `rng(index)`. Set each instance matrix with `THREE.Matrix4.compose`. Toon
    materials (`toonMat(color)`). Outlines on instanced meshes are optional (skip if `addOutline` does not support
    them).
  - Rocks: one `InstancedMesh` of `DodecahedronGeometry(1, 0)` for all rocks, grey `0x8a8798`, scaled to
    `(hz.r, hz.h, hz.r * 0.9)` with jitter, sunk 0.3 m into the ground.
  - Spikes: keep `buildHazard` for `kind === 'spike'` only (with its warning ring). Trees and rocks get no ring.
  - Everything new is added under the tracked objects so `dispose()` frees it (instanced meshes: dispose geometry and
    material as for other meshes; also call `.dispose()` on the InstancedMesh itself).
  - Free ride (`theme === 'aether'`): every colour and object exactly as now.

## Contract
`createWorldView(scene, w)` / `WorldView { update; dispose }` unchanged. Do not read anything from world.ts
generation internals; draw only from `w.hazards`, `w.islands[*].drops` (through `yAt`, which already includes cliffs)
and `w.theme`.

## Done when
- `cd games/aether-board && npx tsc --noEmit -p .` passes (errors in files you did not touch are another worker's
  mid-edit; rerun once, then report them rather than fixing them).
- `cd games/aether-board && npx vitest run` passes.
- A temporary vitest check (delete it afterwards) that builds `createWorldView(new THREE.Scene(), w)` for a world
  whose hazards you fill yourself with 300 trees and 20 rocks (push them into `generateWorld(5).hazards`, set
  `w.theme = 'snow'`) adds at most ~10 more scene objects than with no hazards (instancing works), and `dispose()`
  returns `scene.children.length` to the start. Report the numbers.

## Out of scope
world.ts, physics.ts, tricks.ts, view/rider.ts, view/fx.ts, view/crowd.ts, descent/*, app.ts, hud.ts.

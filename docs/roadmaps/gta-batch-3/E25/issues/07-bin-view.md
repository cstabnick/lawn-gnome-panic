Epic: E25-2 (jobs III, parallel build)
Depends on: none (the bin and lorry prefabs are made in parallel: guard with `getPrefab(id)` and fall back to nothing)

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. three.js view code; no dev server.

## Goal
`createBinView(scene)` shows a round's wheelie bins on the kerbs, animates the Bin Lorry's lift arm and carries the
bin on its claw during a lift, sets bins back down (neat or crooked), and leaves litter where a bin spilled.

## Read first
- `games/gnome-theft-auto/src/workplaces/garbage/types.ts`: `BinStop`, `BinRound`, `LiftState` (phase, tilt 0..1,
  swing -1..1), `ARM` (`pivot: 'arm'`, `tip: [0, -0.5, 0]` in the arm pivot's local space, `max: 2.4`: at
  rotation.z = 0 the arm hangs down, at `ARM.max` it is over the hopper).
- `games/gnome-theft-auto/src/workplaces/garbage/bins.ts`: the stub (`BinView`, `createBinView`).
- `games/gnome-theft-auto/src/types.ts` `Vehicle` (`object` is the unscaled root; the scaled prefab is a child; look up
  a pivot with `lorry.object.getObjectByName(ARM.pivot)` EVERY call: damage rebuilds the meshes).
- `games/gnome-theft-auto/src/workplaces/mechanic/lot.ts`: placing prefabs (`buildPrefab(id, { tint })` from
  '@lawn/prefabs', `heightAt` from '../../terrain', `registerCull(obj, 'prop')` from '../../cull').
- `packages/depth/src/layers.ts`: `flatLayer(material, LAYER.marking)` for litter (see `src/biomes.ts` ~l.391 usage).

## Change
- `games/gnome-theft-auto/src/workplaces/garbage/bins.ts`: implement `BinView`:
  - `show(round)`: remove previous bins; for each stop `buildPrefab('gta-wheelie-bin', { tint: stop.tint })` at
    (x, heightAt, z), rotation.y = stop.yaw; heavy bins get a `bin-bag` prefab poking from under the lid (lid pivot
    `lid` rotated open 0.3 rad). Keep a Map stop.id -> object.
  - `pose(stop, s, lorry)`: when all are given: get the arm pivot; `arm.rotation.z = ARM.max * s.tilt`; compute the
    claw's world position `arm.localToWorld(new Vector3(...ARM.tip))` (update matrices first:
    `lorry.object.updateMatrixWorld(true)`). Phase 'grab': the bin stays on the kerb but leans toward the lorry by
    `0.15 * swing`, and the arm itself sways (`arm.rotation.x = 0.25 * s.swing`). Phases 'lift'/'lower'/'done' after
    grabbing: the bin's position follows the claw (bin origin = claw minus 0.45 m down in the bin's own up), the bin
    tilts with the arm (rotation about the lorry's forward axis = `ARM.max * s.tilt`, so at the top it is upside down
    over the hopper), plus the lower-phase sway `0.3 * s.swing` about the same axis; the lid swings open as tilt
    passes 0.6. When `pose(null, null, lorry)` (or any null): arm back to rotation 0 (ease over ~0.3 s in update).
  - `setDown(stop, neat)`: put the bin on the kerb at its stop: offset along the kerb by `(1 - neat) * 0.5` m and
    turned by `(1 - neat) * 0.6` rad (random sign seeded by stop.id), lid shut.
  - `spill(stop)`: `bin-litter-scatter` flat at the stop (lift 0.015 m, its meshes' materials through
    `flatLayer(..., LAYER.marking)`: clone the material per mesh first, prefab materials are shared), plus 1-2
    `bin-bag` prefabs tipped over within 1.5 m; keep them until `clear()`.
  - `update(dt)`: ease the arm back when idle; a little fly (a tiny dark sphere, built in code, an effect) circling over
    each spill.
  - `clear()`: remove all bins, litter and flies; dispose nothing from `buildPrefab` (shared geometry).
  - Guard every prefab with `getPrefab(id)`: missing prefab = skip that object, never throw.
- `games/gnome-theft-auto/src/workplaces/garbage/bins.test.ts` (new, light): with a fake `THREE.Scene`, `show` a 3-stop
  round and `clear()` without throwing (prefabs exist or are skipped); `pose` with a fake lorry whose `object` has a
  child Object3D named 'arm' sets `arm.rotation.z` to `ARM.max * tilt`.

## Contract
`createBinView(scene): BinView` exactly as in the stub.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/workplaces/garbage/bins.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.

## Out of scope
`garbage/types.ts`, the prefab catalog, every other file.

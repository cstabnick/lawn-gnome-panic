Epic: E23-1 Framework (parallel)
Depends on: none
Model: haiku

## Environment
Read `docs/roadmaps/gta-batch-3/E23/env.md` first (worktree, toolchain, line endings, contracts in place, rules).

## Goal
`quests/questPins.ts` stops being a stub: a working pin registry plus the two vehicle-recovery helpers the quest
engine's auto retry uses.

## Read first
- `quests/questPins.ts`: the stub; keep every exported name and signature exactly.
- `vehicles.ts`: `repairVehicle(v)` (l.~194: hp 1, clears waterlog, restores parts; it does NOT clear `exploded` or
  `sunk`), `repaintVehicle(v, tint)` (rebuilds the body; returns early while `v.exploded`), `explodeVehicle(v)` (chars
  every material, `exploded = true`), `syncVehicleMesh(v, dt)`.
- `types.ts` `Vehicle` fields: `questOwned?`, `exploded`, `sunk?`, `sunkT?`, `hp`, `speed`, `vy`, `driver`, `x/y/z/yaw`,
  `spec.radius`, `tint`, `look?`. `Npc.quest?` (a string id; pedestrian trimming in npcs.ts skips NPCs with `quest`).
- `quests/objectivesDrive.ts` `clearVehicleSpawn(x, z, radius, world): [number, number]` (pushes a spot out of world
  boxes).
- `terrain.ts` `heightAt(x, z)`.

## Change
- `quests/questPins.ts`, implement:
  - `createQuestPins()`: keep `Map<Vehicle, boolean | undefined>` of each pinned vehicle's previous `questOwned`, and
    `Map<Npc, string | undefined>` of each NPC's previous `quest`; props in an array. `pinVehicle` sets
    `v.questOwned = true`. `pinNpc` sets `n.quest = n.quest ?? 'pinned'`. `setRide(v)`: the previous ride (if pinned
    only because it was the ride, i.e. not separately pinned with `pinVehicle`) is released; `v` is pinned and becomes
    the ride. `releaseAll()`: restore every saved `questOwned` / `quest`, clear all lists and the ride. Idempotent pins.
  - `restoreVehicle(v)`: `repairVehicle(v)`; if it was exploded: set `exploded = false` then rebuild the body with
    `repaintVehicle(v, v.tint)` (that clones fresh materials, removing the char); `sunk = false`, `sunkT = 0`,
    `speed = 0`, `vy = 0` (if present).
  - `recoverVehicleNear(v, x, z, world)`: `restoreVehicle(v)`; spot = `clearVehicleSpawn(x + 3.5, z, v.spec.radius,
    world)`; `v.x/z` = spot, `v.y = heightAt(spot)`, `v.driver = 'none'` unless it is `'player'`, `syncVehicleMesh(v,
    0)`; return the spot.
- `quests/questPins.test.ts` (new): pin/release restores `questOwned` (both a vehicle that was already questOwned and
  one that was not), `setRide` swapping releases the old ride, NPC `quest` restored; `restoreVehicle` on an exploded
  vehicle clears `exploded` and `sunk` and sets hp 1. Build a real vehicle with `createVehicle(new THREE.Scene(),
  'ride-on', 0, 0, 0)` from `vehicles.ts` (see `quests/ensureRide.test.ts` or `vehicles.glaze.test.ts` for how tests
  make vehicles) and explode it with `explodeVehicle`.

## Contract
Exactly the exports already in the stub (`QuestPins`, `createQuestPins`, `restoreVehicle`, `recoverVehicleNear`).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for `questPins.ts` and its test.
- `cd games/gnome-theft-auto && npx vitest run src/quests/questPins.test.ts` passes.

## Out of scope
`quests/quests.ts` (issue 1-3), objective runners, `vehicles.ts`.

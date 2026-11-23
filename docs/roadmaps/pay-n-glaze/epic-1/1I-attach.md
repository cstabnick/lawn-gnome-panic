Epic: 1 (the @lawn/glaze package, its prefabs, the shop widgets)
Depends on: none (it calls the other modules through their stubbed signatures; the final behaviour appears when their workers finish)

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` first (working directory, toolchain, rules, how to report). You own only the files below.

## Goal
`attachLoadout` is the one entry point a game needs: it dresses a built prefab vehicle in a `Loadout` using every other module, keeps it dressed across damage rebuilds, and exposes ride height, camber, lights and grips.

## Read first
- `packages/glaze/src/types.ts`: `GlazeRig`, `Loadout`, `VehicleMounts`.
- `packages/glaze/src/attach.ts`: the stub (keep `RIDE_TRAVEL`, `buildGlazeBody`, `attachLoadout` signatures; the stub shows the shape).
- The module signatures you call (stubs; other workers fill them): `paint.ts` `paintBody(root, loadout)`; `wheels.ts` `applyWheels(root, mounts, loadout) -> { lift, wheels, spinners }`; `steer.ts` `applySteer(root, mounts, loadout) -> { grips }`; `lamps.ts` `buildLamps(mounts, loadout) -> { housings, beams }`; `fittings.ts` `buildFittings(mounts, loadout) -> { group, ground, update }`; `decals.ts` `buildDecals(mounts, loadout) -> Group | null`; `mounts.ts` `getMounts(prefabId, body)`.
- `packages/prefabs/src/build.ts` `setPrefabDamage` (throws away all of the root's children and rebuilds them).

## Change
- `packages/glaze/src/attach.ts`: implement `attachLoadout(root, prefabId, loadout)`. Keep `buildGlazeBody` as stubbed. State per rig: `current` (normalised loadout), a stable `lights` group (hidden by default; `setLightsOn(on)` sets `lights.visible = on` and remembers it), `shell` (the group the rig wraps the body in; created per apply), the last results (`wheelResult`, `fittings`, `grips`, `seatLift`).
  - `apply()` (idempotent; works on a root the rig already dressed AND on a root whose children were just rebuilt by `setPrefabDamage`):
    1. **Unwrap** any earlier dressing: if `root` has a child named `'glaze-shell'`, move all its children back to `root` (keeping order irrelevant) and remove the shell; remove from `root` the earlier `ground` group (`name 'glaze-ground'`); remove `lights` from its parent. (After a damage rebuild none of these exist: that is fine.)
    2. `mounts = getMounts(prefabId, root)`. Compute mounts BEFORE adding anything (so the bounding box is the bare body). Cache nothing across calls (the body may have been rebuilt).
    3. `paintBody(root, current)`; `wheelResult = applyWheels(root, mounts, current)`; `steer = applySteer(root, mounts, current)`.
    4. **Shell:** `shell = new THREE.Group()` named `'glaze-shell'`; move every child of `root` EXCEPT the wheel pivot groups (names `wheel-0`..`wheel-3`) into it; `root.add(shell)`. `rideOffset = (current.rideHeight < 0 ? current.rideHeight * RIDE_TRAVEL.down : current.rideHeight * RIDE_TRAVEL.up) + wheelResult.lift`; `shell.position.y = rideOffset`. `seatLift = rideOffset * root.scale.y` (prefab units x the root's scale = the parent's space).
    5. `lamps = buildLamps(...)`: `housings` into `shell`; clear `lights` (remove all its children), add `lamps.beams` children if any, then `shell.add(lights)`.
    6. `fittings = buildFittings(...)`: `fittings.group` into `shell`; `fittings.ground` named `'glaze-ground'` added to `root` (not the shell). `decals = buildDecals(...)`: into `shell` when not null.
    7. `grips = steer.grips`.
  - `set(next)`: `current = normalizeLoadout(next)` then `apply()`. `get loadout()` returns `current`. `camberOf(i)`: `(i >= 2 ? current.camberFront : current.camberRear) * Math.PI / 180` (0 for any other index). `get seatLift()`, `get grips()` return the latest values (`seatLift` 0 and `grips` null before the first apply; **call `apply()` once at the end of `attachLoadout` before returning**). `update(dt)`: `fittings.update(dt)`; for each spinner `object.rotation.x += rate * dt`. `dispose()`: unwrap as in step 1, remove `lights` and the ground group; nothing else.
  - Wheel pivots stay children of `root` (outside the shell) so ride height moves the body but not the wheels.
  - `buildGlazeBody` must keep calling `buildPrefab(resolveBodyPrefab(prefabId), { scale, tint: 0xffffff, separateTint: true, damage })` (as in the stub).
  - Write a short doc comment at the top of the file listing the lifecycle: build -> attach -> (damage: `setPrefabDamage` then `rig.apply()`) -> (change: `rig.set`).
- `packages/glaze/src/attach.test.ts` (new): use `buildGlazeBody('ride-on-mower', { scale: 1.5 })`. Assertions that must pass with the other modules still stubs: after `attachLoadout(body, 'ride-on-mower', defaultLoadout(0xd8342c))` the root has a `'glaze-shell'` child, the four `wheel-N` groups are still direct children of the root and NOT inside the shell, `rig.seatLift === 0`; `rig.set({ ...stock, rideHeight: -1 })` -> `shell.position.y === -RIDE_TRAVEL.down` and `rig.seatLift === -RIDE_TRAVEL.down * 1.5`; `rideHeight: 1` -> `+RIDE_TRAVEL.up`; `camberOf(2)` for `camberFront: -10` is `-10 * PI / 180`, `camberOf(0)` uses `camberRear`, `camberOf(9) === 0`; `rig.lights` is the same object before and after `set` and after `setPrefabDamage(body, 1)` + `rig.apply()` (use a prefab with damage stages: `ride-on-mower` has them); calling `apply()` twice leaves exactly one `'glaze-shell'` and one `'glaze-ground'` or none (no duplicates); after `setPrefabDamage(body, 2)` + `apply()` the wheel groups present are children of the root again and the shell exists once; `dispose()` leaves no `'glaze-shell'` and every original child back under the root; `setLightsOn(true)` makes `lights.visible` true and it stays true after `apply()`. The count of meshes with `userData.tint` equals before and after (nothing lost in the unwrap).

## Contract
`RIDE_TRAVEL = { down: 0.14, up: 0.2 }` (keep); `buildGlazeBody(prefabId: string, opts?: GlazeBodyOptions): THREE.Group`; `attachLoadout(root: THREE.Group, prefabId: string, loadout: Loadout): GlazeRig` with `GlazeRig` exactly as in `types.ts`. The shell is named `'glaze-shell'`, the ground group `'glaze-ground'`.

## Done when
- `npx tsc --noEmit -p packages/glaze` has no error in `attach.ts` / `attach.test.ts`.
- `npx vitest run packages/glaze/src/attach.test.ts` passes.

## Out of scope
Every other file.

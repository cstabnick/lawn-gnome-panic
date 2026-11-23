Epic: 2 (Gnome Theft Auto adopts Pay 'n' Glaze)
Depends on: none (epic 1 has landed)

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and `docs/roadmaps/pay-n-glaze/epic-2/_common2.md` first. You own only `games/gnome-theft-auto/src/vehicles.ts` and a new `games/gnome-theft-auto/src/vehicles.glaze.test.ts`.

## Goal
Every ground vehicle is built with `@lawn/glaze`: dressed in a `Loadout` (default = looks exactly as before), with wheels that take camber, headlights from the rig, a seat that follows the ride height, and a body that stays dressed after damage, repainting and removal.

## Read first
- `games/gnome-theft-auto/src/vehicles.ts` (all of it): `createVehicle`, `repaintVehicle`, `applyDamageLevel`, `capturePivots`, `pivotsById`, `buildHeadlights`, `setVehicleHeadlights`, `syncVehicleMesh` (the wheel loop near `p.wheels.forEach`), `seatWorld`, `removeVehicle`, and the stub `setVehicleLook` at the end.
- `packages/glaze/src/index.ts`, `attach.ts` (lifecycle comment at the top), `wheels.ts` (`setWheelPose`), `types.ts` (`GlazeRig`).
- `games/gnome-theft-auto/src/glazeStore.ts`: `GLAZE_KINDS`. `games/gnome-theft-auto/src/bump.test.ts` lines 1-20: how tests make a `Vehicle` and mock `./audio`.
- `packages/prefabs/src/palette.ts` (`colorOf`) and `getPrefab(id).tint`.

## Change
- `vehicles.ts`:
  1. A helper `const dressed = (spec: VehicleSpec): boolean => GLAZE_KINDS.includes(spec.kind)` (import `GLAZE_KINDS` from `./glazeStore`; flyers and boats are not in it) and `stockPaint(spec, tint?)`: for the four kinds that were tinted before (`push-bike`, `ride-on`, `zero-turn`, `lowrider`) it is `tint ?? MOWER_TINTS[0]`; for the other dressed kinds it is the prefab's own default tint: `const t = getPrefab(spec.prefab)?.tint; typeof t === 'number' ? t : t === undefined ? 0xffffff : colorOf(t)` (so their look does not change).
  2. `createVehicle`: for a dressed kind: `look = defaultLoadout(stockPaint(spec, tint))`; `body = buildGlazeBody(spec.prefab, { scale: spec.scale })`; after the shadow traverse, `rig = attachLoadout(body, spec.prefab, look)`; set `v.look = look`, `v.rig = rig`, `v.tint = look.paint`; use `rig.lights` as the vehicle's `headlights` (`object.add(rig.lights)` is NOT needed: the rig keeps it inside the body shell). Non-dressed kinds keep the existing code path unchanged (including `buildHeadlights`). Call `registerGlazeMounts()` (import from `./glazeMounts`) once at module load of vehicles.ts, before any vehicle is built (a module-level call).
  3. `syncVehicleMesh`: for `v.rig` vehicles, replace the wheel loop: for each wheel index `i`, `w` present: `setWheelPose(w, v.wheelSpin, i >= 2 ? steer : 0, v.rig.camberOf(i))` (import `setWheelPose` from `@lawn/glaze`); the handle/steer/blade/reel lines stay as they are. Non-rig vehicles keep the old rotation code. Also call `v.rig?.update(dt)` once per call (before the `p` lookup).
  4. `applyDamageLevel`: after `setPrefabDamage(body, level)` and before `capturePivots`, call `v.rig?.apply()` (the rebuilt root lost the dressing). Same in `repaintVehicle`'s non-rig branch? No: see 5.
  5. `repaintVehicle(v, tint)`: if `v.rig && v.look` -> `setVehicleLook(v, { ...v.look, paint: tint })` and return; otherwise the existing rebuild path (flyers and boats; keep it).
  6. `setVehicleLook(v, look)` (replace the stub): `look = normalizeLoadout(look, v.tint)`; if `v.exploded` return; `v.look = look; v.tint = look.paint;` if `v.rig` -> `v.rig.set(look)`; then re-capture pivots (`pivotsById.set(v.id, capturePivots(body, old?.rotorSpin ?? 0, old?.propSpin ?? 0))` with `body = v.object.children[0]`: the rig keeps the same wheel group objects but the shell moved other pivots, so re-capture is cheap insurance). A vehicle without `v.rig` (flyer/boat): do nothing else.
  7. `seatWorld(v, out, seat)`: `localToWorld(out.set(x, y + (v.rig?.seatLift ?? 0), z))`.
  8. `removeVehicle`: call `v.rig?.dispose()` before removing the object (read the function first).
  9. `explodeVehicle` is unchanged: its traverse already chars every mesh (including shared finish materials: it clones before editing, keep it that way). The wreck keeps its look code but nothing else matters.
- `vehicles.glaze.test.ts` (new; mock `./audio` like bump.test.ts, then `await import('./vehicles')`): `createVehicle(scene, 'ride-on', 0, 0, 0, 0x2f64c9)` on a `new THREE.Scene()` returns a vehicle with `rig` and `look.paint === 0x2f64c9`, `tint === 0x2f64c9`, `headlights === rig.lights`; the same for `zero-turn`, `combine` and `hoa-van`; `plane` and `clog-cruiser` (a boat) have no `rig`. `setVehicleLook(v, { ...v.look!, rideHeight: -1 })` changes `seatWorld(v, out).y` by `rig.seatLift` (compare before and after: it drops). `repaintVehicle(v, 0xf2c230)` updates `look.paint`. `damageVehicle(v, 0.6)` (cross a damage level) leaves the rig applied (the object still has a `'glaze-shell'` descendant: `v.object.getObjectByName('glaze-shell')` is defined). `syncVehicleMesh(v, 0.016)` runs with `steerVis = 1`; a rear wheel's `rotation.order` is `'ZYX'`. `removeVehicle(scene, v)` does not throw.

## Contract
Unchanged exports of `vehicles.ts` (see its current `export` lines) plus `setVehicleLook(v: Vehicle, look: Loadout): void` (already stubbed; keep the signature). `v.look` and `v.rig` set for every dressed vehicle. `v.tint === v.look.paint` always.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes.
- `npx vitest run games/gnome-theft-auto/src/vehicles.glaze.test.ts games/gnome-theft-auto/src/bump.test.ts` passes.

## Out of scope
Every other file (`types.ts`, `app.ts`, `traffic.ts` and the rest belong to other issues).

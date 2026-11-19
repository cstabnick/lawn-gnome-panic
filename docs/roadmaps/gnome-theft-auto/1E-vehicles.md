Epic: 1 (parallel modules)
Depends on: none

## Environment

- Repo root: `/home/user/lawn-gnome-panic` (Linux). Run commands from there. Dependencies are installed: do not run `npm install`. Do not commit.
- Game: `games/gnome-theft-auto` (three.js 0.187 + TypeScript + Vite). It already builds: every module exists as a STUB with its final exported signature. Your job is to replace ONE stub (or the files named below) with the real thing.
- About ten other workers are editing the other files of this game at the same time. Edit only the files your issue names. Keep every exported name and signature of your file exactly as in its stub, so other files keep compiling.
- The contracts are in `games/gnome-theft-auto/src/types.ts` (read it first, do not edit it) and all tuning numbers are in `games/gnome-theft-auto/src/config.ts` (read, do not edit). `src/collide.ts` (box collision, `angleDiff`) and `src/gnomes.ts` (town looks, names, `makeGnome`, `poseHandsUp`, `clearHandsUp`, `gnomeState`) are shared helpers: use them, do not edit them. `src/main.ts` is the wiring that calls your module; read it to see how you are called, do not edit it.
- Conventions: y up, 1 unit = one gnome's height (a gnome model is about 1.1 tall). Yaw 0 faces +z; forward = `(Math.sin(yaw), 0, Math.cos(yaw))`; the gnome's right = `(-Math.cos(yaw), 0, Math.sin(yaw))`. Turning right DECREASES yaw. Prefab models from `@lawn/prefabs` stand on y = 0 and face +z.
- `buildPrefab(id, { scale, tint })` (from `@lawn/prefabs`) returns a `THREE.Group`; it throws `Unknown prefab` for an id that does not exist yet. The new ids `squirt-pistol`, `super-soaker`, `zero-turn-mower`, `whirligig-mower`, `sandbag-wall`, `watch-tower` are being added by another worker right now; you may reference them, they will exist when the epic is done.
- Lore (Gnome Theft Auto is a parody set in the town of Turfton): no gore, nothing bleeds or dies; water guns only; soaked gnomes put their hands up and run. Gnomes are fired clay. No humans ever appear.
- Mobile matters: anything a player does must work by touch too (only the input/HUD issues build UI).
- Check: `npx tsc --noEmit -p games/gnome-theft-auto` must show no errors in YOUR files (errors in another worker's file mean they are mid-edit: ignore those). Do NOT run `vite build`, `npm run build` or a dev server: other workers share the folder and the port.

## Goal
`games/gnome-theft-auto/src/vehicles.ts` builds the five mower models (Push-Mower Bike, Ride-On Mower, Zero-Turn Racer, Combine Harvester, the flying Whirligig) and drives them: ground handling, flying, collisions with buildings and with each other, and animated wheels, blades and rotors.

## Read first
- `games/gnome-theft-auto/src/types.ts`: `Vehicle`, `VehicleSpec`, `VehicleKind`, `DriveControls`, `World`, `Box`.
- `games/gnome-theft-auto/src/config.ts`: `VEHICLES`, `FLY`, `GROUND_DRAG`, `MOWER_TINTS`.
- `games/gnome-theft-auto/src/vehicles.ts`: the stub. Keep EVERY export and signature: `createVehicle`, `stepVehicle`, `syncVehicleMesh`, `collideVehicles`, `removeVehicle`, `seatWorld`, `exitPoint`.
- `games/gnome-theft-auto/src/collide.ts`: `pushOutOfBoxes`, `clampToWorld`.
- `packages/prefabs/src/catalog/lawn-prix.ts` (ride-on-mower, push-mower-bike: pivot names) and `packages/prefabs/src/catalog/mowers.ts` (combine-harvester pivots).

## Change
`games/gnome-theft-auto/src/vehicles.ts` only.

- `createVehicle(scene, kind, x, z, yaw, tint?)`: root `THREE.Group` (unscaled) with the body `buildPrefab(spec.prefab, { scale: spec.scale, tint })` as a child — pass `tint` only for `push-bike`, `ride-on`, `zero-turn` (default `MOWER_TINTS[0]`). `castShadow` on meshes. Find and keep the named pivots with `body.getObjectByName(name)`: `wheel-0`..`wheel-3`, `blade`, `handle`, `steer`, `reel`, `rotor`, `tail-rotor` (any may be missing). Store them in a module-level `Map<number, Pivots>` keyed by `v.id` (the `Vehicle` type has no field for them). Flyers start at y = 0.
- `stepVehicle(v, c, dt, world)`:
  - Ground (`!spec.flies`): `c.throttle > 0`: `speed += spec.accel * c.throttle * dt` up to `maxSpeed`. `c.throttle < 0`: if `speed > 0.5` brake at `2 * accel`, else accelerate backwards to `-0.4 * maxSpeed`. No throttle: `speed *= Math.pow(GROUND_DRAG, dt)`.
    Steering: `yaw -= c.steer * spec.turnRate * dt * grip * Math.sign(speed || 1)`, where `grip = Math.min(1, Math.abs(speed) / 4)`; the `zero-turn` uses `grip = 1` always (it spins on the spot).
    Move along forward `(sin yaw, cos yaw)`; y stays 0.
  - Flyer (`spec.flies`): `driver === 'player'`: `vy` eases toward `c.lift * FLY.climb` (rate 3/s); otherwise (nobody flying it) `vy -= FLY.gravity * dt`. `y += vy * dt`, clamp to [0, FLY.ceiling] (vy = 0 at the limits). Horizontal speed like the ground rule but with drag `FLY.drag` and `grip = 1` always, and it can only accelerate when `y > 0.3` (on the pad it can only lift off).
  - Collide: `pushOutOfBoxes(x, z, spec.radius, world.boxes, y)`; on a hit, `speed *= 0.35`, and if the player drives and the impact speed was above 6, call `play('bump')` from `./audio`. Then `clampToWorld(x, z, world.half, spec.radius)` (on hit, `speed *= 0.5`).
  - `v.steerVis` eases toward `c.steer` (rate 8/s).
- `syncVehicleMesh(v, dt)`: `object.position.set(x, y, z)`; `object.rotation.set(pitch, yaw, roll, 'YXZ')` where for flyers `roll = v.steerVis * 0.35` and `pitch = clamp(speed / maxSpeed, -1, 1) * 0.15`, ground vehicles 0 and 0. `wheelSpin += speed * dt / 0.3`; set `rotation.x = wheelSpin` on every `wheel-n`. Front wheels `wheel-2`/`wheel-3` and the `handle` and `steer` pivots: `rotation.y = -v.steerVis * 0.45` (the steer pivot of the ride-on tilts its wheel: rotation.y is fine). `blade` and `reel`: spin with speed. `rotor`: `rotation.y += dt * (spin)` where spin is 30 rad/s while `driver !== 'none'` or `y > 0.05`, else slowing to 0 over 2 s; `tail-rotor`: `rotation.x += dt * spin * 1.5`. Only flyers and ground vehicles with these pivots animate them.
- `collideVehicles(list)`: for each pair whose ground distance is below `ra + rb` and whose heights overlap (|ya - yb| < 1.5): push apart along the line between centres, each moved by its share `m_other / (ma + mb)` of the overlap (`spec.mass`); multiply both speeds by 0.7. O(n²) over ≤ 40 vehicles is fine.
- `removeVehicle(scene, v)`: remove from the scene, drop its pivots from the Map.
- `seatWorld(v, out)`: `spec.seat` rotated by the vehicle's full rotation (use `v.object.localToWorld` after `v.object.updateMatrixWorld()`), so a rider tilts with a banking Whirligig. `exitPoint(v)`: the point `spec.radius + 0.8` to the vehicle's LEFT side (left = `(cos yaw, -sin yaw)`), on the ground.

## Contract
All exports keep the stub's signatures exactly. `Vehicle.object` is the root; the scaled prefab is its child. Riders (NPC drivers) are added to `v.object` by another module at `spec.seat`: do not clear the root's children.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/vehicles.ts`.

## Out of scope
Every other file. AI driving is `traffic.ts` (another worker).

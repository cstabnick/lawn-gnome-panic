Epic: 2 Places and rides
Depends on: epic 1 (prefabs `spokewheel-wheel`, `spokewheel-stand`, `spokewheel-gondola` exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E11/_env.md` first. Worker: Sonnet. Other workers edit `src/coast/boardwalk.ts`,
`src/coast/pirateShip.ts`, `src/tubing/*`, `packages/achievements`, `src/mapPois.ts` at the same time. You own only the
files listed under Change.

## Goal
The Spokewheel stands on its site and turns (one turn every `COAST.spokewheel.periodS` s, a pure function of the shared
wave clock), and the player can ride it: pay Marram's fare at the platform, sit in a teacup gondola, go round once with
the whole coast below, and step off at the bottom.

## Read first
- `games/gnome-theft-auto/src/coast/config.ts` (`COAST.spokewheel`, `COAST_ACH.fullCircle`).
- `games/gnome-theft-auto/src/coast/spokewheel.ts` (stub: keep `spokewheelAngle` and `gondolaPos` exactly as they are;
  fill `installSpokewheel`), `src/coast/types.ts` (`CoastPart`: `update`, `blips`, `drives`, `stepRider`) and
  `src/coast/index.ts` (app.ts calls `coast.update(dt)` every frame, `coast.drives(v)` / `coast.stepRider(v, inp, dt)`
  in its vehicle-step slot, `coast.blips()` for the map).
- `games/gnome-theft-auto/src/tubing/runtime.ts` lines ~399-490: the pattern for a vehicle another module moves:
  `createVehicle(deps.scene, kind, x, z, yaw)`, `v.y = ...`, `deps.vehicles.push(v)`, `deps.seatPlayer(v)`, each step
  set `v.x/y/z/yaw` then `syncVehicleMesh(v, dt)`, `deps.throwPlayer(v, vx, vy, vz)` to put the player off, and how it
  removes a vehicle (`removeTube`: `removeVehicle` from `../vehicles` and splice from `deps.vehicles`).
- `games/gnome-theft-auto/src/jobs/types.ts` `JobsDeps` (scene, hud, economy, player, unlock, blocked, ...).
- `games/gnome-theft-auto/src/interactables.ts` `addInteractSpot({ x, z, prompt, run })` (E prompt, touch action
  button shows the first word of the prompt) and `src/coast/sign.ts` `coastSign`.
- `games/gnome-theft-auto/src/cull.ts` header comment and `registerCull(obj, cls, opts)` (objects created after the first
  frame must register themselves; the wheel is created at install, before the first frame, but register it anyway as
  `'landmark'` so it draws from far away).
- `packages/prefabs/src/catalog/gta-coast.ts`: `spokewheel-wheel` (hub centre (0, 1.34, 0), rim radius 1.25),
  `spokewheel-stand` (axle (0, 1.46, 0), platform at +z), `spokewheel-gondola` (pivot bar at y ~1.15).
- `games/gnome-theft-auto/src/waves.ts` `waveTime()` (the shared clock).

## Change
1. `src/coast/spokewheel.ts`:
   - Scale: `S = COAST.spokewheel.radius / 1.25` (= 14.4). The stand (`buildPrefab('spokewheel-stand', { lights: false })`,
     scaled S) stands at (x, groundY, z), groundY = `heightAt(x, z)`, so its axle is at groundY + 1.46 * S = groundY +
     `hubH` (21). The wheel prefab (scaled S) hangs in a pivot `THREE.Group` at the axle; inside the pivot the wheel is
     offset by y = -1.34 * S so its hub sits on the pivot. Each frame `pivot.rotation.z = -spokewheelAngle(waveTime())`
     (check the sign so gondola k sits on the rim point `gondolaPos(k, angle, groundY)`; adjust the sign of the rotation,
     not the stub functions).
   - Gondolas: one `THREE.InstancedMesh` per mesh of the gondola prefab is ideal, but a simpler correct version is fine:
     12 gondola groups (`buildPrefab('spokewheel-gondola')`, scale 2.2), each placed every frame so its pivot bar
     (local y 1.15 * 2.2) hangs at `gondolaPos(k, angle, groundY)`: the cup always hangs upright. No per-frame allocation
     (reuse one `{x,y,z}` object). Put wheel, stand and gondolas under one group registered with `registerCull(group,
     'landmark')`; skip the per-frame update when the group is culled (`group.visible === false`) unless the player rides.
   - Colliders: none needed for the wheel (it is in the air); push the stand's legs as boxes into the world? You have no
     `boxes` here; skip colliders (note it in your report).
   - A `coastSign('THE SPOKEWHEEL\nHat on, hands in,\nwait for the bell', { w: 4, h: 1.6, post: 2 })` beside the platform
     facing the boardwalk, and a smaller `coastSign('3 ACORNS\nCOME DOWN WHERE YOU WENT UP', ...)`.
   - **The ride:** `addInteractSpot({ x: board.x, z: board.z, prompt: 'Ride the Spokewheel (3 🌰)', run })`. `run`: refuse
     with a toast if `deps.blocked()` returns a reason or the player is in a vehicle; `deps.economy.spend(fare, 'Spokewheel')`
     else toast "Not enough acorns."; pick the gondola k currently nearest the bottom; create a `'spoke-gondola'` vehicle at
     its pose (`createVehicle(deps.scene, 'spoke-gondola', x, z, 0)`, set `v.y`), push it to `deps.vehicles`, hide gondola
     k's own mesh while ridden, `deps.seatPlayer(v)`, toast "Hat on, hands in." and remember `{ v, k, turned: 0, lastA }`.
   - `drives(v)` is true for the ridden gondola vehicle. `stepRider(v, inp, dt)`: put `v` at gondola k's pose every step
     (`v.yaw = 0`, facing the sea), `syncVehicleMesh(v, dt)`, add the wrapped angle change to `turned`. Halfway round
     (turned >= pi) toast once: "From up here you can see the whole Saltwater." When `turned >= 2 * pi` and the gondola
     is at the bottom: `deps.unlock(COAST_ACH.fullCircle)`, dispatch `window.dispatchEvent(new CustomEvent('gta:spokewheel-ride'))`
     (the quest issue listens for it), put the player off with `deps.throwPlayer(v, 0, 2, 3)` (a small hop forward onto the
     platform), remove the vehicle, show gondola k again.
   - In `update(dt)`: if the player left the gondola early (`deps.player.vehicle !== ride.v`), remove the vehicle, show
     gondola k, end the ride (no achievement). Count completed rides in a module variable; export
     `export function spokewheelRides(): number`.
   - `blips()`: one blip `{ x, z, color: '#4fa3d9', label: 'The Spokewheel' }` (check the `Blip` type in `src/types.ts`).
2. `src/coast/spokewheel.test.ts` (new): `spokewheelAngle` is in [0, 2pi), periodic with `periodS`, increasing over a short
   step; `gondolaPos(0, 0, g)` is at the bottom (y = g + hubH - radius, x = COAST.spokewheel.x); gondolas are 2pi/12
   apart and all at distance `radius` from the hub; at angle pi gondola 0 is at the top.

## Contract
`spokewheelAngle(t)`, `gondolaPos(k, angle, groundY)` unchanged; `installSpokewheel(deps: JobsDeps): CoastPart`;
`export function spokewheelRides(): number`; window event `'gta:spokewheel-ride'` after each full ride; vehicle kind
`'spoke-gondola'` (already in `config.ts` VEHICLES, `net.ts` VEHICLE_CODES, `types.ts`).

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` clean for your files; `npx vitest run src/coast/spokewheel.test.ts`
  passes.
- Touch: the ride starts from the E prompt, which the on-screen action button also triggers (no extra button needed);
  nothing in the ride needs a key.

## Out of scope
`src/coast/config.ts` (ask in your report if a constant must change), `index.ts`, `types.ts`, `sign.ts`, other coast
modules, `app.ts`, `world.ts`, `config.ts`, the prefab catalog.

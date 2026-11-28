Epic: E02-1 Engine pieces
Depends on: none
Items: L93 ("fix the npc driving. its pretty shite. they turn like its arcade mode still but we have been liking the casual mode a lot. but they should be able to drive on all ideally")
Model: Sonnet (physics + control)

(Environment: paste `_environment.md`.)

## Goal
`npcChassis.ts` gives near NPC cars a sim chassis on the CASUAL tune (whatever the player's handling preset) and steps them from the arcade-style commands NPC drivers already produce, with no pop at the handover between arcade and sim.

## Read first
- `npcChassis.ts`: the stub with the final API (`NPC_CHASSIS`, `NpcCommand`, `createNpcChassis`, `npcChassisOf`, `dropNpcChassis`, `stepNpcCar`, `assignNpcChassis`). Keep every exported name and signature.
- `simdrive.ts`: `createChassis(v, tune, setup, rideHeight)`, `stepChassis(v, sd, input: VehicleInput, dt, world)` (world sweep, bump stop, righting; writes v.x/y/z/yaw/speed), `SimDrive`. `handling.ts`: `tuneById('casual')`, `stockSetup(kind)`. Do NOT use `getTune()`, `current`, `simActive()` or `mowerConfig` (the player's preset and garage).
- `traffic.ts` ~380-450: what NPC drivers produce: `finish(v, { throttle, steer, lift }, dt)` with steer = `clamp(-diff * 2, -1, 1)` (pure pursuit; diff = desired yaw - v.yaw) and throttle = `clamp((target - v.speed) * 0.8, -1, 1)` (negative = brake, reverse when backing out). `vehicles.ts` `stepVehicle` (arcade: `v.yaw -= steer * turnRate * dt`).
- `vehicles.ts` `syncVehicleMesh` (~515): a vehicle with `v.sim` takes its pose from that SimDrive; without it from v.x/y/z/yaw plus the ground normal. NPC chassis must NOT be stored on `v.sim` (v.sim means the player's chassis everywhere else).

## Change
- `npcChassis.ts`: implement.
  - `createNpcChassis(v)`: `createChassis(v, tuneById('casual')!, stockSetup(v.spec.kind), 0)`.
  - A `WeakMap<Vehicle, SimDrive>`; `npcChassisOf`; `dropNpcChassis` (delete it; v keeps its last x/y/z/yaw/speed so the arcade step continues; set `v.vy = 0`).
  - `stepNpcCar(v, c, dt, world)`: record that v was stepped (a `WeakMap<Vehicle, number>` of the frame counter that `assignNpcChassis` advances). With a chassis: map the command to `VehicleInput`: steer = `c.steer` (check the sign with a test: the player passes moveX to both models), throttle = `max(0, c.throttle)`, brake = `max(0, -c.throttle)`, handbrake 0, source `'stick'`; through a small NPC assist: limit steer by speed (`steerMax = clamp(1.2 - speed / maxSpeed, 0.35, 1)`), smooth it (rate 6/s, per-car state), and lift the throttle when the command asks for a sharp turn at speed (|steer| > 0.8 and speed > 0.6 * maxSpeed). Then `stepChassis(v, sd, input, dt, world)`. Without a chassis: `stepVehicle(v, c, dt, world)` as today. Leave the mesh to `syncVehicleMesh` (its non-sim branch).
  - `assignNpcChassis(vehicles, focusX, focusZ)`: advance the frame counter; candidates = `driver === 'npc'`, not exploded, not sunk, `!v.spec.boat && !v.spec.flies && !v.spec.air`, `!v.sim`, stepped through `stepNpcCar` within the last 30 frames (only callers that opted in), within `radius` of the focus (or within `radius * hysteresis` if it already has a chassis); keep the nearest `maxCars`; create chassis for new ones (`createChassis` places at v's current pose and speed: no pop); drop the rest.
- New `npcChassis.test.ts` (set up like `terrainDrive.test.ts`; flat ground, no boxes is fine):
  - 90-degree corner: a `ride-on` NPC car with a chassis, driven by traffic's rule (aim point 8 m ahead on an L-shaped polyline: 60 m along +z, then along +x; steer = clamp(-angleDiff(desired, yaw) * 2, -1, 1); target 8 m/s, 5 m/s within 20 m of the corner) for 20 s at dt 1/60: max lateral distance from the polyline < 3.5 m and it ends on the second leg past the corner.
  - Independence from the player's preset: run it with `setTune('arcade')` and with `setTune('drift')` (simdrive.ts) set before creating the chassis: same trajectory (within 1e-6) as with `setTune('casual')`. Restore the tune afterwards.
  - Handover: a car stepped arcade for 1 s at 8 m/s, then given a chassis by `assignNpcChassis`: position jump < 0.05 m and speed change < 0.5 m/s over that frame; dropped again: same.
  - `assignNpcChassis` honours `maxCars` (nearest win) and ignores cars never stepped through `stepNpcCar`.

## Contract
Exact exports of the stub. `stepNpcCar` is the call NPC drivers use instead of `stepVehicle` (wired later in traffic.ts, the follow-quest leader and race rivals; `assignNpcChassis` is called once per frame by traffic.ts). Never set `v.sim`.

## Done when
- `npx vitest run src/npcChassis.test.ts src/handling.test.ts src/terrainDrive.test.ts` pass; `npx tsc --noEmit -p .` clean for npcChassis.ts.
- Report the max lateral error in the corner test and the time for 1000 chassis steps.

## Out of scope
`traffic.ts`, `simdrive.ts`, `vehicles.ts`, `handling.ts`, `packages/vehicle`.

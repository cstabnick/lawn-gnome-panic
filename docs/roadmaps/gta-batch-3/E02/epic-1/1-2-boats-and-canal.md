Epic: E02-1 Engine pieces
Depends on: none
Items: L01 ("another example is clog cruiser cannot get through the little canal entrance")
Model: Sonnet (investigation)

(Environment: paste `_environment.md`.)

## Goal
A boat that touches a bank, pier or lock gate slides along it and keeps speed in proportion to the angle (not a flat 65% loss every frame), and the Clog Cruiser (`VEHICLES['clog-cruiser']`, radius 2.4) can be driven along the Cloverfield canal from its loch end through the entrance, past the lock gates and under the arch bridges.

## Read first
- `boats.ts` `stepBoat` (~36): `stepHull` then `pushOutOfBoxes(v.x, v.z, v.spec.radius, world.boxes, v.y)` and `if (pushed.hit || clamped.hit) v.speed *= 0.35;` (every touch kills speed).
- `collide.ts`: `sweepCircleBoxes(x0, z0, x1, z1, r, boxes, y)` (swept, slides along walls, stops at the last clear spot when wedged), `wallBounce(vx, vz, nx, nz, restitution, mu)` -> `{ vx, vz, impact }`.
- `craft/hull.ts` `stepHull` (how the hull moves; how shallow water / grounding slows it) and `water.ts` ~232 `across()` (canal soft edge 0.6 m).
- `config.ts` `WATER.courses.canal` (`{ depth: 0.85, bank: 1.5, freeboard: 1.6 }`), `WATER.canalLocks` (`[0.25, 0.75]`); `data/levels/cloverfield-farms.level.json` water path id `canal` (10 m wide, y = -170).
- `waterworks.ts`: places `arch-road-bridge` (`ARCH_DECK = 6.5`) and `canal-lock-gate` at `canalLocks()`.
- `boats.test.ts` / `boatCrossing.test.ts` (how tests build the world and drive a boat).

## Change
1. New test `canalCruise.test.ts`: build the real world like `boatCrossing.test.ts` does, put a `clog-cruiser` (createVehicle, driver 'player') on the canal water at its loch end, and drive it with `stepBoat` along the canal centre line (steer toward points sampled ahead along the canal polyline, throttle 0.6) at dt 1/60 for up to 120 s. Assert it reaches the far end (or at least passes both lock positions and every arch bridge) and never stays below 0.5 m/s for more than 3 s. Write it first and see where it stops: find the cause (a lock gate or bridge collider, a bank box, grounding in `stepHull` because the draft exceeds the depth near the edge, or the 2.4 radius against a narrow gap).
2. `boats.ts` `stepBoat`: replace the single push with a sweep from the pre-step position (`const x0 = v.x, z0 = v.z` before `stepHull`): `sweepCircleBoxes(x0, z0, v.x, v.z, BOAT_HIT_RADIUS_FRAC * v.spec.radius, world.boxes, v.y)`; on a hit: velocity `(sin yaw, cos yaw) * speed` -> `wallBounce(vx, vz, nx, nz, 0.1, 0.25)` -> `v.speed = Math.sign(v.speed) * Math.hypot(b.vx, b.vz)`. Keep `clampToWorld` with `v.speed *= 0.6` on an edge hit. New exported const `BOAT_HIT_RADIUS_FRAC = 0.85` (a hull is narrower than its bounding circle).
3. Fix the canal cause in the file that owns it, within these limits: you may move/narrow a lock gate or bridge collider in `waterworks.ts`. Do not change `config.ts` `WATER` numbers, `water.ts`, `craft/hull.ts` or level JSON. If the only fix is in one of those, stop and report exactly what and why.

## Contract
`stepBoat(v, c, dt, world): void` keeps its signature. Boats still pass under bridge decks (they are not boxes).

## Done when
- `npx vitest run src/canalCruise.test.ts src/boats.test.ts src/boatCrossing.test.ts src/boatTraffic.test.ts src/waterworks.test.ts src/water.test.ts` pass.
- `npx tsc --noEmit -p .` clean for your files.
- Report the canal cause and the fix.

## Out of scope
`collide.ts`, `config.ts`, `water.ts`, `craft/hull.ts`, level JSON, any non-boat vehicle code.

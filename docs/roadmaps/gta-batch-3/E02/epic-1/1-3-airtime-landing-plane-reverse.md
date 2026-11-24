Epic: E02-1 Engine pieces
Depends on: none
Items: L55 ("improve the vehicle gravity situation when we go off ramps. it just kind of feels floaty atm. and when we land we bounce a good bit"), L14 ("allow slowly backing up in planes")
Model: Sonnet (physics tuning)

(Environment: paste `_environment.md`.)

## Goal
Jumps off ramps fall like a small, heavy mower (less hang time) and land with a short settle instead of a bounce, under both driving models (the sim chassis, default "Casual", and the Arcade cheat). Planes can back up slowly on the ground.

## Read first
- `simdrive.ts`: `SIM_AIR` (new, neutral: `airGravity: 0, landingRebound: 1, landingSettle: 0`), `stepChassis` (the per-frame step every sim car uses, player and NPC: `sd.ctrl.update(dt, input)`, wall sweep, `SIM_FLOOR` bump stop, righting, `writePose`). `sd.ctrl.telemetry.groundedWheels` (0 = airborne), `sd.ctrl.body.vel` / `angVel` (m/s, rad/s, y up). The controller (`packages/vehicle/src/controller.ts`) runs 9.81 gravity and its tyre loads and springs are tuned for that: do NOT pass a `gravity` option; add extra pull only while airborne.
- `stunts.ts`: `RAMP_LAUNCH` (~41), `evaluateStuntJump` (`airTime >= 0.65 && dist >= 12`, ~75), the sim and arcade launch/landing code (~285-330).
- `vehicles.ts` `stepOther` (~402-430: arcade ground vehicles in the air use `v.vy -= 22 * dt`, snap to the ground on landing); `stepPilotedPlane` (~358, the legacy Crop Duster `kind 'plane'`: "Planes never reverse", steering gate 0 below 3 m/s on the ground).
- `craft/flight.ts` (~45-70) fixed-wing branch: `speed = Math.max(0, ...)`; the rotor branch uses `spec.reverseFrac` (`craft/model.ts` ~41, ~86).
- `config.ts` aircraft specs ~395-420; tests `ramps.test.ts`, `stunts.test.ts`, `craft/*.test.ts`.

## Change
- `simdrive.ts` (L55, sim): implement `SIM_AIR` inside `stepChassis` right after `sd.ctrl.update`: add optional fields to `SimDrive` (`airT?: number; settleT?: number`). While `groundedWheels === 0`: `body.vel.y -= SIM_AIR.airGravity * dt`, `airT += dt`. On the frame grounded wheels go 0 -> >0 after `airT >= 0.15`, set `settleT = SIM_AIR.landingSettle`, `airT = 0`; while `settleT > 0` (count down): if `body.vel.y > 0` multiply it by `SIM_AIR.landingRebound`, and multiply `body.angVel.x` and `body.angVel.z` by `(1 + SIM_AIR.landingRebound) / 2`. Tune the three values (start: airGravity 9, landingRebound 0.25, landingSettle 0.35) so a car driven off a ramp at its usual speed still qualifies as a stunt jump and the body rises less than 0.15 m after first touchdown. Do not change `SIM_FLOOR`, `TIPPED_DEG`, `stepSimDrive`/`stepChassis` signatures, or anything in `packages/vehicle`.
- `stunts.ts` (L55): if sim jumps stop qualifying at ramp speed, add `RAMP_LAUNCH.simBoost` (applied to `body.vel.y` at the sim launch) rather than lowering the `evaluateStuntJump` thresholds; if arcade jumps stop qualifying, raise `RAMP_LAUNCH.arcadeBoost`. Update numbers pinned in `ramps.test.ts` / `stunts.test.ts` only where a constant you changed is pinned, and say so.
- `vehicles.ts` `stepOther` (L55, arcade): new exported const `ARCADE_AIR = { gravity: 30 }`; use it instead of the literal 22 for ground vehicles in the air (landing stays a snap, no bounce).
- Planes (L14), fixed-wing in `craft/flight.ts`: when `onFloor && throttle < 0 && speed <= 1`, let speed go down to `-(spec.reverseFrac ?? PLANE_REVERSE_FRAC) * spec.maxSpeed` (new exported `PLANE_REVERSE_FRAC = 0.06`, about 2-3 m/s) at a gentle rate; never negative in the air (clamp to 0 when it leaves the floor); on the floor allow rudder steering while backing slowly (ground gate uses `|speed|`, at least 0.35 while |speed| > 0.3; steering sense flips when backing, like a car). Legacy `stepPilotedPlane` in vehicles.ts: the same rule (`spec.reverseFrac ?? PLANE_REVERSE_FRAC`, import it from craft/flight.ts) and the same ground steering. Fixed-wing specs in config.ts may get `reverseFrac: 0.06`; keep the rotorcraft/balloon values (0.35, 0.5) unchanged.
- Tests (new file `airtime.test.ts` or added cases): a `createSimDrive` car (flat terrain) given vel.y 6 m/s at 14 m/s forward lands sooner with the tuned `SIM_AIR` than with neutral values (temporarily assign the neutral values and restore), and after touchdown its body y never rises more than 0.15 m; an arcade ground vehicle launched with vy 6 lands in under 0.45 s. `planeReverse.test.ts`: a fixed-wing plane at rest on the floor with throttle -1 reaches a small negative speed (>= -0.06 * maxSpeed - 0.01) within 3 s and turns when steering; airborne it never goes below 0; same for `stepVehicle` on a `kind 'plane'` vehicle.

## Contract
`SIM_AIR`, `ARCADE_AIR`, `RAMP_LAUNCH`, `PLANE_REVERSE_FRAC` exported const blocks (E14's dirt bike and rally rely on them). `stepChassis(v, sd, input, dt, world): boolean` and `stepSimDrive` keep their signatures. Do not edit the bump / knock code in vehicles.ts (~600-800) or `applyDamageLevel` (another issue edits them later).

## Done when
- `npx vitest run src/stunts.test.ts src/ramps.test.ts src/terrainDrive.test.ts src/suspension.test.ts src/bump.test.ts src/handling.test.ts src/craft` pass, plus your new tests.
- `npx tsc --noEmit -p .` clean for your files.
- Report the final SIM_AIR / ARCADE_AIR / RAMP_LAUNCH numbers and the measured air time + distance for one ramp jump in each model.

## Out of scope
`packages/vehicle`, `collide.ts`, `camera.ts`, `traffic.ts`, `npcChassis.ts`, `debris.ts`, boats.

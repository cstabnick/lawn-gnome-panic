Epic: E02-2 Wiring
Depends on: epic 1 (debris.ts `knock`, `hideLostParts`, `forgetLostParts` exist)
Items: L53 ("add more ways for vehicles to break and lose parts ... the more parts we lose the better")

(Environment: paste `../epic-1/_environment.md`.)

## Goal
Hard hits knock parts off vehicles in play: a wall or scenery hit, a vehicle-vehicle crash, and rolling over each throw the part on the hit side; knocked parts stay off through damage-stage rebuilds and come back on repair.

## Read first
- `debris.ts`: `DebrisSystem.knock(v, nx, nz, impact): number` ((nx, nz) = unit direction from the vehicle centre TOWARD the hit; does nothing under `DEBRIS.knockMin`), module functions `hideLostParts(v)` and `forgetLostParts(v)`.
- `vehicles.ts`: `PartsHooks` (~99) and `setPartsHooks`; `applyDamageLevel` (~113: rebuilds the body, then `stripLooseParts`, `v.rig?.apply()`); `repairVehicle` (~174); `setVehicleLook` (~876, may rebuild the dressing); the arcade wall hit in `stepOther` (~480-492: `sweepCircleBoxes`, `wallBounce`, `b.impact`, `sw.nx/nz` = wall normal pointing OUT of the wall toward the car); the vehicle-vehicle bump `collideVehicles` (~720-760: contact normal `nx, nz` from b toward a, `closing`); `stepKnock` (~760-790, knocked cars hitting walls).
- `simdrive.ts` `stepChassis`: the sim wall hit (`sw.hit`, `wallBounce`, `b.impact`) and the righting safety net (`sd.tippedT > RIGHT_AFTER`).
- `fleetRuntime.ts` ~90: `setPartsHooks({ beforeDamage, exploded })` wired to the debris system (`debris`), achievements `FLEET_ACHIEVEMENTS.bits` counted for pieces near the player (`near(v)`).

## Change
- `vehicles.ts`:
  - `PartsHooks`: add `knock?(v: Vehicle, nx: number, nz: number, impact: number): void` (doc: a hard hit on side (nx, nz), toward the hit).
  - Exported `knockParts(v, nx, nz, impact)`: `partsHooks?.knock?.(v, nx, nz, impact)` (skip exploded vehicles).
  - Call it: arcade wall hit in `stepOther` with `(-sw.nx, -sw.nz, b.impact)` (toward the wall); `collideVehicles` when `closing > CRASH_MIN` with `(-nx, -nz, closing)` for a and `(nx, nz, closing)` for b (check the normal's direction in the code and pick the signs so each car loses a part on the side facing the other car); `stepKnock` wall hits likewise.
  - `applyDamageLevel`: after `v.rig?.apply()` call `hideLostParts(v)`; `repairVehicle`: call `forgetLostParts(v)` before rebuilding (and make sure a repair at damage 0 also shows the parts again: if `v.damage === 0` there is no rebuild, so set every recorded part visible before forgetting; add an exported `restoreLostParts(v)` to debris.ts ONLY if needed and say so: debris.ts is otherwise not yours); `setVehicleLook`: call `hideLostParts(v)` at the end (a re-dress must not bring back lost parts).
- `simdrive.ts` `stepChassis`: on a sim wall hit call `knockParts(v, -sw.nx, -sw.nz, b.impact)`; when the righting safety net fires (a roll-over), call `knockParts(v, 0, 0, ...)`? No: for a roll-over call it twice with the up-side direction of the tipped body projected on the ground (`qRotate(body.quat, v3(0, 1, 0))` x/z normalised; skip if tiny) and impact `2 * DEBRIS.knockMin` (import `DEBRIS` from debris.ts; simdrive.ts may import debris.ts).
- `fleetRuntime.ts`: add `knock(v, nx, nz, impact)` to the hooks object: `const n = debris.knock(v, nx, nz, impact); if (n > 0) { deps.fx.spark(v.x, v.y + 0.6, v.z); if (near(v)) void deps.achievements.increment(FLEET_ACHIEVEMENTS.bits, n); }`.
- Tests: in `fleetRuntime.test.ts` or a new `partsKnock.test.ts`: a `ride-on` driven (arcade, `stepVehicle`) at 15 m/s head-on into a box loses at least one part (a debris piece appears; stub `Math.random` to 0 so the chance roll passes); a 3 m/s nudge loses none; after a damage level rise (`damageVehicle(v, 0.5)`) the knocked part is still hidden; `repairVehicle(v)` shows it again.

## Contract
`PartsHooks.knock?`, `knockParts(v, nx, nz, impact)` exported from vehicles.ts. Online: part loss is local (no protocol change); damage levels sync as before.

## Done when
- `npx vitest run src/fleetRuntime.test.ts src/fleet.test.ts src/debris.test.ts src/bump.test.ts src/terrainDrive.test.ts src/vehicles.glaze.test.ts` and your new test pass; `npx tsc --noEmit -p .` clean.

## Out of scope
`traffic.ts`, `app.ts`, `camera.ts`, prefab catalogs, the airtime code in simdrive.ts (do not change `SIM_AIR`).

Epic: 1 (Modules), issue 1G: the plane's flight model (vehicles.ts)
Depends on: none

## Environment
Working directory: C:\Users\cstab\Documents\gaming (Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnome-theft-auto (Vite + TypeScript + three.js 0.187). Several other workers are editing other files of this game at the same time: change only the files named under "Change". Do not run `npm run build` or `npm run dev`, do not start servers, do not git commit.
The check is `npx tsc --noEmit -p games/gnome-theft-auto`. An error in a file you do not own means another worker is mid-edit: ignore it unless your change caused it. NEVER edit types.ts, config.ts or collide.ts: they are final contracts, already written. Read them first (types.ts: every interface; config.ts: WORLD_HALF, CITY_HALF, ROAD_LINES, BIOMES, biomeAt, HIGHWAYS, BASE, AIRFIELD, VIEW, BUILDINGS, VEHICLES, FLY, GUNS, BULLET, CHUTE).
Conventions: y is up, 1 unit = one gnome's height (about 1.3). Yaw 0 faces +z, forward = (sin yaw, 0, cos yaw), turning right DECREASES yaw. The ground is flat (y = 0) everywhere. No per-frame allocation in hot loops (reuse scratch vectors). Free assets only: everything is built from code or from @lawn/prefabs (prefabs are data in packages/prefabs/src/catalog). The game is a gnome parody (lore setting: apocrypha): keep any text dry and cartoon-safe, no gore, no real brands.
The world: a 1200 x 1200 flat map. Turfton (the city grid, |x|,|z| <= 215) in the middle; outside it four biomes split along the diagonals: desert east (Fort Sandpit and the airfield with two planes), forest west, tundra north, farmland south, joined to the city by highways (config.ts HIGHWAYS).

## Goal
The Crop Duster (`VehicleKind` 'plane') flies like a fixed-wing plane: it must build speed on the ground to lift off, can climb and bank while fast enough, stalls and sinks if too slow, and can land. Its propeller spins. The Whirligig keeps its current behaviour.

## Read first
- games/gnome-theft-auto/src/vehicles.ts: the whole file (`createVehicle`, `stepVehicle`, `syncVehicleMesh`, pivots).
- games/gnome-theft-auto/src/config.ts: `VEHICLES.plane` (fixedWing, stallSpeed 22, maxSpeed 55, ceiling 300), `FLY` (`planeClimb`, `stallSink`, `ceiling`, `climb`, `gravity`, `drag`), `GROUND_DRAG`.
- games/gnome-theft-auto/src/types.ts: `VehicleSpec` (`fixedWing`, `stallSpeed`, `ceiling`), `Vehicle`, `DriveControls` (throttle, steer, lift).
- Prefab facts (another worker is adding it right now; build it by id): prefab `crop-duster`, nose toward +z, pivots named `prop` (spin about its local z axis) and `wheel-0` to `wheel-3` (spin about x).

## Change
- games/gnome-theft-auto/src/vehicles.ts:
  - Pivots: add an optional `prop?: THREE.Object3D` found by name `'prop'`.
  - `stepVehicle`: add a branch for `spec.fixedWing` (all other vehicles unchanged, including the Whirligig which is `flies` but not `fixedWing`). Replace the vertical block's ceiling by `spec.ceiling ?? FLY.ceiling` for every flyer.
    - Piloted (`v.driver === 'player'`) plane, with `air = v.y > 0.05` and `stall = spec.stallSpeed`:
      - Throttle: `c.throttle > 0`: `speed = min(maxSpeed, speed + accel * c.throttle * dt)`; `c.throttle < 0`: brake, `speed = max(0, speed - 1.5 * accel * dt)` (planes never reverse); `c.throttle === 0`: coast, `speed *= pow(air ? 0.93 : 0.5, dt)`.
      - Lift authority `auth = clamp((speed - 0.7 * stall) / (0.3 * stall), 0, 1)`.
      - Target vertical speed: if `c.lift > 0`: `c.lift * FLY.planeClimb * auth`; if `c.lift < 0` and in the air: `c.lift * FLY.planeClimb`; else 0 when in the air with enough speed. If in the air and `speed < stall`: the target becomes `min(target, -FLY.stallSink * (1 - speed / stall))` (a stall: the nose drops and it sinks). Ease `vy` toward the target with `vy += (target - vy) * min(1, 2.5 * dt)`.
      - On the ground (`!air`) it cannot descend; it lifts off only when `c.lift > 0` and `speed >= stall`.
      - Steering: `yaw -= c.steer * spec.turnRate * dt * clamp(speed / stall, 0, 1)` (no turning while nearly stopped; on the ground below speed 3 no turning).
      - Position, box collision, world clamp as the existing code does (planes hit towers lower than their altitude; the existing push-out and speed loss apply).
      - Landing: when `y` reaches 0 coming down, if `|vy| > 9` also `speed *= 0.4` and play 'bump' (the existing `play` import) when the driver is the player.
    - Unpiloted plane (`driver !== 'player'`): the existing flyer branch already falls with `FLY.gravity`; also bleed speed (`speed *= pow(0.5, dt)`).
  - `syncVehicleMesh`: for `spec.fixedWing`: `roll = steerVis * 0.5`, `pitch = -clamp(vy / FLY.planeClimb, -1, 1) * 0.3` (negative pitch is nose up in three.js here), apply with `rotation.set(pitch, yaw, roll, 'YXZ')` as the existing code does. The wheels spin only when on the ground (`v.y < 0.05`). The propeller: spin `prop.rotation.z += dt * propSpin` where `propSpin` eases to 40 rad/s while `v.driver !== 'none' || v.y > 0.05` and winds down to 0 over 2 s otherwise (reuse the `rotorSpin` pattern).
  - `exitPoint` stays; add nothing else.

## Contract
Unchanged exports: `createVehicle`, `stepVehicle(v, c, dt, world)`, `syncVehicleMesh(v, dt)`, `collideVehicles`, `removeVehicle`, `seatWorld`, `exitPoint`. Behaviour for non-fixed-wing vehicles must not change.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` reports no error in vehicles.ts.
- By reading the code: a plane at rest with full throttle on the ground accelerates, and `c.lift > 0` lifts it off only once `speed >= 22`; at 10 speed in the air it sinks.

## Out of scope
types.ts, config.ts, main.ts, player.ts, every other file.

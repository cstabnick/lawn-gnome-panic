Epic: 1 (Modules), issue 1F: free fall and the automatic parachute (player.ts)
Depends on: none

## Environment
Working directory: C:\Users\cstab\Documents\gaming (Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnome-theft-auto (Vite + TypeScript + three.js 0.187). Several other workers are editing other files of this game at the same time: change only the files named under "Change". Do not run `npm run build` or `npm run dev`, do not start servers, do not git commit.
The check is `npx tsc --noEmit -p games/gnome-theft-auto`. An error in a file you do not own means another worker is mid-edit: ignore it unless your change caused it. NEVER edit types.ts, config.ts or collide.ts: they are final contracts, already written. Read them first (types.ts: every interface; config.ts: WORLD_HALF, CITY_HALF, ROAD_LINES, BIOMES, biomeAt, HIGHWAYS, BASE, AIRFIELD, VIEW, BUILDINGS, VEHICLES, FLY, GUNS, BULLET, CHUTE).
Conventions: y is up, 1 unit = one gnome's height (about 1.3). Yaw 0 faces +z, forward = (sin yaw, 0, cos yaw), turning right DECREASES yaw. The ground is flat (y = 0) everywhere. No per-frame allocation in hot loops (reuse scratch vectors). Free assets only: everything is built from code or from @lawn/prefabs (prefabs are data in packages/prefabs/src/catalog). The game is a gnome parody (lore setting: apocrypha): keep any text dry and cartoon-safe, no gore, no real brands.
The world: a 1200 x 1200 flat map. Turfton (the city grid, |x|,|z| <= 215) in the middle; outside it four biomes split along the diagonals: desert east (Fort Sandpit and the airfield with two planes), forest west, tundra north, farmland south, joined to the city by highways (config.ts HIGHWAYS).

## Goal
The player gnome can leave a flying vehicle in mid-air, falls, and an automatic parachute opens; the player steers the glide and lands. A hard landing without a canopy splats (costs dryness).

## Read first
- games/gnome-theft-auto/src/player.ts: the whole file (`updateFoot`, `updateRiding`, `exit`, `respawn`, `muzzle`; two stubs `bail` and `updateAir` to fill in; `airborne` and `chute` fields already exist).
- games/gnome-theft-auto/src/types.ts: `Player` (the new members and their doc comments), `InputState`, `Vehicle`, `World`.
- games/gnome-theft-auto/src/config.ts: `CHUTE`, `BAIL_MIN_ALTITUDE`, `PLAYER`.
- games/gnome-theft-auto/src/collide.ts: `pushOutOfBoxes`, `clampToWorld`.
- games/gnome-theft-auto/src/vehicles.ts: `seatWorld(v, out)`.

## Change
- games/gnome-theft-auto/src/player.ts:
  - `bail(v)`: leave the vehicle in the air. Set `p.x, p.y, p.z` from the seat world position (`seatWorld`), `p.yaw = v.yaw`, `p.vehicle = null`, `p.airborne = true`, `p.chute = 0`, `p.grounded = false`, `p.vy = -2`, and an inherited horizontal velocity: keep private `vx`, `vz` = (sin v.yaw, cos v.yaw) * v.speed * 0.5. A `fallTime` timer starts at 0.
  - `updateAir(input, camYaw, dt, world)`, per frame while `p.airborne`:
    - `fallTime += dt`. Chute state: if `p.chute === 0` and `fallTime >= CHUTE.deployDelay` and `p.y > CHUTE.minDeployAltitude`, start opening: from then `p.chute` rises toward 1 at `CHUTE.openRate` per second (it never closes in the air). The first frame it starts to open call the optional hook `onChute?.()` (a module-level exported `let` function `setChuteHook(fn: () => void)`; main uses it to play a sound).
    - Vertical: free fall (`chute < 0.5`): `vy -= CHUTE.fallGravity * dt`, clamp at `-CHUTE.terminalFall`. Under canopy: ease `vy` toward `-CHUTE.descend` with `vy += (-CHUTE.descend - vy) * min(1, 4 * dt)`, scaled by how open the canopy is (blend by `chute`).
    - Horizontal: the camera-relative move direction from `input.moveX`, `input.moveY` and `camYaw` exactly as `updateFoot` computes it. Under canopy the target velocity is that direction * `CHUTE.glideSpeed`; in free fall it is that direction * `CHUTE.glideSpeed * 0.4`. Ease `vx, vz` toward the target with `1 - exp(-2 * dt)`. Face the motion direction when it is above a small epsilon (ease `p.yaw` like `updateFoot` does with `angleDiff`).
    - Integrate position, then `pushOutOfBoxes(p.x, p.z, PLAYER.radius, world.boxes, p.y)` and `clampToWorld(..., world.half, ...)`.
    - Landing: when `p.y <= 0`: remember the downward speed `impact = -vy`; set `p.y = 0`, `p.vy = 0`, `p.grounded = true`, `p.airborne = false`; if `p.chute < 0.5 && impact > CHUTE.hardLandingSpeed` call `p.soak(CHUTE.hardLandingSoak)`; set `p.chute = 0`; zero `vx, vz`.
    - Animate: `pos.set(p.x, p.y, p.z)`, `state.facing = p.yaw`, `state.grounded = false`, `state.jumpsUsed = 1`, `model.update(state, dt)`; THEN pose the arms: in free fall both arms out to the sides (`model.arms.left.rotation.z = 1.3`, `model.arms.right.rotation.z = -1.3`, x = 0); under an open canopy both arms straight up (`rotation.x = -2.9`, z = 0). (The player's gun is hidden by main while airborne.)
    - The canopy: build once `buildPrefab('parachute-canopy')` from '@lawn/prefabs', add it to `model.object`, `visible = false`; each frame while airborne set `visible = p.chute > 0.02`, `scale.setScalar(max(0.01, p.chute))` and keep it upright above the gnome (the canopy is a child of the gnome model, so it follows). Hide it when not airborne.
  - `respawn()` and `exit()` also set `p.airborne = false`, `p.chute = 0`, hide the canopy.
  - Do not change `updateFoot` or `updateRiding`.

## Contract
Exports `createPlayer(scene, look): Player` (unchanged) and new `setChuteHook(fn: () => void): void`. Player members exactly as in types.ts (`airborne`, `chute`, `bail(v)`, `updateAir(input, camYaw, dt, world)`).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` reports no error in player.ts.

## Out of scope
types.ts, config.ts, main.ts (wires `bail`, `updateAir`), vehicles.ts, every other file.

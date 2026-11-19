Epic: 1 (Modules), issue 1D: camera that aims (camera.ts)
Depends on: none

## Environment
Working directory: C:\Users\cstab\Documents\gaming (Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnome-theft-auto (Vite + TypeScript + three.js 0.187). Several other workers are editing other files of this game at the same time: change only the files named under "Change". Do not run `npm run build` or `npm run dev`, do not start servers, do not git commit.
The check is `npx tsc --noEmit -p games/gnome-theft-auto`. An error in a file you do not own means another worker is mid-edit: ignore it unless your change caused it. NEVER edit types.ts, config.ts or collide.ts: they are final contracts, already written. Read them first (types.ts: every interface; config.ts: WORLD_HALF, CITY_HALF, ROAD_LINES, BIOMES, biomeAt, HIGHWAYS, BASE, AIRFIELD, VIEW, BUILDINGS, VEHICLES, FLY, GUNS, BULLET, CHUTE).
Conventions: y is up, 1 unit = one gnome's height (about 1.3). Yaw 0 faces +z, forward = (sin yaw, 0, cos yaw), turning right DECREASES yaw. The ground is flat (y = 0) everywhere. No per-frame allocation in hot loops (reuse scratch vectors). Free assets only: everything is built from code or from @lawn/prefabs (prefabs are data in packages/prefabs/src/catalog). The game is a gnome parody (lore setting: apocrypha): keep any text dry and cartoon-safe, no gore, no real brands.
The world: a 1200 x 1200 flat map. Turfton (the city grid, |x|,|z| <= 215) in the middle; outside it four biomes split along the diagonals: desert east (Fort Sandpit and the airfield with two planes), forest west, tundra north, farmland south, joined to the city by highways (config.ts HIGHWAYS).

## Goal
The third-person camera sits over the player's shoulder with the crosshair (screen centre) clear of the gnome's body and near the horizon, so the player aims by looking, never "down to hit". It also gains gun recoil and views for the parachute and the plane.

## Read first
- games/gnome-theft-auto/src/camera.ts: the whole file (`VIEW`, `createChaseCamera`, `clipToView`).
- games/gnome-theft-auto/src/types.ts: `ChaseCamera` (now with `kick`), `CameraMode` (now includes 'chute'), `World`.
- games/gnome-theft-auto/src/player.ts lines 1-40 for the convention: the gnome's right-hand direction on the ground is (-cos yaw, 0, sin yaw) for a view yaw.

## Change
- games/gnome-theft-auto/src/camera.ts:
  - `aimDir(out)`: return the camera's world forward direction, normalised, with no upward bias (delete the `out.y += 0.06`). The game casts bullets from the camera along this vector.
  - Over-the-shoulder: in modes 'foot' and 'chute' shift both the look point and the camera position sideways by 0.7 units to the gnome's right (use the view yaw: right = (-cos yaw, 0, sin yaw)), smoothed with the existing `smoothed` lerp so it does not snap. In 'drive' and 'fly' there is no shoulder shift.
  - Retune `VIEW`: foot `pitch` 0.12 (was 0.28), `lookHeight` 1.5, `dist` 4.6; drive `pitch` 0.2; fly `dist` 16, `distPerSpeed` 0.1, `pitch` 0.22 (planes are faster; whirligig also uses fly); chute `dist` 9, `pitch` 0.35, `lookHeight` 1.5 (already present as a stub: tune it).
  - Widen the vertical look range: `PITCH_MIN` -0.5 (look up at towers and planes), keep `PITCH_MAX`. Keep `MIN_Y` so the camera never sinks into the ground.
  - `kick(pitch)`: add `pitch` to a `recoil` offset (radians, looks up) clamped to 0.15; every frame in `update` decay it toward 0 with `recoil *= exp(-9 * dt)` and apply it as an extra upward tilt of the view direction (subtract it from the effective pitch used to place the camera).
  - FOV widening with speed stays only for drive and fly (it already is).

## Contract
`createChaseCamera(camera: THREE.PerspectiveCamera): ChaseCamera` with `yaw`, `pitch`, `update(dt, target, targetYaw, mode, input, world)`, `aimDir(out)`, `kick(pitch)`. Unchanged signatures.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` reports no error in camera.ts.

## Out of scope
types.ts, config.ts, main.ts, weapons.ts, every other file.

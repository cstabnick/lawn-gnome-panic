Epic: 2 (Wiring), issue 2A: wire guns, planes, parachutes and biomes together (main.ts)
Depends on: epic 1 (all modules are done and compile)

## Environment
Working directory: C:\Users\cstab\Documents\gaming (Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnome-theft-auto (Vite + TypeScript + three.js 0.187). Several other workers are editing other files of this game at the same time: change only the files named under "Change". Do not run `npm run build` or `npm run dev`, do not start servers, do not git commit.
The check is `npx tsc --noEmit -p games/gnome-theft-auto`. An error in a file you do not own means another worker is mid-edit: ignore it unless your change caused it. NEVER edit types.ts, config.ts or collide.ts: they are final contracts, already written. Read them first (types.ts: every interface; config.ts: WORLD_HALF, CITY_HALF, ROAD_LINES, BIOMES, biomeAt, HIGHWAYS, BASE, AIRFIELD, VIEW, BUILDINGS, VEHICLES, FLY, GUNS, BULLET, CHUTE).
Conventions: y is up, 1 unit = one gnome's height (about 1.3). Yaw 0 faces +z, forward = (sin yaw, 0, cos yaw), turning right DECREASES yaw. The ground is flat (y = 0) everywhere. No per-frame allocation in hot loops (reuse scratch vectors). Free assets only: everything is built from code or from @lawn/prefabs (prefabs are data in packages/prefabs/src/catalog). The game is a gnome parody (lore setting: apocrypha): keep any text dry and cartoon-safe, no gore, no real brands.
The world: a 1200 x 1200 flat map. Turfton (the city grid, |x|,|z| <= 215) in the middle; outside it four biomes split along the diagonals: desert east (Fort Sandpit and the airfield with two planes), forest west, tundra north, farmland south, joined to the city by highways (config.ts HIGHWAYS).

All epic 1 modules now exist and are final: you are the only worker; you may edit main.ts only (and net.ts only if a type error forces a one-line fix).

## Goal
`main.ts` uses the new modules: real guns aimed from the crosshair, the two planes at the airfield, bailing out of a plane with an automatic parachute, the big world with biome tracking, and achievements for them.

## Read first
- games/gnome-theft-auto/src/main.ts: the whole file (it already has a few STUB-wiring lines from the foundation: search for "STUB").
- games/gnome-theft-auto/src/types.ts: `Weapons`, `Player` (`airborne`, `chute`, `bail`, `updateAir`), `ChaseCamera.kick`, `HudState`, `Hud.setWorld`, `World` (`biomeAt`, `airfield`, `update(dt, focusX, focusZ)`), `CameraMode` ('chute').
- games/gnome-theft-auto/src/config.ts: `GUNS`, `BAIL_MIN_ALTITUDE`, `BIOMES`, `BIOME_NAMES`, `VIEW`, `AIRFIELD`, `VEHICLES.plane`.
- games/gnome-theft-auto/src/audio.ts: `play(s)` with 'gunshot' | 'shotgun' | 'reload' | 'chute', `setEngine(on, speed01, flying, plane?)`. player.ts: `setChuteHook(fn)`. net.ts: `RemotePose` now has `chute`.

## Change
- games/gnome-theft-auto/src/main.ts:
  - Camera far plane: `new THREE.PerspectiveCamera(62, 1, 0.1, VIEW.cameraFar)`.
  - After `buildWorld`, call `hud.setWorld(world)` (create the hud before that if needed). Spawn one plane per `world.airfield.planeSpots` entry with `createVehicle(scene, 'plane', s.x, s.z, s.yaw)` (tint omitted) and push it to `vehicles`; `world.parked` (now includes biome mowers) is spawned as before. The Whirligig is still parked at `world.base.padX/padZ`. Add each plane to the minimap blips in a pale colour ('#ffffff').
  - Guns: on foot or driving, every frame call `chase.aimDir(aim)` then `weapons.update(dt, inp.fire, muzzle, camera.position, aim, hitTest, world)` (delete the old `aim.y += 0.3` hack and the squirt sound line). Reload: `if (inp.reload) weapons.reload()`. Detect shots by `weapons.ammo` dropping since last frame (or a reload start when it rises): on a shot `play(weapons.gun === 'shotgun' ? 'shotgun' : 'gunshot')` and `chase.kick(GUNS[weapons.gun].recoil)`; on `weapons.reloading` going true `play('reload')`. Gun swap toast uses `GUNS[weapons.gun].name`. Weapons are hidden (`setVisible(false)`) while driving, flying or airborne under a parachute, and visible again on foot. The player cannot fire while airborne (pass `trigger = false`).
  - Planes and bailing: replace `getOut()`: if the vehicle `flies` and `v.y > BAIL_MIN_ALTITUDE`: bail out (`v.driver = 'none'`, `player.bail(v)`, `weapons.setVisible(false)`, toast 'Bailing out!'). If it `flies` and `1.5 < v.y <= BAIL_MIN_ALTITUDE`: toast 'Too low to jump. Land first.' and return. If it is a fixed-wing plane on the ground moving faster than 6: toast 'Slow down first.' and return. Otherwise exit as before. `setChuteHook(() => play('chute'))` once at start.
  - Frame loop: while `player.airborne` call `player.updateAir(inp, chase.yaw, dt, world)` instead of `updateFoot`/`updateRiding`; the camera mode is 'chute' while airborne; engine sound off. When the player was airborne last frame and is not now: restore the gun (`setVisible(true)`), and if the canopy had been open (track `hadChute = player.chute > 0.5` while airborne) `void achievements.unlock('gta-skydiver')`. Camera target while airborne is the player position.
  - The plane's engine: `setEngine(true, speed / maxSpeed, spec.flies, spec.kind === 'plane')`. The first time a plane's `y > 5` with the player driving it, `void achievements.unlock('gta-pilot')`. `stats.driven` already counts every kind including 'plane' (the collector achievement now has target 6).
  - `nearestVehicle()`: planes are entered like other vehicles (no change needed if `Math.abs(v.y - player.y) > 2` already allows a parked plane). When a vehicle is entered, `getIn` works as before (the `v === whirligig` banner branch stays).
  - Biomes: keep `let biome = world.biomeAt(x, z)` for the player (or the vehicle) position each frame; when it changes show `hud.toast('Entering ' + BIOME_NAMES[biome])` and record it in a `Set<BiomeId>`; `void achievements.increment('gta-explorer')` once per newly-visited biome (the achievement has target 5; call increment only for biomes not yet in the set this session, and note that earlier sessions are covered by the store's own progress).
  - HUD state: `altitude` = `player.y` while airborne, `v.y` in a flying vehicle, else null; `speed` = `Math.abs(v.speed)` rounded in a vehicle, else null; `chute` = `player.chute > 0.5`; `biome` = `BIOME_NAMES[biome]`; `ammo`, `mag`, `reloading` from weapons. (Remove any STUB placeholders.)
  - Online pose: `chute: player.airborne && player.chute > 0.5`, `aiming` stays as now, vehicle code from `VEHICLE_CODES`. `y` is the player's y or the vehicle's y.
  - `washedOut()` must also reset airborne state via `player.respawn` (it already does) and clear a plane's driver as it does for any vehicle.
  - Heat: shooting a pedestrian adds `HEAT.soakPedestrian` as it does now for a soak (hitTest unchanged).
  - Remove every `// STUB` comment you resolved. Keep the `?debug` hook (add `chase` is already there; also add `world` and `vehicles` if missing).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` passes with no errors anywhere.
- By reading the code: bullets come from `camera.position` along `chase.aimDir`; bailing above 3 units calls `player.bail`; `updateAir` runs while `player.airborne`.

## Out of scope
Every file except main.ts.

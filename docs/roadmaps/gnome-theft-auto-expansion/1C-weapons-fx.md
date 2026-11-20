Epic: 1 (Modules), issue 1C: real guns (weapons.ts) and bullet effects (fx.ts)
Depends on: none

## Environment
Working directory: C:\Users\cstab\Documents\gaming (Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnome-theft-auto (Vite + TypeScript + three.js 0.187). Several other workers are editing other files of this game at the same time: change only the files named under "Change". Do not run `npm run build` or `npm run dev`, do not start servers, do not git commit.
The check is `npx tsc --noEmit -p games/gnome-theft-auto`. An error in a file you do not own means another worker is mid-edit: ignore it unless your change caused it. NEVER edit types.ts, config.ts or collide.ts: they are final contracts, already written. Read them first (types.ts: every interface; config.ts: WORLD_HALF, CITY_HALF, ROAD_LINES, BIOMES, biomeAt, HIGHWAYS, BASE, AIRFIELD, VIEW, BUILDINGS, VEHICLES, FLY, GUNS, BULLET, CHUTE).
Conventions: y is up, 1 unit = one gnome's height (about 1.3). Yaw 0 faces +z, forward = (sin yaw, 0, cos yaw), turning right DECREASES yaw. The ground is flat (y = 0) everywhere. No per-frame allocation in hot loops (reuse scratch vectors). Free assets only: everything is built from code or from @lawn/prefabs (prefabs are data in packages/prefabs/src/catalog). The game is a gnome parody (lore setting: apocrypha): keep any text dry and cartoon-safe, no gore, no real brands.
The world: a 1200 x 1200 flat map. Turfton (the city grid, |x|,|z| <= 215) in the middle; outside it four biomes split along the diagonals: desert east (Fort Sandpit and the airfield with two planes), forest west, tundra north, farmland south, joined to the city by highways (config.ts HIGHWAYS).

## Goal
Water guns become real guns: four guns with magazines and reloads, bullets that are hitscan rays from the CROSSHAIR (so what is under the crosshair is what gets hit, at any range), tracers, muzzle flashes and impact sparks. This fixes "I have to aim down to hit things": the old droplets left the gnome's hand along a tilted direction and fell.

## Read first
- games/gnome-theft-auto/src/types.ts: `Weapons` (the new contract, with its long doc comment), `Fx`, `HitTest`, `World`, `Box`.
- games/gnome-theft-auto/src/config.ts: `GUNS`, `GUN_ORDER`, `BULLET`, `GunSpec`.
- games/gnome-theft-auto/src/collide.ts: `insideBox(x, y, z, boxes)` (grid-accelerated).
- games/gnome-theft-auto/src/weapons.ts: a stub with the right shape. fx.ts: the existing water effects (keep them: officers and soaked gnomes still use splash/drip/spray) and three stub methods `tracer`, `flash`, `spark` to fill in.

## Change
- games/gnome-theft-auto/src/weapons.ts: implement `createWeapons(scene, fx): Weapons` exactly per the `Weapons` doc in types.ts.
  - State: `gun`, `ammo` (rounds in the magazine), `mag` (= GUNS[gun].mag), `reloading`; keep a separate ammo count per gun (a `Record<GunKind, number>`) so swapping guns does not refill them.
  - Held gun: `buildHeld(GUNS[gun].prefab)` from '@lawn/prefabs', added to the hand object, `position.set(0, -0.32, 0.02)`, `rotation.x = Math.PI` (the prefab's muzzle is +y; the player's right arm points along its local -y and is raised forward when firing, so this rotation makes the muzzle point forward). Rebuild it on `switchGun` and honour `setVisible`.
  - `switchGun()` goes to the next of `GUN_ORDER`, cancels any reload. `reload()` starts a reload of `GUNS[gun].reload` seconds if `ammo < mag` and not already reloading; at the end `ammo = mag`.
  - `update(dt, trigger, muzzle, camOrigin, camDir, hitTest, world)`: tick the cooldown and reload timers. A shot happens when the gun is not reloading, has ammo, the cooldown is 0 and (`spec.auto` ? trigger held : trigger just went from false to true; remember the previous trigger value). A shot uses one round, sets the cooldown to `1 / rate`, calls `fx.flash` at `muzzle`, and fires `spec.pellets` bullets. If the trigger is down with 0 rounds, start a reload; when a shot empties the magazine also start a reload.
  - A bullet: direction = `camDir` plus a random vector of length `spec.spread` (random unit vector, then normalise); start distance `t0 = max(0, (muzzle - camOrigin) . camDir)`, so the ray begins at the muzzle's depth and the gnome's own body is skipped. March `t` from `t0` to `t0 + spec.range` in steps of `BULLET.stepLength`: at each point p: if `p.y <= 0` it hits the ground; else if `insideBox(p.x, p.y, p.z, world.boxes)` it hits a wall; else if `hitTest(p.x, p.y, p.z)` it is a hit (count it, stop). On ground or wall hit call `fx.spark(p)` and stop; with no hit the bullet ends at range. Draw `fx.tracer` from `muzzle` to the end point; for a shotgun draw tracers for only the first 3 pellets. Return the number of bullets that hit something hittable.
  - Use module-level scratch `THREE.Vector3`s; do not allocate per bullet.
- games/gnome-theft-auto/src/fx.ts: keep `splash`, `drip`, `spray` as they are. Replace the three stubs: `tracer(ax, ay, az, bx, by, bz)` draws a thin bright line (colour `BULLET.tracerColor`, a stretched thin box mesh or a line, from a pool of 24 reused meshes, fading out over `BULLET.tracerLife` s, no allocation per call); `flash(x, y, z)` shows a small bright yellow sphere or two crossed quads for `BULLET.flashLife` s (pool of 4); `spark(x, y, z)` throws 6 small yellow-grey particles that fall and fade within 0.3 s (its own small pooled InstancedMesh, separate from the water particles). `update(dt)` ticks all of them.

## Contract
Provide exactly `createWeapons(scene: THREE.Scene, fx: Fx): Weapons` and `createFx(scene): Fx` with the interfaces already in types.ts. Do not change signatures.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` reports no error in weapons.ts or fx.ts.
- Reading your code, a bullet fired from camOrigin along camDir ends at the first thing under the crosshair (no gravity, no upward bias).

## Out of scope
types.ts, config.ts, main.ts (another issue wires it), camera.ts, hud.ts, audio.ts, every other file.

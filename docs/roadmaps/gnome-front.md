# Roadmap: gnome-front

## Goal

A prototype in `games/gnome-front/`: a first-person, large-team conquest shooter in the style of big-battle military FPS games, but on a back-yard lawn with gnomes. Two teams of 12 gnomes (Red Caps and Blue Caps; you plus 23 bots) fight over five flags. Holding more flags bleeds the other team's tickets; every death costs one. Ride the riding mowers (green, yellow, red) and the Combine from Lawn Gnome Panic to cross the map fast and run enemies over. Gnome and mower models are copied from `games/sample-3d` unchanged. Everything else is generated in code.

Question it answers: is a gnome-scale conquest match, with mowers as the vehicles, fun?

Stack: Vite 8.3.8, TypeScript 7.0.2, three 0.187.0, `@lawn/music`. Dev port 5182.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (written by the planner) | Scaffold, `config.ts` (all types and tuning), `terrain.ts`, copied models, `main.ts` frame loop, stubs for every file epic 2 fills in. Builds. | 0 (planner) |
| 2. Features | World, player+input, soldiers, combat, vehicles, bots, conquest, HUD, audio+README. Builds and plays end to end. | 8, parallel |
| 3. Playtest fixes | Planner runs it headless, fixes breakage. | planner |

No dependencies inside epic 2: each issue owns its files and talks to the others only through `src/config.ts` and the stub signatures.

| Issue | Changes |
|---|---|
| 2.1 world | src/world.ts |
| 2.2 player | src/input.ts, src/player.ts |
| 2.3 soldiers | src/soldiers.ts |
| 2.4 combat | src/combat.ts |
| 2.5 vehicles | src/vehicles.ts |
| 2.6 bots | src/bots.ts |
| 2.7 conquest | src/conquest.ts |
| 2.8 hud | src/ui/hud.ts |
| 2.9 audio | src/audio.ts, README.md |

Check for all: `npx tsc --noEmit -p .` from the game folder. No servers, no `vite build`, no output folders.

---

## Shared text (applies to every issue)

ENVIRONMENT:
- Repository root: /home/user/lawn-gnome-panic (Linux; node and npm are on PATH). Game folder: games/gnome-front. Run commands from the game folder.
- Dependencies are installed. Do not run npm install or add dependencies. three.js is version 0.187.0: `import * as THREE from 'three'`. TypeScript is strict.
- Seven other workers are editing other files in games/gnome-front at the same time. Change only the files your issue lists. These are read-only for everyone: src/config.ts, src/main.ts, src/terrain.ts, src/models/*.
- Every file in src/ that you do not own is a stub whose exported signatures will not change. Call those functions as described; their bodies may still be stubs while you work, so your code must compile against the signatures alone. Keep the exported signatures of your own files exactly as in their stubs (you may add non-exported helpers).
- Do not run `vite build` or `npm run build`, do not start a dev server, do not run git commit.
- `npx tsc --noEmit -p .` may show errors in files other workers are editing. Fix errors in your files only; report others.

CONVENTIONS (true everywhere):
- Units: a gnome is 1.4 units tall. y is up. The ground height is `heightAt(x, z)` from src/terrain.ts (also `normalAt(x, z, out?)`).
- Yaw: yaw 0 faces +z. Forward = (sin yaw, 0, cos yaw). Right = (-cos yaw, 0, sin yaw). Increasing yaw turns LEFT; turning right decreases yaw.
- Look direction with pitch (pitch + is up): (sin yaw * cos pitch, sin pitch, cos yaw * cos pitch).
- The camera has rotation.order 'YXZ'. To look along (yaw, pitch): camera.rotation.set(pitch, yaw + Math.PI, 0).
- A soldier's eye is at s.pos + (0, TUNING.eyeHeight, 0). s.pos is the feet. When driving, s.pos is kept at the vehicle seat by soldiers.ts.
- Gnome and mower models face +z at rotation.y = 0, base at y = 0.
- Game events go through game.emit(e) and game.on(fn); the GameEvent union is in src/config.ts.
- Frame order (src/main.ts): player.update, updateBots, updateVehicles, updateSoldiers, updateCombat, updateConquest, then hud.update and audio.update every frame (also while paused). game.time is seconds of play.

STUB SIGNATURES (other files, call as written):
```ts
// src/soldiers.ts
export function createSoldier(scene: THREE.Scene, opts: { id: number; team: Team; name: string; isPlayer: boolean; look: GnomeLook }): Soldier;
/** Moves a soldier on foot. wishX/wishZ: world-space wished direction, length 0..1. Handles gravity, ground, jumping, obstacle, vehicle and fence collision. Does not change yaw. */
export function moveSoldier(game: Game, s: Soldier, wishX: number, wishZ: number, sprint: boolean, jump: boolean, dt: number): void;
/** Applies damage. Kills at hp <= 0 (events, tickets, kill counts, vehicle ejection). Ignores dead soldiers and friendly fire. */
export function damageSoldier(game: Game, victim: Soldier, amount: number, attacker: Soldier | null, cause: DamageCause, headshot: boolean): void;
export function respawnSoldier(game: Game, s: Soldier): void;
export function updateSoldiers(game: Game, dt: number): void;
// src/combat.ts
/** Fires one rifle shot if the soldier can (alive, fireT <= 0, ammo > 0, not reloading). Returns true if fired. Ignores the shooter and the shooter's vehicle. */
export function tryFire(game: Game, s: Soldier, origin: THREE.Vector3, dir: THREE.Vector3): boolean;
export function startReload(game: Game, s: Soldier): void;
export function throwGrenade(game: Game, s: Soldier, origin: THREE.Vector3, dir: THREE.Vector3): boolean;
/** Distance along the ray to the first obstacle or the ground, or maxDist. */
export function raycastWorld(game: Game, origin: THREE.Vector3, dir: THREE.Vector3, maxDist: number): number;
/** True if no obstacle or terrain blocks the segment a-b. */
export function lineOfSight(game: Game, a: THREE.Vector3, b: THREE.Vector3): boolean;
export function updateCombat(game: Game, dt: number): void;
// src/vehicles.ts
export function createVehicles(scene: THREE.Scene): Vehicle[];
/** The closest alive, driverless vehicle within reach of a living soldier on foot, or null. */
export function nearestEnterable(game: Game, s: Soldier): Vehicle | null;
export function enterVehicle(game: Game, s: Soldier, v: Vehicle): void;
export function exitVehicle(game: Game, s: Soldier): void;
/** Sets this frame's control. Call every frame while driving; without a control this frame the vehicle brakes. */
export function driveVehicle(v: Vehicle, ctl: VehicleControl): void;
export function damageVehicle(game: Game, v: Vehicle, amount: number, by: Soldier | null): void;
export function updateVehicles(game: Game, dt: number): void;
// src/conquest.ts
export function createFlags(scene: THREE.Scene): FlagState[];
/** Where a team may spawn: its HQ first, then each flag it owns. */
export function spawnPoints(game: Game, team: Team): { x: number; z: number; yaw: number }[];
export function updateConquest(game: Game, dt: number): void;
// src/bots.ts
export function updateBots(game: Game, dt: number): void;
```
Types (`Game`, `Soldier`, `Vehicle`, `FlagState`, `Obstacle`, `GameEvent`, `InputState`, `Input`, `VehicleControl`, `DamageCause`, `Team`) and constants (`TUNING`, `RIFLE`, `GRENADE`, `VEHICLES`, `VEHICLE_SLOTS`, `FLAGS`, `BASES`, `TEAM_COLORS`, `TEAM_CSS`, `TEAM_NAMES`, `ARENA_HALF`, ...) are in src/config.ts. Read it first.

---

## Epic 2 issues

~~~~text
Issue 2.1: world
Epic: 2 Features
Depends on: none

## Environment
Shared text above (ENVIRONMENT, CONVENTIONS).

## Goal
src/world.ts builds the battlefield: a rolling lawn mesh that follows heightAt, sky lighting with sun shadows, a fence around the edge, landmarks at the five flags and both HQs, and scattered round cover, and returns every piece of cover as an Obstacle.

## Read first
- src/config.ts: ARENA_HALF, Obstacle, FLAGS, BASES, VEHICLE_SLOTS, GRASS_COLOR, TEAM_COLORS, TUNING.captureRadius
- src/terrain.ts: heightAt
- src/world.ts: the stub (keep `export function buildWorld(scene: THREE.Scene): Obstacle[]`)

## Change
- src/world.ts:
  - Ground: PlaneGeometry(2*ARENA_HALF + 80, same, 220, 220), rotateX(-Math.PI/2), set every vertex y = heightAt(x, z), computeVertexNormals. MeshStandardMaterial with vertexColors: grass colour GRASS_COLOR varied +-8% per vertex with a cheap hash, slightly lighter stripes every 6 units along x (a mowed-lawn look). receiveShadow = true.
  - Lights: HemisphereLight(0xdff3ff, 0x3d6b2a, 1.1); DirectionalLight(0xffffff, 2.2) at (60, 120, 40) with castShadow, shadow.mapSize 2048x2048, shadow camera left/right/top/bottom = -170/170/170/-170, near 1, far 400, bias -0.0005. Add the light and its target to the scene.
  - Fence: white picket fence (0xf2efe6) along all four edges at +-ARENA_HALF: posts every 3 units (BoxGeometry 0.25 x 2.2 x 0.25) plus two rails. Use one InstancedMesh for posts. y follows heightAt. Fences are not obstacles (soldiers.ts clamps to the arena).
  - Cover, scattered with a seeded PRNG (mulberry32 with seed 1234) so the map is the same every load: about 70 bushes (sphere clusters, colour 0x2f7a2f, obstacle r 1.6, h 2.2), 30 stones (DodecahedronGeometry, 0x9e9e9e, r 1.2, h 1.4), 20 flower pots (terracotta 0xc0613b cylinders with a red/yellow flower, r 0.9, h 1.3), 15 tree stumps (0x7a5230, r 1.1, h 1.0), 8 trees (trunk + big green cone/sphere crown; obstacle r 1.0 for the trunk, h 12). Reject a spot if within 14 units of a flag, 26 of a base, 6 of a vehicle slot, 8 of another obstacle, or 8 of the fence. Mesh y = heightAt at the spot. castShadow on all.
  - Flag landmarks (decor near, not on, each flag centre; keep a clear radius of TUNING.captureRadius around the centre except the item noted). Each solid piece returns an Obstacle:
    - A Birdbath (-75, 65): stone basin on a pedestal at the centre, obstacle r 1.2, h 1.6.
    - B Veggie Patch (70, 55): four raised soil beds 1.5 wide and 8 long around the flag, about 6 units out, with cabbages; each bed as 3 obstacles r 1.0, h 0.8 along its length.
    - C Fountain (0, 0): round fountain at the centre, basin r 2.5 (obstacle r 2.5, h 1.2) with a water disc (0x5ec8f2) and a spout.
    - D Shed (-70, -55): a wooden shed 8x6 with a sloped roof, placed 11 units west of the flag; approximate it with 4 obstacles r 2.0, h 4.
    - E Compost Heap (75, -65): a brown mound beside the flag (12 units east), obstacle r 3, h 2.
  - HQ decor at each BASES entry: a big tent or garden-gnome house in that team's TEAM_COLORS colour, 14 units behind the base point (away from the map centre, i.e. at z +-144), and two banner poles with team-coloured cloth. Tent is an obstacle (r 4, h 5).
  - Return the obstacles array.

## Contract
`export function buildWorld(scene: THREE.Scene): Obstacle[]`. Obstacle = { x, z, r, h } with h measured from heightAt(x, z).

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/world.ts
- buildWorld returns between 100 and 220 obstacles, none within 6 units of any VEHICLE_SLOTS entry.

## Out of scope
Every other file in src/.
~~~~

~~~~text
Issue 2.2: player and input
Epic: 2 Features
Depends on: none

## Environment
Shared text above (ENVIRONMENT, CONVENTIONS, STUB SIGNATURES).

## Goal
Keyboard and pointer-lock mouse input, and the local player's controls: first-person movement and shooting on foot, driving and a chase camera in a vehicle, a death camera, and a first-person rifle model.

## Read first
- src/config.ts: InputState, Input, Game, Soldier, Vehicle, TUNING (mouseSens, maxPitch, eyeHeight, chaseCamDistance, chaseCamHeight), RIFLE
- src/input.ts and src/player.ts: the stubs (keep their exported signatures)
- src/main.ts: how createInput, createPlayerController and pointer lock are used (main calls canvas.requestPointerLock() on Play; you do not)

## Change
- src/input.ts, `createInput(canvas: HTMLCanvasElement): Input`:
  - keydown/keyup on window using `e.code`: KeyW/ArrowUp forward, KeyS/ArrowDown back, KeyA/ArrowLeft left, KeyD/ArrowRight right, ShiftLeft/ShiftRight sprint, Tab scoreboard (preventDefault). Edge flags set on keydown when not e.repeat: Space jumpPressed, KeyR reloadPressed, KeyE usePressed, KeyG grenadePressed. preventDefault for Space and Tab.
  - mousedown/mouseup button 0 on window sets fire. mousemove adds e.movementX/e.movementY to mouseDx/mouseDy only while document.pointerLockElement === canvas.
  - pointerlockchange updates state.locked. On window blur clear every held key and fire.
  - endFrame() clears the four *Pressed flags and the mouse deltas (keep the stub's endFrame behaviour).
- src/player.ts, `createPlayerController(game: Game): PlayerController`, update(input, dt) with p = game.player:
  - Look (alive or not): p.yaw -= input.mouseDx * TUNING.mouseSens; p.pitch -= input.mouseDy * TUNING.mouseSens; clamp pitch to +-TUNING.maxPitch.
  - Dead (!p.alive): camera 7 units above the body and 6 units behind it (behind = -forward of p.yaw), looking at the body (camera.lookAt then nothing else); hide the rifle model; return.
  - On foot: wish = forward*(W-S) + right*(D-A) using the yaw vectors from CONVENTIONS, normalised if longer than 1. moveSoldier(game, p, wishX, wishZ, input.sprint && input.forward, input.jumpPressed, dt). Camera at the eye, camera.rotation.set(p.pitch, p.yaw + Math.PI, 0).
    - input.fire: dir = look direction; if tryFire(game, p, camera.position.clone(), dir) kick the rifle back (recoil) and add pitch += 0.004.
    - reloadPressed: startReload(game, p). grenadePressed: throwGrenade(game, p, eye, look dir).
    - usePressed: v = nearestEnterable(game, p); if v, enterVehicle(game, p, v).
  - In a vehicle (p.vehicle non-null): driveVehicle(p.vehicle, { throttle: (W?1:0) - (S?1:0), steer: (D?1:0) - (A?1:0) }). Mouse looks around freely. Chase camera: target = vehicle.pos + (0, vehicle.def.seatY + 1.2, 0); camera = target - lookDir * (TUNING.chaseCamDistance * (vehicle.def.kind === 'combine' ? 1.8 : 1)) + (0, TUNING.chaseCamHeight * 0.5, 0); keep camera y >= heightAt(camera x, z) + 0.6; camera.rotation.set(p.pitch, p.yaw + Math.PI, 0). Fire with tryFire from camera.position along the look dir (combat ignores your own vehicle). usePressed: exitVehicle(game, p). Hide the rifle model in a vehicle.
  - The first time a vehicle is entered, set p.yaw = vehicle.yaw so the camera starts behind it.
  - Rifle model: a THREE.Group added as a child of game.camera once (created in createPlayerController): wooden stock (0x8b5a2b box 0.08 x 0.1 x 0.5), dark barrel (cylinder r 0.025, length 0.5, along -z), a golden acorn (0xd4a017 sphere r 0.05 with a 0x6b4a2e cap) on top as the sight. Base position (0.22, -0.2, -0.45). Every frame ease it back to base; recoil pushes it +0.06 on z; walking bobs it (sin of distance walked, amplitude 0.015); while p.reloadT > 0 rotate it down 0.6 rad on x. Set every mesh's renderOrder 10 and material depthTest false so it never clips into walls. Visible only while alive and on foot.
- Do not touch p.model visibility (soldiers.ts owns it).

## Contract
`export function createInput(canvas: HTMLCanvasElement): Input` and `export interface PlayerController { update(input: InputState, dt: number): void }`, `export function createPlayerController(game: Game): PlayerController`, as in the stubs.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/input.ts or src/player.ts.

## Out of scope
Every other file in src/.
~~~~

~~~~text
Issue 2.3: soldiers
Epic: 2 Features
Depends on: none

## Environment
Shared text above (ENVIRONMENT, CONVENTIONS, STUB SIGNATURES).

## Goal
src/soldiers.ts gives soldiers real movement physics and collision, damage and death with tickets and kill counts, respawning at team spawn points, health regen, drivers riding on vehicle seats, and gnome model animation.

## Read first
- src/config.ts: Soldier, Vehicle, Game, GameEvent, TUNING, RIFLE, GRENADE, ARENA_HALF, DamageCause
- src/models/config.ts: PlayerState and GnomeModel (model.update(state, dt), model.setDead(bool))
- src/soldiers.ts: the stub (keep every exported signature; createSoldier is already complete)
- src/terrain.ts: heightAt

## Change
- moveSoldier(game, s, wishX, wishZ, sprint, jump, dt):
  - Ignore if !s.alive or s.vehicle. speed = sprint ? TUNING.sprintSpeed : TUNING.walkSpeed. Move s.vel.x/z towards wish*speed by at most TUNING.accel*dt (times TUNING.airControl when !s.grounded).
  - s.sprinting = sprint && wish length > 0.1.
  - Jump: if jump && s.grounded: s.vel.y = TUNING.jumpSpeed, s.grounded = false, s.jumpsUsed = 1, game.emit({ type: 'jump', soldier: s }).
  - Gravity: s.vel.y -= TUNING.gravity*dt. Integrate s.pos += s.vel*dt.
  - Ground: g = heightAt(x, z). If s.pos.y <= g: s.pos.y = g, s.vel.y = 0, grounded = true, jumpsUsed = 0. If grounded and not jumping and s.pos.y - g < 0.4 (walking downhill), snap to g. Otherwise grounded = false.
  - Obstacles: for each o in game.obstacles with s.pos.y < heightAt(o.x, o.z) + o.h: if horizontal distance < o.r + TUNING.soldierRadius, push s.pos out along the line from the centre and remove the velocity component into the obstacle. Landing on top: if s.pos.y is above the top minus 0.3 and falling, stand on it (pos.y = top, grounded).
  - Vehicles: same circle push-out for every alive vehicle (radius v.def.radius + TUNING.soldierRadius) when |s.pos.y - v.pos.y| < 3.
  - Clamp x and z to +-(ARENA_HALF - 1).
- damageSoldier(game, victim, amount, attacker, cause, headshot):
  - Ignore if !victim.alive, amount <= 0, or attacker && attacker !== victim && attacker.team === victim.team (no friendly fire; self damage from your own grenade is allowed).
  - victim.hp -= amount; victim.sinceDamageS = 0; game.emit({ type: 'hit', shooter: attacker, victim, damage: amount, headshot }).
  - If hp <= 0: hp = 0, alive = false, respawnT = TUNING.respawnS, deaths++, if attacker && attacker.team !== victim.team: attacker.kills++. game.tickets[victim.team] = Math.max(0, game.tickets[victim.team] - TUNING.deathTicketCost). If victim.vehicle: victim.vehicle.driver = null; victim.vehicle = null. victim.reloadT = 0. victim.model.setDead(true). game.emit({ type: 'kill', killer: attacker, victim, cause, headshot }).
- respawnSoldier(game, s): pts = spawnPoints(game, s.team) (import from './conquest'). Bots pick a random point (the HQ, pts[0], with 30% chance if flags are owned, else a random owned flag); the player picks the owned flag closest to the map centre (0,0), or the HQ if none. Offset randomly within 6 units, trying up to 8 times to find a spot not inside any obstacle (distance >= o.r + 0.6). Set pos (y = heightAt), vel 0, yaw = point.yaw, pitch 0, hp = TUNING.maxHp, alive = true, respawnT = 0, sinceDamageS = 99, vehicle = null, ammo = RIFLE.magSize, reserve = RIFLE.reserveAmmo, reloadT = 0, fireT = 0, grenades = GRENADE.count, grounded = true, jumpsUsed = 0, sprinting = false. model.setDead(false). game.emit({ type: 'spawn', soldier: s }).
- updateSoldiers(game, dt): for each soldier:
  - Dead: respawnT -= dt; if respawnT <= 0 and !game.over: respawnSoldier.
  - Alive: sinceDamageS += dt; if sinceDamageS >= TUNING.regenDelayS: hp = min(maxHp, hp + regenPerS*dt).
  - Driving (s.vehicle): s.pos = vehicle.pos + (0, vehicle.def.seatY, 0); s.vel set to 0; grounded = true.
  - Model: keep one reusable PlayerState per soldier (WeakMap) and fill it: position = s.pos, velocity = s.vel, facing = s.vehicle ? s.vehicle.yaw : s.yaw, grounded = s.grounded, jumpsUsed = s.jumpsUsed, sprinting = s.sprinting, stamina 1, staminaDelay 0, exhausted false. Call s.model.update(state, dt).
  - Visibility: s.model.object.visible = !(s.isPlayer && s.alive && !s.vehicle) (the player sees in first person on foot).

## Contract
The stub's exported signatures, unchanged. `spawnPoints(game: Game, team: Team): { x: number; z: number; yaw: number }[]` from './conquest' returns the HQ first, then owned flags.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/soldiers.ts.

## Out of scope
Every other file in src/.
~~~~

~~~~text
Issue 2.4: combat
Epic: 2 Features
Depends on: none

## Environment
Shared text above (ENVIRONMENT, CONVENTIONS, STUB SIGNATURES).

## Goal
src/combat.ts: hitscan acorn rifle with spread, headshots and tracers; reloads; thrown pinecone grenades that bounce and explode; static raycasts and line of sight; explosion visuals.

## Read first
- src/config.ts: RIFLE, GRENADE, TUNING (soldierRadius, soldierHeight, eyeHeight), Game, Soldier, Vehicle, Obstacle, GameEvent
- src/combat.ts: the stub (keep every exported signature)
- src/terrain.ts: heightAt

## Change
- raycastWorld(game, origin, dir, maxDist): nearest of (a) obstacles: 2D ray-circle intersection in xz using the horizontal part of dir; at the entry distance t, the ray's y must be below heightAt(o.x, o.z) + o.h, else no hit; (b) terrain: march in steps of 1 unit from 0 to maxDist; at the first sample where y < heightAt, bisect 6 times between the last two samples. Return the smaller distance, or maxDist.
- lineOfSight(game, a, b): d = a.distanceTo(b); return raycastWorld(game, a, (b - a)/d, d) >= d - 0.05.
- tryFire(game, s, origin, dir): return false unless s.alive, s.fireT <= 0, s.reloadT <= 0, s.ammo > 0. Set s.fireT = RIFLE.fireIntervalS, s.ammo--. Spread = RIFLE.spreadRad, x2 if s.sprinting, x1.5 if s.vehicle; perturb dir by a random direction within that cone and renormalise. Find the closest hit within RIFLE.range among:
  - the world (raycastWorld);
  - every alive soldier other than s: a vertical cylinder at (pos.x, pos.z), radius TUNING.soldierRadius, from pos.y to pos.y + TUNING.soldierHeight (2D ray-circle entry and exit, then accept if the ray's y at entry or anywhere between entry and exit lies inside the height range; use the entry point when it is inside, else the point where it crosses);
  - every alive vehicle other than s.vehicle: sphere centre pos + (0, def.radius * 0.6, 0), radius def.radius.
  Soldier hit: headshot = hitY - victim.pos.y > 1.05; damageSoldier(game, victim, RIFLE.damage * (headshot ? RIFLE.headshotMult : 1), s, 'rifle', headshot). Vehicle hit: damageVehicle(game, v, RIFLE.damage * RIFLE.vehicleDamageMult, s). Emit { type: 'shot', shooter: s, from: origin, to: hit point (or origin + dir*range) }. If s.ammo is now 0, startReload. Return true.
- startReload(game, s): if alive, reloadT <= 0, ammo < RIFLE.magSize and reserve > 0: reloadT = RIFLE.reloadS; emit { type: 'reload', soldier: s }.
- throwGrenade(game, s, origin, dir): if !s.alive or s.grenades <= 0 return false. grenades--. Spawn a pinecone (brown 0x6b4a2e cone, r 0.12, h 0.3, castShadow) at origin + dir*0.6 with velocity dir*GRENADE.throwSpeed + (0, 3, 0) + s.vel. Emit { type: 'grenadeThrown', thrower: s }. Return true.
- updateCombat(game, dt):
  - On first call only, subscribe with game.on: on 'shot' draw a tracer (THREE.Line from from + dir*1.2 to to, colour 0xffe08a, fades over 0.08 s, then removed and disposed) and a small grey puff at `to` (sphere r 0.15, fades 0.3 s); on 'explosion' draw a fireball (orange 0xff8a2a sphere growing from 0.3 to radius*0.6 over 0.35 s while fading, plus a dark smoke sphere rising and fading over 1 s).
  - Each soldier: fireT -= dt (min 0). If !alive: reloadT = 0. Else if reloadT > 0: reloadT -= dt; at <= 0, reloadT = 0, take = min(magSize - ammo, reserve), ammo += take, reserve -= take.
  - Grenades: gravity TUNING.gravity; bounce off the ground (pos.y < heightAt: pos.y = h, vel.y = -vel.y*0.35, vel.x/z *= 0.6) and off obstacles (push out, reflect horizontal velocity * 0.5); spin the mesh. After GRENADE.fuseS seconds: emit { type: 'explosion', pos, radius: GRENADE.radius }; every alive soldier whose chest (pos + 0.7 up) is within GRENADE.radius and has lineOfSight from the blast (pos + 0.3 up): damageSoldier(game, s, GRENADE.damage * (1 - d/radius), thrower, 'grenade', false); every alive vehicle within radius + v.def.radius: damageVehicle(game, v, GRENADE.vehicleDamage * (1 - max(0, d - v.def.radius)/radius), thrower). Remove and dispose the mesh.
  - Update and remove the fading visuals.
- Import damageSoldier from './soldiers' and damageVehicle from './vehicles'.

## Contract
The stub's exported signatures, unchanged.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/combat.ts.

## Out of scope
Every other file in src/.
~~~~

~~~~text
Issue 2.5: vehicles
Epic: 2 Features
Depends on: none

## Environment
Shared text above (ENVIRONMENT, CONVENTIONS, STUB SIGNATURES).

## Goal
src/vehicles.ts: the riding mowers and the Combine can be entered, driven over the hills, crash into cover, run enemy gnomes over, be shot and blown up, and respawn at home.

## Read first
- src/config.ts: VehicleDef, VEHICLES, VEHICLE_SLOTS, Vehicle, VehicleControl, Soldier, Game, TUNING (enterRange, soldierRadius), ARENA_HALF
- src/models/config.ts: MowerModel (group, setFlash(on), animate(dt, speed))
- src/vehicles.ts: the stub (keep every exported signature; createVehicles is already complete; v.id is its index in VEHICLE_SLOTS)
- src/terrain.ts: heightAt, normalAt

## Change
- nearestEnterable(game, s): null unless s.alive and !s.vehicle. Among vehicles with alive && !driver and horizontal distance(s.pos, v.pos) <= v.def.radius + TUNING.enterRange, return the closest.
- enterVehicle(game, s, v): v.driver = s; s.vehicle = v; v.team = s.team; emit { type: 'enterVehicle', soldier: s, vehicle: v }.
- exitVehicle(game, s): v = s.vehicle; return if null. v.driver = null; s.vehicle = null. Place s at v.pos + right * (v.def.radius + 1) (right = (-cos yaw, 0, sin yaw)), y = heightAt, s.vel = 0, s.grounded = true. Emit { type: 'exitVehicle', soldier: s, vehicle: v }.
- driveVehicle(v, ctl): store ctl in a module Map<number, VehicleControl> keyed by v.id.
- damageVehicle(game, v, amount, by): ignore if !v.alive or amount <= 0, or if by && v.driver && by.team === v.team (no friendly fire on a manned vehicle). hp -= amount; flash timer 0.08 s; emit { type: 'vehicleHit', shooter: by, vehicle: v, damage: amount }. At hp <= 0: alive = false, hp = 0, respawnT = def.respawnS, speed = 0, model.group.visible = false, emit { type: 'explosion', pos: v.pos.clone(), radius: def.radius * 2 } and { type: 'vehicleDestroyed', vehicle: v, by }. If it had a driver d: v.driver = null, d.vehicle = null, then damageSoldier(game, d, 999, by, 'wreck', false) (import from './soldiers').
- updateVehicles(game, dt), for each vehicle:
  - Dead: respawnT -= dt; at <= 0 respawn at home: pos (y = heightAt), yaw = home.yaw, speed 0, hp = maxHp, alive, team = VEHICLE_SLOTS[v.id].team, visible. Then skip.
  - If driver exists but is dead or driver.vehicle !== v: v.driver = null.
  - Control: ctl = map.get(v.id) if v.driver, else { throttle: 0, steer: 0 }. Clear the map at the end of updateVehicles.
  - Speed: throttle > 0: speed += def.accel*throttle*dt up to def.maxSpeed. throttle < 0: if speed > 0 brake by def.accel*2*dt, else speed -= def.accel*dt down to -def.maxSpeed/3. throttle 0: move speed towards 0 by def.accel*0.6*dt.
  - Steering: yaw -= ctl.steer * def.turnRate * dt * min(1, |speed| / 4) * sign(speed) (steer right decreases yaw; reversing flips it).
  - Move: pos += forward * speed * dt; pos.y = heightAt. Uphill slows: speed *= 1 - clamp(slope, 0, 1)*0.5*dt where slope = forward dot (-normal xz) ... keep it simple: subtract gravity's component: speed -= 9 * (heightAt(ahead) - heightAt(behind)) / 2 * dt, sampling 1 unit ahead and behind.
  - Collisions: obstacles (only where heightAt(o) + o.h > pos.y + 0.3): circle push-out of radius o.r + def.radius, and if it was moving into it, speed *= 0.3. The Combine (def.kind === 'combine') ignores obstacles with o.h < 2.5 (it rolls over hedges, pots and stones). Other alive vehicles: push both apart by half the overlap each (the Combine does not move for smaller vehicles; the other takes the whole push), speeds *= 0.5. Clamp to +-(ARENA_HALF - def.radius - 1).
  - Running over: if v.driver and |speed| >= 4, for each alive soldier s with !s.vehicle, s.team !== v.team, |s.pos.y - v.pos.y| < 2 and horizontal distance < def.radius + TUNING.soldierRadius, and no hit on that (vehicle, soldier) pair in the last 0.5 s: damageSoldier(game, s, def.runOverDamage * Math.min(1, |speed| / (0.6 * def.maxSpeed)), v.driver, 'roadkill', false), and if still alive knock it away (s.vel += forward * 6 + (0, 5, 0), s.grounded = false).
  - Model: group.position.copy(pos); orientation: quaternion that tilts up to normalAt(pos) multiplied by a yaw rotation (q = quat(up -> normal) * quat(axis y, yaw)); group.scale stays def.scale. model.animate(dt, |speed|). model.setFlash(flash timer > 0).

## Contract
The stub's exported signatures, unchanged. damageSoldier(game, victim, amount, attacker, cause, headshot) is in './soldiers'.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/vehicles.ts.

## Out of scope
Every other file in src/.
~~~~

~~~~text
Issue 2.6: bots
Epic: 2 Features
Depends on: none

## Environment
Shared text above (ENVIRONMENT, CONVENTIONS, STUB SIGNATURES).

## Goal
src/bots.ts: every non-player soldier plays conquest: heads for flags it does not own, fights enemies it can see, sometimes takes a mower or the Combine and drives it at flags and at enemy gnomes.

## Read first
- src/config.ts: Game, Soldier, Vehicle, FlagState, TUNING (botViewRange, botAimError, botReactionS, botVehicleChance, captureRadius, eyeHeight), GRENADE
- src/bots.ts: the stub (keep `export function updateBots(game: Game, dt: number): void`)

## Change
- Keep per-bot state in a Map<number, Brain> keyed by soldier id: { goal: FlagState | null; target: Soldier | null; seenS: number; thinkT: number; strafeDir: 1 | -1; strafeT: number; wantVehicle: boolean; lastPos: THREE.Vector3; stuckT: number; unstickT: number; unstickDir: number; lastSpawnTime }. Reset the brain when a 'spawn' event for that bot arrives (subscribe with game.on on the first call), rolling wantVehicle = Math.random() < TUNING.botVehicleChance.
- For each soldier with !isPlayer && alive:
  - Think every 0.25 s (thinkT): goal = nearest flag with owner !== s.team or with progress moving against the team (team 0 owns positive progress, team 1 negative); if every flag is owned, a random owned flag. target = nearest alive enemy within botViewRange that is either within 110 degrees of s.yaw's forward or within 15 units, and lineOfSight(eye, enemy chest at pos + 0.8) is true. If the target changed, seenS = 0.
  - seenS += dt while a target exists.
  - On foot:
    - If wantVehicle and goal is farther than 40 units, v = nearestEnterable(game, s); if v: enterVehicle(game, s, v) and continue to the next bot.
    - Desired yaw: towards the target if any, else towards the goal (if within captureRadius * 0.5 of the goal, wander: pick a random point inside the radius every 3 s). yaw = atan2(dx, dz). Turn s.yaw towards it at up to 6 rad/s (wrap the difference into -PI..PI). Pitch towards the target's chest.
    - Movement: with a target, strafe along right * strafeDir (flip every 1-2 s) plus 0.4 * forward if the target is farther than 25; without, forward. Sprint when no target and the goal is farther than 20.
    - Stuck: every 1.5 s, if it moved less than 0.8 units while trying to move, set unstickT = 1 and a random unstickDir; while unstickT > 0, move in that direction and jump once.
    - moveSoldier(game, s, wishX, wishZ, sprint, jump, dt).
    - Shooting: if target, seenS > TUNING.botReactionS and the angle between s.yaw and the target bearing < 0.15 rad: dir = normalised (target chest - eye) rotated by random error up to TUNING.botAimError on yaw and pitch; tryFire(game, s, eye, dir). Burst: fire for 0.6 s then pause 0.4 s (track with a timer).
    - Grenade: if target is 10-25 units away and s.grenades > 0, with probability 0.15 per second: throwGrenade(game, s, eye, direction to the target with +0.35 added to y, normalised).
    - If no target and s.ammo < 10: startReload.
  - In a vehicle (s.vehicle = v):
    - Aim point: the nearest enemy soldier on foot within 30 units whose bearing from v.yaw is within 60 degrees (run them over), else the goal flag.
    - err = wrap(atan2(dx, dz) - v.yaw); steer = -clamp(err * 2, -1, 1) (steer right decreases yaw); throttle = |err| > 1.6 ? 0.4 : 1; within 6 units of the goal flag: throttle 0.
    - Stuck: if |v.speed| < 1 for 2 s while throttle > 0, reverse (throttle -1, steer opposite) for 1.5 s.
    - At the goal (within captureRadius * 0.6): mowers (def.kind !== 'combine') exitVehicle(game, s) and wantVehicle = false; the Combine keeps circling (steer 0.6, throttle 0.5) until the flag is owned, then picks the next goal.
    - driveVehicle(v, { throttle, steer }) every frame. Also shoot targets from the seat as on foot (tryFire from the eye).

## Contract
`export function updateBots(game: Game, dt: number): void`. Uses moveSoldier (./soldiers); tryFire, startReload, throwGrenade, lineOfSight (./combat); nearestEnterable, enterVehicle, exitVehicle, driveVehicle (./vehicles). Signatures are in the shared STUB SIGNATURES.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/bots.ts.

## Out of scope
Every other file in src/.
~~~~

~~~~text
Issue 2.7: conquest
Epic: 2 Features
Depends on: none

## Environment
Shared text above (ENVIRONMENT, CONVENTIONS, STUB SIGNATURES).

## Goal
src/conquest.ts: five capturable flags with visuals, ticket bleed, spawn points, and the end of the match.

## Read first
- src/config.ts: FLAGS, FlagState, BASES, TUNING (captureRadius, captureRatePerS, maxCaptureAdvantage, bleedIntervalS), TEAM_COLORS, NEUTRAL_COLOR, Game, GameEvent, Team
- src/conquest.ts: the stub (keep every exported signature)
- src/terrain.ts: heightAt

## Change
- createFlags(scene): per FLAGS entry, at y = heightAt(x, z): a white pole (CylinderGeometry 0.08, height 6), a golden ball on top, a cloth (PlaneGeometry 1.8 x 1.1, DoubleSide, offset so its edge is on the pole), a ground ring (RingGeometry(captureRadius - 0.35, captureRadius, 48), rotated flat, 0.06 above the ground, transparent opacity 0.6), and a letter sprite above the pole (CanvasTexture with the flag id drawn in bold white, SpriteMaterial depthTest false, scale 1.6). Keep the visuals in a module Map keyed by flag id. Return FlagState[] with owner null, progress 0, contested false.
- spawnPoints(game, team): [BASES[team], ...each flag with owner === team as { x: f.def.x, z: f.def.z, yaw: BASES[team].yaw }].
- updateConquest(game, dt):
  - For each flag, count alive soldiers per team within captureRadius horizontally (drivers count). contested = both > 0. diff = n0 - n1. If diff !== 0: progress += Math.sign(diff) * Math.min(|diff|, TUNING.maxCaptureAdvantage) * TUNING.captureRatePerS * dt, clamped to -1..1.
  - Ownership: owner 0 and progress <= 0 -> owner null, emit { type: 'flagLost', flag, team: 0 }. owner 1 and progress >= 0 -> owner null, emit flagLost team 1. owner null and progress >= 1 -> owner 0, emit { type: 'flagCaptured', flag, team: 0 }; progress <= -1 -> owner 1, flagCaptured team 1.
  - Bleed: count owned flags per team. The team with fewer loses 1 ticket every TUNING.bleedIntervalS seconds (one module accumulator; reset it when the counts are equal). Tickets never go below 0.
  - End: if !game.over and a team's tickets <= 0: game.over = true, game.winner = the other team, emit { type: 'gameOver', winner }.
  - Visuals: colour = owner's TEAM_COLORS, or when owner is null, NEUTRAL_COLOR lerped towards the leading team's colour by |progress|. Apply to the cloth and the ring. Cloth height on the pole = 1.6 + 4 * |progress| (neutral flags sit low); wave the cloth with a small sin rotation. Ring opacity pulses while contested.

## Contract
The stub's exported signatures, unchanged.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/conquest.ts.

## Out of scope
Every other file in src/.
~~~~

~~~~text
Issue 2.8: hud
Epic: 2 Features
Depends on: none

## Environment
Shared text above (ENVIRONMENT, CONVENTIONS, STUB SIGNATURES). Repo rule: the shared #ui element is passed as root. Append your own containers to it; never restyle or hide #ui itself. #ui has pointer-events: none, so set pointer-events: auto on anything clickable.

## Goal
src/ui/hud.ts: the whole 2D interface in DOM: title and pause screens, crosshair and hit markers, health, ammo, tickets and flags, kill feed, capture and vehicle prompts, minimap, death screen, scoreboard and the end screen.

## Read first
- src/config.ts: Game, Soldier, FlagState, GameEvent, InputState, TEAM_CSS, TEAM_NAMES, NEUTRAL_CSS, TUNING, RIFLE, GRENADE, VEHICLES, FLAGS, ARENA_HALF, DOM_IDS
- src/ui/hud.ts: the stub (keep `Overlay`, `Hud` and `createHud(root, game, onPlay)` exactly; the element ids DOM_IDS.hud, DOM_IDS.title and DOM_IDS.play must exist after createHud)
- src/main.ts: how createHud, setOverlay and onPlay are used

## Change
- One container div#gf-hud (DOM_IDS.hud), absolutely positioned over the screen, plus one <style> element for your CSS (class names prefixed gf-). Chunky, readable, text-shadowed white text; team colours from TEAM_CSS.
- Title overlay div#gf-title (DOM_IDS.title), full screen dark translucent, pointer-events auto: "GNOME FRONT" big, tagline "Conquest on the lawn. 12 gnomes a side. Ride the mowers.", a controls list (WASD move, Mouse aim, Click fire, R reload, G pinecone grenade, Space jump, Shift sprint, E ride / hop off a mower, Tab scores, M mute music), and a button#gf-play (DOM_IDS.play) that calls onPlay. setOverlay('title') shows it with "PLAY", 'paused' shows it with the heading "PAUSED" and the button "RESUME", 'none' hides it.
- update(dt, input), every frame, with p = game.player:
  - Top centre: tickets "RED CAPS 150 | 148 BLUE CAPS" in team colours, and below them five flag pills A..E coloured by owner (NEUTRAL_CSS if none) with a fill bar for |progress| in the leading team's colour. If the player stands within TUNING.captureRadius of a flag, show "CAPTURING B" / "DEFENDING B" / "CONTESTED" under the pills.
  - Centre: a crosshair (4 small lines, gap grows while p.sprinting) shown while alive. Hit marker: on 'hit' events with shooter === game.player show a white X for 0.15 s (red when the hit was a kill: listen to 'kill' with killer === player too). On 'vehicleHit' by the player, same marker.
  - Bottom left: health bar (p.hp / TUNING.maxHp). When driving, a vehicle bar under it with p.vehicle.def.name and hp/maxHp.
  - Bottom right: "ammo / reserve" big, "RELOADING" while p.reloadT > 0, pinecone count (GRENADE.name) small.
  - Prompt centre-low: on foot with nearestEnterable(game, p) non-null: "Press E to ride the <def.name>"; driving: "E to hop off".
  - Kill feed, top right: the last 5 'kill' events for 6 s each: killer name, a verb by cause (rifle: "acorned", grenade: "pineconed", roadkill: "mowed down", wreck: "wrecked"), victim name, names coloured by team, "(HEADSHOT)" when headshot; "YOU" rows highlighted.
  - Toasts: 'flagCaptured' and 'flagLost' show "<TEAM_NAMES[team]> captured <flag name>" / "<flag name> lost" for 2.5 s, top centre under the flags.
  - Damage: when the player takes a 'hit', flash a red radial vignette (opacity by damage, fades over 0.5 s).
  - Death screen when !p.alive: "<killer name> <verb> you" (from the last kill event of the player) and "Respawning in N" from p.respawnT.
  - Minimap, bottom left above the health bar: a 170x170 <canvas>, north up (x right, +z down), whole arena scaled to fit. Draw flags as circles with letters in owner colour, alive teammates as dots in their team colour, alive enemies only within 40 units of the player, alive vehicles as small squares (team colour if driven, grey if empty), and the player as a white triangle pointing along (sin yaw, cos yaw).
  - Scoreboard while input.scoreboard: two columns, one per team, rows sorted by kills: name, kills, deaths.
  - End screen when game.over: "<TEAM_NAMES[winner]> WIN" (or "VICTORY" / "DEFEAT" big for the player's team), the player's kills and deaths, and a "PLAY AGAIN" button (pointer-events auto) that calls location.reload(). Call document.exitPointerLock() once when it appears.
- Import nearestEnterable from '../vehicles'.

## Contract
`export type Overlay = 'title' | 'paused' | 'none'`, `export interface Hud { update(dt: number, input: InputState): void; setOverlay(mode: Overlay): void }`, `export function createHud(root: HTMLElement, game: Game, onPlay: () => void): Hud`.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/ui/hud.ts.

## Out of scope
Every other file in src/. Do not edit index.html.
~~~~

~~~~text
Issue 2.9: audio and README
Epic: 2 Features
Depends on: none

## Environment
Shared text above (ENVIRONMENT, CONVENTIONS, STUB SIGNATURES).

## Goal
src/audio.ts plays synthesized sound effects for game events (louder when close to the camera), an engine hum while the player drives, and music from the shared @lawn/music package. README.md documents the game.

## Read first
- src/config.ts: Game, GameEvent, Soldier, Vehicle
- src/audio.ts: the stub (keep `GameAudio` and `initAudio(game)` exactly)
- ../sample-3d/src/audio.ts: an existing WebAudio sound file in this repo (tone() and noiseBurst() helpers to copy and adapt; read only)
- ../sample-3d/src/music/index.ts: how @lawn/music is started (read only)

## Change
- src/audio.ts, initAudio(game): returns { start, update }.
  - Create the AudioContext lazily in start() (it is called from a click) and resume it. Master gain 0.5.
  - Music: `import { buildRunTrack, isMuted, playSong, setMuteKey, setMuted } from '@lawn/music'`; call setMuteKey('gf-music-muted') at module load; in start(): `const seed = Math.floor(Math.random() * 2 ** 31); playSong((T, keep, out) => buildRunTrack(T, keep, out, seed));` (only the first time start() is called). Key M (window keydown, e.code === 'KeyM') toggles setMuted(!isMuted()).
  - SFX in game.on: volume = base * clamp(1 - distance(event position, game.camera.position) / 120, 0, 1); skip below 0.02. Event positions: shot -> from; explosion -> pos; others -> the soldier's / vehicle's pos.
    - shot: a short noise burst (0.06 s) through a bandpass around 1800 Hz plus a low thump (150 -> 60 Hz, 0.08 s). Player shots full volume; others limited to one sound per 30 ms overall.
    - hit with shooter === game.player: a high tick (1400 Hz, 0.04 s). hit with victim === game.player: a dull thud (200 -> 90 Hz).
    - kill with killer === game.player: a two-note ding (880 then 1320 Hz).
    - explosion: a long noise burst (0.6 s) through a lowpass sweeping 1200 -> 200 Hz, plus a 90 -> 30 Hz sine boom.
    - grenadeThrown: a quick whoosh (noise, highpass). reload by the player: two clicks 0.25 s and 1.4 s later. jump by the player: a soft blip. spawn of the player: a rising three-note arpeggio.
    - enterVehicle / exitVehicle by the player: engine-start rattle / a click.
    - flagCaptured: rising arpeggio if team === game.player.team, falling if not. flagLost of our team: falling two notes.
    - gameOver: a fanfare if winner === game.player.team, else a sad trombone (three falling sawtooth notes).
  - Engine in update(dt): while game.player.vehicle is non-null, one persistent sawtooth oscillator through a lowpass (800 Hz) and a gain of 0.05: frequency = (vehicle.def.kind === 'combine' ? 35 + 3 * |speed| : 60 + 7 * |speed|) Hz, plus a 2nd square oscillator an octave down at half the gain. Ramp the gain to 0 when not driving. Do nothing before start().
- README.md (games/gnome-front/README.md, new): title "Gnome Front", one paragraph: a gnome-scale conquest FPS where Red Caps and Blue Caps (12 a side, you plus bots) fight over five lawn landmarks; holding more flags drains the enemy's tickets; ride the green, yellow and red riding mowers or THE COMBINE from Lawn Gnome Panic to get around fast and run gnomes over. Then sections: Controls (WASD move, mouse aim, click fire, R reload, G pinecone grenade, Space jump, Shift sprint, E ride / hop off, Tab scoreboard, M mute music), Run and build (`npm run dev -w games/gnome-front` on port 5182, `npm run build -w games/gnome-front`, `?autoplay=1` skips the Play click), Tuning (src/config.ts: TUNING, RIFLE, GRENADE, VEHICLES, FLAGS, VEHICLE_SLOTS), and Reused from Lawn Gnome Panic (gnome and mower models copied unchanged into src/models/, terrain adapted, music from packages/music).

## Contract
`export interface GameAudio { start(): void; update(dt: number): void }`, `export function initAudio(game: Game): GameAudio`.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/audio.ts.
- games/gnome-front/README.md exists.

## Out of scope
Every other file in src/. Do not edit files in games/sample-3d.
~~~~

~~~~text
Issue 2.10: touch controls (mobile)
Epic: 2 Features (added later; runs alongside the others)
Depends on: none

## Environment
Shared text above (ENVIRONMENT, CONVENTIONS). Repo rule: root is the shared #ui element. Append your own container to it; never restyle or hide #ui itself. #ui has pointer-events: none, so set pointer-events: auto on your controls.

## Goal
A new file src/ui/touch.ts adds on-screen controls for phones and tablets. They write into the same InputState the keyboard and mouse use, so the player code needs no changes.

## Read first
- src/config.ts: InputState and Input (fields forward/back/left/right/sprint/fire held booleans; jumpPressed/reloadPressed/usePressed/grenadePressed one-frame flags; scoreboard held; mouseDx/mouseDy pixel deltas added per frame; Input.endFrame() clears the Pressed flags and the deltas after every frame)
- ../sample-3d/src/ui/touch.ts: an existing virtual joystick and look-drag in this repo (floating joystick base, pointer ids, CSS injection). Copy and adapt its approach; read only.

## Change
- src/ui/touch.ts (new):
  ```ts
  export interface TouchControls {
    /** True if the device has a coarse pointer or a touch has been seen. */
    readonly active: boolean;
    /** Show the controls only while the match is running. */
    setVisible(visible: boolean): void;
    /** Call once per frame before the player update: writes the joystick into input.state. */
    update(): void;
  }
  export function createTouchControls(root: HTMLElement, input: Input): TouchControls;
  ```
  - Container div.gft-root (fixed, inset 0, touch-action none, user-select none), one injected <style id="gft-style">, all class names prefixed gft-. Hidden (display none) unless active && visible. active starts as matchMedia('(pointer: coarse)').matches and becomes true on the first 'touchstart' on window.
  - Use Pointer Events (pointerdown / pointermove / pointerup / pointercancel) with pointer ids and setPointerCapture; call preventDefault in pointerdown so no mouse events are synthesized.
  - Left half of the screen: floating joystick (base 120 px, knob 56 px, travel 60 px, deadzone 0.12) appears where the finger lands. update() sets input.state.forward = y < -0.35, back = y > 0.35, left = x < -0.35, right = x > 0.35 (x right +, y down +, both -1..1), and sprint = y < -0.9. When the joystick is released set all five to false once (do not overwrite keyboard state every frame while the joystick is idle).
  - Right half (outside buttons): look drag. Add each pointermove's movementX/Y difference (track the last clientX/Y per pointer id) times 1.4 into input.state.mouseDx / mouseDy.
  - Round buttons on the right side, kept clear of the bottom-right 220 x 100 px corner (the HUD shows ammo there) and the bottom-left 200 x 300 px (minimap and health):
    - FIRE: 84 px, red, bottom 130px right 30px. Held: input.state.fire = true while pressed, false on release. A finger on FIRE may also drag to look (feed its movement into mouseDx/Dy like the look area), so you can aim while shooting.
    - JUMP (bottom 120px, right 130px), RELOAD (bottom 230px, right 30px), PINECONE (bottom 230px, right 130px), RIDE (bottom 330px, right 30px): 60 px; a tap sets jumpPressed / reloadPressed / grenadePressed / usePressed = true.
    - SCORES: small pill at top-left (top 12px left 12px), held sets scoreboard.
    - Pressed state: scale .92 and brighter.
  - setVisible(false) also releases everything (all held fields false, joystick hidden).

## Contract
The interface and function above, verbatim. The planner wires it into src/main.ts.

## Done when
- `npx tsc --noEmit -p .` shows no errors in src/ui/touch.ts.

## Out of scope
Every other file. Do not edit src/main.ts, src/input.ts, src/ui/hud.ts or index.html.
~~~~

---

## Result

- Epic 1: planner. Epic 2: 10 issues in parallel (2.10 touch controls was added mid-epic after a request for mobile play). No dependencies.
- End-of-epic fixes by the planner: wired touch controls into main.ts (no pointer lock on touch devices; controls hidden on the end screen), moved touch buttons that sat off-screen on short landscape phones, shrank the first-person rifle, added compact HUD/title CSS for short screens and touch-specific prompts.
- Headless checks: desktop autoplay and an emulated Pixel 7 (tap PLAY, joystick, look drag, RIDE) with no console errors from game code; a fast-forwarded match played to a game over (rifle, grenade, roadkill and wreck kills; flags changed hands; vehicles destroyed and respawned).
- Known: under a stalled headless renderer the shared @lawn/music package can throw Tone.js "Start time must be strictly greater" errors (packages/music, not this game).

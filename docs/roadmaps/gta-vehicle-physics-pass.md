# Gnome Theft Auto: vehicle physics pass (lane B)

Goal: vehicles stop passing through walls, each other and gnomes; stunt ramps launch the car along their surface; getting out of a
moving vehicle throws the gnome into a ragdoll while the car rolls on; vending machines hit at speed rock, settle upright and spill cans.

## Root causes found while planning

- **Collision tunnelling.** Every box check is one discrete `pushOutOfBoxes` after the whole frame's move. At boost speed
  (34 x 1.32 m/s) and the 0.05 s frame cap a vehicle moves 2.2 m per frame, more than a radius plus a fence's thickness, so
  its centre lands past the fence's middle and the push-out sends it out of the far side. Same for vehicle-vs-vehicle
  (one overlap test after both moved: a head-on pair crosses centres and is pushed apart the wrong way) and vehicle-vs-gnome
  (a point test per frame).
- **Sticky walls.** Any box contact multiplies the speed by 0.35 every frame (`vehicles.ts moveVehicle`, `simdrive.ts`), so a
  glancing scrape stops the car dead, and crash damage is charged from the full speed every frame of a scrape.
- **Run-over height bug.** `npcs.ts` skips vehicles with `v.y > 1.5` (absolute height), so on any hill above 1.5 m no gnome
  is ever run over. `police.ts` already uses `aboveGround`.
- **Ramps.** The default driving model is the @lawn/vehicle chassis (`simdrive.ts`), whose wheels ray-cast `terrainProbe()`:
  the ramp wedge is only a mesh, not ground, and `writePose` resets `v.y` to the terrain every frame, so the sim car drives
  straight through it. Under Arcade, `stunts.ts` lifts the car only above 9 m/s, integrates its own gravity on top of
  `vehicles.ts` gravity, and launches with `speed * 0.52 + 4.5` straight up rather than along the slope. Ramps also have no
  side or lip walls.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 1. Foundation (planner) | `npx tsc --noEmit -p games/gnome-theft-auto` passes with `World.vending`, the `Player` ragdoll methods (stubbed in player.ts), `src/bail.ts` and `src/vending.ts` stubs, and app.ts wired to them | done by the planner |
| 2. Physics pass | build + `npm test -w games/gnome-theft-auto` + prefabs and achievements tests pass | 5 parallel (2A-2E) |

Epic 1 (planner, committed): `types.ts` (`VendingSpot`, `World.vending`, `Player.ragdolling / throwFrom / ragdoll / updateRagdoll`),
`world.ts` (`scatterVendingMachines` returns the spots), stubs `src/bail.ts`, `src/vending.ts`, player.ts stub methods, and
app.ts wiring: `getOut` bails via `shouldBail / bailVelocity / player.throwFrom / startCoast`, a `player.ragdolling` branch in
the frame, `stepCoasting` before `collideVehicles`, `createVending(...)` + `vending.update(dt, vehicles)`, a fast NPC vehicle
hitting the on-foot player calls `player.ragdoll`, achievements `gta-bail-out` and `gta-cola-jackpot` unlocked from app.ts.

Online: the bail and the ragdoll are local; the pose broadcast already switches to on-foot when the gnome leaves the
vehicle, and ambient vehicles are not synced, so remote players see the gnome leave and the car stop where it was. Vending
wobble and cans are local per browser, like the destructibles.

## Shared environment text (pasted into every issue)

~~~~text
## Environment
- Working directory: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a38456ec17ac433c0 (a git worktree). Run
  every command from there. Git Bash: if node is missing, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run npm install. Do not commit. Do not start a dev server.
- Four other workers edit other files of games/gnome-theft-auto at the same time. Edit ONLY the files your issue lists.
  `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files you do not own while they are mid-edit: ignore
  those, fix yours.
- Run single test files from the game folder: `cd games/gnome-theft-auto && npx vitest run src/<file>.test.ts`.
- The game: three.js, TypeScript. Units are metres, y is up, yaw 0 faces +z, forward = (sin yaw, cos yaw), the driver's
  left = (cos yaw, -sin yaw). `heightAt(x, z)` (src/terrain.ts) is the ground height; `aboveGround(x, y, z)` = y - ground.
~~~~

## Epic 2: physics pass

~~~~text
Epic: 2 Physics pass. Issue 2A: swept vehicle collision (boxes and vehicle pairs)
Depends on: none

(Environment: paste of the shared environment text above.)

## Goal
Vehicles never tunnel through walls, fences or each other at any speed or frame time (dt up to 0.05 s), and a glancing wall
hit slides along the wall instead of stopping the car dead. Crash damage is charged from the speed INTO the wall.

## Read first
- games/gnome-theft-auto/src/collide.ts (whole file, 115 lines): `Pushed`, `pushOutOfBoxes`, `clampToWorld`, the grid.
- games/gnome-theft-auto/src/vehicles.ts lines 420-450 (`moveVehicle`) and 540-690 (`groundVel`, `kick`, `collideVehicles`, `stepKnock`).
- games/gnome-theft-auto/src/simdrive.ts lines 120-160 (`stepSimDrive`): the "Buildings and the world edge" block.
- games/gnome-theft-auto/src/bump.test.ts and collide.test.ts: test style.

## Change
1. collide.ts
   - `Pushed` becomes `{ x: number; z: number; hit: boolean; nx: number; nz: number }`: (nx, nz) is the unit direction the
     circle was last pushed (the wall normal, pointing out of the box); (0, 0) when hit is false. Set it in pushOutOfBoxes
     (from the push of the last box that pushed) and clampToWorld (pointing back inside).
   - New `export function sweepCircleBoxes(x0: number, z0: number, x1: number, z1: number, r: number, boxes: readonly Box[], y = 0): Pushed`
     Move a circle from (x0, z0) to (x1, z1) in n = clamp(ceil(dist / (0.4 * r)), 1, 32) equal substeps; after each substep
     call pushOutOfBoxes. When a substep hits, remember its normal and remove the into-wall part of the REMAINING
     displacement (d -= min(0, d . n) * n) so the circle slides along the wall. Return the final position, hit = any
     substep hit, and the last normal.
   - New `export function wallBounce(vx: number, vz: number, nx: number, nz: number, restitution = 0.15, friction = 0.92): { vx: number; vz: number; impact: number }`
     vn = vx*nx + vz*nz. If vn >= 0: return the velocity unchanged with impact 0. Else tangent t = v - vn*n; result =
     t*friction - restitution*vn*n; impact = -vn (the speed into the wall).
2. vehicles.ts
   - moveVehicle: remember (x0, z0) before the move; after computing the new (x, z), call
     `sweepCircleBoxes(x0, z0, v.x, v.z, v.spec.radius, world.boxes, v.y)`. On hit: velocity
     vel = (sin yaw * speed + slideX, cos yaw * speed + slideZ); b = wallBounce(vel.x, vel.z, nx, nz); v.speed = b.vx*sin yaw +
     b.vz*cos yaw; slideX = slideZ = 0; play('bump') when the player drives and b.impact > 6; damage only when
     b.impact > CRASH_MIN: damageVehicle(v, (b.impact - CRASH_MIN) / CRASH_SCALE). Keep clampToWorld and the grounded snap.
   - stepKnock: sweep from the pre-move position too; on hit replace k.x/k.z with wallBounce(k.x, k.z, nx, nz) (do not zero them).
   - collideVehicles gains `dt = 1 / 60` as a second parameter (`export function collideVehicles(list: Vehicle[], dt = 1 / 60): void`).
     Per pair: p1 = (b.x - a.x, b.z - a.z) now; va, vb = groundVel(a), groundVel(b); p0 = p1 - (vb - va) * dt (the
     relative position at the start of the frame). The pair is in contact when |p1| < rr OR the closest distance of the
     segment p0 -> p1 to the origin is < rr (they passed through each other this frame). Contact normal n (from a to b):
     unit(p0) when p0 . p1 < 0 or |p1| < 1e-6 (centres crossed), otherwise unit(p1). sep = p1 . n; overlap = rr - sep; push
     apart along n by the mass shares exactly as now; then the existing impulse, spin and damage code with that n. Keep
     the height check (|a.y - b.y| >= 1.5 skips) and everything else unchanged.
3. simdrive.ts (ONLY the box block of stepSimDrive; another lane owns the rest of this file, so change nothing else):
   - Just before `sd.ctrl.update(dt, {`, add `const x0 = body.pos.x, z0 = body.pos.z;`.
   - Replace the block from `// Buildings and the world edge` through the closing brace of `if (pushed.hit) { ... }` with:
     sweep `sweepCircleBoxes(x0, z0, body.pos.x, body.pos.z, v.spec.radius, world.boxes, heightAt(body.pos.x, body.pos.z))`;
     on hit: body.pos.x/z = the result; b = wallBounce(body.vel.x, body.vel.z, nx, nz); body.vel.x = b.vx; body.vel.z = b.vz;
     body.angVel.y *= 0.6; play('bump') if b.impact > 6; damageVehicle(v, (b.impact - CRASH_MIN) / CRASH_SCALE) if
     b.impact > CRASH_MIN. Keep the clampToWorld lines after it unchanged. Update the import from './collide'.
4. collide.test.ts: add tests (keep the existing ones):
   - a circle r = 0.9 starting 1.2 m in front of a 0.2 m thick wall (box h = 3) and moved 2.6 m through it in one sweep ends
     on the near side (pushOutOfBoxes alone, from the same end point, ends on the far side: assert that too, it documents the bug);
   - moving diagonally at 45 degrees into a long wall keeps at least 60% of the along-wall progress;
   - wallBounce: head-on 20 m/s gives impact 20 and |v| <= 3.1; a 10-degree glancing hit at 20 m/s keeps > 17 m/s; moving
     away from the wall is unchanged with impact 0.
5. bump.test.ts: add tests (keep the existing ones, they must still pass):
   - two ride-ons head-on at 30 m/s each, starting 6 m apart, run with dt = 0.05 (pass dt to collideVehicles in the test's
     own loop) never end up with their order along z swapped;
   - an arcade vehicle (driver 'player', no sim) at 40 m/s driven by `stepVehicle` from vehicles.ts with throttle 1 for
     1 s, dt 0.05, at a 0.3 m thick wall box (h 3) 5 m ahead, never gets past the wall. Use a world
     `{ boxes: [wall], half: 600 } as unknown as World` and `createVehicle` is NOT needed: build the vehicle with the
     test's `make()` helper. If stepVehicle needs more fields (surface lookups), mock what is needed with vi.mock or test
     moveVehicle behaviour through stepVehicle with `make()` fields filled in; if that proves impossible, test the sweep
     at the collide.ts level instead and say so in your report.

## Contract
- `Pushed`, `sweepCircleBoxes`, `wallBounce` exactly as above (other files import pushOutOfBoxes / clampToWorld and read
  only x, z, hit: keep those working).
- `collideVehicles(list: Vehicle[], dt = 1 / 60): void` (main will pass dt).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in collide.ts, vehicles.ts, simdrive.ts or your tests.
- `cd games/gnome-theft-auto && npx vitest run src/collide.test.ts src/bump.test.ts src/terrainDrive.test.ts src/handling.test.ts` passes.

## Out of scope
Every other file. In particular stunts.ts, player.ts, bail.ts, vending.ts, npcs.ts, police.ts, app.ts, traffic.ts.
~~~~

~~~~text
Epic: 2 Physics pass. Issue 2B: stunt ramps are ground (launch along the surface) and solid at the sides and lip
Depends on: none

(Environment: paste of the shared environment text above.)

## Goal
Driving up any of the 12 stunt ramps (`STUNT_RAMPS` in stunts.ts) lifts the vehicle along the slope and launches it off the
lip along the slope direction, under both driving models: the physics chassis (default; `v.sim` set) and Arcade (`v.sim`
undefined). Hitting a ramp from the side or the tall lip end is a wall, not a pass-through. Stunt bonuses still pay out.

## Background (root cause)
- The default driving model is @lawn/vehicle's `VehicleController` (games/gnome-theft-auto/src/simdrive.ts). Its wheels
  ray-cast `ctrl.ground` (a `GroundProbe`, created as `terrainProbe()` from terrain.ts) straight down along the body's own
  down axis from mount points inside the hull. The ramp is only a mesh, so the rays never see it and the car drives through.
  `ctrl.ground` is a public, writable field: wrap it so the rays also hit ramp tops. `writePose` sets `v.y` to the terrain
  every frame under the sim, so do not use v.y for the sim; the chassis base height is `v.sim.py`, the chassis body is
  `v.sim.ctrl.body` ({ pos, vel, angVel, quat }), and `v.sim.ctrl.telemetry.groundedWheels` counts wheels touching ground.
- Under Arcade, vehicles.ts `stepOther` already applies gravity 22 m/s^2 to `v.y` while `v.y > heightAt(...)` or `v.vy > 0`,
  so stunts.ts must NOT integrate gravity itself (it currently does, twice the gravity) and must lift the car at any speed
  (it currently only does above 9 m/s).

## Read first
- games/gnome-theft-auto/src/stunts.ts (whole file): StuntRamp, STUNT_RAMPS, rampElevationAt, createStunts().update.
  The wedge mesh: local +z (ramp.yaw direction) is the tall lip, it rises linearly from 0 at along = -length/2 to `height`
  at along = +length/2, and sits on the terrain (`addGroundToGeometry`), so the surface height is
  heightAt(x, z) + rampElevationAt(ramp, x, z).
- packages/vehicle/src/ground.ts: `GroundProbe { cast(origin, dir, maxDist): GroundHit | null }`, `GroundHit { distance, normal, point, velocity? }`, `flatGround`.
- games/gnome-theft-auto/src/terrain.ts: `heightAt`, `aboveGround`, `terrainProbe` (around line 360).
- games/gnome-theft-auto/src/bump.test.ts lines 80-95: how a test builds a `VehicleController` with `vehicleConfig(spec, tuneById(DEFAULT_MODE_ID)!)`.
- games/gnome-theft-auto/src/stunts.test.ts: existing tests (update the ones whose behaviour changes).

## Change
1. New games/gnome-theft-auto/src/ramps.ts (pure, no three.js):
   - `export interface RampContact { ramp: StuntRamp; along: number; across: number; elev: number; surfaceY: number }`
   - `export function rampContactAt(x: number, z: number): RampContact | null` - over a ramp footprint (|across| <= width/2,
     |along| <= length/2): along/across in the ramp frame (forward = (sin yaw, cos yaw), right = (cos yaw, -sin yaw)),
     elev = rampElevationAt, surfaceY = heightAt(x, z) + elev. Loop STUNT_RAMPS (12 entries; no index needed).
   - `export function rampSlope(ramp: StuntRamp): number` = atan2(height, length).
   - `export function rampNormal(ramp: StuntRamp): { x: number; y: number; z: number }` = unit vector of
     (-sin(yaw) * k, 1, -cos(yaw) * k), k = height / length (tilted back, away from the lip).
   - `export function rampGroundProbe(base: GroundProbe): GroundProbe` - cast: h0 = base.cast(...). Ramp hit: for a ray with
     dir.y < -0.2 whose origin is inside or near a footprint, solve origin.y + dir.y*t = surfaceY(origin + dir*t) by
     fixed-point iteration (t = (origin.y - surf(p)) / -dir.y, 4 iterations, starting at p = origin). Accept when 0 <= t <=
     maxDist, the hit point is inside a footprint, and origin.y >= surfaceY at the origin - 0.05 (a ray starting BELOW the ramp
     top - a wheel beside a tall side - does not hit it). Return { distance: t, normal: rampNormal(ramp), point }. Return
     whichever of the ramp hit and h0 is nearer.
   - `export function attachRampGround(ctrl: { ground: GroundProbe }): void` - wrap ctrl.ground once: keep a WeakSet of
     probes made by rampGroundProbe; if ctrl.ground is already one of them do nothing.
   - `export function pushOutOfRampSides(x: number, z: number, r: number, baseY: number): { x: number; z: number; hit: boolean; nx: number; nz: number }`
     For each ramp: the circle overlaps the footprint rectangle grown by r, AND at the footprint point nearest the circle
     centre (clamp along/across into the footprint) the surfaceY is more than 0.5 above baseY (the vehicle is below the top,
     so it meets a wall). Then push the centre out through the nearest of the left side, the right side, or the lip end
     (along = +length/2), never the low entry end; (nx, nz) is that face's outward world normal. Otherwise hit = false and
     (x, z) unchanged.
2. stunts.ts: keep the exports (STUNTS_STORAGE_KEY, StuntRamp, STUNT_RAMPS, StuntJumpEvaluation, rampElevationAt,
   evaluateStuntJump, createStunts and its returned object's update/completedCount/totalCount/blips with the same
   signatures). Rewrite update(dt, player, vehicles) for the player's vehicle v (skip and reset when none, a flyer, or a boat):
   - Walls (both models): baseY = v.sim ? v.sim.py : v.y; s = pushOutOfRampSides(v.x, v.z, v.spec.radius, baseY). On hit:
     - sim: dx = s.x - v.x, dz = s.z - v.z; body.pos.x += dx; body.pos.z += dz; v.x = s.x; v.z = s.z; v.sim.lastX = v.x;
       v.sim.lastZ = v.z; remove the into-wall part of body.vel (vn = vel . n; if vn < 0: vel -= vn * n, x and z only).
     - arcade: v.x = s.x; v.z = s.z; vel = (sin yaw, cos yaw) * v.speed; same removal; v.speed = vel . (sin yaw, cos yaw).
   - Sim: attachRampGround(v.sim.ctrl) every frame (idempotent). Track `lastRamp` (the ramp id under the car, from
     rampContactAt(v.x, v.z)) and `sinceRamp` seconds since it was last on one. A jump starts when groundedWheels becomes 0
     while sinceRamp < 0.35 and |v.speed| >= 6; it lands when groundedWheels > 0 again after at least 0.15 s of air. Do not
     write v.y or v.vy for the sim.
   - Arcade: on a footprint (rampContactAt not null) and moving forward along the ramp (dot of (sin yaw, cos yaw) * sign(speed)
     with the ramp's forward > 0.3) and v.y <= surfaceY + 0.3: set v.y = surfaceY and v.vy = 0 (any speed). The frame the car
     leaves the footprint through the lip end (previous frame on it with elev >= 0.8 * height, now off it) with |speed| >= 6:
     v.vy = |speed| * sin(rampSlope(ramp)) * RAMP_LAUNCH.arcadeBoost and start the jump. No gravity here. Land when
     aboveGround(v.x, v.y, v.z) <= 0.05 and v.vy <= 0.
   - `export const RAMP_LAUNCH = { arcadeBoost: 1.15 } as const;` in stunts.ts.
   - While a jump is active accumulate airTime and yawDelta exactly as today; on landing run the existing evaluateStuntJump /
     economy / confetti / toast / callout / jumpJustLanded code unchanged.
   - Return `{ airborne: jump active, jumpJustLanded }`.
3. New games/gnome-theft-auto/src/ramps.test.ts:
   - a straight-down cast from 2 m above a ramp's centre hits at surfaceY (distance = origin.y - surfaceY within 0.02) with a
     normal tilted back; a cast outside every footprint equals the base probe's; a cast starting below the ramp top (beside
     the lip, origin.y = heightAt + 0.5 at a point 0.3 m inside the footprint near the lip) does not hit the ramp;
   - pushOutOfRampSides: a circle beside the middle of a ramp at ground height is pushed out sideways; just past the lip
     facing back is pushed out of the lip end; at the low entry end it is not pushed; a circle whose baseY is on the ramp
     top is not pushed;
   - integration (the bug): a VehicleController (`new VehicleController(vehicleConfig(VEHICLES['zero-turn'], tuneById(DEFAULT_MODE_ID)!), { ground: rampGroundProbe(terrainProbe()) })`)
     placed 8 m before a ramp's entry end on its centre line facing ramp.yaw at 18 m/s (`ctrl.place(v3(x, heightAt(x, z), z), ramp.yaw, 18)`)
     and run 3 s at dt 1/60 with throttle 0.6 reaches a chassis height (body.pos.y - heightAt under it) above 1.5 m and ends
     more than length/2 + 8 m past the ramp centre along the ramp's forward. Pick a ramp on flattish ground (e.g.
     'greenhouse-neon'); without the ramp probe (plain terrainProbe) the max height stays below 0.8 (assert that too).
4. stunts.test.ts: update tests that assumed the old launch (speed >= 9, own gravity); keep the rest passing.

## Contract
- ramps.ts exports exactly as listed. stunts.ts keeps its existing export names and signatures.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in ramps.ts, stunts.ts or their tests.
- `cd games/gnome-theft-auto && npx vitest run src/ramps.test.ts src/stunts.test.ts` passes.

## Out of scope
Every other file: vehicles.ts, simdrive.ts, terrain.ts, app.ts, collide.ts, player.ts, bail.ts, vending.ts, npcs.ts.
~~~~

~~~~text
Epic: 2 Physics pass. Issue 2C: bail out of a moving vehicle (player ragdoll + driverless coasting)
Depends on: none

(Environment: paste of the shared environment text above.)

## Goal
Getting out of a ground vehicle moving at 7 m/s or more throws the player's gnome out as a ragdoll carrying the vehicle's
velocity; it tumbles, settles and gets up. The vehicle keeps rolling with no driver and coasts to a stop. The player can
also be knocked into a ragdoll on foot. (main/app.ts is already wired: it calls shouldBail/bailVelocity/player.throwFrom/
startCoast in getOut, player.updateRagdoll while player.ragdolling, stepCoasting(vehicles, dt, world) every frame, and
player.ragdoll(vx, vy, vz) when a fast vehicle hits the gnome on foot. Exit is the existing Enter/Exit key and touch button,
so touch works with no change.)

## Read first
- games/gnome-theft-auto/src/bail.ts (stub with the final signatures and docs) - you fill it in.
- games/gnome-theft-auto/src/player.ts (whole file, ~395 lines): the stub methods throwFrom/ragdoll/updateRagdoll near the
  top of the `p` object, `bail`, `exit`, `respawn`, `enter`, `upright()`, `clearHands`, the `canopy`, `seatWorld`.
- games/gnome-theft-auto/src/ragdoll.ts: createRagdoll(x, y, z, yaw, vx, vz), impulse(r, vx, vy, vz, spin), stepRagdoll(r, dt, boxes),
  ragdollCentre(r, out), poseRagdoll(model, r), resetPose(model); Ragdoll has `age` and `still` (seconds nearly at rest).
- games/gnome-theft-auto/src/npcs.ts lines 231-268 (knockNpc / tickRagdoll): the NPC version of the same thing.
- games/gnome-theft-auto/src/types.ts: `Player` (ragdolling, throwFrom, ragdoll, updateRagdoll docs), `Vehicle`, `InputState`.
- games/gnome-theft-auto/src/simdrive.ts: `stepSimDrive(v, sd, inp: InputState, dt, world): boolean`, `createSimDrive(v)`.
- games/gnome-theft-auto/src/vehicles.ts: `stepVehicle(v, { throttle, steer, lift }, dt, world)`.

## Change
1. player.ts (replace the three stub methods; keep everything else working):
   - private `let rag: Ragdoll | null = null;` and helper `startRag(vx, vy, vz)`: rag = createRagdoll(p.x, p.y, p.z, p.yaw, 0, 0);
     impulse(rag, vx, vy, vz, 1.2 + Math.min(1.5, Math.hypot(vx, vz) * 0.05)); p.ragdolling = true; p.grounded = false; p.vy = 0.
   - throwFrom(v, vx, vy, vz): upright(); clearHands(model); seatWorld(v, pos, p.seat) and copy pos into p.x/y/z; p.yaw = v.yaw;
     p.vehicle = null; p.seat = 0; p.airborne = false; p.chute = 0; canopyOpening = false; canopy.visible = false;
     p.hurt(Math.min(0.2, Math.hypot(vx, vz) * 0.006)); startRag(vx, vy, vz).
   - ragdoll(vx, vy, vz): if p.ragdolling && rag: impulse(rag, vx, vy, vz, 1.2); else { upright(); clearHands(model); startRag(vx, vy, vz) }.
   - updateRagdoll(dt, world): if !rag { p.ragdolling = false; return }. stepRagdoll(rag, dt, world.boxes); ragdollCentre into
     a reused object; clamp x/z with clampToWorld(c.x, c.z, world.half, PLAYER.radius); p.x/p.z = clamped; p.y = heightAt(p.x, p.z);
     poseRagdoll(model, rag); canopy.visible = false. Get up when (rag.still > 1.0 && rag.age > 0.8) || rag.age > 6:
     rag = null; resetPose(model); upright(); p.ragdolling = false; p.vy = 0; p.grounded = true;
     p.y = groundHeight(p.x, p.z, PLAYER.radius * 0.75, world.boxes, p.y + 0.5); model.object.position.set(p.x, p.y, p.z);
     arms rotation reset to 0 like exit() does.
   - respawn(), exit(), enter(), bail(): if rag is set, clear it (rag = null; p.ragdolling = false; resetPose(model)) first.
2. bail.ts (keep every exported name and signature; BAIL may gain fields):
   - BAIL = { minSpeed: 7, carry: 0.9, upKick: 3.5, sideKick: 2.5, stopSpeed: 0.4, maxCoast: 30 }.
   - shouldBail(v): !v.spec.flies && !v.spec.boat && !v.exploded && !v.sunk && Math.abs(v.speed) >= BAIL.minSpeed.
   - bailVelocity(v): ground velocity = v.sim ? (v.sim.ctrl.body.vel.x, .z) : (sin yaw * speed + (slideX ?? 0), cos yaw * speed + (slideZ ?? 0));
     result = ground velocity * BAIL.carry + driver's-left (cos yaw, -sin yaw) * BAIL.sideKick, vy = BAIL.upKick.
   - Module-level `const coasting = new Map<Vehicle, number>()` (vehicle -> seconds coasted).
   - startCoast(v): v.driver = 'none'; v.boostActive = false; keep v.speed and v.sim (the momentum); coasting.set(v, 0).
   - isCoasting(v): coasting.has(v).
   - stepCoasting(vehicles, dt, world): for each coasting v (vehicles is accepted for symmetry; iterate the map): if
     v.driver !== 'none' (someone took it; leave its sim alone) or v.exploded or v.sunk: delete and continue. If v.sim:
     stepSimDrive(v, v.sim, NEUTRAL, dt, world) then checkSink(v) (from './swim'); else stepVehicle(v, { throttle: 0, steer: 0, lift: 0 }, dt, world).
     Add dt to its time. When |v.speed| < BAIL.stopSpeed or time > BAIL.maxCoast: v.speed = 0; v.sim = undefined; delete.
     NEUTRAL: InputState = { moveX: 0, moveY: 0, lift: 0, jump: false, fire: false, enterExit: false, switchGun: false,
     reload: false, radio: false, camYaw: 0, camPitch: 0 }.
   - `export function resetCoasting(): void` (clears the map; for tests).
3. New games/gnome-theft-auto/src/bail.test.ts (vi.mock('./audio', () => ({ play: () => undefined })) as bump.test.ts does,
   then dynamic `await import('./bail')`):
   - shouldBail: false at 6 m/s, true at 7 and at -8, false for a flyer, a boat, an exploded vehicle.
   - bailVelocity of an arcade vehicle at yaw 0, speed 20: vz about 18, vx about +2.5 (driver's left at yaw 0 is +x), vy 3.5.
   - an arcade ride-on (built like bump.test.ts `make()`, driver 'player', no sim) at 20 m/s: startCoast, then stepCoasting
     at dt 1/60 with world `{ boxes: [], half: 600 } as unknown as World`: it moves forward more than 3 m, its driver is 'none',
     and within 20 s it has stopped (speed 0, isCoasting false).
   - the same with a sim: give it a chassis with `createSimDrive(v)` from './simdrive' (it reads v.x, v.z, v.yaw, v.speed and
     v.look?.rideHeight); it coasts forward more than 3 m and stops within 30 s with v.sim cleared. If stepVehicle or
     createSimDrive need more Vehicle fields than make() gives, add them to the test vehicle.
   - startCoast then setting v.driver = 'player' and calling stepCoasting removes it without touching v.sim.

## Contract
bail.ts signatures exactly as in the stub (shouldBail, bailVelocity, startCoast, isCoasting, stepCoasting, BAIL) plus
resetCoasting(). Player methods exactly as declared in types.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in player.ts, bail.ts or bail.test.ts.
- `cd games/gnome-theft-auto && npx vitest run src/bail.test.ts src/terrainWalk.test.ts src/destructibles.test.ts` passes.

## Out of scope
Every other file: app.ts (already wired), types.ts, mount.ts, ragdoll.ts, vehicles.ts, simdrive.ts, collide.ts, stunts.ts, npcs.ts.
~~~~

~~~~text
Epic: 2 Physics pass. Issue 2D: vending machines rock and spill cans (+ can prefabs + two achievements)
Depends on: none

(Environment: paste of the shared environment text above. Also packages/prefabs and packages/achievements are edited here.)

## Goal
A vehicle hitting one of the downtown vending machines (Acorn-Cola, Dandelion Fizz) at speed makes it rock away from the
hit (tilting about its far bottom edge), swing back and settle upright (it is never destroyed and its collider never moves),
and spit 3-6 cans of its own brand out of its chute. Cans are new @lawn/prefabs prefabs. Two achievements are added.

## Read first
- games/gnome-theft-auto/src/vending.ts (stub with the final `createVending` signature) - you fill it in.
- games/gnome-theft-auto/src/types.ts: `VendingSpot` ({ x, z, yaw, brand: 'cola' | 'fizz', object: THREE.Group, box: Box }),
  `Vehicle` (x, y, z, yaw, speed, spec.radius, driver, id), `Fx` (has `spark(x, y, z)`), `Sfx` (union of sound ids: use 'bump' and 'smash').
- games/gnome-theft-auto/src/destructibles.ts lines 360-470: the style of flying-prop physics (gravity 22, bounce, spin) to copy.
- packages/prefabs/src/catalog/gta-brands.ts: `gta-vending-cola` / `gta-vending-fizz` defs (colours COLA_RED, FIZZ_YELLOW,
  FIZZ_LIME at the top of the file) - add the cans next to them in the same style and examine voice.
- docs/roadmaps/prefab-library/_common.md: prefab modelling and data rules (units: 1 = a gnome's height; lowest point at
  y = 0; `uses` with 'hold' needs `grip`; examine 4-6 lines 9-160 chars, all different).
- packages/prefabs/src/types.ts: PrefabDef, Part, Category, Use.
- packages/achievements/src/catalog.ts lines 515-620 (the Gnome Theft Auto section) and packages/achievements/README.md (reward rules).

## Change
1. packages/prefabs/src/catalog/gta-brands.ts: add two prefabs after gta-vending-fizz:
   - `gta-can-cola` "Acorn-Cola Can": a small upright drink can (about 0.2 tall, 0.07 radius cylinder body in COLA_RED, white
     band, silver top rim and a tab), category as suits a drink (check the Category type), uses ['hold', 'collect'] (and
     'place' if allowed), grip near the bottom-middle, tags incl. 'can', 'soda', 'acorn', 'cola', 'drink'.
   - `gta-can-fizz` "Dandelion Fizz Can": same shape in FIZZ_YELLOW with a lime band and a small white puff badge, tags incl.
     'can', 'soda', 'dandelion', 'fizz', 'drink'.
   - 5 examine lines each in the voice of the neighbouring GTA brand prefabs.
2. packages/achievements/src/catalog.ts, Gnome Theft Auto section, add:
   - `{ id: 'gta-bail-out', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Tuck and Roll', description: 'Bail out of a moving vehicle.', reward: ... }`
     reward: a 'head' slot item - reuse an existing prefab whose uses include 'wear-head' and which no other achievement
     already uses as a reward (grep catalog.ts for prefabId to check); prefer something padded or helmet-like.
   - `{ id: 'gta-cola-jackpot', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Exact Change', description: 'Shake the cans out of a vending machine with a vehicle.', reward: { slot: 'hand', prefabId: 'gta-can-cola', label: 'Acorn-Cola Can' } }`
3. games/gnome-theft-auto/src/vending.ts: keep `Vending` and `createVending(scene, spots, fx, play, onSpill)` exactly (you may
   add an optional 6th parameter `rand: () => number = Math.random`). Export also these pure helpers:
   - `export const VENDING = { minHitSpeed: 6, kickPerSpeed: 0.12, maxKick: 4, maxTilt: 0.55, spring: 55, damping: 4.5, groundBounce: 0.3, cooldown: 1.2, cansMin: 3, cansMax: 6, canGravity: 22, canLife: 25, maxCans: 40 } as const;`
   - `export interface Tilt { angle: number; rate: number }`
   - `export function kickTilt(t: Tilt, hitSpeed: number): void` - rate += min(VENDING.maxKick, hitSpeed * VENDING.kickPerSpeed).
   - `export function stepTilt(t: Tilt, dt: number): void` - semi-implicit spring: rate += (-spring * angle - damping * rate) * dt;
     angle += rate * dt; if angle > maxTilt: angle = maxTilt, rate = min(rate, 0) * 0.3 (hard stop); if angle < 0: angle = 0,
     rate = -rate * groundBounce (it rocks back onto its base and stops). Substep internally when dt > 1/60.
   - `export function canCount(hitSpeed: number): number` - clamp(cansMin + floor((hitSpeed - minHitSpeed) / 6), cansMin, cansMax).
   - `export function canPrefabFor(brand: VendingSpot['brand']): 'gta-can-cola' | 'gta-can-fizz'`.
   Runtime, per spot (set up once in createVending): the object's base position and quaternion (clones), a Tilt, a pivot
   point, a tilt axis, a cooldown. A per-vehicle Map<id, { speed, yaw }> from the previous update() call.
   update(dt, vehicles):
   - Hit test per spot per vehicle, using that vehicle's PREVIOUS-frame speed and yaw (the car has already been pushed out and
     slowed by the wall collision when this runs): skip when |prevSpeed| < minHitSpeed or aboveGround(v.x, v.y, v.z) > 1.2;
     contact when the distance from (v.x, v.z) to the nearest point of spot.box is <= v.spec.radius + 0.35; d = unit vector
     from the vehicle to the box centre; hitSpeed = (sin prevYaw, cos prevYaw) * prevSpeed . d; hit when hitSpeed >=
     minHitSpeed and the spot's cooldown is 0. On a hit: if the tilt angle is ~0, set the pivot = box centre + d * (half
     extent of the box along d: |d.x| * (maxX - minX) / 2 + |d.z| * (maxZ - minZ) / 2), at y = base y, and axis = (d.z, 0, -d.x)
     (rotating up about it leans the top toward d, away from the car); kickTilt; cooldown = VENDING.cooldown; fx.spark at
     the hit; play('smash'); spawn canCount(hitSpeed) cans; onSpill(spot.brand, v).
   - Every frame: stepTilt; q = quaternion from axis-angle(axis, angle); object.position = pivot + q * (basePos - pivot);
     object.quaternion = q * baseQuat. When angle < 0.002 and |rate| < 0.01 restore the base pose exactly.
   - Cans: buildPrefab(canPrefabFor(brand)) from '@lawn/prefabs', added to the scene. Spawn at the chute: the machine's front
     f = (sin yaw, cos yaw); position spot + f * 0.5, y = heightAt + 0.3. Velocity f * (2.5..5) + perpendicular * (-1.5..1.5)
     + d * (1..2) + up (2.5..4.5), random spin. Gravity canGravity, bounce off heightAt ground (vy = -vy * 0.35, horizontal
     * 0.7, spin * 0.6), rest when slow (lie on its side: rotation.x = PI / 2 when it settles). Remove (scene.remove) after
     canLife seconds; when more than maxCans exist remove the oldest first.
   - Do not add the cans to world.boxes or make them collide with anything but the ground.
4. New games/gnome-theft-auto/src/vending.test.ts (pure helpers, plus one createVending run):
   - kickTilt + stepTilt from a 15 m/s hit: the angle rises above 0.15, never exceeds maxTilt, never goes below 0, and after
     3 s of 1/60 steps is < 0.002 with |rate| < 0.01 (upright again);
   - canCount(6) = 3, canCount(30) = 6; canPrefabFor('fizz') = 'gta-can-fizz';
   - createVending with a THREE.Scene, one cola spot (object = new THREE.Group() at the spot, box 0.8 x 0.6 around it),
     fx = { spark: vi.fn() } as unknown as Fx, play = vi.fn(), onSpill = vi.fn(), rand = () => 0.5: a vehicle (driver
     'player', spec.radius 1.4, y 0) 3 m in front driving at it at 15 m/s - call update once with it there (records speed),
     then move it into contact and call update again: onSpill called once with 'cola'; the scene gained 3-6 can objects;
     the group's quaternion is no longer identity after a few more updates; after 5 s of updates it is identity again
     (within 1e-3) and its position equals the start. A 3 m/s touch spills nothing.

## Contract
createVending signature as in the stub (plus optional rand). Prefab ids `gta-can-cola`, `gta-can-fizz`. Achievement ids
`gta-bail-out`, `gta-cola-jackpot` (main already unlocks them by these ids).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in vending.ts / vending.test.ts.
- `cd games/gnome-theft-auto && npx vitest run src/vending.test.ts` passes.
- `npm test -w packages/prefabs` and `npm test -w packages/achievements` pass.

## Out of scope
Every other file: world.ts, app.ts, types.ts, destructibles.ts, interactables.ts, other prefab catalog files.
~~~~

~~~~text
Epic: 2 Physics pass. Issue 2E: run-over checks that work on hills and at speed
Depends on: none

(Environment: paste of the shared environment text above.)

## Goal
A fast vehicle reliably knocks down pedestrian gnomes and officers: on hills (npcs.ts used the absolute height v.y > 1.5,
so on any ground above 1.5 m nobody was ever hit), at high speed (the per-frame point test skipped gnomes the vehicle
passed in one frame), and by a driverless vehicle still rolling after its driver bailed (driver 'none' was skipped).

## Read first
- games/gnome-theft-auto/src/npcs.ts lines 285-312 (`tick`: the "Run over" loop) and where `tick` gets `dt`.
- games/gnome-theft-auto/src/police.ts lines 225-245 (the "Fast vehicles fling standing officers" loop) and how that
  function gets dt (add a dt parameter to that inner function only if it lacks one, and pass it from its caller).
- games/gnome-theft-auto/src/config.ts: `RUN_OVER = { minSpeed: 6, reach: 0.9 }`.
- games/gnome-theft-auto/src/terrain.ts: `aboveGround(x, y, z)`.

## Change
1. New games/gnome-theft-auto/src/runOver.ts:
   `export function runOverHit(v: Vehicle, x: number, z: number, bodyR: number, dt: number): boolean`
   - false when Math.abs(v.speed) < RUN_OVER.minSpeed or aboveGround(v.x, v.y, v.z) > 1.5;
   - the vehicle's path this frame is the segment from (v.x - sin(yaw) * speed * dt, v.z - cos(yaw) * speed * dt) to (v.x, v.z);
     true when the distance from (x, z) to that segment is <= v.spec.radius * RUN_OVER.reach + bodyR.
2. npcs.ts run-over loop: replace the skip condition and the hypot test with
   `if (!runOverHit(v, n.x, n.z, BODY_R, dt)) continue;` (no driver filter: parked vehicles have speed 0, and a
   coasting driverless one should still knock gnomes; `npcs.onRunOver` is only acted on for the player's vehicle by main).
   Keep the knock maths after it unchanged (it still uses dx, dz: compute them as before).
3. police.ts: same, but keep skipping `v.driver === 'police'`: `if (v.driver === 'police' || !runOverHit(v, n.x, n.z, BODY_R, dt)) continue;`
4. New games/gnome-theft-auto/src/runOver.test.ts: a vehicle (cast a plain object `as unknown as Vehicle` with x, y, z, yaw,
   speed, driver, spec: { radius: 1.4 }) at 34 m/s with dt 0.05 that moved from 1.5 m before a gnome to 0.2 m past it
   (gnome off the vehicle's current circle) hits; at 5 m/s it does not; a vehicle 2 m above the ground under it does not;
   on raised ground (pick a point where heightAt > 1.5, e.g. search a grid with heightAt in the test, or skip that case with
   a note if heightAt is flat in tests) a vehicle at v.y = heightAt(x, z) does hit.

## Contract
`runOverHit(v, x, z, bodyR, dt): boolean` as above.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in runOver.ts, npcs.ts, police.ts or the test.
- `cd games/gnome-theft-auto && npx vitest run src/runOver.test.ts src/ambientGnomes.test.ts` passes.

## Out of scope
Every other file (app.ts, vehicles.ts, ragdoll.ts, player.ts, traffic.ts, collide.ts).
~~~~

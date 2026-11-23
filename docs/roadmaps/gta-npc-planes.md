# Gnome Theft Auto: NPC planes and the sky-banner

User request: "add npc planes that do things and also an npc plane that pulls behind it a giant advert".

## Goal

An ambient sky-traffic system for `games/gnome-theft-auto`: NPC aircraft that do things (flight-school circuits with
takeoff and landing at the Desert Airfield, crop-dusting runs over Cloverfield with a spray plume, a sightseeing copter
over Turfton, a sky-writer with smoke and stunt loops, a news copter over events and chases, Pigeon-Drop air mail that
drops a parcel you can pick up, a Dandelion Drifter balloon ride, a Hat Watch Air Unit circling a wanted player, an air
ambulance), plus one signature Crop Duster that tows a giant cloth advert banner over Turfton and the highways, rotating
through two ads per in-world brand and two Easter eggs. Planes can be shot down (crash spiral, wreck, respawn cooldown),
the banner can be shot or flown through and torn loose, a parked circuit plane can be stolen, engine drones come
through the sound bus, and five achievements with new cosmetic rewards count spotting, reading, tearing, downing and the
egg. A trainer-facing API (`src/skyTraffic/api.ts`: `listSkyBehaviours`, `spawnSkyNpc(id)`, `clearSkyNpcs`,
`setSkyTrafficEnabled`) drives it from tools.

## Decisions

- **NPC aircraft are ordinary `Vehicle`s** (`createVehicle`) pushed into app.ts's shared `vehicles` list with
  `questOwned = true` and `variant = <sky engine sound id>`. That gives bullets (`hitTest` vehicle loop), explosions and
  fire (`blowUp`, the burning-wreck loop), vehicle-vs-vehicle collisions (`collideVehicles`, which already skips pairs
  more than 1.5 m apart in y), engine sound (`watchVehicles.ts` plays npc-driven vehicles; planes audible to 220 m) and
  getting in (`nearestVehicle`) for free. traffic.ts skips `questOwned` vehicles.
- **Flight is a kinematic waypoint follower** (`skyTraffic/follow.ts`), not `craft/flight.ts`. A scripted path with
  per-leg climb/glide interpolation keeps takeoff rolls, climb-outs, approaches, flares and stunt loops believable and
  costs a few multiplications per aircraft per frame; driving `stepAir` would need an autopilot that fights stalls.
  The follower writes `x, y, z, yaw, speed, vy` and the attitude (`v.air.pitch/roll` for spec.air kinds,
  `v.steerVis`/`v.vy` for the legacy Crop Duster) and `syncVehicleMesh` draws it.
- **Cheap by construction**: at most 4 aircraft (5 with the Watch chopper), spawned out of view by distance from the
  player and removed past 950 m, stepped at 5 Hz past 450 m, floor sampled 4 times a second, no per-frame allocation,
  one InstancedMesh for all smoke and spray puffs, the banner a 21-column strip (84 vertices) updated only within
  350 m, ad textures cached (3 at most).
- **No new vehicle kinds.** Banner tow, crop duster and air mail fly the Crop Duster (`plane`); the circuit and the
  sky-writer the Hedge-Hopper; copters the Sycamore Copter; the balloon the Dandelion Drifter.
- **The banner is built in the game, not a prefab**: a fluttering cloth strip whose texture is drawn at runtime per
  ad cannot be expressed by a `PrefabDef`. The parcel uses the existing `crate` and `parachute-canopy` prefabs.
- **Online**: sky traffic is local per browser, like the wildlife (no relay messages). Adding it to `@lawn/mp` would
  mean syncing up to five scripted flights for scenery; not worth it yet.
- **Mobile**: no new controls. Everything is ambient or uses existing actions (shoot, get in).
- **Map blips**: skipped (optional in the request).
- Save: one new progress key `gta-sky-v1` (ads read + flags), added to `GTA_SAVE_KEYS` (saveIO.ts) and merged with
  `unionArrays` in cloudSave.ts.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 Foundation (planner) | `src/skyTraffic/` types, config, stubs, `api.ts`, `sounds.ts`; tsc passes | planner |
| 1 Modules | follower, routes + behaviour table, banner, ads + lore, puffs + parcels, progress + prefabs + achievements; tsc + tests pass | 6 |
| 2 Runtime | `runtime.ts` flies everything; tsc + tests pass | 1 |
| 3 Wiring (planner) | app.ts, saveIO.ts, cloudSave.ts hooks; smoke check | planner |

Hot-file edits (planner, Epic 3): `app.ts` (import, create, update in the frame and the cutscene frame, one line in
`hitTest`, `bindSkyTraffic`), `saveIO.ts` (one key), `cloudSave.ts` (one merge entry + GROWS).

## Epic 1 issues

~~~~text
Epic: 1 Modules, issue 1: the kinematic follower
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (a git worktree; run everything from
there). Node: in Git Bash, if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
installed; do not run npm install. Do not commit, stash or switch branches. Other workers are editing other files in
games/gnome-theft-auto/src/skyTraffic/ and elsewhere at the same time: edit only the files named below. Do not run
`vite build` or start a dev server.

## Goal
`games/gnome-theft-auto/src/skyTraffic/follow.ts` flies a body along a list of waypoints: speed and turn-rate limited,
climbs and glides interpolated along each leg, ground legs snap to the floor, holds, and scripted vertical loops.
Pure: no three.js, no DOM.

## Read first
- games/gnome-theft-auto/src/skyTraffic/types.ts: SkyWaypoint, SkyBody, FollowState, FollowSpec (the contract; do not edit)
- games/gnome-theft-auto/src/skyTraffic/follow.ts: the stub you replace (keep its three exported signatures exactly)
- games/gnome-theft-auto/src/config.ts lines 280-415: VEHICLES entries 'plane', 'hedge-hopper', 'sycamore-copter',
  'dandelion-drifter' (fields maxSpeed, accel, turnRate, fixedWing, flies, and `air` = AirSpec with regime, maxSpeed,
  thrust, turnRate, climbRate, bankMax, pitchMax)
- games/gnome-theft-auto/src/collide.ts: `angleDiff(to, from)` (export; wraps to -PI..PI) — import it from '../collide'

## Change
- games/gnome-theft-auto/src/skyTraffic/follow.ts: implement

  `newFollow(route, body, i = 0): FollowState` — holdT 0, loopT -1, loop fields 0, legFromY = body.y,
  legLen = horizontal distance from body to route[i], done = false (true if route is empty).

  `followSpecFor(kind: VehicleKind): FollowSpec` — `const s = VEHICLES[kind]` (import { VEHICLES } from '../config').
  If `s.air`: maxSpeed = air.maxSpeed, accel = air.thrust, turnRate = air.turnRate, climbRate = air.climbRate,
  bankMax = air.bankMax, pitchMax = air.pitchMax, hover = air.regime !== 'fixed-wing'.
  Else: maxSpeed = s.maxSpeed, accel = s.accel, turnRate = s.turnRate * 0.8, climbRate = 10, bankMax = 0.5,
  pitchMax = 0.3, hover = !s.fixedWing. arrive = hover ? 6 : 18.

  `stepFollow(b, st, spec, floorY, dt): number` — mutates b and st, returns the index of the waypoint reached during
  this step or -1. Rules, in order:
  1. If st.done or dt <= 0: return -1. Clamp dt to 0.25.
  2. Loop in progress (st.loopT >= 0): st.loopT += dt * max(b.speed, 8) / (2 * PI * st.loopR); th = 2*PI*min(1, loopT);
     b.x = loopX + sin(loopYaw) * loopR * sin(th); b.z = loopZ + cos(loopYaw) * loopR * sin(th);
     newY = loopY + loopR * (1 - cos(th)); b.vy = (newY - b.y) / dt; b.y = newY; b.pitch = th; b.roll = 0; yaw unchanged.
     When loopT >= 1: loopT = -1, b.pitch = 0, advance(). Return -1.
  3. Hold in progress (st.holdT > 0): holdT -= dt; ease b.speed toward 0 by spec.accel * 2 * dt; move forward by speed;
     y: if route[i].ground -> b.y = floorY, b.vy = 0, pitch/roll ease to 0; else hover: ease y toward
     floorY + route[i].agl with vy = clamp((target - y) * 2, -climbRate, climbRate). When holdT <= 0: holdT = 0, advance().
     Return -1.
  4. Flying / taxiing to wp = route[st.i]:
     - dx = wp.x - b.x, dz = wp.z - b.z, dist = hypot. heading = atan2(dx, dz). diff = angleDiff(heading, b.yaw).
     - Target speed ts = min(wp.speed, spec.maxSpeed); if spec.hover and |diff| > 1.2, ts *= 0.25.
       Ease b.speed toward ts by at most spec.accel * dt per step (both directions); never below 0.
     - Yaw rate yr = clamp(diff * 2, -spec.turnRate, spec.turnRate); b.yaw += yr * dt.
     - Move: b.x += sin(b.yaw) * b.speed * dt; b.z += cos(b.yaw) * b.speed * dt.
     - Height: onGround = wp.ground && b.y - floorY < 0.5.
       If onGround: b.y = floorY, b.vy = 0, pitch and roll ease to 0 (rate 3/s: p += (0 - p) * min(1, 3 * dt)).
       Else: wpY = wp.ground ? floorY : floorY + wp.agl; t = legLen > 1 ? clamp(1 - dist / legLen, 0, 1) : 1;
       targetY = legFromY + (wpY - legFromY) * t; if !wp.ground, targetY = max(targetY, floorY + min(wp.agl, 3));
       b.vy = clamp((targetY - b.y) * 2, -spec.climbRate, spec.climbRate); b.y += b.vy * dt; b.y = max(b.y, floorY).
       Attitude targets: roll = clamp(-yr / spec.turnRate, -1, 1) * spec.bankMax; pitch = hover
       ? -spec.pitchMax * (b.speed / spec.maxSpeed) : clamp(atan2(b.vy, max(b.speed, 1)), -pitchMax, pitchMax).
       Ease pitch and roll toward targets at rate 3/s.
     - Arrival: arriveR = wp.ground ? 4 : spec.arrive. Arrived when dist (recomputed after the move) < arriveR, OR (not
       spec.hover and not wp.ground and dist < (b.speed / spec.turnRate) * 1.1 and |diff| > PI / 2) (a point inside
       the turning circle is skipped instead of orbited forever).
       On arrival: reached = st.i; if wp.loop: loopT = 0, loopR = wp.loop, loopX = b.x, loopY = b.y, loopZ = b.z,
       loopYaw = b.yaw. Else if wp.hold: holdT = wp.hold. Else advance(). Return reached.
  advance(): st.i++; if st.i >= route.length: st.i = route.length - 1, st.done = true; else legFromY = b.y,
  legLen = horizontal distance from b to route[st.i].
  No allocations inside stepFollow (no arrays, objects or closures created per call; write advance as a module function).
- games/gnome-theft-auto/src/skyTraffic/follow.test.ts (new, vitest, `import { describe, it, expect } from 'vitest'`):
  - a fixed-wing spec (followSpecFor('hedge-hopper')) flying a 4-point square route of side 600 m at agl 50, speed 35,
    dt 1/30, floorY 0, reaches every index 0..3 in order within 120 s simulated and ends with st.done.
  - a hold: route [{x:0,z:50,agl:0,speed:5,ground:true,hold:2},{x:0,z:200,agl:0,speed:5,ground:true}] from a body at
    the origin on the ground: after arriving at 0, speed falls to 0 and the body stays within 2 m for the hold.
  - a loop: a body at y 50 flying at 30 m/s toward a waypoint 20 m ahead with loop: 25 — during the loop y rises
    above 90, pitch passes PI, and afterwards pitch is 0 and st.i has advanced.
  - a glide to a ground waypoint from 30 m up over 300 m: at arrival y is within 1 m of the floor; y is never below
    floorY at any step.
  - followSpecFor('sycamore-copter').hover is true; followSpecFor('plane').hover is false.

## Contract
Keep exactly: `newFollow(route: SkyWaypoint[], body: SkyBody, i = 0): FollowState`,
`stepFollow(b: SkyBody, st: FollowState, spec: FollowSpec, floorY: number, dt: number): number`,
`followSpecFor(kind: VehicleKind): FollowSpec`. Types come from ./types (do not change types.ts).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/skyTraffic/follow*.ts
- `npx vitest run src/skyTraffic/follow.test.ts` passes (run it from games/gnome-theft-auto)

## Out of scope
Every other file. Do not touch types.ts, config.ts, routes.ts, runtime.ts.
~~~~

~~~~text
Epic: 1 Modules, issue 2: route builders and the behaviour table
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (a git worktree; run everything from
there). Node: in Git Bash, if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
installed; do not run npm install. Do not commit, stash or switch branches. Other workers are editing other files in
games/gnome-theft-auto/src/skyTraffic/ at the same time: edit only the files named below. No `vite build`, no dev server.

## Goal
Pure route builders (`routes.ts`) and the data table of the ten NPC flights (`behaviours.ts`) for Gnome Theft Auto's
sky traffic. No three.js, no DOM.

## Read first
- games/gnome-theft-auto/src/skyTraffic/types.ts: SkyWaypoint, Pt, SkyBehaviourDef, SkyContext (the contract; do not edit)
- games/gnome-theft-auto/src/skyTraffic/routes.ts and behaviours.ts: the stubs you replace (keep exported signatures)
- games/gnome-theft-auto/src/skyTraffic/sounds.ts: SKY_SOUNDS ids (prop, sport, copter, balloon)
- games/gnome-theft-auto/src/skyTraffic/config.ts: SKY.sprayColour, SKY.smokeColour

## Change
- games/gnome-theft-auto/src/skyTraffic/routes.ts — implement (all return new arrays of new objects):
  - `airfieldCircuit(af, apron)`: runway forward f = (sin af.yaw, cos af.yaw), right side s = (cos af.yaw, -sin af.yaw),
    L = af.length, C = (af.x, af.z), thr = C - f*(L/2 - 10), E = C + f*(L/2). Waypoints, in order:
    0 apron: (apron.x, apron.z) ground, agl 0, speed 4, hold 30
    1 taxi to threshold: thr, ground, speed 6
    2 line up: thr + f*8, ground, speed 3
    3 rotate: C + f*(L*0.2), ground, speed 24
    4 climb-out: E + f*150, agl 35, speed 32
    5 crosswind: E + f*200 + s*220, agl 60, speed 34
    6 downwind: thr - f*200 + s*220, agl 60, speed 34
    7 base: thr - f*260 + s*60, agl 40, speed 30
    8 final: thr - f*140, agl 22, speed 26
    9 touchdown: thr + f*20, ground, speed 20
    10 rollout: C + f*(L*0.25), ground, speed 6
    11 back to the apron: (apron.x, apron.z) + f*15, ground, speed 5
  - `ellipseRoute(c, rx, rz, agl, speed, n)`: n points at angle a = 2*PI*k/n: (c.x + rx*sin a, c.z + rz*cos a).
  - `polyRoute(pts, agl, speed)`: one waypoint per point.
  - `cropPasses(field, passes, agl, speed)`: field is a rectangle centred (x, z), w along x, d along z. Passes run along
    x, spaced d/(passes-1) apart in z from z - d/2 to z + d/2. For pass k: an entry point 60 m outside the field edge
    (agl + 25, no spray), then the far edge of the field (agl, spray: true), then a turn point 80 m beyond it (agl + 25,
    no spray). Alternate direction each pass (west->east, then east->west).
  - `orbitRoute(c, r, agl, speed, n)`: like ellipseRoute with rx = rz = r.
  - `skyWriterRoute(c, r, agl, speed)`: 12 points on a circle of radius r, all with smoke: true; points 3 and 9 also
    get loop: 28.
  - `dropRoute(from, zone, to, agl, speed)`: [from at agl + 20, zone at agl with drop: true, to at agl + 30], all at speed.
- games/gnome-theft-auto/src/skyTraffic/behaviours.ts — `export const SKY_BEHAVIOURS: readonly SkyBehaviourDef[]`
  with exactly these ten entries (in this order) and keep `skyBehaviour(id)`. Import SKY_SOUNDS from './sounds', SKY from
  './config'. Fields not listed are omitted.
  1. id 'banner-tow', title 'Sky-Sign Banner Tow', kind 'plane', sound SKY_SOUNDS.prop, anchor {x:0,z:0}, radius 700,
     cooldown 30, priority 10, repeat 'loop', startAirborne true, banner true, route: () => polyRoute([(-170,-170),
     (170,-170), (280,-60), (280,60), (170,170), (-170,170), (-280,60), (-280,-60)], 75, 24).
  2. id 'airfield-circuit', title 'Flight School Circuit', kind 'hedge-hopper', sound SKY_SOUNDS.sport,
     anchor {x:480,z:-110}, radius 600, cooldown 60, priority 6, repeat 'loop', startAirborne false,
     route: (c) => airfieldCircuit(c.airfield, { x: c.airfield.x - 40, z: c.airfield.z - 22, yaw: c.airfield.yaw }).
  3. id 'crop-duster', title 'Cloverfield Crop Duster', kind 'plane', sound SKY_SOUNDS.prop, anchor {x:40,z:440},
     radius 650, cooldown 45, priority 7, repeat 'loop', startAirborne true, puff SKY.sprayColour,
     route: () => cropPasses({ x: 40, z: 440, w: 160, d: 90 }, 4, 7, 26).
  4. id 'scenic-copter', title 'Turfton Sightseeing Copter', kind 'sycamore-copter', sound SKY_SOUNDS.copter,
     anchor {x:0,z:0}, radius 600, cooldown 60, priority 5, repeat 'loop', startAirborne true,
     route: () => polyRoute([(-90,-90), (60,-110), (110,-30), (90,150), (-90,90), (-150,150), (-150,-30)], 60, 16)
     with the first waypoint's hold set to 6.
  5. id 'sky-writer', title 'Sky-Writer', kind 'hedge-hopper', sound SKY_SOUNDS.sport, anchor {x:220,z:160},
     radius 750, cooldown 90, priority 4, repeat 'loop', startAirborne true, puff SKY.smokeColour,
     route: () => skyWriterRoute({ x: 220, z: 160 }, 90, 120, 34).
  6. id 'news-copter', title 'Lawn-Dart Eye-in-the-Sky', kind 'sycamore-copter', sound SKY_SOUNDS.copter,
     anchor {x:0,z:0}, radius 3000, cooldown 90, priority 8, repeat 'rebuild', startAirborne true,
     when: (c) => c.eventActive || c.heat >= 3,
     route: (c) => orbitRoute({ x: c.playerX, z: c.playerZ }, 70, 50, 14, 8),
     toast 'The Lawn-Dart Eye-in-the-Sky is covering this live!'.
  7. id 'mail-drop', title 'Pigeon-Drop Air Mail', kind 'plane', sound SKY_SOUNDS.prop, anchor {x:-40,z:330},
     radius 700, cooldown 150, priority 5, repeat 'once', startAirborne true,
     route: (c) => pick zone = DROP_ZONES[Math.floor(c.rng() * DROP_ZONES.length)] where
     `export const DROP_ZONES: readonly Pt[] = [{x:-60,z:330},{x:120,z:430},{x:-200,z:260}]`; return
     dropRoute({ x: zone.x - 450, z: zone.z - 150 }, zone, { x: zone.x + 450, z: zone.z + 150 }, 45, 30).
  8. id 'balloon', title 'Dandelion Drifter Balloon Ride', kind 'dandelion-drifter', sound SKY_SOUNDS.balloon,
     anchor {x:-450,z:520}, radius 700, cooldown 120, priority 3, repeat 'loop', startAirborne true,
     route: () => polyRoute([(-600,600), (-420,520), (-260,470), (-380,640)], 70, 5).
  9. id 'watch-copter', title 'Hat Watch Air Unit', kind 'sycamore-copter', sound SKY_SOUNDS.copter,
     anchor {x:0,z:0}, radius 3000, cooldown 45, priority 20, repeat 'rebuild', startAirborne true,
     when: (c) => c.heat >= 2, route: (c) => orbitRoute({ x: c.playerX, z: c.playerZ }, 40, 35, 16, 8),
     toast 'A Hat Watch Air Unit is circling overhead!'.
  10. id 'air-ambulance', title 'Glaze Clinic Air Ambulance', kind 'sycamore-copter', sound SKY_SOUNDS.copter,
     anchor {x:30,z:30}, radius 650, cooldown 150, priority 4, repeat 'once', startAirborne true,
     route: (c) => stop = AMBULANCE_STOPS[Math.floor(c.rng() * AMBULANCE_STOPS.length)] where
     `export const AMBULANCE_STOPS: readonly Pt[] = [{x:-300,z:40},{x:200,z:320},{x:-150,z:-300}]`; return
     [{x:30,z:30,agl:70,speed:24}, {x:stop.x,z:stop.z,agl:25,speed:28,hold:8}, {x:30,z:30,agl:70,speed:28},
      {x:630,z:30,agl:80,speed:30}].
  (Pairs written (a,b) above mean { x: a, z: b }.)
- games/gnome-theft-auto/src/skyTraffic/routes.test.ts (new, vitest):
  - airfieldCircuit({x:480,z:-110,yaw:Math.PI/2,length:170}, {x:440,z:-132,yaw:Math.PI/2}) has 12 points; index 0 is
    ground with hold 30; index 3 is ground at x = 480 + 34 (within 0.01); index 4 is not ground and agl 35; the
    touchdown point index 9 is ground; every number is finite.
  - cropPasses(...) with 4 passes has 12 points, 4 of them spray: true, and the spray points alternate sides in x.
  - skyWriterRoute has 12 points, all smoke, exactly two with loop.
  - every SKY_BEHAVIOURS entry: unique id, route(ctx) non-empty with finite numbers, for a ctx
    { playerX: 0, playerZ: 0, heat: 0, eventActive: false, airfield: {x:480,z:-110,yaw:Math.PI/2,length:170}, time: 0,
      rng: () => 0.5 }; there are 10 entries; exactly one has banner: true; 'watch-copter'.when is false at heat 0 and
    true at heat 2; skyBehaviour('balloon')?.kind is 'dandelion-drifter'.

## Contract
Keep the stub's exported function names and parameter lists exactly (runtime.ts and api.ts import them):
airfieldCircuit, ellipseRoute, polyRoute, cropPasses, orbitRoute, skyWriterRoute, dropRoute, SKY_BEHAVIOURS, skyBehaviour.
Also export DROP_ZONES and AMBULANCE_STOPS from behaviours.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/skyTraffic/routes*.ts or behaviours.ts
- `npx vitest run src/skyTraffic/routes.test.ts` passes (run it from games/gnome-theft-auto)

## Out of scope
Every other file (types.ts, config.ts, sounds.ts, follow.ts, runtime.ts are owned elsewhere).
~~~~

~~~~text
Epic: 1 Modules, issue 3: the towed advert banner
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (a git worktree; run everything from
there). Node: in Git Bash, if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
installed; do not run npm install. Do not commit, stash or switch branches. Other workers are editing other files at
the same time: edit only the file named below. No `vite build`, no dev server. three.js is the `three` package
(`import * as THREE from 'three'`).

## Goal
`games/gnome-theft-auto/src/skyTraffic/banner.ts`: a giant cloth advert banner on a rope that trails behind a towing
plane, flutters cheaply, shows one ad as a large canvas texture readable from the ground on both sides, can be hit by
bullets, and can be torn loose to fall and fade.

## Read first
- games/gnome-theft-auto/src/skyTraffic/banner.ts: the stub (keep the `SkyBanner` interface and both export signatures)
- games/gnome-theft-auto/src/skyTraffic/types.ts: AdDef
- games/gnome-theft-auto/src/skyTraffic/config.ts: SKY.banner*, SKY.ropeLength, SKY.flutter*, SKY.adCanvasW/H,
  SKY.bannerTextureCache, SKY.bannerFall, SKY.bannerFade
- games/gnome-theft-auto/src/brands.ts: BRANDS (name, primary, secondary as 0xRRGGBB numbers) and `billboardTexture`
  (lines ~355-440) for the canvas + CanvasTexture pattern and its `typeof document === 'undefined'` guard
- games/gnome-theft-auto/src/terrain.ts: `heightAt(x, z)`

## Change
- games/gnome-theft-auto/src/skyTraffic/banner.ts:
  - `adTexture(ad)`: a CanvasTexture SKY.adCanvasW x SKY.adCanvasH (1280 x 256), cached in a module Map by ad.id;
    when the cache holds more than SKY.bannerTextureCache entries, delete the oldest and call its `.dispose()`.
    Node guard as in billboardTexture (return a stub CanvasTexture when `document` is undefined, not cached).
    Drawing: fill with BRANDS[ad.brand].primary; 14 px border in secondary; headline in '900 <size>px system-ui,
    sans-serif', size starting 170 and shrinking by 8 until measureText(headline).width <= W - 120 (min 60), centred,
    textBaseline 'middle' at y = 108; colour black (#151518) on light backgrounds, white on dark (luminance of primary
    > 0.6 = light; write a small local helper); tagline '700 40px system-ui, sans-serif' centred at y = 200 in the same
    colour at 0.85 alpha; brand name '800 26px system-ui' right-aligned at (W - 30, 232) in the secondary colour.
    If ad.egg: background #1b1b22 with a pink (#ff6fa8) border and white text instead (ignore brand colours).
    texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; needsUpdate = true.
  - `createBanner(scene)`: builds and adds to `scene` one THREE.Group `object` holding, in the group's local frame
    (local +z = the tow plane's forward, +y up; the group is placed at the tow point with rotation.y = yaw):
    - rope: a THREE.Line (BufferGeometry of 2 points (0,0,0) and (0, -SKY.bannerDrop, -SKY.ropeLength)),
      LineBasicMaterial color 0x333333.
    - leading pole: CylinderGeometry(0.12, 0.12, SKY.bannerHeight, 6), MeshLambertMaterial color 0x5a3a1a, at
      (0, -SKY.bannerDrop - SKY.bannerHeight / 2, -SKY.ropeLength).
    - cloth: ONE BufferGeometry, ONE Mesh, MeshBasicMaterial({ map, side: THREE.FrontSide }) (unlit so it always reads).
      S = SKY.bannerSegments (20), L = SKY.bannerLength, H = SKY.bannerHeight. Column c = 0..S has u = c / S,
      z_c = -SKY.ropeLength - u * L, top y = -SKY.bannerDrop, bottom y = -SKY.bannerDrop - H. Vertices: a front set
      (top_c, bot_c for every c) and a back set (the same positions again) — 4 * (S + 1) vertices.
      Front-set triangles per column (CCW, faces +x): (top_c, bot_c, top_c+1) and (top_c+1, bot_c, bot_c+1).
      Back-set triangles: the same triples in reverse order (faces -x). UVs: front u = c / S, back u = 1 - c / S;
      v = 1 at the top, 0 at the bottom. (From the plane's right side the text starts at the leading edge; from the
      left it starts at the tail: both read left to right.) The two sets share positions but face opposite ways with
      FrontSide culling, so they never z-fight.
      Flutter: every vertex x = SKY.flutterAmp * u * sin(SKY.flutterWave * u * L - SKY.flutterSpeed * time)
      (bottom row times 1.15). Write it into the position attribute's array directly and set needsUpdate; no new
      arrays per frame.
  - SkyBanner methods:
    - `setAd(ad)`: material.map = adTexture(ad); material.needsUpdate = true.
    - `update(dt, tx, ty, tz, yaw, speed, time, near)`: while not torn: object.position.set(tx, ty, tz);
      object.rotation.set(0, yaw, 0). If near: recompute the flutter. When torn: ignore the tow arguments, keep
      falling: position += (vx, -SKY.bannerFall, vz) * dt with vx/vz decaying by 0.5 per second, rotation.y += 0.2 * dt,
      flutter continues if near; once the cloth's bottom (position.y - SKY.bannerDrop - H) is at or below
      heightAt(position.x, position.z), stop falling and fade material.opacity (material.transparent = true) from 1 to
      0 over SKY.bannerFade seconds; then gone() is true.
    - `hitTest(x, y, z)`: false when torn. Otherwise transform into the local frame: dx = x - pos.x, dy = y - pos.y,
      dz = z - pos.z; lz = dx * sin(yaw) + dz * cos(yaw); lx = dx * cos(yaw) - dz * sin(yaw). Hit when |lx| < 2.5,
      -SKY.ropeLength - L <= lz <= -SKY.ropeLength, -SKY.bannerDrop - H <= dy <= -SKY.bannerDrop. A hit adds 1 to hits
      and returns true.
    - `tearLoose()`: once: torn = true, remember vx/vz from the last update's forward speed * 0.3 (forward =
      (sin yaw, cos yaw)), hide the rope.
    - `torn` and `hits` are getters. `gone()` as above (false until faded). `centre(out)`: world centre of the cloth
      (local (0, -SKY.bannerDrop - H/2, -SKY.ropeLength - L/2) through the group's position and yaw).
    - `setVisible(on)`: object.visible = on. `dispose()`: remove from scene, dispose geometries and materials (not
      the cached textures).
  - No allocations in update/hitTest/centre (reuse module-level scratch numbers; centre writes into `out`).
  - castShadow false on every mesh. frustumCulled = false on the cloth (its vertices move).

## Contract
Keep exactly:
```ts
export interface SkyBanner {
  readonly object: THREE.Group;
  setAd(ad: AdDef): void;
  update(dt: number, tx: number, ty: number, tz: number, yaw: number, speed: number, time: number, near: boolean): void;
  hitTest(x: number, y: number, z: number): boolean;
  tearLoose(): void;
  readonly torn: boolean;
  gone(): boolean;
  readonly hits: number;
  centre(out: THREE.Vector3): THREE.Vector3;
  setVisible(on: boolean): void;
  dispose(): void;
}
export function adTexture(ad: AdDef): THREE.CanvasTexture;
export function createBanner(scene: THREE.Scene): SkyBanner;
```

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/skyTraffic/banner.ts
- games/gnome-theft-auto/src/skyTraffic/banner.test.ts (new, vitest; `new THREE.Scene()` works in node) passes:
  createBanner + update(…, near true) at (0, 100, 0) yaw 0: hitTest(0, 100 - SKY.bannerDrop - 2, -SKY.ropeLength - 10)
  is true and hits becomes 1; hitTest(0, 100, 30) is false; after tearLoose(), torn is true and hitTest is false;
  centre() z is about -SKY.ropeLength - SKY.bannerLength / 2. Run `npx vitest run src/skyTraffic/banner.test.ts` from
  games/gnome-theft-auto.

## Out of scope
Every other file. Do not edit brands.ts.
~~~~

~~~~text
Epic: 1 Modules, issue 4: the sky ads and their lore
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (a git worktree; run everything from
there). Node: in Git Bash, if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
installed; do not run npm install. Do not commit, stash or switch branches. Other workers (and other planners) are
editing other files, including docs/lore/rulings.md: append your ruling at the very end, and re-read the last ruling
number right before you write so the number is the next free one. No `vite build`, no dev server.

## Goal
The advert table for Gnome Theft Auto's sky-banner (`ads.ts`: two funny ads per in-world brand plus two Easter eggs)
and the lore entries for the new sky traffic.

## Read first
- games/gnome-theft-auto/src/skyTraffic/ads.ts: the stub (keep its exports)
- games/gnome-theft-auto/src/skyTraffic/types.ts: AdDef (headline max 28 chars, upper case; tagline max 48 chars)
- games/gnome-theft-auto/src/brands.ts lines 1-180: the 16 BrandIds, names, slogans, fine print, rivals
- docs/lore/README.md (entry schema), docs/lore/canon.md (house style), and `npm run lore -- find <word>` for each
  brand you write about (e.g. `find acorn-cola`, `find pigeon`, `find wind-sock`, `find lawn-dart`, `find hat-watch`)
- docs/lore/entries/apocrypha/hedge-hopper.md and wind-sock-wally.md: the entry format for Gnome Theft Auto things

## Change
- games/gnome-theft-auto/src/skyTraffic/ads.ts:
  - `export const SKY_ADS: readonly AdDef[]`: for every one of the 16 BrandIds exactly two ads, ids `<brandId>-1` and
    `<brandId>-2`, plus two Easter eggs with egg: true and ids starting 'egg-' (brand: any BrandId; e.g. a pilot's
    marriage proposal to someone in Turfton, and a line from Wind-Sock Wally such as "STALL SPEED'S 22, KID").
    Copy: short, funny, in each brand's voice and consistent with its slogan, fine print and rival in brands.ts and its
    lore entry. Headlines upper case, at most 28 characters; taglines at most 48 characters. No real-world brands,
    no swearing, nothing that contradicts the lore. Gnomes are fired clay and never see the Tall Ones.
  - `export const READABLE_AD_COUNT = 32` (the non-egg ads).
  - `export function nextAd(prevId: string | null, rng: () => number): AdDef`: with probability SKY.eggChance
    (import { SKY } from './config') pick a random egg (not prevId); otherwise a random non-egg ad that is not prevId.
- games/gnome-theft-auto/src/skyTraffic/ads.test.ts (new, vitest): 34 ads, unique ids, 32 non-egg, 2 per BrandId
  (import BRANDS from '../brands' and check every key), headline <= 28 and upper case, tagline <= 48, nextAd never
  returns prevId over 500 calls with Math.random, and with rng () => 0 returns an egg (0 < eggChance).
- Lore (tier apocrypha, setting apocrypha, games [gnome-theft-auto], status draft), new files:
  - docs/lore/entries/apocrypha/sky-sign-banner-tow.md: the Crop Duster that tows the giant advert banner in a slow loop
    over Turfton and the ring highways; who flies it (invent a pilot name after searching the lore; record it), who
    pays (the brands rent the banner by the lap), the Easter-egg banners, and that a torn banner is a known hazard.
  - docs/lore/entries/apocrypha/turfton-sky-traffic.md: the regular flights over Turfton by these exact titles:
    Sky-Sign Banner Tow, Flight School Circuit (trainee pilots doing takeoff-and-landing circuits in a Hedge-Hopper at
    the Desert Airfield, under Wind-Sock Wally's stopwatch), Cloverfield Crop Duster (spraying the Cloverfield fields),
    Turfton Sightseeing Copter (a Sycamore Copter tour of the landmarks), Sky-Writer (a Hedge-Hopper writing rings and
    loops in smoke east of town), Lawn-Dart Eye-in-the-Sky (the news copter of Turfton FM's morning show Lawn-Dart,
    covering events and chases), Pigeon-Drop Air Mail (the Pigeon-Drop Couriers dropping parcels from altitude; a
    found parcel pays a finder's fee), Dandelion Drifter Balloon Ride (over Tallgrass Commons), Hat Watch Air Unit
    (a Sycamore Copter that circles a gnome with two hats or more), Glaze Clinic Air Ambulance.
  Use `related:` to link existing entries you used (e.g. hedge-hopper, wind-sock-wally, pigeon-drop-couriers,
  lawn-dart, hat-watch, sycamore-copter, dandelion-drifter); check each id exists.
  - Append one ruling to docs/lore/rulings.md in the file's existing format (Question / Ruling / Applies to / Date
    2026-11-23 / Why): the sky over Turfton has regular traffic; only the sixteen Turfton brands may buy banner space;
    an NPC aircraft that is shot down crashes and burns like a mower and the operator sends another later; the banner
    pilot's name.
- Run `npm run lore` (from the repo root) and fix anything it reports. It regenerates docs/lore/INDEX.md; that is
  expected.

## Contract
`SKY_ADS: readonly AdDef[]`, `READABLE_AD_COUNT = 32`, `nextAd(prevId: string | null, rng: () => number): AdDef`.

## Done when
- `npx vitest run src/skyTraffic/ads.test.ts` passes (from games/gnome-theft-auto)
- `npm run lore` passes (from the repo root)
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/skyTraffic/ads*.ts

## Out of scope
Every other code file. Do not edit brands.ts or other lore entries.
~~~~

~~~~text
Epic: 1 Modules, issue 5: smoke/spray puffs and Pigeon-Drop parcels
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (a git worktree; run everything from
there). Node: in Git Bash, if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
installed; do not run npm install. Do not commit, stash or switch branches. Other workers are editing other files at
the same time: edit only the files named below. No `vite build`, no dev server.

## Goal
Two small three.js modules for Gnome Theft Auto's sky traffic: `puffs.ts`, one pooled InstancedMesh for all
sky-writing smoke and crop-spray puffs, and `parcels.ts`, parcels that fall under a parachute and pay Acorns when a
gnome on foot walks into them.

## Read first
- games/gnome-theft-auto/src/skyTraffic/puffs.ts and parcels.ts: the stubs (keep their interfaces and signatures)
- games/gnome-theft-auto/src/skyTraffic/config.ts: SKY.puffCapacity, SKY.parcel*
- packages/prefabs/src/catalog/furniture.ts (search `id: 'crate'`) and packages/prefabs/src/catalog/gta-guns-air.ts
  (search `id: 'parachute-canopy'`): sizes (1 unit = a gnome height; the canopy's lines end at y 1.2, canopy at y 3)
- `buildPrefab(id, { scale })` from '@lawn/prefabs' returns a THREE.Group
- games/gnome-theft-auto/src/terrain.ts: `heightAt(x, z)`

## Change
- games/gnome-theft-auto/src/skyTraffic/puffs.ts — `createPuffs(scene, capacity = SKY.puffCapacity)`:
  - One THREE.InstancedMesh(IcosahedronGeometry(1, 0), MeshLambertMaterial({ color: 0xffffff, transparent: true,
    opacity: 0.85, depthWrite: false }), capacity); frustumCulled = false; castShadow = false; added to scene.
  - Per-puff state in preallocated Float32Arrays (x, y, z, vx, vy, vz, age, life, size); a ring cursor so emit
    overwrites the oldest when full. emit() sets the state and `setColorAt(i, colour)` (reuse one THREE.Color) and
    flags instanceColor.needsUpdate.
  - update(dt): for each live puff: age += dt; position += v * dt; v *= max(0, 1 - 0.6 * dt); scale grows from
    0.4 * size to size over the first 20% of life, holds, then shrinks to 0 over the last 30%; dead puffs get a zero
    scale matrix. Reuse one Matrix4/Vector3/Quaternion (module scratch), no allocations. When no puff is live, set
    mesh.count = 0 and skip the matrix upload; otherwise mesh.count = capacity and instanceMatrix.needsUpdate = true.
  - clear(): all dead, count 0. dispose(): remove from scene, dispose geometry and material.
- games/gnome-theft-auto/src/skyTraffic/parcels.ts — `createParcels(scene)`:
  - drop(x, y, z, vx, vz): a THREE.Group at (x, y, z) holding buildPrefab('crate', { scale: 2 }) and, above it,
    buildPrefab('parachute-canopy', { scale: 2 }) placed so its lines meet the top of the crate. At most SKY.parcelMax
    parcels: dropping another removes the oldest first.
  - update(dt, px, py, pz, onFoot): falling parcels move down at SKY.parcelFall m/s and drift by (vx, vz) decaying
    by 0.5 per second, with a slow sway (rotation.z = 0.08 * sin(t)); on reaching heightAt(x, z) they land: the
    canopy is removed from the group, and a life timer of SKY.parcelLife seconds starts; at 0 the parcel is removed.
    A landed parcel with onFoot true, horizontal distance to (px, pz) < SKY.parcelPickup and |py - y| < 2 is removed
    and pays SKY.parcelAcorns. Returns the Acorns paid this call (0 most frames).
  - `count` getter = parcels alive. clear(): remove all from the scene.
- games/gnome-theft-auto/src/skyTraffic/parcels.test.ts (new, vitest): drop at (0, 50, 0) with heightAt mocked?
  Not needed: use a spot and compute the expected floor with heightAt from '../terrain'; step update(0.1, ...) far
  from the parcel until it lands (y within 0.5 of heightAt), then call update with the player on foot at the parcel
  and expect SKY.parcelAcorns returned and count 0. Also: dropping SKY.parcelMax + 1 parcels leaves count = parcelMax.
  If buildPrefab fails in node for any reason, wrap the build in try/catch and fall back to an empty Group (the test
  must still pass).

## Contract
Keep exactly:
```ts
export interface PuffPool { readonly object: THREE.InstancedMesh; emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, size: number, life: number, color: number): void; update(dt: number): void; clear(): void; dispose(): void }
export function createPuffs(scene: THREE.Scene, capacity?: number): PuffPool;
export interface ParcelDrops { drop(x: number, y: number, z: number, vx: number, vz: number): void; update(dt: number, px: number, py: number, pz: number, onFoot: boolean): number; readonly count: number; clear(): void }
export function createParcels(scene: THREE.Scene): ParcelDrops;
```

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/skyTraffic/puffs.ts or parcels*.ts
- `npx vitest run src/skyTraffic/parcels.test.ts` passes (from games/gnome-theft-auto)

## Out of scope
Every other file.
~~~~

~~~~text
Epic: 1 Modules, issue 6: sky progress, achievements and reward prefabs
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (a git worktree; run everything from
there). Node: in Git Bash, if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
installed; do not run npm install. Do not commit, stash or switch branches. Other workers and planners are editing
other files, including possibly packages/prefabs/src/catalog/index.ts and packages/achievements/src/catalog.ts: make
small additive edits there only (insert your lines; never reformat or reorder others). No `vite build`, no dev server.
Ignore the "Environment" section of docs/roadmaps/prefab-library/_common.md (it names another worktree); its
modelling, data and examine-voice rules apply.

## Goal
Five achievements for Gnome Theft Auto's sky traffic, each with its own new cosmetic reward prefab, and
`progress.ts`, which remembers what the player has seen and calls the achievement tracker.

## Read first
- games/gnome-theft-auto/src/skyTraffic/progress.ts: the stub (keep every export and signature)
- games/gnome-theft-auto/src/skyTraffic/types.ts: AdDef
- games/gnome-theft-auto/src/saveHook.ts: `notifySaveChanged()`
- games/gnome-theft-auto/src/craft/craftRuntime.ts lines 15-45: the storage-with-memory-fallback pattern to copy
- packages/prefabs/src/catalog/gta-aircraft.ts lines 170-210: two finished reward prefabs (windsock-scarf,
  sycamore-seed-wings) to copy the style of; packages/prefabs/src/types.ts (PrefabDef); docs/roadmaps/prefab-library/_common.md
- packages/achievements/src/catalog.ts around `gta-three-ways-up` (line ~882): the def format

## Change
- games/gnome-theft-auto/src/skyTraffic/progress.ts — implement `createSkyProgress(ach, storage = localStorage-or-null)`.
  Saved under SKY_SAVE_KEY ('gta-sky-v1') as a JSON array of strings: ad ids read, plus the flags '#spotted', '#torn',
  '#downed'. Load once at creation (bad JSON or non-array = empty). Every write: setItem(JSON), then notifySaveChanged().
  If storage is null or throws, keep working in memory.
  - markSpotted(): first time ever: add '#spotted', save, `ach.unlock(SKY_ACH.spotted)`, return true; else false.
  - markRead(ad): if the id is new: add, save; if ad.egg `ach.unlock(SKY_ACH.egg)` else `ach.increment(SKY_ACH.reader)`;
    return true. Already read: false.
  - markTorn(): unlock SKY_ACH.torn; add '#torn' once. markDowned(): unlock SKY_ACH.downed; add '#downed' once.
  - readCount(): entries not starting with '#' or 'egg-'.
- games/gnome-theft-auto/src/skyTraffic/progress.test.ts (new, vitest): a fake storage (Map-backed getItem/setItem)
  and a fake tracker recording calls: markSpotted true then false and one unlock; markRead of two different normal ads
  increments twice, the same ad again returns false; an egg ad unlocks 'gta-sky-small-print'; a second
  createSkyProgress on the same storage sees readCount 2 and markSpotted false; storage null still works.
- packages/prefabs/src/catalog/gta-sky-traffic.ts (new): `export const GTA_SKY_TRAFFIC: PrefabDef[]` with five gear
  prefabs (ids must not exist yet: grep packages/prefabs/src for each first):
  - 'sky-sign-cap' (uses ['wear-head'], category 'armor'): a pilot's cap with a tiny striped banner trailing behind.
  - 'advert-roll-pack' (uses ['wear-back'], category 'armor'): a rolled-up cloth banner on a pole, strapped across the back.
  - 'banner-scrap-flag' (uses ['hold'], category 'trinket', must have `grip`): a torn scrap of banner cloth on a stick.
  - 'propeller-pendant' (uses ['wear-neck'], category 'trinket'): a small two-blade wooden propeller on a cord.
  - 'small-print-monocle' (uses ['wear-head'], category 'trinket'): a brass monocle for reading the small print.
  Each `about` ends with "Achievement reward for <title>." (titles below). Follow _common.md rules (lowest point y 0,
  5-6 examine lines, tags incl. 'reward').
- packages/prefabs/src/catalog/index.ts: import GTA_SKY_TRAFFIC next to the GTA_AIRCRAFT import and add it to the
  catalogue list the same way GTA_AIRCRAFT is added (one import line + one list entry).
- packages/achievements/src/catalog.ts: insert right after the 'gta-slipway-regular' entry:
  - { id: 'gta-sky-look-up', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Look Up!',
      description: 'Spot the advert banner towed over Turfton.', reward: { slot: 'head', prefabId: 'sky-sign-cap', label: 'Sky-Sign Cap' } }
  - { id: 'gta-sky-captive-audience', ..., title: 'Captive Audience', description: 'Read all 32 sky-banner ads.',
      target: 32, reward: { slot: 'back', prefabId: 'advert-roll-pack', label: 'Advert Roll Pack' } }
  - { id: 'gta-sky-ad-blocker', ..., title: 'Ad Blocker', description: 'Shoot the advert banner loose, or fly right through it.',
      reward: { slot: 'hand', prefabId: 'banner-scrap-flag', label: 'Banner Scrap Flag' } }
  - { id: 'gta-sky-clear-skies', ..., title: 'Clear Skies', description: 'Bring down one of the aircraft over Turfton.',
      reward: { slot: 'neck', prefabId: 'propeller-pendant', label: 'Propeller Pendant' } }
  - { id: 'gta-sky-small-print', ..., title: 'Read the Small Print', description: 'Catch the rarest banner in the sky.',
      reward: { slot: 'head', prefabId: 'small-print-monocle', label: 'Small-Print Monocle' } }

## Contract
progress.ts keeps: SKY_SAVE_KEY, SKY_ACH (ids above), SkyStorage, SkyAchievements, SkyProgress, createSkyProgress
(signatures as in the stub).

## Done when
- `npm test -w packages/prefabs` passes
- `npm test -w packages/achievements` passes
- `npx vitest run src/skyTraffic/progress.test.ts` passes (from games/gnome-theft-auto)
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/skyTraffic/progress*.ts

## Out of scope
Every other file. Do not edit saveIO.ts or cloudSave.ts (the planner adds the save key).
~~~~

## Epic 2 issue

(Run alongside Epic 1 in the end: it touches only runtime.ts and builds against the fixed contracts.)

~~~~text
Epic: 2 Runtime: the sky-traffic runtime
Depends on: none (all contracts are fixed; other modules may still be mid-edit)

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (a git worktree; run everything from
there). Node: in Git Bash, if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
installed; do not run npm install. Do not commit, stash or switch branches. Other workers are editing the other files
in games/gnome-theft-auto/src/skyTraffic/ at the same time (banner.ts, follow.ts, ads.ts, puffs.ts, parcels.ts): edit
ONLY runtime.ts and the new runtime.test.ts. No `vite build`, no dev server. Performance matters (the game has
frame-rate problems): no allocations in the per-frame path (no new arrays/objects/closures per frame; reuse scratch
objects), and keep the per-aircraft work small.

## Goal
`games/gnome-theft-auto/src/skyTraffic/runtime.ts`: `createSkyTraffic(deps)` spawns NPC aircraft as ordinary Vehicles
from the behaviour table, flies them with the follower, runs their actions (spray, smoke, parcel drops, the towed
advert banner), crashes them when shot down, releases one the player steals, and despawns them by distance.

## Read first (contracts; do not edit these files)
- games/gnome-theft-auto/src/skyTraffic/runtime.ts: the stub — keep SkyTrafficDeps, SkyTrafficInfo, SkyTraffic and
  createSkyTraffic exactly as they are
- games/gnome-theft-auto/src/skyTraffic/types.ts: SkyWaypoint, SkyBody, FollowState, SkyBehaviourDef, SkyContext, AdDef
- games/gnome-theft-auto/src/skyTraffic/config.ts: SKY (every number you need)
- games/gnome-theft-auto/src/skyTraffic/behaviours.ts: SKY_BEHAVIOURS, skyBehaviour
- Signatures you call (read them in the files, do not edit):
  - './follow': newFollow(route, body, i = 0): FollowState; stepFollow(b, st, spec, floorY, dt): number (index
    reached this step or -1; st.done true at the route's end); followSpecFor(kind): FollowSpec
  - './banner': createBanner(scene): SkyBanner with setAd(ad), update(dt, tx, ty, tz, yaw, speed, time, near),
    hitTest(x, y, z): boolean, tearLoose(), torn, gone(), hits, centre(out: THREE.Vector3), setVisible(on), dispose()
  - './ads': nextAd(prevId: string | null, rng): AdDef; READABLE_AD_COUNT
  - './puffs': createPuffs(scene): PuffPool with emit(x, y, z, vx, vy, vz, size, life, color), update(dt), clear()
  - './parcels': createParcels(scene): ParcelDrops with drop(x, y, z, vx, vz), update(dt, px, py, pz, onFoot): number
    (Acorns collected), clear()
  - './progress': createSkyProgress(achievements): SkyProgress with markSpotted(): boolean, markRead(ad): boolean,
    markTorn(), markDowned(), readCount()
  - './sounds': registerSkySounds()
  - '../vehicles': createVehicle(scene, kind, x, z, yaw): Vehicle; removeVehicle(scene, v); explodeVehicle(v)
  - '../craft/aircraft': floorUnder(x, z, y): { y: number; water: boolean }
  - '../collide': insideBox(x, y, z, boxes): boolean (true when below a box's top `h` inside its footprint)
  - '../events/api': activeWorldEvents(): { id: string; title: string }[]
  - games/gnome-theft-auto/src/types.ts: Vehicle (x, y, z, yaw, speed, vy, driver: 'none'|'player'|'npc'|..., hp,
    exploded?, questOwned?, variant?, air?: { pitch, roll, airborne, stalled }, steerVis, spec.radius), Fx
    (explode(x,y,z), spark(x,y,z)), Hud (toast(text, ms?)), World (boxes, airfield {x, z, yaw, length})

## How the game uses it (already decided; the planner wires app.ts)
app.ts calls `sky.update(dt, player.x, player.y, player.z, drivenVehicle, onFoot)` every frame after the vehicles are
stepped and before `syncVehicleMesh` runs for every vehicle; app.ts's own bullet `hitTest` calls `sky.hitTest(x, y, z)`
(banners only — the aircraft are in the shared `vehicles` list, so bullets, `blowUp` and the burning-wreck fire already
work on them). The app's `blowUp` sets `v.exploded = true` and `v.driver = 'none'`. craft/craftRuntime.ts steps any
`spec.air` vehicle with driver 'none' and `v.air.airborne === true` as a falling aircraft, so keep `v.air.airborne`
false on a downed or parked NPC craft. traffic.ts ignores vehicles with `questOwned`.

## Change: games/gnome-theft-auto/src/skyTraffic/runtime.ts
1. Exported pure helpers (tested):
   - `pickSpawn(route: SkyWaypoint[], px: number, pz: number, startAirborne: boolean, repeat: 'loop'|'rebuild'|'once'):
     { x: number; z: number; agl: number; next: number; ground: boolean }`.
     Not airborne: route[0] position, agl 0, ground true, next 0.
     Airborne and repeat 'once': k = 0. Otherwise k = the index of the route point farthest from (px, pz).
     If dist(route[k]) >= SKY.minSpawnDist: spawn at route[k] with route[k].agl, next = repeat === 'once' ? 1 (or 0 if
     the route has one point) : (k + 1) % route.length. Else: spawn at (px, pz) + unit(route[k] - player) * SKY.spawnFar
     (unit (1, 0) if zero length), agl route[k].agl, next = k. ground false.
   - `pickBehaviour(defs: readonly SkyBehaviourDef[], ctx: SkyContext, active: ReadonlySet<string>,
     cooldownUntil: ReadonlyMap<string, number>, activeCount: number): SkyBehaviourDef | null` — among defs not active,
     with cooldownUntil (default 0) <= ctx.time, player within def.radius of def.anchor, and def.when?.(ctx) !== false;
     a 'watch-copter' needs activeCount < SKY.maxTotal, every other needs activeCount < SKY.maxActive; return the one
     with the highest priority (first in table order on ties), or null.
   - `skyFloor(x: number, z: number, y: number, boxes: World['boxes']): number` — f = floorUnder(x, z, y).y; for each
     h in SKY.buildingProbe, if insideBox(x, f + h, z, boxes) then top = f + h; return top found ? top + SKY.buildingClear : f.
2. Per aircraft record (module interface, not exported): def, v: Vehicle, body: SkyBody, follow: FollowState, spec,
   state: 'flying' | 'leaving' | 'downed' | 'wreck', floorY, floorT, tickAcc, puffT, farT (seconds beyond despawnDist),
   leaveT, wreckT, forced: boolean, banner: SkyBanner | null, ad: AdDef | null, adT, adSeenT, adCredited.
3. createSkyTraffic(deps):
   - At creation: registerSkySounds(); puffs = createPuffs(deps.scene); parcels = createParcels(deps.scene);
     progress = createSkyProgress(deps.achievements); enabled = true. Read the URL once, guarded for node
     (`typeof location !== 'undefined'`): `?sky=0` -> enabled false; `?sky=<behaviour id>` -> spawn it on the first update.
   - ctx (one reused SkyContext object, fields rewritten each think): playerX/Z, heat = deps.heat(), eventActive =
     activeWorldEvents().length > 0, airfield = deps.world.airfield, time, rng = Math.random.
   - spawn(def, forced): route = def.route(ctx); s = pickSpawn(route, px, pz, def.startAirborne, def.repeat);
     v = createVehicle(deps.scene, def.kind, s.x, s.z, yaw) where yaw faces route[s.next] (for a parked start, faces
     route[1]); floor = skyFloor(s.x, s.z, 1e4, boxes) for airborne (heightAt-like start) else floorUnder(...).y;
     v.y = floor + s.agl; v.questOwned = true; v.variant = def.sound; v.driver = s.ground ? 'none' : 'npc';
     body = { x, y, z, yaw, speed: s.ground ? 0 : route[s.next].speed, vy: 0, pitch: 0, roll: 0 };
     follow = newFollow(route, body, s.next); spec = followSpecFor(def.kind); push v into deps.vehicles; if def.banner:
     banner = createBanner(deps.scene), ad = nextAd(null, Math.random), banner.setAd(ad). If def.toast and not s.ground:
     deps.hud.toast(def.toast, 3000).
   - remove(rec): banner -> tearLoose() and move it to a `loose` list; removeVehicle(deps.scene, v); splice v out of
     deps.vehicles; drop the record.
   - update(dt, px, py, pz, driven, onFoot): time += dt.
     a. Every SKY.thinkEvery s: refresh ctx; if enabled, def = pickBehaviour(...) and spawn it; for each record: if not
        forced and def.when and !def.when(ctx) and state 'flying' -> leave(rec).
        leave(rec): state 'leaving', leaveT 0, follow = newFollow([{ x: body.x + sin(yaw) * 1500, z: body.z +
        cos(yaw) * 1500, agl: 80, speed: max(body.speed, 20) }], body, 0).
     b. For each record (iterate backwards so removal is safe):
        - Stolen: if v.driver === 'player': banner -> tearLoose + loose list; v.questOwned = false; v.variant =
          undefined; set v.air.airborne from its height if v.air; drop the record WITHOUT removing the vehicle;
          cooldownUntil[def.id] = time + def.cooldown. continue.
        - Shot: if state is 'flying' or 'leaving' and (v.exploded or v.hp <= 0): if not v.exploded: explodeVehicle(v),
          deps.fx.explode(v.x, v.y, v.z), and deps.play('boom') when within 120 m of the player. state 'downed';
          v.driver = 'none'; banner -> tearLoose + loose; if within SKY.downedCredit of the player progress.markDowned()
          and deps.hud.toast(`${def.title} is going down!`, 2500).
        - Distance d = horizontal distance to the player. farT += dt when d > SKY.despawnDist else 0; farT >
          SKY.despawnAfter and state not 'wreck' -> remove, cooldownUntil = time + 20, continue.
        - 'leaving': leaveT += dt; leaveT > SKY.leaveFor -> remove (cooldownUntil = time + def.cooldown), continue.
        - 'flying' / 'leaving': tickAcc += dt; if d > SKY.farTick and tickAcc < 1 / SKY.farTickHz, skip the step.
          Otherwise step with sdt = tickAcc, tickAcc = 0: floorT -= sdt; if floorT <= 0: floorT = SKY.floorEvery;
          floorY = max(skyFloor(body.x, body.z, body.y, boxes), skyFloor(body.x + sin(yaw) * speed * SKY.floorAhead,
          body.z + cos(yaw) * speed * SKY.floorAhead, body.y, boxes)). idx = stepFollow(body, follow, spec, floorY, sdt).
          If idx >= 0 and follow.route[idx].drop: parcels.drop(body.x, body.y - 2, body.z, sin(yaw) * speed * 0.5,
          cos(yaw) * speed * 0.5) and toast 'Pigeon-Drop parcel incoming!' when d < 300.
          If follow.done: 'loop' -> follow = newFollow(follow.route, body, 0); 'rebuild' -> newFollow(def.route(ctx),
          body, 0); 'once' (or leaving) -> leave(rec) (if already leaving, keep flying straight: rebuild the leave route).
          Driver: the current waypoint is ground and follow.holdT > 0 -> v.driver = 'none' (parked: the player can get in
          without a yank), else 'npc'.
          Puffs (only when d < 600): leg = follow.route[follow.i]; if leg.smoke: puffT += sdt, emit while puffT >=
          SKY.smokeEvery at the tail (body - forward * 3, same y), zero velocity, SKY.smokeSize, SKY.smokeLife, colour
          def.puff ?? SKY.smokeColour. If leg.spray: same with SKY.sprayEvery at the tail 1.5 m lower, velocity
          (forward * speed * 0.15 + small random, -4, ...), SKY.spraySize, SKY.sprayLife, def.puff ?? SKY.sprayColour.
        - 'downed': body.yaw += SKY.crashSpin * dt; body.speed *= max(0, 1 - 0.3 * dt); body.vy -= SKY.crashGravity * dt;
          move by forward * speed and vy; roll eases to 1.2, pitch to -0.6; floor from skyFloor every SKY.floorEvery;
          when body.y <= floorY: body.y = floorY, speed 0, deps.fx.explode(...), state 'wreck', wreckT = SKY.wreckLife.
        - 'wreck': wreckT -= dt; at 0 remove, cooldownUntil = time + SKY.downedCooldown.
        - Write back to the Vehicle every frame for every state: v.x/y/z/yaw/speed/vy from body; if v.air: v.air.pitch =
          body.pitch, v.air.roll = body.roll, v.air.airborne = state === 'flying' || state === 'leaving' ? body.y -
          floorY > 0.05 : false; else v.steerVis = clamp(body.roll / 0.5, -1, 1).
        - Banner (record has one): tow point = v position - forward * v.spec.radius, y + 0.5;
          banner.update(dt, tx, ty, tz, body.yaw, body.speed, time, d < SKY.bannerDetailRange);
          banner.setVisible(d < SKY.bannerDrawDist). adT += dt; adT > SKY.adEvery -> ad = nextAd(ad.id, Math.random),
          setAd, adT = adSeenT = 0, adCredited = false. Distance d3 from (px, py, pz) to banner.centre(scratch):
          d3 < SKY.spotRange and progress.markSpotted() -> toast(`Look up! A sky-sign banner: ${ad.headline}`, 3000);
          d3 < SKY.readRange -> adSeenT += dt; adSeenT >= SKY.readTime and !adCredited -> adCredited = true; if
          progress.markRead(ad): ad.egg ? toast(`Easter egg banner: "${ad.headline}"`, 3500) :
          toast(`Ad read ${progress.readCount()}/${READABLE_AD_COUNT}: ${ad.headline}`, 2500).
          Fly-through: if driven && driven !== v && banner.hitTest(driven.x, driven.y + 0.5, driven.z) -> tear(rec).
          tear(rec): banner.tearLoose(), move it to loose, rec.banner = null, progress.markTorn(),
          toast('Ad Blocker! The banner tore loose.', 2500).
     c. Loose banners: update(dt, 0, 0, 0, 0, 0, time, true-if-within-SKY.bannerDetailRange-of-the-player-by-its-centre);
        when gone(): dispose() and remove from the list.
     d. puffs.update(dt); n = parcels.update(dt, px, py, pz, onFoot); if n > 0: deps.economy.earn(n, 'Pigeon-Drop
        parcel'), toast(`Pigeon-Drop parcel: +${n} Acorns (finder's fee)`, 2500), deps.play('chute').
   - hitTest(x, y, z): for each record with a banner: if banner.hitTest(x, y, z): deps.fx.spark(x, y, z); if
     banner.hits >= SKY.bannerTearHits -> tear(rec); return true. Return false.
   - spawn(id): def = skyBehaviour(id); unknown or already active -> false; else spawn(def, true), true.
   - list(): SKY_BEHAVIOURS in order -> { id, title, active }.
   - clear(): remove every record (vehicles out of the scene and the list), dispose all banners (active and loose),
     puffs.clear(), parcels.clear(), set every cooldownUntil to time + 5.
   - setEnabled(on): enabled = on; if !on clear().
   Use one module-level scratch THREE.Vector3 for banner.centre; Math.sin/cos inline; no per-frame allocations.
4. games/gnome-theft-auto/src/skyTraffic/runtime.test.ts (new, vitest; test only the pure helpers):
   - pickSpawn: parked start returns route[0], next 0, ground true; for a 4-point loop 1000 m wide with the player at
     the centre it spawns at a route point >= SKY.minSpawnDist away and next = (k+1) % 4; with the player standing on
     a small 100 m loop it spawns SKY.spawnFar away (within 1 m) and next = k; 'once' spawns at index 0, next 1.
   - pickBehaviour with SKY_BEHAVIOURS and a ctx at (0, 0), heat 0, no event, time 100, nothing active: returns
     'banner-tow' (priority 10, radius 700 round the origin); with 'banner-tow' active it returns another in range
     (not 'watch-copter', not 'news-copter'); with heat 2 it returns 'watch-copter'; with activeCount = SKY.maxActive
     and heat 2 it still returns 'watch-copter' but with heat 0 returns null; a cooldownUntil in the future skips that def.

## Contract
Exports: SkyTrafficDeps, SkyTrafficInfo, SkyTraffic, createSkyTraffic (exactly as in the stub), plus pickSpawn,
pickBehaviour, skyFloor.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in src/skyTraffic/runtime*.ts (errors in other
  skyTraffic files may be other workers mid-edit: re-run once before reporting)
- `npx vitest run src/skyTraffic/runtime.test.ts` passes (from games/gnome-theft-auto)

## Out of scope
Every other file (app.ts is wired by the planner).
~~~~

## Result

Done: 1 foundation (planner), Epic 1 of 6 worker issues and the Epic 2 runtime issue run in parallel (the runtime only
needed the fixed contracts), planner wiring. Planner fixes after review: the follower aims to touch down 15% of the leg
early on a leg to a ground point (`circuit.test.ts` flies the whole Flight School Circuit), sky-writing puffs bigger.
Checked live on a dev server (`?debug&offline&no-intro&sky=banner-tow`): banner renders and reads, banner tears after
12 hits, a shot copter goes down, smoke trails draw, no console errors; `tools/smoke.sh` OK.
Try: `?sky=<behaviour id>` forces one flight, `?sky=0` turns sky traffic off, `__gta.sky` under `?debug`.

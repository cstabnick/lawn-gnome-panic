# Gnome Theft Auto: fleet and damage

Goal (user requests, verbatim): "add golf cart to gta", "gta - random pitch mowers", "gta - make it so driving into water
waterlogs mower.", "gta- make it so that when mowers get damaged pieces fall off and land on the ground. right now the tire
breaks but it stays on model and breaks immersion."

## Readings decided

- **Golf cart:** a new vehicle kind `golf-cart` ("Putting-Green Cart", the existing `golf-cart` prefab from Gnome Golf,
  tinted, two seats). Lore: one of the Country Club's silent carts that wandered off its green (R-140). It is parked now and
  then in place of a ride-on or push-bike, and the ride-on/push-bike spot nearest the bus stop always holds one.
- **Random pitch mowers:** every ground vehicle's engine gets its own note (pitch x0.93..1.07, set in createVehicle), and
  the fleet table (`src/fleet.ts`) adds named variants with a wider pitch range and a small tune (Grumbler, Whine-Twin,
  Bumblebuzz, Howler, Thumper). Parked spots are dealt from the table; the trainer spawns any entry by id (`fleet.spawn(id,
  x, z, yaw)` on `__gta` with `?debug`, or `spawnFleet`). Variants are local only: online, others see the base kind.
- **Waterlogging:** shallow water (depth 0.12 up to WATER.stallDepth) soaks the engine (`v.waterlog` 0..1): it loses top
  speed, sputters above 0.35, floods and stalls at 1 (crawls at 20% throttle so it can limp out), restarts when dried below
  0.55, dries on land in about 28 s, and a garage repair clears it. Deep water still sinks the mower (swim.ts). A HUD pill
  shows the soak; steam puffs off the engine. Lore ruling R-140 refines R-050 (engines are not clay).
- **Parts falling off:** when a damage level rises, the parts that stage hides (a wheel, the golf cart's canopy) are cloned
  off the old model at their world pose, thrown, fall, bounce and rest flat on the ground for 45 s, plus 2 scrap prefabs;
  an explosion throws two wheels and 4 scraps. The prefab stages' "fallen tyre" (which rode along with the model) is named
  `fallen-tyre` and stripped by the game.
- **Achievements:** Fore! (drive the cart), Bog Standard (flood an engine), Some Assembly Required (knock 25 parts off).
- **Mobile:** no new actions; the badge is display-only. **Online:** golf-cart kind appended to VEHICLE_CODES; waterlog,
  debris and variants are local effects, not synced (cosmetic, and syncing debris would double the net traffic).
- **Party slice:** not needed (no new mode).

## Foundation (done by the planner)

types.ts (`golf-cart` kind; Vehicle `enginePitch`, `variant`, `waterlog`, `waterlogStalled`), config.ts VEHICLES['golf-cart'],
net.ts VEHICLE_CODES, sound/engineModel.ts `pitch`, sound/watchVehicles.ts and app.ts pass it, vehicles.ts (parts hooks,
stripLooseParts, waterlogSpeedMult, clearWaterlog on repair, golf cart tinted, random engine pitch), stubs fleet.ts,
waterlog.ts, debris.ts, full fleetRuntime.ts, app.ts wiring, lore ruling R-140.

## Shape

| Epic | Done when | Issues |
|------|-----------|--------|
| 1 Fleet and damage | tsc clean for these files, the four test files pass, prefabs + achievements tests pass | 4 (parallel) |

## Epic 1 issues

~~~~text
Epic: 1 Fleet and damage
Issue 1A: fleet table (src/fleet.ts)
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). If `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Other workers are editing other files in games/gnome-theft-auto and
packages/ at the same time: touch ONLY the files listed under Change. Never commit, stash, switch branches or run vite
build / dev servers. `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files that are not yours: ignore
those, fix only yours.

## Goal
src/fleet.ts holds the data-driven table of findable vehicle variants (the golf cart and odd-sounding mowers), deals them out
over the parked spots, and can spawn any entry by id.

## Read first
- games/gnome-theft-auto/src/fleet.ts: the stub. Keep every exported name and signature exactly; fill in the bodies and FLEET.
- games/gnome-theft-auto/src/types.ts: `ParkedSpot { x, z, yaw, kind }`, `Vehicle` (fields `spec`, `enginePitch?`, `variant?`).
- games/gnome-theft-auto/src/config.ts: `VEHICLES` (Record<VehicleKind, VehicleSpec>) and `MOWER_TINTS` (readonly number[]).
- games/gnome-theft-auto/src/vehicles.ts: `createVehicle(scene, kind, x, z, yaw, tint?)` returns a Vehicle (it already sets a small random enginePitch).

## Change
- games/gnome-theft-auto/src/fleet.ts:
  - Add `import { createVehicle } from './vehicles';` and `import { MOWER_TINTS, VEHICLES } from './config';`.
  - FLEET, exactly these entries (ids, kinds, names, replaces, weights, pitch; tints where given):
    1. { id: 'golf-cart', kind: 'golf-cart', name: 'Putting-Green Cart', replaces: ['ride-on', 'push-bike'], weight: 0.15,
         tints: [0xf3efe6, 0x2f6b3a, 0xd8342c, 0x3f7fbf], pitch: [1.25, 1.45] }
    2. { id: 'ride-on-grumbler', kind: 'ride-on', name: 'Grumbler Ride-On', replaces: ['ride-on'], weight: 0.25,
         pitch: [0.62, 0.75], speedMult: 0.95, accelMult: 1.1 }
    3. { id: 'ride-on-whine-twin', kind: 'ride-on', name: 'Whine-Twin Ride-On', replaces: ['ride-on'], weight: 0.25,
         pitch: [1.3, 1.5], speedMult: 1.05, accelMult: 0.95 }
    4. { id: 'push-bike-bumblebuzz', kind: 'push-bike', name: 'Bumblebuzz Push-Bike', replaces: ['push-bike'], weight: 0.3,
         tints: [0xf2c230, 0x222222], pitch: [1.4, 1.7], speedMult: 1.05 }
    5. { id: 'zero-turn-howler', kind: 'zero-turn', name: 'Howler Zero-Turn', replaces: ['zero-turn'], weight: 0.3,
         pitch: [1.15, 1.35], speedMult: 1.06 }
    6. { id: 'zero-turn-thumper', kind: 'zero-turn', name: 'Thumper Zero-Turn', replaces: ['zero-turn'], weight: 0.3,
         pitch: [0.65, 0.8], accelMult: 1.1 }
  - `planParked(spots, near, rng = Math.random)`: one ParkedPlan per spot, same order and length.
    For each spot: candidates = FLEET entries whose `replaces` includes spot.kind. total = 1 + sum of their weights;
    r = rng() * total; r < 1 means stock (entry null), else walk the candidates' cumulative weights (starting at 1) to pick.
    tint = pick from entry.tints when the entry has them, else from MOWER_TINTS: `list[Math.floor(rng() * list.length)]`
    (clamp the index to list.length - 1).
    Then the guarantee: among spots whose kind is 'ride-on' or 'push-bike', the one nearest `near` (Math.hypot on x/z) gets
    entry = the 'golf-cart' entry and a tint from its tints (if there is no such spot, skip this).
  - `applyVariant(v, e, rng = Math.random)`: v.variant = e.id; v.spec = { ...v.spec, name: e.name,
    maxSpeed: v.spec.maxSpeed * (e.speedMult ?? 1), accel: v.spec.accel * (e.accelMult ?? 1) } (a NEW object: never mutate
    VEHICLES[...]); v.enginePitch = e.pitch[0] + (e.pitch[1] - e.pitch[0]) * rng().
  - `spawnFleet(scene, id, x, z, yaw, rng = Math.random)`: if fleetEntry(id) exists: v = createVehicle(scene, e.kind, x, z,
    yaw, tint picked as above), applyVariant(v, e, rng), return v. Else if `id in VEHICLES` (a plain VehicleKind): return
    createVehicle(scene, id as VehicleKind, x, z, yaw, MOWER_TINTS[Math.floor(rng() * MOWER_TINTS.length)]). Else null.
- games/gnome-theft-auto/src/fleet.test.ts (new), vitest. Add `vi.mock('./audio', () => ({ play: () => undefined }));` at
  the top (vehicles.ts imports audio). Tests:
  - FLEET ids are unique kebab-case; every entry's kind is a key of VEHICLES; pitch[0] <= pitch[1]; fleetEntry('golf-cart')?.kind === 'golf-cart'.
  - planParked keeps order/length; with rng = () => 0 every spot is stock except the guaranteed golf cart; the golf cart
    goes to the nearest ride-on/push-bike spot to `near`; with rng = () => 0.999 a 'zero-turn' spot gets a zero-turn variant;
    boat-kind spots (e.g. 'walnut-dinghy') are always stock.
  - applyVariant does not change VEHICLES['ride-on'].name or maxSpeed, sets v.variant and v.enginePitch inside the range.
    Use a plain object cast as Vehicle for v (like `{ spec: VEHICLES['ride-on'] } as unknown as Vehicle`) so no scene is needed.
  - spawnFleet with a `new THREE.Scene()`: 'golf-cart' returns a vehicle of kind 'golf-cart' named 'Putting-Green Cart';
    'ride-on' returns a stock ride-on; 'nope' returns null.

## Contract
Keep the stub's exported names and signatures exactly: FleetEntry, FLEET, fleetEntry, ParkedPlan, planParked, applyVariant,
spawnFleet, Rng. app.ts and fleetRuntime.ts already call them.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in fleet.ts or fleet.test.ts.
- `npm test -w games/gnome-theft-auto -- src/fleet.test.ts` passes.

## Out of scope
Every other file. Do not edit app.ts, vehicles.ts, config.ts, types.ts, fleetRuntime.ts, waterlog.ts, debris.ts or packages/.
~~~~

~~~~text
Epic: 1 Fleet and damage
Issue 1B: waterlogged engines (src/waterlog.ts)
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). If `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Other workers are editing other files in games/gnome-theft-auto and
packages/ at the same time: touch ONLY the files listed under Change. Never commit, stash, switch branches or run vite
build / dev servers. `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files that are not yours: ignore
those, fix only yours.

## Goal
A mower driven through water soaks its engine (v.waterlog 0..1): it loses top speed, sputters, floods and stalls at 1
(it can still crawl out), and dries out on land. Fill in the stub src/waterlog.ts.

## Read first
- games/gnome-theft-auto/src/waterlog.ts: the stub with WATERLOG tuning and the four exported functions. Keep names/signatures.
- games/gnome-theft-auto/src/swim.ts: how checkSink reads water (`waterAt(v.x, v.z)` returns `{ surface, depth } | null`;
  "in the water" means `w && v.y < w.surface`). Import `waterAt` from './terrain' and `WATER` from './config'
  (`WATER.stallDepth` = 0.9).
- games/gnome-theft-auto/src/swim.test.ts: the `mower(x, z, extra)` test helper and the known water spots: the canal at
  (-150, 230) has depth between 0.7 and 0.9 (shallow enough not to sink); (0, 0) is dry land.

## Change
- games/gnome-theft-auto/src/waterlog.ts (must NOT import vehicles.ts):
  - Add `limp: 0.2` to WATERLOG (throttle share a stalled engine still gives, so a stalled mower can crawl out of the water).
  - `stepWaterlog(v, dt)`:
    - Return null and change nothing when v.spec.boat, v.spec.flies, v.exploded or v.sunk.
    - prev = v.waterlog ?? 0. w = waterAt(v.x, v.z). Soaking when w && w.depth >= WATERLOG.minDepth && v.y < w.surface.
    - Soaking: d01 = clamp((w.depth - minDepth) / (WATER.stallDepth - minDepth), 0, 1);
      rate = soakShallow + (soakDeep - soakShallow) * d01, times splashMult when Math.abs(v.speed) > 8;
      wl = Math.min(1, prev + rate * dt). Otherwise wl = Math.max(0, prev - WATERLOG.dryPerS * dt).
    - v.waterlog = wl. Events, checked in this order, return the first that fires:
      1. !v.waterlogStalled && wl >= 1: v.waterlogStalled = true, return 'flooded'.
      2. v.waterlogStalled && wl < restartAt: v.waterlogStalled = false, return 'restarted'.
      3. prev < sputterAt && wl >= sputterAt: return 'soaked'.
      4. prev > 0 && wl === 0: return 'dry'.
      else null.
  - `waterlogThrottle(v, throttle, t)`: wl = v.waterlog ?? 0. wl <= 0: return throttle unchanged.
    Stalled: return throttle * WATERLOG.limp. If wl >= sputterAt: cut = 0.5 * (wl - sputterAt) / (1 - sputterAt);
    phase = fractional part of (t * 1.7 + v.id * 0.37); if phase < cut return 0 (a sputter). Otherwise return
    throttle * (1 - 0.4 * wl).
  - `waterlogSpeedMult(v)`: 1 - (1 - WATERLOG.minSpeedMult) * (v.waterlog ?? 0).
  - Leave clearWaterlog as it is.
- games/gnome-theft-auto/src/waterlog.test.ts (new), vitest, using a `mower(x, z, extra)` helper copied from swim.test.ts
  (with `vi.mock('./audio', () => ({ play: () => undefined }));`). Tests:
  - On dry land (0, 0) a fresh mower stays at waterlog 0 and returns null.
  - In the canal (-150, 230) with y = bedAt(x, z): stepping 0.1 s at a time, waterlog rises, 'soaked' fires once when it
    passes 0.35, 'flooded' fires once at 1 and sets waterlogStalled.
  - A flooded mower moved to (0, 0) dries; 'restarted' fires once below 0.55 and clears waterlogStalled; 'dry' at 0.
  - Boats (spec VEHICLES['walnut-dinghy']), flyers (VEHICLES['whirligig']) and sunk mowers never change.
  - waterlogThrottle: dry -> unchanged; stalled -> 0.2x; soaked below sputterAt -> scaled by (1 - 0.4 wl); at wl 0.9 some t
    values give 0 (try t = 0, 0.05, ... 2) and some do not.
  - waterlogSpeedMult: 1 at 0, 0.4 at 1.

## Contract
Exports stay exactly: WATERLOG, WaterlogEvent, stepWaterlog(v, dt), waterlogThrottle(v, throttle, t), waterlogSpeedMult(v),
clearWaterlog(v). vehicles.ts calls waterlogSpeedMult and clearWaterlog; fleetRuntime.ts calls stepWaterlog and waterlogThrottle.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in waterlog.ts or waterlog.test.ts.
- `npm test -w games/gnome-theft-auto -- src/waterlog.test.ts src/swim.test.ts` passes.

## Out of scope
Every other file (swim.ts, vehicles.ts, app.ts, fleetRuntime.ts, config.ts, types.ts stay untouched).
~~~~

~~~~text
Epic: 1 Fleet and damage
Issue 1C: parts that fall off (src/debris.ts)
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). If `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Other workers are editing other files in games/gnome-theft-auto and
packages/ at the same time: touch ONLY the files listed under Change. Never commit, stash, switch branches or run vite
build / dev servers. `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files that are not yours: ignore
those, fix only yours. three.js is the renderer (`import * as THREE from 'three'`).

## Goal
When a mower's damage level rises, the parts that damage stage removes (a wheel, a canopy) become real objects in the world
that fly off, fall, bounce and come to rest lying flat on the ground, along with a couple of scrap pieces, then fade out
after a while. Fill in the stub src/debris.ts.

## Read first
- games/gnome-theft-auto/src/debris.ts: the stub. DEBRIS tuning, LOOSE_PART, SCRAP_PREFABS, the DebrisSystem interface,
  createDebris, stripLooseParts (already done, keep it), hiddenBetween. Keep every exported name and signature.
- packages/prefabs/src/types.ts: `DamageStage { name; hide?: readonly string[]; ... }` and `PrefabDef.damage?: readonly DamageStage[]`.
- packages/prefabs/src/catalog/damage-stages.ts: RIDE_ON_DAMAGE (the 'ride-on-mower' prefab): stage 2 ('wrecked') hides 'wheel-1'.
- games/gnome-theft-auto/src/vehicles.ts lines 76-115 (applyDamageLevel): it calls the parts hook BEFORE setPrefabDamage
  rebuilds the body, so the body still holds the old parts; the body is `v.object.children[0]`. Vehicle fields used: x, y, z,
  yaw, speed, tint, spec.prefab, spec.scale, object.

## Change
- games/gnome-theft-auto/src/debris.ts (must NOT import vehicles.ts). Imports: `buildPrefab, getPrefab` from '@lawn/prefabs',
  `heightAt` from './terrain'.
  - `hiddenBetween(prefabId, fromLevel, toLevel)`: stages = getPrefab(prefabId)?.damage ?? []. For stage index i from
    max(0, fromLevel) to min(toLevel, stages.length) - 1, collect stages[i].hide (in order, no repeats). Return [] when none.
  - A piece: { object, vx, vy, vz, wx, wy, wz (angular velocity rad/s), lying: THREE.Quaternion, restY: number,
    resting: boolean, age: number, fadeMats: THREE.Material[] | null }.
  - Throwing a piece `obj` (a clone already at its world pose and added to the scene): velocity = vehicle forward velocity
    (Math.sin(yaw) * speed, Math.cos(yaw) * speed) * DEBRIS.carry + the horizontal direction from (v.x, v.z) to the piece
    (random direction when closer than 0.01) * DEBRIS.pop * (0.7 + 0.6 * Math.random()), and vy = random in
    [DEBRIS.upMin, DEBRIS.upMax]; angular velocity random in [-6, 6] on each axis. Set castShadow on its meshes.
    Lying pose: with the object's quaternion set to identity, take Box3.setFromObject(object) size; the axis (x, y or z)
    with the smallest extent must point world-up: lying = quaternion rotating that local axis onto +Y
    (`new THREE.Quaternion().setFromUnitVectors(axis, new THREE.Vector3(0, 1, 0))`), premultiplied by a random yaw about +Y.
    restY: set the quaternion to `lying`, position to (0, 0, 0), updateMatrixWorld(true), restY = -Box3.setFromObject(object).min.y.
    Then put the throw's real position and quaternion back.
  - `detach(v, body, fromLevel, toLevel)`: v.object.updateMatrixWorld(true). For each name of hiddenBetween(v.spec.prefab,
    fromLevel, toLevel): o = body.getObjectByName(name); skip if missing or it has no visible Mesh under it. clone =
    o.clone(true); o.matrixWorld.decompose(clone.position, clone.quaternion, clone.scale); scene.add(clone); throw it.
    Then throw DEBRIS.scrapsPerLevel scraps. Return the number of pieces thrown. Do not remove `o` (the rebuild drops it).
  - Scraps: id = SCRAP_PREFABS[Math.floor(Math.random() * SCRAP_PREFABS.length)]; skip when getPrefab(id) is undefined
    (the prefabs are added by another worker; your code must work without them). obj = buildPrefab(id, { scale: v.spec.scale,
    tint }) where tint = v.tint (or 0x151515 for burst); position (v.x, v.y + 0.5 * v.spec.scale, v.z); scene.add; throw it.
  - `burst(v)`: body = v.object.children[0]; if none return 0. v.object.updateMatrixWorld(true). For 'wheel-0'..'wheel-3'
    present in body with a visible mesh under it, take at most 2 (random pick): clone at world pose as in detach, throw it,
    then `o.removeFromParent()` so the wreck loses it. Then DEBRIS.scrapsOnExplode scraps (tint 0x151515). Return the count.
  - Cap: whenever pieces.length > DEBRIS.max, remove the oldest at once (removeFromParent, dispose fadeMats).
  - `update(dt)` (dt clamped to 0.1): for each piece:
    - Flying: vy -= DEBRIS.gravity * dt; position += v * dt; rotate by the angular velocity (multiply the quaternion by
      `new THREE.Quaternion().setFromEuler(new THREE.Euler(wx * dt, wy * dt, wz * dt))`, reuse temp objects).
      ground = heightAt(x, z). When position.y <= ground + restY: position.y = ground + restY; vy = -vy * DEBRIS.bounce;
      vx, vz *= DEBRIS.friction; angular *= 0.5; if |vy| < DEBRIS.settleSpeed and Math.hypot(vx, vz) < DEBRIS.settleSpeed,
      resting = true.
    - Resting: quaternion.slerp(lying, Math.min(1, 8 * dt)); position.y = heightAt(x, z) + restY.
    - age += dt. Past DEBRIS.life: on the first frame clone each mesh's material(s) into fadeMats (transparent = true) and
      assign them (the originals are shared with live vehicles and the prefab cache: NEVER change or dispose them, and never
      dispose any geometry); opacity = 1 - (age - life) / fade. Past life + fade: removeFromParent, dispose only fadeMats,
      drop the piece.
  - `count()` = pieces.length; `clear()` removes all (same disposal rule).
- games/gnome-theft-auto/src/debris.test.ts (new), vitest:
  - hiddenBetween('ride-on-mower', 0, 2) and (1, 2) are ['wheel-1']; (0, 1) is []; an unknown id gives [].
  - stripLooseParts removes a child named 'fallen-tyre' and one named 'fallen-tyre-mirror' from a Group, keeps others, returns 2.
  - With scene = new THREE.Scene() and a fake vehicle: object = new THREE.Group() holding
    body = buildPrefab('ride-on-mower', { scale: 1.5 }) at x = 0, z = 0, y = heightAt(0, 0); `{ x: 0, y, z: 0, yaw: 0,
    speed: 5, tint: 0xd8342c, spec: { prefab: 'ride-on-mower', scale: 1.5 }, object } as unknown as Vehicle`:
    detach(v, body, 1, 2) returns >= 1 and the scene gains that many children; after update(1/30) for 5 s every piece is
    resting with its lowest point within 0.05 of heightAt at its x/z (check via Box3.setFromObject); after 50 more seconds
    count() is 0 and the scene is empty again.
  - burst(v) on a fresh fake vehicle returns >= 2 and the body has 2 fewer of 'wheel-0'..'wheel-3'.
  - Throwing more than DEBRIS.max pieces keeps count() <= DEBRIS.max.

## Contract
Exports stay exactly: DEBRIS, LOOSE_PART, SCRAP_PREFABS, DebrisSystem, createDebris(scene), stripLooseParts(body),
hiddenBetween(prefabId, from, to). vehicles.ts imports stripLooseParts; fleetRuntime.ts calls createDebris and
detach / burst / update.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in debris.ts or debris.test.ts.
- `npm test -w games/gnome-theft-auto -- src/debris.test.ts` passes.

## Out of scope
Every other file: vehicles.ts, fleetRuntime.ts, app.ts and everything in packages/ (another worker adds the scrap prefabs).
~~~~

~~~~text
Epic: 1 Fleet and damage
Issue 1D: scrap and reward prefabs, golf cart damage stages, achievements
Depends on: none

## Environment
Repo root: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). If `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Other workers are editing files in games/gnome-theft-auto at the same time:
touch ONLY the files listed under Change. Never commit, stash, switch branches or run vite build / dev servers.

## Goal
The prefab library gains three scrap debris pieces and three reward gear items for Gnome Theft Auto, the golf cart gets
damage stages (its canopy and a wheel come off when wrecked), the mowers' "fallen tyre" damage parts get a name so the game
can replace them with real falling wheels, and three new achievements exist.

## Read first
- docs/roadmaps/prefab-library/_common.md: prefab rules (sizes in gnome heights, 4+ examine lines of at most 160 chars,
  damage-stage rules).
- packages/prefabs/src/types.ts: `Part` (s, d, name, group, at, rot, scale, c, alpha, seg, mirror) and `PrefabDef`, `DamageStage`.
- packages/prefabs/src/catalog/gta-odd-rides.ts: a whole small catalog file, incl. the 'sunday-driver-cap' (wear-head) example.
- packages/prefabs/src/catalog/gnome-theft-auto.ts lines 198-236: 'flight-goggles' (wear-head) and 'water-tank-pack' (wear-back, with `wear`).
- packages/prefabs/src/catalog/damage-stages.ts and packages/prefabs/src/catalog/golf-cart.ts.
- packages/achievements/src/catalog.ts: the 'gta-sunday-driver' entry (around line 735) for the shape.

## Change
- packages/prefabs/src/catalog/gta-fleet.ts (new): `export const GTA_FLEET: readonly PrefabDef[]` with, in this order:
  - 'mower-scrap-panel' "Mower Panel Scrap", category 'prop', uses ['place'], tint 0xd8342c: a bent body panel about
    0.45 x 0.03 x 0.3 with a slight kink (two 'tint' boxes at a few degrees to each other) and one bolt head. Origin at its
    centre-bottom, lying flat.
  - 'mower-scrap-bolt' "Loose Bolt": a hex bolt (cyl seg 6 head + thin cyl shank), about 0.14 long, steel/iron colours.
  - 'mower-scrap-spring' "Seat Spring": a coil spring of 5 stacked thin 'ring' parts, about 0.2 tall, steel.
  - 'country-club-visor' "Country Club Visor", category 'armor', uses ['wear-head']: a white visor band with a green peak and
    a tiny flag pin; size like 'sunday-driver-cap'.
  - 'spark-plug-pendant' "Spark Plug Pendant", category 'armor', uses ['wear-neck']: a cord ring with a little spark plug
    hanging at the front (white ceramic cyl, steel hex, copper tip).
  - 'spare-tyre-pack' "Spare Tyre Pack", category 'armor', uses ['wear-back'], with `wear` like 'water-tank-pack': a small
    black tyre with a steel hub on a dark frame with two shoulder straps.
  Each has tags (include 'gta'), emoji: [], `about` (one plain line starting "Gnome Theft Auto: ..."), and 4-5 examine lines
  (gnome voice: what it looks like, a saying, a tip, a dry joke; gnomes never know what a Tall-One object really is).
- packages/prefabs/src/catalog/index.ts: `import { GTA_FLEET } from './gta-fleet';` and append `...GTA_FLEET,` as the last
  entry of the CATALOG array.
- packages/prefabs/src/catalog/damage-stages.ts:
  - `fallenTyre` gets `name: 'fallen-tyre'` on the part it returns (the game strips parts with that name and throws a real wheel).
  - Add `export const GOLF_CART_DAMAGE: readonly DamageStage[]` (uses the file's dent/scorch/smoke helpers):
    stage 1 { name: 'dented', darken: 0.25, morph: { canopy: { rot: [0, 0, 5] } },
              add: [dent(0.3, 0.62, -0.6, 0.35, 0.3, -8), scorch(-0.3, 0.556, 0.75, 0.3, 0.3)] }
    stage 2 { name: 'wrecked', darken: 0.6, sink: 0.04, hide: ['canopy', 'wheel-3'],
              morph: { hood: { rot: [-12, 0, 0], at: [0, 0.06, 0] } }, add: [...smoke(0, 0.6, 0.75, 1)] }
    Check the y values sit on the surfaces (rear tub top is y 0.6, hood top is y 0.55) and adjust if the tests say so.
- packages/prefabs/src/catalog/golf-cart.ts: in 'golf-cart' only (not 'golf-cart-4'): give the canopy box `name: 'canopy'`
  and the cream hood box `name: 'hood'`, add `damage: GOLF_CART_DAMAGE` (import it from './damage-stages'). Change nothing else.
- packages/achievements/src/catalog.ts: right after the 'gta-sunday-driver' entry add:
  { id: 'gta-fore', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Fore!',
    description: 'Drive the Putting-Green Cart.', reward: { slot: 'head', prefabId: 'country-club-visor', label: 'Country Club Visor' } },
  { id: 'gta-swamp-engine', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Bog Standard',
    description: 'Drive a mower through water until its engine floods and stalls.',
    reward: { slot: 'neck', prefabId: 'spark-plug-pendant', label: 'Spark Plug Pendant' } },
  { id: 'gta-bits-everywhere', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Some Assembly Required',
    description: 'Knock 25 parts off mowers.', target: 25,
    reward: { slot: 'back', prefabId: 'spare-tyre-pack', label: 'Spare Tyre Pack' } },

## Contract
Prefab ids exactly: mower-scrap-panel, mower-scrap-bolt, mower-scrap-spring, country-club-visor, spark-plug-pendant,
spare-tyre-pack. Part names exactly: 'fallen-tyre' (damage-stages fallenTyre), 'canopy' and 'hood' (golf-cart).
Achievement ids exactly: gta-fore, gta-swamp-engine, gta-bits-everywhere (the game already calls them).

## Done when
- `npm test -w packages/prefabs` passes (includes damage-stage and catalog checks).
- `npm test -w packages/achievements` passes.
- `npx tsc --noEmit -p packages/prefabs` (if it has a tsconfig) shows no errors in your files.

## Out of scope
Everything under games/. Other catalog files besides the four listed.
~~~~

## Bug fixes after Epic 1

### "Driving into water crashes the game"

Reproduced in headless Edge (`?debug&mount=ride-on&mountat=-600,-680,-1.5708`, hold W into Loch Moss): the page threw
`TypeError: Cannot read properties of undefined (reading 'ctrl')` in app.ts `frame` and the game froze.

Root cause (already at HEAD, not the waterlog code): in the physics drive (every driving mode except Arcade), app.ts called
`checkSink(v)` and then read `v.sim.ctrl.telemetry` for the skid sound. `checkSink` clears `v.sim` on the frame a mower
sinks in deep water, so that read threw and stopped the frame loop. Fix: app.ts keeps the chassis (`const sim = v.sim`)
before stepping and reads `sim.ctrl.telemetry`. Regression tests: `src/sinkSim.test.ts` (checkSink clears v.sim; the
driving step never reads `v.sim.ctrl`), and `src/fleetRuntime.test.ts` drives arcade and physics mowers into the canal and
the loch with the fleet runtime wired in (no throw, no NaN, soaks, sinks). After the fix the same headless run swims the
gnome out with no page error, and an arcade run into the canal soaks the engine as designed.

### "A bunch of stuff spawns in the road"

Measured at load with `surfaceAt(...).kind === 'asphalt'`: 8 of 29 parked vehicles stood on the road. These were the
kerb-side spots from world.ts (e.g. the ride-on at (-3.8, 22) by the bus stop, which this workstream turned into the
guaranteed golf cart, plus golf carts and variants dealt onto other kerb spots). Fix: `clearOfRoads` (fleet.ts) moves any
land spot whose centre or 1.8 m clearance ring touches a road (or a building box, or water) to the nearest clear spot
within 15 m, 6 m from the others, before planParked; app.ts passes `worldSpotChecks(world)` (fleetRuntime.ts: surfaces.ts
surfaceAt + collide.ts insideBox + waterAt). Boats keep their moorings. Debris that comes to rest on a road now fades after
3 s (`DEBRIS.roadLife`) instead of lying there for 45 s. Regression tests: `src/parkedRoads.test.ts` (synthetic road band,
the real built map: no parked land vehicle touches a road and none are lost, and the debris road tidy).

Also on asphalt at load, not this workstream's and not changed by any workstream in this batch (both files are unmodified
from HEAD): seven HOA Foreclosure Signs from `easterEggs.ts` HOA_SIGN_SPOTS (sign-1 (7, 65), sign-9, sign-10, sign-12,
sign-13, sign-14, sign-15 by centre point), the vibe-NPC set pieces from `vibeNpcs.ts` (e.g. the lawn chair and windsock
at (565, -110), and groups at (-260, -10), (40, -330), (0, 260), (123, -133), (428, -102)), and two acorn collectibles at
(270, 20) and (374, 48). Left for whoever owns those files.

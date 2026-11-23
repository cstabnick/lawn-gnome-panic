# Gnome Theft Auto: air and sea (flight + hull handling, three new aircraft, Slipway paint and tuning)

Request: "figure out how to extend the vehicle handling model to support flying and helicopters and boats. Then add 3 new
flying vehicles. Add mechanics for player to tune their boats and planes and color them."

## Design: one handling model, three regimes

Every regime is a pure step over plain data with a per-vehicle spec (no DOM, no three.js, no game imports), plus thin game glue.
All shared types live in `games/gnome-theft-auto/src/craft/model.ts`.

| Regime | Pure step | Per-vehicle spec | Glue |
| --- | --- | --- | --- |
| ground | `@lawn/vehicle` controller + `handling.ts` profiles (unchanged) | `PROFILES[kind]` | `simdrive.ts` / `vehicles.ts` arcade |
| hull (water) | `craft/hull.ts` `stepHull(body, BoatState, HullSpec, controls, WaterSampler, dt)` | `hullSpecOf(VehicleSpec)` (spec + `WATER.boat`) | `boats.ts` `stepBoat` delegates; box collisions stay there |
| air | `craft/flight.ts` `stepAir(body, AirState, AirSpec, AirControls, AirEnv, dt)` | `VEHICLES[kind].air` (`AirSpec`) | `craft/aircraft.ts` `stepAircraft` (floor, tuning, buildings, damage) |

Air sub-regimes (`AirSpec.regime`), all on the same three inputs the game already has on keyboard, touch and gamepad
(`DriveControls`: throttle = W/S, touch stick, left stick or triggers in drive; steer = A/D, stick X; lift = Space up /
Shift or C down, touch Up/Down buttons, gamepad RT - LT in fly mode):

- `fixed-wing`: throttle = engine, steer = rudder/bank (yaw), lift = elevator (pitch: climb/dive). Needs `stallSpeed` to lift
  off and to climb; below it in the air the nose drops and it sinks. Hard touchdowns (down speed over `safeTouchdown`) damage.
- `rotor`: lift = collective (hover, climb, descend), throttle = cyclic (forward/back speed target, tilts the nose), steer =
  pedals (yaw, even in a hover). Only moves sideways off the ground.
- `buoyant` (balloon): lift = burner (slow vertical response), throttle = a small fan, steer = slow yaw. Unpowered it sinks
  slowly instead of falling.

Unpowered (pilot bailed out, or 0 hp) every regime loses thrust and lift and sinks at `sinkRate`. The floor under an aircraft
is the highest of terrain, a bridge or skyway deck (`highways/deck.ts deckSurfaceBelow`, read only) and the water surface:
aircraft float on water (they never go through the ground-vehicle sink path in `swim.ts checkSink`).

The Crop Duster (`plane`) and the Whirligig keep their own older code paths (no `air`); migrating them is one `air` entry
each plus deleting `stepPilotedPlane`, left for later because story quests and cutscenes fly them.

Tuning (`craft/tuning.ts`): four stats bought in levels 0..3 with Acorns, modest multipliers: Engine (+8%/level thrust or
accel), Top Speed (+5%/level), Handling (+7%/level turn rate, and boat side grip), Lift (air only: +8%/level climb rate,
-4%/level stall speed). Owned per model in `gta-craft-tune-v1` (`craft/craftTuneStore.ts`, in the cloud save). Applied to
the player's own boat (`boats.ts`) and aircraft (`aircraft.ts`) only.

Paint: boats and aircraft have no `@lawn/glaze` rig, so they are kept out of `GLAZE_KINDS` (which means "rigged ground
vehicle" to the shop, mounts and handling tests). `glazeStore.ts CRAFT_GLAZE_KINDS` lets their owned `Loadout` (only `paint`
matters) save under the same `gta-glaze-v1` key, and `vehicles.ts setVehicleLook` re-tints a craft's prefab (`c: 'tint'`
parts). The shop is the **Wingwright's Slipway** (`craft/craftShop.ts`): a bottom sheet that opens on a stopped boat or
aircraft anywhere (button, L key, gamepad D-pad up). Its tabs are Glaze `Panel`s registered with `registerGlazePanel`
(`craft-paint` order 60, `craft-tune` order 70, `appliesTo = isCraftKind`).

Online: the three kinds are appended to `net.ts VEHICLE_CODES`; remote players see the broadcast pose like any vehicle.
Mobile: no new flight controls are needed (fly mode already has touch Up/Down, stick and gamepad triggers); the Slipway
sheet uses 44 px targets and fits 390x844.

## The new vehicle kinds (for the trainer and the later hangar / boathouse storage)

| id | Name | Regime | Prefab | Spawn |
| --- | --- | --- | --- | --- |
| `hedge-hopper` | Hedge-Hopper | fixed-wing | `hedge-hopper` | Desert Airfield apron (airfield + (-15, 18)) |
| `sycamore-copter` | Sycamore Copter | rotor | `sycamore-copter` | airfield + (22, 26) |
| `dandelion-drifter` | Dandelion Drifter | buoyant | `dandelion-drifter` | airfield + (50, 28) |

Construct any of them (or any boat) with `craft/spawns.ts spawnCraft(scene, kind, x, z, yaw)` (= `createVehicle`), push it
into the game's `vehicles` list, done: `createVehicle` sets `v.air` for spec.air kinds and floats boats. Storage only needs
`kind`, position, yaw, `hp`, and the owned look/tune are per model. Spawn table: `craft/spawns.ts CRAFT_SPAWNS`.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 0 Foundation (planner, done) | tsc clean for these files | types (kinds, `spec.air`, `v.air`), config VEHICLES entries, `craft/model.ts`, stubs, `spawns.ts`, `CRAFT_GLAZE_KINDS`, net codes, save key, `KEYS.craftShop` |
| 1 Build | each issue's tests + tsc | 7 parallel: A flight, B hull + boats.ts, C tuning + store, D prefabs + achievements, E lore, F Slipway shop + panels, G aircraft glue + vehicles.ts |
| 2 Integration (planner) | tsc, game tests, prefabs/achievements/lore checks | `craft/craftRuntime.ts`, app.ts wiring, gamepad D-pad up, engine sounds |

Status: all three epics done. Epic 2 (planner): `craft/craftRuntime.ts` (spawns, Slipway, owned paint on boarding, unmanned
aircraft fall, stall / hard-landing toasts, Three Ways Up via `gta-air-flown-v1`), app.ts (import, `createCraftRuntime`,
`craft.onEnter` in takeWheel, `craft.update` after stepCoasting, pointer lock off while the Slipway is open), gamepad D-pad up,
engine sounds in `sound/engines.ts` TABLE, save keys in saveIO/cloudSave, tests adjusted (glazeStore, saveIO).

## Epic 1 issues

~~~~text
COMMON ENVIRONMENT (pasted into every issue)
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows; Git Bash). If node is not found:
export PATH="/c/Program Files/nodejs:$PATH". Dependencies are installed; do NOT run npm install.
Other workers are editing OTHER files in the same repo at the same time, so `npx tsc --noEmit -p games/gnome-theft-auto`
may show errors in files that are not yours: ignore those, fix only errors in your files.
Do NOT commit, push, stash, switch branches, run `vite build` / `npm run build`, or start a dev server.
Repo rules: CC0/self-made assets only; visible objects come from the prefab library (@lawn/prefabs); UI touch targets at
least 44 px, working at a 390x844 phone viewport; never restyle or hide the shared #ui element.
Coordinates: y up, 1 unit = 1 m ~ one gnome. yaw 0 faces +z; forward = (sin yaw, 0, cos yaw); steer +1 = right = yaw DECREASES.
~~~~

Each worker was given the COMMON ENVIRONMENT block plus one issue below.

~~~~text
Epic: 1 Build. Issue A: the air regime (craft/flight.ts stepAir) and its tests
Depends on: none

## Goal
A pure, tested flight step for three aircraft regimes (fixed-wing, rotor, buoyant), driven by plain data.

## Read first
- games/gnome-theft-auto/src/craft/model.ts: AirSpec, AirState, AirBody, AirControls, AirEnv, AirStepResult (do not edit)
- games/gnome-theft-auto/src/craft/flight.ts: the stub you replace (keep both exported signatures exactly)
- games/gnome-theft-auto/src/config.ts: VEHICLES['hedge-hopper'|'sycamore-copter'|'dandelion-drifter'].air (example specs)

## Change
- games/gnome-theft-auto/src/craft/flight.ts (you own it). Imports only from './model'. Implement
  stepAir(body, st, spec, c, env, dt): AirStepResult:
  0. If !(dt > 0) return a zero result. Clamp dt to at most 0.1. Remember wasAir = st.airborne, wasStalled = st.stalled,
     and a copy of body (x, y, z, yaw, speed, vy) for the NaN guard (step 8).
     floor = env.floorY; ceil = Math.max(spec.ceiling, floor + 5); onFloor = body.y - floor <= 0.05.
     If !c.powered treat throttle = 0 and lift = 0. ease(rate) = Math.min(1, rate * dt). clamp01(x) = max(0, min(1, x)).
  1. fixed-wing (stall = spec.stallSpeed ?? 0.4 * spec.maxSpeed):
     - Speed: throttle > 0: speed = min(maxSpeed, speed + thrust * throttle * dt). throttle < 0: speed = max(0, speed -
       (onFloor ? 1.5 : 0.8) * thrust * -throttle * dt). throttle == 0: speed *= Math.pow(onFloor ? (env.water ? 0.3 : 0.5)
       : spec.drag, dt). Never negative (planes do not reverse).
     - Vertical target: auth = clamp01((speed - 0.7 * stall) / (0.3 * stall)). target = lift > 0 ? lift * climbRate * auth
       : (lift < 0 && !onFloor) ? lift * climbRate : 0. On the floor below stall: target = 0. In the air below stall:
       target = Math.min(target, -spec.sinkRate * (1 - speed / stall)). Unpowered in the air: target = -spec.sinkRate * 0.6.
       vy += (target - vy) * ease(spec.climbResponse).
     - Yaw: gate = onFloor ? clamp01(speed / 3) * 0.6 : clamp01(speed / stall); yaw -= steer * turnRate * gate * dt.
  2. rotor (rev = spec.reverseFrac ?? 0.3):
     - Vertical: powered: target = lift * climbRate (on the floor a negative target becomes 0); unpowered: target = -sinkRate.
       vy += (target - vy) * ease(climbResponse).
     - Horizontal, only when not onFloor: powered: want = throttle >= 0 ? throttle * maxSpeed : throttle * maxSpeed * rev;
       speed += clamp(want - speed, -thrust * dt, thrust * dt); unpowered: speed *= Math.pow(drag, dt).
       On the floor: speed *= Math.pow(0.2, dt).
     - Yaw: powered: yaw -= steer * turnRate * dt (also on the floor: it pivots on its skids).
  3. buoyant: the rotor formulas (its spec numbers make it slow), except yaw only when powered and not on the floor.
  4. Integrate: body.y += vy * dt; if body.y > ceil: body.y = ceil, vy = Math.min(vy, 0).
     If body.y <= floor: if (wasAir || vy < -0.5): touchdownSpeed = Math.max(0, -vy); damage = Math.max(0, touchdownSpeed -
     spec.safeTouchdown) * spec.touchdownDamage; fixed-wing with touchdownSpeed > safeTouchdown also speed *= 0.4.
     Then body.y = floor, vy = 0.
     Horizontal: body.x += Math.sin(yaw) * speed * dt; body.z += Math.cos(yaw) * speed * dt.
  5. st.airborne = body.y - floor > 0.05. st.stalled = fixed-wing && st.airborne && speed < stall (false for the others).
     liftedOff = !wasAir && st.airborne. stallStarted = !wasStalled && st.stalled.
  6. Attitude (ease both with ease(4)): roll target = airborne ? c.steer * bankMax * k : 0, with k = fixed-wing:
     clamp01(speed / stall); rotor: Math.min(1, 0.3 + Math.abs(speed) / maxSpeed); buoyant: 0.2. pitch target: fixed-wing
     airborne: clamp(Math.atan2(vy, Math.max(speed, 1)), -pitchMax, pitchMax); rotor airborne: -throttle * pitchMax;
     buoyant: 0; on the floor: 0.
  7. Return { touchdownSpeed, damage, liftedOff, stallStarted }.
  8. NaN guard: if any of x, y, z, yaw, speed, vy, st.pitch, st.roll is not finite, restore the copied body values, set
     speed = vy = 0 and pitch = roll = 0, and return a zero result.
  initAir() stays as in the stub.
- games/gnome-theft-auto/src/craft/flight.test.ts (new, vitest; `import { describe, expect, it } from 'vitest'`). Use
  VEHICLES[k].air! from '../config'. Step at dt = 1/60. Tests:
  - fixed-wing on the floor (floorY 0) at full throttle, lift 1: never leaves the floor while speed < stallSpeed, airborne
    within 10 s, never above maxSpeed.
  - fixed-wing flying (y 50, speed 30, st.airborne true), then body.speed forced to 10 each frame: vy goes negative and
    stallStarted is true on exactly one frame.
  - fixed-wing at y 0.5, floor 0, vy -15, speed 20, airborne: damage > 0 on touchdown; at vy -2 damage is 0.
  - rotor on the floor, lift 1: airborne within 2 s, speed ~0 with throttle 0; then throttle 1 for 10 s: speed > 0.9 x
    maxSpeed and st.pitch < 0; steer 1 in a hover decreases yaw.
  - rotor unpowered at y 40: falls and lands; afterwards vy is 0 and y equals the floor.
  - buoyant with lift 1 for 3 s climbs less than the rotor with lift 1 for 3 s; unpowered it never sinks faster than sinkRate + 0.01.
  - water: env { floorY: -0.65, water: true }: a rotor descending with lift -1 settles at y = -0.65, never below.
  - a rotor with lift 1 for 120 s never exceeds spec.ceiling.
  - dt 0 and dt NaN return a zero result and leave the body unchanged.

## Contract
`initAir(): AirState` and `stepAir(body: AirBody, st: AirState, spec: AirSpec, c: AirControls, env: AirEnv, dt: number):
AirStepResult` exactly as in the stub. No imports other than './model'.

## Done when
- `npm test -w games/gnome-theft-auto -- src/craft/flight.test.ts` passes
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in craft/flight.ts or craft/flight.test.ts

## Out of scope
Every other file.
~~~~

~~~~text
Epic: 1 Build. Issue B: the hull regime (craft/hull.ts stepHull) and boats.ts on it
Depends on: none

## Environment note
There is a user-reported bug "driving into water crashes the game". Do not touch swim.ts, waterlog.ts or the
ground-vehicle sink path; only make the boat step safer (guards below).

## Goal
Boat physics become a pure, tested function of plain data (HullSpec + a WaterSampler) with exactly the old behaviour, and
the player's own boat uses its owned tuning.

## Read first
- games/gnome-theft-auto/src/boats.ts (the whole file: stepBoat is the behaviour to move, unchanged)
- games/gnome-theft-auto/src/boats.test.ts (must keep passing unchanged)
- games/gnome-theft-auto/src/craft/model.ts: HullSpec, WaterSampler (do not edit)
- games/gnome-theft-auto/src/craft/hull.ts: the stub (hullSpecOf is already written; keep it)
- games/gnome-theft-auto/src/craft/tuning.ts and craft/craftTuneStore.ts: stubs of applyHullTune / getCraftTune (another
  worker fills them in; only call them)

## Change
- craft/hull.ts: implement stepHull(body, st, spec, c, w, dt) as a line-by-line move of boats.ts stepBoat's maths from
  "Heave" through the shore-wall move, replacing: v.spec.draft -> spec.draft, v.spec.radius * 0.8 / 0.4 -> spec.halfLength /
  spec.halfBeam, waterAt -> w.water, bedAt -> w.bed, WATER.boat.buoyancy / heaveDamp / drag / sideGrip / beachDepth /
  rudderSpeed -> spec.*, v.spec.maxSpeed / accel / turnRate -> spec.*, the -0.4 reverse limit -> -spec.reverseFrac, 0.06 bow
  lift -> spec.planePitch, 0.12 heel -> spec.heelRoll, 0.15 slip gain -> spec.slipGain, v.boat -> st, v pose -> body.
  Return { shoreBlocked: true } when the shore wall refused the step. Guards: if !(dt > 0) return { shoreBlocked: false };
  dt = Math.min(dt, 0.1); speedFrac = spec.maxSpeed > 0 ? speed / maxSpeed : 0; at the end, if any of body.x, y, z, yaw,
  speed, st.vy, st.pitch, st.roll, st.slip is not finite, restore the values from the start of the call and zero speed,
  st.vy and st.slip. Imports only from '../config', '../types', './model'.
- boats.ts: stepBoat keeps its signature. `const b = (v.boat ??= initBoat(v)); const base = hullSpecOf(v.spec);
  const spec = v.driver === 'player' ? applyHullTune(base, getCraftTune(v.kind)) : base; stepHull(v, b, spec, c, SAMPLER, dt);`
  with `const SAMPLER: WaterSampler = { water: (x, z) => waterAt(x, z), bed: bedAt };`, then the existing box/world collision
  lines unchanged. Imports: hullSpecOf, stepHull ('./craft/hull'); applyHullTune ('./craft/tuning'); getCraftTune
  ('./craft/craftTuneStore'); type WaterSampler ('./craft/model'). Drop imports that become unused. isBoat, floatHeight,
  initBoat, stepIdleBoats unchanged.
- craft/hull.test.ts (new, vitest): fake sampler (water surface 0, depth 3 where |x| < 50 and |z| < 50, else null; bed -3
  inside, +0.5 outside), body { x: 0, y: 0, z: 0, yaw: 0, speed: 0 }, st { pitch: 0, roll: 0, vy: 0, slip: 0, beached: false },
  spec = hullSpecOf(VEHICLES['gravy-boat']). Tests: settles at y = -draft (within 0.02) after 3 s idle; full throttle 8 s
  reaches >= 0.8 x maxSpeed and never above it; reverse limited to reverseFrac x maxSpeed; steer +1 at speed decreases yaw;
  heading +x (yaw PI/2) at full throttle stops at the shore (x stays < 50 + halfLength, shoreBlocked true on some frame);
  a spec copy with maxSpeed x 1.1 ends faster than stock after 8 s; dt 0 / NaN leaves the body unchanged.

## Contract
`hullSpecOf`, `HullBody`, `stepHull(body, st, spec, c, w, dt): { shoreBlocked: boolean }` exactly as in the stub.

## Done when
- `npm test -w games/gnome-theft-auto -- src/boats.test.ts src/craft/hull.test.ts src/boatTraffic.test.ts src/boatCrossing.test.ts` passes
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in boats.ts, craft/hull.ts, craft/hull.test.ts

## Out of scope
swim.ts, waterlog.ts, vehicles.ts, water.ts, terrain.ts, craft/tuning.ts, craft/craftTuneStore.ts.
~~~~

~~~~text
Epic: 1 Build. Issue C: tuning maths (craft/tuning.ts) and the owned-tune store (craft/craftTuneStore.ts)
Depends on: none

## Goal
Boats and aircraft can be tuned in four stats, levels 0..3, as modest multipliers with a price; the owned tune per model
is saved in localStorage key 'gta-craft-tune-v1'.

## Read first
- games/gnome-theft-auto/src/craft/model.ts: AirSpec, HullSpec, CraftStat, CraftTune (do not edit)
- games/gnome-theft-auto/src/craft/tuning.ts and craft/craftTuneStore.ts: stubs (keep every exported name and signature)
- games/gnome-theft-auto/src/glazeStore.ts: the store pattern (backend, load, persist + notifySaveChanged, listeners, ForTest)

## Change
- craft/tuning.ts:
  CRAFT_STATS = [
    { id: 'engine', name: 'Engine', blurb: 'More pull: quicker off the line and up to speed.', air: true, sea: true, step: 0.08, prices: [120, 260, 480] },
    { id: 'topSpeed', name: 'Top Speed', blurb: 'A little more at the top end.', air: true, sea: true, step: 0.05, prices: [150, 320, 600] },
    { id: 'handling', name: 'Handling', blurb: 'Turns tighter (and a boat slips less).', air: true, sea: true, step: 0.07, prices: [100, 220, 420] },
    { id: 'lift', name: 'Lift', blurb: 'Climbs faster; a plane flies slower before it stalls.', air: true, sea: false, step: 0.08, prices: [130, 280, 520] },
  ]
  clampTune(t): non-object -> copy of NO_TUNE; each stat = Math.round of a finite number clamped to 0..MAX_TUNE_LEVEL, else 0.
  statMult(stat, level) = 1 + step(stat) * clampedLevel.
  applyAirTune(spec, t): NEW object: thrust x mult(engine), maxSpeed x mult(topSpeed), turnRate x mult(handling), climbRate
  x mult(lift), stallSpeed (only when set) x (1 - 0.04 x level(lift)); everything else copied.
  applyHullTune(spec, t): NEW object: accel x mult(engine), maxSpeed x mult(topSpeed), turnRate x mult(handling), sideGrip x
  mult(handling).
  tuneCost(from, to): per stat, sum prices[l - 1] for l = from+1 .. to (both clamped); lower `to` costs 0.
  statsFor('air') = stats with air true; statsFor('sea') = stats with sea true.
- craft/craftTuneStore.ts: one JSON object { [kind]: CraftTune } under CRAFT_TUNE_KEY, shaped like glazeStore.ts: backend from
  localStorage (try/catch), load() on import (garbage -> empty; values through clampTune; kinds kept only if they are keys of
  VEHICLES from '../config'), persist() with notifySaveChanged() from '../saveHook' (try/catch). getCraftTune(kind) returns a
  copy (NO_TUNE copy when none). saveCraftTune(kind, t) stores clampTune(t) (all zeros deletes the entry), persists, calls
  listeners. onCraftTuneChange returns an unsubscribe. craftTuneStorageForTest(s) swaps the backend and reloads.
- craft/tuning.test.ts (new): NO_TUNE leaves an air spec and a hull spec equal (toEqual); engine 3 on
  VEHICLES['hedge-hopper'].air! gives thrust x 1.24 (toBeCloseTo); lift 3 lowers stallSpeed by 12%;
  clampTune({ engine: 9, topSpeed: -2, handling: 'x', lift: 1.6 }) = { engine: 3, topSpeed: 0, handling: 0, lift: 2 };
  tuneCost(NO_TUNE, { ...NO_TUNE, engine: 2 }) = 380; back down = 0; statsFor('sea') has no 'lift'; inputs not mutated.
  (For a hull spec use hullSpecOf(VEHICLES['gravy-boat']) from './hull'.)
- craft/craftTuneStore.test.ts (new): in-memory storage: save then craftTuneStorageForTest(same object) returns the tune;
  garbage JSON gives NO_TUNE; a throwing storage never throws out of save/get; a listener is called with the kind.

## Contract
Every exported name/signature in the two stubs stays the same (other workers call them now).

## Done when
- `npm test -w games/gnome-theft-auto -- src/craft/tuning.test.ts src/craft/craftTuneStore.test.ts` passes
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in these four files

## Out of scope
boats.ts, craft/hull.ts, craft/aircraft.ts, craft/craftPanels.ts, saveIO.ts (the key is already in GTA_SAVE_KEYS).
~~~~

~~~~text
Epic: 1 Build. Issue D: prefabs for three aircraft and two reward items; tintable boats; two achievements
Depends on: none

## Environment note
Prefab authoring rules: docs/roadmaps/prefab-library/_common.md ("Modelling rules", "Data rules", "Examine voice",
"Damage stages"; ignore its Environment paths).

## Goal
Prefabs 'hedge-hopper', 'sycamore-copter', 'dandelion-drifter' (vehicles, life-size metres, nose +z), 'windsock-scarf'
(neck gear) and 'sycamore-seed-wings' (back gear) exist; the five boats and the Whirligig can be re-tinted with no change to
their default look; two Gnome Theft Auto achievements reward the two gear items.

## Read first
- packages/prefabs/src/types.ts: PrefabDef, Part, DamageStage
- packages/prefabs/src/catalog/gta-boats.ts: a life-size vehicle file (style to copy)
- packages/prefabs/src/catalog/gta-guns-air.ts: 'crop-duster' (plane with pivots prop, wheel-0..3, 'tint' parts)
- packages/prefabs/src/catalog/gnome-theft-auto.ts: 'whirligig-mower' (pivots rotor, tail-rotor) and OLIVE
- packages/prefabs/src/catalog/cosmetics-neck.ts, cosmetics-back.ts: wearable items
- packages/achievements/src/catalog.ts ('gta-whirligig', 'gta-pilot' entries) and packages/achievements/src/types.ts

## Change
- packages/prefabs/src/catalog/gta-aircraft.ts (new): `export const GTA_AIRCRAFT: readonly PrefabDef[]`. Each vehicle: lowest
  point y = 0, centred, nose +z, category 'prop', uses ['place', 'sit'], `tint` set and main body parts c: 'tint', two damage
  stages ('dented': darken ~0.25 + a dent/scorch; 'wrecked': darken ~0.6, smoke puffs, a part morphed or hidden), 5 examine
  lines, under 40 parts:
  1. 'hedge-hopper' Hedge-Hopper: small red (tint 0xc8342c) low-wing two-seat sport monoplane with a cream stripe. Fuselage
     ~0.9 wide, 0.8 tall, z -2.6 to 2.0, underside at y 0.3. Low wing span 6.0, chord 1.1, at y 0.5. Open cockpit, small
     windscreen; seat: [0, 0.75, -0.2] (a seat top there) and a second seat top at [0, 0.75, -0.95]. Tail plane span 2.0 +
     fin at z -2.4. Groups/pivots: 'prop' [0, 0.7, 2.1] (2 blades + hub), 'wheel-0'/'wheel-1' main wheels at [-/+0.9, 0.25,
     0.4] (radius 0.25, axis x), 'wheel-2'/'wheel-3' tail wheels at [-/+0.15, 0.1, -2.3] (radius 0.1).
  2. 'sycamore-copter' Sycamore Copter: helicopter whose cabin is a fat sycamore seed pod (tint 0x8a9a3c): egg-shaped cabin
     ~1.8 wide, 1.6 tall, 2.4 long on two skids (y ~0.04), floor y 0.35, bench with seat tops at [+/-0.35, 0.6, 0.2] (seat:
     [0.35, 0.6, 0.2]), glass bubble front. Mast to y 2.2. Group 'rotor' pivot [0, 2.25, 0]: two samara-wing blades (thin
     boxes ~3.4 long x 0.04 x 0.5, darker vein) + hub. Tail boom z -1.2 to -3.4 at y 1.2; group 'tail-rotor' pivot [0.12,
     1.3, -3.4] (2 small blades). pivots: { rotor: [0, 2.25, 0], 'tail-rotor': [0.12, 1.3, -3.4] }.
  3. 'dandelion-drifter' Dandelion Drifter: hot-air balloon: wicker basket (cyl, diameter 1.4, 0.9 tall, wood colours, floor
     top y 0.15, seat: [0, 0.15, 0.25]), a burner on 4 thin struts with a glow: true flame at ~y 2.3, and a huge dandelion
     clock: one ball radius 2.2 centred y 4.6, c: 'tint', tint 0xf4f1e6, alpha ~0.9, dotted with 8-12 small white seed
     tufts on its surface, plus 4 thin rope cylinders from the basket rim up to the ball.
  4. 'windsock-scarf' Windsock Scarf: neck gear (uses ['wear-neck']), orange-and-white stripes, gnome-sized.
  5. 'sycamore-seed-wings' Sycamore Seed Wings: back gear (uses ['wear-back']), two samara wings on a strap.
  Copy category/sizes/`about` style of existing neck/back items for 4 and 5.
- packages/prefabs/src/catalog/index.ts: import GTA_AIRCRAFT and spread it into the list next to ...GTA_FLEET (additive only;
  others edit this file too).
- packages/prefabs/src/catalog/gta-boats.ts: make each boat's main hull colour a tint with the same default look: set the
  prefab's `tint` to the colour its hull parts use now, and change those parts to c: 'tint' (walnut-dinghy: the 'wood-dark'
  shell parts; gravy-boat: the 'white' hull/bow/spout; clog-cruiser: the 'yellow' parts; watering-can-steamer and
  hoa-patrol-boat: their main body colour parts). Leave trim, seats, glass and metal alone.
- packages/prefabs/src/catalog/gnome-theft-auto.ts: 'whirligig-mower' only: add `tint: OLIVE` and make its OLIVE parts (deck,
  tail boom) c: 'tint'. Nothing else in that file.
- packages/achievements/src/catalog.ts: append after the last 'gnome-theft-auto' entry:
  { id: 'gta-three-ways-up', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Three Ways Up',
    description: 'Fly the Hedge-Hopper, the Sycamore Copter and the Dandelion Drifter.', target: 3,
    reward: { slot: 'neck', prefabId: 'windsock-scarf', label: 'Windsock Scarf' } },
  { id: 'gta-slipway-regular', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Slipway Regular',
    description: "Buy paint or a tune for a boat or an aircraft at the Wingwright's Slipway.",
    reward: { slot: 'back', prefabId: 'sycamore-seed-wings', label: 'Sycamore Seed Wings' } },

## Contract
Ids exactly as above. Pivot/group names exactly prop, wheel-0..wheel-3, rotor, tail-rotor (the game spins them by name).

## Done when
- `npm test -w packages/prefabs` passes
- `npm test -w packages/achievements` passes

## Out of scope
Everything under games/. Other catalog files.
~~~~

~~~~text
Epic: 1 Build. Issue E: lore for the three aircraft and the Wingwright's Slipway
Depends on: none

## Goal
The new craft and the paint-and-tune service are canon (apocrypha, the Gnome Theft Auto setting).

## Read first
- docs/lore/README.md (entry front matter, rulings format, what `npm run lore` checks)
- docs/lore/entries/apocrypha/crop-duster.md, desert-airfield.md, the-whirligig.md (style)
- docs/lore/rulings.md (append only; others may append too)

## Change
- docs/lore/entries/apocrypha/hedge-hopper.md: the Hedge-Hopper, a small red two-seat low-wing sport plane on the Desert
  Airfield apron beside the Crop Dusters; Wind-Sock Wally's own; flies low and quick; stalls near 18 m/s; "hops hedges, not fences".
- docs/lore/entries/apocrypha/sycamore-copter.md: the Sycamore Copter, a two-seat helicopter whose cabin is a giant sycamore
  seed pod and whose rotor is its two seed wings; a proper hovering machine, unlike the Whirligig (a mower that wanted to be
  a bird). Parked north of the airstrip.
- docs/lore/entries/apocrypha/dandelion-drifter.md: the Dandelion Drifter, a hot-air balloon whose envelope is a dandelion
  clock; slow, drifts, sinks gently with the burner off; a Tallgrass Commons favourite moored at the airfield.
- docs/lore/entries/apocrypha/wingwrights-slipway.md: the Wingwright's Slipway, a travelling paint-and-tune crew for boats and
  aircraft (Pay 'n' Glaze only takes things with wheels); comes to wherever a boat or aircraft is stopped; sells Engine, Top
  Speed, Handling and Lift work in three steps each, and paint.
- docs/lore/rulings.md: append one ruling: Turfton's aircraft are the Crop Duster, the Whirligig, the Hedge-Hopper, the
  Sycamore Copter and the Dandelion Drifter; aircraft that come down on water float (they do not sink like mowers); "copter"
  is the Turfton word for a helicopter.
- docs/lore/INDEX.md: list the four entries if the README says entries are indexed there (append only).
Link to desert-airfield, crop-duster, the-whirligig where the format allows.

## Done when
- `npm run lore` passes (repo root)
- `npm run lore -- find copter` lists the new entries

## Out of scope
Code; other lore files.
~~~~

~~~~text
Epic: 1 Build. Issue F: the Wingwright's Slipway (craft/craftShop.ts) and its Paint and Tune tabs (craft/craftPanels.ts)
Depends on: none

## Goal
While the player sits in a stopped boat or aircraft, a 44 px "🛠 Slipway" button (also the L key and the window event
'gta:craft-shop') opens a bottom sheet with Paint and Tune tabs, a live paint preview, a total price and Buy / Close.

## Read first
- games/gnome-theft-auto/src/craft/craftShop.ts and craft/craftPanels.ts: stubs you replace (keep every export/signature)
- games/gnome-theft-auto/src/glazeUi.ts: Panel, PanelCtx, swatchRow, sectionLabel, GLAZE_CSS
- games/gnome-theft-auto/src/glazePanels.ts: registerGlazePanel(panel, order), glazePanelsFor(kind)
- games/gnome-theft-auto/src/glazeShop.ts: how the Glaze sheet is built (copy its shape, smaller)
- games/gnome-theft-auto/src/craft/tuning.ts: CRAFT_STATS, statsFor, tuneCost, MAX_TUNE_LEVEL, statMult (being filled in by
  another worker now; use only these names)
- games/gnome-theft-auto/src/glazeStore.ts: isCraftKind, ownedLoadout, saveOwnedLoadout
- games/gnome-theft-auto/src/craft/craftTuneStore.ts: getCraftTune, saveCraftTune

## Change
- craft/craftPanels.ts:
  - CRAFT_SWATCHES: Poppy Red 0xc8342c, Marigold 0xf2b632, Clover 0x3fa34d, Pond Teal 0x2a8f8a, Sky Blue 0x4f9de0, Navy Bib
    0x1f2f5a, Plum 0x8e44ad, Rust 0xa4502a, Seed Olive 0x8a9a3c, Olive Drab 0x556b2f, Dandelion White 0xf4f1e6, Soot 0x2b2b2b.
  - craftPaintPanel (id 'craft-paint', label 'Paint', icon '🎨', appliesTo: isCraftKind): sectionLabel('Hull & body colour'),
    swatchRow({ swatches: CRAFT_SWATCHES, value: ctx.draft().paint, custom: true, onPick: (hex) => ctx.patch({ paint: hex }) }),
    a note `A new coat: ${CRAFT_PAINT_PRICE} 🌰`. refresh() re-marks with set(ctx.draft().paint).
  - craftTunePanel (id 'craft-tune', label 'Tune', icon '🔧', appliesTo(kind) = isCraftKind(kind) && (VEHICLES[kind].boat ===
    true || !!VEHICLES[kind].air)): one row per def of statsFor(VEHICLES[kind].boat ? 'sea' : 'air'): name, blurb, pips (●●○
    = level 2 of 3; owned levels from getCraftTune(kind) in a different class), effect `+${Math.round((statMult(id, level) -
    1) * 100)}%`, and two 44x44 buttons '−' / '+' changing getTuneDraft()[id] within 0..MAX_TUNE_LEVEL (setTuneDraft with a
    copy), then ctx.patch({}) so the shop re-prices and refreshes. '+' shows the next level's price (def.prices[level]) or
    'Max'. refresh() redraws the rows.
  - registerCraftPanels(): registerGlazePanel(craftPaintPanel, 60); registerGlazePanel(craftTunePanel, 70).
- craft/craftShop.ts:
  - canOpenCraftShop(v): !!v && v.driver === 'player' && isCraftKind(v.kind) && !v.exploded && !v.sunk &&
    Math.abs(v.speed) < 1.5 && (v.air ? !v.air.airborne : (!v.spec.flies || aboveGround(v.x, v.y, v.z) < 0.3))
    (aboveGround from '../terrain').
  - createCraftShop(ui, hud, deps): call registerCraftPanels(). Inject GLAZE_CSS once (skip if
    document.getElementById('gta-glaze-style') exists, else add <style id="gta-glaze-style">) plus a small own <style>.
    Own container div#gta-craft-shop appended to `ui`, holding: button .gta-craft-fab "🛠 Slipway" (min 44x44, fixed, top:
    calc(env(safe-area-inset-top, 0px) + 72px), left 50%, translateX(-50%)), shown only when canOpenCraftShop(current) and
    closed; and the sheet (fixed bottom, max-height 70vh, scrolls inside, width min(100%, 560px), centred, safe-area padding):
    title "Wingwright's Slipway", spec.name, tab buttons (button.gz-tab for each of glazePanelsFor(kind).filter((p) =>
    CRAFT_PANEL_IDS.includes(p.id))), the panel area, a footer with the total (`Total: ${n} 🌰` or 'Nothing to pay'), Buy
    (disabled when total is 0 or > deps.acorns()) and Close. All buttons >= 44 px. Fits 390x844 and 844x390.
  - open(v): owned = ownedLoadout(v.kind) ?? v.look ?? defaultLoadout(v.tint) (defaultLoadout/normalizeLoadout from
    '@lawn/glaze'); draft = { ...owned }; setTuneDraft(getCraftTune(v.kind)). PanelCtx: kind, draft(), owned(), patch(p):
    draft = normalizeLoadout({ ...draft, ...p }); deps.setLook(v, draft) only when draft.paint changed; re-price; every
    built panel's refresh?.(); acorns() = deps.acorns(). Build each panel once per open; show the first tab.
  - total = (draft.paint !== owned.paint ? CRAFT_PAINT_PRICE : 0) + tuneCost(getCraftTune(kind), getTuneDraft()).
  - Buy: if total > 0 and !deps.spend(total, "Wingwright's Slipway") -> hud.toast('Not enough Acorns.') and stop.
    painted = draft.paint !== owned.paint -> saveOwnedLoadout(kind, draft). tuned = any stat differs from getCraftTune(kind)
    -> saveCraftTune(kind, getTuneDraft()). deps.play('shutter'); hud.toast('Slipway: all done.'); deps.onPurchase({ kind,
    spent: total, painted, tuned }); hide the sheet keeping the new look.
  - close(): if open, restore deps.setLook(v, owned) when the shown paint differs; hide the sheet.
  - update(v): remember v as current; if open and (v !== the shop's vehicle || !canOpenCraftShop(v)) close(); show/hide button.
  - keydown on window: ignore isTyping(e) (from '../keys'); e.code === KEYS.craftShop toggles (open only when
    canOpenCraftShop(current)); KEYS.close closes while open. Never write a key string literal (keys.test.ts checks).
    window.addEventListener('gta:craft-shop', toggle) for the gamepad.

## Contract
Exports exactly as in the stubs. The app wires it as
`createCraftShop(ui, hud, { setLook: setVehicleLook, spend: (n, w) => economy.spend(n, w), acorns: () => economy.state().acorns, play, onPurchase })`
and calls `craftShop.update(drivenVehicle)` every frame.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in craft/craftShop.ts, craft/craftPanels.ts
- `npm test -w games/gnome-theft-auto -- src/keys.test.ts src/craft/craftShop.test.ts` passes, where craft/craftShop.test.ts
  (new) tests canOpenCraftShop with plain objects cast `as unknown as Vehicle` (if importing craftShop.ts needs a DOM, check how
  other *.test.ts in the game get one, or put canOpenCraftShop's logic where it can be tested): a stopped player boat can open;
  a moving one, an airborne aircraft (air.airborne true), a ground mower kind and an NPC-driven boat cannot.

## Out of scope
glazeShop.ts, glazePanels.ts, glazeUi.ts, glazeStore.ts, garages.ts, app.ts, vehicles.ts.
~~~~

~~~~text
Epic: 1 Build. Issue G: aircraft glue (craft/aircraft.ts) and vehicles.ts hooks (step, mesh attitude, craft re-tint)
Depends on: none

## Environment note
vehicles.ts is a shared hot file: make exactly the small edits below. Do not touch swim.ts / waterlog.ts / checkSink (a
separate "driving into water crashes" bug is handled elsewhere).

## Goal
Vehicles with spec.air fly on craft/flight.ts stepAir with the owned tuning, crash into buildings and hard ground, float on
water, show bank and pitch; boats and aircraft can be re-painted through setVehicleLook.

## Read first
- games/gnome-theft-auto/src/vehicles.ts: createVehicle, stepVehicle, syncVehicleMesh, repaintVehicle, setVehicleLook
- games/gnome-theft-auto/src/craft/aircraft.ts (stub you replace), craft/flight.ts (initAir, stepAir; being filled by
  another worker, only call them), craft/model.ts, craft/tuning.ts (applyAirTune), craft/craftTuneStore.ts (getCraftTune)
- games/gnome-theft-auto/src/collide.ts: sweepCircleBoxes, wallBounce, clampToWorld
- games/gnome-theft-auto/src/terrain.ts: heightAt, waterAt; games/gnome-theft-auto/src/highways/deck.ts: deckSurfaceBelow

## Change
- craft/aircraft.ts:
  - export floorUnder(x, z, y): { y: number; water: boolean }: y = Math.max(heightAt(x, z), deckSurfaceBelow(x, z, y + 0.5)
    ?? -Infinity, waterAt(x, z)?.surface ?? -Infinity); water = true when the water surface is that max.
  - stepAircraft(v, c, dt, world, damage): if (!v.spec.air) return a zero result. st = (v.air ??= initAir()).
    spec = v.driver === 'player' ? applyAirTune(v.spec.air, getCraftTune(v.kind)) : v.spec.air.
    powered = (v.driver === 'player' || v.driver === 'npc' || v.driver === 'police') && v.hp > 0 && !v.waterlogStalled.
    x0 = v.x, z0 = v.z; f = floorUnder(v.x, v.z, v.y);
    r = stepAir(v, st, spec, { throttle: c.throttle, steer: c.steer, lift: c.lift, powered }, { floorY: f.y, water: f.water }, dt).
    Buildings: sw = sweepCircleBoxes(x0, z0, v.x, v.z, v.spec.radius, world.boxes, v.y); v.x = sw.x; v.z = sw.z; on sw.hit:
    vel = (sin(yaw) * speed, cos(yaw) * speed); b = wallBounce(vel.x, vel.z, sw.nx, sw.nz); v.speed = b.vx * sin(yaw) + b.vz *
    cos(yaw); if (v.driver === 'player' && b.impact > 6) play('bump') (from '../audio'); if (b.impact > WALL_MIN)
    damage(v, (b.impact - WALL_MIN) / WALL_SCALE * 1.5). Local `const WALL_MIN = 5; const WALL_SCALE = 45;` (same values as
    vehicles.ts CRASH_MIN / CRASH_SCALE; do not import from vehicles.ts, it imports this file).
    kept = clampToWorld(v.x, v.z, world.half, v.spec.radius); apply; if kept.hit v.speed *= 0.5.
    Rising ground: f2 = floorUnder(v.x, v.z, v.y); if (v.y < f2.y) { if (Math.abs(v.speed) > 10) damage(v,
    (Math.abs(v.speed) - 10) / 60); v.y = f2.y; v.vy = 0; v.speed *= 0.3; st.airborne = false; }
    if (r.damage > 0) damage(v, r.damage); if (r.touchdownSpeed > spec.safeTouchdown && v.driver === 'player') play('bump').
    Store r in a module Map<number, AirStepResult> by v.id (lastAirEvent reads it). Return r.
- vehicles.ts (only these edits):
  1. imports: { initAir } from './craft/flight'; { stepAircraft } from './craft/aircraft'; add isCraftKind to the existing
     './glazeStore' import.
  2. createVehicle: after the `if (spec.boat) { ... }` block: `if (spec.air) v.air = initAir();`
  3. stepVehicle: right after the `if (v.spec.boat) { ...; return; }` block:
     `if (v.spec.air) { stepAircraft(v, c, dt, world, damageVehicle); v.steerVis += (c.steer - v.steerVis) * Math.min(1, 8 * dt); return; }`
  4. syncVehicleMesh: first attitude branch becomes `if (v.air) { pitch = -v.air.pitch; roll = v.air.roll; } else if (spec.fixedWing) {`.
     Wheel spin: `if (v.air ? !v.air.airborne : (!spec.fixedWing || aboveGround(v.x, v.y, v.z) < 0.05)) v.wheelSpin += ...`.
  5. repaintVehicle: after `v.object.add(body);` keep the body the FIRST child (code reads v.object.children[0]):
     `v.object.children.splice(v.object.children.indexOf(body), 1); v.object.children.unshift(body);`
  6. setVehicleLook: `const before = v.tint;` at the top; replace `if (!v.rig) return;` with
     `if (!v.rig) { if (isCraftKind(v.kind) && next.paint !== before) repaintVehicle(v, next.paint); return; }`
     (repaintVehicle's rig branch does not apply to these, so no loop).
- craft/aircraft.test.ts (new, vitest) only if it runs headless: fake Vehicle ({ id: 1, kind: 'sycamore-copter', spec:
  VEHICLES['sycamore-copter'], x: 480, y: heightAt(480, -80), z: -80, yaw: 0, speed: 0, vy: 0, driver: 'player', hp: 1 } as
  unknown as Vehicle) and World ({ boxes: [], half: 900 } as unknown as World): lift 1 for 2 s raises y; dropped from 60 m
  above the floor with driver 'none', the damage callback is called on landing. If terrain cannot be used in a test, skip
  the file and say so.

## Contract
`stepAircraft(v, c, dt, world, damage): AirStepResult`, `lastAirEvent(id)`, new `floorUnder(x, z, y)`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in vehicles.ts, craft/aircraft.ts
- `npm test -w games/gnome-theft-auto -- src/vehicles.glaze.test.ts src/bump.test.ts src/seats.test.ts src/boats.test.ts src/bail.test.ts` passes

## Out of scope
craft/flight.ts, craft/tuning.ts, craft/craftTuneStore.ts, boats.ts, app.ts, swim.ts, waterlog.ts.
~~~~

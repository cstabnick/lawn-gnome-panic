# Lawn Prix

Goal: a new Three.js game, `games/lawn-prix`: gnomes (the player's custom gnome via `@lawn/gnome`) race lawn mowers round one garden track, 3 laps against 3 CPUs. Two vehicles to start: a ride-on **cart** (fast, heavy) and a push-mower **bike** (light, quick, turns tight). Mower colours from a palette. The mown stripe is the track; long grass off it slows you. Drift-and-release boost. A Gnome Party slice, `prix-race`: the same 3-lap race with four seats.

Later (not in this plan): the combine harvester (huge, about 6 m/s top speed, a joke pick), items, more tracks, online.

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (written by the planner) | scaffold, `config.ts` (all types and tuning), `track.ts` (geometry, tested), stubs for every module; `npm run build -w games/lawn-prix` passes | 0 |
| 2 Game | the full game plays: menu, countdown, race, results | 6 (A-F, parallel) |
| 3 Party slice | `npm test -w games/lawn-prix` runs `testMinigame` on `prix-race`; `#minigame` plays | 1 |

## Shared environment block (pasted into every issue)

~~~~text
## Environment
- Repo root: /home/user/lawn-gnome-panic (Linux, bash). Game: games/lawn-prix (Vite 8 + TypeScript strict + three 0.187, ES modules).
- Dependencies are installed (`npm install` already ran at the root). Do not add packages.
- Type-check (safe while others work): `cd /home/user/lawn-gnome-panic/games/lawn-prix && npx tsc --noEmit -p .`
- Tests: `cd /home/user/lawn-gnome-panic/games/lawn-prix && npx vitest run`
- Do NOT run `vite build`, `npm run build` or the dev server (other workers share the folder). Do not run git commit.
- Other workers are editing OTHER files in games/lawn-prix at the same time. Only edit the files listed under Change.
  Other modules may still be stubs while you work: code against their exported signatures (quoted below), not their bodies.
- All art and sound is generated in code (three.js primitives, canvas textures, WebAudio). No asset files, no fetches.
- Coordinates: metres, y up. Heading h: forward = (sin h, 0, cos h); h = 0 faces +z; increasing h turns LEFT;
  left of heading h = (cos h, 0, -sin h). The gnome model faces +z at yaw 0.
~~~~

## Epic 2: Game

~~~~text
Epic: 2 Game, issue A: race simulation
Depends on: none

<Shared environment block>

## Goal
src/sim.ts becomes the real race simulation (pure functions of plain data), with tests.

## Read first
- games/lawn-prix/src/config.ts: VEHICLES, DRIVE, DRIFT, RACE, TRACK, KartInput, KartState, RaceState (all field docs).
- games/lawn-prix/src/track.ts: projectOnTrack(x,z) -> TrackHit {s, lateral, x, z, tx, tz}, isOnTrack(hit), pointAt(s),
  wrapS(s), headingOf(tx,tz), gridSlot(i), TRACK_LENGTH.
- games/lawn-prix/src/sim.ts: the stub. Keep every exported name and signature exactly.

## Change
- games/lawn-prix/src/sim.ts: implement the bodies.
- games/lawn-prix/src/sim.test.ts: new vitest file.

Rules for every function: no three.js, no DOM, no Math.random, no Date. Deterministic. State stays plain JSON
(numbers, booleans, null, strings; no NaN/Infinity). Never add fields to KartState/RaceState (config.ts is not yours).

### stepKart(k, input, dt, raceT, laps)
If k.fin !== null: the kart has finished; treat input as {steer:0, throttle:0, drift:false} (coasts to a stop) but keep
running physics. input null = same coast input.
1. spec = VEHICLES[k.vehicle]. fwd = (sin h, cos h), left = (cos h, -sin h).
   vF = vx*fwd.x + vz*fwd.z (forward speed), vL = vx*left.x + vz*left.z (sideways slide).
2. hit = projectOnTrack(k.x, k.z); k.off = !isOnTrack(hit).
   top = spec.maxSpeed * k.skill * (k.off ? DRIVE.offTrackSpeedMul : 1) * (k.boost > 0 ? DRIFT.boostSpeedMul : 1).
3. Throttle (clamp input.throttle to -1..1):
   - throttle > 0: if vF < top, vF += spec.accel * throttle * dt (+ DRIFT.boostAccel*dt when k.boost > 0), capped at top.
     If vF > top (e.g. just went into long grass or boost ended), vF moves toward top at DRIVE.offTrackDrag * vF * dt
     when off, else at 2*dt*vF, never below top.
   - throttle < 0: if vF > 0, vF -= spec.brake * -throttle * dt (not below 0 in this step); else reverse:
     vF -= spec.accel * 0.5 * -throttle * dt, not below -DRIVE.reverseMax.
   - throttle == 0: vF -= vF * DRIVE.coastDrag * dt; when off also vF -= vF * DRIVE.offTrackDrag * dt.
4. Steering: steer = clamp(input.steer, -1, 1); k.st = steer.
   speedF = min(1, |vF| / DRIVE.turnSpeedRef). dir = vF >= 0 ? 1 : -1.
   Drift: if input.drift && k.drift === 0 && |steer| > 0.3 && vF > DRIFT.minSpeed && !k.off: k.drift = sign(steer).
   If k.drift !== 0 and (!input.drift or vF < DRIFT.minSpeed * 0.6): release: if k.charge >= DRIFT.chargeForBoost,
   k.boost = DRIFT.boostS; then k.drift = 0, k.charge = 0.
   While k.drift !== 0: k.charge += dt; the turn uses steerEff = clamp(k.drift * 0.6 + steer * 0.4, -1, 1) * DRIFT.turnMul;
   grip = spec.grip * DRIFT.gripMul. Otherwise steerEff = steer, grip = spec.grip.
   k.h -= steerEff * spec.turnRate * speedF * dir * dt   (steer +1 = right = heading decreases).
5. Slide: vL *= Math.exp(-grip * dt).
6. Recompute fwd/left from the new h, set vx = fwd.x*vF + left.x*vL, vz = fwd.z*vF + left.z*vL.
   k.x += vx*dt; k.z += vz*dt. Clamp x/z inside TRACK.bounds (minX+spec.radius .. maxX-spec.radius, same for z);
   when clamped, zero the velocity component into the hedge.
7. k.boost = max(0, k.boost - dt).
8. Progress: hit2 = projectOnTrack(k.x, k.z). d = hit2.s - k.s; if d > TRACK_LENGTH/2 d -= TRACK_LENGTH;
   if d < -TRACK_LENGTH/2 d += TRACK_LENGTH. d = clamp(d, -5, 5) (cutting across the infield gains nothing).
   k.dist += d; k.s = hit2.s.
   k.lap = clamp(floor(k.dist / TRACK_LENGTH), 0, laps) (dist starts negative behind the line, so lap is 0 there).
   If k.fin === null && k.dist >= laps * TRACK_LENGTH: k.fin = raceT; k.lap = laps.

### resolveBumps(karts)
Every pair (i<j): r = VEHICLES[a.vehicle].radius + VEHICLES[b.vehicle].radius; dx = b.x-a.x, dz = b.z-a.z, d = hypot.
If d < r and d > 1e-6: n = (dx,dz)/d, overlap = r - d, ma/mb = masses; a moves back by overlap*mb/(ma+mb) along -n,
b forward by overlap*ma/(ma+mb) along n. Relative normal speed vn = (b.v - a.v)·n; if vn < 0 apply impulse
jimp = -(1 + DRIVE.bumpRestitution) * vn / (1/ma + 1/mb); a.v -= n*jimp/ma; b.v += n*jimp/mb. Record i and j
(each once) in the returned array. If d <= 1e-6 push them apart along x by r/2 each.

### stepRace(race, inputs, dt)
If race.over: race.t += dt only and still step karts (they coast). Else: race.t += dt; stepKart(each kart, inputs[i] ?? null,
dt, race.t, race.laps); resolveBumps(race.karts); if race.firstFin === null and any kart.fin !== null,
race.firstFin = min fin; race.over = every kart finished || (race.firstFin !== null && race.t - race.firstFin >= RACE.finishGraceS).

### racePlaces(race)
Score each kart: finished karts ordered by fin ascending come first; unfinished after, ordered by dist descending.
places[i] = number of karts strictly better than kart i (equal fin, or equal dist among unfinished, share a place).

### cpuInput(race, index)
k = race.karts[index]. If k.fin !== null return {steer:0, throttle:0, drift:false}.
lane = ((index % 4) - 1.5) * 1.2 (metres, + = left), so CPUs do not stack.
look = 6 + max(0, speed) * 0.45 (speed = hypot(vx,vz)). p = pointAt(k.s + look); target = p + leftOf(p.tx,p.tz) * lane
where leftOf(tx,tz) = (tz, -tx). Desired heading hd = atan2(target.x - k.x, target.z - k.z);
err = wrap(hd - k.h) into -PI..PI. steer = clamp(-err * 2.2, -1, 1) (positive err = target is to the left = steer left = negative).
Corner sharpness: c = |wrap(headingOf(pointAt(k.s+18)) - headingOf(pointAt(k.s)))|.
drift = c > 0.9 && speed > DRIFT.minSpeed + 2 && |steer| > 0.35, but release (drift false) when k.drift !== 0 and
k.charge >= DRIFT.chargeForBoost + 0.1 or c < 0.4.
throttle = 1, except 0.6 when c > 1.6 and speed > 14.

## Tests (src/sim.test.ts, vitest: import { describe, it, expect } from 'vitest')
- createRace with 4 entries puts karts on distinct grid slots, at rest, lap 0, dist < 0.
- A kart with constant input {steer:0, throttle:1, drift:false} on a straight reaches > 0.9*maxSpeed within 4 s
  (place it with gridSlot(0) values; the start straight is long).
- Off track: same kart placed 15 m to the side of the centreline (use pointAt + leftOf * 15 and heading along the
  tangent) never exceeds maxSpeed * DRIVE.offTrackSpeedMul + 0.5 over 3 s of full throttle.
- 4 CPUs (cpuInput for every kart, stepRace at dt = 1/60) all finish 3 laps within 90 s of race time;
  race.over becomes true; racePlaces is a permutation of 0..3 (no ties expected). Also print nothing.
- Determinism: running that CPU race twice gives identical JSON of race at the end.
- JSON.stringify(race) for 4 karts stays under 1600 bytes at any sampled moment of that run (the party slice needs it small).
- Two karts overlapping get pushed apart by resolveBumps and it returns both indices; the lighter (bike) moves more.
- Steering +1 for 1 s at speed lowers h (turns right).
If the CPU race does not finish in 90 s, tune ONLY cpuInput constants (not config.ts) until it does.

## Contract (keep exactly; other workers already call these)
export function createRace(entries: readonly { vehicle: VehicleId; skill: number }[], laps?: number): RaceState
export function stepKart(k: KartState, input: KartInput | null, dt: number, raceT: number, laps: number): void
export function resolveBumps(karts: KartState[]): number[]
export function stepRace(race: RaceState, inputs: readonly (KartInput | null)[], dt: number): void
export function racePlaces(race: RaceState): number[]
export function cpuInput(race: RaceState, index: number): KartInput

## Done when
- `npx tsc --noEmit -p .` (in games/lawn-prix) passes.
- `npx vitest run src/sim.test.ts src/track.test.ts` passes.

## Out of scope
config.ts, track.ts, track.test.ts and every file under src/scene, src/ui, app.ts, input.ts, audio.ts, src/minigames.
~~~~

~~~~text
Epic: 2 Game, issue B: the garden track scene
Depends on: none

<Shared environment block>

## Goal
src/scene/trackView.ts builds the whole garden around the track into a THREE.Scene: the full game and the party slice
both call it, so it must work in any fresh scene and add everything (lights, sky) itself.

## Read first
- games/lawn-prix/src/config.ts: TRACK (width, bounds, startS), the coordinate notes at the top.
- games/lawn-prix/src/track.ts: TRACK_POINTS (centreline samples {x, z, s, tx, tz}, closed loop, segment i -> i+1),
  TRACK_LENGTH, pointAt(s), headingOf(tx,tz). Left of tangent (tx,tz) is (tz,-tx).
- games/lawn-prix/src/scene/trackView.ts: the stub.

## Change
- games/lawn-prix/src/scene/trackView.ts only. Keep `export function buildTrack(scene: THREE.Scene): void`.

Build, with three.js 0.187 (`import * as THREE from 'three'`), MeshStandardMaterial / MeshLambertMaterial:
1. Sky and light: scene.background = new THREE.Color(0x8fd0ff); scene.fog = new THREE.Fog(0x8fd0ff, 60, 170);
   HemisphereLight(0xffffff, 0x4a7a3a, 1.2); DirectionalLight(0xfff2d6, 2.2) at (30, 60, 20) with castShadow = true,
   shadow.mapSize 2048, shadow camera left/right/top/bottom ±80, far 200. (Shadows only show if the renderer enables
   them; the game does.)
2. Ground: a large plane (400 x 400, rotation.x = -PI/2, y = -0.02) of long, darker grass 0x3f8a2e with a canvas
   texture of random blade flecks (CanvasTexture 256x256, wrapS/wrapT = RepeatWrapping, repeat 60x60). receiveShadow.
3. The mown track: one BufferGeometry ribbon along TRACK_POINTS: for each point two vertices at ±TRACK.width/2 along
   the left vector (tz,-tx), y = 0.01; close the loop (last quad joins point n-1 to point 0). Vertex colours make
   mowing stripes: alternate light 0x8fd16a and darker 0x76bd55 every 6 m of s (stripe = floor(s / 6) % 2).
   Use MeshLambertMaterial({ vertexColors: true }). receiveShadow.
4. Edge trim: thin white-ish (0xe8f0d0) strips 0.25 m wide just inside each edge, y = 0.015, same ribbon technique.
5. Start/finish line at s = TRACK.startS: a checkered plane (CanvasTexture 8x2 squares black/white) across the full
   width, 1.2 m long along the track, y = 0.02, rotated to the track heading (rotation.y = headingOf(tx,tz)).
   A simple banner arch over it: two posts (CylinderGeometry) at ±(width/2 + 0.6) and a crossbar box 2.8 m up with a
   canvas texture reading "LAWN PRIX".
6. Long grass tufts: 600 InstancedMesh cones (ConeGeometry(0.18, 0.7, 4), colour 0x4f9a35) scattered with a seeded
   PRNG (write a 6-line mulberry32 in the file; never Math.random) over the bounds, rejecting any point within
   TRACK.width/2 + 0.8 of the centreline (use the minimum distance to TRACK_POINTS; checking every 2nd point is fine).
7. Hedge boundary: boxes 1.6 m tall, 1.4 m deep, colour 0x2e6b2a, around TRACK.bounds (four long boxes).
8. Garden props off the track (same rejection rule, seeded): 10 flower beds (low brown box with 12 tiny coloured
   spheres), 6 round trees (CylinderGeometry trunk + IcosahedronGeometry(2.4,0) canopy), 8 garden gnome statues are
   NOT needed (skip), 4 terracotta pots (CylinderGeometry tapered, 0xc8643c). castShadow on trees.
9. Tyre-stack / hay-bale markers on the outside of the 4 sharpest corners: find corners by heading change over 15 m
   of s; place 3 hay bales (BoxGeometry 1.2x0.8x0.8, 0xe0c060) just outside the outer edge.
Keep it one file, under ~350 lines. Group static meshes under one THREE.Group named 'track' added to the scene.
Every material/geometry is created inside buildTrack (nothing at module import time; the party runner disposes the scene).

## Contract
export function buildTrack(scene: THREE.Scene): void

## Done when
- `npx tsc --noEmit -p .` passes.
- A temporary check you delete afterwards is optional; do not leave extra files.

## Out of scope
Every other file. Do not touch config.ts or track.ts (if a TRACK value looks wrong, say so in your report instead).
~~~~

~~~~text
Epic: 2 Game, issue C: mowers and racers
Depends on: none

<Shared environment block>

## Goal
src/scene/mower.ts builds the two mower models (cart, bike) in any colour; src/scene/racer.ts puts a gnome on one
and animates it from a KartState. Both are used by the full game and the party slice.

## Read first
- games/lawn-prix/src/config.ts: VehicleId, VEHICLES (scale, radius), KartState (x, z, h, vx, vz, st, drift, charge,
  boost, off), DRIFT.chargeForBoost.
- games/lawn-prix/src/scene/mower.ts and src/scene/racer.ts: the stubs (keep exports and signatures exactly).
- packages/gnome/src/types.ts lines 83-140: GnomeLook, PlayerState, GnomeModel { object, arms: {left,right}, rig,
  update(p, dt), setDead }.
The gnome API: `import { createGnomeModel, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome';`
createGnomeModel(look) returns a model about 1.2 m tall, feet at its origin, facing +z. model.update(pose, dt) copies
pose.position into model.object.position and pose.facing into rotation.y, and swings legs and arms by
pose.velocity length when pose.grounded is true. So for a seated gnome: keep one pose object with
position (0,0,0), velocity (0,0,0), facing 0, grounded true, jumpsUsed 0; call model.update(pose, dt) every frame,
THEN set model.arms.left.rotation.x = model.arms.right.rotation.x = mower.armReach (update would overwrite it).
Put model.object inside a holder Group positioned at mower.seat, the holder a child of mower.object.

## Change
- games/lawn-prix/src/scene/mower.ts
- games/lawn-prix/src/scene/racer.ts

### mower.ts: createMower(vehicle, color): MowerModel
Primitives only (BoxGeometry, CylinderGeometry, etc.), MeshStandardMaterial, castShadow on the main meshes.
Body panels use `color`; black tyres 0x222222; grey metal 0x8a8f96; a dark seat 0x333333.
Gnome-sized: the gnome is about 1.2 m tall, so a cart is about 1.3 m wide x 2.0 m long; the bike about 0.6 x 1.5 m.
Apply VEHICLES[vehicle].scale to the whole object (object.scale.setScalar).
- cart (ride-on mower): low wide deck (the mower housing, slightly darker shade of color) between four wheels
  (big rear 0.55 m diameter, small front 0.35 m), a hood box in front with a little grille, a seat with a backrest at the
  rear, a steering column + wheel (TorusGeometry) in front of the seat, a side grass chute. seat ≈ (0, 0.45, -0.35):
  the gnome's feet sit low so its straight legs vanish into the footwell; armReach = -1.2.
  The steering wheel group rotates about its column with steer; front wheels yaw by steer * 0.5 rad.
- bike (push mower ridden like a scooter): a round mower deck (CylinderGeometry, flat) with four small wheels, an
  engine block with a pull-cord handle on top, and the long U-shaped push handle reaching forward and up like
  handlebars (two thin cylinders + crossbar at about 1.0 m high, ahead of the gnome). The gnome stands on a
  footplate on the rear of the deck: seat ≈ (0, 0.25, -0.45); armReach = -1.4. The handle group yaws by steer * 0.35.
- update(speed, steer, dt): wheels spin about their axle by speed / radius * dt; a blade disc under the deck spins fast
  whenever |speed| > 0.5; steering parts follow steer (+1 = right: right is -x in object space, so a right turn yaws the
  wheel/handle NEGATIVE about y).

### racer.ts: createRacer(scene, look, vehicle, color): Racer
- object = a Group added to scene, containing a `tilt` Group (for lean) which holds mower.object; the gnome holder is
  inside mower.object at mower.seat. Gnome: createGnomeModel(look).
- update(k, dt): object.position.set(k.x, 0, k.z); object.rotation.y = k.h.
  speed = forward speed = vx*sin(h) + vz*cos(h). mower.update(speed, k.st, dt).
  Lean: tilt.rotation.z eases (1 - exp(-dt*10)) toward k.st * 0.12 * min(1, |speed|/10) (bike leans 2.5x as much);
  while k.drift !== 0 also add a yaw offset tilt.rotation.y easing toward -k.drift * 0.35 (the back swings out), else 0.
  Off-track bounce: when k.off and speed > 2, tilt.position.y = 0.04 * |sin(time * 25)|, else 0 (keep a local time).
  Drift sparks: while k.drift !== 0, show 2 small Points / tiny sprite-like meshes at the rear wheels whose colour is
  0x6cc8ff when k.charge < DRIFT.chargeForBoost, 0xffa030 once it is ready.
  Boost: while k.boost > 0 show a flickering orange cone flame (MeshBasicMaterial, transparent) at the back.
  Grass spray: a small pool (~30) of green clipping particles thrown out of the right side while on track and
  speed > 3; reuse the pool (no allocation per frame). Keep effects cheap: 4 racers on screen at once.
  Then gnome: model.update(pose, dt) and set the arms as described above.
- dispose(): scene.remove(object) and dispose every geometry and material under it (object.traverse).
Never import anything that touches the DOM at module import time. No Math.random at import time (fine inside update for
particles; the view is not part of the simulation).

## Contract (keep exactly)
export interface MowerModel { object: THREE.Group; seat: THREE.Vector3; armReach: number;
  update(speed: number, steer: number, dt: number): void }
export function createMower(vehicle: VehicleId, color: number): MowerModel
export interface Racer { object: THREE.Group; update(k: Readonly<KartState>, dt: number): void; dispose(): void }
export function createRacer(scene: THREE.Scene, look: GnomeLook, vehicle: VehicleId, color: number): Racer

## Done when
- `npx tsc --noEmit -p .` passes.

## Out of scope
Every other file (config.ts, sim.ts, trackView.ts, camera.ts, app.ts, ui/*, minigames/*).
~~~~

~~~~text
Epic: 2 Game, issue D: menu and HUD
Depends on: none

<Shared environment block>
- UI rule: modules get the shared #ui element as a parent. Append your own container to it; never restyle or hide #ui
  itself. #ui has pointer-events:none, so give your interactive containers pointer-events:auto. Font: system-ui.

## Goal
src/ui/menu.ts (garage screen: choose vehicle and mower colour) and src/ui/hud.ts (race HUD, countdown, flash text,
results table) become real.

## Read first
- games/lawn-prix/src/config.ts: VEHICLES, VEHICLE_ORDER, MOWER_COLORS, RacerChoice.
- games/lawn-prix/src/ui/menu.ts and src/ui/hud.ts: the stubs; keep every export, signature and element id.

## Change
- games/lawn-prix/src/ui/menu.ts
- games/lawn-prix/src/ui/hud.ts
Plain DOM + inline styles (or one <style> element you create and remove with your container). No frameworks.
Both must work on a phone (portrait and landscape, touch) and a desktop.

### menu.ts: showMenu(ui, initial, onStart)
- Container id 'lp-menu', full-screen, semi-transparent dark green gradient over the 3D scene, pointer-events:auto.
- Title "LAWN PRIX" (big, chunky, yellow with a dark outline/shadow) and a subtitle "3 laps. Stay on the mown grass."
- The player's gnome name: `import { getMyGnome } from '@lawn/gnome'`; show "Racing as <name>" when getMyGnome() is not
  null, else "Racing as Gnorman (make your own gnome in the Gnome Creator)".
- Vehicle cards, one per VEHICLE_ORDER entry: name, blurb, and three stat bars computed from VEHICLES (Speed =
  maxSpeed/20, Accel = accel/14, Handling = turnRate/3, Weight = mass/1.6), plus a simple drawn icon (inline SVG of a
  side-view mower in the selected colour; cart = boxy ride-on with seat, bike = push mower with a long handle).
  Clicking selects (highlighted border). Ids: 'lp-vehicle-cart', 'lp-vehicle-bike'.
- Colour swatches from MOWER_COLORS (round buttons, title = colour name), selected one ringed. Selecting recolours the
  card icons. Ids: 'lp-color-<index>'.
- A big START button id 'lp-start'. Keyboard: Enter starts; ←/→ switches vehicle; ↑/↓ cycles colour.
- On start: remove the container and its listeners, then call onStart({ vehicle, color }) exactly once.
  Saving the choice is the caller's job, not yours.

### hud.ts: createHud(ui): Hud
- Container id 'lp-hud' (pointer-events:none except the results panel's buttons).
- update(info): top-left big place "1st"/"2nd"/"3rd"/"4th" (ordinal of info.place+1) with " / <count>"; top-right
  "LAP <lap>/<laps>" and time as m:ss.t; bottom-right speed as km/h (speed*3.6, integer) in a round gauge-ish badge;
  bottom-centre a drift charge bar (width = charge01, blue under 1, orange at 1, pulsing gold while boosting).
  Hide the charge bar when charge01 is 0 and not boosting. update is called every frame: only touch textContent/style
  when the value changed.
- countdown(v): giant centre number/GO with a quick scale-pop CSS animation; null hides it.
- flash(text): centre text that pops in and fades out after ~1.2 s (a new flash replaces the old one).
- showResults(rows, onAgain, onGarage): a centred panel (pointer-events:auto) titled "RESULTS", one row per entry in
  place order: place ordinal, a colour dot (row.color as #rrggbb), name, vehicle name (VEHICLES[row.vehicle].name),
  time m:ss.t or "DNF". The row with me = true is highlighted. Buttons 'lp-again' ("Race again", also Enter) and
  'lp-garage' ("Garage"). Each calls its callback once and removes the panel. Calling showResults hides the race HUD
  widgets; the next update() shows them again.
- dispose(): remove everything and any key listeners.

## Contract (keep exactly)
export interface HudInfo { lap: number; laps: number; place: number; count: number; time: number; speed: number;
  charge01: number; boosting: boolean }
export interface ResultRow { place: number; name: string; vehicle: VehicleId; color: number; time: number | null; me: boolean }
export interface Hud { update(info: HudInfo): void; countdown(v: number | 'GO' | null): void; flash(text: string): void;
  showResults(rows: readonly ResultRow[], onAgain: () => void, onGarage: () => void): void; dispose(): void }
export function createHud(ui: HTMLElement): Hud
export function showMenu(ui: HTMLElement, initial: RacerChoice, onStart: (choice: RacerChoice) => void): void

## Done when
- `npx tsc --noEmit -p .` passes.

## Out of scope
Every other file.
~~~~

~~~~text
Epic: 2 Game, issue E: sound
Depends on: none

<Shared environment block>

## Goal
src/audio.ts makes all the race sounds with WebAudio (no files): a mower engine that follows speed, and short effects.

## Read first
- games/lawn-prix/src/audio.ts: the stub; keep RaceAudio and createAudio exactly.

## Change
- games/lawn-prix/src/audio.ts only.

- createAudio() must not create an AudioContext (browsers block it before a gesture). start() creates it lazily
  (new AudioContext()), resumes it, and builds the engine graph once. Every other method is a no-op until start() ran.
- Mute when location.hash contains 'mute' (check inside start()).
- Engine: a two-stroke mower putter. A sawtooth oscillator + a square oscillator an octave down, through a lowpass
  BiquadFilter, into a gain. engine(speed01, offTrack): frequency = 45 + speed01 * 110 Hz (square at half),
  filter frequency 500 + speed01 * 1400, gain 0.05 + speed01 * 0.06; use setTargetAtTime(value, now, 0.05) on params.
  Off track: add a rough amplitude flutter: an LFO (OscillatorNode 18 Hz, gain node into the engine gain's gain param)
  whose depth goes to 0.04 when offTrack, else 0. Master gain 0.6.
- stopEngine(): ramp the engine gain to 0 (it resumes on the next engine() call).
- beep(final): sine blip 0.15 s, 660 Hz (final: 990 Hz, 0.35 s).
- boost(): a whoosh: white-noise buffer (create once, 1 s) through a bandpass sweeping 400 -> 2500 Hz over 0.4 s.
- bump(): a short thud: sine 120 Hz dropping to 60 Hz in 0.12 s + a little noise.
- lap(): two rising blips. finish(): a little 4-note fanfare (square, C5 E5 G5 C6, 0.12 s each, last held 0.4 s).
Every one-shot node is created, started, stopped and left to be garbage collected; never accumulate nodes per frame
in engine() (it is called every frame: only set params).

## Contract (keep exactly)
export interface RaceAudio { start(): void; engine(speed01: number, offTrack: boolean): void; beep(final: boolean): void;
  boost(): void; bump(): void; lap(): void; finish(): void; stopEngine(): void }
export function createAudio(): RaceAudio

## Done when
- `npx tsc --noEmit -p .` passes.

## Out of scope
Every other file.
~~~~

~~~~text
Epic: 2 Game, issue F: game loop, controls, chase camera
Depends on: none (codes against the stubs' signatures; the other modules fill in at the same time)

<Shared environment block>

## Goal
src/app.ts runs the full game: garage menu -> 3-2-1-GO -> 3-lap race against 3 CPUs -> results -> again/garage.
src/input.ts reads keyboard and touch. src/scene/camera.ts is the chase camera.

## Read first
- games/lawn-prix/src/config.ts: everything (types, RACE, CAMERA, VEHICLES, MOWER_COLORS, CHOICE_KEY).
- games/lawn-prix/src/main.ts: entry (loads the player's gnome, then imports ./app). Do not edit it.
- games/lawn-prix/src/app.ts, input.ts, scene/camera.ts: stubs you replace.
These modules are being written by others right now; use exactly these signatures:
  sim.ts:  createRace(entries: {vehicle, skill}[], laps?) : RaceState; stepRace(race, inputs: (KartInput|null)[], dt): void;
           racePlaces(race): number[] (0 = 1st); cpuInput(race, index): KartInput; resolveBumps is called inside stepRace.
  scene/trackView.ts: buildTrack(scene): void (adds sky, fog, lights, ground, track, props).
  scene/racer.ts: createRacer(scene, look: GnomeLook, vehicle, color): Racer { object, update(k: KartState, dt), dispose() }
  ui/menu.ts: showMenu(ui, initial: RacerChoice, onStart: (c: RacerChoice) => void): void
  ui/hud.ts: createHud(ui): Hud { update(HudInfo), countdown(3|2|1|'GO'|null), flash(text), showResults(rows, onAgain, onGarage), dispose() }
    HudInfo { lap (1..laps), laps, place (0 = 1st), count, time, speed (m/s), charge01, boosting }
    ResultRow { place, name, vehicle, color, time: number | null, me }
  audio.ts: createAudio(): RaceAudio { start(), engine(speed01, offTrack), beep(final), boost(), bump(), lap(), finish(), stopEngine() }
  @lawn/gnome: getMyGnome(): { name, look, code } | null; GNORMAN_LOOK: GnomeLook; type GnomeLook.

## Change
- games/lawn-prix/src/app.ts
- games/lawn-prix/src/input.ts
- games/lawn-prix/src/scene/camera.ts

### scene/camera.ts: updateChaseCamera(camera, k, dt, snap = false)
Desired position = kart position - fwd(k.h) * CAMERA.distance, y = CAMERA.height. Look target = kart + fwd *
CAMERA.lookAhead, y = CAMERA.lookHeight. Use the kart's heading but smooth it: keep a module-level smoothed yaw is NOT
allowed (several cameras may exist); instead lerp the camera position with a = 1 - exp(-dt * CAMERA.follow) (snap: a = 1)
and always lookAt the target. Also widen fov a little with speed: camera.fov eases toward CAMERA.fov + min(12, speed*0.5)
(+6 more while k.boost > 0), then camera.updateProjectionMatrix() only when it changed by > 0.05.

### input.ts: createControls(canvas): Controls
Keyboard on window (keydown/keyup, track a Set of e.code): throttle = (KeyW|ArrowUp ? 1 : 0) - (KeyS|ArrowDown ? 1 : 0);
steer = (KeyD|ArrowRight ? 1 : 0) - (KeyA|ArrowLeft ? 1 : 0) (+1 = right); drift = Space | ShiftLeft | ShiftRight.
preventDefault on those keys. Touch on the canvas (pointer events, pointerType 'touch'): a pointer that went down on the
left half steers by horizontal drag from its start point (steer = clamp(dx / 60px, -1, 1)); a pointer on the right half
means throttle 1; while two or more pointers are down and any steer is non-zero, drift = true. If any touch was ever seen,
throttle defaults to 1 whenever a left-half pointer is down too (phone players hold one thumb). read() returns the
combined KartInput (keyboard values win when non-zero). dispose() removes every listener.

### app.ts
- Renderer: WebGLRenderer({ canvas: #game, antialias: true }), setPixelRatio(min(devicePixelRatio, 2)),
  shadowMap.enabled = true, shadowMap.type = THREE.PCFSoftShadowMap, resize on window resize (renderer.setSize +
  camera.aspect). Scene + PerspectiveCamera(CAMERA.fov, aspect, 0.1, 400). buildTrack(scene) once.
- Player look: getMyGnome()?.look ?? GNORMAN_LOOK; name getMyGnome()?.name ?? 'Gnorman'.
- Choice: read RacerChoice from localStorage[CHOICE_KEY] (try/catch JSON; validate vehicle in VEHICLES and colour in
  MOWER_COLORS) else { vehicle: 'cart', color: MOWER_COLORS[0].hex }. Save it on start.
- Menu phase: showMenu(ui, choice, start). Behind it, a slow orbiting camera around the start line
  (pointAt(TRACK.startS) from track.ts) at radius 14, height 6.
- start(choice): audio.start(); build the race: entries = [player {vehicle: choice.vehicle, skill: 1}] plus RACE.cpuCount
  CPUs. CPU i (1..3): vehicle alternates (VEHICLE_ORDER[i % 2]), colour = a MOWER_COLORS entry different from the
  player's (pick in order, skipping the player's), look = { ...GNORMAN_LOOK, hat: <its mower colour>, shirt: one of
  [0x2f64c9, 0x8a4fd0, 0xd07a2f] }, names ['Gnorbert', 'Gnadine', 'Gnigel'], skill RACE.cpuSkill[i].
  Kart index 0 is always the player, but the player starts at the BACK of the grid: after createRace, swap kart 0's
  x/z/h/s/dist values with the last kart's. Dispose the previous race's racers; create one
  Racer per kart. Snap the camera.
- Countdown: RACE.countdownS seconds; hud.countdown(3/2/1) with audio.beep(false) each second, then 'GO' +
  beep(true) for 0.6 s, then null. The sim does not step during the countdown (racers still render).
- Racing: fixed-step accumulator at dt = 1/60 (cap 5 steps per frame). Inputs: index 0 = controls.read() (until the
  player finishes, then null), others cpuInput(race, i). stepRace(race, inputs, 1/60).
  Detect events by comparing kart 0 before/after a step: lap increased (and < laps) -> hud.flash(lap === laps-1 ?
  'FINAL LAP' : `LAP ${lap+1}`) + audio.lap(); boost went from 0 to > 0 -> audio.boost(); fin set -> hud.flash('FINISH!')
  + audio.finish(). A bump: if hypot of kart 0's velocity changed by > 3 m/s in one step while near another kart
  (< 2.5 m) -> audio.bump() (at most every 0.3 s).
  Every frame: racers[i].update(kart, frameDt); updateChaseCamera(camera, kart0, frameDt); hud.update({...});
  audio.engine(min(1, speed / VEHICLES[v].maxSpeed), kart0.off).
- Results: when race.over (or 4 s after the player finishes, whichever first; keep stepping the sim so CPUs
  can still finish during those 4 s): audio.stopEngine(); rows from racePlaces + fin times, me = index 0;
  hud.showResults(rows, again, garage). again = start(same choice). garage = back to the menu phase.
- `window.prix` = { race, choice } refreshed on every start, for debugging in the console.
- Debug hash: '#go' skips the menu and starts at once with the saved/default choice.
- Never restyle or hide #ui; menu/hud add their own containers to it.

## Contract
export interface Controls { read(): KartInput; dispose(): void }
export function createControls(canvas: HTMLCanvasElement): Controls
export function updateChaseCamera(camera: THREE.PerspectiveCamera, k: Readonly<KartState>, dt: number, snap?: boolean): void
app.ts has no exports (it is imported for its side effects by main.ts).

## Done when
- `npx tsc --noEmit -p .` passes.

## Out of scope
main.ts, config.ts, track.ts, sim.ts, scene/trackView.ts, scene/mower.ts, scene/racer.ts, ui/*, audio.ts, minigames/*.
~~~~

## Epic 3: Party slice

Written after Epic 2 lands, against the code as it then stands (see below).

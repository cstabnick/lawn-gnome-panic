# Lawn Prix: hop drift, items, four courses

Goal: on top of `games/lawn-prix` (see `docs/roadmaps/lawn-prix.md`):

- **Hop drift.** Pressing drift (Space, or R1/RB on a gamepad) makes a little hop. Landing while steering starts the drift; release a charged drift for a boost.
- **Items.** Item boxes on the track give an **acorn** (thrown forward; a hit spins the target out) or a **speed boost**. Leaders mostly get acorns, the back mostly boosts. Use with E, L1/LB or X, or the on-screen button.
- **Four courses**, picked in the menu: **Garden Loop** (the original), **Panic Yard** (the Lawn Gnome Panic yard: a gnome dodges mowers for golden acorns in the infield), **The Front** (a Red Caps vs Blue Caps battle on both sides of the road), **Island Links** (gnomes playing golf beside the fairways).
- **The show is untouchable but dangerous.** Every course has background vehicles (runaway mowers, THE COMBINE, golf carts) that cross the road. Touch one and you spin out for 1.6 s.
- **Gamepad** support (standard mapping).
- The party slice `prix-race` picks a random course and fires items on its own (still one verb: steer, plus drift).

Each course's background is built inside lawn-prix in the style of the other game. Nothing is imported from or changed in the other games (repo rule: games stand alone).

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (written by the planner) | `courses.ts` (4 layouts, item box rows, hazard paths), `track.ts` per course (`getTrack(id)`), `hazards.ts` (implemented), new types in `config.ts` (hop, items, spin, `KartInput.item`, `KartState.hop/spin/item/dh/ih`, `RaceState.course/boxes/acorns`), stubs, `scene/courses/util.ts`; build and 42 tests pass | 0 |
| 2 Features | everything above plays in the full game | 11 (A-K, parallel) |
| 3 Party slice | `prix-race` on a random course with items; `npm test` passes | 1 |

## Shared environment block (applies to every issue)

~~~~text
## Environment
- Repo root: /home/user/lawn-gnome-panic (Linux, bash). Game: games/lawn-prix (Vite 8 + TypeScript strict + three 0.187).
- Dependencies are installed. Do not add packages.
- Type-check (safe while others work): `cd /home/user/lawn-gnome-panic/games/lawn-prix && npx tsc --noEmit -p .`
- Tests: `cd /home/user/lawn-gnome-panic/games/lawn-prix && npx vitest run`
- Do NOT run `vite build`, `npm run build` or a dev server. Do not git commit.
- Ten other workers edit OTHER files in games/lawn-prix at the same time. Edit only the files under Change. Other modules
  may still be stubs: code against the exported signatures quoted in your issue, not their bodies. Never change an
  exported signature of a file you own (others call it), except where your issue says so.
- If `npx tsc` shows errors only in files you do not own, they are another worker's work in progress: ignore them,
  but your own files must have none.
- All art and sound is generated in code (three.js primitives, canvas textures, WebAudio). No asset files.
- Coordinates: metres, y up. Heading h: forward = (sin h, 0, cos h); h = 0 faces +z; increasing h turns LEFT;
  left of heading h = (cos h, 0, -sin h). Left of a track tangent (tx, tz) is (tz, -tx).
- Key modules (read them when your issue says so):
  src/config.ts   all tuning and shared types (KartInput, KartState, RaceState, Acorn, ItemKind, CourseId, HOP, ITEMS, HAZARD, SPIN)
  src/courses.ts  COURSES (layouts, bounds, boxRows, hazards: HazardDef {kind 'mower'|'combine'|'golfcart', crossF, span, speed, phase, radius}), COURSE_ORDER
  src/track.ts    getTrack(id): Track { course, points, length, width }; pointAt(track, s); projectOnTrack(track, x, z) -> {s, lateral, x, z, tx, tz};
                  isOnTrack(track, hit); headingOf(tx, tz); gridSlot(track, i); wrapS(track, s)
  src/hazards.ts  hazardsAt(track, t): HazardPose[] {kind, x, z, h, radius, across (-1..1, 0 = on the centreline)}; hazardHits(race, track)
  src/items.ts    boxSpots(track): {x, z}[] (order of race.boxes); itemRoll(t, a, b): 0..1
  src/sim.ts      createRace(entries, course, laps?); stepRace(race, inputs, dt): RaceEvents; racePlaces; cpuInput
- The shared gnome: `import { createGnomeModel, GNORMAN_LOOK, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome'`.
  createGnomeModel(look) is ~1.2 m tall, feet at its origin, faces +z. Each frame set a PlayerState
  { position: Vector3, velocity: Vector3, facing, grounded, jumpsUsed } and call model.update(pose, dt): it copies
  position/facing, swings legs and arms by the velocity length when grounded. Raising jumpsUsed to 2 while
  grounded = false plays a front flip. model.arms.left/right.rotation.x (negative = forward) can be set AFTER update.
  src/scene/courses/util.ts has createActor(scene, x, z, yaw, lookOverrides): { model, pose, update(dt) } for this.
~~~~

## Epic 2: Features

~~~~text
Epic: 2, issue A: hop drift and spin-outs in the sim
Depends on: none

<Shared environment block>

## Goal
Drifts start with a hop: a fresh drift press hops; landing with steer held starts the drift. Karts that are spinning
out (spin > 0, set by acorns and hazards) cannot drive. CPUs still drift.

## Read first
- games/lawn-prix/src/sim.ts (stepKart, cpuInput), src/config.ts (HOP, DRIFT, SPIN, KartState fields hop, spin, dh),
  src/sim.test.ts, src/hazards.ts.

## Change
- games/lawn-prix/src/sim.ts: only stepKart and cpuInput (keep every exported signature).
- games/lawn-prix/src/sim.test.ts.

### stepKart, in this order
1. `inp` as now (COAST when finished or null). press = inp.drift && !k.dh. At the very end of stepKart set k.dh = inp.drift.
2. Spin-out: if k.spin > 0: k.spin = max(0, k.spin - dt); k.drift = 0; k.charge = 0; k.hop = 0; no throttle and no
   steering this step (k.st = 0); both vF and vL *= Math.exp(-SPIN.drag * dt); then continue at step 6 (move, bounds,
   boost countdown, progress). A press during a spin does nothing.
3. Hop: if press && k.hop <= 0 && k.drift === 0: k.hop = HOP.duration.
   If k.hop > 0: k.hop -= dt; if it reaches <= 0 this step (landing): k.hop = 0, and if inp.drift && |steer| > HOP.minSteer
   && vF > DRIFT.minSpeed && !k.off: k.drift = sign(steer).
4. REMOVE the old drift start (`if (inp.drift && k.drift === 0 && |steer| > 0.3 ...)`). Drifts start only on landing.
   The release rule (button up or too slow, boost if charged) stays.
5. While hopping, sideways grip is halved (a hop lets you pivot): grip = spec.grip * 0.5 when k.hop > 0 and not drifting.
Keep everything else as it is.

### cpuInput
CPUs must now PRESS drift (false then true) to hop into a drift. The current logic returns drift = true while it wants
to drift; that already makes a press on the first step. Make sure that when a CPU wants a drift but k.drift === 0 and
k.hop === 0 and k.dh is true (it held the button but the landing missed the conditions), it returns drift = false for
that step so the next step is a fresh press. Keep `item: cpuItemUse(race, track, index)`.

## Tests (add to src/sim.test.ts; keep the existing ones passing)
- A press while driving straight sets hop > 0; after HOP.duration with no steer, drift stays 0.
- Holding drift with steer 1 at speed (> DRIFT.minSpeed) through a hop: drift becomes -1 or +1 (sign of steer = +1)
  only after the hop has landed, not before.
- Holding the drift button from the start of a straight never starts a second hop until released and pressed again.
- A kart with spin = 1 at speed slows to < 25% of its speed within 1 s and its heading does not change with steer 1.
- hazardHits: place a kart exactly at hazardsAt(track, race.t)[0] on the 'panic' course: it gets spin === HAZARD.spinS
  and is pushed outside the hazard radius.
- The existing 4-CPU race test still finishes within 90 s on 'garden'. Add the same for 'panic', 'front' and 'golf'
  (each within 90 s, places a permutation of 0..3). If one does not finish, tune only cpuInput constants.

## Done when
- `npx tsc --noEmit -p .` shows no errors in sim.ts or sim.test.ts.
- `npx vitest run src/sim.test.ts src/track.test.ts` passes.

## Out of scope
config.ts, courses.ts, track.ts, hazards.ts, items.ts and every other file.
~~~~

~~~~text
Epic: 2, issue B: items (boxes, acorns, boosts)
Depends on: none

<Shared environment block>

## Goal
src/items.ts makes item boxes, pickups, item use and acorns work, as pure functions called by stepRace.

## Read first
- games/lawn-prix/src/items.ts (the stub: boxSpots and itemRoll are done; fill stepItems and cpuItemUse).
- games/lawn-prix/src/config.ts: ITEMS, ItemKind, Acorn, KartState (item, ih, spin, fin, dist, boost, drift, charge),
  RaceState (boxes, acorns, t), VEHICLES (radius).
- games/lawn-prix/src/sim.ts: stepRace calls `stepItems(race, track, inputs, dt)` after the karts moved, bumps and
  hazards; cpuInput returns `item: cpuItemUse(race, track, index)`. Do not edit sim.ts.

## Change
- games/lawn-prix/src/items.ts (keep boxSpots, itemRoll, ItemEvents and both signatures).
- games/lawn-prix/src/items.test.ts (new).
items.ts must NOT import from './sim' (sim imports items). Pure: no Math.random, no DOM, no three.js.

### stepItems(race, track, inputs, dt): ItemEvents
For each kart i (k = race.karts[i], input = inputs[i] ?? null):
1. press = !!input?.item && !k.ih; then k.ih = !!input?.item.
2. Pickup (k.item === null, k.fin === null, k.spin <= 0): for each box j of boxSpots(track) with race.boxes[j] <= race.t
   and hypot(k - spot) < ITEMS.pickupRadius + VEHICLES[k.vehicle].radius: race.boxes[j] = race.t + ITEMS.boxRespawnS;
   place = number of karts strictly ahead of k (ahead = finished earlier, or finished while k is not, or both unfinished
   and larger dist); roll = itemRoll(race.t, i, j); k.item = roll < ITEMS.acornChanceByPlace[min(place, 3)] ? 'acorn'
   : 'boost'; events.picked.push(i); stop checking boxes for this kart.
3. Use (press && k.item !== null && k.spin <= 0 && k.fin === null):
   boost: k.boost = max(k.boost, ITEMS.boostS).
   acorn (only if race.acorns.length < ITEMS.maxAcorns, otherwise keep the item): fwd = (sin h, cos h),
   vF = max(0, vx*fwd.x + vz*fwd.z); spawn at k + fwd * (radius + 0.7) with velocity fwd * (ITEMS.acornSpeed + vF),
   o = i, t = ITEMS.acornLifeS. Then k.item = null; events.used.push(i).
4. Acorns (after all karts): move x += vx*dt, z += vz*dt; t -= dt; remove when t <= 0 or outside
   track.course.bounds. A hit: any kart j !== a.o with hypot < ITEMS.acornRadius + VEHICLES[kart.vehicle].radius
   and kart.spin <= 0: kart.spin = ITEMS.acornSpinS, kart.vx *= 0.3, kart.vz *= 0.3, kart.drift = 0, kart.charge = 0;
   remove the acorn; events.hits.push(j).
5. Keep the state small: after moving, round each acorn's x, z, vx, vz and t to 3 decimals
   (Math.round(v * 1000) / 1000). Deterministic, so the sim stays reproducible.

### cpuItemUse(race, track, index): boolean
k = race.karts[index]; false if k.item === null, k.spin > 0 or k.fin !== null.
- boost: true when !k.off and the track ahead is straight: |wrapAngle(headingOf(pointAt(k.s + 25)) - headingOf(pointAt(k.s)))| < 0.35.
- acorn: true when some other unfinished kart j is ahead of k within 30 m (dot((j - k), fwd) between 2 and 30) and
  within 2.5 m of k's forward line (|cross| < 2.5).
(It returns a level; stepItems only acts on a fresh press, so true for several steps uses one item.)

## Tests (src/items.test.ts)
Use createRace(entries, 'garden') from './sim' in the TEST file (that import is fine there) and step with stepItems
directly or stepRace.
- A kart placed on boxSpots(track)[0] with item null picks up an item; that box is gone until t + boxRespawnS; another
  kart on the same spot right after gets nothing.
- A kart in 1st place gets an acorn for roll < 0.85 (check with a few race.t values: compare against itemRoll).
- Using a boost sets boost to ITEMS.boostS and clears the item; using needs a fresh press (holding item true for 10
  steps after a second pickup does not use it).
- An acorn thrown at a kart 10 m straight ahead hits it within 1 s: spin === ITEMS.acornSpinS, hits event, acorn gone;
  the thrower is never hit by its own acorn.
- Acorns expire after acornLifeS.
- A full 4-CPU race (cpuInput + stepRace on 'garden') stays under 1900 bytes of JSON.stringify(race) at every step and
  every CPU uses at least one item.

## Done when
- `npx tsc --noEmit -p .` shows no errors in items.ts or items.test.ts.
- `npx vitest run src/items.test.ts` passes.

## Out of scope
sim.ts, config.ts and every other file. If a tuning value in ITEMS looks wrong, say so in your report.
~~~~

~~~~text
Epic: 2, issue C: per-course track look, garden show
Depends on: none

<Shared environment block>

## Goal
scene/trackView.ts builds only what every course shares, coloured per course; the garden's own props and its
background show move to scene/courses/garden.ts.

## Read first
- games/lawn-prix/src/scene/trackView.ts (the whole file: it builds the garden today; buildTrack(scene, course) returns
  a CourseView and already calls buildCourseShow and createHazardView at the end; keep that).
- games/lawn-prix/src/scene/courses/index.ts (CourseShow, the builders), src/scene/courses/util.ts (mulberry32,
  canvasTexture, distFromTrackEdge, offTrackSpot, createActor), src/scene/courses/garden.ts (the stub you fill).

## Change
- games/lawn-prix/src/scene/trackView.ts
- games/lawn-prix/src/scene/courses/garden.ts

### trackView.ts (shared parts only)
- Use mulberry32 and canvasTexture from './courses/util' (delete the local copies).
- A THEMES table keyed by CourseId: sky (background and fog colour), ground colour + fleck colour, stripe light/dark,
  edge trim colour, boundary style ('hedge' | 'fence' | 'sandbags' | 'rope'), tuft colour:
  garden: sky 0x8fd0ff, ground 0x3f8a2e, stripes 0x8fd16a / 0x76bd55, trim 0xe8f0d0, hedge, tufts 0x4f9a35 (today's look)
  panic:  sky 0x9fd8ff, ground 0x4a9a34, stripes 0x9ad870 / 0x7fc458, trim 0xffffff, fence (white picket)
  front:  sky 0xb8c4c8 (overcast), ground 0x5b6e33 (trampled), track a packed-dirt road: stripes 0xa88a5a / 0x9a7d50,
          trim 0x6b5a3a, sandbags
  golf:   sky 0x7fd0ff, ground 0x3f9a40, fairway stripes 0x7fd65a / 0x6cc84a, trim 0xf2e8c0 (sand edge), rope (white posts and rope)
- Keep: sky/fog/lights, ground plane, track ribbon with stripes, edge trim, start line + "LAWN PRIX" arch (posts 4.6 m),
  long-grass tufts (front: fewer, browner), the boundary around track.course.bounds in the theme's style.
- Move OUT to garden.ts: flower beds, trees, pots, hay bales on corners.

### garden.ts: buildGardenShow(scene, track): CourseShow
- The moved props (same look and seeded placement).
- Something happening: two gnomes (createActor) on the grass 8-14 m off the track, facing each other ~8 m apart,
  tossing a red ball back and forth (ball on a parabola, 1.2 s per throw, the catcher's arms up while it flies), and a
  lawn sprinkler (a small spinning arm with a fan of light-blue transparent water droplets, ~40 Points) near a flower bed.
  Animate from raceT so all screens agree (use raceT + a small own clock before the race starts: update(raceT, dt)
  gets raceT = 0 until GO; keep a local time t += dt and use t).
- Return { update(raceT, dt) }.

## Done when
- `npx tsc --noEmit -p .` shows no errors in your two files.

## Out of scope
scene/courses/index.ts, util.ts, panic.ts, front.ts, golf.ts, hazardView.ts and every other file.
~~~~

~~~~text
Epic: 2, issue D: Panic Yard background show
Depends on: none

<Shared environment block>

## Goal
scene/courses/panic.ts dresses the Panic Yard course as the yard of the game Lawn Gnome Panic, with that game being
"played" in the infield as you drive past.

## Read first
- games/lawn-prix/src/scene/courses/panic.ts (stub), index.ts (CourseShow), util.ts (helpers: mulberry32,
  canvasTexture, distFromTrackEdge, offTrackSpot, createActor).
- games/lawn-prix/src/courses.ts: COURSES.panic (bounds, layout).
- For the look only (do not import from it, do not edit it): games/sample-3d/src/house.ts and games/sample-3d/src/
  mowerModels.ts give the idea: a cosy cottage with a pitched roof, ride-on mowers chasing a gnome.

## Change
- games/lawn-prix/src/scene/courses/panic.ts only. `export function buildPanicShow(scene, track): CourseShow`.

Build (primitives, MeshStandardMaterial, castShadow on big things, under ~350 lines):
- The infield is roughly the middle of the bounds (x ≈ 0, z ≈ 0). Use distFromTrackEdge to keep everything >= 2 m off
  the track edge.
- A cottage near the infield's middle: cream walls, red pitched roof (two rotated boxes or a prism), a door, windows,
  a chimney. A garden shed and a washing line elsewhere.
- The game being played: a "player" gnome (createActor, red hat) running around a 10 m circle in the infield beside the
  cottage, collecting golden acorns (6 small gold spheres + caps on that circle, each hidden for 4 s after the gnome
  passes it, then back). Every 3 s the gnome jumps (pose.grounded = false and a 0.5 s parabola of 0.8 m; on every
  second jump set jumpsUsed to 2 for a front flip; reset jumpsUsed to 0 on landing).
  Two mowers (ride-on mower shapes: red body, black wheels, a seat, no driver) chase it on circles of 9 m and 12 m,
  one lap behind and ahead, so it looks like dodging.
- A big floating score board above the infield on two poles: a canvas texture "ACORNS: n" that counts the acorns the
  gnome collected (redraw only when n changes).
- Garden dressing outside the track: flower beds, a bird bath, picket fence segments, 4 trees.
- Animate from a local clock t += dt (update(raceT, dt)). Return { update }.

## Done when
- `npx tsc --noEmit -p .` shows no errors in panic.ts.

## Out of scope
Every other file (the crossing hazards are drawn by scene/hazardView.ts, not here).
~~~~

~~~~text
Epic: 2, issue E: The Front background show
Depends on: none

<Shared environment block>

## Goal
scene/courses/front.ts dresses The Front as the battlefield of the game Gnome Front: Red Caps and Blue Caps fighting
on both sides of the road while you race through.

## Read first
- games/lawn-prix/src/scene/courses/front.ts (stub), index.ts (CourseShow), util.ts (helpers).
- games/lawn-prix/src/courses.ts: COURSES.front (bounds, layout).

## Change
- games/lawn-prix/src/scene/courses/front.ts only. `export function buildFrontShow(scene, track): CourseShow`.

Build (primitives, under ~350 lines):
- Two sides: the Red Caps base in the -x half, the Blue Caps base in the +x half (both >= 6 m off the track edge,
  use offTrackSpot / distFromTrackEdge). Each base: a flag pole with a cloth flag (plane, waving: vertices or a
  rotation wobble) in team colour (red 0xd23a32, blue 0x2f64c9), sandbag walls (rows of flattened capsules or boxes),
  a few crates.
- Soldiers: 8 red and 8 blue gnomes (createActor with hat = team colour, shirt = darker team colour). Each strafes
  between two points 6 m apart near its base (velocity set so the run cycle plays), stops, faces the enemy side, and
  "fires": a short bright tracer (thin stretched box, MeshBasicMaterial, yellow) flies 25 m toward the other side
  over 0.3 s, high above the road (y 2.5) so it never hides the karts. Hold a small rifle (thin dark box) by
  setting arms forward (-1.4) after update.
- Every 2-4 s a random explosion puff somewhere >= 6 m off the track: an orange sphere that scales up and fades, then
  a grey smoke sphere rising and fading (pool and reuse 6 of each; no allocation per frame).
- Shell craters (dark flattened cylinders) and barbed-wire posts scattered in the grass.
- A "TICKETS" board on two poles at the edge: canvas texture "RED 87 - BLUE 91" counting down slowly over time.
- Animate from a local clock. Seeded randomness (mulberry32) for placement; per-frame randomness may use the seeded rng too.

## Done when
- `npx tsc --noEmit -p .` shows no errors in front.ts.

## Out of scope
Every other file (THE COMBINE and the crossing mower are drawn by scene/hazardView.ts).
~~~~

~~~~text
Epic: 2, issue F: Island Links background show
Depends on: none

<Shared environment block>

## Goal
scene/courses/golf.ts dresses Island Links as the course of the game Gnome Golf: gnomes playing golf beside the road.

## Read first
- games/lawn-prix/src/scene/courses/golf.ts (stub), index.ts (CourseShow), util.ts (helpers).
- games/lawn-prix/src/courses.ts: COURSES.golf (bounds, layout).

## Change
- games/lawn-prix/src/scene/courses/golf.ts only. `export function buildGolfShow(scene, track): CourseShow`.

Build (primitives, under ~350 lines). Everything >= 3 m off the track edge (distFromTrackEdge / offTrackSpot):
- Three greens (light green flattened cylinders, radius 4-5 m) with a hole (dark small circle), a flag pin (white pole,
  red flag with a number 1-3 on a canvas texture). Two sand bunkers (beige flattened ellipses) and one pond (blue
  transparent plane with a darker rim) inside the bounds but off the track.
- On each green, a putting gnome (createActor, pastel shirt, flat cap: use the default hat) and a white ball: every 5 s
  the gnome swings (arms rotate back then forward) and the ball rolls to the hole along the ground (ease out over
  1.5 s), drops in (sinks), then reappears 3 m away for the next putt; a second gnome stands by holding the flag.
- A tee box with a driving gnome: every 7 s it swings and a ball flies a high arc (peak 12 m) over the track to land
  on the far side; a small white trail (Points) follows it.
- Spectators: 6 gnomes behind a rope line clapping (arms up and down) whenever a putt drops.
- A scoreboard on two poles: canvas text "HOLE 3  PAR 4" and a running list of three names with scores.
- Palm-ish trees (thin tall trunk + 5 drooping leaf boxes) around the edges: it is an island.
- Animate from a local clock. Seeded placement (mulberry32).

## Done when
- `npx tsc --noEmit -p .` shows no errors in golf.ts.

## Out of scope
Every other file (the crossing golf carts are drawn by scene/hazardView.ts).
~~~~

~~~~text
Epic: 2, issue G: hazard vehicles
Depends on: none

<Shared environment block>

## Goal
scene/hazardView.ts draws each course's background vehicles that cross the road, where hazardsAt says they are.

## Read first
- games/lawn-prix/src/scene/hazardView.ts (stub; keep createHazardView(scene, track): HazardView { update(raceT, dt) }).
- games/lawn-prix/src/hazards.ts (hazardsAt -> HazardPose { kind, x, z, h, radius, across }), src/courses.ts (HazardDef,
  which courses have which kinds), src/scene/mower.ts (createMower(vehicle, color): MowerModel { object, seat,
  armReach, update(speed, steer, dt) } — reuse it for the mowers).

## Change
- games/lawn-prix/src/scene/hazardView.ts only.

- One model per HazardDef of track.course.hazards (index order matches hazardsAt).
  - 'mower': createMower('cart', 0xd8342c) scaled 1.15, with a gnome driver (createGnomeModel with a wild look: hat
    0xf2c230, beard white; seat it like scene/racer.ts does: holder group at mower.seat, update with a zero-velocity
    grounded pose, then arms = mower.armReach), arms flailing up and down (rotation.x between -2.6 and -0.6) because it
    is a RUNAWAY mower. mower.update(speed, 0, dt) with speed = the def's speed.
  - 'combine': THE COMBINE, sized to its radius (2.4 m): green body box ~3.2 x 2.2 x 4 m, a glass cab on top with a gnome
    driver, big rear wheels, a wide header at the front (4.8 m wide) with a spinning reel (cylinder with 6 bat slats,
    rotation about its axis), a grain pipe. Yellow-and-black hazard stripes on the header (canvas texture).
  - 'golfcart': white cart (body, roof on 4 thin posts, seat), 2 gnome golfers (pastel shirts), a golf bag on the back,
    small black wheels that spin.
- update(raceT, dt): place each model at its pose (x, 0, z), rotation.y = h. Every model gets an orange warning beacon
  on top (small sphere, MeshBasicMaterial) that flashes 3 times a second while |across| < 0.6 (near or on the road),
  and is dark otherwise. castShadow on the main meshes.
- Nothing at import time. Under ~300 lines.

## Done when
- `npx tsc --noEmit -p .` shows no errors in hazardView.ts.

## Out of scope
Every other file, including scene/mower.ts and scene/racer.ts (reuse createMower, do not edit it).
~~~~

~~~~text
Epic: 2, issue H: item boxes, acorns, hop and spin on the racers
Depends on: none

<Shared environment block>

## Goal
scene/itemView.ts draws item boxes and acorns in flight; scene/racer.ts shows hops and spin-outs.

## Read first
- games/lawn-prix/src/scene/itemView.ts (stub; keep createItemView(scene, track): ItemView { update(race, dt), dispose() }).
- games/lawn-prix/src/scene/racer.ts (createRacer; keep its signature and Racer interface).
- games/lawn-prix/src/config.ts: RaceState (boxes: race time when box j is back, 0 = there; acorns: Acorn {x, z, vx, vz, o, t}),
  KartState (hop: seconds left of a hop, spin: seconds left of a spin-out, item), HOP (duration, height), ITEMS.

## Change
- games/lawn-prix/src/scene/itemView.ts
- games/lawn-prix/src/scene/racer.ts

### itemView.ts
- Item boxes at boxSpots(track) (index j = race.boxes[j]): a 0.9 m cube "seed crate": translucent rainbow-tinted
  MeshStandardMaterial (transparent, opacity 0.75, emissive tint cycling hue over time) with a white "?" canvas texture
  on every face, floating at y 0.9, spinning (rotation.y and a little x) and bobbing. Taken (race.boxes[j] > race.t):
  hidden; when it comes back, it pops in (scale 0 -> 1 over 0.25 s).
- Acorns: a pool of ITEMS.maxAcorns acorn meshes (brown ellipsoid body 0.3 m + darker cap with a little stem), at
  y 0.5, tumbling (rotate by speed), with a dark shadow blob disc on the ground; hide unused pool entries. On screens
  that get snapshots (the party), smooth: lerp each pooled acorn toward its target (1 - exp(-dt*20)), snap if > 4 m
  away or newly shown.
- dispose(): remove the group, dispose geometries, materials and textures.

### racer.ts (add to the existing update)
- Hop: while k.hop > 0, raise the tilt group by HOP.height * sin(PI * (1 - k.hop / HOP.duration)) (a small arc), and a
  little squash on landing is optional.
- Spin-out: while k.spin > 0, rotate the tilt group about y by an extra angle that turns 2 full turns over the spin
  (keep a local accumulator: spinAngle += dt * 12 while spinning, ease back to 0 within 0.2 s after), and show 3 small
  yellow star sprites (or flat stars) circling above the gnome's head. Hide them otherwise.
- Keep everything else (lean, drift sparks, boost flame, grass spray) as it is.

## Done when
- `npx tsc --noEmit -p .` shows no errors in itemView.ts or racer.ts.

## Out of scope
Every other file.
~~~~

~~~~text
Epic: 2, issue I: course picker, item slot, controls help
Depends on: none

<Shared environment block>
- UI rule: append your own containers to the shared #ui; never restyle or hide #ui. #ui has pointer-events:none, so
  interactive containers need pointer-events:auto.

## Goal
The menu gets a course picker; the HUD shows the held item and a spin-out wobble.

## Read first
- games/lawn-prix/src/ui/menu.ts and src/ui/hud.ts (both whole; keep every export, signature and element id).
- games/lawn-prix/src/config.ts (RacerChoice now has course: CourseId; ItemKind), src/courses.ts (COURSES, COURSE_ORDER:
  name, blurb), src/track.ts (getTrack(id).points: {x, z} centreline samples, for a mini map).

## Change
- games/lawn-prix/src/ui/menu.ts
- games/lawn-prix/src/ui/hud.ts

### menu.ts
- A course row above the vehicle cards: one small card per COURSE_ORDER entry, id 'lp-course-<id>', with the name,
  the blurb in small text, and a mini map: an inline SVG polyline of getTrack(id).points (every 4th point, scaled to
  fit a 120 x 80 box, stroke 3 px light green, the start marked with a small white square at points[0]). Selected = highlighted border. Start from initial.course.
  Keyboard: Q / Tab cycle the course (Tab with preventDefault). onStart gets { vehicle, color, course }.
- A small controls help line at the bottom: "Drive W/S or ↑/↓ · Steer A/D · Space or R1: hop & drift · E or L1: item ·
  Gamepad works". On narrow screens let the menu scroll (it already does).
- Gamepad in the menu is not needed.

### hud.ts
- HudInfo already has item: ItemKind | null and spinning: boolean (added by the planner; keep them).
- Item slot: a rounded square (64 px) at top centre with a dark translucent fill and a white border. Empty: faint.
  'acorn': an inline SVG acorn (brown body, darker cap). 'boost': an inline SVG orange lightning bolt. Pop animation
  when the item changes from null to something. Under it a tiny hint "E / L1" while holding an item.
- Spinning: while info.spinning, show "SPUN OUT!" in yellow under the place, wobbling (CSS rotate animation).
- Only touch the DOM when a value changed (as the existing update does).

## Done when
- `npx tsc --noEmit -p .` shows no errors in menu.ts or hud.ts.

## Out of scope
Every other file.
~~~~

~~~~text
Epic: 2, issue J: gamepad, item button, game loop for courses and items
Depends on: none (codes against the signatures below; the modules fill in at the same time)

<Shared environment block>

## Goal
The full game supports gamepads and an item button, rebuilds the scene for the chosen course, shows items and the
course show, and plays sounds for the new events.

## Read first
- games/lawn-prix/src/app.ts (whole), src/input.ts (whole), src/config.ts (RacerChoice.course, KartInput.item, CHOICE_KEY).
Signatures you code against (being written by others now):
  scene/trackView.ts  buildTrack(scene, course: CourseId): CourseView { update(raceT: number, dt: number) }
  scene/itemView.ts   createItemView(scene, track: Track): ItemView { update(race, dt); dispose() }
  sim.ts              createRace(entries, course, laps?); stepRace(race, inputs, dt): RaceEvents
                      RaceEvents { bumped: number[]; hazard: number[]; picked: number[]; used: number[]; hits: number[] } (kart indices)
  track.ts            getTrack(id): Track
  courses.ts          COURSES, COURSE_ORDER
  audio.ts            RaceAudio adds hop(), pickup(), throwAcorn(), hit(big: boolean)
  ui/hud.ts           HudInfo adds item: ItemKind | null, spinning: boolean (already passed by app.ts)
  ui/menu.ts          showMenu(ui, initial: RacerChoice, onStart) (the RacerChoice it returns includes course)

## Change
- games/lawn-prix/src/input.ts
- games/lawn-prix/src/app.ts

### input.ts: createControls(canvas, ui): Controls (signature already has ui)
- Keyboard item: KeyE (preventDefault). Keep everything else.
- Gamepad (navigator.getGamepads(), first non-null pad with mapping 'standard', polled inside read()):
  steer = axes[0] with a 0.15 deadzone (rescaled), also D-pad buttons 14/15 (left/right) as -1/+1;
  throttle = max(buttons[7].value, buttons[0].pressed ? 1 : 0) - max(buttons[6].value, buttons[1].pressed ? 1 : 0);
  drift = buttons[5].pressed (R1/RB); item = buttons[4].pressed (L1/LB) || buttons[2].pressed (X).
  Combine: a source wins when non-zero/true (keyboard, then gamepad, then touch).
- Touch item button: a 72 px round button (id 'lp-item-btn', "ITEM" label) appended to a container you add to ui,
  at the right edge, vertically centred, pointer-events:auto, shown only after the first touch is seen. While a pointer
  is down on it, item = true; stopPropagation so it never counts as throttle. Remove it in dispose().
- read() returns { steer, throttle, drift, item }.

### app.ts
- Course scene: keep one THREE.Scene. builtCourse: CourseId | null. ensureCourse(id): if id !== builtCourse, dispose
  every geometry/material/texture in the scene (scene.traverse), scene.clear(), then courseView = buildTrack(scene, id),
  itemView = createItemView(scene, getTrack(id)) (dispose the previous itemView first), builtCourse = id.
  Racers must be created after ensureCourse (they live in the same scene).
- Menu: ensureCourse(choice.course) before showing it; the menu's onStart gives the course. The orbit camera circles the
  chosen course's start line (getTrack(id).course.startS).
- Choice: load/save RacerChoice incl. course (validate course in COURSES; default 'garden'). Debug hash '#course=<id>'
  overrides the saved course.
- start(): ensureCourse(c.course); createRace(entries, c.course, RACE.laps) (the existing entries, roster and grid swap stay).
- Every frame: courseView.update(race ? race.t : menuT, dt); itemView.update(race, dt) when a race exists.
- Events: keep the RaceEvents returned by every stepRace call in the frame; for kart 0: picked -> audio.pickup();
  used -> audio.throwAcorn() if kart 0 held an acorn before the step, else audio.boost(); hits -> audio.hit(false) +
  hud.flash('BONK!'); hazard -> audio.hit(true) + hud.flash('WATCH THE ROAD!'); bumped -> audio.bump() (replace the old
  velocity-change bump heuristic; keep a 0.3 s minimum gap). Hop: when kart 0's hop goes from 0 to > 0 -> audio.hop().
- window.prix = { race, choice } as now.

## Done when
- `npx tsc --noEmit -p .` shows no errors in input.ts or app.ts.

## Out of scope
Every other file.
~~~~

~~~~text
Epic: 2, issue K: new sounds
Depends on: none

<Shared environment block>

## Goal
audio.ts plays the four new sounds.

## Read first
- games/lawn-prix/src/audio.ts (whole; the planner added hop, pickup, throwAcorn, hit as empty stubs inside createAudio's
  returned object; keep RaceAudio exactly).

## Change
- games/lawn-prix/src/audio.ts only. Same rules as the existing one-shots (no-op before start(), create and stop nodes
  per sound, never per frame).
- hop(): a short "boing": sine 300 -> 600 Hz over 0.08 s, gain 0.15, 0.12 s total.
- pickup(): a sparkly arpeggio: 4 triangle notes (E6 G6 B6 E7) 0.05 s each.
- throwAcorn(): a "fwip": noise burst through a bandpass sweeping 2000 -> 600 Hz over 0.15 s.
- hit(big): a cartoon bonk: square 220 Hz dropping to 80 Hz over 0.2 s + noise thud; big = also a slide-whistle
  down (sine 1200 -> 300 Hz over 0.6 s) for a spin-out from a hazard.

## Done when
- `npx tsc --noEmit -p .` shows no errors in audio.ts.

## Out of scope
Every other file.
~~~~

## Epic 3: Party slice

Written after Epic 2 lands, against the code as it stands then.

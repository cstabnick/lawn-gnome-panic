# Aether Board: Flood Run (experimental)

Goal: `?mode=flood` for `games/aether-board`. Meltwater surges race down the snowy mountain. Ride with a surge for a
speed bonus; otherwise the water ebbs and flows, cuts through low ground and spills over rims. Water cannons and geysers
shove the rider about. The water is a real shallow-water sim (virtual pipes, from the water-flow demo's design notes),
not an animation.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (planner) | `src/flood/types.ts`, `src/flood/sim.ts` (+ test), physics hook `setExternalForces`, `PhysEvent` `surf` and `blast`, prefabs `flood-cannon` and `flood-geyser-vent`, stubs for the four files below | written directly |
| 2 Modules | each stub replaced; `npx tsc --noEmit` and `npx vitest run src/flood` pass | A obstacles, B forces, C view, D hud and mode pill |
| 3 Integration (planner) | `app.ts` wires `?mode=flood`; build, tests, smoke, demo, PR | written directly |

No issue in epic 2 depends on another: each owns one file (plus its test) and codes against the stubs and `types.ts`.

## Shared environment block (every issue)

~~~~text
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\seacucumber. Game: games/aether-board (three.js, TypeScript, vitest).
Toolchain: in Git Bash, if node is not found: export PATH="/c/Program Files/nodejs:$PATH". Run commands from games/aether-board.
Other workers are editing other files in games/aether-board/src/flood/ at the same time: touch only the files your issue
names. Do not run git commit. Do not run `npm run build`, `vite build` or start a dev server.
Check with: npx tsc --noEmit    and    npx vitest run src/flood/<your test file>
Read first, always: src/flood/types.ts (every contract and every tuning number; use FLOOD.* and never hard-code them).
The simulation modules are pure: THREE math only, no DOM, no Math.random (use makeRng from types.ts).
Keep each stub's exported signature exactly as it is.
~~~~

## Issue A: obstacles (`src/flood/obstacles.ts`, `src/flood/obstacles.test.ts`)

~~~~text
Epic: 2 Modules
Depends on: none

## Goal
Replace the stub in src/flood/obstacles.ts: place water cannons and geysers on the mountain and answer timing and
geometry queries about them. Pure.

## Read first
- src/flood/types.ts: Cannon, Geyser, Obstacles, CycleState, Windup, FLOOD.* (cannon*, geyser*), makeRng.
- src/flood/obstacles.ts: the stub signatures to keep.
- src/world.ts: `World`, `Island` (cx, cz, r, stretch, dx, dz: dx,dz is the unit downhill direction; the run covers
  `al` in [-r*stretch, r*stretch] along it and `sd` in [-r, r] across it), `runY(world, isl, x, z)` (ground height or
  null), `World.hazards` (x, z, r), `Island.kickers` (x, z).

## Change
- src/flood/obstacles.ts:
  - `generateObstacles(world, seed)`: rng = makeRng(seed * 31 + 5). For every island i from 1 to islands.length-1:
    - FLOOD.cannonsPerRun cannons, alternating banks (first on the +across side, next on the -across side). Pick
      al uniformly in [-0.5, 0.6] * (r * stretch) and |sd| in [0.62, 0.8] * r. Across unit vector s = (-dz, dx).
      World position = (cx, cz) + (dx, dz) * al + s * sd. Ground y = runY(world, isl, x, z); if null, retry
      (up to 12 tries, then skip that cannon). Muzzle y = ground + 1.4. yaw = atan2(tx - x, tz - z) where the target
      is (cx, cz) + (dx, dz) * (al + 10) (the run's centre line, a little downhill). period = rng in
      [FLOOD.cannonPeriodMin, FLOOD.cannonPeriodMax], phase = rng * period.
    - FLOOD.geysersPerRun geysers: al in [-0.6, 0.7] * (r * stretch), sd in [-0.5, 0.5] * r, y = runY (retry the same
      way), at least 12 m (horizontal) from every hazard and every kicker of any island and from every cannon placed
      so far. period in [FLOOD.geyserPeriodMin, FLOOD.geyserPeriodMax], phase = rng * period.
    - ids: cannons 0.., geysers 0.., in placement order. `island` = i.
  - `cycleOf(t, period, phase, windup, burst)`: shared helper (export it). s = ((t + phase) % period + period) % period.
    The cycle ends with windup then burst: start = period - windup - burst. s < start -> {phase:'idle', k:0};
    s < start + windup -> {phase:'windup', k:(s - start)/windup}; else {phase:'fire', k:(s - start - windup)/burst}.
    If period < windup + burst + 1, treat period as windup + burst + 1.
  - `cannonState(c, t)` and `geyserState(g, t)` call cycleOf with FLOOD.cannonWindup/cannonBurst and
    FLOOD.geyserWindup/geyserBurst.
  - `inJet(c, x, y, z)`: dir = (sin yaw, cos yaw) horizontally. u = clamp(dot((x - c.x, z - c.z), dir), 0, FLOOD.cannonRange).
    Horizontal distance from (c.x + dir.x*u, c.z + dir.z*u) to (x, z) must be <= FLOOD.cannonRadius * (1 + 0.5 * u /
    FLOOD.cannonRange), and y must be in [c.y - 2, c.y + 3.5], and dot(...) must be >= -1 (not behind the muzzle).
  - `inGeyser(g, x, y, z)`: horizontal distance <= FLOOD.geyserRadius and y in [g.y - 2, g.y + 14].
- src/flood/obstacles.test.ts (vitest): with generateWorld(FLOOD_SEED, FLOOD_HILL) (from ../world and ./types):
  deterministic for the same seed and different for another; cannon and geyser counts are
  (islands - 1) * FLOOD.cannonsPerRun / geysersPerRun at most and at least half of that; every cannon and geyser sits
  where runY is not null; geysers are at least 12 m from hazards; cycleOf at hand-picked times returns idle, windup, fire
  with the right k; inJet true on the centre line 10 m ahead of the muzzle at muzzle height, false 10 m behind it, false
  3 m off to the side at 20 m, false 6 m too high.

## Contract
Exports from obstacles.ts: generateObstacles, cycleOf, cannonState, geyserState, inJet, inGeyser. The stub's
signatures stay; cycleOf is new.

## Done when
- npx tsc --noEmit succeeds
- npx vitest run src/flood/obstacles.test.ts passes

## Out of scope
Every other file. Do not change types.ts.
~~~~

## Issue B: forces (`src/flood/forces.ts`, `src/flood/forces.test.ts`)

~~~~text
Epic: 2 Modules
Depends on: none

## Goal
Replace the stub in src/flood/forces.ts: once per physics step, apply what the water, cannons and geysers do to the
rider, keep FloodStats up to date, and emit events. Pure.

## Read first
- src/flood/types.ts: Flood, FlowSample, FloodStats, Obstacles, Cannon, Geyser, FLOOD.*.
- src/flood/forces.ts: the stub signature to keep. src/flood/obstacles.ts: cannonState, geyserState, inJet, inGeyser
  (stubs now, a parallel worker is filling them in; call them, do not reimplement them).
- src/physics.ts: `ExternalForces` type (near `setExternalForces`), `Player` in src/config.ts (pos, vel, heading, mode,
  bailT, airT, spinVel, flow, island), `TUNE.bailTime`, and how stepGround takes off into the air (search for
  `e: 'takeoff'`): a geyser launch must put a grounded rider into the same air state the same way (reuse a helper if
  one exists, otherwise copy what the takeoff branch sets). The `bail` event shape is in config.ts PhysEvent.

## Change
- src/flood/forces.ts: `createFloodForces(flood, obstacles, stats, now)` returns `(p, w, dt, ev) => void`. Every call:
  1. `flood.focus(p.island)`. stats.sinceBlast += dt.
  2. Sample: `flood.sample(p.pos.x, p.pos.z, p.island, s)` (keep one FlowSample object outside the closure).
     wet = sampled && s.depth >= FLOOD.minDepth && p.pos.y <= s.surfaceY + 0.6. stats.depth = wet ? s.depth : 0.
  3. If wet and p.mode !== 'grind': fs = hypot(vx, vz); hs = horizontal speed of p.vel; flow direction fd = (vx, vz)/fs;
     cosA = dot(horizontal vel dir, fd) (0 if hs < 0.5).
     - Riding: p.mode === 'ground' and fs >= FLOOD.minFlow and (cosA >= FLOOD.minAlign or hs < 3). factor =
       min(1, s.depth / (FLOOD.minDepth * 4)). If the rider's speed along fd is below fs + FLOOD.bonusMax:
       p.vel.x += fd.x * FLOOD.rideAccel * factor * dt, same for z. stats.bonus = factor * clamp(1 - along/(fs +
       FLOOD.bonusMax), 0, 1).
     - Against: cosA < -0.3: multiply p.vel's horizontal part by exp(-FLOOD.againstDrag * dt).
     - Cross flow: unless riding, the flow component perpendicular to the rider's travel pushes sideways:
       p.vel += perp * FLOOD.crossPush * |crossFlow| * dt (the component of (vx, vz) off the rider's travel direction;
       if hs < 0.5 use the whole flow vector instead).
     - Deep: s.depth > FLOOD.deepDepth and mode ground: multiply p.vel by (1 - 0.35 * dt).
     Not wet (or not riding): stats.bonus = 0.
  4. Surfing state: `riding` as above held continuously for FLOOD.surfHold seconds (keep a timer; reset when not riding)
     means stats.surfing = true. On change push `{ e: 'surf', on }` to ev. While surfing: stats.surfT += dt;
     stats.surfPoints += FLOOD.surfPoints * dt.
  5. Cannons: for each cannon with |c.island - p.island| <= 1: if cannonState(c, now()).phase === 'fire' and
     inJet(c, p.pos.x, p.pos.y, p.pos.z): push the rider along the jet: p.vel.x += sin(c.yaw) * FLOOD.cannonPush * dt,
     p.vel.z += cos(c.yaw) * FLOOD.cannonPush * dt; p.flow = max(0, p.flow - 0.5 * dt). If this is a new hit (no hit
     in the last 0.3 s: keep a `lastHit` time per rider): stats.blasts++, push `{ e: 'blast', by: 'cannon' }`, and if
     stats.sinceBlast < FLOOD.blastBailWindow and p.mode is 'ground' or 'air': bail the rider: p.mode = 'bail',
     p.bailT = TUNE.bailTime, p.vel.multiplyScalar(TUNE.bailKeep), push `{ e: 'bail', reason: 'Washed out' }`.
     Then set stats.sinceBlast = 0 (after the check).
  6. Geysers: for each geyser with |g.island - p.island| <= 1: if geyserState(g, now()).phase === 'fire' and inGeyser(...)
     and not hit by this geyser in the last 0.5 s: p.vel.y = max(p.vel.y, FLOOD.geyserLift); if p.mode === 'ground'
     make the rider airborne exactly as a takeoff does; push `{ e: 'blast', by: 'geyser' }`; stats.blasts++;
     stats.sinceBlast = 0 (a geyser launch never bails by itself); also add a sideways shove away from the vent centre
     of 6 m/s.
  7. stats.warn: the nearest cannon or geyser within 70 m (horizontal) of the rider with phase windup or fire, as
     {kind, dist, bearing, fire}: bearing = the angle from the rider's heading (p.heading: nose points along (sin h,
     cos h)) to the direction toward it, wrapped to [-PI, PI]. null if none.
- src/flood/forces.test.ts: build a minimal World with generateWorld(FLOOD_SEED, FLOOD_HILL) (../world, ./types), a
  fake Flood object (`focus`, `sample` returning a fixed sample, `time`, `runs: []`, `step`, `volume`) and a hand-made
  Obstacles with one cannon/geyser placed right in front of the rider and a `now` function you control. Use
  createPlayer from ../physics. Tests: riding with the flow adds speed over a second and sets surfing after
  FLOOD.surfHold with exactly one `surf` on event; moving against the flow slows the rider; dry water (sample returns
  false) changes nothing; a firing cannon pushes the rider and emits one blast; a second blast within the window emits
  bail 'Washed out' and sets mode 'bail'; an idle cannon does nothing; a geyser sets vel.y >= FLOOD.geyserLift and the
  mode to 'air'; stats.warn is set during a windup and null otherwise.

## Contract
`createFloodForces(flood: Flood, obstacles: Obstacles, stats: FloodStats, now: () => number): ExternalForces`
(unchanged). stats is mutated in place. Events are PhysEvents from config.ts.

## Done when
- npx tsc --noEmit succeeds
- npx vitest run src/flood/forces.test.ts passes

## Out of scope
Every other file, including physics.ts, config.ts and types.ts (if you think a change there is needed, say so in your
report instead).
~~~~

## Issue C: view (`src/flood/view.ts`, `src/flood/view.test.ts`)

~~~~text
Epic: 2 Modules
Depends on: none

## Goal
Replace the stub in src/flood/view.ts: draw the water, the cannons and the geysers with three.js.

## Read first
- src/flood/types.ts: Flood, RunGrid (bed, depth, speed, hole, ox/oz/fx/fz/sx/sz/cell, nu/nv, active), Obstacles, Cannon,
  Geyser, FLOOD.*.
- src/flood/view.ts: the stub signature to keep (FloodView, createFloodView).
- src/flood/obstacles.ts: cannonState(c, t) and geyserState(g, t) return {phase: 'idle'|'windup'|'fire', k: 0..1}
  (stubs now, a parallel worker is filling them in; call them).
- src/view/train.ts: example of building a prefab into the scene (`buildPrefab` from '@lawn/prefabs').
- src/view/toon.ts: the cel-shaded look helpers (use them if they fit, e.g. for outlines).
- The prefabs `flood-cannon` (barrel along +z, base on y=0, about 1.2 long) and `flood-geyser-vent` (flat, about 1.2
  across) exist in packages/prefabs.

## Change
- src/flood/view.ts: `createFloodView(scene, world, flood, obstacles)`:
  - Water: for each run in flood.runs build, lazily the first time the run is active and its centre is within 700 m
    of camPos, one THREE.Mesh: a BufferGeometry of nu*nv vertices (position + vertex colour), an index buffer made
    ONCE over every grid quad whose four corners are all non-hole. Vertex world position = (ox + fx*k*cell + sx*j*cell,
    y, oz + fz*k*cell + sz*j*cell). Each frame, for runs that are active and near: y = bed + depth when depth >= 0.02,
    otherwise bed - 0.25 (sunk under the ground, so dry cells vanish); colour: shallow turquoise 0x38bdf8 to deep
    sapphire 0x0284c7 by depth (0..2.5 m), mixed towards white by foam = clamp((speed[i] - 6) / 8, 0, 1), plus white
    foam on thin edges (depth < 0.15). Set position.needsUpdate and color.needsUpdate. Hide (mesh.visible = false) runs
    that are inactive or far; keep a small cost: do not recompute normals. Material: MeshBasicMaterial({vertexColors:
    true, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false}), renderOrder 2, frustumCulled
    false.
  - Cannons: each cannon is buildPrefab('flood-cannon', { scale: 2.5 }) placed at (x, y - 1.4 + 0.2, z) with rotation.y =
    yaw (the barrel points along +z locally, so yaw rotates it). Skip cannons whose island is more than 3 away from the
    nearest active run index... simply: only update (and show) cannons within 600 m of camPos. During windup the
    barrel tip pulses: add a small emissive-looking sphere (MeshBasicMaterial 0x7dd3fc) at the muzzle whose scale grows
    with k. During fire: a jet mesh = a tapered open cone/cylinder from the muzzle along the aim, length FLOOD.cannonRange,
    radius FLOOD.cannonRadius at the far end (0.3 at the muzzle), MeshBasicMaterial 0xe0f7ff opacity 0.55, additive
    blending is fine; fade it out over the burst's last 20% (k > 0.8). Add ~40 spray droplets (THREE.Points, preallocated
    Float32Array, no per-frame allocation) that fly along the jet during fire.
  - Geysers: buildPrefab('flood-geyser-vent', { scale: FLOOD.geyserRadius * 1.6 / 1.2 }) at (x, y + 0.05, z). Windup: a
    flat RingGeometry on the ground (radius FLOOD.geyserRadius, MeshBasicMaterial 0x7dd3fc, transparent) pulsing with k.
    Fire: a white-blue column (CylinderGeometry radius FLOOD.geyserRadius * 0.5, height 14, open ended, additive-ish) rising from the
    vent, height scaled by an ease of k, fading at the end.
  - update(dt, t, camPos): t is the sim clock for cannonState / geyserState. dispose(): remove everything from the scene
    and dispose geometries and materials (prefabs: dispose their geometries and materials by traversing the group).
- src/flood/view.test.ts (vitest, node environment: three.js scene graph works without WebGL): build
  generateWorld(FLOOD_SEED, FLOOD_HILL), createFlood(world, FLOOD_SEED) (./sim), generateObstacles (./obstacles, may be
  the empty stub: then also test with a hand-made Obstacles holding one cannon and one geyser), call flood.focus(0),
  flood.step(40) a few times, create the view in a THREE.Scene, call update several times with a camera position near
  the spawn, expect scene.children.length > 0 and no throw, expect at least one water mesh visible with finite positions,
  then dispose() and expect the scene to be empty.

## Contract
`createFloodView(scene, world, flood, obstacles): FloodView` with `update(dt, t, camPos)` and `dispose()` (unchanged).

## Done when
- npx tsc --noEmit succeeds
- npx vitest run src/flood/view.test.ts passes

## Out of scope
Every other file. Do not change types.ts, the prefab catalog or src/view/*.
~~~~

## Issue D: HUD and mode pill (`src/flood/hud.ts`, `src/descent/ui.ts`)

~~~~text
Epic: 2 Modules
Depends on: none

## Goal
Flood Run's HUD, and a way into the mode from the title card.

## Read first
- src/flood/types.ts: FloodStats (surfing, bonus 0..1, surfT, surfPoints, blasts, sinceBlast, depth, warn).
- src/flood/hud.ts: the stub signature to keep.
- src/hud.ts: how the existing HUD builds its DOM and CSS (`createHud`, `buildCss`, the `ab-` class prefix, safe-area
  insets, the `gr` font class). Match the look.
- src/descent/ui.ts: `createModeSwitch(ui, descent: boolean)` (end of the file) and its `.dsc-mode` CSS in ensureStyle.

## Change
- src/flood/hud.ts: `createFloodHud(ui)` appends ONE container (id `ab-flood-hud`) to the given `ui` element (never
  restyle or hide `ui` itself), with its own <style> (id `ab-flood-style`, added once). `update(stats, riding, clock)`:
  hidden unless riding. Contents: (1) top centre, a SURF meter: a horizontal bar whose fill width is stats.bonus (0..1),
  label "SURF" lit when stats.surfing, and under it "{surfT.toFixed(1)}s  +{round(surfPoints)}"; (2) top left, the
  clock as m:ss; (3) a cannon/geyser warning chip near the top centre below the meter when stats.warn is not null: text
  "CANNON" or "GEYSER" plus distance in metres, an arrow glyph rotated by stats.warn.bearing (0 = straight ahead =
  up), red and flashing when warn.fire, amber when winding up; (4) a full-screen flash overlay (pointer-events none)
  that is bright white-blue and fades out over 0.5 s after a blast: opacity = max(0, 1 - sinceBlast / 0.5) * 0.55.
  Only write to the DOM when a value changed (cache the last strings / numbers). Everything has pointer-events: none.
  Mobile: layout fits a 390x844 portrait and an 844x390 landscape phone, respects env(safe-area-inset-*), fonts
  at least 12 px, no hover-only anything.
- src/descent/ui.ts: change `createModeSwitch(ui, mode: 'free' | 'descent' | 'flood')`. Free ride shows two stacked pills,
  "DESCENT MODE →" (?mode=descent) and "FLOOD RUN · EXPERIMENTAL →" (?mode=flood), the second below the first. Descent and
  flood show one pill "← FREE RIDE" in the corner style (as today for descent). Keep `update(show)` controlling all of
  them, and keep the press-not-click handling exactly as it is for every pill. In ensureStyle, add the offset for the
  second pill (read the existing `.dsc-mode` rules and place it below the first with the same look).
  Update every caller of createModeSwitch under src/ (only src/app.ts calls it: do NOT edit app.ts, the planner will; so
  keep accepting a boolean too: `mode: 'free' | 'descent' | 'flood' | boolean` where true = 'descent', false = 'free').

## Contract
`createFloodHud(ui: HTMLElement): FloodHud` with `update(stats: FloodStats, riding: boolean, clock: number): void`
(unchanged). `createModeSwitch(ui: HTMLElement, mode: 'free' | 'descent' | 'flood' | boolean): ModeSwitch` with
`update(show: boolean): void`.

## Done when
- npx tsc --noEmit succeeds
- npx vitest run src/descent still passes: it must not break descent tests

## Out of scope
src/app.ts and every other file.
~~~~

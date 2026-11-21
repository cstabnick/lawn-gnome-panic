# Gnomokemon Snap: a livelier Fescue Lawn (height, water, sight lines)

**Goal.** The lawn course stops being a flat rail. The ride climbs a hill, crosses a shallow ford, and dives into a
glass tube under water. Sight lines are blocked by hedges and walls instead of relying on fog, and a ray-tracing tool
measures how much of the rail the camera can see, so the placement can be checked with numbers.

**Scope.** The Fescue Lawn only (the default course). The other six courses keep their current rails and are a
follow-up. Fog stays as a light fallback.

**Contracts (already in the tree):** `src/snap/rail.ts` (section bands, `WATER_Y`, `TUBE_RADIUS`, `railSections`
stub).

| Epic | Issues | Done when |
|---|---|---|
| 1. Parallel | 1A rail height and sections, 1B water, 1C occluders and sight-line tool | tests and `tsc` pass |
| 2. Integration | 2A game.ts | build, tests, smoke, and the sight-line report for the lawn |

~~~~text
Epic: 1A Rail height and sections
Depends on: none

## Environment
Working directory: games/gnomeokemon. Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found.
Other workers are editing water.ts (1B) and occluders.ts / sightlines.ts (1C). Touch only world.ts `createLawnCurve`, rail.ts and rail.test.ts.

## Goal
The lawn rail has height (a hill, then a dip into the tube), and `railSections` returns the real u ranges for the ford and the tube.

## Read first
- src/snap/world.ts `createLawnCurve` (around line 136): seven control points, all with y = 0.
- src/snap/rail.ts: the stub. Keep every exported name and constant.

## Change
- src/snap/world.ts `createLawnCurve`: keep the x and z of each point; set y as follows:
  - P0 (0, 0, 18): y 0
  - P1 (-4.5, 0.3, 11): y 0.3 (rises over the ford; the ford water sheet is at WATER_Y 0.12)
  - P2 (-1.5, 0.9, 2): y 0.9 (climbing the hill)
  - P3 (5.2, 1.6, -6): y 1.6 (the top)
  - P4 (2.0, 1.2, -15): y 1.2 (over the dip)
  - P5 (-5.2, 1.4, -22): y 1.4 (inside the tube)
  - P6 (0, 0, -29): y 0 (back to the ground)
  Keep the curve's type and the point count.
- src/snap/rail.ts `railSections(curve)`: sample the curve with `curve.getPointAt(u)` for 800 values of u from 0 to 1. The ford is the range of u where z is in FORD_Z; the tube is the range where z is in TUBE_Z. Return `{ ford: [u0, u1], tube: [u0, u1] }` with the smallest and largest u in each range. If a band is never hit, return `[0, 0]` for that band.
- src/snap/rail.test.ts (new): using `createLawnCurve` from world.ts is not allowed (world.ts pulls in the prefab registry). Build a local curve in the test with the same points as in the spec above, then check: the ford range is non-empty and inside (0, 1); the tube range is non-empty and after the ford; the maximum y over the curve is between 1.5 and 1.7; the y at u=0 is 0.

## Contract
`createLawnCurve()` returns a `THREE.CatmullRomCurve3` with the y values above. `railSections(curve)` returns `RailSections` from rail.ts.

## Done when
- `npm test -w games/gnomeokemon -- rail` passes.
- `npx tsc --noEmit -p games/gnomeokemon` passes.

## Out of scope
water.ts, occluders.ts, sightlines.ts, game.ts, and every other file.

Report: the test output, and the u ranges that railSections returned for the spec curve.
~~~~

~~~~text
Epic: 1B Water: the ford sheet, the glass tube and splashes
Depends on: none

## Environment
Working directory: games/gnomeokemon. Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found.
Other workers are editing rail.ts (1A), occluders.ts and sightlines.ts (1C). Touch only water.ts and water.test.ts.

## Goal
Water.ts builds the ford's water sheet, the glass tube around the rail in its section, and splash/bubble particles, and exposes an update function.

## Read first
- src/snap/rail.ts: `WATER_Y`, `TUBE_RADIUS`, `RailSections` (read only).
- src/snap/game.ts `stage`/scene setup is not needed; you receive the scene and curve as parameters.

## Change
- src/snap/water.ts (new), exports:
  - `buildFordWater(scene: THREE.Scene, curve: THREE.CatmullRomCurve3, range: readonly [number, number]): THREE.Mesh`: a flat ribbon mesh along the curve over the u range, width 2.4 units (offset each sampled point sideways by 1.2 along the normal in xz), at y = WATER_Y. Material: `MeshLambertMaterial({ color: 0x3fa7d6, transparent: true, opacity: 0.8 })`. Sample 60 points. Add it to the scene and return it.
  - `buildTube(scene, curve, range): THREE.Mesh`: a `TubeGeometry` of the curve over the u range, radius TUBE_RADIUS, 40 tubular segments, 8 radial segments, `MeshLambertMaterial({ color: 0x7fd6ff, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })`. Add it to the scene and return it.
  - `buildSplashes(scene, curve, range): WaterFx`: a `THREE.Points` cloud of 60 white-blue points around the ford's entry and exit (the two ends of the range), plus 40 bubbles inside the tube range. Keep them in a `WaterFx` object: `{ points: THREE.Points; update(t: number, dt: number): void }`. `update` moves the bubbles upward at 0.4 units/s, wraps them back to the tube's bottom when they pass the top, and flickers the splash points' opacity with `Math.sin(t * 9)`.
  - `export interface WaterFx { points: THREE.Points; update(t: number, dt: number): void }`.
  - `export function isInTube(pos: THREE.Vector3, curve: THREE.CatmullRomCurve3, range: readonly [number, number]): boolean`: true when the closest point on the curve within the range is within TUBE_RADIUS of `pos` in xyz. Sample the range at 40 points to find the closest one. Return false when the range is `[0, 0]`.
- src/snap/water.test.ts (new): the test imports `isInTube` only, and builds a local straight curve from (0,1,0) to (0,1,10). Check: a point at (0,1,5) is in the tube over range [0,1]; a point at (3,1,5) is not; with range [0,0] it returns false. Import THREE in the test (`import * as THREE from 'three'`).

## Contract
`buildFordWater`, `buildTube`, `buildSplashes`, `isInTube`, `WaterFx` as above. Mesh building takes the scene as a parameter; no module-level scene.

## Done when
- `npm test -w games/gnomeokemon -- water` passes.
- `npx tsc --noEmit -p games/gnomeokemon` passes.

## Out of scope
rail.ts, world.ts, game.ts, occluders.ts, sightlines.ts. Do not add fog to the water materials.

Report: the test output.
~~~~

~~~~text
Epic: 1C Sight-line blockers and a ray-tracing tool
Depends on: none

## Environment
Working directory: games/gnomeokemon. Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found.
Other workers are editing rail.ts (1A) and water.ts (1B). Touch only occluders.ts, sightlines.ts and their tests.

## Goal
Two things: (a) `buildSightBlockers` places hedges and walls along the lawn rail so that lines of sight from the rail's camera are blocked, with gaps where the ride needs to see; (b) `sightlines.ts` is a ray-tracing tool that reports how much of the rail the camera can see, for tuning the blockers.

## Read first
- src/snap/rail.ts: `RailSections` and the band constants (read only).
- src/snap/world.ts `buildLawnEnvironment` (around line 200): the lawn's existing scenery and the fog setting `new THREE.Fog(0x87c7e8, 10, 32)`. Read only; do not edit world.ts.

## Change
- src/snap/occluders.ts (new):
  - `buildSightBlockers(scene: THREE.Scene, curve: THREE.CatmullRomCurve3): THREE.Object3D[]`. Build hedge walls: for 14 sample points along the curve (u from 0.05 to 0.95, evenly), place a hedge block 1.6 units tall, 0.9 deep, and 3.2 long, offset 3.6 units to the left and right of the rail (in xz, perpendicular to the tangent). Skip any block whose center is within 2.2 units of the rail (so the dog's path stays clear). Use `BoxGeometry` and `MeshLambertMaterial({ color: 0x2f6b2a, flatShading: true })`, rotated to the tangent. Alternate: on every third sample, make the block a tall wall (3.2 tall) instead. Add each to the scene and return the list.
  - Keep the hedges off the tube and ford sections: skip samples whose u is in the `tube` or `ford` range from `railSections(curve)`.
- src/snap/sightlines.ts (new), a pure ray-tracing tool:
  - `export interface SightReport { samples: number; visible: number; blockedBy: Record<string, number> }`
  - `export function traceSightlines(curve: THREE.CatmullRomCurve3, occluders: readonly THREE.Object3D[], opts?: { cameraHeight?: number; cameraBack?: number; samples?: number; maxRange?: number }): SightReport`. For each of `samples` (default 120) u values along the rail, the eye point is the curve point at u (offset back along the tangent by `cameraBack`, default 0.95, and up by `cameraHeight`, default 3.0, as the ride camera does), and the target is the curve point at u + 0.05 (clamped to 1). Cast a `THREE.Raycaster` from the eye toward the target, `far` = the distance to the target (use `maxRange`, default 40, if smaller). Intersect the occluders (recursive). If the first hit is nearer than the target, the sample is blocked and count the object's `name` (or 'unnamed') in `blockedBy`; otherwise it is visible.
  - Do not require a DOM or a renderer; `THREE.Raycaster` works without one.
  - Export `function visibleFraction(report: SightReport): number` returning `visible / samples`.
- src/snap/sightlines.test.ts (new): build a local straight curve (0,0,0) to (0,0,40) in the test (use `new THREE.CatmullRomCurve3([...])`). Put one box occluder at z 10 across the path (a 4 by 4 by 1 box centred at (0, 1.5, 10)), and one far from the path at x 8. Check: `traceSightlines` with `cameraHeight: 0` and `cameraBack: 0` for samples from u 0.2 to 0.4 reports blocked samples (visible < samples); with no occluders, `visibleFraction` is 1. Give the test occluder the name 'test-wall' and check `blockedBy['test-wall']` is a positive number.

## Contract
`buildSightBlockers(scene, curve)`, `SightReport`, `traceSightlines(curve, occluders, opts?)`, `visibleFraction(report)`.

## Done when
- `npm test -w games/gnomeokemon -- sightlines` and `-- occluders` (if you wrote an occluders test) pass.
- `npx tsc --noEmit -p games/gnomeokemon` passes.

## Out of scope
world.ts, game.ts, rail.ts, water.ts, and every other file.

Report: the test output, and how many hedge blocks `buildSightBlockers` returns for the lawn curve (use a local copy of the spec curve in the test, not world.ts).
~~~~

---

## Epic 2: integration

~~~~text
Epic: 2A Ride integration: height, water, tube, blockers, and less fog
Depends on: 1A, 1B, 1C

## Environment
Working directory: games/gnomeokemon. Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Run npm from the repo root with `-w games/gnomeokemon`.
No other worker is editing this game during this epic. You own game.ts and the lawn environment wiring in world.ts (only `buildLawnEnvironment` fog line).

## Goal
In the lawn ride, the dog and camera follow the rail's height; the ford and tube show their water; the tube drops the camera under water and turns the fog blue; the hedges block sight lines; fog is lighter.

## Read first
- src/snap/game.ts: the dog placement (around line 779: `dog.position.set(dogPos.x, bob, dogPos.z)`) and camera placement (around line 789: `camera.position.set(... 3.0 + bob * 0.7 ...)`). `dogPos` is from `curve.getPointAt(dogT, dogPos)`, so it already has the rail's y once 1A lands.
- src/snap/rail.ts, water.ts, occluders.ts, sightlines.ts: the contracts (read only).
- src/snap/world.ts `buildLawnEnvironment` fog line (around line 201): `scene.fog = new THREE.Fog(0x87c7e8, 10, 32)`.

## Change
- src/snap/game.ts:
  1. At ride start, for the lawn course: `const sections = railSections(curve)`; `buildFordWater(scene, curve, sections.ford)`; `buildTube(scene, curve, sections.tube)`; `const fx = buildSplashes(scene, curve, ...)` (use the same ranges as in water.ts); `const blockers = buildSightBlockers(scene, curve)`. Use the existing `curve` for the lawn. Only do this when `courseId === 'lawn'`.
  2. Dog: `dog.position.y = dogPos.y + bob` (use the curve's y, not 0). Keep `dog.lookAt` with the same y.
  3. Camera: normal height `camera.position.y = dogPos.y + 3.0 + bob * 0.7`. Inside the tube (`isInTube(dogPos, curve, sections.tube)`), lower the camera to `dogPos.y + 0.3`, and lerp toward it at 4 units/s so the drop is smooth.
  4. Fog: keep the lawn fog but change it at ride time to `new THREE.Fog(0x87c7e8, 18, 60)` (lighter, far), and when the camera is in the tube, lerp the fog colour to `0x2c7fb0` and near/far to `(2, 14)`, at 3 units/s. Out of the tube, lerp back. Do not add fog in other places.
  5. `fx.update(t, dt)` each frame.
  6. `fx.update` also needs the splash on entering or leaving the ford: when `dogT` crosses either end of the ford range, call `showToast('💦 Splash!')` once.
  7. Creatures: the spawn zones are on the ground at y=0. Keep them. Do not place creatures inside the tube.
- src/snap/world.ts: change only the fog line in `buildLawnEnvironment` to `new THREE.Fog(0x87c7e8, 18, 60)`, so the lawn starts with the lighter fog. Nothing else in world.ts.
- Check the result with the sight-line tool: write a small one-off script at `games/gnomeokemon/src/snap/sightlines.report.test.ts` (new) that builds the lawn curve locally (copy the 1A points), builds the blockers and the report with `traceSightlines`, and prints `visibleFraction` with `console.log`, then asserts it is between 0.3 and 1. Keep the file; it is the record of the tuning.

## Contract
Uses the exports of rail.ts, water.ts, occluders.ts and sightlines.ts as declared. Do not change their signatures.

## Done when
- `npm run build -w games/gnomeokemon` passes.
- `npm test -w games/gnomeokemon` passes.
- The dev server (on a new port, for example 5761, `--strictPort`) with `bash tools/smoke.sh "http://localhost:5761/?mode=snap&course=lawn" snap-stage` passes. Stop the server afterwards (kill only the process on that port).
- The sight-line report prints a visible fraction; report it.

## Out of scope
rail.ts, water.ts, occluders.ts, sightlines.ts, temperament.ts, character.ts, layout.ts, types.ts, gnomokedex.ts, models.ts, docs. The fog change in world.ts is the only edit there.

Report: build, test and smoke results; the sight-line visible fraction; anything in the tube drop or the fog that looked wrong.
~~~~

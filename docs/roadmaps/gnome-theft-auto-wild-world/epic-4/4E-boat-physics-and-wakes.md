Epic: 4 (Wild World: water, bridges and boats)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there.
- Node: if `node`/`npm` is not found, in Git Bash run `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are
  installed: never run `npm install`. Never commit, push, stash, reset, or `git checkout`/`git restore` any file.
- About ten other workers and two other planning sessions edit other files of this game at the same time. Edit only
  the files this issue names. If `tsc` or a test fails in a file you do not own, someone is mid-edit: ignore it.
- Repo rule: anything flat on another surface takes a draw layer (`flatLayer(material, LAYER.<x>)` from `@lawn/depth`).
- The boat prefabs are being modelled by another worker right now and may not exist yet: never call `createVehicle`
  or `buildPrefab` for a boat in a test. Build plain `Vehicle` objects instead (shown below).

## Goal
Real boat handling in `games/gnome-theft-auto/src/boats.ts` (buoyancy at four points, thrust, rudder, drag, sideways
slip, the shore as a wall) and foam wakes behind moving boats in `games/gnome-theft-auto/src/wake.ts`, with a test.
Today `boats.ts` is a planner stub (it floats flat and moves like an arcade mower) and `wake.ts` draws nothing.

## Read first
- `games/gnome-theft-auto/src/boats.ts` and `src/wake.ts`: the stubs and their exported signatures (keep them exactly).
- `games/gnome-theft-auto/src/types.ts`: `Vehicle` (x, y, z, yaw, speed, driver, spec, boat, exploded), `VehicleSpec`
  (`maxSpeed`, `accel`, `turnRate`, `radius`, `draft`, `boat`), `BoatState`, `DriveControls` (throttle -1..1, steer
  -1..1 with +1 = right), `World` (`boxes`, `half`).
- `games/gnome-theft-auto/src/config.ts`: `VEHICLES` (the five boat specs at the end of it) and `WATER.boat`
  (`buoyancy` 18, `heaveDamp` 4, `drag` 0.45, `sideGrip` 2.5, `beachDepth` 0.15, `rudderSpeed` 3).
- `games/gnome-theft-auto/src/terrain.ts`: `waterAt(x, z)` returns `{ surface, depth } | null` (depth = surface - bed;
  it ignores bridge decks, so a boat passes under a bridge); `bedAt(x, z)`.
- `games/gnome-theft-auto/src/collide.ts`: `pushOutOfBoxes(x, z, r, boxes, y)` and `clampToWorld(x, z, half, r)`, both
  returning `{ x, z, hit }`.

## Change
- `games/gnome-theft-auto/src/boats.ts`: keep `isBoat`, `floatHeight`, `initBoat`, `stepIdleBoats` as they are (you
  may tidy them); rewrite `stepBoat(v, c, dt, world)`:
  - Conventions: forward is `(sin yaw, cos yaw)`; the boat's right is `(-cos yaw, sin yaw)`; steer +1 turns right,
    which is `yaw -= ...` (as the stub does). `BoatState.pitch` + = bow up, `roll` + = right side down (vehicles.ts
    syncVehicleMesh already turns these into the model's tilt; do not edit vehicles.ts).
  - `const b = (v.boat ??= initBoat(v))`. Hull half length `hl = v.spec.radius * 0.8`, half beam `hb = v.spec.radius * 0.4`.
  - Float points: water surface at bow, stern, left and right (`waterAt` at those points; a missing one counts as the
    centre's surface). Keel target `ty = mean(surfaces) - draft` (draft = `v.spec.draft ?? 0.25`).
  - Heave: `b.vy += ((ty - v.y) * WATER.boat.buoyancy - b.vy * WATER.boat.heaveDamp) * dt; v.y += b.vy * dt`.
    If there is no water under the centre, ease `v.y` to `bedAt(v.x, v.z)` instead (a boat on land sits on the ground).
  - Attitude: target pitch = `atan2(sBow - sStern, 2 * hl)` + `0.06 * (v.speed / v.spec.maxSpeed)` (bow rises at
    speed); target roll = `atan2(sLeft - sRight, 2 * hb)` (positive when the right side's water is lower, matching
    "roll + = right side down") + `0.12 * steer * (v.speed / maxSpeed)` (banks into the turn). Ease both with `1 - exp(-4 * dt)`.
  - Beached: `depthUnder = (waterAt(v.x, v.z)?.depth ?? 0) - draft`; `b.beached = depthUnder < WATER.boat.beachDepth`.
  - Thrust and drag: throttle > 0 speeds up by `accel * throttle * dt` to `maxSpeed`; throttle < 0 slows (and reverses
    to `-0.4 * maxSpeed`); no throttle: `v.speed *= Math.pow(WATER.boat.drag, dt)`.
  - Rudder: `v.yaw -= c.steer * turnRate * Math.min(1, |speed| / WATER.boat.rudderSpeed) * sign(speed || 1) * dt`.
    Slip: `b.slip += v.speed * yawRate * 0.15 * dt` (yawRate is the signed turn this frame / dt), then
    `b.slip *= Math.exp(-WATER.boat.sideGrip * dt)`.
  - Move: next = position + (forward * speed + right * slip) * dt. **The shore is a wall**: if the next point's
    `(waterAt(next)?.depth ?? 0) - draft < beachDepth` and it is not deeper than where the boat is now, do not move
    there; set `v.speed *= 0.3` and `b.slip = 0`. (A boat already beached may always move to deeper water, so a boat
    that spawned on a slope can be driven off it.)
  - Collide: `pushOutOfBoxes(v.x, v.z, v.spec.radius, world.boxes, v.y)` (boxes taller than the boat stop it; bridge
    decks are not boxes, so boats pass under) and `clampToWorld(v.x, v.z, world.half, v.spec.radius)`; on a hit,
    `v.speed *= 0.35`.
  - `v.exploded`: never reached (vehicles.ts handles wrecks before calling stepBoat).
- `games/gnome-theft-auto/src/wake.ts`: implement `createWakes(scene)`: a pool of 160 flat foam quads
  (`new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)`, one shared `MeshBasicMaterial({ color: WATER.foam,
  transparent: true, opacity: 0.5, depthWrite: false })` through `flatLayer(..., LAYER.marking)`; a per-quad opacity
  needs its own material clone, so clone the material per quad once at creation). `update(dt, vehicles)`: for each
  `v` with `v.spec.boat`, `!v.exploded` and `|v.speed| > 2`, every 0.08 s spawn two quads at the stern
  (`position - forward * spec.radius * 0.8 +- right * spec.radius * 0.3`), at `waterAt(...).surface + 0.02`, rotated to
  the boat's yaw. Each quad lives 1.6 s: it drifts outward sideways at 0.8 m/s, grows from 0.6 to 2.6 m, and fades
  from 0.5 to 0. Recycle the oldest when the pool is full. Hide unused quads (`visible = false`).
- `games/gnome-theft-auto/src/boats.test.ts` (new). Make test boats without prefabs:
  ```ts
  import * as THREE from 'three';
  const boat = (kind: VehicleKind, x: number, z: number, yaw = 0): Vehicle => {
    const v = { id: 1, kind, spec: VEHICLES[kind], x, y: 0, z, yaw, speed: 0, vy: 0, driver: 'player', tint: 0,
      object: new THREE.Group(), rider: null, riderLook: null, wheelSpin: 0, steerVis: 0, hp: 1, damage: 0, lastHit: 0 } as Vehicle;
    v.boat = initBoat(v); v.y = floatHeight(v) ?? 0; return v;
  };
  const world = { boxes: [], half: 900 } as unknown as World;
  ```
  Tests (the loch centre is (-700, -680); its south shore is at about z = -560; use `waterAt` to read the surface):
  1. An idle gravy boat at the loch centre settles at `surface - draft` within 0.02 after 3 s of `stepBoat` with zero
     controls (60 steps per second), with pitch and roll near 0.
  2. Full throttle for 5 s moves a gravy boat more than 40 m and its speed reaches at least 0.8 x maxSpeed.
  3. Full throttle with steer +1 for 3 s turns it right (yaw decreased) and roll > 0.
  4. A walnut dinghy at (-700, -600) heading south (yaw 0, toward +z) at full throttle for 30 s stops before the shore:
     it never reaches z > -556 and the water under it stays at least `draft + beachDepth - 0.05` deep.
  5. A gravy boat under the canal bridge at (0, 230) keeps floating (waterAt is not null there and y stays below 0).

## Contract
```ts
export function isBoat(v: Vehicle): boolean
export function floatHeight(v: Vehicle): number | null
export function initBoat(v: Vehicle): BoatState
export function stepBoat(v: Vehicle, c: DriveControls, dt: number, world: World): void
export function stepIdleBoats(vehicles: readonly Vehicle[], dt: number, world: World): void
// wake.ts
export interface Wakes { update(dt: number, vehicles: readonly Vehicle[]): void }
export function createWakes(scene: THREE.Scene): Wakes
```
`boats.ts` must not import `vehicles.ts` (vehicles.ts imports boats.ts).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `boats.ts`, `wake.ts`, `boats.test.ts`.
- `(cd games/gnome-theft-auto && npx vitest run src/boats.test.ts src/water.test.ts)` passes.

## Out of scope
`vehicles.ts`, `app.ts`, `terrain.ts`, `water.ts`, `config.ts`, any other file.

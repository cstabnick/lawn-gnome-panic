Epic: 2 Systems
Depends on: none (Epic 1 is done: the game builds with stubs)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Eleven other workers are filling other files in `games/nothing-left-to-collect/src/` right now. Edit only `src/walk.ts`, `src/player.ts`, `src/camera.ts`. `tsc` may show errors in their files mid-edit; only yours must be clean.
- Repo rule: the player is the player's own gnome: `createGnomeModel(getMyGnome()?.look ?? GNORMAN_LOOK)` from `@lawn/gnome` (already in the stub). Never build a separate gnome mesh.

## Goal

Replace three stubs: `walk.ts` (pure walker physics: walk, jump, collide with boxes, stand on box tops),
`player.ts` (the player gnome: walk mode, locked mode, fly mode, scripted `moveTo`, animation) and `camera.ts`
(a smooth fixed-yaw follow camera with four modes, pulled back on portrait phones).

## Read first

- The three stubs in `games/nothing-left-to-collect/src/`: keep every exported name and signature.
- `games/nothing-left-to-collect/src/types.ts`: `Walker`, `Box`, `Player`, `MoveMode`, `InputState`, `Floor` (you use `floor.colliders` and `floor.groundAt(x, z)`), `FollowCamera`, `CameraMode`.
- `games/nothing-left-to-collect/src/config.ts`: `TUNING` (walkSpeed 5, accel 40, jumpSpeed 6.5, gravity 20, flySpeed 9, playerRadius 0.3, playerHeight 1.1, stepUp 0.25) and `CAMERA`.
- `packages/gnome/src/types.ts`: `GnomeModel` (`object`, `arms.left/right` pivots: `rotation.x` swings an arm), `PlayerState` (`position`, `velocity`, `facing`, `grounded`, `jumpsUsed`, `sitting?`). `model.update(state, dt)` sets the model's position and yaw and animates walking/air poses.

## Change

### `src/walk.ts` (pure: no three, no DOM)

`stepWalker(w, moveX, moveZ, jump, colliders, groundY, dt)`:
- Desired horizontal velocity = `(moveX, moveZ)` (clamp length to 1) × `TUNING.walkSpeed`; move `vx, vz` toward it by at most `TUNING.accel * dt`.
- When moving (length > 0.1) set `facing = Math.atan2(vx, vz)` (model faces +z at 0).
- `jump` is a one-shot press: if `grounded`, `vy = TUNING.jumpSpeed`, `grounded = false`, `jumpsUsed = 1`. (No double jump.)
- Gravity: `vy -= TUNING.gravity * dt` when not grounded.
- Move x, then z, then y, resolving against each `Box` treating the walker as a vertical cylinder approximated by a square of half-size `TUNING.playerRadius`, height `TUNING.playerHeight`, feet at `y`:
  - Horizontal: if after moving the square overlaps a box in xz AND the walker's feet are below `box.max[1] - TUNING.stepUp` AND its head (`y + playerHeight`) is above `box.min[1]`, push it back out along that axis and zero that velocity component. If the feet are within `stepUp` of the top, step up onto it (`y = box.max[1]`).
  - Vertical: the support height is `max(groundY, the max[1] of every box under the walker's footprint whose top is <= y + 0.05)`. If `y <= support` and `vy <= 0`: `y = support, vy = 0, grounded = true, jumpsUsed = 0`. If the walker walks off an edge (support below y), `grounded = false`.
  - Hitting a box from below sets `vy = 0`.
- Export also `function overlapsXZ(w: Walker, b: Box, r: number): boolean` if useful (extra exports are fine).

### `src/player.ts`

`createPlayer(scene)` returns a `Player`:
- `walk` mode: `stepWalker(walker, input.moveX, input.moveZ, input.jumpPressed, floor.colliders, floor.groundAt(walker.x, walker.z), dt)`.
- `locked` mode: no input; horizontal velocity decays to 0; gravity and ground still apply (call `stepWalker` with move 0 and no jump).
- `fly` mode: no gravity. When no `moveTo` is running, `x += moveX * flySpeed * dt`, `z += moveZ * flySpeed * dt`, `y += (input.jump ? 1 : 0) * flySpeed * dt`.
- `moveTo(x, y, z, seconds)`: returns a Promise that resolves on arrival. While running, the position is an eased (smoothstep) blend from the start to the target, ignoring colliders; facing turns toward the travel direction (horizontal component; keep facing if the move is purely vertical). In `fly` mode, add a sideways offset driven by the stick: keep `offX` in [-3, 3] metres, `offX += input.moveX * 4 * dt`, decay it toward 0 by 1 m/s when the stick is centred, and add it to x. A new `moveTo` cancels (resolves) the previous one. `seconds <= 0` teleports.
- `teleport(x, y, z, facing)`: set walker position and facing, zero velocities, `grounded = true`.
- `lookAt(x, z)`: `walker.facing = Math.atan2(x - walker.x, z - walker.z)`.
- Every update: mirror `walker` into `pos`, then call `model.update({ position: pos, velocity: <a reused Vector3 of vx,vy,vz>, facing: walker.facing, grounded: walker.grounded, jumpsUsed: walker.jumpsUsed }, dt)`. In `fly` mode pass `grounded: false` and, after `model.update`, set both arm pivots' `rotation.x` so the arms point straight up over the head (a superhero pose; `rotation.x` of about `-2.8` or `+2.8` — check which sign raises the arm forward-and-up in this rig by reading `packages/gnome/src/model.ts` `makeArm`, and pick the one that points up).
- Shadows: traverse `model.object` once and set `castShadow = true` on meshes.

### `src/camera.ts`

`createFollowCamera(camera)` returns a `FollowCamera`:
- For mode `m`, with `c = CAMERA[m]`: the desired camera position is `target + (0, c.height, c.back)` (the camera always looks toward -z; fixed yaw), multiplied by `CAMERA.portraitBack` for both height and back when `camera.aspect < 1`. It looks at `target + (0, c.lookUp, 0)`.
- `update(dt, target, mode)`: move the camera position and the look-at point toward their desired values with `1 - Math.exp(-CAMERA.lerp * dt)`; ease `camera.fov` toward `c.fov` the same way and call `camera.updateProjectionMatrix()` when it changes.
- `snap(target, mode)`: jump straight to the desired values.
- `shake(amount)`: add a decaying random offset (amount in metres, decays to 0 over about 0.4 s).

## Contract

Keep exactly the stubs' exports:
```ts
// walk.ts
export function createWalker(x: number, y: number, z: number, facing: number): Walker;
export function stepWalker(w: Walker, moveX: number, moveZ: number, jump: boolean, colliders: readonly Box[], groundY: number, dt: number): void;
// player.ts
export function createPlayer(scene: THREE.Scene): Player;
// camera.ts
export function createFollowCamera(camera: THREE.PerspectiveCamera): FollowCamera;
```
`walk.ts` stays pure (the party slice runs it headless in tests).

## Done when

- `npx tsc --noEmit -p games/nothing-left-to-collect` shows no errors in your three files.
- A quick check you can run with `npx tsx` is not available; instead, re-read `stepWalker` once against these cases: walking into a 1 m box stops at its side; a 0.2 m step is climbed; jumping onto a 0.75 m desk lands on top; walking off it falls back to `groundY`.

## Out of scope

Every other file under `games/nothing-left-to-collect/` (`types.ts`, `config.ts` and `app.ts` are fixed), all packages.

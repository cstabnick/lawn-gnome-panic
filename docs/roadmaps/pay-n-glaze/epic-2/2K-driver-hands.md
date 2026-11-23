Epic: 2 (Gnome Theft Auto adopts Pay 'n' Glaze)
Depends on: none (epic 1 has landed)

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and `docs/roadmaps/pay-n-glaze/epic-2/_common2.md` first. You own only `games/gnome-theft-auto/src/driverHands.ts`, a new `games/gnome-theft-auto/src/driverHands.test.ts`, `games/gnome-theft-auto/src/player.ts` and `games/gnome-theft-auto/src/traffic.ts`.

## Goal
A seated gnome driver's hands hold the steering grips and turn with the wheel: the player's own gnome, NPC drivers in traffic (and, through a call another issue adds in `remotes.ts`, online players' gnomes).

## Read first
- `games/gnome-theft-auto/src/driverHands.ts` (stub: `poseHands(model, v, seat = 0, dt = 1/60)`).
- `packages/glaze/src/grips.ts` (`reachArm`, `releaseArm`, `ARM_LENGTH`, `ArmReach`; read the doc comments), `packages/glaze/src/types.ts` (`GlazeRig.grips`: the two markers that turn with the wheel, or null).
- `games/gnome-theft-auto/src/player.ts` `updateRiding` (lines ~260-285: sets position, calls `model.update(state, dt)`, then tilts the model with the chassis) and `drawMount`; `games/gnome-theft-auto/src/traffic.ts` `finish` (line ~372: `v.rider.update(seat, dt)`).
- `packages/gnome/src/model.ts` lines 139-153 and 378-386 (the arm is a pivot at the shoulder, hangs along -y; `update()` sets `arm.rotation.x` every frame while sitting) and `packages/gnome/src/types.ts` `GnomeModel` (`arms.left`/`arms.right`).

## Change
- `driverHands.ts`: implement `poseHands(model, v, seat = 0, dt = 1 / 60)`:
  1. A module `WeakMap<GnomeModel, { w: number }>` holds each gnome's blend weight `w` (0 = resting pose from the model, 1 = on the grips).
  2. `const grips = v.rig?.grips ?? null`. `wanted = seat === 0 && grips !== null && !v.exploded && !v.sunk && v.driver !== 'none'` AND both arms reachable this frame (see 4). Ease: `w += (wanted ? 1 - w : -w) * (1 - Math.exp(-9 * dt))` (about 0.25 s). When `w < 0.002` and not wanted: set `w = 0`, `releaseArm` both arms and return (leave the arms to the model).
  3. `v.object.updateMatrixWorld(true)` (the grip markers' world matrices must be current; `model.object` was already positioned by the caller).
  4. For each side `left`, `right`: remember the arm's quaternion as the model set it this frame (`restQ = arm.quaternion.clone()`: use a module scratch `Quaternion` per side, no allocation per frame), `grips[side].getWorldPosition(scratch)`, `r = reachArm(arm, scratch)`. If `!r.reached`: `arm.quaternion.copy(restQ)` and `releaseArm(arm)` and treat that side as not wanted. If reached: the reach quaternion is now in `arm.quaternion`; blend: `arm.quaternion.slerpQuaternions(restQ, arm.quaternion.clone-free, w)` (write it so no objects are allocated: keep a second scratch quaternion for the target) and the stretch: `arm.scale.y = 1 + (r.stretch - 1) * w`, `arm.scale.x = arm.scale.z = 1 / Math.sqrt(arm.scale.y)`.
  5. A passenger (`seat !== 0`), a vehicle without grips, a wreck or a flyer/boat leaves the arms alone (blend drains to 0 and the arms are released).
- `player.ts`: in `updateRiding`, after `model.update(state, dt)` and after the chassis tilt (`model.object.quaternion.copy(...)`): `poseHands(model, v, p.seat, dt)` (import from `./driverHands`). Also make sure the on-foot code that raises the right arm to aim (`if (input.fire && !p.swimming) model.arms.right.rotation.x = ...`) does not run while riding (read it: it is in the on-foot update; leave it as is). When the player leaves the vehicle the arm scale must return to 1: call `releaseArm`-equivalent by calling `poseHands` once more is not possible (no vehicle); instead export from `driverHands.ts` `export function clearHands(model: GnomeModel): void` (deletes the weight entry and sets both arm scales to 1) and call it in `player.ts` wherever the player stops riding (look for the exit path: `leave`/`exit` or the start of `drawMount`; read the file) and in `respawn`.
- `traffic.ts`: in `finish`, after `v.rider.update(seat, dt)` add `poseHands(v.rider, v, 0, dt)`; where a rider is removed or yanked (`v.rider = null` paths near lines 493-525), call `clearHands(rider)` first.
- `driverHands.test.ts` (new; no audio needed): build a real gnome (`createGnomeModel` from `@lawn/gnome` with a look from `resolveLook`/a literal `GnomeLook`: read `packages/gnome/src/look.ts` for a default, e.g. `defaultLook()` if it exists), a body `buildGlazeBody('ride-on-mower', { scale: 1.5 })` with `defineMounts('ride-on-mower', { steer: { pivot: 'steer', grips: [[0.25, 0.7, -0.1], [-0.25, 0.7, -0.1]] } })` (hand-written grips so the test does not depend on `glazeMounts.ts`), `attachLoadout(body, 'ride-on-mower', defaultLoadout(0xd8342c))`, a minimal fake `Vehicle` (`{ rig, object: body-parent group, driver: 'player', exploded: false }` cast through `unknown`), and place the gnome model's object so the grips are within reach (shoulder to grip < 0.45: compute the gnome position as grip midpoint minus `(0, 0.62 + 0.15, 0.2)` in the vehicle's space). Assertions: after calling `poseHands(model, v, 0, 1)` a few times (dt 1 so the blend reaches ~1) the hand ball point of each arm (`arm.localToWorld(new Vector3(0, -ARM_LENGTH, 0))` with `ARM_LENGTH` from `@lawn/glaze`, hmm: the arm's scale stretches, so use `-0.32` in the arm's own space) is within 0.02 of its grip's world position; rotating the steer pivot (`body.getObjectByName('steer')!.rotation.y = 0.6`) and calling again moves the hand with the grip (within 0.02 of the new grip position); `seat = 1` leaves `arms.left.quaternion` equal to what it was; `v.rig = undefined` leaves arms alone; `clearHands` restores scale 1; a gnome 3 units away does not move its arm (unreachable) and does not throw.

## Contract
`poseHands(model: GnomeModel, v: Vehicle, seat = 0, dt = 1 / 60): void` and NEW `clearHands(model: GnomeModel): void`. Call after the gnome model's `update()`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no error in your files.
- `npx vitest run games/gnome-theft-auto/src/driverHands.test.ts` passes.

## Out of scope
Every other file (`remotes.ts` calls `poseHands` for online drivers: another issue owns it).

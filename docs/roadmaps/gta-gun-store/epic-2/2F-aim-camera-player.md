Epic: 2 (parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-gun-store/_common.md` first.

## Goal
Aiming down sights works in the camera and on the gnome: `chase.setAim(t, zoom)` pulls the foot camera in over the shoulder with a narrower
lens and slower look, and the gnome walks slower, faces the aim and raises the gun while `input.aim` is held.

## Read first
- `games/gnome-theft-auto/src/camera.ts`: the whole file (335 lines). `VIEW.foot` (dist 4.6, lookHeight 1.5), `SHOULDER`, the `shoulder`
  easing, `FOV_BASE`, the FOV easing at the end of `update`, and the STUB `setAim` method.
- `games/gnome-theft-auto/src/types.ts`: `ChaseCamera.setAim` doc comment and `InputState.aim`.
- `games/gnome-theft-auto/src/gunMods.ts`: `AIM` (`cameraDist` 2.1, `shoulder` 0.85, `moveMul` 0.5).
- `games/gnome-theft-auto/src/player.ts` lines 165-265: `updateFoot` (speed, facing, the raised right arm while `input.fire`).

## Change
- `games/gnome-theft-auto/src/camera.ts`:
  - State `let aimT = 0; let aimZoom = 1;`. `setAim(t, zoom)` stores `aimT = clamp(t, 0, 1)` and `aimZoom = Math.max(1, zoom)`.
  - In `update`, only when `mode === 'foot'` and not in the showroom, let `a = aimT` (else `a = 0`; the showroom path is untouched):
    - look sensitivity: divide `input.camYaw` and `input.camPitch` by `1 + (aimZoom - 1) * a` before adding them to yaw/pitch (copy the
      numbers into locals; do not write to `input`);
    - while `a > 0` do not ease the pitch back to the default (skip the PITCH_RETURN step) - the player is aiming;
    - shoulder target: `lerp(SHOULDER, AIM.shoulder, a)` for foot (chute stays SHOULDER);
    - distance: `lerp(v.dist, AIM.cameraDist, a)` for foot (other terms unchanged);
    - lens: `fovTarget = FOV_BASE / (1 + (aimZoom - 1) * a)` for foot. Ease it in faster while aiming: use rate `FOV_RATE * (1 + 2 * a)`.
  - Leave every other mode exactly as it is. A small `lerp(a, b, t)` helper at the bottom next to `clamp` is fine.
- `games/gnome-theft-auto/src/player.ts`, in `updateFoot` only:
  - `const aiming = !!input.aim && !p.swimming;`
  - speed: multiply the walking speed by `AIM.moveMul` while `aiming` (import `AIM` from './gunMods').
  - facing: treat `aiming` like `input.fire` (turn to the camera yaw with AIM_TURN_RATE).
  - arm: raise the right arm (`model.arms.right.rotation.x = -Math.PI / 2`) when `input.fire || aiming` (and not swimming), as fire does now.

## Contract
```ts
// types.ts (already there)
setAim(t: number, zoom: number): void; // on ChaseCamera
aim?: boolean;                          // on InputState
```
The app calls `chase.setAim(t, aimZoom(weapons.spec(), 1))` every frame (t = 0 when not on foot) before `chase.update`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `camera.ts` and `player.ts`.
- `npx vitest run src/terrainCamera.test.ts` (from `games/gnome-theft-auto`) still passes.
- Read through: with `setAim(0, 1)` every line of the foot view behaves exactly as before.

## Out of scope
`input.ts`, `gamepad.ts` (another worker), `app.ts`, `types.ts`, every other file.

Epic: 1 (parallel modules)
Depends on: none

## Environment

- Repo root: `/home/user/lawn-gnome-panic` (Linux). Run commands from there. Dependencies are installed: do not run `npm install`. Do not commit.
- Game: `games/gnome-theft-auto` (three.js 0.187 + TypeScript + Vite). It already builds: every module exists as a STUB with its final exported signature. Your job is to replace ONE stub (or the files named below) with the real thing.
- About ten other workers are editing the other files of this game at the same time. Edit only the files your issue names. Keep every exported name and signature of your file exactly as in its stub, so other files keep compiling.
- The contracts are in `games/gnome-theft-auto/src/types.ts` (read it first, do not edit it) and all tuning numbers are in `games/gnome-theft-auto/src/config.ts` (read, do not edit). `src/collide.ts` (box collision, `angleDiff`) and `src/gnomes.ts` (town looks, names, `makeGnome`, `poseHandsUp`, `clearHandsUp`, `gnomeState`) are shared helpers: use them, do not edit them. `src/main.ts` is the wiring that calls your module; read it to see how you are called, do not edit it.
- Conventions: y up, 1 unit = one gnome's height (a gnome model is about 1.1 tall). Yaw 0 faces +z; forward = `(Math.sin(yaw), 0, Math.cos(yaw))`; the gnome's right = `(-Math.cos(yaw), 0, Math.sin(yaw))`. Turning right DECREASES yaw. Prefab models from `@lawn/prefabs` stand on y = 0 and face +z.
- `buildPrefab(id, { scale, tint })` (from `@lawn/prefabs`) returns a `THREE.Group`; it throws `Unknown prefab` for an id that does not exist yet. The new ids `squirt-pistol`, `super-soaker`, `zero-turn-mower`, `whirligig-mower`, `sandbag-wall`, `watch-tower` are being added by another worker right now; you may reference them, they will exist when the epic is done.
- Lore (Gnome Theft Auto is a parody set in the town of Turfton): no gore, nothing bleeds or dies; water guns only; soaked gnomes put their hands up and run. Gnomes are fired clay. No humans ever appear.
- Mobile matters: anything a player does must work by touch too (only the input/HUD issues build UI).
- Check: `npx tsc --noEmit -p games/gnome-theft-auto` must show no errors in YOUR files (errors in another worker's file mean they are mid-edit: ignore those). Do NOT run `vite build`, `npm run build` or a dev server: other workers share the folder and the port.

## Goal
`games/gnome-theft-auto/src/camera.ts` is a floating third-person chase camera that sits behind and above the player gnome (or the mower it drives), orbits with mouse/touch drag, drifts back behind on its own, and never ends up inside a building.

## Read first
- `games/gnome-theft-auto/src/types.ts`: `ChaseCamera`, `CameraMode`, `InputState` (`camYaw`, `camPitch`), `World` (`boxes`).
- `games/gnome-theft-auto/src/camera.ts`: the stub (keep `export function createChaseCamera(camera: THREE.PerspectiveCamera): ChaseCamera`).
- `games/gnome-theft-auto/src/collide.ts`: `insideBox`, `angleDiff`.
- `games/gnome-theft-auto/src/main.ts`: `chase.update(dt, target, targetYaw, mode, inp, world)` each frame; `chase.yaw` is used to walk relative to the camera; `chase.aimDir(v)` is where water goes.

## Change
`games/gnome-theft-auto/src/camera.ts` only.

- State: `yaw`, `pitch` (radians; positive = looking down), a smoothed camera position, and `sinceDrag` (seconds since the last non-zero camYaw/camPitch).
- Each update: `yaw += input.camYaw; pitch += input.camPitch`; clamp pitch to [-0.25, 1.2].
- Per mode (put these numbers in a `const VIEW` table at the top of the file):
  - `foot`: distance 5.5, look-at height 1.3 above target, default pitch 0.28. Auto-follow: if `sinceDrag > 1.5` and the target moved more than 0.5 units/s since the last frame, ease `yaw` toward `targetYaw` at 1.2 rad/s (use `angleDiff`).
  - `drive`: distance 8.5 + 0.12 * target speed (compute from the target's movement per frame), look-at height 1.8, default pitch 0.3. Auto-follow after `sinceDrag > 0.8` at 3.5 rad/s.
  - `fly`: distance 13, look-at height 1.5, default pitch 0.38. Auto-follow after `sinceDrag > 0.8` at 2.5 rad/s.
  - When not dragging, ease pitch toward the mode's default at 0.8 rad/s after `sinceDrag > 2`.
- Desired position: `look = target + (0, lookHeight, 0)`; forward `f = (sin yaw * cos pitch, -sin pitch, cos yaw * cos pitch)`; `desired = look - f * distance`. Floating feel: smooth the camera position toward `desired` with `k = 1 - Math.exp(-7 * dt)` (12 in foot mode), and add a gentle bob `0.04 * Math.sin(t * 1.3)` to y.
- No clipping: march from `look` to the desired position in 0.4-unit steps; at the first step where `insideBox(x, y, z, world.boxes)` is true, put the camera 0.5 units before that step. Keep camera y ≥ 0.4.
- `camera.position.copy(smoothed); camera.lookAt(look)`.
- Mode change (foot ↔ drive ↔ fly): no snap; the smoothing blends it.
- `aimDir(out)`: the camera's world direction (`camera.getWorldDirection(out)`), with 0.06 added to `out.y`, normalised. Return `out`.
- Also widen the FOV a little with speed in drive/fly: `camera.fov` lerps toward `62 + min(14, speed * 0.4)`; call `camera.updateProjectionMatrix()` only when it changed by more than 0.05.

## Contract
`ChaseCamera` exactly as in `types.ts`: `yaw` (the camera looks along `(sin yaw, 0, cos yaw)`; main sets it once at spawn), `pitch`, `update(...)`, `aimDir(out)`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/camera.ts`.

## Out of scope
Every other file.

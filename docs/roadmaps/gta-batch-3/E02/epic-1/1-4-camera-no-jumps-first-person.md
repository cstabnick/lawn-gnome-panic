Epic: E02-1 Engine pieces
Depends on: none
Items: L77 ("fix camera sometimes jumping and turning randomly. I think due to when I turn my camera near close objects or edges/corners"), L76 ("add first person mode")
Model: Sonnet

(Environment: paste `_environment.md`.)

## Goal
The chase camera never snaps or swings when it turns next to walls, corners, kerbs and slopes; and `ChaseCamera` has a working first-person view.

## Read first
- `camera.ts` (all, ~380 lines): `update`, `clipPoint`, `clipDist`, `isBlocked`, `VIEW`, constants. Shake scaling and `setFirstPerson` / `firstPerson` are already there (stubs: the flag is stored, `update` ignores it).
- `types.ts` `ChaseCamera` (~345): `update(dt, target, targetYaw, mode, input, world, extra?: { boost?, airborne?, eye?: {x,y,z} })`, `setFirstPerson(on)`, `firstPerson`.
- `terrainCamera.test.ts`: how a camera test builds a `World` and calls `update`.
- `collide.ts` `pushOutOfBoxes`, `insideBox` (boxes may be round: `shape: 'round'`).

## Change
- `camera.ts`, L77 jump fixes (causes found in review; fix each):
  1. The shoulder look point `look = clipPoint(pivot, rawLook, ...)` is not smoothed: next to a wall it flips between `pivot` and the shoulder in one frame and `lookAt` swings. Compute the clipped shoulder distance each frame and ease the used value toward it (in: rate ~25/s, out: `CLIP_RECOVER_RATE`), then build `look` from the eased distance.
  2. `clipDist` snaps IN immediately (`safeDist < clippedDist`), and the 0.25 m march flips blocked/unblocked when a ray grazes a corner. Add a short in-ease (rate ~30/s; but never end a frame with the camera inside a box: if the eased point is blocked, use the safe distance) and hysteresis (ignore changes under 0.15 m).
  3. The yaw auto-follow fights the player while the camera is clipped: also skip the follow while the clip distance changed by more than 0.5 m within the last 0.2 s.
  4. `isBlocked`'s rising-ground rule (`ground > baseGround + 0.3`) pulls the camera in on kerbs and small slopes: use `ground > baseGround + 0.8 && y < ground + 0.3`.
  5. The final `camera.lookAt(look)` vs the `placed.distanceTo(look) > 0.25` fallback swaps direction abruptly: blend the two look targets over 0.25..0.6 m instead of a hard switch.
- `camera.ts`, L76 first person: a separate branch at the top of `update` (after the showroom early return), never mixed into the chase maths. When `firstPerson && extra?.eye`: orbit input still turns `chase.yaw` / `chase.pitch` (pitch clamped -1.2..1.2); in `'drive'` / `'fly'` the yaw drifts back to `targetYaw` with the mode's `followRate` after `followAfter` as today, on foot it does not; position = `eye` (no smoothing) plus shake; orientation from yaw/pitch minus recoil: look at `eye + (sin yaw * cos p, -sin p, cos yaw * cos p)`; FOV target `FP_FOV = 75` (exported; foot aim zoom still divides it); `camera.near` 0.05 while first person, restored to its previous value when it goes off (`updateProjectionMatrix`). When first person goes off, reset `smoothed = null` and `clippedDist = -1` so the chase view cuts in. `aimDir` keeps working (camera world direction). Without `extra.eye` it falls back to the chase view.
- New test `cameraCorner.test.ts`: a world with one 4x4 box (h 6) on flat ground (setup like terrainCamera.test.ts); a target on foot 0.6 m from the box's corner; sweep the yaw 360 degrees in 2-degree steps per frame (`input.camYaw`), dt 1/60, enough warm-up frames first. Per frame assert: camera position moves < 0.6 m, forward direction turns < 12 degrees, camera never inside the box. Same in `'drive'` at 0.8 m from the corner. First person: `setFirstPerson(true)` + `extra.eye` -> `camera.position` equals the eye, forward follows yaw/pitch; `setFirstPerson(false)` -> the chase distance comes back.

## Contract
`ChaseCamera` members and `update` signature as in types.ts (do not edit types.ts). `SHAKE_SCALE`, `SHAKE_CAP` stay exported. The showroom path stays as is.

## Done when
- `npx vitest run src/cameraCorner.test.ts src/terrainCamera.test.ts` pass.
- `npx tsc --noEmit -p .` clean for camera.ts.

## Out of scope
`app.ts` (wiring first person into the game is a later issue), `types.ts`, `player.ts`, `collide.ts`, `viewPrefs.ts`.

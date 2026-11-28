Epic: A (foundations) — E26 street racing
Depends on: none
Agent: haiku-worker

(Paste `_env.md` here.)

## Goal
Time-trial ghosts: a recorder that samples the player's run, a pure replay (`ghostPose`), local storage of the best
ghost per track, and a see-through ghost car drawn from it.

## Read first
- `games/gnome-theft-auto/src/streetRace/ghost.ts` and `streetRace/ghostView.ts`: stubs with the final signatures
  (keep every export name and type).
- `games/gnome-theft-auto/src/vehicles.ts`: `createVehicle(scene, kind, x, z, yaw, tint?)` returns a `Vehicle` whose
  `object` is a THREE.Object3D already added to the scene; `removeVehicle(scene, v)`; `syncVehicleMesh(v, dt)`.
- `games/gnome-theft-auto/src/collide.ts`: `angleDiff(a, b)` (shortest signed angle).

## Change
- `src/streetRace/ghost.ts`:
  - `createGhostRecorder(hz)`: `sample(t, x, y, z, yaw)` keeps a sample when `t >= k / hz` for the next k (one per
    slot; skip frames in between; if a frame jumps over several slots, store the current pose for each); `pts` gets
    `Math.round(x*10), Math.round(y*10), Math.round(z*10), yaw byte` (yaw byte = `Math.round(((yaw / (2π)) mod 1) *
    256) % 256`). `reset()` clears. `finish(trackId, vehicle, time)` returns a copy.
  - `ghostPose(g, t)`: null if `pts` empty, t < 0 or t > time; else linear between samples k = floor(t*hz) and k+1
    (clamped to the last), yaw interpolated the short way (`angleDiff`), returned in metres and radians in [-π, π).
  - `loadGhost(trackId, storage = globalThis.localStorage ?? null)` / `saveGhost(g, storage)`: one JSON object under
    `GHOST_KEY` mapping trackId → trace; validate on load (fields present, pts length multiple of 4, all integers);
    every storage call in try/catch; a quota error in save is swallowed.
- `src/streetRace/ghostView.ts`: `createGhostView(scene, g)`: `createVehicle(scene, g.vehicle, x, z, yaw)` at the first
  pose; then remove it from nothing else (it is never pushed into any `vehicles` list); traverse `v.object` and for
  every mesh clone its material(s) and set `transparent = true, opacity = 0.35, depthWrite = false`; `update(t)`:
  pose from `ghostPose` → set `v.x, v.y, v.z, v.yaw`, `v.speed = 0`, `syncVehicleMesh(v, 0)`, `v.object.visible =
  pose !== null`. `dispose()`: `removeVehicle(scene, v)` and dispose the cloned materials.
- `src/streetRace/ghost.test.ts` (new): recorder at 5 Hz over 10 s of a straight line gives 51 samples; ghostPose at
  half-way between samples interpolates; yaw wraps the short way across ±π; t past the end → null; save/load round
  trip with a Map-backed fake storage; corrupt storage → null.

## Contract
As in the stubs: `GHOST_KEY`, `GHOST_HZ`, `GhostTrace`, `GhostRecorder`, `createGhostRecorder`, `ghostPose`,
`loadGhost`, `saveGhost`; `GhostView`, `createGhostView`.

## Done when
- `npx vitest run src/streetRace/ghost.test.ts` passes and `npx tsc --noEmit -p .` passes (games/gnome-theft-auto).

## Out of scope
`streetRace/save.ts`, `session.ts`, `vehicles.ts`.

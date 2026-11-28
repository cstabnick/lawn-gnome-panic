Epic: FX11 A (coast fixes, parallel) · Issue A11: the player water-skis standing up (G3#18)
Depends on: none · Agent: Haiku · Dev port 5531

(The Environment section the lead gave you applies.)

## Goal
Editor (G3#18): "The app seats the driver, so the player's gnome sits on the skis while NPC skiers stand." Fix: a standing pose for `tow-ski`: knees bent, arms forward to the tow handle, the lean shown by the hips.

## Read first
- `games/gnome-theft-auto/src/config.ts` around line 459: the `'tow-ski'` vehicle spec. `'snow-skis'` (line ~477) and `'skateboard'` already have `stand: true`; `player.ts` line ~386 does `state.sitting = !v.spec.stand;` so `stand: true` makes the rider stand.
- `games/gnome-theft-auto/src/player.ts` lines 340-410 (`updateRiding`: sets `state.sitting`, updates the model, copies the vehicle's tilt, then `poseHands` and `rideAnim.update`).
- `packages/gnome/src/types.ts` around line 160 (`GnomeModel`: `arms: { left, right }` groups, optional `legs: { left, right }`, `object`).
- `games/gnome-theft-auto/src/tubing/runtime.ts`: `update(dt)` near line 995 (runs every frame after the player's riding pose and after app.ts relaxes the arms); `modeOf(v)` / `isTowRide(v)` near line 57; `deps.player` is the Player.
- `games/gnome-theft-auto/src/driveGrips.ts` lines 86-95 (kinds with no control keep their hands in the lap; `tow-ski` is not listed: leave driveGrips alone).

## Change
1. `src/config.ts`: add `stand: true` to the `'tow-ski'` spec (one property; touch nothing else in this hot file).
2. New `src/tubing/skiPose.ts`: `export function skiPose(model: GnomeModel, lean: number): void` that, after the model's own update, bends the knees (if `model.legs` exists: each leg group's `rotation.x` a small forward bend, e.g. 0.35 rad; the body/hips dropped a little by lowering... only if the model exposes a hip/body group; otherwise just the legs), reaches both arms forward to the handle (`arms.left.rotation.x = arms.right.rotation.x = -1.25`, a little inward `rotation.z` +-0.15), and shows the lean as a hip sway: `model.object.rotation.z` is already set by the vehicle tilt, so add the lean to the legs instead (`legs.left.rotation.z = legs.right.rotation.z = -lean * 0.25`). Pure three.js on the passed model; no imports from app code. A short doc comment.
3. `src/tubing/runtime.ts`: in `update(dt)`, after the existing calls, if `deps.player.vehicle?.kind === 'tow-ski'` call `skiPose(deps.player.model, <the current lean>)` (use the rider's lean input if the module keeps it, e.g. the last `inp.moveX` seen in `stepRider`; store it in a module variable; else 0).
4. New `src/tubing/skiPose.test.ts`: a fake model with `arms`/`legs` groups (`new THREE.Group()`) and `object`: after `skiPose(m, 0.5)` the arms point forward (rotation.x < -1) and the legs are bent (rotation.x > 0).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/tubing` passes; `npx tsc --noEmit -p games/gnome-theft-auto` clean in your files.
- In the browser (port 5531): rent skis at the rack (150, 1172) (walk there and press E, or `?debug` and `__gta.tubing.hopOn()` if available: read `registerJobsTrainer` in app.ts for the trainer names), and check the gnome stands on the skis with arms forward. Take a shot if you can (the shot tool puts the player on foot, so this check may need a manual screenshot via puppeteer; if you cannot, say so).

## Out of scope
`src/tubing/view.ts` (another worker; NPC skiers), `src/player.ts`, `src/app.ts`, `src/driveGrips.ts`.

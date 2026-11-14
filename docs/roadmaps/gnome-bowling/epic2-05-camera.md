Epic: 2 (systems, all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gnome-bowling/_common.md` first (environment, rules, world conventions). Other workers edit other files at the same time.

## Goal
`src/camera.ts` moves the camera like a TV bowling broadcast: behind the bowler while aiming, chasing the ball down the lane, a dramatic low pin-cam at impact, and a slow orbit on the title screen.

## Read first
- `games/gnome-bowling/src/config.ts`: `LANE`, `BALL`, `THROW`, `GameState`, `SimResult` (`reachPinsAt`, `ball`, `sampleDt`), `ResultKind`
- `games/gnome-bowling/src/main.ts`: camera made there (fov 55, near 0.05, far 200); the key light `ctx.lights.key` has a shadow camera spanning x ±4, z ±16 around its target

## Change
- `games/gnome-bowling/src/camera.ts`: `createCamera(ctx): System`.

## Behaviour
Keep a desired position and look-at point per phase; every frame move the real camera toward them with exponential smoothing (`k = 1 - exp(-rate * dt)`, rate ~4 normally, ~8 while chasing the ball) and `camera.lookAt(currentLook)`. On a phase change, do not snap (except on the very first frame).

- 'title' / 'lobby': slow orbit high over the approach looking at the pins: position `(sin(t*0.15) * 3, 2.2, -4 + cos(t*0.15))`, look `(0, 0.3, LANE.length)`.
- 'intro': swoop from a high wide shot to the aim view over the intro.
- 'aim': behind and above the bowler: position `(state.aimX * 0.5, 1.55, -3.4)`, look `(state.aimX * 0.3 + sin(state.aimYaw) * 18, 0.2, 16)`. Portrait phones (aspect < 0.8) need more lane in view: raise to y 1.9 and pull back to z -4.2.
- 'approach': same, easing slightly forward with the bowler.
- 'roll': chase: position = ball position + `(0, 0.75, -2.6)` (x follows ball x at half strength so it stays mostly lane-centred), look at `(ballX * 0.5, 0.2, ballZ + 6)`; do not let the camera z go past `LANE.length - 4`. When `state.rollTime > sim.reachPinsAt - 0.25` (ball about to hit), cut (snap, no smoothing) to the **pin cam**: low and to the side of the deck, position `(1.1, 0.35, LANE.length - 1.0)`, look `(0, 0.2, LANE.length + 0.4)`, with a tiny shake for 0.3 s after the first `'ballPin'` event (`sim.events`, time ≤ rollTime). Gutter balls: no pin cam; the chase just ends at z = LANE.length - 4 and holds.
- 'result': strike kinds (strike/double/turkey/hambone): slow push-in on the empty deck from the pin cam. Others: rise to a high view looking down at the deck from behind `(0, 2.4, LANE.length - 3.5)`, look `(0, 0, LANE.length + 0.3)`, so the leftover pins read clearly.
- 'final': slow orbit like the title.
- Also move the shadow light with the action: `ctx.lights.key.target.position.z` = clamp(subject z, 2, LANE.length) and `key.position` = target + (2, 8, -8), so shadows stay sharp where we look. Call `key.target.updateMatrixWorld()`.

## Contract
`export function createCamera(ctx: Ctx): System`. Nothing else exported. Only this file moves `ctx.camera`.

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` shows no errors in camera.ts
- The camera behaves as above in every phase (try `window.bowl` in the dev console later; no server now).

## Out of scope
Every other file.

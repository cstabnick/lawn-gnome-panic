Epic: 2 (systems, all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gnome-bowling/_common.md` first (environment, rules, world conventions). Other workers edit other files at the same time.

## Goal
`src/pins.ts` draws the ten pins and the bowling ball on the playable lane: racked between throws, in the bowler's hand during the run-up, and played back from the simulation during the roll.

## Read first
- `games/gnome-bowling/src/config.ts`: `PIN`, `PIN_SPOTS`, `BALL`, `LANE`, `PinSample`, `BallSample`, `SimResult`, `GameState`, `LOOK_COLORS`
- `games/gnome-bowling/src/game.ts`: `currentPlayer`

## Change
- `games/gnome-bowling/src/pins.ts`: `createPins(ctx): System`.

## What to build
- **Pin mesh** (build one geometry, share it): a `LatheGeometry` from a profile of ~14 points giving a real pin shape, base at y = 0, height `PIN.height` (0.381), max radius `PIN.radius` (0.061) at the belly (y ≈ 0.11), neck radius ≈ 0.023 at y ≈ 0.25, head radius ≈ 0.032 at y ≈ 0.32, rounded top. White (`LOOK_COLORS.pinWhite`), glossy (`roughness 0.3`). Two red neck stripes (thin `CylinderGeometry` rings, `LOOK_COLORS.pinRed`) at y ≈ 0.24 and 0.27. Gnome touch: a tiny red pointy hat (cone r 0.03, h 0.07) on top and two black dot eyes on the head, so they look like little gnome pins. `castShadow = true`.
- Each pin is a `THREE.Group` with the base at its origin. To pose a `PinSample` s: `group.position.set(s.x, s.y, s.z)`; build the rotation as: spin about local y by `s.spin`, then tilt by `s.tilt` about the horizontal axis perpendicular to the lean direction so the top moves toward yaw `s.tiltDir` (axis = `(cos(tiltDir), 0, -sin(tiltDir))`; use `quaternion.setFromAxisAngle(axis, s.tilt)` multiplied with the spin quaternion). Check: tilt PI/2 toward tiltDir 0 lays the pin with its head toward +z.
- **Ball**: `SphereGeometry(BALL.radius, 32, 24)`, glossy swirled colour from a `CanvasTexture` (marbled stripes in the current player's colour `currentPlayer(state)?.color` mixed with dark purple; rebuild/recolour when the bowler changes), three dark finger-hole discs on one side. `castShadow = true`. Roll: rotate about the x axis by `sample.roll` (and yaw the ball's spin axis to its direction of travel if easy).
- **Per phase**:
  - 'title', 'lobby', 'final': show a full rack at `PIN_SPOTS` (all upright), ball hidden.
  - 'intro', 'aim': pins where `state.standing[p]` at their spots upright; others hidden. Ball shown at the bowler's hand: `(state.aimX - 0.25, 0.35, -1.2)` (the bowler stands ~1.2 m behind the foul line; their right hand is at -x).
  - 'approach': pins as in 'aim'. Ball in the hand: export nothing; compute it here from `t = state.phaseTime / THROW.approachSeconds`: the bowler walks from z = -1.2 to z = -0.1 (`z = -1.2 + 1.1 * ease(t)`), the ball swings like a pendulum by the right hip: backswing up behind at t ≈ 0.6 (ball at z_bowler - 0.45, y 0.6), then forward and down to the release point `(state.input.x, BALL.radius, BALL.releaseZ)` at t = 1. Use `x = state.aimX - 0.25` early, blending to `state.input.x` by t = 1. (The bowler file uses the same timeline for the gnome's arm.)
  - 'roll' and 'result': i = `min(floor(state.rollTime / sim.sampleDt), sim.ball.length - 1)` (during 'result' use the last sample); ball from `sim.ball[i]`, every pin from `sim.pins[p][i]`; a pin whose first sample has `y < -0.5` (not in play) is hidden; pins with y < -0.3 can be hidden too (fallen into the pit). Interpolate between sample i and i+1 for smoothness.
- **Sweep**: when the phase goes from 'result' back to 'aim' or 'intro', animate a quick pinsetter sweep: a dark bar (box spanning the lane, y 0..0.12) sweeps from z = LANE.length - 0.4 to the pit over 0.4 s while the knocked pins are hidden; then the standing pins appear. (Optional: drop the full rack down from y = 0.8 on a new rack, over 0.3 s.)

## Contract
`export function createPins(ctx: Ctx): System`. Nothing else exported.

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` shows no errors in pins.ts
- Pins render as gnome-hatted bowling pins at PIN_SPOTS; the ball follows the hand during 'approach' and the sim during 'roll'.

## Out of scope
The lane and room (lane.ts), the bowler (bowler.ts), physics (physics.ts). Do not edit any other file.

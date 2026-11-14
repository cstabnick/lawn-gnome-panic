Epic: 2 (systems, all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gnome-bowling/_common.md` first (environment, rules, world conventions). Other workers edit other files at the same time.

## Goal
`src/controls.ts` gives the local bowler motion-style controls: step left/right and turn the aim, then **swipe up** to bowl. The swipe's speed is the ball speed and its sideways curl is the hook, like swinging a motion controller. Mouse drag and keyboard work too.

## Read first
- `games/gnome-bowling/src/config.ts`: `THROW`, `ThrowInput`, `LANE`, `GameState`, `Ctx`
- `games/gnome-bowling/src/game.ts`: `canBowlHere`, `setAim`, `throwBall`, `currentPlayer`
- `games/gnome-bowling/src/audio.ts`: `sfx`, `startAudio` (stub now; call them anyway)

## Change
- `games/gnome-bowling/src/controls.ts`: `createControls(ctx): System`.

## Behaviour
Only active while `canBowlHere(state)` is true; hide all controls otherwise (also on remote players' turns; there show nothing, hud.ts says whose turn it is).

- **DOM** (container `#bc-root` appended to `ctx.ui`; style prefix `#bc-`):
  - bottom-left: four round 56px buttons in a 2x2 pad: `◀` `▶` (move: hold to slide `aimX` at 0.5 m/s), `↺` `↻` (turn: hold to change `aimYaw` at 0.08 rad/s; ↺ = toward +x / left). Use pointerdown to start, pointerup/pointercancel/pointerleave to stop; call `setAim(state, x, yaw)`; `sfx('tick', 0.3)` every 5 cm.
  - bottom-right: spin control: a label "SPIN" and a horizontal slider-like strip (custom, pointer-driven, 160x48) from "⟲ HOOK L" to "HOOK R ⟳" showing the current `spinBias` (-1..1, default 0.35 for a gentle right-hander's hook toward +x... note +spin curves toward +x = left). The bias is added to the swipe's curl.
  - bottom-centre: a pulsing hint "SWIPE UP TO BOWL" (desktop: "DRAG UP or hold SPACE"); while a swipe is in progress show a power bar that fills with the current swipe speed.
- **3D aim guide**: add a dashed line of ~12 small flat translucent arrow/dot meshes on the lane from `(state.aimX, 0.005, 0.3)` along yaw `state.aimYaw` up to z = 12, plus a faint curved tail showing the hook from `spinBias` (just bend the last dots toward +x by `spinBias * 0.25 * ((z-11)/6)^2`). Visible only while `canBowlHere`.
- **Swipe** (pointer events on `ctx.canvas`, which has touch-action none; ignore pointers that start on buttons since those are DOM above it):
  - Record samples `{x, y, t}` from pointerdown to pointerup (screen px, performance.now()).
  - On pointerup: the throw counts if the total upward travel ≥ 12% of the screen height and the last 120 ms moved upward. `upSpeed` = upward px/s over the last 120 ms divided by screen height (screen heights per second). `speed = THROW.speedMin + (THROW.speedMax - THROW.speedMin) * clamp((upSpeed - 0.8) / 4.0, 0, 1)`.
  - Curl = horizontal velocity over the last 120 ms divided by screen width (screen widths per second, sign: swiping toward screen-right means hooking toward the bowler's right, which is -x; so `spin = clamp(spinBias - curl * 0.6, -1, 1)`).
  - Wobble (skill): the swipe's average angle away from vertical over the last 120 ms adds to the aim: `aim = state.aimYaw - clamp(angleRad * 0.08, -0.04, 0.04)` (screen-right = toward -x).
  - A downward drag first (the backswing) is allowed and does not count against the throw.
  - Then `startAudio(); sfx('swoosh'); throwBall(state, { x: state.aimX, aim, speed, spin })`.
- **Keyboard**: ←/→ move, Shift+←/→ or A/D turn, Q/E change spinBias by 0.25, **Space**: hold to charge — a meter oscillates 0→1→0 (period 1.6 s) shown in the power bar; release throws with `speed` from the meter value and `spin = spinBias`, `aim = state.aimYaw`. Enter = same as Space press+release at 0.8 power (quick throw for testing).
- Mobile check: everything fits 390x844 and 844x390 without overlapping the bottom-centre hint; buttons ≥ 48px.

## Contract
`export function createControls(ctx: Ctx): System`. Nothing else exported. Calls only `setAim` and `throwBall` to change the game.

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` shows no errors in controls.ts
- During 'aim' on a local turn: buttons move/turn the aim guide; a quick upward swipe throws; Space hold/release throws.

## Out of scope
Every other file. hud.ts owns the scoreboard and banners; menu.ts owns the title.

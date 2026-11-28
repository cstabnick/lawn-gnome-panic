Epic: E15-A (Hedgeworth Links, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): three.js view and camera work

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/golf/view.ts` shows a round of golf in the GTA scene: the ball (on its tee, at rest, or
flying with a short tracer), the aim line with the predicted landing spot while aiming (Gnome Golf's preview), a ring
on the pin's flag for the current hole, and a golf camera: an address view behind the ball looking down the aim line,
and a camera that follows the ball in flight and settles where it lands.

## Read first
- `games/gnome-theft-auto/src/golf/types.ts`: `RoundState`, `RoundPhase`, `HOLES`, `YD`.
- `games/gnome-theft-auto/src/golf/course.ts`: `golfEnv`, `golfStart`, `golfToWorld`, `courseGroundY`, `HOLES_YD`.
- `games/gnome-theft-auto/src/golf/round.ts` (exports: `ballWorld(s)` gives the ball's world position in any phase;
  another worker is writing its body right now: use only its exported signatures).
- `games/gnome-theft-auto/src/golf/view.ts`: the stub (keep `GolfView` and `createGolfView`).
- `games/gnome-golf/src/ball.ts` (tracer, ball on a tee) and `games/gnome-golf/src/camera.ts` lines 100-260 (shot
  camera: `sampleFlight`, `flightPose`, how it frames the flight and the landing): the original's feel to copy.
- `packages/golf/src/physics.ts` (`previewShot(env, start, club, lie, yaw, pin)` returns a `ShotResult` whose `points`
  are the flight up to the first landing for full swings, the whole roll for putts, in the golf frame).
- `docs/rendering.md` and `packages/depth/src/layers.ts` (`LAYER.marker` for ground markers).
- Prefabs `golf-ball`, `golf-tee` (`packages/prefabs/src/catalog/gnome-golf-props.ts`).

## Change
`src/golf/view.ts`, `createGolfView(scene, camera)`:
- **Ball**: a `golf-ball` prefab scaled so it reads at distance (about 0.18 m across; a real ball would vanish), placed
  at `ballWorld(s)` every frame; on the tee box (lie 'tee' and phase not 'flight') a `golf-tee` under it. Hidden when
  `s` is null.
- **Tracer**: in flight, a thin line (`THREE.Line`, white, transparent 0.6) through the flight samples up to now (the
  last ~1.5 s), cleared after the ball rests.
- **Aim preview** (phase 'aim' and 'swing'): `previewShot(golfEnv(), golfStart(ball), club, lie, aimYaw, pinGolf)`
  (recompute only when club, aim or ball changed): draw its points converted with `golfToWorld` as a dashed arc
  (`LineDashedMaterial`, yellow) and a landing ring at its last point (a flat ring mesh on `courseGroundY + 0.03`,
  `flatLayer(mat, LAYER.marker)`, radius 1.2 m). For the putter draw the roll line on the green instead (the same
  points, flat, `LAYER.marker`).
- **Pin ring**: a slowly pulsing ring (LAYER.marker) round the current hole's pin, plus a vertical soft beam? No: a
  ring only (the flagstick prefab is already in the cup).
- `applyCamera(s, dt)`: returns false (and does nothing) when `s` is null or phase is 'walk', 'holed' or 'done'.
  - 'aim' / 'swing': camera 4.5 m behind the ball along the aim line and 2.2 m up, looking at a point 25 m ahead on the
    aim line at ground height + 1 (putter: 3 m behind, 1.6 up, look 8 m ahead). Ease toward it (rate ~6/s).
  - 'flight': follow the ball from behind and above (8 m behind its direction of travel, 4 m above it, never below
    ground + 1.5), looking at the ball; as it slows near rest, ease to a view of the ball from 6 m away. Clamp camera
    moves so they never jump more than 30 m per frame.
  Set `camera.position` and call `camera.lookAt`; return true. (app.ts calls this after the chase camera each frame, so
  your pose wins.)
- `dispose()` removes everything.
- New `src/golf/view.test.ts`: with a `THREE.Scene` and a `PerspectiveCamera`, `update` with a round state from
  `newRound(1, 0)` (from `./round`) moves the ball object to the tee; `applyCamera` returns false in 'walk', true in
  'aim' (set `s.phase = 'aim'`) and puts the camera behind the ball relative to `aimYaw`; `update(dt, null)` hides the
  ball. (round.ts may still be a stub when you start: write the test so it only relies on `newRound` and on fields you
  set yourself.)

## Contract
`createGolfView(scene, camera): GolfView` exactly. Uses only the exported functions of round.ts and course.ts.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/view.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (the HUD is hud.ts; app.ts already calls `golf.applyCamera`).

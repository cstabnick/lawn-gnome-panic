Epic: 2 Systems · Issue 3: camera
Depends on: none

## Goal
`src/camera.ts` moves the camera like a TV golf broadcast: an orbit on the title screen, a hole flyover, a behind-the-ball view (or overhead) while aiming, a chase and landing cam during the shot, a follow cam on the mower ride, and a cup cam when holed. It also keeps the sun's shadow box on the action.

## Read first
- `games/gnome-golf/src/config.ts`: `GameState`, `ROUND`, `HOLES`, `PHYS`
- `games/gnome-golf/src/round.ts`: `currentHole`, `mowerPose`
- `games/gnome-golf/src/physics.ts`: `previewLanding`
- `games/gnome-golf/src/camera.ts` (stub: a fixed behind-ball view)

## Change
- `games/gnome-golf/src/camera.ts`: implement `createCameraRig(ctx: Ctx): System`. Each frame compute a desired camera position `P` and look target `T`, then move toward them: `pos.lerp(P, 1 - exp(-k * dt))`, same for a stored look target, then `camera.lookAt(look)`. Use k = 3 normally; on a phase change into 'aim', 'intro' or 'title' snap immediately (no lerp) if the camera is more than 150 yd from P. Never let the camera go below `heightAt(cam.x, cam.z) + 0.8` or below y = 1.
  Let `dir = (sin aimYaw, 0, cos aimYaw)`, `b = state.ball`.
  - **title**: orbit the island: P = (cos(t * 0.05) * 950, 320, sin(t * 0.05) * 800), T = (0, 0, 0). t = state.time.
  - **intro** (`ROUND.introSeconds` long): a flyover of `currentHole(state)`. u = phaseTime / introSeconds. For u < 0.7: fly along the hole's `path` polyline (parameterised by length) from the tee to the green at height ground + 45, looking 60 yd further along the path (or at the green when past it). For u >= 0.7: blend (smoothstep) to the 'aim' pose below. lerp k = 6 here so it follows the scripted path tightly.
  - **aim / swing**, `state.view === 'behind'`: full swing: P = b - dir * 6.5 + (0, 2.3, 0), T = b + dir * 30 + (0, 1.5, 0). Putter (state.club === 'PT'): P = b - dir * 3.2 + (0, 1.3, 0), T = b + dir * 6.
  - **aim / swing**, `state.view === 'overhead'`: L = `previewLanding(b, club, lie, aimYaw, currentHole(state).pin)` (cache by the same key as the ball issue: ball x/z, club, lie, aimYaw.toFixed(3)). M = midpoint of b and L; d = distance b..L. P = M - dir * d * 0.35 + (0, max(30, d * 1.1), 0), T = M.
  - **flight**: let p = current ball position (sample `flight.points` at `phaseTime / flight.sampleDt`, interpolated, as in the ball issue) and v = direction of travel from the previous sample. First 0.5 s: hold the 'aim' pose but look at p. Then until the ball is past its apex (its y is falling) and less than 25 yd above the ground: chase, P = p - horizontal(v) * 14 + (0, 5, 0), T = p. After that: landing cam, a fixed point chosen once per shot: E = flight.end, P = E + side * 18 - dirShot * 8 + (0, 7, 0) where side is the right-hand side of the shot direction (start to end), T = p. For putts (club 'PT'): stay at the 'aim' putter pose and look at p the whole time.
  - **result**: keep the last P, T = ball rest position (`flight.end`).
  - **drive**: follow the mower: m = `mowerPose(state)`, f = (sin m.facing, 0, cos m.facing), P = (m.x, m.y, m.z) - f * 9 + (0, 4.5, 0), T = m + f * 6 + (0, 1, 0).
  - **holed**: P = pin + (side offset 3, 1.4, 3 back toward the ball), T = pin (cup at heightAt(pin)).
  - **card / final**: slow orbit of the green: P = green + (cos(t * 0.15) * 30, 14, sin(t * 0.15) * 30), T = green.
- **Field of view**: 55 in landscape; when `camera.aspect < 1` (portrait) use 70. Call `camera.updateProjectionMatrix()` only when it changes.
- **Sun**: every frame set `ctx.lights.sun.target.position` to the camera's subject (ball, mower or green as above; title: origin) and `ctx.lights.sun.position` = subject + (60, 120, 40). For 'title' and 'intro' also widen the shadow camera (left/right/top/bottom +-300) and narrow it back to +-40 otherwise (call `sun.shadow.camera.updateProjectionMatrix()` on change).
- Use `heightAt` from `./course`.

## Contract
`export function createCameraRig(ctx: Ctx): System` (signature unchanged). Read-only on `state`. It runs after the world, party and ball systems and before controls/hud each frame.

## Done when
- `cd /home/user/lawn-gnome-panic/games/gnome-golf && npx tsc --noEmit -p .` shows no errors in `src/camera.ts`.
- Each phase listed above has its own camera behaviour; the camera never dips under the terrain.

## Out of scope
Every other file. The VIEW toggle button lives in controls.ts (it sets `state.view`).

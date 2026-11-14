Epic: 2 Systems · Issue 2: ball, tracer and aim preview
Depends on: none

## Goal
`src/ball.ts` draws the golf ball (at rest, on its tee, and in flight with a tracer) and, while aiming, the aim line and the landing marker that shows where the selected club will carry.

## Read first
- `games/gnome-golf/src/config.ts`: `GameState`, `ShotResult`, `PHYS` (`ballRadius`), `CLUBS`
- `games/gnome-golf/src/physics.ts`: `previewLanding`, `estimateCarry`
- `games/gnome-golf/src/round.ts`: `currentHole`, `fmtDistance`
- `games/gnome-golf/src/ball.ts` (stub)

## Change
- `games/gnome-golf/src/ball.ts`: implement `createBall(ctx: Ctx): System`.
  1. **Ball**: white `SphereGeometry(PHYS.ballRadius, 16, 12)`, `MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, emissive: 0x333333 })`, castShadow. Position:
     - phase `'flight'`: sample `state.flight.points` at `state.phaseTime / flight.sampleDt` with linear interpolation between neighbouring samples (clamp to the last point), plus `PHYS.ballRadius` on y.
     - phase `'result'`: at `flight.end` (+ radius). If `flight.endLie === 'water'` or `flight.holed`, hide the ball.
     - `'holed'`: hidden. `'drive'`: at `state.ball` (+ radius) (the drop point after water is already in `state.ball`). Every other phase: at `state.ball` (+ radius), plus 0.06 more when `state.lie === 'tee'`.
  2. **Tee peg**: a small white cylinder (r 0.015, h 0.06) under the ball only while `state.lie === 'tee'` and phase is 'intro', 'aim' or 'swing'.
  3. **Ball marker for far views**: a small white `Sprite` (CanvasTexture of a white dot with a dark outline, 32px), `sizeAttenuation: false`, scale 0.012, `depthTest: false`, at the ball position, visible in 'flight' and 'result' so the ball can be followed when tiny.
  4. **Tracer**: a `THREE.Line` with a `BufferGeometry` of all `flight.points` (rebuild when `state.flight` changes identity), `LineBasicMaterial({ color: 0xfff6a0, transparent: true, opacity: 0.85 })`. In 'flight' show only the part flown so far: `geometry.setDrawRange(0, sampleIndex + 1)`. In 'result' show it all and fade opacity to 0 over `ROUND.resultSeconds`. Hidden in every other phase.
  5. **Aim preview** (phases 'aim' and 'swing' only):
     - Landing point `L = previewLanding(state.ball, state.club, state.lie, state.aimYaw, currentHole(state).pin)`. Recompute only when the key `${ball.x},${ball.z},${club},${lie},${aimYaw.toFixed(3)}` changes.
     - A dotted aim line from the ball to L: 40 small flat discs (`CircleGeometry(0.12)` lying flat, white, opacity 0.7) placed evenly along the straight line, each at `heightAt + 0.05`. For full swings also raise them along a gentle arc (y offset `4 * apexish * s * (1 - s)` with apexish = 0.08 * distance, capped at 18) so it reads as a flight arc. Putter: flat on the ground, no arc.
     - A landing ring at L: `RingGeometry(r * 0.8, r, 48)` lying flat at `heightAt(L) + 0.06`, `MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthTest: false })`, with r = max(0.6, distance * 0.025). Pulse its scale (1 + 0.06 sin(4t)).
     - A label sprite above the ring (CanvasTexture text, e.g. `"138 yd"` = `fmtDistance(distance from ball to L, state.lie)`), `sizeAttenuation: false`, so the player sees the club's range right on the course. Redraw the canvas only when the text changes.
     - For the putter (club 'PT') the ring is where a full-power putt stops (that is what previewLanding returns for it).
- Use `heightAt` from `./course` for ground heights.

## Contract
`export function createBall(ctx: Ctx): System` (signature unchanged). Read-only on `state`.

## Done when
- `cd /home/user/lawn-gnome-panic/games/gnome-golf && npx tsc --noEmit -p .` shows no errors in `src/ball.ts`.
- In 'aim' a dotted line and ring with a yardage label appear in front of the ball; changing `state.club` moves the ring to that club's carry.

## Out of scope
Every other file. The flag, cup and course are world.ts. The camera is camera.ts.

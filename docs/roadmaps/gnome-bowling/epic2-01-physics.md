Epic: 2 (systems, all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gnome-bowling/_common.md` first (environment, rules, world conventions). Other workers edit other files at the same time.

## Goal
`src/physics.ts` simulates a whole bowling throw up front: ball skid and hook, gutters, ball-pin and pin-pin collisions, pins wobbling, toppling, sliding and dropping into the pit, so that a well-thrown pocket ball gives a satisfying strike most of the time.

## Read first
- `games/gnome-bowling/src/config.ts`: `LANE`, `BALL`, `PIN`, `PIN_SPOTS`, `THROW`, `ThrowInput`, `PinSample`, `BallSample`, `SimEvent`, `SimResult` (field comments are the contract)
- `games/gnome-bowling/src/physics.ts`: the stub (keep its signature)

## Change
- `games/gnome-bowling/src/physics.ts`: replace the body of `simulateThrow(input, standing)`. Pure, deterministic, no `Math.random` (if you want variety, use a tiny seeded PRNG seeded from the input numbers). No three.js import needed; plain numbers.
- `games/gnome-bowling/src/physics.test.ts` (new): vitest checks listed under Done when.

## Model (2D top-down on the lane plane, plus cosmetic height/tilt)
- Fixed step `STEP = 1/240` s; record a sample every 4 steps (`sampleDt = 1/60`). Sample 0 is the moment of release.
- Ball starts at `(input.x, BALL.releaseZ)`, velocity `input.speed * (sin(aim), cos(aim))`, `y = BALL.radius`. Roll angle advances by distance / radius.
- Hook: while `z > LANE.oilEnd` and the ball is on the lane, sideways acceleration `ax = input.spin * THROW.hookAccel * ramp`, where `ramp` goes 0→1 over the first 2 m past oilEnd. Small rolling drag (speed loses ~4% over the lane).
- Gutter: if the ball centre's |x| goes past `LANE.halfWidth` before the pin deck (z < LANE.length - 0.3), it drops into the gutter: x snaps to `±(LANE.halfWidth + LANE.gutterWidth / 2)`, y eases down to `BALL.radius - LANE.gutterDepth`, sideways velocity 0, emit `{kind:'gutter'}` once, `gutter = true`. A gutter ball never touches pins.
- Pit: once the ball's z passes `LANE.length + LANE.deckPastHeadPin` it drops (y falls to -LANE.pitDepth) and stops being simulated; emit `'pit'`.
- Pins: only pins with `standing[p] === true` exist; others stay at their spot with `y = -1` for every sample (the view hides them). Each live pin: position, velocity, `tilt` (0 upright), `tiltDir`, `tiltVel`, state 'standing' | 'falling' | 'down'. Collision radius `PIN.radius` standing; a lying pin collides as a circle of radius 0.09 centred at its middle (base + (PIN.height/2) along tiltDir).
- Ball-pin and pin-pin contacts: circle vs circle, resolve overlap by mass, impulse with restitution 0.6 along the normal (ball mass `BALL.mass`, pin `PIN.mass`). The ball loses only its share of momentum (it should keep driving through the rack: a 7 m/s ball should still be moving ~5 m/s after the head pin). Emit `'ballPin'` / `'pinPin'` events with `strength = clamp(impulseSpeed / 6, 0, 1)` and the pin index (at most one event per pair per 0.1 s).
- Toppling: when a standing pin receives a contact with relative speed > 1.0 m/s it starts 'falling' with `tiltDir = atan2(vx, vz)` of its new velocity; tilt accelerates (`tiltVel += 14 * dt`, like gravity) until `tilt = PI/2`, then it is 'down', emit `'pinFall'`. Speed between 0.35 and 1.0 m/s: a wobble (tilt rises to ≤ 0.25 rad and swings back to 0, the pin stays standing) unless the wobble is pushed again. Below 0.35: just slides a little.
- Pin motion: velocity with friction (decelerate 3 m/s² standing, 2 m/s² lying); lying pins spin (`spin += speed * dt * 8`). A pin whose base leaves the deck (z > `LANE.length + LANE.deckPastHeadPin`, or |x| > `LANE.halfWidth + 0.05`) drops: y eases down to -0.4 and it counts as down.
- Down at the end: `down[p] = standing[p] && (state !== 'standing' || it left the deck)`.
- End: stop when the ball is gone (pit or gutter end) AND every pin speed < 0.05 and no pin is falling/wobbling, or at 6 s after release. Then add 0.5 s of still samples. `duration = (samples - 1) * sampleDt`. `reachPinsAt` = first time the ball's z ≥ `LANE.length - 0.3` (or when it reaches the pit for a gutter ball).
- Events: first event `{t: 0, kind: 'release', strength: 1, pin: -1}`, all in time order.

## Tuning target (check it with the test)
Right-handed pocket: `{x: -0.28, aim: 0.035, speed: 7.5, spin: 0.6}` should hit between pins 1 and 3 and knock all 10 (it is fine to adjust the hook constants in a local const, or pick a different pocket input for the test, as long as some sensible input strikes). Dead-straight centre at 9 m/s (`{x: 0, aim: 0, speed: 9, spin: 0}`) should knock most pins but often leave some (e.g. 8 or 9). `{x: 0.4, aim: 0.12, ...}` must go in the gutter.

## Contract
`export function simulateThrow(input: ThrowInput, standing: readonly boolean[]): SimResult` exactly as the stub. Every `pins[p]` array has the same length as `ball`.

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` shows no errors in physics.ts / physics.test.ts
- `cd games/gnome-bowling && npx vitest run src/physics.test.ts` passes, with tests: (a) some pocket input knocks all 10 from a full rack; (b) the gutter input sets `gutter = true` and `down` all false; (c) same input twice gives identical `down` and identical last ball sample (determinism); (d) with only pins 7 and 10 standing (`standing` true at index 6 and 9 only), `down` is false for all pins not standing; (e) `pins[p].length === ball.length` for all p; (f) a straight centre ball at 9 m/s knocks at least 5.
- It runs fast: one simulation under 30 ms.

## Out of scope
Every other file. Rendering (pins.ts) and sound read your SimResult; do not touch them.

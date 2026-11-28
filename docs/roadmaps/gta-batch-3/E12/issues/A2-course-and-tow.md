Epic: E12-A (winter sports, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E12/issues/_env.md` first (environment, rules).

## Goal
Two small pure modules work and are tested: `winter/course.ts` (a timed run with a start line, slalom gates and a finish
line) and `winter/tow.ts` (the Bootlace Tow: a rope tow that pulls a rider along a straight line from its base to its top,
plus the positions of the handles going round the rope loop, for drawing).

## Read first
- `games/gnome-theft-auto/src/winter/types.ts`: `Gate`, `RunDef`, `WOOL_RUN`, `TEA_TRAY_RUN`, `RunState`, `RunEvent`,
  `RunResult`, `TOW`, `TowRide`. The contract; never edit it.
- `games/gnome-theft-auto/src/winter/course.ts` and `games/gnome-theft-auto/src/winter/tow.ts`: the stubs (keep every
  exported signature).

## Change
- `src/winter/course.ts`:
  - `newRun(run)`: `{ run, phase: 'ready', t: 0, next: 0, passed: 0, missed: 0 }` (as the stub).
  - `stepRun(r, px, pz, x, z, dt): RunEvent`: the rider moved from (px, pz) to (x, z).
    - 'ready': if the move crosses the start line southward (pz < start.z <= z) and the crossing point's x (interpolate
      between px and x at z = start.z) is within `start.half` of `start.x`: phase 'running', t = 0, next = 0, return
      `{ t: 'start' }`. Otherwise null.
    - 'running': t += dt. Then, for the next gate g (while one is left): if the move crosses z = g.z southward: ok =
      |crossX - g.x| <= g.half; ok ? passed++ : missed++; next++; return `{ t: 'gate', index, ok }` (one gate per call is
      enough; a later call handles the next). Then the finish: crossing z = finish.z southward with |crossX - finish.x| <=
      finish.half: any gates still not passed count as missed; phase 'done'; seconds = t + missed * run.penalty; return
      `{ t: 'finish', result: { id: run.id, seconds, missed, clean: missed === 0 } }`. Crossing the finish z outside its
      half-width does nothing. Crossing northward never counts.
    - 'done': null.
  - `formatTime(seconds)`: `m:ss.t`, e.g. 31.44 -> "0:31.4", 75 -> "1:15.0", 0 -> "0:00.0".
- `src/winter/tow.ts`, using `TOW` (base, top, speed, grabRange, grabSpeed, handles):
  - Line length `len = hypot(top - base)`; direction unit vector u; `yaw = atan2(u.x, u.z)`.
  - `canGrab(x, z, speed)`: distance to `TOW.base` <= grabRange and speed < grabSpeed.
  - `startTow()`: `{ s: 0, len, done: false }`.
  - `stepTow(t, dt)`: s = min(len, s + TOW.speed * dt); done when s >= len.
  - `towPoint(s)`: base + u * clamp(s, 0, len), with the line's yaw.
  - `handlePositions(t, n)`: the rope is a loop: up the line (from base to top) and back down a parallel return line
    offset 0.8 m to the line's right (perpendicular (-u.z, u.x) times -0.8... pick one side and pin it in the test). The
    loop length is 2 * len; handle k sits at loop distance ((t * TOW.speed) + k * 2 * len / n) mod (2 * len): the first
    `len` metres are the up line (base -> top), the rest the return line (top -> base). Return n points `{ x, z }`.
- New `src/winter/course.test.ts` and `src/winter/tow.test.ts` (vitest):
  - Course with `WOOL_RUN`: a straight path down x = -362.5 does not start if it crosses the start line outside it (try
    x = -400 for the start: |−400 − (−350)| = 50 > 12, no start). A slalom path through every gate centre (x = gate.x at
    each gate z, with steps of 1 m in z from -1260 to -1040 and dt 0.05 per step) gives `start`, 6 ok `gate` events and
    a `finish` with clean true, missed 0, seconds ≈ the summed dt after the start. A straight path at x = -362.5 misses
    every gate (each is 12.5 away from its centre, > 3.5): `finish` with missed 6 and seconds = t + 18. With
    `TEA_TRAY_RUN` (no gates) a straight path at x = -405 starts and finishes clean.
  - Moving north across a line never triggers anything; crossing the finish outside its half-width does not finish.
  - `formatTime` examples above.
  - Tow: `canGrab` true at the base at speed 2, false at speed 9 or 10 m away; a ride reaches `done` after about
    len / TOW.speed seconds (within one step of dt 0.1); `towPoint(0)` is the base and `towPoint(len)` the top (within
    1e-6); `handlePositions(0, TOW.handles)` returns 24 points, all within 1 m of either the up line or the return line;
    at t = 1 the first handle moved TOW.speed metres along the loop.

## Contract
Exported names and signatures exactly as in the two stubs. Pure: imports only from `./types`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/winter/course.test.ts src/winter/tow.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your four files.

## Out of scope
Every other file (`winter/types.ts`, `winter/runtime.ts`, `winter/hill.ts` belong to others).

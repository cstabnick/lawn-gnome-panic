Epic: E12-A (winter sports, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): movement physics

Read `docs/roadmaps/gta-batch-3/E12/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/winter/slideRider.ts` is a working, pure slide-physics body shared by skis and the tea-tray
sled: gravity along the slope of a heightfield, carving, snowplough brake, pole push, hops, ballistic flight off lips,
landing (with a bounce for the sled), spins in the air, wall-free (walls are the runtime's job). With tests.

## Read first
- `games/gnome-theft-auto/src/winter/types.ts`: `SlideGround`, `SlideInput`, `SlideState`, `SlideEvent`, `SlideTuning`,
  `SKI`, `SLED`. This is the contract; match it exactly.
- `games/gnome-theft-auto/src/winter/slideRider.ts`: the stub with the three exported functions you fill in.
- `games/gnome-theft-auto/src/tubing/tow.ts` (skim it): the house style of a pure step function with tests.

## Change
- `src/winter/slideRider.ts`: keep the exported signatures `newSlide(x, z, yaw, ground)`, `stepSlide(s, inp, ground,
  tune, dt): SlideEvent`, `slideSpeed(s)`. Behaviour of `stepSlide`:
  - Sub-step: split `dt` into `n = ceil(dt / tune.maxStep)` equal steps (cap n at 8; a dt of 0 or less does nothing).
    The returned event is the most important one of the sub-steps (`landed` > `crash` > `jumped`).
  - Ground normal: sample `ground.height` at (x ± probe, z) and (x, z ± probe); gradient gx = (h(x+p) - h(x-p)) / 2p,
    gz likewise; measured normal = normalize(-gx, 1, -gz). Ease `s.nx/ny/nz` toward it with factor
    `1 - exp(-normalRate * h)` (h = sub-step) and renormalize. Use the measured gradient (not the eased normal) for forces.
  - On the ground (`s.grounded`):
    - Gravity along the slope: horizontal acceleration a = -gravity * (gx, gz) / (1 + gx² + gz²).
    - Friction: mu = muSnow | muIce | muOther by `ground.surface(x, z)` plus `brakeMu * inp.brake`; decelerate the
      horizontal velocity by `mu * gravity / sqrt(1 + gx² + gz²)` toward zero (never past zero: clamp so it stops, and
      when speed < 0.05 and the slope pull is smaller than the friction, the rider stays still).
    - Drag: v -= drag * |v| * v * h.
    - Push: if `inp.push > 0` and horizontal speed < pushMax, add `pushAccel * push` along the heading (sin yaw, cos yaw).
    - Carve: yaw += steer * carve * min(1, speed / carveSpeed) * h. Positive steer turns right. In this game's
      coordinates "right" while facing yaw is the direction (-cos yaw, sin yaw)... so turning right DECREASES yaw. Pin it
      with a test: facing +z (yaw 0) with steer +1 and some speed, x must become negative (the rider curves toward -x).
    - Grip: split the horizontal velocity into the heading part f = v·(sin yaw, cos yaw) and the side part; keep f, scale
      the side part by exp(-grip * h). If f < 0 (sliding backwards), turn the heading round smoothly toward the velocity
      (yaw eases toward atan2(vx, vz) at 3 rad/s) instead of reversing; a rider never brakes into reverse.
    - Move x, z by v * h; y = ground height there; vy = the slope's vertical rate (vx * gx + vz * gz).
    - Take-off: after moving, if the ground ahead fell away faster than the rider's vertical speed can follow (the new
      ground height is more than 0.15 m below `y_prev + vy_prev * h`, i.e. a lip), switch to the air with vy = vy_prev.
    - Jump: `inp.jump` on the ground: vy = jumpV, grounded = false, air = 0, spin = 0, event `jumped`.
  - In the air: vy -= gravity * h; x, y, z += v * h; drag as above; steer spins: yaw += steer * airSpin * h and
    `spin += |that|`; air += h. When y <= ground height: land. impact = max(0, ground vertical rate - vy) (how hard it
    came down); y = ground; if tune.bounce > 0 and impact > bounceMin: vy = impact * bounce and stay in the air (a sled
    hop), else grounded = true, vy = slope rate. Event `landed` with `air` (seconds), `spins` = floor((spin + 0.6) /
    (2π)) and `impact`; reset air and spin on a real landing (not on a bounce).
  - Lean: s.lean eases toward steer at 6/s.
  - Clamp the speed (3D) to tune.maxSpeed. No NaN ever: guard every divide.
  - `crash` is reported by the runtime's wall code, not here (leave the event type unused in this file).
- New `src/winter/slideRider.test.ts` (vitest, pure, no DOM), using small fake grounds:
  - Flat snow plane: standing still stays still for 5 s (no drift); a 10 m/s start slows down and stops in the
    friction distance within 20% of v² / (2 * muSnow * gravity), never reverses.
  - Inclined plane h = -0.2 * z (falls toward +z) on snow: from rest facing +z the rider speeds up; after 5 s the speed is
    within 25% of the analytic value with friction and drag ignored to first order (check it is > 8 m/s and < 18 m/s);
    the rider stays within 0.05 m of the surface the whole time.
  - The same plane with brake 1 is slower after 5 s than with brake 0.
  - Carve: facing +z on the plane, steer +1 for 1 s curves toward -x; steer -1 toward +x.
  - Surface 'other': a 10 m/s rider on 'other' ground stops within 12 m.
  - A lip: plane h = -0.2 z for z < 0 then h = -4 - 0.6 (z) for z >= 0 (a drop); at 15 m/s the rider leaves the ground
    (grounded false for a while), and `landed` is reported with air > 0.2 s.
  - A bump with SLED tuning: a rider hitting a 0.6 m half-sine bump at 10 m/s on a gentle slope gets at least one frame
    in the air after the bump top (bounce or lip), and lands.
  - Jump: on flat ground `jump: true` gives vy == jumpV and grounded false, then a `landed` event within 1 s; with steer 1
    in the air for a 1.2 s hop with `airSpin` large enough, `spins` >= 1.
  - Speed clamp: on a 45° plane for 30 s the speed never passes maxSpeed + 0.01.
  - Sub-steps: one call with dt 0.1 gives nearly the same state (within 2%) as ten calls with dt 0.01 on the inclined plane.

## Contract
`newSlide`, `stepSlide`, `slideSpeed` exactly as in the stub. Units: metres, seconds, radians. Pure: no imports except
`./types`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/winter/slideRider.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/winter/slideRider*.ts`.

## Out of scope
Every other file, including `winter/types.ts` (report a needed change instead) and `winter/runtime.ts`.

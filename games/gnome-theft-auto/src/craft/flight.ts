// The air regime of the handling model: one pure step for fixed-wing, rotor and buoyant craft.
// Pure: no DOM, no three.js, no game imports (only ./model). Design: docs/roadmaps/gta-air-and-sea.md.
import type { AirBody, AirControls, AirEnv, AirSpec, AirState, AirStepResult } from './model';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const finiteOr0 = (v: number): number => (Number.isFinite(v) ? v : 0);

function zeroResult(): AirStepResult {
  return { touchdownSpeed: 0, damage: 0, liftedOff: false, stallStarted: false };
}

/** A fresh, parked flight state. */
export function initAir(): AirState {
  return { pitch: 0, roll: 0, airborne: false, stalled: false };
}

/** One step of an aircraft. Mutates `body` (x, y, z, yaw, speed, vy) and `st`. Pure: no DOM, no three.js, no game imports. */
export function stepAir(
  body: AirBody, st: AirState, spec: AirSpec, c: AirControls, env: AirEnv, dt: number,
): AirStepResult {
  if (!(dt > 0)) return zeroResult();
  dt = Math.min(dt, 0.1);

  const wasAir = st.airborne;
  const wasStalled = st.stalled;
  const saved = {
    x: body.x, y: body.y, z: body.z, yaw: body.yaw, speed: body.speed, vy: body.vy, pitch: st.pitch, roll: st.roll,
  };

  const regime = spec.regime;
  const floor = env.floorY;
  const ceil = Math.max(spec.ceiling, floor + 5);
  const onFloor = body.y - floor <= 0.05;
  const throttle = c.powered ? c.throttle : 0;
  const lift = c.powered ? c.lift : 0;
  const ease = (rate: number): number => Math.min(1, rate * dt);
  const stall = spec.stallSpeed ?? 0.4 * spec.maxSpeed;
  const rev = spec.reverseFrac ?? 0.3;

  let x = body.x;
  let y = body.y;
  let z = body.z;
  let yaw = body.yaw;
  let speed = body.speed;
  let vy = body.vy;

  if (regime === 'fixed-wing') {
    // Speed: planes never reverse.
    if (throttle > 0) speed = Math.min(spec.maxSpeed, speed + spec.thrust * throttle * dt);
    else if (throttle < 0) speed = Math.max(0, speed - (onFloor ? 1.5 : 0.8) * spec.thrust * -throttle * dt);
    else speed *= Math.pow(onFloor ? (env.water ? 0.3 : 0.5) : spec.drag, dt);
    speed = Math.max(0, speed);

    // Vertical: needs airspeed to climb; below stall in the air the nose drops.
    const auth = clamp01((speed - 0.7 * stall) / (0.3 * stall));
    let target = lift > 0 ? lift * spec.climbRate * auth : (lift < 0 && !onFloor) ? lift * spec.climbRate : 0;
    if (onFloor && speed < stall) target = 0;
    if (!onFloor && speed < stall) target = Math.min(target, -spec.sinkRate * (1 - speed / stall));
    if (!onFloor && !c.powered) target = -spec.sinkRate * 0.6;
    vy += (target - vy) * ease(spec.climbResponse);

    // Yaw: rudder authority needs airspeed (on the ground a plane taxis slowly).
    const gate = onFloor ? clamp01(speed / 3) * 0.6 : clamp01(speed / stall);
    yaw -= c.steer * spec.turnRate * gate * dt;
  } else {
    // rotor and buoyant share the same maths; the balloon only yaws in the air and under power.
    let target = c.powered ? lift * spec.climbRate : -spec.sinkRate;
    if (c.powered && onFloor && target < 0) target = 0;
    vy += (target - vy) * ease(spec.climbResponse);

    if (!onFloor) {
      if (c.powered) {
        const want = throttle >= 0 ? throttle * spec.maxSpeed : throttle * spec.maxSpeed * rev;
        const d = want - speed;
        speed += Math.max(-spec.thrust * dt, Math.min(spec.thrust * dt, d));
      } else {
        speed *= Math.pow(spec.drag, dt);
      }
    } else {
      speed *= Math.pow(0.2, dt);
    }

    if (c.powered && (regime === 'rotor' || !onFloor)) yaw -= c.steer * spec.turnRate * dt;
  }

  // Integrate. The ceiling caps the climb; the floor catches the fall and counts the touchdown.
  y += vy * dt;
  if (y > ceil) {
    y = ceil;
    vy = Math.min(vy, 0);
  }
  let touchdownSpeed = 0;
  let damage = 0;
  if (y <= floor) {
    if (wasAir || vy < -0.5) {
      touchdownSpeed = Math.max(0, -vy);
      damage = Math.max(0, touchdownSpeed - spec.safeTouchdown) * spec.touchdownDamage;
      if (regime === 'fixed-wing' && touchdownSpeed > spec.safeTouchdown) speed *= 0.4;
    }
    y = floor;
    vy = 0;
  }
  x += Math.sin(yaw) * speed * dt;
  z += Math.cos(yaw) * speed * dt;

  // Flags.
  st.airborne = y - floor > 0.05;
  st.stalled = regime === 'fixed-wing' && st.airborne && speed < stall;
  const liftedOff = !wasAir && st.airborne;
  const stallStarted = !wasStalled && st.stalled;

  // Attitude: bank into the steer, pitch with the climb (or the cyclic / the nose-up of a plane).
  const k = regime === 'fixed-wing'
    ? clamp01(speed / stall)
    : regime === 'rotor' ? Math.min(1, 0.3 + Math.abs(speed) / spec.maxSpeed) : 0.2;
  const rollTarget = st.airborne ? c.steer * spec.bankMax * k : 0;
  let pitchTarget = 0;
  if (st.airborne) {
    if (regime === 'fixed-wing') {
      pitchTarget = Math.max(-spec.pitchMax, Math.min(spec.pitchMax, Math.atan2(vy, Math.max(speed, 1))));
    } else if (regime === 'rotor') {
      pitchTarget = -throttle * spec.pitchMax;
    }
  }
  const roll = st.roll + (rollTarget - st.roll) * ease(4);
  const pitch = st.pitch + (pitchTarget - st.pitch) * ease(4);

  // NaN guard: a bad input must not poison the vehicle. Restore the start of the step and stop it.
  if (![x, y, z, yaw, speed, vy, pitch, roll].every(Number.isFinite)) {
    body.x = finiteOr0(saved.x);
    body.y = finiteOr0(saved.y);
    body.z = finiteOr0(saved.z);
    body.yaw = finiteOr0(saved.yaw);
    body.speed = 0;
    body.vy = 0;
    st.pitch = 0;
    st.roll = 0;
    return zeroResult();
  }

  body.x = x;
  body.y = y;
  body.z = z;
  body.yaw = yaw;
  body.speed = speed;
  body.vy = vy;
  st.pitch = pitch;
  st.roll = roll;
  return { touchdownSpeed, damage, liftedOff, stallStarted };
}

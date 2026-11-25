// Winter sports (E12): the slide rider, one kinematic body for skis and the tea-tray sled on a heightfield. Pure: no
// three.js, no DOM. Gravity along the slope, carving, snowplough, pole push, hops, flight off lips, landing (the sled
// bounces). Walls and crashes are the runtime's job.
import type { SlideEvent, SlideGround, SlideInput, SlideState, SlideTuning } from './types';

const TAU = Math.PI * 2;

/** A rider standing still at (x, z) on the ground, facing yaw. */
export function newSlide(x: number, z: number, yaw: number, ground: SlideGround): SlideState {
  return { x, y: ground.height(x, z), z, vx: 0, vy: 0, vz: 0, yaw, grounded: true, air: 0, lean: 0, spin: 0, nx: 0, ny: 1, nz: 0 };
}

/** Event priority: landed > crash > jumped. */
function rank(e: SlideEvent): number {
  return e === null ? 0 : e.t === 'landed' ? 3 : e.t === 'crash' ? 2 : 1;
}

/** Shortest signed angle from a to b. */
function angleDiff(a: number, b: number): number {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  else if (d < -Math.PI) d += TAU;
  return d;
}

/** Advance `s` by dt seconds (sub-stepped at tune.maxStep). Returns the step's event, or null. */
export function stepSlide(s: SlideState, inp: SlideInput, ground: SlideGround, tune: SlideTuning, dt: number): SlideEvent {
  if (!(dt > 0)) return null;
  const n = Math.min(8, Math.max(1, Math.ceil(dt / tune.maxStep)));
  const h = dt / n;
  let best: SlideEvent = null;
  for (let i = 0; i < n; i++) {
    const e = subStep(s, i === 0 ? inp : { ...inp, jump: false }, ground, tune, h);
    if (rank(e) > rank(best)) best = e;
  }
  return best;
}

function subStep(s: SlideState, inp: SlideInput, ground: SlideGround, tune: SlideTuning, h: number): SlideEvent {
  const p = tune.probe > 0 ? tune.probe : 0.5;
  const steer = Math.max(-1, Math.min(1, inp.steer || 0));
  const brake = Math.max(0, Math.min(1, inp.brake || 0));
  const push = Math.max(0, Math.min(1, inp.push || 0));

  // Measured ground gradient and the eased normal
  const gx = (ground.height(s.x + p, s.z) - ground.height(s.x - p, s.z)) / (2 * p);
  const gz = (ground.height(s.x, s.z + p) - ground.height(s.x, s.z - p)) / (2 * p);
  const nl = Math.hypot(gx, 1, gz);
  const k = 1 - Math.exp(-tune.normalRate * h);
  let nx = s.nx + (-gx / nl - s.nx) * k;
  let ny = s.ny + (1 / nl - s.ny) * k;
  let nz = s.nz + (-gz / nl - s.nz) * k;
  const nn = Math.hypot(nx, ny, nz);
  if (nn > 1e-6) { nx /= nn; ny /= nn; nz /= nn; } else { nx = 0; ny = 1; nz = 0; }
  s.nx = nx; s.ny = ny; s.nz = nz;

  s.lean += (steer - s.lean) * Math.min(1, 6 * h);

  let event: SlideEvent = null;

  if (s.grounded) {
    if (inp.jump) {
      s.vy = tune.jumpV;
      s.grounded = false;
      s.air = 0;
      s.spin = 0;
      return { t: 'jumped' };
    }
    const slope2 = 1 + gx * gx + gz * gz;
    const slopeLen = Math.sqrt(slope2);

    // Slope pull
    s.vx += (-tune.gravity * gx / slope2) * h;
    s.vz += (-tune.gravity * gz / slope2) * h;

    // Friction toward zero, never past it
    const surf = ground.surface(s.x, s.z);
    const mu = (surf === 'ice' ? tune.muIce : surf === 'other' ? tune.muOther : tune.muSnow) + tune.brakeMu * brake;
    const sp = Math.hypot(s.vx, s.vz);
    const fr = (mu * tune.gravity / slopeLen) * h;
    if (sp > 1e-9) {
      const ns = Math.max(0, sp - fr);
      const f = ns / sp;
      s.vx *= f; s.vz *= f;
    }

    // Drag
    const sp2 = Math.hypot(s.vx, s.vz);
    const dk = Math.max(0, 1 - tune.drag * sp2 * h);
    s.vx *= dk; s.vz *= dk;

    // Push along the heading
    const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw);
    if (push > 0 && Math.hypot(s.vx, s.vz) < tune.pushMax) {
      s.vx += fx * tune.pushAccel * push * h;
      s.vz += fz * tune.pushAccel * push * h;
    }

    // Carve: positive steer turns right, which lowers yaw in these coordinates
    const sp3 = Math.hypot(s.vx, s.vz);
    const cs = tune.carveSpeed > 0 ? Math.min(1, sp3 / tune.carveSpeed) : 1;
    s.yaw -= steer * tune.carve * cs * h;

    // Grip: keep the heading part, bleed the side part
    const hx = Math.sin(s.yaw), hz = Math.cos(s.yaw);
    const f = s.vx * hx + s.vz * hz;
    const sx = s.vx - f * hx, sz = s.vz - f * hz;
    const g = Math.exp(-tune.grip * h);
    s.vx = f * hx + sx * g;
    s.vz = f * hz + sz * g;
    if (f < 0 && sp3 > 1e-3) {
      s.yaw += angleDiff(s.yaw, Math.atan2(s.vx, s.vz)) * Math.min(1, 3 * h);
    }

    // Move along the ground
    const py = s.y + s.vy * h;
    s.x += s.vx * h;
    s.z += s.vz * h;
    const gy = ground.height(s.x, s.z);
    if (gy < py - 0.15) {
      // A lip: the ground fell away faster than the rider can follow
      s.grounded = false;
      s.air = 0;
      s.spin = 0;
      s.y = py;
    } else {
      // The measured rise rate (the probed gradient overshoots right at a cliff edge)
      s.vy = (gy - s.y) / h;
      s.y = gy;
    }
  } else {
    // Ballistic flight
    s.vy -= tune.gravity * h;
    const sp = Math.hypot(s.vx, s.vy, s.vz);
    const dk = Math.max(0, 1 - tune.drag * sp * h);
    s.vx *= dk; s.vy *= dk; s.vz *= dk;
    s.x += s.vx * h;
    s.y += s.vy * h;
    s.z += s.vz * h;
    const dy = steer * tune.airSpin * h;
    s.yaw -= dy;
    s.spin += Math.abs(dy);
    s.air += h;

    const gy = ground.height(s.x, s.z);
    if (s.y <= gy) {
      const rate = s.vx * gx + s.vz * gz;
      const impact = Math.max(0, rate - s.vy);
      const air = s.air;
      const spins = Math.floor((s.spin + 0.6) / TAU);
      s.y = gy;
      if (tune.bounce > 0 && impact > tune.bounceMin) {
        s.vy = impact * tune.bounce;
      } else {
        s.grounded = true;
        s.vy = rate;
        s.air = 0;
        s.spin = 0;
      }
      event = { t: 'landed', air, spins, impact };
    }
  }

  // Clamp the 3D speed
  const sp3d = Math.hypot(s.vx, s.vy, s.vz);
  if (sp3d > tune.maxSpeed && sp3d > 0) {
    const c = tune.maxSpeed / sp3d;
    s.vx *= c; s.vy *= c; s.vz *= c;
  }
  return event;
}

/** Horizontal speed, m/s. */
export function slideSpeed(s: SlideState): number {
  return Math.hypot(s.vx, s.vz);
}

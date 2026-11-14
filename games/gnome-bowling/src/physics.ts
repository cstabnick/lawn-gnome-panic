// Simulates a whole bowling throw up front: ball skid and hook, gutters, ball-pin and pin-pin contacts,
// pins wobbling, toppling, sliding and dropping off the deck. Pure and deterministic (no Math.random).
// 2D top-down on the lane plane (x, z), plus cosmetic height (ball and pin y) and pin tilt.
import { BALL, LANE, PIN, PIN_SPOTS, THROW, type BallSample, type PinSample, type SimEvent, type SimResult, type ThrowInput } from './config';

const SAMPLE_DT = 1 / 60;
const SUBSTEPS = 4;
const STEP = SAMPLE_DT / SUBSTEPS; // 1/240 s
const TIME_LIMIT = 6; // seconds after release
const STILL_SECONDS = 0.5;

const HOOK_RAMP = 2; // metres past oilEnd to reach the full hook
const DRAG = 0.04; // fraction of speed lost over the whole lane
const RESTITUTION = 0.72;
const GRAVITY = 9.8;
const FRICTION_STANDING = 3; // m/s^2
const FRICTION_LYING = 2; // m/s^2
const TOPPLE_SPEED = 0.7; // m/s of contact to knock a standing pin over
const WOBBLE_SPEED = 0.35; // m/s of contact to make a standing pin wobble
const TOPPLE_ACCEL = 14; // rad/s^2 of the fall
const WOBBLE_MAX = 0.25; // rad
const WOBBLE_STIFFNESS = 60;
const WOBBLE_DAMPING = 8;
const LYING_RADIUS = 0.05;
/** How much a falling pin's sweep counts in pin-pin hits (pins knock their neighbours as they topple). */
const SWEEP_GAIN = 1.5;
const DROP_Y = -0.4;
const EVENT_GAP = 0.1; // s between repeated contact events for one pair
const GUTTER_Z = LANE.length - 0.3;
const DECK_END_Z = LANE.length + LANE.deckPastHeadPin;
const SIDE_LIMIT = LANE.halfWidth + 0.05;
/** Side walls (kickbacks) beside the pin deck, at the outer edge of the gutters: pins bounce back into the rack. */
const KICKBACK_X = LANE.halfWidth + LANE.gutterWidth;
const KICKBACK_FROM_Z = LANE.length - 0.4;
const KICKBACK_BOUNCE = 0.8;
/** The ball counts this many times heavier in collisions, so it drives through the rack instead of deflecting (arcade). */
const BALL_DRIVE = 2.2;
const GUTTER_X = LANE.halfWidth + LANE.gutterWidth / 2;
const HALF_PIN = PIN.height / 2;
const HALF_PI = Math.PI / 2;

type PinState = 'standing' | 'falling' | 'down';
type BallMode = 'roll' | 'gutter' | 'pit';

interface SimPin {
  /** Was standing at the start. Others never move and stay hidden. */
  active: boolean;
  x: number;
  z: number;
  vx: number;
  vz: number;
  y: number;
  tilt: number;
  tiltVel: number;
  tiltDir: number;
  spin: number;
  state: PinState;
  /** Left the deck or lane: no more contacts, it sinks. */
  dropped: boolean;
  /** Contact speed that made it fall (for the sound of the fall). */
  hitSpeed: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** A pin's collision shape: a capsule from its base to its head as it lies (a point when upright). */
interface Capsule {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  r: number;
}

/** Closest point on a capsule's segment to (px, pz); s = 0 at the base .. 1 at the head. */
interface SegPoint {
  x: number;
  z: number;
  s: number;
}

function pinCapsule(pin: SimPin): Capsule {
  const f = Math.sin(pin.tilt);
  const len = PIN.height * f;
  return {
    ax: pin.x,
    az: pin.z,
    bx: pin.x + len * Math.sin(pin.tiltDir),
    bz: pin.z + len * Math.cos(pin.tiltDir),
    r: PIN.radius + (LYING_RADIUS - PIN.radius) * f,
  };
}

function closestOnSeg(px: number, pz: number, c: Capsule): SegPoint {
  const dx = c.bx - c.ax;
  const dz = c.bz - c.az;
  const ll = dx * dx + dz * dz;
  const s = ll < 1e-12 ? 0 : clamp01(((px - c.ax) * dx + (pz - c.az) * dz) / ll);
  return { x: c.ax + dx * s, z: c.az + dz * s, s };
}

/** Closest points between two capsule segments (2D). */
function segSeg(c1: Capsule, c2: Capsule): [SegPoint, SegPoint] {
  // Try the four endpoint projections and keep the closest pair; exact enough for short pin segments
  // unless the segments cross, which the overlap push separates within a step.
  const cands: [SegPoint, SegPoint][] = [];
  const p1 = closestOnSeg(c2.ax, c2.az, c1);
  cands.push([p1, { x: c2.ax, z: c2.az, s: 0 }]);
  const p2 = closestOnSeg(c2.bx, c2.bz, c1);
  cands.push([p2, { x: c2.bx, z: c2.bz, s: 1 }]);
  const q1 = closestOnSeg(c1.ax, c1.az, c2);
  cands.push([{ x: c1.ax, z: c1.az, s: 0 }, q1]);
  const q2 = closestOnSeg(c1.bx, c1.bz, c2);
  cands.push([{ x: c1.bx, z: c1.bz, s: 1 }, q2]);
  let best = cands[0];
  let bestD = Infinity;
  for (const c of cands) {
    const d = (c[0].x - c[1].x) ** 2 + (c[0].z - c[1].z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** Velocity of a point on a pin (s along its body): its slide plus, while falling, the sweep of its body. */
function pointVel(pin: SimPin, s: number): { x: number; z: number } {
  const sweep = pin.state === 'falling' ? pin.tiltVel * Math.cos(pin.tilt) * PIN.height * s * SWEEP_GAIN : 0;
  return { x: pin.vx + sweep * Math.sin(pin.tiltDir), z: pin.vz + sweep * Math.cos(pin.tiltDir) };
}

/** Simulates a whole throw up front. Pure and deterministic: same input + standing = same result. */
export function simulateThrow(input: ThrowInput, standing: readonly boolean[]): SimResult {
  const pins: SimPin[] = PIN_SPOTS.map(([x, z], p) => ({
    active: !!standing[p],
    x,
    z,
    vx: 0,
    vz: 0,
    y: standing[p] ? 0 : -1,
    tilt: 0,
    tiltVel: 0,
    tiltDir: 0,
    spin: 0,
    state: 'standing',
    dropped: false,
    hitSpeed: 0,
  }));

  // Ball state.
  let bx = input.x;
  let bz = BALL.releaseZ;
  let by: number = BALL.radius;
  let bvx = input.speed * Math.sin(input.aim);
  let bvz = input.speed * Math.cos(input.aim);
  let bvy = 0;
  let roll = 0;
  let bMode: BallMode = 'roll';
  let gutter = false;
  let reachPinsAt = -1;

  const ballSamples: BallSample[] = [];
  const pinSamples: PinSample[][] = PIN_SPOTS.map(() => []);
  const events: SimEvent[] = [{ t: 0, kind: 'release', strength: 1, pin: -1 }];
  const emit = (t: number, kind: SimEvent['kind'], strength: number, pin: number) => {
    events.push({ t, kind, strength: clamp01(strength), pin });
  };
  const lastBallPin: number[] = PIN_SPOTS.map(() => -Infinity);
  const lastPinPin: number[][] = PIN_SPOTS.map(() => PIN_SPOTS.map(() => -Infinity));

  const record = () => {
    ballSamples.push({ x: bx, y: by, z: bz, roll });
    pins.forEach((pin, p) => {
      pinSamples[p].push({ x: pin.x, z: pin.z, y: pin.y, tilt: pin.tilt, tiltDir: pin.tiltDir, spin: pin.spin });
    });
  };

  /** A contact has happened: decide whether the pin falls, wobbles, or only slides. */
  const react = (pin: SimPin, impact: number, nx: number, nz: number) => {
    if (pin.state !== 'standing') return;
    if (impact > TOPPLE_SPEED) {
      const sp = Math.hypot(pin.vx, pin.vz);
      pin.tiltDir = sp > 1e-6 ? Math.atan2(pin.vx, pin.vz) : Math.atan2(nx, nz);
      pin.state = 'falling';
      pin.hitSpeed = impact;
    } else if (impact > WOBBLE_SPEED) {
      pin.tiltDir = Math.atan2(nx, nz);
      pin.tiltVel += impact * 2;
    }
  };

  /** Ball against live pins. Only while the ball is on the lane. */
  const collideBallPins = (t: number) => {
    if (bMode !== 'roll') return;
    const invB = 1 / (BALL.mass * BALL_DRIVE);
    const invP = 1 / PIN.mass;
    const invSum = invB + invP;
    for (let p = 0; p < pins.length; p++) {
      const pin = pins[p];
      if (!pin.active || pin.dropped) continue;
      const c = pinCapsule(pin);
      const q = closestOnSeg(bx, bz, c);
      const dx = q.x - bx;
      const dz = q.z - bz;
      const d = Math.hypot(dx, dz);
      const minD = BALL.radius + c.r;
      if (d >= minD || d < 1e-9) continue;
      const nx = dx / d;
      const nz = dz / d;
      const overlap = minD - d;
      bx -= (nx * overlap * invB) / invSum;
      bz -= (nz * overlap * invB) / invSum;
      pin.x += (nx * overlap * invP) / invSum;
      pin.z += (nz * overlap * invP) / invSum;
      const pv = pointVel(pin, q.s);
      const vrel = (pv.x - bvx) * nx + (pv.z - bvz) * nz;
      if (vrel >= 0) continue;
      const impact = -vrel;
      const j = (-(1 + RESTITUTION) * vrel) / invSum;
      bvx -= j * invB * nx;
      bvz -= j * invB * nz;
      pin.vx += j * invP * nx;
      pin.vz += j * invP * nz;
      if (t - lastBallPin[p] >= EVENT_GAP) {
        lastBallPin[p] = t;
        emit(t, 'ballPin', impact / 6, p);
      }
      react(pin, impact, nx, nz);
    }
  };

  /** Pin against pin, equal masses, capsule against capsule. */
  const collidePinPins = (t: number) => {
    const invP = 1 / PIN.mass;
    for (let a = 0; a < pins.length; a++) {
      const pa = pins[a];
      if (!pa.active || pa.dropped) continue;
      for (let b = a + 1; b < pins.length; b++) {
        const pb = pins[b];
        if (!pb.active || pb.dropped) continue;
        const ca = pinCapsule(pa);
        const cb = pinCapsule(pb);
        const [qa, qb] = segSeg(ca, cb);
        const dx = qb.x - qa.x;
        const dz = qb.z - qa.z;
        const d = Math.hypot(dx, dz);
        const minD = ca.r + cb.r;
        if (d >= minD || d < 1e-9) continue;
        const nx = dx / d;
        const nz = dz / d;
        const overlap = minD - d;
        pa.x -= (nx * overlap) / 2;
        pa.z -= (nz * overlap) / 2;
        pb.x += (nx * overlap) / 2;
        pb.z += (nz * overlap) / 2;
        const va = pointVel(pa, qa.s);
        const vb = pointVel(pb, qb.s);
        const vrel = (vb.x - va.x) * nx + (vb.z - va.z) * nz;
        if (vrel >= 0) continue;
        const impact = -vrel;
        const j = (-(1 + RESTITUTION) * vrel) / (2 * invP);
        pa.vx -= j * invP * nx;
        pa.vz -= j * invP * nz;
        pb.vx += j * invP * nx;
        pb.vz += j * invP * nz;
        if (t - lastPinPin[a][b] >= EVENT_GAP) {
          lastPinPin[a][b] = t;
          emit(t, 'pinPin', impact / 6, a);
        }
        react(pa, impact, -nx, -nz);
        react(pb, impact, nx, nz);
      }
    }
  };

  /** Ball motion, hook, gutter and pit transitions. */
  const moveBall = (t: number) => {
    if (bMode === 'pit') {
      bvy -= GRAVITY * STEP;
      by = Math.max(-LANE.pitDepth, by + bvy * STEP);
      return;
    }
    if (bMode === 'roll' && bz > LANE.oilEnd) {
      const ramp = clamp01((bz - LANE.oilEnd) / HOOK_RAMP);
      bvx += input.spin * THROW.hookAccel * ramp * STEP;
    }
    const speed = Math.hypot(bvx, bvz);
    const keep = 1 - (DRAG * speed * STEP) / LANE.length;
    bvx *= keep;
    bvz *= keep;
    bx += bvx * STEP;
    bz += bvz * STEP;
    roll += (speed * STEP) / BALL.radius;

    if (bMode === 'roll' && Math.abs(bx) > LANE.halfWidth && bz < GUTTER_Z) {
      bMode = 'gutter';
      gutter = true;
      bx = Math.sign(bx) * GUTTER_X;
      bvx = 0;
      emit(t, 'gutter', 1, -1);
    }
    if (bMode === 'gutter') {
      const target = BALL.radius - LANE.gutterDepth;
      by += (target - by) * Math.min(1, 10 * STEP);
    }
    if (bz > DECK_END_Z) {
      bMode = 'pit';
      bvx = 0;
      bvz = 0;
      bvy = 0;
      emit(t, 'pit', 0.6, -1);
      if (reachPinsAt < 0) reachPinsAt = t;
    }
    if (reachPinsAt < 0 && bMode === 'roll' && bz >= GUTTER_Z) reachPinsAt = t;
  };

  /** Pin motion, friction, tilt and dropping off the deck. */
  const movePins = (t: number) => {
    pins.forEach((pin, p) => {
      if (!pin.active || pin.dropped) return;
      const sp = Math.hypot(pin.vx, pin.vz);
      if (sp > 0) {
        const decel = (pin.state === 'standing' ? FRICTION_STANDING : FRICTION_LYING) * STEP;
        const k = Math.max(0, sp - decel) / sp;
        pin.vx *= k;
        pin.vz *= k;
        pin.x += pin.vx * STEP;
        pin.z += pin.vz * STEP;
        if (pin.state !== 'standing') pin.spin += sp * STEP * 8;
      }

      if (pin.state === 'falling') {
        pin.tiltVel += TOPPLE_ACCEL * STEP;
        pin.tilt += pin.tiltVel * STEP;
        if (pin.tilt >= HALF_PI) {
          pin.tilt = HALF_PI;
          pin.tiltVel = 0;
          pin.state = 'down';
          emit(t, 'pinFall', pin.hitSpeed / 4, p);
        }
      } else if (pin.state === 'standing' && (pin.tilt !== 0 || pin.tiltVel !== 0)) {
        const acc = -WOBBLE_STIFFNESS * pin.tilt - WOBBLE_DAMPING * pin.tiltVel;
        pin.tiltVel += acc * STEP;
        pin.tilt += pin.tiltVel * STEP;
        if (pin.tilt < 0) {
          pin.tilt = 0;
          pin.tiltVel = 0;
        }
        if (pin.tilt > WOBBLE_MAX) {
          pin.tilt = WOBBLE_MAX;
          pin.tiltVel = Math.min(0, pin.tiltVel);
        }
      }

      // Kickbacks: beside the deck a pin bounces off the side wall back toward the rack.
      if (pin.z > KICKBACK_FROM_Z && Math.abs(pin.x) > KICKBACK_X) {
        const side = Math.sign(pin.x);
        pin.x = side * KICKBACK_X;
        if (pin.vx * side > 0) {
          const impact = Math.abs(pin.vx);
          pin.vx = -pin.vx * KICKBACK_BOUNCE;
          if (impact > 0.5) emit(t, 'pinPin', impact / 6, p);
          react(pin, impact, -side, 0);
        }
      }
      if (pin.z > DECK_END_Z || (pin.z <= KICKBACK_FROM_Z && Math.abs(pin.x) > SIDE_LIMIT)) {
        pin.dropped = true;
        if (pin.state !== 'down') {
          pin.state = 'down';
          pin.tiltVel = 0;
          emit(t, 'pinFall', 0.5, p);
        }
      }
      if (pin.dropped) pin.y += (DROP_Y - pin.y) * Math.min(1, 5 * STEP);
    });
  };

  const ballGone = () => bMode === 'pit' && by <= -LANE.pitDepth;

  const pinsSettled = () =>
    pins.every((pin) => {
      if (!pin.active) return true;
      if (pin.dropped) return pin.y <= DROP_Y + 0.01;
      if (pin.state === 'falling') return false;
      if (pin.state === 'standing' && (Math.abs(pin.tilt) > 1e-3 || Math.abs(pin.tiltVel) > 1e-3)) return false;
      return Math.hypot(pin.vx, pin.vz) < 0.05;
    });

  const advance = (t: number) => {
    moveBall(t);
    collideBallPins(t);
    movePins(t);
    collidePinPins(t);
  };

  record();
  const maxSteps = Math.round(TIME_LIMIT / STEP);
  let steps = 0;
  while (steps < maxSteps) {
    for (let s = 0; s < SUBSTEPS; s++) {
      steps++;
      advance(steps * STEP);
    }
    record();
    if (ballGone() && pinsSettled()) break;
  }
  const still = Math.round(STILL_SECONDS / SAMPLE_DT);
  for (let i = 0; i < still; i++) record();

  const duration = (ballSamples.length - 1) * SAMPLE_DT;
  // Down: tipped over, gone, or left lying off the lane surface (in the gutter beside the deck).
  const down = pins.map((pin) => pin.active && (pin.state !== 'standing' || pin.dropped || Math.abs(pin.x) > SIDE_LIMIT));

  return {
    sampleDt: SAMPLE_DT,
    ball: ballSamples,
    pins: pinSamples,
    duration,
    down,
    gutter,
    reachPinsAt: reachPinsAt < 0 ? duration : reachPinsAt,
    events,
  };
}

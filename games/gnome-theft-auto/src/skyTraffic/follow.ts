// The kinematic waypoint follower for NPC aircraft (docs/roadmaps/gta-npc-planes.md). Pure: no DOM, no three.js.
// It moves a SkyBody along a SkyWaypoint route: speed and turn-rate limited, climbs and glides interpolated along each
// leg, ground legs snap to the floor, holds, and scripted vertical loops. No allocations per step.
import { VEHICLES } from '../config';
import { angleDiff } from '../collide';
import type { VehicleKind } from '../types';
import type { FollowSpec, FollowState, SkyBody, SkyWaypoint } from './types';

const TAU = Math.PI * 2;

/** A fresh follow state flying from `body` toward route[i]. */
export function newFollow(route: SkyWaypoint[], body: SkyBody, i = 0): FollowState {
  return {
    route, i, holdT: 0, loopT: -1, loopR: 0, loopX: 0, loopY: 0, loopZ: 0, loopYaw: 0,
    legFromY: body.y, legLen: Math.hypot((route[i]?.x ?? body.x) - body.x, (route[i]?.z ?? body.z) - body.z),
    done: route.length === 0,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Moves on to the next waypoint after the current one has been completed. */
function advance(b: SkyBody, st: FollowState): void {
  st.i++;
  if (st.i >= st.route.length) {
    st.i = st.route.length - 1;
    st.done = true;
  } else {
    const wp = st.route[st.i];
    st.legFromY = b.y;
    st.legLen = Math.hypot(wp.x - b.x, wp.z - b.z);
  }
}

/** One step. `floorY` is the floor under (and just ahead of) the body. Returns the index of the waypoint reached this step, or -1. */
export function stepFollow(b: SkyBody, st: FollowState, spec: FollowSpec, floorY: number, dt: number): number {
  if (st.done || dt <= 0) return -1;
  if (dt > 0.25) dt = 0.25;

  // Vertical loop in progress: a circle in the vertical plane through the entry point, along the entry heading.
  if (st.loopT >= 0) {
    st.loopT += (dt * Math.max(b.speed, 8)) / (TAU * st.loopR);
    const th = TAU * Math.min(1, st.loopT);
    const sinTh = Math.sin(th);
    b.x = st.loopX + Math.sin(st.loopYaw) * st.loopR * sinTh;
    b.z = st.loopZ + Math.cos(st.loopYaw) * st.loopR * sinTh;
    const newY = st.loopY + st.loopR * (1 - Math.cos(th));
    b.vy = (newY - b.y) / dt;
    b.y = newY;
    b.pitch = th;
    b.roll = 0;
    if (st.loopT >= 1) {
      st.loopT = -1;
      b.pitch = 0;
      advance(b, st);
    }
    return -1;
  }

  // Holding at a waypoint: slow to a stop, keep the height (or the floor for a ground stop).
  if (st.holdT > 0) {
    st.holdT -= dt;
    b.speed = Math.max(0, b.speed - spec.accel * 2 * dt);
    b.x += Math.sin(b.yaw) * b.speed * dt;
    b.z += Math.cos(b.yaw) * b.speed * dt;
    const hw = st.route[st.i];
    if (hw.ground) {
      b.y = floorY;
      b.vy = 0;
      b.pitch += (0 - b.pitch) * Math.min(1, 3 * dt);
      b.roll += (0 - b.roll) * Math.min(1, 3 * dt);
    } else {
      const target = floorY + hw.agl;
      b.vy = clamp((target - b.y) * 2, -spec.climbRate, spec.climbRate);
      b.y = Math.max(floorY, b.y + b.vy * dt);
    }
    if (st.holdT <= 0) {
      st.holdT = 0;
      advance(b, st);
    }
    return -1;
  }

  // Flying or taxiing toward route[i].
  const wp = st.route[st.i];
  const dx = wp.x - b.x;
  const dz = wp.z - b.z;
  const dist = Math.hypot(dx, dz);
  const heading = Math.atan2(dx, dz);
  const diff = angleDiff(heading, b.yaw);

  // Speed: ease toward the leg speed; a hover craft that must turn a lot slows right down first.
  let ts = Math.min(wp.speed, spec.maxSpeed);
  if (spec.hover && Math.abs(diff) > 1.2) ts *= 0.25;
  const dv = spec.accel * dt;
  if (b.speed < ts) b.speed = Math.min(ts, b.speed + dv);
  else b.speed = Math.max(ts, b.speed - dv);
  if (b.speed < 0) b.speed = 0;

  // Turn toward the waypoint, rate limited.
  const yr = clamp(diff * 2, -spec.turnRate, spec.turnRate);
  b.yaw += yr * dt;

  // Move along the heading.
  b.x += Math.sin(b.yaw) * b.speed * dt;
  b.z += Math.cos(b.yaw) * b.speed * dt;

  // Height and attitude.
  const onGround = wp.ground && b.y - floorY < 0.5;
  if (onGround) {
    b.y = floorY;
    b.vy = 0;
    b.pitch += (0 - b.pitch) * Math.min(1, 3 * dt);
    b.roll += (0 - b.roll) * Math.min(1, 3 * dt);
  } else {
    const wpY = wp.ground ? floorY : floorY + wp.agl;
    let t = st.legLen > 1 ? clamp(1 - dist / st.legLen, 0, 1) : 1;
    // Coming down to a ground point: aim to be on the floor 15% of the leg early, so the wheels touch before it.
    if (wp.ground) t = Math.min(1, t / 0.85);
    let targetY = st.legFromY + (wpY - st.legFromY) * t;
    if (!wp.ground) targetY = Math.max(targetY, floorY + Math.min(wp.agl, 3));
    b.vy = clamp((targetY - b.y) * 2, -spec.climbRate, spec.climbRate);
    b.y = Math.max(floorY, b.y + b.vy * dt);

    const rollTarget = clamp(-yr / spec.turnRate, -1, 1) * spec.bankMax;
    const pitchTarget = spec.hover
      ? -spec.pitchMax * (b.speed / spec.maxSpeed)
      : clamp(Math.atan2(b.vy, Math.max(b.speed, 1)), -spec.pitchMax, spec.pitchMax);
    const k = Math.min(1, 3 * dt);
    b.pitch += (pitchTarget - b.pitch) * k;
    b.roll += (rollTarget - b.roll) * k;
  }

  // Arrival. A fixed-wing craft that is already past a point inside its turning circle skips it.
  const dist2 = Math.hypot(wp.x - b.x, wp.z - b.z);
  const arriveR = wp.ground ? 4 : spec.arrive;
  const arrived = dist2 < arriveR
    || (!spec.hover && !wp.ground && dist2 < (b.speed / spec.turnRate) * 1.1 && Math.abs(diff) > Math.PI / 2);
  if (!arrived) return -1;

  const reached = st.i;
  if (wp.loop) {
    st.loopT = 0;
    st.loopR = wp.loop;
    st.loopX = b.x;
    st.loopY = b.y;
    st.loopZ = b.z;
    st.loopYaw = b.yaw;
  } else if (wp.hold) {
    st.holdT = wp.hold;
  } else {
    advance(b, st);
  }
  return reached;
}

/** The follower numbers for a vehicle kind (from config.ts VEHICLES[kind]). */
export function followSpecFor(kind: VehicleKind): FollowSpec {
  const s = VEHICLES[kind];
  if (s.air) {
    const a = s.air;
    const hover = a.regime !== 'fixed-wing';
    return {
      maxSpeed: a.maxSpeed, accel: a.thrust, turnRate: a.turnRate, climbRate: a.climbRate,
      bankMax: a.bankMax, pitchMax: a.pitchMax, hover, arrive: hover ? 6 : 18,
    };
  }
  const hover = !s.fixedWing;
  return {
    maxSpeed: s.maxSpeed, accel: s.accel, turnRate: s.turnRate * 0.8, climbRate: 10,
    bankMax: 0.5, pitchMax: 0.3, hover, arrive: hover ? 6 : 18,
  };
}

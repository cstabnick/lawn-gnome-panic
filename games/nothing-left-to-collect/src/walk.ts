// Pure walker physics: walk, jump, gravity, collide with boxes, stand on box tops. No three, no DOM
// (the party slice runs this headless in tests).
import { TUNING } from './config';
import type { Box, Walker } from './types';

const EPS = 1e-4;

export function createWalker(x: number, y: number, z: number, facing: number): Walker {
  return { x, y, z, vx: 0, vy: 0, vz: 0, facing, grounded: true, jumpsUsed: 0 };
}

/** True when the walker's square footprint (half-size r) overlaps the box in xz. */
export function overlapsXZ(w: Walker, b: Box, r: number): boolean {
  return w.x + r > b.min[0] && w.x - r < b.max[0] && w.z + r > b.min[2] && w.z - r < b.max[2];
}

/** True when the walker's body (feet at y, height playerHeight) overlaps the box's height range. */
function overlapsY(w: Walker, b: Box): boolean {
  return w.y < b.max[1] - EPS && w.y + TUNING.playerHeight > b.min[1] + EPS;
}

/** Resolve one horizontal axis (0 = x, 2 = z) after moving along it. */
function resolveAxis(w: Walker, axis: 0 | 2, delta: number, colliders: readonly Box[]): void {
  const r = TUNING.playerRadius;
  for (const b of colliders) {
    if (!overlapsXZ(w, b, r) || !overlapsY(w, b)) continue;
    if (w.y >= b.max[1] - TUNING.stepUp) {
      // A low ledge: step up onto it.
      w.y = b.max[1];
      if (w.vy < 0) w.vy = 0;
      continue;
    }
    const centre = axis === 0 ? w.x : w.z;
    const lo = b.min[axis], hi = b.max[axis];
    // Push back out against the direction of travel (or to the nearer side when not moving on this axis).
    const pushLow = delta > 0 ? true : delta < 0 ? false : centre < (lo + hi) / 2;
    const out = pushLow ? lo - r - EPS : hi + r + EPS;
    if (axis === 0) { w.x = out; w.vx = 0; } else { w.z = out; w.vz = 0; }
  }
}

export function stepWalker(w: Walker, moveX: number, moveZ: number, jump: boolean, colliders: readonly Box[], groundY: number, dt: number): void {
  const r = TUNING.playerRadius;

  // Horizontal velocity eases toward the stick (clamped to length 1) times walk speed.
  let mx = moveX, mz = moveZ;
  const len = Math.hypot(mx, mz);
  if (len > 1) { mx /= len; mz /= len; }
  const tx = mx * TUNING.walkSpeed, tz = mz * TUNING.walkSpeed;
  const dx = tx - w.vx, dz = tz - w.vz;
  const dl = Math.hypot(dx, dz);
  const maxStep = TUNING.accel * dt;
  if (dl <= maxStep) { w.vx = tx; w.vz = tz; } else { w.vx += (dx / dl) * maxStep; w.vz += (dz / dl) * maxStep; }
  if (len > 0.1) w.facing = Math.atan2(w.vx, w.vz);

  // One-shot jump (no double jump).
  if (jump && w.grounded) {
    w.vy = TUNING.jumpSpeed;
    w.grounded = false;
    w.jumpsUsed = 1;
  }
  if (!w.grounded) w.vy -= TUNING.gravity * dt;

  // x, then z.
  const ddx = w.vx * dt;
  w.x += ddx;
  resolveAxis(w, 0, ddx, colliders);
  const ddz = w.vz * dt;
  w.z += ddz;
  resolveAxis(w, 2, ddz, colliders);

  // y.
  const prevY = w.y;
  w.y += w.vy * dt;
  if (w.vy > 0) {
    // Head bump: a box whose underside was above the head before this step.
    for (const b of colliders) {
      if (!overlapsXZ(w, b, r)) continue;
      const head = w.y + TUNING.playerHeight;
      if (prevY + TUNING.playerHeight <= b.min[1] + EPS && head > b.min[1]) {
        w.y = b.min[1] - TUNING.playerHeight;
        w.vy = 0;
      }
    }
  }

  // Support: the ground or the highest box top under the footprint that is at or below the feet
  // (checked against the feet before and after this step, so a fast fall cannot tunnel through a top).
  const reach = Math.max(prevY, w.y) + 0.05;
  let support = groundY;
  for (const b of colliders) {
    if (b.max[1] <= reach && b.max[1] > support && overlapsXZ(w, b, r)) support = b.max[1];
  }
  if (w.y <= support && w.vy <= 0) {
    w.y = support;
    w.vy = 0;
    w.grounded = true;
    w.jumpsUsed = 0;
  } else if (w.y > support + EPS) {
    w.grounded = false;
  }
}

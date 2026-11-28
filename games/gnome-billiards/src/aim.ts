// Where the cue ball goes when it is struck along (dx, dy): the first object ball it touches (and the contact point),
// or the cushion. Pure table geometry, shared by the 3D scene (the aim line) and the tests.
import { BALL_R, CUE_BALL, TABLE_H, TABLE_W } from './config';
import { POCKETS, type Ball } from './physics';

export interface AimLine {
  /** Where the line ends (table units). */
  ex: number;
  ey: number;
  /** Where the cue ball's centre touches the first object ball, or null when it runs to a cushion. */
  contact: { x: number; y: number; hitId: number } | null;
}

/** (dx, dy) must be a unit vector. */
export function aimLine(balls: readonly Ball[], cx: number, cy: number, dx: number, dy: number): AimLine {
  let t = Infinity;
  let hitId: number | null = null;
  const rr = 2 * BALL_R;
  for (const b of balls) {
    if (b.pocketed || b.id === CUE_BALL) continue;
    const ox = b.x - cx;
    const oy = b.y - cy;
    const proj = ox * dx + oy * dy;
    if (proj <= 0) continue;
    const perp2 = ox * ox + oy * oy - proj * proj;
    if (perp2 >= rr * rr) continue;
    const tt = proj - Math.sqrt(rr * rr - perp2);
    if (tt > 0 && tt < t) {
      t = tt;
      hitId = b.id;
    }
  }
  if (hitId !== null) {
    const contact = { x: cx + dx * t, y: cy + dy * t, hitId };
    return { ex: contact.x, ey: contact.y, contact };
  }
  // The distance to the cushion line the ball centre can reach.
  const tx = dx > 0 ? (TABLE_W - BALL_R - cx) / dx : dx < 0 ? (BALL_R - cx) / dx : Infinity;
  const ty = dy > 0 ? (TABLE_H - BALL_R - cy) / dy : dy < 0 ? (BALL_R - cy) / dy : Infinity;
  const len = Math.max(0, Math.min(tx, ty));
  return { ex: cx + dx * len, ey: cy + dy * len, contact: null };
}

/**
 * How far the cue stick can reach back from the cue ball's centre along the unit direction (ux, uy) (the way the
 * butt points) before it would pass through a cushion or a ball. The stick lies on the cloth: this is what keeps it
 * from clipping through the rails or into a ball behind.
 */
export function backRoom(balls: readonly Ball[], cx: number, cy: number, ux: number, uy: number): number {
  const R = BALL_R;
  // The cushions: the cue ball's centre stays at least one ball radius (plus the stick's own width) from each rail.
  const inset = R + 0.012;
  const tx = ux > 0 ? (TABLE_W - inset - cx) / ux : ux < 0 ? (inset - cx) / ux : Infinity;
  const ty = uy > 0 ? (TABLE_H - inset - cy) / uy : uy < 0 ? (inset - cy) / uy : Infinity;
  let room = Math.max(0, Math.min(tx, ty));
  // Balls behind the cue ball, close to its line.
  for (const b of balls) {
    if (b.pocketed || b.id === CUE_BALL) continue;
    const ox = b.x - cx;
    const oy = b.y - cy;
    const proj = ox * ux + oy * uy;
    if (proj <= 0) continue;
    const perp = Math.abs(ox * -uy + oy * ux);
    if (perp < 2 * R + 0.02) room = Math.min(room, proj - 2 * R - 0.02);
  }
  return Math.max(0, room);
}

/** Drag sensitivity multiplier when Fine Aim is active (5.5x finer control). */
export const FINE_AIM_SCALE = 0.18;
/** Ultra-fine nudge step in radians (0.1 degrees). */
export const FINE_NUDGE_RAD = (0.1 * Math.PI) / 180;
/** Standard micro-nudge step in radians (0.2 degrees). */
export const NUDGE_STEP_RAD = (0.2 * Math.PI) / 180;
/** Coarse nudge step in radians (0.5 degrees). */
export const COARSE_NUDGE_RAD = (0.5 * Math.PI) / 180;

/** Rotates direction (dx, dy) by `radians` and returns a unit vector. */
export function rotateDir(dx: number, dy: number, radians: number): { dx: number; dy: number } {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  const rx = dx * c - dy * s;
  const ry = dx * s + dy * c;
  const len = Math.hypot(rx, ry) || 1;
  return { dx: rx / len, dy: ry / len };
}

/** Signed smallest angle in (-PI, PI] from (ax, ay) to (bx, by). */
export function deltaAngle(ax: number, ay: number, bx: number, by: number): number {
  return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
}

/**
 * Traces the struck object ball (`hitId`) from ghost contact `(gx, gy)` up to `maxLen`.
 * Reports whether it enters a pocket (`pocketed: true`) or hits a cushion with a 1-rail `bounce` preview.
 */
export function aimTargetRay(
  balls: readonly Ball[],
  hitId: number,
  gx: number,
  gy: number,
  maxLen: number,
): { ex: number; ey: number; pocketed: boolean; bounce?: { bx: number; by: number } } {
  const hit = balls.find((b) => b.id === hitId && !b.pocketed);
  if (!hit) return { ex: gx, ey: gy, pocketed: false };
  const ux = hit.x - gx;
  const uy = hit.y - gy;
  const len = Math.hypot(ux, uy) || 1;
  const nx = ux / len;
  const ny = uy / len;

  // Check distance to each pocket along the ray.
  let bestPocketT = Infinity;
  for (const p of POCKETS) {
    const ox = p.x - hit.x;
    const oy = p.y - hit.y;
    const proj = ox * nx + oy * ny;
    if (proj <= 0) continue;
    const perp2 = ox * ox + oy * oy - proj * proj;
    const pr = p.r + BALL_R * 0.25;
    if (perp2 < pr * pr && proj < bestPocketT) {
      bestPocketT = proj;
    }
  }

  // Check distance to cushions.
  const tx = nx > 1e-6 ? (TABLE_W - BALL_R - hit.x) / nx : nx < -1e-6 ? (BALL_R - hit.x) / nx : Infinity;
  const ty = ny > 1e-6 ? (TABLE_H - BALL_R - hit.y) / ny : ny < -1e-6 ? (BALL_R - hit.y) / ny : Infinity;
  const railT = Math.max(0, Math.min(tx, ty));

  if (bestPocketT <= maxLen && bestPocketT <= railT + BALL_R * 2) {
    return { ex: hit.x + nx * bestPocketT, ey: hit.y + ny * bestPocketT, pocketed: true };
  }
  if (railT < maxLen) {
    const ex = hit.x + nx * railT;
    const ey = hit.y + ny * railT;
    const rx = tx <= ty ? -nx : nx;
    const ry = ty < tx ? -ny : ny;
    return {
      ex,
      ey,
      pocketed: false,
      bounce: { bx: ex + rx * 0.35, by: ey + ry * 0.35 },
    };
  }
  return { ex: hit.x + nx * maxLen, ey: hit.y + ny * maxLen, pocketed: false };
}

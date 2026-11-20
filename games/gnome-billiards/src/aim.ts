// Where the cue ball goes when it is struck along (dx, dy): the first object ball it touches (and the contact point),
// or the cushion. Pure table geometry, shared by the 3D scene (the aim line) and the tests.
import { BALL_R, CUE_BALL, TABLE_H, TABLE_W } from './config';
import type { Ball } from './physics';

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

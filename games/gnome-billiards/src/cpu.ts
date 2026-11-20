// Big Lou, the CPU opponent. Looks for the cleanest pocket on one of its balls (a straight cut with a clear path both
// ways), and falls back to the nearest ball. Local only: the CPU never plays online, so its shots need no determinism.
import { BALL_R, CUE_BALL, EIGHT_BALL, MAX_SHOT_SPEED, ROLL_DECEL, TABLE_H, TABLE_W } from './config';
import { canPlaceCue, POCKETS, type Ball } from './physics';
import { groupOf, type Group } from './rules';

export interface CpuShot {
  vx: number;
  vy: number;
}

/** Distance from point (px, py) to the segment (ax, ay)-(bx, by). */
function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + dx * t - px;
  const cy = ay + dy * t - py;
  return Math.sqrt(cx * cx + cy * cy);
}

/** True when no live ball (other than the ones listed) lies within a ball's width of the segment. */
function clearPath(balls: readonly Ball[], ax: number, ay: number, bx: number, by: number, ignore: readonly number[]): boolean {
  for (const b of balls) {
    if (b.pocketed || ignore.includes(b.id)) continue;
    if (segDist(b.x, b.y, ax, ay, bx, by) < 2 * BALL_R) return false;
  }
  return true;
}

/** Where Big Lou puts the cue ball after a foul: the first clear spot found on a grid that starts near the head string. */
export function cpuPlaceSpot(balls: readonly Ball[], rnd: () => number): { x: number; y: number } {
  const jitter = (rnd() - 0.5) * 0.2;
  const preferred = [
    { x: TABLE_W * 0.3, y: TABLE_H / 2 + jitter },
    { x: TABLE_W * 0.3, y: TABLE_H / 2 },
  ];
  for (const p of preferred) if (canPlaceCue(balls, p.x, p.y)) return p;
  for (let gx = 0.1; gx < TABLE_W; gx += 0.1) {
    for (let gy = 0.1; gy < TABLE_H; gy += 0.1) {
      if (canPlaceCue(balls, gx, gy)) return { x: gx, y: gy };
    }
  }
  return { x: TABLE_W * 0.3, y: TABLE_H / 2 };
}

/** The shot Big Lou takes from (cueX, cueY) with its group (null = table still open). */
export function chooseCpuShot(balls: readonly Ball[], cueX: number, cueY: number, group: Group | null, rnd: () => number): CpuShot {
  const live = balls.filter((b) => !b.pocketed && b.id !== CUE_BALL);
  let targets: Ball[];
  if (group === null) targets = live.filter((b) => b.id !== EIGHT_BALL);
  else {
    const own = live.filter((b) => groupOf(b.id) === group);
    targets = own.length > 0 ? own : live.filter((b) => b.id === EIGHT_BALL);
  }
  if (targets.length === 0) targets = live;

  let best: { gx: number; gy: number; dist: number; total: number } | null = null;
  for (const t of targets) {
    for (const p of POCKETS) {
      const ux = p.x - t.x;
      const uy = p.y - t.y;
      const L = Math.sqrt(ux * ux + uy * uy);
      if (L === 0) continue;
      const gx = t.x - (ux / L) * 2 * BALL_R;
      const gy = t.y - (uy / L) * 2 * BALL_R;
      if (!clearPath(balls, cueX, cueY, gx, gy, [CUE_BALL, t.id])) continue;
      if (!clearPath(balls, t.x, t.y, p.x, p.y, [CUE_BALL, t.id])) continue;
      const dx = gx - cueX;
      const dy = gy - cueY;
      const D = Math.sqrt(dx * dx + dy * dy);
      if (!best || D + L < best.total) best = { gx, gy, dist: D, total: D + L };
    }
  }

  let aimX: number;
  let aimY: number;
  let travel: number;
  if (best) {
    aimX = best.gx - cueX;
    aimY = best.gy - cueY;
    travel = best.total;
  } else {
    const t = targets[Math.floor(rnd() * targets.length)] ?? { x: TABLE_W / 2, y: TABLE_H / 2 };
    aimX = t.x - cueX;
    aimY = t.y - cueY;
    travel = Math.sqrt(aimX * aimX + aimY * aimY) * 1.2;
  }
  const len = Math.sqrt(aimX * aimX + aimY * aimY) || 1;
  const a = (rnd() - 0.5) * 0.05;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const dx = (aimX * ca - aimY * sa) / len;
  const dy = (aimX * sa + aimY * ca) / len;
  const speed = Math.min(MAX_SHOT_SPEED, Math.sqrt(2 * ROLL_DECEL * travel) * 1.1);
  return { vx: dx * speed, vy: dy * speed };
}

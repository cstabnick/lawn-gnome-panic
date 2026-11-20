// Pure table physics for Gnome Billiards: fixed sub-steps, equal-mass ball collisions, cushions and six pockets.
// No DOM, no three, no randomness. The same shot on the same table gives the same result on every machine.
import { BALL_E, BALL_R, CUE_BALL, CUSHION_E, MAX_SHOT_SPEED, REST_SPEED, ROLL_DECEL, SETTLE_LIMIT_S, SUB_DT, TABLE_H, TABLE_W } from './config';

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pocketed: boolean;
}

export interface Pocket {
  x: number;
  y: number;
  r: number;
}

/** Four corners and the middle of each long side. */
export const POCKETS: readonly Pocket[] = [
  { x: 0, y: 0, r: 0.055 },
  { x: TABLE_W / 2, y: 0, r: 0.048 },
  { x: TABLE_W, y: 0, r: 0.055 },
  { x: 0, y: TABLE_H, r: 0.055 },
  { x: TABLE_W / 2, y: TABLE_H, r: 0.048 },
  { x: TABLE_W, y: TABLE_H, r: 0.055 },
];

/** What happened during one shot: the first object ball the cue touched, and every ball pocketed, in order. */
export interface ShotEvents {
  firstHit: number | null;
  pocketed: number[];
}

export interface Table {
  balls: Ball[];
  events: ShotEvents;
  steps: number;
}

export function copyBalls(balls: readonly Ball[]): Ball[] {
  return balls.map((b) => ({ ...b }));
}

/** A copy of the balls with the cue struck at (vx, vy), capped at MAX_SHOT_SPEED. Every other ball is at rest. */
export function beginShot(balls: readonly Ball[], vx: number, vy: number): Table {
  const out = copyBalls(balls);
  for (const b of out) {
    b.vx = 0;
    b.vy = 0;
  }
  let sx = vx;
  let sy = vy;
  const speed = Math.sqrt(sx * sx + sy * sy);
  if (speed > MAX_SHOT_SPEED) {
    const k = MAX_SHOT_SPEED / speed;
    sx *= k;
    sy *= k;
  }
  const cue = out.find((b) => b.id === CUE_BALL);
  if (cue && !cue.pocketed) {
    cue.vx = sx;
    cue.vy = sy;
  }
  return { balls: out, events: { firstHit: null, pocketed: [] }, steps: 0 };
}

export function isMoving(t: Table): boolean {
  const lim = REST_SPEED * REST_SPEED;
  for (const b of t.balls) {
    if (!b.pocketed && b.vx * b.vx + b.vy * b.vy > lim) return true;
  }
  return false;
}

/** One fixed step of SUB_DT seconds. */
export function stepOnce(t: Table): void {
  const { balls, events } = t;
  const R = BALL_R;
  const dt = SUB_DT;

  for (const b of balls) {
    if (b.pocketed) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    const s = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (s > 0) {
      const ns = s - ROLL_DECEL * dt;
      if (ns <= 0) {
        b.vx = 0;
        b.vy = 0;
      } else {
        const k = ns / s;
        b.vx *= k;
        b.vy *= k;
      }
    }
  }

  for (let i = 0; i < balls.length; i++) {
    const a = balls[i];
    if (a.pocketed) continue;
    for (let j = i + 1; j < balls.length; j++) {
      const c = balls[j];
      if (c.pocketed) continue;
      const dx = c.x - a.x;
      const dy = c.y - a.y;
      const d2 = dx * dx + dy * dy;
      const min = 2 * R;
      if (d2 >= min * min) continue;
      const d = Math.sqrt(d2);
      if (d === 0) continue;
      const nx = dx / d;
      const ny = dy / d;
      const push = (min - d) / 2;
      a.x -= nx * push;
      a.y -= ny * push;
      c.x += nx * push;
      c.y += ny * push;
      const vn = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
      if (vn < 0) {
        const J = (-(1 + BALL_E) * vn) / 2;
        a.vx -= J * nx;
        a.vy -= J * ny;
        c.vx += J * nx;
        c.vy += J * ny;
      }
      if (events.firstHit === null) {
        if (a.id === CUE_BALL) events.firstHit = c.id;
        else if (c.id === CUE_BALL) events.firstHit = a.id;
      }
    }
  }

  for (const b of balls) {
    if (b.pocketed) continue;
    let sunk = false;
    for (const p of POCKETS) {
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      if (dx * dx + dy * dy < p.r * p.r) {
        b.pocketed = true;
        b.vx = 0;
        b.vy = 0;
        events.pocketed.push(b.id);
        sunk = true;
        break;
      }
    }
    if (sunk) continue;
    if (b.x < R) {
      b.x = R;
      b.vx = -b.vx * CUSHION_E;
    } else if (b.x > TABLE_W - R) {
      b.x = TABLE_W - R;
      b.vx = -b.vx * CUSHION_E;
    }
    if (b.y < R) {
      b.y = R;
      b.vy = -b.vy * CUSHION_E;
    } else if (b.y > TABLE_H - R) {
      b.y = TABLE_H - R;
      b.vy = -b.vy * CUSHION_E;
    }
  }
  t.steps++;
}

/** Runs the shot until every ball rests (or the settle limit runs out). */
export function settle(t: Table): void {
  const max = Math.round(SETTLE_LIMIT_S / SUB_DT);
  while (isMoving(t) && t.steps < max) stepOnce(t);
  for (const b of t.balls) {
    b.vx = 0;
    b.vy = 0;
  }
}

/** Whether a ball centre may sit at (x, y): inside the cushions, clear of the other live balls, and out of the pockets. */
export function canPlaceCue(balls: readonly Ball[], x: number, y: number): boolean {
  const R = BALL_R;
  if (x < R || x > TABLE_W - R || y < R || y > TABLE_H - R) return false;
  for (const p of POCKETS) {
    const dx = x - p.x;
    const dy = y - p.y;
    if (dx * dx + dy * dy < (p.r + R) * (p.r + R)) return false;
  }
  for (const b of balls) {
    if (b.pocketed || b.id === CUE_BALL) continue;
    const dx = x - b.x;
    const dy = y - b.y;
    if (dx * dx + dy * dy < 4 * R * R) return false;
  }
  return true;
}

/** Puts the cue ball at (x, y), live and at rest. */
export function setCue(balls: Ball[], x: number, y: number): void {
  const cue = balls.find((b) => b.id === CUE_BALL);
  if (!cue) return;
  cue.x = x;
  cue.y = y;
  cue.vx = 0;
  cue.vy = 0;
  cue.pocketed = false;
}

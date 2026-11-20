// Canvas drawing for Gnome Billiards: the table (wood rail, green cloth, pockets, diamonds), the balls, the cue stick
// and the aim line. The table is drawn in table units through a View, so a phone in portrait gets the table on its side.
import { BALL_R, CUE_BALL, PULL_MAX, RAIL, TABLE_H, TABLE_W } from './config';
import { POCKETS, canPlaceCue, type Ball } from './physics';

export interface View {
  /** Pixels per table unit. */
  s: number;
  /** Pixel position of table (0, 0). */
  ox: number;
  oy: number;
  /** True when the table's long side runs down the screen (portrait phones). */
  rot: boolean;
}

/** Fits the table (with its rail) into the canvas, leaving `top` and `bottom` pixels for the HUD. */
export function fitView(cw: number, ch: number, top: number, bottom: number): View {
  const availW = Math.max(40, cw - 24);
  const availH = Math.max(40, ch - top - bottom);
  const rot = ch > cw * 1.15;
  const lenU = TABLE_W;
  const widU = TABLE_H;
  let s: number;
  if (rot) s = Math.min(availW / (widU + 2 * RAIL), availH / (lenU + 2 * RAIL));
  else s = Math.min(availW / (lenU + 2 * RAIL), availH / (widU + 2 * RAIL));
  const drawnW = (rot ? widU : lenU) + 2 * RAIL;
  const drawnH = (rot ? lenU : widU) + 2 * RAIL;
  const ox = (cw - drawnW * s) / 2 + RAIL * s;
  const oy = top + (availH - drawnH * s) / 2 + RAIL * s;
  return { s, ox, oy, rot };
}

export function toScreen(v: View, x: number, y: number): [number, number] {
  return v.rot ? [v.ox + y * v.s, v.oy + x * v.s] : [v.ox + x * v.s, v.oy + y * v.s];
}

export function toTable(v: View, px: number, py: number): [number, number] {
  return v.rot ? [(py - v.oy) / v.s, (px - v.ox) / v.s] : [(px - v.ox) / v.s, (py - v.oy) / v.s];
}

const BALL_COLOURS: Record<number, string> = {
  1: '#f2c230', 2: '#2b5fd6', 3: '#d8332b', 4: '#6a2fb0', 5: '#f0742b', 6: '#2e8f3e', 7: '#7a2222', 8: '#111111',
};

export interface Frame {
  balls: readonly Ball[];
  /** Aim: the cue's pull point in table units and the power 0..1 it shows. Null when not aiming. */
  aim: { px: number; py: number; power: number } | null;
  /** Ball-in-hand: the spot under the finger and whether it is legal. */
  placing: { x: number; y: number; ok: boolean } | null;
  /** Show the cue stick and aim line (the mover is at the table and it is their shot). */
  cueActive: boolean;
  /** The cue ball is in the pocket and nobody has placed it yet (drawn as a hint, not a ball). */
  cueMissing: boolean;
  width: number;
  height: number;
  dpr: number;
}

export function drawFrame(ctx: CanvasRenderingContext2D, v: View, f: Frame): void {
  ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
  ctx.fillStyle = '#1b1020';
  ctx.fillRect(0, 0, f.width, f.height);
  drawTable(ctx, v);
  for (const b of f.balls) if (!b.pocketed) drawBall(ctx, v, b);
  if (f.placing) drawPlacing(ctx, v, f.placing);
  if (f.cueActive && f.aim && !f.cueMissing) drawAim(ctx, v, f.balls, f.aim);
  if (f.aim) drawPowerBar(ctx, f.width, f.height, f.aim.power);
  if (f.cueMissing) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = `600 ${Math.max(12, v.s * 0.06)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Cue ball in the pocket. Drag it onto the cloth.', f.width / 2, v.oy - v.s * RAIL * 0.6);
  }
}

function drawTable(ctx: CanvasRenderingContext2D, v: View): void {
  const [x0, y0] = toScreen(v, -RAIL, -RAIL);
  const [x1, y1] = toScreen(v, TABLE_W + RAIL, TABLE_H + RAIL);
  const rx = Math.min(x0, x1);
  const ry = Math.min(y0, y1);
  const rw = Math.abs(x1 - x0);
  const rh = Math.abs(y1 - y0);
  const wood = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
  wood.addColorStop(0, '#a46a3a');
  wood.addColorStop(0.5, '#6e4224');
  wood.addColorStop(1, '#8f5a31');
  ctx.fillStyle = wood;
  roundRect(ctx, rx, ry, rw, rh, v.s * 0.09);
  ctx.fill();

  const [c0x, c0y] = toScreen(v, 0, 0);
  const [c1x, c1y] = toScreen(v, TABLE_W, TABLE_H);
  const cx = Math.min(c0x, c1x);
  const cy = Math.min(c0y, c1y);
  const cw = Math.abs(c1x - c0x);
  const ch = Math.abs(c1y - c0y);
  const cloth = ctx.createRadialGradient(cx + cw / 2, cy + ch / 2, Math.min(cw, ch) * 0.1, cx + cw / 2, cy + ch / 2, Math.max(cw, ch) * 0.6);
  cloth.addColorStop(0, '#2a9150');
  cloth.addColorStop(1, '#1a6a38');
  ctx.fillStyle = cloth;
  ctx.fillRect(cx, cy, cw, ch);
  ctx.strokeStyle = '#0f4a25';
  ctx.lineWidth = Math.max(2, v.s * 0.03);
  ctx.strokeRect(cx, cy, cw, ch);

  // Diamonds on the rail
  ctx.fillStyle = '#f4e3b0';
  for (const f of [0.25, 0.5, 0.75]) {
    for (const [x, y] of [[TABLE_W * f, -RAIL / 2], [TABLE_W * f, TABLE_H + RAIL / 2], [-RAIL / 2, TABLE_H * f], [TABLE_W + RAIL / 2, TABLE_H * f]] as const) {
      const [sx, sy] = toScreen(v, x, y);
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(1.5, v.s * 0.012), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const p of POCKETS) {
    const [px, py] = toScreen(v, p.x, p.y);
    ctx.beginPath();
    ctx.arc(px, py, p.r * v.s, 0, Math.PI * 2);
    ctx.fillStyle = '#050405';
    ctx.fill();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBall(ctx: CanvasRenderingContext2D, v: View, b: Ball): void {
  const [sx, sy] = toScreen(v, b.x, b.y);
  const r = Math.max(3, BALL_R * v.s);
  if (b.id === CUE_BALL) {
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#f7f5ee';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = Math.max(1, r * 0.12);
    ctx.stroke();
    return;
  }
  const colourId = b.id > 8 ? b.id - 8 : b.id;
  const colour = BALL_COLOURS[colourId] ?? '#888';
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#f7f5ee';
  ctx.fill();
  if (b.id > 8) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = colour;
    ctx.fillRect(sx - r, sy - r * 0.55, r * 2, r * 1.1);
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = colour;
    ctx.fill();
  }
  if (r >= 7) {
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#f7f5ee';
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.font = `700 ${Math.round(r * 0.6)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(b.id), sx, sy + r * 0.04);
  }
}

function drawPlacing(ctx: CanvasRenderingContext2D, v: View, p: { x: number; y: number; ok: boolean }): void {
  const [sx, sy] = toScreen(v, p.x, p.y);
  const r = Math.max(3, BALL_R * v.s);
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fillStyle = p.ok ? 'rgba(255,255,255,0.75)' : 'rgba(255,80,80,0.6)';
  ctx.fill();
}

function drawAim(ctx: CanvasRenderingContext2D, v: View, balls: readonly Ball[], aim: { px: number; py: number; power: number }): void {
  const cue = balls.find((b) => b.id === CUE_BALL);
  if (!cue || cue.pocketed) return;
  // Direction the cue ball will go: away from the pull point.
  let dx = cue.x - aim.px;
  let dy = cue.y - aim.py;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-6) return;
  dx /= len;
  dy /= len;
  const r = Math.max(3, BALL_R * v.s);

  // Ray from the cue ball to the first live ball it would touch (or the cushion).
  let t = Infinity;
  let hit: Ball | null = null;
  for (const b of balls) {
    if (b.pocketed || b.id === CUE_BALL) continue;
    const ox = b.x - cue.x;
    const oy = b.y - cue.y;
    const proj = ox * dx + oy * dy;
    if (proj <= 0) continue;
    const perp2 = ox * ox + oy * oy - proj * proj;
    const rr = 2 * BALL_R;
    if (perp2 >= rr * rr) continue;
    const tt = proj - Math.sqrt(rr * rr - perp2);
    if (tt > 0 && tt < t) {
      t = tt;
      hit = b;
    }
  }
  if (!hit) {
    // Cushion distance along the ray (inside the cushions).
    const lim = [
      dx > 0 ? (TABLE_W - BALL_R - cue.x) / dx : dx < 0 ? (BALL_R - cue.x) / dx : Infinity,
      dy > 0 ? (TABLE_H - BALL_R - cue.y) / dy : dy < 0 ? (BALL_R - cue.y) / dy : Infinity,
    ];
    t = Math.max(0, Math.min(lim[0], lim[1]));
  }
  const [sx, sy] = toScreen(v, cue.x, cue.y);
  const [ex, ey] = toScreen(v, cue.x + dx * t, cue.y + dy * t);
  ctx.save();
  ctx.setLineDash([r * 0.7, r * 0.7]);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = Math.max(1.5, r * 0.2);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.restore();
  if (hit) {
    // Where the object ball would go: straight through the contact point along the cut.
    const [hx, hy] = toScreen(v, hit.x, hit.y);
    ctx.beginPath();
    ctx.arc(ex, ey, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = Math.max(1, r * 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + (hx - ex) * 0.6, hy + (hy - ey) * 0.6);
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.stroke();
  }

  // The cue stick: its tip sits behind the ball, pulled back by the power.
  const pull = aim.power * PULL_MAX;
  const gap = BALL_R * 1.6 + pull;
  const [tipX, tipY] = toScreen(v, cue.x - dx * gap, cue.y - dy * gap);
  const [buttX, buttY] = toScreen(v, cue.x - dx * (gap + 0.9), cue.y - dy * (gap + 0.9));
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(buttX, buttY);
  ctx.strokeStyle = '#d9b77a';
  ctx.lineWidth = Math.max(3, r * 0.9);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX + (buttX - tipX) * 0.04, tipY + (buttY - tipY) * 0.04);
  ctx.strokeStyle = '#3b7bd6';
  ctx.lineWidth = Math.max(3, r * 0.9);
  ctx.stroke();
}

function drawPowerBar(ctx: CanvasRenderingContext2D, w: number, h: number, power: number): void {
  const bw = Math.min(260, w * 0.6);
  const bh = 14;
  const x = (w - bw) / 2;
  const y = h - 92;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - 3, y - 3, bw + 6, bh + 6);
  const grad = ctx.createLinearGradient(x, 0, x + bw, 0);
  grad.addColorStop(0, '#7ed957');
  grad.addColorStop(0.6, '#ffd54f');
  grad.addColorStop(1, '#ff5a5a');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, bw * Math.max(0, Math.min(1, power)), bh);
}

/** Whether a placement spot is legal (used by the app to colour the ghost ball). */
export function spotOk(balls: readonly Ball[], x: number, y: number): boolean {
  return canPlaceCue(balls, x, y);
}

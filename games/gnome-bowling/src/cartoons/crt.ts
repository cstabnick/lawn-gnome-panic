// Drawing helpers for the vintage score-monitor cartoons: a limited palette, timing and easing, chunky text,
// and the stock characters (gnome pins, the ball, stars, sunburst). Every function draws on a CRT_W x CRT_H
// canvas in pixel units. Coordinates are rounded so shapes stay crisp when the canvas is scaled up.
import { CRT_H, CRT_W, type CartoonInfo } from './types';

/** The monitor's palette (an early-80s alley score system look). Use these instead of new colours. */
export const PAL = {
  black: '#0b0618',
  navy: '#1b1b5e',
  blue: '#2f5bd8',
  cyan: '#3ff0ff',
  white: '#f6f2ea',
  grey: '#8a8a9a',
  red: '#e0302c',
  pink: '#ff3fb4',
  orange: '#ff8a1e',
  yellow: '#ffd54f',
  green: '#3fcf5a',
  brown: '#8b5a2b',
  tan: '#d9a86c',
  skin: '#f1c27d',
} as const;

// ------------------------------------------------------------------ timing

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
/** Progress 0..1 of t through [a, b] (0 before, 1 after). */
export const seg = (t: number, a: number, b: number): number => clamp01((t - a) / (b - a));
export const easeIn = (k: number): number => k * k;
export const easeOut = (k: number): number => 1 - (1 - k) * (1 - k);
export const easeInOut = (k: number): number => (k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k));
/** Overshoots then settles (a cartoon "boing"). */
export const easeBack = (k: number): number => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
};
/** Height 0..1..0 of a hop across k = 0..1. */
export const hop = (k: number): number => (k <= 0 || k >= 1 ? 0 : 4 * k * (1 - k));
/** Steps t into a low frame rate (vintage animation: 8 fps looks right). */
export const stepT = (t: number, fps = 8): number => Math.floor(t * fps) / fps;
/** Seeded random 0..1 generator. */
export function rng(seed: number): () => number {
  let s = (Math.abs(Math.floor(seed)) % 2147483646) + 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ------------------------------------------------------------------ shapes

export function clear(g: CanvasRenderingContext2D, color: string = PAL.black): void {
  g.fillStyle = color;
  g.fillRect(0, 0, CRT_W, CRT_H);
}

export function rect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function circle(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.arc(Math.round(x), Math.round(y), Math.max(0.5, r), 0, Math.PI * 2);
  g.fill();
}

export function tri(g: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, cx: number, cy: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(ax, ay);
  g.lineTo(bx, by);
  g.lineTo(cx, cy);
  g.closePath();
  g.fill();
}

/** A five-point star. */
export function star(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, rot = 0): void {
  g.fillStyle = color;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
}

/** Full-screen rotating sunburst from (cx, cy): alternating wedges of two colours. */
export function sunburst(g: CanvasRenderingContext2D, cx: number, cy: number, t: number, a: string, b: string, rays = 12): void {
  clear(g, a);
  const R = CRT_W * 1.5;
  const step = (Math.PI * 2) / rays;
  g.fillStyle = b;
  for (let i = 0; i < rays; i += 2) {
    const a0 = t * 0.6 + i * step;
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
    g.lineTo(cx + Math.cos(a0 + step) * R, cy + Math.sin(a0 + step) * R);
    g.closePath();
    g.fill();
  }
}

/** The lane in perspective: a wood floor from the bottom edge to a horizon at y = horizon, with gutters. */
export function lane(g: CanvasRenderingContext2D, horizon = 40): void {
  rect(g, 0, horizon, CRT_W, CRT_H - horizon, PAL.navy);
  const cx = CRT_W / 2;
  g.fillStyle = PAL.tan;
  g.beginPath();
  g.moveTo(cx - 16, horizon);
  g.lineTo(cx + 16, horizon);
  g.lineTo(cx + 70, CRT_H);
  g.lineTo(cx - 70, CRT_H);
  g.closePath();
  g.fill();
  g.fillStyle = PAL.brown;
  for (let i = -3; i <= 3; i++) {
    g.beginPath();
    g.moveTo(cx + i * 4.6, horizon);
    g.lineTo(cx + i * 20, CRT_H);
    g.lineTo(cx + i * 20 + 1, CRT_H);
    g.lineTo(cx + i * 4.6 + 0.5, horizon);
    g.closePath();
    g.fill();
  }
}

// ------------------------------------------------------------------ text

/**
 * Chunky outlined text. `size` is the font height in pixels (8 = small, 16 = headline, 24+ = huge).
 * align: 'left' | 'center' | 'right' about x; y is the text's vertical centre.
 */
export function text(
  g: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, fill: string,
  outline: string = PAL.black, align: CanvasTextAlign = 'center',
): void {
  g.font = `900 ${Math.round(size)}px "Arial Black", Impact, system-ui, sans-serif`;
  g.textAlign = align;
  g.textBaseline = 'middle';
  const o = Math.max(1, Math.round(size / 8));
  g.fillStyle = outline;
  for (let dx = -o; dx <= o; dx += o) {
    for (let dy = -o; dy <= o + 1; dy += o) {
      if (dx !== 0 || dy !== 0) g.fillText(s, Math.round(x + dx), Math.round(y + dy));
    }
  }
  g.fillStyle = fill;
  g.fillText(s, Math.round(x), Math.round(y));
}

/** The headline word for a result: STRIKE!, DOUBLE!, TURKEY!, HAMBONE!, SPARE!, GUTTER BALL, MISS!, SPLIT! ... */
export function headline(info: CartoonInfo): string {
  switch (info.kind) {
    case 'strike': return 'STRIKE!';
    case 'double': return 'DOUBLE!';
    case 'turkey': return 'TURKEY!';
    case 'hambone': return 'HAMBONE!';
    case 'spare': return 'SPARE!';
    case 'gutter': return 'GUTTER BALL';
    case 'miss': return 'MISS!';
    case 'split': return 'SPLIT!';
    case 'nine': return '9 PINS!';
    default: return `${info.count} PINS`;
  }
}

/** Text that grows from nothing with a boing at time t0 (seconds), then wobbles. Draw every frame. */
export function slamText(
  g: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, fill: string, t: number, t0: number,
): void {
  const k = seg(t, t0, t0 + 0.35);
  if (k <= 0) return;
  const sc = easeBack(k);
  g.save();
  g.translate(x, y);
  g.rotate(Math.sin((t - t0) * 9) * 0.04);
  g.scale(sc, sc);
  text(g, s, 0, 0, size, fill);
  g.restore();
}

// ------------------------------------------------------------------ characters

export type PinFace = 'happy' | 'scared' | 'dizzy' | 'smug' | 'sweat';

export interface PinOpts {
  /** 1 = about 34 px tall (base to hat tip). */
  scale?: number;
  /** Radians, about the base. */
  rot?: number;
  face?: PinFace;
  /** Hat colour (default red). */
  hat?: string;
  /** Vertical squash: 1 normal, 0.3 = pancaked, 1.3 = stretched. Width grows to match. */
  squash?: number;
  /** Mirror left-right. */
  flip?: boolean;
}

/**
 * A gnome bowling pin standing with its base centre at (x, y): white pin body with red neck stripes,
 * a gnome face and white beard on the head, and a pointy hat.
 */
export function gnomePin(g: CanvasRenderingContext2D, x: number, y: number, o: PinOpts = {}): void {
  const s = o.scale ?? 1;
  const sq = o.squash ?? 1;
  g.save();
  g.translate(Math.round(x), Math.round(y));
  g.rotate(o.rot ?? 0);
  g.scale(s * (o.flip ? -1 : 1) / Math.sqrt(sq), s * sq);
  // body
  g.fillStyle = PAL.white;
  g.beginPath();
  g.ellipse(0, -8, 5.5, 8, 0, 0, Math.PI * 2);
  g.fill();
  g.fillRect(-2, -18, 4, 6);
  rect(g, -2.5, -17, 5, 1.5, PAL.red);
  rect(g, -2.5, -14.5, 5, 1.5, PAL.red);
  // head and beard
  circle(g, 0, -21, 4, PAL.skin);
  tri(g, -4, -20, 4, -20, 0, -13, PAL.white);
  // hat
  tri(g, -4.5, -23, 4.5, -23, 1.5, -34, o.hat ?? PAL.red);
  // face
  const face = o.face ?? 'happy';
  if (face === 'scared') {
    circle(g, -1.6, -22, 1.6, PAL.white);
    circle(g, 1.6, -22, 1.6, PAL.white);
    rect(g, -1.6, -22, 1, 1, PAL.black);
    rect(g, 1.4, -22, 1, 1, PAL.black);
    circle(g, 0, -18.6, 1.2, PAL.black);
  } else if (face === 'dizzy') {
    g.strokeStyle = PAL.black;
    g.lineWidth = 0.7;
    for (const ex of [-1.6, 1.6]) {
      g.beginPath();
      g.moveTo(ex - 1, -23);
      g.lineTo(ex + 1, -21);
      g.moveTo(ex + 1, -23);
      g.lineTo(ex - 1, -21);
      g.stroke();
    }
  } else {
    rect(g, -2, -22.5, 1, 1.2, PAL.black);
    rect(g, 1, -22.5, 1, 1.2, PAL.black);
    if (face === 'smug') rect(g, -2.3, -23.5, 1.6, 0.6, PAL.black);
    if (face === 'sweat') circle(g, 4, -22, 0.9, PAL.cyan);
  }
  circle(g, 0, -20.5, 0.9, PAL.red); // nose
  g.restore();
}

/** The bowling ball at (x, y) with radius r. `rot` turns the finger holes. `face` gives it a cartoon grin. */
export function ball(g: CanvasRenderingContext2D, x: number, y: number, r: number, rot = 0, color: string = PAL.blue, face = false): void {
  circle(g, x, y, r, color);
  circle(g, x - r * 0.3, y - r * 0.35, r * 0.28, 'rgba(255,255,255,0.35)');
  const hr = Math.max(0.6, r * 0.13);
  for (let i = 0; i < 3; i++) {
    const a = rot + i * 0.55;
    circle(g, x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, hr, PAL.black);
  }
  if (face) {
    rect(g, x - r * 0.45, y - r * 0.15, r * 0.25, r * 0.3, PAL.white);
    rect(g, x + r * 0.15, y - r * 0.15, r * 0.25, r * 0.3, PAL.white);
    g.fillStyle = PAL.white;
    g.beginPath();
    g.arc(x, y + r * 0.25, r * 0.4, 0, Math.PI);
    g.fill();
  }
}

/**
 * The ten-pin rack of gnome pins, seen from the bowler, with the head pin's base at (x, y).
 * `down` (optional) hides pins by index 0..9. Draws back rows first.
 */
export function pinRack(g: CanvasRenderingContext2D, x: number, y: number, scale = 0.6, face: PinFace = 'happy', down: readonly boolean[] = []): void {
  const rows = [[6, 7, 8, 9], [3, 4, 5], [1, 2], [0]];
  const dx = 9 * scale;
  const dy = 4 * scale;
  rows.forEach((row, r) => {
    const n = row.length;
    row.forEach((pin, j) => {
      if (down[pin]) return;
      gnomePin(g, x + (j - (n - 1) / 2) * dx * 2, y - (3 - r) * dy, { scale, face });
    });
  });
}

/** Thin bright scanline sweep (the monitor refreshing); cheap extra vintage feel. */
export function scanSweep(g: CanvasRenderingContext2D, t: number): void {
  const y = (t * 70) % (CRT_H + 20) - 10;
  rect(g, 0, y, CRT_W, 2, 'rgba(255,255,255,0.07)');
}

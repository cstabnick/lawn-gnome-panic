// Code-drawn indoor house art: the living room ('living') and the kitchen ('kitchen').
// Cartoon style: bright, chunky shapes with a darker outline. Every coordinate is computed from x, y, w, h
// so the same function draws the full-size slot and the small variant preview cards.
import Phaser from 'phaser';
import type { BackdropFn, DrawFn } from './artTypes';

type G = Phaser.GameObjects.Graphics;

/** Draw keys (HouseSlot.art) of the indoor slots. */
export const ART_KEYS_INDOOR = ['rug', 'armchair', 'fireplace', 'bookshelf', 'lamp', 'table', 'stove', 'cupboard', 'curtains', 'pot'];

/** Multiply each RGB channel by f (f < 1 darkens). */
function darken(c: number, f: number): number {
  const r = Math.round(((c >> 16) & 0xff) * f);
  const gn = Math.round(((c >> 8) & 0xff) * f);
  const b = Math.round((c & 0xff) * f);
  return (r << 16) | (gn << 8) | b;
}

/** Blend c toward white by f (0..1). */
function lighten(c: number, f: number): number {
  const ch = (v: number) => Math.round(v + (255 - v) * f);
  const r = ch((c >> 16) & 0xff);
  const gn = ch((c >> 8) & 0xff);
  const b = ch(c & 0xff);
  return (r << 16) | (gn << 8) | b;
}

/** Outline width for an item of this size (never below 1.5 px, so small preview cards still show outlines). */
function lw(w: number, h: number): number {
  return Math.max(1.5, Math.min(w, h) * 0.03);
}

/** Filled rounded box with a darker outline. */
function box(g: G, x: number, y: number, w: number, h: number, r: number, fill: number, line: number): void {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  g.fillStyle(fill, 1);
  g.fillRoundedRect(x, y, w, h, rad);
  g.lineStyle(line, darken(fill, 0.55), 1);
  g.strokeRoundedRect(x, y, w, h, rad);
}

/** Filled ellipse centred on (x, y) with a darker outline. */
function oval(g: G, x: number, y: number, w: number, h: number, fill: number, line: number): void {
  g.fillStyle(fill, 1);
  g.fillEllipse(x, y, w, h);
  g.lineStyle(line, darken(fill, 0.55), 1);
  g.strokeEllipse(x, y, w, h);
}

/** Filled polygon with a darker outline. */
function poly(g: G, pts: [number, number][], fill: number, line: number): void {
  g.fillStyle(fill, 1);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillPath();
  g.lineStyle(line, darken(fill, 0.55), 1);
  g.strokePath();
}

/** Plain filled circle, no outline (knobs, bubbles, dots). */
function dot(g: G, x: number, y: number, r: number, c: number, alpha = 1): void {
  g.fillStyle(c, alpha);
  g.fillCircle(x, y, r);
}

// ---------- Slot art ----------

const rug: DrawFn = (g, x, y, w, h, c) => {
  const l = lw(w, h);
  const s = Math.min(w, h);
  oval(g, x, y, w, h, c[1], l); // border
  oval(g, x, y, w * 0.86, h * 0.8, c[0], l); // field
  // Border pattern: a ring of accent dots, and a thin inner ring.
  const n = 20;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    dot(g, x + Math.cos(a) * w * 0.455, y + Math.sin(a) * h * 0.455, Math.max(1.5, s * 0.035), c[2]);
  }
  g.lineStyle(Math.max(1, l * 0.6), darken(c[1], 0.6), 1);
  g.strokeEllipse(x, y, w * 0.7, h * 0.66);
};

const armchair: DrawFn = (g, x, y, w, h, c) => {
  const l = lw(w, h);
  const L = x - w / 2;
  const T = y - h / 2;
  const legH = h * 0.12;
  // Little legs.
  box(g, L + w * 0.1, y + h / 2 - legH, w * 0.12, legH, w * 0.03, darken(c[1], 0.6), l);
  box(g, L + w * 0.78, y + h / 2 - legH, w * 0.12, legH, w * 0.03, darken(c[1], 0.6), l);
  // Base body, backrest, arms, seat cushion, one accent pillow.
  box(g, L + w * 0.12, T + h * 0.6, w * 0.76, h * 0.28, w * 0.05, c[0], l);
  box(g, L + w * 0.08, T, w * 0.84, h * 0.5, w * 0.14, c[0], l);
  box(g, L, T + h * 0.3, w * 0.22, h * 0.55, w * 0.1, c[0], l);
  box(g, L + w * 0.78, T + h * 0.3, w * 0.22, h * 0.55, w * 0.1, c[0], l);
  box(g, L + w * 0.2, T + h * 0.52, w * 0.6, h * 0.2, w * 0.06, c[1], l);
  box(g, L + w * 0.28, T + h * 0.14, w * 0.2, h * 0.2, w * 0.06, c[2], l);
};

const fireplace: DrawFn = (g, x, y, w, h, c) => {
  const l = lw(w, h);
  const s = Math.min(w, h);
  const L = x - w / 2;
  const T = y - h / 2;
  // Stone surround, then the dark firebox.
  box(g, L + w * 0.04, T + h * 0.14, w * 0.92, h * 0.72, s * 0.04, c[1], l);
  box(g, x - w * 0.3, T + h * 0.3, w * 0.6, h * 0.4, s * 0.04, 0x1a1414, l);
  // Logs, then the fire: orange tongues, a yellow heart, a pale core.
  const base = T + h * 0.7;
  box(g, x - w * 0.22, base - h * 0.05, w * 0.44, h * 0.05, s * 0.02, 0x5a3a1a, l);
  g.fillStyle(0xff7a1a, 1);
  g.fillTriangle(x - w * 0.2, base, x + w * 0.2, base, x, T + h * 0.38);
  g.fillTriangle(x - w * 0.2, base, x - w * 0.02, base, x - w * 0.12, T + h * 0.5);
  g.fillTriangle(x + w * 0.02, base, x + w * 0.2, base, x + w * 0.12, T + h * 0.5);
  g.fillStyle(0xffd23f, 1);
  g.fillTriangle(x - w * 0.1, base, x + w * 0.1, base, x, T + h * 0.52);
  g.fillStyle(0xfff3a0, 1);
  g.fillTriangle(x - w * 0.04, base, x + w * 0.04, base, x, T + h * 0.6);
  // Mantel on top, with accent ornaments, and the hearth in front.
  box(g, L, T, w, h * 0.14, s * 0.02, c[0], l);
  dot(g, L + w * 0.14, T + h * 0.07, Math.max(1.5, s * 0.05), c[2]);
  dot(g, x + w * 0.36, T + h * 0.07, Math.max(1.5, s * 0.05), c[2]);
  box(g, L - w * 0.02, T + h * 0.86, w * 1.04, h * 0.14, s * 0.03, c[0], l);
};

const bookshelf: DrawFn = (g, x, y, w, h, c) => {
  const l = lw(w, h);
  const s = Math.min(w, h);
  const L = x - w / 2;
  const T = y - h / 2;
  box(g, L, T, w, h, s * 0.04, c[0], l);
  const m = w * 0.07;
  const iw = w - 2 * m;
  const rows = 3;
  const rh = (h - 2 * m) / rows;
  const pt = rh * 0.1; // shelf plank thickness
  const spines = [c[1], c[2], darken(c[1], 0.7), darken(c[2], 0.75)];
  const widths = [0.12, 0.08, 0.1, 0.07, 0.11, 0.09, 0.06, 0.1];
  const bookLine = Math.max(1, l * 0.5);
  const end = L + m + iw;
  for (let r = 0; r < rows; r++) {
    const ry = T + m + r * rh;
    // Dark back panel of the shelf.
    g.fillStyle(darken(c[0], 0.45), 1);
    g.fillRect(L + m, ry, iw, rh);
    // Books of varying widths and heights, standing on the plank.
    let bx = L + m;
    let k = 0;
    while (bx < end - 0.5) {
      const bw = Math.min(iw * widths[(k + r * 3) % widths.length], end - bx);
      const bh = (rh - pt) * (0.62 + 0.36 * (((k * 5 + r * 2) % 4) / 3));
      const col = spines[(k + r) % spines.length];
      g.fillStyle(col, 1);
      g.fillRect(bx, ry + rh - pt - bh, bw, bh);
      g.lineStyle(bookLine, darken(col, 0.5), 1);
      g.strokeRect(bx, ry + rh - pt - bh, bw, bh);
      bx += bw;
      k++;
    }
    // Shelf plank.
    box(g, L + m * 0.4, ry + rh - pt, w - m * 0.8, pt, 0, lighten(c[0], 0.15), l);
  }
};

const lamp: DrawFn = (g, x, y, w, h, c) => {
  const l = lw(w, h);
  const s = Math.min(w, h);
  // Glow halo behind the shade.
  g.fillStyle(c[2], 0.12);
  g.fillCircle(x, y - h * 0.3, w * 1.3);
  g.fillStyle(c[2], 0.2);
  g.fillCircle(x, y - h * 0.3, w * 0.9);
  // Base, pole.
  oval(g, x, y + h * 0.44, w * 0.8, h * 0.1, c[1], l);
  box(g, x - w * 0.04, y - h * 0.12, w * 0.08, h * 0.58, w * 0.03, c[1], l);
  // Mushroom-style shade: a dome with spots, a rim, and a bulb glowing under it.
  oval(g, x, y - h * 0.36, w * 0.9, h * 0.2, c[0], l);
  dot(g, x - w * 0.2, y - h * 0.4, Math.max(1.5, s * 0.06), c[1]);
  dot(g, x + w * 0.15, y - h * 0.38, Math.max(1.5, s * 0.05), c[1]);
  dot(g, x + w * 0.02, y - h * 0.44, Math.max(1.5, s * 0.04), c[1]);
  oval(g, x, y - h * 0.26, w * 1.0, h * 0.07, darken(c[0], 0.8), l);
  dot(g, x, y - h * 0.22, Math.max(1.5, w * 0.1), c[2]);
};

const table: DrawFn = (g, x, y, w, h, c) => {
  const l = lw(w, h);
  const s = Math.min(w, h);
  // Legs.
  box(g, x - w * 0.42, y - h * 0.4, w * 0.08, h * 0.9, s * 0.02, c[0], l);
  box(g, x + w * 0.34, y - h * 0.4, w * 0.08, h * 0.9, s * 0.02, c[0], l);
  // Table top.
  box(g, x - w / 2, y - h / 2, w, h * 0.1, s * 0.02, c[0], l);
  // Tablecloth in colors[1] hanging to a scalloped hem.
  box(g, x - w * 0.46, y - h * 0.42, w * 0.92, h * 0.54, s * 0.02, c[1], l);
  const hemN = 6;
  const hemStep = (w * 0.92) / hemN;
  for (let i = 0; i < hemN; i++) {
    dot(g, x - w * 0.46 + (i + 0.5) * hemStep, y + h * 0.12, hemStep / 2, c[1]);
  }
  // A vase with flowers on the cloth.
  box(g, x - w * 0.07, y - h * 0.72, w * 0.14, h * 0.24, s * 0.03, c[2], l);
  dot(g, x - w * 0.04, y - h * 0.8, Math.max(1.5, s * 0.06), c[1]);
  dot(g, x + w * 0.04, y - h * 0.82, Math.max(1.5, s * 0.06), c[1]);
};

const stove: DrawFn = (g, x, y, w, h, c) => {
  const l = lw(w, h);
  const s = Math.min(w, h);
  const L = x - w / 2;
  const T = y - h / 2;
  // Body and cooktop.
  box(g, L, T, w, h, s * 0.08, c[0], l);
  box(g, L + w * 0.03, T + h * 0.04, w * 0.94, h * 0.2, s * 0.05, c[1], l);
  // Two burners; a small flame on the left one.
  oval(g, x - w * 0.2, T + h * 0.14, w * 0.22, h * 0.07, darken(c[1], 0.45), l);
  oval(g, x + w * 0.2, T + h * 0.14, w * 0.22, h * 0.07, darken(c[1], 0.45), l);
  const fx = x - w * 0.2;
  const fy = T + h * 0.12;
  g.fillStyle(0xff7a1a, 1);
  g.fillTriangle(fx - w * 0.06, fy, fx + w * 0.06, fy, fx, fy - h * 0.14);
  g.fillStyle(0xffd23f, 1);
  g.fillTriangle(fx - w * 0.03, fy, fx + w * 0.03, fy, fx, fy - h * 0.07);
  // Knobs at the cooktop edges.
  dot(g, x - w * 0.38, T + h * 0.14, Math.max(1.5, s * 0.03), c[2]);
  dot(g, x + w * 0.38, T + h * 0.14, Math.max(1.5, s * 0.03), c[2]);
  // Oven door with a glowing window and a handle.
  box(g, L + w * 0.08, T + h * 0.3, w * 0.84, h * 0.62, s * 0.04, lighten(c[0], 0.15), l);
  box(g, x - w * 0.3, T + h * 0.42, w * 0.6, h * 0.3, s * 0.03, 0x1a1a1a, l);
  g.fillStyle(c[2], 0.35);
  g.fillRect(x - w * 0.27, T + h * 0.46, w * 0.54, h * 0.22);
  box(g, x - w * 0.34, T + h * 0.34, w * 0.68, h * 0.05, s * 0.02, 0xd9d9e3, l);
};

const cupboard: DrawFn = (g, x, y, w, h, c) => {
  const l = lw(w, h);
  const s = Math.min(w, h);
  const L = x - w / 2;
  const T = y - h / 2;
  box(g, L, T, w, h, s * 0.06, c[0], l);
  // Open top shelf with three plates.
  box(g, L + w * 0.07, T + h * 0.07, w * 0.86, h * 0.2, s * 0.02, darken(c[1], 0.5), l);
  for (let i = 0; i < 3; i++) {
    oval(g, L + w * (0.25 + i * 0.25), T + h * 0.2, w * 0.18, h * 0.08, c[2], l);
  }
  // Shelf plank under the open shelf.
  box(g, L + w * 0.04, T + h * 0.3, w * 0.92, h * 0.05, s * 0.01, c[1], l);
  // Two doors with knobs.
  box(g, L + w * 0.08, T + h * 0.4, w * 0.38, h * 0.48, s * 0.03, c[1], l);
  box(g, x + w * 0.04, T + h * 0.4, w * 0.38, h * 0.48, s * 0.03, c[1], l);
  dot(g, x - w * 0.1, T + h * 0.62, Math.max(1.5, s * 0.035), c[2]);
  dot(g, x + w * 0.1, T + h * 0.62, Math.max(1.5, s * 0.035), c[2]);
  // Plinth.
  box(g, L - w * 0.02, T + h * 0.9, w * 1.04, h * 0.1, s * 0.02, darken(c[0], 0.8), l);
};

const curtains: DrawFn = (g, x, y, w, h, c) => {
  const l = lw(w, h);
  const s = Math.min(w, h);
  // Window frame, sky, mullions, sill.
  const fx = x - w * 0.3;
  const fy = y - h * 0.4;
  const fw = w * 0.6;
  const fh = h * 0.8;
  const m = w * 0.04;
  box(g, fx, fy, fw, fh, s * 0.02, c[1], l);
  g.fillStyle(c[2], 1);
  g.fillRect(fx + m, fy + m, fw - 2 * m, fh - 2 * m);
  dot(g, x - w * 0.1, y - h * 0.2, Math.max(1.5, s * 0.05), 0xffffff);
  dot(g, x - w * 0.02, y - h * 0.24, Math.max(1.5, s * 0.07), 0xffffff);
  dot(g, x + w * 0.07, y - h * 0.18, Math.max(1.5, s * 0.05), 0xffffff);
  g.fillStyle(c[1], 1);
  g.fillRect(x - s * 0.02, fy + m, s * 0.04, fh - 2 * m);
  g.fillRect(fx + m, y - s * 0.02, fw - 2 * m, s * 0.04);
  box(g, fx - w * 0.04, fy + fh, fw + w * 0.08, h * 0.06, s * 0.02, c[1], l);
  // Two curtains tied back at the sides (mirrored: sg = -1 left, +1 right).
  const curtain = (sg: number) => {
    const P = (u: number, v: number): [number, number] => [x + sg * u * w, y + v * h];
    poly(g, [P(0.52, -0.5), P(0.26, -0.5), P(0.3, -0.05), P(0.2, 0.5), P(0.52, 0.5)], c[0], l);
    g.lineStyle(Math.max(1, l * 0.6), darken(c[0], 0.8), 1);
    g.lineBetween(x + sg * w * 0.45, y - h * 0.42, x + sg * w * 0.44, y + h * 0.42);
    dot(g, x + sg * w * 0.28, y - h * 0.05, Math.max(1.5, s * 0.035), c[2]);
  };
  curtain(-1);
  curtain(1);
  // Curtain rod with end knobs.
  box(g, x - w * 0.56, y - h * 0.54, w * 1.12, h * 0.05, s * 0.025, 0x6b4a2a, l);
  dot(g, x - w * 0.56, y - h * 0.515, Math.max(1.5, s * 0.03), 0x6b4a2a);
  dot(g, x + w * 0.56, y - h * 0.515, Math.max(1.5, s * 0.03), 0x6b4a2a);
};

const pot: DrawFn = (g, x, y, w, h, c) => {
  const l = lw(w, h);
  const s = Math.min(w, h);
  // Steam puffs.
  dot(g, x - w * 0.15, y - h * 0.5, s * 0.07, 0xffffff, 0.55);
  dot(g, x + w * 0.06, y - h * 0.58, s * 0.085, 0xffffff, 0.55);
  dot(g, x + w * 0.22, y - h * 0.48, s * 0.065, 0xffffff, 0.55);
  // Handles, body, rim.
  box(g, x - w * 0.56, y - h * 0.1, w * 0.14, h * 0.12, h * 0.05, c[0], l);
  box(g, x + w * 0.42, y - h * 0.1, w * 0.14, h * 0.12, h * 0.05, c[0], l);
  box(g, x - w * 0.4, y - h * 0.25, w * 0.8, h * 0.75, h * 0.22, c[0], l);
  box(g, x - w * 0.46, y - h * 0.4, w * 0.92, h * 0.2, h * 0.08, lighten(c[0], 0.2), l);
  // Bubbling stew in the pot, with bubbles.
  oval(g, x, y - h * 0.32, w * 0.78, h * 0.12, c[1], l);
  dot(g, x - w * 0.2, y - h * 0.32, Math.max(1.5, s * 0.03), c[2]);
  dot(g, x + w * 0.1, y - h * 0.34, Math.max(1.5, s * 0.04), c[2]);
  dot(g, x + w * 0.25, y - h * 0.3, Math.max(1.5, s * 0.025), c[2]);
};

export const DRAW_INDOOR: Record<string, DrawFn> = {
  rug,
  armchair,
  fireplace,
  bookshelf,
  lamp,
  table,
  stove,
  cupboard,
  curtains,
  pot,
};

// ---------- Backdrops (1000 x 700 design space) ----------

const living: BackdropFn = (g, done) => {
  const WALL_H = 520;
  // Wallpaper with stripes.
  g.fillStyle(done ? 0xf7e9c4 : 0xe9dcbc, 1);
  g.fillRect(0, 0, 1000, WALL_H);
  g.fillStyle(done ? 0xf0d9a0 : 0xd8c39a, 1);
  for (let sx = 0; sx < 1000; sx += 60) g.fillRect(sx, 0, 30, WALL_H);
  // Round window high on the wall.
  g.fillStyle(0x8a5a2b, 1);
  g.fillCircle(850, 120, 88);
  g.fillStyle(0xbfe8ff, 1);
  g.fillCircle(850, 120, 74);
  g.lineStyle(10, 0x8a5a2b, 1);
  g.lineBetween(850, 46, 850, 194);
  g.lineBetween(776, 120, 924, 120);
  // Skirting board.
  g.fillStyle(0xc9a06a, 1);
  g.fillRect(0, 498, 1000, 22);
  g.fillStyle(0x8a5a2b, 1);
  g.fillRect(0, 498, 1000, 3);
  // Wooden floor with plank lines and staggered seams.
  g.fillStyle(0xb07a4a, 1);
  g.fillRect(0, WALL_H, 1000, 180);
  g.lineStyle(2, 0x7a4a2a, 0.7);
  for (let py = 550; py < 700; py += 30) g.lineBetween(0, py, 1000, py);
  for (let row = 0; row < 6; row++) {
    const top = WALL_H + row * 30;
    const off = (row % 2) * 80;
    for (let sx = off; sx < 1000; sx += 160) g.lineBetween(sx, top, sx, top + 30);
  }
  if (done) {
    // Warm lamplight glow around the floor lamp, and a warm wash over the room.
    g.fillStyle(0xffe08a, 0.06);
    g.fillRect(0, 0, 1000, 700);
    g.fillStyle(0xffd27a, 0.08);
    g.fillCircle(110, 380, 280);
    g.fillStyle(0xffd27a, 0.1);
    g.fillCircle(110, 380, 200);
    g.fillStyle(0xffd27a, 0.12);
    g.fillCircle(110, 380, 120);
    // Hanging picture: a hook, a string, a frame with a little landscape.
    g.lineStyle(2, 0x5a3a1a, 1);
    g.lineBetween(660, 150, 640, 190);
    g.lineBetween(660, 150, 680, 190);
    g.fillStyle(0x8a5a2b, 1);
    g.fillRect(600, 190, 120, 90);
    g.fillStyle(0xbfe8ff, 1);
    g.fillRect(610, 200, 100, 70);
    g.fillStyle(0x4fa64a, 1);
    g.fillTriangle(610, 270, 640, 225, 680, 270);
    dot(g, 690, 220, 10, 0xffd23f);
  }
};

const kitchen: BackdropFn = (g, done) => {
  const WALL_H = 500;
  const T = 50;
  // Tiled wall: a grid of squares, with the odd mint tile.
  g.fillStyle(done ? 0xfffaf0 : 0xf1ecdf, 1);
  g.fillRect(0, 0, 1000, WALL_H);
  for (let r = 0; r < WALL_H / T; r++) {
    for (let c = 0; c < 1000 / T; c++) {
      if ((r * 3 + c * 5) % 7 === 0) {
        g.fillStyle(done ? 0xbdf0e0 : 0xd8efe6, 1);
        g.fillRect(c * T, r * T, T, T);
      }
    }
  }
  g.lineStyle(2, 0xc9c0a8, 1);
  for (let x = 0; x <= 1000; x += T) g.lineBetween(x, 0, x, WALL_H);
  for (let y = 0; y <= WALL_H; y += T) g.lineBetween(0, y, 1000, y);
  // Checkered floor below the wall.
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 20; c++) {
      g.fillStyle((r + c) % 2 === 0 ? 0x6b5a48 : (done ? 0xfff6e0 : 0xeae2cc), 1);
      g.fillRect(c * T, WALL_H + r * T, T, T);
    }
  }
  if (done) {
    // Sunnier overall.
    g.fillStyle(0xfff0a0, 0.15);
    g.fillRect(0, 0, 1000, 700);
    // Garland of herbs swagged across the top of the wall.
    g.lineStyle(3, 0x2a6a2a, 1);
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const px = t * 1000;
      const py = 40 + 50 * Math.sin(Math.PI * t);
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.strokePath();
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const px = t * 1000;
      const py = 40 + 50 * Math.sin(Math.PI * t);
      g.fillStyle(i % 2 ? 0x4fd65a : 0x2a8a3a, 1);
      g.fillEllipse(px, py - 8, 26, 12);
      if (i % 3 === 0) dot(g, px, py + 10, 5, 0xff5a5a);
    }
  }
};

export const BACKDROP_INDOOR: Record<string, BackdropFn> = {
  living,
  kitchen,
};

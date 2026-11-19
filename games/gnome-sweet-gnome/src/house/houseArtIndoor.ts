// Code-drawn indoor house art: the living room ('living') and the kitchen ('kitchen').
// 3D look (light from the top-left) built from the shared helpers in shade.ts.
// Every coordinate is computed from x, y, w, h so the same function draws the full-size slot and the small
// variant preview cards. Item bases sit at y + h/2.
import Phaser from 'phaser';
import type { BackdropFn, DrawFn } from './artTypes';
import { ball, blob, cylinder, darken, gloss, groundShadow, lighten, panel, slab } from './shade';

type G = Phaser.GameObjects.Graphics;

/** Draw keys (HouseSlot.art) of the indoor slots. */
export const ART_KEYS_INDOOR = ['rug', 'armchair', 'fireplace', 'bookshelf', 'lamp', 'table', 'stove', 'cupboard', 'curtains', 'pot'];

/** Outline width for an item of this size (never below 1.5 px, so small preview cards still show outlines). */
function lw(w: number, h: number): number {
  return Math.max(1.5, Math.min(w, h) * 0.03);
}

/** Plain filled circle, no shading (steam, clouds, sun). */
function dot(g: G, x: number, y: number, r: number, c: number, alpha = 1): void {
  g.fillStyle(c, alpha);
  g.fillCircle(x, y, r);
}

/** A flat oval with the same light as shade.ts: dark rim, lighter core toward the top-left. */
function oval3(g: G, x: number, y: number, w: number, h: number, color: number, steps = 5): void {
  g.fillStyle(darken(color, 0.4), 1);
  g.fillEllipse(x, y, w, h);
  for (let i = 0; i < steps; i++) {
    const t = (i + 1) / steps;
    const k = 1 - t * 0.6;
    const e = i === 0 ? 0.94 : 1;
    g.fillStyle(i === 0 ? color : lighten(color, t * 0.28), 1);
    g.fillEllipse(x - w * 0.05 * t, y - h * 0.1 * t, w * k * e, h * k * e);
  }
}

/** A solid block: (L, T) = top-left of its footprint, w x h. Front face plus a lighter top and darker side. */
function solid(g: G, L: number, T: number, w: number, h: number, color: number): void {
  const d = Math.min(w, h) * 0.14;
  slab(g, L, T + d * 0.6, w - d, h - d * 0.6, color, d);
}

/** A filled polygon; with lineWidth > 0 also a darker outline. */
function poly(g: G, pts: [number, number][], fill: number, lineWidth = 0): void {
  g.fillStyle(fill, 1);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillPath();
  if (lineWidth > 0) {
    g.lineStyle(lineWidth, darken(fill, 0.5), 1);
    g.strokePath();
  }
}

// ---------- Slot art ----------

const rug: DrawFn = (g, x, y, w, h, c) => {
  const s = Math.min(w, h);
  groundShadow(g, x, y + h * 0.04, w * 0.96, h * 0.86, 0.2); // the rug lies on the floor, so only a soft edge shadow
  oval3(g, x, y, w, h, c[1]); // border
  oval3(g, x, y, w * 0.86, h * 0.8, c[0]); // field
  // Border pattern: a ring of accent beads, and a thin inner ring.
  const n = 20;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ball(g, x + Math.cos(a) * w * 0.455, y + Math.sin(a) * h * 0.455, Math.max(1.5, s * 0.035), c[2], false);
  }
  g.lineStyle(Math.max(1, lw(w, h) * 0.6), darken(c[1], 0.4), 0.8);
  g.strokeEllipse(x, y, w * 0.7, h * 0.66);
};

const armchair: DrawFn = (g, x, y, w, h, c) => {
  const L = x - w / 2;
  const T = y - h / 2;
  const base = y + h / 2;
  const legH = h * 0.12;
  groundShadow(g, x, base, w * 0.98, h * 0.14, 0.3);
  // Little legs.
  cylinder(g, L + w * 0.16, base, w * 0.1, legH, darken(c[1], 0.4));
  cylinder(g, L + w * 0.84, base, w * 0.1, legH, darken(c[1], 0.4));
  // Base body, backrest, arms, seat cushion, one accent pillow.
  solid(g, L + w * 0.12, T + h * 0.6, w * 0.76, h * 0.28, c[0]);
  panel(g, L + w * 0.08, T, w * 0.84, h * 0.5, c[0], w * 0.14);
  panel(g, L, T + h * 0.3, w * 0.22, h * 0.55, c[0], w * 0.1);
  panel(g, L + w * 0.78, T + h * 0.3, w * 0.22, h * 0.55, c[0], w * 0.1);
  panel(g, L + w * 0.2, T + h * 0.52, w * 0.6, h * 0.2, c[1], w * 0.06);
  panel(g, L + w * 0.28, T + h * 0.14, w * 0.2, h * 0.2, c[2], w * 0.06);
};

const fireplace: DrawFn = (g, x, y, w, h, c) => {
  const s = Math.min(w, h);
  const L = x - w / 2;
  const T = y - h / 2;
  const base = y + h / 2;
  groundShadow(g, x, base, w * 1.02, h * 0.1, 0.3);
  // Stone surround, then the dark firebox set into it.
  solid(g, L + w * 0.04, T + h * 0.14, w * 0.92, h * 0.72, c[1]);
  panel(g, x - w * 0.3, T + h * 0.3, w * 0.6, h * 0.4, 0x1a1414, s * 0.04);
  // Logs, a warm glow, then the fire: orange tongues, a yellow heart, a pale core.
  const fb = T + h * 0.7;
  solid(g, x - w * 0.22, fb - h * 0.05, w * 0.44, h * 0.05, 0x5a3a1a);
  g.fillStyle(0xff7a1a, 0.18);
  g.fillEllipse(x, fb - h * 0.12, w * 0.5, h * 0.22);
  g.fillStyle(0xff7a1a, 1);
  g.fillTriangle(x - w * 0.2, fb, x + w * 0.2, fb, x, T + h * 0.38);
  g.fillTriangle(x - w * 0.2, fb, x - w * 0.02, fb, x - w * 0.12, T + h * 0.5);
  g.fillTriangle(x + w * 0.02, fb, x + w * 0.2, fb, x + w * 0.12, T + h * 0.5);
  g.fillStyle(0xffd23f, 1);
  g.fillTriangle(x - w * 0.1, fb, x + w * 0.1, fb, x, T + h * 0.52);
  g.fillStyle(0xfff3a0, 1);
  g.fillTriangle(x - w * 0.04, fb, x + w * 0.04, fb, x, T + h * 0.6);
  // Mantel on top (polished wood), with accent ornaments, and the hearth in front.
  solid(g, L, T, w, h * 0.14, c[0]);
  gloss(g, L + w * 0.25, T + h * 0.05, w * 0.4, h * 0.04, 0.35);
  ball(g, L + w * 0.14, T + h * 0.07, Math.max(1.5, s * 0.05), c[2]);
  ball(g, x + w * 0.36, T + h * 0.07, Math.max(1.5, s * 0.05), c[2]);
  solid(g, L - w * 0.02, T + h * 0.86, w * 1.04, h * 0.14, c[0]);
};

const bookshelf: DrawFn = (g, x, y, w, h, c) => {
  const L = x - w / 2;
  const T = y - h / 2;
  const base = y + h / 2;
  groundShadow(g, x, base, w * 0.98, h * 0.1, 0.3);
  solid(g, L, T, w, h, c[0]);
  const m = w * 0.07;
  const iw = w - 2 * m;
  const rows = 3;
  const rh = (h - 2 * m) / rows;
  const pt = rh * 0.1; // shelf plank thickness
  const spines = [c[1], c[2], darken(c[1], 0.3), darken(c[2], 0.25)];
  const widths = [0.12, 0.08, 0.1, 0.07, 0.11, 0.09, 0.06, 0.1];
  const bookLine = Math.max(1, lw(w, h) * 0.5);
  const end = L + m + iw;
  for (let r = 0; r < rows; r++) {
    const ry = T + m + r * rh;
    // Dark back panel of the shelf.
    g.fillStyle(darken(c[0], 0.55), 1);
    g.fillRect(L + m, ry, iw, rh);
    // Books of varying widths and heights, standing on the plank; each has a lit left edge.
    let bx = L + m;
    let k = 0;
    while (bx < end - 0.5) {
      const bw = Math.min(iw * widths[(k + r * 3) % widths.length], end - bx);
      const bh = (rh - pt) * (0.62 + 0.36 * (((k * 5 + r * 2) % 4) / 3));
      const col = spines[(k + r) % spines.length];
      const top = ry + rh - pt - bh;
      g.fillStyle(col, 1);
      g.fillRect(bx, top, bw, bh);
      g.fillStyle(lighten(col, 0.3), 1);
      g.fillRect(bx, top, Math.max(1, bw * 0.22), bh);
      g.lineStyle(bookLine, darken(col, 0.5), 1);
      g.strokeRect(bx, top, bw, bh);
      bx += bw;
      k++;
    }
    // Shelf plank.
    solid(g, L + m * 0.4, ry + rh - pt, w - m * 0.8, pt, lighten(c[0], 0.15));
  }
};

const lamp: DrawFn = (g, x, y, w, h, c) => {
  const s = Math.min(w, h);
  const base = y + h / 2;
  // Glow halo behind the shade.
  g.fillStyle(c[2], 0.12);
  g.fillCircle(x, y - h * 0.3, w * 1.3);
  g.fillStyle(c[2], 0.2);
  g.fillCircle(x, y - h * 0.3, w * 0.9);
  groundShadow(g, x, base, w * 0.9, h * 0.1, 0.3);
  // Base, pole.
  oval3(g, x, base - h * 0.03, w * 0.8, h * 0.12, c[1]);
  cylinder(g, x, base - h * 0.03, w * 0.1, h * 0.6, c[1]);
  // Mushroom-style shade: a domed cap with spots, a rim, and a bulb glowing under it.
  blob(g, x, y - h * 0.36, w * 0.9, h * 0.2, c[0]);
  ball(g, x - w * 0.2, y - h * 0.4, Math.max(1.5, s * 0.06), c[1], false);
  ball(g, x + w * 0.15, y - h * 0.38, Math.max(1.5, s * 0.05), c[1], false);
  ball(g, x + w * 0.02, y - h * 0.44, Math.max(1.5, s * 0.04), c[1], false);
  oval3(g, x, y - h * 0.26, w, h * 0.07, darken(c[0], 0.2));
  g.fillStyle(c[2], 0.25);
  g.fillCircle(x, y - h * 0.22, Math.max(1.5, w * 0.2));
  ball(g, x, y - h * 0.22, Math.max(1.5, w * 0.1), c[2]);
};

const table: DrawFn = (g, x, y, w, h, c) => {
  const s = Math.min(w, h);
  const base = y + h / 2;
  groundShadow(g, x, base, w * 0.8, h * 0.1, 0.3);
  // Legs.
  cylinder(g, x - w * 0.38, base, w * 0.08, h * 0.9, c[0]);
  cylinder(g, x + w * 0.38, base, w * 0.08, h * 0.9, c[0]);
  // Table top (polished wood).
  solid(g, x - w / 2, y - h / 2, w, h * 0.1, c[0]);
  gloss(g, x - w * 0.3, y - h * 0.47, w * 0.4, h * 0.03, 0.35);
  // Tablecloth in colors[1] hanging to a scalloped hem.
  panel(g, x - w * 0.46, y - h * 0.42, w * 0.92, h * 0.54, c[1], s * 0.02);
  const hemN = 6;
  const hemStep = (w * 0.92) / hemN;
  for (let i = 0; i < hemN; i++) {
    ball(g, x - w * 0.46 + (i + 0.5) * hemStep, y + h * 0.12, hemStep / 2, c[1], false);
  }
  // A glass vase with flowers on the cloth.
  cylinder(g, x, y - h * 0.48, w * 0.14, h * 0.24, c[2]);
  gloss(g, x - w * 0.03, y - h * 0.62, w * 0.04, h * 0.12, 0.5);
  ball(g, x - w * 0.04, y - h * 0.8, Math.max(1.5, s * 0.06), c[1]);
  ball(g, x + w * 0.04, y - h * 0.82, Math.max(1.5, s * 0.06), c[1]);
};

const stove: DrawFn = (g, x, y, w, h, c) => {
  const s = Math.min(w, h);
  const L = x - w / 2;
  const T = y - h / 2;
  const base = y + h / 2;
  groundShadow(g, x, base, w * 0.98, h * 0.1, 0.3);
  // Body and cooktop.
  solid(g, L, T, w, h, c[0]);
  solid(g, L + w * 0.03, T + h * 0.04, w * 0.94, h * 0.2, c[1]);
  // Two burners; a small flame on the left one.
  oval3(g, x - w * 0.2, T + h * 0.14, w * 0.22, h * 0.07, darken(c[1], 0.55));
  oval3(g, x + w * 0.2, T + h * 0.14, w * 0.22, h * 0.07, darken(c[1], 0.55));
  const fx = x - w * 0.2;
  const fy = T + h * 0.12;
  g.fillStyle(0xff7a1a, 1);
  g.fillTriangle(fx - w * 0.06, fy, fx + w * 0.06, fy, fx, fy - h * 0.14);
  g.fillStyle(0xffd23f, 1);
  g.fillTriangle(fx - w * 0.03, fy, fx + w * 0.03, fy, fx, fy - h * 0.07);
  // Knobs at the cooktop edges.
  ball(g, x - w * 0.38, T + h * 0.14, Math.max(1.5, s * 0.03), c[2]);
  ball(g, x + w * 0.38, T + h * 0.14, Math.max(1.5, s * 0.03), c[2]);
  // Oven door with a glowing window and a steel handle.
  panel(g, L + w * 0.08, T + h * 0.3, w * 0.84, h * 0.62, lighten(c[0], 0.15), s * 0.04);
  panel(g, x - w * 0.3, T + h * 0.42, w * 0.6, h * 0.3, 0x1a1a1a, s * 0.03);
  g.fillStyle(c[2], 0.35);
  g.fillRect(x - w * 0.27, T + h * 0.46, w * 0.54, h * 0.22);
  gloss(g, x - w * 0.12, T + h * 0.5, w * 0.22, h * 0.08, 0.35);
  solid(g, x - w * 0.34, T + h * 0.34, w * 0.68, h * 0.05, 0xd9d9e3);
  gloss(g, x - w * 0.14, T + h * 0.345, w * 0.2, h * 0.02, 0.7);
};

const cupboard: DrawFn = (g, x, y, w, h, c) => {
  const s = Math.min(w, h);
  const L = x - w / 2;
  const T = y - h / 2;
  const base = y + h / 2;
  groundShadow(g, x, base, w * 0.98, h * 0.1, 0.3);
  solid(g, L, T, w, h, c[0]);
  // Open top shelf with three glazed plates.
  solid(g, L + w * 0.07, T + h * 0.07, w * 0.86, h * 0.2, darken(c[1], 0.5));
  for (let i = 0; i < 3; i++) {
    const px = L + w * (0.25 + i * 0.25);
    oval3(g, px, T + h * 0.2, w * 0.18, h * 0.08, c[2]);
    gloss(g, px - w * 0.04, T + h * 0.18, w * 0.06, h * 0.03, 0.4);
  }
  // Shelf plank under the open shelf.
  solid(g, L + w * 0.04, T + h * 0.3, w * 0.92, h * 0.05, c[1]);
  // Two doors with knobs.
  panel(g, L + w * 0.08, T + h * 0.4, w * 0.38, h * 0.48, c[1], s * 0.03);
  panel(g, x + w * 0.04, T + h * 0.4, w * 0.38, h * 0.48, c[1], s * 0.03);
  ball(g, x - w * 0.1, T + h * 0.62, Math.max(1.5, s * 0.035), c[2]);
  ball(g, x + w * 0.1, T + h * 0.62, Math.max(1.5, s * 0.035), c[2]);
  // Plinth.
  solid(g, L - w * 0.02, T + h * 0.9, w * 1.04, h * 0.1, darken(c[0], 0.2));
};

const curtains: DrawFn = (g, x, y, w, h, c) => {
  const s = Math.min(w, h);
  const l = lw(w, h);
  // Window frame (a panel), glass with a lit upper corner, mullions, sill.
  const fx = x - w * 0.3;
  const fy = y - h * 0.4;
  const fw = w * 0.6;
  const fh = h * 0.8;
  const m = w * 0.04;
  panel(g, fx, fy, fw, fh, c[1], s * 0.02);
  g.fillGradientStyle(lighten(c[2], 0.35), lighten(c[2], 0.35), c[2], c[2], 1);
  g.fillRect(fx + m, fy + m, fw - 2 * m, fh - 2 * m);
  dot(g, x - w * 0.1, y - h * 0.2, Math.max(1.5, s * 0.05), 0xffffff);
  dot(g, x - w * 0.02, y - h * 0.24, Math.max(1.5, s * 0.07), 0xffffff);
  dot(g, x + w * 0.07, y - h * 0.18, Math.max(1.5, s * 0.05), 0xffffff);
  solid(g, x - s * 0.02, fy + m, s * 0.04, fh - 2 * m, c[1]);
  solid(g, fx + m, y - s * 0.02, fw - 2 * m, s * 0.04, c[1]);
  solid(g, fx - w * 0.04, fy + fh, fw + w * 0.08, h * 0.06, c[1]);
  // Two curtains tied back at the sides (mirrored: sg = -1 left, +1 right), with fold lines.
  const curtain = (sg: number) => {
    const P = (u: number, v: number): [number, number] => [x + sg * u * w, y + v * h];
    poly(g, [P(0.52, -0.5), P(0.26, -0.5), P(0.3, -0.05), P(0.2, 0.5), P(0.52, 0.5)], c[0], l);
    g.lineStyle(1, lighten(c[0], 0.3), 0.6);
    g.lineBetween(x + sg * w * 0.4, y - h * 0.44, x + sg * w * 0.36, y + h * 0.44);
    g.lineStyle(1, darken(c[0], 0.35), 0.6);
    g.lineBetween(x + sg * w * 0.33, y - h * 0.44, x + sg * w * 0.3, y + h * 0.44);
    g.lineStyle(Math.max(1, l * 0.6), darken(c[0], 0.8), 1);
    g.lineBetween(x + sg * w * 0.45, y - h * 0.42, x + sg * w * 0.44, y + h * 0.42);
    ball(g, x + sg * w * 0.28, y - h * 0.05, Math.max(1.5, s * 0.035), c[2], false);
  };
  curtain(-1);
  curtain(1);
  // Curtain rod (polished wood) with end knobs.
  solid(g, x - w * 0.56, y - h * 0.54, w * 1.12, h * 0.05, 0x6b4a2a);
  gloss(g, x - w * 0.3, y - h * 0.525, w * 0.3, h * 0.02, 0.45);
  ball(g, x - w * 0.56, y - h * 0.515, Math.max(1.5, s * 0.03), 0x6b4a2a);
  ball(g, x + w * 0.56, y - h * 0.515, Math.max(1.5, s * 0.03), 0x6b4a2a);
};

const pot: DrawFn = (g, x, y, w, h, c) => {
  const s = Math.min(w, h);
  const base = y + h / 2;
  groundShadow(g, x, base, w * 0.9, h * 0.12, 0.3);
  // Steam puffs.
  dot(g, x - w * 0.15, y - h * 0.5, s * 0.07, 0xffffff, 0.55);
  dot(g, x + w * 0.06, y - h * 0.58, s * 0.085, 0xffffff, 0.55);
  dot(g, x + w * 0.22, y - h * 0.48, s * 0.065, 0xffffff, 0.55);
  // Handles, body (a rounded metal pot), rim.
  panel(g, x - w * 0.56, y - h * 0.1, w * 0.14, h * 0.12, c[0], h * 0.05);
  panel(g, x + w * 0.42, y - h * 0.1, w * 0.14, h * 0.12, c[0], h * 0.05);
  panel(g, x - w * 0.4, y - h * 0.25, w * 0.8, h * 0.75, c[0], h * 0.22);
  gloss(g, x - w * 0.22, y - h * 0.05, w * 0.12, h * 0.22, 0.35);
  panel(g, x - w * 0.46, y - h * 0.4, w * 0.92, h * 0.2, lighten(c[0], 0.2), h * 0.08);
  // Bubbling stew in the pot, with glossy bubbles.
  oval3(g, x, y - h * 0.32, w * 0.78, h * 0.12, c[1]);
  ball(g, x - w * 0.2, y - h * 0.32, Math.max(1.5, s * 0.03), c[2]);
  ball(g, x + w * 0.1, y - h * 0.34, Math.max(1.5, s * 0.04), c[2]);
  ball(g, x + w * 0.25, y - h * 0.3, Math.max(1.5, s * 0.025), c[2]);
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

/** Shadow band on a wall just above a floor line: darkest at the line, fading upward. */
function wallShadow(g: G, bottom: number, height: number): void {
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const top = bottom - height + i * (height / steps);
    g.fillStyle(0x2a1a0a, 0.07);
    g.fillRect(0, top, 1000, bottom - top);
  }
}

/** A flat polygon of a distant hill, clipped to the round window (centre 850,120; r 74). */
function windowHill(g: G, base: number, amp: number, phase: number, color: number): void {
  const bottom = (dx: number) => 120 + Math.sqrt(Math.max(0, 74 * 74 - dx * dx)) - 1;
  const pts: [number, number][] = [];
  for (let dx = -74; dx <= 74; dx += 4) {
    const top = base - amp * Math.sin(((dx + 74) / 148) * Math.PI * 1.1 + phase);
    pts.push([850 + dx, Math.min(top, bottom(dx))]);
  }
  for (let dx = 74; dx >= -74; dx -= 4) pts.push([850 + dx, bottom(dx)]);
  poly(g, pts, color);
}

const living: BackdropFn = (g, done) => {
  const WALL_H = 520;
  const FLOOR_H = 180;
  const wall = done ? 0xf7e9c4 : 0xe9dcbc;
  // Wallpaper: a soft top-to-bottom gradient, with stripes.
  g.fillGradientStyle(lighten(wall, 0.12), lighten(wall, 0.12), darken(wall, 0.08), darken(wall, 0.08), 1);
  g.fillRect(0, 0, 1000, WALL_H);
  g.fillStyle(done ? 0xf0d9a0 : 0xd8c39a, 1);
  for (let sx = 0; sx < 1000; sx += 60) g.fillRect(sx, 0, 30, WALL_H);
  wallShadow(g, 498, 30);
  // Round window high on the wall: a bevelled frame, glass with distant hills, glare, mullions.
  g.fillStyle(0x8a5a2b, 1);
  g.fillCircle(850, 120, 88);
  g.fillStyle(lighten(0x8a5a2b, 0.25), 1);
  g.fillCircle(846, 116, 84);
  g.fillStyle(0xbfe8ff, 1);
  g.fillCircle(850, 120, 74);
  windowHill(g, 158, 14, 0.3, 0xa9d6e6); // far hill: lighter and bluer
  windowHill(g, 178, 10, 1.2, 0x6fae6a); // near hill: greener and darker
  gloss(g, 812, 92, 40, 22, 0.5);
  g.lineStyle(10, 0x8a5a2b, 1);
  g.lineBetween(850, 46, 850, 194);
  g.lineBetween(776, 120, 924, 120);
  solid(g, 758, 206, 184, 14, 0xc9a06a);
  // Skirting board.
  g.fillGradientStyle(lighten(0xc9a06a, 0.2), lighten(0xc9a06a, 0.2), darken(0xc9a06a, 0.15), darken(0xc9a06a, 0.15), 1);
  g.fillRect(0, 498, 1000, 22);
  g.fillStyle(0x8a5a2b, 1);
  g.fillRect(0, 498, 1000, 3);
  // Wooden floor: a warm gradient, planks whose rows get taller toward the viewer, and staggered seams
  // converging slightly toward the back.
  const floorC = 0xb07a4a;
  g.fillGradientStyle(darken(floorC, 0.12), darken(floorC, 0.12), lighten(floorC, 0.08), lighten(floorC, 0.08), 1);
  g.fillRect(0, WALL_H, 1000, FLOOR_H);
  const rowY = (i: number) => WALL_H + FLOOR_H * Math.pow(i / 6, 1.4);
  const vx = (x: number, y: number) => 500 + (x - 500) * (0.82 + 0.18 * ((y - WALL_H) / FLOOR_H));
  for (let r = 0; r < 6; r++) {
    const yT = rowY(r);
    const yB = rowY(r + 1);
    g.lineStyle(2, 0x7a4a2a, 0.6);
    g.lineBetween(0, yT, 1000, yT);
    g.lineStyle(1, lighten(floorC, 0.25), 0.5);
    g.lineBetween(0, yT + 1.5, 1000, yT + 1.5);
    const off = (r % 2) * 80;
    g.lineStyle(2, 0x7a4a2a, 0.6);
    for (let sx = off - 160; sx <= 1160; sx += 160) g.lineBetween(vx(sx, yT), yT, vx(sx, yB), yB);
  }
  g.fillStyle(0x2a1a0a, 0.12);
  g.fillRect(0, WALL_H, 1000, 8);
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
    // Hanging picture: a hook, a string, a bevelled frame, glass with a little landscape and a sun.
    g.lineStyle(2, 0x5a3a1a, 1);
    g.lineBetween(660, 150, 640, 190);
    g.lineBetween(660, 150, 680, 190);
    panel(g, 600, 190, 120, 90, 0x8a5a2b, 6);
    g.fillGradientStyle(0xd6f0ff, 0xd6f0ff, 0xbfe8ff, 0xbfe8ff, 1);
    g.fillRect(610, 200, 100, 70);
    g.fillStyle(0x9cc9a0, 1); // distant hill: lighter and bluer
    g.fillTriangle(610, 270, 640, 228, 680, 270);
    g.fillStyle(0x4fa64a, 1);
    g.fillTriangle(625, 270, 662, 240, 700, 270);
    dot(g, 690, 220, 10, 0xffd23f);
    gloss(g, 622, 212, 24, 12, 0.35);
  }
};

const kitchen: BackdropFn = (g, done) => {
  const WALL_H = 500;
  const T = 50;
  const FLOOR_H = 200;
  const wall = done ? 0xfffaf0 : 0xf1ecdf;
  // Tiled wall: a grid of squares, with the odd mint tile. Each tile gets a glaze highlight and a shaded lower edge.
  g.fillStyle(wall, 1);
  g.fillRect(0, 0, 1000, WALL_H);
  const mint = done ? 0xbdf0e0 : 0xd8efe6;
  for (let r = 0; r < WALL_H / T; r++) {
    for (let c = 0; c < 1000 / T; c++) {
      if ((r * 3 + c * 5) % 7 === 0) {
        g.fillStyle(mint, 1);
        g.fillRect(c * T, r * T, T, T);
      }
      g.fillStyle(0xffffff, 0.22);
      g.fillRect(c * T + 3, r * T + 3, T - 6, T * 0.22);
      g.fillStyle(0x000000, 0.04);
      g.fillRect(c * T, r * T + T * 0.85, T, T * 0.15);
    }
  }
  g.lineStyle(2, 0xc9c0a8, 1);
  for (let x = 0; x <= 1000; x += T) g.lineBetween(x, 0, x, WALL_H);
  for (let y = 0; y <= WALL_H; y += T) g.lineBetween(0, y, 1000, y);
  wallShadow(g, WALL_H, 38);
  // Checkered floor below the wall, in perspective: rows get taller toward the viewer, and columns
  // converge slightly toward the back.
  const rowY = (i: number) => WALL_H + FLOOR_H * Math.pow(i / 4, 1.4);
  const vx = (x: number, y: number) => 500 + (x - 500) * (0.8 + 0.2 * ((y - WALL_H) / FLOOR_H));
  const lightTile = done ? 0xfff6e0 : 0xeae2cc;
  for (let r = 0; r < 4; r++) {
    const yT = rowY(r);
    const yB = rowY(r + 1);
    for (let c = -4; c <= 24; c++) {
      const dark = (((r + c) % 2) + 2) % 2 === 0;
      poly(
        g,
        [
          [vx(c * T, yT), yT],
          [vx((c + 1) * T, yT), yT],
          [vx((c + 1) * T, yB), yB],
          [vx(c * T, yB), yB],
        ],
        dark ? 0x6b5a48 : lightTile,
      );
    }
  }
  if (done) {
    // Sunnier overall.
    g.fillStyle(0xfff0a0, 0.15);
    g.fillRect(0, 0, 1000, 700);
    // Garland of herbs swagged across the top of the wall: leaves are flat shaded ovals, berries glossy balls.
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
      oval3(g, px, py - 8, 26, 12, i % 2 ? 0x4fd65a : 0x2a8a3a, 3);
      if (i % 3 === 0) ball(g, px, py + 10, 5, 0xff5a5a);
    }
  }
};

export const BACKDROP_INDOOR: Record<string, BackdropFn> = {
  living,
  kitchen,
};

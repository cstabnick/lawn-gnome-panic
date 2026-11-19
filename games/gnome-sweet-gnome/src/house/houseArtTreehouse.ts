// Code-drawn Oakwood Treehouse art: the Rope Deck ('treedeck'), the Treetop Bedroom ('treebed') and the
// Acorn Workshop ('treeshop'). Every shape is computed from the x, y, w, h it is given, so the same function
// draws the full-size slot and the small variant preview cards. Light comes from the top-left, using the
// helpers in shade.ts. Colours: c0 = main, c1 = second, c2 = accent.
import Phaser from 'phaser';
import type { BackdropFn, DrawFn } from './artTypes';
import { ball, cylinder, gloss, groundShadow, lighten, panel, slab } from './shade';

type G = Phaser.GameObjects.Graphics;
type Pt = [number, number];

/** Draw keys (HouseSlot.art) of the treehouse slots. */
export const ART_KEYS_TREEHOUSE = ['ladder', 'railing', 'hammock', 'birdhouse', 'telescope', 'bed', 'knothole', 'nightstand', 'mobile', 'workbench', 'toolrack', 'barrels', 'cuckoo'];

/** Multiplies each RGB channel by f (0..1). */
function darken(c: number, f: number): number {
  const r = Math.round(((c >> 16) & 0xff) * f);
  const gg = Math.round(((c >> 8) & 0xff) * f);
  const b = Math.round((c & 0xff) * f);
  return (r << 16) | (gg << 8) | b;
}

/** Outline colour for a fill. */
function ol(c: number): number {
  return darken(c, 0.55);
}

/** Outline width for an item of size w x h. */
function lw(w: number, h: number): number {
  return Math.max(2, Math.min(w, h) * 0.03);
}

/** Plain filled circle, no shading (glows, flecks). */
function dot(g: G, x: number, y: number, r: number, c: number, alpha = 1): void {
  g.fillStyle(c, alpha);
  g.fillCircle(x, y, r);
}

/** A filled polygon; with lineWidth > 0 also a darker outline. */
function poly(g: G, pts: Pt[], fill: number, lineWidth = 0): void {
  g.fillStyle(fill, 1);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillPath();
  if (lineWidth > 0) {
    g.lineStyle(lineWidth, ol(fill), 1);
    g.strokePath();
  }
}

/** A straight rod or rope from (x1, y1) to (x2, y2): a dark outline, then the colour on top. */
function bar(g: G, x1: number, y1: number, x2: number, y2: number, width: number, color: number): void {
  g.lineStyle(width + Math.max(1.5, width * 0.25), ol(color), 1);
  g.lineBetween(x1, y1, x2, y2);
  g.lineStyle(width, color, 1);
  g.lineBetween(x1, y1, x2, y2);
}

/** Four-point star of radius r. */
function star4(g: G, x: number, y: number, r: number, c: number, alpha = 1): void {
  g.fillStyle(c, alpha);
  g.fillTriangle(x - r * 0.22, y, x + r * 0.22, y, x, y - r);
  g.fillTriangle(x - r * 0.22, y, x + r * 0.22, y, x, y + r);
  g.fillTriangle(x, y - r * 0.22, x, y + r * 0.22, x - r, y);
  g.fillTriangle(x, y - r * 0.22, x, y + r * 0.22, x + r, y);
}

/** A bright sparkle (backdrops, "done" state). */
function sparkle(g: G, x: number, y: number, r: number): void {
  dot(g, x, y, r * 0.6, 0xfff7c0, 0.5);
  star4(g, x, y, r, 0xffffff);
}

/** Points of a star with n points, outer radius R and inner radius r, centred on (cx, cy). */
function starPts(cx: number, cy: number, R: number, r: number, n = 5): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const rad = i % 2 ? r : R;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  return pts;
}

/** A bevelled solid block: (L, T) = top-left of its front face. */
function solid(g: G, L: number, T: number, w: number, h: number, color: number): void {
  slab(g, L, T, w, h, color, Math.min(w, h) * 0.14);
}

/** A vertical gradient rectangle, `top` at y, `bottom` at y + h. */
function vgrad(g: G, x: number, y: number, w: number, h: number, top: number, bottom: number): void {
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(x, y, w, h);
}

/** Overlapping circles in a canopy: dark rim, body, lighter top-left core. */
function canopy(g: G, list: [number, number, number][], c: number): void {
  g.fillStyle(darken(c, 0.6), 1);
  for (const [cx, cy, r] of list) g.fillCircle(cx, cy, r + 3);
  g.fillStyle(c, 1);
  for (const [cx, cy, r] of list) g.fillCircle(cx, cy, r);
  g.fillStyle(lighten(c, 0.22), 1);
  for (const [cx, cy, r] of list) g.fillCircle(cx - r * 0.18, cy - r * 0.22, r * 0.7);
}

// ---------- Slot art ----------

const ladder: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const L = x - w / 2;
  const T = y - h / 2;
  const B = y + h / 2;
  const rl = x - w * 0.3;
  const rr = x + w * 0.3;
  groundShadow(g, x, B, w * 0.9, h * 0.04, 0.2);
  // Branch stub at the top, the ropes tied on to it.
  slab(g, L - w * 0.06, T, w * 1.12, h * 0.05, c1, h * 0.03);
  for (const rx of [rl, rr]) {
    bar(g, rx, T + h * 0.03, rx, B, Math.max(3, w * 0.09), c0);
    // Rope twist: short slanted flecks down the rope.
    g.lineStyle(1.5, lighten(c0, 0.35), 0.8);
    for (let i = 0; i < 14; i++) {
      const py = T + h * 0.08 + i * ((h * 0.9) / 14);
      g.lineBetween(rx - w * 0.04, py, rx + w * 0.04, py + h * 0.02);
    }
    ball(g, rx, B - h * 0.01, Math.max(2, w * 0.06), c2, false);
  }
  // Wooden rungs across the ropes.
  const n = 7;
  for (let i = 0; i < n; i++) {
    const ry = T + h * 0.16 + i * ((h * 0.72) / (n - 1));
    slab(g, rl - w * 0.03, ry, rr - rl + w * 0.06, h * 0.035, c1, h * 0.02);
    ball(g, rl, ry + h * 0.017, Math.max(1.5, w * 0.035), c2, false);
  }
};

const railing: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const L = x - w / 2;
  const T = y - h / 2;
  const B = y + h / 2;
  groundShadow(g, x, B, w * 0.97, h * 0.07, 0.25);
  // Spindles: thin rods between the rails, drawn first so the rails cover their ends.
  const nS = Math.max(6, Math.round(w / (h * 0.2)));
  for (let i = 0; i <= nS; i++) {
    const px = L + w * 0.03 + w * 0.94 * (i / nS);
    cylinder(g, px, B - h * 0.02, Math.max(2, h * 0.07), h * 0.62, c1);
  }
  slab(g, L, T + h * 0.04, w, h * 0.16, c0, h * 0.06); // top rail
  slab(g, L, T + h * 0.36, w, h * 0.12, c0, h * 0.05); // middle rail
  slab(g, L, B - h * 0.12, w, h * 0.1, c0, h * 0.05); // low rail on the deck
  // Posts, each with a knot ball on its cap.
  const nP = Math.max(3, Math.round(w / (h * 0.9)));
  for (let i = 0; i <= nP; i++) {
    const px = L + w * 0.02 + w * 0.96 * (i / nP);
    cylinder(g, px, B, Math.max(3, h * 0.15), h * 0.9, c0);
    ball(g, px, T + h * 0.1, Math.max(2, h * 0.06), c2, false);
  }
};

const hammock: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const L = x - w / 2;
  const R = x + w / 2;
  const l = lw(w, h);
  // The cloth hangs from its ends: the ends are high, the belly sags.
  const px = (t: number) => L + w * t;
  const top = (t: number) => y - h * 0.3 + 4 * t * (1 - t) * h * 0.4;
  const bot = (t: number) => top(t) + h * 0.26 + 4 * t * (1 - t) * h * 0.04;
  // Ropes up to the trees (drawn first).
  bar(g, L - w * 0.12, y - h * 0.55, px(0.02), top(0), Math.max(2, w * 0.02), 0x6b4a2a);
  bar(g, R + w * 0.12, y - h * 0.55, px(0.98), top(1), Math.max(2, w * 0.02), 0x6b4a2a);
  ball(g, L - w * 0.12, y - h * 0.55, Math.max(2, w * 0.03), c2, false);
  ball(g, R + w * 0.12, y - h * 0.55, Math.max(2, w * 0.03), c2, false);
  // Cloth in stripes, alternating c0 and c1.
  const N = 12;
  for (let i = 0; i < N; i++) {
    const t0 = i / N;
    const t1 = (i + 1) / N;
    poly(g, [[px(t0), top(t0)], [px(t1), top(t1)], [px(t1), bot(t1)], [px(t0), bot(t0)]], i % 2 ? c1 : c0);
  }
  // Outline around the whole cloth.
  g.lineStyle(l, ol(c0), 1);
  g.beginPath();
  g.moveTo(px(0), top(0));
  for (let i = 1; i <= 24; i++) g.lineTo(px(i / 24), top(i / 24));
  for (let i = 24; i >= 0; i--) g.lineTo(px(i / 24), bot(i / 24));
  g.closePath();
  g.strokePath();
  // Shade the underside of the belly and add a gloss streak along the top.
  poly(g, [[px(0.2), bot(0.2) - h * 0.05], [px(0.5), bot(0.5) - h * 0.02], [px(0.8), bot(0.8) - h * 0.05], [px(0.8), bot(0.8)], [px(0.5), bot(0.5)], [px(0.2), bot(0.2)]], darken(c0, 0.75));
  gloss(g, x - w * 0.12, top(0.5) + h * 0.06, w * 0.4, h * 0.05, 0.3);
  // Fringe balls at the ends.
  ball(g, px(0), top(0) + h * 0.12, Math.max(2, h * 0.05), c2, false);
  ball(g, px(1), top(1) + h * 0.12, Math.max(2, h * 0.05), c2, false);
};

const birdhouse: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const L = x - w / 2;
  const R = x + w / 2;
  const T = y - h / 2;
  const B = y + h / 2;
  const l = lw(w, h);
  const roofBase = T + h * 0.34;
  const wallBot = T + h * 0.8;
  groundShadow(g, x, B, w * 0.8, h * 0.05, 0.25);
  // Post into the ground.
  cylinder(g, x, B, Math.max(3, w * 0.13), B - wallBot + h * 0.02, 0x6b4a2a);
  // Walls, with two board seams.
  slab(g, L + w * 0.1, roofBase, w * 0.8, wallBot - roofBase, c0, w * 0.08);
  g.lineStyle(Math.max(1, l * 0.4), darken(c0, 0.7), 0.35);
  for (let i = 1; i <= 2; i++) {
    const bx = L + w * 0.1 + (w * 0.8 * i) / 3;
    g.lineBetween(bx, roofBase + h * 0.02, bx, wallBot - h * 0.02);
  }
  // Round hole with a coloured rim, a shadowed interior and a perch under it.
  const hy = roofBase + (wallBot - roofBase) * 0.45;
  const hr = Math.min(w * 0.14, h * 0.09);
  g.fillStyle(ol(c2), 1);
  g.fillCircle(x, hy, hr + l);
  g.fillStyle(c2, 1);
  g.fillCircle(x, hy, hr + l * 0.4);
  dot(g, x, hy, hr, 0x2a1a0a);
  slab(g, x - w * 0.22, hy + hr + h * 0.02, w * 0.44, h * 0.03, c1, h * 0.02);
  // Pitched roof: a lit left face, a shaded right face and an outline.
  const apex: Pt = [x, T];
  const eaveL: Pt = [L - w * 0.06, roofBase];
  const eaveR: Pt = [R + w * 0.06, roofBase];
  poly(g, [eaveL, apex, [x, roofBase]], lighten(c1, 0.12));
  poly(g, [apex, eaveR, [x, roofBase]], darken(c1, 0.8));
  g.lineStyle(l, ol(c1), 1);
  g.lineBetween(eaveL[0], eaveL[1], apex[0], apex[1]);
  g.lineBetween(apex[0], apex[1], eaveR[0], eaveR[1]);
  g.lineBetween(eaveL[0], eaveL[1], eaveR[0], eaveR[1]);
  ball(g, x, T, Math.max(2, w * 0.05), c2, true);
};

const telescope: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const s = Math.min(w, h);
  const l = lw(w, h);
  const B = y + h / 2;
  const pv: Pt = [x + w * 0.01, y - h * 0.3]; // mount, under the tube
  groundShadow(g, x, B, w * 0.8, h * 0.06, 0.3);
  // Tripod legs from the mount down to the floor.
  const tw = Math.max(2, s * 0.035);
  for (const fx of [-0.32, 0.3, 0.02]) bar(g, pv[0], pv[1], x + w * fx, B, tw, c1);
  // Tube: a tilted barrel from the eyepiece (low, left) to the lens end (high, right).
  const t = Math.max(4, s * 0.11);
  const e: Pt = [x - w * 0.24, y - h * 0.2];
  const o: Pt = [x + w * 0.26, y - h * 0.44];
  bar(g, e[0], e[1], o[0], o[1], t, c0);
  // Glint along the upper edge.
  const dx = o[0] - e[0];
  const dy = o[1] - e[1];
  const len = Math.hypot(dx, dy);
  const nx = (dy / len) * t * 0.22;
  const ny = (-dx / len) * t * 0.22;
  g.lineStyle(Math.max(1, t * 0.2), lighten(c0, 0.45), 0.8);
  g.lineBetween(e[0] + nx, e[1] + ny, o[0] + nx, o[1] + ny);
  // Lens glass at the far end, eyepiece at the near end, and the mount.
  g.fillStyle(ol(c1), 1);
  g.fillCircle(o[0], o[1], t * 0.62 + l * 0.6);
  g.fillStyle(c2, 1);
  g.fillCircle(o[0], o[1], t * 0.62);
  gloss(g, o[0] - t * 0.15, o[1] - t * 0.15, t * 0.4, t * 0.3, 0.6);
  ball(g, e[0], e[1], t * 0.7, c1);
  ball(g, pv[0], pv[1], Math.max(3, s * 0.06), c1);
};

const bed: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const L = x - w / 2;
  const R = x + w / 2;
  const T = y - h / 2;
  const B = y + h / 2;
  groundShadow(g, x, B, w * 0.98, h * 0.08, 0.3);
  const FB = B - h * 0.14; // underside of the frame; the legs stand below it
  const legC = darken(c1, 0.6);
  cylinder(g, L + w * 0.06, B, w * 0.06, h * 0.14, legC);
  cylinder(g, R - w * 0.06, B, w * 0.06, h * 0.14, legC);
  // Footboard (short, right), the frame, the quilt with patches, a pillow, then the tall headboard (left).
  panel(g, R - w * 0.08, T + h * 0.42, w * 0.08, FB - (T + h * 0.42) + h * 0.02, c1, w * 0.04);
  slab(g, L + w * 0.06, FB - h * 0.16, w * 0.88, h * 0.16, c1, h * 0.05);
  const qT = T + h * 0.4;
  const qH = FB - h * 0.04 - qT;
  panel(g, L + w * 0.1, qT, w * 0.8, qH, c0, h * 0.08);
  g.fillStyle(lighten(c0, 0.3), 0.45);
  g.fillRect(L + w * 0.1, qT, w * 0.8, h * 0.04); // folded top edge
  for (let i = 0; i < 4; i++) {
    g.fillStyle(c2, 0.5);
    g.fillRect(L + w * 0.2 + i * w * 0.16, qT + qH * 0.3, w * 0.1, qH * 0.4);
  }
  panel(g, L + w * 0.14, qT - h * 0.06, w * 0.2, h * 0.16, lighten(c2, 0.35), h * 0.06);
  panel(g, L, T, w * 0.1, FB - T + h * 0.02, c1, w * 0.05);
  ball(g, L + w * 0.05, T, Math.max(2, w * 0.035), c2, false);
};

const knothole: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const s = Math.min(w, h);
  const l = lw(w, h);
  const r = s * 0.36;
  const rim = s * 0.13;
  // A soft shadow on the wall, then the bark rim: a dark outline, a bark ring, knobs and growth rings.
  dot(g, x + s * 0.03, y + s * 0.04, r + rim + l, 0x000000, 0.12);
  g.fillStyle(ol(c1), 1);
  g.fillCircle(x, y, r + rim + l);
  g.fillStyle(c1, 1);
  g.fillCircle(x, y, r + rim);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ball(g, x + Math.cos(a) * (r + rim * 0.5), y + Math.sin(a) * (r + rim * 0.5), Math.max(1.5, rim * 0.3), darken(c1, 0.8), false);
  }
  g.lineStyle(Math.max(1, rim * 0.12), darken(c1, 0.5), 0.6);
  g.strokeCircle(x, y, r + rim * 0.45);
  // The hole: the sky colour c0, lighter toward the top-left, with a sun and stars in c2.
  g.fillStyle(darken(c0, 0.85), 1);
  g.fillCircle(x, y, r);
  for (let i = 1; i <= 4; i++) {
    const t = i / 4;
    g.fillStyle(lighten(c0, t * 0.2), 1);
    g.fillCircle(x - r * 0.1 * t, y - r * 0.12 * t, r * (1 - 0.22 * t));
  }
  ball(g, x + r * 0.42, y - r * 0.42, r * 0.2, c2, false);
  star4(g, x - r * 0.4, y + r * 0.3, r * 0.22, c2);
  star4(g, x + r * 0.1, y + r * 0.5, r * 0.14, c2);
  gloss(g, x - r * 0.35, y - r * 0.42, r * 0.55, r * 0.22, 0.4);
  // A wooden sill under the hole.
  slab(g, x - r * 1.15, y + r + rim * 0.35, r * 2.3, rim * 0.55, c1, rim * 0.25);
};

const nightstand: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const L = x - w / 2;
  const T = y - h / 2;
  const B = y + h / 2;
  const s = Math.min(w, h);
  groundShadow(g, x, B, w, h * 0.06, 0.3);
  const slabTop = T + h * 0.24;
  const topY = T + h * 0.32;
  // Cabinet body with two drawers, each with a cream knob.
  solid(g, L + w * 0.04, topY, w * 0.92, B - h * 0.05 - topY, c0);
  for (const d of [topY + h * 0.04, topY + h * 0.33]) {
    panel(g, L + w * 0.1, d, w * 0.8, h * 0.25, lighten(c0, 0.06), w * 0.05);
    ball(g, x, d + h * 0.125, Math.max(2, s * 0.05), c1, true);
  }
  slab(g, L + w * 0.02, B - h * 0.05, w * 0.96, h * 0.05, darken(c0, 0.8), h * 0.03); // plinth
  // Top slab, the candle on it, and the light its flame throws.
  slab(g, L - w * 0.03, slabTop, w * 1.06, h * 0.08, lighten(c0, 0.1), h * 0.05);
  cylinder(g, x, slabTop, w * 0.2, h * 0.14, c1);
  dot(g, x, T + h * 0.04, w * 0.7, c2, 0.12);
  dot(g, x, T + h * 0.04, w * 0.4, c2, 0.2);
  g.fillStyle(c2, 1);
  g.fillEllipse(x, T + h * 0.05, w * 0.1, h * 0.08);
  g.fillStyle(0xffffff, 0.85);
  g.fillEllipse(x, T + h * 0.06, w * 0.05, h * 0.05);
};

const mobile: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const L = x - w / 2;
  const R = x + w / 2;
  const T = y - h / 2;
  const s = Math.min(w, h);
  const l = lw(w, h);
  const stickY = T + h * 0.14;
  // Hook from the ceiling and the twig the items hang from.
  g.lineStyle(Math.max(1.5, l * 0.5), 0x3a3a3a, 0.8);
  g.lineBetween(x, T, x, stickY);
  bar(g, L + w * 0.06, stickY, R - w * 0.06, stickY, Math.max(3, s * 0.03), 0x6b4a2a);
  // Left: an acorn (c0 body, c1 cap, c2 leaf).
  const ax = x - w * 0.3;
  const ay = y + h * 0.04;
  const ar = w * 0.11;
  g.lineStyle(1.5, 0x3a3a3a, 0.7);
  g.lineBetween(ax, stickY, ax, ay - ar * 1.1);
  ball(g, ax, ay, ar, c0, true);
  g.fillStyle(darken(c1, 0.6), 1);
  g.fillEllipse(ax, ay - ar * 0.6, ar * 1.9, ar * 0.9);
  g.fillStyle(c1, 1);
  g.fillEllipse(ax, ay - ar * 0.66, ar * 1.8, ar * 0.7);
  g.fillStyle(c2, 1);
  g.fillEllipse(ax + ar * 0.5, ay - ar * 1.1, ar * 0.7, ar * 0.35);
  // Middle: a star (c0), with a centre dot (c1) and a sparkle (c2).
  const mx = x;
  const my = y + h * 0.2;
  const R0 = w * 0.15;
  g.lineStyle(1.5, 0x3a3a3a, 0.7);
  g.lineBetween(mx, stickY, mx, my - R0 * 0.9);
  poly(g, starPts(mx, my, R0, R0 * 0.45), c0, l);
  dot(g, mx, my, R0 * 0.22, c1);
  star4(g, mx + R0 * 0.6, my - R0 * 0.6, R0 * 0.3, c2);
  // Right: a feather (c0 vane, c1 spine, c2 tip).
  const fx = x + w * 0.3;
  const fy = y - h * 0.02;
  const len = h * 0.36;
  const wd = w * 0.085;
  g.lineStyle(1.5, 0x3a3a3a, 0.7);
  g.lineBetween(fx, stickY, fx, fy - len / 2);
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const py = fy - len / 2 + t * len;
    const hw = wd * Math.sin(Math.PI * Math.pow(t, 0.7));
    left.push([fx - hw, py]);
    right.push([fx + hw, py]);
  }
  poly(g, [...left, ...right.reverse()], c0, l);
  g.lineStyle(Math.max(1, l * 0.7), c1, 1);
  g.lineBetween(fx, fy - len / 2, fx, fy + len / 2);
  dot(g, fx, fy + len / 2, wd * 0.35, c2);
};

const workbench: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const L = x - w / 2;
  const R = x + w / 2;
  const T = y - h / 2;
  const B = y + h / 2;
  const s = Math.min(w, h);
  groundShadow(g, x, B, w * 0.96, h * 0.07, 0.3);
  const topY = T + h * 0.22;
  const topH = h * 0.12;
  const legTop = topY + topH;
  // Lower shelf and legs, behind the top.
  slab(g, L + w * 0.08, B - h * 0.2, w * 0.84, h * 0.05, c1, h * 0.03);
  slab(g, L + w * 0.04, legTop, w * 0.1, B - legTop, c1, s * 0.03);
  slab(g, R - w * 0.14, legTop, w * 0.1, B - legTop, c1, s * 0.03);
  // Drawer under the top, with a knob.
  solid(g, L + w * 0.12, legTop, w * 0.76, h * 0.14, lighten(c0, 0.05));
  ball(g, x, legTop + h * 0.07, Math.max(1.5, s * 0.03), c2, false);
  // Tabletop with grain lines.
  slab(g, L, topY, w, topH, c0, s * 0.05);
  g.lineStyle(1, darken(c0, 0.6), 0.35);
  for (let i = 1; i < 4; i++) g.lineBetween(L + w * 0.04, topY + topH * (i / 4), R - w * 0.04, topY + topH * (i / 4));
  // A hammer lying on the top, and a tin of nails.
  bar(g, L + w * 0.1, topY - h * 0.07, L + w * 0.3, topY - h * 0.07, Math.max(3, h * 0.03), 0x8a5a2b);
  slab(g, L + w * 0.28, topY - h * 0.12, w * 0.05, h * 0.1, 0x9a9aa6, h * 0.02);
  cylinder(g, R - w * 0.18, topY, w * 0.1, h * 0.1, c2);
};

const toolrack: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const L = x - w / 2;
  const T = y - h / 2;
  const s = Math.min(w, h);
  // Shadow on the wall, then the frame and the board.
  g.fillStyle(0x2a1a0a, 0.12);
  g.fillRoundedRect(L + s * 0.03, T + s * 0.04, w, h, s * 0.08);
  panel(g, L, T, w, h, c1, s * 0.08);
  panel(g, L + w * 0.04, T + h * 0.06, w * 0.92, h * 0.88, c0, s * 0.05);
  // Pegboard holes.
  for (let r = 0; r < 6; r++) {
    for (let k = 0; k < 14; k++) {
      dot(g, L + w * 0.08 + k * ((w * 0.84) / 13), T + h * 0.12 + r * ((h * 0.72) / 5), Math.max(1, s * 0.012), darken(c0, 0.55), 0.6);
    }
  }
  // Hammer on a hook: a steel head, a c2 handle.
  const hx = x - w * 0.26;
  ball(g, hx, T + h * 0.1, Math.max(2, s * 0.03), 0x3a3a3a, false);
  slab(g, hx - w * 0.07, T + h * 0.2, w * 0.14, h * 0.12, 0x9a9aa6, h * 0.03);
  bar(g, hx, T + h * 0.32, hx, T + h * 0.86, Math.max(3, w * 0.035), c2);
  // Saw: a c1 handle and a zigzag steel blade.
  const sx = x + w * 0.02;
  const bt = T + h * 0.28;
  const bb = T + h * 0.84;
  panel(g, sx - w * 0.06, T + h * 0.18, w * 0.12, h * 0.1, c1, s * 0.03);
  const blade: Pt[] = [[sx - w * 0.05, bt], [sx + w * 0.05, bt]];
  for (let i = 0; i <= 8; i++) {
    const px = sx + w * 0.05 - (i * w * 0.1) / 8;
    blade.push([px, bb - (i % 2 ? h * 0.05 : 0)]);
  }
  poly(g, blade, 0xc4c4cc, Math.max(1, s * 0.012));
  // Wrench: a steel bar with an open head at the top and a ring at the bottom.
  const wx = x + w * 0.27;
  const wTop = T + h * 0.2;
  const wBot = T + h * 0.84;
  bar(g, wx, wTop, wx, wBot, Math.max(3, w * 0.03), 0x9a9aa6);
  ball(g, wx, wTop, w * 0.05, 0x9a9aa6, true);
  dot(g, wx, wTop, w * 0.02, darken(c0, 0.5));
  ball(g, wx, wBot, w * 0.04, 0x9a9aa6, false);
};

/** One barrel standing on (cx, base), with two hoops in c1 and a bung in c2. */
function barrel(g: G, cx: number, base: number, bw: number, bh: number, c0: number, c1: number, c2: number): void {
  cylinder(g, cx, base, bw, bh, c0);
  for (const t of [0.2, 0.8]) {
    const hy = base - bh * t;
    g.fillStyle(ol(c1), 1);
    g.fillRect(cx - bw / 2 - 1, hy - bh * 0.035, bw + 2, bh * 0.07);
    g.fillStyle(c1, 1);
    g.fillRect(cx - bw / 2, hy - bh * 0.025, bw, bh * 0.05);
  }
  ball(g, cx + bw * 0.12, base - bh, Math.max(2, bw * 0.06), c2, true);
}

const barrels: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const B = y + h / 2;
  groundShadow(g, x, B, w * 0.96, h * 0.06, 0.3);
  // Back barrel first (darker, a little higher), then the two in front.
  barrel(g, x + w * 0.02, B - h * 0.1, w * 0.3, h * 0.6, darken(c0, 0.8), c1, c2);
  barrel(g, x - w * 0.24, B, w * 0.38, h * 0.8, c0, c1, c2);
  barrel(g, x + w * 0.24, B, w * 0.36, h * 0.72, c0, c1, c2);
};

const cuckoo: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const L = x - w / 2;
  const R = x + w / 2;
  const T = y - h / 2;
  const B = y + h / 2;
  const s = Math.min(w, h);
  const l = lw(w, h);
  groundShadow(g, x, B, w * 0.9, h * 0.05, 0.25);
  const roofY = T + h * 0.2;
  // Case body under the hood.
  slab(g, L + w * 0.1, roofY, w * 0.8, B - roofY - h * 0.02, c0, w * 0.07);
  // Hood: a pitched roof in c1, lit on the left.
  const apex: Pt = [x, T];
  const eaveL: Pt = [L - w * 0.04, roofY + h * 0.01];
  const eaveR: Pt = [R + w * 0.04, roofY + h * 0.01];
  poly(g, [eaveL, apex, [x, roofY + h * 0.01]], lighten(c1, 0.12));
  poly(g, [apex, eaveR, [x, roofY + h * 0.01]], darken(c1, 0.78));
  g.lineStyle(l, ol(c1), 1);
  g.lineBetween(eaveL[0], eaveL[1], apex[0], apex[1]);
  g.lineBetween(apex[0], apex[1], eaveR[0], eaveR[1]);
  g.lineBetween(eaveL[0], eaveL[1], eaveR[0], eaveR[1]);
  // Little door with the cuckoo peeking out; its beak is orange.
  const doorY = roofY + h * 0.05;
  const doorH = h * 0.12;
  g.fillStyle(0x2a1a0a, 1);
  g.fillRoundedRect(x - w * 0.14, doorY, w * 0.28, doorH, w * 0.06);
  ball(g, x + w * 0.03, doorY + doorH * 0.55, w * 0.06, c2, true);
  poly(g, [[x + w * 0.08, doorY + doorH * 0.5], [x + w * 0.15, doorY + doorH * 0.6], [x + w * 0.08, doorY + doorH * 0.7]], 0xff7a1a);
  // Clock face: a c1 rim, a cream face, twelve tick dots, two hands and a hub in c2.
  const fr = w * 0.27;
  const rim = Math.max(2, w * 0.04);
  const fx = x;
  const fy = roofY + (B - roofY) * 0.5;
  g.fillStyle(ol(c1), 1);
  g.fillCircle(fx, fy, fr + rim + l);
  g.fillStyle(c1, 1);
  g.fillCircle(fx, fy, fr + rim);
  g.fillStyle(0xfffbef, 1);
  g.fillCircle(fx, fy, fr);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    dot(g, fx + Math.cos(a) * fr * 0.8, fy + Math.sin(a) * fr * 0.8, Math.max(1, fr * 0.06), 0x3a3a3a);
  }
  bar(g, fx, fy, fx, fy - fr * 0.7, Math.max(1.5, fr * 0.07), 0x3a3a3a);
  bar(g, fx, fy, fx + fr * 0.5, fy - fr * 0.2, Math.max(1.5, fr * 0.05), 0x3a3a3a);
  ball(g, fx, fy, Math.max(1.5, fr * 0.08), c2, false);
  // Pendulum: a rod and a weight in c2.
  const pTop = fy + fr + rim;
  const pBot = B - h * 0.1;
  bar(g, x, pTop, x, pBot, Math.max(2, w * 0.025), c1);
  ball(g, x, pBot + w * 0.02, w * 0.08, c2, true);
};

export const DRAW_TREEHOUSE: Record<string, DrawFn> = {
  ladder,
  railing,
  hammock,
  birdhouse,
  telescope,
  bed,
  knothole,
  nightstand,
  mobile,
  workbench,
  toolrack,
  barrels,
  cuckoo,
};

// ---------- Backdrops (1000 x 700 design space) ----------

/** Rope Deck: an open deck high in an oak. Sky above, treetops, a big trunk on the left, planks below y 520. */
const treedeck: BackdropFn = (g, done) => {
  const DECK = 520;
  if (done) vgrad(g, 0, 0, 1000, DECK, 0x58b4f0, 0xf0faff);
  else vgrad(g, 0, 0, 1000, DECK, 0x3f9fe6, 0xd2f0ff);
  if (done) {
    // Sun glow in the top-right corner.
    dot(g, 880, 110, 120, 0xfff3a0, 0.14);
    dot(g, 880, 110, 70, 0xfff3a0, 0.16);
    ball(g, 880, 110, 36, 0xffd23f, true);
  }
  // Distant treetops below the sky.
  canopy(
    g,
    [[60, 420, 80], [230, 380, 100], [430, 410, 90], [620, 370, 110], [820, 400, 100], [960, 430, 80], [330, 460, 70], [700, 470, 70]],
    done ? 0x6fd06a : 0x5fae5a,
  );
  // The big trunk on the left: a lit face, a shaded face and bark furrows.
  poly(g, [[-10, -10], [170, -10], [200, DECK + 10], [-10, DECK + 10]], 0x7a5230);
  poly(g, [[-10, -10], [70, -10], [95, DECK + 10], [-10, DECK + 10]], 0xa0703e);
  g.lineStyle(3, 0x4a2e18, 0.6);
  for (let i = 0; i < 6; i++) {
    const bx = 15 + i * 28;
    g.lineBetween(bx, 0, bx + (i % 2 ? 6 : -4), DECK);
  }
  // A branch running out to the right, with a leafy tuft at its end.
  g.lineStyle(26, 0x7a5230, 1);
  g.lineBetween(150, 110, 330, 40);
  ball(g, 330, 40, 40, 0x4fa64a, true);
  ball(g, 300, 20, 26, 0x6fbf4a, false);
  // The deck: a warm plank floor below y 520, with an edge lip and staggered seams.
  const plank = done ? 0xc4905a : 0xb07a4a;
  g.fillGradientStyle(lighten(plank, 0.1), lighten(plank, 0.1), darken(plank, 0.15), darken(plank, 0.15), 1);
  g.fillRect(0, DECK, 1000, 700 - DECK);
  g.fillStyle(lighten(plank, 0.3), 1);
  g.fillRect(0, DECK - 6, 1000, 8);
  g.fillStyle(darken(plank, 0.5), 0.6);
  g.fillRect(0, DECK + 2, 1000, 3);
  const rowH = (700 - DECK) / 4;
  for (let r = 0; r < 4; r++) {
    const y0 = DECK + r * rowH;
    g.lineStyle(2, 0x7a4a2a, 0.7);
    g.lineBetween(0, y0, 1000, y0);
    g.lineStyle(2, 0x7a4a2a, 0.5);
    const off = (r % 2) * 150;
    for (let sx = off - 300; sx < 1000; sx += 300) g.lineBetween(sx, y0, sx, y0 + rowH);
    g.lineStyle(1, lighten(plank, 0.25), 0.4);
    g.lineBetween(0, y0 + 3, 1000, y0 + 3);
  }
  if (done) {
    sparkle(g, 300, 150, 16);
    sparkle(g, 700, 300, 12);
    sparkle(g, 420, 60, 10);
    sparkle(g, 640, 600, 12);
  }
};

/** Treetop Bedroom: inside a hollow tree. Curved bark walls round a wooden oval, a wooden floor below y 560. */
const treebed: BackdropFn = (g, done) => {
  const FLOOR = 560;
  // Bark all round: a dark gradient with curved furrows.
  g.fillGradientStyle(0x7a5530, 0x7a5530, 0x2a1c10, 0x2a1c10, 1);
  g.fillRect(0, 0, 1000, 700);
  for (let i = 0; i < 20; i++) {
    const x0 = -20 + i * 54;
    g.lineStyle(8 + (i % 3) * 3, i % 2 ? 0x3a2612 : 0x9a6a3a, 0.45);
    g.beginPath();
    g.moveTo(x0, 0);
    for (let k = 1; k <= 7; k++) g.lineTo(x0 + Math.sin(i * 1.7 + k) * 12, k * 100);
    g.strokePath();
  }
  // The hollow: a warm wooden oval, lighter toward the top-left, with rings where the walls bend.
  const cx = 500;
  const cy = 290;
  const rx = 470;
  const ry = 330;
  const wood = done ? 0xd49a5a : 0xb07a4a;
  g.fillStyle(darken(wood, 0.8), 1);
  g.fillEllipse(cx, cy, rx * 2, ry * 2);
  for (let i = 1; i <= 5; i++) {
    const k = 1 - i * 0.1;
    g.fillStyle(lighten(wood, i * 0.04), 1);
    g.fillEllipse(cx - i * 6, cy - i * 8, rx * 2 * k, ry * 2 * k);
  }
  for (let k = 0; k < 6; k++) {
    g.lineStyle(7 - k, k % 2 ? 0x4a2e18 : 0x9a6a3a, 0.7);
    g.strokeEllipse(cx, cy, rx * 2 - k * 16, ry * 2 - k * 12);
  }
  // Wooden floor with staggered boards.
  const floorC = 0x9a6a3a;
  g.fillGradientStyle(darken(floorC, 0.85), darken(floorC, 0.85), lighten(floorC, 0.1), lighten(floorC, 0.1), 1);
  g.fillRect(0, FLOOR, 1000, 700 - FLOOR);
  const rowH = (700 - FLOOR) / 4;
  for (let r = 0; r < 4; r++) {
    const y0 = FLOOR + r * rowH;
    g.lineStyle(2, 0x5a3a1a, 0.6);
    g.lineBetween(0, y0, 1000, y0);
    const off = (r % 2) * 120;
    for (let sx = off - 240; sx < 1000; sx += 240) g.lineBetween(sx, y0, sx, y0 + rowH);
  }
  g.fillStyle(0x2a1a0a, 0.3);
  g.fillRect(0, FLOOR - 6, 1000, 8);
  if (done) {
    // Warm lamplight through the hollow, and fireflies.
    dot(g, 500, 290, 420, 0xffd27a, 0.1);
    const flies: Pt[] = [[140, 180], [860, 260], [300, 520], [720, 110], [930, 470]];
    for (const [fx, fy] of flies) {
      dot(g, fx, fy, 14, 0xfff27a, 0.25);
      dot(g, fx, fy, 4, 0xfff7c0, 0.95);
    }
  }
};

/** Acorn Workshop: a workshop inside the trunk. Plank walls, sawdust floor below y 560, a hanging bulb. */
const treeshop: BackdropFn = (g, done) => {
  const FLOOR = 560;
  // Plank walls: vertical boards in two tones, with seams and grain.
  const boardW = 100;
  for (let i = 0; i < 10; i++) {
    const bx = i * boardW;
    const tone = i % 2 ? 0x9a6a3a : 0xa67a4a;
    g.fillStyle(done ? lighten(tone, 0.08) : tone, 1);
    g.fillRect(bx, 0, boardW, FLOOR);
    g.lineStyle(3, 0x5a3a1a, 0.7);
    g.lineBetween(bx, 0, bx, FLOOR);
    g.lineStyle(1, 0x5a3a1a, 0.35);
    g.lineBetween(bx + 20, 60, bx + 20, FLOOR - 10);
    g.lineBetween(bx + 58, 40, bx + 62, FLOOR - 30);
  }
  // Dark bark band over the top, curving down at the edges.
  g.fillStyle(0x3a2612, 1);
  g.fillRect(0, 0, 1000, 34);
  g.fillEllipse(500, -40, 1100, 140);
  // A bulb on a wire: a warm glow around it.
  g.lineStyle(2, 0x3a2612, 1);
  g.lineBetween(500, 40, 500, 88);
  dot(g, 500, 112, done ? 170 : 130, 0xfff2b0, 0.15);
  dot(g, 500, 112, 60, 0xfff2b0, 0.25);
  ball(g, 500, 112, 20, 0xfff7c0, true);
  // Sawdust floor below the wall line, with flecks.
  g.fillGradientStyle(0xd9b47a, 0xd9b47a, 0xb8895a, 0xb8895a, 1);
  g.fillRect(0, FLOOR, 1000, 700 - FLOOR);
  g.fillStyle(0x6b4a2a, 0.5);
  g.fillRect(0, FLOOR - 2, 1000, 4);
  for (let i = 0; i < 90; i++) {
    const px = (i * 137.5) % 1000;
    const py = FLOOR + 6 + ((i * 71) % 130);
    dot(g, px, py, 1.5 + (i % 3) * 0.7, i % 2 ? 0xf2dcae : 0x9a6a3a, 0.5);
  }
  if (done) {
    sparkle(g, 200, 620, 12);
    sparkle(g, 820, 600, 14);
    sparkle(g, 380, 200, 10);
  }
};

export const BACKDROP_TREEHOUSE: Record<string, BackdropFn> = {
  treedeck,
  treebed,
  treeshop,
};

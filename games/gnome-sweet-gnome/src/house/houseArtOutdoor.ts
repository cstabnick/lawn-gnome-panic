// Code-drawn outdoor house art: the Front Yard ('yard') and the Mushroom Cottage ('cottage').
// Every shape is computed from the x, y, w, h it is given, so the same function draws the
// full-size slot and the small variant preview cards. Outlines are a darker shade of the fill.
// Solid things use the 3D helpers in shade.ts (light from the top-left).
import Phaser from 'phaser';
import type { BackdropFn, DrawFn } from './artTypes';
import { ball, blob, cylinder, gloss, groundShadow, lighten, panel, slab } from './shade';

type G = Phaser.GameObjects.Graphics;
type Circle = readonly [number, number, number]; // x, y, radius

export const ART_KEYS_OUTDOOR = ['path', 'fence', 'flowerbed', 'mailbox', 'tree', 'roof', 'door', 'windows', 'chimney', 'lanterns'];

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

/** A union of circles with one shared outline (overlaps do not show a seam). */
function circles(g: G, list: readonly Circle[], fill: number, l: number): void {
  g.fillStyle(ol(fill), 1);
  for (const [cx, cy, r] of list) g.fillCircle(cx, cy, r + l);
  g.fillStyle(fill, 1);
  for (const [cx, cy, r] of list) g.fillCircle(cx, cy, r);
}

/** Triangle with a darker outline. */
function tri(g: G, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, fill: number, l: number): void {
  g.fillStyle(fill, 1);
  g.fillTriangle(x1, y1, x2, y2, x3, y3);
  g.lineStyle(l, ol(fill), 1);
  g.lineBetween(x1, y1, x2, y2);
  g.lineBetween(x2, y2, x3, y3);
  g.lineBetween(x3, y3, x1, y1);
}

/** A round-topped (arch) shape: a circle of radius rw centred on (x, topC), down to `bottom`. */
function arch(g: G, x: number, topC: number, rw: number, bottom: number, fill: number, l: number): void {
  g.fillStyle(ol(fill), 1);
  g.fillCircle(x, topC, rw + l);
  g.fillRect(x - rw - l, topC, 2 * (rw + l), bottom - topC + l);
  g.fillStyle(fill, 1);
  g.fillCircle(x, topC, rw);
  g.fillRect(x - rw, topC, 2 * rw, bottom - topC);
}

/** Upper half of an ellipse as a polygon (from the left end over the top to the right end). */
function dome(cx: number, cy: number, rx: number, ry: number): Phaser.Math.Vector2[] {
  const pts: Phaser.Math.Vector2[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI + (Math.PI * i) / steps;
    pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry));
  }
  return pts;
}

/** Four-point sparkle star. */
function sparkle(g: G, x: number, y: number, r: number): void {
  g.fillStyle(0xfff7c0, 0.5);
  g.fillCircle(x, y, r * 0.6);
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(x - r * 0.22, y, x + r * 0.22, y, x, y - r);
  g.fillTriangle(x - r * 0.22, y, x + r * 0.22, y, x, y + r);
  g.fillTriangle(x, y - r * 0.22, x, y + r * 0.22, x - r, y);
  g.fillTriangle(x, y - r * 0.22, x, y + r * 0.22, x + r, y);
}

// ---------- Items ----------

const path: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  groundShadow(g, x, y + h / 2, w * 1.0, h * 0.1, 0.18);
  const rows = 7;
  const rowH = h / rows;
  const pad = rowH * 0.12;
  for (let r = 0; r < rows; r++) {
    const t = (r + 0.5) / rows; // 0 at the top, 1 at the bottom
    const cy = y + h / 2 - (1 - t) * h;
    const cx = x + Math.sin(t * Math.PI * 2) * w * 0.12;
    const hw = w * (0.22 + 0.06 * t); // wider towards the viewer
    g.fillStyle(c1, 1);
    g.fillRect(cx - hw, cy - rowH / 2, hw * 2, rowH);
    const sw = (hw * 2) / 3;
    for (let i = -1; i <= 3; i++) {
      const sx = cx - hw + i * sw + (r % 2 ? sw / 2 : 0);
      const L = Math.max(sx + pad, cx - hw + pad);
      const R = Math.min(sx + sw - pad, cx + hw - pad);
      if (R - L < pad) continue;
      const top = cy - rowH / 2 + pad;
      const sh = rowH - pad * 2;
      panel(g, L, top, R - L, sh, c0, rowH * 0.25);
      if ((r * 3 + i) % 4 === 0) {
        ball(g, (L + R) / 2, cy, Math.max(1.5, rowH * 0.12), c2, false);
      }
    }
  }
};

const fence: DrawFn = (g, x, y, w, h, [c0, c1]) => {
  const l = lw(w, h);
  const left = x - w / 2;
  const top = y - h / 2;
  const bottom = y + h / 2;
  groundShadow(g, x, bottom, w * 0.98, h * 0.12, 0.3);
  const n = Math.max(3, Math.round(w / (h * 0.42)));
  const sp = w / n;
  const pw = sp * 0.6;
  // Two rails behind the pickets.
  slab(g, left, top + h * 0.3, w, h * 0.14, c1, h * 0.05);
  slab(g, left, top + h * 0.62, w, h * 0.14, c1, h * 0.05);
  const bodyTop = top + h * 0.22;
  for (let i = 0; i < n; i++) {
    const px = left + sp * i + (sp - pw) / 2;
    slab(g, px, bodyTop, pw, bottom - bodyTop, c0, pw * 0.22);
    tri(g, px, bodyTop, px + pw, bodyTop, px + pw / 2, top, c0, l);
    // Shade the right half of each pointed top.
    g.fillStyle(darken(c0, 0.86), 1);
    g.fillTriangle(px + pw / 2, top, px + pw, bodyTop, px + pw / 2, bodyTop);
  }
};

const flowerbed: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  groundShadow(g, x, y + h / 2, w * 0.98, h * 0.14, 0.3);
  const soilY = y + h * 0.22;
  const soilW = w * 0.96;
  const soilH = h * 0.56;
  const n = 6;
  const headR = Math.max(3, Math.min(w, h) * 0.075);
  for (let i = 0; i < n; i++) {
    const fx = x - w * 0.38 + (i * w * 0.76) / (n - 1);
    const fy = y - h * (0.28 + 0.2 * (((i * 2) % 3) / 2));
    // Stem and leaf.
    g.lineStyle(Math.max(2, w * 0.012), c1, 1);
    g.lineBetween(fx, soilY, fx, fy);
    blob(g, fx + (i % 2 ? 1 : -1) * headR * 1.3, fy + headR * 2.6, headR * 1.8, headR * 0.9, c1, false);
    // Petals (alternating colours), each a shaded ball, with a centre.
    const petal = i % 2 ? c2 : c0;
    const centre = i % 2 ? c0 : c2;
    const petals: Circle[] = [];
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + i;
      petals.push([fx + Math.cos(a) * headR * 0.8, fy + Math.sin(a) * headR * 0.8, headR * 0.6]);
    }
    circles(g, petals, petal, l * 0.6);
    for (const [px, py, pr] of petals) ball(g, px, py, pr, petal, false);
    ball(g, fx, fy, headR * 0.5, centre, true);
  }
  // Soil mound on top of the stem bases, with pebbles and a mulch band.
  blob(g, x, soilY, soilW, soilH, 0x6b4a2a, false);
  ball(g, x - soilW * 0.3, soilY + soilH * 0.1, Math.max(2, h * 0.04), 0xbfb6a4, true);
  ball(g, x + soilW * 0.25, soilY + soilH * 0.18, Math.max(2, h * 0.035), 0xbfb6a4, true);
  blob(g, x, y - h * 0.02, soilW * 0.7, h * 0.07, c1, false);
};

const mailbox: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  groundShadow(g, x, y + h / 2, w * 1.2, h * 0.08, 0.25);
  // Post.
  cylinder(g, x, y + h / 2, w * 0.14, h * 0.55, c1);
  // Box with a rounded top, a letter slot and a metal glint.
  panel(g, x - w * 0.42, y - h * 0.4, w * 0.84, h * 0.36, c0, w * 0.16);
  g.fillStyle(ol(c0), 1);
  g.fillRect(x - w * 0.25, y - h * 0.3, w * 0.5, h * 0.05);
  gloss(g, x - w * 0.14, y - h * 0.355, w * 0.4, h * 0.035, 0.35);
  // Flag stick and raised flag.
  cylinder(g, x + w * 0.45, y - h * 0.16, w * 0.06, h * 0.3, c1);
  tri(g, x + w * 0.48, y - h * 0.46, x + w * 0.48, y - h * 0.32, x + w * 0.95, y - h * 0.39, c2, l * 0.7);
};

const tree: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  groundShadow(g, x + w * 0.05, y + h / 2, w * 0.75, h * 0.08, 0.3);
  // Trunk.
  cylinder(g, x, y + h / 2, w * 0.18, h * 0.55, c1);
  // Overlapping canopy lobes: one outline around the whole crown, then each lobe shaded.
  const canopy: Circle[] = [
    [x - w * 0.22, y - h * 0.12, w * 0.24],
    [x + w * 0.22, y - h * 0.12, w * 0.24],
    [x, y - h * 0.3, w * 0.3],
    [x, y + h * 0.02, w * 0.22],
  ];
  circles(g, canopy, c0, l);
  for (const [cx, cy, r] of canopy) blob(g, cx, cy, r * 2, r * 2, c0);
  // Fruit or blossom dots.
  const dots: ReadonlyArray<readonly [number, number]> = [[-0.3, -0.3], [0.05, -0.42], [0.3, -0.15], [-0.18, -0.08], [0.2, 0.02], [-0.05, -0.22]];
  for (const [dx, dy] of dots) {
    ball(g, x + dx * w, y + dy * h, Math.max(2, w * 0.035), c2, true);
  }
};

const roof: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const baseY = y + h * 0.25;
  const rx = w / 2;
  const ry = h * 0.75;
  // Shadow the cap casts on the gills, then the gills (a rounded underside).
  groundShadow(g, x, baseY + h * 0.02, w * 0.9, h * 0.2, 0.3);
  blob(g, x, baseY, w * 0.98, h * 0.16, c1, false);
  // Cap: a dark outline dome, then the cap dome, then lighter domes shifted toward the top-left.
  const l = lw(w, h);
  g.fillStyle(ol(c0), 1);
  g.fillPoints(dome(x, baseY, rx + l, ry + l), true);
  g.fillStyle(c0, 1);
  g.fillPoints(dome(x, baseY, rx, ry), true);
  for (let i = 1; i <= 4; i++) {
    const k = 1 - i * 0.16;
    g.fillStyle(lighten(c0, i * 0.07), 1);
    g.fillPoints(dome(x - rx * 0.12 * (i / 4), baseY, rx * k, ry * k), true);
  }
  // Spots (normalised x in -1..1, height in 0..1 of the dome), each a little shaded ball.
  const spots: ReadonlyArray<readonly [number, number]> = [[-0.5, 0.45], [0.1, 0.6], [0.55, 0.3], [-0.2, 0.15], [0.3, 0.25]];
  for (const [dx, dy] of spots) {
    ball(g, x + dx * rx, baseY - dy * ry, w * 0.07, c1, true);
  }
  // Shine.
  g.fillStyle(c2, 0.5);
  g.fillEllipse(x - rx * 0.5, baseY - ry * 0.6, rx * 0.3, ry * 0.12);
  gloss(g, x - rx * 0.4, baseY - ry * 0.7, rx * 0.4, ry * 0.12, 0.45);
};

const door: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const bottom = y + h / 2;
  const topC = y - h / 2 + w / 2;
  groundShadow(g, x, bottom, w * 1.4, h * 0.06, 0.3);
  // Arch frame behind the door.
  const fw = w * 0.07;
  arch(g, x, topC, w / 2 + fw, bottom, c1, l);
  // Door, then light from the top-left: lit left half, shaded right half.
  arch(g, x, topC, w / 2, bottom, c0, l);
  g.fillStyle(lighten(c0, 0.22), 0.45);
  g.fillRect(x - w / 2, topC, w / 2, bottom - topC);
  g.fillStyle(darken(c0, 0.7), 0.35);
  g.fillRect(x, topC, w / 2, bottom - topC);
  // Planks and rails.
  g.lineStyle(Math.max(1.5, l * 0.6), darken(c0, 0.7), 1);
  g.lineBetween(x - w * 0.17, topC, x - w * 0.17, bottom);
  g.lineBetween(x + w * 0.17, topC, x + w * 0.17, bottom);
  g.lineBetween(x - w / 2, y + h * 0.25, x + w / 2, y + h * 0.25);
  // Knob.
  ball(g, x + w * 0.3, y + h * 0.08, w * 0.07, c2, true);
  // Stone threshold.
  slab(g, x - w * 0.6, bottom - h * 0.02, w * 1.2, h * 0.04, 0x9a9aa6, h * 0.02);
};

const windows: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const r = Math.min(h * 0.42, w * 0.16);
  const fr = Math.max(3, r * 0.22);
  for (const sx of [-0.27, 0.27]) {
    const cx = x + w * sx;
    // Sill.
    slab(g, cx - r * 1.3, y + r + fr * 0.4, r * 2.6, fr * 0.9, c1, fr * 0.5);
    // Frame, then the glass as a shiny ball.
    ball(g, cx, y, r + fr, c1, false);
    ball(g, cx, y, r, c0, true);
    // Muntins.
    g.lineStyle(Math.max(2, r * 0.12), c1, 1);
    g.lineBetween(cx - r, y, cx + r, y);
    g.lineBetween(cx, y - r, cx, y + r);
    // Accent glint.
    g.fillStyle(c2, 1);
    g.fillCircle(cx + r * 0.45, y + r * 0.45, r * 0.12);
  }
};

const chimney: DrawFn = (g, x, y, w, h, [c0, c1]) => {
  const l = lw(w, h);
  // Smoke puffs drift up and to the right; drawn first so the stack covers their bases.
  const puffs: ReadonlyArray<readonly [number, number, number]> = [
    [x + w * 0.55, y - h * 0.45, w * 0.2],
    [x + w * 0.9, y - h * 0.62, w * 0.26],
    [x + w * 1.3, y - h * 0.5, w * 0.18],
  ];
  for (const [cx, cy, r] of puffs) ball(g, cx, cy, r, 0xf4f4f4, false);
  // Stack body with brick courses.
  const bx = x - w * 0.36;
  const by = y - h * 0.36;
  const bh = h * 0.86;
  slab(g, bx, by, w * 0.72, bh, c0, w * 0.14);
  g.lineStyle(Math.max(1.5, l * 0.6), ol(c0), 0.7);
  for (let i = 1; i <= 3; i++) {
    const yy = by + (i * bh) / 4;
    g.lineBetween(bx, yy, bx + w * 0.72, yy);
  }
  // Cap.
  slab(g, x - w * 0.45, y - h * 0.5, w * 0.9, h * 0.16, c1, w * 0.07);
};

const lantern = (g: G, cx: number, cy: number, w: number, h: number, hookTop: number, c0: number, c1: number, c2: number, l: number): void => {
  const bw = w * 0.085;
  const bh = h * 0.7;
  // Hook / chain from the top edge.
  g.lineStyle(Math.max(2, l * 0.8), c1, 1);
  g.lineBetween(cx, hookTop, cx, cy - bh / 2 - bh * 0.2);
  // Glow halo.
  g.fillStyle(c0, 0.25);
  g.fillCircle(cx, cy, bw * 1.9);
  // Metal cage (a shaded cylinder), warm glass inside, a glint and a core.
  cylinder(g, cx, cy + bh / 2, bw, bh, c1);
  g.fillStyle(c0, 1);
  g.fillRoundedRect(cx - bw * 0.34, cy - bh * 0.36, bw * 0.68, bh * 0.72, bw * 0.2);
  gloss(g, cx - bw * 0.12, cy - bh * 0.16, bw * 0.22, bh * 0.2, 0.7);
  ball(g, cx, cy, bw * 0.14, c2, false);
  // Pointed cap and base plate.
  tri(g, cx - bw * 0.6, cy - bh / 2, cx + bw * 0.6, cy - bh / 2, cx, cy - bh / 2 - bh * 0.2, c1, l * 0.6);
  slab(g, cx - bw * 0.5, cy + bh / 2 - bh * 0.02, bw, bh * 0.06, c1, bw * 0.2);
};

const lanterns: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const cy = y + h * 0.05;
  lantern(g, x - w * 0.42, cy, w, h, y - h / 2, c0, c1, c2, l);
  lantern(g, x + w * 0.42, cy, w, h, y - h / 2, c0, c1, c2, l);
};

export const DRAW_OUTDOOR: Record<string, DrawFn> = {
  path,
  fence,
  flowerbed,
  mailbox,
  tree,
  roof,
  door,
  windows,
  chimney,
  lanterns,
};

// ---------- Backdrops (1000 x 700 design space) ----------

/** A vertical gradient rectangle, `top` at y, `bottom` at y + h. */
function vgrad(g: G, x: number, y: number, w: number, h: number, top: number, bottom: number, alpha = 1): void {
  g.fillGradientStyle(top, top, bottom, bottom, alpha);
  g.fillRect(x, y, w, h);
}

/** A horizontal gradient rectangle, `left` at x, `right` at x + w. */
function hgrad(g: G, x: number, y: number, w: number, h: number, left: number, right: number, alpha = 1): void {
  g.fillGradientStyle(left, right, left, right, alpha);
  g.fillRect(x, y, w, h);
}

/** A band of colour fading from alpha `a` at its top edge to nothing at its bottom edge (soft shadows). */
function fadeBand(g: G, x: number, y: number, w: number, h: number, c: number, a: number): void {
  g.fillGradientStyle(c, c, c, c, a, a, 0, 0);
  g.fillRect(x, y, w, h);
}

/** Blue sky, light near the horizon, from the top of the design down to `bottom`. */
function sky(g: G, bottom: number): void {
  vgrad(g, 0, 0, 1000, bottom, 0x3f9fe6, 0xd2f0ff);
}

/** A distant hill: a lit dome, with stacked lighter ellipses toward the top-left (sits on the horizon). */
function hill(g: G, cx: number, cy: number, rx: number, ry: number, c: number): void {
  g.fillStyle(c, 1);
  g.fillEllipse(cx, cy, rx * 2, ry * 2);
  for (let i = 1; i <= 3; i++) {
    const t = i / 3;
    const k = 1 - 0.3 * t;
    g.fillStyle(lighten(c, 0.1 * i), 1);
    g.fillEllipse(cx - rx * 0.12 * t, cy - ry * 0.14 * t, rx * 2 * k, ry * 2 * k);
  }
}

/** Lawn from y=380 to the bottom: lighter far away, darker near. Mowing stripes converge on the horizon. */
function lawn(g: G, base: number): void {
  vgrad(g, 0, 380, 1000, 320, lighten(base, 0.18), darken(base, 0.88));
  // Stripes as triangles from a vanishing point at the horizon (perspective floor).
  const vx = 500;
  const vy = 380;
  for (let k = -4; k <= 8; k++) {
    const x1 = 500 + k * 130;
    const x2 = x1 + 65;
    g.fillStyle(k % 2 === 0 ? 0xffffff : 0x000000, k % 2 === 0 ? 0.07 : 0.05);
    g.fillTriangle(vx, vy, x1, 700, x2, 700);
  }
  // Soft shadow where the lawn meets the distant ground.
  fadeBand(g, 0, 380, 1000, 36, 0x1f4a1a, 0.22);
}

function cloud(g: G, cx: number, cy: number, s: number): void {
  // Blue-grey underside first, then the white puffs on top.
  g.fillStyle(0xdfeefa, 0.95);
  g.fillRoundedRect(cx - 72 * s, cy + 4 * s, 144 * s, 26 * s, 13 * s);
  g.fillStyle(0xffffff, 0.92);
  g.fillCircle(cx - 40 * s, cy, 28 * s);
  g.fillCircle(cx, cy - 16 * s, 38 * s);
  g.fillCircle(cx + 40 * s, cy, 30 * s);
  g.fillRoundedRect(cx - 72 * s, cy - 2 * s, 144 * s, 26 * s, 13 * s);
}

export const BACKDROP_OUTDOOR: Record<string, BackdropFn> = {
  yard: (g, done) => {
    sky(g, 380);
    cloud(g, 160, 110, 1);
    cloud(g, 420, 70, 0.8);
    cloud(g, 620, 170, 1.1);
    // Distant hills: the far one lighter and bluer (atmospheric perspective), the near one greener.
    hill(g, 640, 380, 310, 130, 0xa6d9c0);
    hill(g, 180, 380, 260, 115, 0x7fc98a);
    lawn(g, done ? 0x6fbf45 : 0x5fa83e);
    if (done) {
      // Sun with a soft glow and rays, and brighter grass.
      const sx = 850;
      const sy = 110;
      g.fillStyle(0xfff3a0, 0.12);
      for (let i = 0; i < 4; i++) g.fillCircle(sx, sy, 125 - i * 16);
      g.lineStyle(8, 0xffd23f, 1);
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        g.lineBetween(sx + Math.cos(a) * 70, sy + Math.sin(a) * 70, sx + Math.cos(a) * 100, sy + Math.sin(a) * 100);
      }
      ball(g, sx, sy, 50, 0xffd23f, true);
      g.fillStyle(0xb8f56a, 0.35);
      g.fillRect(0, 380, 1000, 320);
    }
  },

  cottage: (g, done) => {
    sky(g, 380);
    hill(g, 150, 380, 320, 120, 0xa9d8c4);
    hill(g, 880, 380, 300, 110, 0x9fcfbe);
    lawn(g, 0x5fa83e);
    // Contact shadow where the wall meets the lawn.
    groundShadow(g, 500, 622, 460, 46, 0.35);
    // Cream mushroom-stem wall: a solid body, then a left-lit gradient, then ribs.
    g.fillStyle(0xf0e2bc, 1);
    g.fillRoundedRect(300, 300, 400, 320, 60);
    hgrad(g, 300, 360, 400, 200, 0xfffbf0, 0xe2cc98);
    g.fillStyle(0xc9b47e, 0.25);
    for (let i = 0; i < 4; i++) {
      g.fillRect(340 + i * 90, 340, 6, 200);
      g.fillStyle(0xffffff, 0.25);
      g.fillRect(346 + i * 90, 340, 2, 200);
      g.fillStyle(0xc9b47e, 0.25);
    }
    // Plinth along the foot of the wall, with a shadow band above the lawn.
    g.fillStyle(0xe9d6a6, 0.6);
    g.fillRoundedRect(312, 560, 376, 52, 30);
    fadeBand(g, 312, 560, 376, 16, 0x6b5530, 0.18);
    if (done) {
      g.fillStyle(0xffd27a, 0.18);
      g.fillRect(0, 0, 1000, 700);
      g.fillStyle(0xfff0b0, 0.15);
      g.fillCircle(500, 460, 320);
      sparkle(g, 150, 280, 14);
      sparkle(g, 860, 300, 12);
      sparkle(g, 180, 520, 16);
      sparkle(g, 830, 540, 14);
      sparkle(g, 500, 650, 10);
    }
  },
};

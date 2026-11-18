// Code-drawn outdoor house art: the Front Yard ('yard') and the Mushroom Cottage ('cottage').
// Every shape is computed from the x, y, w, h it is given, so the same function draws the
// full-size slot and the small variant preview cards. Outlines are a darker shade of the fill.
import Phaser from 'phaser';
import type { BackdropFn, DrawFn } from './artTypes';

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

/** Linear blend of two colours, t in 0..1. */
function mix(a: number, b: number, t: number): number {
  let out = 0;
  for (const s of [16, 8, 0]) {
    const va = (a >> s) & 0xff;
    const vb = (b >> s) & 0xff;
    out = (out << 8) | Math.round(va + (vb - va) * t);
  }
  return out;
}

/** Outline colour for a fill. */
function ol(c: number): number {
  return darken(c, 0.55);
}

/** Outline width for an item of size w x h. */
function lw(w: number, h: number): number {
  return Math.max(2, Math.min(w, h) * 0.03);
}

/** Rounded rectangle with a darker outline. */
function rect(g: G, x: number, y: number, w: number, h: number, r: number, fill: number, l: number): void {
  g.fillStyle(ol(fill), 1);
  g.fillRoundedRect(x - l, y - l, w + 2 * l, h + 2 * l, r + l);
  g.fillStyle(fill, 1);
  g.fillRoundedRect(x, y, w, h, r);
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

/** Ellipse with a darker outline. */
function ell(g: G, x: number, y: number, w: number, h: number, fill: number, l: number): void {
  g.fillStyle(ol(fill), 1);
  g.fillEllipse(x, y, w + 2 * l, h + 2 * l);
  g.fillStyle(fill, 1);
  g.fillEllipse(x, y, w, h);
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
      g.fillStyle(ol(c0), 1);
      g.fillRoundedRect(L - 1.5, top - 1.5, R - L + 3, sh + 3, rowH * 0.3);
      g.fillStyle(c0, 1);
      g.fillRoundedRect(L, top, R - L, sh, rowH * 0.25);
      if ((r * 3 + i) % 4 === 0) {
        g.fillStyle(c2, 1);
        g.fillCircle((L + R) / 2, cy, Math.max(1.5, rowH * 0.12));
      }
    }
  }
};

const fence: DrawFn = (g, x, y, w, h, [c0, c1]) => {
  const l = lw(w, h);
  const left = x - w / 2;
  const top = y - h / 2;
  const bottom = y + h / 2;
  const n = Math.max(3, Math.round(w / (h * 0.42)));
  const sp = w / n;
  const pw = sp * 0.6;
  // Two rails behind the pickets.
  rect(g, left, top + h * 0.3, w, h * 0.14, 0, c1, l);
  rect(g, left, top + h * 0.62, w, h * 0.14, 0, c1, l);
  const bodyTop = top + h * 0.22;
  for (let i = 0; i < n; i++) {
    const px = left + sp * i + (sp - pw) / 2;
    rect(g, px, bodyTop, pw, bottom - bodyTop, 0, c0, l);
    tri(g, px, bodyTop, px + pw, bodyTop, px + pw / 2, top, c0, l);
  }
};

const flowerbed: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
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
    g.fillStyle(c1, 1);
    g.fillEllipse(fx + (i % 2 ? 1 : -1) * headR * 1.3, fy + headR * 2.6, headR * 1.8, headR * 0.9);
    // Petals (alternating colours) with a centre.
    const petal = i % 2 ? c2 : c0;
    const centre = i % 2 ? c0 : c2;
    const petals: Circle[] = [];
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + i;
      petals.push([fx + Math.cos(a) * headR * 0.8, fy + Math.sin(a) * headR * 0.8, headR * 0.6]);
    }
    circles(g, petals, petal, l * 0.6);
    g.fillStyle(centre, 1);
    g.fillCircle(fx, fy, headR * 0.5);
  }
  // Soil mound on top of the stem bases.
  ell(g, x, soilY, soilW, soilH, 0x6b4a2a, l);
  g.fillStyle(0xbfb6a4, 1);
  g.fillCircle(x - soilW * 0.3, soilY + soilH * 0.1, Math.max(2, h * 0.04));
  g.fillCircle(x + soilW * 0.25, soilY + soilH * 0.18, Math.max(2, h * 0.035));
  g.fillStyle(c1, 1);
  g.fillEllipse(x, y - h * 0.02, soilW * 0.7, h * 0.07);
};

const mailbox: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(x, y + h / 2, w * 1.2, h * 0.08);
  // Post.
  rect(g, x - w * 0.07, y - h * 0.05, w * 0.14, h * 0.55, 0, c1, l);
  // Box with a letter slot.
  rect(g, x - w * 0.42, y - h * 0.4, w * 0.84, h * 0.36, w * 0.16, c0, l);
  g.fillStyle(ol(c0), 1);
  g.fillRect(x - w * 0.25, y - h * 0.3, w * 0.5, h * 0.05);
  // Flag stick and raised flag.
  rect(g, x + w * 0.42, y - h * 0.46, w * 0.06, h * 0.3, 0, c1, l * 0.7);
  tri(g, x + w * 0.48, y - h * 0.46, x + w * 0.48, y - h * 0.32, x + w * 0.95, y - h * 0.39, c2, l * 0.7);
};

const tree: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(x, y + h / 2, w * 0.7, h * 0.06);
  // Trunk.
  rect(g, x - w * 0.09, y - h * 0.05, w * 0.18, h * 0.55, w * 0.04, c1, l);
  // Overlapping canopy circles, one outline around the whole crown.
  const canopy: Circle[] = [
    [x - w * 0.22, y - h * 0.12, w * 0.24],
    [x + w * 0.22, y - h * 0.12, w * 0.24],
    [x, y - h * 0.3, w * 0.3],
    [x, y + h * 0.02, w * 0.22],
  ];
  circles(g, canopy, c0, l);
  // Fruit or blossom dots.
  const dots: ReadonlyArray<readonly [number, number]> = [[-0.3, -0.3], [0.05, -0.42], [0.3, -0.15], [-0.18, -0.08], [0.2, 0.02], [-0.05, -0.22]];
  for (const [dx, dy] of dots) {
    circles(g, [[x + dx * w, y + dy * h, Math.max(2, w * 0.035)]], c2, l * 0.5);
  }
};

const roof: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const baseY = y + h * 0.25;
  const rx = w / 2;
  const ry = h * 0.75;
  // Gills under the cap.
  ell(g, x, baseY, w * 0.98, h * 0.16, c1, l);
  // Cap: outline pass, then fill pass.
  g.fillStyle(ol(c0), 1);
  g.fillPoints(dome(x, baseY, rx + l, ry + l), true);
  g.fillStyle(c0, 1);
  g.fillPoints(dome(x, baseY, rx, ry), true);
  // Spots (normalised x in -1..1, height in 0..1 of the dome).
  const spots: ReadonlyArray<readonly [number, number]> = [[-0.5, 0.45], [0.1, 0.6], [0.55, 0.3], [-0.2, 0.15], [0.3, 0.25]];
  for (const [dx, dy] of spots) {
    circles(g, [[x + dx * rx, baseY - dy * ry, w * 0.07]], c1, l * 0.3);
  }
  // Shine.
  g.fillStyle(c2, 0.5);
  g.fillEllipse(x - rx * 0.5, baseY - ry * 0.6, rx * 0.3, ry * 0.12);
};

const door: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const bottom = y + h / 2;
  const topC = y - h / 2 + w / 2;
  // Arch frame behind the door.
  const fw = w * 0.07;
  arch(g, x, topC, w / 2 + fw, bottom, c1, l);
  // Door.
  arch(g, x, topC, w / 2, bottom, c0, l);
  // Planks and rails.
  g.lineStyle(Math.max(1.5, l * 0.6), darken(c0, 0.7), 1);
  g.lineBetween(x - w * 0.17, topC, x - w * 0.17, bottom);
  g.lineBetween(x + w * 0.17, topC, x + w * 0.17, bottom);
  g.lineBetween(x - w / 2, y + h * 0.25, x + w / 2, y + h * 0.25);
  // Knob.
  circles(g, [[x + w * 0.3, y + h * 0.08, w * 0.07]], c2, l * 0.6);
  // Stone threshold.
  rect(g, x - w * 0.6, bottom - h * 0.02, w * 1.2, h * 0.04, 2, 0x9a9aa6, l * 0.6);
};

const windows: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const r = Math.min(h * 0.42, w * 0.16);
  const fr = Math.max(3, r * 0.22);
  for (const sx of [-0.27, 0.27]) {
    const cx = x + w * sx;
    // Sill.
    rect(g, cx - r * 1.3, y + r + fr * 0.4, r * 2.6, fr * 0.9, 2, c1, l * 0.6);
    // Frame.
    circles(g, [[cx, y, r + fr]], c1, l);
    // Glass.
    g.fillStyle(c0, 1);
    g.fillCircle(cx, y, r);
    // Muntins.
    g.lineStyle(Math.max(2, r * 0.12), c1, 1);
    g.lineBetween(cx - r, y, cx + r, y);
    g.lineBetween(cx, y - r, cx, y + r);
    // Glare and an accent glint.
    g.fillStyle(0xffffff, 0.55);
    g.fillCircle(cx - r * 0.4, y - r * 0.4, r * 0.22);
    g.fillStyle(c2, 1);
    g.fillCircle(cx + r * 0.45, y + r * 0.45, r * 0.12);
  }
};

const chimney: DrawFn = (g, x, y, w, h, [c0, c1]) => {
  const l = lw(w, h);
  // Smoke puffs drift up and to the right; drawn first so the stack covers their bases.
  circles(g, [
    [x + w * 0.55, y - h * 0.45, w * 0.2],
    [x + w * 0.9, y - h * 0.62, w * 0.26],
    [x + w * 1.3, y - h * 0.5, w * 0.18],
  ], 0xf4f4f4, l * 0.5);
  // Stack body with brick courses.
  const bx = x - w * 0.36;
  const by = y - h * 0.36;
  const bh = h * 0.86;
  rect(g, bx, by, w * 0.72, bh, 0, c0, l);
  g.lineStyle(Math.max(1.5, l * 0.6), ol(c0), 0.7);
  for (let i = 1; i <= 3; i++) {
    const yy = by + (i * bh) / 4;
    g.lineBetween(bx, yy, bx + w * 0.72, yy);
  }
  // Cap.
  rect(g, x - w * 0.45, y - h * 0.5, w * 0.9, h * 0.16, w * 0.05, c1, l);
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
  // Frame, glass, core.
  rect(g, cx - bw / 2, cy - bh / 2, bw, bh, bw * 0.3, c1, l * 0.6);
  g.fillStyle(c0, 1);
  g.fillRoundedRect(cx - bw * 0.34, cy - bh * 0.36, bw * 0.68, bh * 0.72, bw * 0.2);
  g.fillStyle(c2, 1);
  g.fillCircle(cx, cy, bw * 0.14);
  // Pointed cap and base plate.
  tri(g, cx - bw * 0.6, cy - bh / 2, cx + bw * 0.6, cy - bh / 2, cx, cy - bh / 2 - bh * 0.2, c1, l * 0.6);
  rect(g, cx - bw * 0.5, cy + bh / 2 - bh * 0.02, bw, bh * 0.06, 0, c1, l * 0.5);
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

/** Blue sky in bands from the top of the design down to `bottom`. */
function sky(g: G, bottom: number): void {
  const bands = 10;
  const bandH = bottom / bands;
  for (let i = 0; i < bands; i++) {
    g.fillStyle(mix(0x3f9fe6, 0xd2f0ff, i / (bands - 1)), 1);
    g.fillRect(0, i * bandH, 1000, bandH + 1);
  }
}

/** Lawn from y=380 to the bottom, with a few mowing stripes. */
function lawn(g: G, colour: number): void {
  g.fillStyle(colour, 1);
  g.fillRect(0, 380, 1000, 320);
  g.fillStyle(0xffffff, 0.05);
  for (let k = 0; k < 5; k++) g.fillRect(0, 410 + k * 70, 1000, 35);
}

function cloud(g: G, cx: number, cy: number, s: number): void {
  g.fillStyle(0xffffff, 0.92);
  g.fillCircle(cx - 40 * s, cy, 28 * s);
  g.fillCircle(cx, cy - 16 * s, 38 * s);
  g.fillCircle(cx + 40 * s, cy, 30 * s);
  g.fillRoundedRect(cx - 72 * s, cy - 2 * s, 144 * s, 30 * s, 15 * s);
}

export const BACKDROP_OUTDOOR: Record<string, BackdropFn> = {
  yard: (g, done) => {
    sky(g, 380);
    cloud(g, 160, 110, 1);
    cloud(g, 420, 70, 0.8);
    cloud(g, 620, 170, 1.1);
    // Distant hills.
    g.fillStyle(0x7fc98a, 1);
    g.fillEllipse(180, 380, 520, 230);
    g.fillStyle(0x66b87a, 1);
    g.fillEllipse(640, 390, 620, 260);
    lawn(g, done ? 0x6fbf45 : 0x5fa83e);
    if (done) {
      // Sun with rays, and brighter grass.
      const sx = 850;
      const sy = 110;
      g.fillStyle(0xfff3a0, 0.35);
      g.fillCircle(sx, sy, 95);
      g.lineStyle(8, 0xffd23f, 1);
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        g.lineBetween(sx + Math.cos(a) * 70, sy + Math.sin(a) * 70, sx + Math.cos(a) * 100, sy + Math.sin(a) * 100);
      }
      g.fillStyle(0xffd23f, 1);
      g.fillCircle(sx, sy, 50);
      g.fillStyle(0xb8f56a, 0.35);
      g.fillRect(0, 380, 1000, 320);
    }
  },

  cottage: (g, done) => {
    sky(g, 380);
    lawn(g, 0x5fa83e);
    // Cream mushroom-stem wall.
    rect(g, 300, 300, 400, 320, 60, 0xfbf1d8, 4);
    g.fillStyle(0xe9d6a6, 0.6);
    g.fillRoundedRect(312, 560, 376, 52, 30);
    g.fillStyle(0xc9b47e, 0.25);
    for (let i = 0; i < 4; i++) g.fillRect(340 + i * 90, 340, 6, 200);
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

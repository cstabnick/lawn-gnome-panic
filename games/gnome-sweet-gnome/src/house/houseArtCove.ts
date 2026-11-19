// Code-drawn Shell Cove art: the boat dock ('covedock'), the seashell bathroom ('covebath') and the rock pool
// garden ('covebeach'). Every shape is computed from the x, y, w, h it is given, so the same function draws the
// full-size slot and the small variant preview cards. Solid things use the 3D helpers in shade.ts (light from the
// top-left). Colours: c0 = main, c1 = second, c2 = accent (see the SHELL_COVE variants in houseData.ts).
import Phaser from 'phaser';
import type { BackdropFn, DrawFn } from './artTypes';
import { ball, blob, cylinder, gloss, groundShadow, lighten, panel, slab } from './shade';

type G = Phaser.GameObjects.Graphics;
type Pt = readonly [number, number];

export const ART_KEYS_COVE = ['pier', 'rowboat', 'harbourlamp', 'nets', 'lobsterpots', 'bathtub', 'shellmirror', 'towelrack', 'fern', 'rockpool', 'deckchair', 'parasol', 'windchime'];

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

function lerp(p: Pt, q: Pt, t: number): Pt {
  return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
}

/** A filled polygon, with an optional darker outline when line > 0. */
function poly(g: G, pts: readonly Pt[], fill: number, alpha = 1, line = 0): void {
  g.fillStyle(fill, alpha);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillPath();
  if (line > 0) {
    g.lineStyle(line, ol(fill), 1);
    g.strokePath();
  }
}

/** An open polyline in one colour and width. */
function polyline(g: G, pts: readonly Pt[], color: number, width: number): void {
  g.lineStyle(width, color, 1);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.strokePath();
}

/** A quad split into stripes that run from its top edge (a-b) to its bottom edge (d-c), alternating c0 and c1. */
function stripes(g: G, a: Pt, b: Pt, c: Pt, d: Pt, c0: number, c1: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    const t1 = (i + 1) / n;
    poly(g, [lerp(a, b, t0), lerp(a, b, t1), lerp(d, c, t1), lerp(d, c, t0)], i % 2 ? c1 : c0, 1, 0);
  }
}

/** The upper half of an ellipse as points, from the left end over the top to the right end. */
function arcPts(cx: number, cy: number, rx: number, ry: number, n: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (Math.PI * i) / n;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
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

/** A vertical gradient rectangle, `top` at y, `bottom` at y + h. */
function vgrad(g: G, x: number, y: number, w: number, h: number, top: number, bottom: number, alpha = 1): void {
  g.fillGradientStyle(top, top, bottom, bottom, alpha);
  g.fillRect(x, y, w, h);
}

// ---------- Items ----------

const pier: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const L = x - w / 2;
  const T = y - h / 2;
  const base = y + h / 2;
  const deckTop = T + h * 0.3;
  const deckH = h * 0.22;
  groundShadow(g, x, base, w * 0.96, h * 0.1, 0.22);
  // Posts standing in the water (drawn first; the deck covers their tops).
  const n = Math.max(4, Math.round(w / (h * 0.9)));
  for (let i = 0; i < n; i++) {
    const px = L + (w * (i + 0.5)) / n;
    cylinder(g, px, base, Math.max(4, h * 0.08), base - deckTop - deckH * 0.5, c1);
    g.fillStyle(0xffffff, 0.35);
    g.fillEllipse(px, base - h * 0.01, h * 0.26, h * 0.07);
  }
  // Railing behind the deck: balusters, then a top rail in the accent colour.
  const railY = T + h * 0.06;
  const railH = h * 0.08;
  const bn = Math.max(8, Math.round(w / (h * 0.28)));
  const bw = Math.max(2, h * 0.04);
  g.fillStyle(c1, 1);
  for (let i = 0; i <= bn; i++) g.fillRect(L + (w * i) / bn - bw / 2, railY + railH, bw, deckTop - railY - railH + 1);
  g.fillStyle(ol(c2), 1);
  g.fillRect(L, railY, w, railH);
  g.fillStyle(c2, 1);
  g.fillRect(L, railY + 1, w, railH - 2);
  // Deck: a lit top and a front edge, with plank seams.
  slab(g, L, deckTop, w, deckH, c0, deckH * 0.6);
  const seams = Math.max(6, Math.round(w / 44));
  g.lineStyle(Math.max(1, l * 0.5), ol(c0), 0.55);
  for (let i = 1; i < seams; i++) {
    const sx = L + (w * i) / seams;
    g.lineBetween(sx, deckTop + deckH * 0.12, sx, deckTop + deckH * 0.95);
  }
};

const rowboat: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const L = x - w / 2;
  const R = x + w / 2;
  const top = y - h * 0.18;
  const bot = y + h * 0.3;
  groundShadow(g, x, bot + h * 0.05, w * 0.9, h * 0.12, 0.25);
  // An oar lying out over the bow side, drawn behind the hull.
  polyline(g, [[x - w * 0.1, top], [x + w * 0.42, top - h * 0.52]], 0x8a5a2b, Math.max(3, l * 1.1));
  g.fillStyle(c2, 1);
  g.fillEllipse(x + w * 0.44, top - h * 0.56, w * 0.08, h * 0.14);
  // Hull: flat bottom, pointed bow on the right.
  poly(g, [[L, top], [R, top], [R - w * 0.14, bot], [L + w * 0.1, bot]], c0, 1, l);
  // Gunwale band in the second colour.
  const t = (h * 0.1) / (bot - top);
  poly(g, [[L, top], [R, top], lerp([R, top], [R - w * 0.14, bot], t), lerp([L, top], [L + w * 0.1, bot], t)], c1, 1, 0);
  // Inside of the boat seen from above, a thwart (seat) in the accent colour.
  g.fillStyle(ol(c0), 1);
  g.fillEllipse(x, top, w * 0.9, h * 0.14);
  g.fillStyle(lighten(c1, 0.15), 1);
  g.fillEllipse(x, top + h * 0.01, w * 0.8, h * 0.08);
  g.fillStyle(c2, 1);
  g.fillRect(x - w * 0.32, top - h * 0.01, w * 0.64, h * 0.05);
};

const harbourlamp: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const T = y - h / 2;
  const base = y + h / 2;
  groundShadow(g, x, base, w * 1.2, h * 0.05, 0.3);
  // Post in the body colour, a plinth and a trim band.
  cylinder(g, x, base - h * 0.04, w * 0.24, h * 0.8, c0);
  slab(g, x - w * 0.32, base - h * 0.06, w * 0.64, h * 0.06, c2, w * 0.1);
  g.fillStyle(c2, 1);
  g.fillRect(x - w * 0.14, base - h * 0.5, w * 0.28, Math.max(2, h * 0.025));
  // Lantern: a warm halo, a pointed hood, glowing glass with a glint, and a finial.
  const cy = T + h * 0.22;
  const lwid = w * 0.5;
  const lh = h * 0.16;
  g.fillStyle(c1, 0.2);
  g.fillCircle(x, cy, w * 0.95);
  g.fillStyle(c1, 0.22);
  g.fillCircle(x, cy, w * 0.65);
  poly(g, [[x - lwid * 0.7, cy - lh * 0.5], [x + lwid * 0.7, cy - lh * 0.5], [x, cy - lh * 1.05]], c2, 1, l * 0.7);
  g.fillStyle(c1, 1);
  g.fillRoundedRect(x - lwid * 0.4, cy - lh * 0.5, lwid * 0.8, lh, lwid * 0.12);
  gloss(g, x - lwid * 0.16, cy - lh * 0.15, lwid * 0.25, lh * 0.3, 0.7);
  g.lineStyle(Math.max(1, l * 0.5), c2, 1);
  g.lineBetween(x, cy - lh * 0.5, x, cy + lh * 0.5);
  g.strokeRect(x - lwid * 0.4, cy - lh * 0.5, lwid * 0.8, lh);
  slab(g, x - lwid * 0.5, cy + lh * 0.5, lwid, lh * 0.1, c2, lwid * 0.1);
  ball(g, x, cy - lh * 1.1, lwid * 0.06, c2, true);
};

const nets: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const L = x - w / 2;
  const R = x + w / 2;
  const T = y - h / 2;
  const base = y + h / 2;
  const topY = T + h * 0.12;
  const x0 = L + w * 0.06;
  const x1 = R - w * 0.06;
  groundShadow(g, x, base, w * 0.9, h * 0.08, 0.25);
  // Two wooden posts; the net hangs between them.
  for (const px of [x0, x1]) cylinder(g, px, base, Math.max(4, w * 0.05), base - T, 0x7a5a3a);
  // The net: a grid between the top rope and a sagging hem.
  const nx = 8;
  const ny = 6;
  const hem = (u: number): number => topY + h * 0.5 + h * 0.25 * (1 - (2 * u - 1) ** 2);
  const P = (i: number, j: number): Pt => {
    const u = i / nx;
    return [x0 + (x1 - x0) * u, topY + (hem(u) - topY) * (j / ny)];
  };
  const outline: Pt[] = [];
  for (let i = 0; i <= nx; i++) outline.push(P(i, 0));
  for (let i = nx; i >= 0; i--) outline.push(P(i, ny));
  poly(g, outline, c0, 0.4, 0);
  const mesh = Math.max(1, l * 0.5);
  for (let i = 0; i <= nx; i++) {
    const col: Pt[] = [];
    for (let j = 0; j <= ny; j++) col.push(P(i, j));
    polyline(g, col, ol(c0), mesh);
  }
  for (let j = 0; j <= ny; j++) {
    const row: Pt[] = [];
    for (let i = 0; i <= nx; i++) row.push(P(i, j));
    polyline(g, row, ol(c0), mesh);
  }
  // Rope along the top, with floats bobbing under it.
  g.lineStyle(Math.max(2, l * 1.1), c2, 1);
  g.lineBetween(x0, topY, x1, topY);
  const floats = 7;
  for (let i = 0; i < floats; i++) {
    const fx = x0 + ((x1 - x0) * (i + 0.5)) / floats;
    ball(g, fx, topY + h * 0.03, Math.max(2, Math.min(w, h) * 0.04), c1, true);
  }
};

const lobsterpots: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const L = x - w / 2;
  const T = y - h / 2;
  const base = y + h / 2;
  groundShadow(g, x, base, w * 0.98, h * 0.1, 0.3);
  const pw = w * 0.44;
  const ph = h * 0.5;
  // A lattice pot: a shaded box with wicker bars and a dark entrance.
  const pot = (px: number, py: number, pwid: number, phgt: number): void => {
    slab(g, px, py, pwid, phgt, c0, Math.min(pwid, phgt) * 0.12);
    g.lineStyle(Math.max(1, l * 0.6), c1, 0.9);
    for (let i = 1; i < 4; i++) g.lineBetween(px, py + (phgt * i) / 4, px + pwid, py + (phgt * i) / 4);
    for (let i = 1; i < 5; i++) g.lineBetween(px + (pwid * i) / 5, py, px + (pwid * i) / 5, py + phgt);
    g.fillStyle(ol(c0), 1);
    g.fillEllipse(px + pwid * 0.5, py + phgt * 0.22, pwid * 0.36, phgt * 0.12);
  };
  pot(L + w * 0.02, base - ph, pw, ph);
  pot(L + w * 0.54, base - ph, pw, ph);
  pot(x - pw * 0.45, T + h * 0.05, pw * 0.9, ph * 0.9);
  // A buoy on a rope from the top pot.
  polyline(g, [[x + pw * 0.45, T + h * 0.05], [L + w * 0.9, T + h * 0.3]], c1, Math.max(1, l * 0.5));
  ball(g, L + w * 0.9, T + h * 0.3, w * 0.07, c2, true);
};

const bathtub: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const L = x - w / 2;
  const R = x + w / 2;
  const T = y - h / 2;
  const base = y + h / 2;
  groundShadow(g, x, base, w * 0.96, h * 0.08, 0.3);
  // Claw feet in the trim colour (behind the body).
  for (const fx of [L + w * 0.12, R - w * 0.12]) ball(g, fx, base - h * 0.03, h * 0.045, c1, true);
  // Tub body, its rim, and the water inside.
  const rimY = T + h * 0.3;
  panel(g, L + w * 0.03, rimY, w * 0.94, h * 0.56, c0, h * 0.2);
  g.fillStyle(lighten(c0, 0.35), 1);
  g.fillEllipse(x, rimY, w * 0.94, h * 0.14);
  g.lineStyle(l, ol(c0), 0.8);
  g.strokeEllipse(x, rimY, w * 0.94, h * 0.14);
  g.fillStyle(c2, 0.75);
  g.fillEllipse(x, rimY + h * 0.01, w * 0.84, h * 0.09);
  // Faucet on the back rim.
  const fx = L + w * 0.14;
  cylinder(g, fx, rimY, w * 0.05, h * 0.16, c1);
  polyline(g, [[fx, rimY - h * 0.14], [fx + w * 0.08, rimY - h * 0.1], [fx + w * 0.08, rimY - h * 0.05]], c1, Math.max(2, l * 0.9));
  // Bubbles piled over the rim.
  const bubbles: ReadonlyArray<readonly [number, number, number]> = [
    [-0.3, 0.2, 0.06], [-0.12, 0.1, 0.085], [0.08, 0.2, 0.05], [0.26, 0.08, 0.07], [0.4, 0.22, 0.045], [0.14, 0.32, 0.035],
  ];
  for (const [dx, dy, r] of bubbles) ball(g, x + dx * w, T + dy * h, r * h, c2, true);
};

const shellmirror: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const rx = w * 0.4;
  const ry = h * 0.36;
  const cy = y + h * 0.02;
  // Scallop frame: a ring of shell lobes around the oval, with ribs running in to the glass.
  const N = 14;
  const lr = ((Math.PI * (rx + ry)) / N) * 0.62;
  const lobes: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    lobes.push([x + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  g.fillStyle(c1, 1);
  g.fillEllipse(x, cy, rx * 2 + lr, ry * 2 + lr);
  g.fillStyle(ol(c0), 1);
  for (const [px, py] of lobes) g.fillCircle(px, py, lr + l);
  g.fillStyle(c0, 1);
  for (const [px, py] of lobes) g.fillCircle(px, py, lr);
  g.lineStyle(Math.max(1, l * 0.6), c1, 0.9);
  for (const [px, py] of lobes) g.lineBetween(px, py, x + (px - x) * 0.62, cy + (py - cy) * 0.62);
  g.fillStyle(lighten(c0, 0.3), 0.6);
  for (const [px, py] of lobes) g.fillCircle(px - lr * 0.2, py - lr * 0.2, lr * 0.45);
  // The glass: a shaded oval in the accent colour, with a rim and a glint.
  const gx = rx - lr * 0.9;
  const gy = ry - lr * 0.9;
  blob(g, x, cy, gx * 2, gy * 2, c2, true);
  g.lineStyle(l, c1, 1);
  g.strokeEllipse(x, cy, gx * 2 + l * 2, gy * 2 + l * 2);
  // Hanging loop above the top lobe.
  g.lineStyle(Math.max(2, l * 0.8), c1, 1);
  g.strokeCircle(x, cy - ry - lr * 1.6, lr * 0.3);
};

const towelrack: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const L = x - w / 2;
  const R = x + w / 2;
  const T = y - h / 2;
  const base = y + h / 2;
  groundShadow(g, x, base, w * 0.9, h * 0.06, 0.28);
  // Floor stand: a metal plate and two uprights.
  slab(g, L + w * 0.06, base - h * 0.05, w * 0.88, h * 0.05, c2, h * 0.02);
  for (const px of [L + w * 0.1, R - w * 0.1]) cylinder(g, px, base - h * 0.05, Math.max(4, w * 0.06), h * 0.95, c2);
  // Two metal bars (the top one for hanging, the lower one for folded towels).
  const bar = (yy: number): void => {
    g.fillStyle(ol(c2), 1);
    g.fillRect(L + w * 0.1, yy, w * 0.8, h * 0.04 + 1);
    g.fillStyle(lighten(c2, 0.3), 1);
    g.fillRect(L + w * 0.1, yy, w * 0.8, h * 0.015);
  };
  bar(T + h * 0.16);
  bar(T + h * 0.76);
  // Hanging towels, each with a band in the second colour.
  const towel = (tx: number, tw: number, th: number): void => {
    const ty = T + h * 0.2;
    panel(g, tx, ty, tw, th, c0, tw * 0.12);
    g.fillStyle(c1, 1);
    g.fillRect(tx + tw * 0.04, ty + th * 0.72, tw * 0.92, th * 0.08);
  };
  towel(L + w * 0.2, w * 0.3, h * 0.5);
  towel(L + w * 0.56, w * 0.24, h * 0.4);
  // A folded towel on the lower bar.
  slab(g, L + w * 0.24, T + h * 0.64, w * 0.52, h * 0.12, c0, h * 0.03);
  g.fillStyle(c1, 1);
  g.fillRect(L + w * 0.24, T + h * 0.7, w * 0.52, h * 0.03);
};

const fern: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const base = y + h / 2;
  const dia = w * 0.56;
  const potH = h * 0.34;
  const potTop = base - potH;
  groundShadow(g, x, base, dia * 1.3, h * 0.07, 0.3);
  // Fronds fan out of the soil. Drawn first so the pot covers their bases.
  const fronds = 9;
  const steps = 10;
  for (let i = 0; i < fronds; i++) {
    const t = i / (fronds - 1);
    const ang = -Math.PI / 2 + (t - 0.5) * 2.6;
    const len = h * (0.36 + (0.1 * ((i * 5) % 3)) / 2);
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const pts: Pt[] = [];
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      pts.push([x + dx * len * u, potTop + dy * len * u + len * 0.3 * u * u]);
    }
    polyline(g, pts, ol(c0), Math.max(1.5, l * 0.6));
    // Leaflets alternate sides of the midrib, each a small shaded oval.
    const lf = len * 0.14;
    for (let k = 1; k <= 6; k++) {
      const [px, py] = pts[Math.round((k / 7) * steps)];
      for (const sgn of [-1, 1]) {
        g.fillStyle(sgn > 0 ? lighten(c0, 0.1) : c0, 1);
        g.fillEllipse(px - dy * sgn * lf * 0.5, py + dx * sgn * lf * 0.5, lf * 1.1, lf * 0.42);
      }
    }
  }
  // Pot body, an accent band, soil and a rim.
  cylinder(g, x, base, dia, potH, c1);
  g.fillStyle(c2, 1);
  g.fillRect(x - dia / 2, base - potH * 0.62, dia, Math.max(2, h * 0.035));
  g.fillStyle(0x5a3a1a, 1);
  g.fillEllipse(x, potTop, dia * 0.96, dia * 0.3);
  g.lineStyle(Math.max(1.5, l * 0.6), c2, 1);
  g.strokeEllipse(x, potTop, dia, dia * 0.3);
};

const rockpool: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  groundShadow(g, x, y + h * 0.44, w * 0.95, h * 0.12, 0.25);
  // Water inside the ring, with a ripple.
  blob(g, x, y, w * 0.78, h * 0.72, c0, true);
  g.lineStyle(Math.max(1.5, l * 0.5), 0xffffff, 0.45);
  g.beginPath();
  g.arc(x - w * 0.12, y - h * 0.06, Math.min(w, h) * 0.12, 0.2, 1.2, false);
  g.strokePath();
  // A ring of rocks in the second colour, around the water.
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = Math.min(w, h) * (0.1 + 0.015 * ((i * 5) % 3));
    blob(g, x + Math.cos(a) * w * 0.42, y + Math.sin(a) * h * 0.4, rr * 2.1, rr * 1.7, c1, true);
  }
  // A starfish and an anemone in the accent colour.
  const sx = x - w * 0.12;
  const sy = y + h * 0.08;
  const sR = Math.min(w, h) * 0.14;
  const star: Pt[] = [];
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? sR * 0.45 : sR;
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    star.push([sx + Math.cos(a) * r, sy + Math.sin(a) * r]);
  }
  poly(g, star, c2, 1, Math.max(1, l * 0.6));
  ball(g, sx, sy, sR * 0.22, lighten(c2, 0.35), false);
  const ax = x + w * 0.2;
  const ay = y - h * 0.06;
  const aR = Math.min(w, h) * 0.12;
  for (let k = 0; k < 7; k++) {
    const a = Math.PI + (k / 6) * Math.PI;
    polyline(g, [[ax, ay], [ax + Math.cos(a) * aR * 1.1, ay + Math.sin(a) * aR * 1.1]], lighten(c2, 0.3), Math.max(2, aR * 0.3));
  }
  blob(g, ax, ay + aR * 0.2, aR * 1.5, aR * 0.8, c2, true);
};

const deckchair: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const L = x - w / 2;
  const T = y - h / 2;
  const base = y + h / 2;
  // Points in fractions of the box: (0,0) top-left, (1,1) bottom-right.
  const P = (u: number, v: number): Pt => [L + u * w, T + v * h];
  const wl = Math.max(2, l * 1.2);
  const rail = (a: Pt, b: Pt): void => {
    polyline(g, [a, b], ol(c2), wl + 2);
    polyline(g, [a, b], c2, wl);
  };
  groundShadow(g, x, base, w * 0.9, h * 0.07, 0.3);
  // Wooden legs and footrest, behind the canvas.
  rail(P(0.36, 0.42), P(0.22, 1));
  rail(P(0.72, 0.6), P(0.84, 1));
  rail(P(0.94, 0.62), P(0.98, 1));
  poly(g, [P(0.66, 0.8), P(0.98, 0.84), P(0.98, 0.9), P(0.66, 0.86)], c2, 1, l * 0.6);
  // Canvas: the backrest reclines up to the top left, the seat slopes out to the front.
  stripes(g, P(0.02, 0.02), P(0.3, 0.02), P(0.62, 0.42), P(0.34, 0.42), c0, c1, 6);
  stripes(g, P(0.34, 0.42), P(0.62, 0.42), P(0.96, 0.62), P(0.66, 0.62), c0, c1, 6);
  // Wooden frame edges over the canvas.
  rail(P(0.02, 0.02), P(0.3, 0.02));
  rail(P(0.02, 0.02), P(0.34, 0.42));
  rail(P(0.3, 0.02), P(0.62, 0.42));
  rail(P(0.66, 0.62), P(0.96, 0.62));
};

const parasol: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const T = y - h / 2;
  const base = y + h / 2;
  const rimY = T + h * 0.34;
  const rx = w * 0.5;
  const ry = h * 0.28;
  groundShadow(g, x, base, w * 0.7, h * 0.05, 0.3);
  // Sand mound and pole, behind the canopy.
  blob(g, x, base - h * 0.02, w * 0.46, h * 0.05, 0xe8d8b0, false);
  cylinder(g, x, base - h * 0.02, Math.max(4, w * 0.04), base - h * 0.02 - rimY, 0xd9d9e3);
  // Canopy: an outlined dome, wedge stripes fanned out from the top, and a scalloped hem.
  poly(g, arcPts(x, rimY, rx + l, ry + l, 40), ol(c0));
  const arc = arcPts(x, rimY, rx, ry, 40);
  const apex: Pt = [x, rimY - ry];
  for (let i = 0; i < arc.length - 1; i++) {
    poly(g, [apex, arc[i], arc[i + 1]], Math.floor(i / 5) % 2 ? c1 : c0, 1, 0);
  }
  const nH = 9;
  const hr = ((rx * 2) / nH) * 0.6;
  for (let i = 0; i < nH; i++) {
    const cx = x - rx + ((i + 0.5) * rx * 2) / nH;
    g.fillStyle(ol(c0), 1);
    g.fillCircle(cx, rimY, hr + l * 0.6);
    g.fillStyle(i % 2 ? c1 : c0, 1);
    g.fillCircle(cx, rimY, hr);
  }
  gloss(g, x - rx * 0.45, rimY - ry * 0.6, rx * 0.4, ry * 0.22, 0.4);
  ball(g, x, apex[1] - w * 0.03, w * 0.035, c2, true);
};

const windchime: DrawFn = (g, x, y, w, h, [c0, c1, c2]) => {
  const l = lw(w, h);
  const T = y - h / 2;
  const barY = T + h * 0.12;
  // Hanging loop above the wooden bar.
  g.lineStyle(Math.max(2, l * 0.8), c1, 1);
  g.strokeCircle(x, T + h * 0.04, w * 0.05);
  slab(g, x - w * 0.45, barY, w * 0.9, h * 0.04, c1, h * 0.02);
  // Tubes on strings, each a different length.
  const dxs = [-0.38, -0.19, 0.19, 0.38];
  const lens = [0.36, 0.46, 0.42, 0.33];
  const sw = Math.max(1, l * 0.5);
  dxs.forEach((dx, i) => {
    const sx = x + dx * w;
    const top = barY + h * 0.1;
    const len = lens[i] * h;
    polyline(g, [[sx, barY + h * 0.04], [sx, top]], c1, sw);
    cylinder(g, sx, top + len, w * 0.11, len, c0);
    ball(g, sx, top, w * 0.035, c2, true);
  });
  // A shell-shaped catcher hangs from the middle, below the tubes' tops.
  polyline(g, [[x, barY + h * 0.04], [x, T + h * 0.7]], c1, sw);
  ball(g, x, T + h * 0.7, w * 0.13, c2, true);
};

export const DRAW_COVE: Record<string, DrawFn> = {
  pier,
  rowboat,
  harbourlamp,
  nets,
  lobsterpots,
  bathtub,
  shellmirror,
  towelrack,
  fern,
  rockpool,
  deckchair,
  parasol,
  windchime,
};

// ---------- Backdrops (1000 x 700 design space) ----------

/** Boat dock: sky and sea to the horizon, a wooden shore at the waterline, deep water below it. */
const covedock: BackdropFn = (g, done) => {
  vgrad(g, 0, 0, 1000, 330, done ? 0x46b0f0 : 0x3f9fe6, done ? 0xf6fdff : 0xd2f0ff);
  if (done) {
    g.fillStyle(0xfff3a0, 0.14);
    for (let i = 0; i < 3; i++) g.fillCircle(820, 110, 120 - i * 22);
    g.fillStyle(0xffd23f, 1);
    g.fillCircle(820, 110, 44);
  } else {
    g.fillStyle(0xfff7d6, 0.9);
    g.fillCircle(820, 110, 38);
  }
  // A green headland on the far right.
  g.fillStyle(0x6fb98a, 1);
  g.fillEllipse(930, 330, 260, 110);
  g.fillStyle(0x8fd0a0, 1);
  g.fillEllipse(900, 318, 180, 70);
  // Sea to the horizon.
  vgrad(g, 0, 330, 1000, 90, 0x9fdcf0, 0x3a9fd8);
  // Wooden shore: planks along the waterline, with a dark edge.
  g.fillStyle(0xa67c52, 1);
  g.fillRect(0, 420, 1000, 30);
  g.fillStyle(0xc39a6a, 1);
  g.fillRect(0, 420, 1000, 4);
  g.lineStyle(2, 0x6b4a2a, 0.7);
  for (let x = 0; x <= 1000; x += 56) g.lineBetween(x, 424, x, 448);
  g.fillStyle(0x6b4a2a, 1);
  g.fillRect(0, 448, 1000, 3);
  // Water below the shore.
  vgrad(g, 0, 450, 1000, 250, done ? 0x46b8ea : 0x3c9fdc, 0x1a6ea8);
  for (let i = 0; i < 9; i++) {
    const yy = 480 + i * 24;
    g.lineStyle(2, 0xffffff, 0.16);
    const off = (i * 137) % 200;
    for (let k = -1; k < 5; k++) {
      const xx = off + k * 220;
      g.lineBetween(xx, yy, xx + 90, yy);
    }
  }
  if (done) {
    sparkle(g, 300, 500, 12);
    sparkle(g, 640, 540, 10);
    sparkle(g, 900, 470, 11);
  }
};

/** Seashell bathroom: a tiled wall in sea colours, a round porthole, and a tiled floor. */
const covebath: BackdropFn = (g, done) => {
  const tile = done ? 0x9fe8d6 : 0x7ad9c0;
  const tileAlt = done ? 0xbff4e6 : 0x92e2cf;
  g.fillStyle(0x3a8a8a, 1);
  g.fillRect(0, 0, 1000, 580);
  const s = 62;
  for (let r = 0; r * s < 580; r++) {
    for (let c = 0; c * s < 1000; c++) {
      const x0 = c * s + 2;
      const y0 = r * s + 2;
      const hh = Math.min(s, 580 - r * s) - 4;
      g.fillStyle((r + c) % 2 ? tile : tileAlt, 1);
      g.fillRect(x0, y0, s - 4, hh);
      g.fillStyle(0xffffff, 0.2);
      g.fillRect(x0, y0, s - 4, 4);
    }
  }
  // Round porthole: a brass ring, a sky-and-sea view, rivets and a glint.
  const px = 160;
  const py = 170;
  const pr = 92;
  g.fillStyle(ol(0xd9a03b), 1);
  g.fillCircle(px, py, pr + 10);
  g.fillStyle(0xd9a03b, 1);
  g.fillCircle(px, py, pr + 4);
  g.fillStyle(0xbfe8ff, 1);
  g.fillCircle(px, py, pr);
  g.fillStyle(0x2f8fd0, 1);
  g.beginPath();
  g.arc(px, py, pr * 0.92, 0, Math.PI, false);
  g.closePath();
  g.fillPath();
  g.lineStyle(2, 0xffffff, 0.5);
  g.lineBetween(px - pr * 0.92, py, px + pr * 0.92, py);
  gloss(g, px - pr * 0.4, py - pr * 0.5, pr * 0.5, pr * 0.3, 0.5);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ball(g, px + Math.cos(a) * (pr + 7), py + Math.sin(a) * (pr + 7), 4, 0xfff7c0, false);
  }
  // Skirting, then the tiled floor in two rows.
  g.fillStyle(0x3a8a8a, 1);
  g.fillRect(0, 572, 1000, 10);
  const fs = 70;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c * fs < 1000; c++) {
      g.fillStyle((r + c) % 2 ? 0x9fd8e6 : 0xfaf6ee, 1);
      g.fillRect(c * fs + 1, 582 + r * 59 + 1, fs - 2, 57);
    }
  }
  if (done) {
    g.fillStyle(0xfff0b0, 0.12);
    g.fillRect(0, 0, 1000, 580);
    sparkle(g, 520, 120, 14);
    sparkle(g, 900, 220, 12);
    sparkle(g, 620, 400, 10);
  }
};

/** Rock pool garden: sea over the top third, a sandy beach, a few rocks, and a sun. */
const covebeach: BackdropFn = (g, done) => {
  vgrad(g, 0, 0, 1000, 120, done ? 0x5bbcf5 : 0x8fcff4, done ? 0xcdf3ff : 0xc9ecff);
  if (done) {
    g.fillStyle(0xfff3a0, 0.16);
    for (let i = 0; i < 3; i++) g.fillCircle(850, 62, 80 - i * 16);
    g.lineStyle(7, 0xffd23f, 1);
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI * 2) / 10;
      g.lineBetween(850 + Math.cos(a) * 52, 62 + Math.sin(a) * 52, 850 + Math.cos(a) * 72, 62 + Math.sin(a) * 72);
    }
    ball(g, 850, 62, 36, 0xffd23f, true);
  } else {
    g.fillStyle(0xfff7d6, 0.9);
    g.fillCircle(850, 62, 30);
  }
  // Sea over the top third.
  vgrad(g, 0, 120, 1000, 120, done ? 0x46c8e6 : 0x3fb8d8, 0x1f7fb0);
  g.lineStyle(2, 0xffffff, 0.2);
  for (let r = 0; r < 4; r++) {
    const yy = 140 + r * 25;
    for (let k = 0; k < 6; k++) {
      const xx = 60 + ((r * 97 + k * 170) % 900);
      g.lineBetween(xx, yy, xx + 70, yy);
    }
  }
  // Foam line, then the sand.
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(0, 236, 1000, 6);
  vgrad(g, 0, 240, 1000, 460, done ? 0xfbeecb : 0xf3e2b5, 0xdcbc82);
  g.lineStyle(2, 0xc9a46a, 0.25);
  for (let r = 0; r < 6; r++) {
    const yy = 300 + r * 66;
    for (let k = 0; k < 4; k++) {
      const xx = 80 + ((r * 131 + k * 260) % 860);
      g.lineBetween(xx, yy, xx + 110, yy);
    }
  }
  // A few rocks on the sand.
  blob(g, 60, 300, 100, 60, 0x9a9aa6, true);
  blob(g, 110, 318, 60, 36, 0x7d7d8a, true);
  blob(g, 940, 290, 120, 70, 0x9a9aa6, true);
  blob(g, 600, 420, 56, 34, 0x7d7d8a, true);
  if (done) {
    sparkle(g, 300, 160, 10);
    sparkle(g, 700, 190, 12);
    sparkle(g, 520, 140, 8);
  }
};

export const BACKDROP_COVE: Record<string, BackdropFn> = {
  covedock,
  covebath,
  covebeach,
};

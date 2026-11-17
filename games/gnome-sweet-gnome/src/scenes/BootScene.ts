// Draws every texture in TEX from code (no image files), then starts the Title scene.
import Phaser from 'phaser';
import { COLORS, SCENES, TEX } from '../config';

type G = Phaser.GameObjects.Graphics;
type Draw = (g: G) => void;

// ---- colour helpers ----

/** Linear mix of colour c towards `to` by t (0 = c, 1 = to). */
function mix(c: number, to: number, t: number): number {
  const part = (v: number, s: number) => (v >> s) & 255;
  const r = Math.round(part(c, 16) + (part(to, 16) - part(c, 16)) * t);
  const g = Math.round(part(c, 8) + (part(to, 8) - part(c, 8)) * t);
  const b = Math.round(part(c, 0) + (part(to, 0) - part(c, 0)) * t);
  return (r << 16) | (g << 8) | b;
}
const dark = (c: number): number => mix(c, 0x000000, 0.45);

// ---- shape helpers ----

const pt = (x: number, y: number): Phaser.Math.Vector2 => new Phaser.Math.Vector2(x, y);

function poly(g: G, pts: [number, number][], color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.fillPoints(pts.map(([x, y]) => pt(x, y)), true);
}

/** Closed outline through pts, drawn as separate line segments. */
function outlinePoly(g: G, pts: [number, number][], width: number, color: number, alpha = 1): void {
  g.lineStyle(width, color, alpha);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    g.lineBetween(a[0], a[1], b[0], b[1]);
  }
}

/** Circle with a darker outline ring. */
function circ(g: G, x: number, y: number, r: number, color: number, outline = 2.5): void {
  g.fillStyle(dark(color), 1);
  g.fillCircle(x, y, r + outline);
  g.fillStyle(color, 1);
  g.fillCircle(x, y, r);
}

/** Ellipse with a darker outline ring. */
function ellipse(g: G, x: number, y: number, w: number, h: number, color: number, outline = 2.5): void {
  g.fillStyle(dark(color), 1);
  g.fillEllipse(x, y, w + outline * 2, h + outline * 2);
  g.fillStyle(color, 1);
  g.fillEllipse(x, y, w, h);
}

/** Rounded rectangle with a darker outline ring. */
function rr(g: G, x: number, y: number, w: number, h: number, r: number, color: number, outline = 2.5): void {
  g.fillStyle(dark(color), 1);
  g.fillRoundedRect(x - outline, y - outline, w + outline * 2, h + outline * 2, r + outline);
  g.fillStyle(color, 1);
  g.fillRoundedRect(x, y, w, h, r);
}

function dot(g: G, x: number, y: number, r: number, color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.fillCircle(x, y, r);
}

/** Soft white highlight blob (the glossy look). */
function gloss(g: G, x: number, y: number, w: number, h: number, alpha = 0.45): void {
  g.fillStyle(0xffffff, alpha);
  g.fillEllipse(x, y, w, h);
}

function sparkle(g: G, x: number, y: number, r: number, color = 0xffffff): void {
  const k = r * 0.28;
  poly(g, [[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]], color);
}

function wheel(g: G, x: number, y: number, r: number): void {
  g.fillStyle(0x111111, 1);
  g.fillCircle(x, y, r + 1.5);
  g.fillStyle(0x222222, 1);
  g.fillCircle(x, y, r);
  dot(g, x, y, r * 0.4, 0xaab2bb);
}

/** Star points, alternating outer radius R and inner radius r, first point up. */
function starPts(cx: number, cy: number, R: number, r: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  return pts;
}

// ---- tiles (64x64, art fills ~56 px) ----

function drawMushroom(g: G): void {
  const cream = 0xfff1d6;
  const red = 0xe0301e;
  rr(g, 23, 34, 18, 22, 5, cream);
  // dome: half disc with its flat side at y=34
  g.beginPath();
  g.fillStyle(dark(red), 1);
  g.slice(32, 34, 29, Math.PI, 0, false);
  g.fillPath();
  g.beginPath();
  g.fillStyle(red, 1);
  g.slice(32, 34, 26, Math.PI, 0, false);
  g.fillPath();
  rr(g, 6, 29, 52, 7, 3, 0xb02818, 1.5);
  dot(g, 22, 21, 4, 0xffffff);
  dot(g, 37, 14, 4.5, 0xffffff);
  dot(g, 45, 27, 3.5, 0xffffff);
  dot(g, 30, 28, 3, 0xffffff);
  dot(g, 14, 26, 2.5, 0xffffff);
  gloss(g, 26, 40, 4, 8, 0.5);
}

function drawGem(g: G): void {
  const blue = 0x3fa9ff;
  const outline: [number, number][] = [[32, 6], [56, 22], [48, 54], [16, 54], [8, 22]];
  poly(g, outline, dark(blue));
  poly(g, [[35, 9], [53, 23], [46, 50], [18, 50], [11, 23]], blue);
  poly(g, [[8, 22], [32, 6], [32, 22]], 0xbfe6ff);
  poly(g, [[32, 6], [56, 22], [32, 22]], 0x7cc4ff);
  poly(g, [[8, 22], [32, 22], [16, 54]], 0x2a7fd6);
  poly(g, [[32, 22], [56, 22], [48, 54]], 0x1f66b8);
  g.lineStyle(2, 0xffffff, 0.8);
  g.lineBetween(12, 22, 30, 9);
  sparkle(g, 46, 14, 7);
  sparkle(g, 22, 36, 3.5);
}

function drawAcorn(g: G): void {
  const brown = 0xc8792b;
  const cap = 0x7a4a22;
  rr(g, 28, 2, 8, 13, 3, 0x6b4423, 1.5);
  ellipse(g, 32, 42, 38, 38, brown);
  rr(g, 12, 14, 40, 20, 10, cap);
  g.lineStyle(2, dark(cap), 0.9);
  for (let x = 18; x <= 42; x += 6) {
    g.lineBetween(x, 14, x + 6, 34);
    g.lineBetween(x + 6, 14, x, 34);
  }
  gloss(g, 22, 42, 8, 6, 0.4);
}

function drawDaisy(g: G): void {
  const yellow = 0xffd23f;
  const orange = 0xff8a1a;
  const petals: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    petals.push([32 + Math.cos(a) * 16, 32 + Math.sin(a) * 16]);
  }
  for (const [x, y] of petals) {
    g.fillStyle(dark(yellow), 1);
    g.fillCircle(x, y, 10.5);
  }
  for (const [x, y] of petals) {
    g.fillStyle(yellow, 1);
    g.fillCircle(x, y, 8);
  }
  circ(g, 32, 32, 9.5, orange, 2);
  dot(g, 32, 32, 4, 0xb85a00, 0.5);
  dot(g, 29, 28, 2, 0xffffff, 0.7);
}

function drawClover(g: G): void {
  const green = 0x3a8f3a;
  const leaf = 0x4fd65a;
  const cx = 32;
  const cy = 30;
  const leaves: [number, number][] = [[21, 20], [43, 20], [21, 40], [43, 40]];
  g.lineStyle(7, dark(green), 1);
  g.lineBetween(32, 40, 32, 60);
  g.lineStyle(4, green, 1);
  g.lineBetween(32, 40, 32, 60);
  // heart-shaped leaves: a disc plus a wedge pointing to the centre, outline pass first
  for (const [col, add] of [[dark(leaf), 3], [leaf, 0]] as const) {
    for (const [x, y] of leaves) {
      const r = 11 + add;
      g.fillStyle(col, 1);
      g.fillCircle(x, y, r);
      const dx = cx - x;
      const dy = cy - y;
      const len = Math.hypot(dx, dy);
      const px = (-dy / len) * r;
      const py = (dx / len) * r;
      g.fillPoints([pt(x + px, y + py), pt(x - px, y - py), pt(cx, cy)], true);
    }
  }
  gloss(g, 16, 15, 6, 4, 0.5);
}

function drawBerry(g: G): void {
  const purple = 0xb44dff;
  const green = 0x4fd65a;
  g.lineStyle(3, dark(green), 1);
  g.lineBetween(30, 24, 44, 12);
  ellipse(g, 47, 11, 18, 10, green, 1.5);
  gloss(g, 43, 9, 6, 3, 0.5);
  const berries: [number, number][] = [[20, 40], [44, 40], [32, 30], [32, 53]];
  for (const [x, y] of berries) {
    g.fillStyle(dark(purple), 1);
    g.fillCircle(x, y, 11.5);
  }
  for (const [x, y] of berries) {
    g.fillStyle(purple, 1);
    g.fillCircle(x, y, 9);
    dot(g, x - 3, y - 3, 2.5, 0xffffff, 0.7);
  }
}

/** Soft glowing disc in `color`: concentric circles, alpha rising from 0.15 at r=31 to 0.6 at r=18. */
function backDisc(color: number): Draw {
  return (g) => {
    const steps: [number, number][] = [[31, 0.15], [26, 0.25], [22, 0.4], [18, 0.6]];
    for (const [r, a] of steps) {
      g.fillStyle(color, a);
      g.fillCircle(32, 32, r);
    }
  };
}

// ---- lawnmowers ----

/** Red push mower seen from the side, facing right. Design space is 64 px; ox and s place and scale it. */
function mowerSide(g: G, ox: number, s: number): void {
  const X = (x: number) => ox + x * s;
  const Y = (y: number) => y * s;
  g.lineStyle(4 * s, 0x3a3a3a, 1);
  g.lineBetween(X(20), Y(30), X(8), Y(8));
  g.lineStyle(4 * s, 0x3a3a3a, 1);
  g.lineBetween(X(8), Y(8), X(2), Y(8));
  rr(g, X(18), Y(20), 22 * s, 14 * s, 4 * s, 0xb82414, 2 * s);
  rr(g, X(8), Y(30), 46 * s, 14 * s, 5 * s, 0xe0301e, 2 * s);
  rr(g, X(44), Y(38), 12 * s, 7 * s, 2 * s, 0xaab2bb, 1.5 * s);
  wheel(g, X(18), Y(48), 9 * s);
  wheel(g, X(48), Y(48), 9 * s);
}

/** The same mower seen from above, facing up (handle at the bottom). */
function drawMowerTop(g: G): void {
  const red = 0xe0301e;
  g.lineStyle(3, 0x444444, 1);
  g.lineBetween(26, 50, 20, 62);
  g.lineBetween(38, 50, 44, 62);
  g.lineBetween(20, 62, 44, 62);
  rr(g, 18, 10, 28, 42, 6, red);
  rr(g, 24, 16, 16, 10, 3, 0xb82414, 1.5);
  circ(g, 32, 38, 8, 0xaab2bb, 2);
  dot(g, 32, 38, 3, 0x666666);
  gloss(g, 22, 18, 6, 4, 0.4);
  rr(g, 9, 16, 10, 14, 3, 0x222222, 1.5);
  rr(g, 45, 16, 10, 14, 3, 0x222222, 1.5);
  rr(g, 9, 34, 10, 14, 3, 0x222222, 1.5);
  rr(g, 45, 34, 10, 14, 3, 0x222222, 1.5);
}

// ---- specials and drops ----

function drawBomb(g: G): void {
  const brown = 0x5a3a1e;
  g.lineStyle(3, 0x8a6a3a, 1);
  g.lineBetween(44, 24, 54, 14);
  g.lineStyle(3, 0x3a8f3a, 1);
  g.lineBetween(32, 22, 32, 15);
  ellipse(g, 26, 14, 12, 7, 0x4fd65a, 1.5);
  ellipse(g, 38, 13, 12, 7, 0x4fd65a, 1.5);
  circ(g, 30, 40, 19, brown, 2.5);
  gloss(g, 20, 32, 8, 6, 0.35);
  dot(g, 56, 10, 7, 0xff8a1a, 0.5);
  dot(g, 56, 10, 4.5, 0xffd23f);
  dot(g, 56, 10, 2, 0xffffff);
}

function drawBee(g: G): void {
  const yellow = 0xffd23f;
  const black = 0x222222;
  // stinger
  g.fillStyle(black, 1);
  g.fillTriangle(13, 34, 3, 36, 13, 40);
  // wings
  ellipse(g, 22, 15, 22, 16, 0x9ab0c0, 1.5);
  ellipse(g, 42, 15, 22, 16, 0x9ab0c0, 1.5);
  g.fillStyle(0xffffff, 0.95);
  g.fillEllipse(22, 15, 20, 14);
  g.fillEllipse(42, 15, 20, 14);
  circ(g, 32, 36, 20, yellow, 2.5);
  g.fillStyle(black, 1);
  g.fillEllipse(22, 36, 6, 30);
  g.fillEllipse(34, 36, 6, 34);
  g.fillEllipse(44, 36, 5, 22);
  dot(g, 46, 30, 3.5, black);
  dot(g, 45, 29, 1, 0xffffff);
  gloss(g, 26, 26, 6, 4, 0.5);
}

function drawPrism(g: G): void {
  const verts: [number, number][] = [[32, 4], [56, 16], [56, 44], [32, 60], [8, 44], [8, 16]];
  const cols = [0xff4d4d, 0xff9f1a, 0xffe14d, 0x4fd65a, 0x3fa9ff, 0xb44dff];
  for (let i = 0; i < 6; i++) {
    poly(g, [[32, 32], verts[i], verts[(i + 1) % 6]], cols[i]);
  }
  outlinePoly(g, verts, 3, 0x2b1d3a, 0.9);
  g.lineStyle(1.5, 0xffffff, 0.5);
  for (const [x, y] of verts) g.lineBetween(32, 32, x, y);
  sparkle(g, 18, 18, 5);
  sparkle(g, 48, 46, 4);
  sparkle(g, 46, 14, 3);
}

function drawGnome(g: G): void {
  const peach = 0xffd3a8;
  const red = 0xd92b2b;
  // face
  circ(g, 32, 40, 15, peach, 2.5);
  // white beard over the chin
  ellipse(g, 32, 50, 30, 22, 0xffffff, 2);
  // eyes, cheeks, nose
  dot(g, 26, 36, 2.5, 0x222222);
  dot(g, 38, 36, 2.5, 0x222222);
  dot(g, 21, 36, 3, 0xff8a8a, 0.6);
  dot(g, 43, 36, 3, 0xff8a8a, 0.6);
  circ(g, 32, 41, 3.5, 0xf0b48a, 1);
  // pointy red hat: outline triangle, then fill, then brim
  poly(g, [[10, 25], [54, 25], [32, 0]], dark(red));
  poly(g, [[13, 24], [51, 24], [32, 4]], red);
  ellipse(g, 32, 24, 46, 10, 0xa51f1f, 2);
  gloss(g, 22, 14, 4, 6, 0.4);
}

// ---- terrain ----

function cell(color: number): Draw {
  return (g) => {
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, 64, 64, 6);
    g.lineStyle(2, mix(color, 0x000000, 0.18), 1);
    const blades: [number, number][] = [[10, 52], [24, 56], [38, 50], [52, 57], [16, 30], [44, 28], [30, 14], [56, 40]];
    for (const [x, y] of blades) {
      g.lineBetween(x, y, x - 2, y - 7);
      g.lineBetween(x, y, x + 2, y - 8);
    }
  };
}

function weedTuft(g: G, x: number, y: number, thick: boolean): void {
  const dk = 0x2e6b2a;
  const tip = thick ? 0xb6d24a : 0x3f8f36;
  const h = thick ? 16 : 12;
  for (const [dx, lean] of [[-4, -3], [0, 0], [4, 3]] as const) {
    g.fillStyle(dk, 1);
    g.fillTriangle(x + dx - 3, y, x + dx + lean, y - h, x + dx + 3, y);
    if (thick) {
      g.fillStyle(tip, 1);
      g.fillTriangle(x + dx + lean - 2, y - h + 4, x + dx + lean, y - h, x + dx + lean + 2, y - h + 4);
    }
  }
}

function weeds(thick: boolean): Draw {
  return (g) => {
    g.fillStyle(0x6b4a2a, 0.9);
    g.fillEllipse(14, 56, 34, 14);
    const tufts: [number, number][] = thick
      ? [[8, 14], [22, 8], [40, 10], [56, 16], [58, 40], [10, 40], [30, 58], [50, 56], [8, 30]]
      : [[8, 14], [30, 8], [56, 18], [40, 58], [10, 44]];
    for (const [x, y] of tufts) weedTuft(g, x, y, thick);
  };
}

function stone(cracked: boolean): Draw {
  return (g) => {
    ellipse(g, 32, 34, 56, 50, 0x9a9a98, 2);
    gloss(g, 22, 22, 20, 10, 0.3);
    if (cracked) {
      g.lineStyle(2, 0x2a2a2a, 0.9);
      g.lineBetween(20, 20, 30, 34);
      g.lineBetween(30, 34, 26, 48);
      g.lineBetween(30, 34, 44, 30);
      g.lineBetween(44, 30, 52, 34);
    } else {
      g.fillStyle(0x5fa33a, 1);
      g.fillEllipse(20, 24, 16, 8);
      g.fillEllipse(44, 44, 14, 8);
      g.fillEllipse(30, 50, 8, 5);
    }
  };
}

// ---- effects and UI pieces ----

function drawMower(g: G): void {
  g.lineStyle(3, 0xffffff, 0.6);
  g.lineBetween(4, 22, 18, 22);
  g.lineBetween(4, 34, 16, 34);
  g.lineBetween(4, 46, 18, 46);
  mowerSide(g, 24, 1.1);
}

function drawStar(color: number, edge: number | null): Draw {
  return (g) => {
    const pts = starPts(24, 26, 22, 9);
    if (edge === null) {
      outlinePoly(g, pts, 3, color);
      return;
    }
    poly(g, pts, color);
    outlinePoly(g, pts, 3, edge);
  };
}

function drawSpark(g: G): void {
  dot(g, 4, 4, 4, 0xffffff, 0.45);
  dot(g, 4, 4, 2.5, 0xffffff);
}

function drawCoin(g: G): void {
  dot(g, 16, 16, 15, 0xb8860b);
  dot(g, 16, 16, 13, 0xffd23f);
  g.lineStyle(3, 0xb8860b, 1);
  g.strokeCircle(16, 16, 7);
  g.fillStyle(0xb8860b, 1);
  g.fillRect(16, 14, 8, 4);
  g.fillStyle(0xffffff, 0.6);
  g.fillEllipse(10, 9, 6, 4);
}

function drawRays(g: G): void {
  const n = 12;
  const period = (Math.PI * 2) / n;
  for (let i = 0; i < n; i++) {
    const a = i * period;
    g.fillStyle(0xffffff, 0.5);
    g.beginPath();
    g.slice(128, 128, 128, a, a + period * 0.5, false);
    g.fillPath();
  }
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    const g = this.add.graphics();
    const jobs: [string, number, number, Draw][] = [
      [TEX.tile.mushroom, 64, 64, drawMushroom],
      [TEX.tile.gem, 64, 64, drawGem],
      [TEX.tile.acorn, 64, 64, drawAcorn],
      [TEX.tile.daisy, 64, 64, drawDaisy],
      [TEX.tile.clover, 64, 64, drawClover],
      [TEX.tile.berry, 64, 64, drawBerry],
      [TEX.back.mushroom, 64, 64, backDisc(COLORS.kind.mushroom)],
      [TEX.back.gem, 64, 64, backDisc(COLORS.kind.gem)],
      [TEX.back.acorn, 64, 64, backDisc(COLORS.kind.acorn)],
      [TEX.back.daisy, 64, 64, backDisc(COLORS.kind.daisy)],
      [TEX.back.clover, 64, 64, backDisc(COLORS.kind.clover)],
      [TEX.back.berry, 64, 64, backDisc(COLORS.kind.berry)],
      [TEX.mowerH, 64, 64, (gg) => mowerSide(gg, 0, 1)],
      [TEX.mowerV, 64, 64, drawMowerTop],
      [TEX.bomb, 64, 64, drawBomb],
      [TEX.bee, 64, 64, drawBee],
      [TEX.prism, 64, 64, drawPrism],
      [TEX.gnome, 64, 64, drawGnome],
      [TEX.cellLight, 64, 64, cell(0x8fd16a)],
      [TEX.cellDark, 64, 64, cell(0x7cc45a)],
      [TEX.weeds1, 64, 64, weeds(false)],
      [TEX.weeds2, 64, 64, weeds(true)],
      [TEX.stone1, 64, 64, stone(true)],
      [TEX.stone2, 64, 64, stone(false)],
      [TEX.mower, 96, 64, drawMower],
      [TEX.spark, 8, 8, drawSpark],
      [TEX.confetti, 10, 6, (gg) => { gg.fillStyle(0xffffff, 1); gg.fillRect(0, 0, 10, 6); }],
      [TEX.leaf, 10, 6, (gg) => { gg.fillStyle(0x4fd65a, 1); gg.fillTriangle(0, 6, 10, 3, 2, 0); }],
      [TEX.star, 48, 48, drawStar(0xffd23f, 0xe07b00)],
      [TEX.starEmpty, 48, 48, drawStar(0x6b5a7a, null)],
      [TEX.coin, 32, 32, drawCoin],
      [TEX.rays, 256, 256, drawRays],
    ];
    for (const [key, w, h, draw] of jobs) {
      if (this.textures.exists(key)) continue;
      g.clear();
      draw(g);
      g.generateTexture(key, w, h);
    }
    g.destroy();
    this.scene.start(SCENES.title);
  }
}

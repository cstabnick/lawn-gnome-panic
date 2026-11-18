// Draws every texture in TEX from code (no image files), then starts the Title scene.
// Piece, board and special textures are 128x128 Canvas 2D art with shading (a 3D toy look).
// The remaining effect and UI textures are still flat Phaser Graphics.
import Phaser from 'phaser';
import { COLORS, SCENES, TEX } from '../config';

type G = Phaser.GameObjects.Graphics;
type Draw = (g: G) => void;
type Ctx = CanvasRenderingContext2D;
/** Builds a path on the context (calls beginPath itself). */
type Shape = (c: Ctx) => void;

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

/** CSS colour string from a 0xRRGGBB number and an alpha. */
const css = (c: number, a = 1): string => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;

// ---- Graphics helpers (flat textures) ----

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

// ---- Canvas shape helpers (128 px art) ----

const circleShape = (x: number, y: number, r: number): Shape => (c) => {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
};

const ellShape = (x: number, y: number, rx: number, ry: number, rot = 0): Shape => (c) => {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
};

const rrShape = (x: number, y: number, w: number, h: number, r: number): Shape => (c) => {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
};

const polyShape = (pts: [number, number][]): Shape => (c) => {
  c.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
  c.closePath();
};

/** A round leaf: a circle of radius r at (x, y) with a tangent wedge running in to (tx, ty). */
function leafShape(x: number, y: number, r: number, tx: number, ty: number): Shape {
  const d = Math.hypot(tx - x, ty - y);
  const phi = Math.atan2(ty - y, tx - x);
  const beta = Math.acos(r / d);
  return (c) => {
    c.beginPath();
    c.moveTo(tx, ty);
    c.lineTo(x + r * Math.cos(phi + beta), y + r * Math.sin(phi + beta));
    c.arc(x, y, r, phi + beta, phi - beta + Math.PI * 2, false);
    c.closePath();
  };
}

/** Radial shading: light tint at the top-left, the base colour, a deep shade at the bottom-right. */
function sphereShade(c: Ctx, cx: number, cy: number, r: number, base: number): CanvasGradient {
  const g = c.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r * 1.3);
  g.addColorStop(0, css(mix(base, 0xffffff, 0.6)));
  g.addColorStop(0.5, css(base));
  g.addColorStop(1, css(dark(base)));
  return g;
}

/** Left-to-right cylinder shading. */
function cylShade(c: Ctx, x0: number, x1: number, base: number): CanvasGradient {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, css(mix(base, 0xffffff, 0.45)));
  g.addColorStop(0.4, css(base));
  g.addColorStop(1, css(dark(base)));
  return g;
}

/** Fills a shape, then outlines it. The path stays current afterwards. */
function solid(c: Ctx, shape: Shape, fill: string | CanvasGradient, line: string, lw = 2.5): void {
  shape(c);
  c.fillStyle = fill;
  c.fill();
  c.lineWidth = lw;
  c.strokeStyle = line;
  c.stroke();
}

/** Reflected light: a light stroke along the lower-right edge, clipped inside the shape. */
function rim(c: Ctx, shape: Shape, alpha = 0.35, width = 3): void {
  c.save();
  shape(c);
  c.clip();
  c.translate(-2, -2);
  shape(c);
  c.lineWidth = width;
  c.strokeStyle = css(0xffffff, alpha);
  c.stroke();
  c.restore();
}

/** Soft dark contact shadow under an object. The ellipse is drawn off-canvas; only its blurred shadow lands. */
function contact(c: Ctx, cx: number, cy: number, rx: number, ry: number, alpha = 0.3): void {
  c.save();
  const off = 400;
  c.shadowColor = css(0x000000, alpha);
  c.shadowBlur = 8;
  c.shadowOffsetX = off;
  ellShape(cx - off, cy, rx, ry)(c);
  c.fillStyle = '#000000';
  c.fill();
  c.restore();
}

/** Glossy highlight: a white elliptical blob fading to nothing. */
function sheen(c: Ctx, x: number, y: number, rx: number, ry: number, alpha = 0.7): void {
  c.save();
  c.translate(x, y);
  c.scale(rx, ry);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, css(0xffffff, alpha));
  g.addColorStop(1, css(0xffffff, 0));
  c.beginPath();
  c.arc(0, 0, 1, 0, Math.PI * 2);
  c.fillStyle = g;
  c.fill();
  c.restore();
}

/** A tiny sharp white dot (the specular point). */
function glint(c: Ctx, x: number, y: number, r: number): void {
  circleShape(x, y, r)(c);
  c.fillStyle = css(0xffffff, 0.95);
  c.fill();
}

/** A sphere: shaded body, dark outline, rim light, gloss. */
function ball(c: Ctx, x: number, y: number, r: number, base: number, lw = 2): void {
  const shape = circleShape(x, y, r);
  solid(c, shape, sphereShade(c, x, y, r, base), css(dark(base)), lw);
  rim(c, shape, 0.35, Math.max(2, r * 0.18));
  sheen(c, x - r * 0.4, y - r * 0.42, r * 0.36, r * 0.24, 0.8);
  glint(c, x - r * 0.5, y - r * 0.55, Math.max(0.8, r * 0.08));
}

/** Four-point star sparkle with a soft glow. */
function starSpark(c: Ctx, x: number, y: number, r: number): void {
  c.save();
  const g = c.createRadialGradient(x, y, 0, x, y, r * 2.4);
  g.addColorStop(0, css(0xffffff, 0.7));
  g.addColorStop(1, css(0xffffff, 0));
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r * 2.4, 0, Math.PI * 2);
  c.fill();
  c.restore();
  const k = r * 0.22;
  polyShape([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]])(c);
  c.fillStyle = '#ffffff';
  c.fill();
}

/** A toy wheel: black rubber tyre, tread ring, grey shaded hub. */
function wheelToy(c: Ctx, x: number, y: number, r: number): void {
  const tyre = circleShape(x, y, r);
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, '#4a4a4a');
  g.addColorStop(1, '#0d0d0d');
  solid(c, tyre, g, '#000000', 2);
  circleShape(x, y, r * 0.78)(c);
  c.lineWidth = 1.5;
  c.strokeStyle = css(0x2a2a2a);
  c.stroke();
  c.beginPath();
  c.arc(x, y, r * 0.9, Math.PI * 1.05, Math.PI * 1.5);
  c.lineWidth = 2;
  c.strokeStyle = css(0xffffff, 0.3);
  c.stroke();
  const hub = circleShape(x, y, r * 0.45);
  solid(c, hub, sphereShade(c, x, y, r * 0.45, 0xaab2bb), '#5c646c', 1.5);
  glint(c, x - r * 0.15, y - r * 0.18, r * 0.08);
}

// ---- pieces (128x128, 3D toy look: light from the top-left) ----

function drawMushroom(c: Ctx): void {
  const cream = 0xfff1d6;
  const red = 0xe0301e;
  contact(c, 64, 118, 36, 7);
  // stem, shaded as a cylinder
  const stem = rrShape(46, 64, 36, 52, 16);
  solid(c, stem, cylShade(c, 46, 82, cream), css(0xb8a080), 2.5);
  rim(c, stem, 0.35, 3);
  // domed cap
  const cap: Shape = (k) => {
    k.beginPath();
    k.moveTo(14, 66);
    k.bezierCurveTo(12, 14, 116, 14, 114, 66);
    k.closePath();
  };
  solid(c, cap, sphereShade(c, 56, 44, 60, red), css(dark(red)), 3);
  rim(c, cap, 0.35, 4);
  sheen(c, 44, 42, 16, 9, 0.75);
  // raised white spots, each with its own shadow and highlight
  const spots: [number, number, number][] = [[46, 40, 8], [74, 32, 9], [98, 48, 6], [28, 54, 5], [62, 52, 4.5]];
  for (const [x, y, r] of spots) {
    c.beginPath();
    c.arc(x + 1.5, y + 2.5, r, 0, Math.PI * 2);
    c.fillStyle = css(0x6a1005, 0.35);
    c.fill();
    ball(c, x, y, r, 0xfff7ea, 1.5);
  }
  // brim band under the cap
  const brim = rrShape(10, 60, 108, 12, 6);
  solid(c, brim, cylShade(c, 10, 118, 0xc83220), css(0x5a1008), 2);
  rim(c, brim, 0.3, 2.5);
}

function drawGem(c: Ctx): void {
  const blue = 0x3fa9ff;
  contact(c, 64, 118, 30, 6);
  const silhouette: [number, number][] = [[40, 22], [88, 22], [110, 46], [64, 116], [18, 46]];
  const outline = polyShape(silhouette);
  // eight facets around a centre point, each a different blue (lightest on top)
  const ring: [number, number][] = [[40, 22], [64, 22], [88, 22], [110, 46], [87, 81], [64, 116], [41, 81], [18, 46]];
  const facet = [0xd6f0ff, 0x9fd6ff, 0x5fb8ff, 0x2f8fe6, 0x2a7fd6, 0x1f66b8, 0x2a78cc, 0x6cbcff];
  for (let i = 0; i < ring.length; i++) {
    polyShape([[64, 50], ring[i], ring[(i + 1) % ring.length]])(c);
    c.fillStyle = css(facet[i]);
    c.fill();
    c.lineWidth = 1;
    c.strokeStyle = css(0x0b3a7a, 0.35);
    c.stroke();
  }
  // bright table facet in the middle
  polyShape([[50, 34], [78, 34], [88, 48], [64, 60], [40, 48]])(c);
  c.fillStyle = css(0xffffff, 0.28);
  c.fill();
  // outline, rim light and gloss
  solid(c, outline, 'rgba(0,0,0,0)', css(0x0b3a7a), 2.5);
  rim(c, outline, 0.6, 3);
  sheen(c, 48, 36, 12, 6, 0.9);
  glint(c, 40, 30, 2);
  starSpark(c, 100, 32, 8);
  starSpark(c, 26, 58, 5);
  starSpark(c, 78, 96, 4);
}

function drawAcorn(c: Ctx): void {
  const brown = 0xc8792b;
  const cap = 0x7a4a22;
  contact(c, 64, 118, 34, 6);
  // stalk
  const stalk = rrShape(58, 6, 12, 22, 5);
  solid(c, stalk, cylShade(c, 58, 70, 0x6b4423), css(0x3a2212), 2);
  // nut
  const nut = ellShape(64, 80, 36, 36);
  solid(c, nut, sphereShade(c, 64, 80, 38, brown), css(dark(brown)), 2.5);
  rim(c, nut, 0.35, 3);
  // textured cap: crosshatch clipped to the cap, darker toward the bottom
  const capShape = rrShape(26, 30, 76, 30, 14);
  solid(c, capShape, sphereShade(c, 64, 40, 44, cap), css(dark(cap)), 2.5);
  c.save();
  capShape(c);
  c.clip();
  c.strokeStyle = css(dark(cap), 0.7);
  c.lineWidth = 1.6;
  c.beginPath();
  for (let x = 14; x <= 114; x += 7) {
    c.moveTo(x, 26);
    c.lineTo(x + 14, 62);
    c.moveTo(x + 14, 26);
    c.lineTo(x, 62);
  }
  c.stroke();
  const shade = c.createLinearGradient(0, 40, 0, 60);
  shade.addColorStop(0, css(0x000000, 0));
  shade.addColorStop(1, css(0x000000, 0.4));
  c.fillStyle = shade;
  c.fillRect(20, 26, 90, 40);
  c.restore();
  rim(c, capShape, 0.3, 2.5);
  sheen(c, 46, 68, 9, 6, 0.75);
}

function drawDaisy(c: Ctx): void {
  const yellow = 0xffd23f;
  const orange = 0xff8a1a;
  const cx = 64;
  const cy = 62;
  const n = 11;
  contact(c, 64, 120, 34, 5, 0.25);
  const angle = (i: number) => (i * Math.PI * 2) / n - Math.PI / 2;
  // petal shadows first, so each petal's shadow falls on the one below
  for (let i = 0; i < n; i++) {
    const a = angle(i);
    c.save();
    c.translate(2, 3);
    ellShape(cx + Math.cos(a) * 29, cy + Math.sin(a) * 29, 17, 10, a)(c);
    c.fillStyle = css(0x7a3a00, 0.25);
    c.fill();
    c.restore();
  }
  // petals: light at the base, deeper toward the tip, a crease down the middle
  for (let i = 0; i < n; i++) {
    const a = angle(i);
    const co = Math.cos(a);
    const si = Math.sin(a);
    const g = c.createLinearGradient(cx + co * 10, cy + si * 10, cx + co * 46, cy + si * 46);
    g.addColorStop(0, css(mix(yellow, 0xffffff, 0.45)));
    g.addColorStop(0.5, css(yellow));
    g.addColorStop(1, css(mix(yellow, orange, 0.45)));
    solid(c, ellShape(cx + co * 29, cy + si * 29, 17, 10, a), g, css(0xb86a10), 2);
    c.beginPath();
    c.moveTo(cx + co * 14, cy + si * 14);
    c.lineTo(cx + co * 40, cy + si * 40);
    c.strokeStyle = css(0x9a5a00, 0.35);
    c.lineWidth = 1.2;
    c.stroke();
  }
  // domed orange centre with dots
  solid(c, circleShape(cx, cy, 15), sphereShade(c, cx, cy, 15, orange), css(dark(orange)), 2);
  for (const [dx, dy, r] of [[-5, -4, 2.2], [4, -5, 1.9], [0, 4, 2.4], [6, 2, 1.6], [-6, 3, 1.5]] as [number, number, number][]) {
    c.beginPath();
    c.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
    c.fillStyle = css(0x9a4400, 0.6);
    c.fill();
  }
  sheen(c, cx - 5, cy - 6, 5, 3.5, 0.8);
}

function drawClover(c: Ctx): void {
  const green = 0x3a8f3a;
  const leaf = 0x4fd65a;
  const tx = 64;
  const ty = 60;
  contact(c, 64, 118, 26, 5);
  // stem: dark edge, green body, thin highlight
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(64, 60);
  c.quadraticCurveTo(70, 90, 64, 114);
  c.lineWidth = 9;
  c.strokeStyle = css(dark(green));
  c.stroke();
  c.lineWidth = 6;
  c.strokeStyle = css(green);
  c.stroke();
  c.beginPath();
  c.moveTo(62, 66);
  c.quadraticCurveTo(68, 90, 62, 110);
  c.lineWidth = 1.5;
  c.strokeStyle = css(0xffffff, 0.35);
  c.stroke();
  // four heart leaves, each with a vein and gloss
  const leaves: [number, number][] = [[44, 42], [84, 42], [44, 78], [84, 78]];
  for (const [x, y] of leaves) {
    const shape = leafShape(x, y, 19, tx, ty);
    solid(c, shape, sphereShade(c, x, y, 19, leaf), css(dark(green)), 2.5);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + (tx - x) * 0.6, y + (ty - y) * 0.6);
    c.strokeStyle = css(0xffffff, 0.45);
    c.lineWidth = 1.6;
    c.stroke();
    rim(c, shape, 0.3, 2.5);
    sheen(c, x - 7, y - 7, 6, 4, 0.7);
  }
}

function drawBerry(c: Ctx): void {
  const purple = 0xb44dff;
  const green = 0x4fd65a;
  contact(c, 64, 118, 40, 6);
  // stalk and leaf on top
  c.beginPath();
  c.moveTo(62, 36);
  c.lineTo(74, 18);
  c.lineCap = 'round';
  c.lineWidth = 4;
  c.strokeStyle = css(dark(green));
  c.stroke();
  const leafS = ellShape(84, 18, 18, 9, -0.35);
  solid(c, leafS, sphereShade(c, 84, 18, 18, green), css(dark(green)), 2);
  c.beginPath();
  c.moveTo(74, 22);
  c.lineTo(96, 14);
  c.strokeStyle = css(0xffffff, 0.4);
  c.lineWidth = 1.2;
  c.stroke();
  sheen(c, 84, 14, 7, 3, 0.7);
  // three or four spheres, back to front
  ball(c, 64, 52, 18, purple);
  ball(c, 40, 76, 17, purple);
  ball(c, 88, 76, 17, purple);
  ball(c, 64, 100, 16, purple);
}

/** Soft glowing orb of a kind colour, drawn behind special pieces. */
function drawBack(color: number): (c: Ctx) => void {
  return (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 62);
    g.addColorStop(0, css(color, 0.85));
    g.addColorStop(0.35, css(color, 0.55));
    g.addColorStop(0.7, css(color, 0.2));
    g.addColorStop(1, css(color, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  };
}

// ---- lawnmowers and specials ----

function drawMowerH(c: Ctx): void {
  const red = 0xe0301e;
  const darkRed = 0xb82414;
  contact(c, 64, 118, 52, 5);
  // push handle
  c.beginPath();
  c.moveTo(40, 60);
  c.lineTo(16, 18);
  c.lineTo(4, 18);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.lineWidth = 7;
  c.strokeStyle = css(0x2a2a2a);
  c.stroke();
  c.lineWidth = 2.5;
  c.strokeStyle = css(0xb0b0b0);
  c.stroke();
  // engine block
  const engine = rrShape(34, 36, 46, 30, 9);
  solid(c, engine, sphereShade(c, 56, 48, 30, darkRed), css(dark(darkRed)), 2.5);
  // body
  const body = rrShape(14, 58, 96, 36, 14);
  solid(c, body, sphereShade(c, 56, 66, 62, red), css(dark(red)), 3);
  rim(c, body, 0.4, 3.5);
  sheen(c, 40, 68, 22, 6, 0.6);
  // metal-grey deck
  const deck = rrShape(84, 82, 32, 14, 4);
  const metal = c.createLinearGradient(0, 82, 0, 96);
  metal.addColorStop(0, '#eef2f5');
  metal.addColorStop(0.5, '#aab2bb');
  metal.addColorStop(1, '#5c646c');
  solid(c, deck, metal, '#4a525a', 2);
  wheelToy(c, 36, 98, 18);
  wheelToy(c, 100, 98, 18);
}

/** The same mower seen from above, facing up (handle at the bottom). */
function drawMowerV(c: Ctx): void {
  const red = 0xe0301e;
  const darkRed = 0xb82414;
  contact(c, 68, 70, 50, 60, 0.25);
  // handle
  c.beginPath();
  c.moveTo(52, 100);
  c.lineTo(40, 122);
  c.moveTo(76, 100);
  c.lineTo(88, 122);
  c.moveTo(40, 122);
  c.lineTo(88, 122);
  c.lineCap = 'round';
  c.lineWidth = 6;
  c.strokeStyle = css(0x3a3a3a);
  c.stroke();
  c.lineWidth = 2;
  c.strokeStyle = css(0x9a9a9a);
  c.stroke();
  // rubber wheels, drawn under the body
  for (const [x, y] of [[18, 32], [92, 32], [18, 68], [92, 68]] as [number, number][]) {
    const w = rrShape(x, y, 18, 28, 6);
    solid(c, w, '#1e1e1e', '#000000', 1.5);
    rim(c, w, 0.25, 2);
  }
  // body and hood
  const body = rrShape(36, 20, 56, 84, 16);
  solid(c, body, sphereShade(c, 64, 52, 60, red), css(dark(red)), 3);
  rim(c, body, 0.35, 3.5);
  const hood = rrShape(48, 30, 32, 22, 9);
  solid(c, hood, sphereShade(c, 64, 38, 22, darkRed), css(dark(darkRed)), 2);
  sheen(c, 56, 36, 10, 5, 0.7);
  // metal hub
  solid(c, circleShape(64, 74, 16), sphereShade(c, 64, 74, 16, 0xaab2bb), '#5c646c', 2);
  circleShape(64, 74, 4)(c);
  c.fillStyle = css(0x666666);
  c.fill();
  glint(c, 60, 68, 2.5);
}

function drawBomb(c: Ctx): void {
  const base = 0x3d2616;
  contact(c, 62, 118, 30, 6);
  // sprout and fuse (behind the sphere)
  c.beginPath();
  c.moveTo(62, 36);
  c.quadraticCurveTo(60, 26, 64, 18);
  c.lineCap = 'round';
  c.lineWidth = 4;
  c.strokeStyle = css(0x3a8f3a);
  c.stroke();
  solid(c, ellShape(54, 20, 10, 5, -0.5), sphereShade(c, 54, 20, 10, 0x4fd65a), css(0x2a6a2a), 1.5);
  solid(c, ellShape(72, 16, 10, 5, 0.5), sphereShade(c, 72, 16, 10, 0x4fd65a), css(0x2a6a2a), 1.5);
  c.beginPath();
  c.moveTo(90, 46);
  c.bezierCurveTo(104, 44, 98, 30, 108, 22);
  c.lineWidth = 3.5;
  c.strokeStyle = css(0x8a6a3a);
  c.stroke();
  // glossy dark sphere
  const shape = circleShape(62, 76, 40);
  solid(c, shape, sphereShade(c, 62, 76, 40, base), css(0x1a0f08), 2.5);
  rim(c, shape, 0.35, 3.5);
  sheen(c, 46, 58, 14, 9, 0.8);
  // sparking fuse tip: yellow-orange glow
  c.save();
  c.shadowColor = css(0xff8a1a);
  c.shadowBlur = 16;
  circleShape(108, 22, 6)(c);
  c.fillStyle = css(0xffd23f);
  c.fill();
  c.restore();
  glint(c, 108, 22, 2.5);
  for (const [x, y] of [[116, 12], [118, 26], [104, 10]] as [number, number][]) {
    circleShape(x, y, 1.6)(c);
    c.fillStyle = css(0xffe14d);
    c.fill();
  }
}

function drawBee(c: Ctx): void {
  const yellow = 0xffd23f;
  const cx = 66;
  const cy = 72;
  const r = 36;
  contact(c, 66, 118, 32, 6);
  // stinger
  c.beginPath();
  c.moveTo(34, 66);
  c.lineTo(6, 72);
  c.lineTo(34, 78);
  c.closePath();
  c.fillStyle = css(0x222222);
  c.fill();
  // translucent wings
  for (const w of [ellShape(48, 36, 26, 18, -0.35), ellShape(84, 34, 22, 16, 0.35)]) {
    w(c);
    c.fillStyle = css(0xffffff, 0.6);
    c.fill();
    w(c);
    c.lineWidth = 2;
    c.strokeStyle = css(0xbfe0ff, 0.95);
    c.stroke();
  }
  // antennae
  c.beginPath();
  c.moveTo(84, 44);
  c.quadraticCurveTo(86, 26, 94, 14);
  c.moveTo(98, 42);
  c.quadraticCurveTo(104, 26, 114, 18);
  c.lineWidth = 2.5;
  c.strokeStyle = css(0x222222);
  c.stroke();
  for (const [x, y] of [[94, 14], [114, 18]] as [number, number][]) {
    circleShape(x, y, 3)(c);
    c.fillStyle = css(0x222222);
    c.fill();
  }
  // fuzzy shaded body with black stripes clipped inside it
  const body = circleShape(cx, cy, r);
  solid(c, body, sphereShade(c, cx, cy, r, yellow), css(dark(yellow)), 2.5);
  c.save();
  body(c);
  c.clip();
  c.fillStyle = '#1e1e1e';
  for (const sx of [54, 76]) {
    c.beginPath();
    c.ellipse(sx, cy, 7, r + 4, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  for (let i = 0; i < 14; i++) {
    const a = (i * Math.PI * 2) / 14 + 0.1;
    circleShape(cx + Math.cos(a) * (r + 1), cy + Math.sin(a) * (r + 1), 1.4)(c);
    c.fillStyle = css(0xffffff, 0.35);
    c.fill();
  }
  rim(c, body, 0.4, 3);
  sheen(c, 52, 52, 12, 7, 0.7);
  // eye
  circleShape(94, 64, 4.5)(c);
  c.fillStyle = '#111111';
  c.fill();
  glint(c, 95.5, 62.5, 1.3);
}

function drawPrism(c: Ctx): void {
  const verts: [number, number][] = [[64, 10], [110, 34], [110, 94], [64, 118], [18, 94], [18, 34]];
  const cols = [0xff4d4d, 0xff9f1a, 0xffe14d, 0x4fd65a, 0x3fa9ff, 0xb44dff];
  contact(c, 64, 122, 42, 5);
  const gem = polyShape(verts);
  // rainbow facets around the centre
  for (let i = 0; i < 6; i++) {
    polyShape([[64, 64], verts[i], verts[(i + 1) % 6]])(c);
    c.fillStyle = css(cols[i]);
    c.fill();
  }
  // light from the top, shade at the bottom, clipped to the gem
  c.save();
  gem(c);
  c.clip();
  const top = c.createLinearGradient(0, 10, 0, 70);
  top.addColorStop(0, css(0xffffff, 0.45));
  top.addColorStop(1, css(0xffffff, 0));
  c.fillStyle = top;
  c.fillRect(0, 0, 128, 128);
  const bottom = c.createLinearGradient(0, 64, 0, 120);
  bottom.addColorStop(0, css(0x000000, 0));
  bottom.addColorStop(1, css(0x000000, 0.25));
  c.fillStyle = bottom;
  c.fillRect(0, 0, 128, 128);
  c.restore();
  // facet lines and outline
  c.beginPath();
  for (const [x, y] of verts) {
    c.moveTo(64, 64);
    c.lineTo(x, y);
  }
  c.strokeStyle = css(0xffffff, 0.5);
  c.lineWidth = 1.5;
  c.stroke();
  gem(c);
  c.lineWidth = 3;
  c.lineJoin = 'round';
  c.strokeStyle = css(0x2b1d3a, 0.9);
  c.stroke();
  rim(c, gem, 0.5, 3);
  sheen(c, 44, 30, 16, 9, 0.95);
  glint(c, 36, 24, 2.5);
  sheen(c, 90, 56, 6, 4, 0.7);
  starSpark(c, 28, 26, 10);
  starSpark(c, 100, 22, 6);
  starSpark(c, 108, 102, 8);
  starSpark(c, 20, 88, 4);
}

/** A lost gnome's head: shaded face, rosy cheeks, fluffy beard, tall red hat. */
function drawGnome(c: Ctx): void {
  const peach = 0xffd3a8;
  const red = 0xd92b2b;
  contact(c, 64, 122, 34, 4, 0.25);
  // face
  solid(c, circleShape(64, 70, 30), sphereShade(c, 64, 70, 30, peach), css(dark(peach)), 2.5);
  // rosy cheeks
  for (const [x, y] of [[40, 70], [88, 70]] as [number, number][]) {
    const g = c.createRadialGradient(x, y, 0, x, y, 9);
    g.addColorStop(0, css(0xff7a7a, 0.6));
    g.addColorStop(1, css(0xff7a7a, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, 9, 0, Math.PI * 2);
    c.fill();
  }
  // shiny eyes
  for (const x of [52, 76]) ball(c, x, 60, 5, 0x2a1a10, 1);
  // fluffy beard: overlapping shaded tufts, outer ones first
  const beard: [number, number, number][] = [[64, 96, 20], [44, 90, 13], [84, 90, 13], [54, 104, 12], [74, 104, 12], [64, 110, 11]];
  for (const [x, y, r] of beard) {
    solid(c, circleShape(x, y, r), sphereShade(c, x, y, r, 0xf6f6f6), css(0xb0b0b0), 1.5);
  }
  ball(c, 64, 78, 6, 0xf0b48a, 1.2);
  // tall pointed hat with a soft fold, sitting on a brim
  const cone: Shape = (k) => {
    k.beginPath();
    k.moveTo(16, 46);
    k.quadraticCurveTo(44, 18, 66, 4);
    k.quadraticCurveTo(86, 18, 112, 46);
    k.closePath();
  };
  solid(c, cone, sphereShade(c, 64, 26, 50, red), css(dark(red)), 2.5);
  c.beginPath();
  c.moveTo(66, 6);
  c.quadraticCurveTo(84, 18, 72, 36);
  c.strokeStyle = css(dark(red), 0.5);
  c.lineWidth = 3;
  c.stroke();
  sheen(c, 46, 24, 6, 10, 0.7);
  const brim = ellShape(64, 46, 50, 11);
  solid(c, brim, sphereShade(c, 64, 44, 50, 0xa51f1f), css(0x5a1010), 2);
  rim(c, brim, 0.3, 2.5);
}

// ---- terrain (128x128) ----

/** Grass cell: gradient fill, subtle inner bevel, a few blades, 10 px rounded corners. */
function drawCell(base: number): (c: Ctx) => void {
  return (c) => {
    const shape = rrShape(0, 0, 128, 128, 10);
    const g = c.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, css(mix(base, 0xffffff, 0.12)));
    g.addColorStop(1, css(base));
    shape(c);
    c.fillStyle = g;
    c.fill();
    c.save();
    shape(c);
    c.clip();
    const hi = c.createLinearGradient(0, 0, 0, 8);
    hi.addColorStop(0, css(0xffffff, 0.35));
    hi.addColorStop(1, css(0xffffff, 0));
    c.fillStyle = hi;
    c.fillRect(0, 0, 128, 8);
    const lo = c.createLinearGradient(0, 128, 0, 120);
    lo.addColorStop(0, css(0x000000, 0.16));
    lo.addColorStop(1, css(0x000000, 0));
    c.fillStyle = lo;
    c.fillRect(0, 120, 128, 8);
    c.restore();
    c.beginPath();
    const blades: [number, number][] = [[20, 104], [48, 112], [76, 100], [104, 114], [32, 60], [88, 56], [60, 28], [112, 80]];
    for (const [x, y] of blades) {
      c.moveTo(x, y);
      c.lineTo(x - 4, y - 14);
      c.moveTo(x, y);
      c.lineTo(x + 4, y - 16);
    }
    c.lineCap = 'round';
    c.lineWidth = 2.5;
    c.strokeStyle = css(mix(base, 0x000000, 0.18));
    c.stroke();
  };
}

/** One dark-green tuft: three blades with light tips, outlined for contrast on grass. */
function weedTuft(c: Ctx, x: number, y: number, thick: boolean): void {
  const h = thick ? 34 : 26;
  for (const [dx, lean] of [[-8, -6], [0, 0], [8, 6]] as [number, number][]) {
    const bx = x + dx;
    const tip: [number, number] = [bx + lean, y - h];
    const g = c.createLinearGradient(0, y, 0, y - h);
    g.addColorStop(0, css(0x123d18));
    g.addColorStop(1, css(thick ? 0x4f9a3a : 0x2f7a32));
    solid(c, polyShape([[bx - 6, y], tip, [bx + 6, y]]), g, css(0x0a2a0e), 1.5);
    const t = thick ? 0xb6d24a : 0x7fc24a;
    polyShape([[tip[0] - 3, tip[1] + 9], tip, [tip[0] + 3, tip[1] + 9]])(c);
    c.fillStyle = css(t);
    c.fill();
  }
}

/** Dark weed tufts over a brown soil patch. weeds2 has more and taller tufts. */
function drawWeeds(thick: boolean): (c: Ctx) => void {
  return (c) => {
    const soil = 0x6b4a2a;
    const patches: [number, number, number, number][] = [[44, 112, 56, 18], [96, 30, 28, 12]];
    for (const [x, y, rx, ry] of patches) {
      solid(c, ellShape(x, y, rx, ry), sphereShade(c, x, y, rx, soil), css(0x3a2612), 2);
    }
    const tufts: [number, number][] = thick
      ? [[18, 46], [54, 40], [90, 44], [110, 62], [104, 96], [22, 100], [60, 122], [92, 118], [22, 72]]
      : [[18, 34], [62, 32], [106, 44], [82, 118], [26, 104]];
    for (const [x, y] of tufts) weedTuft(c, x, y, thick);
  };
}

/** Garden stone: a shaded boulder. cracked = dark cracks; otherwise green moss on top. */
function drawStone(cracked: boolean): (c: Ctx) => void {
  return (c) => {
    const grey = 0x9a9a98;
    contact(c, 66, 116, 50, 7, 0.3);
    const body = ellShape(64, 68, 52, 46);
    solid(c, body, sphereShade(c, 46, 50, 52, grey), css(dark(grey)), 3);
    rim(c, body, 0.3, 4);
    sheen(c, 42, 42, 18, 9, 0.55);
    if (cracked) {
      c.beginPath();
      c.moveTo(40, 40);
      c.lineTo(60, 68);
      c.lineTo(50, 96);
      c.moveTo(60, 68);
      c.lineTo(88, 60);
      c.lineTo(104, 70);
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.lineWidth = 3;
      c.strokeStyle = css(0x2a2a2a, 0.9);
      c.stroke();
    } else {
      moss(c, 42, 44, 18, 9, -0.3);
      moss(c, 84, 52, 16, 9, 0.2);
      moss(c, 50, 90, 12, 6, 0);
    }
  };
}

function moss(c: Ctx, x: number, y: number, rx: number, ry: number, rot: number): void {
  solid(c, ellShape(x, y, rx, ry, rot), sphereShade(c, x, y, rx, 0x5fa33a), css(0x2e5a1c), 1.8);
  sheen(c, x - rx * 0.3, y - ry * 0.3, rx * 0.4, ry * 0.3, 0.45);
}

// ---- effects and UI pieces (flat Graphics) ----

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

  /** Creates (or replaces) a canvas texture of w x h and draws it with the Canvas 2D API. */
  private canvasTex(key: string, w: number, h: number, draw: (c: Ctx, w: number, h: number) => void): void {
    if (this.textures.exists(key)) this.textures.remove(key);
    const t = this.textures.createCanvas(key, w, h);
    if (!t) return;
    draw(t.getContext(), w, h);
    t.refresh();
  }

  create(): void {
    this.canvasTex(TEX.tile.mushroom, 128, 128, drawMushroom);
    this.canvasTex(TEX.tile.gem, 128, 128, drawGem);
    this.canvasTex(TEX.tile.acorn, 128, 128, drawAcorn);
    this.canvasTex(TEX.tile.daisy, 128, 128, drawDaisy);
    this.canvasTex(TEX.tile.clover, 128, 128, drawClover);
    this.canvasTex(TEX.tile.berry, 128, 128, drawBerry);
    this.canvasTex(TEX.back.mushroom, 128, 128, drawBack(COLORS.kind.mushroom));
    this.canvasTex(TEX.back.gem, 128, 128, drawBack(COLORS.kind.gem));
    this.canvasTex(TEX.back.acorn, 128, 128, drawBack(COLORS.kind.acorn));
    this.canvasTex(TEX.back.daisy, 128, 128, drawBack(COLORS.kind.daisy));
    this.canvasTex(TEX.back.clover, 128, 128, drawBack(COLORS.kind.clover));
    this.canvasTex(TEX.back.berry, 128, 128, drawBack(COLORS.kind.berry));
    this.canvasTex(TEX.mowerH, 128, 128, drawMowerH);
    this.canvasTex(TEX.mowerV, 128, 128, drawMowerV);
    this.canvasTex(TEX.bomb, 128, 128, drawBomb);
    this.canvasTex(TEX.bee, 128, 128, drawBee);
    this.canvasTex(TEX.prism, 128, 128, drawPrism);
    this.canvasTex(TEX.gnome, 128, 128, drawGnome);
    this.canvasTex(TEX.cellLight, 128, 128, drawCell(0x8fd16a));
    this.canvasTex(TEX.cellDark, 128, 128, drawCell(0x7cc45a));
    this.canvasTex(TEX.weeds1, 128, 128, drawWeeds(false));
    this.canvasTex(TEX.weeds2, 128, 128, drawWeeds(true));
    this.canvasTex(TEX.stone1, 128, 128, drawStone(true));
    this.canvasTex(TEX.stone2, 128, 128, drawStone(false));

    const g = this.add.graphics();
    const jobs: [string, number, number, Draw][] = [
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

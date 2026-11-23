// Special paint sprays: decals drawn in code onto a canvas and laid on thin planes over the body's panels.
import * as THREE from 'three';
import type { DecalId, DecalPanel, Loadout, VehicleMounts } from './types';

/** The few CanvasRenderingContext2D members the draw functions use, so they can be tested with a fake. */
export type Ctx2D = Pick<
  CanvasRenderingContext2D,
  'save' | 'restore' | 'beginPath' | 'moveTo' | 'lineTo' | 'closePath' | 'fill' | 'stroke' | 'rect' | 'arc' | 'quadraticCurveTo' | 'bezierCurveTo'
  | 'translate' | 'rotate' | 'scale' | 'fillRect' | 'clearRect' | 'fillText' | 'fillStyle' | 'strokeStyle' | 'lineWidth' | 'font' | 'textAlign' | 'textBaseline' | 'globalAlpha' | 'lineJoin' | 'lineCap'
>;

/** Which kind of panel a spray is being drawn for: a flank is wider than tall, the hood is nearly square, the tail is a short strip. */
export type DecalPanelKind = 'side' | 'top' | 'rear';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

/** Everything one spray function needs. `w`/`h` are canvas pixels. */
interface Draw {
  ctx: Ctx2D;
  w: number;
  h: number;
  color: string;
  accent: string;
  panel: DecalPanelKind;
  n: number;
}

type Pt = [number, number];

/** Deterministic 0..1 value from two small integers (no Math.random: the same loadout always draws the same spray). */
function hash(i: number, k: number): number {
  let x = (i * 374761393 + k * 668265263) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  x = (x ^ (x >>> 16)) >>> 0;
  return (x % 10000) / 10000;
}

/** A canvas point for (a, d): `a` runs along the panel's long axis, `d` across it. On `top` the long axis is the canvas height. */
function pt(c: Draw, a: number, d: number): Pt {
  return c.panel === 'top' ? [d, a] : [a, d];
}

/** One flame tongue: base centred on (bx, by), tip at base + (dx, dy), half-width hw at the base, tapering to the tip. */
function tongue(ctx: Ctx2D, bx: number, by: number, dx: number, dy: number, hw: number): void {
  const len = Math.hypot(dx, dy) || 1;
  const px = (-dy / len) * hw;
  const py = (dx / len) * hw;
  ctx.beginPath();
  ctx.moveTo(bx + px, by + py);
  ctx.quadraticCurveTo(bx + dx * 0.5 + px * 1.1, by + dy * 0.5 + py * 1.1, bx + dx, by + dy);
  ctx.quadraticCurveTo(bx + dx * 0.5 - px * 0.5, by + dy * 0.5 - py * 0.5, bx - px, by - py);
  ctx.closePath();
  ctx.fill();
}

function flames(c: Draw): void {
  const { ctx, w, h, color, accent, panel } = c;
  // [base x, base y, tip dx, tip dy, base half-width]
  const specs: [number, number, number, number, number][] = [];
  if (panel === 'side') {
    for (let i = 0; i < 4; i++) {
      const len = h * (0.6 + 0.2 * (i % 2));
      specs.push([w * (0.08 + 0.22 * i), h * 0.95, len * 0.5, -len, h * 0.1]);
    }
  } else if (panel === 'top') {
    for (let i = 0; i < 4; i++) {
      const len = h * (0.5 + 0.15 * (i % 2));
      specs.push([w * (0.12 + 0.25 * i), h * 0.95, w * 0.03 * (i - 1.5), -len, w * 0.08]);
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const len = h * (0.45 + 0.2 * (i % 2));
      specs.push([(w * (i + 0.5)) / 7, h, 0, -len, (w / 7) * 0.4]);
    }
  }
  ctx.fillStyle = color;
  for (const [bx, by, dx, dy, hw] of specs) tongue(ctx, bx, by, dx, dy, hw);
  ctx.fillStyle = accent;
  for (const [bx, by, dx, dy, hw] of specs) tongue(ctx, bx, by, dx * 0.6, dy * 0.6, hw * 0.4);
}

function stripes(c: Draw): void {
  const { ctx, w, h, color, accent, panel } = c;
  // [x, y, width, height] of each bar
  const bars: [number, number, number, number][] = panel === 'top'
    ? [[w * 0.3, 0, w * 0.12, h], [w * 0.58, 0, w * 0.12, h]]
    : [[0, h * 0.3, w, h * 0.12], [0, h * 0.55, w, h * 0.12]];
  ctx.fillStyle = color;
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.02);
  for (const [x, y, bw, bh] of bars) {
    ctx.fillRect(x, y, bw, bh);
    // Accent pinstripes just inside each long edge, then the outline.
    ctx.fillStyle = accent;
    if (panel === 'top') {
      ctx.fillRect(x + bw * 0.2, y, bw * 0.08, bh);
      ctx.fillRect(x + bw * 0.72, y, bw * 0.08, bh);
    } else {
      ctx.fillRect(x, y + bh * 0.2, bw, bh * 0.08);
      ctx.fillRect(x, y + bh * 0.72, bw, bh * 0.08);
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(x, y, bw, bh);
    ctx.stroke();
  }
}

function checker(c: Draw): void {
  const { ctx, w, h, color, accent, panel } = c;
  const top = panel === 'top';
  const along = top ? h : w;
  const across = top ? w : h;
  const bandStart = across / 3;
  const bandDepth = across / 3;
  const cellAlong = along / 8;
  const cellAcross = bandDepth / 2;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 2; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? color : accent;
      if (top) ctx.fillRect(bandStart + j * cellAcross, i * cellAlong, cellAcross, cellAlong);
      else ctx.fillRect(i * cellAlong, bandStart + j * cellAcross, cellAlong, cellAcross);
    }
  }
}

function starPath(ctx: Ctx2D, cx: number, cy: number, R: number, r: number): void {
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const ang = -Math.PI / 2 + (k * Math.PI) / 5;
    const rad = k % 2 === 0 ? R : r;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function stars(c: Draw): void {
  const { ctx, w, h, color, accent, panel } = c;
  const count = panel === 'side' ? 9 : 8;
  const s = Math.min(w, h);
  for (let i = 0; i < count; i++) {
    const cx = w * (0.08 + 0.84 * hash(i, 1));
    const cy = h * (0.12 + 0.76 * hash(i, 2));
    const R = s * (0.08 + 0.08 * hash(i, 3));
    ctx.fillStyle = i % 3 === 2 ? accent : color;
    starPath(ctx, cx, cy, R, R * 0.45);
    ctx.fill();
  }
}

/** A blobby irregular shape: six points round a centre, joined by curves that bulge outward. */
function blob(ctx: Ctx2D, cx: number, cy: number, R: number, seed: number): void {
  const n = 6;
  const pts: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k * TAU) / n;
    const rad = R * (0.65 + 0.45 * hash(seed, 10 + k));
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let k = 0; k < n; k++) {
    const p = pts[k];
    const q = pts[(k + 1) % n];
    const mid = ((k + 0.5) * TAU) / n;
    const bulge = R * (0.25 + 0.2 * hash(seed, 30 + k));
    ctx.bezierCurveTo(
      p[0] + Math.cos(mid) * bulge, p[1] + Math.sin(mid) * bulge,
      q[0] + Math.cos(mid) * bulge, q[1] + Math.sin(mid) * bulge,
      q[0], q[1],
    );
  }
  ctx.closePath();
  ctx.fill();
}

function camo(c: Draw): void {
  const { ctx, w, h, color, accent, panel } = c;
  const count = panel === 'rear' ? 8 : 9;
  const s = Math.min(w, h);
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < count; i++) {
    const cx = w * (0.1 + 0.8 * hash(i, 4));
    const cy = h * (0.1 + 0.8 * hash(i, 5));
    const R = s * (0.18 + 0.14 * hash(i, 6));
    ctx.fillStyle = i % 2 === 1 ? accent : color;
    blob(ctx, cx, cy, R, i);
  }
  ctx.globalAlpha = 1;
}

/** Bolt outline in unit-square coordinates, a jagged closed shape running top to bottom. */
const BOLT: Pt[] = [[0.55, 0], [0.2, 0.55], [0.45, 0.55], [0.3, 1], [0.8, 0.4], [0.55, 0.4], [0.75, 0]];

function lightning(c: Draw): void {
  const { ctx, w, h, color, accent, panel } = c;
  const spread = panel === 'side' ? 0.5 : 0.7;
  ctx.beginPath();
  BOLT.forEach(([u, v], k) => {
    const x = w * (0.5 + (u - 0.5) * spread);
    const y = h * (0.05 + 0.9 * v);
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  const lw = Math.max(2, Math.min(w, h) * 0.02);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = accent;
  ctx.lineWidth = lw * 3;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.stroke();
  // Sparks: short accent flicks off the bolt's corners.
  ctx.lineWidth = lw * 0.7;
  BOLT.forEach(([u, v], k) => {
    const x = w * (0.5 + (u - 0.5) * spread);
    const y = h * (0.05 + 0.9 * v);
    const a = k * 1.3;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * lw * 2, y + Math.sin(a) * lw * 2);
    ctx.lineTo(x + Math.cos(a) * lw * 5, y + Math.sin(a) * lw * 5);
    ctx.stroke();
  });
}

function number(c: Draw): void {
  const { ctx, w, h, color, accent, panel, n } = c;
  const size = Math.round(h * 0.7 * (panel === 'side' ? 1 : 0.6));
  const text = String(n);
  const off = Math.max(2, size * 0.05);
  ctx.font = 'bold ' + size + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // A thick outline built from fillText copies round the glyphs, then the spray colour on top.
  ctx.fillStyle = accent;
  for (let k = 0; k < 8; k++) {
    const a = (k * TAU) / 8;
    ctx.fillText(text, w / 2 + Math.cos(a) * off, h / 2 + Math.sin(a) * off);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h / 2);
}

function hats(c: Draw): void {
  const { ctx, w, h, color, accent } = c;
  const cell = h / 3;
  const cols = Math.ceil(w / cell) + 1;
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, cell * 0.08);
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * cell + (r % 2 === 1 ? cell / 2 : 0);
      const cy = (r + 0.6) * cell;
      const sz = cell * 0.32;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx, cy - sz * 1.1);
      ctx.lineTo(cx - sz * 0.7, cy);
      ctx.lineTo(cx + sz * 0.7, cy);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - sz, cy + sz * 0.1);
      ctx.lineTo(cx + sz, cy + sz * 0.1);
      ctx.stroke();
    }
  }
}

function circle(ctx: Ctx2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

function daisies(c: Draw): void {
  const { ctx, w, h, color, accent, panel } = c;
  const count = panel === 'rear' ? 6 : panel === 'top' ? 3 : 5;
  const cellW = w / count;
  const R = Math.min(cellW * 0.42, h * 0.36);
  const centre = (i: number): Pt => [cellW * (i + 0.5), h * (0.5 + 0.12 * Math.sin(i * 1.3))];
  // The chain's stem, then each daisy: six petals round an accent centre.
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, R * 0.12);
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const [x, y] = centre(i);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  for (let i = 0; i < count; i++) {
    const [cx, cy] = centre(i);
    ctx.fillStyle = color;
    for (let k = 0; k < 6; k++) {
      const a = (k * TAU) / 6;
      circle(ctx, cx + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.6, R * 0.4);
    }
    ctx.fillStyle = accent;
    circle(ctx, cx, cy, R * 0.3);
  }
}

function drip(c: Draw): void {
  const { ctx, w, h, color, accent, panel } = c;
  const along = panel === 'top' ? h : w;
  const across = panel === 'top' ? w : h;
  const t = across * 0.18;
  const n = 6;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...pt(c, 0, 0));
  ctx.lineTo(...pt(c, along, 0));
  ctx.lineTo(...pt(c, along, t));
  ctx.lineTo(...pt(c, 0, t));
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < n; i++) {
    const a = (along * (i + 0.5)) / n;
    const hw = (along / n) * 0.3;
    const yb = t + across * (0.15 + 0.55 * hash(i, 7));
    ctx.beginPath();
    ctx.moveTo(...pt(c, a - hw, t * 0.5));
    ctx.lineTo(...pt(c, a - hw, yb));
    ctx.quadraticCurveTo(...pt(c, a, yb + hw * 1.2), ...pt(c, a + hw, yb));
    ctx.lineTo(...pt(c, a + hw, t * 0.5));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    const tip = pt(c, a, yb - hw * 0.2);
    circle(ctx, tip[0], tip[1], hw * 0.3);
    ctx.fillStyle = color;
  }
}

/** The panel's long axis and the axis across it, in canvas pixels. */
function axes(c: Draw): [number, number] {
  return c.panel === 'top' ? [c.h, c.w] : [c.w, c.h];
}

/** A filled polygon through (along, across) points. */
function poly(c: Draw, pts: Pt[]): void {
  const { ctx } = c;
  ctx.beginPath();
  pts.forEach(([a, d], i) => {
    const [x, y] = pt(c, a, d);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

/** A leaf-shaped wing from (a0, d0) to (a1, d1), both edges bulged to one side by `bulge`. */
function petal(c: Draw, a0: number, d0: number, a1: number, d1: number, bulge: number): void {
  const { ctx } = c;
  const ma = (a0 + a1) / 2;
  const md = (d0 + d1) / 2;
  const len = Math.hypot(a1 - a0, d1 - d0) || 1;
  const pa = (-(d1 - d0) / len) * bulge;
  const pd = ((a1 - a0) / len) * bulge;
  ctx.beginPath();
  ctx.moveTo(...pt(c, a0, d0));
  ctx.quadraticCurveTo(...pt(c, ma + pa, md + pd), ...pt(c, a1, d1));
  ctx.quadraticCurveTo(...pt(c, ma - pa, md - pd), ...pt(c, a0, d0));
  ctx.closePath();
  ctx.fill();
}

/** Mirrored moth wings with eye spots, a thin body down the middle of the panel. */
function moth(c: Draw): void {
  const { ctx, color, accent } = c;
  const [along, across] = axes(c);
  const cA = along / 2;
  const cD = across / 2;
  for (const s of [-1, 1]) {
    ctx.fillStyle = color;
    petal(c, cA, cD, cA + along * 0.2, cD + s * across * 0.46, across * 0.12);
    petal(c, cA, cD, cA - along * 0.12, cD + s * across * 0.34, across * 0.08);
    const [ex, ey] = pt(c, cA + along * 0.12, cD + s * across * 0.26);
    ctx.fillStyle = accent;
    circle(ctx, ex, ey, across * 0.09);
    ctx.fillStyle = color;
    circle(ctx, ex, ey, across * 0.045);
  }
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(2, across * 0.03);
  ctx.beginPath();
  ctx.moveTo(...pt(c, along * 0.12, cD));
  ctx.lineTo(...pt(c, along * 0.88, cD));
  ctx.stroke();
}

/** Rows of overlapping scale arcs, alternating colour and accent, filling the panel. */
function koi(c: Draw): void {
  const { ctx, color, accent } = c;
  const [along, across] = axes(c);
  const rows = 5;
  const step = across / rows;
  const R = step * 1.1;
  const cols = Math.ceil(along / (R * 2)) + 1;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const [x, y] = pt(c, col * R * 2 + (r % 2) * R, r * step);
      ctx.fillStyle = (r + col) % 2 === 0 ? color : accent;
      ctx.beginPath();
      ctx.arc(x, y, R, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
    }
  }
}

/** 45-degree stripes across the whole panel, alternating colour and accent. */
function hazard(c: Draw): void {
  const { ctx, color, accent } = c;
  const [along, across] = axes(c);
  const far = along + across;
  const period = far / 10;
  // Bands run along the lines a + d = const; the far ends of each band are off the panel and clipped by the canvas.
  const D1 = -far;
  const D2 = far * 2;
  for (let k = 0; k < 10; k++) {
    const s0 = k * period;
    const s1 = s0 + period;
    ctx.fillStyle = k % 2 === 0 ? color : accent;
    poly(c, [[s0 - D1, D1], [s1 - D1, D1], [s1 - D2, D2], [s0 - D2, D2]]);
  }
}

/** Staggered rows of round spots, some with a small accent dot inside. */
function polka(c: Draw): void {
  const { ctx, color, accent } = c;
  const [along, across] = axes(c);
  const rows = 4;
  const rowStep = across / rows;
  const colStep = rowStep * 1.4;
  const R = rowStep * 0.36;
  const cols = Math.ceil(along / colStep) + 1;
  for (let r = 0; r < rows; r++) {
    const d = (r + 0.5) * rowStep;
    const offset = r % 2 === 1 ? colStep / 2 : 0;
    for (let col = 0; col < cols; col++) {
      const [x, y] = pt(c, col * colStep + offset, d);
      ctx.fillStyle = color;
      circle(ctx, x, y, R);
      if ((r + col) % 3 === 0) {
        ctx.fillStyle = accent;
        circle(ctx, x, y, R * 0.4);
      }
    }
  }
}

/** Sixteen alternating rays: fanning up from the lower-left corner on a flank, from the centre on the hood and tail. */
function sunburst(c: Draw): void {
  const { ctx, w, h, color, accent, panel } = c;
  const rays = 16;
  const flank = panel === 'side';
  const ox = flank ? 0 : w / 2;
  const oy = flank ? h : h / 2;
  const start = flank ? -Math.PI / 2 : 0;
  const step = (flank ? Math.PI / 2 : TAU) / rays;
  const L = Math.hypot(w, h);
  for (let k = 0; k < rays; k++) {
    const a0 = start + k * step;
    const a1 = a0 + step / 2;
    ctx.fillStyle = k % 2 === 0 ? color : accent;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.cos(a0) * L, oy + Math.sin(a0) * L);
    ctx.lineTo(ox + Math.cos(a1) * L, oy + Math.sin(a1) * L);
    ctx.closePath();
    ctx.fill();
  }
}

/** Two thin parallel lines, each end curled into a loop, with a small diamond in the middle. */
function pinstripe(c: Draw): void {
  const { ctx, color, accent } = c;
  const [along, across] = axes(c);
  const lo = across * 0.4;
  const hi = across * 0.6;
  const s = along * 0.1;
  const e = along * 0.9;
  const curl = across * 0.1;
  const at = (a: number, d: number): Pt => pt(c, a, d);
  // Each stroke is drawn twice: a wider accent edge, then the thin colour line on top.
  const stroke = (build: () => void): void => {
    for (const [style, width] of [[accent, across * 0.035], [color, across * 0.012]] as const) {
      ctx.strokeStyle = style;
      ctx.lineWidth = Math.max(1, width);
      ctx.beginPath();
      build();
      ctx.stroke();
    }
  };
  stroke(() => { ctx.moveTo(...at(s, lo)); ctx.lineTo(...at(e, lo)); });
  stroke(() => { ctx.moveTo(...at(s, hi)); ctx.lineTo(...at(e, hi)); });
  stroke(() => { ctx.moveTo(...at(e, lo)); ctx.bezierCurveTo(...at(e + curl, lo), ...at(e + curl, hi), ...at(e, hi)); });
  stroke(() => { ctx.moveTo(...at(s, lo)); ctx.bezierCurveTo(...at(s - curl, lo), ...at(s - curl, hi), ...at(s, hi)); });
  const m = along / 2;
  const mid = across / 2;
  const r = across * 0.07;
  ctx.fillStyle = accent;
  poly(c, [[m, mid - r], [m + r, mid], [m, mid + r], [m - r, mid]]);
  ctx.fillStyle = color;
  poly(c, [[m, mid - r / 2], [m + r / 2, mid], [m, mid + r / 2], [m - r / 2, mid]]);
}

/** Draw spray `id` filling a w x h canvas (transparent background) in `color`, using `accent` for secondary marks and `n` for the 'number' spray. Pure: same inputs, same calls. */
export function drawDecal(ctx: Ctx2D, id: DecalId, w: number, h: number, color: string, accent: string, n: number, panel: DecalPanelKind): void {
  const c: Draw = { ctx, w, h, color, accent, panel, n };
  ctx.save();
  switch (id) {
    case 'flames': flames(c); break;
    case 'stripes': stripes(c); break;
    case 'checker': checker(c); break;
    case 'stars': stars(c); break;
    case 'camo': camo(c); break;
    case 'lightning': lightning(c); break;
    case 'number': number(c); break;
    case 'hats': hats(c); break;
    case 'daisies': daisies(c); break;
    case 'drip': drip(c); break;
    case 'moth': moth(c); break;
    case 'koi': koi(c); break;
    case 'hazard': hazard(c); break;
    case 'polka': polka(c); break;
    case 'sunburst': sunburst(c); break;
    case 'pinstripe': pinstripe(c); break;
  }
  ctx.restore();
}

const DEFAULT_TEX_SIZE: Record<DecalPanelKind, readonly [number, number]> = { side: [512, 256], top: [256, 256], rear: [512, 128] };
const textures = new Map<string, THREE.CanvasTexture>();

/** 0xRRGGBB -> '#rrggbb'. */
function css(rgb: number): string {
  return '#' + (rgb & 0xffffff).toString(16).padStart(6, '0');
}

/** White-ish marks on dark sprays, near-black on light ones. */
function accentOf(rgb: number): number {
  const r = ((rgb >> 16) & 255) / 255;
  const g = ((rgb >> 8) & 255) / 255;
  const b = (rgb & 255) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum < 0.5 ? 0xf4f4f4 : 0x1c1c22;
}

function panelKind(id: DecalPanel['id']): DecalPanelKind {
  if (id === 'left' || id === 'right') return 'side';
  if (id === 'hood') return 'top';
  return 'rear';
}

/** Cached per (spray, colour, number, panel kind). Never disposed: textures are shared across vehicles. */
function sprayTexture(loadout: Loadout, id: DecalId, kind: DecalPanelKind): THREE.CanvasTexture {
  const num = id === 'number' ? loadout.decalNumber : 0;
  const key = `${id}:${loadout.decalColor}:${num}:${kind}`;
  const hit = textures.get(key);
  if (hit) return hit;
  const [w, h] = DEFAULT_TEX_SIZE[kind];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) drawDecal(ctx, id, w, h, css(loadout.decalColor), css(accentOf(loadout.decalColor)), num, kind);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textures.set(key, tex);
  return tex;
}

/** A group of planes (one per mounts.panels entry) showing the loadout's spray, slightly off the body so it never z-fights; null when decal is 'none'. Textures are cached per (decal, colour, number, panel kind). With no DOM (tests) the planes are plain-coloured. */
export function buildDecals(mounts: VehicleMounts, loadout: Loadout): THREE.Group | null {
  const id = loadout.decal;
  if (id === 'none' || mounts.panels.length === 0) return null;
  const group = new THREE.Group();
  group.name = 'glaze-decals';
  const textured = typeof document !== 'undefined';
  for (const panel of mounts.panels) {
    const kind = panelKind(panel.id);
    const material = textured
      ? new THREE.MeshStandardMaterial({
        map: sprayTexture(loadout, id, kind),
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        roughness: 0.6,
        side: THREE.FrontSide,
      })
      : new THREE.MeshBasicMaterial({ color: loadout.decalColor, transparent: true, opacity: 0.6, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(panel.size[0], panel.size[1]), material);
    mesh.position.set(panel.at[0], panel.at[1], panel.at[2]);
    mesh.rotation.set(panel.rot[0] * DEG, panel.rot[1] * DEG, panel.rot[2] * DEG);
    mesh.renderOrder = 2;
    mesh.castShadow = false;
    group.add(mesh);
  }
  return group;
}

// 3D-looking primitives for the code-drawn house art. Light comes from the top-left.
// Phaser Graphics has no radial gradients, so curved shading is faked with stacked, offset, lighter shapes.
import Phaser from 'phaser';

type G = Phaser.GameObjects.Graphics;

function mix(c: number, to: number, t: number): number {
  const r = ((c >> 16) & 255) + ((((to >> 16) & 255) - ((c >> 16) & 255)) * t);
  const gg = ((c >> 8) & 255) + ((((to >> 8) & 255) - ((c >> 8) & 255)) * t);
  const b = (c & 255) + (((to & 255) - (c & 255)) * t);
  return (Math.round(r) << 16) | (Math.round(gg) << 8) | Math.round(b);
}

/** c moved toward white by t (0..1). */
export const lighten = (c: number, t: number): number => mix(c, 0xffffff, t);
/** c moved toward black by t (0..1). */
export const darken = (c: number, t: number): number => mix(c, 0x000000, t);

/** A soft contact shadow on the ground under an object: centre (x, y), size w x h. */
export function groundShadow(g: G, x: number, y: number, w: number, h: number, alpha = 0.28): void {
  for (let i = 0; i < 4; i++) {
    const k = 1 - i * 0.18;
    g.fillStyle(0x000000, alpha / 4);
    g.fillEllipse(x, y, w * k, h * k);
  }
}

/** A white glossy highlight: an ellipse fading out, plus a sharp dot. Centre (x, y), size w x h. */
export function gloss(g: G, x: number, y: number, w: number, h: number, alpha = 0.55): void {
  for (let i = 0; i < 4; i++) {
    const k = 1 - i * 0.22;
    g.fillStyle(0xffffff, (alpha / 4) * (i + 1) * 0.5);
    g.fillEllipse(x, y, w * k, h * k);
  }
  g.fillStyle(0xffffff, Math.min(1, alpha + 0.3));
  g.fillCircle(x - w * 0.12, y - h * 0.08, Math.max(1.5, Math.min(w, h) * 0.12));
}

/** A shaded ellipse ("blob"): dark rim, body, lighter core toward the top-left, gloss. Centre (x, y), size w x h. */
export function blob(g: G, x: number, y: number, w: number, h: number, color: number, shine = true): void {
  g.fillStyle(darken(color, 0.45), 1);
  g.fillEllipse(x, y, w, h);
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const t = (i + 1) / steps; // 0..1, inner = lighter
    const k = 1 - t * 0.72;
    const ox = -w * 0.14 * t;
    const oy = -h * 0.14 * t;
    g.fillStyle(i === 0 ? color : lighten(color, t * 0.32), 1);
    g.fillEllipse(x + ox, y + oy, w * k * (i === 0 ? 0.94 : 1), h * k * (i === 0 ? 0.94 : 1));
  }
  // Rim light along the lower right.
  g.lineStyle(Math.max(1.5, Math.min(w, h) * 0.035), lighten(color, 0.45), 0.35);
  g.beginPath();
  g.arc(x, y, Math.min(w, h) * 0.44, 0.15, 1.35, false);
  g.strokePath();
  if (shine) gloss(g, x - w * 0.18, y - h * 0.22, w * 0.32, h * 0.2);
}

/** A shaded sphere of radius r. */
export function ball(g: G, x: number, y: number, r: number, color: number, shine = true): void {
  blob(g, x, y, r * 2, r * 2, color, shine);
}

/**
 * A box seen slightly from above: a front face (x, y = top-left of the front, w x h) with a vertical gradient,
 * a lighter top face `depth` deep and a darker right side face. Gives furniture and walls real volume.
 */
export function slab(g: G, x: number, y: number, w: number, h: number, color: number, depth = Math.min(w, h) * 0.18): void {
  const d = depth;
  // Top face (parallelogram going up-right).
  g.fillStyle(lighten(color, 0.3), 1);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + d, y - d * 0.6);
  g.lineTo(x + w + d, y - d * 0.6);
  g.lineTo(x + w, y);
  g.closePath();
  g.fillPath();
  // Right side face.
  g.fillStyle(darken(color, 0.35), 1);
  g.beginPath();
  g.moveTo(x + w, y);
  g.lineTo(x + w + d, y - d * 0.6);
  g.lineTo(x + w + d, y + h - d * 0.6);
  g.lineTo(x + w, y + h);
  g.closePath();
  g.fillPath();
  // Front face: top lighter, bottom darker.
  g.fillGradientStyle(lighten(color, 0.12), lighten(color, 0.12), darken(color, 0.18), darken(color, 0.18), 1);
  g.fillRect(x, y, w, h);
  // Edges: a highlight along the top front edge, a dark outline.
  g.lineStyle(Math.max(1, d * 0.12), lighten(color, 0.55), 0.8);
  g.lineBetween(x, y + 1, x + w, y + 1);
  g.lineStyle(Math.max(1, d * 0.1), darken(color, 0.55), 0.9);
  g.strokeRect(x, y, w, h);
}

/** A rounded panel with a bevel: lighter top edge, darker bottom edge, vertical gradient. (x, y) = top-left. */
export function panel(g: G, x: number, y: number, w: number, h: number, color: number, radius = Math.min(w, h) * 0.15): void {
  const r = Math.min(radius, w / 2, h / 2);
  g.fillStyle(darken(color, 0.4), 1);
  g.fillRoundedRect(x, y, w, h, r);
  g.fillStyle(lighten(color, 0.25), 1);
  g.fillRoundedRect(x + w * 0.02, y + h * 0.02, w * 0.96, h * 0.9, r * 0.9);
  const bands = 5;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    g.fillStyle(mix(lighten(color, 0.1), darken(color, 0.15), t), 1);
    const by = y + h * 0.06 + (h * 0.82 * i) / bands;
    g.fillRect(x + w * 0.05, by, w * 0.9, (h * 0.82) / bands + 1);
  }
  g.lineStyle(Math.max(1, Math.min(w, h) * 0.03), lighten(color, 0.6), 0.6);
  g.lineBetween(x + r, y + h * 0.05, x + w - r, y + h * 0.05);
}

/** An upright cylinder (posts, pots, trunks): left-dark, centre-light, right-dark bands, lighter elliptical top.
 *  (x, y) = centre of the bottom; w = diameter, h = height. */
export function cylinder(g: G, x: number, y: number, w: number, h: number, color: number): void {
  const eh = w * 0.3;
  g.fillStyle(darken(color, 0.4), 1);
  g.fillEllipse(x, y, w, eh);
  const bands = 9;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1); // 0 left .. 1 right
    const light = 1 - Math.abs(t - 0.35) * 1.6; // brightest a bit left of centre
    g.fillStyle(light > 0 ? lighten(color, light * 0.3) : darken(color, -light * 0.45), 1);
    g.fillRect(x - w / 2 + (w * i) / bands, y - h, w / bands + 1, h);
  }
  g.fillStyle(lighten(color, 0.35), 1);
  g.fillEllipse(x, y - h, w, eh);
  g.lineStyle(Math.max(1, w * 0.04), darken(color, 0.5), 0.8);
  g.strokeEllipse(x, y - h, w, eh);
}

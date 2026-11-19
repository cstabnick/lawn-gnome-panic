// Small drawing and text helpers for the house scene. Kept apart from HouseScene.ts to keep that file short.
import Phaser from 'phaser';
import { COLORS, FONT } from '../config';

export interface TxtOpts {
  color?: string;
  bold?: boolean;
  /** Horizontal origin, 0 = left. Default centre. */
  ox?: number;
  /** Vertical origin, 0 = top. Default centre. */
  oy?: number;
  /** Wrap at this width (px). */
  wrap?: number;
}

/** A font size as a fraction of the screen's short side: never below 14 px, never above 32 px. */
export function fsz(scene: Phaser.Scene, k: number): number {
  return Math.min(32, Math.max(14, Math.round(Math.min(scene.scale.width, scene.scale.height) * k)));
}

/** Text, added to parent. */
export function txt(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  x: number,
  y: number,
  text: string,
  size: number,
  o: TxtOpts = {},
): Phaser.GameObjects.Text {
  const style: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color: o.color ?? COLORS.text,
    fontStyle: o.bold ? 'bold' : 'normal',
  };
  if (o.wrap) style.wordWrap = { width: o.wrap, useAdvancedWrap: true };
  const t = scene.add.text(x, y, text, style).setOrigin(o.ox ?? 0.5, o.oy ?? 0.5);
  parent.add(t);
  return t;
}

/** A rounded panel with its top-left at x,y. */
export function drawPanel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: number,
  edge: number,
  edgeW: number,
  radius = 18,
): void {
  g.fillStyle(fill, 1);
  g.fillRoundedRect(x, y, w, h, radius);
  if (edgeW > 0) {
    g.lineStyle(edgeW, edge, 1);
    g.strokeRoundedRect(x, y, w, h, radius);
  }
}

/** A tappable rounded button centred on cx,cy, added to parent. onTap runs on pointerdown. */
export function button(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  cx: number,
  cy: number,
  w: number,
  h: number,
  label: string,
  fill: number,
  size: number,
  onTap: () => void,
): Phaser.GameObjects.Container {
  const c = scene.add.container(cx, cy);
  const g = scene.add.graphics();
  drawPanel(g, -w / 2, -h / 2, w, h, fill, COLORS.buttonEdge, 3, Math.min(18, h / 2));
  c.add(g);
  txt(scene, c, 0, 0, label, size, { bold: true });
  // The hit area is in the container's local space, centred on (0, 0) like the drawn panel. A (0, 0, w, h) rect only
  // covered the bottom-right quarter of the button, so taps elsewhere on it did nothing.
  c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  c.on('pointerdown', onTap);
  parent.add(c);
  return c;
}

/** The client gnome: red hat, peach face, white beard. Centred on cx,cy, about s px tall. */
export function drawGnome(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
  g.fillStyle(0xfaf6ee, 1);
  g.fillCircle(cx, cy + s * 0.2, s * 0.26);
  g.fillStyle(0xffd7b0, 1);
  g.fillCircle(cx, cy, s * 0.22);
  g.fillStyle(0xe0393e, 1);
  g.fillTriangle(cx - s * 0.26, cy - s * 0.1, cx + s * 0.26, cy - s * 0.1, cx, cy - s * 0.62);
  g.fillStyle(0x2b1d3a, 1);
  g.fillCircle(cx - s * 0.08, cy - s * 0.03, s * 0.03);
  g.fillCircle(cx + s * 0.08, cy - s * 0.03, s * 0.03);
}

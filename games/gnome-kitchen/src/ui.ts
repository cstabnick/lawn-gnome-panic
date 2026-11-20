// Drawing helpers for the play plate and the bars. Plain Phaser, a little bit of bounce.
import Phaser from 'phaser';
import { COLORS, N } from './config';
import { ICON_EMOJI, iconKey, type IconName } from './icons';
import type { Board } from './layout';

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** A point on the play plate, from fractions of its width and height. */
export function at(b: Board, nx: number, ny: number): { x: number; y: number } {
  return { x: b.x + nx * b.w, y: b.y + ny * b.h };
}

/** True when (x, y) is inside a square of side `frac` * u centred at (nx, ny). */
export function inSquare(b: Board, nx: number, ny: number, frac: number, x: number, y: number): boolean {
  const c = at(b, nx, ny);
  const half = (b.u * frac) / 2;
  return Math.abs(x - c.x) <= half && Math.abs(y - c.y) <= half;
}

/** A kitchen picture, `frac` * u wide, with a soft shadow and a gentle bob. Falls back to its emoji. */
export function iconAt(
  scene: Phaser.Scene,
  layer: Phaser.GameObjects.Container,
  b: Board,
  name: IconName,
  nx: number,
  ny: number,
  frac: number,
): Phaser.GameObjects.Image | Phaser.GameObjects.Text {
  const c = at(b, nx, ny);
  const size = b.u * frac;
  const shadow = scene.add.ellipse(c.x, c.y + size * 0.42, size * 0.6, size * 0.14, 0x3b2a1a, 0.18);
  layer.add(shadow);
  const obj = scene.textures.exists(iconKey(name))
    ? scene.add.image(c.x, c.y, iconKey(name)).setDisplaySize(size, size)
    : scene.add.text(c.x, c.y, ICON_EMOJI[name], { fontFamily: FONT, fontSize: `${Math.round(size * 0.8)}px` }).setOrigin(0.5);
  layer.add(obj);
  scene.tweens.add({
    targets: obj,
    y: c.y - size * 0.03,
    duration: 900 + Math.random() * 400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
  obj.once('destroy', () => scene.tweens.killTweensOf(obj));
  return obj;
}

export function textAt(
  scene: Phaser.Scene,
  layer: Phaser.GameObjects.Container,
  x: number,
  y: number,
  text: string,
  size: number,
  opts: { color?: string; bold?: boolean; width?: number } = {},
): Phaser.GameObjects.Text {
  const t = scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      fontSize: `${Math.round(size)}px`,
      color: opts.color ?? COLORS.ink,
      fontStyle: opts.bold ? 'bold' : 'normal',
      align: 'center',
      wordWrap: opts.width ? { width: opts.width } : undefined,
      stroke: '#ffffff',
      strokeThickness: Math.max(2, Math.round(size / 7)),
    })
    .setOrigin(0.5);
  layer.add(t);
  return t;
}

/** A chunky pill button, at least 44 px tall. Disabled buttons are grey and do nothing. */
export class Button {
  private readonly box: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private enabled = true;

  constructor(
    scene: Phaser.Scene,
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    text: string,
    size: number,
    private readonly onTap: () => void,
  ) {
    this.box = scene.add.container(x, y);
    this.bg = scene.add.graphics();
    this.label = scene.add.text(0, 0, text, { fontFamily: FONT, fontSize: `${Math.round(size)}px`, fontStyle: 'bold', color: COLORS.white }).setOrigin(0.5);
    this.box.add([this.bg, this.label]);
    this.box.setInteractive(new Phaser.Geom.Rectangle(-50, -22, 100, 44), Phaser.Geom.Rectangle.Contains);
    this.box.on('pointerdown', () => {
      if (!this.enabled) return;
      this.tap();
      this.onTap();
    });
    parent.add(this.box);
    this.redraw();
  }

  /** Change the label (null hides the button) and whether it can be pressed. */
  set(text: string | null, enabled: boolean): void {
    this.box.setVisible(text !== null);
    if (text !== null && text !== this.label.text) this.label.setText(text);
    if (enabled !== this.enabled) {
      this.enabled = enabled;
      this.redraw();
    }
    if (text !== null) this.redraw();
  }

  private tap(): void {
    this.box.scene.tweens.add({ targets: this.box, scaleX: 0.92, scaleY: 0.92, yoyo: true, duration: 80 });
  }

  private redraw(): void {
    const w = Math.max(96, this.label.width + 34);
    const h = Math.max(44, this.label.height + 14);
    this.bg.clear();
    this.bg.fillStyle(0x3b2a1a, 0.18);
    this.bg.fillRoundedRect(-w / 2, -h / 2 + 4, w, h, h / 2);
    this.bg.fillStyle(N(this.enabled ? COLORS.green : COLORS.off), 1);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    this.bg.fillStyle(0xffffff, 0.25);
    this.bg.fillRoundedRect(-w / 2 + 6, -h / 2 + 4, w - 12, h * 0.38, h / 4);
    this.label.setColor(this.enabled ? COLORS.white : COLORS.offInk);
    const hit = this.box.input?.hitArea as Phaser.Geom.Rectangle | undefined;
    hit?.setTo(-w / 2, -h / 2, w, h);
  }
}

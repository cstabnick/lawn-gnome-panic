// Small helpers for drawing in the board and the bars. Plain Phaser, nothing clever.
import Phaser from 'phaser';
import { COLORS } from './config';
import { ICON_EMOJI, iconKey, type IconName } from './icons';
import type { Board } from './layout';

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** A point inside the board, from fractions of its width and height. */
export function at(b: Board, nx: number, ny: number): { x: number; y: number } {
  return { x: b.x + nx * b.w, y: b.y + ny * b.h };
}

/** True when (x, y) is inside a square of side `frac` * u centred at (nx, ny). */
export function inSquare(b: Board, nx: number, ny: number, frac: number, x: number, y: number): boolean {
  const c = at(b, nx, ny);
  const half = (b.u * frac) / 2;
  return Math.abs(x - c.x) <= half && Math.abs(y - c.y) <= half;
}

/** A kitchen picture, square, `frac` * u wide. Falls back to its emoji. */
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
  const obj = scene.textures.exists(iconKey(name))
    ? scene.add.image(c.x, c.y, iconKey(name)).setDisplaySize(size, size)
    : scene.add.text(c.x, c.y, ICON_EMOJI[name], { fontFamily: FONT, fontSize: `${Math.round(size * 0.8)}px` }).setOrigin(0.5);
  layer.add(obj);
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
    })
    .setOrigin(0.5);
  layer.add(t);
  return t;
}

/** A tappable button: a green label box, at least 44 px tall. Disabled buttons are grey and do nothing. */
export class Button {
  private readonly obj: Phaser.GameObjects.Text;
  private enabled = true;

  constructor(
    scene: Phaser.Scene,
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    label: string,
    size: number,
    private readonly onTap: () => void,
  ) {
    this.obj = scene.add
      .text(x, y, label, {
        fontFamily: FONT,
        fontSize: `${Math.round(size)}px`,
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: COLORS.green,
        padding: { left: 14, right: 14, top: 12, bottom: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.obj.on('pointerdown', () => {
      if (this.enabled) this.onTap();
    });
    parent.add(this.obj);
  }

  /** Change the label (null hides the button) and whether it can be pressed. */
  set(label: string | null, enabled: boolean): void {
    this.obj.setVisible(label !== null);
    if (label !== null) this.obj.setText(label);
    this.enabled = enabled;
    this.obj.setBackgroundColor(enabled ? COLORS.green : COLORS.off);
    this.obj.setColor(enabled ? '#ffffff' : COLORS.offInk);
  }
}

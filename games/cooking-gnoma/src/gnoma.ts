// Gnoma: the cooking mama. Drawn in code (she is a character, not a prefab), with a blinking face, a talking mouth,
// a bobbing idle, a cheer, and a speech bubble that types out her lines.
import Phaser from 'phaser';
import { COLORS, N } from './config';
import type { Rect } from './layout';
import { FONT } from './ui';

/** Her full height in units; 1 unit is the figure's height divided by this. Feet are at y = 0. */
const H = 1.12;

export class Gnoma {
  private root?: Phaser.GameObjects.Container;
  private mouth?: Phaser.GameObjects.Graphics;
  private eyes?: Phaser.GameObjects.Container;
  private bubble?: Phaser.GameObjects.Container;
  private line?: Phaser.GameObjects.Text;
  private rect: Rect | null = null;
  private wide = false;
  private fs = 16;
  private s = 100;
  private fx = 0;
  private fy = 0;
  private text = '';
  private shown = 0;
  private open = false;
  private mouthClock = 0;
  private blinkIn = 2.5;
  private blinkLeft = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  /** Lays her out in `rect` (her panel). Keeps what she is saying. */
  setLayout(rect: Rect, wide: boolean, fs: number): void {
    this.rect = rect;
    this.wide = wide;
    this.fs = fs;
    this.build();
  }

  /** Starts a new line; the bubble types it out. */
  say(line: string): void {
    this.text = line;
    this.shown = 0;
    this.open = false;
    this.line?.setText('');
    this.drawMouth();
  }

  /** A little hop for joy. */
  cheer(): void {
    if (!this.root) return;
    this.scene.tweens.killTweensOf(this.root);
    this.root.y = this.fy;
    this.scene.tweens.add({
      targets: this.root,
      y: this.fy - this.s * 0.22,
      yoyo: true,
      repeat: 3,
      duration: 150,
      ease: 'Quad.easeOut',
      onComplete: () => this.bob(),
    });
  }

  update(dt: number): void {
    if (!this.line || !this.eyes) return;
    if (this.shown < this.text.length) {
      this.shown = Math.min(this.text.length, this.shown + dt * 42);
      this.line.setText(this.text.slice(0, Math.floor(this.shown)));
      this.mouthClock += dt;
      if (this.mouthClock > 0.11) {
        this.mouthClock = 0;
        this.open = !this.open;
        this.drawMouth();
      }
    } else if (this.open) {
      this.open = false;
      this.drawMouth();
    }
    this.blinkIn -= dt;
    if (this.blinkIn <= 0) {
      this.blinkLeft = 0.12;
      this.blinkIn = 2 + Math.random() * 2.5;
      this.eyes.scaleY = 0.1;
    }
    if (this.blinkLeft > 0) {
      this.blinkLeft -= dt;
      if (this.blinkLeft <= 0) this.eyes.scaleY = 1;
    }
  }

  private build(): void {
    if (!this.rect) return;
    const r = this.rect;
    this.root?.destroy();
    this.bubble?.destroy();
    const s = this.wide
      ? Math.min((r.w * 0.9) / 0.72, (r.h * 0.45) / H)
      : Math.min((r.h * 0.9) / H, (r.w * 0.3) / 0.72);
    this.s = s;
    this.fx = this.wide ? r.x + r.w / 2 : r.x + 0.36 * s + 10;
    this.fy = r.y + r.h - 8;

    const root = this.scene.add.container(this.fx, this.fy);
    const body = this.scene.add.graphics();
    drawBody(body, s);
    const eyes = this.scene.add.container(0, -0.76 * s);
    const eyeG = this.scene.add.graphics();
    eyeG.fillStyle(0xffffff, 1);
    eyeG.fillCircle(-0.08 * s, 0, 0.05 * s);
    eyeG.fillCircle(0.08 * s, 0, 0.05 * s);
    eyeG.fillStyle(0x3b2a1a, 1);
    eyeG.fillCircle(-0.075 * s, 0.005 * s, 0.026 * s);
    eyeG.fillCircle(0.085 * s, 0.005 * s, 0.026 * s);
    eyes.add(eyeG);
    const mouth = this.scene.add.graphics();
    mouth.y = -0.6 * s;
    root.add([body, eyes, mouth]);
    this.root = root;
    this.eyes = eyes;
    this.mouth = mouth;
    this.drawMouth();
    this.bob();

    // The speech bubble: beside her in portrait, above her in landscape.
    const bh = Math.max(60, this.wide ? r.h - 1.12 * s - 22 : r.h - 16);
    const bx = this.wide ? r.x + 6 : r.x + 0.72 * s + 22;
    const by = this.wide ? r.y + 6 : r.y + 8;
    const bw = this.wide ? r.w - 12 : r.w - (0.72 * s + 30);
    const bubble = this.scene.add.container(bx, by);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(0, 0, bw, bh, 14);
    bg.lineStyle(3, N(COLORS.pink), 1);
    bg.strokeRoundedRect(0, 0, bw, bh, 14);
    bg.fillStyle(0xffffff, 1);
    if (this.wide) {
      bg.fillTriangle(bw / 2 - 10, bh - 1, bw / 2 + 10, bh - 1, bw / 2, bh + 14);
    } else {
      bg.fillTriangle(1, bh / 2 - 10, 1, bh / 2 + 10, -14, bh / 2);
    }
    const line = this.scene.add.text(12, 10, this.text.slice(0, Math.floor(this.shown)), {
      fontFamily: FONT,
      fontSize: `${Math.round(this.fs * 0.85)}px`,
      fontStyle: 'bold',
      color: COLORS.ink,
      wordWrap: { width: bw - 24 },
    });
    bubble.add([bg, line]);
    this.bubble = bubble;
    this.line = line;
  }

  private bob(): void {
    if (!this.root) return;
    this.scene.tweens.add({
      targets: this.root,
      y: this.fy - this.s * 0.02,
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.easeInOut',
    });
  }

  private drawMouth(): void {
    const m = this.mouth;
    if (!m) return;
    const s = this.s;
    m.clear();
    if (this.open) {
      m.fillStyle(0x3b2a1a, 1);
      m.fillEllipse(0, 0.02 * s, 0.1 * s, 0.07 * s);
      m.fillStyle(0xff8fa3, 1);
      m.fillEllipse(0, 0.04 * s, 0.05 * s, 0.03 * s);
    } else {
      m.lineStyle(Math.max(2, 0.022 * s), 0x3b2a1a, 1);
      m.beginPath();
      m.arc(0, 0, 0.07 * s, 0.15 * Math.PI, 0.85 * Math.PI, false);
      m.strokePath();
    }
  }
}

/** Gnoma's body, drawn at scale s with the feet at (0, 0). Each unit is a fraction of her height. */
function drawBody(g: Phaser.GameObjects.Graphics, s: number): void {
  // Shadow
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(0, 0, 0.72 * s, 0.14 * s);
  // Boots
  g.fillStyle(N('#7a4b2a'), 1);
  g.fillRoundedRect(-0.2 * s, -0.13 * s, 0.17 * s, 0.13 * s, 0.05 * s);
  g.fillRoundedRect(0.03 * s, -0.13 * s, 0.17 * s, 0.13 * s, 0.05 * s);
  // Arms (behind the coat)
  g.fillStyle(N('#258a40'), 1);
  g.fillEllipse(-0.36 * s, -0.38 * s, 0.16 * s, 0.34 * s);
  g.fillEllipse(0.36 * s, -0.38 * s, 0.16 * s, 0.34 * s);
  // Coat
  g.fillStyle(N('#2fa84f'), 1);
  g.fillEllipse(0, -0.36 * s, 0.7 * s, 0.5 * s);
  // Hands
  g.fillStyle(N('#ffd6b0'), 1);
  g.fillCircle(-0.36 * s, -0.2 * s, 0.06 * s);
  g.fillCircle(0.36 * s, -0.2 * s, 0.06 * s);
  // Apron with a pink ribbon
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(-0.2 * s, -0.52 * s, 0.4 * s, 0.36 * s, 0.08 * s);
  g.fillStyle(N(COLORS.pink), 1);
  g.fillRect(-0.2 * s, -0.4 * s, 0.4 * s, 0.035 * s);
  // Head
  g.fillStyle(N('#ffd6b0'), 1);
  g.fillCircle(0, -0.74 * s, 0.2 * s);
  // Beard
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-0.1 * s, -0.52 * s, 0.1 * s);
  g.fillCircle(0.1 * s, -0.52 * s, 0.1 * s);
  g.fillCircle(0, -0.46 * s, 0.12 * s);
  // Nose and cheeks
  g.fillStyle(N('#f29e8e'), 1);
  g.fillCircle(0, -0.7 * s, 0.055 * s);
  g.fillStyle(N('#ff8fa3'), 0.7);
  g.fillCircle(-0.12 * s, -0.68 * s, 0.035 * s);
  g.fillCircle(0.12 * s, -0.68 * s, 0.035 * s);
  // Hat: a fat red cone with white spots
  g.fillStyle(N('#e63946'), 1);
  g.fillTriangle(-0.22 * s, -0.9 * s, 0.22 * s, -0.9 * s, 0.02 * s, -1.12 * s);
  g.fillStyle(N('#c1121f'), 1);
  g.fillEllipse(0, -0.9 * s, 0.52 * s, 0.1 * s);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-0.07 * s, -1.0 * s, 0.025 * s);
  g.fillCircle(0.07 * s, -0.98 * s, 0.025 * s);
  g.fillCircle(0, -1.07 * s, 0.025 * s);
}

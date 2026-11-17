// Juice: particles, confetti, fireworks, big text, shakes. Textures come from TEX (BootScene).
import Phaser from 'phaser';
import { COLORS, FONT, TEX } from './config';
import { playSfx } from './audio';

export interface XY {
  x: number;
  y: number;
}

/** Everything FX adds sits at this depth or above, so it draws over the board and the house. */
const FX_DEPTH = 1000;

const KIND_COLORS = Object.values(COLORS.kind);

const RAINBOW = [0xff3b3b, 0xffa53b, 0xffd23f, 0x5ee06a, 0x3fa9ff, 0xb44dff];

function pickKindColor(): number {
  return KIND_COLORS[Math.floor(Math.random() * KIND_COLORS.length)];
}

/** A pop of `count` particles tinted `color` at x,y. */
export function burst(scene: Phaser.Scene, x: number, y: number, color: number, count = 12): void {
  const em = scene.add.particles(x, y, TEX.spark, {
    speed: { min: 120, max: 320 },
    angle: { min: 0, max: 360 },
    lifespan: 450,
    scale: { start: 1.4, end: 0 },
    tint: color,
    blendMode: 'ADD',
    emitting: false,
  });
  em.setDepth(FX_DEPTH);
  em.explode(count, x, y);
  scene.time.delayedCall(450 + 50, () => em.destroy());

  if (count >= 12) {
    const stars = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < stars; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 60 + Math.random() * 80;
      const s = scene.add.image(x, y, TEX.star).setScale(0.3).setDepth(FX_DEPTH);
      scene.tweens.add({
        targets: s,
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d,
        alpha: 0,
        duration: 450,
        onComplete: () => s.destroy(),
      });
    }
  }
}

/** Confetti rains over the whole screen for durationMs. */
export function confetti(scene: Phaser.Scene, durationMs = 2500): void {
  const w = scene.scale.width;
  const em = scene.add.particles(0, -20, TEX.confetti, {
    x: { min: 0, max: w },
    speedY: { min: 80, max: 200 },
    speedX: { min: -40, max: 40 },
    gravityY: 300,
    rotate: { min: 0, max: 360 },
    tint: KIND_COLORS,
    lifespan: 3000,
    frequency: 40,
    quantity: 2,
  });
  em.setDepth(FX_DEPTH);
  em.setScrollFactor(0);
  scene.time.delayedCall(durationMs, () => em.stop());
  scene.time.delayedCall(durationMs + 3000 + 100, () => em.destroy());
}

/** `count` firework rockets launch from the bottom and explode in random colours over ~2 s. */
export function fireworks(scene: Phaser.Scene, count = 6): void {
  const w = scene.scale.width;
  const h = scene.scale.height;
  for (let i = 0; i < count; i++) {
    const launchAt = (i / Math.max(1, count)) * 1200 + Math.random() * 200;
    scene.time.delayedCall(launchAt, () => {
      const color = pickKindColor();
      const sx = w * (0.1 + Math.random() * 0.8);
      const tx = w * (0.15 + Math.random() * 0.7);
      const ty = h * (0.12 + Math.random() * 0.4);
      const rocket = scene.add
        .image(sx, h + 10, TEX.spark)
        .setTint(color)
        .setScale(1.5)
        .setDepth(FX_DEPTH);
      scene.tweens.add({
        targets: rocket,
        x: tx,
        y: ty,
        duration: 600 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => {
          rocket.destroy();
          burst(scene, tx, ty, color, 40);
          flash(scene, color, 0.12);
          playSfx('bomb', 1.5);
        },
      });
    });
  }
}

/** Big bouncy text that pops in at x,y, floats up and fades. Returns the Text (already scheduled to destroy). */
export function floatText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  opts: { color?: string; size?: number; durationMs?: number } = {},
): Phaser.GameObjects.Text {
  const durationMs = opts.durationMs ?? 900;
  const scaleFactor = Math.max(0.6, Math.min(scene.scale.width, scene.scale.height) / 700);
  const size = Math.round((opts.size ?? 48) * scaleFactor);
  const t = scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      color: opts.color ?? COLORS.accent,
      stroke: COLORS.textDark,
      strokeThickness: Math.max(1, Math.round(size / 8)),
      align: 'center',
    })
    .setOrigin(0.5)
    .setDepth(FX_DEPTH)
    .setScale(0);

  scene.tweens.add({
    targets: t,
    scale: 1.15,
    duration: durationMs * 0.3,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({ targets: t, scale: 1, duration: durationMs * 0.1 });
    },
  });
  scene.tweens.add({
    targets: t,
    y: y - 60,
    alpha: 0,
    duration: durationMs,
    onComplete: () => t.destroy(),
  });
  return t;
}

export function shake(scene: Phaser.Scene, intensity = 0.006, durationMs = 180): void {
  scene.cameras.main.shake(durationMs, intensity);
}

/** Full-screen colour flash that fades out. */
export function flash(scene: Phaser.Scene, color = 0xffffff, alpha = 0.5, durationMs = 220): void {
  const r = scene.add
    .rectangle(0, 0, scene.scale.width, scene.scale.height, color)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(FX_DEPTH)
    .setAlpha(alpha);
  scene.tweens.add({
    targets: r,
    alpha: 0,
    duration: durationMs,
    onComplete: () => r.destroy(),
  });
}

/** The big lawnmower (TEX.mower) drives from `from` to `to`, spraying grass clippings. Resolves on arrival. */
export function mowerSweep(scene: Phaser.Scene, from: XY, to: XY, durationMs = 300): Promise<void> {
  return new Promise((resolve) => {
    playSfx('mower');
    const heading = Math.atan2(to.y - from.y, to.x - from.x);
    const img = scene.add.image(from.x, from.y, TEX.mower).setRotation(heading).setDepth(FX_DEPTH);

    // Clippings spray out behind the mower: emit opposite to the heading.
    const backDeg = (heading * 180) / Math.PI + 180;
    const trail = scene.add.particles(from.x, from.y, TEX.leaf, {
      speed: { min: 40, max: 100 },
      angle: { min: backDeg - 30, max: backDeg + 30 },
      lifespan: 500,
      scale: { start: 1, end: 0.4 },
      frequency: 25,
      quantity: 1,
    });
    trail.setDepth(FX_DEPTH);
    trail.startFollow(img, -Math.cos(heading) * 30, -Math.sin(heading) * 30);

    scene.tweens.add({
      targets: img,
      x: to.x,
      y: to.y,
      duration: durationMs,
      ease: 'Linear',
      onComplete: () => {
        trail.stopFollow();
        trail.stop();
        img.destroy();
        scene.time.delayedCall(600, () => trail.destroy());
        resolve();
      },
    });
  });
}

/** A rainbow beam from `from` to `to` that fades in ~250 ms (prism). */
export function beam(scene: Phaser.Scene, from: XY, to: XY, color = 0xffffff): void {
  const g = scene.add.graphics().setDepth(FX_DEPTH);
  const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  const nx = -(to.y - from.y) / len;
  const ny = (to.x - from.x) / len;
  const useColor = color !== 0xffffff;
  // Six 2 px strands spaced 2 px apart: about 10 px across.
  for (let i = 0; i < 6; i++) {
    const off = -5 + i * 2;
    g.lineStyle(2, useColor ? color : RAINBOW[i], 1);
    g.lineBetween(from.x + nx * off, from.y + ny * off, to.x + nx * off, to.y + ny * off);
  }
  scene.tweens.add({
    targets: g,
    alpha: 0,
    duration: 250,
    onComplete: () => g.destroy(),
  });
}

/** An image of `texture` flies along an arc from `from` to `to`, then is destroyed. Resolves on arrival. */
export function flyTo(scene: Phaser.Scene, texture: string, from: XY, to: XY, durationMs = 500, scale = 1): Promise<void> {
  return new Promise((resolve) => {
    const img = scene.add.image(from.x, from.y, texture).setScale(scale).setDepth(FX_DEPTH);
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    // Control point above the midpoint makes the arc.
    const cx = (from.x + to.x) / 2;
    const cy = (from.y + to.y) / 2 - Math.max(60, dist * 0.35);
    const p = { t: 0 };
    scene.tweens.add({
      targets: p,
      t: 1,
      duration: durationMs,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const t = p.t;
        const u = 1 - t;
        img.x = u * u * from.x + 2 * u * t * cx + t * t * to.x;
        img.y = u * u * from.y + 2 * u * t * cy + t * t * to.y;
        img.setScale(scale * (1 - 0.4 * t));
      },
      onComplete: () => {
        img.destroy();
        resolve();
      },
    });
  });
}

/** Spinning rays (TEX.rays) behind a point, for win screens. Returns them so the caller can destroy them. */
export function rays(scene: Phaser.Scene, x: number, y: number, color = 0xffd23f, scale = 2): Phaser.GameObjects.Image {
  const r = scene.add
    .image(x, y, TEX.rays)
    .setTint(color)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setAlpha(0.6)
    .setScale(scale)
    .setDepth(FX_DEPTH);
  const spin = scene.tweens.add({ targets: r, angle: 360, repeat: -1, duration: 6000 });
  // Stop the spin when the caller destroys the rays, so the tween does not outlive them.
  r.once(Phaser.GameObjects.Events.DESTROY, () => spin.stop());
  return r;
}

/** Resolves after ms (scene clock). */
export function wait(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise((res) => scene.time.delayedCall(ms, () => res()));
}

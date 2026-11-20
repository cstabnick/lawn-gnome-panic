// Little effects: bursts of colour, rising words, squash on a tap. All objects tidy themselves up when done.
import Phaser from 'phaser';
import { CONFETTI, N } from './config';
import { FONT } from './ui';

/** A puff of little dots that fly out and fade. */
export function burst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  n: number,
  colors: readonly string[] = CONFETTI,
  dist = 60,
): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = dist * (0.5 + Math.random() * 0.5);
    const dot = scene.add.circle(x, y, 3 + Math.random() * 4, N(colors[i % colors.length]));
    scene.tweens.add({
      targets: dot,
      x: x + Math.cos(a) * d,
      y: y + Math.sin(a) * d + 12,
      alpha: 0,
      scale: 0.4,
      duration: 500 + Math.random() * 250,
      ease: 'Quad.easeOut',
      onComplete: () => dot.destroy(),
    });
  }
}

/** A word that pops up, then rises and fades. */
export function popText(scene: Phaser.Scene, x: number, y: number, text: string, color: string, size: number): void {
  const t = scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      fontSize: `${Math.round(size)}px`,
      fontStyle: 'bold',
      color,
      stroke: '#ffffff',
      strokeThickness: Math.max(3, Math.round(size / 6)),
    })
    .setOrigin(0.5)
    .setScale(0.4);
  scene.tweens.add({ targets: t, scale: 1, duration: 180, ease: 'Back.easeOut' });
  scene.tweens.add({
    targets: t,
    y: y - size * 1.6,
    alpha: 0,
    delay: 500,
    duration: 600,
    onComplete: () => t.destroy(),
  });
}

/** A quick squash and stretch, the "boing" of a tap. */
export function squash(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject & { scaleX: number; scaleY: number }): void {
  const sx = target.scaleX;
  const sy = target.scaleY;
  scene.tweens.add({ targets: target, scaleX: sx * 1.12, scaleY: sy * 0.88, yoyo: true, duration: 90 });
}

import Phaser from 'phaser';
import { getMyGnome } from '@lawn/gnome';
import { SCENES, TEX, COLORS } from '../config';
export class BootScene extends Phaser.Scene {
  constructor() { super(SCENES.boot); }
  create(): void {
    const g = this.add.graphics();

    g.clear();
    g.fillStyle(getMyGnome()?.look.hat ?? COLORS.player);
    g.fillCircle(16, 16, 15);
    g.lineStyle(2, 0xffffff, 0.8);
    g.strokeCircle(16, 16, 14);
    g.generateTexture(TEX.player, 32, 32);

    g.clear();
    g.fillStyle(COLORS.enemy);
    g.fillTriangle(14, 1, 27, 27, 1, 27);
    g.generateTexture(TEX.enemy, 28, 28);

    g.clear();
    g.fillStyle(COLORS.coin);
    g.fillCircle(8, 8, 7);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(6, 5, 2);
    g.generateTexture(TEX.coin, 16, 16);

    g.clear();
    g.fillStyle(COLORS.spark);
    g.fillRect(0, 0, 6, 6);
    g.generateTexture(TEX.spark, 6, 6);

    g.destroy();
    this.scene.start(SCENES.title);
  }
}

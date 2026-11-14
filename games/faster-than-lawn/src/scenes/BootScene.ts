import Phaser from 'phaser';
import { SCENES, TEX } from '../config';

/** Gnome silhouette shared by both crews: body first, then hat, face, beard and eyes on top. */
function drawGnome(g: Phaser.GameObjects.Graphics, hat: number, body: number): void {
  g.fillStyle(body, 1);
  g.fillRect(4, 20, 16, 10);
  g.fillStyle(hat, 1);
  g.fillTriangle(12, 0, 22, 14, 2, 14);
  g.fillStyle(0xffccbc, 1);
  g.fillCircle(12, 17, 5);
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(5, 18, 19, 18, 12, 30);
  g.fillStyle(0x000000, 1);
  g.fillRect(9, 15, 2, 2);
  g.fillRect(13, 15, 2, 2);
}

export class BootScene extends Phaser.Scene {
  constructor() { super(SCENES.boot); }

  create(): void {
    const g = this.add.graphics();
    const make = (key: string, w: number, h: number, draw: () => void): void => {
      g.clear();
      draw();
      g.generateTexture(key, w, h);
    };

    make(TEX.gnome, 24, 32, () => drawGnome(g, 0xd32f2f, 0x1565c0));
    make(TEX.gnomeEnemy, 24, 32, () => drawGnome(g, 0x1e88e5, 0x6a1b9a));

    make(TEX.clipping, 12, 6, () => {
      g.fillStyle(0x8bc34a, 1);
      g.fillEllipse(6, 3, 12, 6);
    });

    make(TEX.pinecone, 12, 14, () => {
      g.fillStyle(0x795548, 1);
      g.fillEllipse(6, 7, 12, 14);
      g.fillStyle(0x4e342e, 1);
      g.fillRect(2, 4, 8, 1);
      g.fillRect(2, 7, 8, 1);
      g.fillRect(3, 10, 6, 1);
    });

    make(TEX.fire, 20, 20, () => {
      g.fillStyle(0xff7043, 1);
      g.fillCircle(10, 13, 7);
      g.fillTriangle(3, 12, 17, 12, 10, 0);
      g.fillStyle(0xffeb3b, 1);
      g.fillCircle(10, 13, 3);
    });

    make(TEX.spark, 6, 6, () => {
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 6, 6);
    });

    make(TEX.beacon, 28, 28, () => {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(14, 14, 13);
      g.lineStyle(2, 0xbbbbbb, 1);
      g.strokeEllipse(14, 14, 24, 24);
    });

    g.destroy();
    this.scene.start(SCENES.title);
  }
}

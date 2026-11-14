import Phaser from 'phaser';
import { SCENES } from '../config';

// STUB: textures are generated here (see TEX in config.ts).
export class BootScene extends Phaser.Scene {
  constructor() { super(SCENES.boot); }
  create(): void {
    this.scene.start(SCENES.title);
  }
}

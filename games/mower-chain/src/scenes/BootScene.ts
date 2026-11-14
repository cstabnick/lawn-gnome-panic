import Phaser from 'phaser';
import { SCENES } from '../config';
import { makeTextures } from '../textures';

export class BootScene extends Phaser.Scene {
  constructor() { super(SCENES.boot); }
  create(): void {
    makeTextures(this);
    this.scene.start(SCENES.title);
  }
}

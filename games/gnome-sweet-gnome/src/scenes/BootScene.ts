// STUB (Epic 1).
import Phaser from 'phaser';
import { SCENES } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }
  create(): void {
    this.add.text(20, 20, 'Boot', { color: '#fff' });
  }
}

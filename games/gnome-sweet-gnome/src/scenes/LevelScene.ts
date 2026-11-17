// STUB (Epic 1).
import Phaser from 'phaser';
import { SCENES } from '../config';

export class LevelScene extends Phaser.Scene {
  constructor() {
    super(SCENES.level);
  }
  create(): void {
    this.add.text(20, 20, 'Level', { color: '#fff' });
  }
}

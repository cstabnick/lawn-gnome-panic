// STUB (Epic 1).
import Phaser from 'phaser';
import { SCENES } from '../config';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SCENES.title);
  }
  create(): void {
    this.add.text(20, 20, 'Title', { color: '#fff' });
  }
}

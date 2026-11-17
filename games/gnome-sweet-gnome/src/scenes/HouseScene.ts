// STUB (Epic 1).
import Phaser from 'phaser';
import { SCENES } from '../config';

export class HouseScene extends Phaser.Scene {
  constructor() {
    super(SCENES.house);
  }
  create(): void {
    this.add.text(20, 20, 'House', { color: '#fff' });
  }
}

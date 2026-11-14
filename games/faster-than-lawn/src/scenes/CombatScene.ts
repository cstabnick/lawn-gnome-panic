import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

// STUB: placeholder scene; the class name and scene key are final.
export class CombatScene extends Phaser.Scene {
  constructor() { super(SCENES.combat); }

  create(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Combat (stub)', { color: COLORS.text, fontSize: '32px' }).setOrigin(0.5);
  }
}

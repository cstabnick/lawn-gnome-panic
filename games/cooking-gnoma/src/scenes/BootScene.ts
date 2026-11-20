// Loads the kitchen pictures (prefab renders) before the kitchen opens.
import Phaser from 'phaser';
import { ICON_NAMES, iconKey, iconUrl } from '../icons';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    for (const name of ICON_NAMES) {
      const url = iconUrl(name);
      if (url) this.load.image(iconKey(name), url);
    }
  }

  create(): void {
    this.scene.start('Kitchen');
  }
}

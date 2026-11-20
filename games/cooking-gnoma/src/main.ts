// Entry: a cooking game for one phone or desktop. Make an acorn cake with grass frosting, one step at a time.
import { loadMyGnome } from '@lawn/gnome';
await loadMyGnome();
import Phaser from 'phaser';
import { COLORS } from './config';
import { BootScene } from './scenes/BootScene';
import { KitchenScene } from './scenes/KitchenScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: COLORS.bg,
  // Fill the screen and lay out to whatever shape it is: portrait or landscape.
  scale: { mode: Phaser.Scale.RESIZE },
  scene: [BootScene, KitchenScene],
});

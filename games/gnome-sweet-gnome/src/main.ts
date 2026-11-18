import Phaser from 'phaser';
import { COLORS } from './config';
import { resetSave } from './save';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { HouseScene } from './scenes/HouseScene';
import { LevelScene } from './scenes/LevelScene';

if (/[#&]reset\b/.test(location.hash)) resetSave();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: COLORS.backgroundCss,
  // One texture per batch: with multi-texture batching, rotated/scaled pieces (the board wave) lost triangles that
  // sampled the wrong texture. A few extra draw calls are cheap at this size.
  render: { maxTextures: 1 },
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  scene: [BootScene, TitleScene, HouseScene, LevelScene],
});

// For debugging and tests: the Phaser game.
(window as unknown as { __game: Phaser.Game }).__game = game;

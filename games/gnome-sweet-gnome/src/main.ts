import Phaser from 'phaser';
import { COLORS, SCENES } from './config';
import { KEY, onSaveWritten, resetSave } from './save';
import { cloud, onCloudMerged } from './cloud';
import { showSyncNotice, watchKey } from '@lawn/sync';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { HouseScene } from './scenes/HouseScene';
import { LevelScene } from './scenes/LevelScene';

if (/[#&]reset\b/.test(location.hash)) resetSave();

// Signed-in players: merge this browser's save with the account's before the game reads its progress (merge mode, so
// nothing is thrown away). Without an account this returns at once.
onSaveWritten(() => cloud.pushSave());
await cloud.syncAtStartup();

/** The save changed under this tab (another tab, or another device through the account): redraw the house. */
function refreshHouse(): void {
  const house = game.scene.getScene(SCENES.house) as HouseScene | null;
  if (house && game.scene.isActive(SCENES.house)) house.refresh();
}
onCloudMerged(() => {
  refreshHouse();
  showSyncNotice('Progress from your other device was added to this game.');
});
// Every write re-reads the save first (updateSave), so two tabs never clobber each other; this tab just redraws.
watchKey(KEY, () => {
  refreshHouse();
  showSyncNotice('Your progress changed in another tab.');
});

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

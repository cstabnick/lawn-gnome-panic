import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, TEX } from '../config';
import { resetRun } from '../run';
import { playSfx } from '../audio';
import { loadBest } from './GameOverScene';

export class TitleScene extends Phaser.Scene {
  constructor() { super(SCENES.title); }

  create(): void {
    // Closure flag: the scene can be restarted, and this keeps the start from firing twice.
    let started = false;
    const start = (): void => {
      if (started) return;
      started = true;
      playSfx('click');
      resetRun(this);
      this.scene.start(SCENES.map);
    };

    // Background: lawn with lighter mowed stripes.
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.lawnDark).setOrigin(0, 0);
    for (let x = 80; x < GAME_WIDTH; x += 160) {
      this.add.rectangle(x, 0, 80, GAME_HEIGHT, COLORS.lawnLight, 0.5).setOrigin(0, 0);
    }

    this.add.text(GAME_WIDTH / 2, 170, 'FASTER THAN LAWN', {
      color: COLORS.accent,
      fontSize: '64px',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 240, 'Gnomes. Mowers. Mayhem.', {
      color: COLORS.text,
      fontSize: '24px',
    }).setOrigin(0.5);

    // Three player gnomes facing a single enemy gnome.
    for (const x of [340, 470, 600]) {
      this.add.image(x, 300, TEX.gnome).setScale(3);
    }
    this.add.image(930, 300, TEX.gnomeEnemy).setScale(3).setFlipX(true);

    const howTo = [
      'Cross the back yard to the Garden Gate and beat the Grand Zero-Turn.',
      'Route reactor power, aim your guns at enemy rooms, send gnomes to man, repair and put out fires.',
      'SPACE pauses the fight. Pausing is not cheating.',
    ];
    howTo.forEach((line, i) => {
      this.add.text(GAME_WIDTH / 2, 380 + i * 30, line, {
        color: COLORS.text,
        fontSize: '16px',
        align: 'center',
        wordWrap: { width: 900 },
      }).setOrigin(0.5, 0);
    });

    const best = loadBest();
    this.add.text(GAME_WIDTH / 2, 500, `Wins ${best.wins}   Best jumps ${best.bestJumps}`, {
      color: COLORS.accent,
      fontSize: '20px',
    }).setOrigin(0.5);

    const prompt = this.add.text(GAME_WIDTH / 2, 600, 'Click or press SPACE to mow', {
      color: COLORS.text,
      fontSize: '24px',
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    this.input.once('pointerdown', start);
    const kb = this.input.keyboard;
    const onSpace = (): void => start();
    kb?.once('keydown-SPACE', onSpace);
    this.events.once('shutdown', () => kb?.off('keydown-SPACE', onSpace));
  }
}

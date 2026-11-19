// Title screen: falling tiles in the background, a breathing title, tap to start.
import Phaser from 'phaser';
import { playSfx } from '../audio';
import { COLORS, FONT, SCENES, TEX } from '../config';
import { cloud } from '../cloud';
import { showCloudNote } from '../ui/cloudNote';

/** Tiles that fall behind the title: every tile kind plus the mower. */
const FALL_KEYS: string[] = [...Object.values(TEX.tile), TEX.mowerH];
const FALLER_COUNT = 18;

interface Faller {
  img: Phaser.GameObjects.Image;
  vy: number; // px per second
  spin: number; // radians per second
  mul: number; // size multiplier, 0.7 to 1.3
}

const rnd = (a: number, b: number): number => a + Math.random() * (b - a);
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export class TitleScene extends Phaser.Scene {
  private fallers: Faller[] = [];
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private tap!: Phaser.GameObjects.Text;
  private started = false;

  constructor() {
    super(SCENES.title);
  }

  create(): void {
    this.started = false;
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.fallers = [];
    for (let i = 0; i < FALLER_COUNT; i++) {
      const img = this.add
        .image(0, 0, FALL_KEYS[Math.floor(Math.random() * FALL_KEYS.length)])
        .setDepth(0)
        .setAlpha(0.35);
      const f: Faller = { img, vy: 0, spin: 0, mul: rnd(0.7, 1.3) };
      this.respawn(f, true);
      this.fallers.push(f);
    }

    this.title = this.add
      .text(0, 0, 'Gnome Sweet Gnome', {
        fontFamily: FONT,
        fontSize: '48px',
        fontStyle: 'bold',
        color: COLORS.accent,
        stroke: COLORS.textDark,
        strokeThickness: 10,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1);

    this.subtitle = this.add
      .text(0, 0, 'Match mushrooms. Make over a gnome home.', {
        fontFamily: FONT,
        fontSize: '20px',
        color: COLORS.text,
        stroke: COLORS.textDark,
        strokeThickness: 4,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1);

    this.tap = this.add
      .text(0, 0, 'Tap to play', {
        fontFamily: FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        color: COLORS.accent,
        stroke: COLORS.textDark,
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1);

    this.tweens.add({ targets: this.title, scale: 1.06, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.tap, alpha: 0.25, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.layout();

    const removeNote = showCloudNote(document.getElementById('ui') ?? document.body, cloud.status());

    const go = (): void => this.begin();
    const onResize = (): void => this.layout();
    this.input.on('pointerdown', go);
    this.input.keyboard?.on('keydown-SPACE', go);
    this.input.keyboard?.on('keydown-ENTER', go);
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => {
      removeNote();
      this.input.off('pointerdown', go);
      this.input.keyboard?.off('keydown-SPACE', go);
      this.input.keyboard?.off('keydown-ENTER', go);
      this.scale.off('resize', onResize);
    });
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    const h = this.scale.height;
    const size = this.tileSize();
    for (const f of this.fallers) {
      f.img.y += f.vy * dt;
      f.img.rotation += f.spin * dt;
      if (f.img.y - size > h) this.respawn(f, false);
    }
  }

  private begin(): void {
    if (this.started) return;
    this.started = true;
    playSfx('click');
    this.scene.start(SCENES.house);
  }

  /** Background tile size in px, scaled to the shorter screen side. */
  private tileSize(): number {
    return clamp(Math.min(this.scale.width, this.scale.height) * 0.11, 34, 90);
  }

  /** Place a faller above the top edge, or anywhere on screen when `anywhere` is set. */
  private respawn(f: Faller, anywhere: boolean): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const size = this.tileSize();
    f.img.setPosition(rnd(0, w), anywhere ? rnd(0, h) : -size * rnd(0.5, 1.5));
    f.img.setScale((size / f.img.width) * f.mul);
    f.vy = rnd(40, 90) * f.mul;
    f.spin = rnd(-1.5, 1.5);
  }

  /** Lay out the text from the current screen size and rescale the background tiles. */
  private layout(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const m = Math.min(w, h);
    const cx = w / 2;

    this.title.setFontSize(Math.round(clamp(m * 0.13, 28, 120)));
    this.title.setWordWrapWidth(w * 0.9, true);
    this.title.setPosition(cx, h * 0.36);

    this.subtitle.setFontSize(Math.round(clamp(m * 0.045, 14, 28)));
    this.subtitle.setWordWrapWidth(w * 0.85, true);
    const subY = this.title.y + this.title.displayHeight / 2 + this.subtitle.displayHeight / 2 + m * 0.03;
    this.subtitle.setPosition(cx, subY);

    this.tap.setFontSize(Math.round(clamp(m * 0.055, 16, 34)));
    this.tap.setPosition(cx, h * 0.8);

    const size = this.tileSize();
    for (const f of this.fallers) f.img.setScale((size / f.img.width) * f.mul);
  }
}

// The kitchen: the backdrop, Gnoma, the five steps in order, the top bar (what to do now), the bottom counter's
// buttons, the result screen and the achievements.
import Phaser from 'phaser';
import { createAchievementTracker } from '@lawn/achievements';
import { CONFETTI, COLORS, N, TOTAL_STARS } from '../config';
import { CAKE_VERDICT, INTRO, PRAISE } from '../dialogue';
import { burst } from '../fx';
import { drawKitchen } from '../background';
import { computeLayout, readInsets, type Layout } from '../layout';
import { Gnoma } from '../gnoma';
import { sfx, unlockAudio } from '../sfx';
import { makeSteps, type Step, type StepCtx } from '../steps';
import { Button, FONT, iconAt, textAt } from '../ui';

type Tracker = ReturnType<typeof createAchievementTracker>;

export class KitchenScene extends Phaser.Scene {
  private steps: Step[] = [];
  private index = 0;
  private stars: number[] = [];
  private finished = false;
  private lay!: Layout;
  private back!: Phaser.GameObjects.Graphics;
  private gnoma!: Gnoma;
  private stage!: Phaser.GameObjects.Container;
  private bar!: Phaser.GameObjects.Container;
  private stepTitle!: Phaser.GameObjects.Text;
  private stepHint!: Phaser.GameObjects.Text;
  private totalText!: Phaser.GameObjects.Text;
  private btnReset!: Button;
  private btnAction!: Button;
  private btnNext!: Button;
  private barKey = '';
  private tracker?: Tracker;
  /** ?ovenSpeed=3 runs the oven three times faster (demos and tests). Stirring is not affected. */
  private readonly ovenSpeed = Math.max(0.1, Number(new URLSearchParams(location.search).get('ovenSpeed')) || 1);

  constructor() {
    super('Kitchen');
  }

  create(): void {
    this.tracker = createAchievementTracker({ ui: document.getElementById('ui') ?? undefined });
    this.gnoma = new Gnoma(this);
    this.reset();
    this.relayout();
    this.gnoma.say(`${INTRO} ${this.steps[0].intro}`);
    this.scale.on('resize', () => this.relayout());
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      unlockAudio();
      this.current()?.press?.(p.x, p.y);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown) this.current()?.drag?.(p.x, p.y);
    });
    this.input.on('pointerup', () => this.current()?.release?.());
  }

  update(_time: number, delta: number): void {
    this.gnoma.update(delta / 1000);
    if (this.finished) return;
    this.current()?.tick?.(delta / 1000);
    this.refreshBar();
  }

  /** The step on screen, or undefined on the result screen. */
  private current(): Step | undefined {
    return this.finished ? undefined : this.steps[this.index];
  }

  private reset(): void {
    this.steps = makeSteps();
    this.index = 0;
    this.stars = [];
    this.finished = false;
  }

  private restart(): void {
    this.reset();
    this.buildAll();
    this.gnoma.say(`${INTRO} ${this.steps[0].intro}`);
  }

  private relayout(): void {
    this.lay = computeLayout(this.scale.width, this.scale.height, readInsets());
    this.buildAll();
  }

  /** Builds (or rebuilds, after a resize) everything on screen from the current state. */
  private buildAll(): void {
    this.back?.destroy();
    this.stage?.destroy();
    this.bar?.destroy();
    this.back = this.add.graphics().setDepth(-10);
    drawKitchen(this.back, this.lay);
    this.gnoma.setLayout(this.lay.gnoma, this.lay.wide, this.lay.fs);
    this.stage = this.add.container(0, 0);
    this.bar = this.add.container(0, 0);
    this.buildBar();
    this.buildStage();
    this.barKey = '';
    this.refreshBar();
  }

  private buildBar(): void {
    const { W, H, ins, top, bottom, fs } = this.lay;
    const left = ins.left + 18;
    const right = W - ins.right - 18;
    const row1 = ins.top + top * 0.3;
    const row2 = ins.top + top * 0.72;
    this.stepTitle = this.add
      .text(left, row1, '', { fontFamily: FONT, fontSize: `${fs}px`, fontStyle: 'bold', color: COLORS.ink })
      .setOrigin(0, 0.5);
    this.totalText = this.add
      .text(right, row1, '', { fontFamily: FONT, fontSize: `${fs}px`, fontStyle: 'bold', color: COLORS.green })
      .setOrigin(1, 0.5);
    this.stepHint = this.add
      .text(left, row2, '', {
        fontFamily: FONT,
        fontSize: `${Math.round(fs * 0.85)}px`,
        color: COLORS.muted,
        wordWrap: { width: right - left },
      })
      .setOrigin(0, 0.5);
    this.bar.add([this.stepTitle, this.totalText, this.stepHint]);

    const cy = H - ins.bottom - bottom / 2;
    const size = Math.round(fs * 0.95);
    this.btnReset = new Button(this, this.bar, W * 0.2, cy, 'Start over', size, () => this.restart());
    this.btnAction = new Button(this, this.bar, W * 0.5, cy, '', size, () => this.runAction());
    this.btnNext = new Button(this, this.bar, W * 0.82, cy, 'Next ▶', size, () => this.next());
  }

  private buildStage(): void {
    const ctx: StepCtx = {
      scene: this,
      layer: this.stage,
      b: this.lay.play,
      fs: this.lay.fs,
      ovenSpeed: this.ovenSpeed,
      say: (line) => this.gnoma.say(line),
    };
    const step = this.current();
    if (step) step.build(ctx);
    else this.buildResult(ctx);
  }

  private buildResult(ctx: StepCtx): void {
    const { b, fs } = ctx;
    const total = this.totalStars();
    const cx = b.x + b.w / 2;
    iconAt(this, this.stage, b, 'cake', 0.5, 0.5, 0.62);
    textAt(this, this.stage, cx, b.y + b.h * 0.1, 'Acorn cake with grass frosting', fs * 1.2, { bold: true, width: b.w });
    textAt(this, this.stage, cx, b.y + b.h * 0.92, `★ ${total} / ${TOTAL_STARS}`, fs * 1.4, {
      color: COLORS.green,
      bold: true,
      width: b.w,
    });
  }

  private totalStars(): number {
    return this.stars.reduce((sum, s) => sum + s, 0);
  }

  /** Sets the top bar and buttons from the current state. Cheap: it only touches Phaser when something changed. */
  private refreshBar(): void {
    const step = this.current();
    let title = 'Done!';
    let hint = 'Bake another, or see if you can get all 15 stars!';
    let action: { label: string; enabled: boolean } | null = { label: 'Bake another', enabled: true };
    let nextOn = false;
    let nextLabel = 'Next ▶';
    if (step) {
      title = `${this.index + 1}/${this.steps.length}  ${step.title}`;
      hint = step.hint;
      const a = step.action?.() ?? null;
      action = a ? { label: a.label, enabled: a.enabled } : null;
      nextOn = step.done();
      if (this.index === this.steps.length - 1) nextLabel = 'Finish ▶';
    }
    const total = this.totalStars();
    const key = [title, hint, action?.label ?? '', action?.enabled ?? '', nextOn, nextLabel, total, this.finished].join('|');
    if (key === this.barKey) return;
    this.barKey = key;

    this.stepTitle.setText(title);
    this.stepHint.setText(hint);
    this.totalText.setText(`★ ${total} / ${TOTAL_STARS}`);
    this.btnReset.set(this.finished ? null : 'Start over', true);
    this.btnAction.set(action?.label ?? null, action?.enabled ?? false);
    this.btnNext.set(this.finished ? null : nextLabel, nextOn);
  }

  /** The action button: light the oven, take it out, or bake another. */
  private runAction(): void {
    if (this.finished) {
      this.restart();
      return;
    }
    const a = this.current()?.action?.() ?? null;
    if (a && a.enabled) a.run();
    this.refreshBar();
  }

  private next(): void {
    const step = this.current();
    if (!step || !step.done()) return;
    const stars = step.stars();
    this.stars.push(stars);
    sfx('pop');
    this.index++;
    if (this.index >= this.steps.length) {
      this.finish();
      return;
    }
    this.gnoma.say(`${PRAISE[stars - 1]} ${this.steps[this.index].intro}`);
    this.buildAll();
  }

  private finish(): void {
    this.finished = true;
    const total = this.totalStars();
    const verdict = total === TOTAL_STARS ? CAKE_VERDICT.perfect : total >= 9 ? CAKE_VERDICT.good : CAKE_VERDICT.low;
    this.gnoma.say(verdict);
    this.gnoma.cheer();
    sfx('cheer');
    this.confetti();
    this.buildAll();
    const t = this.tracker;
    if (!t) return;
    void t.unlock('kitchen-first-cake');
    void t.increment('kitchen-cakes');
    if (this.stars[3] === 3) void t.unlock('kitchen-golden');
    if (total === TOTAL_STARS) void t.unlock('kitchen-perfect');
  }

  /** A few rounds of confetti over the play plate. */
  private confetti(): void {
    const p = this.lay.play;
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 170, () => {
        burst(this, p.x + Math.random() * p.w, p.y + Math.random() * p.h * 0.6, 14, CONFETTI, p.u * 0.35);
        sfx('tap');
      });
    }
  }
}

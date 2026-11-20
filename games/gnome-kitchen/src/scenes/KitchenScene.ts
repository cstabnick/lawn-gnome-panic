// The kitchen: runs the five steps in order, the top bar (what to do now), the bottom bar (buttons), the result
// screen and the achievements.
import Phaser from 'phaser';
import { createAchievementTracker } from '@lawn/achievements';
import { COLORS, TOTAL_STARS } from '../config';
import { computeLayout, readInsets, type Layout } from '../layout';
import { makeSteps, type Step, type StepCtx } from '../steps';
import { Button, FONT, iconAt, textAt } from '../ui';

type Tracker = ReturnType<typeof createAchievementTracker>;

export class KitchenScene extends Phaser.Scene {
  private steps: Step[] = [];
  private index = 0;
  private stars: number[] = [];
  private finished = false;
  private lay!: Layout;
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
    this.tracker = createAchievementTracker({
      ui: document.getElementById('ui') ?? undefined,
    });
    this.reset();
    this.relayout();
    this.scale.on('resize', () => this.relayout());
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.current()?.press?.(p.x, p.y));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown) this.current()?.drag?.(p.x, p.y);
    });
    this.input.on('pointerup', () => this.current()?.release?.());
  }

  update(_time: number, delta: number): void {
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
  }

  private relayout(): void {
    this.lay = computeLayout(this.scale.width, this.scale.height, readInsets());
    this.buildAll();
  }

  /** Builds (or rebuilds, after a resize) everything on screen from the current state. */
  private buildAll(): void {
    this.stage?.destroy();
    this.bar?.destroy();
    this.stage = this.add.container(0, 0);
    this.bar = this.add.container(0, 0);
    this.buildBar();
    this.buildStage();
    this.barKey = '';
    this.refreshBar();
  }

  private buildBar(): void {
    const { W, H, ins, top, bottom, fs } = this.lay;
    const left = ins.left + 12;
    const right = W - ins.right - 12;
    const row1 = ins.top + top * 0.3;
    const row2 = ins.top + top * 0.7;
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
    const size = Math.round(fs * 0.9);
    this.btnReset = new Button(this, this.bar, W * 0.2, cy, 'Start over', size, () => this.restart());
    this.btnAction = new Button(this, this.bar, W * 0.5, cy, '', size, () => this.runAction());
    this.btnNext = new Button(this, this.bar, W * 0.82, cy, 'Next ▶', size, () => this.next());
  }

  private buildStage(): void {
    const ctx: StepCtx = { scene: this, layer: this.stage, b: this.lay.board, fs: this.lay.fs, ovenSpeed: this.ovenSpeed };
    const step = this.current();
    if (step) step.build(ctx);
    else this.buildResult(ctx);
  }

  private buildResult(ctx: StepCtx): void {
    const { b, fs } = ctx;
    const total = this.totalStars();
    const verdict =
      total === TOTAL_STARS ? 'Gnome-tastic!' : total >= 9 ? 'Tasty enough.' : 'Crunchy. Eat it anyway.';
    const cx = b.x + b.w / 2;
    iconAt(this, this.stage, b, 'cake', 0.5, 0.5, 0.62);
    textAt(this, this.stage, cx, b.y + b.h * 0.08, 'Acorn cake with grass frosting', fs * 1.1, { bold: true, width: b.w });
    textAt(this, this.stage, cx, b.y + b.h * 0.92, `★ ${total} / ${TOTAL_STARS}   ${verdict}`, fs, {
      color: COLORS.green,
      bold: true,
      width: b.w,
    });
  }

  private totalStars(): number {
    return this.stars.reduce((sum, s) => sum + s, 0);
  }

  /** Sets the top and bottom bars from the current state. Cheap: it only touches Phaser when something changed. */
  private refreshBar(): void {
    const step = this.current();
    let title = 'Done!';
    let hint = 'Bake another, or see if you can get all 15 stars.';
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
    const key = [title, hint, action?.label ?? '', action?.enabled ?? '', nextOn, nextLabel, total].join('|');
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
    this.stars.push(step.stars());
    this.index++;
    if (this.index >= this.steps.length) this.finish();
    this.buildAll();
  }

  private finish(): void {
    this.finished = true;
    const t = this.tracker;
    if (!t) return;
    void t.unlock('kitchen-first-cake');
    void t.increment('kitchen-cakes');
    if (this.stars[3] === 3) void t.unlock('kitchen-golden');
    if (this.totalStars() === TOTAL_STARS) void t.unlock('kitchen-perfect');
  }
}

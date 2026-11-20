// The five steps of an acorn cake with grass frosting. Each step builds its own pictures in the board, takes its own
// taps and drags, and says when it is done and how many stars (0-3) it earned.
import Phaser from 'phaser';
import { TUNING } from './config';
import type { Board } from './layout';
import { at, iconAt, inSquare, textAt } from './ui';

const TAU = Math.PI * 2;

export interface StepCtx {
  scene: Phaser.Scene;
  layer: Phaser.GameObjects.Container;
  b: Board;
  /** Main font size in px. */
  fs: number;
  /** Oven speed-up from ?ovenSpeed=, for demos and tests. 1 is the real oven. */
  ovenSpeed: number;
}

/** A button in the bottom bar that belongs to the current step (light the oven, take it out). */
export interface StepAction {
  label: string;
  enabled: boolean;
  run: () => void;
}

export interface Step {
  readonly title: string;
  readonly hint: string;
  /** Builds this step's pictures into ctx.layer. Called again after a resize, so state lives in the step. */
  build(ctx: StepCtx): void;
  press?(x: number, y: number): void;
  drag?(x: number, y: number): void;
  release?(): void;
  tick?(dt: number): void;
  action?(): StepAction | null;
  done(): boolean;
  stars(): number;
}

export function makeSteps(): Step[] {
  return [new FlourStep(), new StirStep(), new PourStep(), new BakeStep(), new FrostStep()];
}

export const STEP_COUNT = 5;

function graphicsIn(ctx: StepCtx): Phaser.GameObjects.Graphics {
  const g = ctx.scene.add.graphics();
  ctx.layer.add(g);
  return g;
}

/** A little blob of batter or flour that flies from one point to another, then vanishes. */
function pourDot(scene: Phaser.Scene, from: { x: number; y: number }, to: { x: number; y: number }, r: number, color: number): void {
  const dot = scene.add.circle(from.x, from.y, r, color);
  scene.tweens.add({
    targets: dot,
    x: to.x,
    y: to.y,
    alpha: 0,
    duration: 380,
    ease: 'Quad.easeIn',
    onComplete: () => dot.destroy(),
  });
}

// ---- 1. Flour: tap the sack a set number of times ----------------------------------------------------------------

class FlourStep implements Step {
  readonly title = 'Add the acorn flour';
  readonly hint = `Tap the flour sack ${TUNING.scoops} times. Just ${TUNING.scoops}.`;
  private scoops = 0;
  private c!: StepCtx;
  private g!: Phaser.GameObjects.Graphics;
  private count!: Phaser.GameObjects.Text;

  build(ctx: StepCtx): void {
    this.c = ctx;
    iconAt(ctx.scene, ctx.layer, ctx.b, 'bowl', 0.5, 0.56, 0.55);
    iconAt(ctx.scene, ctx.layer, ctx.b, 'flour', 0.82, 0.8, 0.3);
    this.g = graphicsIn(ctx);
    this.count = textAt(ctx.scene, ctx.layer, ctx.b.x + ctx.b.w / 2, ctx.b.y + ctx.b.h * 0.08, '', ctx.fs);
    this.draw();
  }

  press(x: number, y: number): void {
    const { b } = this.c;
    if (!inSquare(b, 0.82, 0.8, 0.3, x, y)) return;
    this.scoops++;
    pourDot(this.c.scene, at(b, 0.82, 0.8), at(b, 0.5, 0.56), b.u * 0.02, 0xd2b98a);
    this.draw();
  }

  private draw(): void {
    const { b } = this.c;
    const centre = at(b, 0.5, 0.56);
    this.g.clear();
    this.g.fillStyle(0xd2b98a, 1);
    for (let i = 0; i < Math.min(this.scoops, 9); i++) {
      const a = i * 2.4;
      const r = b.u * (0.03 + 0.03 * (i % 3));
      this.g.fillCircle(centre.x + Math.cos(a) * r, centre.y + Math.sin(a) * r * 0.5, b.u * 0.025);
    }
    this.count.setText(`Scoops: ${this.scoops} / ${TUNING.scoops}`);
  }

  done(): boolean {
    return this.scoops >= TUNING.scoops;
  }

  stars(): number {
    if (this.scoops === TUNING.scoops) return 3;
    return this.scoops === TUNING.scoops + 1 ? 2 : 1;
  }
}

// ---- 2. Stir: circle a finger round the bowl ---------------------------------------------------------------------

class StirStep implements Step {
  readonly title = 'Stir the batter';
  readonly hint = `Press on the bowl and circle your finger round it: ${TUNING.stirTurns} full turns.`;
  private turns = 0;
  private last: number | null = null;
  private stirring = false;
  private clock = 0;
  private startedAt: number | null = null;
  private endedAt: number | null = null;
  private c!: StepCtx;
  private g!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;

  build(ctx: StepCtx): void {
    this.c = ctx;
    iconAt(ctx.scene, ctx.layer, ctx.b, 'bowl', 0.5, 0.5, 0.5);
    this.g = graphicsIn(ctx);
    this.label = textAt(ctx.scene, ctx.layer, ctx.b.x + ctx.b.w / 2, ctx.b.y + ctx.b.h * 0.08, '', ctx.fs);
    this.draw();
  }

  private centre(): { x: number; y: number } {
    return at(this.c.b, 0.5, 0.5);
  }

  press(x: number, y: number): void {
    const c = this.centre();
    if (Math.hypot(x - c.x, y - c.y) > this.c.b.u * 0.42) return;
    this.stirring = true;
    this.last = Math.atan2(y - c.y, x - c.x);
    if (this.startedAt === null) this.startedAt = this.clock;
  }

  drag(x: number, y: number): void {
    if (!this.stirring || this.endedAt !== null) return;
    const c = this.centre();
    const a = Math.atan2(y - c.y, x - c.x);
    if (this.last !== null) {
      let d = a - this.last;
      if (d > Math.PI) d -= TAU;
      else if (d < -Math.PI) d += TAU;
      this.turns += Math.abs(d);
    }
    this.last = a;
    if (this.turns >= TAU * TUNING.stirTurns) this.endedAt = this.clock;
    this.draw();
  }

  release(): void {
    this.stirring = false;
    this.last = null;
  }

  tick(dt: number): void {
    this.clock += dt;
  }

  private draw(): void {
    const { b } = this.c;
    const c = this.centre();
    const r = b.u * 0.36;
    const p = Math.min(1, this.turns / (TAU * TUNING.stirTurns));
    const w = Math.max(6, b.u * 0.035);
    this.g.clear();
    this.g.lineStyle(w, 0xd9ccb0, 1);
    this.g.beginPath();
    this.g.arc(c.x, c.y, r, 0, TAU, false);
    this.g.strokePath();
    if (p > 0) {
      this.g.lineStyle(w, 0x5ca844, 1);
      this.g.beginPath();
      this.g.arc(c.x, c.y, r, -Math.PI / 2, -Math.PI / 2 + p * TAU, false);
      this.g.strokePath();
    }
    this.label.setText(`Turns: ${(this.turns / TAU).toFixed(1)} / ${TUNING.stirTurns}`);
  }

  done(): boolean {
    return this.endedAt !== null;
  }

  stars(): number {
    const secs = (this.endedAt ?? this.clock) - (this.startedAt ?? this.clock);
    if (secs <= TUNING.stirFastSeconds) return 3;
    return secs <= TUNING.stirOkSeconds ? 2 : 1;
  }
}

// ---- 3. Pour: tap the bowl, then tap the tin ---------------------------------------------------------------------

class PourStep implements Step {
  readonly title = 'Pour into the tin';
  readonly hint = 'Tap the bowl to pick it up, then tap the cake tin to pour.';
  private picked = false;
  private poured = false;
  private c!: StepCtx;
  private g!: Phaser.GameObjects.Graphics;

  build(ctx: StepCtx): void {
    this.c = ctx;
    iconAt(ctx.scene, ctx.layer, ctx.b, 'bowl', 0.3, 0.5, 0.42);
    iconAt(ctx.scene, ctx.layer, ctx.b, 'pan', 0.74, 0.5, 0.62);
    this.g = graphicsIn(ctx);
    this.draw();
  }

  press(x: number, y: number): void {
    const { b } = this.c;
    if (this.poured) return;
    if (inSquare(b, 0.3, 0.5, 0.42, x, y)) {
      this.picked = !this.picked;
      this.draw();
      return;
    }
    if (this.picked && inSquare(b, 0.74, 0.5, 0.5, x, y)) {
      this.poured = true;
      this.picked = false;
      pourDot(this.c.scene, at(b, 0.3, 0.5), at(b, 0.74, 0.42), b.u * 0.03, 0xf3e3b5);
      this.draw();
    }
  }

  private draw(): void {
    const { b } = this.c;
    this.g.clear();
    if (this.picked) {
      const bowl = at(b, 0.3, 0.5);
      this.g.lineStyle(Math.max(4, b.u * 0.02), 0xf1a81e, 1);
      this.g.strokeCircle(bowl.x, bowl.y, b.u * 0.3);
    }
    if (this.poured) {
      const pan = at(b, 0.74, 0.5);
      this.g.fillStyle(0xf3e3b5, 1);
      this.g.fillEllipse(pan.x, pan.y + b.u * 0.02, b.u * 0.26, b.u * 0.1);
    }
  }

  done(): boolean {
    return this.poured;
  }

  stars(): number {
    return 3;
  }
}

// ---- 4. Bake: light the oven, take it out while the bar is golden ------------------------------------------------

class BakeStep implements Step {
  readonly title = 'Bake it';
  readonly hint = `Light the oven, then take the tin out while the bar is golden (${TUNING.goldenFrom} to ${TUNING.goldenTo} s).`;
  private lit = false;
  private elapsed = 0;
  private outAt: number | null = null;
  private c!: StepCtx;
  private g!: Phaser.GameObjects.Graphics;
  private pan!: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private cake!: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private time!: Phaser.GameObjects.Text;

  build(ctx: StepCtx): void {
    this.c = ctx;
    iconAt(ctx.scene, ctx.layer, ctx.b, 'oven', 0.5, 0.4, 0.62);
    this.pan = iconAt(ctx.scene, ctx.layer, ctx.b, 'pan', 0.5, 0.52, 0.34);
    this.cake = iconAt(ctx.scene, ctx.layer, ctx.b, 'cake', 0.5, 0.52, 0.34);
    this.g = graphicsIn(ctx);
    this.time = textAt(ctx.scene, ctx.layer, ctx.b.x + ctx.b.w / 2, ctx.b.y + ctx.b.h * 0.08, '', ctx.fs);
    this.draw();
  }

  tick(dt: number): void {
    if (!this.lit || this.outAt !== null) return;
    this.elapsed += dt * this.c.ovenSpeed;
    if (this.elapsed >= TUNING.bakeFullSeconds) this.outAt = TUNING.bakeFullSeconds;
    this.draw();
  }

  action(): StepAction | null {
    if (!this.lit) {
      return {
        label: 'Light the oven',
        enabled: true,
        run: () => {
          this.lit = true;
          this.elapsed = 0;
          this.draw();
        },
      };
    }
    if (this.outAt === null) {
      return {
        label: 'Take it out!',
        enabled: true,
        run: () => {
          this.outAt = this.elapsed;
          this.draw();
        },
      };
    }
    return null;
  }

  private draw(): void {
    const { b } = this.c;
    const full = TUNING.bakeFullSeconds;
    const x0 = b.x + b.w * 0.14;
    const x1 = b.x + b.w * 0.86;
    const y = b.y + b.h * 0.86;
    const hh = Math.max(10, b.u * 0.05);
    const px = (t: number): number => x0 + (x1 - x0) * Math.min(1, t / full);
    const t = this.outAt ?? this.elapsed;
    this.g.clear();
    this.g.fillStyle(0xe6dcc6, 1);
    this.g.fillRect(x0, y, x1 - x0, hh);
    this.g.fillStyle(t >= TUNING.burntAfter ? 0x3b2a1a : 0xb5773c, 1);
    this.g.fillRect(x0, y, px(t) - x0, hh);
    this.g.fillStyle(0xf1c40f, 0.6);
    this.g.fillRect(px(TUNING.goldenFrom), y, px(TUNING.goldenTo) - px(TUNING.goldenFrom), hh);
    const out = this.outAt !== null;
    this.pan.setVisible(!out);
    this.cake.setVisible(out);
    this.time.setText(this.lit ? `${t.toFixed(1)} s` : '');
  }

  done(): boolean {
    return this.outAt !== null;
  }

  stars(): number {
    const t = this.outAt ?? this.elapsed;
    if (t >= TUNING.burntAfter) return 1;
    if (t >= TUNING.goldenTo) return 2;
    if (t >= TUNING.goldenFrom) return 3;
    return t >= TUNING.rawBefore ? 2 : 1;
  }
}

// ---- 5. Frost: paint grass over the top of the cake ----------------------------------------------------------------

class FrostStep implements Step {
  readonly title = 'Frost with grass';
  readonly hint = 'Paint the grass frosting over the top: tap, or drag across the cake.';
  private readonly cells = TUNING.frostCols * TUNING.frostRows;
  private readonly painted: boolean[] = new Array<boolean>(TUNING.frostCols * TUNING.frostRows).fill(false);
  private c!: StepCtx;
  private g!: Phaser.GameObjects.Graphics;
  private pct!: Phaser.GameObjects.Text;

  build(ctx: StepCtx): void {
    this.c = ctx;
    iconAt(ctx.scene, ctx.layer, ctx.b, 'cake', 0.5, 0.45, 0.8);
    iconAt(ctx.scene, ctx.layer, ctx.b, 'frosting', 0.84, 0.82, 0.2);
    this.g = graphicsIn(ctx);
    this.pct = textAt(ctx.scene, ctx.layer, ctx.b.x + ctx.b.w / 2, ctx.b.y + ctx.b.h * 0.08, '', ctx.fs);
    this.draw();
  }

  /** The frosting grid over the cake top: origin and cell size in px. */
  private grid(): { ox: number; oy: number; cw: number; ch: number } {
    const { b } = this.c;
    return {
      ox: b.x + b.w * 0.5 - b.u * 0.28,
      oy: b.y + b.h * 0.42 - b.u * 0.2,
      cw: (b.u * 0.56) / TUNING.frostCols,
      ch: (b.u * 0.4) / TUNING.frostRows,
    };
  }

  press(x: number, y: number): void {
    this.paint(x, y);
  }

  drag(x: number, y: number): void {
    this.paint(x, y);
  }

  private paint(x: number, y: number): void {
    const { ox, oy, cw, ch } = this.grid();
    let changed = false;
    for (let row = 0; row < TUNING.frostRows; row++) {
      for (let col = 0; col < TUNING.frostCols; col++) {
        const cx = ox + (col + 0.5) * cw;
        const cy = oy + (row + 0.5) * ch;
        if (Math.abs(x - cx) > cw * 0.9 || Math.abs(y - cy) > ch * 0.9) continue;
        const i = row * TUNING.frostCols + col;
        if (!this.painted[i]) {
          this.painted[i] = true;
          changed = true;
        }
      }
    }
    if (changed) this.draw();
  }

  private coverage(): number {
    return this.painted.filter(Boolean).length / this.cells;
  }

  private draw(): void {
    const { ox, oy, cw, ch } = this.grid();
    this.g.clear();
    for (let row = 0; row < TUNING.frostRows; row++) {
      for (let col = 0; col < TUNING.frostCols; col++) {
        const x = ox + col * cw;
        const y = oy + row * ch;
        if (this.painted[row * TUNING.frostCols + col]) {
          this.g.fillStyle(0x7cc44f, 0.95);
          this.g.fillRect(x + 1, y + 1, cw - 2, ch - 2);
        } else {
          this.g.lineStyle(1, 0x3b2a1a, 0.2);
          this.g.strokeRect(x + 1, y + 1, cw - 2, ch - 2);
        }
      }
    }
    this.pct.setText(`Covered ${Math.round(this.coverage() * 100)}%`);
  }

  done(): boolean {
    return this.coverage() >= TUNING.frostNeeded;
  }

  stars(): number {
    const cov = this.coverage();
    if (cov >= 1) return 3;
    return cov >= TUNING.frostGood ? 2 : 1;
  }
}

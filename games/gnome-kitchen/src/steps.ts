// The five steps of an acorn cake with grass frosting. Each step builds its pictures on the play plate, takes its
// taps and drags, and says when it is done and how many stars (0-3) it earned.
import Phaser from 'phaser';
import { BAKE_LINES } from './dialogue';
import { CONFETTI, COLORS, N, TUNING } from './config';
import { burst, popText, squash } from './fx';
import { sfx } from './sfx';
import type { Board } from './layout';
import { at, iconAt, inSquare, textAt } from './ui';

const TAU = Math.PI * 2;

export interface StepCtx {
  scene: Phaser.Scene;
  layer: Phaser.GameObjects.Container;
  /** The play plate. */
  b: Board;
  /** Main font size in px. */
  fs: number;
  /** Oven speed-up from ?ovenSpeed=, for demos and tests. 1 is the real oven. */
  ovenSpeed: number;
  /** Gnoma says a line. */
  say(line: string): void;
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
  /** What Gnoma says when the step starts. */
  readonly intro: string;
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

function graphicsIn(ctx: StepCtx): Phaser.GameObjects.Graphics {
  const g = ctx.scene.add.graphics();
  ctx.layer.add(g);
  return g;
}

/** A blob of batter or flour that flies from one point to another, then vanishes. */
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
  readonly hint = `Tap the flour sack ${TUNING.scoops} times. Just ${TUNING.scoops}!`;
  readonly intro = `First, ${TUNING.scoops} scoops of acorn flour. One, two, three!`;
  private scoops = 0;
  private c!: StepCtx;
  private g!: Phaser.GameObjects.Graphics;
  private sack!: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private bowl!: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private count!: Phaser.GameObjects.Text;

  build(ctx: StepCtx): void {
    this.c = ctx;
    this.bowl = iconAt(ctx.scene, ctx.layer, ctx.b, 'bowl', 0.5, 0.56, 0.55);
    this.sack = iconAt(ctx.scene, ctx.layer, ctx.b, 'flour', 0.82, 0.8, 0.32);
    this.g = graphicsIn(ctx);
    this.count = textAt(ctx.scene, ctx.layer, ctx.b.x + ctx.b.w / 2, ctx.b.y + ctx.b.h * 0.08, '', ctx.fs * 1.2);
    this.draw();
  }

  press(x: number, y: number): void {
    const { b, scene } = this.c;
    if (!inSquare(b, 0.82, 0.8, 0.32, x, y)) return;
    this.scoops++;
    squash(scene, this.sack);
    sfx('pop');
    const bowl = at(b, 0.5, 0.56);
    pourDot(scene, at(b, 0.82, 0.8), bowl, b.u * 0.025, 0xfff5d6);
    burst(scene, bowl.x, bowl.y, 6, ['#fff5d6', '#f3e3b5'], b.u * 0.25);
    if (this.scoops === TUNING.scoops) popText(scene, bowl.x, bowl.y - b.u * 0.35, 'Perfect!', COLORS.ink, this.c.fs * 1.1);
    this.draw();
  }

  private draw(): void {
    const { b } = this.c;
    const centre = at(b, 0.5, 0.56);
    this.g.clear();
    for (let i = 0; i < Math.min(this.scoops, 9); i++) {
      const a = i * 2.4;
      const r = b.u * (0.03 + 0.03 * (i % 3));
      this.g.fillStyle(0xfff5d6, 1);
      this.g.fillCircle(centre.x + Math.cos(a) * r, centre.y + Math.sin(a) * r * 0.5, b.u * 0.028);
    }
    this.count.setText(`${this.scoops} / ${TUNING.scoops} scoops`);
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
  readonly intro = 'Now stir it round and round, nice and slow!';
  private turns = 0;
  private last: number | null = null;
  private stirring = false;
  private clock = 0;
  private sparkleAt = 0;
  private halfTurns = 0;
  private startedAt: number | null = null;
  private endedAt: number | null = null;
  private c!: StepCtx;
  private g!: Phaser.GameObjects.Graphics;
  private bowl!: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private label!: Phaser.GameObjects.Text;

  build(ctx: StepCtx): void {
    this.c = ctx;
    this.bowl = iconAt(ctx.scene, ctx.layer, ctx.b, 'bowl', 0.5, 0.5, 0.5);
    this.g = graphicsIn(ctx);
    this.label = textAt(ctx.scene, ctx.layer, ctx.b.x + ctx.b.w / 2, ctx.b.y + ctx.b.h * 0.08, '', ctx.fs * 1.2);
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
      const before = Math.floor(this.turns / Math.PI);
      this.turns += Math.abs(d);
      if (Math.floor(this.turns / Math.PI) > before) {
        this.halfTurns++;
        sfx('swish');
      }
      if (this.clock - this.sparkleAt > 0.06) {
        this.sparkleAt = this.clock;
        burst(this.c.scene, x, y, 3, [COLORS.yellow, COLORS.sky, COLORS.pink], 34);
      }
    }
    this.last = a;
    if (this.turns >= TAU * TUNING.stirTurns) {
      this.endedAt = this.clock;
      sfx('ding');
      burst(this.c.scene, c.x, c.y, 16);
    }
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
    const w = Math.max(8, b.u * 0.045);
    this.bowl.setRotation(Math.sin(this.halfTurns * 0.9) * (this.stirring ? 0.08 : 0));
    this.g.clear();
    this.g.lineStyle(w, N(COLORS.plate), 1);
    this.g.beginPath();
    this.g.arc(c.x, c.y, r, 0, TAU, false);
    this.g.strokePath();
    this.g.lineStyle(w * 0.4, N(COLORS.wood), 0.5);
    this.g.beginPath();
    this.g.arc(c.x, c.y, r, 0, TAU, false);
    this.g.strokePath();
    if (p > 0) {
      this.g.lineStyle(w, N(COLORS.green), 1);
      this.g.beginPath();
      this.g.arc(c.x, c.y, r, -Math.PI / 2, -Math.PI / 2 + p * TAU, false);
      this.g.strokePath();
    }
    this.label.setText(`${(this.turns / TAU).toFixed(1)} / ${TUNING.stirTurns} turns`);
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
  readonly intro = 'Pick up the bowl, then pour it in the tin. Gently!';
  private picked = false;
  private poured = false;
  private c!: StepCtx;
  private g!: Phaser.GameObjects.Graphics;
  private bowl!: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private pan!: Phaser.GameObjects.Image | Phaser.GameObjects.Text;

  build(ctx: StepCtx): void {
    this.c = ctx;
    this.bowl = iconAt(ctx.scene, ctx.layer, ctx.b, 'bowl', 0.3, 0.5, 0.42);
    this.pan = iconAt(ctx.scene, ctx.layer, ctx.b, 'pan', 0.74, 0.5, 0.62);
    this.g = graphicsIn(ctx);
    this.draw();
  }

  press(x: number, y: number): void {
    const { b, scene } = this.c;
    if (this.poured) return;
    if (inSquare(b, 0.3, 0.5, 0.42, x, y)) {
      this.picked = !this.picked;
      squash(scene, this.bowl);
      sfx('tap');
      this.draw();
      return;
    }
    if (this.picked && inSquare(b, 0.74, 0.5, 0.62, x, y)) {
      this.poured = true;
      this.picked = false;
      sfx('plop');
      const bowlLip = at(b, 0.3, 0.42);
      const tin = at(b, 0.74, 0.42);
      for (let i = 0; i < 3; i++) {
        scene.time.delayedCall(i * 90, () => pourDot(scene, bowlLip, tin, b.u * 0.03, N(COLORS.batter)));
      }
      // Tilt the bowl over the tin, then set it back.
      scene.tweens.add({ targets: this.bowl, rotation: -0.7, duration: 260, yoyo: true, hold: 200, ease: 'Sine.easeInOut' });
      scene.time.delayedCall(420, () => {
        squash(scene, this.pan);
        burst(scene, tin.x, tin.y, 12, [COLORS.batter, COLORS.yellow], b.u * 0.2);
      });
      this.draw();
    }
  }

  private draw(): void {
    const { b } = this.c;
    this.g.clear();
    if (this.picked) {
      const bowl = at(b, 0.3, 0.5);
      this.g.lineStyle(Math.max(4, b.u * 0.022), N(COLORS.honey), 1);
      this.g.strokeCircle(bowl.x, bowl.y, b.u * 0.3);
    }
    if (this.poured) {
      const pan = at(b, 0.74, 0.42);
      this.g.fillStyle(N(COLORS.batter), 1);
      this.g.fillEllipse(pan.x, pan.y + b.u * 0.04, b.u * 0.3, b.u * 0.12);
      this.g.fillStyle(0xffffff, 0.5);
      this.g.fillEllipse(pan.x - b.u * 0.05, pan.y + b.u * 0.02, b.u * 0.1, b.u * 0.03);
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
  readonly intro = 'Light the oven! Watch for that golden brown.';
  private lit = false;
  private elapsed = 0;
  private outAt: number | null = null;
  private steamAt = 0;
  private c!: StepCtx;
  private g!: Phaser.GameObjects.Graphics;
  private oven!: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private pan!: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private cake!: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private time!: Phaser.GameObjects.Text;

  build(ctx: StepCtx): void {
    this.c = ctx;
    this.oven = iconAt(ctx.scene, ctx.layer, ctx.b, 'oven', 0.5, 0.4, 0.62);
    this.pan = iconAt(ctx.scene, ctx.layer, ctx.b, 'pan', 0.5, 0.52, 0.34);
    this.cake = iconAt(ctx.scene, ctx.layer, ctx.b, 'cake', 0.5, 0.52, 0.34);
    this.g = graphicsIn(ctx);
    this.time = textAt(ctx.scene, ctx.layer, ctx.b.x + ctx.b.w / 2, ctx.b.y + ctx.b.h * 0.08, '', ctx.fs * 1.2);
    this.draw();
  }

  tick(dt: number): void {
    const { b, scene } = this.c;
    if (this.lit && this.outAt === null) {
      this.elapsed += dt * this.c.ovenSpeed;
      if (this.elapsed >= TUNING.bakeFullSeconds) {
        this.outAt = TUNING.bakeFullSeconds;
        this.onOut();
      }
      // Steam puffs rise from the oven door while it bakes.
      this.steamAt += dt;
      if (this.steamAt > 0.35) {
        this.steamAt = 0;
        const top = at(b, 0.5, 0.2);
        const puff = scene.add.circle(top.x + (Math.random() - 0.5) * b.u * 0.2, top.y, b.u * 0.035, 0xffffff, 0.8);
        scene.tweens.add({
          targets: puff,
          y: top.y - b.u * 0.25,
          alpha: 0,
          scale: 2.2,
          duration: 1100,
          onComplete: () => puff.destroy(),
        });
      }
    }
    this.draw();
  }

  /** The cake comes out of the oven: a pop, a ding, and Gnoma's reaction. */
  private onOut(): void {
    const { b, scene } = this.c;
    const stars = this.stars();
    sfx('ding');
    const base = this.cake.scaleX;
    this.cake.setScale(base * 0.4);
    scene.tweens.add({ targets: this.cake, scaleX: base, scaleY: base, duration: 420, ease: 'Back.easeOut' });
    const c = at(b, 0.5, 0.52);
    burst(scene, c.x, c.y, 14, [COLORS.gold, COLORS.honey, COLORS.yellow], b.u * 0.28);
    const word = stars === 3 ? 'GOLDEN!' : stars === 2 ? 'Nice!' : 'Oops!';
    popText(scene, c.x, c.y - b.u * 0.3, word, stars === 3 ? COLORS.honey : COLORS.ink, this.c.fs * 1.3);
    this.c.say(stars === 3 ? BAKE_LINES.golden : this.elapsed >= TUNING.burntAfter ? BAKE_LINES.burnt : BAKE_LINES.raw);
  }

  action(): StepAction | null {
    if (!this.lit) {
      return {
        label: 'Light the oven',
        enabled: true,
        run: () => {
          this.lit = true;
          this.elapsed = 0;
          sfx('pop');
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
          this.onOut();
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
    const hh = Math.max(12, b.u * 0.06);
    const px = (t: number): number => x0 + (x1 - x0) * Math.min(1, t / full);
    const t = this.outAt ?? this.elapsed;
    const glow = this.lit && this.outAt === null ? 0.35 + 0.25 * Math.sin(this.elapsed * 7) : 0.12;
    this.g.clear();
    // Oven glow behind the door.
    const door = at(b, 0.5, 0.42);
    this.g.fillStyle(N(COLORS.honey), glow);
    this.g.fillCircle(door.x, door.y, b.u * 0.28);
    // The bar: a plate track, the golden band, then the fill.
    this.g.fillStyle(N(COLORS.plate), 1);
    this.g.fillRoundedRect(x0 - 4, y - 4, x1 - x0 + 8, hh + 8, hh / 2 + 4);
    this.g.fillStyle(0xe6dcc6, 1);
    this.g.fillRoundedRect(x0, y, x1 - x0, hh, hh / 2);
    this.g.fillStyle(t >= TUNING.burntAfter ? 0x3b2a1a : 0xff8c42, 1);
    this.g.fillRoundedRect(x0, y, Math.max(hh, px(t) - x0), hh, hh / 2);
    this.g.fillStyle(N(COLORS.gold), 0.75);
    this.g.fillRect(px(TUNING.goldenFrom), y, px(TUNING.goldenTo) - px(TUNING.goldenFrom), hh);
    // Marker at the current time.
    this.g.fillStyle(N(COLORS.ink), 1);
    this.g.fillRect(px(t) - 2, y - 6, 4, hh + 12);
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
  readonly intro = 'Grass frosting! Paint every corner, sweetie!';
  private readonly cells = TUNING.frostCols * TUNING.frostRows;
  private readonly painted: boolean[] = new Array<boolean>(TUNING.frostCols * TUNING.frostRows).fill(false);
  private c!: StepCtx;
  private g!: Phaser.GameObjects.Graphics;
  private pct!: Phaser.GameObjects.Text;
  private cake!: Phaser.GameObjects.Image | Phaser.GameObjects.Text;

  build(ctx: StepCtx): void {
    this.c = ctx;
    this.cake = iconAt(ctx.scene, ctx.layer, ctx.b, 'cake', 0.5, 0.45, 0.8);
    iconAt(ctx.scene, ctx.layer, ctx.b, 'frosting', 0.84, 0.82, 0.2);
    this.g = graphicsIn(ctx);
    this.pct = textAt(ctx.scene, ctx.layer, ctx.b.x + ctx.b.w / 2, ctx.b.y + ctx.b.h * 0.08, '', ctx.fs * 1.2);
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
          burst(this.c.scene, cx, cy, 2, ['#7cc44f', '#a7e070'], cw * 0.9);
        }
      }
    }
    if (changed) {
      sfx('splat');
      this.draw();
    }
  }

  private coverage(): number {
    return this.painted.filter(Boolean).length / this.cells;
  }

  private draw(): void {
    const { ox, oy, cw, ch } = this.grid();
    const g = this.g;
    g.clear();
    for (let row = 0; row < TUNING.frostRows; row++) {
      for (let col = 0; col < TUNING.frostCols; col++) {
        const x = ox + col * cw;
        const y = oy + row * ch;
        const i = row * TUNING.frostCols + col;
        if (this.painted[i]) {
          g.fillStyle(0x3fbf5a, 1);
          g.fillRoundedRect(x + 3, y + 3, cw - 6, ch - 6, Math.min(cw, ch) * 0.4);
          g.fillStyle(0xffffff, 0.35);
          g.fillCircle(x + cw * 0.35, y + ch * 0.35, Math.min(cw, ch) * 0.12);
        } else {
          g.lineStyle(1, 0x3b2a1a, 0.18);
          g.strokeRect(x + 1, y + 1, cw - 2, ch - 2);
        }
      }
    }
    // Rainbow sprinkles once the top is covered.
    if (this.coverage() >= TUNING.frostNeeded) {
      for (let i = 0; i < 16; i++) {
        const sx = ox + ((i * 37) % 100) / 100 * cw * TUNING.frostCols;
        const sy = oy + ((i * 53) % 100) / 100 * ch * TUNING.frostRows;
        g.fillStyle(N(CONFETTI[i % CONFETTI.length]), 1);
        g.fillRoundedRect(sx, sy, cw * 0.35, ch * 0.14, 2);
      }
    }
    this.pct.setText(`${Math.round(this.coverage() * 100)}% covered`);
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

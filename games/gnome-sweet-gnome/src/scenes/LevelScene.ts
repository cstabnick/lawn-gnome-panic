// One level: HUD, board, move loop, the win sequence and the lose popup. The rules live in the engine;
// this scene shows them and forwards the player's swaps.
import Phaser from 'phaser';
import { COLORS, FONT, SCENES, TEX, TUNING } from '../config';
import type { HouseSceneData, LevelSceneData } from '../config';
import { levelLayout } from '../layout';
import { LEVELS } from '../levels';
import { addMoves, gnomeRush, playSwap, starsFor, startLevel } from '../engine/game';
import { makeRng } from '../engine/rng';
import type { BoardEvent, BoosterKind, GoalDef, LevelState, Pos, Rng } from '../engine/types';
import { BoardView } from '../view/BoardView';
import { burst, confetti, fireworks, flash, floatText, flyTo, rays, shake, wait } from '../fx';
import { playSfx } from '../audio';
import { loadSave, updateSave } from '../save';

const D_BG = 0;
const D_HUD = 10;
const D_POPUP = 800; // the dim layer; popup content sits one above it
const BADGE_R = 28; // moves counter circle radius
const BAR_H = 14; // score bar height
const BAR_STAR_PX = 30; // star markers on the score bar
const MAX_FLIGHTS = 8; // goal icon fly-ins per move
const LOW_MOVES = 5; // the moves counter turns red and pulses at or below this
const WIN_WORDS = ['GNOMETASTIC!', 'GNOMENAL!', 'GNOME RUN!', 'GNOMEWORK DONE!'];

/** HUD font size: `base` at a 390 px short side, growing with the screen, never below 14. */
function hudPx(base: number, minSide: number): number {
  const scale = Math.min(1.6, Math.max(0.8, minSide / 390));
  return Math.max(14, Math.round(base * scale));
}

/** Popup font size: `base` scaled by the popup's fit factor, never below 14. */
function pf(base: number, k: number): number {
  return Math.max(14, Math.round(base * k));
}

function textStyle(px: number, color: string, wrapW = 0): Phaser.Types.GameObjects.Text.TextStyle {
  const style: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: FONT,
    fontSize: `${px}px`,
    color,
    stroke: COLORS.textDark,
    strokeThickness: Math.max(2, Math.round(px / 8)),
    align: 'center',
  };
  if (wrapW > 0) style.wordWrap = { width: wrapW };
  return style;
}

/** The picture that stands for a goal: its tile, weeds, stone or lost gnome. */
function iconFor(goal: GoalDef): string {
  switch (goal.type) {
    case 'collect':
      return TEX.tile[goal.kind];
    case 'weeds':
      return TEX.weeds2;
    case 'stones':
      return TEX.stone2;
    case 'gnomes':
      return TEX.gnome;
  }
}

interface GoalRef {
  icon: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  check: Phaser.GameObjects.Container;
  x: number; // screen centre of the icon: fly-in target
  y: number;
  base: number; // icon scale at rest
  shown: number; // `left` as last shown, to tell when to pop
}

interface StarMarker {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  lit: boolean;
  base: number;
}

interface HudRefs {
  badge: Phaser.GameObjects.Container;
  badgeBg: Phaser.GameObjects.Graphics;
  moves: Phaser.GameObjects.Text;
  goals: GoalRef[];
  fill: Phaser.GameObjects.Rectangle;
  barW: number;
  markers: StarMarker[];
}

interface Popup {
  root: Phaser.GameObjects.Container;
  k: number; // fit factor: 1 on a screen big enough for the design size
}

export class LevelScene extends Phaser.Scene {
  private levelId = 1;
  private boosters: BoosterKind[] = [];
  private state!: LevelState;
  private rng: Rng = makeRng(1);
  private boardView!: BoardView;
  private hud: HudRefs | null = null;
  private hudLayer: Phaser.GameObjects.Container | null = null;
  private bgLayer: Phaser.GameObjects.Container | null = null;
  private bgTweens: Phaser.Tweens.Tween[] = [];
  private badgePulse: Phaser.Tweens.Tween | null = null;
  private scoreCounter: Phaser.Tweens.Tween | null = null;
  private shownScore = 0;
  private portrait = true;
  private busy = false; // a move, the win sequence or a popup owns the board
  private leaving = false;
  private popup: Phaser.GameObjects.Container | null = null;
  private popupDim: Phaser.GameObjects.Rectangle | null = null;

  constructor() {
    super(SCENES.level);
  }

  init(data: LevelSceneData): void {
    this.levelId = data?.levelId ?? 1;
    this.boosters = data?.boosters ?? [];
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.backgroundCss);
    const level = LEVELS[this.levelId - 1] ?? LEVELS[0];
    this.rng = makeRng(Date.now() >>> 0);
    this.state = startLevel(level, this.rng, this.boosters);
    this.busy = false;
    this.leaving = false;
    this.popup = null;
    this.popupDim = null;
    this.badgePulse = null;
    this.scoreCounter = null;
    this.bgTweens = [];
    this.shownScore = this.state.score;

    this.buildBackground();
    const lay = levelLayout(this.scale.width, this.scale.height, this.state.board.rows, this.state.board.cols);
    this.boardView = new BoardView(this, this.state.board, lay.board, lay.cell);
    this.boardView.onSwap = (a, b) => {
      void this.trySwap(a, b);
    };
    this.boardView.setInputEnabled(true);
    this.buildHud();

    this.scale.on('resize', this.onResize);
    this.input.keyboard?.on('keydown-ESC', this.onEsc);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize);
      this.input.keyboard?.off('keydown-ESC', this.onEsc);
      this.boardView.destroy();
      this.badgePulse?.stop();
      for (const t of this.bgTweens) t.stop();
    });
  }

  private onResize = (): void => {
    const W = this.scale.width;
    const H = this.scale.height;
    const lay = levelLayout(W, H, this.state.board.rows, this.state.board.cols);
    this.boardView.layout(lay.board, lay.cell);
    this.buildBackground();
    this.buildHud();
    this.popup?.setPosition(W / 2, H / 2);
    this.popupDim?.setSize(W, H);
  };

  private onEsc = (): void => {
    this.askGiveUp();
  };

  // ---- background -------------------------------------------------------

  /** Dusk gradient, a few slow glowing orbs in the tile colours, and dark hills along the bottom. Behind everything. */
  private buildBackground(): void {
    for (const t of this.bgTweens) t.stop();
    this.bgTweens = [];
    this.bgLayer?.destroy();
    const W = this.scale.width;
    const H = this.scale.height;
    const layer = this.add.container(0, 0).setDepth(D_BG);

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x4a2f7a, 0x4a2f7a, 0x1f1430, 0x1f1430, 1).fillRect(0, 0, W, H);
    layer.add(sky);

    const kinds = Object.values(COLORS.kind);
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.min(W, H) * (0.25 + Math.random() * 0.25);
      const disc = this.add.circle(x, y, r, kinds[i % kinds.length], 0.12).setBlendMode(Phaser.BlendModes.ADD);
      layer.add(disc);
      this.bgTweens.push(
        this.tweens.add({
          targets: disc,
          x: x + (Math.random() * 2 - 1) * 60,
          y: y + (Math.random() * 2 - 1) * 50,
          duration: 6000 + Math.random() * 4000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        }),
      );
    }

    layer.add(this.hills(W, H, 0x2a1842, 0.9, 0.03, 1.3, 0));
    layer.add(this.hills(W, H, 0x150b25, 0.95, 0.025, 2.1, 1.7));
    this.bgLayer = layer;
  }

  /** A dark rolling-hill silhouette along the bottom: its crest sways between `crest - amp` and `crest` (fractions of H). */
  private hills(W: number, H: number, colour: number, crest: number, amp: number, freq: number, phase: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().fillStyle(colour, 1);
    const steps = 64;
    g.beginPath();
    g.moveTo(0, H);
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      g.lineTo(W * u, H * (crest - amp * (0.5 + 0.5 * Math.sin(u * Math.PI * 2 * freq + phase))));
    }
    g.lineTo(W, H);
    g.closePath();
    g.fillPath();
    return g;
  }

  // ---- HUD ----------------------------------------------------------------

  /** Builds the HUD from the current state. Called at create and on every resize. */
  private buildHud(): void {
    this.badgePulse?.stop();
    this.badgePulse = null;
    this.hudLayer?.destroy();

    const W = this.scale.width;
    const H = this.scale.height;
    const minSide = Math.min(W, H);
    const lay = levelLayout(W, H, this.state.board.rows, this.state.board.cols);
    const hud = lay.hud;
    this.portrait = lay.portrait;
    const pad = 8;
    const root = this.add.container(0, 0).setDepth(D_HUD);
    this.hudLayer = root;

    // Back button, top-left.
    this.makeButton(root, hud.x + pad + 22, hud.y + pad + 22, 44, 44, '‹', hudPx(28, minSide), () => this.askGiveUp());

    // Moves counter, top-right.
    const badge = this.add.container(hud.x + hud.w - pad - BADGE_R, hud.y + pad + BADGE_R);
    const badgeBg = this.add.graphics();
    const moves = this.add.text(0, 0, '', textStyle(hudPx(24, minSide), COLORS.text)).setOrigin(0.5);
    badge.add([badgeBg, moves]);
    root.add(badge);

    // Level name: between the two buttons in portrait, its own row in landscape.
    const nameWrap = this.portrait ? hud.w - 2 * (2 * BADGE_R + pad + 16) : hud.w - 2 * pad;
    const nameY = this.portrait ? hud.y + pad + 22 : hud.y + pad + 56 + 12;
    root.add(
      this.add
        .text(hud.x + hud.w / 2, nameY, this.state.level.name, textStyle(hudPx(20, minSide), COLORS.accent, Math.max(40, nameWrap)))
        .setOrigin(0.5),
    );

    // Goals: a row in portrait, a column in landscape.
    const goalsY = this.portrait ? hud.y + 78 : hud.y + pad + 56 + 12 + 34;
    const iconPx = this.portrait ? 40 : 36;
    const goalRefs: GoalRef[] = this.state.goals.map((gs, i) => {
      const n = this.state.goals.length;
      const ix = this.portrait ? hud.x + (hud.w / n) * (i + 0.5) : hud.x + pad + 20;
      const iy = this.portrait ? goalsY : goalsY + i * 46;
      const icon = this.add.image(ix, iy, iconFor(gs.goal)).setDisplaySize(iconPx, iconPx);
      const label = this.add
        .text(this.portrait ? ix : ix + 26, this.portrait ? iy + 34 : iy, '', textStyle(hudPx(18, minSide), COLORS.text))
        .setOrigin(this.portrait ? 0.5 : 0, 0.5);
      const check = this.add.container(ix, iy).setVisible(false);
      check.add([
        this.add.graphics().fillStyle(COLORS.good, 1).fillCircle(0, 0, iconPx / 2 + 2),
        this.add.text(0, 0, '✓', textStyle(hudPx(20, minSide), COLORS.text)).setOrigin(0.5),
      ]);
      root.add([icon, label, check]);
      return { icon, label, check, x: ix, y: iy, base: icon.scaleX, shown: gs.left };
    });

    // Score bar with three star markers at the thresholds.
    const barY = hud.y + hud.h - 24;
    const barX = hud.x + 16;
    const barW = hud.w - 32;
    const track = this.add.rectangle(barX, barY, barW, BAR_H, 0x1d1027).setOrigin(0, 0.5);
    const fill = this.add.rectangle(barX, barY, barW, BAR_H, COLORS.accentNum).setOrigin(0, 0.5);
    root.add([track, fill]);
    const thresholds = this.state.level.stars;
    const markers: StarMarker[] = thresholds.map((t) => {
      const x = barX + barW * Math.min(1, t / thresholds[2]);
      const lit = this.shownScore >= t;
      const img = this.add.image(x, barY, lit ? TEX.star : TEX.starEmpty).setScale(BAR_STAR_PX / 48);
      root.add(img);
      return { img, x, y: barY, lit, base: BAR_STAR_PX / 48 };
    });

    this.hud = { badge, badgeBg, moves, goals: goalRefs, fill, barW, markers };
    this.refreshHud(false);
    this.setScoreDisplay(this.shownScore, false);
  }

  /** Moves counter, goal counts and checks. `animate` pops a goal that just dropped. */
  private refreshHud(animate: boolean): void {
    const h = this.hud;
    if (!h) return;
    const s = this.state;
    const low = s.movesLeft <= LOW_MOVES;
    h.moves.setText(String(Math.max(0, s.movesLeft)));
    h.badgeBg
      .clear()
      .fillStyle(low ? COLORS.bad : COLORS.panel, 1)
      .fillCircle(0, 0, BADGE_R)
      .lineStyle(3, COLORS.panelEdge, 1)
      .strokeCircle(0, 0, BADGE_R);
    if (low && !this.badgePulse) {
      this.badgePulse = this.tweens.add({ targets: h.badge, scale: 1.12, duration: 350, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else if (!low && this.badgePulse) {
      this.badgePulse.stop();
      this.badgePulse = null;
      h.badge.setScale(1);
    }

    s.goals.forEach((g, i) => {
      const ref = h.goals[i];
      if (!ref) return;
      if (animate && g.left < ref.shown) {
        // The pop waits for the fly-in to land.
        this.tweens.add({ targets: ref.icon, scale: ref.base * 1.35, duration: 140, yoyo: true, delay: 420, ease: 'Back.easeOut' });
      }
      ref.shown = g.left;
      const done = g.left === 0;
      ref.check.setVisible(done);
      ref.icon.setAlpha(done ? 0.45 : 1);
      ref.label.setVisible(!done);
      ref.label.setText(this.portrait ? String(g.left) : `${g.left} left`);
    });
  }

  /** Sets the score bar and lights star markers the score has passed. */
  private setScoreDisplay(v: number, animate: boolean): void {
    this.shownScore = v;
    const h = this.hud;
    if (!h) return;
    const thresholds = this.state.level.stars;
    const frac = Math.min(1, v / thresholds[2]);
    h.fill.setSize(Math.max(1, h.barW * frac), BAR_H);
    h.fill.setVisible(frac > 0);
    h.markers.forEach((m, i) => {
      if (m.lit || v < thresholds[i]) return;
      m.lit = true;
      m.img.setTexture(TEX.star);
      if (animate) {
        burst(this, m.x, m.y, COLORS.accentNum, 12);
        playSfx('star');
        this.tweens.add({ targets: m.img, scale: m.base * 1.5, duration: 160, yoyo: true, ease: 'Back.easeOut' });
      }
    });
  }

  /** Counts the score bar from where it is to `to`. */
  private countScoreTo(to: number, ms: number): void {
    this.scoreCounter?.stop();
    const counter = { v: this.shownScore };
    this.scoreCounter = this.tweens.add({
      targets: counter,
      v: to,
      duration: ms,
      ease: 'Sine.easeOut',
      onUpdate: () => this.setScoreDisplay(Math.round(counter.v), true),
    });
  }

  /** A goal icon flies from the board cell to its goal in the HUD. Not awaited. */
  private flyToGoal(idx: number, from: Pos): void {
    const ref = this.hud?.goals[idx];
    if (!ref) return;
    const p = this.boardView.cellCenter(from);
    void flyTo(this, iconFor(this.state.goals[idx].goal), p, { x: ref.x, y: ref.y }, 500, 0.55);
  }

  private goalIndex(pred: (g: GoalDef) => boolean): number {
    return this.state.goals.findIndex((g) => pred(g.goal));
  }

  /** Icons fly from the cells where goal things happened (at most MAX_FLIGHTS per move). */
  private flyEvents(events: readonly BoardEvent[]): void {
    let flights = 0;
    for (const e of events) {
      if (flights >= MAX_FLIGHTS) return;
      let idx = -1;
      let from: Pos | null = null;
      switch (e.type) {
        case 'clear': {
          const kind = e.kind;
          idx = this.goalIndex((g) => g.type === 'collect' && g.kind === kind);
          from = e.at;
          break;
        }
        case 'weeds':
          idx = this.goalIndex((g) => g.type === 'weeds');
          from = e.at;
          break;
        case 'stone':
          idx = this.goalIndex((g) => g.type === 'stones');
          from = e.at;
          break;
        case 'gnomeSaved':
          idx = this.goalIndex((g) => g.type === 'gnomes');
          from = e.at;
          break;
        default:
          break;
      }
      if (idx < 0 || !from) continue;
      this.flyToGoal(idx, from);
      flights++;
    }
  }

  // ---- buttons and popups -----------------------------------------------

  /** A rounded button centred on (x, y) in `parent`'s space. Tap = pointer up on it. */
  private makeButton(
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    px: number,
    onTap: () => void,
    opts: { fill?: number; disabled?: boolean } = {},
  ): void {
    const disabled = opts.disabled ?? false;
    const r = Math.min(16, h / 2);
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(opts.fill ?? COLORS.button, disabled ? 0.5 : 1).fillRoundedRect(-w / 2, -h / 2, w, h, r);
    g.lineStyle(3, COLORS.buttonEdge, disabled ? 0.4 : 1).strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    const t = this.add.text(0, 0, label, textStyle(px, COLORS.text, w - 16)).setOrigin(0.5).setAlpha(disabled ? 0.6 : 1);
    c.add([g, t]);
    c.setSize(w, h);
    if (!disabled) {
      c.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains); // a sized container hit-tests from its top-left
      c.on('pointerdown', () => this.tweens.add({ targets: c, scale: 0.94, duration: 60 }));
      c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 80 }));
      c.on('pointerup', () => {
        this.tweens.add({ targets: c, scale: 1, duration: 80 });
        onTap();
      });
    }
    parent.add(c);
  }

  /** Opens a centred panel of design size designW x designH (scaled down to fit the screen). */
  private openPopup(designW: number, designH: number): Popup {
    this.closePopup();
    const W = this.scale.width;
    const H = this.scale.height;
    const k = Math.max(0.5, Math.min(1, (W * 0.92) / designW, (H * 0.92) / designH));
    const pw = designW * k;
    const ph = designH * k;
    const dim = this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0, 0).setDepth(D_POPUP).setInteractive();
    const root = this.add.container(W / 2, H / 2).setDepth(D_POPUP + 1);
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panel, 1).fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 22 * k);
    panel.lineStyle(4, COLORS.panelEdge, 1).strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 22 * k);
    root.add(panel);
    this.popup = root;
    this.popupDim = dim;
    root.setAlpha(0).setScale(0.85);
    this.tweens.add({ targets: root, alpha: 1, scale: 1, duration: 200, ease: 'Back.easeOut' });
    return { root, k };
  }

  private closePopup(): void {
    this.popup?.destroy();
    this.popup = null;
    this.popupDim?.destroy();
    this.popupDim = null;
  }

  private resumeAfterPopup(): void {
    this.closePopup();
    this.busy = false;
    this.boardView.setInputEnabled(true);
  }

  private leaveToHouse(data: HouseSceneData = {}): void {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.start(SCENES.house, data);
  }

  /** "Give up this level?" Yes goes to the house with no penalty. */
  private askGiveUp(): void {
    if (this.busy || this.popup || this.leaving) return;
    this.busy = true;
    this.boardView.setInputEnabled(false);
    const { root, k } = this.openPopup(440, 260);
    root.add(this.add.text(0, -60 * k, 'Give up this level?', textStyle(pf(30, k), COLORS.accent)).setOrigin(0.5));
    const bh = Math.max(44, Math.round(52 * k));
    this.makeButton(root, -100 * k, 50 * k, 150 * k, bh, 'Yes', pf(24, k), () => this.leaveToHouse(), { fill: COLORS.bad });
    this.makeButton(root, 100 * k, 50 * k, 150 * k, bh, 'No', pf(24, k), () => this.resumeAfterPopup(), { fill: COLORS.good });
  }

  // ---- move loop ------------------------------------------------------------

  /** Read through a method so TypeScript does not keep the status narrowed across the awaits. */
  private statusNow(): LevelState['status'] {
    return this.state.status;
  }

  private async trySwap(a: Pos, b: Pos): Promise<void> {
    if (this.busy || this.leaving || this.statusNow() !== 'playing') return;
    this.busy = true;
    this.boardView.setInputEnabled(false);
    const events = playSwap(this.state, a, b, this.rng);
    this.flyEvents(events);
    await this.boardView.play(events, this.state.board);
    this.refreshHud(true);
    this.countScoreTo(this.state.score, 450);
    const after = this.statusNow();
    if (after === 'won') {
      await this.win();
    } else if (after === 'lost') {
      this.lose();
    } else {
      this.busy = false;
      this.boardView.setInputEnabled(true);
    }
  }

  // ---- win ----------------------------------------------------------------

  /** Level complete: the Gnome Rush for moves left, then the star screen. Saves progress before the button. */
  async win(): Promise<void> {
    const s = this.state;
    this.busy = true;
    this.boardView.setInputEnabled(false);
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    playSfx('win');
    flash(this, COLORS.accentNum, 0.3, 400);
    floatText(this, cx, cy * 0.5, 'Level Complete!', { size: 44, durationMs: 1400 });
    await wait(this, 900);

    if (s.movesLeft > 0) {
      floatText(this, cx, cy * 0.5 + 70, 'GNOME RUSH!', { size: 40, color: '#5ee06a' });
      const rush = gnomeRush(s, this.rng);
      this.countScoreTo(s.score, 1800);
      await this.boardView.play(rush, s.board, 4);
      this.refreshHud(false);
      await wait(this, 300);
    } else {
      await wait(this, 400);
    }

    const stars = starsFor(s.level, s.score, true);
    const coins = TUNING.coinsPerWin + stars * TUNING.coinsPerStar;
    const levelId = s.level.id;
    updateSave((sv) => {
      const prev = sv.best[levelId] ?? 0;
      sv.stars += Math.max(0, stars - prev);
      sv.best[levelId] = Math.max(prev, stars);
      sv.coins += coins;
      if (sv.level === levelId) sv.level = levelId + 1;
    });
    this.showWinScreen(stars, coins, s.score);
  }

  private showWinScreen(stars: number, coins: number, score: number): void {
    const { root, k } = this.openPopup(440, 400);

    // Sunburst behind the stars, under the panel.
    const sun = rays(this, 0, -60 * k, COLORS.accentNum, 2.4 * k);
    root.addAt(sun, 1);

    const word = WIN_WORDS[Math.floor(Math.random() * WIN_WORDS.length)];
    const title = this.add
      .text(0, -150 * k, word, textStyle(pf(44, k), COLORS.accent))
      .setOrigin(0.5)
      .setScale(0)
      .setAngle(-18);
    root.add(title);
    this.tweens.add({ targets: title, scale: 1, angle: 0, duration: 450, ease: 'Back.easeOut' });

    const starScale = (84 * k) / 48;
    const slotX = [-110 * k, 0, 110 * k];
    const slotY = -60 * k;
    const slots = slotX.map((x) => {
      const img = this.add.image(x, slotY, TEX.starEmpty).setScale(starScale);
      root.add(img);
      return img;
    });
    for (let i = 0; i < stars; i++) {
      this.time.delayedCall(450 + i * 420, () => {
        const img = slots[i];
        img.setTexture(TEX.star).setScale(0);
        this.tweens.add({ targets: img, scale: starScale, duration: 320, ease: 'Back.easeOut' });
        playSfx('star');
        burst(this, root.x + slotX[i], root.y + slotY, COLORS.accentNum, 16);
      });
    }

    root.add(this.add.text(0, 10 * k, `Score ${score}`, textStyle(pf(26, k), COLORS.text)).setOrigin(0.5));
    root.add(
      this.add.text(0, 70 * k, `+${stars} ★   +${coins} coins`, textStyle(pf(24, k), COLORS.text)).setOrigin(0.5),
    );

    fireworks(this, 8);
    confetti(this, 3000);

    const levelId = this.state.level.id;
    this.time.delayedCall(1300, () => {
      this.makeButton(
        root,
        0,
        150 * k,
        Math.max(160, 240 * k),
        Math.max(44, Math.round(56 * k)),
        'Continue',
        pf(26, k),
        () => this.leaveToHouse({ wonLevel: levelId, starsEarned: stars, coinsEarned: coins } satisfies HouseSceneData),
      );
    });
  }

  // ---- lose -----------------------------------------------------------------

  /** Out of moves: buy five more for coins, or give up. */
  lose(): void {
    playSfx('lose');
    shake(this, 0.004, 200);
    this.busy = true;
    this.boardView.setInputEnabled(false);
    const cost = TUNING.extraMovesCost;
    const { root, k } = this.openPopup(440, 400);
    root.add(this.add.text(0, -150 * k, 'Out of moves!', textStyle(pf(40, k), COLORS.accent)).setOrigin(0.5));

    const open = this.state.goals.filter((g) => g.left > 0);
    const gap = 120 * k;
    open.forEach((g, i) => {
      const x = (i - (open.length - 1) / 2) * gap;
      root.add(this.add.image(x, -70 * k, iconFor(g.goal)).setDisplaySize(52 * k, 52 * k));
      root.add(this.add.text(x, -20 * k, `${g.left} left`, textStyle(pf(22, k), COLORS.text)).setOrigin(0.5));
    });

    const coins = loadSave().coins;
    root.add(this.add.text(0, 30 * k, `Coins: ${coins}`, textStyle(pf(22, k), COLORS.text)).setOrigin(0.5));
    this.makeButton(
      root,
      0,
      95 * k,
      340 * k,
      Math.max(44, Math.round(52 * k)),
      `+${TUNING.extraMoves} moves (${cost} coins)`,
      pf(22, k),
      () => this.buyMoves(),
      { disabled: coins < cost },
    );
    this.makeButton(root, 0, 165 * k, 240 * k, Math.max(44, Math.round(48 * k)), 'Give up', pf(22, k), () => this.leaveToHouse(), {
      fill: 0x6b5a7a,
    });
  }

  private buyMoves(): void {
    const cost = TUNING.extraMovesCost;
    if (loadSave().coins < cost) return;
    updateSave((sv) => {
      sv.coins -= cost;
    });
    addMoves(this.state, TUNING.extraMoves);
    this.closePopup();
    this.refreshHud(false);
    this.busy = false;
    this.boardView.setInputEnabled(true);
  }
}

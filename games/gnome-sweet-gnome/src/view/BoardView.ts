// Draws a Board, turns swipes and taps into swap requests, and animates every BoardEvent with juice.
import Phaser from 'phaser';
import { playMatch, playSfx } from '../audio';
import { COLORS, COMBO_WORDS, TEX, TUNING } from '../config';
import { listValidSwaps } from '../engine/board';
import type { Board, BoardEvent, Piece, PieceKind, Pos, SpecialKind } from '../engine/types';
import { beam, burst, flash, floatText, flyTo, mowerSweep, shake, wait } from '../fx';
import type { Rect } from '../layout';
import { makePieceSprite, pieceSig } from './pieceSprite';

type Node = Phaser.GameObjects.Container;
type Layer = 'tray' | 'cells' | 'weeds' | 'stones' | 'pieces' | 'fx';
type TweenProps = Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>;
type Clear = Extract<BoardEvent, { type: 'clear' }>;
interface XY {
  x: number;
  y: number;
}

const KIND_HEX = Object.values(COLORS.kind);
const GOLD = COLORS.accentNum;
const CLIPPING_GREEN = 0x4fd65a;
const STONE_GREY = 0x9a9a9a;
// The raised tray the board sits in.
const TRAY_SHADOW = 0x000000;
const TRAY_WOOD_DARK = 0x5a3a1c;
const TRAY_WOOD = 0x8a5a2b;
const TRAY_WOOD_LIGHT = 0xc8925a;
const TRAY_INNER = 0x3b2a1c;
const TRAY_EDGE = 0x1e140b;

const LABEL: Record<SpecialKind | 'prism', string> = {
  mowerH: 'Mower!',
  mowerV: 'Mower!',
  bomb: 'Seed Bomb!',
  bee: 'Bee!',
  prism: 'Rainbow Gem!',
};

/** Which power's callout wins a combo: prism > bomb > mower > bee. */
const RANK: Record<SpecialKind | 'prism', number> = { prism: 4, bomb: 3, mowerH: 2, mowerV: 2, bee: 1 };

function kindColor(kind: PieceKind): number {
  return kind === 'prism' || kind === 'gnome' ? 0xffffff : COLORS.kind[kind];
}

function css(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

function isMower(t: SpecialKind | 'prism'): boolean {
  return t === 'mowerH' || t === 'mowerV';
}

function adjacent(a: Pos, b: Pos): boolean {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

export class BoardView {
  /** Called when the player asks for a swap (swipe, or tap one piece then a neighbour). */
  onSwap: (a: Pos, b: Pos) => void = () => {};

  private readonly scene: Phaser.Scene;
  private board: Board;
  private rect: Rect;
  private cell: number;
  /** The cell size the sprites were last built for; a change rebuilds every sprite. */
  private builtCell = -1;
  private readonly layers: Record<Layer, Phaser.GameObjects.Container>;
  /** Piece sprites by Piece.id. */
  private readonly nodes = new Map<number, Node>();
  /** Look of each sprite (pieceSig), to rebuild only what changed. */
  private readonly sigs = new Map<number, string>();
  /** Weeds and stone images by cell index. */
  private readonly weedImgs = new Map<number, Phaser.GameObjects.Image>();
  private readonly stoneImgs = new Map<number, Phaser.GameObjects.Image>();
  private inputOn = true;
  private playing = false;
  private destroyed = false;
  private speed = 1;
  private selected: Pos | null = null;
  private drag: { origin: Pos; x: number; y: number; fired: boolean; tapFrom: Pos | null } | null = null;
  private idleTimer: Phaser.Time.TimerEvent | null = null;
  private hintNodes: Node[] = [];
  private readonly tray: Phaser.GameObjects.Graphics;
  /** Reduced motion: the wave runs at a quarter of its amplitude. */
  private readonly reduceMotion: boolean;

  constructor(scene: Phaser.Scene, board: Board, rect: Rect, cell: number) {
    this.scene = scene;
    this.board = board;
    this.rect = rect;
    this.cell = cell;
    const mk = (): Phaser.GameObjects.Container => scene.add.container(rect.x, rect.y);
    this.layers = { tray: mk(), cells: mk(), weeds: mk(), stones: mk(), pieces: mk(), fx: mk() };
    this.tray = scene.add.graphics();
    this.layers.tray.add(this.tray);
    this.drawTray();
    this.reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    scene.input.on('pointerdown', this.onDown);
    scene.input.on('pointermove', this.onMove);
    scene.input.on('pointerup', this.onUp);
    scene.events.on('update', this.onUpdate);
    this.resync(board);
    this.resetIdle();
  }

  /** Move/resize to a new rect (screen resize). */
  layout(rect: Rect, cell: number): void {
    this.rect = rect;
    this.cell = cell;
    for (const layer of Object.values(this.layers)) layer.setPosition(rect.x, rect.y);
    this.drawTray();
    this.resync(this.board);
  }

  setInputEnabled(on: boolean): void {
    this.inputOn = on;
    if (!on) this.drag = null;
    this.resetIdle();
  }

  /** Animate events in order; resolves when done. Afterwards the sprites match `board` exactly (resync). */
  async play(events: readonly BoardEvent[], board: Board, speed = 1): Promise<void> {
    this.board = board;
    this.speed = speed > 0 ? speed : 1;
    this.playing = true;
    this.drag = null;
    this.setSelected(null);
    this.resetIdle();
    const pending: Promise<void>[] = [];
    try {
      for (const ev of events) {
        if (ev.type === 'clear') {
          // A group's clears start together; the next non-clear event waits for them.
          pending.push(this.clear(ev));
          continue;
        }
        if (pending.length) await Promise.all(pending.splice(0));
        await this.step(ev);
      }
      await Promise.all(pending);
    } finally {
      this.playing = false;
      this.resync(board);
      this.resetIdle();
    }
  }

  /** Screen centre of a cell, for HUD effects (goal fly-ins). */
  cellCenter(p: Pos): { x: number; y: number } {
    return this.screenAt(p.c, p.r);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.input.off('pointerdown', this.onDown);
    this.scene.input.off('pointermove', this.onMove);
    this.scene.input.off('pointerup', this.onUp);
    this.scene.events.off('update', this.onUpdate);
    this.clearHint();
    this.idleTimer?.remove(false);
    this.idleTimer = null;
    for (const node of this.nodes.values()) this.destroyNode(node);
    this.nodes.clear();
    this.sigs.clear();
    for (const layer of Object.values(this.layers)) layer.destroy();
  }

  // ---------- input ----------

  private readonly onDown = (p: Phaser.Input.Pointer): void => {
    if (!this.inputOn || this.playing || this.destroyed) return;
    this.resetIdle();
    const at = this.cellAtScreen(p.x, p.y);
    if (!at || !this.board.cells[this.idx(at)].piece) {
      this.drag = null;
      this.setSelected(null);
      return;
    }
    // A tap on a neighbour of the selected piece swaps them when the pointer lifts.
    const sel = this.selected;
    const tapFrom = sel && adjacent(sel, at) ? sel : null;
    this.drag = { origin: at, x: p.x, y: p.y, fired: false, tapFrom };
    if (!tapFrom) this.setSelected(at);
  };

  private readonly onMove = (p: Phaser.Input.Pointer): void => {
    const d = this.drag;
    if (!d || d.fired || !p.isDown) return;
    const dx = p.x - d.x;
    const dy = p.y - d.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < this.cell * 0.35) return;
    const dr = Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? 1 : -1) : 0;
    const dc = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 1 : -1) : 0;
    const to = { r: d.origin.r + dr, c: d.origin.c + dc };
    if (!this.inBoard(to)) return;
    d.fired = true;
    this.setSelected(null);
    this.onSwap(d.origin, to);
  };

  private readonly onUp = (): void => {
    const d = this.drag;
    this.drag = null;
    if (d && !d.fired && d.tapFrom && this.inputOn && !this.playing) {
      this.setSelected(null);
      this.onSwap(d.tapFrom, d.origin);
    }
    this.resetIdle();
  };

  private setSelected(p: Pos | null): void {
    this.selected = p;
    this.paintSelection();
  }

  /** Scale and ring of the selected piece; everything else at rest. */
  private paintSelection(): void {
    const sel = this.selected ? this.nodeAt(this.selected) : undefined;
    for (const node of this.nodes.values()) {
      const on = node === sel;
      node.setScale(on ? 1.12 : 1);
      (node.getByName('sel') as Phaser.GameObjects.Graphics | null)?.setVisible(on);
    }
  }

  // ---------- wave ----------

  /** Every frame: each piece's art sways, hops and squashes, with a phase by cell so a wave rolls across the board. */
  private readonly onUpdate = (): void => {
    if (this.destroyed) return;
    const t = this.scene.time.now / 1000;
    const k = this.reduceMotion ? 0.25 : 1;
    for (const node of this.nodes.values()) {
      const art = node.getByName('art') as Phaser.GameObjects.Container | null;
      if (!art) continue;
      const phase = (node.x / this.cell - 0.5) * 0.55 + (node.y / this.cell - 0.5) * 0.35;
      const lean = (art.getData('lean') as number | undefined) ?? 4;
      art.setAngle(lean * k * Math.sin(t * 1.6 + phase));
      art.setY(-0.025 * this.cell * k * (0.5 + 0.5 * Math.sin(t * 2.1 + phase)));
      art.setScale(1, 1 + 0.03 * k * Math.sin(t * 2.1 + phase + 0.6));
    }
  };

  /** The raised, framed tray: drop shadow, wooden rim with a bevel, dark inner line. Holes show the tray colour. */
  private drawTray(): void {
    const g = this.tray;
    g.clear();
    const W = this.board.cols * this.cell;
    const H = this.board.rows * this.cell;
    const rim = Math.round(Math.min(14, Math.max(10, this.cell * 0.16)));
    const R = 18;
    const x = -rim;
    const y = -rim;
    const w = W + 2 * rim;
    const h = H + 2 * rim;
    g.fillStyle(TRAY_SHADOW, 0.35).fillRoundedRect(x, y + 6, w, h, R);
    g.fillStyle(TRAY_WOOD_DARK, 1).fillRoundedRect(x, y, w, h, R);
    g.fillStyle(TRAY_WOOD, 1).fillRoundedRect(x, y, w, h - 4, R);
    g.fillStyle(TRAY_WOOD_LIGHT, 1).fillRoundedRect(x + 4, y + 2, w - 8, 3, 1.5);
    g.fillStyle(TRAY_INNER, 1).fillRect(0, 0, W, H);
    g.lineStyle(2, TRAY_EDGE, 1).strokeRoundedRect(-3, -3, W + 6, H + 6, 6);
  }

  // ---------- idle hint ----------

  private resetIdle(): void {
    this.clearHint();
    this.idleTimer?.remove(false);
    this.idleTimer = null;
    if (this.inputOn && !this.playing && !this.destroyed) {
      this.idleTimer = this.scene.time.delayedCall(TUNING.hintAfterMs, () => {
        this.idleTimer = null;
        this.showHint();
      });
    }
  }

  private showHint(): void {
    const swaps = listValidSwaps(this.board);
    if (!swaps.length) return;
    const [a, b] = swaps[0];
    this.hintNodes = [this.nodeAt(a), this.nodeAt(b)].filter((n): n is Node => n !== undefined);
    for (const node of this.hintNodes) {
      this.scene.tweens.add({ targets: node, angle: 8, yoyo: true, repeat: -1, duration: 160, ease: 'Sine.easeInOut' });
    }
  }

  private clearHint(): void {
    for (const node of this.hintNodes) {
      this.scene.tweens.killTweensOf(node);
      if (node.active) node.setAngle(0);
    }
    this.hintNodes = [];
  }

  // ---------- events ----------

  private async step(ev: BoardEvent): Promise<void> {
    switch (ev.type) {
      case 'swap':
        playSfx('swap');
        await this.exchange(ev.a, ev.b, TUNING.swapMs);
        return;
      case 'swapBack': {
        // The swap already moved the pieces; they go back and jiggle.
        playSfx('bad');
        await this.exchange(ev.b, ev.a, TUNING.swapMs);
        const A = this.localOf(ev.a);
        const B = this.localOf(ev.b);
        await Promise.all([
          this.tweenP(this.nodeAt(ev.a), { x: A.x + 5, yoyo: true, repeat: 1, duration: this.d(40) }),
          this.tweenP(this.nodeAt(ev.b), { x: B.x - 5, yoyo: true, repeat: 1, duration: this.d(40) }),
        ]);
        return;
      }
      case 'match':
        playMatch(ev.cascade);
        await Promise.all(ev.cells.map((p) => this.tweenP(this.nodeAt(p), { scale: 1.2, yoyo: true, duration: this.d(110) })));
        return;
      case 'clear':
        return;
      case 'activate':
        await this.activate(ev);
        return;
      case 'combo':
        await this.combo(ev);
        return;
      case 'specialCreated':
        await this.specialCreated(ev.at, ev.piece);
        return;
      case 'weeds':
        this.weedsEvent(ev.at, ev.left);
        return;
      case 'stone':
        this.stoneEvent(ev.at, ev.left);
        return;
      case 'gnomeSaved':
        await this.gnomeSaved(ev.at, ev.pieceId);
        return;
      case 'fall':
        await this.fall(ev.moves, ev.spawns);
        return;
      case 'shuffle':
        await this.shuffle(ev.pieces);
        return;
      case 'cascadeEnd':
        this.cascadeEnd(ev.cascade);
        return;
    }
  }

  /** Pop a cleared piece away. Resolves when the pop is over. */
  private clear(ev: Clear): Promise<void> {
    const node = this.nodes.get(ev.pieceId);
    this.nodes.delete(ev.pieceId);
    this.sigs.delete(ev.pieceId);
    const c = this.cellCenter(ev.at);
    burst(this.scene, c.x, c.y, kindColor(ev.kind), 14);
    if (!node) return Promise.resolve();
    return this.tweenP(node, { scale: 1.3, duration: this.d(TUNING.clearMs * 0.4), ease: 'Sine.easeOut' })
      .then(() => this.tweenP(node, { scale: 0, alpha: 0, duration: this.d(TUNING.clearMs * 0.6), ease: 'Back.easeIn' }))
      .then(() => this.destroyNode(node));
  }

  /** Two pieces trade places (or come back, for swapBack). */
  private exchange(a: Pos, b: Pos, ms: number): Promise<void> {
    const A = this.localOf(a);
    const B = this.localOf(b);
    const ease = 'Sine.easeInOut';
    return Promise.all([
      this.tweenP(this.nodeAt(a), { x: B.x, y: B.y, duration: this.d(ms), ease }),
      this.tweenP(this.nodeAt(b), { x: A.x, y: A.y, duration: this.d(ms), ease }),
    ]).then(() => undefined);
  }

  private async activate(ev: Extract<BoardEvent, { type: 'activate' }>): Promise<void> {
    const { scene } = this;
    switch (ev.special) {
      case 'mowerH':
        await this.sweep('h', ev.at);
        return;
      case 'mowerV':
        await this.sweep('v', ev.at);
        return;
      case 'bomb':
        playSfx('bomb');
        shake(scene, 0.012, 220);
        flash(scene, GOLD, 0.25);
        this.ring(ev.at, 0.3, 2, GOLD, 400);
        return;
      case 'bee': {
        playSfx('bee');
        if (!ev.target) return;
        const to = this.cellCenter(ev.target);
        await flyTo(scene, TEX.bee, this.cellCenter(ev.at), to, this.d(520), (this.cell * 0.9) / scene.textures.getFrame(TEX.bee).realWidth);
        burst(scene, to.x, to.y, GOLD, 10);
        return;
      }
      case 'prism':
        this.beams(ev.at, ev.cells);
        await wait(scene, this.d(200));
        return;
    }
  }

  private async combo(ev: Extract<BoardEvent, { type: 'combo' }>): Promise<void> {
    const { scene } = this;
    const c = this.boardCentre();
    floatText(scene, c.x, c.y, 'COMBO!', { size: 64 });
    shake(scene, 0.016, 300);
    flash(scene, 0xffffff, 0.4);
    if (isMower(ev.a) && isMower(ev.b)) {
      await Promise.all([this.sweep('h', ev.at), this.sweep('v', ev.at)]);
      return;
    }
    const top = RANK[ev.a] >= RANK[ev.b] ? ev.a : ev.b;
    if (top === 'mowerH') await this.sweep('h', ev.at);
    else if (top === 'mowerV') await this.sweep('v', ev.at);
    else if (top === 'bomb') {
      playSfx('bomb');
      this.ring(ev.at, 0.3, 3.5, GOLD, 500);
    } else if (top === 'bee') {
      playSfx('bee');
      this.ring(ev.at, 0.3, 3.5, GOLD, 500);
    } else this.beams(ev.at, ev.cells);
  }

  private async specialCreated(at: Pos, piece: Piece): Promise<void> {
    const node = this.addNode(piece, at);
    node.setScale(0);
    playSfx('special');
    const c = this.cellCenter(at);
    burst(this.scene, c.x, c.y, GOLD, 14);
    floatText(this.scene, c.x, c.y, LABEL[piece.special ?? 'prism'], { size: 22 });
    await this.tweenP(node, { scale: 1.25, duration: this.d(120), ease: 'Sine.easeOut' });
    await this.tweenP(node, { scale: 1, duration: this.d(80) });
  }

  private weedsEvent(at: Pos, left: number): void {
    const i = this.idx(at);
    this.weedImgs.get(i)?.destroy();
    this.weedImgs.delete(i);
    if (left > 0) {
      const L = this.localOf(at);
      const img = this.scene.add
        .image(L.x, L.y, left >= 2 ? TEX.weeds2 : TEX.weeds1)
        .setDisplaySize(this.cell, this.cell);
      this.layers.weeds.add(img);
      this.weedImgs.set(i, img);
    }
    const c = this.cellCenter(at);
    const puff = this.scene.add.particles(c.x, c.y, TEX.leaf, {
      speed: { min: 60, max: 160 },
      angle: { min: 0, max: 360 },
      lifespan: 500,
      scale: { start: 1, end: 0.3 },
      tint: CLIPPING_GREEN,
      emitting: false,
    });
    puff.setDepth(1000);
    puff.explode(10, c.x, c.y);
    this.scene.time.delayedCall(560, () => puff.destroy());
    playSfx('weeds');
  }

  private stoneEvent(at: Pos, left: number): void {
    const i = this.idx(at);
    this.stoneImgs.get(i)?.destroy();
    this.stoneImgs.delete(i);
    if (left > 0) {
      const L = this.localOf(at);
      const img = this.scene.add
        .image(L.x, L.y, left >= 2 ? TEX.stone2 : TEX.stone1)
        .setDisplaySize(this.cell, this.cell);
      this.layers.stones.add(img);
      this.stoneImgs.set(i, img);
    }
    const c = this.cellCenter(at);
    burst(this.scene, c.x, c.y, STONE_GREY, 18);
    shake(this.scene, 0.003);
    playSfx('stone');
  }

  private async gnomeSaved(at: Pos, pieceId: number): Promise<void> {
    const node = this.nodes.get(pieceId);
    this.nodes.delete(pieceId);
    this.sigs.delete(pieceId);
    playSfx('gnome');
    const c = this.cellCenter(at);
    floatText(this.scene, c.x, c.y, 'Saved!', { color: css(COLORS.good) });
    if (!node) return;
    await this.tweenP(node, { y: this.localOf(at).y - this.cell * 1.5, duration: this.d(200), ease: 'Sine.easeOut' });
    // The spin-away runs on while the next fall starts.
    void this.tweenP(node, {
      y: -this.rect.y - this.cell * 2,
      angle: 720,
      alpha: 0,
      duration: this.d(600),
      ease: 'Sine.easeIn',
    }).then(() => this.destroyNode(node));
  }

  private fall(moves: { id: number; from: Pos; to: Pos }[], spawns: { piece: Piece; to: Pos; dropRows: number }[]): Promise<void> {
    const waits: Promise<void>[] = [];
    for (const m of moves) {
      const rows = Math.max(1, Math.abs(m.to.r - m.from.r));
      waits.push(
        this.tweenP(this.nodes.get(m.id), {
          ...this.localOf(m.to),
          duration: this.d(TUNING.fallMsPerRow * rows),
          ease: 'Bounce.easeOut',
        }),
      );
    }
    for (const s of spawns) {
      const node = this.addNode(s.piece, s.to);
      node.y -= s.dropRows * this.cell;
      waits.push(
        this.tweenP(node, {
          ...this.localOf(s.to),
          duration: this.d(TUNING.fallMsPerRow * Math.max(1, s.dropRows)),
          ease: 'Bounce.easeOut',
        }),
      );
    }
    return Promise.all(waits).then(() => undefined);
  }

  private async shuffle(pieces: { id: number; to: Pos }[]): Promise<void> {
    const c = this.boardCentre();
    floatText(this.scene, c.x, c.y, 'Shuffle!');
    await Promise.all(
      pieces.map(({ id, to }) => this.tweenP(this.nodes.get(id), { ...this.localOf(to), duration: this.d(350) })),
    );
  }

  private cascadeEnd(cascade: number): void {
    if (cascade < 1) return;
    const c = this.boardCentre();
    const word = COMBO_WORDS[Math.min(cascade, COMBO_WORDS.length - 1)];
    const hue = KIND_HEX[cascade % KIND_HEX.length];
    floatText(this.scene, c.x, c.y, word, { size: 40 + 10 * cascade, color: css(hue) });
    if (cascade >= 3) {
      shake(this.scene, 0.006);
      burst(this.scene, c.x, c.y, hue, 40);
    }
  }

  /** A mower drives across its row (h) or column (v), from just outside one edge to the other. */
  private sweep(dir: 'h' | 'v', at: Pos): Promise<void> {
    const { rows, cols } = this.board;
    const from = dir === 'h' ? this.screenAt(-1, at.r) : this.screenAt(at.c, -1);
    const to = dir === 'h' ? this.screenAt(cols, at.r) : this.screenAt(at.c, rows);
    shake(this.scene, 0.004);
    return mowerSweep(this.scene, from, to, this.d(420));
  }

  /** Rainbow beams from `at` to each cell (at most 20). */
  private beams(at: Pos, cells: Pos[]): void {
    playSfx('prism');
    const from = this.cellCenter(at);
    for (const p of cells.slice(0, 20)) beam(this.scene, from, this.cellCenter(p));
    flash(this.scene, 0xffffff, 0.3);
  }

  /** An expanding ring around a cell, in board layer space. */
  private ring(at: Pos, fromCells: number, toCells: number, color: number, ms: number): void {
    const L = this.localOf(at);
    const g = this.scene.add.graphics();
    this.layers.fx.add(g);
    const p = { t: 0 };
    this.scene.tweens.add({
      targets: p,
      t: 1,
      duration: this.d(ms),
      ease: 'Sine.easeOut',
      onUpdate: () => {
        g.clear();
        g.lineStyle(4, color, 1 - p.t);
        g.strokeCircle(L.x, L.y, this.cell * (fromCells + (toCells - fromCells) * p.t));
      },
      onComplete: () => g.destroy(),
    });
  }

  // ---------- sprites ----------

  /** Rebuild the static layers from `board`, make sprites match its pieces, then snap them to their cells. */
  private resync(board: Board): void {
    if (this.destroyed) return;
    this.clearHint();
    this.board = board;
    const rebuild = this.cell !== this.builtCell;
    this.builtCell = this.cell;

    this.layers.cells.removeAll(true);
    this.layers.weeds.removeAll(true);
    this.layers.stones.removeAll(true);
    this.weedImgs.clear();
    this.stoneImgs.clear();
    board.cells.forEach((cs, i) => {
      if (!cs.live) return;
      const p = this.posOf(i);
      const L = this.localOf(p);
      const tex = (p.r + p.c) % 2 === 0 ? TEX.cellLight : TEX.cellDark;
      this.layers.cells.add(this.scene.add.image(L.x, L.y, tex).setDisplaySize(this.cell, this.cell));
      if (cs.weeds > 0) {
        const img = this.scene.add.image(L.x, L.y, cs.weeds >= 2 ? TEX.weeds2 : TEX.weeds1);
        this.layers.weeds.add(img.setDisplaySize(this.cell, this.cell));
        this.weedImgs.set(i, img);
      }
      if (cs.stone > 0) {
        const img = this.scene.add.image(L.x, L.y, cs.stone >= 2 ? TEX.stone2 : TEX.stone1);
        this.layers.stones.add(img.setDisplaySize(this.cell, this.cell));
        this.stoneImgs.set(i, img);
      }
    });

    const onBoard = new Map<number, { piece: Piece; p: Pos }>();
    board.cells.forEach((cs, i) => {
      if (cs.piece) onBoard.set(cs.piece.id, { piece: cs.piece, p: this.posOf(i) });
    });
    for (const [id, node] of this.nodes) {
      if (!onBoard.has(id)) {
        this.destroyNode(node);
        this.nodes.delete(id);
        this.sigs.delete(id);
      }
    }
    for (const [id, { piece, p }] of onBoard) {
      const node = this.nodes.get(id);
      if (node && !rebuild && this.sigs.get(id) === pieceSig(piece)) {
        this.scene.tweens.killTweensOf(node);
        const L = this.localOf(p);
        node.setPosition(L.x, L.y).setAngle(0).setAlpha(1);
      } else {
        this.addNode(piece, p);
      }
    }
    this.paintSelection();
  }

  /** Create the sprite for `piece` at cell `at`, replacing any sprite already held for its id. */
  private addNode(piece: Piece, at: Pos): Node {
    const old = this.nodes.get(piece.id);
    if (old) this.destroyNode(old);
    const node = makePieceSprite(this.scene, piece, this.cell);
    const L = this.localOf(at);
    node.setPosition(L.x, L.y);
    this.layers.pieces.add(node);
    this.nodes.set(piece.id, node);
    this.sigs.set(piece.id, pieceSig(piece));
    return node;
  }

  private destroyNode(node: Node): void {
    this.scene.tweens.killTweensOf(node);
    node.each((child: Phaser.GameObjects.GameObject) => this.scene.tweens.killTweensOf(child));
    node.destroy();
  }

  /** The sprite now drawn on cell `p`, if any. */
  private nodeAt(p: Pos): Node | undefined {
    const L = this.localOf(p);
    for (const node of this.nodes.values()) {
      if (Math.abs(node.x - L.x) < 0.5 && Math.abs(node.y - L.y) < 0.5) return node;
    }
    return undefined;
  }

  // ---------- helpers ----------

  private d(ms: number): number {
    return ms / this.speed;
  }

  /** Tween one sprite; resolves on completion. Resolves at once when there is no sprite. */
  private tweenP(node: Node | undefined, props: TweenProps): Promise<void> {
    if (!node || this.destroyed || !node.active) return Promise.resolve();
    return new Promise((res) => {
      this.scene.tweens.add({ ...props, targets: node, onComplete: () => res() });
    });
  }

  private idx(p: Pos): number {
    return p.r * this.board.cols + p.c;
  }

  private posOf(i: number): Pos {
    return { r: Math.floor(i / this.board.cols), c: i % this.board.cols };
  }

  private inBoard(p: Pos): boolean {
    return p.r >= 0 && p.c >= 0 && p.r < this.board.rows && p.c < this.board.cols;
  }

  private cellAtScreen(x: number, y: number): Pos | null {
    const p = { c: Math.floor((x - this.rect.x) / this.cell), r: Math.floor((y - this.rect.y) / this.cell) };
    return this.inBoard(p) ? p : null;
  }

  /** Position of a cell inside the board's layers (origin at the board's top-left). */
  private localOf(p: Pos): XY {
    return { x: (p.c + 0.5) * this.cell, y: (p.r + 0.5) * this.cell };
  }

  /** Screen position of a (possibly fractional or off-board) cell. */
  private screenAt(c: number, r: number): XY {
    return { x: this.rect.x + (c + 0.5) * this.cell, y: this.rect.y + (r + 0.5) * this.cell };
  }

  private boardCentre(): XY {
    return this.screenAt(this.board.cols / 2 - 0.5, this.board.rows / 2 - 0.5);
  }
}

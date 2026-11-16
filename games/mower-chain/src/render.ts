// Draws a Snapshot into a Phaser scene and drives the scene's main camera. Owns every game object it creates.
import type Phaser from 'phaser';
import { TEX, TUNING, type MowerSnap, type Snapshot } from './config';

const W = TUNING.WORLD_SIZE;
const FENCE_COLOR = 0x5d3a1a;
const FENCE_THICKNESS = 24;
const BG_COLOR = 0x1d3d1d;
const PELLET_MARGIN = 50;
const BLINK_HZ = 4;
const CAM_EASE = 0.15;          // camera follow fraction per 60 Hz frame
const MINI_SIZE = 120;
const MINI_MARGIN = 12;
const DEFAULT_GAP_MS = 66;

interface MowerGfx {
  segs: Phaser.GameObjects.Image[];
  puffs: Phaser.GameObjects.Image[];
  label: Phaser.GameObjects.Text;
  name: string;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Draws a Snapshot into a Phaser scene and drives the scene's main camera. Owns every game object it creates. */
export class ArenaView {
  private readonly scene: Phaser.Scene;
  private readonly cam: Phaser.Cameras.Scene2D.Camera;
  private readonly mini: Phaser.Cameras.Scene2D.Camera;
  private readonly miniG: Phaser.GameObjects.Graphics;
  /** Every object this view created, destroyed in destroy(). */
  private readonly created: Phaser.GameObjects.GameObject[] = [];
  private readonly pellets: Phaser.GameObjects.Image[] = [];
  private readonly mowers = new Map<number, MowerGfx>();

  private cur: Snapshot | null = null;
  private prevSegs = new Map<number, number[]>();
  private curSegs = new Map<number, number[]>();
  private gapMs = DEFAULT_GAP_MS;
  private sinceSnap = 0;

  private camX = W / 2;
  private camY = W / 2;
  private zoom = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.cam = scene.cameras.main;
    this.cam.setBackgroundColor(BG_COLOR);

    // Minimap: a second camera that shows only the minimap graphics. Created first, since own() uses it.
    this.mini = scene.cameras.add(0, 0, MINI_SIZE, MINI_SIZE);
    this.mini.setZoom(MINI_SIZE / W);
    this.mini.centerOn(W / 2, W / 2);
    this.miniG = scene.add.graphics().setDepth(10);
    this.created.push(this.miniG);
    this.cam.ignore(this.miniG);

    // Lawn: one big tile sprite covering the arena.
    this.own(scene.add.tileSprite(0, 0, W, W, TEX.tile).setOrigin(0, 0).setDepth(0));

    // Fences just outside the arena: a stroke centred 12 px outside each edge, 24 px thick.
    const fence = scene.add.graphics().setDepth(1);
    fence.lineStyle(FENCE_THICKNESS, FENCE_COLOR, 1);
    fence.strokeRect(-FENCE_THICKNESS / 2, -FENCE_THICKNESS / 2, W + FENCE_THICKNESS, W + FENCE_THICKNESS);
    this.own(fence);
  }

  /** Call every frame. meId = my mower id (camera follows its head), or null to watch the middle of the arena. dtMs = frame time. */
  update(snap: Snapshot, meId: number | null, dtMs: number): void {
    // New snapshot? Remember the previous one and the measured gap between them.
    if (!this.cur || snap.t !== this.cur.t) {
      if (this.cur) {
        this.gapMs = clamp(snap.t - this.cur.t, 30, 200);
        this.prevSegs = this.curSegs;
      }
      this.curSegs = new Map();
      for (const m of snap.mowers) this.curSegs.set(m.id, m.segs);
      this.cur = snap;
      this.sinceSnap = 0;
    }
    this.sinceSnap += dtMs;
    const k = clamp(this.sinceSnap / this.gapMs, 0, 1);
    const nowSec = performance.now() / 1000;
    const frameK = 1 - Math.pow(1 - CAM_EASE, dtMs / (1000 / 60));

    // Interpolated segment lists for every living mower.
    const interp = new Map<number, number[]>();
    for (const m of snap.mowers) {
      if (m.alive) interp.set(m.id, this.interpSegs(m, k));
    }

    this.drawPellets(snap.pellets);

    const seen = new Set<number>();
    for (const m of snap.mowers) {
      if (!m.alive) continue;
      seen.add(m.id);
      this.drawMower(this.mowerGfx(m.id), m, interp.get(m.id) as number[], nowSec);
    }
    for (const [id, g] of this.mowers) {
      if (!seen.has(id)) this.hideMower(g);
    }

    this.updateCamera(snap, meId, interp, frameK);
    this.drawMinimap(snap, meId, interp);
  }

  /** Destroys every object and camera this view created. */
  destroy(): void {
    for (const o of this.created) o.destroy();
    this.created.length = 0;
    this.pellets.length = 0;
    this.mowers.clear();
    this.scene.cameras.remove(this.mini, true);
    this.cam.setZoom(1);
  }

  /** Registers an object so the minimap camera ignores it and destroy() removes it. */
  private own<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.mini.ignore(o);
    this.created.push(o);
    return o;
  }

  /** Segment positions, linearly interpolated from the previous snapshot where the mower existed. */
  private interpSegs(m: MowerSnap, k: number): number[] {
    const prev = this.prevSegs.get(m.id);
    if (!prev || k >= 1) return m.segs;
    const out = new Array<number>(m.segs.length);
    for (let i = 0; i < m.segs.length; i++) {
      out[i] = i < prev.length ? prev[i] + (m.segs[i] - prev[i]) * k : m.segs[i];
    }
    return out;
  }

  private drawPellets(pel: number[]): void {
    const v = this.cam.worldView;
    const left = v.x - PELLET_MARGIN;
    const top = v.y - PELLET_MARGIN;
    const right = v.x + v.width + PELLET_MARGIN;
    const bottom = v.y + v.height + PELLET_MARGIN;
    let n = 0;
    for (let i = 0; i + 2 < pel.length; i += 3) {
      const x = pel[i];
      const y = pel[i + 1];
      if (x < left || x > right || y < top || y > bottom) continue;
      const img = this.pelletImage(n++);
      const key = pel[i + 2] === 1 ? TEX.gold : TEX.grass;
      if (img.texture.key !== key) img.setTexture(key);
      img.setPosition(x, y).setVisible(true);
    }
    for (let j = n; j < this.pellets.length; j++) this.pellets[j].setVisible(false);
  }

  private pelletImage(i: number): Phaser.GameObjects.Image {
    while (this.pellets.length <= i) {
      this.pellets.push(this.own(this.scene.add.image(0, 0, TEX.grass).setDepth(2).setVisible(false)));
    }
    return this.pellets[i];
  }

  private mowerGfx(id: number): MowerGfx {
    let g = this.mowers.get(id);
    if (!g) {
      g = {
        segs: [],
        puffs: [],
        label: this.own(
          this.scene.add
            .text(0, 0, '', {
              fontFamily: 'system-ui, sans-serif',
              fontSize: '14px',
              fontStyle: 'bold',
              color: '#ffffff',
              stroke: '#000000',
              strokeThickness: 3,
            })
            .setOrigin(0.5, 1)
            .setDepth(4)
            .setVisible(false),
        ),
        name: '',
      };
      this.mowers.set(id, g);
    }
    return g;
  }

  private drawMower(g: MowerGfx, m: MowerSnap, segs: number[], nowSec: number): void {
    const n = segs.length >> 1;
    const blink = m.protectedS > 0 ? 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(nowSec * Math.PI * 2 * BLINK_HZ)) : 1;

    while (g.segs.length < n) {
      g.segs.push(this.own(this.scene.add.image(0, 0, TEX.body).setDepth(3)));
    }

    // Direction of each segment: from the next segment toward this one. Last copies the one before it.
    const angles = new Array<number>(n).fill(0);
    for (let i = 0; i < n - 1; i++) {
      angles[i] = Math.atan2(segs[2 * i + 1] - segs[2 * i + 3], segs[2 * i] - segs[2 * i + 2]);
    }
    if (n >= 2) angles[n - 1] = angles[n - 2];

    // Back to front, so the head is drawn on top.
    for (let i = n - 1; i >= 0; i--) {
      const img = g.segs[i];
      const key = i === 0 ? TEX.head : TEX.body;
      if (img.texture.key !== key) img.setTexture(key);
      img.setPosition(segs[2 * i], segs[2 * i + 1]);
      img.setRotation(angles[i]);
      img.setScale(i === 0 ? 1 : 0.85);
      img.setTint(m.color);
      img.setAlpha(blink);
      img.setDepth(3 + 0.5 * (1 - i / n));
      img.setVisible(true);
    }
    for (let i = n; i < g.segs.length; i++) g.segs[i].setVisible(false);

    // Boost puffs behind the tail.
    if (m.boosting && n >= 1) {
      const tx = segs[2 * (n - 1)];
      const ty = segs[2 * (n - 1) + 1];
      const a = angles[n - 1];
      const count = 3;
      while (g.puffs.length < count) {
        g.puffs.push(this.own(this.scene.add.image(0, 0, TEX.grass).setTint(0x9a9a9a).setDepth(2.5)));
      }
      for (let j = 0; j < count; j++) {
        const d = 6 + j * 8 + Math.sin(nowSec * 10 + j) * 2;
        g.puffs[j]
          .setPosition(tx + Math.cos(a) * d, ty + Math.sin(a) * d)
          .setScale(0.8 + j * 0.25)
          .setAlpha(0.45 * (1 - j * 0.25) * blink)
          .setVisible(true);
      }
    } else {
      for (const p of g.puffs) p.setVisible(false);
    }

    // Name label above the head.
    if (g.name !== m.name) {
      g.label.setText(m.name);
      g.name = m.name;
    }
    g.label.setPosition(segs[0], segs[1] - 28).setVisible(true);
  }

  private hideMower(g: MowerGfx): void {
    for (const img of g.segs) img.setVisible(false);
    for (const p of g.puffs) p.setVisible(false);
    g.label.setVisible(false);
  }

  private updateCamera(snap: Snapshot, meId: number | null, interp: Map<number, number[]>, frameK: number): void {
    const cam = this.cam;
    const mine = meId !== null ? snap.mowers.find((m) => m.id === meId && m.alive) : undefined;
    const mineSegs = mine ? (interp.get(mine.id) as number[]) : null;

    const tx = mineSegs ? mineSegs[0] : W / 2;
    const ty = mineSegs ? mineSegs[1] : W / 2;
    this.camX += (tx - this.camX) * frameK;
    this.camY += (ty - this.camY) * frameK;

    const base = Math.min(cam.width, cam.height) / TUNING.VIEW_UNITS;
    const count = mineSegs ? mineSegs.length >> 1 : 0;
    const targetZoom = Math.max(0.45 * base, base / (1 + 0.12 * Math.log2(1 + count / 10)));
    this.zoom = this.zoom < 0 ? targetZoom : this.zoom + (targetZoom - this.zoom) * frameK;

    cam.setZoom(this.zoom);
    cam.centerOn(this.camX, this.camY);
  }

  private drawMinimap(snap: Snapshot, meId: number | null, interp: Map<number, number[]>): void {
    const cam = this.cam;
    this.mini.setViewport(cam.width - MINI_SIZE - MINI_MARGIN, cam.height - MINI_SIZE - MINI_MARGIN, MINI_SIZE, MINI_SIZE);

    const z = MINI_SIZE / W;           // screen px -> world units is 1 / z
    const g = this.miniG;
    g.clear();
    g.fillStyle(0x000000, 0.45);
    g.fillRect(0, 0, W, W);
    g.lineStyle(1.5 / z, 0xffffff, 0.8);
    g.strokeRect(0, 0, W, W);

    for (const m of snap.mowers) {
      if (!m.alive) continue;
      const segs = interp.get(m.id) as number[];
      const x = segs[0];
      const y = segs[1];
      if (m.id === meId) {
        g.fillStyle(0xffffff, 1);
        g.fillCircle(x, y, 4 / z);
        g.lineStyle(1.5 / z, 0xffffff, 1);
        g.strokeCircle(x, y, 7 / z);
      } else {
        g.fillStyle(m.color, 1);
        g.fillCircle(x, y, 2.5 / z);
      }
    }
  }
}

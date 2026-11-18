// The gnome house hub: the current area in makeover view, star and coin counters, the client, and "Play Level N".
import Phaser from 'phaser';
import { burst, confetti, fireworks, floatText, flyTo, rays } from '../fx';
import { isMuted, playSfx, setMuted } from '../audio';
import { LEVELS } from '../levels';
import { COLORS, SCENES, TEX, TUNING, type HouseSceneData, type LevelSceneData } from '../config';
import { loadSave, updateSave, type SaveData } from '../save';
import { fitBox, safeRect, type Rect } from '../layout';
import { BACKDROP, DRAW, drawJunk } from '../house/houseArt';
import { AREA_H, AREA_W, AREAS, areaDone, currentArea, type HouseArea, type HouseSlot } from '../house/houseData';
import type { BoosterKind, GoalDef } from '../engine/types';
import { button, drawGnome, drawPanel, fsz, txt } from './houseUi';

interface Layout {
  portrait: boolean;
  top: Rect;
  area: Rect;
  client: Rect;
  button: Rect;
}

/** Counter values before a won level's stars and coins fly in. */
interface Pre {
  stars: number;
  coins: number;
  starsEarned: number;
  coinsEarned: number;
}

interface XY {
  x: number;
  y: number;
}

/** A built slot's sway state: its item Graphics (pivot at the base), and a fallback shadow if filters are unavailable. */
interface WaveFx {
  g: Phaser.GameObjects.Graphics;
  sh?: Phaser.GameObjects.Graphics;
  /** Sway amplitude in degrees, before reduced-motion scaling. */
  amp: number;
  phase: number;
}

const BIG_SWAY = new Set(['tree', 'flowerbed', 'lanterns', 'lamp', 'curtains']);
const STILL = new Set(['roof', 'fence', 'path', 'rug', 'fireplace', 'cupboard', 'stove', 'windows', 'door', 'chimney']);

/** Sway amplitude in degrees for an art key: plants and lights move most, big structures barely at all. */
function swayAmp(art: string): number {
  if (BIG_SWAY.has(art)) return 3;
  if (STILL.has(art)) return 0.6;
  return 1.6;
}

function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

const BOOSTERS: { kind: BoosterKind; name: string; tex: string }[] = [
  { kind: 'mower', name: 'Mower', tex: TEX.mowerH },
  { kind: 'bomb', name: 'Seed Bomb', tex: TEX.bomb },
  { kind: 'prism', name: 'Prism', tex: TEX.prism },
];

/** Portrait: bar, area, client strip, button stacked. Landscape: left column (bar, area), right column (client, button). */
function layoutFor(W: number, H: number): Layout {
  const s = safeRect(W, H);
  if (s.h >= s.w * 1.1) {
    const topH = Math.round(Math.min(96, Math.max(76, s.h * 0.1)));
    const btnH = Math.round(Math.min(104, Math.max(72, s.h * 0.11)));
    const clientH = Math.round(Math.min(130, Math.max(96, s.h * 0.15)));
    const top = { x: s.x, y: s.y, w: s.w, h: topH };
    const button = { x: s.x, y: s.y + s.h - btnH, w: s.w, h: btnH };
    const client = { x: s.x, y: button.y - clientH, w: s.w, h: clientH };
    const area = { x: s.x, y: s.y + topH, w: s.w, h: client.y - (s.y + topH) };
    return { portrait: true, top, area, client, button };
  }
  const rw = Math.round(Math.min(340, Math.max(200, s.w * 0.3)));
  const lw = s.w - rw - 8;
  const topH = Math.round(Math.min(64, Math.max(52, s.h * 0.16)));
  const rx = s.x + lw + 8;
  const btnH = Math.round(Math.min(120, Math.max(72, s.h * 0.3)));
  return {
    portrait: false,
    top: { x: s.x, y: s.y, w: lw, h: topH },
    area: { x: s.x, y: s.y + topH, w: lw, h: s.h - topH },
    client: { x: rx, y: s.y, w: rw, h: s.h - btnH - 8 },
    button: { x: rx, y: s.y + s.h - btnH, w: rw, h: btnH },
  };
}

function goalTex(g: GoalDef): string {
  switch (g.type) {
    case 'collect':
      return TEX.tile[g.kind];
    case 'weeds':
      return TEX.weeds2;
    case 'stones':
      return TEX.stone2;
    case 'gnomes':
      return TEX.gnome;
  }
}

export class HouseScene extends Phaser.Scene {
  /** A won level to animate on the next build (set in init, used once in create). */
  private win: HouseSceneData | undefined;
  private areaIdx = 0;
  private root!: Phaser.GameObjects.Container;
  private modal: Phaser.GameObjects.Container | undefined;
  /** Builds the open modal again, so it survives a resize. */
  private rebuildModal: ((m: Phaser.GameObjects.Container) => void) | null = null;
  /** Boosters toggled on in the pre-level popup. */
  private sel: BoosterKind[] = [];
  /** Where the area's design space sits on screen. */
  private box = { x: 0, y: 0, scale: 1 };
  /** Sway state of each built slot, by slot id. */
  private wave = new Map<string, WaveFx>();
  /** Slots mid-tween (build drop-in or restyle spin): the wave skips them. */
  private tweening = new Set<string>();
  /** Scales the sway: 1, or 0.25 with prefers-reduced-motion. */
  private motion = 1;
  private tweenList: Phaser.Tweens.Tween[] = [];
  private playBtn: Phaser.GameObjects.Container | undefined;
  private starTxt: Phaser.GameObjects.Text | undefined;
  private coinTxt: Phaser.GameObjects.Text | undefined;
  private starPos: XY = { x: 0, y: 0 };
  private coinPos: XY = { x: 0, y: 0 };

  constructor() {
    super(SCENES.house);
  }

  init(data?: HouseSceneData): void {
    this.win = data?.wonLevel !== undefined ? data : undefined;
  }

  create(): void {
    this.closeModal();
    this.areaIdx = this.pickIndex();
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);
      this.events.off('update', this.onWave, this);
    });
    const win = this.win;
    this.win = undefined;
    this.buildRoot(win);
  }

  private onResize = (): void => {
    this.buildRoot();
    const f = this.rebuildModal;
    if (f) this.openModal(f);
  };

  /** The first area with an unbuilt slot, or the last area once the house is done. */
  private pickIndex(): number {
    const cur = currentArea(loadSave().house);
    return cur ? AREAS.indexOf(cur) : AREAS.length - 1;
  }

  /** Destroys and rebuilds the whole view. Modals are separate and stay open. */
  private buildRoot(win?: HouseSceneData): void {
    this.tweenList.forEach((t) => t.stop());
    this.tweenList = [];
    this.tweening.clear();
    this.wave.clear();
    this.events.off('update', this.onWave, this);
    this.motion = reducedMotion() ? 0.25 : 1;
    this.root?.destroy(true);
    this.root = this.add.container(0, 0);
    const W = this.scale.width;
    const H = this.scale.height;
    const lay = layoutFor(W, H);
    const s = loadSave();
    const area = AREAS[this.areaIdx];
    const pre: Pre | null = win
      ? {
          stars: s.stars - (win.starsEarned ?? 0),
          coins: s.coins - (win.coinsEarned ?? 0),
          starsEarned: win.starsEarned ?? 0,
          coinsEarned: win.coinsEarned ?? 0,
        }
      : null;
    this.topBar(lay, area, s, pre);
    this.areaView(lay.area, area, s);
    this.clientPanel(lay.client, area, areaDone(area, s.house));
    this.playButton(lay.button, s);
    if (pre) this.flyIn(W, H, pre);
    this.events.on('update', this.onWave, this);
  }

  /** Each built item sways around its base and breathes, out of phase with its neighbours. */
  private onWave = (time: number): void => {
    const t = time / 1000;
    const k = this.motion;
    for (const [id, w] of this.wave) {
      if (this.tweening.has(id)) continue;
      const sway = Math.sin(t * 1.3 + w.phase);
      const breathe = Math.sin(t * 2 + w.phase);
      const sx = 1 - 0.008 * k * breathe;
      const sy = 1 + 0.015 * k * breathe;
      for (const o of w.sh ? [w.g, w.sh] : [w.g]) {
        o.setAngle(w.amp * k * sway);
        o.setScale(sx, sy);
      }
    }
  };

  /**
   * A soft drop shadow to the lower right, on the slot Graphics itself when WebGL filters work.
   * Returns false when they do not; the caller then draws a fallback shadow behind the item.
   */
  private addShadow(g: Phaser.GameObjects.Graphics): boolean {
    if (this.game.renderer.type !== Phaser.WEBGL) return false;
    try {
      g.enableFilters();
      // The shadow samples toward (x, y), so negative offsets cast it to the lower right.
      g.filters?.internal.addShadow(-0.035, -0.05, 0.12, 1, 0x000000, 6, 0.35);
      return true;
    } catch {
      return false;
    }
  }

  // ---- top bar ----------------------------------------------------------------------------

  private topBar(lay: Layout, area: HouseArea, s: SaveData, pre: Pre | null): void {
    const r = lay.top;
    const pillH = 36;
    const pillW = Math.round(Math.max(96, Math.min(120, r.w * 0.27)));
    const y1 = r.y + (lay.portrait ? 24 : r.h / 2);
    const size = fsz(this, 0.05);
    this.starTxt = this.pill(r.x + 8, y1 - pillH / 2, pillW, pillH, TEX.star, pre ? pre.stars : s.stars, size);
    this.coinTxt = this.pill(r.x + 16 + pillW, y1 - pillH / 2, pillW, pillH, TEX.coin, pre ? pre.coins : s.coins, size);
    this.starPos = { x: r.x + 8 + pillH / 2, y: y1 };
    this.coinPos = { x: r.x + 16 + pillW + pillH / 2, y: y1 };

    button(this, this.root, r.x + r.w - 26, y1, 44, 44, isMuted() ? '×' : '♪', COLORS.panel, fsz(this, 0.06), () => {
      setMuted(!isMuted());
      this.buildRoot();
    });

    const built = area.slots.filter((sl) => s.house[sl.id] !== undefined).length;
    const label = `${area.name}  ${built}/${area.slots.length}`;
    const left = r.x + 16 + pillW * 2;
    const right = r.x + r.w - 52;
    if (lay.portrait) {
      txt(this, this.root, r.x + r.w / 2, r.y + r.h - 18, label, fsz(this, 0.045), { bold: true, color: COLORS.accent });
    } else {
      txt(this, this.root, (left + right) / 2, r.y + r.h / 2, label, fsz(this, 0.045), { bold: true, color: COLORS.accent });
    }
  }

  private pill(x: number, y: number, w: number, h: number, tex: string, value: number, size: number): Phaser.GameObjects.Text {
    const g = this.add.graphics();
    drawPanel(g, x, y, w, h, COLORS.panel, COLORS.accentNum, 2, h / 2);
    this.root.add(g);
    this.root.add(this.add.image(x + h / 2, y + h / 2, tex).setDisplaySize(h - 8, h - 8));
    return txt(this, this.root, x + h + 2, y + h / 2, String(value), Math.min(size, Math.round(h * 0.55)), { bold: true, ox: 0 });
  }

  // ---- area view --------------------------------------------------------------------------

  private areaView(r: Rect, area: HouseArea, s: SaveData): void {
    const fit = fitBox(r, AREA_W, AREA_H);
    this.box = { x: fit.x, y: fit.y, scale: fit.scale };
    const c = this.add.container(fit.x, fit.y).setScale(fit.scale);
    this.root.add(c);
    // A slow 3D-ish drift of the whole area (design px, so scaled to screen px).
    const dxs = 3 * fit.scale;
    const dys = 2 * fit.scale;
    this.tweenList.push(
      this.tweens.add({
        targets: c,
        x: { from: fit.x - dxs, to: fit.x + dxs },
        y: { from: fit.y - dys, to: fit.y + dys },
        duration: 6000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      }),
    );

    const bg = this.add.graphics();
    c.add(bg);
    const backdrop = BACKDROP[area.backdrop];
    if (backdrop) {
      backdrop(bg, areaDone(area, s.house));
    } else {
      bg.fillStyle(0x6fbf4a, 1);
      bg.fillRect(0, 0, AREA_W, AREA_H);
    }

    for (const slot of area.slots) {
      const g = this.add.graphics();
      const built = s.house[slot.id];
      if (built !== undefined) {
        // Pivot at the base: the Graphics sits on the item's bottom edge, the art is drawn above it.
        const baseY = slot.y + slot.h / 2;
        let sh: Phaser.GameObjects.Graphics | undefined;
        if (!this.addShadow(g)) {
          sh = this.add.graphics().setPosition(slot.x + 8, baseY + 10).setAlpha(0.22);
          this.drawSlot(sh, slot, [0, 0, 0], -slot.h / 2);
          c.add(sh);
        }
        g.setPosition(slot.x, baseY);
        c.add(g);
        this.drawSlot(g, slot, (slot.variants[built] ?? slot.variants[0]).colors, -slot.h / 2);
        this.wave.set(slot.id, { g, sh, amp: swayAmp(slot.art), phase: slot.x * 0.011 + slot.y * 0.007 });
      } else {
        g.setPosition(slot.x, slot.y);
        c.add(g);
        drawJunk(g, 0, 0, slot.w, slot.h);
        const o = this.add.graphics();
        o.setPosition(slot.x, slot.y);
        o.lineStyle(4 / fit.scale, COLORS.accentNum, 1);
        o.strokeRoundedRect(-slot.w / 2, -slot.h / 2, slot.w, slot.h, 16);
        c.add(o);
        this.pulseAlpha(o, 0.35, 1, 700);
      }
    }

    // One tap target over the whole area; slots are found by hit-testing in design space.
    const zone = this.add.zone(fit.x, fit.y, AREA_W * fit.scale, AREA_H * fit.scale).setOrigin(0, 0).setInteractive();
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => this.onAreaTap(p.x, p.y, area));
    this.root.add(zone);

    for (const slot of area.slots) {
      if (s.house[slot.id] === undefined) this.badge(slot);
    }
  }

  /** Draws a slot's art centred on (0, dy) of g (dy 0 by default), or a plain block if its art is missing. */
  private drawSlot(g: Phaser.GameObjects.Graphics, slot: HouseSlot, colors: readonly [number, number, number], dy = 0): void {
    const fn = DRAW[slot.art];
    if (fn) {
      fn(g, 0, dy, slot.w, slot.h, colors);
    } else {
      g.fillStyle(colors[0], 1);
      g.fillRoundedRect(-slot.w / 2, dy - slot.h / 2, slot.w, slot.h, 16);
    }
  }

  /** The "★ cost" badge over an unbuilt slot. Screen-sized, outside the scaled view. */
  private badge(slot: HouseSlot): void {
    const sx = this.box.x + (slot.bx ?? slot.x) * this.box.scale;
    const sy = this.box.y + (slot.by ?? slot.y) * this.box.scale;
    const size = fsz(this, 0.045);
    const h = Math.max(44, Math.round(size * 2.4));
    const w = Math.max(72, Math.round(size * 4));
    const c = this.add.container(sx, sy);
    const g = this.add.graphics();
    drawPanel(g, -w / 2, -h / 2, w, h, COLORS.panel, COLORS.accentNum, 2, h / 2);
    c.add(g);
    c.add(this.add.image(-w * 0.2, 0, TEX.star).setDisplaySize(h * 0.5, h * 0.5));
    txt(this, c, w * 0.14, 0, String(slot.cost), size, { bold: true });
    this.root.add(c);
  }

  private onAreaTap(px: number, py: number, area: HouseArea): void {
    const s = loadSave();
    const { x, y, scale } = this.box;
    const dx = (px - x) / scale;
    const dy = (py - y) / scale;
    const pad = 22 / scale; // at least 44 px across on screen
    // A tap on a cost badge picks that slot, even where slot rects overlap.
    let hit: HouseSlot | undefined = area.slots.find(
      (sl) => s.house[sl.id] === undefined && Math.hypot(dx - (sl.bx ?? sl.x), dy - (sl.by ?? sl.y)) * scale <= 36,
    );
    if (!hit) for (const slot of [...area.slots].reverse()) {
      const hw = Math.max(slot.w / 2, pad);
      const hh = Math.max(slot.h / 2, pad);
      if (Math.abs(dx - slot.x) <= hw && Math.abs(dy - slot.y) <= hh) {
        hit = slot;
        break;
      }
    }
    if (!hit) return;
    const built = s.house[hit.id];
    if (built === undefined && s.stars < hit.cost) {
      floatText(this, px, py - 30, `Need ${hit.cost - s.stars} more ★ - play a level!`, {
        color: COLORS.text,
        size: fsz(this, 0.045),
      });
      this.wiggle(this.playBtn);
      return;
    }
    this.openPicker(area, hit, built);
  }

  // ---- style picker -----------------------------------------------------------------------

  private openPicker(area: HouseArea, slot: HouseSlot, built: number | undefined): void {
    this.openModal((m) => {
      const W = this.scale.width;
      const H = this.scale.height;
      const cx = W / 2;
      const cy = H / 2;
      this.dim(m, () => this.closeModal());
      const pw = Math.min(W - 16, 720);
      const ch = Math.max(120, Math.min(220, H - 16 - 104));
      const ph = ch + 104;
      const px = cx - pw / 2;
      const py = cy - ph / 2;
      const g = this.add.graphics();
      drawPanel(g, px, py, pw, ph, COLORS.panel, COLORS.accentNum, 3, 22);
      m.add(g);
      m.add(this.add.zone(cx, cy, pw, ph).setInteractive()); // blocks taps from reaching the dim layer

      txt(this, m, cx, py + 26, slot.name, fsz(this, 0.05), { bold: true });
      txt(this, m, cx, py + 56, built === undefined ? `Build for ★ ${slot.cost}` : 'Pick a new style (free)', fsz(this, 0.04), {
        color: COLORS.accent,
      });
      button(this, m, px + pw - 30, py + 30, 44, 44, '×', COLORS.button, fsz(this, 0.06), () => this.closeModal());

      const gap = 12;
      const cw = (pw - 4 * gap) / 3;
      const y0 = py + 84;
      const prevH = ch - 52;
      slot.variants.forEach((v, i) => {
        const x0 = px + gap + i * (cw + gap);
        const cg = this.add.graphics();
        drawPanel(cg, x0, y0, cw, ch, COLORS.background, built === i ? COLORS.good : COLORS.panelEdge, 2, 14);
        m.add(cg);
        const k = Math.min((cw - 16) / slot.w, (prevH - 8) / slot.h);
        const pg = this.add.graphics();
        pg.setPosition(x0 + cw / 2, y0 + 8 + prevH / 2);
        pg.setScale(k);
        this.drawSlot(pg, slot, v.colors);
        m.add(pg);
        txt(this, m, x0 + cw / 2, y0 + ch - 22, v.name, fsz(this, 0.036), { bold: true, wrap: cw - 10 });
        const z = this.add.zone(x0 + cw / 2, y0 + ch / 2, cw, ch).setInteractive();
        z.on('pointerdown', () => this.pick(area, slot, i));
        m.add(z);
      });
    });
  }

  /** Builds the slot in style i (or restyles it), then celebrates if that finished the area. */
  private pick(area: HouseArea, slot: HouseSlot, i: number): void {
    const before = loadSave();
    const wasDone = areaDone(area, before.house);
    const isNew = before.house[slot.id] === undefined;
    let applied = false as boolean;
    updateSave((s) => {
      if (isNew) {
        if (s.stars < slot.cost) return;
        s.stars -= slot.cost;
      }
      s.house[slot.id] = i;
      applied = true;
    });
    if (!applied) return;
    this.closeModal();
    const finished = !wasDone && areaDone(area, loadSave().house);
    if (finished) updateSave((s) => (s.coins += area.reward));
    this.buildRoot();

    const v = slot.variants[i];
    const sx = this.box.x + (slot.bx ?? slot.x) * this.box.scale;
    const sy = this.box.y + (slot.by ?? slot.y) * this.box.scale;
    const celebrateItem = (): void => {
      burst(this, sx, sy, v.colors[0], 16);
      burst(this, sx, sy, v.colors[2], 10);
      playSfx('build');
    };
    const fx = this.wave.get(slot.id);
    if (fx && isNew) {
      this.dropIn(slot.id, fx, celebrateItem);
    } else {
      if (fx) this.spin(slot.id, fx);
      celebrateItem();
    }
    if (finished) this.celebrate(area);
  }

  /** A new build falls from 120 px above, bounces down, then squashes once. `done` runs when it lands. */
  private dropIn(id: string, fx: WaveFx, done: () => void): void {
    const lift = fx.sh ? [fx.g, fx.sh] : [fx.g];
    for (const o of lift) {
      o.y -= 120;
      o.setScale(1, 1.3);
    }
    fx.g.setAlpha(0);
    this.tweening.add(id);
    this.tweenList.push(this.tweens.add({ targets: fx.g, alpha: 1, duration: 300, ease: 'Quad.easeOut' }));
    this.tweenList.push(
      this.tweens.add({
        targets: lift,
        y: '+=120',
        scaleX: 1,
        scaleY: 1,
        duration: 450,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          this.tweenList.push(
            this.tweens.add({
              targets: lift,
              scaleX: 1.1,
              scaleY: 0.85,
              duration: 90,
              yoyo: true,
              onComplete: () => {
                this.tweening.delete(id);
                done();
              },
            }),
          );
        },
      }),
    );
  }

  /** A restyle spins once and pops. */
  private spin(id: string, fx: WaveFx): void {
    const spinning = fx.sh ? [fx.g, fx.sh] : [fx.g];
    for (const o of spinning) o.setScale(1.2);
    this.tweening.add(id);
    this.tweenList.push(
      this.tweens.add({
        targets: spinning,
        angle: 360,
        scaleX: 1,
        scaleY: 1,
        duration: 350,
        ease: 'Cubic.easeOut',
        onComplete: () => this.tweening.delete(id),
      }),
    );
  }

  // ---- area finished ----------------------------------------------------------------------

  private celebrate(area: HouseArea): void {
    confetti(this, 2500);
    fireworks(this, 5);
    playSfx('win');
    const last = currentArea(loadSave().house) === null;
    this.openModal((m) => {
      const W = this.scale.width;
      const H = this.scale.height;
      const cx = W / 2;
      const cy = H / 2;
      this.dim(m, () => this.continueAfter());
      m.add(rays(this, cx, cy, COLORS.accentNum, 3));
      const pw = Math.min(W - 16, 560);
      const ph = Math.min(H - 16, 240);
      const g = this.add.graphics();
      drawPanel(g, cx - pw / 2, cy - ph / 2, pw, ph, COLORS.panel, COLORS.accentNum, 3, 22);
      m.add(g);
      const z = this.add.zone(cx, cy, pw, ph).setInteractive();
      z.on('pointerdown', () => this.continueAfter());
      m.add(z);
      txt(this, m, cx, cy - ph / 2 + 36, last ? 'Whole house made over!' : `${area.name} complete!`, fsz(this, 0.07), {
        bold: true,
        color: COLORS.accent,
        wrap: pw - 32,
      });
      txt(this, m, cx, cy - 6, last ? 'More levels soon.' : area.after, fsz(this, 0.045), { wrap: pw - 40 });
      txt(this, m, cx, cy + ph / 2 - 56, `+${area.reward} coins`, fsz(this, 0.05), { bold: true });
      txt(this, m, cx, cy + ph / 2 - 24, 'Tap to continue', fsz(this, 0.035), { color: COLORS.accent });
      for (let i = 0; i < 5; i++) {
        this.time.delayedCall(200 + i * 90, () => {
          playSfx('coin');
          void flyTo(this, TEX.coin, { x: cx, y: cy }, this.coinPos, 500);
        });
      }
    });
  }

  private continueAfter(): void {
    this.closeModal();
    this.areaIdx = this.pickIndex();
    this.buildRoot();
  }

  // ---- client and play button -------------------------------------------------------------

  private clientPanel(r: Rect, area: HouseArea, done: boolean): void {
    const vertical = r.h > r.w * 1.1;
    const gs = vertical ? Math.min(r.w * 0.42, 120) : Math.min(r.h - 12, 84);
    // The gnome's hat rises about 0.62 gs above its centre and its beard falls about 0.46 gs below it.
    const gcx = vertical ? r.x + r.w / 2 : r.x + 8 + gs / 2;
    const gcy = vertical ? r.y + gs * 0.66 + 4 : r.y + r.h / 2;
    const gg = this.add.graphics();
    drawGnome(gg, gcx, gcy, gs);
    this.root.add(gg);

    const bx = vertical ? r.x + 4 : r.x + gs + 24;
    const by = vertical ? r.y + gs * 1.2 + 10 : r.y + 6;
    const bw = vertical ? r.w - 8 : r.x + r.w - bx - 8;
    const bh = vertical ? r.h - (by - r.y) - 6 : r.h - 12;
    const bub = this.add.graphics();
    drawPanel(bub, bx, by, bw, bh, COLORS.panel, COLORS.panelEdge, 2, 14);
    this.root.add(bub);
    const size = fsz(this, 0.04);
    txt(this, this.root, bx + 12, by + 8, area.client, size, { bold: true, color: COLORS.accent, ox: 0, oy: 0 });
    txt(this, this.root, bx + 12, by + 8 + size * 1.5, done ? area.after : area.before, size, {
      ox: 0,
      oy: 0,
      wrap: bw - 24,
    });
  }

  private playButton(r: Rect, s: SaveData): void {
    const levelId = Math.min(s.level, LEVELS.length);
    const w = Math.min(r.w - 16, 420);
    const h = Math.min(Math.max(64, r.h - 12), 96);
    this.playBtn = button(this, this.root, r.x + r.w / 2, r.y + r.h / 2, w, h, `Play Level ${levelId}`, COLORS.button, fsz(this, 0.06), () => {
      this.sel = [];
      this.openPopup();
    });
    this.tweenList.push(
      this.tweens.add({ targets: this.playBtn, scaleX: 1.06, scaleY: 1.06, yoyo: true, repeat: -1, duration: 650, ease: 'Sine.easeInOut' }),
    );
  }

  private wiggle(t: Phaser.GameObjects.Container | undefined): void {
    if (!t) return;
    this.tweenList.push(this.tweens.add({ targets: t, angle: { from: -6, to: 6 }, yoyo: true, repeat: 3, duration: 70 }));
  }

  // ---- pre-level popup --------------------------------------------------------------------

  private openPopup(): void {
    this.openModal((m) => this.popup(m));
  }

  private popup(m: Phaser.GameObjects.Container): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;
    const s = loadSave();
    const levelId = Math.min(s.level, LEVELS.length);
    const lvl = LEVELS[levelId - 1];
    this.dim(m, () => this.closeModal());
    const pw = Math.min(W - 16, 560);
    const ph = Math.min(H - 16, 420);
    const px = cx - pw / 2;
    const py = cy - ph / 2;
    const g = this.add.graphics();
    drawPanel(g, px, py, pw, ph, COLORS.panel, COLORS.accentNum, 3, 22);
    m.add(g);
    m.add(this.add.zone(cx, cy, pw, ph).setInteractive());

    txt(this, m, cx, py + 28, lvl.name, fsz(this, 0.055), { bold: true, color: COLORS.accent, wrap: pw - 110 });
    button(this, m, px + pw - 30, py + 30, 44, 44, '×', COLORS.button, fsz(this, 0.06), () => this.closeModal());

    // Goals: icon, then the count for collect goals.
    const colW = pw / lvl.goals.length;
    lvl.goals.forEach((gl, i) => {
      const gx = px + colW * (i + 0.5);
      const gy = py + 88;
      m.add(this.add.image(gx - 14, gy, goalTex(gl)).setDisplaySize(44, 44));
      if (gl.type === 'collect') txt(this, m, gx + 14, gy, `×${gl.count}`, fsz(this, 0.05), { bold: true, ox: 0 });
    });
    txt(this, m, cx, py + 128, `Moves: ${lvl.moves}`, fsz(this, 0.045), { color: COLORS.accent });

    // Boosters: a toggle each. Selectable only when owned, or when the coins cover the price.
    const gap = 12;
    const bw = (pw - 4 * gap) / 3;
    const bh = Math.min(120, ph - 230);
    const by = py + 148;
    for (let i = 0; i < BOOSTERS.length; i++) {
      const b = BOOSTERS[i];
      const x0 = px + gap + i * (bw + gap);
      const bcx = x0 + bw / 2;
      const owned = s.boosters[b.kind] ?? 0;
      const ok = owned > 0 || s.coins >= TUNING.boosterCost;
      const on = this.sel.includes(b.kind);
      const card = this.add.container(0, 0);
      m.add(card);
      const cg = this.add.graphics();
      drawPanel(cg, x0, by, bw, bh, COLORS.background, on ? COLORS.good : COLORS.panelEdge, on ? 4 : 2, 14);
      card.add(cg);
      card.add(this.add.image(bcx, by + bh * 0.3, b.tex).setDisplaySize(44, 44));
      txt(this, card, bcx, by + bh * 0.62, b.name, fsz(this, 0.04), { bold: true });
      txt(this, card, bcx, by + bh * 0.86, owned > 0 ? `x${owned} owned` : `${TUNING.boosterCost} coins`, fsz(this, 0.036), {
        color: COLORS.accent,
      });
      card.setAlpha(ok ? 1 : 0.4);
      const z = this.add.zone(bcx, by + bh / 2, bw, bh).setInteractive();
      m.add(z);
      z.on('pointerdown', () => {
        if (!ok) return;
        this.sel = on ? this.sel.filter((k) => k !== b.kind) : [...this.sel, b.kind];
        this.openPopup();
      });
    }

    button(this, m, cx, py + ph - 52, Math.min(pw - 40, 320), 60, 'Play!', COLORS.button, fsz(this, 0.06), () =>
      this.startLevel(levelId),
    );
  }

  /** Spends a booster per selected kind (owned first, else the coin price), then starts the level. */
  private startLevel(levelId: number): void {
    const boosters: BoosterKind[] = [];
    updateSave((s) => {
      for (const k of this.sel) {
        if ((s.boosters[k] ?? 0) > 0) {
          s.boosters[k] -= 1;
          boosters.push(k);
        } else if (s.coins >= TUNING.boosterCost) {
          s.coins -= TUNING.boosterCost;
          boosters.push(k);
        }
      }
    });
    this.closeModal();
    this.sel = [];
    this.scene.start(SCENES.level, { levelId, boosters } satisfies LevelSceneData);
  }

  // ---- won-level fly-in -------------------------------------------------------------------

  private flyIn(W: number, H: number, pre: Pre): void {
    const cx = W / 2;
    const cy = H / 2;
    floatText(this, cx, cy - 40, `+${pre.starsEarned} ★`, { color: COLORS.accent, size: fsz(this, 0.09), durationMs: 1400 });
    this.flyTally(TEX.star, 'star', { x: cx, y: cy }, () => this.starPos, () => this.starTxt, pre.stars, pre.starsEarned);
    this.flyTally(TEX.coin, 'coin', { x: cx, y: cy }, () => this.coinPos, () => this.coinTxt, pre.coins, pre.coinsEarned);
  }

  /** `earned` images fly from `from` to the counter, 120 ms apart. The counter ticks up on each arrival. */
  private flyTally(
    tex: string,
    sfx: 'star' | 'coin',
    from: XY,
    to: () => XY,
    counter: () => Phaser.GameObjects.Text | undefined,
    base: number,
    earned: number,
  ): void {
    const n = Math.min(earned, 10);
    for (let i = 0; i < n; i++) {
      this.time.delayedCall(i * 120, () => {
        playSfx(sfx);
        const start = { x: from.x + ((i % 3) - 1) * 24, y: from.y };
        void flyTo(this, tex, start, to(), 500, 0.6).then(() => {
          const t = counter();
          if (t?.active) t.setText(String(base + Math.round((earned * (i + 1)) / n)));
        });
      });
    }
  }

  // ---- modals -----------------------------------------------------------------------------

  private openModal(build: (m: Phaser.GameObjects.Container) => void): void {
    this.closeModal();
    this.rebuildModal = build;
    const m = this.add.container(0, 0);
    this.modal = m;
    build(m);
  }

  private closeModal(): void {
    this.modal?.destroy(true);
    this.modal = undefined;
    this.rebuildModal = null;
  }

  /** A full-screen dim layer; tapping it runs onTap. */
  private dim(m: Phaser.GameObjects.Container, onTap: () => void): void {
    const r = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.6);
    r.setInteractive();
    r.on('pointerdown', onTap);
    m.add(r);
  }

  private pulseAlpha(target: Phaser.GameObjects.Graphics, lo: number, hi: number, ms: number): void {
    this.tweenList.push(this.tweens.add({ targets: target, alpha: { from: lo, to: hi }, yoyo: true, repeat: -1, duration: ms }));
  }
}

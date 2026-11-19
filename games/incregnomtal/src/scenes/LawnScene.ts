import Phaser from 'phaser';
import { getMyGnome } from '@lawn/gnome';
import {
  DECORS,
  GRASSES,
  MAX_GRID_COLS,
  MAX_GRID_ROWS,
  PLOT_TIERS,
  formatNum,
} from '../balance.ts';
import { computeStats, hasCritter, hasNode, stepMowerRide } from '../sim/engine.ts';
import type { GameAction, GameState, SimEvent } from '../sim/types.ts';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}

interface FloatText {
  x: number;
  y: number;
  vy: number;
  life: number;
  text: string;
  color: string;
}

interface VisualGnome {
  x: number;
  y: number;
  tx: number;
  ty: number;
  hatColor: number;
  coatColor: number;
  skinColor: number;
  beardColor: number;
  bobPhase: number;
}

export interface LawnSceneCallbacks {
  getState: () => GameState;
  dispatch: (action: GameAction) => SimEvent[];
  onRideEvents: (events: SimEvent[]) => void;
}

export class LawnScene extends Phaser.Scene {
  private cb!: LawnSceneCallbacks;
  private gfx!: Phaser.GameObjects.Graphics;
  private labelPool: Phaser.GameObjects.Text[] = [];
  private decorTexts: Map<number, Phaser.GameObjects.Text> = new Map();
  private signText!: Phaser.GameObjects.Text;
  private rideHintText!: Phaser.GameObjects.Text;

  private particles: Particle[] = [];
  private floats: FloatText[] = [];
  private visualGnomes: VisualGnome[] = [];

  // Layout metrics for hit-testing
  private gridOriginX = 0;
  private gridOriginY = 0;
  private tileSize = 44;
  private visStartCol = 0;
  private visStartRow = 0;
  private visCols = 4;
  private visRows = 4;

  // Ambient easter egg road vehicles
  private kartX = -60;
  private kartTimer = 14;
  private combineX = -140;
  private mowerSweepX = -999;

  // Pointer steering for mower ride
  private pointerDown = false;
  private pointerX = 0;
  private pointerY = 0;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>;

  constructor() {
    super('LawnScene');
  }

  setCallbacks(cb: LawnSceneCallbacks): void {
    this.cb = cb;
  }

  create(): void {
    this.gfx = this.add.graphics();
    this.signText = this.add
      .text(0, 0, 'The Bare Patch', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#f5ead6',
        backgroundColor: '#5c3c22',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(20);

    this.rideHintText = this.add
      .text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#fff6d6',
        backgroundColor: '#1f2e1acc',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(30)
      .setVisible(false);

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        w: this.input.keyboard.addKey('W'),
        a: this.input.keyboard.addKey('A'),
        s: this.input.keyboard.addKey('S'),
        d: this.input.keyboard.addKey('D'),
      };
    }

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.pointerDown = true;
      this.pointerX = p.x;
      this.pointerY = p.y;
      this.handleTap(p.x, p.y);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.pointerX = p.x;
      this.pointerY = p.y;
    });
    this.input.on('pointerup', () => {
      this.pointerDown = false;
    });
  }

  public spawnBurst(tileIndex: number, color: number, text?: string): void {
    const col = tileIndex % MAX_GRID_COLS;
    const row = Math.floor(tileIndex / MAX_GRID_COLS);
    const px = this.gridOriginX + (col - this.visStartCol + 0.5) * this.tileSize;
    const py = this.gridOriginY + (row - this.visStartRow + 0.5) * this.tileSize;
    for (let i = 0; i < 7; i++) {
      const a = (Math.PI * 2 * i) / 7 + Math.random() * 0.4;
      const spd = 28 + Math.random() * 55;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 20,
        life: 0.45,
        maxLife: 0.45,
        color,
        size: 3 + Math.random() * 2.5,
      });
    }
    if (text) {
      this.floats.push({ x: px, y: py - 8, vy: -38, life: 0.75, text, color: '#fff8c7' });
    }
  }

  public triggerMowerSweep(): void {
    this.mowerSweepX = this.gridOriginX - 50;
  }

  private handleTap(x: number, y: number): void {
    if (!this.cb) return;
    const state = this.cb.getState();
    if (state.mowerRide.active) return;

    // Check golden acorn hit
    if (state.goldenAcorn) {
      const gx = this.gridOriginX + (state.goldenAcorn.col - this.visStartCol + 0.5) * this.tileSize;
      const gy = this.gridOriginY + (state.goldenAcorn.row - this.visStartRow + 0.5) * this.tileSize;
      if (Math.hypot(x - gx, y - gy) <= Math.max(28, this.tileSize * 0.65)) {
        const ev = this.cb.dispatch({ type: 'tap-golden-acorn' });
        this.spawnBurst(state.goldenAcorn?.row ? 0 : 0, 0xf7d046, '🌰 GOLDEN!');
        this.cb.onRideEvents(ev);
        return;
      }
    }

    // Check easter egg hit
    if (state.easterEgg) {
      const ex = this.gridOriginX + (state.easterEgg.col - this.visStartCol + 0.5) * this.tileSize;
      const ey = this.gridOriginY + (state.easterEgg.row - this.visStartRow + 0.5) * this.tileSize;
      if (Math.hypot(x - ex, y - ey) <= Math.max(28, this.tileSize * 0.65)) {
        const ev = this.cb.dispatch({ type: 'tap-easter-egg' });
        this.cb.onRideEvents(ev);
        return;
      }
    }

    // Tile hit
    const relCol = Math.floor((x - this.gridOriginX) / this.tileSize);
    const relRow = Math.floor((y - this.gridOriginY) / this.tileSize);
    if (relCol < 0 || relCol >= this.visCols || relRow < 0 || relRow >= this.visRows) return;
    const col = this.visStartCol + relCol;
    const row = this.visStartRow + relRow;
    const idx = row * MAX_GRID_COLS + col;
    const events = this.cb.dispatch({ type: 'tap-tile', index: idx });
    for (const e of events) {
      if (e.kind === 'trim') {
        this.spawnBurst(idx, 0x76d658, e.value ? `+${formatNum(e.value)}` : '🌱');
      } else if (e.kind === 'weed') {
        this.spawnBurst(idx, 0xf7e159, '🌼 +Wish');
      } else if (e.kind === 'water') {
        this.spawnBurst(idx, 0x5bc0f8, '💧');
      }
    }
  }

  private computeLayout(state: GameState): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const isLandscape = w > h && w >= 680;

    // Reserve space for DOM HUD + panel
    const topPad = isLandscape ? 62 : 112;
    const bottomPad = isLandscape ? 46 : Math.min(310, Math.max(240, h * 0.36));
    const rightPad = isLandscape ? Math.min(390, Math.max(300, w * 0.42)) : 10;
    const leftPad = 10;

    const availW = Math.max(180, w - leftPad - rightPad);
    const availH = Math.max(180, h - topPad - bottomPad);

    const tier = PLOT_TIERS[Math.min(state.plotLevel, PLOT_TIERS.length - 1)];
    this.visCols = tier.cols;
    this.visRows = tier.rows;
    this.visStartCol = Math.floor((MAX_GRID_COLS - tier.cols) / 2);
    this.visStartRow = Math.floor((MAX_GRID_ROWS - tier.rows) / 2);

    const rawTile = Math.floor(Math.min(availW / this.visCols, (availH - 26) / this.visRows));
    this.tileSize = Math.max(28, Math.min(72, rawTile));

    const gridW = this.visCols * this.tileSize;
    const gridH = this.visRows * this.tileSize;
    this.gridOriginX = Math.floor(leftPad + (availW - gridW) / 2);
    this.gridOriginY = Math.floor(topPad + 22 + (availH - 22 - gridH) / 2);
  }

  private syncGnomes(state: GameState, dt: number): void {
    const targetCount = Math.min(12, Math.max(1, state.gnomes));
    const mine = getMyGnome()?.look;
    const paletteHats = [0xd63c32, 0x3878d6, 0x3ca35a, 0xd99b26, 0x8e4ec6, 0x2ca3a3];

    while (this.visualGnomes.length < targetCount) {
      const i = this.visualGnomes.length;
      const isPlayer = i === 0 && mine;
      this.visualGnomes.push({
        x: Math.random() * this.visCols,
        y: Math.random() * this.visRows,
        tx: Math.random() * this.visCols,
        ty: Math.random() * this.visRows,
        hatColor: isPlayer ? mine.hat : paletteHats[i % paletteHats.length],
        coatColor: isPlayer ? mine.shirt : 0x3b5978,
        skinColor: isPlayer ? mine.skin : 0xf2c9a0,
        beardColor: isPlayer ? (mine.beard ?? 0xf0ece1) : 0xf0ece1,
        bobPhase: Math.random() * Math.PI * 2,
      });
    }
    if (this.visualGnomes.length > targetCount) {
      this.visualGnomes.length = targetCount;
    }

    for (const g of this.visualGnomes) {
      const dx = g.tx - g.x;
      const dy = g.ty - g.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.15) {
        g.tx = 0.25 + Math.random() * (this.visCols - 0.5);
        g.ty = 0.25 + Math.random() * (this.visRows - 0.5);
      } else {
        const spd = 1.15;
        g.x += (dx / dist) * spd * dt;
        g.y += (dy / dist) * spd * dt;
      }
      g.bobPhase += dt * 7;
    }
  }

  update(_time: number, delta: number): void {
    if (!this.cb) return;
    const dt = Math.min(0.1, delta / 1000);
    const state = this.cb.getState();
    const stats = computeStats(state);

    this.computeLayout(state);
    this.syncGnomes(state, dt);

    // Interactive Mower Ride steering
    if (state.mowerRide.active) {
      let sx = 0;
      let sy = 0;
      if (this.cursors?.left.isDown || this.wasd?.a.isDown) sx -= 1;
      if (this.cursors?.right.isDown || this.wasd?.d.isDown) sx += 1;
      if (this.cursors?.up.isDown || this.wasd?.w.isDown) sy -= 1;
      if (this.cursors?.down.isDown || this.wasd?.s.isDown) sy += 1;
      if (this.pointerDown) {
        const mx = this.gridOriginX + (state.mowerRide.x - this.visStartCol) * this.tileSize;
        const my = this.gridOriginY + (state.mowerRide.y - this.visStartRow) * this.tileSize;
        sx = this.pointerX - mx;
        sy = this.pointerY - my;
      }
      const ev = stepMowerRide(state, dt, sx, sy);
      if (ev.length) this.cb.onRideEvents(ev);
    }

    // Update road karts & combine easter eggs
    this.kartTimer -= dt;
    if (this.kartTimer <= 0) {
      this.kartX += 180 * dt;
      if (this.kartX > this.scale.width + 60) {
        this.kartX = -60;
        this.kartTimer = 26;
      }
    }
    if (state.combineBannerSec > 0) {
      this.combineX += 110 * dt;
      if (this.combineX > this.scale.width + 120) this.combineX = -120;
    } else {
      this.combineX = -140;
    }
    if (this.mowerSweepX > -900) {
      this.mowerSweepX += 460 * dt;
      if (this.mowerSweepX > this.gridOriginX + this.visCols * this.tileSize + 100) {
        this.mowerSweepX = -999;
      }
    }

    // Update particles & float text
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floats) {
      f.y += f.vy * dt;
      f.life -= dt;
    }
    this.floats = this.floats.filter((f) => f.life > 0);

    this.draw(state, stats);
  }

  private draw(state: GameState, stats: ReturnType<typeof computeStats>): void {
    const g = this.gfx;
    g.clear();

    const gridW = this.visCols * this.tileSize;
    const gridH = this.visRows * this.tileSize;

    // Background sky / yard earth
    const bgColor = stats.isNight ? 0x16221c : state.drySummerActive ? 0x2c2b1b : 0x1f301b;
    g.fillStyle(bgColor, 1);
    g.fillRect(0, 0, this.scale.width, this.scale.height);

    // Road & Fence behind the lawn
    const fenceY = this.gridOriginY - 14;
    g.fillStyle(0x3a3e42, 0.7);
    g.fillRect(this.gridOriginX - 16, fenceY - 16, gridW + 32, 12);
    // Lawn Prix kart buzzing past!
    if (this.kartX > -50 && this.kartX < this.scale.width + 50) {
      g.fillStyle(0xe64539, 1);
      g.fillRoundedRect(this.kartX, fenceY - 15, 20, 9, 3);
      g.fillStyle(0xfff2a6, 1);
      g.fillCircle(this.kartX + 19, fenceY - 10, 2);
    }
    // Week 5 Combine fake-out rolling past on the road!
    if (state.combineBannerSec > 0) {
      g.fillStyle(0xd93829, 1);
      g.fillRect(this.combineX, fenceY - 24, 58, 18);
      g.fillStyle(0x222222, 1);
      g.fillCircle(this.combineX + 12, fenceY - 6, 6);
      g.fillCircle(this.combineX + 44, fenceY - 6, 6);
    }

    // Wooden fence slats
    g.fillStyle(0x7a593a, 1);
    g.fillRect(this.gridOriginX - 10, fenceY - 4, gridW + 20, 8);
    g.fillStyle(0x5e4228, 1);
    for (let x = this.gridOriginX - 8; x <= this.gridOriginX + gridW + 4; x += 18) {
      g.fillRect(x, fenceY - 7, 5, 13);
    }

    // Lawn Sign
    this.signText.setText(stats.signTitle);
    this.signText.setPosition(this.gridOriginX + gridW / 2, fenceY - 6);

    // Lawn frame border
    g.fillStyle(0x3d2c1d, 1);
    g.fillRoundedRect(this.gridOriginX - 5, this.gridOriginY - 5, gridW + 10, gridH + 10, 6);

    // Draw each visible unlocked tile
    const usedDecorIdx = new Set<number>();
    const hasStripes = hasNode(state, 'lawn-stripes') || state.ended;

    for (let r = 0; r < this.visRows; r++) {
      for (let c = 0; c < this.visCols; c++) {
        const col = this.visStartCol + c;
        const row = this.visStartRow + r;
        const idx = row * MAX_GRID_COLS + col;
        const tile = state.tiles[idx];
        if (!tile) continue;

        const tx = this.gridOriginX + c * this.tileSize;
        const ty = this.gridOriginY + r * this.tileSize;
        const pad = 1.5;
        const s = this.tileSize - pad * 2;

        const gDef = GRASSES[tile.grass];
        let baseCol = gDef.color;
        if (tile.grass !== 'bare' && stats.waterFactor < 0.6) {
          // Yellow thirsty tint
          baseCol = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(baseCol),
            Phaser.Display.Color.ValueToColor(0xb8a042),
            100,
            Math.round((0.6 - stats.waterFactor) * 110),
          ).color;
        }

        g.fillStyle(baseCol, 1);
        g.fillRoundedRect(tx + pad, ty + pad, s, s, 4);

        // Subtle stripe sheen
        if (tile.grass !== 'bare' && (hasStripes ? c % 2 === 0 : (c + r) % 2 === 0)) {
          g.fillStyle(0xffffff, hasStripes ? 0.11 : 0.045);
          g.fillRoundedRect(tx + pad, ty + pad, s, s, 4);
        }

        // Grass blade height visualization
        if (tile.grass !== 'bare' && !tile.decor && tile.height > 12) {
          const hFrac = Math.min(1, tile.height / 100);
          const barH = Math.max(3, Math.round(s * 0.45 * hFrac));
          g.fillStyle(gDef.accentColor, 0.85);
          g.fillRect(tx + pad + 4, ty + s - barH, 3, barH);
          g.fillRect(tx + pad + s * 0.45, ty + s - barH * 1.05, 3, barH * 1.05);
          g.fillRect(tx + pad + s - 8, ty + s - barH * 0.9, 3, barH * 0.9);
          // Height progress strip along bottom
          g.fillStyle(tile.height >= 98 ? 0xf2d149 : 0xc8f7a6, 0.7);
          g.fillRect(tx + pad + 2, ty + s - 2, (s - 4) * hFrac, 2.5);
        }

        // Irrigation trench
        if (tile.trench) {
          g.fillStyle(0x4ba3d9, 0.55);
          g.fillRect(tx + pad, ty + s * 0.5 - 2, s, 4);
        }

        // Shade overlay
        if (tile.shaded) {
          g.fillStyle(0x0b1710, 0.34);
          g.fillRoundedRect(tx + pad, ty + pad, s, s, 4);
        }

        // Golden tile shimmer
        if (tile.golden) {
          g.lineStyle(2, 0xffe66b, 0.95);
          g.strokeRoundedRect(tx + pad + 1, ty + pad + 1, s - 2, s - 2, 4);
        }

        // Problem tells
        if (tile.puddle) {
          g.fillStyle(0x3f9ae6, 0.78);
          g.fillEllipse(tx + this.tileSize / 2, ty + this.tileSize / 2, s * 0.72, s * 0.5);
        }
        if (tile.dogSpot) {
          g.fillStyle(0x8c6d3b, 0.82);
          g.fillCircle(tx + this.tileSize / 2, ty + this.tileSize / 2, s * 0.32);
        }
        if (tile.grub) {
          g.lineStyle(2.5, 0x8f5528, 0.95);
          g.strokeCircle(tx + this.tileSize / 2, ty + this.tileSize / 2, s * 0.3);
        }
        if (tile.mole) {
          g.fillStyle(0x4d331f, 1);
          g.fillCircle(tx + this.tileSize / 2, ty + this.tileSize * 0.56, s * 0.3);
          g.fillStyle(0x362214, 1);
          g.fillCircle(tx + this.tileSize / 2, ty + this.tileSize * 0.52, s * 0.14);
        }
        if (tile.weed) {
          // Bright dandelion puff
          g.fillStyle(0xf7dc43, 1);
          g.fillCircle(tx + this.tileSize * 0.5, ty + this.tileSize * 0.42, s * 0.22);
          g.fillStyle(0x3b7a2a, 1);
          g.fillRect(tx + this.tileSize * 0.5 - 1, ty + this.tileSize * 0.55, 2, s * 0.25);
        }
        if (tile.oakSapling) {
          g.fillStyle(0x5c3d22, 1);
          g.fillRect(tx + this.tileSize * 0.5 - 3, ty + this.tileSize * 0.48, 6, s * 0.35);
          g.fillStyle(0x2d6b34, 1);
          g.fillCircle(tx + this.tileSize * 0.5, ty + this.tileSize * 0.35, s * 0.3);
        }
        if (tile.bootPrint) {
          g.fillStyle(0x2a1f16, 0.55);
          g.fillEllipse(tx + this.tileSize * 0.5, ty + this.tileSize * 0.46, s * 0.42, s * 0.62);
        }

        // Placed decor badge
        if (tile.decor) {
          usedDecorIdx.add(idx);
          const def = DECORS[tile.decor];
          g.fillStyle(def.color, 0.35);
          g.fillRoundedRect(tx + pad + 2, ty + pad + 2, s - 4, s - 4, 4);
          let txt = this.decorTexts.get(idx);
          if (!txt) {
            txt = this.add
              .text(0, 0, def.icon, { fontSize: `${Math.max(16, Math.round(this.tileSize * 0.5))}px` })
              .setOrigin(0.5, 0.5)
              .setDepth(10);
            this.decorTexts.set(idx, txt);
          }
          txt.setText(def.icon);
          txt.setPosition(tx + this.tileSize / 2, ty + this.tileSize / 2);
          txt.setVisible(true);
        }

        // Placement preview outline
        if (state.placingDecor && !tile.decor) {
          g.lineStyle(1.5, 0x99f5ff, 0.6);
          g.strokeRoundedRect(tx + pad + 1, ty + pad + 1, s - 2, s - 2, 4);
        }
      }
    }

    // Hide unused decor texts
    for (const [idx, txt] of this.decorTexts.entries()) {
      if (!usedDecorIdx.has(idx)) txt.setVisible(false);
    }

    // Draw animated Crew Gnomes
    for (const gn of this.visualGnomes) {
      const gx = this.gridOriginX + gn.x * this.tileSize;
      const gy = this.gridOriginY + gn.y * this.tileSize + Math.sin(gn.bobPhase) * 2;
      // Shadow
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(gx, gy + 7, 12, 5);
      // Coat
      g.fillStyle(gn.coatColor, 1);
      g.fillRoundedRect(gx - 5, gy - 2, 10, 9, 3);
      // Beard
      g.fillStyle(gn.beardColor, 1);
      g.fillTriangle(gx - 4, gy - 2, gx + 4, gy - 2, gx, gy + 5);
      // Face
      g.fillStyle(gn.skinColor, 1);
      g.fillCircle(gx, gy - 4, 3.5);
      // Pointy Gnome Hat
      g.fillStyle(gn.hatColor, 1);
      g.fillTriangle(gx - 5, gy - 5, gx + 5, gy - 5, gx, gy - 15);
    }

    // Draw Biscuit (the giant friendly dog!) when befriended or Week 3+
    if (hasCritter(state, 'biscuit') || state.week >= 3) {
      const t = state.totalElapsedSec;
      const bx = state.ended
        ? this.gridOriginX + gridW - 26
        : this.gridOriginX + ((Math.sin(t * 0.45) * 0.35 + 0.5) * gridW);
      const by = state.ended
        ? this.gridOriginY + gridH - 22
        : this.gridOriginY + ((Math.cos(t * 0.33) * 0.3 + 0.5) * gridH);
      g.fillStyle(0x000000, 0.22);
      g.fillEllipse(bx, by + 9, 24, 9);
      g.fillStyle(0xd9a15b, 1);
      g.fillEllipse(bx, by, 22, 13); // body
      g.fillCircle(bx + 10, by - 5, 7); // head
      g.fillStyle(0x9c6b30, 1);
      g.fillEllipse(bx + 13, by - 2, 4, 7); // floppy ear
      g.fillStyle(0x222222, 1);
      g.fillCircle(bx + 15, by - 6, 2); // nose
    }

    // Draw Golden Acorn drop
    if (state.goldenAcorn) {
      const pulse = 1 + Math.sin(state.totalElapsedSec * 9) * 0.15;
      const ax = this.gridOriginX + (state.goldenAcorn.col - this.visStartCol + 0.5) * this.tileSize;
      const ay = this.gridOriginY + (state.goldenAcorn.row - this.visStartRow + 0.5) * this.tileSize;
      g.fillStyle(0xfff078, 0.35);
      g.fillCircle(ax, ay, 18 * pulse);
      g.fillStyle(0xf2b705, 1);
      g.fillCircle(ax, ay + 2, 9 * pulse);
      g.fillStyle(0x8c5a18, 1);
      g.fillEllipse(ax, ay - 5, 14 * pulse, 7 * pulse);
    }

    // Draw Easter Egg clickable
    if (state.easterEgg) {
      const ex = this.gridOriginX + (state.easterEgg.col - this.visStartCol + 0.5) * this.tileSize;
      const ey = this.gridOriginY + (state.easterEgg.row - this.visStartRow + 0.5) * this.tileSize;
      g.fillStyle(0xa8f0ff, 0.35);
      g.fillCircle(ex, ey, 14);
      g.fillStyle(state.easterEgg.kind === 'golf-ball' ? 0xffffff : 0xc47b3b, 1);
      g.fillCircle(ex, ey, 7);
    }

    // Rain overlay
    if (state.rainSec > 0) {
      g.lineStyle(1.5, 0x8ad4ff, 0.55);
      const t = state.totalElapsedSec * 300;
      for (let i = 0; i < 28; i++) {
        const rx = this.gridOriginX + ((i * 53 + t * 0.3) % gridW);
        const ry = this.gridOriginY + ((i * 37 + t) % gridH);
        g.lineBetween(rx, ry, rx - 4, ry + 11);
      }
    }

    // Mowing Day sweep Old Saturday visual
    if (this.mowerSweepX > -900) {
      g.fillStyle(0xd93829, 1);
      g.fillRoundedRect(this.mowerSweepX, this.gridOriginY, 34, gridH, 6);
      g.fillStyle(0xffe066, 1);
      g.fillRect(this.mowerSweepX + 6, this.gridOriginY + 8, 8, gridH - 16);
    }

    // Week 6 Interactive Old Saturday Ride!
    if (state.mowerRide.active) {
      const mx = this.gridOriginX + (state.mowerRide.x - this.visStartCol) * this.tileSize;
      const my = this.gridOriginY + (state.mowerRide.y - this.visStartRow) * this.tileSize;
      g.fillStyle(0xd93829, 1);
      g.fillRoundedRect(mx - 15, my - 11, 30, 22, 5);
      g.fillStyle(0x222222, 1);
      g.fillCircle(mx - 10, my - 10, 4);
      g.fillCircle(mx + 10, my - 10, 4);
      g.fillCircle(mx - 10, my + 10, 4);
      g.fillCircle(mx + 10, my + 10, 4);
      // Gnome riding on top!
      g.fillStyle(getMyGnome()?.look?.hat ?? 0xd63c32, 1);
      g.fillTriangle(mx - 5, my - 4, mx + 5, my - 4, mx, my - 16);

      this.rideHintText
        .setText(
          `🚜 RIDE OLD SATURDAY! Drag or WASD — ${Math.ceil(state.mowerRide.remainingSec)}s (${state.mowerRide.mowedTiles.length}/${this.visCols * this.visRows})`,
        )
        .setPosition(this.gridOriginX + gridW / 2, this.gridOriginY + gridH + 18)
        .setVisible(true);
    } else {
      this.rideHintText.setVisible(false);
    }

    // Particles
    for (const p of this.particles) {
      g.fillStyle(p.color, Math.max(0, p.life / p.maxLife));
      g.fillCircle(p.x, p.y, p.size);
    }

    // Float texts (pool)
    while (this.labelPool.length < this.floats.length) {
      this.labelPool.push(
        this.add
          .text(0, 0, '', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#fff8c7',
            stroke: '#1a2417',
            strokeThickness: 3,
          })
          .setOrigin(0.5, 0.5)
          .setDepth(25),
      );
    }
    for (let i = 0; i < this.labelPool.length; i++) {
      const f = this.floats[i];
      const lbl = this.labelPool[i];
      if (f) {
        lbl.setText(f.text).setPosition(f.x, f.y).setAlpha(Math.min(1, f.life * 2)).setVisible(true);
      } else {
        lbl.setVisible(false);
      }
    }
  }
}

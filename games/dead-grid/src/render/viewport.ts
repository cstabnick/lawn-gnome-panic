import {
  DeadGridSim,
  GRID_H,
  GRID_W,
  MAX_FACTIONS,
  TIER_NAMES,
  type FactionInfo,
  type OverlayMode,
} from '../sim/bridge';

export interface ViewportCallbacks {
  onTap: (wx: number, wy: number) => void;
  onBrushStroke?: (wx: number, wy: number) => void;
}

export class Viewport {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly offscreen: HTMLCanvasElement;
  private readonly offCtx: CanvasRenderingContext2D;
  private readonly imgData: ImageData;

  cx = GRID_W / 2;
  cy = GRID_H / 2;
  zoom = 1.6;
  overlay: OverlayMode = 0;
  selectedAgent = -1;
  selectedTile: { x: number; y: number } | null = null;
  brushRadius = 0;
  private hoverWorld: { x: number; y: number } | null = null;

  private readonly keys = new Set<string>();
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private dragStart: { x: number; y: number; cx: number; cy: number; moved: boolean } | null = null;
  private pinchStart: { dist: number; zoom: number; midX: number; midY: number } | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly cb: ViewportCallbacks,
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;

    this.offscreen = document.createElement('canvas');
    this.offscreen.width = GRID_W;
    this.offscreen.height = GRID_H;
    const offCtx = this.offscreen.getContext('2d', { alpha: false });
    if (!offCtx) throw new Error('Offscreen 2D context unavailable');
    this.offCtx = offCtx;
    this.imgData = offCtx.createImageData(GRID_W, GRID_H);

    this.resize();
    this.fitWorld();
    this.bindEvents();
  }

  fitWorld(): void {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    const minDim = Math.min(w, h);
    this.cx = GRID_W / 2;
    this.cy = GRID_H / 2;
    this.zoom = Math.max(0.8, Math.min(4, (minDim * 0.92) / GRID_W));
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, this.canvas.clientWidth || window.innerWidth);
    const h = Math.max(1, this.canvas.clientHeight || window.innerHeight);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    return {
      x: this.cx + (sx - w / 2) / this.zoom,
      y: this.cy + (sy - h / 2) / this.zoom,
    };
  }

  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    return {
      x: (wx - this.cx) * this.zoom + w / 2,
      y: (wy - this.cy) * this.zoom + h / 2,
    };
  }

  zoomAt(sx: number, sy: number, factor: number): void {
    const before = this.screenToWorld(sx, sy);
    this.zoom = Math.max(0.6, Math.min(36, this.zoom * factor));
    const after = this.screenToWorld(sx, sy);
    this.cx += before.x - after.x;
    this.cy += before.y - after.y;
    this.clampCamera();
  }

  private clampCamera(): void {
    this.cx = Math.max(-40, Math.min(GRID_W + 40, this.cx));
    this.cy = Math.max(-40, Math.min(GRID_H + 40, this.cy));
  }

  stepKeyboardPan(dtSec: number): void {
    const panSpd = (360 / this.zoom) * dtSec;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) this.cy -= panSpd;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) this.cy += panSpd;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) this.cx -= panSpd;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) this.cx += panSpd;
    this.clampCamera();
  }

  render(sim: DeadGridSim, factions: FactionInfo[]): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.resize();
    }

    const macroMode = this.zoom < 4.5;
    sim.renderFrame(this.overlay, macroMode);
    this.imgData.data.set(sim.frameRgba);
    this.offCtx.putImageData(this.imgData, 0, 0);

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#090c10';
    ctx.fillRect(0, 0, w, h);

    ctx.imageSmoothingEnabled = false;
    const left = w / 2 - this.cx * this.zoom;
    const top = h / 2 - this.cy * this.zoom;
    ctx.drawImage(this.offscreen, left, top, GRID_W * this.zoom, GRID_H * this.zoom);

    // Subtle grid lines when zoomed in closely
    if (this.zoom >= 10) {
      const startX = Math.max(0, Math.floor(this.cx - w / (2 * this.zoom)));
      const endX = Math.min(GRID_W, Math.ceil(this.cx + w / (2 * this.zoom)));
      const startY = Math.max(0, Math.floor(this.cy - h / (2 * this.zoom)));
      const endY = Math.min(GRID_H, Math.ceil(this.cy + h / (2 * this.zoom)));

      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = startX; gx <= endX; gx++) {
        const sx = left + gx * this.zoom;
        ctx.moveTo(sx, top + startY * this.zoom);
        ctx.lineTo(sx, top + endY * this.zoom);
      }
      for (let gy = startY; gy <= endY; gy++) {
        const sy = top + gy * this.zoom;
        ctx.moveTo(left + startX * this.zoom, sy);
        ctx.lineTo(left + endX * this.zoom, sy);
      }
      ctx.stroke();
    }

    // Crisp micro-zoom agent rendering
    if (!macroMode) {
      const minX = this.cx - w / (2 * this.zoom) - 2;
      const maxX = this.cx + w / (2 * this.zoom) + 2;
      const minY = this.cy - h / (2 * this.zoom) - 2;
      const maxY = this.cy + h / (2 * this.zoom) + 2;

      const facColorMap = new Map<number, string>();
      for (const f of factions) facColorMap.set(f.id, f.colorCss);

      const radius = Math.max(1.8, Math.min(6.5, this.zoom * 0.28));
      const activeLimit = sim.readStats().activeAgents;
      for (let i = 0; i < activeLimit; i++) {
        const k = sim.agKind[i];
        if (k === 0) continue;
        const ax = sim.agX[i];
        const ay = sim.agY[i];
        if (ax < minX || ax > maxX || ay < minY || ay > maxY) continue;

        const sx = left + ax * this.zoom;
        const sy = top + ay * this.zoom;
        if (k === 2) {
          ctx.fillStyle = '#e5534b';
          ctx.beginPath();
          ctx.arc(sx, sy, radius * 0.9, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const inf = sim.agInfection[i] > 0;
          const f = sim.agFaction[i];
          ctx.fillStyle = inf
            ? '#d6d63f'
            : f < MAX_FACTIONS
              ? (facColorMap.get(f) ?? '#f0f6fc')
              : '#f0f6fc';
          ctx.beginPath();
          ctx.arc(sx, sy, radius, 0, Math.PI * 2);
          ctx.fill();

          if (sim.agGear[i] >= 35) {
            ctx.strokeStyle = '#0d1117';
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }
    }

    // Settlement badges & labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of factions) {
      const p = this.worldToScreen(f.x, f.y);
      if (p.x < -80 || p.x > w + 80 || p.y < -40 || p.y > h + 40) continue;

      const badgeR = Math.max(5, Math.min(11, 4 + f.level * 1.5));
      ctx.fillStyle = 'rgba(11, 14, 18, 0.85)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, badgeR + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = f.colorCss;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, badgeR, 0, Math.PI * 2);
      ctx.stroke();

      const label = `${f.name} · ${f.pop}`;
      ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
      const tw = ctx.measureText(label).width;
      const ly = p.y - badgeR - 11;
      ctx.fillStyle = 'rgba(11, 14, 18, 0.78)';
      ctx.fillRect(p.x - tw / 2 - 5, ly - 8, tw + 10, 16);
      ctx.fillStyle = '#e6edf3';
      ctx.fillText(label, p.x, ly);
      if (this.zoom >= 3) {
        ctx.font = '500 9px ui-sans-serif, system-ui, sans-serif';
        ctx.fillStyle = f.colorCss;
        ctx.fillText(TIER_NAMES[f.level] ?? 'Camp', p.x, p.y + badgeR + 9);
      }
    }

    // Selected agent or tile reticle
    if (this.selectedAgent >= 0 && sim.agKind[this.selectedAgent] !== 0) {
      const sp = this.worldToScreen(sim.agX[this.selectedAgent], sim.agY[this.selectedAgent]);
      ctx.strokeStyle = '#ffd33d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, Math.max(9, this.zoom * 0.8), 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.selectedTile) {
      const sp = this.worldToScreen(this.selectedTile.x + 0.5, this.selectedTile.y + 0.5);
      ctx.strokeStyle = '#539bf5';
      ctx.lineWidth = 1.5;
      const sz = Math.max(8, this.zoom);
      ctx.strokeRect(sp.x - sz / 2, sp.y - sz / 2, sz, sz);
    }

    // Brush preview ring
    if (this.brushRadius > 0 && this.hoverWorld) {
      const hp = this.worldToScreen(this.hoverWorld.x, this.hoverWorld.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, this.brushRadius * this.zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      this.zoomAt(e.clientX, e.clientY, factor);
    }, { passive: false });

    this.canvas.addEventListener('pointerdown', (e) => {
      this.canvas.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 1) {
        this.dragStart = {
          x: e.clientX,
          y: e.clientY,
          cx: this.cx,
          cy: this.cy,
          moved: false,
        };
        this.pinchStart = null;
      } else if (this.pointers.size === 2) {
        const pts = [...this.pointers.values()];
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        this.pinchStart = {
          dist: Math.max(1, dist),
          zoom: this.zoom,
          midX: (pts[0].x + pts[1].x) / 2,
          midY: (pts[0].y + pts[1].y) / 2,
        };
        this.dragStart = null;
      }
    });

    this.canvas.addEventListener('pointermove', (e) => {
      this.hoverWorld = this.screenToWorld(e.clientX, e.clientY);
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.pointers.size === 2 && this.pinchStart) {
        const pts = [...this.pointers.values()];
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const before = this.screenToWorld(this.pinchStart.midX, this.pinchStart.midY);
        this.zoom = Math.max(0.6, Math.min(36, this.pinchStart.zoom * (dist / this.pinchStart.dist)));
        const after = this.screenToWorld(midX, midY);
        this.cx += before.x - after.x;
        this.cy += before.y - after.y;
        this.clampCamera();
        return;
      }

      if (this.pointers.size === 1 && this.dragStart) {
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        if (Math.hypot(dx, dy) > 5) this.dragStart.moved = true;
        if (this.dragStart.moved) {
          this.cx = this.dragStart.cx - dx / this.zoom;
          this.cy = this.dragStart.cy - dy / this.zoom;
          this.clampCamera();
        }
      }
    });

    const onUp = (e: PointerEvent) => {
      const wasTap = this.pointers.size === 1 && this.dragStart && !this.dragStart.moved;
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinchStart = null;
      if (this.pointers.size === 0) this.dragStart = null;
      if (wasTap) {
        const w = this.screenToWorld(e.clientX, e.clientY);
        if (w.x >= 0 && w.x < GRID_W && w.y >= 0 && w.y < GRID_H) {
          this.cb.onTap(w.x, w.y);
        }
      }
    };
    this.canvas.addEventListener('pointerup', onUp);
    this.canvas.addEventListener('pointercancel', onUp);
    this.canvas.addEventListener('pointerleave', () => {
      this.hoverWorld = null;
    });
  }
}

import {
  ETHOS_NAMES,
  PRESETS,
  TIER_NAMES,
  type AgentInspection,
  type BrushTool,
  type FactionInfo,
  type OverlayMode,
  type SimEvent,
  type SimParams,
  type SimStats,
  type TileInspection,
} from '../sim/bridge';

export interface HistorySample {
  survivors: number;
  zombies: number;
  settlements: number;
}

export interface HudCallbacks {
  onSpeedChange: (speed: number, paused: boolean) => void;
  onParamsChange: (params: SimParams) => void;
  onPresetSelect: (presetId: string) => void;
  onResetWorld: (seed: number, params: SimParams) => void;
  onOverlayChange: (overlay: OverlayMode) => void;
  onBrushChange: (brush: BrushTool) => void;
  onRecenter: () => void;
}

const SPEED_OPTIONS = [
  { label: '⏸', speed: 0, paused: true, title: 'Pause (Space)' },
  { label: '1x', speed: 1, paused: false, title: '1x Speed (1)' },
  { label: '5x', speed: 5, paused: false, title: '5x Speed (2)' },
  { label: '15x', speed: 15, paused: false, title: '15x Speed (3)' },
  { label: '40x', speed: 40, paused: false, title: '40x Speed (4)' },
];

export class Hud {
  private readonly root: HTMLDivElement;
  private readonly statsEl: HTMLDivElement;
  private readonly speedBtns: HTMLButtonElement[] = [];
  private readonly labDrawer: HTMLDivElement;
  private readonly telemetryDrawer: HTMLDivElement;
  private readonly helpModal: HTMLDivElement;
  private readonly inspectorCard: HTMLDivElement;
  private readonly sparkCanvas: HTMLCanvasElement;
  private readonly eventLogEl: HTMLDivElement;

  private params: SimParams;
  private seed: number;
  private activeBrush: BrushTool = 'inspect';
  private activeOverlay: OverlayMode = 0;
  private sliderInputs = new Map<keyof SimParams, { input: HTMLInputElement; val: HTMLSpanElement; fmt: (v: number) => string }>();
  private seedInput!: HTMLInputElement;
  private brushBtns = new Map<BrushTool, HTMLButtonElement>();
  private overlayBtns = new Map<OverlayMode, HTMLButtonElement>();

  constructor(
    uiParent: HTMLElement,
    initialParams: SimParams,
    initialSeed: number,
    private readonly cb: HudCallbacks,
  ) {
    this.params = { ...initialParams };
    this.seed = initialSeed;
    this.injectStyles();

    this.root = document.createElement('div');
    this.root.className = 'dg-root';
    uiParent.appendChild(this.root);

    // ---- Top Bar ----
    const topBar = document.createElement('div');
    topBar.className = 'dg-topbar';
    this.root.appendChild(topBar);

    const titleWrap = document.createElement('div');
    titleWrap.className = 'dg-brand';
    titleWrap.innerHTML = `<span class="dg-title">DEAD GRID</span><span class="dg-sub">512×512 WASM</span>`;
    topBar.appendChild(titleWrap);

    this.statsEl = document.createElement('div');
    this.statsEl.className = 'dg-stats';
    topBar.appendChild(this.statsEl);

    const controls = document.createElement('div');
    controls.className = 'dg-controls';
    topBar.appendChild(controls);

    for (let i = 0; i < SPEED_OPTIONS.length; i++) {
      const opt = SPEED_OPTIONS[i];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dg-btn' + (opt.speed === 1 ? ' active' : '');
      btn.textContent = opt.label;
      btn.title = opt.title;
      btn.addEventListener('click', () => {
        this.setSpeedVisual(opt.speed, opt.paused);
        this.cb.onSpeedChange(opt.speed, opt.paused);
      });
      this.speedBtns.push(btn);
      controls.appendChild(btn);
    }

    const labToggle = this.makeToggleBtn('Lab', () => {
      this.labDrawer.classList.toggle('open');
    });
    const telToggle = this.makeToggleBtn('Stats', () => {
      this.telemetryDrawer.classList.toggle('open');
    });
    const fitBtn = this.makeToggleBtn('Fit', () => this.cb.onRecenter());
    const helpBtn = this.makeToggleBtn('?', () => {
      this.helpModal.classList.toggle('open');
    });
    controls.append(labToggle, telToggle, fitBtn, helpBtn);

    // ---- Experiment Lab Drawer ----
    this.labDrawer = document.createElement('div');
    this.labDrawer.className = 'dg-drawer dg-lab';
    if (window.innerWidth >= 840) this.labDrawer.classList.add('open');
    this.root.appendChild(this.labDrawer);
    this.buildLabDrawer();

    // ---- Telemetry Drawer ----
    this.telemetryDrawer = document.createElement('div');
    this.telemetryDrawer.className = 'dg-drawer dg-telemetry';
    if (window.innerWidth >= 1060) this.telemetryDrawer.classList.add('open');
    this.root.appendChild(this.telemetryDrawer);

    const telHead = document.createElement('div');
    telHead.className = 'dg-sec-title';
    telHead.textContent = 'Society Telemetry';
    this.telemetryDrawer.appendChild(telHead);

    this.sparkCanvas = document.createElement('canvas');
    this.sparkCanvas.width = 280;
    this.sparkCanvas.height = 96;
    this.sparkCanvas.className = 'dg-spark';
    this.telemetryDrawer.appendChild(this.sparkCanvas);

    const logHead = document.createElement('div');
    logHead.className = 'dg-sec-title';
    logHead.style.marginTop = '8px';
    logHead.textContent = 'Chronicle';
    this.telemetryDrawer.appendChild(logHead);

    this.eventLogEl = document.createElement('div');
    this.eventLogEl.className = 'dg-event-log';
    this.telemetryDrawer.appendChild(this.eventLogEl);

    // ---- Inspector Card ----
    this.inspectorCard = document.createElement('div');
    this.inspectorCard.className = 'dg-inspector';
    this.root.appendChild(this.inspectorCard);

    // ---- Help Modal ----
    this.helpModal = document.createElement('div');
    this.helpModal.className = 'dg-help';
    this.helpModal.innerHTML = `
      <div class="dg-help-card">
        <div class="dg-help-head">
          <strong>Dead Grid — Simulation Lab</strong>
          <button type="button" class="dg-btn dg-help-close">✕</button>
        </div>
        <p>A DayZ-inspired post-apocalyptic society simulator running up to 32,768 agents on a 512×512 grid inside WebAssembly.</p>
        <ul>
          <li><strong>Pan:</strong> Drag (mouse or 1-finger touch), or WASD / Arrows</li>
          <li><strong>Zoom:</strong> Scroll wheel or 2-finger pinch (zoom in for grid &amp; individual agents)</li>
          <li><strong>Speed:</strong> Space (Pause), 1–4 (1x / 5x / 15x / 40x)</li>
          <li><strong>Lab:</strong> Tweak zombie speed, contagion, noise attraction, banditry, or paint hordes &amp; airdrops live.</li>
        </ul>
      </div>`;
    this.helpModal.querySelector('.dg-help-close')?.addEventListener('click', () => {
      this.helpModal.classList.remove('open');
    });
    this.root.appendChild(this.helpModal);
  }

  private makeToggleBtn(label: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dg-btn';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  setSpeedVisual(speed: number, paused: boolean): void {
    for (let i = 0; i < SPEED_OPTIONS.length; i++) {
      const opt = SPEED_OPTIONS[i];
      const match = paused ? opt.paused : (!opt.paused && opt.speed === speed);
      this.speedBtns[i].classList.toggle('active', match);
    }
  }

  syncParams(p: SimParams): void {
    this.params = { ...p };
    for (const [k, entry] of this.sliderInputs.entries()) {
      const v = p[k];
      entry.input.value = String(v);
      entry.val.textContent = entry.fmt(v);
    }
  }

  private buildLabDrawer(): void {
    const d = this.labDrawer;

    // Presets
    const pHead = document.createElement('div');
    pHead.className = 'dg-sec-title';
    pHead.textContent = 'Scenario Presets';
    d.appendChild(pHead);

    const pGrid = document.createElement('div');
    pGrid.className = 'dg-btn-grid';
    for (const p of PRESETS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dg-chip';
      b.textContent = p.label;
      b.title = p.description;
      b.addEventListener('click', () => {
        this.syncParams(p.params);
        this.cb.onPresetSelect(p.id);
      });
      pGrid.appendChild(b);
    }
    d.appendChild(pGrid);

    // Overlays
    const oHead = document.createElement('div');
    oHead.className = 'dg-sec-title';
    oHead.textContent = 'Map Overlay';
    d.appendChild(oHead);

    const oGrid = document.createElement('div');
    oGrid.className = 'dg-btn-grid';
    const overlays: [OverlayMode, string][] = [
      [0, 'Standard'],
      [1, 'Territory'],
      [2, 'Loot'],
      [3, 'Noise'],
    ];
    for (const [mode, label] of overlays) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dg-chip' + (mode === this.activeOverlay ? ' active' : '');
      b.textContent = label;
      b.addEventListener('click', () => {
        this.activeOverlay = mode;
        for (const [m, btn] of this.overlayBtns) btn.classList.toggle('active', m === mode);
        this.cb.onOverlayChange(mode);
      });
      this.overlayBtns.set(mode, b);
      oGrid.appendChild(b);
    }
    d.appendChild(oGrid);

    // Intervention Brushes
    const bHead = document.createElement('div');
    bHead.className = 'dg-sec-title';
    bHead.textContent = 'Tap / Click Tool';
    d.appendChild(bHead);

    const bGrid = document.createElement('div');
    bGrid.className = 'dg-btn-grid';
    const brushes: [BrushTool, string][] = [
      ['inspect', 'Inspect'],
      ['zombies', '+Horde'],
      ['survivors', '+Survivors'],
      ['airdrop', 'Airdrop'],
      ['clear', 'Clear'],
    ];
    for (const [tool, label] of brushes) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dg-chip' + (tool === this.activeBrush ? ' active' : '');
      b.textContent = label;
      b.addEventListener('click', () => {
        this.activeBrush = tool;
        for (const [t, btn] of this.brushBtns) btn.classList.toggle('active', t === tool);
        this.cb.onBrushChange(tool);
      });
      this.brushBtns.set(tool, b);
      bGrid.appendChild(b);
    }
    d.appendChild(bGrid);

    // Live Rules Sliders
    const sHead = document.createElement('div');
    sHead.className = 'dg-sec-title';
    sHead.textContent = 'Live Simulation Rules';
    d.appendChild(sHead);

    this.addSlider(d, 'zombieSpeed', 'Zombie Speed', 0.1, 1.0, 0.02, (v) => v.toFixed(2));
    this.addSlider(d, 'survivorSpeed', 'Survivor Speed', 0.2, 1.0, 0.02, (v) => v.toFixed(2));
    this.addSlider(d, 'infectionChance', 'Infection %', 0, 1.0, 0.05, (v) => `${Math.round(v * 100)}%`);
    this.addSlider(d, 'hungerRate', 'Hunger Drain', 0.2, 2.5, 0.1, (v) => `${v.toFixed(1)}x`);
    this.addSlider(d, 'lootRespawnRate', 'Loot Respawn', 0, 2.5, 0.1, (v) => `${v.toFixed(1)}x`);
    this.addSlider(d, 'hordeHearing', 'Noise Hearing', 0.2, 2.5, 0.1, (v) => `${v.toFixed(1)}x`);
    this.addSlider(d, 'settlementGrowth', 'Settlement Growth', 0.2, 2.5, 0.1, (v) => `${v.toFixed(1)}x`);
    this.addSlider(d, 'banditry', 'Banditry %', 0, 1.0, 0.05, (v) => `${Math.round(v * 100)}%`);
    this.addSlider(d, 'zombieMigration', 'Edge Migration', 0, 1.5, 0.1, (v) => `${v.toFixed(1)}x`);

    // World Generator
    const wHead = document.createElement('div');
    wHead.className = 'dg-sec-title';
    wHead.textContent = 'World Generator';
    d.appendChild(wHead);

    this.addSlider(d, 'initialSurvivors', 'Init Survivors', 200, 8000, 100, (v) => String(Math.round(v)));
    this.addSlider(d, 'initialZombies', 'Init Zombies', 500, 24000, 500, (v) => String(Math.round(v)));
    this.addSlider(d, 'cityDensity', 'City Density', 0.4, 1.8, 0.1, (v) => `${v.toFixed(1)}x`);

    const seedRow = document.createElement('div');
    seedRow.className = 'dg-seed-row';
    this.seedInput = document.createElement('input');
    this.seedInput.type = 'number';
    this.seedInput.className = 'dg-input';
    this.seedInput.value = String(this.seed);
    this.seedInput.ariaLabel = 'World Seed';

    const randBtn = document.createElement('button');
    randBtn.type = 'button';
    randBtn.className = 'dg-btn';
    randBtn.textContent = '🎲';
    randBtn.title = 'Random Seed';
    randBtn.addEventListener('click', () => {
      this.seed = Math.floor(1 + Math.random() * 999999);
      this.seedInput.value = String(this.seed);
      this.cb.onResetWorld(this.seed, { ...this.params });
    });

    const regenBtn = document.createElement('button');
    regenBtn.type = 'button';
    regenBtn.className = 'dg-btn active';
    regenBtn.textContent = 'New World';
    regenBtn.addEventListener('click', () => {
      const parsed = parseInt(this.seedInput.value, 10);
      this.seed = Number.isFinite(parsed) && parsed > 0 ? parsed : 1337;
      this.cb.onResetWorld(this.seed, { ...this.params });
    });

    seedRow.append(this.seedInput, randBtn, regenBtn);
    d.appendChild(seedRow);
  }

  private addSlider(
    parent: HTMLElement,
    key: keyof SimParams,
    label: string,
    min: number,
    max: number,
    step: number,
    fmt: (v: number) => string,
  ): void {
    const wrap = document.createElement('label');
    wrap.className = 'dg-slider';
    const top = document.createElement('div');
    top.className = 'dg-slider-top';
    const lbl = document.createElement('span');
    lbl.textContent = label;
    const val = document.createElement('span');
    val.className = 'dg-slider-val';
    val.textContent = fmt(this.params[key]);
    top.append(lbl, val);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(this.params[key]);
    input.addEventListener('input', () => {
      const num = parseFloat(input.value);
      this.params[key] = num;
      val.textContent = fmt(num);
      this.cb.onParamsChange({ ...this.params });
    });

    wrap.append(top, input);
    parent.appendChild(wrap);
    this.sliderInputs.set(key, { input, val, fmt });
  }

  updateStats(stats: SimStats, history: HistorySample[]): void {
    this.statsEl.innerHTML = `
      <span class="dg-stat"><b>Day ${stats.day}</b> <small>t:${stats.tick}</small></span>
      <span class="dg-stat dg-s">Surv <b>${stats.survivors.toLocaleString()}</b></span>
      <span class="dg-stat dg-z">Zomb <b>${stats.zombies.toLocaleString()}</b></span>
      <span class="dg-stat dg-i">Inf <b>${stats.infected}</b></span>
      <span class="dg-stat dg-f">Towns <b>${stats.settlements}</b></span>
    `;
    this.drawSparkline(history);
  }

  appendEvents(events: SimEvent[]): void {
    if (events.length === 0) return;
    for (const ev of events) {
      const row = document.createElement('div');
      row.className = 'dg-ev';
      row.textContent = ev.text;
      this.eventLogEl.prepend(row);
    }
    while (this.eventLogEl.children.length > 35) {
      this.eventLogEl.lastElementChild?.remove();
    }
  }

  showInspection(
    tile: TileInspection | null,
    agent: AgentInspection | null,
    factions: FactionInfo[],
  ): void {
    if (!tile && !agent) {
      this.inspectorCard.classList.remove('open');
      return;
    }
    this.inspectorCard.classList.add('open');
    const facMap = new Map<number, FactionInfo>();
    for (const f of factions) facMap.set(f.id, f);

    const lines: string[] = [];
    if (agent) {
      const f = agent.factionId >= 0 ? facMap.get(agent.factionId) : undefined;
      lines.push(
        `<div class="dg-ins-head"><strong>${agent.kind === 'zombie' ? 'Infected Zombie' : `${agent.traitName} Survivor`}</strong><span>#${agent.index}</span></div>`,
        `<div>State: <b>${agent.stateName}</b> · HP: <b>${agent.hp}</b></div>`,
      );
      if (agent.kind === 'survivor') {
        lines.push(
          `<div>Hunger: <b>${agent.hunger}</b> · Food: <b>${agent.food}</b> · Gear: <b>${agent.gear}</b></div>`,
          `<div>Infection: <b>${agent.infection > 0 ? `${Math.round((agent.infection / 250) * 100)}%` : 'Clean'}</b> · Age: <b>${agent.age}</b></div>`,
          `<div>Faction: <b style="color:${f ? f.colorCss : '#8b949e'}">${f ? f.name : 'Lone Wanderer'}</b></div>`,
        );
      }
    }
    if (tile) {
      const f = tile.claimFactionId >= 0 ? facMap.get(tile.claimFactionId) : undefined;
      lines.push(
        `<div class="dg-ins-tile">Tile (${tile.x}, ${tile.y}): <b>${tile.tileName}</b></div>`,
        `<div>Loot Food: <b>${tile.food}</b> · Gear: <b>${tile.gear}</b> · Noise: <b>${tile.scent}</b></div>`,
      );
      if (f) {
        lines.push(
          `<div>Claim: <b style="color:${f.colorCss}">${f.name}</b> (${TIER_NAMES[f.level] ?? 'Camp'}, ${ETHOS_NAMES[f.ethos] ?? 'Coop'}, Pop ${f.pop}, Food ${f.food})</div>`,
        );
      }
    }
    this.inspectorCard.innerHTML = lines.join('');
  }

  private drawSparkline(history: HistorySample[]): void {
    const ctx = this.sparkCanvas.getContext('2d');
    if (!ctx || history.length < 2) return;
    const w = this.sparkCanvas.width;
    const h = this.sparkCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    let maxPop = 100;
    for (const s of history) {
      if (s.survivors > maxPop) maxPop = s.survivors;
      if (s.zombies > maxPop) maxPop = s.zombies;
    }

    const drawSeries = (color: string, pick: (s: HistorySample) => number, scale: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = (i / (history.length - 1)) * (w - 4) + 2;
        const y = h - 4 - (pick(history[i]) / scale) * (h - 10);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    drawSeries('#e5534b', (s) => s.zombies, maxPop);
    drawSeries('#539bf5', (s) => s.survivors, maxPop);
    drawSeries('#57ab5a', (s) => s.settlements * 200, maxPop);
  }

  private injectStyles(): void {
    if (document.getElementById('dg-styles')) return;
    const st = document.createElement('style');
    st.id = 'dg-styles';
    st.textContent = `
      .dg-root { position: fixed; inset: 0; pointer-events: none; font-size: 12px; }
      .dg-topbar {
        pointer-events: auto;
        display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
        padding: calc(6px + env(safe-area-inset-top)) 10px 6px 10px;
        background: rgba(13, 17, 23, 0.88);
        border-bottom: 1px solid #30363d;
        backdrop-filter: blur(6px);
      }
      .dg-brand { display: flex; align-items: baseline; gap: 6px; margin-right: 4px; }
      .dg-title { font-weight: 800; letter-spacing: 0.08em; color: #f0f6fc; font-size: 13px; }
      .dg-sub { font-size: 10px; color: #8b949e; }
      .dg-stats { display: flex; flex-wrap: wrap; gap: 8px; flex: 1; min-width: 200px; }
      .dg-stat { color: #c9d1d9; white-space: nowrap; }
      .dg-stat.dg-s b { color: #539bf5; }
      .dg-stat.dg-z b { color: #e5534b; }
      .dg-stat.dg-i b { color: #d6d63f; }
      .dg-stat.dg-f b { color: #57ab5a; }
      .dg-controls { display: flex; flex-wrap: wrap; gap: 4px; }
      .dg-btn, .dg-chip {
        min-height: 44px; min-width: 44px; padding: 0 10px;
        background: #161b22; color: #e6edf3;
        border: 1px solid #30363d; border-radius: 6px;
        font: inherit; font-weight: 600; cursor: pointer;
      }
      .dg-chip { min-height: 36px; font-size: 11px; padding: 4px 8px; }
      .dg-btn:hover, .dg-chip:hover { border-color: #58a6ff; }
      .dg-btn.active, .dg-chip.active { background: #1f6feb; border-color: #58a6ff; color: #fff; }
      .dg-drawer {
        pointer-events: auto;
        position: fixed; top: 64px; bottom: calc(10px + env(safe-area-inset-bottom));
        width: 270px; max-width: 82vw;
        background: rgba(13, 17, 23, 0.92);
        border: 1px solid #30363d; border-radius: 8px;
        padding: 10px; overflow-y: auto;
        display: none; flex-direction: column; gap: 8px;
      }
      .dg-drawer.open { display: flex; }
      .dg-lab { left: 10px; }
      .dg-telemetry { right: 10px; width: 290px; }
      .dg-sec-title { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #8b949e; }
      .dg-btn-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; }
      .dg-slider { display: flex; flex-direction: column; gap: 2px; }
      .dg-slider-top { display: flex; justify-content: space-between; color: #c9d1d9; font-size: 11px; }
      .dg-slider-val { color: #58a6ff; font-variant-numeric: tabular-nums; }
      .dg-slider input[type="range"] { width: 100%; accent-color: #58a6ff; height: 22px; }
      .dg-seed-row { display: flex; gap: 4px; align-items: center; }
      .dg-input {
        flex: 1; min-width: 0; height: 44px; padding: 0 8px;
        background: #0d1117; color: #e6edf3; border: 1px solid #30363d; border-radius: 6px;
        font: inherit;
      }
      .dg-spark { width: 100%; height: 96px; border: 1px solid #30363d; border-radius: 6px; }
      .dg-event-log { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #c9d1d9; }
      .dg-ev { padding: 4px 6px; background: #161b22; border-radius: 4px; border-left: 2px solid #58a6ff; }
      .dg-inspector {
        pointer-events: auto;
        position: fixed; left: 50%; transform: translateX(-50%);
        bottom: calc(10px + env(safe-area-inset-bottom));
        min-width: 240px; max-width: 92vw;
        background: rgba(13, 17, 23, 0.94); border: 1px solid #30363d; border-radius: 8px;
        padding: 8px 12px; display: none; flex-direction: column; gap: 3px;
      }
      .dg-inspector.open { display: flex; }
      .dg-ins-head { display: flex; justify-content: space-between; color: #ffd33d; }
      .dg-ins-tile { color: #8b949e; margin-top: 2px; }
      .dg-help {
        pointer-events: auto; position: fixed; inset: 0;
        background: rgba(0, 0, 0, 0.65); display: none; align-items: center; justify-content: center; padding: 16px;
      }
      .dg-help.open { display: flex; }
      .dg-help-card {
        max-width: 420px; background: #161b22; border: 1px solid #30363d; border-radius: 10px;
        padding: 16px; color: #e6edf3; line-height: 1.45;
      }
      .dg-help-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      @media (max-width: 720px) {
        .dg-drawer { top: 104px; }
      }
    `;
    document.head.appendChild(st);
  }
}

import {
  ETHOS_NAMES,
  PRESETS,
  TIER_NAMES,
  WATER_STYLE_NAMES,
  type AgentInspection,
  type BrushTool,
  type FactionInfo,
  type GridSize,
  type OverlayMode,
  type RepublicInfo,
  type SimEvent,
  type SimParams,
  type SimStats,
  type TileInspection,
  type WaterStyle,
} from '../sim/bridge';
import {
  deleteScenario,
  exportScenarioJson,
  importScenarioJson,
  loadSavedScenarios,
  saveScenario,
  type SavedScenario,
} from '../sim/scenarios';

export interface HistorySample {
  tick: number;
  day: number;
  humans: number;
  zombies: number;
  animals: number;
  soloHumans: number;
  groupHumans: number;
  societyHumans: number;
  settlements: number;
  zombiePacks: number;
  pdCoops: number;
  pdDefects: number;
  pdMutualCoop: number;
  pdBetrayals: number;
  avgFood: number;
  avgWater: number;
  avgGear: number;
  republics: number;
  roadTiles: number;
  roadsBuilt: number;
  territoryTiles: number;
  farmsBuilt: number;
  terraforms: number;
  disasters: number;
  avgAdaptTrust: number;
  stratCoop: number;
  stratRecip: number;
  stratDefect: number;
  activeFires: number;
}

export interface HudCallbacks {
  onSpeedChange: (speed: number, paused: boolean) => void;
  onParamsChange: (params: SimParams) => void;
  onPresetSelect: (presetId: string) => void;
  onResetWorld: (seed: number, params: SimParams) => void;
  onOverlayChange: (overlay: OverlayMode) => void;
  onBrushChange: (brush: BrushTool, radius: number, count: number) => void;
  onRecenter: () => void;
  onOpenOptimizer: () => void;
  onOpenEconomy: () => void;
}

const SPEED_OPTIONS = [
  { label: '⏸', speed: 0, paused: true, title: 'Pause (Space)' },
  { label: '0.1x', speed: 0.1, paused: false, title: '0.1x Slow Motion' },
  { label: '0.25x', speed: 0.25, paused: false, title: '0.25x Slow Motion' },
  { label: '0.5x', speed: 0.5, paused: false, title: '0.5x Slow Motion' },
  { label: '1x', speed: 1, paused: false, title: '1x Speed (1)' },
  { label: '5x', speed: 5, paused: false, title: '5x Speed (2)' },
  { label: '15x', speed: 15, paused: false, title: '15x Speed (3)' },
  { label: '40x', speed: 40, paused: false, title: '40x Speed (4)' },
];

type GraphTab = 'populations' | 'social' | 'pd' | 'genetics' | 'resources' | 'nations';

export class Hud {
  private readonly root: HTMLDivElement;
  private readonly statsEl: HTMLDivElement;
  private readonly speedBtns: HTMLButtonElement[] = [];
  private readonly labDrawer: HTMLDivElement;
  private readonly telemetryDrawer: HTMLDivElement;
  private readonly helpModal: HTMLDivElement;
  private readonly graphsModal: HTMLDivElement;
  private readonly graphCanvas: HTMLCanvasElement;
  private readonly graphLegendEl: HTMLDivElement;
  private readonly graphReadoutEl: HTMLDivElement;
  private readonly inspectorCard: HTMLDivElement;
  private readonly sparkCanvas: HTMLCanvasElement;
  private readonly eventLogEl: HTMLDivElement;

  private params: SimParams;
  private seed: number;
  private activeBrush: BrushTool = 'inspect';
  private brushRadius = 12;
  private brushCount = 200;
  private activeOverlay: OverlayMode = 0;
  private activeGraphTab: GraphTab = 'populations';
  private lastHistory: HistorySample[] = [];
  private graphScrubIdx: number | null = null;

  private sliderInputs = new Map<keyof SimParams, { input: HTMLInputElement; val: HTMLSpanElement; fmt: (v: number) => string }>();
  private gridSelect!: HTMLSelectElement;
  private waterSelect!: HTMLSelectElement;
  private seedInput!: HTMLInputElement;
  private savedListEl!: HTMLDivElement;
  private scenarioNameInput!: HTMLInputElement;
  private brushBtns = new Map<BrushTool, HTMLButtonElement>();
  private overlayBtns = new Map<OverlayMode, HTMLButtonElement>();
  private graphTabBtns = new Map<GraphTab, HTMLButtonElement>();

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
    titleWrap.innerHTML = `<span class="dg-title">DEAD GRID</span><span class="dg-sub">256K WASM</span>`;
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
      btn.className = 'dg-btn dg-spd-btn' + (opt.speed === 1 ? ' active' : '');
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
    const graphsBtn = this.makeToggleBtn('Graphs', () => {
      this.graphsModal.classList.toggle('open');
      if (this.graphsModal.classList.contains('open')) {
        this.drawHistoricalGraph(this.lastHistory);
      }
    });
    const optBtn = this.makeToggleBtn('Lab ML', () => this.cb.onOpenOptimizer());
    const econBtn = this.makeToggleBtn('Economy', () => this.cb.onOpenEconomy());
    const fitBtn = this.makeToggleBtn('Fit', () => this.cb.onRecenter());
    const helpBtn = this.makeToggleBtn('?', () => {
      this.helpModal.classList.toggle('open');
    });
    controls.append(labToggle, telToggle, graphsBtn, optBtn, econBtn, fitBtn, helpBtn);

    // ---- Experiment Lab Drawer ----
    this.labDrawer = document.createElement('div');
    this.labDrawer.className = 'dg-drawer dg-lab';
    if (window.innerWidth >= 840) this.labDrawer.classList.add('open');
    this.root.appendChild(this.labDrawer);
    this.buildLabDrawer();

    // ---- Telemetry Drawer ----
    this.telemetryDrawer = document.createElement('div');
    this.telemetryDrawer.className = 'dg-drawer dg-telemetry';
    if (window.innerWidth >= 1100) this.telemetryDrawer.classList.add('open');
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

    const openGraphBtn = document.createElement('button');
    openGraphBtn.type = 'button';
    openGraphBtn.className = 'dg-chip';
    openGraphBtn.textContent = 'Open Historical Graphs';
    openGraphBtn.addEventListener('click', () => {
      this.graphsModal.classList.add('open');
      this.drawHistoricalGraph(this.lastHistory);
    });
    this.telemetryDrawer.appendChild(openGraphBtn);

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

    // ---- Historical Graphs Modal ----
    this.graphsModal = document.createElement('div');
    this.graphsModal.className = 'dg-help';
    const gCard = document.createElement('div');
    gCard.className = 'dg-graph-card';
    this.graphsModal.appendChild(gCard);

    const gHead = document.createElement('div');
    gHead.className = 'dg-help-head';
    gHead.innerHTML = `<strong>Historical Simulation Analytics</strong>`;
    const gClose = document.createElement('button');
    gClose.type = 'button';
    gClose.className = 'dg-btn';
    gClose.textContent = '✕';
    gClose.addEventListener('click', () => this.graphsModal.classList.remove('open'));
    gHead.appendChild(gClose);
    gCard.appendChild(gHead);

    const gTabs = document.createElement('div');
    gTabs.className = 'dg-graph-tabs';
    const tabs: [GraphTab, string][] = [
      ['populations', 'Populations'],
      ['social', 'Social Tiers'],
      ['pd', "Prisoner's Dilemma"],
      ['genetics', 'Genetics & Trust'],
      ['resources', 'Inventory Avg'],
      ['nations', 'Nations & Roads'],
    ];
    for (const [id, label] of tabs) {
      const tb = document.createElement('button');
      tb.type = 'button';
      tb.className = 'dg-chip' + (id === this.activeGraphTab ? ' active' : '');
      tb.textContent = label;
      tb.addEventListener('click', () => {
        this.activeGraphTab = id;
        for (const [tid, btn] of this.graphTabBtns) btn.classList.toggle('active', tid === id);
        this.drawHistoricalGraph(this.lastHistory);
      });
      this.graphTabBtns.set(id, tb);
      gTabs.appendChild(tb);
    }
    gCard.appendChild(gTabs);

    this.graphCanvas = document.createElement('canvas');
    this.graphCanvas.width = 680;
    this.graphCanvas.height = 280;
    this.graphCanvas.className = 'dg-graph-canvas';
    this.graphCanvas.addEventListener('pointermove', (e) => {
      if (this.lastHistory.length < 2) return;
      const rect = this.graphCanvas.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
      this.graphScrubIdx = Math.round(frac * (this.lastHistory.length - 1));
      this.drawHistoricalGraph(this.lastHistory);
    });
    this.graphCanvas.addEventListener('pointerleave', () => {
      this.graphScrubIdx = null;
      this.drawHistoricalGraph(this.lastHistory);
    });
    gCard.appendChild(this.graphCanvas);

    this.graphLegendEl = document.createElement('div');
    this.graphLegendEl.className = 'dg-graph-legend';
    gCard.appendChild(this.graphLegendEl);

    this.graphReadoutEl = document.createElement('div');
    this.graphReadoutEl.className = 'dg-graph-readout';
    gCard.appendChild(this.graphReadoutEl);
    this.root.appendChild(this.graphsModal);

    // ---- Help Modal ----
    this.helpModal = document.createElement('div');
    this.helpModal.className = 'dg-help';
    this.helpModal.innerHTML = `
      <div class="dg-help-card">
        <div class="dg-help-head">
          <strong>Dead Grid — 256K Sandbox Lab</strong>
          <button type="button" class="dg-btn dg-help-close">✕</button>
        </div>
        <p>A DayZ-inspired post-apocalyptic society sandbox running up to 262,144 agents across 512×512 to 1024×1024 worlds in WebAssembly.</p>
        <ul>
          <li><strong>Pan:</strong> Drag (with Inspect tool) or Right-Drag anytime, or WASD / Arrows</li>
          <li><strong>Paint:</strong> Select +Zombies / +Humans / +Animals / Airdrop / Clear and drag across the map</li>
          <li><strong>Zoom:</strong> Scroll wheel or 2-finger pinch (zoom in for grid &amp; individual agents)</li>
          <li><strong>Prisoner's Dilemma:</strong> Humans negotiate resources based on Cooperation, Greed, Trust &amp; Reputation</li>
          <li><strong>Scenarios:</strong> Edit world size, water style, rules, and save or export/import JSON scenarios.</li>
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
      const match = paused ? opt.paused : (!opt.paused && Math.abs(opt.speed - speed) < 0.001);
      this.speedBtns[i].classList.toggle('active', match);
    }
  }

  setBrushTool(tool: BrushTool): void {
    this.activeBrush = tool;
    for (const [t, btn] of this.brushBtns) btn.classList.toggle('active', t === tool);
    this.cb.onBrushChange(tool, this.brushRadius, this.brushCount);
  }

  syncParams(p: SimParams): void {
    this.params = { ...p };
    if (this.gridSelect) this.gridSelect.value = String(p.gridSize);
    if (this.waterSelect) this.waterSelect.value = String(p.waterStyle);
    for (const [k, entry] of this.sliderInputs.entries()) {
      const v = p[k] as number;
      entry.input.value = String(v);
      entry.val.textContent = entry.fmt(v);
    }
  }

  private buildLabDrawer(): void {
    const d = this.labDrawer;

    // Scenarios
    const pHead = document.createElement('div');
    pHead.className = 'dg-sec-title';
    pHead.textContent = 'Scenarios';
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
      [4, 'Topography'],
      [5, 'Nations'],
      [6, 'Water'],
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

    // Paint / Brush Tools
    const bHead = document.createElement('div');
    bHead.className = 'dg-sec-title';
    bHead.textContent = 'Paint / Inspect Tool';
    d.appendChild(bHead);

    const bGrid = document.createElement('div');
    bGrid.className = 'dg-btn-grid';
    const brushes: [BrushTool, string][] = [
      ['inspect', 'Inspect'],
      ['zombies', '+Zombies'],
      ['humans', '+Humans'],
      ['animals', '+Animals'],
      ['airdrop', 'Airdrop'],
      ['clear', 'Clear'],
      ['wildfire', '🔥 Fire'],
      ['extinguish', '💧 Extinguish'],
      ['flood', '🌊 Flood'],
      ['quake', '🌋 Quake'],
      ['plague', '☣ Plague'],
      ['drought', '☀ Drought'],
      ['zone-city', '🏙 City'],
      ['zone-military', '🪖 Military'],
      ['zone-farm', '🌾 Farm'],
      ['zone-industrial', '🏭 Industry'],
    ];
    for (const [tool, label] of brushes) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dg-chip' + (tool === this.activeBrush ? ' active' : '');
      b.textContent = label;
      b.addEventListener('click', () => {
        this.activeBrush = tool;
        for (const [t, btn] of this.brushBtns) btn.classList.toggle('active', t === tool);
        this.cb.onBrushChange(tool, this.brushRadius, this.brushCount);
      });
      this.brushBtns.set(tool, b);
      bGrid.appendChild(b);
    }
    d.appendChild(bGrid);

    this.addLocalSlider(d, 'Brush Radius', 3, 45, 1, this.brushRadius, (v) => `${v}t`, (v) => {
      this.brushRadius = v;
      this.cb.onBrushChange(this.activeBrush, this.brushRadius, this.brushCount);
    });
    this.addLocalSlider(d, 'Brush Density', 10, 800, 10, this.brushCount, (v) => `${v}`, (v) => {
      this.brushCount = v;
      this.cb.onBrushChange(this.activeBrush, this.brushRadius, this.brushCount);
    });

    // Live Rules
    const sHead = document.createElement('div');
    sHead.className = 'dg-sec-title';
    sHead.textContent = 'Live Simulation Rules';
    d.appendChild(sHead);

    this.addSlider(d, 'zombieSpeed', 'Zombie Speed', 0.1, 1.0, 0.02, (v) => v.toFixed(2));
    this.addSlider(d, 'humanSpeed', 'Human Speed', 0.2, 1.0, 0.02, (v) => v.toFixed(2));
    this.addSlider(d, 'animalSpeed', 'Animal Speed', 0.2, 1.0, 0.02, (v) => v.toFixed(2));
    this.addSlider(d, 'infectionChance', 'Infection %', 0, 1.0, 0.05, (v) => `${Math.round(v * 100)}%`);
    this.addSlider(d, 'hungerRate', 'Hunger Drain', 0.2, 2.5, 0.1, (v) => `${v.toFixed(1)}x`);
    this.addSlider(d, 'thirstRate', 'Thirst Drain', 0.2, 2.5, 0.1, (v) => `${v.toFixed(1)}x`);
    this.addSlider(d, 'lootRespawnRate', 'Loot Respawn', 0, 2.5, 0.1, (v) => `${v.toFixed(1)}x`);
    this.addSlider(d, 'hordeHearing', 'Noise Hearing', 0.2, 2.5, 0.1, (v) => `${v.toFixed(1)}x`);
    this.addSlider(d, 'settlementGrowth', 'Society Growth', 0.2, 2.5, 0.1, (v) => `${v.toFixed(1)}x`);
    this.addSlider(d, 'banditry', 'Banditry %', 0, 1.0, 0.05, (v) => `${Math.round(v * 100)}%`);
    this.addSlider(d, 'cooperationBias', 'PD Coop Bias', 0, 1.0, 0.05, (v) => `${Math.round(v * 100)}%`);
    this.addSlider(d, 'roadDecayRate', 'Road Decay', 0, 1.5, 0.05, (v) => `${v.toFixed(2)}x`);
    this.addSlider(d, 'roadBuildCost', 'Road Cost', 0.25, 2.5, 0.05, (v) => `${v.toFixed(2)}x`);
    this.addSlider(d, 'waterFlowRate', 'Water Flow', 0, 2.0, 0.05, (v) => `${v.toFixed(2)}x`);
    this.addSlider(d, 'disasterRate', 'Disaster Rate', 0, 2.0, 0.05, (v) => `${v.toFixed(2)}x`);
    this.addSlider(d, 'fireSpreadRate', 'Fire Spread', 0, 1.5, 0.05, (v) => `${v.toFixed(2)}x`);
    this.addSlider(d, 'geneticMutationRate', 'Gene Mutation', 0, 0.5, 0.02, (v) => `${Math.round(v * 100)}%`);
    this.addSlider(d, 'zombieMigration', 'Edge Migration', 0, 1.5, 0.1, (v) => `${v.toFixed(1)}x`);

    // World Generator
    const wHead = document.createElement('div');
    wHead.className = 'dg-sec-title';
    wHead.textContent = 'World & Sandbox Generator';
    d.appendChild(wHead);

    const selRow = document.createElement('div');
    selRow.className = 'dg-btn-grid';

    this.gridSelect = document.createElement('select');
    this.gridSelect.className = 'dg-select';
    for (const sz of [512, 768, 1024] as GridSize[]) {
      const opt = document.createElement('option');
      opt.value = String(sz);
      opt.textContent = `${sz}×${sz} Grid`;
      if (sz === this.params.gridSize) opt.selected = true;
      this.gridSelect.appendChild(opt);
    }
    this.gridSelect.addEventListener('change', () => {
      this.params.gridSize = Number(this.gridSelect.value) as GridSize;
    });

    this.waterSelect = document.createElement('select');
    this.waterSelect.className = 'dg-select';
    WATER_STYLE_NAMES.forEach((name, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = name;
      if (idx === this.params.waterStyle) opt.selected = true;
      this.waterSelect.appendChild(opt);
    });
    this.waterSelect.addEventListener('change', () => {
      this.params.waterStyle = Number(this.waterSelect.value) as WaterStyle;
    });

    selRow.append(this.gridSelect, this.waterSelect);
    d.appendChild(selRow);

    this.addSlider(d, 'initialHumans', 'Init Humans', 0, 80000, 500, (v) => v.toLocaleString());
    this.addSlider(d, 'initialZombies', 'Init Zombies', 0, 150000, 1000, (v) => v.toLocaleString());
    this.addSlider(d, 'initialAnimals', 'Init Animals', 0, 30000, 500, (v) => v.toLocaleString());
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

    // Scenario Save / Export / Import
    const scHead = document.createElement('div');
    scHead.className = 'dg-sec-title';
    scHead.textContent = 'Save / Export Scenarios';
    d.appendChild(scHead);

    const saveRow = document.createElement('div');
    saveRow.className = 'dg-seed-row';
    this.scenarioNameInput = document.createElement('input');
    this.scenarioNameInput.type = 'text';
    this.scenarioNameInput.className = 'dg-input';
    this.scenarioNameInput.placeholder = 'Scenario name...';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'dg-btn';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      const list = saveScenario(this.scenarioNameInput.value, this.seed, this.params);
      this.scenarioNameInput.value = '';
      this.renderSavedList(list);
    });
    saveRow.append(this.scenarioNameInput, saveBtn);
    d.appendChild(saveRow);

    const ioRow = document.createElement('div');
    ioRow.className = 'dg-btn-grid';

    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 'dg-chip';
    exportBtn.textContent = 'Export JSON';
    exportBtn.addEventListener('click', () => {
      const json = exportScenarioJson(this.scenarioNameInput.value || 'Dead Grid Scenario', this.seed, this.params);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dead-grid-scenario-${this.seed}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    const importFile = document.createElement('input');
    importFile.type = 'file';
    importFile.accept = '.json,application/json';
    importFile.style.display = 'none';
    importFile.addEventListener('change', async () => {
      const file = importFile.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = importScenarioJson(text);
        this.seed = imported.seed;
        this.seedInput.value = String(this.seed);
        this.syncParams(imported.params);
        this.cb.onResetWorld(this.seed, { ...this.params });
      } catch (err) {
        console.error('Scenario import failed:', err);
      }
      importFile.value = '';
    });

    const importBtn = document.createElement('button');
    importBtn.type = 'button';
    importBtn.className = 'dg-chip';
    importBtn.textContent = 'Import JSON';
    importBtn.addEventListener('click', () => importFile.click());

    ioRow.append(exportBtn, importBtn, importFile);
    d.appendChild(ioRow);

    this.savedListEl = document.createElement('div');
    this.savedListEl.className = 'dg-saved-list';
    d.appendChild(this.savedListEl);
    this.renderSavedList(loadSavedScenarios());
  }

  private renderSavedList(list: SavedScenario[]): void {
    this.savedListEl.innerHTML = '';
    for (const sc of list) {
      const row = document.createElement('div');
      row.className = 'dg-saved-row';
      const loadBtn = document.createElement('button');
      loadBtn.type = 'button';
      loadBtn.className = 'dg-chip dg-saved-load';
      loadBtn.textContent = `${sc.name} (${sc.params.gridSize})`;
      loadBtn.addEventListener('click', () => {
        this.seed = sc.seed;
        this.seedInput.value = String(sc.seed);
        this.syncParams(sc.params);
        this.cb.onResetWorld(this.seed, { ...this.params });
      });
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'dg-chip';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => {
        this.renderSavedList(deleteScenario(sc.id));
      });
      row.append(loadBtn, delBtn);
      this.savedListEl.appendChild(row);
    }
  }

  private addLocalSlider(
    parent: HTMLElement,
    label: string,
    min: number,
    max: number,
    step: number,
    initial: number,
    fmt: (v: number) => string,
    onChange: (v: number) => void,
  ): void {
    const wrap = document.createElement('label');
    wrap.className = 'dg-slider';
    const top = document.createElement('div');
    top.className = 'dg-slider-top';
    const lbl = document.createElement('span');
    lbl.textContent = label;
    const val = document.createElement('span');
    val.className = 'dg-slider-val';
    val.textContent = fmt(initial);
    top.append(lbl, val);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(initial);
    input.addEventListener('input', () => {
      const num = parseFloat(input.value);
      val.textContent = fmt(num);
      onChange(num);
    });
    wrap.append(top, input);
    parent.appendChild(wrap);
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
    val.textContent = fmt(this.params[key] as number);
    top.append(lbl, val);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(this.params[key]);
    input.addEventListener('input', () => {
      const num = parseFloat(input.value);
      (this.params[key] as number) = num;
      val.textContent = fmt(num);
      this.cb.onParamsChange({ ...this.params });
    });

    wrap.append(top, input);
    parent.appendChild(wrap);
    this.sliderInputs.set(key, { input, val, fmt });
  }

  updateStats(stats: SimStats, history: HistorySample[]): void {
    this.lastHistory = history;
    this.statsEl.innerHTML = `
      <span class="dg-stat"><b>Day ${stats.day}</b> <small>t:${stats.tick}</small></span>
      <span class="dg-stat dg-s">Hum <b>${stats.humans.toLocaleString()}</b></span>
      <span class="dg-stat dg-z">Zomb <b>${stats.zombies.toLocaleString()}</b></span>
      <span class="dg-stat dg-a">Wild <b>${stats.animals.toLocaleString()}</b></span>
      <span class="dg-stat dg-f">Soc <b>${stats.settlements}</b> · Rep <b>${stats.republics}</b></span>
      <span class="dg-stat dg-i">Roads <b>${stats.roadTiles.toLocaleString()}</b></span>
    `;
    this.drawSparkline(history);
    if (this.graphsModal.classList.contains('open')) {
      this.drawHistoricalGraph(history);
    }
  }

  appendEvents(events: SimEvent[]): void {
    if (events.length === 0) return;
    for (const ev of events) {
      const row = document.createElement('div');
      row.className = 'dg-ev';
      row.textContent = ev.text;
      this.eventLogEl.prepend(row);
    }
    while (this.eventLogEl.children.length > 40) {
      this.eventLogEl.lastElementChild?.remove();
    }
  }

  showInspection(
    tile: TileInspection | null,
    agent: AgentInspection | null,
    factions: FactionInfo[],
    republics: RepublicInfo[] = [],
  ): void {
    if (!tile && !agent) {
      this.inspectorCard.classList.remove('open');
      return;
    }
    this.inspectorCard.classList.add('open');
    const facMap = new Map<number, FactionInfo>();
    for (const f of factions) facMap.set(f.id, f);
    const repMap = new Map<number, RepublicInfo>();
    for (const r of republics) repMap.set(r.id, r);

    const lines: string[] = [];
    if (agent) {
      const f = agent.socialName === 'Society' ? facMap.get(agent.groupId) : undefined;
      const rep = f && f.republicId >= 0 ? repMap.get(f.republicId) : undefined;
      lines.push(
        `<div class="dg-ins-head"><strong>${agent.kind.toUpperCase()} · ${agent.subkindName}</strong><span>#${agent.index}</span></div>`,
        `<div>State: <b>${agent.stateName}</b> · Social: <b>${agent.socialName}${agent.socialName === 'Small Group' ? ` #${agent.groupId}` : ''}</b> · HP: <b>${agent.hp}</b></div>`,
      );
      if (agent.kind === 'human') {
        const adaptStr = agent.adaptTrust >= 0 ? `+${agent.adaptTrust}` : `${agent.adaptTrust}`;
        lines.push(
          `<div>Demands: Hunger <b>${agent.hunger}</b> · Thirst <b>${agent.thirst}</b> · Inf <b>${agent.infection > 0 ? `${Math.round((agent.infection / 250) * 100)}%` : '0%'}</b></div>`,
          `<div>Inv: Food <b>${agent.food}</b> · Water <b>${agent.water}</b> · Gear <b>${agent.gear}</b> · Meds <b>${agent.meds}</b> · Mats <b>${agent.mats}</b></div>`,
          `<div>Personality: Coop <b>${agent.coop}</b> · Brave <b>${agent.brave}</b> · Greed <b>${agent.greed}</b> · Trust <b>${agent.trust}</b> · Rep <b>${agent.rep}</b></div>`,
          `<div>PD Strategy: <b>${agent.strategyName}</b> · Adapt Trust: <b>${adaptStr}</b> · Betrayals: <b>${agent.recentBetrayals}</b></div>`,
          `<div>Society: <b style="color:${f ? f.colorCss : '#8b949e'}">${f ? f.name : 'None'}</b>${rep ? ` · Republic: <b style="color:${rep.colorCss}">${rep.name}</b>` : ''}</div>`,
        );
      }
    }
    if (tile) {
      const f = tile.claimFactionId >= 0 ? facMap.get(tile.claimFactionId) : undefined;
      const rep = f && f.republicId >= 0 ? repMap.get(f.republicId) : undefined;
      const condLabel = tile.tileType === 7
        ? ` · Road Cond <b>${tile.roadCond >= 200 ? 'Pristine' : tile.roadCond >= 80 ? 'Worn' : 'Reclaiming'} (${tile.roadCond})</b>`
        : '';
      lines.push(
        `<div class="dg-ins-tile">Tile (${tile.x}, ${tile.y}): <b>${tile.tileName}</b> · Elev <b>${tile.elevation}</b>${condLabel}</div>`,
        `<div>Water: <b>${tile.waterDepth}</b> · Fire: <b>${tile.fireHeat}</b> · Food: <b>${tile.food}</b> · Gear: <b>${tile.gear}</b> · Noise: <b>${tile.scent}</b></div>`,
      );
      if (f) {
        lines.push(
          `<div>Claim: <b style="color:${f.colorCss}">${f.name}</b> (${TIER_NAMES[f.level] ?? 'Camp'}, ${ETHOS_NAMES[f.ethos] ?? 'Coop'}, Pop ${f.pop})${rep ? ` · <b>${rep.name}</b>` : ''}</div>`,
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
      if (s.humans > maxPop) maxPop = s.humans;
      if (s.zombies > maxPop) maxPop = s.zombies;
      if (s.animals > maxPop) maxPop = s.animals;
    }

    const drawSeries = (color: string, pick: (s: HistorySample) => number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = (i / (history.length - 1)) * (w - 4) + 2;
        const y = h - 4 - (pick(history[i]) / maxPop) * (h - 10);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    drawSeries('#e5534b', (s) => s.zombies);
    drawSeries('#539bf5', (s) => s.humans);
    drawSeries('#e0b852', (s) => s.animals);
  }

  private drawHistoricalGraph(history: HistorySample[]): void {
    const ctx = this.graphCanvas.getContext('2d');
    if (!ctx) return;
    const w = this.graphCanvas.width;
    const h = this.graphCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    if (history.length < 2) {
      this.graphLegendEl.innerHTML = '<span>Collecting simulation history...</span>';
      this.graphReadoutEl.textContent = '';
      return;
    }

    interface Series { label: string; color: string; pick: (s: HistorySample) => number }
    const seriesMap: Record<GraphTab, Series[]> = {
      populations: [
        { label: 'Zombies', color: '#e5534b', pick: (s) => s.zombies },
        { label: 'Humans', color: '#539bf5', pick: (s) => s.humans },
        { label: 'Wild Animals', color: '#e0b852', pick: (s) => s.animals },
      ],
      social: [
        { label: 'Solo Humans', color: '#c9d1d9', pick: (s) => s.soloHumans },
        { label: 'Small Group Humans', color: '#a8d8ff', pick: (s) => s.groupHumans },
        { label: 'Society Humans', color: '#57ab5a', pick: (s) => s.societyHumans },
        { label: 'Zombie Alphas', color: '#e83890', pick: (s) => s.zombiePacks },
      ],
      pd: [
        { label: 'Cooperations', color: '#57ab5a', pick: (s) => s.pdCoops },
        { label: 'Defections', color: '#e5534b', pick: (s) => s.pdDefects },
        { label: 'Mutual Coops', color: '#539bf5', pick: (s) => s.pdMutualCoop },
        { label: 'Betrayals', color: '#d6d63f', pick: (s) => s.pdBetrayals },
      ],
      genetics: [
        { label: 'Altruist / Gen-TFT', color: '#57ab5a', pick: (s) => s.stratCoop },
        { label: 'Reciprocal (TFT/Pavlov)', color: '#539bf5', pick: (s) => s.stratRecip },
        { label: 'Hawk (Grudger/Opp)', color: '#e5534b', pick: (s) => s.stratDefect },
        { label: 'Active Fires', color: '#ff8c42', pick: (s) => s.activeFires },
      ],
      resources: [
        { label: 'Avg Food', color: '#57ab5a', pick: (s) => s.avgFood },
        { label: 'Avg Water', color: '#539bf5', pick: (s) => s.avgWater },
        { label: 'Avg Gear', color: '#e0b852', pick: (s) => s.avgGear },
      ],
      nations: [
        { label: 'Territory Tiles', color: '#57ab5a', pick: (s) => s.territoryTiles },
        { label: 'Road Tiles', color: '#c9d1d9', pick: (s) => s.roadTiles },
        { label: 'Roads Built', color: '#539bf5', pick: (s) => s.roadsBuilt * 20 },
        { label: 'Republics', color: '#ffd33d', pick: (s) => s.republics * 500 },
      ],
    };

    const list = seriesMap[this.activeGraphTab];
    let maxVal = 10;
    for (const s of history) {
      for (const ser of list) {
        const v = ser.pick(s);
        if (v > maxVal) maxVal = v;
      }
    }

    const padL = 48;
    const padR = 14;
    const padT = 14;
    const padB = 24;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Grid lines & Y labels
    ctx.strokeStyle = '#21262d';
    ctx.fillStyle = '#8b949e';
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const y = padT + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      const labelVal = Math.round(maxVal * (1 - i / 4));
      ctx.fillText(labelVal.toLocaleString(), padL - 6, y);
    }

    for (const ser of list) {
      ctx.strokeStyle = ser.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = padL + (i / (history.length - 1)) * plotW;
        const y = padT + plotH - (ser.pick(history[i]) / maxVal) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const idx = this.graphScrubIdx !== null
      ? Math.max(0, Math.min(history.length - 1, this.graphScrubIdx))
      : history.length - 1;
    const sx = padL + (idx / (history.length - 1)) * plotW;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, padT);
    ctx.lineTo(sx, padT + plotH);
    ctx.stroke();

    const sample = history[idx];
    this.graphLegendEl.innerHTML = list
      .map((ser) => `<span><i style="background:${ser.color}"></i>${ser.label}: <b>${ser.pick(sample).toLocaleString()}</b></span>`)
      .join('');
    this.graphReadoutEl.textContent = `Tick ${sample.tick} (Day ${sample.day}) · Societies: ${sample.settlements} · Republics: ${sample.republics} · Roads: ${sample.roadsBuilt} · Farms: ${sample.farmsBuilt} · Terraforms: ${sample.terraforms} · Disasters: ${sample.disasters}`;
  }

  private injectStyles(): void {
    if (document.getElementById('dg-styles')) return;
    const st = document.createElement('style');
    st.id = 'dg-styles';
    st.textContent = `
      .dg-root { position: fixed; inset: 0; pointer-events: none; font-size: 12px; }
      .dg-topbar {
        pointer-events: auto;
        display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
        padding: calc(6px + env(safe-area-inset-top)) 10px 6px 10px;
        background: rgba(13, 17, 23, 0.90);
        border-bottom: 1px solid #30363d;
        backdrop-filter: blur(6px);
      }
      .dg-brand { display: flex; align-items: baseline; gap: 6px; margin-right: 4px; }
      .dg-title { font-weight: 800; letter-spacing: 0.08em; color: #f0f6fc; font-size: 13px; }
      .dg-sub { font-size: 10px; color: #8b949e; }
      .dg-stats { display: flex; flex-wrap: wrap; gap: 8px; flex: 1; min-width: 180px; }
      .dg-stat { color: #c9d1d9; white-space: nowrap; }
      .dg-stat.dg-s b { color: #539bf5; }
      .dg-stat.dg-z b { color: #e5534b; }
      .dg-stat.dg-a b { color: #e0b852; }
      .dg-stat.dg-i b { color: #d6d63f; }
      .dg-stat.dg-f b { color: #57ab5a; }
      .dg-controls { display: flex; flex-wrap: wrap; gap: 4px; }
      .dg-btn, .dg-chip {
        min-height: 44px; min-width: 44px; padding: 0 9px;
        background: #161b22; color: #e6edf3;
        border: 1px solid #30363d; border-radius: 6px;
        font: inherit; font-weight: 600; cursor: pointer;
      }
      .dg-spd-btn { min-width: 38px; padding: 0 7px; font-size: 11px; }
      .dg-chip { min-height: 36px; font-size: 11px; padding: 4px 8px; }
      .dg-btn:hover, .dg-chip:hover { border-color: #58a6ff; }
      .dg-btn.active, .dg-chip.active { background: #1f6feb; border-color: #58a6ff; color: #fff; }
      .dg-drawer {
        pointer-events: auto;
        position: fixed; top: 64px; bottom: calc(10px + env(safe-area-inset-bottom));
        width: 280px; max-width: 84vw;
        background: rgba(13, 17, 23, 0.93);
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
      .dg-input, .dg-select {
        flex: 1; min-width: 0; height: 40px; padding: 0 8px;
        background: #0d1117; color: #e6edf3; border: 1px solid #30363d; border-radius: 6px;
        font: inherit;
      }
      .dg-saved-list { display: flex; flex-direction: column; gap: 4px; }
      .dg-saved-row { display: flex; gap: 4px; }
      .dg-saved-load { flex: 1; text-align: left; }
      .dg-spark { width: 100%; height: 96px; border: 1px solid #30363d; border-radius: 6px; }
      .dg-event-log { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #c9d1d9; }
      .dg-ev { padding: 4px 6px; background: #161b22; border-radius: 4px; border-left: 2px solid #58a6ff; }
      .dg-inspector {
        pointer-events: auto;
        position: fixed; left: 50%; transform: translateX(-50%);
        bottom: calc(10px + env(safe-area-inset-bottom));
        min-width: 260px; max-width: 92vw;
        background: rgba(13, 17, 23, 0.94); border: 1px solid #30363d; border-radius: 8px;
        padding: 8px 12px; display: none; flex-direction: column; gap: 3px;
      }
      .dg-inspector.open { display: flex; }
      .dg-ins-head { display: flex; justify-content: space-between; color: #ffd33d; }
      .dg-ins-tile { color: #8b949e; margin-top: 2px; }
      .dg-help {
        pointer-events: auto; position: fixed; inset: 0;
        background: rgba(0, 0, 0, 0.7); display: none; align-items: center; justify-content: center; padding: 16px;
        z-index: 20;
      }
      .dg-help.open { display: flex; }
      .dg-help-card, .dg-graph-card {
        width: 100%; max-width: 440px; background: #161b22; border: 1px solid #30363d; border-radius: 10px;
        padding: 16px; color: #e6edf3; line-height: 1.45;
      }
      .dg-graph-card { max-width: 720px; display: flex; flex-direction: column; gap: 10px; }
      .dg-graph-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
      .dg-graph-canvas { width: 100%; height: auto; border: 1px solid #30363d; border-radius: 6px; cursor: crosshair; }
      .dg-graph-legend { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; }
      .dg-graph-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 5px; }
      .dg-graph-readout { font-size: 11px; color: #8b949e; }
      .dg-help-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
      @media (max-width: 720px) {
        .dg-drawer { top: 108px; }
      }
    `;
    document.head.appendChild(st);
  }
}

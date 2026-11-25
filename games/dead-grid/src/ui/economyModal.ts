import {
  cloneLootTable,
  LOOT_BIOME_IDS,
  LOOT_PRESETS,
  TILE_NAMES,
  type BrushTool,
  type FactionInfo,
  type LootTable,
  type SimStats,
} from '../sim/bridge';

export interface PriceSample {
  tick: number;
  food: number;
  water: number;
  gear: number;
  mats: number;
}

export interface EconomyModalCallbacks {
  getLootTable: () => LootTable;
  onApplyLootLive: (table: LootTable) => void;
  onApplyLootReset: (table: LootTable) => void;
  onSelectZoneBrush: (brush: BrushTool) => void;
}

export class EconomyModal {
  private readonly backdrop: HTMLDivElement;
  private readonly inspectorPane: HTMLDivElement;
  private readonly lootPane: HTMLDivElement;
  private readonly kpiEl: HTMLDivElement;
  private readonly priceCanvas: HTMLCanvasElement;
  private readonly tableBody: HTMLTableSectionElement;
  private readonly lootInputs = new Map<string, HTMLInputElement>();

  private activeTab: 'inspector' | 'loot' = 'inspector';
  private draftTable: LootTable;

  constructor(
    uiParent: HTMLElement,
    private readonly cb: EconomyModalCallbacks,
  ) {
    this.draftTable = cloneLootTable(cb.getLootTable());
    this.injectStyles();

    this.backdrop = document.createElement('div');
    this.backdrop.className = 'dg-help';

    const card = document.createElement('div');
    card.className = 'dg-opt-card';
    this.backdrop.appendChild(card);

    const head = document.createElement('div');
    head.className = 'dg-help-head';
    head.innerHTML = `<strong>Economy Inspector &amp; Loot Tables</strong>`;
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'dg-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => this.backdrop.classList.remove('open'));
    head.appendChild(closeBtn);
    card.appendChild(head);

    // Tabs
    const tabRow = document.createElement('div');
    tabRow.className = 'dg-graph-tabs';
    const insTab = document.createElement('button');
    insTab.type = 'button';
    insTab.className = 'dg-chip active';
    insTab.textContent = 'Economy Inspector';

    const lootTab = document.createElement('button');
    lootTab.type = 'button';
    lootTab.className = 'dg-chip';
    lootTab.textContent = 'Loot Tables & Areas';

    insTab.addEventListener('click', () => {
      this.activeTab = 'inspector';
      insTab.classList.add('active');
      lootTab.classList.remove('active');
      this.inspectorPane.style.display = 'flex';
      this.lootPane.style.display = 'none';
    });
    lootTab.addEventListener('click', () => {
      this.activeTab = 'loot';
      lootTab.classList.add('active');
      insTab.classList.remove('active');
      this.inspectorPane.style.display = 'none';
      this.lootPane.style.display = 'flex';
      this.syncLootInputs();
    });
    tabRow.append(insTab, lootTab);
    card.appendChild(tabRow);

    // ---- Inspector Pane ----
    this.inspectorPane = document.createElement('div');
    this.inspectorPane.className = 'dg-econ-pane';
    card.appendChild(this.inspectorPane);

    this.kpiEl = document.createElement('div');
    this.kpiEl.className = 'dg-econ-kpis';
    this.inspectorPane.appendChild(this.kpiEl);

    this.priceCanvas = document.createElement('canvas');
    this.priceCanvas.width = 680;
    this.priceCanvas.height = 170;
    this.priceCanvas.className = 'dg-graph-canvas';
    this.inspectorPane.appendChild(this.priceCanvas);

    const tblWrap = document.createElement('div');
    tblWrap.className = 'dg-econ-tbl-wrap';
    const tbl = document.createElement('table');
    tbl.className = 'dg-econ-tbl';
    tbl.innerHTML = `<thead><tr><th>Society</th><th>Pop</th><th>Wealth</th><th>Trade</th><th>Stock (F/W/M)</th><th>Prices (F/W/G/M)</th></tr></thead>`;
    this.tableBody = document.createElement('tbody');
    tbl.appendChild(this.tableBody);
    tblWrap.appendChild(tbl);
    this.inspectorPane.appendChild(tblWrap);

    // ---- Loot Tables & Areas Pane ----
    this.lootPane = document.createElement('div');
    this.lootPane.className = 'dg-econ-pane';
    this.lootPane.style.display = 'none';
    card.appendChild(this.lootPane);

    const preRow = document.createElement('div');
    preRow.className = 'dg-graph-tabs';
    for (const lp of LOOT_PRESETS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dg-chip';
      b.textContent = lp.label;
      b.addEventListener('click', () => {
        this.draftTable = cloneLootTable({});
        lp.apply(this.draftTable);
        this.syncLootInputs();
      });
      preRow.appendChild(b);
    }
    this.lootPane.appendChild(preRow);

    const ltWrap = document.createElement('div');
    ltWrap.className = 'dg-econ-tbl-wrap';
    const ltTbl = document.createElement('table');
    ltTbl.className = 'dg-econ-tbl';
    ltTbl.innerHTML = `<thead><tr><th>Biome / Area</th><th>Food ×</th><th>Water ×</th><th>Gear ×</th><th>Respawn ×</th></tr></thead>`;
    const ltBody = document.createElement('tbody');
    for (const id of LOOT_BIOME_IDS) {
      const tr = document.createElement('tr');
      const tdName = document.createElement('td');
      tdName.textContent = TILE_NAMES[id] ?? `Biome ${id}`;
      tr.appendChild(tdName);
      for (const field of ['food', 'water', 'gear', 'respawn'] as const) {
        const td = document.createElement('td');
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.min = '0';
        inp.max = '5';
        inp.step = '0.25';
        inp.className = 'dg-econ-num';
        inp.value = String(this.draftTable[id]?.[field] ?? 1);
        inp.addEventListener('input', () => {
          const val = Math.max(0, Math.min(5, parseFloat(inp.value) || 0));
          this.draftTable[id] = { ...(this.draftTable[id] ?? { food: 1, water: 1, gear: 1, respawn: 1 }), [field]: val };
        });
        this.lootInputs.set(`${id}:${field}`, inp);
        td.appendChild(inp);
        tr.appendChild(td);
      }
      ltBody.appendChild(tr);
    }
    ltTbl.appendChild(ltBody);
    ltWrap.appendChild(ltTbl);
    this.lootPane.appendChild(ltWrap);

    const lootActs = document.createElement('div');
    lootActs.className = 'dg-graph-tabs';
    const applyLiveBtn = document.createElement('button');
    applyLiveBtn.type = 'button';
    applyLiveBtn.className = 'dg-btn';
    applyLiveBtn.textContent = 'Apply Live (Respawns)';
    applyLiveBtn.addEventListener('click', () => this.cb.onApplyLootLive(cloneLootTable(this.draftTable)));

    const applyResetBtn = document.createElement('button');
    applyResetBtn.type = 'button';
    applyResetBtn.className = 'dg-btn active';
    applyResetBtn.textContent = 'Apply & Reset World';
    applyResetBtn.addEventListener('click', () => {
      this.cb.onApplyLootReset(cloneLootTable(this.draftTable));
      this.backdrop.classList.remove('open');
    });
    lootActs.append(applyLiveBtn, applyResetBtn);
    this.lootPane.appendChild(lootActs);

    const zoneHead = document.createElement('div');
    zoneHead.className = 'dg-sec-title';
    zoneHead.textContent = 'Paint Custom Loot Areas on Map';
    this.lootPane.appendChild(zoneHead);

    const zoneRow = document.createElement('div');
    zoneRow.className = 'dg-graph-tabs';
    const zones: [BrushTool, string][] = [
      ['zone-city', 'Paint City'],
      ['zone-military', 'Paint Military'],
      ['zone-farm', 'Paint Farm'],
      ['zone-industrial', 'Paint Industrial'],
    ];
    for (const [tool, label] of zones) {
      const zb = document.createElement('button');
      zb.type = 'button';
      zb.className = 'dg-chip';
      zb.textContent = label;
      zb.addEventListener('click', () => {
        this.cb.onSelectZoneBrush(tool);
        this.backdrop.classList.remove('open');
      });
      zoneRow.appendChild(zb);
    }
    this.lootPane.appendChild(zoneRow);

    uiParent.appendChild(this.backdrop);
  }

  open(): void {
    this.draftTable = cloneLootTable(this.cb.getLootTable());
    this.syncLootInputs();
    this.backdrop.classList.add('open');
  }

  isOpen(): boolean {
    return this.backdrop.classList.contains('open');
  }

  private syncLootInputs(): void {
    for (const id of LOOT_BIOME_IDS) {
      const r = this.draftTable[id] ?? { food: 1, water: 1, gear: 1, respawn: 1 };
      for (const field of ['food', 'water', 'gear', 'respawn'] as const) {
        const inp = this.lootInputs.get(`${id}:${field}`);
        if (inp) inp.value = String(r[field]);
      }
    }
  }

  update(stats: SimStats, factions: FactionInfo[], prices: PriceSample[]): void {
    if (!this.isOpen() || this.activeTab !== 'inspector') return;

    this.kpiEl.innerHTML = `
      <span>Global Wealth: <b>${stats.globalWealth.toLocaleString()}</b></span>
      <span>Trade Vol: <b>${stats.tradeVolume.toLocaleString()}</b></span>
      <span>Avg Prices — Food: <b style="color:#57ab5a">${stats.avgPriceFood.toFixed(1)}</b> · Water: <b style="color:#539bf5">${stats.avgPriceWater.toFixed(1)}</b> · Gear: <b style="color:#e0b852">${stats.avgPriceGear.toFixed(1)}</b> · Mats: <b style="color:#c9d1d9">${stats.avgPriceMats.toFixed(1)}</b></span>
    `;

    this.drawPriceChart(prices);

    const sorted = [...factions].sort((a, b) => b.wealth - a.wealth).slice(0, 14);
    this.tableBody.innerHTML = sorted
      .map(
        (f) => `<tr>
          <td><b style="color:${f.colorCss}">${f.name}</b></td>
          <td>${f.pop}</td>
          <td>${f.wealth.toLocaleString()}</td>
          <td>${f.tradeVol}</td>
          <td>${f.food}/${f.water}/${f.materials}</td>
          <td>${f.priceFood.toFixed(1)}/${f.priceWater.toFixed(1)}/${f.priceGear.toFixed(1)}/${f.priceMats.toFixed(1)}</td>
        </tr>`,
      )
      .join('');
  }

  private drawPriceChart(prices: PriceSample[]): void {
    const ctx = this.priceCanvas.getContext('2d');
    if (!ctx) return;
    const w = this.priceCanvas.width;
    const h = this.priceCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);
    if (prices.length < 2) return;

    let maxP = 10;
    for (const p of prices) {
      if (p.food > maxP) maxP = p.food;
      if (p.water > maxP) maxP = p.water;
      if (p.gear > maxP) maxP = p.gear;
      if (p.mats > maxP) maxP = p.mats;
    }

    const padL = 38;
    const padR = 12;
    const padT = 12;
    const padB = 16;
    const pw = w - padL - padR;
    const ph = h - padT - padB;

    const drawSeries = (col: string, pick: (p: PriceSample) => number) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < prices.length; i++) {
        const x = padL + (i / (prices.length - 1)) * pw;
        const y = padT + ph - (pick(prices[i]) / maxP) * ph;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    drawSeries('#57ab5a', (p) => p.food);
    drawSeries('#539bf5', (p) => p.water);
    drawSeries('#e0b852', (p) => p.gear);
    drawSeries('#c9d1d9', (p) => p.mats);
  }

  private injectStyles(): void {
    if (document.getElementById('dg-econ-styles')) return;
    const st = document.createElement('style');
    st.id = 'dg-econ-styles';
    st.textContent = `
      .dg-econ-pane { display: flex; flex-direction: column; gap: 10px; }
      .dg-econ-kpis { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; color: #c9d1d9; background: #0d1117; padding: 8px; border-radius: 6px; border: 1px solid #30363d; }
      .dg-econ-tbl-wrap { max-height: 220px; overflow-y: auto; border: 1px solid #30363d; border-radius: 6px; }
      .dg-econ-tbl { width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; }
      .dg-econ-tbl th, .dg-econ-tbl td { padding: 5px 8px; border-bottom: 1px solid #21262d; }
      .dg-econ-tbl th { background: #0d1117; color: #8b949e; position: sticky; top: 0; }
      .dg-econ-num { width: 58px; height: 28px; background: #0d1117; color: #e6edf3; border: 1px solid #30363d; border-radius: 4px; padding: 0 4px; font: inherit; }
    `;
    document.head.appendChild(st);
  }
}

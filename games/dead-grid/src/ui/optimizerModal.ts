import { type SimParams } from '../sim/bridge';
import {
  exportOptimizerJson,
  exportSweepCsv,
  FITNESS_OBJECTIVES,
  runEvolutionaryOptimizer,
  runParameterSweep,
  TUNABLE_PARAMS,
  type FitnessObjectiveId,
  type OptimizerGenSample,
  type OptimizerResult,
  type SweepPoint,
  type SweepResult,
  type TunableKey,
} from '../sim/optimizer';
import { saveScenario } from '../sim/scenarios';

type LabMode = 'sweep' | 'ml';
type SweepMetric = 'fitness' | 'humans' | 'zombies' | 'settlements' | 'republics' | 'pdCoop' | 'infra';

export interface OptimizerModalCallbacks {
  getCurrentParams: () => SimParams;
  getCurrentSeed: () => number;
  onApplyBest: (params: SimParams) => void;
}

export class OptimizerModal {
  private readonly backdrop: HTMLDivElement;
  private readonly chartCanvas: HTMLCanvasElement;
  private readonly progressBar: HTMLDivElement;
  private readonly statusEl: HTMLDivElement;
  private readonly summaryEl: HTMLDivElement;
  private readonly runBtn: HTMLButtonElement;
  private readonly applyBtn: HTMLButtonElement;
  private readonly saveBtn: HTMLButtonElement;
  private readonly exportBtn: HTMLButtonElement;

  private readonly sweepControls: HTMLDivElement;
  private readonly mlControls: HTMLDivElement;
  private readonly metricSelect: HTMLSelectElement;

  private mode: LabMode = 'sweep';
  private metric: SweepMetric = 'fitness';
  private running = false;
  private stopRequested = false;
  private lastSweep: SweepResult | null = null;
  private lastOpt: OptimizerResult | null = null;

  private seedsInput!: HTMLInputElement;
  private valuesInput!: HTMLInputElement;
  private ticksInput!: HTMLInputElement;
  private gensInput!: HTMLInputElement;
  private objSelect!: HTMLSelectElement;
  private sweepParamSelect!: HTMLSelectElement;
  private sweepMinInput!: HTMLInputElement;
  private sweepMaxInput!: HTMLInputElement;
  private mlCheckboxes = new Map<TunableKey, HTMLInputElement>();

  constructor(
    uiParent: HTMLElement,
    private readonly cb: OptimizerModalCallbacks,
  ) {
    this.injectStyles();

    this.backdrop = document.createElement('div');
    this.backdrop.className = 'dg-help';
    const card = document.createElement('div');
    card.className = 'dg-opt-card';
    this.backdrop.appendChild(card);

    const head = document.createElement('div');
    head.className = 'dg-help-head';
    head.innerHTML = `<strong>Scenario Builder &amp; ML Optimizer Lab</strong>`;
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'dg-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => {
      this.stopRequested = true;
      this.backdrop.classList.remove('open');
    });
    head.appendChild(closeBtn);
    card.appendChild(head);

    // Mode Tabs
    const tabRow = document.createElement('div');
    tabRow.className = 'dg-graph-tabs';
    const sweepTab = document.createElement('button');
    sweepTab.type = 'button';
    sweepTab.className = 'dg-chip active';
    sweepTab.textContent = 'Parameter Sweep (N × M)';

    const mlTab = document.createElement('button');
    mlTab.type = 'button';
    mlTab.className = 'dg-chip';
    mlTab.textContent = 'ML Optimizer (Evolutionary)';

    sweepTab.addEventListener('click', () => {
      this.mode = 'sweep';
      sweepTab.classList.add('active');
      mlTab.classList.remove('active');
      this.sweepControls.style.display = 'grid';
      this.mlControls.style.display = 'none';
      this.metricSelect.style.display = 'inline-block';
    });
    mlTab.addEventListener('click', () => {
      this.mode = 'ml';
      mlTab.classList.add('active');
      sweepTab.classList.remove('active');
      this.sweepControls.style.display = 'none';
      this.mlControls.style.display = 'flex';
      this.metricSelect.style.display = 'none';
    });
    tabRow.append(sweepTab, mlTab);
    card.appendChild(tabRow);

    // Common N, M, Ticks, Objective row
    const commonRow = document.createElement('div');
    commonRow.className = 'dg-opt-grid';
    this.seedsInput = this.makeNumField(commonRow, 'Seeds (N)', 3, 1, 12);
    this.valuesInput = this.makeNumField(commonRow, 'Values / Pop (M)', 6, 3, 16);
    this.ticksInput = this.makeNumField(commonRow, 'Ticks / Run', 120, 40, 600);
    this.gensInput = this.makeNumField(commonRow, 'Generations', 4, 2, 12);

    const objWrap = document.createElement('label');
    objWrap.className = 'dg-opt-field';
    objWrap.innerHTML = `<span>Objective</span>`;
    this.objSelect = document.createElement('select');
    this.objSelect.className = 'dg-select';
    for (const o of FITNESS_OBJECTIVES) {
      const opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = o.label;
      opt.title = o.desc;
      this.objSelect.appendChild(opt);
    }
    objWrap.appendChild(this.objSelect);
    commonRow.appendChild(objWrap);
    card.appendChild(commonRow);

    // Sweep Controls
    this.sweepControls = document.createElement('div');
    this.sweepControls.className = 'dg-opt-grid';
    const paramWrap = document.createElement('label');
    paramWrap.className = 'dg-opt-field';
    paramWrap.innerHTML = `<span>Sweep Parameter</span>`;
    this.sweepParamSelect = document.createElement('select');
    this.sweepParamSelect.className = 'dg-select';
    for (const p of TUNABLE_PARAMS) {
      const opt = document.createElement('option');
      opt.value = p.key;
      opt.textContent = p.label;
      this.sweepParamSelect.appendChild(opt);
    }
    this.sweepParamSelect.value = 'cooperationBias';
    paramWrap.appendChild(this.sweepParamSelect);
    this.sweepControls.appendChild(paramWrap);

    this.sweepMinInput = this.makeNumField(this.sweepControls, 'Min', 0, -1000, 100000);
    this.sweepMaxInput = this.makeNumField(this.sweepControls, 'Max', 1, -1000, 100000);
    const syncBounds = () => {
      const def = TUNABLE_PARAMS.find((p) => p.key === this.sweepParamSelect.value);
      if (!def) return;
      this.sweepMinInput.value = String(def.min);
      this.sweepMaxInput.value = String(def.max);
      this.sweepMinInput.step = String(def.step);
      this.sweepMaxInput.step = String(def.step);
    };
    this.sweepParamSelect.addEventListener('change', syncBounds);
    syncBounds();
    card.appendChild(this.sweepControls);

    // ML Parameter Checkboxes
    this.mlControls = document.createElement('div');
    this.mlControls.className = 'dg-opt-ml';
    this.mlControls.style.display = 'none';
    const defaultChecked = new Set<TunableKey>([
      'zombieSpeed',
      'cooperationBias',
      'banditry',
      'settlementGrowth',
      'waterFlowRate',
    ]);
    for (const p of TUNABLE_PARAMS) {
      const lbl = document.createElement('label');
      lbl.className = 'dg-opt-chk';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = defaultChecked.has(p.key);
      lbl.append(cb, document.createTextNode(p.label));
      this.mlCheckboxes.set(p.key, cb);
      this.mlControls.appendChild(lbl);
    }
    card.appendChild(this.mlControls);

    // Run / Metric / Progress
    const actRow = document.createElement('div');
    actRow.className = 'dg-opt-act';
    this.runBtn = document.createElement('button');
    this.runBtn.type = 'button';
    this.runBtn.className = 'dg-btn active';
    this.runBtn.textContent = '▶ Run Experiment';
    this.runBtn.addEventListener('click', () => {
      if (this.running) this.stopRequested = true;
      else void this.startExperiment();
    });

    this.metricSelect = document.createElement('select');
    this.metricSelect.className = 'dg-select';
    this.metricSelect.style.maxWidth = '160px';
    const metrics: [SweepMetric, string][] = [
      ['fitness', 'Y: Fitness Score'],
      ['humans', 'Y: Mean Humans'],
      ['zombies', 'Y: Mean Zombies'],
      ['settlements', 'Y: Societies'],
      ['republics', 'Y: Republics'],
      ['pdCoop', 'Y: PD Coop %'],
      ['infra', 'Y: Infrastructure'],
    ];
    for (const [m, lbl] of metrics) {
      const o = document.createElement('option');
      o.value = m;
      o.textContent = lbl;
      this.metricSelect.appendChild(o);
    }
    this.metricSelect.addEventListener('change', () => {
      this.metric = this.metricSelect.value as SweepMetric;
      if (this.lastSweep) this.drawSweepChart(this.lastSweep.points);
    });

    const progWrap = document.createElement('div');
    progWrap.className = 'dg-opt-prog-wrap';
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'dg-opt-prog-bar';
    progWrap.appendChild(this.progressBar);

    actRow.append(this.runBtn, this.metricSelect, progWrap);
    card.appendChild(actRow);

    this.statusEl = document.createElement('div');
    this.statusEl.className = 'dg-graph-readout';
    this.statusEl.textContent = 'Configure N seeds × M values and run a headless WASM experiment.';
    card.appendChild(this.statusEl);

    // Chart Canvas
    this.chartCanvas = document.createElement('canvas');
    this.chartCanvas.width = 680;
    this.chartCanvas.height = 240;
    this.chartCanvas.className = 'dg-graph-canvas';
    card.appendChild(this.chartCanvas);

    this.summaryEl = document.createElement('div');
    this.summaryEl.className = 'dg-opt-summary';
    card.appendChild(this.summaryEl);

    // Bottom Actions
    const footRow = document.createElement('div');
    footRow.className = 'dg-graph-tabs';
    this.applyBtn = document.createElement('button');
    this.applyBtn.type = 'button';
    this.applyBtn.className = 'dg-btn active';
    this.applyBtn.textContent = 'Apply Best to World';
    this.applyBtn.disabled = true;
    this.applyBtn.addEventListener('click', () => {
      const best = this.mode === 'sweep' ? this.lastSweep?.best.summary.params : this.lastOpt?.best.params;
      if (!best) return;
      this.cb.onApplyBest(best);
      this.backdrop.classList.remove('open');
    });

    this.saveBtn = document.createElement('button');
    this.saveBtn.type = 'button';
    this.saveBtn.className = 'dg-btn';
    this.saveBtn.textContent = 'Save Best Scenario';
    this.saveBtn.disabled = true;
    this.saveBtn.addEventListener('click', () => {
      const best = this.mode === 'sweep' ? this.lastSweep?.best.summary.params : this.lastOpt?.best.params;
      if (!best) return;
      saveScenario(`Opt-${this.objSelect.value}`, this.cb.getCurrentSeed(), best);
      this.statusEl.textContent = `Saved best configuration to Scenarios list!`;
    });

    this.exportBtn = document.createElement('button');
    this.exportBtn.type = 'button';
    this.exportBtn.className = 'dg-btn';
    this.exportBtn.textContent = 'Export Data';
    this.exportBtn.disabled = true;
    this.exportBtn.addEventListener('click', () => {
      if (this.mode === 'sweep' && this.lastSweep) {
        this.downloadFile(exportSweepCsv(this.lastSweep), `dead-grid-sweep-${this.lastSweep.paramKey}.csv`, 'text/csv');
      } else if (this.mode === 'ml' && this.lastOpt) {
        this.downloadFile(exportOptimizerJson(this.lastOpt), `dead-grid-ml-${this.lastOpt.objective}.json`, 'application/json');
      }
    });

    footRow.append(this.applyBtn, this.saveBtn, this.exportBtn);
    card.appendChild(footRow);

    uiParent.appendChild(this.backdrop);
  }

  open(): void {
    this.backdrop.classList.add('open');
  }

  private makeNumField(parent: HTMLElement, label: string, val: number, min: number, max: number): HTMLInputElement {
    const lbl = document.createElement('label');
    lbl.className = 'dg-opt-field';
    lbl.innerHTML = `<span>${label}</span>`;
    const inp = document.createElement('input');
    inp.type = 'number';
    inp.className = 'dg-input';
    inp.value = String(val);
    inp.min = String(min);
    inp.max = String(max);
    lbl.appendChild(inp);
    parent.appendChild(lbl);
    return inp;
  }

  private async startExperiment(): Promise<void> {
    this.running = true;
    this.stopRequested = false;
    this.runBtn.textContent = '■ Stop';
    this.applyBtn.disabled = true;
    this.saveBtn.disabled = true;
    this.exportBtn.disabled = true;
    this.progressBar.style.width = '0%';

    const seedsN = Math.max(1, Math.min(12, parseInt(this.seedsInput.value, 10) || 3));
    const stepsM = Math.max(3, Math.min(16, parseInt(this.valuesInput.value, 10) || 6));
    const ticks = Math.max(40, Math.min(600, parseInt(this.ticksInput.value, 10) || 120));
    const gens = Math.max(2, Math.min(12, parseInt(this.gensInput.value, 10) || 4));
    const objective = this.objSelect.value as FitnessObjectiveId;

    try {
      if (this.mode === 'sweep') {
        const paramKey = this.sweepParamSelect.value as TunableKey;
        const min = parseFloat(this.sweepMinInput.value);
        const max = parseFloat(this.sweepMaxInput.value);
        const res = await runParameterSweep(
          {
            baseParams: this.cb.getCurrentParams(),
            paramKey,
            min: Number.isFinite(min) ? min : 0,
            max: Number.isFinite(max) ? max : 1,
            stepsM,
            seedsN,
            baseSeed: this.cb.getCurrentSeed(),
            ticks,
            objective,
          },
          (done, total, points) => {
            this.progressBar.style.width = `${Math.round((done / Math.max(1, total)) * 100)}%`;
            this.statusEl.textContent = `Sweep: ${done}/${total} seed runs...`;
            if (points.length >= 2) this.drawSweepChart(points);
          },
          () => this.stopRequested,
        );
        this.lastSweep = res;
        this.drawSweepChart(res.points);
        this.summaryEl.innerHTML = `Best <b>${res.paramLabel} = ${res.best.value}</b> · Mean Fitness: <b>${Math.round(res.best.summary.meanFitness)}</b> · Humans: <b>${Math.round(res.best.summary.meanHumans)}</b> · Republics: <b>${res.best.summary.meanRepublics.toFixed(1)}</b>`;
        this.statusEl.textContent = `Completed ${res.points.length} values × ${res.seeds.length} seeds.`;
      } else {
        const tunedKeys: TunableKey[] = [];
        for (const [k, cb] of this.mlCheckboxes) if (cb.checked) tunedKeys.push(k);
        if (tunedKeys.length === 0) tunedKeys.push('cooperationBias', 'zombieSpeed');

        const res = await runEvolutionaryOptimizer(
          {
            baseParams: this.cb.getCurrentParams(),
            tunedKeys,
            generations: gens,
            popSizeM: stepsM,
            seedsN,
            baseSeed: this.cb.getCurrentSeed(),
            ticks,
            objective,
          },
          (done, total, hist) => {
            this.progressBar.style.width = `${Math.round((done / Math.max(1, total)) * 100)}%`;
            this.statusEl.textContent = `ML Gen: ${done}/${total} seed runs...`;
            if (hist.length >= 1) this.drawMlChart(hist);
          },
          () => this.stopRequested,
        );
        this.lastOpt = res;
        this.drawMlChart(res.history);
        const diffs = res.tunedKeys
          .map((k) => `${k}: ${res.baseline.params[k]} → <b>${res.best.params[k]}</b>`)
          .join(' · ');
        this.summaryEl.innerHTML = `Baseline Fit: <b>${Math.round(res.baseline.meanFitness)}</b> → Best Fit: <b>${Math.round(res.best.meanFitness)}</b><br>${diffs}`;
        this.statusEl.textContent = `Evolution complete (${res.history.length} generations × ${res.seeds.length} seeds).`;
      }

      this.applyBtn.disabled = false;
      this.saveBtn.disabled = false;
      this.exportBtn.disabled = false;
    } finally {
      this.running = false;
      this.runBtn.textContent = '▶ Run Experiment';
    }
  }

  private pickMetric(pt: SweepPoint): { mean: number; min: number; max: number } {
    const s = pt.summary;
    if (this.metric === 'humans') return { mean: s.meanHumans, min: s.meanHumans, max: s.meanHumans };
    if (this.metric === 'zombies') return { mean: s.meanZombies, min: s.meanZombies, max: s.meanZombies };
    if (this.metric === 'settlements') return { mean: s.meanSettlements, min: s.meanSettlements, max: s.meanSettlements };
    if (this.metric === 'republics') return { mean: s.meanRepublics, min: s.meanRepublics, max: s.meanRepublics };
    if (this.metric === 'pdCoop') return { mean: s.meanPdCoopPct, min: s.meanPdCoopPct, max: s.meanPdCoopPct };
    if (this.metric === 'infra') return { mean: s.meanInfra, min: s.meanInfra, max: s.meanInfra };
    return { mean: s.meanFitness, min: s.minFitness, max: s.maxFitness };
  }

  private drawSweepChart(points: SweepPoint[]): void {
    const ctx = this.chartCanvas.getContext('2d');
    if (!ctx || points.length < 2) return;
    const w = this.chartCanvas.width;
    const h = this.chartCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const vals = points.map((p) => this.pickMetric(p));
    let maxY = 10;
    for (const v of vals) if (v.max > maxY) maxY = v.max;

    const padL = 52;
    const padR = 16;
    const padT = 16;
    const padB = 26;
    const pw = w - padL - padR;
    const ph = h - padT - padB;

    ctx.strokeStyle = '#21262d';
    ctx.fillStyle = '#8b949e';
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const y = padT + (ph * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      ctx.fillText(Math.round(maxY * (1 - i / 4)).toLocaleString(), padL - 6, y);
    }

    // Min-Max shaded band (when metric === 'fitness')
    if (this.metric === 'fitness') {
      ctx.fillStyle = 'rgba(88, 166, 255, 0.16)';
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const x = padL + (i / (points.length - 1)) * pw;
        const y = padT + ph - (vals[i].max / maxY) * ph;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let i = points.length - 1; i >= 0; i--) {
        const x = padL + (i / (points.length - 1)) * pw;
        const y = padT + ph - (vals[i].min / maxY) * ph;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Mean line + X labels
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.textAlign = 'center';
    for (let i = 0; i < points.length; i++) {
      const x = padL + (i / (points.length - 1)) * pw;
      const y = padT + ph - (vals[i].mean / maxY) * ph;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      ctx.fillStyle = '#8b949e';
      ctx.fillText(String(points[i].value), x, h - 10);
    }
    ctx.stroke();

    for (let i = 0; i < points.length; i++) {
      const x = padL + (i / (points.length - 1)) * pw;
      const y = padT + ph - (vals[i].mean / maxY) * ph;
      ctx.fillStyle = '#ffd33d';
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawMlChart(history: OptimizerGenSample[]): void {
    const ctx = this.chartCanvas.getContext('2d');
    if (!ctx || history.length < 1) return;
    const w = this.chartCanvas.width;
    const h = this.chartCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    let maxY = 10;
    for (const g of history) if (g.bestFitness > maxY) maxY = g.bestFitness;

    const padL = 52;
    const padR = 16;
    const padT = 16;
    const padB = 26;
    const pw = w - padL - padR;
    const ph = h - padT - padB;

    const drawLine = (col: string, pick: (g: OptimizerGenSample) => number) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = history.length === 1 ? padL + pw / 2 : padL + (i / (history.length - 1)) * pw;
        const y = padT + ph - (pick(history[i]) / maxY) * ph;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    drawLine('#57ab5a', (g) => g.bestFitness);
    drawLine('#539bf5', (g) => g.meanFitness);
  }

  private downloadFile(text: string, filename: string, mime: string): void {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private injectStyles(): void {
    if (document.getElementById('dg-opt-styles')) return;
    const st = document.createElement('style');
    st.id = 'dg-opt-styles';
    st.textContent = `
      .dg-opt-card {
        width: 100%; max-width: 740px; max-height: 90vh; overflow-y: auto;
        background: #161b22; border: 1px solid #30363d; border-radius: 10px;
        padding: 16px; color: #e6edf3; display: flex; flex-direction: column; gap: 10px;
      }
      .dg-opt-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; }
      .dg-opt-field { display: flex; flex-direction: column; gap: 3px; font-size: 11px; color: #8b949e; }
      .dg-opt-ml { display: flex; flex-wrap: wrap; gap: 8px; padding: 8px; background: #0d1117; border-radius: 6px; border: 1px solid #30363d; }
      .dg-opt-chk { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #c9d1d9; cursor: pointer; }
      .dg-opt-act { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
      .dg-opt-prog-wrap { flex: 1; min-width: 120px; height: 10px; background: #0d1117; border-radius: 5px; overflow: hidden; border: 1px solid #30363d; }
      .dg-opt-prog-bar { height: 100%; width: 0%; background: #58a6ff; transition: width 0.1s; }
      .dg-opt-summary { font-size: 12px; color: #c9d1d9; background: #0d1117; padding: 8px; border-radius: 6px; border: 1px solid #30363d; }
    `;
    document.head.appendChild(st);
  }
}

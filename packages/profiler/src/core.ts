// The profiler itself, free of globals so it can be tested: per-frame system timings, a report for every frame
// or long task over the threshold, a ring buffer of reports and a worst-systems summary.
// Off, every entry point is one boolean check.

export type HitchKind = 'frame' | 'longtask' | 'gap' | 'mark' | 'sample';

export interface HitchReport {
  kind: HitchKind;
  /** Total duration in ms (rounded). */
  ms: number;
  /** ms since page load when it happened. */
  at: number;
  /** For 'frame': the timed systems over 2 ms, slowest first. For 'mark': [[name, ms]]. */
  parts: [string, number][];
  /** For 'frame': every timed() call in the order it ran, ms from the frame start (at most 64). For 'mark': one. */
  spans: HitchSpan[];
  /** Wall-clock time of `at` (Date.now() scale). */
  wall: number;
  /** Whatever the game's context getter returned (zone, scene, level...). */
  ctx: Record<string, string | number | boolean>;
  /** Renderer counters (setRenderStats): that frame for a 'frame', the window's averages for a 'sample'. */
  render?: RenderStats;
  /** For 'sample': frame-time health over the window. */
  frames?: FrameStats;
}

/** What the renderer drew in a frame (three.js renderer.info). 0 = not reported. */
export interface RenderStats {
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
  /** GPU time of the render (see createGpuTimer), 0 when unknown. */
  gpuMs: number;
  pixelRatio: number;
}

/** Frame-time health over a window: the time between beginFrame calls, and the CPU time inside the frame. */
export interface FrameStats {
  frames: number;
  p50: number;
  p95: number;
  max: number;
  cpu: number;
}

/** Rolling numbers for an on-screen overlay (liveStats()). */
export interface LiveStats {
  fps: number;
  /** Mean time between frames, ms. */
  frameMs: number;
  /** Mean CPU time inside beginFrame..endFrame, ms. */
  cpuMs: number;
  p95Ms: number;
  /** Mean ms per frame of each timed system / section, slowest first. */
  systems: [string, number][];
  render: RenderStats | null;
}

/** One timed() call inside a frame. */
export interface HitchSpan {
  name: string;
  /** ms from the frame start. */
  start: number;
  ms: number;
}

/** Spans kept per frame; the totals in `parts` still count every call. */
export const MAX_SPANS = 64;
const r1 = (v: number): number => Math.round(v * 10) / 10;

export interface ProfilerOptions {
  on: boolean;
  /** Report frames / long tasks at least this long (ms). */
  thresholdMs: number;
  /** Write each report to the console (default true). */
  log?: boolean;
  /** Reports kept in memory for summary() (default 200). */
  keep?: number;
  now?: () => number;
}

export type Ctx = Record<string, string | number | boolean>;

export class Profiler {
  readonly on: boolean;
  readonly thresholdMs: number;
  readonly reports: HitchReport[] = [];
  /** Periodic 'sample' reports (only while on), newest last, at most 60 kept. */
  readonly samples: HitchReport[] = [];
  /** ms between 'sample' reports. */
  sampleMs = 5000;
  /** Collect frame stats for liveStats() even when not reporting (an on-screen overlay). */
  private live = false;
  private section_: string | null = null;
  private sectionStart = 0;
  private renderFn: (() => RenderStats) | null = null;
  private lastBegin = -1;
  private readonly liveWin = new FrameWindow();
  private readonly sampleWin = new FrameWindow();
  private liveSnap: LiveStats | null = null;
  private liveStart = -1;
  private sampleStart = -1;
  private pendingRender: RenderStats | undefined;
  private readonly log: boolean;
  private readonly keep: number;
  private readonly now: () => number;
  private readonly times = new Map<string, number>();
  private spans: HitchSpan[] = [];
  private frameStart = 0;
  private inFrame = false;
  /** beginFrame has been called: the game times its own frames, so animation-frame gaps are not reported. */
  private instrumented = false;
  /** [start, end] of recently reported frames, so a long task inside one is not reported twice. */
  private readonly hitchFrames: [number, number][] = [];
  private ctxFn: (() => Ctx) | null = null;
  private readonly listeners: ((r: HitchReport) => void)[] = [];

  constructor(o: ProfilerOptions) {
    this.on = o.on;
    this.thresholdMs = o.thresholdMs;
    this.log = o.log ?? true;
    this.keep = o.keep ?? 200;
    this.now = o.now ?? (() => performance.now());
  }

  /** True when timing runs: profiling is on, or an overlay asked for live stats. */
  get collecting(): boolean {
    return this.on || this.live;
  }

  /** Turns live stats (liveStats()) on or off; nothing is reported unless the profiler is on. */
  setLive(on: boolean): void {
    this.live = on;
  }

  /** Called once per frame at endFrame for the renderer's counters (e.g. three's renderer.info). */
  setRenderStats(fn: (() => RenderStats) | null): void {
    this.renderFn = fn;
  }

  /**
   * Starts a named section of the frame, ending the previous one: an alternative to wrapping each system in timed()
   * for a long, linear frame. endFrame (or section(null)) closes the last one. Counted exactly like timed().
   */
  section(name: string | null): void {
    if (!this.collecting) return;
    const t = this.now();
    if (this.section_ !== null) this.addTime(this.section_, this.sectionStart, t - this.sectionStart);
    this.section_ = name;
    this.sectionStart = t;
  }

  private addTime(name: string, t0: number, ms: number): void {
    this.times.set(name, (this.times.get(name) ?? 0) + ms);
    if (this.inFrame && this.spans.length < MAX_SPANS) this.spans.push({ name, start: r1(t0 - this.frameStart), ms: r1(ms) });
  }

  /** Runs `fn` and adds its time under `name` for this frame. */
  timed<T>(name: string, fn: () => T): T {
    if (!this.collecting) return fn();
    const t0 = this.now();
    try {
      return fn();
    } finally {
      this.addTime(name, t0, this.now() - t0);
    }
  }

  beginFrame(): void {
    if (!this.collecting) return;
    this.times.clear();
    this.spans = [];
    this.section_ = null;
    this.frameStart = this.now();
    if (this.lastBegin >= 0) {
      const gap = this.frameStart - this.lastBegin;
      // A hidden tab or a breakpoint is not a frame.
      if (gap < 1000) {
        this.liveWin.interval(gap);
        this.sampleWin.interval(gap);
      }
    }
    this.lastBegin = this.frameStart;
    this.inFrame = true;
    this.instrumented = true;
  }

  endFrame(): void {
    if (!this.collecting || !this.inFrame) return;
    if (this.section_ !== null) this.section(null);
    this.inFrame = false;
    const end = this.now();
    const total = end - this.frameStart;
    let render: RenderStats | undefined;
    try {
      render = this.renderFn?.() ?? undefined;
    } catch {
      render = undefined;
    }
    this.liveWin.frame(total, this.times, render);
    this.sampleWin.frame(total, this.times, render);
    if (this.liveStart < 0) this.liveStart = end;
    if (this.sampleStart < 0) this.sampleStart = end;
    if (end - this.liveStart >= 1000) {
      this.liveSnap = this.liveWin.live();
      this.liveWin.reset();
      this.liveStart = end;
    }
    if (this.on && end - this.sampleStart >= this.sampleMs) {
      this.sample(this.sampleStart);
      this.sampleStart = end;
    }
    if (!this.on || total < this.thresholdMs) return;
    this.pendingRender = render;
    this.hitchFrames.push([this.frameStart, end]);
    if (this.hitchFrames.length > 10) this.hitchFrames.shift();
    const parts = [...this.times]
      .filter(([, ms]) => ms >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([n, ms]) => [n, Math.round(ms)] as [string, number]);
    this.report('frame', total, parts, this.frameStart, this.spans);
    this.pendingRender = undefined;
  }

  /** The last second's frame rate, frame and CPU time, systems and render counters; null until a second has passed. */
  liveStats(): LiveStats | null {
    return this.liveSnap;
  }

  /** Emits a 'sample' report for the window that started at `at` (listeners and `samples` only; never logged). */
  private sample(at: number): void {
    const w = this.sampleWin;
    if (w.count === 0) {
      w.reset();
      return;
    }
    const frames = w.frameStats();
    const spans: HitchSpan[] = w.systems().slice(0, MAX_SPANS).map(([name, ms]) => ({ name, start: 0, ms: r1(ms) }));
    let ctx: Ctx = {};
    try {
      ctx = this.ctxFn?.() ?? {};
    } catch {
      /* ignore */
    }
    const wall = Math.round(Date.now() - (this.now() - at));
    const r: HitchReport = {
      kind: 'sample', ms: r1(frames.p50), at: Math.round(at), parts: spans.slice(0, 8).map((sp) => [sp.name, sp.ms]),
      spans, wall, ctx, frames, render: w.renderMean() ?? undefined,
    };
    w.reset();
    this.samples.push(r);
    if (this.samples.length > 60) this.samples.shift();
    for (const fn of this.listeners) {
      try {
        fn(r);
      } catch {
        /* ignore */
      }
    }
  }

  /** One-off work outside the frame loop (a music rebuild, a level load): reported when over the threshold. */
  mark(name: string, ms: number): void {
    if (!this.on || ms < this.thresholdMs) return;
    this.report('mark', ms, [[name, Math.round(ms)]], this.now() - ms, [{ name, start: 0, ms: r1(ms) }]);
  }

  /** A long task seen by the PerformanceObserver. Skipped when an instrumented frame already covered it. */
  longTask(start: number, ms: number): void {
    if (!this.on || ms < this.thresholdMs) return;
    if (this.hitchFrames.some(([a, b]) => start < b && start + ms > a)) return;
    this.report('longtask', ms, [], start);
  }

  /** A gap between animation frames (games without beginFrame/endFrame, and browsers without longtask). */
  gap(start: number, ms: number): void {
    if (!this.on || ms < this.thresholdMs) return;
    if (this.instrumented) return; // the game's own frame reports cover it
    this.report('gap', ms, [], start);
  }

  /** Called at report time only, for labels such as the zone or scene. */
  setContext(fn: () => Ctx): void {
    this.ctxFn = fn;
  }

  onReport(fn: (r: HitchReport) => void): void {
    this.listeners.push(fn);
  }

  /** Total and worst ms per system across the kept frame reports, slowest total first. */
  summary(): { system: string; hitches: number; totalMs: number; worstMs: number }[] {
    const rows = new Map<string, { system: string; hitches: number; totalMs: number; worstMs: number }>();
    for (const r of this.reports) {
      const parts = r.parts.length ? r.parts : [[`(${r.kind})`, r.ms] as [string, number]];
      for (const [system, ms] of parts) {
        const row = rows.get(system) ?? { system, hitches: 0, totalMs: 0, worstMs: 0 };
        row.hitches++;
        row.totalMs += ms;
        row.worstMs = Math.max(row.worstMs, ms);
        rows.set(system, row);
      }
    }
    return [...rows.values()].sort((a, b) => b.totalMs - a.totalMs);
  }

  private report(kind: HitchKind, ms: number, parts: [string, number][], at: number, spans: HitchSpan[] = []): void {
    let ctx: Ctx = {};
    try {
      ctx = this.ctxFn?.() ?? {};
    } catch {
      /* a broken getter must not break the game */
    }
    const wall = Math.round(Date.now() - (this.now() - at));
    const r: HitchReport = { kind, ms: Math.round(ms), at: Math.round(at), parts, spans, wall, ctx };
    if (kind === 'frame' && this.pendingRender) r.render = this.pendingRender;
    this.reports.push(r);
    if (this.reports.length > this.keep) this.reports.shift();
    if (this.log) {
      const what = parts.map(([n, t]) => `${n} ${t}ms`).join(', ') || (kind === 'frame' ? '(nothing timed)' : '');
      const where = Object.keys(ctx).length ? ` [${Object.entries(ctx).map(([k, v]) => `${k}=${v}`).join(' ')}]` : '';
      console.warn(`[hitch] ${kind} ${r.ms}ms${what ? `: ${what}` : ''}${where}`);
    }
    for (const fn of this.listeners) {
      try {
        fn(r);
      } catch {
        /* ignore */
      }
    }
  }
}

const pct = (sorted: Float64Array, n: number, p: number): number => (n === 0 ? 0 : sorted[Math.min(n - 1, Math.max(0, Math.ceil(p * n) - 1))]);

/** Accumulates frames for liveStats() and 'sample' reports without allocating per frame. */
class FrameWindow {
  private readonly gaps = new Float64Array(2048);
  private nGaps = 0;
  count = 0;
  private cpu = 0;
  private readonly sys = new Map<string, number>();
  private renderN = 0;
  private readonly r: RenderStats = { drawCalls: 0, triangles: 0, geometries: 0, textures: 0, programs: 0, gpuMs: 0, pixelRatio: 0 };
  private gpuN = 0;

  interval(ms: number): void {
    if (this.nGaps < this.gaps.length) this.gaps[this.nGaps++] = ms;
  }

  frame(cpuMs: number, times: Map<string, number>, render?: RenderStats): void {
    this.count++;
    this.cpu += cpuMs;
    for (const [k, v] of times) this.sys.set(k, (this.sys.get(k) ?? 0) + v);
    if (render) {
      this.renderN++;
      this.r.drawCalls += render.drawCalls;
      this.r.triangles += render.triangles;
      this.r.geometries = render.geometries;
      this.r.textures = render.textures;
      this.r.programs = render.programs;
      this.r.pixelRatio = render.pixelRatio;
      if (render.gpuMs > 0) {
        this.r.gpuMs += render.gpuMs;
        this.gpuN++;
      }
    }
  }

  reset(): void {
    this.nGaps = 0;
    this.count = 0;
    this.cpu = 0;
    this.sys.clear();
    this.renderN = 0;
    this.gpuN = 0;
    this.r.drawCalls = 0;
    this.r.triangles = 0;
    this.r.gpuMs = 0;
  }

  /** Mean ms per frame of each system, slowest first. */
  systems(): [string, number][] {
    const n = Math.max(1, this.count);
    return [...this.sys].map(([k, v]) => [k, v / n] as [string, number]).sort((a, b) => b[1] - a[1]);
  }

  renderMean(): RenderStats | null {
    if (this.renderN === 0) return null;
    return {
      ...this.r,
      drawCalls: Math.round(this.r.drawCalls / this.renderN),
      triangles: Math.round(this.r.triangles / this.renderN),
      gpuMs: this.gpuN ? r1(this.r.gpuMs / this.gpuN) : 0,
    };
  }

  frameStats(): FrameStats {
    const n = this.nGaps;
    const sorted = this.gaps.slice(0, n).sort();
    return {
      frames: this.count,
      p50: r1(pct(sorted, n, 0.5)),
      p95: r1(pct(sorted, n, 0.95)),
      max: r1(n ? sorted[n - 1] : 0),
      cpu: r1(this.cpu / Math.max(1, this.count)),
    };
  }

  live(): LiveStats {
    const f = this.frameStats();
    let mean = 0;
    for (let i = 0; i < this.nGaps; i++) mean += this.gaps[i];
    mean = this.nGaps ? mean / this.nGaps : 0;
    return { fps: mean > 0 ? Math.round(1000 / mean) : 0, frameMs: r1(mean), cpuMs: f.cpu, p95Ms: f.p95, systems: this.systems(), render: this.renderMean() };
  }
}

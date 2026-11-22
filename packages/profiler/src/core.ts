// The profiler itself, free of globals so it can be tested: per-frame system timings, a report for every frame
// or long task over the threshold, a ring buffer of reports and a worst-systems summary.
// Off, every entry point is one boolean check.

export type HitchKind = 'frame' | 'longtask' | 'gap' | 'mark';

export interface HitchReport {
  kind: HitchKind;
  /** Total duration in ms (rounded). */
  ms: number;
  /** ms since page load when it happened. */
  at: number;
  /** For 'frame': the timed systems over 2 ms, slowest first. For 'mark': [[name, ms]]. */
  parts: [string, number][];
  /** Whatever the game's context getter returned (zone, scene, level...). */
  ctx: Record<string, string | number | boolean>;
}

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
  private readonly log: boolean;
  private readonly keep: number;
  private readonly now: () => number;
  private readonly times = new Map<string, number>();
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

  /** Runs `fn` and adds its time under `name` for this frame. */
  timed<T>(name: string, fn: () => T): T {
    if (!this.on) return fn();
    const t0 = this.now();
    try {
      return fn();
    } finally {
      this.times.set(name, (this.times.get(name) ?? 0) + this.now() - t0);
    }
  }

  beginFrame(): void {
    if (!this.on) return;
    this.times.clear();
    this.frameStart = this.now();
    this.inFrame = true;
    this.instrumented = true;
  }

  endFrame(): void {
    if (!this.on || !this.inFrame) return;
    this.inFrame = false;
    const end = this.now();
    const total = end - this.frameStart;
    if (total < this.thresholdMs) return;
    this.hitchFrames.push([this.frameStart, end]);
    if (this.hitchFrames.length > 10) this.hitchFrames.shift();
    const parts = [...this.times]
      .filter(([, ms]) => ms >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([n, ms]) => [n, Math.round(ms)] as [string, number]);
    this.report('frame', total, parts, this.frameStart);
  }

  /** One-off work outside the frame loop (a music rebuild, a level load): reported when over the threshold. */
  mark(name: string, ms: number): void {
    if (!this.on || ms < this.thresholdMs) return;
    this.report('mark', ms, [[name, Math.round(ms)]], this.now() - ms);
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

  private report(kind: HitchKind, ms: number, parts: [string, number][], at: number): void {
    let ctx: Ctx = {};
    try {
      ctx = this.ctxFn?.() ?? {};
    } catch {
      /* a broken getter must not break the game */
    }
    const r: HitchReport = { kind, ms: Math.round(ms), at: Math.round(at), parts, ctx };
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

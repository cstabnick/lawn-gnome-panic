// @lawn/profiler: an opt-in hitch profiler for any game. Off by default (see config.ts for the URL flags);
// off, timed() is a plain call and the rest are one boolean check. Nothing is observed or sent until it is on.
import { readProfileConfig } from './config';
import { Profiler } from './core';
import type { Ctx, LiveStats, RenderStats } from './core';

export { Profiler } from './core';
export type { Ctx, FrameStats, HitchKind, HitchReport, LiveStats, ProfilerOptions, RenderStats } from './core';
export { createGpuTimer, type GpuTimer } from './gpu';
export { parseProfileValue, readProfileConfig, DEFAULT_THRESHOLD_MS, STORAGE_KEY } from './config';
export type { ProfileConfig } from './config';

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

const config = readProfileConfig(typeof location === 'undefined' ? '' : location.search, storage());

/** The page's profiler. */
export const profiler = new Profiler({ on: config.on, thresholdMs: config.thresholdMs });
/** True when profiling is on for this page load. */
export const profilerOn = profiler.on;

/** Runs `fn` and adds its time under `name` for this frame. */
export function timed<T>(name: string, fn: () => T): T {
  return profiler.timed(name, fn);
}
/** Call at the top of the game's frame. */
export function beginFrame(): void {
  profiler.beginFrame();
}
/** Call at the end of the game's frame: reports it when it ran over the threshold. */
export function endFrame(): void {
  profiler.endFrame();
}
/** Starts a named section of the frame and ends the previous one (endFrame closes the last). Off: one check. */
export function section(name: string | null): void {
  profiler.section(name);
}
/** The renderer's counters, read once per frame at endFrame while collecting (e.g. from three's renderer.info). */
export function setRenderStats(fn: (() => RenderStats) | null): void {
  profiler.setRenderStats(fn);
}
/** Collect live stats for an on-screen overlay even when profiling is off (nothing is reported or sent). */
export function setLive(on: boolean): void {
  profiler.setLive(on);
}
/** The last second's fps, frame / CPU ms, systems and render counters (null until collecting for a second). */
export function liveStats(): LiveStats | null {
  return profiler.liveStats();
}
/** Reports one-off work (ms already measured) when it ran over the threshold. */
export function mark(name: string, ms: number): void {
  profiler.mark(name, ms);
}
/** Times one-off work and reports it when it ran over the threshold. */
export function measure<T>(name: string, fn: () => T): T {
  if (!profiler.on) return fn();
  const t0 = performance.now();
  try {
    return fn();
  } finally {
    profiler.mark(name, performance.now() - t0);
  }
}

let started = false;

/**
 * Starts watching this page: long tasks (or animation-frame gaps where the browser has no longtask timing),
 * the console helper `__lawnProfile`, and the upload when asked for. One call per game, at the top of main.ts.
 * Without it the frame API still logs, it just watches nothing outside the frame.
 */
export function initProfiler(game: string, opts: { context?: () => Ctx } = {}): void {
  if (opts.context) profiler.setContext(opts.context);
  if (!profiler.on || started || typeof window === 'undefined') return;
  started = true;
  console.info(`[hitch] profiling ${game}: reports frames and long tasks over ${profiler.thresholdMs} ms (?profile=off to stop)`);

  (window as unknown as { __lawnProfile: unknown }).__lawnProfile = {
    reports: profiler.reports,
    /** The periodic frame-health samples (systems, render counters, frame times). */
    samples: profiler.samples,
    /** The last second's live stats. */
    live: () => profiler.liveStats(),
    /** console.table of the worst systems across this load's hitches. */
    summary: () => console.table(profiler.summary()),
    /** The reports as JSON, e.g. copy(__lawnProfile.json()). */
    json: () => JSON.stringify({ game, thresholdMs: profiler.thresholdMs, ua: navigator.userAgent, reports: profiler.reports }),
  };

  let longtask = false;
  try {
    if (PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) profiler.longTask(e.startTime, e.duration);
      }).observe({ type: 'longtask', buffered: true });
      longtask = true;
    }
  } catch {
    longtask = false;
  }

  if (!longtask) {
    // Safari and iOS have no longtask timing: watch the gaps between animation frames instead (skipping hidden tabs).
    let last = performance.now();
    let hiddenSince = -1;
    document.addEventListener('visibilitychange', () => {
      hiddenSince = performance.now();
    });
    const tick = (t: number): void => {
      if (hiddenSince < last) profiler.gap(last, t - last);
      last = t;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (config.upload) {
    import('./upload').then((m) => m.startUpload(profiler, game)).catch(() => {});
  }
}

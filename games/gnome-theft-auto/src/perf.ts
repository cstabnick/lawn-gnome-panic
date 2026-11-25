// Profiling hooks for Gnome Theft Auto (@lawn/profiler). Off by default; nothing here costs more than a boolean check
// per call unless one of these is in the URL:
//   ?profile[=ms][,upload][,keep]   hitch reports and 5 s frame-health samples (with draw calls, triangles, GPU ms),
//                                   uploaded to the platform ProfileService with `upload`, viewed at /admin/profiler/
//   ?perf                           the on-screen overlay (perfOverlay.ts): FPS, frame / CPU / GPU ms, draw calls,
//                                   triangles and the slowest systems, with the quality tier and region
// The frame is split into named sections in app.ts (`section('traffic')` ...), the render is `render`.
import type * as THREE from 'three';
import {
  createGpuTimer, disableProfiler, enableProfiler, flushUpload, initProfiler, liveStats, profiler,
  setLive, setRenderStats, uploadStatus, type Ctx, type GpuTimer, type UploadStatus,
} from '@lawn/profiler';
import { mountPerfOverlay, type PerfOverlay } from './perfOverlay';

export { beginFrame, endFrame, measure, section } from '@lawn/profiler';

export interface PerfHooks {
  /** Renders the scene, with the GPU timer around it when it is on. */
  render(scene: THREE.Scene, camera: THREE.Camera): void;
}

let wiredRenderer: THREE.WebGLRenderer | null = null;
let wiredUi: HTMLElement | null = null;
let wiredExtra: (() => Record<string, string | number>) | undefined;
let gpu: GpuTimer | null = null;
let renderStatsWired = false;
let overlayHandle: PerfOverlay | null = null;

function ensureRenderHooks(): void {
  if (!wiredRenderer || !profiler.collecting) return;
  if (!gpu) gpu = createGpuTimer(wiredRenderer.getContext());
  if (!renderStatsWired) {
    renderStatsWired = true;
    const info = wiredRenderer.info;
    const r = wiredRenderer;
    setRenderStats(() => ({
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      programs: info.programs?.length ?? 0,
      gpuMs: gpu?.lastMs ?? 0,
      pixelRatio: r.getPixelRatio(),
    }));
  }
}

export function isProfiling(): boolean {
  return profiler.on;
}

export function isOverlayOpen(): boolean {
  return overlayHandle !== null;
}

export function setPerfOverlay(on: boolean): void {
  if (on === (overlayHandle !== null)) return;
  if (on) {
    setLive(true);
    ensureRenderHooks();
    if (wiredUi) overlayHandle = mountPerfOverlay(wiredUi, liveStats, wiredExtra, perfStatusLine);
  } else {
    overlayHandle?.destroy();
    overlayHandle = null;
    setLive(false);
  }
}

export function setProfileUpload(on: boolean): void {
  if (on) {
    enableProfiler({ upload: true, keep: true });
    ensureRenderHooks();
  } else {
    disableProfiler();
  }
}

export function flushPerfUpload(): void {
  flushUpload();
}

export function perfUploadStatus(): UploadStatus | null {
  return uploadStatus();
}

export function perfCounts(): { reports: number; samples: number; thresholdMs: number } {
  return { reports: profiler.reports.length, samples: profiler.samples.length, thresholdMs: profiler.thresholdMs };
}

function perfStatusLine(): string | null {
  if (!profiler.on) return null;
  const u = uploadStatus();
  const base = `profile ${profiler.reports.length}h/${profiler.samples.length}s`;
  if (!u) return base;
  if (u.state === 'error' || u.state === 'unavailable') return `${base} · upload err: ${u.lastError}`;
  return `${base} · sent ${u.sent}` + (u.queued ? ` (${u.queued} q)` : '');
}

/** Wires the profiler to this renderer. `context` labels each report (region, vehicle, quest, quality); `extra` adds overlay lines. */
export function initPerf(renderer: THREE.WebGLRenderer, ui: HTMLElement, context: () => Ctx, extra?: () => Record<string, string | number>): PerfHooks {
  wiredRenderer = renderer;
  wiredUi = ui;
  wiredExtra = extra;
  initProfiler('gnome-theft-auto', { context });
  const overlay = new URLSearchParams(location.search).has('perf');
  if (overlay) setPerfOverlay(true);
  ensureRenderHooks();
  return {
    render(scene, camera) {
      if (!gpu || !profiler.collecting) {
        renderer.render(scene, camera);
        return;
      }
      gpu.begin();
      renderer.render(scene, camera);
      gpu.end();
    },
  };
}

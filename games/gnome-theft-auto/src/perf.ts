// Profiling hooks for Gnome Theft Auto (@lawn/profiler). Off by default; nothing here costs more than a boolean check
// per call unless one of these is in the URL:
//   ?profile[=ms][,upload][,keep]   hitch reports and 5 s frame-health samples (with draw calls, triangles, GPU ms),
//                                   uploaded to the platform ProfileService with `upload`, viewed at /admin/profiler/
//   ?perf                           the on-screen overlay (perfOverlay.ts): FPS, frame / CPU / GPU ms, draw calls,
//                                   triangles and the slowest systems, with the quality tier and region
// The frame is split into named sections in app.ts (`section('traffic')` ...), the render is `render`.
import type * as THREE from 'three';
import { createGpuTimer, initProfiler, liveStats, profiler, setLive, setRenderStats, type Ctx } from '@lawn/profiler';
import { mountPerfOverlay } from './perfOverlay';

export { beginFrame, endFrame, measure, section } from '@lawn/profiler';

export interface PerfHooks {
  /** Renders the scene, with the GPU timer around it when it is on. */
  render(scene: THREE.Scene, camera: THREE.Camera): void;
}

/** Wires the profiler to this renderer. `context` labels each report (region, vehicle, quest, quality); `extra` adds overlay lines. */
export function initPerf(renderer: THREE.WebGLRenderer, ui: HTMLElement, context: () => Ctx, extra?: () => Record<string, string | number>): PerfHooks {
  initProfiler('gnome-theft-auto', { context });
  const overlay = new URLSearchParams(location.search).has('perf');
  if (overlay) setLive(true);
  const on = profiler.collecting;
  const gpu = on ? createGpuTimer(renderer.getContext()) : null;
  if (on) {
    const info = renderer.info;
    setRenderStats(() => ({
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      programs: info.programs?.length ?? 0,
      gpuMs: gpu?.lastMs ?? 0,
      pixelRatio: renderer.getPixelRatio(),
    }));
  }
  if (overlay) mountPerfOverlay(ui, liveStats, extra);
  return {
    render(scene, camera) {
      if (!gpu) {
        renderer.render(scene, camera);
        return;
      }
      gpu.begin();
      renderer.render(scene, camera);
      gpu.end();
    },
  };
}

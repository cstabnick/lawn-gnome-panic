// Sends hitch reports to the platform service's gnome.profile.v1.ProfileService/ReportHitches (Connect, JSON over
// HTTP; no token). Loaded only when ?profile=upload (or a kept upload setting) is on. Anonymous: a random id per page
// load, the game, the build and the device class; never names, account ids or anything typed.
// Viewed at /admin/profiler/ (games/admin-profiler).
import { platformUrl } from '@lawn/platform/url';
import type { HitchReport, Profiler } from './core';

const MAX_PER_LOAD = 300; // hitch reports per page load (the server keeps at most 500 per session)
const MAX_SAMPLES_PER_LOAD = 720; // 'sample' reports per page load, one every 5 s: an hour (the server keeps 720 per session)
const MAX_PER_BATCH = 60; // the server's limit
const MAX_HITCH_MS = 10 * 60 * 1000; // matches ProfileService maxHitchMS
const FLUSH_MS = 10000;
export const REPORT_PATH = '/gnome.profile.v1.ProfileService/ReportHitches';

export interface UploadStatus {
  state: 'idle' | 'uploading' | 'ok' | 'error' | 'unavailable';
  endpoint: string;
  sessionId: string;
  queued: number;
  sent: number;
  failed: number;
  lastError: string;
  lastSentAt: number;
}

export interface UploadHandle {
  flush(keepalive?: boolean): void;
  stop(): void;
  status(): UploadStatus;
}

function makeId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return (Math.random().toString(36).slice(2) + Date.now().toString(36)).padEnd(12, '0');
  }
}

function gpuName(): string {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    const name = ext && gl ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return name.slice(0, 120);
  } catch {
    return '';
  }
}

/** The protojson Device message, read once. */
export function device(): Record<string, string | number | boolean> {
  const nav = navigator as Navigator & { deviceMemory?: number };
  let touch = false;
  try {
    touch = matchMedia('(pointer: coarse)').matches;
  } catch {
    /* ignore */
  }
  return {
    gpu: gpuName(),
    touch,
    cores: nav.hardwareConcurrency || 0,
    memoryGb: nav.deviceMemory || 0,
    userAgent: navigator.userAgent.slice(0, 300),
    width: Math.round(window.innerWidth / 10) * 10,
    height: Math.round(window.innerHeight / 10) * 10,
  };
}

/** The ReportHitches URL for a platform base URL ('' when accounts are not set up for this build). */
export function reportEndpoint(base: string): string {
  return base ? base.replace(/\/$/, '') + REPORT_PATH : '';
}

/** One report as a protojson gnome.profile.v1.Hitch. */
export function toHitchJson(r: HitchReport): Record<string, unknown> {
  const context: Record<string, string> = {};
  for (const [k, v] of Object.entries(r.ctx).slice(0, 8)) context[k.slice(0, 64)] = String(v).slice(0, 64);
  const clampMs = (v: number): number => (Number.isFinite(v) ? Math.min(MAX_HITCH_MS, Math.max(0, v)) : 0);
  return {
    kind: r.kind,
    atMs: Math.max(0, Number.isFinite(r.at) ? r.at : 0),
    durationMs: clampMs(r.ms),
    occurredAt: new Date(r.wall).toISOString(),
    context,
    spans: r.spans.slice(0, 64).map((s) => ({
      name: s.name.slice(0, 64) || '?',
      startMs: clampMs(s.start),
      durationMs: clampMs(s.ms),
    })),
    ...(r.render ? {
      render: {
        drawCalls: r.render.drawCalls, triangles: r.render.triangles, geometries: Math.round(r.render.geometries),
        textures: Math.round(r.render.textures), programs: Math.round(r.render.programs), gpuMs: clampMs(r.render.gpuMs), pixelRatio: r.render.pixelRatio,
      },
    } : {}),
    ...(r.frames ? {
      frames: {
        frames: r.frames.frames,
        p50Ms: clampMs(r.frames.p50),
        p95Ms: clampMs(r.frames.p95),
        maxMs: clampMs(r.frames.max),
        cpuMs: clampMs(r.frames.cpu),
      },
    } : {}),
  };
}

/** The build id baked in by Vite (VITE_BUILD_ID), or ''. */
function buildId(): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  return (env?.VITE_BUILD_ID ?? '').slice(0, 40);
}

export function startUpload(p: Profiler, game: string): UploadHandle {
  const endpoint = reportEndpoint(platformUrl());
  const sessionId = makeId();
  const st: UploadStatus = {
    state: endpoint ? 'idle' : 'unavailable',
    endpoint,
    sessionId,
    queued: 0,
    sent: 0,
    failed: 0,
    lastError: endpoint ? '' : 'no platform service (VITE_PLATFORM_URL or ?platform=)',
    lastSentAt: 0,
  };
  if (!endpoint) {
    console.warn('[hitch] upload asked for, but this build has no platform service (VITE_PLATFORM_URL or ?platform=); logging only');
    return { flush: () => {}, stop: () => {}, status: () => ({ ...st }) };
  }
  const dev = device();
  const queue: HitchReport[] = [];
  let sent = 0;
  let stopped = false;
  let warnedErr = '';

  const recordErr = (msg: string, count: number): void => {
    st.state = 'error';
    st.failed += count;
    st.lastError = msg;
    if (warnedErr !== msg) {
      warnedErr = msg;
      console.warn(`[hitch] upload to ${endpoint} failed: ${msg}`);
    }
  };

  const flush = (keepalive = false): void => {
    if (stopped || queue.length === 0) return;
    try {
      while (queue.length > 0) {
        const batch = queue.splice(0, MAX_PER_BATCH);
        st.queued = queue.length;
        st.state = 'uploading';
        const body = JSON.stringify({
          sessionId,
          game,
          build: buildId(),
          device: dev,
          thresholdMs: p.thresholdMs,
          sentAtUnixMs: String(Date.now()),
          hitches: batch.map(toHitchJson),
        });
        fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: keepalive && body.length < 60000 })
          .then((res) => {
            if (!res.ok) {
              recordErr(`HTTP ${res.status}`, batch.length);
              return;
            }
            st.sent += batch.length;
            st.lastSentAt = Date.now();
            st.lastError = '';
            warnedErr = '';
            st.state = 'ok';
          })
          .catch((e: unknown) => {
            recordErr(e instanceof Error ? e.message : 'network error', batch.length);
          });
      }
    } catch (e: unknown) {
      recordErr(e instanceof Error ? e.message : 'upload error', 0);
    }
  };

  let sentSamples = 0;
  const add = (r: HitchReport): void => {
    if (stopped) return;
    if (r.kind === 'sample') {
      if (sentSamples >= MAX_SAMPLES_PER_LOAD) return;
      sentSamples++;
    } else {
      if (sent >= MAX_PER_LOAD) return;
      sent++;
    }
    queue.push(r);
    st.queued = queue.length;
    if (queue.length >= MAX_PER_BATCH) flush();
  };
  // This module loads after the page starts, so the first (often worst) hitches are already in the buffer.
  for (const r of p.reports) add(r);
  for (const r of p.samples) add(r);
  p.onReport(add);
  const initialTimer = setTimeout(() => flush(), 3000);
  const intervalTimer = setInterval(() => flush(), FLUSH_MS);
  const onVis = (): void => {
    if (document.visibilityState === 'hidden') flush(true);
  };
  const onHide = (): void => flush(true);
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pagehide', onHide);
  console.info(`[hitch] uploading hitch reports for ${game} (session ${sessionId}) to ${endpoint}`);
  return {
    flush,
    stop() {
      if (stopped) return;
      flush(true);
      stopped = true;
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onHide);
    },
    status: () => ({ ...st, queued: queue.length }),
  };
}

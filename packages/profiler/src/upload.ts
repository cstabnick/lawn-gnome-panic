// Sends hitch reports to the platform service's gnome.profile.v1.ProfileService/ReportHitches (Connect, JSON over
// HTTP; no token). Loaded only when ?profile=upload (or a kept upload setting) is on. Anonymous: a random id per page
// load, the game, the build and the device class; never names, account ids or anything typed.
// Viewed at /admin/profiler/ (games/admin-profiler).
import { platformUrl } from '@lawn/platform/url';
import type { HitchReport, Profiler } from './core';

const MAX_PER_LOAD = 300; // hitch reports per page load (the server keeps at most 500 per session)
const MAX_PER_BATCH = 60; // the server's limit
const FLUSH_MS = 10000;
export const REPORT_PATH = '/gnome.profile.v1.ProfileService/ReportHitches';

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
  return {
    kind: r.kind,
    atMs: r.at,
    durationMs: r.ms,
    occurredAt: new Date(r.wall).toISOString(),
    context,
    spans: r.spans.slice(0, 64).map((s) => ({ name: s.name.slice(0, 64) || '?', startMs: Math.max(0, s.start), durationMs: Math.max(0, s.ms) })),
  };
}

/** The build id baked in by Vite (VITE_BUILD_ID), or ''. */
function buildId(): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  return (env?.VITE_BUILD_ID ?? '').slice(0, 40);
}

export function startUpload(p: Profiler, game: string): void {
  const endpoint = reportEndpoint(platformUrl());
  if (!endpoint) {
    console.warn('[hitch] upload asked for, but this build has no platform service (VITE_PLATFORM_URL or ?platform=); logging only');
    return;
  }
  const sessionId = makeId();
  const dev = device();
  const queue: HitchReport[] = [];
  let sent = 0;

  const flush = (keepalive = false): void => {
    try {
      while (queue.length > 0) {
        const batch = queue.splice(0, MAX_PER_BATCH);
        const body = JSON.stringify({
          sessionId,
          game,
          build: buildId(),
          device: dev,
          thresholdMs: p.thresholdMs,
          sentAtUnixMs: String(Date.now()),
          hitches: batch.map(toHitchJson),
        });
        fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: keepalive && body.length < 60000 }).catch(() => {});
      }
    } catch {
      /* best effort */
    }
  };

  const add = (r: HitchReport): void => {
    if (sent >= MAX_PER_LOAD) return;
    sent++;
    queue.push(r);
    if (queue.length >= MAX_PER_BATCH) flush();
  };
  // This module loads after the page starts, so the first (often worst) hitches are already in the buffer.
  for (const r of p.reports) add(r);
  p.onReport(add);
  setTimeout(() => flush(), 3000);
  setInterval(() => flush(), FLUSH_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush(true);
  });
  window.addEventListener('pagehide', () => flush(true));
  console.info(`[hitch] uploading hitch reports for ${game} (session ${sessionId}) to ${endpoint}`);
}

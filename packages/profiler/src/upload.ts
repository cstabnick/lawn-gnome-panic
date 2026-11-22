// Sends hitch reports to the mp-server's anonymous telemetry intake (TELEMETRY_PATH, the same pipe sample-3d uses),
// as 'hitch' events. Loaded only when ?profile=upload (or a kept upload setting) is on. Anonymous: a random id per
// page load, the game, the device class and the frame breakdown; never names, account ids or anything typed.
import { serverUrl } from '@lawn/mp/client';
import { TELEMETRY_MAX_BYTES, TELEMETRY_MAX_EVENTS, TELEMETRY_PATH } from '@lawn/mp/protocol';
import type { ClientEvent, TelemetryBatch } from '@lawn/mp/protocol';
import type { HitchReport, Profiler } from './core';

const MAX_PER_LOAD = 60; // hitch reports per page load; a game that hitches every frame should not flood the server
const FLUSH_MS = 15000;

function makeId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

function gpuName(): string {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    const name = ext && gl ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return name.slice(0, 80);
  } catch {
    return '';
  }
}

/** Device fields sent with every hitch, read once. */
function device(): Record<string, string | number | boolean> {
  const nav = navigator as Navigator & { deviceMemory?: number };
  let touch = false;
  try {
    touch = matchMedia('(pointer: coarse)').matches;
  } catch {
    /* ignore */
  }
  return { gpu: gpuName(), touch, cores: nav.hardwareConcurrency || 0, mem: nav.deviceMemory || 0 };
}

/** The HTTP endpoint for a ws(s):// server URL, or '' when online is not set up for this build. */
export function telemetryEndpoint(wsUrl: string): string {
  try {
    if (!wsUrl) return '';
    const u = new URL(wsUrl);
    if (u.protocol === 'wss:') u.protocol = 'https:';
    else if (u.protocol === 'ws:') u.protocol = 'http:';
    else return '';
    u.pathname = TELEMETRY_PATH;
    u.search = '';
    u.hash = '';
    return u.toString();
  } catch {
    return '';
  }
}

/** One report as a telemetry event: at most 12 fields, strings <= 200 chars (the server's rules). */
export function hitchEvent(game: string, r: HitchReport, dev: Record<string, string | number | boolean>): ClientEvent {
  const top = r.parts.slice(0, 8).map(([n, ms]) => `${n} ${ms}`).join(',').slice(0, 200);
  const where = Object.entries(r.ctx).map(([k, v]) => `${k}=${v}`).join(' ').slice(0, 200);
  return { ev: 'hitch', at: r.at, game, kind: r.kind, ms: r.ms, top, where, ...dev } as ClientEvent;
}

export function startUpload(p: Profiler, game: string): void {
  const endpoint = telemetryEndpoint(serverUrl());
  if (!endpoint) {
    console.warn('[hitch] upload asked for, but this build has no mp-server (set VITE_MP_URL or ?mp=); logging only');
    return;
  }
  const sid = makeId();
  const dev = device();
  const queue: ClientEvent[] = [];
  let sent = 0;

  const flush = (): void => {
    try {
      while (queue.length > 0) {
        const events = queue.splice(0, TELEMETRY_MAX_EVENTS);
        let body = JSON.stringify({ cid: sid, sid, events } satisfies TelemetryBatch);
        while (body.length > TELEMETRY_MAX_BYTES - 512 && events.length > 1) {
          queue.unshift(events.pop() as ClientEvent);
          body = JSON.stringify({ cid: sid, sid, events } satisfies TelemetryBatch);
        }
        const blob = new Blob([body], { type: 'text/plain' }); // text/plain: no CORS preflight
        if (!navigator.sendBeacon?.(endpoint, blob)) {
          fetch(endpoint, { method: 'POST', body, keepalive: true, mode: 'no-cors' }).catch(() => {});
        }
      }
    } catch {
      /* best effort */
    }
  };

  const add = (r: HitchReport): void => {
    if (sent >= MAX_PER_LOAD) return;
    sent++;
    queue.push(hitchEvent(game, r, dev));
    if (queue.length >= TELEMETRY_MAX_EVENTS) flush();
  };
  // This module loads after the page starts, so the first (often worst) hitches are already in the buffer.
  for (const r of p.reports) add(r);
  p.onReport(add);
  setTimeout(flush, 3000);
  setInterval(flush, FLUSH_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
  console.info(`[hitch] uploading hitch reports for ${game} to ${endpoint}`);
}

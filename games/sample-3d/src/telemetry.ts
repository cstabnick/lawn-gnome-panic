import { TELEMETRY_MAX_BYTES, TELEMETRY_MAX_EVENTS, TELEMETRY_PATH } from './net/protocol';
import type { ClientEvent, ClientEventName, TelemetryBatch } from './net/protocol';

// Anonymous event reporter. Batches game events and POSTs them to the matchmaking server's
// TELEMETRY_PATH with navigator.sendBeacon. Never send names, chat text, room codes or anything
// the player typed. Telemetry must never break the game: every entry point swallows its errors.

const CID_KEY = 'sample-3d.cid';
const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;
const FLUSH_MS = 15000;
const MAX_ERRORS = 5;
const MAX_FIELDS = 12;
const MAX_STR = 200;

let inited = false;
let on = false;
let endpoint = '';
let cid = '';
let sid = '';
let errorCount = 0;
const queue: ClientEvent[] = [];

function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to the Math.random fallback
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadCid(): string {
  try {
    const saved = localStorage.getItem(CID_KEY);
    if (saved && ID_RE.test(saved)) return saved;
    const id = makeId();
    localStorage.setItem(CID_KEY, id);
    return id;
  } catch {
    // private mode or blocked storage: a fresh id for this page load
    return makeId();
  }
}

function send(body: string): void {
  const blob = new Blob([body], { type: 'text/plain' });
  let ok = false;
  try {
    ok = typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(endpoint, blob);
  } catch {
    ok = false;
  }
  if (!ok) {
    try {
      fetch(endpoint, { method: 'POST', body, keepalive: true, mode: 'no-cors' }).catch(() => {});
    } catch {
      // ignore: telemetry is best effort
    }
  }
}

function flush(): void {
  try {
    if (!on || queue.length === 0) return;
    // Several beacons if needed: each stays under the server's TELEMETRY_MAX_BYTES (1 KB margin for multi-byte text).
    while (queue.length > 0) {
      const events: ClientEvent[] = [];
      let size = 100;
      while (queue.length > 0 && events.length < TELEMETRY_MAX_EVENTS) {
        const n = JSON.stringify(queue[0]).length + 1;
        if (events.length > 0 && size + n > TELEMETRY_MAX_BYTES - 1024) break;
        size += n;
        events.push(queue.shift() as ClientEvent);
      }
      const batch: TelemetryBatch = { cid, sid, events };
      send(JSON.stringify(batch));
    }
  } catch {
    // never throw
  }
}

/**
 * Turns telemetry on for this page load. Off (every function a no-op) when wsUrl is empty,
 * Do Not Track is set, the URL has telemetry=0, or it has already run.
 */
export function initTelemetry(wsUrl: string): void {
  if (inited) return;
  inited = true;
  try {
    if (!wsUrl) return;
    if (navigator.doNotTrack === '1') return;
    if (new URLSearchParams(location.search).get('telemetry') === '0') return;

    const u = new URL(wsUrl);
    if (u.protocol === 'wss:') u.protocol = 'https:';
    else if (u.protocol === 'ws:') u.protocol = 'http:';
    else return;
    u.pathname = TELEMETRY_PATH;
    u.search = '';
    u.hash = '';
    endpoint = u.toString();

    cid = loadCid();
    sid = makeId();

    window.addEventListener('error', (e: ErrorEvent) => {
      if (errorCount >= MAX_ERRORS) return;
      errorCount++;
      track('error', {
        msg: String(e.message).slice(0, 200),
        src: (e.filename || '').split('/').pop() ?? '',
        line: e.lineno || 0,
      });
    });
    window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
      if (errorCount >= MAX_ERRORS) return;
      errorCount++;
      track('error', {
        msg: String(e.reason instanceof Error ? e.reason.message : e.reason).slice(0, 200),
        src: 'promise',
        line: 0,
      });
    });

    setInterval(flush, FLUSH_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('pagehide', flush);

    on = true;
    let touch = false;
    try {
      touch = matchMedia('(pointer: coarse)').matches;
    } catch {
      touch = false;
    }
    track('load', {
      touch,
      w: Math.round(window.innerWidth / 100) * 100,
      h: Math.round(window.innerHeight / 100) * 100,
    });
  } catch {
    on = false;
  }
}

/** Queues one event (sent in batches). No-op until initTelemetry, or when telemetry is off. */
export function track(ev: ClientEventName, data: Record<string, string | number | boolean> = {}): void {
  if (!on) return;
  try {
    const e: Record<string, string | number | boolean> = { ev, at: Math.round(performance.now()) };
    let n = 0;
    for (const k of Object.keys(data)) {
      if (k === 'ev' || k === 'at') continue;
      if (n >= MAX_FIELDS) break;
      n++;
      const v = data[k];
      e[k] = typeof v === 'string' ? v.slice(0, MAX_STR) : v;
    }
    queue.push(e as ClientEvent);
    if (queue.length >= TELEMETRY_MAX_EVENTS) flush();
  } catch {
    // never throw
  }
}

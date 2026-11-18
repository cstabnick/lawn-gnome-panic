// Telemetry for the matchmaking server: the event log (server events and anonymous client batches posted to
// TELEMETRY_PATH, one structured record each, see log.ts), running counters for /healthz, and batch validation.
// Never log player names, chat text, room codes or IP addresses.
import { CLIENT_EVENT_NAMES, TELEMETRY_MAX_EVENTS } from '../../mp/src/protocol';
import type { ClientEvent, ClientEventName, TelemetryBatch } from '../../mp/src/protocol';
import { log } from './log';
import type { Severity } from './otel';

const counts = new Map<string, number>();
const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;
const FIELD_RE = /^[a-zA-Z]{1,24}$/;
const MAX_FIELDS = 12;
const MAX_STR = 200;

/** Events worth a WARN: a client error report, and players hitting a server-side limit. */
const WARN_EVENTS = new Set(['client:error', 'server:bad_name', 'server:chat_rate', 'server:telemetry_rejected']);

export function eventSeverity(src: 'server' | 'client', ev: string): Severity {
  return WARN_EVENTS.has(`${src}:${ev}`) ? 'WARN' : 'INFO';
}

/** One event record: message = the event name, plus event.name, src and the event's fields. Also counts src:ev. */
export function logEvent(src: 'server' | 'client', ev: string, fields: Record<string, unknown> = {}): void {
  const key = `${src}:${ev}`;
  counts.set(key, (counts.get(key) ?? 0) + 1);
  log(eventSeverity(src, ev), ev, src === 'client' ? 'client' : 'matchmaker', { ...fields, 'event.name': ev, src });
}

/** A server lifecycle message (startup, draining, exit, stats). Not counted. */
export function logMessage(message: string, fields: Record<string, unknown> = {}, severity: Severity = 'INFO'): void {
  log(severity, message, 'server', fields);
}

/** Counts per "src:ev" since start, e.g. { "server:match_start": 3, "client:load": 10 }. */
export function counters(): Record<string, number> {
  return Object.fromEntries(counts);
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Validates a client batch (parsed JSON). Returns the clean batch, or null to reject it. */
export function cleanBatch(raw: unknown): TelemetryBatch | null {
  if (!isObj(raw)) return null;
  const { cid, sid, events } = raw;
  if (typeof cid !== 'string' || !ID_RE.test(cid)) return null;
  if (typeof sid !== 'string' || !ID_RE.test(sid)) return null;
  if (!Array.isArray(events) || events.length < 1 || events.length > TELEMETRY_MAX_EVENTS) return null;

  const out: ClientEvent[] = [];
  for (const e of events) {
    if (!isObj(e)) continue;
    const { ev, at } = e;
    if (typeof ev !== 'string' || !(CLIENT_EVENT_NAMES as readonly string[]).includes(ev)) continue;
    if (typeof at !== 'number' || !Number.isFinite(at)) continue;

    const fields: Record<string, string | number | boolean> = {};
    let kept = 0;
    for (const [k, v] of Object.entries(e)) {
      if (kept >= MAX_FIELDS) break;
      if (k === 'ev' || k === 'at' || !FIELD_RE.test(k)) continue;
      if (typeof v === 'number') {
        if (!Number.isFinite(v)) continue;
        fields[k] = v;
      } else if (typeof v === 'boolean') {
        fields[k] = v;
      } else if (typeof v === 'string') {
        fields[k] = Array.from(v).slice(0, MAX_STR).join('');
      } else {
        continue;
      }
      kept++;
    }
    out.push({ ev: ev as ClientEventName, at, ...fields } as ClientEvent);
  }
  if (out.length === 0) return null;
  return { cid, sid, events: out };
}

// One span per match, from match_start to match_end, built from the matchmaker's event stream (no changes to the
// matchmaker itself). Joins, leaves, host changes and away events become span events, so a trace shows a match's
// timeline; the event's log line carries the match span's trace_id. A no-op unless ENABLE_OTEL_TRACING is on.
import { startSpan } from './otel';
import type { SpanHandle } from './otel';
import { snake } from './log';

const open = new Map<unknown, SpanHandle>();

function snakeFields(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [snake(k), v]));
}

/** Feeds one matchmaker event to the match spans; returns the span the event belongs to (for log correlation). */
export function onMatchEvent(ev: string, fields: Record<string, unknown>): SpanHandle | undefined {
  const id = fields.matchId;
  if (id === undefined) return undefined;
  const f = snakeFields(fields);
  if (ev === 'match_start') {
    const span = startSpan('match', 'internal', { ...f, 'event.name': ev });
    open.set(id, span);
    return span;
  }
  const span = open.get(id);
  if (!span) return undefined;
  if (ev === 'match_end') {
    span.setAttributes({ 'match.end_reason': f.reason, duration_s: f.duration_s });
    if (f.reason === 'too_long') span.fail('match ran too long');
    span.end();
    open.delete(id);
  } else {
    span.addEvent(ev, f);
  }
  return span;
}

/** Ends every match span still open (server stopping), marked as cut off. */
export function endOpenMatches(reason: string): void {
  for (const span of open.values()) {
    span.setAttributes({ 'match.end_reason': reason });
    span.end();
  }
  open.clear();
}

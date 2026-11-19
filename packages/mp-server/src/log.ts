// Structured logging for the matchmaking server, in the whale-net shape (whale-net/everything libs/go/logging): one
// JSON line per record on stdout with timestamp, severity, message, logger and the service identity (app_name,
// domain, environment, version, pod_name, namespace, node_name), then the record's fields with snake_case keys.
// With ENABLE_OTEL_LOGGING the same record is also exported over OTLP (otel.ts).
// Never log player names, chat text, room codes, IP addresses or user agents (PRIVACY.md).
import { emitOtel } from './otel';
import type { Severity, SpanHandle } from './otel';

type Env = Record<string, string | undefined>;

/** The whale-net identity fields of every stdout line; empty optional ones left out. */
export function identity(env: Env = process.env, defaultName = 'lawn-gnome-mm'): Record<string, string> {
  const first = (...keys: string[]): string => keys.map((k) => env[k]).find((v) => v) ?? '';
  const out: Record<string, string> = {
    app_name: env.APP_NAME || defaultName,
    domain: env.APP_DOMAIN || 'lawn-gnome-panic',
    environment: first('APP_ENV', 'ENVIRONMENT') || 'development',
    version: env.APP_VERSION || 'latest',
  };
  const add = (k: string, v: string): void => {
    if (v) out[k] = v;
  };
  add('commit_sha', first('GIT_COMMIT', 'COMMIT_SHA'));
  add('pod_name', first('POD_NAME', 'HOSTNAME'));
  add('namespace', first('NAMESPACE', 'POD_NAMESPACE'));
  add('node_name', env.NODE_NAME ?? '');
  return out;
}

/** matchId -> match_id, durationS -> duration_s; keys that are already snake_case or dotted are kept. */
export function snake(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

const ident = identity();

/** Writes one record: a whale-net JSON line on stdout, and an OTLP record when export is on. With a span, both carry
 *  its trace_id and span_id (whale-net puts them on the JSON line; the OTLP record gets them from the context). */
export function log(severity: Severity, message: string, logger: string, fields: Record<string, unknown> = {}, span?: SpanHandle): void {
  const attrs: Record<string, unknown> = { logger };
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) attrs[snake(k)] = v;
  }
  const line = { timestamp: new Date().toISOString(), severity, message, ...ident, ...(span?.ids ?? {}), ...attrs };
  process.stdout.write(JSON.stringify(line) + '\n'); // all severities on stdout, as whale-net does
  emitOtel(severity, message, attrs, span?.ctx);
}

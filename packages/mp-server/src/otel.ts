// OTLP log export and tracing for the matchmaking server, following the whale-net logging standard (whale-net/everything
// docs/LOGGING_ENV_VARS.md and libs/go/logging): off unless ENABLE_OTEL_LOGGING is true/1/yes, OTEL_SDK_DISABLED=true
// or OTEL_LOGS_DISABLED=true turn it off again, service identity comes from APP_NAME/APP_DOMAIN/APP_ENV/POD_NAME/...,
// and records go over OTLP gRPC (insecure) to OTEL_EXPORTER_OTLP_LOGS_ENDPOINT or OTEL_EXPORTER_OTLP_ENDPOINT.
// Spans: ENABLE_OTEL_TRACING (OTEL_TRACES_DISABLED turns it off again; endpoint OTEL_EXPORTER_OTLP_TRACES_ENDPOINT or the
// shared one): one span per match (matchtrace.ts) and per telemetry POST, never per relayed game message.
// The SDKs are only imported when their flag is on, so the default server loads none of them.
// Records leave the pod: the telemetry.ts rule (no player names, chat text, room codes or IP addresses) applies.

type Env = Record<string, string | undefined>;
type AttrValue = string | number | boolean;
export type Severity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const truthy = (v: string | undefined): boolean => ['true', '1', 'yes'].includes((v ?? '').trim().toLowerCase());
const isTrue = (v: string | undefined): boolean => (v ?? '').toLowerCase() === 'true';
const first = (env: Env, ...keys: string[]): string => keys.map((k) => env[k]).find((v) => v) ?? '';

/** ENABLE_OTEL_LOGGING asks for export and no OTEL_*_DISABLED override forbids it. */
export function otelEnabled(env: Env = process.env): boolean {
  return truthy(env.ENABLE_OTEL_LOGGING) && !isTrue(env.OTEL_SDK_DISABLED) && !isTrue(env.OTEL_LOGS_DISABLED);
}

/** whale-net resource attributes (the same set libs/go/logging buildResource produces); empty optional ones left out. */
export function resourceAttributes(env: Env = process.env, defaultName = 'lawn-gnome-mm'): Record<string, string> {
  const attrs: Record<string, string> = {
    'service.name': env.APP_NAME || defaultName,
    'service.version': env.APP_VERSION || 'latest',
    'deployment.environment': first(env, 'APP_ENV', 'ENVIRONMENT') || 'development',
    'service.namespace': env.APP_DOMAIN || 'lawn-gnome-panic',
  };
  const add = (k: string, v: string): void => {
    if (v) attrs[k] = v;
  };
  add('service.type', env.APP_TYPE ?? '');
  const sha = first(env, 'GIT_COMMIT', 'COMMIT_SHA');
  add('vcs.commit.id', sha);
  add('service.instance.id', sha.slice(0, 8));
  add('k8s.pod.name', first(env, 'POD_NAME', 'HOSTNAME'));
  add('k8s.namespace.name', first(env, 'NAMESPACE', 'POD_NAMESPACE'));
  add('k8s.node.name', env.NODE_NAME ?? '');
  return attrs;
}

/** The collector URL for the gRPC exporter. whale-net endpoints are often bare host:port (insecure gRPC); the JS
 *  exporter needs an http:// scheme to skip TLS, so add one. */
export function otlpUrl(env: Env = process.env): string {
  const e = first(env, 'OTEL_EXPORTER_OTLP_LOGS_ENDPOINT', 'OTEL_EXPORTER_OTLP_ENDPOINT') || 'localhost:4317';
  return /^[a-z]+:\/\//i.test(e) ? e : `http://${e}`;
}

/** Keeps string/number/boolean attributes (finite numbers only); anything else is dropped. */
export function cleanAttributes(fields: Record<string, unknown>): Record<string, AttrValue> {
  const out: Record<string, AttrValue> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v))) out[k] = v;
  }
  return out;
}

const SEVERITY_NUMBER: Record<Severity, number> = { DEBUG: 5, INFO: 9, WARN: 13, ERROR: 17 };

/** ENABLE_OTEL_TRACING asks for spans and no OTEL_*_DISABLED override forbids it. */
export function tracingEnabled(env: Env = process.env): boolean {
  return truthy(env.ENABLE_OTEL_TRACING) && !isTrue(env.OTEL_SDK_DISABLED) && !isTrue(env.OTEL_TRACES_DISABLED);
}

/** The collector URL for spans: OTEL_EXPORTER_OTLP_TRACES_ENDPOINT, else the shared endpoint. */
export function otlpTracesUrl(env: Env = process.env): string {
  return otlpUrl({ ...env, OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT });
}

/** A span, or a no-op when tracing is off. ctx is the OTel context holding it, for log correlation. */
export interface SpanHandle {
  readonly ctx: unknown;
  readonly ids: { trace_id: string; span_id: string } | null;
  addEvent(name: string, fields?: Record<string, unknown>): void;
  setAttributes(fields: Record<string, unknown>): void;
  fail(message: string): void;
  end(): void;
}

const NOOP_SPAN: SpanHandle = { ctx: undefined, ids: null, addEvent() {}, setAttributes() {}, fail() {}, end() {} };

interface Sink {
  emit(severity: Severity, body: string, attrs: Record<string, AttrValue>, ctx?: unknown): void;
  shutdown(): Promise<void>;
}
let sink: Sink | null = null;
let spanStarter: ((name: string, kind: 'server' | 'internal', attrs: Record<string, AttrValue>) => SpanHandle) | null = null;
let tracerShutdown: (() => Promise<void>) | null = null;

/** Starts OTLP log export and tracing as enabled. Never throws (a broken exporter must not stop matchmaking): returns
 *  what is on, and errors for what failed to start. The SDKs are only imported when their flag is on. */
export async function initOtel(env: Env = process.env): Promise<{ on: boolean; tracing: boolean; errors: string[] }> {
  const errors: string[] = [];
  const out = { on: false, tracing: false, errors };
  if (!otelEnabled(env) && !tracingEnabled(env)) return out;
  let api: typeof import('@opentelemetry/api');
  let resource: unknown;
  try {
    const [apiMod, { resourceFromAttributes }] = await Promise.all([import('@opentelemetry/api'), import('@opentelemetry/resources')]);
    api = apiMod;
    resource = resourceFromAttributes(resourceAttributes(env));
  } catch (err) {
    errors.push(String(err));
    return out;
  }
  const name = resourceAttributes(env)['service.name'];

  if (otelEnabled(env)) {
    try {
      const [{ LoggerProvider, BatchLogRecordProcessor }, { OTLPLogExporter }] = await Promise.all([
        import('@opentelemetry/sdk-logs'),
        import('@opentelemetry/exporter-logs-otlp-grpc'),
      ]);
      const provider = new LoggerProvider({
        resource: resource as never,
        processors: [new BatchLogRecordProcessor({ exporter: new OTLPLogExporter({ url: otlpUrl(env) }) })],
      });
      const logger = provider.getLogger(name);
      sink = {
        emit: (severity, body, attributes, ctx) =>
          logger.emit({
            severityNumber: SEVERITY_NUMBER[severity],
            severityText: severity,
            body,
            attributes,
            timestamp: Date.now(),
            context: ctx as never, // carries the span, so the record gets its trace and span ids
          }),
        shutdown: () => provider.shutdown(),
      };
      out.on = true;
    } catch (err) {
      errors.push(`logs: ${String(err)}`);
    }
  }

  if (tracingEnabled(env)) {
    try {
      const [{ TracerProvider, BatchSpanProcessor }, { OTLPTraceExporter }] = await Promise.all([
        import('@opentelemetry/sdk-trace'),
        import('@opentelemetry/exporter-trace-otlp-grpc'),
      ]);
      const provider = new TracerProvider({
        resource: resource as never,
        spanProcessors: [new BatchSpanProcessor({ exporter: new OTLPTraceExporter({ url: otlpTracesUrl(env) }) })],
      });
      const tracer = provider.getTracer(name);
      spanStarter = (spanName, kind, attrs) => {
        const span = tracer.startSpan(spanName, {
          kind: kind === 'server' ? api.SpanKind.SERVER : api.SpanKind.INTERNAL,
          attributes: attrs,
        });
        const sc = span.spanContext();
        return {
          ctx: api.trace.setSpan(api.ROOT_CONTEXT, span),
          ids: { trace_id: sc.traceId, span_id: sc.spanId },
          addEvent: (n, f = {}) => span.addEvent(n, cleanAttributes(f)),
          setAttributes: (f) => span.setAttributes(cleanAttributes(f)),
          fail: (message) => span.setStatus({ code: api.SpanStatusCode.ERROR, message }),
          end: () => span.end(),
        };
      };
      tracerShutdown = () => provider.shutdown();
      out.tracing = true;
    } catch (err) {
      errors.push(`traces: ${String(err)}`);
    }
  }
  return out;
}

/** Starts a span (a no-op handle when tracing is off). Keys are used as given: pass snake_case/semconv names. */
export function startSpan(name: string, kind: 'server' | 'internal', fields: Record<string, unknown> = {}): SpanHandle {
  return spanStarter ? spanStarter(name, kind, cleanAttributes(fields)) : NOOP_SPAN;
}

/** Sends one log record when export is on (a no-op otherwise); ctx ties it to a span. */
export function emitOtel(severity: Severity, body: string, fields: Record<string, unknown> = {}, ctx?: unknown): void {
  sink?.emit(severity, body, cleanAttributes(fields), ctx);
}

/** Flushes pending records and spans, waiting at most timeoutMs. Safe to call when export is off. */
export async function shutdownOtel(timeoutMs = 3000): Promise<void> {
  const s = sink;
  const t = tracerShutdown;
  sink = null;
  spanStarter = null;
  tracerShutdown = null;
  const work = Promise.all([s?.shutdown().catch(() => {}), t?.().catch(() => {})]);
  await Promise.race([work, new Promise<void>((r) => setTimeout(r, timeoutMs).unref())]);
}

// OTLP log export for the matchmaking server, following the whale-net logging standard (whale-net/everything
// docs/LOGGING_ENV_VARS.md and libs/go/logging): off unless ENABLE_OTEL_LOGGING is true/1/yes, OTEL_SDK_DISABLED=true
// or OTEL_LOGS_DISABLED=true turn it off again, service identity comes from APP_NAME/APP_DOMAIN/APP_ENV/POD_NAME/...,
// and records go over OTLP gRPC (insecure) to OTEL_EXPORTER_OTLP_LOGS_ENDPOINT or OTEL_EXPORTER_OTLP_ENDPOINT.
// The SDK is only imported when export is on, so the default server loads none of it.
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

interface Sink {
  emit(severity: Severity, body: string, attrs: Record<string, AttrValue>): void;
  shutdown(): Promise<void>;
}
let sink: Sink | null = null;

/** Starts OTLP export if enabled. Never throws: a broken exporter must not stop matchmaking. */
export async function initOtel(env: Env = process.env): Promise<boolean> {
  if (!otelEnabled(env)) return false;
  try {
    const [{ LoggerProvider, BatchLogRecordProcessor }, { OTLPLogExporter }, { resourceFromAttributes }] = await Promise.all([
      import('@opentelemetry/sdk-logs'),
      import('@opentelemetry/exporter-logs-otlp-grpc'),
      import('@opentelemetry/resources'),
    ]);
    const res = resourceAttributes(env);
    const provider = new LoggerProvider({
      resource: resourceFromAttributes(res),
      processors: [new BatchLogRecordProcessor({ exporter: new OTLPLogExporter({ url: otlpUrl(env) }) })],
    });
    const logger = provider.getLogger(res['service.name']);
    sink = {
      emit: (severity, body, attributes) =>
        logger.emit({ severityNumber: SEVERITY_NUMBER[severity], severityText: severity, body, attributes, timestamp: Date.now() }),
      shutdown: () => provider.shutdown(),
    };
    return true;
  } catch (err) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), src: 'server', ev: 'otel_init_failed', error: String(err) }));
    return false;
  }
}

/** Sends one record when export is on; a no-op otherwise. */
export function emitOtel(severity: Severity, body: string, fields: Record<string, unknown> = {}): void {
  sink?.emit(severity, body, cleanAttributes(fields));
}

/** Flushes pending records, waiting at most timeoutMs. Safe to call when export is off. */
export async function shutdownOtel(timeoutMs = 3000): Promise<void> {
  const s = sink;
  sink = null;
  if (!s) return;
  await Promise.race([s.shutdown().catch(() => {}), new Promise<void>((r) => setTimeout(r, timeoutMs).unref())]);
}

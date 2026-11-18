// Metrics for the matchmaking server, following whale-net's EnableMetrics: pushed over OTLP gRPC every 60 s
// (OTEL_METRIC_EXPORT_INTERVAL ms overrides) to OTEL_EXPORTER_OTLP_METRICS_ENDPOINT or OTEL_EXPORTER_OTLP_ENDPOINT
// when ENABLE_OTEL_METRICS is true/1/yes, unless OTEL_SDK_DISABLED=true or OTEL_METRICS_DISABLED=true. Every recorder
// below is a no-op until initMetrics succeeds, and the SDK is only imported when the flag is on.
// Attributes are low-cardinality only: event names, game ids (validated against GAMES), reasons, status codes.
// Never a player name, room code, match id, connection id or address.
import { otlpUrl, resourceAttributes } from './otel';

type Env = Record<string, string | undefined>;
type Attrs = Record<string, string | number | boolean>;

const truthy = (v: string | undefined): boolean => ['true', '1', 'yes'].includes((v ?? '').trim().toLowerCase());
const isTrue = (v: string | undefined): boolean => (v ?? '').toLowerCase() === 'true';

/** ENABLE_OTEL_METRICS asks for metrics and no OTEL_*_DISABLED override forbids it. */
export function metricsEnabled(env: Env = process.env): boolean {
  return truthy(env.ENABLE_OTEL_METRICS) && !isTrue(env.OTEL_SDK_DISABLED) && !isTrue(env.OTEL_METRICS_DISABLED);
}

/** The collector URL for metrics: OTEL_EXPORTER_OTLP_METRICS_ENDPOINT, else the shared endpoint. */
export function otlpMetricsUrl(env: Env = process.env): string {
  return otlpUrl({ ...env, OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT });
}

/** Current load, read by the observable gauges at each export. */
export interface Load {
  sockets: number;
  players: number;
  queued: number;
  matches: number;
}

interface Recorders {
  event(src: string, ev: string): void;
  matchStarted(game: string, isPrivate: boolean, players: number): void;
  matchEnded(game: string, reason: string, durationS: number): void;
  session(durationS: number): void;
  telemetryRejected(reason: string): void;
  httpRequest(route: string, method: string, status: number, durationS: number): void;
}

const NOOP: Recorders = {
  event() {},
  matchStarted() {},
  matchEnded() {},
  session() {},
  telemetryRejected() {},
  httpRequest() {},
};

/** The recorders; no-ops unless metrics are on. */
export let metrics: Recorders = NOOP;
let shutdown: (() => Promise<void>) | null = null;

/** Starts metric export if enabled. Never throws: returns whether it is on, and the error if it failed to start. */
export async function initMetrics(load: () => Load, env: Env = process.env): Promise<{ on: boolean; error?: string }> {
  if (!metricsEnabled(env)) return { on: false };
  try {
    const [{ MeterProvider, PeriodicExportingMetricReader }, { OTLPMetricExporter }, { resourceFromAttributes }] = await Promise.all([
      import('@opentelemetry/sdk-metrics'),
      import('@opentelemetry/exporter-metrics-otlp-grpc'),
      import('@opentelemetry/resources'),
    ]);
    const res = resourceAttributes(env);
    const provider = new MeterProvider({
      resource: resourceFromAttributes(res),
      readers: [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({ url: otlpMetricsUrl(env) }),
          exportIntervalMillis: Number(env.OTEL_METRIC_EXPORT_INTERVAL) || 60_000,
        }),
      ],
    });
    const m = provider.getMeter(res['service.name']);

    const events = m.createCounter('lawn.mm.events', { unit: '{event}', description: 'Event-log records, by source and event name.' });
    const matchesStarted = m.createCounter('lawn.mm.matches.started', { unit: '{match}', description: 'Matches started, by game.' });
    const matchPlayers = m.createHistogram('lawn.mm.match.players', {
      unit: '{player}',
      description: 'Players at match start, by game.',
      advice: { explicitBucketBoundaries: [1, 2, 3, 4, 6, 8, 12, 16, 24, 32] },
    });
    const matchDuration = m.createHistogram('lawn.mm.match.duration', {
      unit: 's',
      description: 'Match length, by game and end reason.',
      advice: { explicitBucketBoundaries: [30, 60, 120, 300, 600, 900, 1800, 3600, 7200] },
    });
    const sessionDuration = m.createHistogram('lawn.mm.session.duration', {
      unit: 's',
      description: 'WebSocket session length.',
      advice: { explicitBucketBoundaries: [1, 10, 30, 60, 300, 600, 1800, 3600, 7200] },
    });
    const rejected = m.createCounter('lawn.mm.telemetry.rejected', { unit: '{batch}', description: 'Telemetry batches refused, by reason.' });
    const httpDuration = m.createHistogram('http.server.request.duration', {
      unit: 's',
      description: 'Duration of HTTP requests (telemetry intake).',
      advice: { explicitBucketBoundaries: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1] },
    });

    const gauge = (name: string, unit: string, description: string, read: () => number): void => {
      m.createObservableGauge(name, { unit, description }).addCallback((r) => r.observe(read()));
    };
    gauge('lawn.mm.sockets', '{socket}', 'Open WebSockets.', () => load().sockets);
    gauge('lawn.mm.players', '{player}', 'Players that said hello.', () => load().players);
    gauge('lawn.mm.queued', '{player}', 'Players waiting in queues.', () => load().queued);
    gauge('lawn.mm.matches', '{match}', 'Running matches.', () => load().matches);
    gauge('process.memory.usage', 'By', 'Resident set size of the server process.', () => process.memoryUsage().rss);

    metrics = {
      event: (src, ev) => events.add(1, { src, event: ev }),
      matchStarted: (game, isPrivate, players) => {
        matchesStarted.add(1, { game, private: isPrivate });
        matchPlayers.record(players, { game });
      },
      matchEnded: (game, reason, durationS) => matchDuration.record(durationS, { game, reason }),
      session: (durationS) => sessionDuration.record(durationS),
      telemetryRejected: (reason) => rejected.add(1, { reason }),
      httpRequest: (route, method, status, durationS) =>
        httpDuration.record(durationS, { 'http.route': route, 'http.request.method': method, 'http.response.status_code': status } satisfies Attrs),
    };
    shutdown = () => provider.shutdown();
    return { on: true };
  } catch (err) {
    return { on: false, error: String(err) };
  }
}

/** Exports what was collected since the last interval and stops, waiting at most timeoutMs. */
export async function shutdownMetrics(timeoutMs = 3000): Promise<void> {
  const s = shutdown;
  shutdown = null;
  metrics = NOOP;
  if (!s) return;
  await Promise.race([s().catch(() => {}), new Promise<void>((r) => setTimeout(r, timeoutMs).unref())]);
}

// ENABLE_OTEL_LOGGING: the server exports its event log over OTLP gRPC with the whale-net resource attributes,
// and still starts and drains when the flag is on but no collector is listening.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as grpc from '@grpc/grpc-js';
import WebSocket from 'ws';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const procs = [];

/** A fake collector for logs and traces: records the raw Export request bytes per signal. */
async function fakeCollector() {
  const received = [];
  const traces = [];
  const metrics = [];
  const server = new grpc.Server();
  const method = (path) => ({
    path,
    requestStream: false,
    responseStream: false,
    requestDeserialize: (b) => b,
    requestSerialize: (b) => b,
    responseSerialize: () => Buffer.alloc(0), // empty Export*ServiceResponse
    responseDeserialize: (b) => b,
  });
  server.addService({ Export: method('/opentelemetry.proto.collector.logs.v1.LogsService/Export') }, {
    Export: (call, cb) => { received.push(call.request); cb(null, {}); },
  });
  server.addService({ Export: method('/opentelemetry.proto.collector.trace.v1.TraceService/Export') }, {
    Export: (call, cb) => { traces.push(call.request); cb(null, {}); },
  });
  server.addService({ Export: method('/opentelemetry.proto.collector.metrics.v1.MetricsService/Export') }, {
    Export: (call, cb) => { metrics.push(call.request); cb(null, {}); },
  });
  const port = await new Promise((res, rej) =>
    server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(), (err, p) => (err ? rej(err) : res(p))),
  );
  return { port, received, traces, metrics, close: () => server.forceShutdown() };
}

function start(port, env) {
  const p = spawn(process.execPath, ['packages/mp-server/dist/server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), ENABLE_OTEL_LOGGING: 'true', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  p.lines = [];
  let partial = '';
  p.stdout.on('data', (c) => {
    const parts = (partial + c.toString()).split('\n');
    partial = parts.pop();
    p.lines.push(...parts.filter((l) => l.trim()).map((l) => JSON.parse(l)));
  });
  p.stderr.resume();
  procs.push(p);
  return p;
}

async function waitHealthy(port) {
  const deadline = Date.now() + 8000;
  for (;;) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/healthz`)).status === 200) return;
    } catch {
      // not up yet
    }
    if (Date.now() > deadline) throw new Error(`server did not start on :${port}`);
    await sleep(100);
  }
}

const exited = (p) => new Promise((r) => (p.exitCode !== null ? r(p.exitCode) : p.once('exit', (c) => r(c))));

after(() => {
  for (const p of procs) if (p.exitCode === null) p.kill('SIGKILL');
});

test('with ENABLE_OTEL_LOGGING the event log reaches the collector with whale-net attributes', async () => {
  const col = await fakeCollector();
  try {
    const srv = start(8797, {
      OTEL_EXPORTER_OTLP_ENDPOINT: `127.0.0.1:${col.port}`, // bare host:port, as the cluster sets it
      APP_ENV: 'test',
      POD_NAME: 'mm-pod-1',
      POD_NAMESPACE: 'lawn',
    });
    await waitHealthy(8797);
    srv.kill('SIGTERM'); // drain flushes the batch
    assert.equal(await exited(srv), 0);
    const all = Buffer.concat(col.received).toString('latin1');
    for (const s of ['service.name', 'lawn-gnome-mm', 'deployment.environment', 'test', 'service.namespace', 'lawn-gnome-panic',
      'k8s.pod.name', 'mm-pod-1', 'k8s.namespace.name', 'lawn', 'matchmaking on :8797', 'SIGTERM: draining', 'logger']) {
      assert.ok(all.includes(s), `export is missing ${s}`);
    }
  } finally {
    col.close();
  }
});

test('with ENABLE_OTEL_LOGGING and no collector the server still serves and drains', async () => {
  const srv = start(8798, { OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:1' });
  await waitHealthy(8798);
  const t0 = Date.now();
  srv.kill('SIGTERM');
  assert.equal(await exited(srv), 0);
  assert.ok(Date.now() - t0 < 6000, 'drain took too long');
});

test('OTEL_LOGS_DISABLED overrides the flag: nothing is exported', async () => {
  const col = await fakeCollector();
  try {
    const srv = start(8796, { OTEL_EXPORTER_OTLP_ENDPOINT: `127.0.0.1:${col.port}`, OTEL_LOGS_DISABLED: 'true' });
    await waitHealthy(8796);
    srv.kill('SIGTERM');
    await exited(srv);
    assert.equal(col.received.length, 0);
  } finally {
    col.close();
  }
});

/** Opens a socket; next(t) resolves with the next message of type t. */
function client(port) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    const inbox = [];
    ws.on('message', (raw) => inbox.push(JSON.parse(raw.toString())));
    ws.once('error', reject);
    ws.once('open', () => resolve({
      send: (m) => ws.send(JSON.stringify(m)),
      close: () => ws.close(),
      next: async (t) => {
        for (const deadline = Date.now() + 4000; Date.now() < deadline; await sleep(20)) {
          const i = inbox.findIndex((m) => m.t === t);
          if (i >= 0) return inbox.splice(i, 1)[0];
        }
        throw new Error(`no ${t}`);
      },
    }));
  });
}

test('with ENABLE_OTEL_TRACING and ENABLE_OTEL_METRICS a match and a telemetry POST are spans and metrics, and log lines carry the trace id', async () => {
  const col = await fakeCollector();
  try {
    const port = 8795;
    const srv = start(port, {
      ENABLE_OTEL_LOGGING: 'false',
      ENABLE_OTEL_TRACING: 'true',
      ENABLE_OTEL_METRICS: 'true',
      OTEL_EXPORTER_OTLP_ENDPOINT: `127.0.0.1:${col.port}`,
      MM_PRIVATE_WAIT_S: '1',
    });
    await waitHealthy(port);

    const a = await client(port);
    const b = await client(port);
    a.send({ t: 'hello', v: 3, name: 'Alpha', character: 'gnorman' });
    await a.next('welcome');
    b.send({ t: 'hello', v: 3, name: 'Bravo', character: 'gnorman' });
    await b.next('welcome');
    a.send({ t: 'queue', code: 'TRACE1', character: 'gnancy', name: 'Alpha' });
    await a.next('queued');
    b.send({ t: 'queue', code: 'TRACE1', character: 'gnancy', name: 'Bravo' });
    await a.next('match');
    a.close();
    b.close();

    const r = await fetch(`http://127.0.0.1:${port}/t`, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: JSON.stringify({ cid: 'c1', sid: 's1', events: [{ ev: 'load', at: 1 }] }),
    });
    assert.equal(r.status, 204);
    await sleep(300);
    srv.kill('SIGTERM');
    assert.equal(await exited(srv), 0);

    const start_ = srv.lines.find((l) => l.message === 'match_start');
    const end_ = srv.lines.find((l) => l.message === 'match_end');
    const load = srv.lines.find((l) => l.message === 'load');
    assert.ok(start_?.trace_id && start_.span_id, `match_start has no trace id: ${JSON.stringify(start_)}`);
    assert.equal(end_?.trace_id, start_.trace_id, 'match_end is not in the match trace');
    assert.ok(load?.trace_id && load.trace_id !== start_.trace_id, 'client event not in its POST span');
    assert.equal(col.received.length, 0, 'logs exported although ENABLE_OTEL_LOGGING=false');

    const spans = Buffer.concat(col.traces);
    for (const s of ['match', 'POST /t', 'player_left', 'match.end_reason', 'http.response.status_code', 'lawn-gnome-mm']) {
      assert.ok(spans.includes(s), `trace export is missing ${s}`);
    }
    for (const id of [start_.trace_id, load.trace_id]) {
      assert.ok(spans.includes(Buffer.from(id, 'hex')), `trace ${id} was not exported`);
    }
    for (const secret of ['Alpha', 'Bravo', 'TRACE1']) assert.ok(!spans.includes(secret), `span leaked ${secret}`);

    // Metrics are flushed on SIGTERM (the 60 s interval never fired).
    const met = Buffer.concat(col.metrics);
    for (const s of ['lawn.mm.events', 'match_start', 'lawn.mm.matches.started', 'lawn.mm.match.players', 'lawn.mm.match.duration',
      'lawn.mm.session.duration', 'lawn.mm.sockets', 'lawn.mm.matches', 'process.memory.usage', 'http.server.request.duration', 'lawn-gnome-mm']) {
      assert.ok(met.includes(s), `metric export is missing ${s}`);
    }
    for (const secret of ['Alpha', 'Bravo', 'TRACE1', 'match_id', 'matchId', 'conn_id']) {
      assert.ok(!met.includes(secret), `metrics carry ${secret}`);
    }
  } finally {
    col.close();
  }
});

// ENABLE_OTEL_LOGGING: the server exports its event log over OTLP gRPC with the whale-net resource attributes,
// and still starts and drains when the flag is on but no collector is listening.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as grpc from '@grpc/grpc-js';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const procs = [];

/** A fake collector: records the raw ExportLogsServiceRequest bytes it receives. */
async function fakeCollector() {
  const received = [];
  const server = new grpc.Server();
  server.addService(
    {
      Export: {
        path: '/opentelemetry.proto.collector.logs.v1.LogsService/Export',
        requestStream: false,
        responseStream: false,
        requestDeserialize: (b) => b,
        requestSerialize: (b) => b,
        responseSerialize: () => Buffer.alloc(0), // empty ExportLogsServiceResponse
        responseDeserialize: (b) => b,
      },
    },
    { Export: (call, cb) => { received.push(call.request); cb(null, {}); } },
  );
  const port = await new Promise((res, rej) =>
    server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(), (err, p) => (err ? rej(err) : res(p))),
  );
  return { port, received, close: () => server.forceShutdown() };
}

function start(port, env) {
  const p = spawn(process.execPath, ['packages/mp-server/dist/server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), ENABLE_OTEL_LOGGING: 'true', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  p.stdout.resume();
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

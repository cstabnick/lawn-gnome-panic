// Socket shell for the matchmaking server: HTTP health check, WebSocket at /ws, keepalive,
// a once-a-second tick, and a graceful drain on SIGTERM/SIGINT for rolling updates.
import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { Matchmaker } from './matchmaker';
import type { Conn } from './matchmaker';
import { PRIVATE_FILL_WAIT_S, PUBLIC_FILL_WAIT_S, TELEMETRY_MAX_BYTES, TELEMETRY_PATH } from '../../mp/src/protocol';
import { cleanBatch, counters, logEvent } from './telemetry';

const PORT = Number(process.env.PORT) || 8787;

const mm = new Matchmaker({
  publicWaitS: Number(process.env.MM_PUBLIC_WAIT_S) || PUBLIC_FILL_WAIT_S,
  privateWaitS: Number(process.env.MM_PRIVATE_WAIT_S) || PRIVATE_FILL_WAIT_S,
  now: Date.now,
  random: Math.random,
  matchSilentS: Number(process.env.MM_MATCH_SILENT_S) || undefined,
  idleS: Number(process.env.MM_IDLE_S) || undefined,
  resumeS: Number(process.env.MM_RESUME_S) || undefined,
  onEvent: (ev, fields) => logEvent('server', ev, fields),
});

// ---------------------------------------------------------------- telemetry intake

const TELEMETRY_RATE_MAX = 30; // batches per client address per minute
const telemetryHits = new Map<string, number>();
const telemetryTimer = setInterval(() => telemetryHits.clear(), 60_000);
/** SIGTERM/SIGINT received: no new sockets, running matches and ready queues play out. */
let draining = false;

function readBody(req: import('node:http').IncomingMessage): Promise<string | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > TELEMETRY_MAX_BYTES) {
        req.destroy();
        resolve(null);
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => resolve(null));
  });
}

async function handleTelemetry(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse): Promise<void> {
  const fly = req.headers['fly-client-ip'];
  const key = typeof fly === 'string' ? fly : (req.socket.remoteAddress ?? 'unknown');
  const hits = (telemetryHits.get(key) ?? 0) + 1;
  telemetryHits.set(key, hits);
  if (hits > TELEMETRY_RATE_MAX) {
    res.writeHead(429, { 'content-type': 'text/plain' });
    res.end('Too many batches');
    return;
  }

  const body = await readBody(req);
  if (body === null) {
    res.writeHead(413, { 'content-type': 'text/plain' });
    res.end('Batch too large');
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'content-type': 'text/plain' });
    res.end('Bad batch');
    return;
  }
  const batch = cleanBatch(parsed);
  if (batch === null) {
    res.writeHead(400, { 'content-type': 'text/plain' });
    res.end('Bad batch');
    return;
  }
  for (const e of batch.events) {
    const { ev, ...rest } = e;
    logEvent('client', ev, { cid: batch.cid, sid: batch.sid, ...rest });
  }
  res.writeHead(204);
  res.end();
}

// ---------------------------------------------------------------- HTTP

const http = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const path = new URL(req.url ?? '/', 'http://x').pathname;
  if (path === TELEMETRY_PATH && (req.method === 'POST' || req.method === 'OPTIONS')) {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    handleTelemetry(req, res).catch(() => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
    return;
  }
  if ((req.method === 'GET' || req.method === 'HEAD') && path === '/healthz') {
    res.writeHead(draining ? 503 : 200, { 'content-type': 'application/json' });
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ ...mm.stats(), counters: counters() }));
    return;
  }
  if (req.method === 'GET' && path === '/') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('Lawn gnome games matchmaking (Lawn Gnome Panic, Gnome Front, Gnaft). Connect a WebSocket to /ws.');
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('Not found');
});

// ---------------------------------------------------------------- WebSocket

const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });

http.on('upgrade', (req, socket, head) => {
  const path = new URL(req.url ?? '/', 'http://x').pathname;
  if (path !== '/ws') {
    socket.destroy();
    return;
  }
  if (draining) {
    // New players go to the machine that replaces this one.
    socket.write('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

let nextId = 1;
/** Sockets that answered the last ping (or opened since). Anything else is terminated. */
const alive = new WeakSet<WebSocket>();

wss.on('connection', (ws) => {
  const id = nextId++;
  logEvent('server', 'connect');
  alive.add(ws);
  ws.on('pong', () => alive.add(ws));

  const conn: Conn = {
    id,
    send: (msg) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    },
    close: () => ws.close(),
  };
  mm.connect(conn);

  ws.on('message', (data, isBinary) => {
    if (isBinary) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      return;
    }
    mm.handle(conn, parsed);
  });
  ws.on('close', () => {
    logEvent('server', 'disconnect');
    mm.disconnect(conn);
  });
  ws.on('error', () => {}); // close follows
});

const pingTimer = setInterval(() => {
  for (const ws of wss.clients) {
    if (!alive.has(ws)) {
      ws.terminate();
      continue;
    }
    alive.delete(ws);
    ws.ping();
  }
}, 5_000); // a socket that misses one ping (5-10 s) is terminated

const tickTimer = setInterval(() => mm.tick(), 1000);

// Scale to zero (was used on Fly.io; unset on the cluster): with MM_EXIT_WHEN_IDLE_S set, exit cleanly once no WebSocket has been open that long.
// The host's restart policy leaves a cleanly exited machine stopped until the next connection starts it.
const exitIdleS = Number(process.env.MM_EXIT_WHEN_IDLE_S) || 0;
let idleTimer: ReturnType<typeof setInterval> | undefined;
if (exitIdleS > 0) {
  let lastBusy = Date.now();
  idleTimer = setInterval(() => {
    if (wss.clients.size > 0) lastBusy = Date.now();
    else if (Date.now() - lastBusy > exitIdleS * 1000) {
      console.log(`no sockets for ${exitIdleS} s: exiting`);
      process.exit(0);
    }
  }, 5_000);
}

// ---------------------------------------------------------------- shutdown

/** Everything has played out: close the remaining sockets (1001 = going away) and exit. */
function finishShutdown(): void {
  clearInterval(telemetryTimer);
  clearInterval(pingTimer);
  clearInterval(tickTimer);
  if (idleTimer) clearInterval(idleTimer);
  for (const ws of wss.clients) {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close(1001, 'Server shutting down');
  }
  const forceExit = setTimeout(() => process.exit(0), 2000);
  forceExit.unref();
  wss.close(() => {
    http.closeIdleConnections?.();
    http.close(() => {
      clearTimeout(forceExit);
      process.exit(0);
    });
  });
}

function shutdown(signal: string): void {
  if (draining) {
    process.exit(0); // second signal: stop now
  }
  draining = true;
  console.log(`${signal}: draining`);
  mm.drain();
  const s = mm.stats();
  if (s.matches === 0 && s.queued === 0) {
    finishShutdown();
    return;
  }
  const timer = setInterval(() => {
    const stats = mm.stats();
    if (stats.matches > 0 || stats.queued > 0) return;
    clearInterval(timer);
    finishShutdown();
  }, 500);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

http.listen(PORT, () => {
  console.log(`matchmaking on :${PORT}`);
});

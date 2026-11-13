import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const PORT = 8799;
const HTTP = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}/ws`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let server;
const clients = [];

before(async () => {
  server = spawn(process.execPath, ['games/sample-3d/server/dist/server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), MM_PUBLIC_WAIT_S: '1', MM_PRIVATE_WAIT_S: '1', MM_MATCH_SILENT_S: '2', MM_IDLE_S: '6' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.resume();
  server.stderr.resume();
  const deadline = Date.now() + 5000;
  for (;;) {
    try {
      const r = await fetch(`${HTTP}/healthz`);
      if (r.status === 200) return;
    } catch {
      // not listening yet
    }
    if (Date.now() > deadline) throw new Error(`server did not start on :${PORT}`);
    await sleep(100);
  }
});

after(async () => {
  for (const c of clients) c.close();
  if (server.exitCode !== null || server.signalCode !== null) return;
  await new Promise((resolve) => {
    const force = setTimeout(() => server.kill('SIGKILL'), 2000);
    server.once('exit', () => {
      clearTimeout(force);
      resolve();
    });
    server.kill('SIGTERM');
  });
});

/** Opens a WebSocket client. next(t) resolves with the next received message of type t (4 s timeout). */
function open() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const inbox = [];
    let wake = null;
    ws.on('message', (raw) => {
      inbox.push(JSON.parse(raw.toString()));
      if (wake) wake();
    });
    ws.on('error', () => {});
    ws.once('error', reject);
    ws.once('open', () => {
      const c = {
        send: (msg) => ws.send(JSON.stringify(msg)),
        close: () => ws.close(),
        next: async (t) => {
          const deadline = Date.now() + 4000;
          for (;;) {
            const i = inbox.findIndex((m) => m.t === t);
            if (i >= 0) return inbox.splice(i, 1)[0];
            const left = deadline - Date.now();
            if (left <= 0) throw new Error(`timed out waiting for '${t}'`);
            await new Promise((r) => {
              const timer = setTimeout(r, left);
              wake = () => {
                clearTimeout(timer);
                r();
              };
            });
            wake = null;
          }
        },
      };
      clients.push(c);
      resolve(c);
    });
  });
}

test('/healthz reports numeric player count', async () => {
  const r = await fetch(`${HTTP}/healthz`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type') ?? '', /application\/json/);
  const body = await r.json();
  assert.equal(typeof body.players, 'number');
});

test('POST /t accepts a valid batch and counts it', async () => {
  const r = await fetch(`${HTTP}/t`, {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: JSON.stringify({ cid: 'test-cid', sid: 'test-sid', events: [{ ev: 'load', at: 1, touch: false, w: 1200 }] }),
  });
  assert.equal(r.status, 204);
  const h = await (await fetch(`${HTTP}/healthz`)).json();
  assert.ok(h.counters['client:load'] >= 1);
});

test('POST /t rejects junk', async () => {
  const bad = await fetch(`${HTTP}/t`, {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: JSON.stringify({ cid: 'x', sid: 'y', events: [{ ev: 'not_an_event', at: 1 }] }),
  });
  assert.equal(bad.status, 400);
  const notJson = await fetch(`${HTTP}/t`, {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: 'not json',
  });
  assert.equal(notJson.status, 400);
});

test('two players are matched, relay a message, and one leaves', async () => {
  const a = await open();
  const b = await open();
  try {
    a.send({ t: 'hello', v: 3, name: 'Alpha', character: 'gnorman' });
    const wa = await a.next('welcome');
    b.send({ t: 'hello', v: 3, name: 'Bravo', character: 'gnorman' });
    const wb = await b.next('welcome');

    // A queues first so A is the first joiner and therefore the host.
    a.send({ t: 'queue', code: 'TEST1', character: 'gnancy', name: 'Alpha' });
    await a.next('queued');
    b.send({ t: 'queue', code: 'TEST1', character: 'gnancy', name: 'Bravo' });

    const ma = await a.next('match');
    const mb = await b.next('match');
    assert.equal(ma.matchId, mb.matchId);
    assert.equal(ma.hostId, wa.id);
    assert.equal(ma.players.length, 2);
    assert.equal(ma.you, wa.id);
    assert.equal(mb.you, wb.id);
    for (const info of ma.players) assert.equal(typeof info.color, 'number');
    assert.notEqual(ma.players[0].color, ma.players[1].color);

    b.send({ t: 'relay', to: null, d: { k: 'died', cause: 'x' } });
    const r = await a.next('relay');
    assert.equal(r.from, wb.id);
    assert.equal(r.d.k, 'died');

    b.close();
    const left = await a.next('left');
    assert.equal(left.id, wb.id);
  } finally {
    a.close();
    b.close();
  }
});

test('hello with a wrong protocol version gets an error', async () => {
  const c = await open();
  try {
    c.send({ t: 'hello', v: 999, name: 'X', character: 'gnorman' });
    const err = await c.next('error');
    assert.equal(typeof err.message, 'string');
  } finally {
    c.close();
  }
});

test('a lone player is not matched', async () => {
  const a = await open();
  try {
    a.send({ t: 'hello', v: 3, name: 'Alpha', character: 'gnorman' });
    await a.next('welcome');
    a.send({ t: 'queue', code: 'LONE1', character: 'gnorman', name: 'Alpha' });
    await a.next('queued');
    // The test server waits 1 s; a lone player must still not get a match.
    await assert.rejects(a.next('match'));
  } finally {
    a.close();
  }
});

test('an offensive name is rejected', async () => {
  const c = await open();
  try {
    c.send({ t: 'hello', v: 3, name: 'Charlie', character: 'gnorman' });
    await c.next('welcome');
    c.send({ t: 'queue', code: null, character: 'gnorman', name: 'fuckface' });
    const err = await c.next('error');
    assert.equal(err.code, 'bad-name');
  } finally {
    c.close();
  }
});

test('chat reaches the queue group, censored', async () => {
  const a = await open();
  const b = await open();
  try {
    a.send({ t: 'hello', v: 3, name: 'Alpha', character: 'gnorman' });
    const wa = await a.next('welcome');
    b.send({ t: 'hello', v: 3, name: 'Bravo', character: 'gnorman' });
    await b.next('welcome');
    a.send({ t: 'queue', code: 'CHAT1', character: 'gnorman', name: 'Alpha' });
    await a.next('queued');
    b.send({ t: 'queue', code: 'CHAT1', character: 'gnorman', name: 'Bravo' });
    await b.next('queued');

    a.send({ t: 'chat', text: 'hello you shit' });
    for (const c of [a, b]) {
      const msg = await c.next('chat');
      assert.equal(msg.from, wa.id);
      assert.equal(msg.name, 'Alpha');
      assert.equal(typeof msg.color, 'number');
      assert.ok(msg.text.startsWith('hello you'));
      assert.ok(!msg.text.includes('shit'));
    }
  } finally {
    a.close();
    b.close();
  }
});

test('chat is rate limited', async () => {
  const c = await open();
  try {
    c.send({ t: 'hello', v: 3, name: 'Charlie', character: 'gnorman' });
    await c.next('welcome');
    c.send({ t: 'queue', code: 'CHAT2', character: 'gnorman', name: 'Charlie' });
    await c.next('queued');
    for (let i = 0; i < 6; i++) c.send({ t: 'chat', text: `line ${i}` });
    const err = await c.next('error');
    assert.equal(err.code, 'chat-rate');
  } finally {
    c.close();
  }
});

/** Two clients in one match on room code; a is the host. */
async function matchedPair(code) {
  const a = await open();
  const b = await open();
  a.send({ t: 'hello', v: 3, name: 'Alpha', character: 'gnorman' });
  const wa = await a.next('welcome');
  b.send({ t: 'hello', v: 3, name: 'Bravo', character: 'gnorman' });
  const wb = await b.next('welcome');
  a.send({ t: 'queue', code, character: 'gnorman', name: 'Alpha' });
  await a.next('queued');
  b.send({ t: 'queue', code, character: 'gnorman', name: 'Bravo' });
  const ma = await a.next('match');
  await b.next('match');
  assert.equal(ma.hostId, wa.id);
  return { a, b, aId: wa.id, bId: wb.id };
}

test('match events are counted', async () => {
  const { a, b } = await matchedPair('TELE1');
  try {
    const h = await (await fetch(`${HTTP}/healthz`)).json();
    assert.ok(h.counters['server:match_start'] >= 1);
  } finally {
    a.close();
    b.close();
  }
});

test('when the host leaves, the next player becomes host', async () => {
  const { a, b, aId, bId } = await matchedPair('HOST1');
  try {
    a.close();
    const left = await b.next('left');
    assert.equal(left.id, aId);
    assert.equal(left.reason, 'quit');
    const host = await b.next('host');
    assert.equal(host.hostId, bId);
  } finally {
    a.close();
    b.close();
  }
});

test('a silent host times out and hands over hosting', async () => {
  const { a, b, aId, bId } = await matchedPair('HOST2');
  const keepAlive = setInterval(() => b.send({ t: 'relay', to: null, d: { k: 'died', cause: 'x' } }), 200);
  try {
    await b.next('beat');
    const left = await b.next('left');
    assert.equal(left.id, aId);
    assert.equal(left.reason, 'timeout');
    const host = await b.next('host');
    assert.equal(host.hostId, bId);
    const ended = await a.next('ended');
    assert.equal(typeof ended.reason, 'string');
  } finally {
    clearInterval(keepAlive);
    a.close();
    b.close();
  }
});

test('an idle connection (not queued, not in a match) is closed', async () => {
  const ws = new WebSocket(WS_URL);
  await new Promise((resolve) => ws.once('open', resolve));
  ws.send(JSON.stringify({ t: 'hello', v: 3, name: 'Idler', character: 'gnorman' }));
  const closed = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 10000);
    ws.once('close', () => {
      clearTimeout(timer);
      resolve(true);
    });
  });
  assert.equal(closed, true);
});

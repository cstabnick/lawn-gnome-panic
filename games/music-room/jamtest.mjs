// Two-player check: headless Edge (driven over the DevTools protocol) and a ws bot jam in room JAMTEST.
// Needs the dev server and the matchmaking server running (npm run dev -w games/music-room; npm run dev -w packages/mp-server).
// Usage: node games/music-room/jamtest.mjs <repo-root> <page-url> <mp-ws-url> <scratch-profile-dir>
//   e.g. node games/music-room/jamtest.mjs "$(pwd)" "http://localhost:5192/" ws://localhost:8787/ws "$TMPDIR/jamprof"
// Prints JAM OK, or FAIL: <reason> with exit code 1.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const [, , repo, pageUrl, mpUrl, profile] = process.argv;
const require = createRequire(repo + '/package.json');
const WebSocket = require('ws');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exit(1); };

const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--remote-debugging-port=9339', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });
process.on('exit', () => edge.kill());

let targets;
for (let k = 0; k < 40; k++) {
  try { targets = await (await fetch('http://127.0.0.1:9339/json')).json(); if (targets.some((t) => t.type === 'page')) break; } catch {}
  await sleep(250);
}
const page = targets.find((t) => t.type === 'page');
const cdp = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => cdp.on('open', r));
let seq = 0; const pending = new Map(); const consoleErrors = [];
cdp.on('message', (raw) => {
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') consoleErrors.push(m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push(JSON.stringify(m.params.args));
});
const call = (method, params = {}) => new Promise((r) => { const id = ++seq; pending.set(id, r); cdp.send(JSON.stringify({ id, method, params })); });
const ev = async (expr) => (await call('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.result?.value;
await call('Runtime.enable');
await call('Page.enable');
await call('Page.navigate', { url: pageUrl });
await sleep(2500);

// Bot: joins JAMTEST on the drums.
const bot = new WebSocket(mpUrl);
const botMsgs = [];
bot.on('message', (d) => botMsgs.push(JSON.parse(String(d))));
await new Promise((r) => bot.on('open', r));
bot.send(JSON.stringify({ t: 'hello', v: 3, name: 'Drumbot', character: 'drums', game: 'music-room' }));
await sleep(300);
bot.send(JSON.stringify({ t: 'queue', code: 'JAMTEST', character: 'drums', name: 'Drumbot' }));
await sleep(500);
if (!botMsgs.some((m) => m.t === 'match')) fail('bot did not get a match: ' + JSON.stringify(botMsgs));
const hb = setInterval(() => bot.send(JSON.stringify({ t: 'relay', to: null, d: { k: 'here', i: 'drums' } })), 2000);

// Browser joins the same room.
await ev(`(() => { const n = document.querySelector('#mr-lobby input.mr-name'); n.value = 'Pianist';
  const r = document.querySelector('#mr-lobby input.mr-room'); r.value = 'JAMTEST';
  document.querySelector('#mr-lobby button.mr-join').click(); })()`);
await sleep(1500);
const status = await ev(`document.querySelector('#mr-lobby .mr-status').textContent`);
console.log('browser status:', status);
if (!/Room JAMTEST · 2 playing/.test(status)) fail('browser not in room with bot');
const drumsPlayers = await ev(`document.querySelector('.mr-drums')?.closest('.mr-station').querySelector('.mr-players').textContent`);
console.log('drums station players:', drumsPlayers);
if (!/Drumbot/.test(drumsPlayers)) fail('bot not shown at the drums');

// Browser plays: switch to keys (2), press A (C4 = 60), X (octave up), A again (72).
await call('Page.bringToFront');
const key = async (code, k) => {
  await call('Input.dispatchKeyEvent', { type: 'keyDown', code, key: k });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', code, key: k });
};
await key('Digit2', '2'); await key('KeyA', 'a'); await key('KeyX', 'x'); await key('KeyA', 'a');
await key('Digit3', '3'); await key('Space', ' ');
await sleep(800);
const notes = botMsgs.filter((m) => m.t === 'relay' && m.d.k === 'note').map((m) => `${m.d.i}:${m.d.n}`);
console.log('bot heard:', notes.join(' '));
if (notes.join(' ') !== 'keys:60 keys:72 cowbell:0') fail('unexpected notes');
const heres = botMsgs.filter((m) => m.t === 'relay' && m.d.k === 'here').map((m) => m.d.i);
if (!heres.includes('cowbell')) fail('instrument change not announced');

// Bot plays a snare: the browser flashes the drums' snare pad.
bot.send(JSON.stringify({ t: 'relay', to: null, d: { k: 'note', i: 'drums', n: 1 } }));
await sleep(60);
const flashed = await ev(`(() => { const t = document.querySelector('.mr-drums').closest('.mr-station').querySelector('.mr-tag'); return t.className + '|' + t.textContent; })()`);
console.log('drums tag after bot snare:', flashed);
if (!/on\|Drumbot/.test(flashed)) fail('bot note not shown');

// Junk from the network is dropped without errors.
bot.send(JSON.stringify({ t: 'relay', to: null, d: { k: 'note', i: 'tuba', n: 1 } }));
bot.send(JSON.stringify({ t: 'relay', to: null, d: { k: 'note', i: 'drums', n: 99 } }));
await sleep(300);

// Leave.
await ev(`document.querySelector('#mr-lobby button.mr-leave').click()`);
await sleep(500);
if (!botMsgs.some((m) => m.t === 'left')) fail('bot did not see the browser leave');
clearInterval(hb);
bot.close();
if (consoleErrors.length) fail('console errors: ' + consoleErrors.join('; '));
console.log('JAM OK');
process.exit(0);
